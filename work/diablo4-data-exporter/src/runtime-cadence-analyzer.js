const EVENT_KINDS = new Set([
  "cast-start",
  "spawn-contact",
  "attack-start",
  "attack-contact",
  "damage-instance",
  "despawn",
]);
const ATTACK_KINDS = new Set(["none", "projectile", "breath", "unknown"]);

function round(value, digits = 6) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null;
}

function stats(values) {
  const finite = values.filter(Number.isFinite);
  return {
    count: finite.length,
    min: finite.length ? round(Math.min(...finite)) : null,
    max: finite.length ? round(Math.max(...finite)) : null,
    mean: finite.length ? round(mean(finite)) : null,
  };
}

function addIssue(issues, path, code, message) {
  issues.push({ severity: "error", path, code, message });
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateTopLevel(observations, boundaryAudit, issues) {
  if (!isObject(observations)) {
    addIssue(issues, "$", "input-not-object", "Observation input must be an object.");
    return;
  }
  if (observations.schemaVersion !== 1) addIssue(issues, "schemaVersion", "schema-version-invalid", "schemaVersion must be 1.");
  if (observations.mode !== "runtime-cadence-observation-v1") addIssue(issues, "mode", "mode-invalid", "mode must be runtime-cadence-observation-v1.");
  if (observations.currentBuild !== boundaryAudit.summary?.currentBuild) addIssue(issues, "currentBuild", "build-mismatch", "Observation build must match the active AI boundary audit.");
  if (observations.assetId !== boundaryAudit.summary?.assetId) addIssue(issues, "assetId", "asset-mismatch", "Observation asset must match the active AI boundary audit.");
  if (observations.actorSnoId !== boundaryAudit.summary?.actorSnoId) addIssue(issues, "actorSnoId", "actor-mismatch", "Observation actor must match the active AI boundary audit.");
  if (observations.aiBehaviorSnoId !== boundaryAudit.summary?.aiBehaviorSnoId) addIssue(issues, "aiBehaviorSnoId", "ai-behavior-mismatch", "Observation AIBehavior must match the active AI boundary audit.");
  if (!Array.isArray(observations.sessions)) addIssue(issues, "sessions", "sessions-not-array", "sessions must be an array.");
}

function analyzeSession(session, index, context) {
  const { issues, knownScenarios, minimumCaptureFps, seenIds } = context;
  const path = `sessions[${index}]`;
  const issueStart = issues.length;

  if (!isObject(session)) {
    addIssue(issues, path, "session-not-object", "Session must be an object.");
    return {
      id: `invalid-${index}`,
      scenarioId: null,
      valid: false,
      complete: false,
      issues: 1,
      eventCount: 0,
    };
  }

  const id = typeof session.id === "string" && session.id.trim() ? session.id.trim() : `invalid-${index}`;
  if (id.startsWith("invalid-")) addIssue(issues, `${path}.id`, "session-id-invalid", "Session id must be a non-empty string.");
  if (seenIds.has(id)) addIssue(issues, `${path}.id`, "session-id-duplicate", `Duplicate session id: ${id}.`);
  seenIds.add(id);

  const scenarioId = session.scenarioId;
  if (!knownScenarios.has(scenarioId)) addIssue(issues, `${path}.scenarioId`, "scenario-invalid", `Unknown scenario: ${scenarioId}.`);
  if (session.sourceFile !== null && typeof session.sourceFile !== "string") addIssue(issues, `${path}.sourceFile`, "source-file-invalid", "sourceFile must be a string or null.");
  if (!Number.isFinite(session.captureFps) || session.captureFps < minimumCaptureFps) {
    addIssue(issues, `${path}.captureFps`, "capture-fps-below-plan", `captureFps must be at least ${minimumCaptureFps}.`);
  }

  const attackSpeedState = isObject(session.attackSpeedState) ? session.attackSpeedState : {};
  if (typeof attackSpeedState.label !== "string" || !attackSpeedState.label.trim()) addIssue(issues, `${path}.attackSpeedState.label`, "speed-label-invalid", "Attack-speed state label is required.");
  if (attackSpeedState.attacksPerSecond !== null && (!Number.isFinite(attackSpeedState.attacksPerSecond) || attackSpeedState.attacksPerSecond <= 0)) {
    addIssue(issues, `${path}.attackSpeedState.attacksPerSecond`, "attacks-per-second-invalid", "attacksPerSecond must be positive or null.");
  }
  if (!Array.isArray(attackSpeedState.modifiers)) addIssue(issues, `${path}.attackSpeedState.modifiers`, "speed-modifiers-invalid", "Attack-speed modifiers must be an array.");

  const buildState = isObject(session.buildState) ? session.buildState : {};
  if (typeof buildState.blastOfBile !== "boolean") addIssue(issues, `${path}.buildState.blastOfBile`, "blast-state-invalid", "blastOfBile must be boolean.");
  if (typeof buildState.attackSpeedStableWithinCast !== "boolean") addIssue(issues, `${path}.buildState.attackSpeedStableWithinCast`, "speed-stability-invalid", "attackSpeedStableWithinCast must be boolean.");
  if (!Array.isArray(buildState.otherSkillModifiers)) addIssue(issues, `${path}.buildState.otherSkillModifiers`, "skill-modifiers-invalid", "otherSkillModifiers must be an array.");

  if (scenarioId === "baseline-sequence" && buildState.blastOfBile !== false) addIssue(issues, `${path}.buildState.blastOfBile`, "baseline-build-state-invalid", "Baseline scenario must disable Blast of Bile.");
  if (scenarioId === "blast-of-bile-single-breath" && buildState.blastOfBile !== true) addIssue(issues, `${path}.buildState.blastOfBile`, "blast-build-state-invalid", "Blast of Bile scenario must enable the modifier.");
  if (scenarioId === "attack-speed-scaling") {
    if (buildState.blastOfBile !== false) addIssue(issues, `${path}.buildState.blastOfBile`, "speed-build-state-invalid", "Speed scenario must disable Blast of Bile.");
    if (buildState.attackSpeedStableWithinCast !== true) addIssue(issues, `${path}.buildState.attackSpeedStableWithinCast`, "speed-not-stable", "Speed scenario requires a stable attack-speed state.");
    if (!Number.isFinite(attackSpeedState.attacksPerSecond)) addIssue(issues, `${path}.attackSpeedState.attacksPerSecond`, "speed-value-required", "Speed scenario requires a numeric attacksPerSecond value.");
  }

  const rawEvents = Array.isArray(session.events) ? session.events : [];
  if (!Array.isArray(session.events) || rawEvents.length === 0) addIssue(issues, `${path}.events`, "events-empty", "Session must contain events.");
  let previousTimestamp = -Infinity;
  const events = [];

  rawEvents.forEach((event, eventIndex) => {
    const eventPath = `${path}.events[${eventIndex}]`;
    if (!isObject(event)) {
      addIssue(issues, eventPath, "event-not-object", "Event must be an object.");
      return;
    }
    const observedAtSeconds = event.observedAtSeconds;
    if (!Number.isFinite(observedAtSeconds) || observedAtSeconds < 0) addIssue(issues, `${eventPath}.observedAtSeconds`, "event-time-invalid", "Event time must be non-negative.");
    if (Number.isFinite(observedAtSeconds) && observedAtSeconds < previousTimestamp) addIssue(issues, `${eventPath}.observedAtSeconds`, "events-not-chronological", "Events must be ordered by time.");
    if (Number.isFinite(observedAtSeconds)) previousTimestamp = observedAtSeconds;
    if (!EVENT_KINDS.has(event.eventKind)) addIssue(issues, `${eventPath}.eventKind`, "event-kind-invalid", `Unknown event kind: ${event.eventKind}.`);
    if (!ATTACK_KINDS.has(event.attackKind)) addIssue(issues, `${eventPath}.attackKind`, "attack-kind-invalid", `Unknown attack kind: ${event.attackKind}.`);
    if (event.damageInstanceCount !== null && (!Number.isInteger(event.damageInstanceCount) || event.damageInstanceCount < 0)) {
      addIssue(issues, `${eventPath}.damageInstanceCount`, "damage-count-invalid", "damageInstanceCount must be a non-negative integer or null.");
    }
    if (event.eventKind === "attack-contact" && !["projectile", "breath"].includes(event.attackKind)) {
      addIssue(issues, `${eventPath}.attackKind`, "contact-attack-kind-required", "Attack contacts must identify projectile or breath.");
    }
    if (event.eventKind === "damage-instance" && (!Number.isInteger(event.damageInstanceCount) || event.damageInstanceCount < 1)) {
      addIssue(issues, `${eventPath}.damageInstanceCount`, "damage-instance-count-required", "Damage events must include at least one instance.");
    }
    events.push(event);
  });

  const starts = events.filter((event) => event.eventKind === "cast-start");
  const despawns = events.filter((event) => event.eventKind === "despawn");
  const contacts = events.filter((event) => event.eventKind === "attack-contact");
  const damageEvents = events.filter((event) => event.eventKind === "damage-instance");
  if (starts.length !== 1) addIssue(issues, `${path}.events`, "cast-start-count-invalid", "Session must contain exactly one cast-start.");
  if (despawns.length !== 1) addIssue(issues, `${path}.events`, "despawn-count-invalid", "Session must contain exactly one despawn.");
  if (contacts.length === 0) addIssue(issues, `${path}.events`, "attack-contacts-empty", "Session must contain at least one attack-contact.");
  if (damageEvents.length === 0) addIssue(issues, `${path}.events`, "damage-events-empty", "Session must contain damage-instance evidence.");

  const contactTimes = contacts.map((event) => event.observedAtSeconds).filter(Number.isFinite);
  const contactIntervals = contactTimes.slice(1).map((time, intervalIndex) => time - contactTimes[intervalIndex]);
  const projectileContacts = contacts.filter((event) => event.attackKind === "projectile").length;
  const breathContacts = contacts.filter((event) => event.attackKind === "breath").length;
  const totalDamageInstances = damageEvents.reduce((sum, event) => sum + (Number.isInteger(event.damageInstanceCount) ? event.damageInstanceCount : 0), 0);
  const issueCount = issues.length - issueStart;
  const activeDurationSeconds = starts.length === 1 && despawns.length === 1
    ? round(despawns[0].observedAtSeconds - starts[0].observedAtSeconds)
    : null;

  return {
    id,
    scenarioId,
    sourceFile: session.sourceFile ?? null,
    captureFps: session.captureFps ?? null,
    attackSpeedLabel: attackSpeedState.label ?? null,
    attacksPerSecond: attackSpeedState.attacksPerSecond ?? null,
    blastOfBile: buildState.blastOfBile ?? null,
    valid: issueCount === 0,
    complete: issueCount === 0,
    issues: issueCount,
    eventCount: events.length,
    attackContacts: contacts.length,
    projectileContacts,
    breathContacts,
    totalDamageInstances,
    sequence: contacts.map((event) => event.attackKind).join(">") || null,
    activeDurationSeconds,
    contactIntervalStats: stats(contactIntervals),
  };
}

function summarizeScenario(scenarioId, sessions, minimumCasts) {
  const matching = sessions.filter((session) => session.scenarioId === scenarioId);
  const complete = matching.filter((session) => session.complete);
  const sequenceCounts = new Map();
  complete.forEach((session) => {
    if (session.sequence) sequenceCounts.set(session.sequence, (sequenceCounts.get(session.sequence) ?? 0) + 1);
  });
  const distribution = Array.from(sequenceCounts.entries())
    .map(([sequence, casts]) => ({ sequence, casts }))
    .sort((left, right) => right.casts - left.casts || left.sequence.localeCompare(right.sequence));
  const dominant = distribution[0] ?? null;
  return {
    scenarioId,
    sessions: matching.length,
    completeSessions: complete.length,
    minimumCasts,
    sampleReady: complete.length >= minimumCasts,
    dominantSequence: dominant?.sequence ?? null,
    sequenceConsistency: complete.length && dominant ? round(dominant.casts / complete.length) : null,
    sequenceDistribution: distribution,
    attackContactStats: stats(complete.map((session) => session.attackContacts)),
    projectileContactStats: stats(complete.map((session) => session.projectileContacts)),
    breathContactStats: stats(complete.map((session) => session.breathContacts)),
    damageInstanceStats: stats(complete.map((session) => session.totalDamageInstances)),
    activeDurationStats: stats(complete.map((session) => session.activeDurationSeconds)),
    meanContactIntervalStats: stats(complete.map((session) => session.contactIntervalStats.mean)),
  };
}

function summarizeSpeedTiers(sessions, minimumCastsPerTier, minimumTiers) {
  const complete = sessions.filter((session) => session.scenarioId === "attack-speed-scaling" && session.complete);
  const grouped = new Map();
  complete.forEach((session) => {
    const label = session.attackSpeedLabel ?? "unknown";
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(session);
  });
  const tiers = Array.from(grouped.entries()).map(([label, rows]) => ({
    label,
    sessions: rows.length,
    attacksPerSecond: round(mean(rows.map((row) => row.attacksPerSecond))),
    attackContactMean: round(mean(rows.map((row) => row.attackContacts))),
    contactIntervalMeanSeconds: round(mean(rows.map((row) => row.contactIntervalStats.mean))),
    activeDurationMeanSeconds: round(mean(rows.map((row) => row.activeDurationSeconds))),
    ready: rows.length >= minimumCastsPerTier && rows.every((row) => Number.isFinite(row.attacksPerSecond)),
  })).sort((left, right) => (left.attacksPerSecond ?? Infinity) - (right.attacksPerSecond ?? Infinity));
  const readyTiers = tiers.filter((tier) => tier.ready);
  const lowest = readyTiers[0] ?? null;
  const highest = readyTiers[readyTiers.length - 1] ?? null;
  const distinctSpeedValues = new Set(readyTiers.map((tier) => tier.attacksPerSecond)).size;
  const scalingDirectionObserved = readyTiers.length >= minimumTiers
    && distinctSpeedValues >= minimumTiers
    && highest.attacksPerSecond > lowest.attacksPerSecond
    && ((Number.isFinite(highest.contactIntervalMeanSeconds)
      && Number.isFinite(lowest.contactIntervalMeanSeconds)
      && highest.contactIntervalMeanSeconds < lowest.contactIntervalMeanSeconds)
      || highest.attackContactMean > lowest.attackContactMean);
  return {
    sessions: complete.length,
    minimumCastsPerTier,
    minimumTiers,
    tiers,
    readyTiers: readyTiers.length,
    sampleReady: readyTiers.length >= minimumTiers,
    scalingDirectionObserved,
    scalingMeasured: readyTiers.length >= minimumTiers && distinctSpeedValues >= minimumTiers && scalingDirectionObserved,
  };
}

function analyzeRuntimeCadence({ observations, boundaryAudit, schema, source = {} }) {
  const issues = [];
  validateTopLevel(observations, boundaryAudit, issues);
  const plan = boundaryAudit.runtimeObservationPlan ?? {};
  const scenarioPlans = plan.scenarios ?? [];
  const knownScenarios = new Set(scenarioPlans.map((scenario) => scenario.id));
  const minimumCaptureFps = plan.minimumCaptureFps ?? 60;
  const seenIds = new Set();
  const rawSessions = Array.isArray(observations?.sessions) ? observations.sessions : [];
  const sessionAnalysis = rawSessions.map((session, index) => analyzeSession(session, index, {
    issues,
    knownScenarios,
    minimumCaptureFps,
    seenIds,
  }));

  const baselinePlan = scenarioPlans.find((scenario) => scenario.id === "baseline-sequence") ?? { minimumCasts: 5 };
  const blastPlan = scenarioPlans.find((scenario) => scenario.id === "blast-of-bile-single-breath") ?? { minimumCasts: 5 };
  const speedPlan = scenarioPlans.find((scenario) => scenario.id === "attack-speed-scaling") ?? { minimumCastsPerTier: 5, minimumTiers: 2 };
  const baseline = summarizeScenario("baseline-sequence", sessionAnalysis, baselinePlan.minimumCasts);
  const blast = summarizeScenario("blast-of-bile-single-breath", sessionAnalysis, blastPlan.minimumCasts);
  const speed = summarizeSpeedTiers(sessionAnalysis, speedPlan.minimumCastsPerTier, speedPlan.minimumTiers);
  const completeBlastSessions = sessionAnalysis.filter((session) => session.scenarioId === "blast-of-bile-single-breath" && session.complete);
  const blastSingleBreathConfirmed = completeBlastSessions.length >= blastPlan.minimumCasts
    && completeBlastSessions.every((session) => session.breathContacts === 1 && session.projectileContacts === 0);
  const minimumTotalCasts = plan.minimumTotalCasts ?? 20;
  const completeSessions = sessionAnalysis.filter((session) => session.complete).length;

  const gates = [
    { id: "input-contract-valid", status: issues.length === 0 ? "passed" : "failed", value: issues.length },
    { id: "baseline-minimum-casts", status: baseline.sampleReady ? "passed" : "failed", value: baseline.completeSessions },
    { id: "blast-minimum-casts", status: blast.sampleReady ? "passed" : "failed", value: blast.completeSessions },
    { id: "blast-single-breath-observed", status: blastSingleBreathConfirmed ? "passed" : "failed", value: blastSingleBreathConfirmed },
    { id: "speed-tiers-minimum-casts", status: speed.sampleReady ? "passed" : "failed", value: speed.readyTiers },
    { id: "speed-scaling-direction-observed", status: speed.scalingMeasured ? "passed" : "failed", value: speed.scalingDirectionObserved },
    { id: "minimum-total-complete-casts", status: completeSessions >= minimumTotalCasts ? "passed" : "failed", value: completeSessions },
  ];
  const passedGates = gates.filter((gate) => gate.status === "passed").length;
  const runtimeScheduleEvidenceReady = gates.every((gate) => gate.status === "passed");
  const observationsCollected = rawSessions.length;
  const blockers = [];
  if (observationsCollected === 0) blockers.push("runtime-observations-empty");
  if (issues.length) blockers.push("runtime-observations-invalid");
  if (!baseline.sampleReady) blockers.push("baseline-runtime-sample-incomplete");
  if (!blast.sampleReady || !blastSingleBreathConfirmed) blockers.push("blast-of-bile-runtime-sample-incomplete");
  if (!speed.scalingMeasured) blockers.push("attacks-per-second-scaling-not-measured");
  blockers.push(
    "remaining-damage-consumer-activations-unmapped",
    "dot-runtime-tick-and-overlap-semantics-partial",
    "table-34-source-values-unproven",
    "class-base-damage-scalar-semantics-unmapped",
  );

  const status = observationsCollected === 0
    ? "waiting-for-runtime-observations"
    : issues.length
      ? "runtime-observations-invalid"
      : runtimeScheduleEvidenceReady
        ? "runtime-schedule-evidence-ready-dps-still-blocked"
        : "runtime-observations-partial";
  const nextAction = observationsCollected === 0
    ? "Ajouter les captures reelles annotees pour les trois scenarios sans recopier les fixtures synthetiques."
    : issues.length
      ? "Corriger les erreurs de contrat et de chronologie avant toute analyse de cadence."
      : runtimeScheduleEvidenceReady
        ? "Relier la cadence observee aux consommateurs restants, aux tables de degats et aux DOT avant de calculer le DPS strict."
        : "Completer les scenarios et etats de vitesse qui n'atteignent pas encore leurs seuils de preuve.";

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "current-runtime-cadence-analysis-v1",
    source: {
      observationInput: source.observationInput ?? null,
      observationInputSha256: source.observationInputSha256 ?? null,
      boundaryAudit: source.boundaryAudit ?? null,
      schema: source.schema ?? null,
      schemaId: schema?.$id ?? null,
      schemaTitle: schema?.title ?? null,
    },
    summary: {
      assetId: boundaryAudit.summary?.assetId ?? null,
      actorSnoId: boundaryAudit.summary?.actorSnoId ?? null,
      aiBehaviorSnoId: boundaryAudit.summary?.aiBehaviorSnoId ?? null,
      currentBuild: boundaryAudit.summary?.currentBuild ?? null,
      status,
      totalSessions: observationsCollected,
      completeSessions,
      totalEvents: sessionAnalysis.reduce((sum, session) => sum + (session.eventCount ?? 0), 0),
      minimumTotalCasts,
      collectionCoveragePct: round(Math.min(1, completeSessions / minimumTotalCasts) * 100, 2),
      validationIssues: issues.length,
      gates: gates.length,
      passedGates,
      failedGates: gates.length - passedGates,
      baselineCasts: baseline.completeSessions,
      blastOfBileCasts: blast.completeSessions,
      speedTiersReady: speed.readyTiers,
      blastSingleBreathConfirmed,
      attackSpeedScalingMeasured: speed.scalingMeasured,
      runtimeScheduleEvidenceReady,
      aiScheduleReady: runtimeScheduleEvidenceReady,
      currentStrictDpsKnown: false,
      currentModelReady: false,
      canUseForCurrentBuild: false,
      canUseForReliableDps: false,
      canUseForRanking: false,
      canModifyReliableDps: false,
      blockers,
      assessment: {
        kind: status,
        confidence: observationsCollected === 0 ? "high-for-empty-state" : runtimeScheduleEvidenceReady ? "high-for-sample-contract" : "partial",
        finding: observationsCollected === 0
          ? "Le contrat d'observation est pret, mais aucune session runtime reelle n'est encore disponible."
          : `${completeSessions}/${observationsCollected} sessions sont completes et ${passedGates}/${gates.length} portes sont franchies.`,
        nextAction,
      },
    },
    validation: {
      schemaId: schema?.$id ?? null,
      valid: issues.length === 0,
      issues,
    },
    gates,
    sessionAnalysis,
    scenarioAnalysis: {
      baseline,
      blastOfBile: {
        ...blast,
        singleBreathConfirmed: blastSingleBreathConfirmed,
      },
      attackSpeedScaling: speed,
    },
    blockers,
    evidence: [
      {
        id: "runtime-observation-contract",
        status: issues.length === 0 ? "passed" : "failed",
        confidence: "high",
        sourcePaths: [source.observationInput, source.schema].filter(Boolean),
        claim: `${issues.length} contract or chronology issues were found.`,
      },
      {
        id: "runtime-observation-collection",
        status: observationsCollected > 0 ? "passed" : "blocked",
        confidence: observationsCollected > 0 ? "source-dependent" : "high",
        sourcePaths: [source.observationInput].filter(Boolean),
        claim: `${observationsCollected} runtime sessions and ${completeSessions} complete casts are available.`,
      },
      {
        id: "runtime-schedule-evidence",
        status: runtimeScheduleEvidenceReady ? "passed" : "blocked",
        confidence: runtimeScheduleEvidenceReady ? "high-for-sample-contract" : "high",
        sourcePaths: [source.observationInput, source.boundaryAudit].filter(Boolean),
        claim: `${passedGates}/${gates.length} runtime cadence gates are satisfied.`,
      },
    ],
    safeguards: {
      emptyInputCannotProveSchedule: observationsCollected === 0,
      syntheticFixturesCannotPromoteCurrentDps: true,
      scheduleEvidenceDoesNotProveDamageTables: true,
      damageAmountsAreNotUsedForCurrentDps: true,
      currentUnknownsRemainNull: true,
      noTargetDatasetWrite: true,
      canModifyReliableDps: false,
    },
  };
}

module.exports = {
  analyzeRuntimeCadence,
};
