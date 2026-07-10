const fs = require("fs");
const path = require("path");

const blockerResolutionFile = process.argv[2] ?? "outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json";
const sf32DecisionFile = process.argv[3] ?? "outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json";
const sf33DecisionFile = process.argv[4] ?? "outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json";
const uptimeDecisionFile = process.argv[5] ?? "outputs/diablo4-uptime-neighbor-dependency/uptime-neighbor-dependency.json";
const outDir = process.argv[6] ?? "outputs/diablo4-delta-unblock-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function priorityRank(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] ?? 0;
}

function makeStep({ id, blocker, title, priority, status, proofState, requiredProofs, currentEvidence, nextProbe, promotionGate }) {
  return {
    id,
    blocker,
    title,
    priority,
    status,
    proofState,
    requiredProofs,
    currentEvidence,
    nextProbe,
    promotionGate,
  };
}

const blockerResolution = readJson(blockerResolutionFile);
const sf32Decision = readJson(sf32DecisionFile);
const sf33Decision = readJson(sf33DecisionFile);
const uptimeDecision = readJson(uptimeDecisionFile);

const asset = (blockerResolution.assets ?? []).find((row) => Number(row.assetId) === 1663210) ?? {};
const sf32 = sf32Decision.summary ?? {};
const sf33 = sf33Decision.summary ?? {};
const uptime = uptimeDecision.summary ?? {};
const sf32Assessment = sf32.assessment ?? {};
const sf33Assessment = sf33.assessment ?? {};
const uptimeAssessment = uptime.assessment ?? {};
const scenarioImpact = asset.evidenceSummary?.scenarioImpact ?? {};

const steps = [
  makeStep({
    id: "delta-step-01-sf32-field",
    blocker: "field-level-parser-required",
    title: "Prouver le champ SF_32",
    priority: "high",
    status: sf32.promotionReady ? "ready" : "blocked",
    proofState: sf32Assessment.kind ?? "unknown",
    requiredProofs: [
      "layout selector 949 unique ou variante separee",
      "second compact selector 949 hors asset cible",
      "metadata 12337 / scale 10 specifique au champ",
      "table source nommee ou dictionnaire fiable",
      "liens record/header frais pour l'installation courante",
    ],
    currentEvidence: {
      gatesPassed: sf32Assessment.evidence?.gatesPassed ?? 0,
      gatesFailed: sf32Assessment.evidence?.gatesFailed ?? 0,
      failedGateIds: sf32Assessment.evidence?.failedGateIds ?? [],
      selector949Layouts: sf32Assessment.evidence?.selector949Layouts ?? null,
      secondCompact949Assets: sf32Assessment.evidence?.secondCompact949Assets ?? null,
      localTableCandidates: sf32Assessment.evidence?.independentTableCandidates ?? null,
      compactAnalogyAssessment: sf32Assessment.evidence?.compactAnalogyAssessment ?? null,
      compactAnalogySelectors: sf32Assessment.evidence?.compactAnalogySelectors ?? [],
      compactAnalogyCrossSelector: sf32Assessment.evidence?.compactAnalogyCrossSelector === true,
      tableNumericContextsAssessment: sf32Assessment.evidence?.tableNumericContextsAssessment ?? null,
      tableNumericUsefulContexts: sf32Assessment.evidence?.tableNumericUsefulContexts ?? null,
      tableNumericPotentialSourceContexts: sf32Assessment.evidence?.tableNumericPotentialSourceContexts ?? null,
    },
    nextProbe: "Chercher une preuve compacte externe de selector 949 ou une table source nommee avant toute promotion.",
    promotionGate: "SF_32 peut fournir une valeur fiable seulement si toutes les portes sf32 passent.",
  }),
  makeStep({
    id: "delta-step-02-sf33-trigger",
    blocker: "sf33-trigger-build-state-unmapped",
    title: "Mapper le trigger SF_33",
    priority: "high",
    status: sf33.promotionReady ? "ready" : "blocked",
    proofState: sf33Assessment.kind ?? "unknown",
    requiredProofs: [
      "record parent ou consommateur exact de Mod.SoilRuler_B",
      "source externe ou table build-state nommee",
      "condition utilisateur ou etat de build exploitable",
    ],
    currentEvidence: {
      targetTrigger: sf33.targetTrigger,
      trailerMatchesAll: sf33.modTrailerMatchesAll === true,
      exactNeighborConsumerMatch: sf33.hasExactNeighborConsumerMatch === true,
      externalNameHits: sf33.externalNameHits ?? 0,
      externalTriggerHits: sf33.externalTriggerHits ?? 0,
      powerTagHashAssessment: sf33Assessment.evidence?.powerTagHashAssessment ?? null,
      targetPowerTagHash: sf33Assessment.evidence?.targetPowerTagHash ?? null,
      externalTargetPowerTagContexts: sf33Assessment.evidence?.externalTargetPowerTagContexts ?? null,
      externalDirectTargetHashHits: sf33Assessment.evidence?.externalDirectTargetHashHits ?? null,
    },
    nextProbe: "Elargir la recherche binaire hors texte ou identifier une table build-state de Mod.SoilRuler_B.",
    promotionGate: "SF_33 doit etre mappe a un etat de build prouve avant d'activer la branche boostee.",
  }),
  makeStep({
    id: "delta-step-03-uptime",
    blocker: "uptime-not-proven",
    title: "Prouver ou configurer l'uptime",
    priority: "high",
    status: uptime.promotionReady ? "ready" : "blocked",
    proofState: uptimeAssessment.kind ?? "unknown",
    requiredProofs: [
      "lien explicite entre uptime et branche SF_32/SF_33",
      "valeur numerique d'uptime ou condition utilisateur separee",
      "preuve que SF_28/SF_29 alimentent le scenario booste si elles sont utilisees",
    ],
    currentEvidence: {
      localProbabilityRows: uptime.localProbabilityRows ?? uptime.probabilityNeighbors ?? 0,
      probabilityRowsLinkedToBranch: uptime.probabilityRowsLinkedToBranch ?? uptime.linkedProbabilityNeighbors ?? 0,
      hasExplicitUptime: uptime.hasExplicitUptime === true,
      hasNumericUptime: uptime.hasNumericUptime === true,
      probabilityChainAssessment: uptimeAssessment.evidence?.probabilityChainAssessment ?? null,
      probabilityChains: uptimeAssessment.evidence?.probabilityChains ?? null,
      probabilityChainsLinkedToBoost: uptimeAssessment.evidence?.probabilityChainsLinkedToBoost ?? null,
      probabilityChainsWithAttackSpeedSource: uptimeAssessment.evidence?.probabilityChainsWithAttackSpeedSource ?? null,
    },
    nextProbe: "Garder SF_28/SF_29 hors uptime fiable tant qu'ils ne referencent ni SF_32 ni SF_33.",
    promotionGate: "Un delta DPS fiable exige une uptime prouvee ou une hypothese utilisateur explicitement separee.",
  }),
];

