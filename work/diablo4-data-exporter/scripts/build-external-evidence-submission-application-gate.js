const fs = require("fs");
const path = require("path");

const dryRunFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-implementation-dry-run/external-evidence-submission-implementation-dry-run.json";
const outDir = process.argv[3] ?? "outputs/diablo4-external-evidence-submission-application-gate";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const dryRun = readJson(dryRunFile);
const summary = dryRun.summary ?? {};
const patchPreview = dryRun.patchPreview ?? null;
const regressions = dryRun.regressionTargets ?? [];

const gateChecks = [
  {
    id: "external-dry-run-ready",
    status: summary.patchPreviewReady === true ? "passed" : "failed",
    finding: summary.patchPreviewReady === true
      ? "Le dry-run externe de promotion est pret."
      : "Le dry-run externe de promotion reste bloque.",
  },
  {
    id: "patch-preview-present",
    status: patchPreview ? "passed" : "failed",
    finding: patchPreview
      ? "La preview de patch est presente."
      : "Aucune preview de patch n'est disponible.",
  },
  {
    id: "target-write-still-disabled",
    status: summary.writesTargetDataset === false ? "passed" : "failed",
    finding: summary.writesTargetDataset === false
      ? "Aucune ecriture target dataset n'a ete faite."
      : "Une ecriture target dataset prematuree a ete detectee.",
  },
  {
    id: "regression-targets-present",
    status: regressions.length >= 2 ? "passed" : "failed",
    finding: regressions.length >= 2
      ? "Les cibles de regression minimales sont presentes."
      : "Les cibles de regression sont incompletes.",
  },
];

const failedChecks = gateChecks.filter((check) => check.status !== "passed");
const manualApplyAllowed = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-application-gate-v1",
  source: {
    dryRunFile,
    outDir,
  },
  summary: {
    assetId: summary.assetId ?? 1663210,
    entityId: summary.entityId ?? "skill:1663210",
    candidateId: summary.candidateId ?? "draft-delta-proof-sf32-owner",
    proposedReliableDps: summary.proposedReliableDps ?? 212160,
    checks: gateChecks.length,
    failedChecks: failedChecks.length,
    manualApplyAllowed,
    patchBefore: patchPreview?.before ?? null,
    patchAfter: patchPreview?.after ?? null,
    writesTargetDataset: false,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: manualApplyAllowed
        ? "external-evidence-submission-application-gate-ready-manual-only"
        : "external-evidence-submission-application-gate-blocked",
      confidence: "high",
      promotionReady: false,
      finding: manualApplyAllowed
        ? "Une application externe manuelle separee peut etre preparee, sans ecriture automatique ici."
        : "La porte d'application externe reste fermee.",
      nextAction: manualApplyAllowed
        ? "Creer une etape d'application explicite avec sauvegarde, diff et tests de regression."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  gateChecks,
  patchPreview,
  applyContract: {
    allowedNextStep: "external-evidence-submission-apply-explicit",
    requiredBeforeApply: [
      "sauvegarde du target dataset",
      "diff lisible de la mutation reliableDps",
      "suite regression complete",
      "validation humaine finale",
    ],
    forbiddenHere: [
      "ecrire dans target-dataset.json",
      "modifier reliableDps",
      "activer canUseForReliableDps",
      "activer canUseForRanking",
      "marquer promotionReady true",
    ],
  },
  safeguards: [
    "Cette porte n'applique jamais le patch.",
    "manualApplyAllowed ne vaut pas promotionReady.",
    "Toute application future doit etre explicite et auditee.",
    "Le ranking fiable reste strict-only dans cette sortie.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-application-gate.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
