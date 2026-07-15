const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-review-gate-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const readyPostCopyFile = path.join(tempDir, "ready-post-copy.json");

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

run("build-delta-evidence-manual-review-gate.js", [
  "outputs/diablo4-delta-evidence-post-copy-intake/delta-evidence-post-copy-intake.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "delta-evidence-manual-review-gate.json"));
assertInvariant(blocked.summary.readyForReviewerDecision === false, "real review gate should remain blocked");
assertInvariant(blocked.summary.failedChecks > 0, "real review gate should expose failed checks");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked review gate must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked review gate must not auto-promote");

const readyPostCopy = readJson("outputs/diablo4-delta-evidence-post-copy-intake/delta-evidence-post-copy-intake.json");
readyPostCopy.summary.copyGateReady = true;
readyPostCopy.summary.addedCandidates = 1;
readyPostCopy.summary.auditCandidates = 1;
readyPostCopy.summary.auditAccepted = 0;
readyPostCopy.summary.auditPending = 1;
readyPostCopy.summary.targetCandidateStatus = "pending";
readyPostCopy.summary.readyForManualReview = true;
readyPostCopy.summary.writesRealIntake = false;
readyPostCopy.summary.acceptedForBridge = false;
readyPostCopy.targetCandidate = {
  id: "draft-delta-proof-sf32-owner",
  domain: "delta-1663210",
  assetId: 1663210,
  entityId: "skill:1663210",
  reviewer: {
    status: "pending",
    notes: ["Synthetic pending candidate for review gate test."],
  },
  status: "pending",
  blockers: ["manual-review-required"],
};
readyPostCopy.blockers = {
  ...(readyPostCopy.blockers ?? {}),
  targetCandidateBlockers: ["manual-review-required"],
};
writeJson(readyPostCopyFile, readyPostCopy);

run("build-delta-evidence-manual-review-gate.js", [
  readyPostCopyFile,
  readyOutDir,
]);

const ready = readJson(path.join(readyOutDir, "delta-evidence-manual-review-gate.json"));
assertInvariant(ready.summary.readyForReviewerDecision === true, "synthetic ready review gate should open reviewer decision only");
assertInvariant(ready.summary.targetCandidateStatus === "pending", "review gate target should remain pending");
assertInvariant(ready.summary.reviewBlockerPresent === true, "manual-review-required blocker should remain present");
assertInvariant(ready.summary.acceptedForBridge === false, "ready review gate must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "ready review gate must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "ready review gate must not allow reliable DPS");
assertInvariant(ready.summary.canUseForRanking === false, "ready review gate must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "ready review gate must not auto-promote");
assertInvariant(ready.gateChecks.every((check) => check.status === "passed"), "ready fixture should pass review gate checks");
assertInvariant(ready.reviewerDecisionTemplate.allowedStatuses.includes("approved"), "template should include approved as manual option");
assertInvariant(ready.reviewerDecisionTemplate.forbiddenAutomaticActions.includes("modifier reliableDps"), "template should forbid reliableDps changes");

console.log(JSON.stringify({
  status: "delta-evidence-manual-review-gate-test-ok",
  realReadyForReviewerDecision: blocked.summary.readyForReviewerDecision,
  syntheticReadyForReviewerDecision: ready.summary.readyForReviewerDecision,
  targetCandidateStatus: ready.summary.targetCandidateStatus,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
