const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const scriptFile = path.join(__dirname, "build-external-evidence-submission-apply-plan.js");
const realGateFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-evidence-submission-application-gate",
  "external-evidence-submission-application-gate.json",
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
  return readJson(path.join(outDir, "external-evidence-submission-apply-plan.json"));
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-apply-plan-"));
const targetBefore = fs.readFileSync(targetDatasetFile, "utf8");

const realOutDir = path.join(tmpRoot, "real");
const realPlan = runPlan(realGateFile, realOutDir);
assert(realPlan.summary.applyPlanReady === false, "real external apply plan must remain blocked");
assert(realPlan.summary.failedChecks > 0, "real external apply plan must expose failed checks");
assert(realPlan.summary.writesTargetDataset === false, "real external apply plan must not write target dataset");
assert(realPlan.summary.canModifyReliableDps === false, "real external apply plan must not modify reliable DPS");
assert(realPlan.summary.promotionReady === false, "real external apply plan must not promote");

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

assert(readyPlan.summary.applyPlanReady === true, "synthetic external apply plan should be ready");
assert(readyPlan.summary.patchBefore === 163200, "synthetic external patch before must be 163200");
assert(readyPlan.summary.patchAfter === 212160, "synthetic external patch after must be 212160");
assert(readyPlan.summary.writesTargetDataset === false, "ready external plan must not write target dataset");
assert(readyPlan.summary.acceptedForBridge === false, "ready external plan must not accept for bridge");
assert(readyPlan.summary.canModifyReliableDps === false, "ready external plan must not modify reliable DPS");
assert(readyPlan.summary.promotionReady === false, "ready external plan must not promote");
assert(readyPlan.applySteps.length >= 4, "ready external plan must expose explicit apply steps");
assert(readyPlan.applySteps.some((step) => step.id === "backup-target-dataset"), "ready external plan must require backup");
assert(readyPlan.applySteps.some((step) => step.id === "run-regression-suite"), "ready external plan must require regression");
assert(readyPlan.applySteps.some((step) => step.id === "review-diff"), "ready external plan must require diff review");

const targetAfter = fs.readFileSync(targetDatasetFile, "utf8");
assert(targetAfter === targetBefore, "external apply plan test must not change target dataset");

console.log("external-evidence-submission-apply-plan-test-ok");
