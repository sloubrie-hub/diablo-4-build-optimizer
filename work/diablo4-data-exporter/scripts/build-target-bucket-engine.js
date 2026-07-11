const fs = require("fs");
const path = require("path");

const targetDatasetFile = process.argv[2] ?? "outputs/diablo4-target-dataset/target-dataset.json";
const compositionFile = process.argv[3] ?? "outputs/diablo4-target-build-composition/target-build-composition.json";
const blockerResolutionFile = process.argv[4] ?? "outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json";
const deltaUnblockPlanFile = process.argv[5] ?? "outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json";
const outDir = process.argv[6] ?? "outputs/diablo4-target-bucket-engine";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function round(value) {
  return Math.round(Number(value || 0));
}

function targetEntities(targetDataset) {
  const entities = targetDataset.entities ?? {};
  return Object.values(entities).flat().filter((entity) => entity?.assetId != null);
}

function normalizeModifier(modifier, entity, row = null) {
  const bucket = modifier.bucket ?? "unknown";
  const family = modifier.family ?? bucket;
  const value = Number(modifier.value || 0);
  const isStrict = bucket === "strict-reviewed-dps";
  const isBlocked = bucket === "blocked-candidate" || modifier.operation === "unknown";
  return {
    id: modifier.id ?? null,
    assetId: entity.assetId,
    entityId: entity.id ?? row?.entityId ?? null,
    class: entity.class ?? row?.class ?? "unknown",
    stat: modifier.stat ?? null,
    operation: modifier.operation ?? null,
    bucket,
    family,
    value,
    strictContribution: isStrict ? value : 0,
    reliableContribution: isStrict ? value : 0,
    whatIfContribution: isBlocked ? Math.max(0, value - Number(row?.strictDps || 0)) : 0,
    promotionState: isBlocked ? "blocked-what-if" : isStrict ? "reliable-strict" : "unknown",
    evidence: {
      confidence: modifier.evidence?.confidence ?? null,
      source: modifier.evidence?.source ?? null,
      field: modifier.evidence?.field ?? null,
      notes: modifier.evidence?.notes ?? [],
    },
  };
}

function issueAppliesToRows(issue, rows) {
  const rowAssetIds = new Set(rows.map((row) => Number(row.assetId)));
  return (issue.assetIds ?? []).some((assetId) => rowAssetIds.has(Number(assetId)));
}

function blockerAppliesToRows(blockerAsset, rows) {
  const rowAssetIds = new Set(rows.map((row) => Number(row.assetId)));
  return rowAssetIds.has(Number(blockerAsset.assetId));
}

function classPlanGates(classRows, composition, blockerResolution) {
  const strictBaseDps = round(classRows.reduce((sum, row) => sum + Number(row.strictBaseDps || 0), 0));
  const blockedCandidateDelta = round(classRows.reduce((sum, row) => sum + Number(row.blockedCandidateDelta || 0), 0));
  const scopedIssues = (composition.constraints?.issues ?? [])
    .filter((issue) => issue.kind !== "mixed-hero-classes")
    .filter((issue) => issueAppliesToRows(issue, classRows));
  const classBlockerAssets = (blockerResolution.assets ?? []).filter((asset) => blockerAppliesToRows(asset, classRows));
  const readiness = composition.bucketEngine?.readiness ?? {};
  return [
    {
      id: "class-scope-isolated",
      status: "passed",
      reason: "plan separe par classe",
    },
    {
      id: "strict-base-ready",
      status: strictBaseDps > 0 && classRows.every((row) => Number(row.strictBaseDps || 0) > 0) ? "passed" : "failed",
      reason: strictBaseDps > 0 ? "DPS strict disponible" : "DPS strict absent",
    },
    {
      id: "slot-constraints-proven",
      status: scopedIssues.some((issue) => issue.kind === "slot-data-not-normalized") ? "failed" : "passed",
      reason: scopedIssues.some((issue) => issue.kind === "slot-data-not-normalized") ? "slots non prouves sur au moins un asset" : "aucun blocage slot dans ce plan",
    },
    {
      id: "blocked-delta-cleared",
      status: blockedCandidateDelta === 0 ? "passed" : "failed",
      reason: blockedCandidateDelta === 0 ? "aucun delta conditionnel bloque" : "delta conditionnel exclu du DPS fiable",
    },
    {
      id: "fine-buckets-mapped",
      status: readiness.fineBucketsReady === true ? "passed" : "failed",
      reason: readiness.fineBucketsReady === true ? "buckets fins disponibles" : "buckets fins manquants",
    },
    {
      id: "class-blockers-cleared",
      status: classBlockerAssets.length === 0 ? "passed" : "failed",
      reason: classBlockerAssets.length === 0 ? "aucun blocage global sur ces assets" : "blocages actifs sur au moins un asset",
    },
  ];
}