const blockedSteps = steps.filter((step) => step.status !== "ready");
const promotionReady = blockedSteps.length === 0;
const nextStep = blockedSteps.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))[0] ?? null;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-unblock-plan-v1",
  source: {
    blockerResolutionFile,
    sf32DecisionFile,
    sf33DecisionFile,
    uptimeDecisionFile,
  },
  summary: {
    assetId: 1663210,
    entityId: asset.entityId ?? "skill:1663210",
    class: asset.class ?? "spiritborn",
    strictDps: asset.strictDps ?? 163200,
    candidateDps: asset.candidateDps ?? 212160,
    candidateDeltaDps: asset.candidateDeltaDps ?? scenarioImpact.deltaVsStrictDps ?? 48960,
    scenarioId: scenarioImpact.scenarioId ?? "sf33-active-sf32-30pct",
    steps: steps.length,
    blockedSteps: blockedSteps.length,
    readySteps: steps.length - blockedSteps.length,
    promotionReady,
    nextStepId: nextStep?.id ?? null,
    nextStepTitle: nextStep?.title ?? null,
    assessment: {
      kind: promotionReady ? "delta-promotion-ready" : "delta-promotion-blocked-by-proof-gates",
      confidence: "high",
      blocker: promotionReady ? null : "blocked-delta-cleared",
      promotionReady,
      finding: promotionReady
        ? "Toutes les preuves requises sont disponibles pour evaluer la promotion du delta."
        : "Le delta 48960 reste bloque tant que SF_32, SF_33 et l'uptime ne sont pas prouves ensemble.",
      nextAction: nextStep?.nextProbe ?? "Recalculer le DPS fiable avec le delta promu.",
    },
  },
  steps,
  safeguards: [
    "Ne pas promouvoir SF_32 sans champ proprietaire prouve.",
    "Ne pas activer SF_33 sans trigger ou etat de build prouve.",
    "Ne pas convertir SF_28/SF_29 en uptime sans lien direct au scenario booste.",
    "Garder le delta 48960 comme what-if bloque tant que les trois sous-preuves restent incompletes.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-unblock-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
