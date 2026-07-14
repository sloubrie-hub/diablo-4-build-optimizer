const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-manual-promotion-gate-"));
const readyOutDir = path.join(tempDir, "ready-gate");

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

const realOutDir = path.join(tempDir, "real-gate");
run("build-delta-manual-promotion-gate.js", [
  "outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json",
  "outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json",
  "outputs/diablo4-delta-promotion-review/delta-promotion-review.json",
  realOutDir,
]);
const realReport = readJson(path.join(realOutDir, "delta-manual-promotion-gate.json"));
assertInvariant(realReport.summary.readyForHumanAction === false, "real gate should remain blocked");
assertInvariant(realReport.summary.canModifyReliableDps === false, "real gate must not modify reliable DPS");
assertInvariant(realReport.summary.promotionReady === false, "real gate must not promote");

const readyPreview = readJson("outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json");
readyPreview.summary.previewMergeReady = true;
readyPreview.summary.readyForIntake = true;
readyPreview.summary.previewCandidates = readyPreview.summary.currentCandidates + 1;
readyPreview.summary.writesRealIntake = false;
readyPreview.summary.acceptedForBridge = false;
const readyDraftAudit = readJson("outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json");
readyDraftAudit.summary.readyForIntake = true;
readyDraftAudit.summary.placeholderFields = 0;
readyDraftAudit.summary.structuralBlockers = 0;
readyDraftAudit.placeholderFields = [];
readyDraftAudit.structuralBlockers = [];
const readyPromotionReview = readJson("outputs/diablo4-delta-promotion-review/delta-promotion-review.json");
readyPromotionReview.summary.readyForManualReview = true;
readyPromotionReview.summary.failedChecks = 0;

const readyPreviewFile = path.join(tempDir, "ready-preview.json");
const readyDraftAuditFile = path.join(tempDir, "ready-draft-audit.json");
const readyPromotionReviewFile = path.join(tempDir, "ready-promotion-review.json");
writeJson(readyPreviewFile, readyPreview);
writeJson(readyDraftAuditFile, readyDraftAudit);
writeJson(readyPromotionReviewFile, readyPromotionReview);

run("build-delta-manual-promotion-gate.js", [
  readyPreviewFile,
  readyDraftAuditFile,
  readyPromotionReviewFile,
  readyOutDir,
]);
const readyReport = readJson(path.join(readyOutDir, "delta-manual-promotion-gate.json"));

assertInvariant(readyReport.summary.readyForHumanAction === true, "synthetic ready gate should open human action only");
assertInvariant(readyReport.summary.canModifyReliableDps === false, "ready gate must not modify reliable DPS");
assertInvariant(readyReport.summary.canUseForReliableDps === false, "ready gate must not allow reliable DPS");
assertInvariant(readyReport.summary.canUseForRanking === false, "ready gate must not allow ranking");
assertInvariant(readyReport.summary.promotionReady === false, "ready gate must not mark promotion ready");
assertInvariant(readyReport.gateChecks.every((check) => check.status === "passed"), "ready fixture should pass all manual gate checks");

console.log(JSON.stringify({
  status: "delta-manual-promotion-gate-test-ok",
  realReadyForHumanAction: realReport.summary.readyForHumanAction,
  syntheticReadyForHumanAction: readyReport.summary.readyForHumanAction,
  canModifyReliableDps: readyReport.summary.canModifyReliableDps,
  canUseForReliableDps: readyReport.summary.canUseForReliableDps,
  canUseForRanking: readyReport.summary.canUseForRanking,
  promotionReady: readyReport.summary.promotionReady,
}, null, 2));
