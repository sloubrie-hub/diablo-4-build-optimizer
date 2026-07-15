const fs = require("fs");
const path = require("path");

const decisionAuditFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json";
const reliableGatesFile = process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const deltaPromotionReviewFile = process.argv[4] ?? "outputs/diablo4-delta-promotion-review/delta-promotion-review.json";
const outDir = process.argv[5] ?? "outputs/diablo4-external-evidence-submission-promotion-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const decisionAudit = readJson(decisionAuditFile);
const reliableGates = readJson(reliableGatesFile);
const promotionReview = readJson(deltaPromotionReviewFile);

const gateRows = reliableGates.gates ?? [];
const failedGateIds = gateRows.filter((gate) => gate.status !== "passed").map((gate) => gate.id);
const allReliableGatesPassed = failedGateIds.length === 0;

const auditChecks = [
  {
    id: "external-review-decision-approved",
    status: decisionAudit.summary?.decisionAcceptedForPromotionReview === true ? "passed" : "failed",
    finding: decisionAudit.summary?.decisionAcceptedForPromotionReview === true
      ? "La decision externe approved est auditee."
      : "Aucune decision externe approved n'ouvre la promotion.",
  },
  {
    id: "promotion-review-ready",
    status: promotionReview.summary?.readyForManualReview === true ? "passed" : "failed",
    finding: promotionReview.summary?.readyForManualReview === true
      ? "La revue de promotion est prete."
      : "La revue de promotion reste bloquee.",
  },
  {
    id: "reliable-gates-recomputed-passed",
    status: allReliableGatesPassed ? "passed" : "failed",
    finding: allReliableGatesPassed
      ? "Les gates fiables recalculees sont toutes passees."
      : `Gates fiables encore bloquees: ${failedGateIds.join(", ") || "aucune donnee"}.`,
  },
  {
    id: "strict-dps-unchanged-before-implementation",
    status: reliableGates.summary?.canModifyReliableDps === undefined || reliableGates.summary?.canModifyReliableDps === false ? "passed" : "failed",
    finding: reliableGates.summary?.canModifyReliableDps === undefined || reliableGates.summary?.canModifyReliableDps === false
      ? "Le DPS fiable n'a pas ete modifie avant l'implementation separee."
      : "Une modification reliableDps prematuree a ete detectee.",
  },
];

const failedChecks = auditChecks.filter((check) => check.status !== "passed");
const readyForPromotionImplementation = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-promotion-audit-v1",
  source: {
    decisionAuditFile,
    reliableGatesFile,
    deltaPromotionReviewFile,
    outDir,
  },
  summary: {
    assetId: reliableGates.summary?.assetId ?? decisionAudit.summary?.assetId ?? 1663210,
    entityId: reliableGates.summary?.entityId ?? decisionAudit.summary?.entityId ?? "skill:1663210",
    candidateId: decisionAudit.summary?.candidateId ?? "draft-delta-proof-sf32-owner",
    strictDps: reliableGates.summary?.strictDps ?? 163200,
    blockedDeltaDps: reliableGates.summary?.blockedDeltaDps ?? 48960,
    proposedReliableDps: (reliableGates.summary?.strictDps ?? 163200) + (reliableGates.summary?.blockedDeltaDps ?? 48960),
    checks: auditChecks.length,
    failedChecks: failedChecks.length,
    failedGateIds,
    decisionAcceptedForPromotionReview: decisionAudit.summary?.decisionAcceptedForPromotionReview === true,
    readyForPromotionImplementation,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForPromotionImplementation
        ? "external-evidence-submission-promotion-audit-ready-for-implementation"
        : "external-evidence-submission-promotion-audit-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForPromotionImplementation
        ? "La preuve externe approuvee peut ouvrir une implementation separee, sans modification automatique ici."
        : "La promotion fiable depuis la soumission externe reste bloquee.",
      nextAction: readyForPromotionImplementation
        ? "Creer une etape d'implementation explicite avec recalcul et tests de regression."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  auditChecks,
  gateRows,
  implementationContract: {
    allowedNextStep: "external-evidence-submission-promotion-implementation-dry-run",
    requiredBeforeWrite: [
      "decision externe approved auditee",
      "gates fiables toutes passees apres recalcul source-backed",
      "delta promotion review prete",
      "tests regression asset 1663210 et build 1461593+1663210",
    ],
    forbiddenHere: [
      "modifier reliableDps",
      "activer ranking fiable",
      "ecrire dans target dataset",
      "marquer promotionReady true",
    ],
  },
  safeguards: [
    "Cet audit ne modifie aucun score.",
    "readyForPromotionImplementation ne vaut pas implementation.",
    "Toute ecriture future doit etre un dry-run puis une etape explicite.",
    "Le classement fiable reste strict-only dans cette sortie.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-promotion-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
