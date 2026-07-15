const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const inputs = {
  sourceFreshnessAudit: process.argv[2] ?? "outputs/diablo4-current-power-source-freshness-audit/current-power-source-freshness-audit.json",
  formulaGraph: process.argv[3] ?? "outputs/diablo4-current-power-formula-graph/current-power-formula-graph.json",
  activeBinaryRoot: process.argv[4] ?? "outputs/diablo4-current-casc-3.1.1",
  activeParsedRoot: process.argv[5] ?? "outputs/tools/source-cache/DiabloTools-d4data/data-local-3.1.1",
  referenceParsedRoot: process.argv[6] ?? "outputs/tools/source-cache/DiabloTools-d4data/json",
  referenceText: process.argv[7] ?? "outputs/tools/source-cache/DiabloTools-d4data/json/enUS_Text/meta/StringList/Power_Spiritborn_Centipede_Ultimate.stl.json",
  outDir: process.argv[8] ?? "outputs/diablo4-current-power-activation-graph",
};

const resourceSpecs = [
  { id: "parent-power", role: "parent-power", relativePath: "base/meta/Power/Spiritborn_Centipede_Ultimate.pow" },
  { id: "spawn-power", role: "pet-spawn-power", relativePath: "base/meta/Power/Spiritborn_CentipedeRuler_Spawn.pow" },
  { id: "projectile-power", role: "pet-runtime-damage-power", relativePath: "base/meta/Power/Spiritborn_CentipedeRuler_ProjectileAttack.pow" },
  { id: "breath-power", role: "pet-runtime-damage-power", relativePath: "base/meta/Power/Spiritborn_CentipedeRuler_BreathAttack.pow" },
  { id: "pet-actor", role: "pet-actor", relativePath: "base/meta/Actor/Spiritborn_CentipedeRulerHead.acr" },
  { id: "pet-animset", role: "pet-power-animation-map", relativePath: "base/meta/AnimSet/Spiritborn_CentipedeRuler_Base.ans" },
  { id: "spawn-animation", role: "pet-animation", relativePath: "base/meta/Anim/ruler_centipede_ult_spawn.ani" },
  { id: "projectile-animation", role: "pet-attack-animation", relativePath: "base/meta/Anim/ruler_centipede_ult_attk_projectile.ani" },
  { id: "breath-animation", role: "pet-attack-animation", relativePath: "base/meta/Anim/ruler_centipede_ult_attk_line.ani" },
  { id: "cast-effect", role: "visual-effect-chain", relativePath: "base/meta/EffectGroup/spi_centipedeUlt_cast_player.efg" },
  { id: "poison-upgrade-effect", role: "conditional-effect-chain", relativePath: "base/meta/EffectGroup/spi_centipedeUlt_pet_lobImpact_persistent.efg" },
  { id: "storm-upgrade-effect", role: "conditional-effect-chain", relativePath: "base/meta/EffectGroup/devourerer_C_variant_storm.efg" },
  { id: "projectile-effect", role: "attack-effect-chain", relativePath: "base/meta/EffectGroup/spi_centipedeUlt_pet_lobProjectile_cast.efg" },
  { id: "breath-effect", role: "attack-effect-chain", relativePath: "base/meta/EffectGroup/spi_centipedeUlt_pet_lineBreath_cast.efg" },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeSemantic(value) {
  if (Array.isArray(value)) return value.map(normalizeSemantic);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== "__fileName__")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, normalizeSemantic(child)]));
  }
  return value;
}

function semanticHash(value) {
  return sha256(JSON.stringify(normalizeSemantic(value)));
}

