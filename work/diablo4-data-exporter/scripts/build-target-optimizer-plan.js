const fs = require("fs");
const path = require("path");

const targetDatasetFile = process.argv[2] ?? "outputs/diablo4-target-dataset/target-dataset.json";
const compositionFile = process.argv[3] ?? "outputs/diablo4-target-build-composition/target-build-composition.json";
const blockerResolutionFile = process.argv[4] ?? "outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json";
const outDir = process.argv[5] ?? "outputs/diablo4-target-optimizer-plan";
const aspectSlotReadinessFile = "outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json";
const deltaUnblockPlanFile = "outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json";
const deltaPromotionConclusionFile = "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json";
const targetBucketEngineFile = "outputs/diablo4-target-bucket-engine/target-bucket-engine.json";
const fineBucketExtractionPlanFile = "outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json";
const additiveBucketSourceConclusionFile = "outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json";
const aspectSlotNextSourcePlanFile = "outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json";
const nextEvidenceRoadmapFile = "outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json";
const userWhatIfScenariosFile = "outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json";
const reliableDpsGatesFile = "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const workingBaseContractFile = "outputs/diablo4-working-base-contract/working-base-contract.json";
const targetOptimizerSuiteFile = "outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function allEntities(targetDataset) {
  const entities = targetDataset.entities ?? {};
  return [
    ...(entities.skills ?? []),
    ...(entities.items ?? []),
    ...(entities.affixes ?? []),
    ...(entities.aspects ?? []),
    ...(entities.paragonNodes ?? []),
    ...(entities.glyphs ?? []),
    ...(entities.runes ?? []),
  ].filter((entity) => entity?.assetId != null);
}

function strictDps(entity) {
  return (entity.modifiers ?? [])
    .filter((modifier) => modifier.bucket === "strict-reviewed-dps" && modifier.operation === "add")
    .reduce((sum, modifier) => sum + Number(modifier.value || 0), 0);
}

function roundDps(value) {
  return Math.round(Number(value || 0));
}

function blockedDelta(entity) {
  const strict = strictDps(entity);
  const bestBlocked = Math.max(0, ...(entity.modifiers ?? [])
    .filter((modifier) => modifier.bucket === "blocked-candidate" || modifier.operation === "unknown")
    .map((modifier) => Number(modifier.value || 0)));
  return bestBlocked > strict ? bestBlocked - strict : 0;
}

function normalizeClass(className) {
  return String(className ?? "unknown").trim().toLowerCase() || "unknown";
}

function entityKind(entity) {
  if (String(entity.id ?? "").includes(":")) return String(entity.id).split(":")[0];
  return entity.kind ?? "entity";
}

function isKnownHeroClass(className) {
  return !["unknown", "all", "generic"].includes(normalizeClass(className));
}

function scoreEntity(entity) {
  const strict = strictDps(entity);
  const delta = blockedDelta(entity);
  const blocked = delta > 0;
  return {
    assetId: entity.assetId,
    entityId: entity.id,
    kind: entityKind(entity),
    class: normalizeClass(entity.class),
    name: entity.name ?? entity.label ?? entity.id,
    strictDps: roundDps(strict),
    blockedCandidateDelta: roundDps(delta),
    reliableDps: roundDps(strict),
    whatIfDps: roundDps(strict + delta),
    optimizerStatus: blocked ? "strict-only-candidate-blocked" : "strict-ready",
    evidenceConfidence: (entity.modifiers ?? [])[0]?.evidence?.confidence ?? null,
  };
}

function slotReadinessByAsset(aspectSlotReadiness) {
  return new Map((aspectSlotReadiness?.aspects ?? []).map((aspect) => [Number(aspect.assetId), aspect]));
}

