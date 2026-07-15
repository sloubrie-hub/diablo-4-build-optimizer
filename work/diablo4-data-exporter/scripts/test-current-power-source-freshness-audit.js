const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "work", "diablo4-data-exporter", "scripts", "build-current-power-source-freshness-audit.js");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-current-source-freshness-"));
const outDir = path.join(tempDir, "out");

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function makePayload(marker) {
  const buffer = Buffer.alloc(32);
  buffer.writeUInt32LE(0xdeadbeef, 0);
  buffer.writeUInt32LE(0, 4);
  buffer.writeUInt32LE(1663210, 16);
  buffer.writeUInt32LE(marker, 24);
  return buffer;
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

const manifestFile = path.join(tempDir, "manifest.json");
const activePayloadFile = path.join(tempDir, "active.pow");
const legacyPayloadFile = path.join(tempDir, "legacy.pow");
const activeParsedFile = path.join(tempDir, "active.json");
const referenceParsedFile = path.join(tempDir, "reference.json");
const referenceBuildFile = path.join(tempDir, "buildVersion.txt");

writeJson(manifestFile, {
  buildInfo: [{ Active: "1", Version: "3.1.1.72836" }],
  detectedBuild: { name: "72836_Win64Client_3_1_1" },
});
fs.writeFileSync(activePayloadFile, makePayload(311));
fs.writeFileSync(legacyPayloadFile, makePayload(304));

const formulas = Array.from({ length: 49 }, () => null);
formulas[27] = { tFormula: { value: "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate" } };
formulas[32] = { tFormula: { value: "0.2" } };
formulas[33] = { tFormula: { value: "Mod.Side2" } };
writeJson(activeParsedFile, {
  __fileName__: "active.pow",
  __snoID__: 1663210,
  __type__: "PowerDefinition",
  __typeHash__: 347016374,
  ptScriptFormulas: formulas,
});
writeJson(referenceParsedFile, {
  __fileName__: "reference.pow",
  __snoID__: 1663210,
  __type__: "PowerDefinition",
  __typeHash__: 347016374,
  ptScriptFormulas: formulas,
});
fs.writeFileSync(referenceBuildFile, "3.1.0.72592\n");

const result = spawnSync(process.execPath, [
  scriptPath,
  manifestFile,
  activePayloadFile,
  legacyPayloadFile,
  activeParsedFile,
  referenceParsedFile,
  referenceBuildFile,
  outDir,
], {
  cwd: rootDir,
  encoding: "utf8",
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) throw new Error(`freshness audit failed with exit code ${result.status}`);

const report = JSON.parse(fs.readFileSync(path.join(outDir, "current-power-source-freshness-audit.json"), "utf8"));

assertInvariant(report.summary.currentBuild === "3.1.1.72836", "current build should come from the local manifest");
assertInvariant(report.summary.assetId === 1663210, "target asset should remain 1663210");
assertInvariant(report.summary.sourceChangedSinceLegacyModel === true, "active source change should be detected");
assertInvariant(report.summary.activeMatchesReferenceSnapshot === true, "volatile file names must not alter semantic parity");
assertInvariant(report.summary.legacyConditionalBranchActive === false, "SF_32/SF_33 branch should be absent");
assertInvariant(report.summary.currentModelReady === false, "current model must remain closed before rebuild");
assertInvariant(report.summary.canUseForCurrentBuild === false, "legacy model must not be current-build ready");
assertInvariant(report.summary.canUseForReliableDps === false, "audit must not promote reliable DPS");
assertInvariant(report.formulaSlots.SF_27 === "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate", "SF_27 should be captured");
assertInvariant(report.formulaSlots.SF_32 === "0.2", "SF_32 should be captured");
assertInvariant(report.formulaSlots.SF_33 === "Mod.Side2", "SF_33 should be captured");
assertInvariant(report.legacyModelSnapshot.candidateDelta === 48960, "legacy delta should remain historical evidence");
assertInvariant(report.currentModelValues.strictDps === null, "current strict DPS should remain unknown");
assertInvariant(report.failedChecks.length === 0, "freshness audit checks should pass");

console.log(JSON.stringify({
  status: "current-power-source-freshness-audit-test-ok",
  currentBuild: report.summary.currentBuild,
  sourceChangedSinceLegacyModel: report.summary.sourceChangedSinceLegacyModel,
  currentModelReady: report.summary.currentModelReady,
  failedChecks: report.failedChecks.length,
}, null, 2));
