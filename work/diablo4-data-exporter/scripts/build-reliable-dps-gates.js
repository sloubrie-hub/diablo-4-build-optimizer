const fs = require("fs");
const path = require("path");

const inputs = {
  deltaPromotionConclusion: process.argv[2] ?? "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json",
  userWhatIfScenarios: process.argv[3] ?? "outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json",
  blockerResolution: process.argv[4] ?? "outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json",
};
const outDir = process.argv[5] ?? "outputs/diablo4-reliable-dps-gates";

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function gateFromProof(proof) {
  return {
    id: proof.id,
    title: proof.title,
    blocker: proof.blocker,
    status: proof.promotionReady === true ? "passed" : "failed",
    assessment: proof.assessment ?? null,
    confidence: proof.confidence ?? null,
    reason: proof.decision ?? "preuve requise avant promotion",
    evidence: proof.evidence ?? {},
  };
}

const delta = readOptionalJson(inputs.deltaPromotionConclusion);
const userScenarios = readOptionalJson(inputs.userWhatIfScenarios);
const blockers = readOptionalJson(inputs.blockerResolution);

const deltaSummary = delta?.summary ?? {};
const scenario = (userScenarios?.scenarios ?? []).find((row) => Number(row.assetId) === Number(deltaSummary.assetId ?? 1663210));
const proofGates = (delta?.proofs ?? []).map(gateFromProof);
const userScenarioGate = {
  id: "user-what-if-separated",
  title: "Separer l'hypothese utilisateur",
  blocker: "hypothesis-must-not-enter-reliable-dps",
  status: scenario?.reliability?.canUseForReliableDps === false ? "passed" : "failed",
  assessment: userScenarios?.summary?.assessment?.kind ?? null,
  confidence: userScenarios?.summary?.assessment?.confidence ?? null,
  reason: scenario
    ? "Le scenario utilisateur est disponible en what-if configure, mais exclu du DPS fiable."
    : "Aucun scenario utilisateur separe n'est disponible.",
  evidence: {
    scenarioId: scenario?.id ?? null,
    defaultEnabled: userScenarios?.summary?.defaultEnabled === true,
    canExposeAsWhatIf: scenario?.reliability?.canExposeAsWhatIf === true,
    canUseForReliableDps: scenario?.reliability?.canUseForReliableDps === true,
    controls: scenario?.controls?.map((control) => control.id) ?? [],
  },
};

const gates = [...proofGates, userScenarioGate];
const failed = gates.filter((gate) => gate.status !== "passed");
const passed = gates.filter((gate) => gate.status === "passed");
const activeBlockerKinds = Array.from(new Set((blockers?.assets ?? [])
  .filter((asset) => Number(asset.assetId) === Number(deltaSummary.assetId ?? 1663210))
  .flatMap((asset) => asset.blockers ?? [])
  .map((blocker) => blocker.kind)
  .filter(Boolean)));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "reliable-dps-gates-v1",
  source: inputs,
  summary: {
    assetId: deltaSummary.assetId ?? 1663210,
    entityId: deltaSummary.entityId ?? "skill:1663210",
    class: deltaSummary.class ?? "spiritborn",
    strictDps: deltaSummary.strictDps ?? 163200,
    blockedDeltaDps: deltaSummary.candidateDeltaDps ?? 48960,
    maxWhatIfDps: deltaSummary.candidateDps ?? 212160,
    gates: gates.length,
    passedGates: passed.length,
    failedGates: failed.length,
    failedGateIds: failed.map((gate) => gate.id),
    activeBlockerKinds,
    reliableDps: deltaSummary.strictDps ?? 163200,
    whatIfOnlyDps: deltaSummary.candidateDps ?? 212160,
    canUseForReliableDps: false,
    canUseForRanking: false,
    canUseForUserWhatIf: scenario?.reliability?.canExposeAsWhatIf === true,
    localEvidenceExhausted: deltaSummary.localEvidenceExhausted === true,
    assessment: {
      kind: failed.length ? "reliable-dps-gates-blocked" : "reliable-dps-gates-ready",
      confidence: "high",
      promotionReady: false,
      finding: failed.length
        ? "Le delta reste exclu du DPS fiable; seules les valeurs strictes peuvent alimenter le ranking fiable."
        : "Toutes les portes sont passees, mais la promotion doit encore etre revue avant modification du dataset.",
      nextAction: failed.length
        ? "Continuer avec le scenario utilisateur what-if ou chercher une source externe fiable; ne pas changer reliableDps."
        : "Revoir manuellement les preuves avant de promouvoir le delta.",
    },
  },
  gates,
  policy: {
    reliableRankingUses: "strictDps",
    userWhatIfUses: "strictDps + configured blockedDeltaDps",
    forbiddenPromotions: [
      "delta sans ownership SF_32",
      "delta sans trigger SF_33 prouve",
      "delta sans uptime explicite ou configuration utilisateur separee",
    ],
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "reliable-dps-gates.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
