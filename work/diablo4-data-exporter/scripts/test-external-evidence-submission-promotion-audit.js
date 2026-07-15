const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-promotion-audit-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const approvedDecisionAuditFile = path.join(tempDir, "approved-decision-audit.json");
const readyReliableGatesFile = path.join(tempDir, "ready-reliable-gates.json");
const readyPromotionReviewFile = path.join(tempDir, "ready-promotion-review.json");

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

run("build-external-evidence-submission-promotion-audit.js", [
  "outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json",
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  "outputs/diablo4-delta-promotion-review/delta-promotion-review.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "external-evidence-submission-promotion-audit.json"));
assertInvariant(blocked.summary.readyForPromotionImplementation === false, "real external promotion audit should remain blocked");
assertInvariant(blocked.summary.failedChecks > 0, "blocked external promotion audit should expose failed checks");
assertInvariant(blocked.summary.failedGateIds.includes("sf32-field"), "real external promotion audit should keep SF_32 blocked");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked external promotion audit must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked external promotion audit must not auto-promote");

const approvedDecisionAudit = readJson("outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json");
approvedDecisionAudit.summary.decisionAcceptedForPromotionReview = true;
approvedDecisionAudit.summary.readyForPromotionAudit = true;
approvedDecisionAudit.summary.reviewerStatus = "approved";
approvedDecisionAudit.summary.canModifyReliableDps = false;
approvedDecisionAudit.summary.promotionReady = false;
writeJson(approvedDecisionAuditFile, approvedDecisionAudit);

const readyReliableGates = readJson("outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json");
readyReliableGates.summary.failedGates = 0;
readyReliableGates.summary.failedGateIds = [];
readyReliableGates.summary.activeBlockerKinds = [];
readyReliableGates.summary.canUseForReliableDps = false;
readyReliableGates.summary.canUseForRanking = false;
readyReliableGates.summary.canModifyReliableDps = false;
readyReliableGates.summary.promotionReady = false;
readyReliableGates.gates = readyReliableGates.gates.map((gate) => ({
  ...gate,
  status: "passed",
  reason: `Synthetic passed gate for external promotion audit test: ${gate.id}`,
}));
writeJson(readyReliableGatesFile, readyReliableGates);

const readyPromotionReview = readJson("outputs/diablo4-delta-promotion-review/delta-promotion-review.json");
readyPromotionReview.summary.readyForManualReview = true;
readyPromotionReview.summary.failedChecks = 0;
readyPromotionReview.summary.canModifyReliableDps = false;
readyPromotionReview.summary.promotionReady = false;
readyPromotionReview.reviewChecks = readyPromotionReview.reviewChecks.map((check) => ({
  ...check,
  status: "passed",
}));
writeJson(readyPromotionReviewFile, readyPromotionReview);

run("build-external-evidence-submission-promotion-audit.js", [
  approvedDecisionAuditFile,
  readyReliableGatesFile,
  readyPromotionReviewFile,
  readyOutDir,
]);

const ready = readJson(path.join(readyOutDir, "external-evidence-submission-promotion-audit.json"));
assertInvariant(ready.summary.readyForPromotionImplementation === true, "synthetic external promotion audit should open implementation only");
assertInvariant(ready.summary.proposedReliableDps === 212160, "synthetic proposed reliable DPS should equal strict plus blocked delta");
assertInvariant(ready.summary.acceptedForBridge === false, "ready external promotion audit must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "ready external promotion audit must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "ready external promotion audit must not allow reliable DPS");
assertInvariant(ready.summary.canUseForRanking === false, "ready external promotion audit must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "ready external promotion audit must not auto-promote");
assertInvariant(ready.auditChecks.every((check) => check.status === "passed"), "ready fixture should pass external promotion audit checks");
assertInvariant(ready.implementationContract.forbiddenHere.includes("modifier reliableDps"), "implementation contract should forbid reliable DPS changes here");

console.log(JSON.stringify({
  status: "external-evidence-submission-promotion-audit-test-ok",
  realReadyForPromotionImplementation: blocked.summary.readyForPromotionImplementation,
  syntheticReadyForPromotionImplementation: ready.summary.readyForPromotionImplementation,
  proposedReliableDps: ready.summary.proposedReliableDps,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