function classPlanStatus({ strictConstraintValid, reliableOptimizerReady, blockedCandidateDelta }) {
  if (!strictConstraintValid) return "blocked-by-class-constraints";
  if (reliableOptimizerReady) return "reliable-ready";
  if (blockedCandidateDelta > 0) return "strict-loadable-with-blocked-what-if";
  return "strict-loadable-not-reliable";
}

function buildClassPlans(rows, composition, blockerResolution) {
  const groups = new Map();
  for (const row of rows) {
    const className = String(row.class ?? "unknown").toLowerCase();
    if (!groups.has(className)) groups.set(className, []);
    groups.get(className).push(row);
  }
  return Array.from(groups.entries())
    .map(([className, classRows]) => {
      const gates = classPlanGates(classRows, composition, blockerResolution);
      const failedGates = gates.filter((gate) => gate.status !== "passed");
      const blockingConstraintIds = new Set(["slot-constraints-proven"]);
      const strictConstraintValid = !failedGates.some((gate) => blockingConstraintIds.has(gate.id));
      const reliableOptimizerReady = failedGates.length === 0;
      const strictBaseDps = round(classRows.reduce((sum, row) => sum + Number(row.strictBaseDps || 0), 0));
      const blockedCandidateDelta = round(classRows.reduce((sum, row) => sum + Number(row.blockedCandidateDelta || 0), 0));
      return {
        class: className,
        assetIds: classRows.map((row) => row.assetId),
        strictBaseDps,
        blockedCandidateDelta,
        reliableDps: round(classRows.reduce((sum, row) => sum + Number(row.reliableDps || 0), 0)),
        whatIfDps: round(classRows.reduce((sum, row) => sum + Number(row.reliableDps || 0) + Number(row.blockedCandidateDelta || 0), 0)),
        strictConstraintValid,
        canLoadAsWorkingBase: strictConstraintValid,
        reliableOptimizerReady,
        failedGateIds: failedGates.map((gate) => gate.id),
        gates,
        rows: classRows,
        status: classPlanStatus({ strictConstraintValid, reliableOptimizerReady, blockedCandidateDelta }),
      };
    })
    .sort((a, b) => b.reliableDps - a.reliableDps || b.blockedCandidateDelta - a.blockedCandidateDelta);
}

