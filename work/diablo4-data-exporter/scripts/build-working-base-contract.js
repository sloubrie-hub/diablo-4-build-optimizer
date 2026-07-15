const fs = require("fs");
const path = require("path");

const inputs = {
  targetBucketEngine: process.argv[2] ?? "outputs/diablo4-target-bucket-engine/target-bucket-engine.json",
  reliableDpsGates: process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  nextEvidenceRoadmap: process.argv[4] ?? "outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json",
  currentPowerSourceFreshnessAudit: "outputs/diablo4-current-power-source-freshness-audit/current-power-source-freshness-audit.json",
};
const outDir = process.argv[5] ?? "outputs/diablo4-working-base-contract";

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function gateStatus(plan, id) {
  return (plan?.gates ?? []).find((gate) => gate.id === id)?.status ?? "missing";
}

const bucketEngine = readOptionalJson(inputs.targetBucketEngine);
const reliableDpsGates = readOptionalJson(inputs.reliableDpsGates);
const nextEvidenceRoadmap = readOptionalJson(inputs.nextEvidenceRoadmap);
const currentPowerSourceFreshnessAudit = readOptionalJson(inputs.currentPowerSourceFreshnessAudit);
const base = bucketEngine?.bestStrictClassPlan ?? null;
const baseAssetIds = base?.assetIds ?? [];
const sourceAuditApplies = baseAssetIds.some((assetId) => Number(assetId) === Number(currentPowerSourceFreshnessAudit?.summary?.assetId ?? 1663210));
const sourceModelFresh = !sourceAuditApplies || currentPowerSourceFreshnessAudit?.summary?.currentModelReady === true;
const failedGateIds = [
  ...(!sourceModelFresh ? ["current-source-model-fresh"] : []),
  ...(base?.failedGateIds ?? []),
];
const roadmapActions = nextEvidenceRoadmap?.roadmap ?? [];
const reliableGateSummary = reliableDpsGates?.summary ?? {};
const canLoadAsWorkingBase = base?.canLoadAsWorkingBase === true && sourceModelFresh;

const contract = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "working-base-contract-v1",
  source: inputs,
  summary: {
    hasWorkingBase: Boolean(base),
    class: base?.class ?? null,
    assetIds: baseAssetIds,
    strictDps: base?.reliableDps ?? 0,
    blockedDeltaDps: base?.blockedCandidateDelta ?? 0,
    whatIfDps: base?.whatIfDps ?? base?.reliableDps ?? 0,
    currentStrictDps: sourceModelFresh ? base?.reliableDps ?? 0 : null,
    dpsScope: sourceModelFresh ? "current-source" : "historical-reference",
    sourceModelFresh,
    sourceBuild: currentPowerSourceFreshnessAudit?.summary?.currentBuild ?? null,
    status: !base
      ? "no-working-base"
      : sourceModelFresh
        ? base.status
        : "historical-source-refresh-required",
    canLoadAsWorkingBase,
    reliableOptimizerReady: base?.reliableOptimizerReady === true && sourceModelFresh,
    failedGateIds,
    allowedActions: [
      ...(canLoadAsWorkingBase ? ["charger cette base stricte mono-classe"] : ["consulter cette base comme reference historique"]),
      "activer un scenario utilisateur what-if separe",
      "inspecter les preuves et blocages sans modifier reliableDps",
      "ajouter des assets de meme classe seulement apres validation des contraintes",
    ],
    forbiddenActions: [
      "utiliser le build mixte de reference comme recommandation optimisable",
      "ajouter le delta bloque au ranking fiable",
      "promouvoir SF_32, SF_33 ou uptime sans preuve source",
      "valider un plan necromancer tant que les slots de 1461593 restent bloques",
      ...(!sourceModelFresh ? ["charger ou classer les DPS historiques comme valeurs de la version locale"] : []),
    ],
    nextGate: failedGateIds[0] ?? null,
    assessment: {
      kind: !base
        ? "working-base-missing"
        : sourceModelFresh
          ? "working-base-strict-loadable"
          : "working-base-historical-source-refresh-required",
      confidence: "high",
      promotionReady: base?.reliableOptimizerReady === true && sourceModelFresh,
      finding: base && !sourceModelFresh
        ? `La base ${base.class} est historique et ne peut pas etre chargee pour ${currentPowerSourceFreshnessAudit?.summary?.currentBuild ?? "la version locale"}.`
        : base
          ? `La base ${base.class} est chargeable en strict, mais pas fiable complete.`
        : "Aucune base stricte chargeable n'est disponible.",
      nextAction: !sourceModelFresh
        ? "Recalculer le modele depuis le payload actif avant de reouvrir le chargement."
        : failedGateIds.includes("blocked-delta-cleared")
        ? "Garder le delta en what-if utilisateur ou chercher une source externe fiable pour SF_32/SF_33/uptime."
        : roadmapActions[0]?.title ?? "Continuer les preuves avant optimisation fiable.",
    },
  },
  workingBase: base
    ? {
        class: base.class,
        assetIds: baseAssetIds,
        strictDps: base.reliableDps,
        currentStrictDps: sourceModelFresh ? base.reliableDps : null,
        dpsScope: sourceModelFresh ? "current-source" : "historical-reference",
        blockedDeltaDps: base.blockedCandidateDelta,
        whatIfDps: base.whatIfDps,
        gates: base.gates,
        gateSummary: {
          classScopeIsolated: gateStatus(base, "class-scope-isolated"),
          strictBaseReady: gateStatus(base, "strict-base-ready"),
          slotConstraintsProven: gateStatus(base, "slot-constraints-proven"),
          blockedDeltaCleared: gateStatus(base, "blocked-delta-cleared"),
          fineBucketsMapped: gateStatus(base, "fine-buckets-mapped"),
          classBlockersCleared: gateStatus(base, "class-blockers-cleared"),
          currentSourceModelFresh: sourceModelFresh ? "passed" : "failed",
        },
      }
    : null,
  reliableDpsPolicy: {
    reliableRankingUses: "strictDps",
    reliableDps: base?.reliableDps ?? 0,
    whatIfOnlyDps: reliableGateSummary.whatIfOnlyDps ?? base?.whatIfDps ?? 0,
    canUseForReliableDps: reliableGateSummary.canUseForReliableDps === true && sourceModelFresh,
    canUseForUserWhatIf: reliableGateSummary.canUseForUserWhatIf === true && sourceModelFresh,
    canUseForCurrentBuild: sourceModelFresh,
    blockedProofs: reliableGateSummary.failedGateIds ?? [],
  },
  nextEvidence: roadmapActions.map((action) => ({
    id: action.id,
    priority: action.priority,
    title: action.title,
    domains: action.domains,
  })),
  safeguards: [
    "La base chargeable n'est pas une recommandation finale fiable.",
    "Le what-if utilisateur reste hors reliableDps.",
    "Le total global mixte reste reserve aux regressions techniques.",
    "Les portes par classe doivent rester visibles dans le site.",
    "Une base issue d'un payload remplace reste historique jusqu'au recalcul du modele.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "working-base-contract.json");
fs.writeFileSync(outFile, JSON.stringify(contract, null, 2));
console.log(JSON.stringify({ outFile, summary: contract.summary }, null, 2));