function buildConstraintIssues(className, entities, aspectSlots) {
  const issues = [];
  const entityClasses = Array.from(new Set(entities.map((entity) => entity.class).filter(isKnownHeroClass)));
  if (!isKnownHeroClass(className)) {
    issues.push({
      kind: "hero-class-unknown",
      priority: "high",
      assetIds: entities.map((entity) => entity.assetId),
      reason: "classe de heros non prouvee pour cette recommandation",
      action: "normaliser la classe avant de proposer ce build",
    });
  }
  if (entityClasses.length > 1) {
    issues.push({
      kind: "mixed-hero-classes",
      priority: "high",
      classes: entityClasses,
      assetIds: entities.map((entity) => entity.assetId),
      reason: "la recommandation contient plusieurs classes de heros",
      action: "filtrer les choix sur une seule classe",
    });
  }

  for (const entity of entities) {
    if (entity.kind !== "aspect") continue;
    const readiness = aspectSlots.get(Number(entity.assetId));
    if (!readiness?.assessment?.slotConstraintReady) {
      issues.push({
        kind: "slot-data-not-normalized",
        priority: "medium",
        assetIds: [entity.assetId],
        reason: "slots d'aspect non prouves",
        action: "extraire les slots autorises avant de valider les conflits d'equipement",
        evidence: readiness
          ? {
              assessment: readiness.assessment.kind,
              confidence: readiness.assessment.confidence,
              detectedSlotTokens: readiness.detectedSlotTokens ?? [],
              externalInferredSlots: readiness.evidence?.externalInferredSlots ?? [],
              prefixCandidatesAssessment: readiness.evidence?.prefixCandidatesAssessment ?? null,
              prefixCandidatesUsableProofs: readiness.evidence?.prefixCandidatesUsableProofs ?? null,
              prefixCandidatesHelmCandidates: readiness.evidence?.prefixCandidatesHelmCandidates ?? null,
              blockerConclusionAssessment: readiness.evidence?.blockerConclusionAssessment ?? null,
              existingEvidenceExhausted: readiness.evidence?.existingEvidenceExhausted === true,
              blockerConclusionUsableProofSignals: readiness.evidence?.blockerConclusionUsableProofSignals ?? null,
            }
          : null,
      });
    }
  }

  return issues;
}

function buildReliabilityGates({ className, entities, issues, blockedCandidateDelta, readiness, blockerSummary }) {
  const issueKinds = new Set(issues.map((issue) => issue.kind));
  const entityClasses = Array.from(new Set(entities.map((entity) => entity.class).filter(isKnownHeroClass)));
  const gates = [
    {
      id: "hero-class-known",
      status: isKnownHeroClass(className) ? "passed" : "failed",
      reason: isKnownHeroClass(className) ? "classe de heros connue" : "classe de heros non prouvee",
    },
    {
      id: "single-hero-class",
      status: entityClasses.length <= 1 ? "passed" : "failed",
      reason: entityClasses.length <= 1 ? "une seule classe de heros" : `classes melangees: ${entityClasses.join(", ")}`,
    },
    {
      id: "slot-constraints-proven",
      status: issueKinds.has("slot-data-not-normalized") ? "failed" : "passed",
      reason: issueKinds.has("slot-data-not-normalized") ? "slots d'aspect non prouves" : "contraintes de slots OK pour ce plan",
    },
    {
      id: "blocked-delta-cleared",
      status: blockedCandidateDelta === 0 ? "passed" : "failed",
      reason: blockedCandidateDelta === 0 ? "aucun delta conditionnel bloque" : "delta conditionnel exclu du ranking fiable",
    },
    {
      id: "fine-buckets-ready",
      status: readiness?.fineBucketsReady === true ? "passed" : "failed",
      reason: readiness?.fineBucketsReady === true ? "buckets fins disponibles" : "modifiers fins additifs/multiplicatifs/uptime manquants",
    },
    {
      id: "global-blockers-cleared",
      status: (blockerSummary?.blocked ?? 0) === 0 ? "passed" : "failed",
      reason: (blockerSummary?.blocked ?? 0) === 0 ? "aucun blocage global actif" : `${blockerSummary?.blocked ?? 0} blocage(s) global(aux) actif(s)`,
    },
  ];
  return {
    gates,
    passed: gates.filter((gate) => gate.status === "passed").length,
    failed: gates.filter((gate) => gate.status !== "passed").length,
    failedGateIds: gates.filter((gate) => gate.status !== "passed").map((gate) => gate.id),
  };
}

