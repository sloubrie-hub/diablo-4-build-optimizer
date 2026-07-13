const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const outDir = process.argv[2] ?? "outputs/diablo4-target-optimizer-suite";

const generationSteps = [
  "build-target-bucket-engine.js",
  "build-fine-bucket-extraction-plan.js",
  "build-delta-promotion-conclusion.js",
  "build-user-whatif-scenarios.js",
  "build-reliable-dps-gates.js",
  "audit-external-evidence-intake.js",
  "test-external-evidence-intake-rejections.js",
  "build-external-evidence-bridge-plan.js",
  "test-external-evidence-bridge.js",
  "build-next-evidence-roadmap.js",
  "build-new-binary-family-plan.js",
  "build-working-base-contract.js",
  "build-bucket-engine-contract.js",
];

function runStep(scriptName) {
  const scriptPath = path.join(scriptDir, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
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
  return JSON.parse(fs.readFileSync(path.join(rootDir, filePath), "utf8"));
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

for (const step of generationSteps) runStep(step);

const bucketEngine = readJson("outputs/diablo4-target-bucket-engine/target-bucket-engine.json");
const workingBase = readJson("outputs/diablo4-working-base-contract/working-base-contract.json");
const reliableGates = readJson("outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json");
const bucketEngineContract = readJson("outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json");
const externalEvidenceIntake = readJson("outputs/diablo4-external-evidence-intake/external-evidence-intake.json");
const externalEvidenceBridge = readJson("outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json");
const newBinaryFamilyPlan = readJson("outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json");

assertInvariant(bucketEngine.summary.parityDelta === 0, "bucket strict parity must remain zero");
assertInvariant(bucketEngine.summary.bestStrictClass === "spiritborn", "best strict class must remain spiritborn");
assertInvariant(bucketEngine.summary.reliableClassPlans === 0, "no reliable class plan should be promoted yet");
assertInvariant(workingBase.summary.class === "spiritborn", "working base must remain spiritborn");
assertInvariant(workingBase.summary.strictDps === 163200, "working base strict DPS drifted");
assertInvariant(workingBase.summary.blockedDeltaDps === 48960, "working base blocked delta drifted");
assertInvariant(workingBase.summary.canLoadAsWorkingBase === true, "working base should be loadable");
assertInvariant(workingBase.summary.reliableOptimizerReady === false, "working base should not be reliable yet");
assertInvariant(reliableGates.summary.canUseForReliableDps === false, "blocked delta must not enter reliable DPS");
assertInvariant(bucketEngineContract.summary.status === "bucket-engine-contract-ok", "bucket engine contract must pass");
assertInvariant(bucketEngineContract.summary.failed === 0, "bucket engine contract failed invariants");
assertInvariant(externalEvidenceIntake.summary.canModifyReliableDps === false, "external evidence intake must not modify reliable DPS");
assertInvariant(externalEvidenceBridge.summary.canModifyReliableDps === false, "external evidence bridge must not modify reliable DPS");
assertInvariant(newBinaryFamilyPlan.summary.canModifyReliableDps === false, "new binary family plan must not modify reliable DPS");
assertInvariant(newBinaryFamilyPlan.summary.nextProbeId === "binary-family-delta-parent-1663210", "new binary family plan should prioritize the delta parent probe");

const summary = {
  generatedAt: new Date().toISOString(),
  steps: generationSteps.length + 1,
  status: "target-optimizer-suite-ok",
  strictParityDelta: bucketEngine.summary.parityDelta,
  workingBaseClass: workingBase.summary.class,
  workingBaseStrictDps: workingBase.summary.strictDps,
  blockedDeltaDps: workingBase.summary.blockedDeltaDps,
  reliableStrictBuilds: 0,
  nextGate: workingBase.summary.nextGate,
};

const report = {
  generatedAt: summary.generatedAt,
  schemaVersion: 1,
  mode: "target-optimizer-suite-v1",
  summary,
  steps: [...generationSteps, "build-target-optimizer-plan.js"].map((scriptName, index) => ({
    rank: index + 1,
    script: scriptName,
    status: "completed",
  })),
  invariants: [
    { id: "strict-parity-zero", status: "passed", value: bucketEngine.summary.parityDelta },
    { id: "best-strict-class-spiritborn", status: "passed", value: bucketEngine.summary.bestStrictClass },
    { id: "no-reliable-class-plan", status: "passed", value: bucketEngine.summary.reliableClassPlans },
    { id: "working-base-spiritborn", status: "passed", value: workingBase.summary.class },
    { id: "working-base-strict-163200", status: "passed", value: workingBase.summary.strictDps },
    { id: "blocked-delta-48960", status: "passed", value: workingBase.summary.blockedDeltaDps },
    { id: "blocked-delta-not-reliable", status: "passed", value: reliableGates.summary.canUseForReliableDps },
    { id: "bucket-engine-contract-ok", status: "passed", value: bucketEngineContract.summary.status },
    { id: "external-evidence-intake-safe", status: "passed", value: externalEvidenceIntake.summary.canModifyReliableDps },
    { id: "external-evidence-bridge-safe", status: "passed", value: externalEvidenceBridge.summary.canModifyReliableDps },
    { id: "new-binary-family-plan-safe", status: "passed", value: newBinaryFamilyPlan.summary.canModifyReliableDps },
    { id: "new-binary-family-priority-delta", status: "passed", value: newBinaryFamilyPlan.summary.nextProbeId },
  ],
};

fs.mkdirSync(path.join(rootDir, outDir), { recursive: true });
const outFile = path.join(outDir, "target-optimizer-suite.json");
fs.writeFileSync(path.join(rootDir, outFile), JSON.stringify(report, null, 2));

runStep("build-target-optimizer-plan.js");
const optimizerPlan = readJson("outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json");
assertInvariant(optimizerPlan.workingBaseContract?.summary?.class === "spiritborn", "optimizer plan must embed working base contract");
assertInvariant(optimizerPlan.targetOptimizerSuite?.summary?.status === "target-optimizer-suite-ok", "optimizer plan must embed suite report");
assertInvariant(optimizerPlan.bucketEngineContract?.summary?.status === "bucket-engine-contract-ok", "optimizer plan must embed bucket engine contract");
assertInvariant(optimizerPlan.externalEvidenceIntake?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence intake");
assertInvariant(optimizerPlan.externalEvidenceBridgePlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence bridge plan");
assertInvariant(optimizerPlan.newBinaryFamilyPlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe new binary family plan");
assertInvariant(optimizerPlan.summary.reliableStrictBuilds === 0, "no reliable strict build should exist yet");

console.log(JSON.stringify({ outFile, summary }, null, 2));
