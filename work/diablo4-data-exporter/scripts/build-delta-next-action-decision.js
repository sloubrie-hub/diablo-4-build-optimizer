const fs = require("fs");
const path = require("path");

const inputs = {
  deltaLocalExhaustion: process.argv[2] ?? "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json",
  nextEvidenceRoadmap: process.argv[3] ?? "outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json",
  externalEvidenceSubmissionApplyPlan: process.argv[4] ?? "outputs/diablo4-external-evidence-submission-apply-plan/external-evidence-submission-apply-plan.json",
  newBinaryFamilyPlan: process.argv[5] ?? "outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json",
  externalDeltaEvidenceWorkorder: process.argv[6] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json",
  userWhatIfContract: process.argv[7] ?? "outputs/diablo4-user-whatif-contract/user-whatif-contract.json",
  outDir: process.argv[8] ?? "outputs/diablo4-delta-next-action-decision",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function failedIds(checks) {
  return (checks ?? []).filter((check) => check.status === "failed").map((check) => check.id);
}

function makeAction({ id, rank, title, priority, readiness, reason, nextStep, unlocks, blockers }) {
  return { id, rank, title, priority, readiness, reason, nextStep, unlocks, blockers };
}

const deltaLocal = readJson(inputs.deltaLocalExhaustion);
const roadmap = readJson(inputs.nextEvidenceRoadmap);
const applyPlan = readJson(inputs.externalEvidenceSubmissionApplyPlan);
const newBinaryFamilyPlan = readJson(inputs.newBinaryFamilyPlan);
const workorder = readJson(inputs.externalDeltaEvidenceWorkorder);
const userWhatIfContract = readJson(inputs.userWhatIfContract);

const localSummary = deltaLocal.summary ?? {};
const roadmapSummary = roadmap.summary ?? {};
const applySummary = applyPlan.summary ?? {};
const binarySummary = newBinaryFamilyPlan.summary ?? {};
const workorderSummary = workorder.summary ?? {};
const whatIfSummary = userWhatIfContract.summary ?? {};

const localEvidenceExhausted = localSummary.allLocalEvidenceExhausted === true;
const applyBlocked = applySummary.applyPlanReady !== true;
const externalProofMissing = applyBlocked || roadmapSummary.acceptedExternalEvidence === 0;
const binaryProbeAvailable = Boolean(binarySummary.nextProbeId);
const whatIfSeparated = whatIfSummary.canModifyReliableDps === false;

const rankedActions = [
  makeAction({
    id: "collect-source-backed-delta-proof",
    rank: 1,
    title: "Collecter une preuve externe source-backed",
    priority: "high",
    readiness: externalProofMissing ? "blocked-input-required" : "review-ready",
    reason: "Les preuves locales SF_32, SF_33 et uptime ne suffisent pas pour promouvoir le delta.",
    nextStep: workorderSummary.nextTask ?? "Remplir une preuve externe exacte pour le prochain claim delta.",
    unlocks: "Peut alimenter les bridges SF_32/SF_33/uptime apres revue explicite.",
    blockers: [
      ...(applySummary.failedChecks ? [`apply-plan:${applySummary.failedChecks}`] : []),
      ...(failedIds(applyPlan.planChecks).map((id) => `apply-check:${id}`)),
    ],
  }),
  makeAction({
    id: "probe-new-binary-family",
    rank: 2,
    title: "Chercher une nouvelle famille binaire source-backed",
    priority: "high",
    readiness: binaryProbeAvailable ? "probe-ready" : "blocked-no-probe",
    reason: "La piste locale actuelle est epuisee; il faut un nouveau record parent/consommateur nommable.",
    nextStep: binarySummary.nextProbeId
      ? `Executer ou approfondir la sonde ${binarySummary.nextProbeId}.`
      : "Definir une nouvelle sonde binaire ciblee.",
    unlocks: "Peut produire une preuve locale promouvable sans source externe.",
    blockers: binarySummary.blockers ?? [],
  }),
  makeAction({
    id: "maintain-user-whatif-only",
    rank: 3,
    title: "Maintenir le scenario utilisateur what-if separe",
    priority: "medium",
    readiness: whatIfSeparated ? "available" : "needs-contract",
    reason: "Le what-if SF_33 + uptime reste utile pour simuler, mais ne doit pas entrer dans reliableDps.",
    nextStep: "Conserver le scenario utilisateur comme simulation desactivee du ranking fiable.",
    unlocks: "Ameliore l'exploration utilisateur sans resoudre les preuves jeu.",
    blockers: whatIfSeparated ? [] : ["what-if-contract-required"],
  }),
];

const recommendedAction = rankedActions.find((action) => action.readiness === "blocked-input-required") ?? rankedActions[0];
const canModifyReliableDps = false;
const canUseForReliableDps = false;
const canUseForRanking = false;
const promotionReady = false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-next-action-decision-v1",
  source: inputs,
  summary: {
    assetId: localSummary.assetId ?? 1663210,
    entityId: localSummary.entityId ?? "skill:1663210",
    strictDps: localSummary.strictDps ?? 163200,
    blockedDeltaDps: localSummary.blockedDeltaDps ?? 48960,
    localEvidenceExhausted,
    externalProofMissing,
    binaryProbeAvailable,
    whatIfSeparated,
    recommendedActionId: recommendedAction.id,
    recommendedPriority: recommendedAction.priority,
    actions: rankedActions.length,
    canModifyReliableDps,
    canUseForReliableDps,
    canUseForRanking,
    promotionReady,
    assessment: {
      kind: localEvidenceExhausted
        ? "delta-next-action-external-proof-or-new-binary-family"
        : "delta-next-action-close-local-evidence-first",
      confidence: "high",
      promotionReady,
      finding: localEvidenceExhausted
        ? "La suite utile est une preuve externe source-backed ou une nouvelle famille binaire; le what-if reste separe."
        : "Une piste locale reste ouverte; elle doit etre fermee avant toute decision de promotion.",
      nextAction: recommendedAction.nextStep,
    },
  },
  rankedActions,
  evidenceState: {
    localConclusion: {
      file: inputs.deltaLocalExhaustion,
      summary: localSummary,
    },
    externalApplyPlan: {
      file: inputs.externalEvidenceSubmissionApplyPlan,
      summary: applySummary,
      failedChecks: failedIds(applyPlan.planChecks),
    },
    newBinaryFamilyPlan: {
      file: inputs.newBinaryFamilyPlan,
      summary: binarySummary,
    },
    whatIfContract: {
      file: inputs.userWhatIfContract,
      summary: whatIfSummary,
    },
  },
  safeguards: {
    writesTargetDataset: false,
    writesRealIntake: false,
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Ce rapport choisit une prochaine action; il ne consomme aucune preuve et ne modifie aucune valeur DPS.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "delta-next-action-decision.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