function buildStrictPlan(row, aspectSlots, readiness, blockerSummary) {
  const entities = row.topStrictChoices;
  const issues = buildConstraintIssues(row.class, entities, aspectSlots);
  const blockedCandidateDelta = roundDps(row.blockedCandidateDelta);
  const strictConstraintValid = issues.length === 0;
  const reliability = buildReliabilityGates({
    className: row.class,
    entities,
    issues,
    blockedCandidateDelta,
    readiness,
    blockerSummary,
  });
  const reliableOptimizerReady = strictConstraintValid && reliability.failed === 0;
  return {
    class: row.class,
    assetIds: entities.map((entity) => entity.assetId),
    strictDps: roundDps(row.strictDps),
    blockedCandidateDelta,
    reliableDps: roundDps(row.strictDps),
    whatIfDps: roundDps(row.strictDps + blockedCandidateDelta),
    strictConstraintValid,
    reliableOptimizerReady,
    status: !strictConstraintValid
      ? "blocked-by-constraints"
      : blockedCandidateDelta > 0
        ? "strict-valid-with-blocked-delta"
        : reliableOptimizerReady
          ? "reliable-ready"
          : "strict-valid-not-reliable",
    reliability,
    optimizerDecision: {
      reliableDps: roundDps(row.strictDps),
      rankingMode: "strict-only",
      canRankAsReliable: reliableOptimizerReady,
      canLoadAsWorkingBase: strictConstraintValid,
      blockedWhatIfDelta: blockedCandidateDelta,
      nextGate: reliability.failedGateIds[0] ?? null,
    },
    constraintSummary: {
      issueCount: issues.length,
      highPriorityIssues: issues.filter((issue) => issue.priority === "high").length,
      mediumPriorityIssues: issues.filter((issue) => issue.priority === "medium").length,
      issueKinds: Array.from(new Set(issues.map((issue) => issue.kind))).sort(),
    },
    issues,
    topStrictChoices: entities,
    note: blockedCandidateDelta
      ? "Le build strict est evalue sans le delta bloque; le what-if reste explicatif."
      : "Le build strict ne depend pas d'un candidat conditionnel bloque.",
  };
}

