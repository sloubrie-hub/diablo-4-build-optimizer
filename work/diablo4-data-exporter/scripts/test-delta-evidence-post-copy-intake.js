const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-post-copy-intake-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const readyCopyGateFile = path.join(tempDir, "ready-copy-gate.json");

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

run("audit-delta-evidence-post-copy-intake.js", [
  "outputs/diablo4-delta-evidence-intake-copy-gate/delta-evidence-intake-copy-gate.json",
  "inputs/external-evidence-candidates.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "delta-evidence-post-copy-intake.json"));
const afterBlockedInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterBlockedInput), "blocked post-copy audit must not write real intake");
assertInvariant(blocked.summary.copyGateReady === false, "real post-copy audit should see closed copy gate");
assertInvariant(blocked.summary.addedCandidates === 0, "blocked post-copy audit should not simulate adding a candidate");
assertInvariant(blocked.summary.readyForManualReview === false, "blocked post-copy audit should not be ready for review");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked post-copy audit must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked post-copy audit must not auto-promote");

const readyCopyGate = readJson("outputs/diablo4-delta-evidence-intake-copy-gate/delta-evidence-intake-copy-gate.json");
readyCopyGate.summary.readyForManualCopy = true;
readyCopyGate.summary.failedChecks = 0;
readyCopyGate.summary.previewMergeReady = true;
readyCopyGate.summary.previewCandidates = 1;
readyCopyGate.summary.reviewerStatus = "pending";
readyCopyGate.candidateToCopy = {
  id: "draft-delta-proof-sf32-owner",
  domain: "delta-1663210",
  assetId: 1663210,
  entityId: "skill:1663210",
  source: {
    kind: "extracted-game-data",
    title: "Synthetic exact SF_32 source for post-copy test",
    version: "3.0.4.72271-test",
    capturedAt: "2026-07-15",
  },
  claim: {
    type: "sf32-field-ownership",
    field: "selector:949",
    value: "SF_32",
    excerpt: "1663210 selector:949 SF_32",
    mapping: "1663210 -> selector:949 -> SF_32",
  },
  reviewer: {
    status: "pending",
    notes: ["Synthetic pending candidate for post-copy intake test."],
  },
};
readyCopyGate.gateChecks = (readyCopyGate.gateChecks ?? []).map((check) => ({ ...check, status: "passed" }));
writeJson(readyCopyGateFile, readyCopyGate);

run("audit-delta-evidence-post-copy-intake.js", [
  readyCopyGateFile,
  "inputs/external-evidence-candidates.json",
  readyOutDir,
]);

const ready = readJson(path.join(readyOutDir, "delta-evidence-post-copy-intake.json"));
const afterReadyInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterReadyInput), "ready post-copy audit must not write real intake");
assertInvariant(ready.summary.copyGateReady === true, "synthetic post-copy audit should see open copy gate");
assertInvariant(ready.summary.addedCandidates === 1, "synthetic post-copy audit should simulate one added candidate");
assertInvariant(ready.summary.targetCandidateStatus === "pending", "simulated candidate must remain pending");
assertInvariant(ready.summary.readyForManualReview === true, "simulated candidate should be ready for manual review");
assertInvariant(ready.summary.auditAccepted === 0, "pending candidate must not be accepted");
assertInvariant(ready.summary.auditPending === 1, "pending candidate should be counted as pending");
assertInvariant(ready.blockers.targetCandidateBlockers.includes("manual-review-required"), "pending candidate must require manual review");
assertInvariant(ready.summary.acceptedForBridge === false, "post-copy audit must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "post-copy audit must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "post-copy audit must not allow reliable DPS");
assertInvariant(ready.summary.canUseForRanking === false, "post-copy audit must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "post-copy audit must not auto-promote");

console.log(JSON.stringify({
  status: "delta-evidence-post-copy-intake-test-ok",
  realReadyForManualReview: blocked.summary.readyForManualReview,
  syntheticReadyForManualReview: ready.summary.readyForManualReview,
  targetCandidateStatus: ready.summary.targetCandidateStatus,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
