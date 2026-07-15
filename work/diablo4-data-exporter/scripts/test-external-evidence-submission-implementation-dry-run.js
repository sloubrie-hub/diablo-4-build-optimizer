const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-dry-run-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const readyAuditFile = path.join(tempDir, "ready-external-promotion-audit.json");

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

run("build-external-evidence-submission-implementation-dry-run.js", [
  "outputs/diablo4-external-evidence-submission-promotion-audit/external-evidence-submission-promotion-audit.json",
  "outputs/diablo4-target-dataset/target-dataset.json",
  blockedOutDir,
]);

const afterBlockedDataset = fs.readFileSync("outputs/diablo4-target-dataset/target-dataset.json", "utf8");
const blocked = readJson(path.join(blockedOutDir, "external-evidence-submission-implementation-dry-run.json"));
assertInvariant(afterBlockedDataset === originalDataset, "blocked external dry-run must not write target dataset");
assertInvariant(blocked.summary.patchPreviewReady === false, "real external implementation dry-run should remain blocked");
assertInvariant(blocked.summary.writesTargetDataset === false, "blocked external dry-run must not write target dataset");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked external dry-run must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked external dry-run must not auto-promote");

const readyAudit = readJson("outputs/diablo4-external-evidence-submission-promotion-audit/external-evidence-submission-promotion-audit.json");
readyAudit.summary.readyForPromotionImplementation = true;
readyAudit.summary.failedChecks = 0;
readyAudit.summary.failedGateIds = [];
readyAudit.summary.canModifyReliableDps = false;
readyAudit.summary.promotionReady = false;
readyAudit.auditChecks = readyAudit.auditChecks.map((check) => ({
  ...check,
  status: "passed",
}));
writeJson(readyAuditFile, readyAudit);

run("build-external-evidence-submission-implementation-dry-run.js", [
  readyAuditFile,
  "outputs/diablo4-target-dataset/target-dataset.json",
  readyOutDir,
]);

const afterReadyDataset = fs.readFileSync("outputs/diablo4-target-dataset/target-dataset.json", "utf8");
const ready = readJson(path.join(readyOutDir, "external-evidence-submission-implementation-dry-run.json"));
assertInvariant(afterReadyDataset === originalDataset, "ready external dry-run must not write target dataset");
assertInvariant(ready.summary.patchPreviewReady === true, "synthetic external dry-run should produce patch preview");
assertInvariant(ready.summary.proposedReliableDps === 212160, "synthetic external dry-run proposed reliable DPS should be 212160");
assertInvariant(ready.summary.writesTargetDataset === false, "ready external dry-run must not write target dataset");
assertInvariant(ready.summary.acceptedForBridge === false, "ready external dry-run must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "ready external dry-run must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "ready external dry-run must not allow reliable DPS yet");
assertInvariant(ready.summary.canUseForRanking === false, "ready external dry-run must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "ready external dry-run must not auto-promote");
assertInvariant(ready.patchPreview?.before === 163200, "patch preview should start from strict reliable value");
assertInvariant(ready.patchPreview?.after === 212160, "patch preview should target proposed value");
assertInvariant(ready.dryRunChecks.every((check) => check.status === "passed"), "ready fixture should pass external dry-run checks");

console.log(JSON.stringify({
  status: "external-evidence-submission-implementation-dry-run-test-ok",
  realPatchPreviewReady: blocked.summary.patchPreviewReady,
  syntheticPatchPreviewReady: ready.summary.patchPreviewReady,
  patchBefore: ready.patchPreview.before,
  patchAfter: ready.patchPreview.after,
  writesTargetDataset: ready.summary.writesTargetDataset,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
