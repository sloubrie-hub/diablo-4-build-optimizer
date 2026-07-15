const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-review-decision-audit-"));
const blockedOutDir = path.join(tempDir, "blocked");
const approvedOutDir = path.join(tempDir, "approved");
const rejectedOutDir = path.join(tempDir, "rejected");
const readyPackageFile = path.join(tempDir, "ready-package.json");
const approvedDecisionFile = path.join(tempDir, "approved-decision.json");
const rejectedDecisionFile = path.join(tempDir, "rejected-decision.json");

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

run("audit-delta-evidence-review-decision.js", [
  "outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.json",
  "inputs/delta-evidence-review-decision.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "delta-evidence-review-decision-audit.json"));
assertInvariant(blocked.summary.decisionAcceptedForPromotionReview === false, "real decision audit should not accept promotion review");
assertInvariant(blocked.summary.readyForPromotionAudit === false, "real decision audit should not open promotion audit");
assertInvariant(blocked.summary.failedChecks > 0, "real decision audit should expose failed checks");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked decision audit must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked decision audit must not auto-promote");
assertInvariant(fs.existsSync(path.join(blockedOutDir, "delta-evidence-review-decision.template.json")), "blocked audit should emit template");

const readyPackage = readJson("outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.json");
readyPackage.summary.readyForDecisionInput = true;
readyPackage.summary.targetCandidateStatus = "pending";
readyPackage.summary.reviewBlockerPresent = true;
writeJson(readyPackageFile, readyPackage);

const baseDecision = {
  schemaVersion: 1,
  candidateId: "draft-delta-proof-sf32-owner",
  reviewer: {
    id: "synthetic-reviewer",
    date: "2026-07-15",
    decision: "source checked in synthetic fixture",
    reason: "Synthetic fixture exercises decision audit without promoting reliable DPS.",
    sourceRechecked: true,
  },
};

writeJson(approvedDecisionFile, {
  ...baseDecision,
  reviewer: {
    ...baseDecision.reviewer,
    status: "approved",
  },
});

run("audit-delta-evidence-review-decision.js", [
  readyPackageFile,
  approvedDecisionFile,
  approvedOutDir,
]);

const approved = readJson(path.join(approvedOutDir, "delta-evidence-review-decision-audit.json"));
assertInvariant(approved.summary.decisionAcceptedForPromotionReview === true, "approved fixture should open promotion audit");
assertInvariant(approved.summary.readyForPromotionAudit === true, "approved fixture should be ready only for promotion audit");
assertInvariant(approved.summary.acceptedForBridge === false, "approved audit must not accept bridge");
assertInvariant(approved.summary.canModifyReliableDps === false, "approved audit must not modify reliable DPS");
assertInvariant(approved.summary.canUseForReliableDps === false, "approved audit must not allow reliable DPS");
assertInvariant(approved.summary.canUseForRanking === false, "approved audit must not allow ranking");
assertInvariant(approved.summary.promotionReady === false, "approved audit must not auto-promote");
assertInvariant(approved.auditChecks.every((check) => check.status === "passed"), "approved fixture should pass checks");

writeJson(rejectedDecisionFile, {
  ...baseDecision,
  reviewer: {
    ...baseDecision.reviewer,
    status: "rejected",
    reason: "Synthetic fixture rejects the source mapping.",
  },
});

run("audit-delta-evidence-review-decision.js", [
  readyPackageFile,
  rejectedDecisionFile,
  rejectedOutDir,
]);

const rejected = readJson(path.join(rejectedOutDir, "delta-evidence-review-decision-audit.json"));
assertInvariant(rejected.summary.decisionRejected === true, "rejected fixture should be rejected");
assertInvariant(rejected.summary.decisionAcceptedForPromotionReview === false, "rejected fixture must not open promotion review");
assertInvariant(rejected.summary.readyForPromotionAudit === false, "rejected fixture must not be ready for promotion audit");
assertInvariant(rejected.summary.canModifyReliableDps === false, "rejected audit must not modify reliable DPS");
assertInvariant(rejected.summary.promotionReady === false, "rejected audit must not auto-promote");
assertInvariant(rejected.auditChecks.every((check) => check.status === "passed"), "rejected fixture should pass checks");

console.log(JSON.stringify({
  status: "delta-evidence-review-decision-audit-test-ok",
  realReadyForPromotionAudit: blocked.summary.readyForPromotionAudit,
  approvedReadyForPromotionAudit: approved.summary.readyForPromotionAudit,
  rejectedDecisionRejected: rejected.summary.decisionRejected,
  canModifyReliableDps: approved.summary.canModifyReliableDps,
  promotionReady: approved.summary.promotionReady,
}, null, 2));
