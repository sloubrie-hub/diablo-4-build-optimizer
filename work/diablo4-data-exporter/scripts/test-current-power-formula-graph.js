const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "work", "diablo4-data-exporter", "scripts", "build-current-power-formula-graph.js");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-current-formula-graph-"));
const parsedFile = path.join(tempDir, "active.json");
const freshnessFile = path.join(tempDir, "freshness.json");
const outDir = path.join(tempDir, "out");

function formula(value) {
  return { tFormula: { value, compiled: "" } };
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

fs.writeFileSync(parsedFile, JSON.stringify({
  __snoID__: 1663210,
  ptScriptFormulas: [
    formula("0.5"),
    formula("SF_0 * Table(34, sLevel)"),
    formula("Mod.UpgradeB"),
    formula("Per_Damage_Type_Buff_Duration_Bonus_Percent#Poison"),
  ],
  arPayloads: [
    { dwID: 10, dwPayloadId: 1, eForcedDamageType: 4, eClassBaseDamageScalar: 5, tDamage: { tHitpointScalar: { value: "SF_1 * 4" } } },
    { dwID: 11, dwPayloadId: 2, eForcedDamageType: 4, eClassBaseDamageScalar: 5, tDamage: { tHitpointScalar: { value: "SF_3" } } },
  ],
  arBuffs: [
    { tDuration: { value: "2" }, tDOT: { eDamageType: 4, eClassBaseDamageScalar: 5, tDamage: { tHitpointScalar: { value: "SF_0" } } } },
  ],
}, null, 2));
fs.writeFileSync(freshnessFile, JSON.stringify({
  summary: { assetId: 1663210, currentBuild: "3.1.1.72836" },
  activeBinary: { sha256: "active-sha" },
}, null, 2));

const result = spawnSync(process.execPath, [scriptPath, parsedFile, freshnessFile, outDir], {
  cwd: rootDir,
  encoding: "utf8",
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) throw new Error(`formula graph failed with exit code ${result.status}`);

const report = JSON.parse(fs.readFileSync(path.join(outDir, "current-power-formula-graph.json"), "utf8"));

assertInvariant(report.summary.assetId === 1663210, "formula graph should target 1663210");
assertInvariant(report.summary.formulaNodes === 4, "formula graph should expose four formula nodes");
assertInvariant(report.summary.formulaEdges === 1, "formula graph should expose one formula dependency");
assertInvariant(report.summary.payloadDamageConsumers === 2, "formula graph should expose two payload consumers");
assertInvariant(report.summary.dotDamageConsumers === 1, "formula graph should expose one DOT consumer");
assertInvariant(report.summary.damageConsumers === 3, "formula graph should expose three damage consumers");
assertInvariant(report.summary.normalizedRankOneConsumers === 2, "two consumers should resolve structurally");
assertInvariant(report.summary.unresolvedConsumers === 1, "external poison duration should remain unresolved");
assertInvariant(report.summary.buildStateSlots === 1, "one build-state slot should be detected");
assertInvariant(report.summary.connectedBuildStateSlots === 0, "unreferenced build-state slot must not be invented as a damage condition");
assertInvariant(report.summary.currentStrictDpsKnown === false, "formula graph must not invent current strict DPS");
assertInvariant(report.summary.canModifyReliableDps === false, "formula graph must not modify reliable DPS");
assertInvariant(report.damageConsumers.every((consumer) => consumer.activationStatus === "unmapped"), "all activation states should remain unmapped");
assertInvariant(report.safeguards.normalizedValuesAreNotDps === true, "normalized values must be labelled non-DPS");

console.log(JSON.stringify({
  status: "current-power-formula-graph-test-ok",
  formulaNodes: report.summary.formulaNodes,
  damageConsumers: report.summary.damageConsumers,
  normalizedConsumers: report.summary.normalizedRankOneConsumers,
  currentStrictDpsKnown: report.summary.currentStrictDpsKnown,
}, null, 2));
