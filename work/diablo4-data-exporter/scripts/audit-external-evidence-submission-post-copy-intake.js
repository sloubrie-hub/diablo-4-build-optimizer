const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const intakePreviewFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-submission-intake-preview.json";
const currentIntakeFile = process.argv[3] ?? "inputs/external-evidence-candidates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-external-evidence-submission-post-copy-intake";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function runIntakeAudit(inputFile) {
  const auditOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-post-copy-"));
  const auditScript = path.join(__dirname, "audit-external-evidence-intake.js");
  const result = spawnSync(process.execPath, [auditScript, inputFile, auditOutDir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`audit-external-evidence-intake failed with exit code ${result.status}`);
  }
  return readJson(path.join(auditOutDir, "external-evidence-intake.json"));
}

const preview = readJson(intakePreviewFile);
const currentIntake = readJson(currentIntakeFile);
const currentCandidates = currentIntake.candidates ?? [];
const candidateToCopy = preview.summary?.previewMergeReady === true ? preview.candidatePreview ?? null : null;
const simulatedCandidates = candidateToCopy ? [...currentCandidates, candidateToCopy] : currentCandidates;
const simulatedIntake = {
  schemaVersion: currentIntake.schemaVersion ?? 1,
  notes: [
    ...((currentIntake.notes ?? []).map(String)),
    "Simulation post-copie soumission externe: ce fichier n'est pas l'intake reel.",
  ],
  candidates: simulatedCandidates,
};

fs.mkdirSync(outDir, { recursive: true });
const simulatedIntakeFile = path.join(outDir, "external-evidence-candidates.submission-post-copy-simulated.json");
writeJson(simulatedIntakeFile, simulatedIntake);

const intakeAudit = runIntakeAudit(simulatedIntakeFile);
const targetCandidate = (intakeAudit.candidates ?? []).find((candidate) => candidate.id === (candidateToCopy?.id ?? preview.summary?.candidateId));
const readyForManualReview = Boolean(candidateToCopy)
  && targetCandidate?.status === "pending"
  && targetCandidate?.blockers?.includes("manual-review-required");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-post-copy-intake-v1",
  source: {
    intakePreviewFile,
    currentIntakeFile,
    outDir,
  },
  summary: {
    assetId: preview.summary?.assetId ?? 1663210,
    entityId: preview.summary?.entityId ?? "skill:1663210",
    candidateId: preview.summary?.candidateId ?? "draft-delta-proof-sf32-owner",
    previewMergeReady: preview.summary?.previewMergeReady === true,
    simulatedCandidates: simulatedCandidates.length,
    addedCandidates: candidateToCopy ? 1 : 0,
    auditCandidates: intakeAudit.summary?.candidates ?? 0,
    auditAccepted: intakeAudit.summary?.accepted ?? 0,
    auditPending: intakeAudit.summary?.pending ?? 0,
    auditRejected: intakeAudit.summary?.rejected ?? 0,
    targetCandidateStatus: targetCandidate?.status ?? null,
    readyForManualReview,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForManualReview
        ? "external-evidence-submission-post-copy-ready-for-review"
        : "external-evidence-submission-post-copy-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForManualReview
        ? "La simulation post-copie place le candidat en pending avec revue manuelle requise."
        : "La simulation post-copie reste bloquee ou sans candidat copiable.",
      nextAction: readyForManualReview
        ? "Demander une revue humaine de la source avant tout passage a approved."
        : "Faire passer la preview intake avant de simuler l'intake post-copie.",
    },
  },
  candidateToCopy,
  targetCandidate,
  intakeAuditSummary: intakeAudit.summary,
  blockers: {
    previewMergeReady: preview.summary?.previewMergeReady === true,
    duplicateIds: preview.summary?.duplicateIds ?? [],
    targetCandidateBlockers: targetCandidate?.blockers ?? [],
    targetCandidateWarnings: targetCandidate?.warnings ?? [],
  },
  simulatedIntakeFile,
  safeguards: [
    "Cette simulation n'ecrit jamais dans inputs/external-evidence-candidates.json.",
    "Un candidat pending reste bloque par manual-review-required.",
    "acceptedForBridge reste false tant qu'une preuve n'est pas approved et consommee par un bridge cible.",
    "Aucune sortie ne peut modifier reliableDps, ranking ou promotionReady.",
  ],
};

const outFile = path.join(outDir, "external-evidence-submission-post-copy-intake.json");
writeJson(outFile, report);
console.log(JSON.stringify({ outFile, simulatedIntakeFile, summary: report.summary }, null, 2));
