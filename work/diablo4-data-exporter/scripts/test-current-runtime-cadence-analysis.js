const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "work", "diablo4-data-exporter", "scripts", "build-current-runtime-cadence-analysis.js");
const boundaryFile = "outputs/diablo4-current-ai-schedule-boundary-audit/current-ai-schedule-boundary-audit.json";
const schemaFile = "work/diablo4-data-exporter/schema/runtime-cadence-observations.schema.json";
const realInputFile = "inputs/current-runtime-cadence-observations.json";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-runtime-cadence-"));

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function runAnalysis(inputFile, outDir) {
  const result = spawnSync(process.execPath, [
    scriptPath,
    inputFile,
    boundaryFile,
    schemaFile,
    outDir,
  ], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`Runtime cadence analysis failed with exit code ${result.status}`);
  return JSON.parse(fs.readFileSync(path.join(outDir, "current-runtime-cadence-analysis.json"), "utf8"));
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

function session({ id, scenarioId, blastOfBile, speedLabel, attacksPerSecond, contacts, despawnAt }) {
  const events = [event(0, "cast-start")];
  contacts.forEach(({ at, kind, damageInstances }) => {
    events.push(event(at, "attack-contact", kind));
    events.push(event(at + 0.01, "damage-instance", kind, damageInstances));
  });
  events.push(event(despawnAt, "despawn"));
  events.sort((left, right) => left.observedAtSeconds - right.observedAtSeconds);
  return {
    id,
    scenarioId,
    sourceFile: `synthetic-fixture://${id}`,
    captureFps: 60,
    attackSpeedState: {
      label: speedLabel,
      attacksPerSecond,
      modifiers: [],
    },
    buildState: {
      blastOfBile,
      attackSpeedStableWithinCast: true,
      otherSkillModifiers: [],
    },
    events,
  };
}

const emptyOutDir = path.join(tempDir, "empty");
const emptyReport = runAnalysis(realInputFile, emptyOutDir);
assertInvariant(emptyReport.summary.totalSessions === 0, "real runtime input should start with zero sessions");
assertInvariant(emptyReport.summary.completeSessions === 0, "empty runtime input should have zero complete sessions");
assertInvariant(emptyReport.summary.validationIssues === 0, "empty canonical input should satisfy the contract");
assertInvariant(emptyReport.summary.status === "waiting-for-runtime-observations", "empty runtime input should remain waiting");
assertInvariant(emptyReport.summary.runtimeScheduleEvidenceReady === false, "empty input must not prove the runtime schedule");
assertInvariant(emptyReport.summary.aiScheduleReady === false, "empty input must not unblock the AI schedule");
assertInvariant(emptyReport.summary.currentStrictDpsKnown === false, "empty input must not invent strict DPS");
assertInvariant(emptyReport.summary.canModifyReliableDps === false, "empty input must not modify reliable DPS");

const baselineContacts = [
  { at: 1, kind: "projectile", damageInstances: 1 },
  { at: 3, kind: "breath", damageInstances: 4 },
  { at: 6, kind: "projectile", damageInstances: 1 },
  { at: 9, kind: "breath", damageInstances: 4 },
];
const blastContacts = [{ at: 0.5, kind: "breath", damageInstances: 4 }];
const slowContacts = [1, 3, 5, 7].map((at, index) => ({
  at,
  kind: index % 2 === 0 ? "projectile" : "breath",
  damageInstances: index % 2 === 0 ? 1 : 4,
}));
const fastContacts = [0.5, 1.5, 2.5, 3.5, 4.5].map((at, index) => ({
  at,
  kind: index % 2 === 0 ? "projectile" : "breath",
  damageInstances: index % 2 === 0 ? 1 : 4,
}));
const sessions = [];
for (let index = 1; index <= 5; index += 1) {
  sessions.push(session({
    id: `synthetic-baseline-${index}`,
    scenarioId: "baseline-sequence",
    blastOfBile: false,
    speedLabel: "baseline",
    attacksPerSecond: null,
    contacts: baselineContacts,
    despawnAt: 15,
  }));
  sessions.push(session({
    id: `synthetic-blast-${index}`,
    scenarioId: "blast-of-bile-single-breath",
    blastOfBile: true,
    speedLabel: "baseline",
    attacksPerSecond: null,
    contacts: blastContacts,
    despawnAt: 1.5,
  }));
  sessions.push(session({
    id: `synthetic-speed-slow-${index}`,
    scenarioId: "attack-speed-scaling",
    blastOfBile: false,
    speedLabel: "slow-1.0",
    attacksPerSecond: 1,
    contacts: slowContacts,
    despawnAt: 9,
  }));
  sessions.push(session({
    id: `synthetic-speed-fast-${index}`,
    scenarioId: "attack-speed-scaling",
    blastOfBile: false,
    speedLabel: "fast-2.0",
    attacksPerSecond: 2,
    contacts: fastContacts,
    despawnAt: 6,
  }));
}

const syntheticInput = {
  $schema: "https://local.diablo4-build-optimizer/schemas/runtime-cadence-observations.schema.json",
  schemaVersion: 1,
  mode: "runtime-cadence-observation-v1",
  currentBuild: "3.1.1.72836",
  assetId: 1663210,
  actorSnoId: 1858169,
  aiBehaviorSnoId: 1858249,
  notes: ["Temporary synthetic fixture generated by the test."],
  sessions,
};
const syntheticInputFile = path.join(tempDir, "synthetic-runtime-cadence-observations.json");
const syntheticOutDir = path.join(tempDir, "synthetic");
fs.writeFileSync(syntheticInputFile, JSON.stringify(syntheticInput, null, 2));
const syntheticReport = runAnalysis(syntheticInputFile, syntheticOutDir);

assertInvariant(syntheticReport.summary.totalSessions === 20, "synthetic fixture should contain twenty sessions");
assertInvariant(syntheticReport.summary.completeSessions === 20, "all synthetic sessions should be complete");
assertInvariant(syntheticReport.summary.validationIssues === 0, "synthetic fixture should satisfy the observation contract");
assertInvariant(syntheticReport.summary.baselineCasts === 5, "synthetic fixture should satisfy the baseline sample");
assertInvariant(syntheticReport.summary.blastOfBileCasts === 5, "synthetic fixture should satisfy the Blast of Bile sample");
assertInvariant(syntheticReport.summary.speedTiersReady === 2, "synthetic fixture should satisfy two speed tiers");
assertInvariant(syntheticReport.summary.blastSingleBreathConfirmed === true, "synthetic fixture should confirm one Blast of Bile breath");
assertInvariant(syntheticReport.summary.attackSpeedScalingMeasured === true, "synthetic fixture should demonstrate speed scaling");
assertInvariant(syntheticReport.summary.runtimeScheduleEvidenceReady === true, "synthetic fixture should exercise every runtime schedule gate");
assertInvariant(syntheticReport.summary.aiScheduleReady === true, "complete synthetic cadence should exercise the AI schedule-ready state");
assertInvariant(syntheticReport.summary.currentStrictDpsKnown === false, "synthetic cadence must not invent strict DPS");
assertInvariant(syntheticReport.summary.canModifyReliableDps === false, "synthetic cadence must not modify reliable DPS");
assertInvariant(syntheticReport.safeguards.syntheticFixturesCannotPromoteCurrentDps === true, "synthetic fixture safeguard should remain active");

const realInput = JSON.parse(fs.readFileSync(realInputFile, "utf8"));
assertInvariant(realInput.sessions.length === 0, "synthetic test must leave the real runtime input empty");

console.log(JSON.stringify({
  status: "current-runtime-cadence-analysis-test-ok",
  realSessions: emptyReport.summary.totalSessions,
  syntheticSessions: syntheticReport.summary.totalSessions,
  syntheticPassedGates: syntheticReport.summary.passedGates,
  syntheticRuntimeScheduleEvidenceReady: syntheticReport.summary.runtimeScheduleEvidenceReady,
  currentStrictDpsKnown: syntheticReport.summary.currentStrictDpsKnown,
}, null, 2));
