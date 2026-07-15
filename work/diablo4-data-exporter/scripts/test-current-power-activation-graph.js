const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "work", "diablo4-data-exporter", "scripts", "build-current-power-activation-graph.js");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-current-activation-graph-"));

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

const result = spawnSync(process.execPath, [
  scriptPath,
  "outputs/diablo4-current-power-source-freshness-audit/current-power-source-freshness-audit.json",
  "outputs/diablo4-current-power-formula-graph/current-power-formula-graph.json",
  "outputs/diablo4-current-casc-3.1.1",
  "outputs/tools/source-cache/DiabloTools-d4data/data-local-3.1.1",
  "outputs/tools/source-cache/DiabloTools-d4data/json",
  "outputs/tools/source-cache/DiabloTools-d4data/json/enUS_Text/meta/StringList/Power_Spiritborn_Centipede_Ultimate.stl.json",
  tempDir,
], {
  cwd: rootDir,
  encoding: "utf8",
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) throw new Error(`activation graph failed with exit code ${result.status}`);

const report = JSON.parse(fs.readFileSync(path.join(tempDir, "current-power-activation-graph.json"), "utf8"));
const byChain = new Map(report.activationChains.map((chain) => [chain.id, chain]));

assertInvariant(report.summary.assetId === 1663210, "activation graph should target 1663210");
assertInvariant(report.summary.currentBuild === "3.1.1.72836", "activation graph should target the local 3.1.1 build");
assertInvariant(report.summary.gameplaySources === 14, "activation graph should track fourteen active gameplay resources");
assertInvariant(report.summary.gameplaySourcesSemanticallyMatched === 14, "all active gameplay resources should match the reference semantics");
assertInvariant(report.summary.gameplaySourceParityReady === true, "gameplay source parity should be ready");
assertInvariant(report.summary.childPowers === 3, "three pet child powers should be tracked");
assertInvariant(report.summary.runtimeDamagePowers === 2, "two child powers should carry runtime damage");
assertInvariant(report.summary.activationChains === 5, "five source-backed activation chains should be exposed");
assertInvariant(report.summary.mappedPayloadConsumers === 3, "three payload consumers should be attributed");
assertInvariant(report.summary.mappedDotConsumers === 2, "two DOT consumers should be attributed");
assertInvariant(report.summary.attributedDamageConsumers === 5, "five damage consumers should have source-backed attribution");
assertInvariant(report.summary.unattributedDamageConsumers === 5, "five damage consumers should remain unattributed");
assertInvariant(report.summary.aiBehaviorSnoIds.includes(1858249), "AIBehavior 1858249 should be exposed as the schedule gap");
assertInvariant(report.summary.aiScheduleReady === false, "AI schedule must remain blocked");
assertInvariant(report.summary.activationGraphPartial === true, "activation graph should record partial progress");
assertInvariant(report.summary.activationGraphReady === false, "activation graph must not be promoted prematurely");
assertInvariant(report.summary.currentStrictDpsKnown === false, "activation graph must not invent strict DPS");
assertInvariant(report.summary.canModifyReliableDps === false, "activation graph must not modify reliable DPS");
assertInvariant(byChain.get("default-breath")?.runtime?.parentFormulaSlot === "SF_13", "default breath should link parent SF_13");
assertInvariant(byChain.get("blast-of-bile-breath")?.runtime?.parentFormulaSlot === "SF_42", "Blast of Bile should link parent SF_42");
assertInvariant(byChain.get("default-projectile")?.runtime?.parentFormulaSlot === "SF_18", "projectile should link parent SF_18");
assertInvariant(byChain.get("spew-putrefaction-dot")?.parent?.symbolicHash === 3177794565, "Spew Putrefaction should hash-link UPGRADE_POISON_DOT");
assertInvariant(byChain.get("sky-and-soil-dot")?.parent?.symbolicHash === 3595636592, "Sky and Soil should hash-link UPGRADE_C_DOT");
assertInvariant(report.petDispatch.nominalAnimationTimings.projectile.contactFrames.includes(8), "projectile contact frame should be 8");
assertInvariant(report.petDispatch.nominalAnimationTimings.breath.contactFrames.includes(15), "breath contact frame should be 15");
assertInvariant(report.safeguards.animationTimingsAreNominalNotCadence === true, "animation timing safeguard should stay active");
assertInvariant(report.safeguards.parentX4IsAggregateNotObservedHitCount === true, "x4 aggregate safeguard should stay active");
assertInvariant(report.safeguards.referenceLocalizationIsNotClaimedCurrent === true, "reference localization must not be claimed as active local text");

console.log(JSON.stringify({
  status: "current-power-activation-graph-test-ok",
  sourcesMatched: report.summary.gameplaySourcesSemanticallyMatched,
  activationChains: report.summary.activationChains,
  attributedDamageConsumers: report.summary.attributedDamageConsumers,
  aiScheduleReady: report.summary.aiScheduleReady,
  currentStrictDpsKnown: report.summary.currentStrictDpsKnown,
}, null, 2));
