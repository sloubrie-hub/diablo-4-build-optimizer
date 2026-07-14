const fs = require("fs");
const path = require("path");

const intakeUpdatePreviewFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json";
const draftAuditFile = process.argv[3] ?? "outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json";
const promotionReviewFile = process.argv[4] ?? "outputs/diablo4-delta-promotion-review/delta-promotion-review.json";
const outDir = process.argv[5] ?? "outputs/diablo4-delta-manual-promotion-gate";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const preview = readJson(intakeUpdatePreviewFile);
const draftAudit = readJson(draftAuditFile);
const promotionReview = readJson(promotionReviewFile);

const gateChecks = [
  {
    id: "preview-merge-ready",
    status: preview.summary?.previewMergeReady === true ? "passed" : "failed",
    finding: preview.summary?.previewMergeReady === true
      ? "La preview d'intake est prete pour relecture."
      : "La preview d'intake n'est pas prete.",
  },
  {
    id: "draft-ready-for-intake",
    status: draftAudit.summary?.readyForIntake === true ? "passed" : "failed",
    finding: draftAudit.summary?.readyForIntake === true
      ? "Le brouillon peut etre copie en pending dans l'intake reel."
      : "Le brouillon n'est pas copiable dans l'intake reel.",
  },
  {
    id: "promotion-review-manual-ready",
    status: promotionReview.summary?.readyForManualReview === true ? "passed" : "failed",
    finding: promotionReview.summary?.readyForManualReview === true
      ? "La revue de promotion manuelle est ouverte."
      : "La revue de promotion manuelle reste bloquee.",
  },
  {
    id: "no-real-intake-write",
    status: preview.summary?.writesRealIntake === false ? "passed" : "failed",
    finding: preview.summary?.writesRealIntake === false
      ? "Aucune ecriture automatique dans l'intake reel."
      : "Une ecriture automatique dans l'intake reel a ete detectee.",
  },
  {
    id: "no-bridge-acceptance",
    status: preview.summary?.acceptedForBridge === false ? "passed" : "failed",
    finding: preview.summary?.acceptedForBridge === false
      ? "La preview ne declare aucune preuve acceptee pour bridge."
      : "La preview expose une acceptation bridge interdite.",
  },
];

const failedChecks = gateChecks.filter((check) => check.status !== "passed");
const readyForHumanAction = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-manual-promotion-gate-v1",
  source: {
    intakeUpdatePreviewFile,
    draftAuditFile,
    promotionReviewFile,
    outDir,
  },
  summary: {
    assetId: promotionReview.summary?.assetId ?? 1663210,
    entityId: promotionReview.summary?.entityId ?? "skill:1663210",
    checks: gateChecks.length,
    failedChecks: failedChecks.length,
    readyForHumanAction,
    previewMergeReady: preview.summary?.previewMergeReady === true,
    draftReadyForIntake: draftAudit.summary?.readyForIntake === true,
    promotionReviewReady: promotionReview.summary?.readyForManualReview === true,
    writesRealIntake: preview.summary?.writesRealIntake === true,
    acceptedForBridge: preview.summary?.acceptedForBridge === true,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForHumanAction
        ? "delta-manual-promotion-gate-ready-for-human-action"
        : "delta-manual-promotion-gate-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForHumanAction
        ? "Toutes les preconditions manuelles sont reunies, mais aucune promotion fiable n'est autorisee automatiquement."
        : "La porte de promotion manuelle reste bloquee.",
      nextAction: readyForHumanAction
        ? "Faire une action humaine explicite: copier en pending, revoir, puis relancer intake/bridges; ne pas modifier reliableDps."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  gateChecks,
  nextManualSteps: [
    "Remplir le brouillon avec une source exacte.",
    "Regenerer l'audit et la preview.",
    "Copier manuellement dans inputs/external-evidence-candidates.json en pending.",
    "Relancer l'audit intake et les bridges.",
    "Ne lancer une promotion fiable que via une future etape source-backed de recalcul des gates.",
  ],
  safeguards: [
    "Cette porte ne modifie aucun fichier d'intake reel.",
    "readyForHumanAction ne vaut pas promotionReady.",
    "Aucune sortie ne peut alimenter reliableDps ou le ranking fiable.",
    "Le delta reste bloque tant qu'une etape dediee de recalcul source-backed n'existe pas.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-manual-promotion-gate.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
