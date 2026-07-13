const fs = require("fs");
const path = require("path");

const uptimeProofFile = process.argv[2] ?? "outputs/diablo4-uptime-proof-audit/uptime-proof-audit.json";
const sf28Sf29RoleFile = process.argv[3] ?? "outputs/diablo4-sf28-sf29-role-audit/sf28-sf29-role-audit.json";
const uptimeProbabilityChainFile = process.argv[4] ?? "outputs/diablo4-uptime-probability-chain/uptime-probability-chain.json";
const uptimeNeighborDependencyFile = process.argv[5] ?? "outputs/diablo4-uptime-neighbor-dependency/uptime-neighbor-dependency.json";
const userWhatIfScenariosFile = process.argv[6] ?? "outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json";
const externalEvidenceIntakeFile = process.argv[7] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const externalEvidenceBridgeFile = process.argv[8] ?? "outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json";
const reliableGatesFile = process.argv[9] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[10] ?? "outputs/diablo4-uptime-local-exhaustion-conclusion";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function summary(report) {
  return report.summary ?? {};
}

const uptimeProof = readJson(uptimeProofFile);
const sf28Sf29Role = readJson(sf28Sf29RoleFile);
const uptimeProbabilityChain = readJson(uptimeProbabilityChainFile);
const uptimeNeighborDependency = readJson(uptimeNeighborDependencyFile);
const userWhatIfScenarios = readJson(userWhatIfScenariosFile);
const externalEvidenceIntake = readJson(externalEvidenceIntakeFile);
const externalEvidenceBridge = readJson(externalEvidenceBridgeFile);
const reliableGates = readJson(reliableGatesFile);

const proof = summary(uptimeProof);
const role = summary(sf28Sf29Role);
const chain = summary(uptimeProbabilityChain);
const dependency = summary(uptimeNeighborDependency);
const whatIf = summary(userWhatIfScenarios);
const acceptedExternalEvidence = externalEvidenceIntake.summary?.accepted ?? 0;
const bridgeReadySteps = externalEvidenceBridge.summary?.readySteps ?? 0;

const userScenario = (userWhatIfScenarios.scenarios ?? []).find((scenario) => scenario.id === "user-scenario-1663210-sf33-uptime") ?? null;
const userScenarioSeparated = userScenario?.defaultEnabled === false
  && userScenario?.reliability?.canUseForReliableDps === false
  && userScenario?.reliability?.canUseForRanking === false
  && userScenario?.reliability?.canExposeAsWhatIf === true
  && whatIf.reliablePromotionReady === false;

const localEvidenceChecks = [
  {
    id: "neighbor-probability-formulas",
    status: proof.linkedProbabilityNeighbors > 0 ? "review" : "failed",
    finding: "des formules de probabilite voisines existent, mais elles ne referencent pas SF_32/SF_33.",
    metric: {
      probabilityNeighbors: proof.probabilityNeighbors ?? null,
      linkedProbabilityNeighbors: proof.linkedProbabilityNeighbors ?? null,
      hasExplicitUptime: proof.hasExplicitUptime === true,
      hasNumericUptime: proof.hasNumericUptime === true,
    },
    sourceAssessment: proof.assessment?.kind ?? null,
  },
  {
    id: "sf28-sf29-role",
    status: role.hasUptimeRole ? "review" : "failed",
    finding: "SF_28/SF_29 restent des formules locales utility/proc, sans role uptime prouve.",
    metric: {
      probabilityNeighbors: role.probabilityNeighbors ?? null,
      linkedProbabilityNeighbors: role.linkedProbabilityNeighbors ?? null,
      compiledProbabilityMatches: role.compiledProbabilityMatches ?? null,
      hasUptimeRole: role.hasUptimeRole === true,
    },
    sourceAssessment: role.assessment?.kind ?? null,
  },
  {
    id: "probability-chain",
    status: chain.chainsLinkedToBoost > 0 ? "review" : "failed",
    finding: "les chaines de probabilite ne referencent pas la branche boostee SF_32/SF_33.",
    metric: {
      probabilityChains: chain.probabilityChains ?? null,
      chainsLinkedToBoost: chain.chainsLinkedToBoost ?? null,
      chainsWithDurationHint: chain.chainsWithDurationHint ?? null,
      chainsWithAttackSpeedSource: chain.chainsWithAttackSpeedSource ?? null,
    },
    sourceAssessment: chain.assessment?.kind ?? null,
  },
  {
    id: "neighbor-dependency",
    status: dependency.probabilityRowsLinkedToBranch > 0 ? "review" : "failed",
    finding: "les probabilites locales suivent le hash bonus, mais restent separees de la branche boostee.",
    metric: {
      localProbabilityRows: dependency.localProbabilityRows ?? null,
      probabilityRowsLinkedToBranch: dependency.probabilityRowsLinkedToBranch ?? null,
      hasExplicitUptime: dependency.hasExplicitUptime === true,
      hasNumericUptime: dependency.hasNumericUptime === true,
    },
    sourceAssessment: dependency.assessment?.kind ?? null,
  },
  {
    id: "user-whatif-separation",
    status: userScenarioSeparated ? "ready" : "failed",
    finding: "l'uptime utilisateur est exploitable uniquement en what-if separe, sans impact reliableDps.",
    metric: {
      scenarios: whatIf.scenarios ?? null,
      configurableScenarios: whatIf.configurableScenarios ?? null,
      reliablePromotionReady: whatIf.reliablePromotionReady === true,
      defaultEnabled: userScenario?.defaultEnabled ?? null,
    },
    sourceAssessment: whatIf.assessment?.kind ?? null,
  },
];

