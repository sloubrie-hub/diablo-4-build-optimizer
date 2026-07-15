const fs = require("fs");
const path = require("path");

const intakePreviewFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json";
const outDir = process.argv[3] ?? "outputs/diablo4-delta-evidence-intake-copy-gate";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const preview = readJson(intakePreviewFile);
const summary = preview.summary ?? {};
const blockers = preview.blockers ?? {};
const previewCandidates = preview.preview?.candidates ?? [];
const addedCandidate = summary.previewMergeReady === true ? previewCandidates.at(-1) ?? null : null;

const gateChecks = [
  {
    id: "preview-merge-ready",
    status: summary.previewMergeReady === true ? "passed" : "failed",
    finding: summary.previewMergeReady === true
      ? "La preview patch est prete pour une copie manuelle."
      : "La preview patch n'est pas prete pour copie.",
  },
  {
    id: "candidate-present",
    status: addedCandidate ? "passed" : "failed",
    finding: addedCandidate
      ? "Un candidat est present dans la preview."
      : "Aucun candidat copiable n'est present dans la preview.",
  },
  {
    id: "candidate-pending",
    status: addedCandidate?.reviewer?.status === "pending" ? "passed" : "failed",
    finding: addedCandidate?.reviewer?.status === "pending"
      ? "Le candidat preview reste en pending."
      : "Le candidat preview n'est pas en pending.",
  },
  {
    id: "no-duplicates",
    status: (summary.duplicateIds?.length ?? blockers.duplicateIds?.length ?? 0) === 0 ? "passed" : "failed",
    finding: "Aucun id duplique ne doit etre copie.",
  },
  {
    id: "no-real-intake-write",
    status: summary.writesRealIntake === false ? "passed" : "failed",
    finding: summary.writesRealIntake === false
      ? "La preview n'a pas ecrit dans l'intake reel."
      : "Une ecriture intake reelle a ete detectee.",
  },
  {
    id: "not-accepted-for-bridge",
    status: summary.acceptedForBridge === false ? "passed" : "failed",
    finding: summary.acceptedForBridge === false
      ? "Le candidat n'est pas accepte pour bridge."
      : "La preview declare une acceptation bridge interdite.",
  },
];

const failedChecks = gateChecks.filter((check) => check.status !== "passed");
const readyForManualCopy = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-intake-copy-gate-v1",
  source: {
    intakePreviewFile,
    outDir,
  },
  summary: {
    assetId: addedCandidate?.assetId ?? 1663210,
    entityId: addedCandidate?.entityId ?? "skill:1663210",
    candidateId: addedCandidate?.id ?? summary.candidateId ?? "draft-delta-proof-sf32-owner",
    checks: gateChecks.length,
    failedChecks: failedChecks.length,
    readyForManualCopy,
    previewMergeReady: summary.previewMergeReady === true,
    previewCandidates: summary.previewCandidates ?? 0,
    reviewerStatus: addedCandidate?.reviewer?.status ?? summary.reviewerStatus ?? null,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForManualCopy
        ? "delta-evidence-intake-copy-gate-ready"
        : "delta-evidence-intake-copy-gate-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForManualCopy
        ? "La preview peut etre copiee manuellement en pending dans l'intake reel."
        : "La copie manuelle vers l'intake reel reste bloquee.",
      nextAction: readyForManualCopy
        ? "Copier manuellement le candidat pending, relancer l'audit intake, puis demander une revue humaine."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  gateChecks,
  candidateToCopy: addedCandidate,
  manualCopyTarget: "inputs/external-evidence-candidates.json",
  manualSteps: [
    "Verifier la source exacte du candidat preview.",
    "Copier manuellement le candidat dans inputs/external-evidence-candidates.json.",
    "Conserver reviewer.status=pending.",
    "Relancer l'audit intake et les bridges.",
    "Ne passer a approved qu'apres revue humaine explicite.",
  ],
  safeguards: [
    "Ce rapport ne modifie jamais inputs/external-evidence-candidates.json.",
    "readyForManualCopy ne vaut pas approved.",
    "acceptedForBridge reste false.",
    "Aucune sortie ne peut modifier reliableDps, le ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-intake-copy-gate.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
