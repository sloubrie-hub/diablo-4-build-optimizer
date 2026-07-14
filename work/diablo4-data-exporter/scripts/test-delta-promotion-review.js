const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-promotion-review-"));
const readinessFile = path.join(tempDir, "delta-bridge-readiness.json");
const outDir = path.join(tempDir, "review");

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

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

const readiness = readJson("outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json");
readiness.summary.readyGates = 3;
readiness.summary.blockedGates = 0;
readiness.summary.allBridgeReady = true;
readiness.summary.anyUnsafeBridge = false;
readiness.summary.canUseForUserWhatIf = true;
readiness.blockedGateIds = [];
readiness.gates = (readiness.gates ?? []).map((gate) => ({
  ...gate,
  status: "ready-for-combined-review",
  bridgeReady: true,
  mappings: 1,
  acceptedEvidence: 1,
  canModifyReliableDps: false,
}));
fs.writeFileSync(readinessFile, JSON.stringify(readiness, null, 2));

run("build-delta-promotion-review.js", [
  readinessFile,
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json",
  outDir,
]);

const report = readJson(path.join(outDir, "delta-promotion-review.json"));
assertInvariant(report.summary.readyForManualReview === true, "synthetic complete readiness should open manual review");
assertInvariant(report.summary.canUseForUserWhatIf === true, "manual review state can feed controlled what-if");
assertInvariant(report.summary.canUseForReliableDps === false, "manual review must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "manual review must not allow ranking");
assertInvariant(report.summary.canModifyReliableDps === false, "manual review must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "manual review must not auto-promote");
assertInvariant(report.summary.failedChecks === 0, "synthetic review checks should pass");
assertInvariant(report.promotionPolicy?.forbiddenAutomaticOutputs?.includes("reliableDps"), "reliableDps must stay forbidden");

console.log(JSON.stringify({
  status: "delta-promotion-review-test-ok",
  readyForManualReview: report.summary.readyForManualReview,
  canUseForUserWhatIf: report.summary.canUseForUserWhatIf,
  canUseForReliableDps: report.summary.canUseForReliableDps,
  canUseForRanking: report.summary.canUseForRanking,
  promotionReady: report.summary.promotionReady,
}, null, 2));