function actionForGate(gateId, plan, context = {}) {
  const deltaPlan = context.deltaUnblockPlan;
  const deltaConclusion = context.deltaPromotionConclusion;
  const blockerResolution = context.blockerResolution;
  const fineBucketPlan = context.fineBucketExtractionPlan;
  const additiveBucketConclusion = context.additiveBucketSourceConclusion;
  const aspectSlotPlan = context.aspectSlotNextSourcePlan;
  const gateActions = {
    "blocked-delta-cleared": {
      priority: "high",
      focus: "asset:1663210",
      title: "Debloquer le delta conditionnel spiritborn",
      action: "Resoudre SF_32, SF_33 et uptime avant toute promotion du delta 48960.",
      expectedImpact: "Permettre au plan spiritborn de passer du strict-only au candidat fiable si les preuves convergent.",
      subPlan: deltaPlan
        ? {
            mode: deltaPlan.mode,
            file: deltaUnblockPlanFile,
            blockedSteps: deltaPlan.summary?.blockedSteps ?? null,
            readySteps: deltaPlan.summary?.readySteps ?? null,
            nextStepId: deltaPlan.summary?.nextStepId ?? null,
            nextStepTitle: deltaPlan.summary?.nextStepTitle ?? null,
            assessment: deltaPlan.summary?.assessment?.kind ?? null,
            promotionConclusion: deltaConclusion
              ? {
                  file: deltaPromotionConclusionFile,
                  assessment: deltaConclusion.summary?.assessment?.kind ?? null,
                  confidence: deltaConclusion.summary?.assessment?.confidence ?? null,
                  localEvidenceExhausted: deltaConclusion.summary?.localEvidenceExhausted === true,
                  canUseForReliableDps: deltaConclusion.summary?.canUseForReliableDps === true,
                  canExposeAsWhatIf: deltaConclusion.summary?.canExposeAsWhatIf === true,
                  nextAction: deltaConclusion.summary?.assessment?.nextAction ?? null,
                }
              : null,
          }
        : null,
    },
    "slot-constraints-proven": {
      priority: "high",
      focus: "asset:1461593",
      title: "Prouver les slots d'aspect necromancer",
      action: "Trouver un champ source aspect-equipement ou une source externe fiable pour allowedSlots.",
      expectedImpact: "Debloquer le plan necromancer et les futurs conflits d'equipement.",
      subPlan: aspectSlotPlan
        ? {
            mode: aspectSlotPlan.mode,
            file: aspectSlotNextSourcePlanFile,
            blockedSteps: aspectSlotPlan.summary?.blockedSteps ?? null,
            readySteps: aspectSlotPlan.summary?.readySteps ?? null,
            nextStepId: aspectSlotPlan.summary?.nextStepId ?? null,
            nextStepTitle: aspectSlotPlan.summary?.nextStepTitle ?? null,
            assessment: aspectSlotPlan.summary?.assessment?.kind ?? null,
            slotConclusion: {
              file: aspectSlotNextSourcePlanFile,
              confidence: aspectSlotPlan.summary?.assessment?.confidence ?? null,
              localEvidenceExhausted: aspectSlotPlan.summary?.existingEvidenceExhausted === true,
              slotConstraintReady: aspectSlotPlan.summary?.assessment?.slotConstraintReady === true,
              usableProofSignals: aspectSlotPlan.summary?.usableProofSignals ?? null,
              sourceCandidateMatches: aspectSlotPlan.summary?.sourceCandidateMatches ?? null,
              strongStructuralCandidates: aspectSlotPlan.summary?.strongStructuralCandidates ?? null,
              nextAction: aspectSlotPlan.summary?.assessment?.nextAction ?? null,
            },
          }
        : null,
    },
    "fine-buckets-ready": {
      priority: "medium",
      focus: "bucket-engine",
      title: "Alimenter les buckets fins",
      action: "Extraire des modifiers additifs, multiplicatifs, uptime et caps au lieu du seul DPS agrege.",
      expectedImpact: "Preparer le vrai calcul Diablo IV sans changer les garde-fous de promotion.",
      subPlan: fineBucketPlan
        ? {
            mode: fineBucketPlan.mode,
            file: fineBucketExtractionPlanFile,
            blockedSteps: fineBucketPlan.summary?.blockedSteps ?? null,
            readySteps: fineBucketPlan.summary?.readySteps ?? null,
            nextStepId: fineBucketPlan.summary?.nextStepId ?? null,
            nextStepTitle: fineBucketPlan.summary?.nextStepTitle ?? null,
            assessment: fineBucketPlan.summary?.assessment?.kind ?? null,
            sourceConclusion: additiveBucketConclusion
              ? {
                  file: additiveBucketSourceConclusionFile,
                  assessment: additiveBucketConclusion.summary?.assessment?.kind ?? null,
                  confidence: additiveBucketConclusion.summary?.assessment?.confidence ?? null,
                  localEvidenceExhausted: additiveBucketConclusion.summary?.localEvidenceExhausted === true,
                  nextAction: additiveBucketConclusion.summary?.assessment?.nextAction ?? null,
                }
              : null,
          }
        : null,
    },
    "global-blockers-cleared": {
      priority: "medium",
      focus: "target-blocker-resolution",
      title: "Fermer les blocages globaux",
      action: "Resoudre ou expliciter les blocages encore actifs avant de declarer un plan fiable.",
      expectedImpact: "Faire passer reliableStrictBuilds au-dessus de zero lorsque les autres portes sont pretes.",
      subPlan: blockerResolution
        ? {
            mode: blockerResolution.mode,
            file: blockerResolutionFile,
            blockedSteps: blockerResolution.summary?.blocked ?? null,
            readySteps: blockerResolution.summary?.resolved ?? null,
            nextStepId: blockerResolution.assets?.[0]?.blockers?.[0]?.kind ?? null,
            nextStepTitle: deltaConclusion?.summary?.assessment?.nextAction
              ?? blockerResolution.summary?.nextActions?.[0]
              ?? "Fermer les blocages globaux actifs",
            assessment: blockerResolution.summary?.promotionReady === true
              ? "target-blockers-cleared"
              : "target-blockers-active",
            blockerConclusion: {
              assets: blockerResolution.summary?.assets ?? null,
              blockers: blockerResolution.summary?.blockers ?? null,
              promotionReady: blockerResolution.summary?.promotionReady === true,
              deltaConclusionAssessment: deltaConclusion?.summary?.assessment?.kind ?? null,
              deltaLocalEvidenceExhausted: deltaConclusion?.summary?.localEvidenceExhausted === true,
              blockerKinds: Array.from(new Set((blockerResolution.assets ?? [])
                .flatMap((asset) => asset.blockers ?? [])
                .map((blocker) => blocker.kind))).sort(),
              nextActions: blockerResolution.summary?.nextActions ?? [],
            },
          }
        : null,
    },
    "hero-class-known": {
      priority: "medium",
      focus: "target-dataset",
      title: "Normaliser les classes inconnues",
      action: "Mapper les entites unknown/generic vers une classe prouvee ou les exclure du ranking classe.",
      expectedImpact: "Eviter les plans ambigus par classe.",
    },
    "single-hero-class": {
      priority: "high",
      focus: "build-constraints",
      title: "Eviter les builds multi-classes",
      action: "Filtrer les compositions automatiques sur une seule classe de heros.",
      expectedImpact: "Garantir que les builds proposes sont jouables.",
    },
  };
  const template = gateActions[gateId] ?? {
    priority: "low",
    focus: "optimizer",
    title: `Resoudre ${gateId}`,
    action: "Analyser cette porte de fiabilite avant ranking fiable.",
    expectedImpact: "Reduire l'incertitude du plan.",
  };
  return {
    gateId,
    class: plan.class,
    assetIds: plan.assetIds,
    ...template,
  };
}

