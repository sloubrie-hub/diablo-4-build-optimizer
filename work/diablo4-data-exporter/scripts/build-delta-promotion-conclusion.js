const fs = require("fs");
const path = require("path");

const inputs = {
  deltaUnblockPlan: process.argv[2] ?? "outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json",
  sf32Decision: process.argv[3] ?? "outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json",
  sf33Decision: process.argv[4] ?? "outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json",
  uptimeDecision: process.argv[5] ?? "outputs/diablo4-uptime-neighbor-dependency/uptime-neighbor-dependency.json",
};
const outDir = process.argv[6] ?? "outputs/diablo4-delta-promotion-conclusion";

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function assessmentKind(report) {
  return report?.summary?.assessment?.kind ?? null;
}

function proof(id, title, blocker, report, evidence, decision) {
  const summary = report?.summary ?? {};
  const assessment = summary.assessment ?? {};
  const promotionReady = summary.promotionReady === true || assessment.promotionReady === true;
  return {
    id,
    title,
    blocker,
    status: promotionReady ? "ready" : "blocked",
    assessment: assessmentKind(report),
    confidence: assessment.confidence ?? null,
    promotionReady,
    evidence,
    decision,
  };
}

const deltaUnblockPlan = readOptionalJson(inputs.deltaUnblockPlan);
const sf32Decision = readOptionalJson(inputs.sf32Decision);
const sf33Decision = readOptionalJson(inputs.sf33Decision);
const uptimeDecision = readOptionalJson(inputs.uptimeDecision);

const sf32 = sf32Decision?.summary ?? {};
const sf33 = sf33Decision?.summary ?? {};
const uptime = uptimeDecision?.summary ?? {};
const sf32Evidence = sf32.assessment?.evidence ?? {};
const sf33Evidence = sf33.assessment?.evidence ?? {};
const uptimeEvidence = uptime.assessment?.evidence ?? {};

const proofs = [
  proof(
    "sf32-field",
    "Prouver le champ SF_32",
    "field-level-parser-required",
    sf32Decision,
    {
      gatesPassed: sf32Evidence.gatesPassed ?? 0,
      gatesFailed: sf32Evidence.gatesFailed ?? 0,
      failedGateIds: sf32Evidence.failedGateIds ?? [],
      selector949Layouts: sf32Evidence.selector949Layouts ?? null,
      secondCompact949Assets: sf32Evidence.secondCompact949Assets ?? null,
      independentTableCandidates: sf32Evidence.independentTableCandidates ?? null,
      freshMatches: sf32Evidence.freshMatches ?? null,
    },
    "Le compact 949/1663210/12337/10 reste non promouvable sans ownership de champ ni source nommee."
  ),
  proof(
    "sf33-trigger",
    "Mapper le trigger SF_33",
    "sf33-trigger-build-state-unmapped",
    sf33Decision,
    {
      targetTrigger: sf33.targetTrigger ?? sf33Evidence.target?.anchor ?? null,
      modTrailerMatchesAll: sf33.modTrailerMatchesAll === true,
      exactNeighborConsumerMatch: sf33.hasExactNeighborConsumerMatch === true,
      externalNameHits: sf33.externalNameHits ?? 0,
      externalTriggerHits: sf33.externalTriggerHits ?? 0,
      externalTargetPowerTagContexts: sf33Evidence.externalTargetPowerTagContexts ?? null,
    },
    "Mod.SoilRuler_B est un flag local plausible, mais aucune activation gameplay ou source build-state externe n'est prouvee."
  ),
  proof(
    "uptime",
    "Prouver ou configurer l'uptime",
    "uptime-not-proven",
    uptimeDecision,
    {
      localProbabilityRows: uptime.localProbabilityRows ?? 0,
      probabilityRowsLinkedToBranch: uptime.probabilityRowsLinkedToBranch ?? 0,
      hasExplicitUptime: uptime.hasExplicitUptime === true,
      hasNumericUptime: uptime.hasNumericUptime === true,
      probabilityChains: uptimeEvidence.probabilityChains ?? null,
      probabilityChainsLinkedToBoost: uptimeEvidence.probabilityChainsLinkedToBoost ?? null,
    },
    "SF_28/SF_29 restent des probabilites locales non reliees a la branche boostee SF_32/SF_33."
  ),
];

const readyProofs = proofs.filter((row) => row.status === "ready");
const blockedProofs = proofs.filter((row) => row.status !== "ready");
const localEvidenceExhausted = blockedProofs.length === proofs.length
  && Number(sf32Evidence.gatesPassed ?? 0) === 0
  && sf33.hasExactNeighborConsumerMatch !== true
  && Number(sf33.externalNameHits ?? 0) === 0
  && Number(sf33.externalTriggerHits ?? 0) === 0
  && Number(uptime.probabilityRowsLinkedToBranch ?? 0) === 0
  && uptime.hasExplicitUptime !== true
  && uptime.hasNumericUptime !== true;

const deltaSummary = deltaUnblockPlan?.summary ?? {};
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-promotion-conclusion-v1",
  source: inputs,
  summary: {
    assetId: deltaSummary.assetId ?? 1663210,
    entityId: deltaSummary.entityId ?? "skill:1663210",
    class: deltaSummary.class ?? "spiritborn",
    strictDps: deltaSummary.strictDps ?? 163200,
    candidateDps: deltaSummary.candidateDps ?? 212160,
    candidateDeltaDps: deltaSummary.candidateDeltaDps ?? 48960,
    scenarioId: deltaSummary.scenarioId ?? "sf33-active-sf32-30pct",
    proofs: proofs.length,
    readyProofs: readyProofs.length,
    blockedProofs: blockedProofs.length,
    localEvidenceExhausted,
    promotionReady: false,
    canUseForReliableDps: false,
    canExposeAsWhatIf: true,
    blockedProofIds: blockedProofs.map((row) => row.id),
    nextRequiredEvidence: [
      "ownership prouve du champ SF_32 ou source nommee pour selector 949",
      "record parent/consommateur ou source build-state fiable pour Mod.SoilRuler_B",
      "uptime explicite, numerique, ou condition utilisateur separee du DPS fiable",
    ],
    assessment: {
      kind: localEvidenceExhausted
        ? "delta-promotion-local-evidence-exhausted"
        : "delta-promotion-blocked-by-proof-gates",
      confidence: "high",
      blocker: "blocked-delta-cleared",
      promotionReady: false,
      finding: localEvidenceExhausted
        ? "Les trois preuves locales du delta 48960 sont bloquees; le scenario reste un what-if non fiable."
        : "Le delta 48960 reste bloque tant que SF_32, SF_33 et l'uptime ne sont pas prouves ensemble.",
      nextAction: localEvidenceExhausted
        ? "Chercher une source externe fiable, un nouveau record parent binaire, ou exposer une hypothese utilisateur separee; ne pas modifier reliableDps."
        : deltaSummary.assessment?.nextAction ?? "Continuer les probes de preuve avant toute promotion.",
    },
  },
  proofs,
  safeguards: [
    "Ne pas additionner le delta 48960 a reliableDps.",
    "Ne pas transformer Mod.SoilRuler_B en toggle utilisateur sans source gameplay.",
    "Ne pas utiliser SF_28/SF_29 comme uptime sans lien direct a la branche boostee.",
    "Garder le scenario visible uniquement en what-if bloque.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-promotion-conclusion.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
