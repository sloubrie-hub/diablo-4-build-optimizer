const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-copy-gate-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const readyPreviewFile = path.join(tempDir, "ready-preview.json");

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

const originalInput = readJson("inputs/external-evidence-candidates.json");

run("build-delta-evidence-intake-copy-gate.js", [
  "outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "delta-evidence-intake-copy-gate.json"));
const afterBlockedInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterBlockedInput), "blocked copy gate must not write real intake");
assertInvariant(blocked.summary.readyForManualCopy === false, "real copy gate should remain blocked");
assertInvariant(blocked.summary.failedChecks > 0, "real copy gate should expose failed checks");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked copy gate must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked copy gate must not auto-promote");

const readyPreview = readJson("outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json");
readyPreview.summary.previewMergeReady = true;
readyPreview.summary.previewCandidates = 1;
readyPreview.summary.reviewerStatus = "pending";
readyPreview.summary.writesRealIntake = false;
readyPreview.summary.acceptedForBridge = false;
readyPreview.preview.candidates = [{
  id: "draft-delta-proof-sf32-owner",
  domain: "delta-1663210",
  assetId: 1663210,
  entityId: "skill:1663210",
  source: {
    kind: "extracted-game-data",
    title: "Synthetic exact SF_32 source for copy gate test",
    version: "3.0.4.72271-test",
    capturedAt: "2026-07-15",
  },
  claim: {
    type: "sf32-field-ownership",
    field: "selector:949",
    value: "SF_32",
  },
  reviewer: {
    status: "pending",
    notes: ["Synthetic pending candidate for copy gate test."],
  },
}];
writeJson(readyPreviewFile, readyPreview);

run("build-delta-evidence-intake-copy-gate.js", [
  readyPreviewFile,
  readyOutDir,
]);

const ready = readJson(path.join(readyOutDir, "delta-evidence-intake-copy-gate.json"));
const afterReadyInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterReadyInput), "ready copy gate must not write real intake");
assertInvariant(ready.summary.readyForManualCopy === true, "synthetic ready copy gate should open manual copy only");
assertInvariant(ready.summary.reviewerStatus === "pending", "copy candidate should stay pending");
assertInvariant(ready.candidateToCopy?.id === "draft-delta-proof-sf32-owner", "copy gate should expose target candidate");
assertInvariant(ready.summary.acceptedForBridge === false, "ready copy gate must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "ready copy gate must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "ready copy gate must not allow reliable DPS");
assertInvariant(ready.summary.canUseForRanking === false, "ready copy gate must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "ready copy gate must not auto-promote");
assertInvariant(ready.gateChecks.every((check) => check.status === "passed"), "ready fixture should pass copy checks");

console.log(JSON.stringify({
  status: "delta-evidence-intake-copy-gate-test-ok",
  realReadyForManualCopy: blocked.summary.readyForManualCopy,
  syntheticReadyForManualCopy: ready.summary.readyForManualCopy,
  reviewerStatus: ready.summary.reviewerStatus,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