function priorityRank(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] ?? 0;
}

function buildActionQueue(plans, context = {}) {
  const actions = [];
  for (const plan of plans) {
    const failedGateIds = plan.reliability?.failedGateIds ?? [];
    for (const gateId of failedGateIds) actions.push(actionForGate(gateId, plan, context));
  }
  const deduped = Array.from(new Map(actions.map((action) => [
    `${action.gateId}:${action.focus}`,
    {
      ...action,
      classes: Array.from(new Set(actions
        .filter((candidate) => candidate.gateId === action.gateId && candidate.focus === action.focus)
        .map((candidate) => candidate.class))).sort(),
      assetIds: Array.from(new Set(actions
        .filter((candidate) => candidate.gateId === action.gateId && candidate.focus === action.focus)
        .flatMap((candidate) => candidate.assetIds))).sort((a, b) => a - b),
    },
  ])).values());
  return deduped
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || a.gateId.localeCompare(b.gateId))
    .map((action, index) => ({
      id: `optimizer-action-${String(index + 1).padStart(2, "0")}`,
      rank: index + 1,
      ...action,
    }));
}

function groupBy(values, keyFn) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFn(value);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }
  return groups;
}

const targetDataset = readJson(targetDatasetFile);
const composition = readJson(compositionFile);
const blockerResolution = readJson(blockerResolutionFile);
const aspectSlotReadiness = readOptionalJson(aspectSlotReadinessFile);
const deltaUnblockPlan = readOptionalJson(deltaUnblockPlanFile);
const deltaPromotionConclusion = readOptionalJson(deltaPromotionConclusionFile);
const targetBucketEngine = readOptionalJson(targetBucketEngineFile);
const fineBucketExtractionPlan = readOptionalJson(fineBucketExtractionPlanFile);
const additiveBucketSourceConclusion = readOptionalJson(additiveBucketSourceConclusionFile);
const aspectSlotNextSourcePlan = readOptionalJson(aspectSlotNextSourcePlanFile);
const nextEvidenceRoadmap = readOptionalJson(nextEvidenceRoadmapFile);
const userWhatIfScenarios = readOptionalJson(userWhatIfScenariosFile);
const reliableDpsGates = readOptionalJson(reliableDpsGatesFile);
const workingBaseContract = readOptionalJson(workingBaseContractFile);
const targetOptimizerSuite = readOptionalJson(targetOptimizerSuiteFile);
const aspectSlots = slotReadinessByAsset(aspectSlotReadiness);
const scored = allEntities(targetDataset)
  .map(scoreEntity)
  .filter((entity) => entity.strictDps > 0 || entity.blockedCandidateDelta > 0)
  .sort((a, b) => b.reliableDps - a.reliableDps || b.blockedCandidateDelta - a.blockedCandidateDelta);