const reliableReadySignals = localEvidenceChecks
  .filter((check) => check.id !== "user-whatif-separation")
  .filter((check) => ["passed", "ready", "review"].includes(check.status));
const localReliableEvidenceExhausted = reliableReadySignals.length === 0
  && acceptedExternalEvidence === 0
  && bridgeReadySteps === 0
  && proof.hasExplicitUptime !== true
  && proof.hasNumericUptime !== true
  && dependency.hasExplicitUptime !== true
  && dependency.hasNumericUptime !== true;

const requiredProofs = [
  {
    id: "external-uptime-source",
    priority: "high",
    acceptedClaimType: "uptime",
    requiredEvidence: "source officielle, extracted-game-data ou documented-dataset donnant une uptime numerique ou une condition quantifiable pour asset 1663210.",
    rejects: ["probabilite locale seule", "duration hint absent", "inference-only"],
  },
  {
    id: "boost-linked-probability-chain",
    priority: "high",
    acceptedClaimType: "source-mapping",
    requiredEvidence: "chaine de probabilite reliant explicitement SF_28/SF_29 a la branche boostee SF_32/SF_33.",
    rejects: ["SF_28/SF_29 sans reference SF_32/SF_33", "proximite offset seule"],
  },
  {
    id: "user-uptime-scenario-contract",
    priority: "medium",
    acceptedClaimType: "source-mapping",
    requiredEvidence: "contrat UI/optimiseur maintenant l'uptime comme hypothese utilisateur separee du ranking fiable.",
    rejects: ["activation par defaut", "classement fiable avec uptime non sourcee"],
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "uptime-local-exhaustion-conclusion-v1",
  source: {
    uptimeProofFile,
    sf28Sf29RoleFile,
    uptimeProbabilityChainFile,
    uptimeNeighborDependencyFile,
    userWhatIfScenariosFile,
    externalEvidenceIntakeFile,
    externalEvidenceBridgeFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    strictDps: 163200,
    blockedDeltaDps: 48960,
    localEvidenceChecks: localEvidenceChecks.length,
    reliableReadySignals: reliableReadySignals.length,
    acceptedExternalEvidence,
    bridgeReadySteps,
    probabilityNeighbors: proof.probabilityNeighbors ?? 0,
    probabilityChains: chain.probabilityChains ?? 0,
    probabilityRowsLinkedToBranch: dependency.probabilityRowsLinkedToBranch ?? 0,
    chainsLinkedToBoost: chain.chainsLinkedToBoost ?? 0,
    chainsWithDurationHint: chain.chainsWithDurationHint ?? 0,
    hasExplicitUptime: proof.hasExplicitUptime === true || dependency.hasExplicitUptime === true,
    hasNumericUptime: proof.hasNumericUptime === true || dependency.hasNumericUptime === true,
    uptimeReliableProven: false,
    userScenarioSeparated,
    localReliableEvidenceExhausted,
    recommendedNextFocus: userScenarioSeparated ? "user-uptime-scenario-contract" : "external-uptime-source",
    promotionReady: false,
    canModifyReliableDps: false,
    reliableDpsStillBlocked: reliableGates.summary?.canUseForReliableDps !== true,
    assessment: {
      kind: localReliableEvidenceExhausted ? "uptime-local-reliable-evidence-exhausted" : "uptime-local-evidence-open",
      confidence: "high",
      blocker: "uptime-not-proven",
      promotionReady: false,
      finding: "Les preuves locales d'uptime ne prouvent pas le DPS fiable: SF_28/SF_29 sont des probabilites/procs locaux non relies a SF_32/SF_33 et sans valeur d'uptime explicite.",
      nextAction: "Conserver l'uptime comme hypothese utilisateur separee ou ajouter une preuve externe numerique; ne pas convertir SF_28/SF_29 en reliableDps.",
    },
  },
  localEvidenceChecks,
  requiredProofs,
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    userWhatIfAllowed: userScenarioSeparated,
    reason: "Aucune uptime source-backed n'est prouvee pour la branche boostee SF_32/SF_33.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "uptime-local-exhaustion-conclusion.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
