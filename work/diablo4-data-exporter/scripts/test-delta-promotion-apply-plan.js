const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const scriptFile = path.join(__dirname, "build-delta-promotion-apply-plan.js");
const realGateFile = path.join(
  rootDir,
  "outputs",
  "diablo4-delta-promotion-application-gate",
  "delta-promotion-application-gate.json",
);
const targetDatasetFile = path.join(rootDir, "outputs", "diablo4-target-dataset", "target-dataset.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runPlan(gateFile, outDir) {
  execFileSync(nodeBin, [scriptFile, gateFile, outDir], {
    cwd: rootDir,
    stdio: "pipe",
  });
  return readJson(path.join(outDir, "delta-promotion-apply-plan.json"));
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-apply-plan-"));
const targetBefore = fs.readFileSync(targetDatasetFile, "utf8");

const realOutDir = path.join(tmpRoot, "real");
const realPlan = runPlan(realGateFile, realOutDir);
assert(realPlan.summary.applyPlanReady === false, "real apply plan must remain blocked");
assert(realPlan.summary.failedChecks > 0, "real apply plan must expose failed checks");
assert(realPlan.summary.writesTargetDataset === false, "real apply plan must not write target dataset");
assert(realPlan.summary.canModifyReliableDps === false, "real apply plan must not modify reliable DPS");
assert(realPlan.summary.promotionReady === false, "real apply plan must not promote");

const syntheticGate = readJson(realGateFile);
syntheticGate.summary = {
  ...syntheticGate.summary,
  manualApplyAllowed: true,
  failedChecks: 0,
  writesTargetDataset: false,
  canModifyReliableDps: false,
  promotionReady: false,
};
syntheticGate.gateChecks = (syntheticGate.gateChecks ?? []).map((check) => ({
  ...check,
  status: "passed",
}));
syntheticGate.patchPreview = {
  ...(syntheticGate.patchPreview ?? {}),
  before: 163200,
  after: 212160,
};
syntheticGate.applyContract = {
  ...(syntheticGate.applyContract ?? {}),
  requiredBeforeApply: [
    "backup-target-dataset",
    "single-field-patch",
    "run-regression-suite",
    "review-diff",
  ],
};

const syntheticGateFile = path.join(tmpRoot, "synthetic-gate.json");
fs.writeFileSync(syntheticGateFile, JSON.stringify(syntheticGate, null, 2));
const readyOutDir = path.join(tmpRoot, "ready");
const readyPlan = runPlan(syntheticGateFile, readyOutDir);

assert(readyPlan.summary.applyPlanReady === true, "synthetic apply plan should be ready");
assert(readyPlan.summary.patchBefore === 163200, "synthetic patch before must be 163200");
assert(readyPlan.summary.patchAfter === 212160, "synthetic patch after must be 212160");
assert(readyPlan.summary.writesTargetDataset === false, "ready plan must not write target dataset");
assert(readyPlan.summary.acceptedForBridge === false, "ready plan must not accept for bridge");
assert(readyPlan.summary.canModifyReliableDps === false, "ready plan must not modify reliable DPS");
assert(readyPlan.summary.promotionReady === false, "ready plan must not promote");
assert(readyPlan.applySteps.length >= 4, "ready plan must expose explicit apply steps");
assert(readyPlan.applySteps.some((step) => step.id === "backup-target-dataset"), "ready plan must require backup");
assert(readyPlan.applySteps.some((step) => step.id === "run-regression-suite"), "ready plan must require regression");
assert(readyPlan.applySteps.some((step) => step.id === "review-diff"), "ready plan must require diff review");

const targetAfter = fs.readFileSync(targetDatasetFile, "utf8");
assert(targetAfter === targetBefore, "apply plan test must not change target dataset");

console.log("delta-promotion-apply-plan-test-ok");
