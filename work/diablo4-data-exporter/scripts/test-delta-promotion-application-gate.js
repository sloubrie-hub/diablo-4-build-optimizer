const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-promotion-application-gate-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const readyDryRunFile = path.join(tempDir, "ready-dry-run.json");

function run(scriptName, args) {
  const result = spawnSync(process.execPath, [path.join(scriptDir, scriptName), ...args], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${scriptName} failed with exit code ${result.status}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

const originalDataset = fs.readFileSync("outputs/diablo4-target-dataset/target-dataset.json", "utf8");

run("build-delta-promotion-application-gate.js", [
  "outputs/diablo4-delta-promotion-implementation-dry-run/delta-promotion-implementation-dry-run.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "delta-promotion-application-gate.json"));
assertInvariant(fs.readFileSync("outputs/diablo4-target-dataset/target-dataset.json", "utf8") === originalDataset, "blocked gate must not write target dataset");
assertInvariant(blocked.summary.manualApplyAllowed === false, "real application gate should remain blocked");
assertInvariant(blocked.summary.writesTargetDataset === false, "blocked gate must not write target dataset");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked gate must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked gate must not auto-promote");

const readyDryRun = readJson("outputs/diablo4-delta-promotion-implementation-dry-run/delta-promotion-implementation-dry-run.json");
readyDryRun.summary.patchPreviewReady = true;
readyDryRun.summary.failedChecks = 0;
readyDryRun.summary.writesTargetDataset = false;
readyDryRun.summary.canModifyReliableDps = false;
readyDryRun.summary.promotionReady = false;
readyDryRun.dryRunChecks = readyDryRun.dryRunChecks.map((check) => ({
  ...check,
  status: "passed",
}));
writeJson(readyDryRunFile, readyDryRun);

run("build-delta-promotion-application-gate.js", [
  readyDryRunFile,
  readyOutDir,
]);

const ready = readJson(path.join(readyOutDir, "delta-promotion-application-gate.json"));
assertInvariant(fs.readFileSync("outputs/diablo4-target-dataset/target-dataset.json", "utf8") === originalDataset, "ready gate must not write target dataset");
assertInvariant(ready.summary.manualApplyAllowed === true, "synthetic application gate should allow manual apply only");
assertInvariant(ready.summary.patchBefore === 163200, "ready gate should preserve patch before value");
assertInvariant(ready.summary.patchAfter === 212160, "ready gate should preserve patch after value");
assertInvariant(ready.summary.writesTargetDataset === false, "ready gate must not write target dataset");
assertInvariant(ready.summary.acceptedForBridge === false, "ready gate must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "ready gate must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "ready gate must not allow reliable DPS");
assertInvariant(ready.summary.canUseForRanking === false, "ready gate must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "ready gate must not auto-promote");
assertInvariant(ready.gateChecks.every((check) => check.status === "passed"), "ready fixture should pass application gate checks");
assertInvariant(ready.applyContract.forbiddenHere.includes("ecrire dans target-dataset.json"), "apply contract should forbid writes here");

console.log(JSON.stringify({
  status: "delta-promotion-application-gate-test-ok",
  realManualApplyAllowed: blocked.summary.manualApplyAllowed,
  syntheticManualApplyAllowed: ready.summary.manualApplyAllowed,
  patchBefore: ready.summary.patchBefore,
  patchAfter: ready.summary.patchAfter,
  writesTargetDataset: ready.summary.writesTargetDataset,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