function buildBucketRows(composition, targetDataset) {
  const entitiesByAsset = new Map(targetEntities(targetDataset).map((entity) => [Number(entity.assetId), entity]));
  return (composition.rows ?? []).map((row) => {
    const entity = entitiesByAsset.get(Number(row.assetId)) ?? {};
    const modifiers = (entity.modifiers ?? row.modifiers ?? []).map((modifier) => normalizeModifier(modifier, entity, row));
    const strictModifiers = modifiers.filter((modifier) => modifier.promotionState === "reliable-strict");
    const blockedModifiers = modifiers.filter((modifier) => modifier.promotionState === "blocked-what-if");
    return {
      assetId: row.assetId,
      entityId: row.entityId,
      class: row.class ?? entity.class ?? "unknown",
      strictBaseDps: round(row.strictDps),
      additivePct: Number(row.buckets?.additive ?? 0),
      multiplicativeProduct: Number(row.buckets?.multiplicative ?? 1),
      uptimeProduct: Number(row.buckets?.uptime ?? 1),
      caps: Number(row.buckets?.caps ?? 0),
      reliableDps: round(row.strictDps),
      blockedCandidateDps: row.candidateDps == null ? null : round(row.candidateDps),
      blockedCandidateDelta: round(row.candidateDeltaDps),
      unknown: Number(row.buckets?.unknown ?? 0),
      strictModifiers,
      blockedModifiers,
      status: blockedModifiers.length ? "strict-with-blocked-candidates" : "strict-ready",
    };
  });
}

function buildPromotionGates(composition, blockerResolution, deltaUnblockPlan) {
  const readiness = composition.bucketEngine?.readiness ?? {};
  const constraints = composition.constraints ?? {};
  return [
    {
      id: "strict-base-ready",
      status: readiness.strictOnlyReady === true ? "passed" : "failed",
      evidence: {
        strictBaseDps: composition.buckets?.strictBase ?? 0,
        missingAssets: composition.coverage?.missingAssets ?? null,
      },
    },
    {
      id: "fine-buckets-mapped",
      status: readiness.fineBucketsReady === true ? "passed" : "failed",
      evidence: {
        additive: composition.buckets?.additive ?? 0,
        multiplicative: composition.buckets?.multiplicative ?? 1,
        uptime: composition.buckets?.uptime ?? 1,
        caps: composition.buckets?.caps ?? 0,
      },
    },
    {
      id: "blocked-candidates-cleared",
      status: Number(composition.totals?.blockedCandidates || 0) === 0 ? "passed" : "failed",
      evidence: {
        blockedCandidates: composition.totals?.blockedCandidates ?? 0,
        candidateDelta: composition.totals?.candidateDelta ?? 0,
        deltaPromotionReady: deltaUnblockPlan?.summary?.promotionReady === true,
        deltaBlockedSteps: deltaUnblockPlan?.summary?.blockedSteps ?? null,
      },
    },
    {
      id: "build-constraints-valid",
      status: constraints.valid === true ? "passed" : "failed",
      evidence: {
        issueCount: constraints.summary?.issueCount ?? 0,
        issueKinds: (constraints.issues ?? []).map((issue) => issue.kind),
      },
    },
    {
      id: "global-blockers-cleared",
      status: Number(blockerResolution.summary?.blocked || 0) === 0 ? "passed" : "failed",
      evidence: {
        blocked: blockerResolution.summary?.blocked ?? 0,
        blockers: blockerResolution.summary?.blockers ?? 0,
      },
    },
  ];
}

const targetDataset = readJson(targetDatasetFile);
const composition = readJson(compositionFile);
const blockerResolution = readJson(blockerResolutionFile);
const deltaUnblockPlan = readOptionalJson(deltaUnblockPlanFile);
const bucketRows = buildBucketRows(composition, targetDataset);
const gates = buildPromotionGates(composition, blockerResolution, deltaUnblockPlan);
const failedGates = gates.filter((gate) => gate.status !== "passed");
const classPlans = buildClassPlans(bucketRows, composition, blockerResolution);
const loadableClassPlans = classPlans.filter((plan) => plan.canLoadAsWorkingBase);
const reliableClassPlans = classPlans.filter((plan) => plan.reliableOptimizerReady);
const bestStrictClassPlan = loadableClassPlans
  .slice()
  .sort((a, b) => b.reliableDps - a.reliableDps || b.blockedCandidateDelta - a.blockedCandidateDelta)[0] ?? null;
const bestReliableClassPlan = reliableClassPlans
  .slice()
  .sort((a, b) => b.reliableDps - a.reliableDps)[0] ?? null;
