const fs = require("fs");
const path = require("path");

const deltaBridgeReadinessFile = process.argv[2] ?? "outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json";
const reliableGatesFile = process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const bucketEngineContractFile = process.argv[4] ?? "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json";
const outDir = process.argv[5] ?? "outputs/diablo4-delta-promotion-review";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const readiness = readJson(deltaBridgeReadinessFile);
const reliableGates = readJson(reliableGatesFile);
const bucketContract = readJson(bucketEngineContractFile);

const allBridgeReady = readiness.summary?.allBridgeReady === true;
const allBridgeSafe = readiness.summary?.anyUnsafeBridge === false;
const reliableDpsStillBlocked = readiness.summary?.reliableDpsStillBlocked === true;
const bucketContractSafe = bucketContract.summary?.status === "bucket-engine-contract-ok"
  && Number(bucketContract.summary?.failed ?? 0) === 0;

const reviewChecks = [
  {
    id: "all-bridges-ready",
    status: allBridgeReady ? "passed" : "failed",
    finding: allBridgeReady
      ? "Les bridges SF_32, SF_33 et uptime sont tous prets pour revue."
      : "Les bridges SF_32, SF_33 et uptime ne sont pas tous prets.",
  },
  {
    id: "bridges-safe",
    status: allBridgeSafe ? "passed" : "failed",
    finding: allBridgeSafe
      ? "Aucun bridge ne declare pouvoir modifier reliableDps."
      : "Au moins un bridge declare un pouvoir interdit sur reliableDps.",
  },
  {
    id: "bucket-contract-safe",
    status: bucketContractSafe ? "passed" : "failed",
    finding: bucketContractSafe
      ? "Le contrat bucket strict-only reste valide."
      : "Le contrat bucket n'est pas valide pour une revue de promotion.",
  },
  {
    id: "reliable-gates-still-blocked",
    status: reliableDpsStillBlocked ? "passed" : "failed",
    finding: reliableDpsStillBlocked
      ? "Les gates fiables restent bloquees avant revue/recalcul dedie."
      : "Les gates fiables ont change avant la revue de promotion.",
  },
];

const failedChecks = reviewChecks.filter((check) => check.status !== "passed");
const readyForManualReview = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-promotion-review-v1",
  source: {
    deltaBridgeReadinessFile,
    reliableGatesFile,
    bucketEngineContractFile,
    outDir,
  },
  summary: {
    assetId: readiness.summary?.assetId ?? 1663210,
    entityId: readiness.summary?.entityId ?? "skill:1663210",
    strictDps: readiness.summary?.strictDps ?? reliableGates.summary?.strictDps ?? 163200,
    blockedDeltaDps: readiness.summary?.blockedDeltaDps ?? reliableGates.summary?.blockedDeltaDps ?? 48960,
    checks: reviewChecks.length,
    failedChecks: failedChecks.length,
    readyForManualReview,
    canUseForUserWhatIf: readyForManualReview,
    canUseForReliableDps: false,
    canUseForRanking: false,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: readyForManualReview
        ? "delta-promotion-review-ready-manual-only"
        : "delta-promotion-review-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForManualReview
        ? "Le delta est pret pour une revue manuelle, mais la promotion fiable reste interdite par defaut."
        : "Le delta n'est pas pret pour revue de promotion fiable.",
      nextAction: readyForManualReview
        ? "Ajouter une future etape de recalcul source-backed des gates avant toute modification de reliableDps."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  reviewChecks,
  promotionPolicy: {
    reliableDpsBeforeReview: reliableGates.summary?.reliableDps ?? 163200,
    whatIfOnlyDps: reliableGates.summary?.whatIfOnlyDps ?? 212160,
    forbiddenAutomaticOutputs: ["reliableDps", "canUseForReliableDps", "canUseForRanking", "promotionReady"],
    requiredFutureStep: "source-backed-gate-recalculation",
  },
  safeguards: [
    "Cette revue ne promeut jamais automatiquement le delta.",
    "Le DPS fiable reste derive des gates fiables existantes.",
    "Un etat readyForManualReview ne vaut pas promotionReady.",
    "Toute promotion future doit recalculer les gates dans une etape dediee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-promotion-review.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
