const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const filledDraftInputFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-filled-draft/external-evidence-candidates.filled-draft.json";
const filledDraftReportFile = process.argv[3] ?? "outputs/diablo4-delta-evidence-filled-draft/delta-evidence-filled-draft.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-evidence-filled-draft-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function runDraftAudit(sourceFile) {
  const auditOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-filled-draft-audit-"));
  const auditScript = path.join(__dirname, "audit-delta-evidence-draft.js");
  const result = spawnSync(process.execPath, [auditScript, sourceFile, auditOutDir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`audit-delta-evidence-draft failed with exit code ${result.status}`);
  }
  return readJson(path.join(auditOutDir, "delta-evidence-draft-audit.json"));
}

const filledDraftReport = readJson(filledDraftReportFile);
const draftAudit = runDraftAudit(filledDraftInputFile);
const readyForPreview = filledDraftReport.summary?.readyForDraftAudit === true
  && draftAudit.summary?.readyForIntake === true;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-filled-draft-audit-v1",
  source: {
    filledDraftInputFile,
    filledDraftReportFile,
    outDir,
  },
  summary: {
    assetId: filledDraftReport.summary?.assetId ?? 1663210,
    entityId: filledDraftReport.summary?.entityId ?? "skill:1663210",
    candidateId: filledDraftReport.summary?.candidateId ?? "draft-delta-proof-sf32-owner",
    claimType: filledDraftReport.summary?.claimType ?? null,
    claimField: filledDraftReport.summary?.claimField ?? null,
    completedFields: filledDraftReport.summary?.completedFields ?? 0,
    missingFields: filledDraftReport.summary?.missingFields ?? 0,
    remainingPlaceholderFields: filledDraftReport.summary?.remainingPlaceholderFields ?? 0,
    draftReadyForAudit: filledDraftReport.summary?.readyForDraftAudit === true,
    auditReadyForIntake: draftAudit.summary?.readyForIntake === true,
    readyForPreview,
    structuralBlockers: draftAudit.summary?.structuralBlockers ?? 0,
    reviewBlockers: draftAudit.summary?.reviewBlockers ?? 0,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForPreview
        ? "delta-evidence-filled-draft-audit-ready-for-preview"
        : "delta-evidence-filled-draft-audit-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForPreview
        ? "Le brouillon patch est structurellement pret pour une preview intake en pending."
        : "Le brouillon patch reste bloque avant preview intake.",
      nextAction: readyForPreview
        ? "Generer une preview intake separee; ne pas copier automatiquement dans l'intake reel."
        : "Completer les champs manquants puis relancer le patch et l'audit.",
    },
  },
  filledDraftSummary: filledDraftReport.summary,
  draftAuditSummary: draftAudit.summary,
  blockers: {
    missingFields: filledDraftReport.missingFields ?? [],
    remainingPlaceholderFields: filledDraftReport.remainingPlaceholderFields ?? [],
    placeholderFields: draftAudit.placeholderFields ?? [],
    structuralBlockers: draftAudit.structuralBlockers ?? [],
    reviewBlockers: draftAudit.reviewBlockers ?? [],
  },
  safeguards: [
    "Cet audit ne modifie pas inputs/external-evidence-candidates.json.",
    "readyForPreview signifie preview possible en pending, pas preuve approved.",
    "acceptedForBridge reste false.",
    "Aucune sortie ne peut modifier reliableDps, le ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-filled-draft-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