const strictBaseDps = round(bucketRows.reduce((sum, row) => sum + Number(row.strictBaseDps || 0), 0));
const additivePct = Number(composition.buckets?.additive ?? 0);
const multiplicativeProduct = Number(composition.buckets?.multiplicative ?? 1);
const uptimeProduct = Number(composition.buckets?.uptime ?? 1);
const calculatedStrictDps = round(strictBaseDps * (1 + additivePct / 100) * multiplicativeProduct * uptimeProduct);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "target-bucket-engine-v1",
  source: {
    targetDatasetFile,
    compositionFile,
    blockerResolutionFile,
    deltaUnblockPlanFile: deltaUnblockPlan ? deltaUnblockPlanFile : null,
  },
  summary: {
    status: failedGates.length ? "strict-engine-ready-fine-buckets-blocked" : "reliable-engine-ready",
    reliableOptimizerReady: failedGates.length === 0,
    strictOnlyReady: gates.find((gate) => gate.id === "strict-base-ready")?.status === "passed",
    fineBucketsReady: gates.find((gate) => gate.id === "fine-buckets-mapped")?.status === "passed",
    strictBaseDps,
    calculatedStrictDps,
    parityDelta: calculatedStrictDps - round(composition.totals?.strict),
    blockedCandidateDelta: round(composition.totals?.candidateDelta),
    reliableDps: round(composition.totals?.strict),
    whatIfDps: round(composition.totals?.whatIf),
    rows: bucketRows.length,
    classPlans: classPlans.length,
    loadableClassPlans: loadableClassPlans.length,
    reliableClassPlans: reliableClassPlans.length,
    bestStrictClass: bestStrictClassPlan?.class ?? null,
    bestReliableClass: bestReliableClassPlan?.class ?? null,
    failedGates: failedGates.map((gate) => gate.id),
    assessment: {
      kind: failedGates.length ? "bucket-engine-strict-only-ready-fine-buckets-blocked" : "bucket-engine-reliable-ready",
      confidence: "high",
      promotionReady: failedGates.length === 0,
      finding: failedGates.length
        ? "Le moteur de buckets peut reproduire le DPS strict agrege, mais les buckets fins et les candidats conditionnels restent bloques."
        : "Toutes les portes du moteur buckets sont pretes pour un classement fiable.",
      nextAction: failedGates.length
        ? "Extraire des modifiers fins additifs/multiplicatifs/uptime/caps et garder les candidats bloques hors reliableDps."
        : "Utiliser reliableDps pour optimiser sous contraintes.",
    },
  },
  formula: {
    strict: "strictBaseDps * (1 + additivePct / 100) * multiplicativeProduct * uptimeProduct",
    caps: "caps non appliques tant que leur semantique Diablo IV n'est pas prouvee",
    whatIf: "reliableDps + blockedCandidateDelta, expose seulement comme scenario",
  },
  buckets: {
    strictBase: strictBaseDps,
    additivePct,
    multiplicativeProduct,
    uptimeProduct,
    caps: Number(composition.buckets?.caps ?? 0),
    unknown: Number(composition.buckets?.unknown ?? 0),
    blockedCandidateDps: Number(composition.buckets?.blockedCandidate ?? 0),
  },
  gates,
  bucketRows,
  classPlans,
  bestStrictClassPlan,
  bestReliableClassPlan,
  safeguards: [
    "Les valeurs strictes agregees restent l'autorite tant que les buckets fins ne sont pas prouves.",
    "Les candidats conditionnels ne changent jamais reliableDps avant fermeture des preuves SF_32, SF_33 et uptime.",
    "Les probabilites/procs locaux ne deviennent pas uptime sans lien explicite a la branche boostee.",
    "Les caps et conflits de slots restent des portes bloquantes tant que les champs source ne sont pas normalises.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "target-bucket-engine.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