const byClass = Array.from(groupBy(scored, (entity) => entity.class).entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([className, entities]) => ({
    class: className,
    strictDps: roundDps(entities.reduce((sum, entity) => sum + entity.reliableDps, 0)),
    blockedCandidateDelta: roundDps(entities.reduce((sum, entity) => sum + entity.blockedCandidateDelta, 0)),
    optimizerReady: entities.length > 0 && !composition.bucketEngine?.readiness?.reliableOptimizerReady ? false : true,
    topStrictChoices: entities.slice(0, 5),
  }));

const currentBuild = {
  assetIds: composition.input?.assetIds ?? [],
  strictDps: composition.totals?.strict ?? 0,
  whatIfDps: composition.totals?.whatIf ?? 0,
  candidateDelta: composition.totals?.candidateDelta ?? 0,
  quality: composition.quality ?? null,
  constraints: composition.constraints ?? null,
  readiness: composition.bucketEngine?.readiness ?? null,
  blockers: blockerResolution.summary ?? null,
};

const recommendedStrictByClass = byClass
  .filter((row) => isKnownHeroClass(row.class))
  .map((row) => buildStrictPlan(row, aspectSlots, composition.bucketEngine?.readiness ?? null, blockerResolution.summary ?? null));

const validStrictBuilds = recommendedStrictByClass.filter((row) => row.strictConstraintValid);
const reliableStrictBuilds = recommendedStrictByClass.filter((row) => row.reliableOptimizerReady);
const actionQueue = buildActionQueue(recommendedStrictByClass, {
  blockerResolution,
  deltaUnblockPlan,
  deltaPromotionConclusion,
  fineBucketExtractionPlan,
  additiveBucketSourceConclusion,
  aspectSlotNextSourcePlan,
});

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "target-optimizer-plan-v1",
  source: {
    targetDatasetFile,
    compositionFile,
    blockerResolutionFile,
    aspectSlotReadinessFile: aspectSlotReadiness ? aspectSlotReadinessFile : null,
    deltaUnblockPlanFile: deltaUnblockPlan ? deltaUnblockPlanFile : null,
    deltaPromotionConclusionFile: deltaPromotionConclusion ? deltaPromotionConclusionFile : null,
    targetBucketEngineFile: targetBucketEngine ? targetBucketEngineFile : null,
    fineBucketExtractionPlanFile: fineBucketExtractionPlan ? fineBucketExtractionPlanFile : null,
    additiveBucketSourceConclusionFile: additiveBucketSourceConclusion ? additiveBucketSourceConclusionFile : null,
    aspectSlotNextSourcePlanFile: aspectSlotNextSourcePlan ? aspectSlotNextSourcePlanFile : null,
    nextEvidenceRoadmapFile: nextEvidenceRoadmap ? nextEvidenceRoadmapFile : null,
    userWhatIfScenariosFile: userWhatIfScenarios ? userWhatIfScenariosFile : null,
    reliableDpsGatesFile: reliableDpsGates ? reliableDpsGatesFile : null,
    workingBaseContractFile: workingBaseContract ? workingBaseContractFile : null,
    targetOptimizerSuiteFile: targetOptimizerSuite ? targetOptimizerSuiteFile : null,
  },
  summary: {
    scoredEntities: scored.length,
    classes: byClass.length,
    reliableOptimizerReady: targetBucketEngine?.summary?.reliableOptimizerReady === true || composition.bucketEngine?.readiness?.reliableOptimizerReady === true,
    currentBuildValid: composition.constraints?.valid === true,
    strictOnlyReady: targetBucketEngine?.summary?.strictOnlyReady === true || composition.bucketEngine?.readiness?.strictOnlyReady === true,
    fineBucketsReady: targetBucketEngine?.summary?.fineBucketsReady === true || composition.bucketEngine?.readiness?.fineBucketsReady === true,
    blockedCandidates: composition.totals?.blockedCandidates ?? 0,
    constrainedPlans: recommendedStrictByClass.length,
    validStrictBuilds: validStrictBuilds.length,
    reliableStrictBuilds: reliableStrictBuilds.length,
    reliabilityGateFailures: Array.from(new Set(recommendedStrictByClass.flatMap((row) => row.reliability?.failedGateIds ?? []))).sort(),
    actionQueueSize: actionQueue.length,
    topAction: actionQueue[0]?.title ?? null,
    recommendation: "strict-only-class-constrained-plan",
    promotionReady: false,
    nextAction: "Utiliser le meilleur build strict valide comme base de travail, puis debloquer slots et deltas conditionnels avant toute optimisation fiable.",
  },
  currentBuild,
  deltaUnblockPlan: deltaUnblockPlan
    ? {
        file: deltaUnblockPlanFile,
        summary: deltaUnblockPlan.summary,
      }
    : null,
  deltaPromotionConclusion: deltaPromotionConclusion
    ? {
        file: deltaPromotionConclusionFile,
        summary: deltaPromotionConclusion.summary,
      }
    : null,
  targetBucketEngine: targetBucketEngine
    ? {
        file: targetBucketEngineFile,
        summary: targetBucketEngine.summary,
        buckets: targetBucketEngine.buckets,
        gates: targetBucketEngine.gates,
        classPlans: targetBucketEngine.classPlans,
        bestStrictClassPlan: targetBucketEngine.bestStrictClassPlan,
        bestReliableClassPlan: targetBucketEngine.bestReliableClassPlan,
      }
    : null,
  fineBucketExtractionPlan: fineBucketExtractionPlan
    ? {
        file: fineBucketExtractionPlanFile,
        summary: fineBucketExtractionPlan.summary,
      }
    : null,
  additiveBucketSourceConclusion: additiveBucketSourceConclusion
    ? {
        file: additiveBucketSourceConclusionFile,
        summary: additiveBucketSourceConclusion.summary,
      }
    : null,
  aspectSlotNextSourcePlan: aspectSlotNextSourcePlan
    ? {
        file: aspectSlotNextSourcePlanFile,
        summary: aspectSlotNextSourcePlan.summary,
      }
    : null,
  nextEvidenceRoadmap: nextEvidenceRoadmap
    ? {
        file: nextEvidenceRoadmapFile,
        summary: nextEvidenceRoadmap.summary,
        roadmap: nextEvidenceRoadmap.roadmap,
      }
    : null,
  userWhatIfScenarios: userWhatIfScenarios
    ? {
        file: userWhatIfScenariosFile,
        summary: userWhatIfScenarios.summary,
        scenarios: userWhatIfScenarios.scenarios,
      }
    : null,
  reliableDpsGates: reliableDpsGates
    ? {
        file: reliableDpsGatesFile,
        summary: reliableDpsGates.summary,
        gates: reliableDpsGates.gates,
        policy: reliableDpsGates.policy,
      }
    : null,
  workingBaseContract: workingBaseContract
    ? {
        file: workingBaseContractFile,
        summary: workingBaseContract.summary,
        workingBase: workingBaseContract.workingBase,
        reliableDpsPolicy: workingBaseContract.reliableDpsPolicy,
        nextEvidence: workingBaseContract.nextEvidence,
        safeguards: workingBaseContract.safeguards,
      }
    : null,
  targetOptimizerSuite: targetOptimizerSuite
    ? {
        file: targetOptimizerSuiteFile,
        summary: targetOptimizerSuite.summary,
        steps: targetOptimizerSuite.steps,
        invariants: targetOptimizerSuite.invariants,
      }
    : null,
  byClass,
  recommendedStrictByClass,
  actionQueue,
  bestValidStrictBuild: validStrictBuilds
    .sort((a, b) => b.reliableDps - a.reliableDps || b.blockedCandidateDelta - a.blockedCandidateDelta)[0] ?? null,
  bestReliableStrictBuild: reliableStrictBuilds
    .sort((a, b) => b.reliableDps - a.reliableDps)[0] ?? null,
  safeguards: [
    "Le classement reliableDps utilise uniquement strictDps.",
    "Les deltas bloques restent visibles mais exclus du score fiable.",
    "Les builds mixtes de classes ne sont pas proposes comme optimisation valide.",
    "Les slots/conflits/uniques restent bloquants tant que leurs donnees ne sont pas normalisees.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "target-optimizer-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
