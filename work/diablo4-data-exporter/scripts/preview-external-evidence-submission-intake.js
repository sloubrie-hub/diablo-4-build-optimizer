const fs = require("fs");
const path = require("path");

const submissionGateFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-gate/external-evidence-submission-gate.json";
const intakeFile = process.argv[3] ?? "inputs/external-evidence-candidates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-external-evidence-submission-intake-preview";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const gate = readJson(submissionGateFile);
const intake = readJson(intakeFile);
const candidate = gate.summary?.readyForIntakeCopy === true ? gate.candidateToCopy : null;
const existingCandidates = intake.candidates ?? [];
const duplicateIds = candidate
  ? existingCandidates.filter((item) => item.id === candidate.id).map((item) => item.id)
  : [];
const previewMergeReady = Boolean(candidate) && duplicateIds.length === 0;
const preview = clone(intake);

if (previewMergeReady) {
  preview.candidates = [...existingCandidates, candidate];
}

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-intake-preview-v1",
  source: {
    submissionGateFile,
    intakeFile,
    outDir,
  },
  summary: {
    assetId: gate.summary?.assetId ?? 1663210,
    entityId: gate.summary?.entityId ?? "skill:1663210",
    candidateId: gate.summary?.candidateId ?? null,
    gateReadyForIntakeCopy: gate.summary?.readyForIntakeCopy === true,
    previewMergeReady,
    originalCandidates: existingCandidates.length,
    previewCandidates: preview.candidates?.length ?? 0,
    addedCandidates: previewMergeReady ? 1 : 0,
    duplicateIds,
    reviewerStatus: candidate?.reviewer?.status ?? gate.summary?.reviewerStatus ?? null,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: previewMergeReady
        ? "external-evidence-submission-intake-preview-ready"
        : "external-evidence-submission-intake-preview-blocked",
      confidence: "high",
      promotionReady: false,
      finding: previewMergeReady
        ? "La preview montre le candidat ajoute en pending, sans modifier l'intake reel."
        : "La preview ne peut pas ajouter le candidat tant que le gate de soumission est bloque.",
      nextAction: previewMergeReady
        ? "Copier manuellement le candidat pending dans l'intake reel puis relancer l'audit."
        : "Remplir la source exacte et faire passer le gate de soumission avant copie.",
    },
  },
  candidatePreview: previewMergeReady ? candidate : null,
  preview,
  safeguards: [
    "Cette preview ne modifie pas inputs/external-evidence-candidates.json.",
    "Le candidat ajoute reste pending.",
    "previewMergeReady ne vaut pas approved.",
    "Aucune sortie ne peut modifier reliableDps, ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-intake-preview.json");
const previewFile = path.join(outDir, "external-evidence-candidates.submission-preview.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(previewFile, JSON.stringify(preview, null, 2));
console.log(JSON.stringify({ outFile, previewFile, summary: report.summary }, null, 2));