function symbolicHash(value) {
  let hash = 0;
  for (const character of String(value).toLowerCase()) {
    hash = (((hash << 5) + hash) + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function formulaValue(power, slot) {
  return power.ptScriptFormulas?.[slot]?.tFormula?.value ?? null;
}

function parentFormulaReference(expression) {
  const match = String(expression ?? "").match(/PowerTag\.Spiritborn_Centipede_Ultimate\."Script Formula ([0-9]+)"/);
  return match ? Number(match[1]) : null;
}

function referenceTarget(value) {
  if (!value) return null;
  return {
    snoId: value.__raw__ ?? null,
    group: value.groupName ?? value.__group__ ?? null,
    name: value.name ?? null,
    targetFile: value.__targetFileName__ ?? null,
  };
}

function loadResource(spec) {
  const activeBinaryPath = path.join(inputs.activeBinaryRoot, spec.relativePath);
  const activeParsedPath = path.join(inputs.activeParsedRoot, `${spec.relativePath}.json`);
  const referenceParsedPath = path.join(inputs.referenceParsedRoot, `${spec.relativePath}.json`);
  const activeParsed = readJson(activeParsedPath);
  const referenceParsed = readJson(referenceParsedPath);
  const activeSemanticHash = semanticHash(activeParsed);
  const referenceSemanticHash = semanticHash(referenceParsed);
  const activeBinary = fs.readFileSync(activeBinaryPath);

  return {
    spec,
    activeParsed,
    referenceParsed,
    evidence: {
      id: spec.id,
      role: spec.role,
      relativePath: spec.relativePath,
      snoId: Number(activeParsed.__snoID__),
      parsedType: activeParsed.__type__ ?? null,
      activeBinary: {
        path: activeBinaryPath,
        size: activeBinary.length,
        sha256: sha256(activeBinary),
      },
      activeParsedPath,
      referenceParsedPath,
      activeSemanticHash,
      referenceSemanticHash,
      semanticParity: activeSemanticHash === referenceSemanticHash,
      confidence: activeSemanticHash === referenceSemanticHash ? "high" : "blocked",
    },
  };
}

function animationTiming(animation) {
  const permutation = animation.ptPermutations?.[0] ?? null;
  const frameRate = Number(permutation?.flFrameRate ?? 0);
  const keyframes = Number(permutation?.nKeyframeCount ?? 0);
  const contactFrames = (permutation?.arContactFrames ?? [])
    .map((contact) => Number(contact.nFrameNumber))
    .filter((frame) => frame >= 0);
  return {
    animationSnoId: Number(animation.__snoID__),
    frameRate,
    keyframes,
    nominalFrameSpanSeconds: frameRate > 0 ? keyframes / frameRate : null,
    contactFrames,
    nominalContactSeconds: frameRate > 0 ? contactFrames.map((frame) => frame / frameRate) : [],
    interruptFrames: permutation?.arInterruptFrames ?? [],
    attackEffectGroup: referenceTarget(permutation?.snoEffectGroup),
    timingStatus: "nominal-animation-timing-not-runtime-cadence",
  };
}

function powerAnimationEntry(animSet, powerSnoId) {
  const entry = (animSet.ptPowerEntryList ?? [])
    .find((candidate) => Number(candidate.snoPower?.__raw__) === Number(powerSnoId));
  return entry ? {
    power: referenceTarget(entry.snoPower),
    animation: referenceTarget(entry.snoAnim),
  } : null;
}

function runtimePayloadLink(childPower, parentSlot, payloadId) {
  const formulaSlot = (childPower.ptScriptFormulas ?? [])
    .findIndex((formula) => parentFormulaReference(formula?.tFormula?.value) === parentSlot);
  const payloadIndex = (childPower.arPayloads ?? [])
    .findIndex((payload) => Number(payload.dwPayloadId) === Number(payloadId)
      && String(payload.tDamage?.tHitpointScalar?.value ?? "").includes(`SF_${formulaSlot}`));
  const payload = childPower.arPayloads?.[payloadIndex] ?? null;
  return {
    childPowerSnoId: Number(childPower.__snoID__),
    childFormulaSlot: formulaSlot >= 0 ? `SF_${formulaSlot}` : null,
    parentFormulaSlot: `SF_${parentSlot}`,
    childFormulaExpression: formulaSlot >= 0 ? formulaValue(childPower, formulaSlot) : null,
    childPayloadIndex: payloadIndex >= 0 ? payloadIndex : null,
    childPayloadId: payload?.dwPayloadId ?? null,
    childPayloadHash: payload?.dwID ?? null,
    childDamageExpression: payload?.tDamage?.tHitpointScalar?.value ?? null,
    classBaseDamageScalar: payload?.eClassBaseDamageScalar ?? null,
    linked: formulaSlot >= 0 && payloadIndex >= 0,
  };
}

const freshness = readJson(inputs.sourceFreshnessAudit);
const formulaGraph = readJson(inputs.formulaGraph);
const referenceText = readJson(inputs.referenceText);
const loadedResources = resourceSpecs.map(loadResource);
const byId = new Map(loadedResources.map((resource) => [resource.spec.id, resource]));
const parent = byId.get("parent-power").activeParsed;
const spawnPower = byId.get("spawn-power").activeParsed;
const projectilePower = byId.get("projectile-power").activeParsed;
const breathPower = byId.get("breath-power").activeParsed;
const actor = byId.get("pet-actor").activeParsed;
const animSet = byId.get("pet-animset").activeParsed;
const spawnAnimation = byId.get("spawn-animation").activeParsed;
const projectileAnimation = byId.get("projectile-animation").activeParsed;
const breathAnimation = byId.get("breath-animation").activeParsed;

const stringByLabel = new Map((referenceText.arStrings ?? []).map((entry) => [entry.szLabel, entry.szText]));
const symbolicDefinitions = [
  { symbol: "SPIT_PAYLOAD_TOOLTIP", kind: "payload" },
  { symbol: "SPIT_PAYLOAD_B_TOOLTIP", kind: "payload" },
  { symbol: "PROJ_PAYLOAD_TOOLTIP", kind: "payload" },
  { symbol: "UPGRADE_POISON_DOT", kind: "buff" },
  { symbol: "UPGRADE_C_DOT", kind: "buff" },
  { symbol: "ULT_TIMER", kind: "buff" },
].map((definition) => {
  const hash = symbolicHash(definition.symbol);
  const collection = definition.kind === "payload" ? parent.arPayloads ?? [] : parent.arBuffs ?? [];
  const index = collection.findIndex((entry) => Number(entry.dwID) === hash);
  return {
    ...definition,
    hash,
    currentIndex: index >= 0 ? index : null,
    currentDefinitionFound: index >= 0,
  };
});
const symbolicByName = new Map(symbolicDefinitions.map((definition) => [definition.symbol, definition]));

function parentPayload(symbol) {
  const definition = symbolicByName.get(symbol);
  return definition?.currentIndex == null ? null : parent.arPayloads[definition.currentIndex];
}

function parentBuff(symbol) {
  const definition = symbolicByName.get(symbol);
  return definition?.currentIndex == null ? null : parent.arBuffs[definition.currentIndex];
}

function parentPayloadEvidence(symbol) {
  const definition = symbolicByName.get(symbol);
  const payload = parentPayload(symbol);
  return {
    consumerId: definition?.currentIndex == null ? null : `payload:${definition.currentIndex}`,
    symbolicName: symbol,
    symbolicHash: definition?.hash ?? null,
    parentPayloadIndex: definition?.currentIndex ?? null,
    parentPayloadId: payload?.dwPayloadId ?? null,
    damageExpression: payload?.tDamage?.tHitpointScalar?.value ?? null,
    classBaseDamageScalar: payload?.eClassBaseDamageScalar ?? null,
  };
}

function parentBuffEvidence(symbol) {
  const definition = symbolicByName.get(symbol);
  const buff = parentBuff(symbol);
  return {
    consumerId: definition?.currentIndex == null ? null : `buff-dot:${definition.currentIndex}`,
    symbolicName: symbol,
    symbolicHash: definition?.hash ?? null,
    parentBuffIndex: definition?.currentIndex ?? null,
    parentBuffId: buff?.dwBuffId ?? null,
    durationExpression: buff?.tDuration?.value ?? null,
    damageExpression: buff?.tDOT?.tDamage?.tHitpointScalar?.value ?? null,
    classBaseDamageScalar: buff?.tDOT?.eClassBaseDamageScalar ?? null,
  };
}

const modById = new Map((parent.arMods ?? []).map((mod, index) => [Number(mod.dwModId), { ...mod, index }]));
const conditionalByNameHash = new Map((parent.arConditionalDependencies ?? [])
  .map((dependency) => [Number(dependency.tName), dependency]));

function modEvidence(modId, buildStateSlot, referenceLabel) {
  const mod = modById.get(modId) ?? null;
  const dependency = mod ? conditionalByNameHash.get(Number(mod.szName)) ?? null : null;
  return {
    modId,
    powerModIndex: mod?.index ?? null,
    modNameHash: mod?.szName ?? null,
    buildStateSlot,
    buildStateExpression: buildStateSlot ? formulaValue(parent, Number(buildStateSlot.slice(3))) : null,
    referenceName: stringByLabel.get(`Mod${modId}_Name`) ?? null,
    referenceDescriptionLabel: referenceLabel,
    conditionalDependencies: (dependency?.snoDependencies ?? []).map(referenceTarget),
    conditionTypes: (dependency?.arConditions ?? []).map((condition) => condition.__type__),
    runtimeBranchStatus: dependency
      ? "conditional-resource-linked-runtime-damage-schedule-unmapped"
      : "reference-condition-linked-runtime-branch-unmapped",
  };
}

const timings = {
  spawn: animationTiming(spawnAnimation),
  projectile: animationTiming(projectileAnimation),
  breath: animationTiming(breathAnimation),
};
const animationMappings = {
  spawn: powerAnimationEntry(animSet, spawnPower.__snoID__),
  projectile: powerAnimationEntry(animSet, projectilePower.__snoID__),
  breath: powerAnimationEntry(animSet, breathPower.__snoID__),
};

const activationChains = [
  {
    id: "default-breath",
    kind: "runtime-attack",
    parent: parentPayloadEvidence("SPIT_PAYLOAD_TOOLTIP"),
    runtime: runtimePayloadLink(breathPower, 13, 0),
    animation: { ...animationMappings.breath, ...timings.breath },
    condition: { kind: "baseline-description", status: "visible-default-attack-ai-schedule-unmapped" },
    aggregateStatus: "parent-x4-aggregate-proven-runtime-event-count-unproven",
    strictEligibility: "blocked-until-ai-schedule-hit-count-and-table-values-proven",
  },
  {
    id: "blast-of-bile-breath",
    kind: "conditional-runtime-attack",
    parent: parentPayloadEvidence("SPIT_PAYLOAD_B_TOOLTIP"),
    runtime: runtimePayloadLink(breathPower, 42, 2),
    animation: { ...animationMappings.breath, ...timings.breath },
    condition: modEvidence(12, "SF_41", "Mod12_Description"),
    aggregateStatus: "parent-x4-aggregate-proven-runtime-event-count-unproven",
    strictEligibility: "blocked-until-upgrade-branch-dispatch-and-table-values-proven",
  },
  {
    id: "default-projectile",
    kind: "runtime-attack",
    parent: parentPayloadEvidence("PROJ_PAYLOAD_TOOLTIP"),
    runtime: runtimePayloadLink(projectilePower, 18, 0),
    animation: { ...animationMappings.projectile, ...timings.projectile },
    condition: { kind: "baseline-description", status: "visible-default-attack-ai-schedule-unmapped" },
    aggregateStatus: "single-parent-coefficient-linked-runtime-repeat-count-unproven",
    strictEligibility: "blocked-until-ai-schedule-repeat-count-and-table-values-proven",
  },
  {
    id: "spew-putrefaction-dot",
    kind: "conditional-dot",
    parent: parentBuffEvidence("UPGRADE_POISON_DOT"),
    runtime: {
      globCountFormula: "SF_23",
      globCountValue: formulaValue(parent, 23),
      totalTooltipFormula: "SF_10",
      totalTooltipExpression: formulaValue(parent, 10),
    },
    animation: { ...animationMappings.spawn, ...timings.spawn },
    condition: modEvidence(9, "SF_5", "Mod9_Description"),
    aggregateStatus: "spawn-count-and-duration-described-overlap-and-tick-semantics-unproven",
    strictEligibility: "blocked-until-target-overlap-tick-semantics-and-table-values-proven",
  },
  {
    id: "sky-and-soil-dot",
    kind: "conditional-dot",
    parent: parentBuffEvidence("UPGRADE_C_DOT"),
    runtime: {
      referenceCadenceSeconds: 1,
      referenceCadenceStatus: "reference-description-each-second-not-runtime-observation",
    },
    animation: null,
    condition: modEvidence(11, "SF_35", "Mod11_Description"),
    aggregateStatus: "one-second-reference-cadence-linked-runtime-uptime-unproven",
    strictEligibility: "blocked-until-runtime-activation-uptime-and-table-values-proven",
  },
];

const consumerUpdates = Object.fromEntries(activationChains
  .filter((chain) => chain.parent.consumerId)
  .map((chain) => [chain.parent.consumerId, {
    activationChainId: chain.id,
    attributionStatus: "source-backed",
    scheduleStatus: "blocked",
    strictEligibility: chain.strictEligibility,
  }]));
const unmappedConsumers = (formulaGraph.damageConsumers ?? [])
  .filter((consumer) => !consumerUpdates[consumer.id])
  .map((consumer) => ({
    id: consumer.id,
    expression: consumer.expression,
    reason: "no-source-backed-activation-chain-yet",
  }));

const aiBehaviorReferences = (actor.ptMonsterData?.[0]?.arAIBehaviors ?? [])
  .filter(Boolean)
  .map(referenceTarget);
const resourceEvidence = loadedResources.map((resource) => resource.evidence);
const matchedResources = resourceEvidence.filter((resource) => resource.semanticParity);
const referenceTextLinksReady = symbolicDefinitions.every((definition) => definition.currentDefinitionFound);
const blockers = [
  "ai-behavior-1858249-client-name-and-schedule-unavailable",
  "attack-selection-order-and-repeat-count-unmapped",
  "animation-speed-scaling-from-attacks-per-second-unmapped",
  "breath-x4-aggregate-not-runtime-event-count",
  "remaining-damage-consumer-activations-unmapped",
  "dot-runtime-tick-and-overlap-semantics-partial",
  "table-34-source-values-unproven",
  "class-base-damage-scalar-semantics-unmapped",
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "current-power-activation-graph-v1",
  source: {
    currentBuild: freshness.summary?.currentBuild ?? null,
    sourceFreshnessAudit: inputs.sourceFreshnessAudit,
    formulaGraph: inputs.formulaGraph,
    activeBinaryRoot: inputs.activeBinaryRoot,
    activeParsedRoot: inputs.activeParsedRoot,
    referenceParsedRoot: inputs.referenceParsedRoot,
    referenceText: inputs.referenceText,
    activeLocalizedTextExtracted: false,
    referenceTextUsage: "hash-linked-label-and-condition-evidence-only",
  },
  summary: {
    assetId: Number(parent.__snoID__),
    entityId: `skill:${Number(parent.__snoID__)}`,
    currentBuild: freshness.summary?.currentBuild ?? null,
    gameplaySources: resourceEvidence.length,
    gameplaySourcesSemanticallyMatched: matchedResources.length,
    gameplaySourceParityReady: matchedResources.length === resourceEvidence.length,
    childPowers: 3,
    runtimeDamagePowers: 2,
    activationChains: activationChains.length,
    mappedPayloadConsumers: activationChains.filter((chain) => chain.parent.consumerId?.startsWith("payload:")).length,
    mappedDotConsumers: activationChains.filter((chain) => chain.parent.consumerId?.startsWith("buff-dot:")).length,
    attributedDamageConsumers: Object.keys(consumerUpdates).length,
    unattributedDamageConsumers: unmappedConsumers.length,
    attackAnimationMappings: 2,
    nominalAttackContactFrames: timings.projectile.contactFrames.length + timings.breath.contactFrames.length,
    conditionalDamageLinks: 3,
    aiBehaviorReferences: aiBehaviorReferences.length,
    aiBehaviorSnoIds: aiBehaviorReferences.map((reference) => reference.snoId),
    aiScheduleReady: false,
    referenceTextLinksReady,
    activeLocalizedTextExtracted: false,
    activationGraphPartial: true,
    activationGraphReady: false,
    currentStrictDpsKnown: false,
    currentModelReady: false,
    canUseForCurrentBuild: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    canModifyReliableDps: false,
    blockers,
    assessment: {
      kind: "active-damage-attribution-mapped-ai-schedule-blocked",
      confidence: "high-for-attribution-low-for-cadence",
      finding: "Les attaques et variantes actives sont reliees aux pouvoirs enfants et aux animations, mais l'IA qui choisit et repete ces attaques reste indisponible.",
      nextAction: "Extraire ou observer l'ordonnanceur AIBehavior 1858249, puis prouver l'ordre, les repetitions et la mise a l'echelle de vitesse avant tout DPS strict.",
    },
  },
  resources: resourceEvidence,
  symbolicDefinitions,
  referenceTextEvidence: {
    snoId: Number(referenceText.__snoID__),
    sourceStatus: "reference-snapshot-not-active-local-extraction",
    semanticCompatibility: referenceTextLinksReady
      ? "all-referenced-symbol-hashes-match-current-power-definitions"
      : "incomplete",
    labels: {
      skillName: stringByLabel.get("name") ?? null,
      mainDescriptionLabel: "desc",
      mod9Name: stringByLabel.get("Mod9_Name") ?? null,
      mod11Name: stringByLabel.get("Mod11_Name") ?? null,
      mod12Name: stringByLabel.get("Mod12_Name") ?? null,
    },
  },
  petDispatch: {
    petSpawn: parent.arPetSpawns?.map((spawn) => ({
      petType: spawn.gbidType?.name ?? null,
      petTypeHash: spawn.gbidType?.__raw__ ?? null,
      maximumExpression: spawn.tMax?.value ?? null,
    })) ?? [],
    actorSnoId: Number(actor.__snoID__),
    animSetSnoId: Number(animSet.__snoID__),
    aiBehaviorReferences,
    animationMappings,
    nominalAnimationTimings: timings,
  },
  activationChains,
  consumerUpdates,
  unattributedConsumers: unmappedConsumers,
  blockers,
  evidence: [
    {
      id: "active-resource-semantic-parity",
      status: matchedResources.length === resourceEvidence.length ? "passed" : "failed",
      confidence: "high",
      sourcePaths: resourceEvidence.flatMap((resource) => [resource.activeParsedPath, resource.referenceParsedPath]),
      claim: `${matchedResources.length}/${resourceEvidence.length} active gameplay resources match the reference semantics.`,
    },
    {
      id: "parent-child-power-links",
      status: activationChains.slice(0, 3).every((chain) => chain.runtime.linked) ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [byId.get("parent-power").evidence.activeParsedPath, byId.get("projectile-power").evidence.activeParsedPath, byId.get("breath-power").evidence.activeParsedPath],
      claim: "Three parent damage coefficients are linked to runtime payloads in the child attack powers.",
    },
    {
      id: "power-animation-contact-links",
      status: animationMappings.projectile && animationMappings.breath ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [byId.get("pet-animset").evidence.activeParsedPath, byId.get("projectile-animation").evidence.activeParsedPath, byId.get("breath-animation").evidence.activeParsedPath],
      claim: "Projectile and breath powers are linked to animations with nominal contact frames.",
    },
    {
      id: "reference-label-hash-links",
      status: referenceTextLinksReady ? "passed" : "failed",
      confidence: "medium-high",
      sourcePaths: [inputs.referenceText, byId.get("parent-power").evidence.activeParsedPath],
      claim: "Reference payload and buff labels hash to definitions present in the active parent power.",
    },
    {
      id: "ai-runtime-schedule",
      status: "blocked",
      confidence: "high",
      sourcePaths: [byId.get("pet-actor").evidence.activeParsedPath],
      claim: "AIBehavior 1858249 is referenced, but its attack order and repeat schedule are not available in the parsed client resources.",
    },
  ],
  safeguards: {
    animationTimingsAreNominalNotCadence: true,
    parentX4IsAggregateNotObservedHitCount: true,
    referenceLocalizationIsNotClaimedCurrent: true,
    noConsumerSummationWithoutAiSchedule: true,
    currentUnknownsRemainNull: true,
    noTargetDatasetWrite: true,
    canModifyReliableDps: false,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "current-power-activation-graph.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
