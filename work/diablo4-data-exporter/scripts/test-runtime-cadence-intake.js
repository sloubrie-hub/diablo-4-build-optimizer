const fs = require("fs");
const { createRuntimeCadenceCandidate } = require("../src/runtime-cadence-intake");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function event(observedAtSeconds, eventKind, attackKind = "none", damageInstanceCount = null) {
  return {
    observedAtSeconds,
    eventKind,
    attackKind,
    damageInstanceCount,
    notes: null,
  };
}

function validSession(id = "capture-baseline-001") {
  return {
    id,
    scenarioId: "baseline-sequence",
    sourceFile: "captures/centipede-baseline-001.mp4",
    captureFps: 60,
    attackSpeedState: {
      label: "baseline",
      attacksPerSecond: null,
      modifiers: [],
    },
    buildState: {
      blastOfBile: false,
      attackSpeedStableWithinCast: true,
      otherSkillModifiers: [],
    },
    events: [
      event(0, "cast-start"),
      event(1, "attack-contact", "projectile"),
      event(1.01, "damage-instance", "projectile", 1),
      event(3, "despawn"),
    ],
  };
}

const currentInput = readJson("inputs/current-runtime-cadence-observations.json");
const boundaryAudit = readJson("outputs/diablo4-current-ai-schedule-boundary-audit/current-ai-schedule-boundary-audit.json");
const schema = readJson("work/diablo4-data-exporter/schema/runtime-cadence-observations.schema.json");
const originalSessionCount = currentInput.sessions.length;
const context = {
  currentInput,
  boundaryAudit,
  schema,
  source: {
    observationInput: "inputs/current-runtime-cadence-observations.json",
    boundaryAudit: "outputs/diablo4-current-ai-schedule-boundary-audit/current-ai-schedule-boundary-audit.json",
    schema: "work/diablo4-data-exporter/schema/runtime-cadence-observations.schema.json",
  },
};

const accepted = createRuntimeCadenceCandidate({ ...context, session: validSession() });
assertInvariant(accepted.accepted === true, "a complete real-source session should be accepted");
assertInvariant(accepted.candidateInput.sessions.length === originalSessionCount + 1, "accepted candidate should append one session");
assertInvariant(accepted.sessionAnalysis.complete === true, "accepted session should be complete");
assertInvariant(accepted.analysis.summary.status === "runtime-observations-partial", "one accepted session should remain a partial sample");
assertInvariant(accepted.analysis.summary.currentStrictDpsKnown === false, "accepted session must not invent strict DPS");
assertInvariant(accepted.safeguards.writesObservationInput === false, "intake preview must not write the real input");
assertInvariant(currentInput.sessions.length === originalSessionCount, "intake preview must not mutate the current input");

const synthetic = validSession("synthetic-baseline-001");
synthetic.sourceFile = "synthetic-fixture://baseline-001";
const syntheticResult = createRuntimeCadenceCandidate({ ...context, session: synthetic });
assertInvariant(syntheticResult.accepted === false, "synthetic sessions must be rejected");
assertInvariant(syntheticResult.code === "synthetic-source-rejected", "synthetic rejection should expose its reason");

const duplicateInput = JSON.parse(JSON.stringify(currentInput));
duplicateInput.sessions.push(validSession());
const duplicate = createRuntimeCadenceCandidate({ ...context, currentInput: duplicateInput, session: validSession() });
assertInvariant(duplicate.accepted === false, "duplicate session ids must be rejected");
assertInvariant(duplicate.status === "conflict", "duplicate session ids should expose a conflict");

const incomplete = validSession("capture-incomplete-001");
incomplete.events = [event(0, "cast-start"), event(3, "despawn")];
const incompleteResult = createRuntimeCadenceCandidate({ ...context, session: incomplete });
assertInvariant(incompleteResult.accepted === false, "incomplete sessions must be rejected");
assertInvariant(incompleteResult.analysis.validation.issues.length >= 2, "incomplete sessions should expose contract issues");

const extraProperty = validSession("capture-extra-field-001");
extraProperty.unexpected = true;
const extraPropertyResult = createRuntimeCadenceCandidate({ ...context, session: extraProperty });
assertInvariant(extraPropertyResult.accepted === false, "unknown session properties must be rejected");
assertInvariant(extraPropertyResult.analysis.validation.issues.some((issue) => issue.code === "additional-property"), "unknown properties should be reported explicitly");

console.log(JSON.stringify({
  status: "runtime-cadence-intake-test-ok",
  acceptedSession: accepted.sessionAnalysis.id,
  syntheticRejected: syntheticResult.code,
  duplicateRejected: duplicate.code,
  incompleteIssues: incompleteResult.analysis.validation.issues.length,
  strictDpsKnown: accepted.analysis.summary.currentStrictDpsKnown,
  realInputSessions: currentInput.sessions.length,
}, null, 2));
