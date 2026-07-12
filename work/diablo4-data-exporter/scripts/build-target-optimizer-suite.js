const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");

const steps = [
  "build-target-bucket-engine.js",
  "build-fine-bucket-extraction-plan.js",
  "build-delta-promotion-conclusion.js",
  "build-user-whatif-scenarios.js",
  "build-reliable-dps-gates.js",
  "build-next-evidence-roadmap.js",
  "build-working-base-contract.js",
  "build-target-optimizer-plan.js",
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

for (const step of steps) runStep(step);

const bucketEngine = readJson("outputs/diablo4-target-bucket-engine/target-bucket-engine.json");
const workingBase = readJson("outputs/diablo4-working-base-contract/working-base-contract.json");
const reliableGates = readJson("outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json");
const optimizerPlan = readJson("outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json");

assertInvariant(bucketEngine.summary.parityDelta === 0, "bucket strict parity must remain zero");
assertInvariant(bucketEngine.summary.bestStrictClass === "spiritborn", "best strict class must remain spiritborn");
assertInvariant(bucketEngine.summary.reliableClassPlans === 0, "no reliable class plan should be promoted yet");
assertInvariant(workingBase.summary.class === "spiritborn", "working base must remain spiritborn");
assertInvariant(workingBase.summary.strictDps === 163200, "working base strict DPS drifted");
assertInvariant(workingBase.summary.blockedDeltaDps === 48960, "working base blocked delta drifted");
assertInvariant(workingBase.summary.canLoadAsWorkingBase === true, "working base should be loadable");
assertInvariant(workingBase.summary.reliableOptimizerReady === false, "working base should not be reliable yet");
assertInvariant(reliableGates.summary.canUseForReliableDps === false, "blocked delta must not enter reliable DPS");
assertInvariant(optimizerPlan.workingBaseContract?.summary?.class === "spiritborn", "optimizer plan must embed working base contract");
assertInvariant(optimizerPlan.summary.reliableStrictBuilds === 0, "no reliable strict build should exist yet");

const summary = {
  generatedAt: new Date().toISOString(),
  steps: steps.length,
  status: "target-optimizer-suite-ok",
  strictParityDelta: bucketEngine.summary.parityDelta,
  workingBaseClass: workingBase.summary.class,
  workingBaseStrictDps: workingBase.summary.strictDps,
  blockedDeltaDps: workingBase.summary.blockedDeltaDps,
  reliableStrictBuilds: optimizerPlan.summary.reliableStrictBuilds,
  nextGate: workingBase.summary.nextGate,
};

console.log(JSON.stringify(summary, null, 2));
