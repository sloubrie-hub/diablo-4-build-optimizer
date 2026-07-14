const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const inputFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-draft/external-evidence-candidates.draft.json";
const outDir = process.argv[3] ?? "outputs/diablo4-delta-evidence-draft-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasPlaceholder(value) {
  return typeof value === "string" && (
    value.includes("A REMPLIR")
    || value.includes("YYYY-MM-DD")
  );
}

function collectPlaceholders(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPlaceholders(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => collectPlaceholders(child, prefix ? `${prefix}.${key}` : key));
  }
  return hasPlaceholder(value) ? [prefix] : [];
}

function runAudit(sourceFile) {
  const auditOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-draft-audit-"));
  const auditScript = path.join(__dirname, "audit-external-evidence-intake.js");
  const result = spawnSync(process.execPath, [auditScript, sourceFile, auditOutDir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`audit-external-evidence-intake failed with exit code ${result.status}`);
  }
  return readJson(path.join(auditOutDir, "external-evidence-intake.json"));
}

const draftInput = readJson(inputFile);
const candidates = draftInput.candidates ?? [];
const audit = runAudit(inputFile);
const candidateReports = audit.candidates ?? [];
const placeholderFields = collectPlaceholders(candidates);
const structuralBlockerSet = new Set();
const reviewBlockerSet = new Set();

for (const candidate of candidateReports) {
  for (const blocker of candidate.blockers ?? []) {
    if (blocker === "manual-review-required") {
      reviewBlockerSet.add(blocker);
    } else {
      structuralBlockerSet.add(blocker);
    }
  }
}

const structuralBlockers = Array.from(structuralBlockerSet).sort();
const reviewBlockers = Array.from(reviewBlockerSet).sort();
const readyForIntake = candidates.length > 0 && placeholderFields.length === 0 && structuralBlockers.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-draft-audit-v1",
  source: {
    inputFile,
    outDir,
  },
  summary: {
    candidates: candidates.length,
    accepted: audit.summary?.accepted ?? 0,
    pending: audit.summary?.pending ?? 0,
    rejected: audit.summary?.rejected ?? 0,
    placeholderFields: placeholderFields.length,
    structuralBlockers: structuralBlockers.length,
    reviewBlockers: reviewBlockers.length,
    readyForIntake,
    acceptedForBridge: (audit.summary?.accepted ?? 0) > 0,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: readyForIntake
        ? "delta-evidence-draft-ready-for-intake"
        : "delta-evidence-draft-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForIntake
        ? "Le brouillon ne contient plus de placeholder ni bloqueur structurel; il peut etre copie en pending dans l'intake reel."
        : "Le brouillon reste incomplet ou structurellement bloque pour l'intake reel.",
      nextAction: readyForIntake
        ? "Copier le candidat dans inputs/external-evidence-candidates.json en gardant reviewer.status=pending."
        : "Remplacer les placeholders et corriger les bloqueurs structurels avant toute copie.",
    },
  },
  placeholderFields,
  structuralBlockers,
  reviewBlockers,
  candidates: candidateReports,
  safeguards: [
    "Cet audit ne modifie pas inputs/external-evidence-candidates.json.",
    "readyForIntake signifie copiable en pending, pas approuve.",
    "acceptedForBridge reste intake-only et ne modifie pas reliableDps.",
    "La promotion fiable reste separee et bloquee par les gates dedies.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-draft-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
