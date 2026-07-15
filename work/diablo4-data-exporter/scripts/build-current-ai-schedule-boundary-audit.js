const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const inputs = {
  activationGraph: process.argv[2] ?? "outputs/diablo4-current-power-activation-graph/current-power-activation-graph.json",
  activeCoreToc: process.argv[3] ?? "outputs/diablo4-current-casc-3.1.1/base/CoreTOC.dat",
  referenceCoreToc: process.argv[4] ?? "outputs/tools/source-cache/DiabloTools-d4data/json/CoreTOC_flat.json",
  activeActor: process.argv[5] ?? "outputs/tools/source-cache/DiabloTools-d4data/data-local-3.1.1/base/meta/Actor/Spiritborn_CentipedeRulerHead.acr.json",
  snoFileInfo: process.argv[6] ?? "outputs/tools/source-cache/DiabloTools-d4data/json/snoFileInfo.json",
  outDir: process.argv[7] ?? "outputs/diablo4-current-ai-schedule-boundary-audit",
};

const TARGET_AI_BEHAVIOR = 1858249;
const TARGET_ACTOR = 1858169;

const scheduleGroupIds = [3, 4, 87, 125, 144, 163];
const controlGroupIds = [166, 167];
const controlSnos = [
  { snoId: 1858169, groupId: 1, expectedName: "Spiritborn_CentipedeRulerHead", role: "pet-actor" },
  { snoId: 1858248, groupId: 8, expectedName: "Spiritborn_CentipedeRuler_Base", role: "pet-animset" },
  { snoId: 1858114, groupId: 29, expectedName: "Spiritborn_CentipedeRuler_Spawn", role: "spawn-power" },
  { snoId: 1858262, groupId: 29, expectedName: "Spiritborn_CentipedeRuler_ProjectileAttack", role: "projectile-power" },
  { snoId: 1859218, groupId: 29, expectedName: "Spiritborn_CentipedeRuler_BreathAttack", role: "breath-power" },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseCoreToc(filePath, trackedSnos) {
  const file = fs.readFileSync(filePath);
  let tocOffset = 4;
  let newFormat = false;
  let groupSlots = file.readUInt32LE(0);

  if (groupSlots === 0xbcde6611) {
    newFormat = true;
    tocOffset = 8;
    groupSlots = file.readUInt32LE(4);
  }

  if (groupSlots <= 0 || groupSlots > 1024) {
    throw new Error(`Invalid CoreTOC group slot count: ${groupSlots}`);
  }

  const entryCounts = Array.from({ length: groupSlots }, (_, index) => file.readUInt32LE(tocOffset + (index * 4)));
  const entryOffsetsBase = tocOffset + (groupSlots * 4);
  const entryOffsets = Array.from({ length: groupSlots }, (_, index) => file.readUInt32LE(entryOffsetsBase + (index * 4)));
  const dataStart = (newFormat ? 12 : 8) + ((newFormat ? 16 : 12) * groupSlots);
  const groupCounts = {};
  const tracked = {};
  let entries = 0;

  for (let slot = 0; slot < groupSlots; slot += 1) {
    const count = entryCounts[slot];
    const groupDataStart = dataStart + entryOffsets[slot];
    const namesStart = groupDataStart + (12 * count);

    for (let index = 0, offset = groupDataStart; index < count; index += 1, offset += 12) {
      if (offset + 12 > file.length) throw new Error(`CoreTOC entry outside file at ${offset}`);
      const groupId = file.readInt32LE(offset);
      const snoId = file.readInt32LE(offset + 4);
      const relativeNameOffset = file.readInt32LE(offset + 8);
      const nameOffset = namesStart + relativeNameOffset;
      groupCounts[groupId] = (groupCounts[groupId] ?? 0) + 1;
      entries += 1;

      if (!trackedSnos.has(snoId)) continue;
      if (nameOffset < 0 || nameOffset >= file.length) throw new Error(`CoreTOC name outside file for SNO ${snoId}`);
      let nameEnd = nameOffset;
      while (nameEnd < file.length && nameEnd < nameOffset + 1024 && file[nameEnd] !== 0) nameEnd += 1;
      tracked[snoId] = {
        snoId,
        groupId,
        name: file.subarray(nameOffset, nameEnd).toString().trim(),
      };
    }
  }

  return {
    path: filePath,
    bytes: file.length,
    sha256: sha256(file),
    newFormat,
    groupSlots,
    namedGroups: Object.keys(groupCounts).length,
    entries,
    groupCounts,
    tracked,
  };
}

function referenceSummary(coreToc, trackedSnos) {
  const groupCounts = {};
  const tracked = {};
  for (const [rawSnoId, entry] of Object.entries(coreToc)) {
    if (!Array.isArray(entry)) continue;
    const snoId = Number(rawSnoId);
    const groupId = Number(entry[1]);
    groupCounts[groupId] = (groupCounts[groupId] ?? 0) + 1;
    if (trackedSnos.has(snoId)) tracked[snoId] = { snoId, groupId, name: entry[0] };
  }
  return {
    path: inputs.referenceCoreToc,
    entries: Object.keys(coreToc).length,
    namedGroups: Object.keys(groupCounts).length,
    groupCounts,
    tracked,
  };
}

function snoReference(value) {
  if (!value || typeof value !== "object") return null;
  return {
    snoId: Number(value.__raw__),
    groupId: Number(value.__group__),
    groupName: value.groupName ?? null,
    name: value.name ?? null,
    targetFile: value.__targetFileName__ ?? null,
  };
}

const activationGraph = readJson(inputs.activationGraph);
const actor = readJson(inputs.activeActor);
const snoFileInfo = readJson(inputs.snoFileInfo);
const trackedSnos = new Set([TARGET_AI_BEHAVIOR, ...controlSnos.map((control) => control.snoId)]);
const activeToc = parseCoreToc(inputs.activeCoreToc, trackedSnos);
const referenceToc = referenceSummary(readJson(inputs.referenceCoreToc), trackedSnos);
const aiBehaviorReferences = (actor.ptMonsterData?.[0]?.arAIBehaviors ?? [])
  .map(snoReference)
  .filter(Boolean);
const brain = actor.ptBrainData?.[0] ?? null;
const aiData = actor.ptAIData?.[0] ?? null;

function groupRow(groupId) {
  const fileInfo = snoFileInfo[String(groupId)] ?? [null, null];
  return {
    groupId,
    groupName: fileInfo[0],
    extension: fileInfo[1],
    activeEntries: activeToc.groupCounts[groupId] ?? 0,
    referenceEntries: referenceToc.groupCounts[groupId] ?? 0,
  };
}

const scheduleGroups = scheduleGroupIds.map(groupRow);
const controlGroups = controlGroupIds.map(groupRow);
const controls = controlSnos.map((control) => {
  const active = activeToc.tracked[control.snoId] ?? null;
  const reference = referenceToc.tracked[control.snoId] ?? null;
  return {
    ...control,
    active,
    reference,
    activeResolved: active?.groupId === control.groupId && active?.name === control.expectedName,
    referenceResolved: reference?.groupId === control.groupId && reference?.name === control.expectedName,
  };
});

const targetReference = aiBehaviorReferences.find((reference) => reference.snoId === TARGET_AI_BEHAVIOR) ?? null;
const targetActiveEntry = activeToc.tracked[TARGET_AI_BEHAVIOR] ?? null;
const targetReferenceEntry = referenceToc.tracked[TARGET_AI_BEHAVIOR] ?? null;
const controlsResolved = controls.filter((control) => control.activeResolved).length;
const publishedScheduleGroups = scheduleGroups.filter((group) => group.activeEntries > 0);
const actorProvidesInlineSchedule = (aiData?.arAIPropPowerPairings?.length ?? 0) > 0;
const clientSnoBoundaryProven = Boolean(targetReference)
  && targetActiveEntry === null
  && publishedScheduleGroups.length === 0
  && controlsResolved === controls.length
  && actorProvidesInlineSchedule === false;

const observationScenarios = [
  {
    id: "baseline-sequence",
    label: "Sequence standard sur cible unique",
    minimumCasts: 5,
    purpose: "Mesurer l'ordre, les repetitions et les intervalles projectile/souffle pendant les 15 secondes actives.",
    requiredBuildState: { blastOfBile: false, attackSpeedProcs: false },
  },
  {
    id: "blast-of-bile-single-breath",
    label: "Blast of Bile, souffle unique",
    minimumCasts: 5,
    purpose: "Verifier le souffle unique puis la disparition decrits par la reference, avec le nombre reel d'instances de degats.",
    requiredBuildState: { blastOfBile: true, attackSpeedProcs: false },
  },
  {
    id: "attack-speed-scaling",
    label: "Comparaison de deux etats de vitesse",
    minimumCastsPerTier: 5,
    minimumTiers: 2,
    purpose: "Mesurer comment Attacks_Per_Second_Total modifie les intervalles, le nombre d'attaques et la duree des animations.",
    requiredBuildState: { blastOfBile: false, stableAttackSpeedWithinCast: true },
  },
];

const eventSchema = {
  castId: "string",
  scenarioId: observationScenarios.map((scenario) => scenario.id),
  sourceFile: "string",
  captureFps: "number",
  playerAttackSpeedState: "string",
  observedAtSeconds: "number",
  eventKind: ["cast-start", "spawn-contact", "attack-start", "attack-contact", "damage-instance", "despawn"],
  attackKind: ["none", "projectile", "breath", "unknown"],
  damageInstanceCount: "integer-or-null",
  notes: "string-or-null",
};

const runtimeObservationPlan = {
  schemaVersion: 1,
  mode: "runtime-cadence-observation-v1",
  minimumCaptureFps: 60,
  scenarios: observationScenarios,
  minimumTotalCasts: 20,
  eventSchema,
  acceptanceGates: [
    "Chaque lancer conserve cast-start, contacts d'attaque, instances de degats et despawn sur la meme horloge.",
    "Les attaques sont classees par animation ou effet, pas par le montant de degats seul.",
    "La sequence standard est stable ou sa distribution est quantifiee sur au moins cinq lancers.",
    "Blast of Bile confirme ou rejette le souffle unique sur au moins cinq lancers.",
    "La vitesse est comparee sur au moins deux etats stables avec cinq lancers par etat.",
    "Aucun multiplicateur x4 ni coefficient d'animation n'est converti en nombre de touches sans observation.",
  ],
  readyForCollection: clientSnoBoundaryProven,
  observationsCollected: 0,
  scheduleProven: false,
};

const blockers = [
  "runtime-attack-sequence-not-observed",
  "runtime-repeat-count-not-observed",
  "attacks-per-second-scaling-not-observed",
  "breath-x4-runtime-event-count-not-observed",
  "dot-uptime-and-overlap-not-observed",
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "current-ai-schedule-boundary-audit-v1",
  source: {
    currentBuild: activationGraph.summary?.currentBuild ?? null,
    activationGraph: inputs.activationGraph,
    activeCoreToc: inputs.activeCoreToc,
    referenceCoreToc: inputs.referenceCoreToc,
    activeActor: inputs.activeActor,
    snoFileInfo: inputs.snoFileInfo,
    observationTemplate: path.join(inputs.outDir, "runtime-cadence-observation-template.json"),
  },
  summary: {
    assetId: activationGraph.summary?.assetId ?? null,
    actorSnoId: Number(actor.__snoID__),
    aiBehaviorSnoId: TARGET_AI_BEHAVIOR,
    currentBuild: activationGraph.summary?.currentBuild ?? null,
    activeCoreTocBytes: activeToc.bytes,
    activeCoreTocEntries: activeToc.entries,
    activeCoreTocGroupSlots: activeToc.groupSlots,
    activeNamedGroups: activeToc.namedGroups,
    activeAiBehaviorGroupEntries: activeToc.groupCounts[3] ?? 0,
    activeScheduleGroupEntries: activeToc.groupCounts[87] ?? 0,
    publishedScheduleGroups: publishedScheduleGroups.length,
    aiBehaviorReferencePresent: Boolean(targetReference),
    aiBehaviorNameResolved: Boolean(targetActiveEntry?.name),
    aiBehaviorFileAddressable: Boolean(targetActiveEntry?.name),
    referenceSnapshotNameResolved: Boolean(targetReferenceEntry?.name),
    activeControlSnosResolved: controlsResolved,
    actorInlinePowerPairings: aiData?.arAIPropPowerPairings?.length ?? 0,
    actorProvidesInlineSchedule,
    clientSnoBoundaryProven,
    clientSnoExtractionExhausted: clientSnoBoundaryProven,
    serverSideOrUndistributedLikely: clientSnoBoundaryProven,
    runtimeObservationRequired: clientSnoBoundaryProven,
    runtimeObservationPlanReady: runtimeObservationPlan.readyForCollection,
    runtimeObservationsCollected: 0,
    aiScheduleReady: false,
    currentStrictDpsKnown: false,
    canUseForCurrentBuild: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    canModifyReliableDps: false,
    blockers,
    assessment: {
      kind: "client-ai-sno-boundary-proven-runtime-observation-required",
      confidence: "high-for-client-boundary-low-for-runtime-schedule",
      finding: "Le client 3.1.1 reference AIBehavior 1858249, mais ne publie aucune ressource SNO de planning IA ni aucun planning inline pour cet acteur.",
      inference: "La definition est probablement serveur ou non distribuee; cette localisation n'est pas prouvee par les fichiers client.",
      nextAction: "Mesurer en jeu au moins cinq sequences standard, cinq Blast of Bile et deux etats stables de vitesse avant tout DPS strict.",
    },
  },
  activeCoreToc: {
    path: activeToc.path,
    bytes: activeToc.bytes,
    sha256: activeToc.sha256,
    newFormat: activeToc.newFormat,
    groupSlots: activeToc.groupSlots,
    namedGroups: activeToc.namedGroups,
    entries: activeToc.entries,
  },
  actorBoundary: {
    actorSnoId: Number(actor.__snoID__),
    aiBehaviorReferences,
    brain: brain ? {
      defaultBrain: brain.eDefaultBrain ?? null,
      behaviorType: brain.eBehaviorType ?? null,
      radiusTriggerRadius: brain.flRadiusTriggerRadius ?? null,
      radiusTriggerOneShot: brain.fRadiusTriggerOneShot ?? null,
    } : null,
    aiPropPowerPairings: aiData?.arAIPropPowerPairings ?? [],
    targetActiveEntry,
    targetReferenceEntry,
  },
  scheduleGroups,
  controlGroups,
  controlSnos: controls,
  runtimeObservationPlan,
  blockers,
  evidence: [
    {
      id: "active-coretoc-parsed",
      status: activeToc.entries > 0 ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [inputs.activeCoreToc],
      claim: `The active CoreTOC contains ${activeToc.entries} named SNO entries across ${activeToc.namedGroups} groups.`,
    },
    {
      id: "actor-references-ai-behavior-1858249",
      status: targetReference ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [inputs.activeActor],
      claim: "Actor 1858169 references SNO 1858249 as AIBehavior group 3.",
    },
    {
      id: "active-ai-schedule-groups-empty",
      status: publishedScheduleGroups.length === 0 ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [inputs.activeCoreToc, inputs.snoFileInfo],
      claim: "The active client CoreTOC publishes no AIBehavior, AIState, Schedule, AIAwareness, AICoordinator or GenericNodeGraph entries.",
    },
    {
      id: "ai-behavior-target-unaddressable",
      status: targetActiveEntry === null && targetReferenceEntry === null ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [inputs.activeCoreToc, inputs.referenceCoreToc],
      claim: "SNO 1858249 has no client name or addressable file in either active or reference CoreTOC data.",
    },
    {
      id: "neighbor-control-snos-resolved",
      status: controlsResolved === controls.length ? "passed" : "failed",
      confidence: "high",
      sourcePaths: [inputs.activeCoreToc],
      claim: `${controlsResolved}/${controls.length} neighboring actor, animset and power controls resolve in the same active CoreTOC.`,
    },
    {
      id: "actor-inline-schedule-absent",
      status: actorProvidesInlineSchedule ? "failed" : "passed",
      confidence: "medium-high",
      sourcePaths: [inputs.activeActor],
      claim: "The parsed actor exposes no inline AI power pairings that could replace the missing AIBehavior schedule.",
    },
  ],
  safeguards: {
    serverSideLocationIsInferenceNotFact: true,
    coreTocAbsenceDoesNotProveRuntimeOrder: true,
    observationPlanContainsNoFabricatedEvents: true,
    animationTimingsRemainNominalOnly: true,
    currentUnknownsRemainNull: true,
    noTargetDatasetWrite: true,
    canModifyReliableDps: false,
  },
};

const observationTemplate = {
  "$schema": "https://local.diablo4-build-optimizer/schemas/runtime-cadence-observations.schema.json",
  schemaVersion: 1,
  mode: runtimeObservationPlan.mode,
  currentBuild: report.summary.currentBuild,
  assetId: report.summary.assetId,
  actorSnoId: TARGET_ACTOR,
  aiBehaviorSnoId: TARGET_AI_BEHAVIOR,
  notes: [
    "Ce modele doit contenir uniquement des observations runtime reelles du client actif.",
    "Les fixtures synthetiques de test ne doivent jamais etre copiees dans ce fichier.",
  ],
  sessions: [],
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "current-ai-schedule-boundary-audit.json");
const observationTemplateFile = path.join(inputs.outDir, "runtime-cadence-observation-template.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(observationTemplateFile, JSON.stringify(observationTemplate, null, 2));
console.log(JSON.stringify({ outFile, observationTemplateFile, summary: report.summary }, null, 2));
