const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const scriptFile = path.join(__dirname, "build-external-evidence-submission-manual-review-gate.js");
const postCopyFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-evidence-submission-post-copy-intake",
  "external-evidence-submission-post-copy-intake.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runGate(inputFile, outDir) {
  execFileSync(nodeBin, [scriptFile, inputFile, outDir], {
    cwd: rootDir,
    stdio: "pipe",
  });
  return readJson(path.join(outDir, "external-evidence-submission-manual-review-gate.json"));
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-review-gate-"));
const realGate = runGate(postCopyFile, path.join(tmpRoot, "real"));

assert(realGate.summary.readyForReviewerDecision === false, "real review gate must remain blocked");
assert(realGate.summary.failedChecks > 0, "real review gate must expose failed checks");
assert(realGate.summary.writesRealIntake === false, "real review gate must not write intake");
assert(realGate.summary.acceptedForBridge === false, "real review gate must not accept bridge");
assert(realGate.summary.canModifyReliableDps === false, "real review gate must not modify reliable DPS");
assert(realGate.summary.promotionReady === false, "real review gate must not promote");

const syntheticPostCopy = readJson(postCopyFile);
syntheticPostCopy.summary = {
  ...syntheticPostCopy.summary,
  readyForManualReview: true,
  targetCandidateStatus: "pending",
  writesRealIntake: false,
  acceptedForBridge: false,
  canModifyReliableDps: false,
  canUseForReliableDps: false,
  canUseForRanking: false,
  promotionReady: false,
};
syntheticPostCopy.targetCandidate = {
  id: "draft-delta-proof-sf32-owner",
  reviewer: {
    status: "pending",
  },
};
syntheticPostCopy.blockers = {
  ...(syntheticPostCopy.blockers ?? {}),
  targetCandidateBlockers: ["manual-review-required"],
};
const syntheticPostCopyFile = path.join(tmpRoot, "synthetic-post-copy.json");
fs.writeFileSync(syntheticPostCopyFile, JSON.stringify(syntheticPostCopy, null, 2));

const readyGate = runGate(syntheticPostCopyFile, path.join(tmpRoot, "ready"));

assert(readyGate.summary.readyForReviewerDecision === true, "synthetic review gate should be ready");
assert(readyGate.summary.failedChecks === 0, "synthetic review gate should pass checks");
assert(readyGate.summary.targetCandidateStatus === "pending", "ready gate must keep candidate pending");
assert(readyGate.summary.reviewBlockerPresent === true, "ready gate must preserve manual review blocker");
assert(readyGate.summary.writesRealIntake === false, "ready gate must not write intake");
assert(readyGate.summary.acceptedForBridge === false, "ready gate must not accept bridge");
assert(readyGate.summary.canModifyReliableDps === false, "ready gate must not modify reliable DPS");
assert(readyGate.summary.canUseForReliableDps === false, "ready gate must not allow reliable DPS");
assert(readyGate.summary.canUseForRanking === false, "ready gate must not allow ranking");
assert(readyGate.summary.promotionReady === false, "ready gate must not promote");
assert(readyGate.reviewerDecisionTemplate.allowedStatuses.includes("approved"), "ready gate must allow approved as manual decision");
assert(readyGate.reviewerDecisionTemplate.allowedStatuses.includes("rejected"), "ready gate must allow rejected as manual decision");

console.log("external-evidence-submission-manual-review-gate-test-ok");
