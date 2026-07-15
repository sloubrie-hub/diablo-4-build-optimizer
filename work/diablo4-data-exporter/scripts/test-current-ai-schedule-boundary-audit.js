const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "work", "diablo4-data-exporter", "scripts", "build-current-ai-schedule-boundary-audit.js");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-current-ai-boundary-"));

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

const result = spawnSync(process.execPath, [
  scriptPath,
  "outputs/diablo4-current-power-activation-graph/current-power-activation-graph.json",
  "outputs/diablo4-current-casc-3.1.1/base/CoreTOC.dat",
  "outputs/tools/source-cache/DiabloTools-d4data/json/CoreTOC_flat.json",
  "outputs/tools/source-cache/DiabloTools-d4data/data-local-3.1.1/base/meta/Actor/Spiritborn_CentipedeRulerHead.acr.json",
  "outputs/tools/source-cache/DiabloTools-d4data/json/snoFileInfo.json",
  tempDir,
], {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) throw new Error(`AI schedule boundary audit failed with exit code ${result.status}`);

const report = JSON.parse(fs.readFileSync(path.join(tempDir, "current-ai-schedule-boundary-audit.json"), "utf8"));
const template = JSON.parse(fs.readFileSync(path.join(tempDir, "runtime-cadence-observation-template.json"), "utf8"));

assertInvariant(report.summary.assetId === 1663210, "AI boundary audit should target asset 1663210");
assertInvariant(report.summary.currentBuild === "3.1.1.72836", "AI boundary audit should target the local 3.1.1 build");
assertInvariant(report.summary.actorSnoId === 1858169, "AI boundary audit should target the centipede ruler actor");
assertInvariant(report.summary.aiBehaviorSnoId === 1858249, "AI boundary audit should target AIBehavior 1858249");
assertInvariant(report.summary.activeCoreTocEntries > 800_000, "active CoreTOC should contain the full named SNO registry");
assertInvariant(report.summary.activeCoreTocGroupSlots === 182, "active CoreTOC should expose 182 group slots");
assertInvariant(report.summary.activeAiBehaviorGroupEntries === 0, "active client should publish no AIBehavior entries");
assertInvariant(report.summary.activeScheduleGroupEntries === 0, "active client should publish no Schedule entries");
assertInvariant(report.summary.publishedScheduleGroups === 0, "all tracked schedule groups should remain unpublished");
assertInvariant(report.summary.aiBehaviorReferencePresent === true, "the actor should reference AIBehavior 1858249");
assertInvariant(report.summary.aiBehaviorNameResolved === false, "AIBehavior 1858249 should remain unnamed in active CoreTOC");
assertInvariant(report.summary.referenceSnapshotNameResolved === false, "AIBehavior 1858249 should remain unnamed in reference CoreTOC");
assertInvariant(report.summary.activeControlSnosResolved === 5, "five neighboring controls should resolve from active CoreTOC");
assertInvariant(report.summary.actorInlinePowerPairings === 0, "actor should not expose inline AI power pairings");
assertInvariant(report.summary.clientSnoBoundaryProven === true, "client SNO schedule boundary should be proven");
assertInvariant(report.summary.clientSnoExtractionExhausted === true, "direct client SNO extraction should be exhausted");
assertInvariant(report.summary.runtimeObservationRequired === true, "runtime observation should become mandatory");
assertInvariant(report.summary.runtimeObservationPlanReady === true, "runtime observation plan should be ready");
assertInvariant(report.summary.runtimeObservationsCollected === 0, "audit must not invent runtime observations");
assertInvariant(report.summary.aiScheduleReady === false, "AI schedule must remain blocked");
assertInvariant(report.summary.currentStrictDpsKnown === false, "AI boundary audit must not invent strict DPS");
assertInvariant(report.summary.canModifyReliableDps === false, "AI boundary audit must not modify reliable DPS");
assertInvariant(report.scheduleGroups.every((group) => group.activeEntries === 0), "all tracked schedule groups should be empty");
assertInvariant(report.runtimeObservationPlan.scenarios.length === 3, "observation plan should expose three scenarios");
assertInvariant(report.runtimeObservationPlan.minimumTotalCasts === 20, "observation plan should require twenty casts");
assertInvariant(report.safeguards.serverSideLocationIsInferenceNotFact === true, "server-side inference safeguard should remain active");
assertInvariant(template.sessions.length === 0, "observation template should start empty");
assertInvariant(template.eventSchema.eventKind.includes("attack-contact"), "observation template should support attack contact events");

console.log(JSON.stringify({
  status: "current-ai-schedule-boundary-audit-test-ok",
  activeCoreTocEntries: report.summary.activeCoreTocEntries,
  publishedScheduleGroups: report.summary.publishedScheduleGroups,
  controlsResolved: report.summary.activeControlSnosResolved,
  runtimeObservationRequired: report.summary.runtimeObservationRequired,
  currentStrictDpsKnown: report.summary.currentStrictDpsKnown,
}, null, 2));
