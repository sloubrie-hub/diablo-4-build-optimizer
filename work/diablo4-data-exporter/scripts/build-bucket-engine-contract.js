const fs = require("fs");
const path = require("path");

const inputs = {
  targetBucketEngine: process.argv[2] ?? "outputs/diablo4-target-bucket-engine/target-bucket-engine.json",
  workingBaseContract: process.argv[3] ?? "outputs/diablo4-working-base-contract/working-base-contract.json",
  reliableDpsGates: process.argv[4] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
};
const outDir = process.argv[5] ?? "outputs/diablo4-bucket-engine-contract";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function round(value) {
  return Math.round(Number(value || 0));
}

function status(condition) {
  return condition ? "passed" : "failed";
}

function invariant(id, condition, value, expected, reason) {
  return {
    id,
    status: status(condition),
    value,
    expected,
    reason,
  };
}

const bucketEngine = readJson(inputs.targetBucketEngine);
const workingBase = readJson(inputs.workingBaseContract);
const reliableDpsGates = readJson(inputs.reliableDpsGates);

const summary = bucketEngine.summary ?? {};
const buckets = bucketEngine.buckets ?? {};
const bestStrict = bucketEngine.bestStrictClassPlan ?? {};
const reliablePolicy = workingBase.reliableDpsPolicy ?? {};
const recomputedStrict = round(
  Number(buckets.strictBase || 0)
    * (1 + Number(buckets.additivePct || 0) / 100)
    * Number(buckets.multiplicativeProduct || 1)
    * Number(buckets.uptimeProduct || 1)
);
const blockedRows = (bucketEngine.bucketRows ?? []).filter((row) => Number(row.blockedCandidateDelta || 0) > 0);
const failedInvariants = [];

const invariants = [
  invariant(
    "formula-recomputes-strict-dps",
    recomputedStrict === round(summary.calculatedStrictDps),
    recomputedStrict,
    round(summary.calculatedStrictDps),
    "La formule bucket doit reproduire le strict calcule."
  ),
  invariant(
    "strict-parity-zero",
    round(summary.parityDelta) === 0,
    round(summary.parityDelta),
    0,
    "Le strict bucket doit rester en parite avec la composition cible."
  ),
  invariant(
    "reliable-dps-is-strict-only",
    round(summary.reliableDps) === round(summary.strictBaseDps),
    round(summary.reliableDps),
    round(summary.strictBaseDps),
    "Le DPS fiable ne doit pas inclure le delta bloque."
  ),
  invariant(
    "what-if-keeps-blocked-delta-separated",
    round(summary.whatIfDps) === round(summary.reliableDps) + round(summary.blockedCandidateDelta),
    round(summary.whatIfDps),
    round(summary.reliableDps) + round(summary.blockedCandidateDelta),
    "Le what-if doit rester reliableDps + blockedCandidateDelta."
  ),
  invariant(
    "blocked-rows-are-not-reliable",
    blockedRows.every((row) => row.status === "strict-with-blocked-candidates" && Number(row.reliableDps || 0) === Number(row.strictBaseDps || 0)),
    blockedRows.map((row) => ({ assetId: row.assetId, reliableDps: row.reliableDps, strictBaseDps: row.strictBaseDps, blockedCandidateDelta: row.blockedCandidateDelta })),
    "blocked rows keep reliableDps equal to strictBaseDps",
    "Les lignes avec delta bloque doivent rester strict-only."
  ),
  invariant(
    "working-base-matches-best-strict-class",
    workingBase.summary?.class === bestStrict.class && round(workingBase.summary?.strictDps) === round(bestStrict.reliableDps),
    { class: workingBase.summary?.class, strictDps: workingBase.summary?.strictDps },
    { class: bestStrict.class, strictDps: bestStrict.reliableDps },
    "Le contrat de base chargeable doit suivre le meilleur plan strict valide."
  ),
  invariant(
    "no-reliable-class-plan-before-gates",
    Number(summary.reliableClassPlans || 0) === 0 && bestStrict.reliableOptimizerReady !== true,
    { reliableClassPlans: summary.reliableClassPlans, bestStrictReady: bestStrict.reliableOptimizerReady },
    { reliableClassPlans: 0, bestStrictReady: false },
    "Aucun plan classe ne doit etre promu tant que les portes echouent."
  ),
  invariant(
    "blocked-delta-cannot-use-reliable-dps",
    reliableDpsGates.summary?.canUseForReliableDps === false && reliablePolicy.canUseForReliableDps === false,
    { gates: reliableDpsGates.summary?.canUseForReliableDps, policy: reliablePolicy.canUseForReliableDps },
    { gates: false, policy: false },
    "Le delta 1663210 reste interdit dans reliableDps."
  ),
];

for (const row of invariants) {
  if (row.status !== "passed") failedInvariants.push(row.id);
}

const contract = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bucket-engine-contract-v1",
  source: inputs,
  summary: {
    status: failedInvariants.length ? "bucket-engine-contract-failed" : "bucket-engine-contract-ok",
    invariants: invariants.length,
    passed: invariants.length - failedInvariants.length,
    failed: failedInvariants.length,
    failedInvariants,
    strictFormula: bucketEngine.formula?.strict ?? null,
    recomputedStrictDps: recomputedStrict,
    strictParityDelta: round(summary.parityDelta),
    reliableDps: round(summary.reliableDps),
    blockedCandidateDelta: round(summary.blockedCandidateDelta),
    whatIfDps: round(summary.whatIfDps),
    bestStrictClass: summary.bestStrictClass ?? null,
    reliableOptimizerReady: false,
    assessment: {
      kind: failedInvariants.length ? "bucket-engine-contract-broken" : "bucket-engine-contract-strict-only-safe",
      confidence: "high",
      promotionReady: false,
      finding: failedInvariants.length
        ? "Un invariant du moteur buckets est casse; ne pas utiliser le plan avant correction."
        : "Le moteur buckets respecte la separation strict, what-if et delta bloque.",
      nextAction: failedInvariants.length
        ? "Corriger les invariants avant toute suite optimiseur."
        : "Alimenter les buckets fins avec des preuves source sans changer reliableDps.",
    },
  },
  invariants,
  safeguards: [
    "Le strict recalcule doit rester en parite exacte.",
    "Le what-if reste une vue separee, pas un score fiable.",
    "Les plans classe fiables restent a zero tant que les portes echouent.",
    "Le delta 1663210 reste bloque tant que SF_32, SF_33 et uptime ne sont pas prouves.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bucket-engine-contract.json");
fs.writeFileSync(outFile, JSON.stringify(contract, null, 2));
console.log(JSON.stringify({ outFile, summary: contract.summary }, null, 2));
