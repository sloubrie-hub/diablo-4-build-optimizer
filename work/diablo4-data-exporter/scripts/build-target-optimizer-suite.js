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
  "audit-new-binary-family-delta-parent.js",
  "scan-delta-parent-consumer-corpus.js",
  "build-delta-parent-expanded-decode-plan.js",
  "audit-delta-parent-upgrade-structure.js",
  "audit-delta-parent-offset-reference-graph.js",
  "scan-delta-parent-systems-tuning-contexts.js",
  "build-delta-parent-undecoded-source-plan.js",
  "audit-delta-parent-nontext-table-signals.js",
  "build-delta-local-exhaustion-conclusion.js",
  "build-sf32-local-exhaustion-conclusion.js",
  "build-uptime-local-exhaustion-conclusion.js",
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
const newBinaryFamilyDeltaParentAudit = readJson("outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json");
const deltaParentConsumerCorpusScan = readJson("outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json");
const deltaParentExpandedDecodePlan = readJson("outputs/diablo4-delta-parent-expanded-decode-plan/delta-parent-expanded-decode-plan.json");
const deltaParentUpgradeStructureAudit = readJson("outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json");
const deltaParentOffsetReferenceGraph = readJson("outputs/diablo4-delta-parent-offset-reference-graph/delta-parent-offset-reference-graph.json");
const deltaParentSystemsTuningContexts = readJson("outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json");
const deltaParentUndecodedSourcePlan = readJson("outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json");
const deltaParentNontextTableSignals = readJson("outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json");
const deltaLocalExhaustionConclusion = readJson("outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json");
const sf32LocalExhaustionConclusion = readJson("outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json");
const uptimeLocalExhaustionConclusion = readJson("outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json");

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
assertInvariant(newBinaryFamilyDeltaParentAudit.summary.canModifyReliableDps === false, "new binary family delta parent audit must not modify reliable DPS");
assertInvariant(newBinaryFamilyDeltaParentAudit.summary.failedGateIds.includes("sf33-trigger"), "delta parent audit must keep SF_33 blocked without a parent consumer");
assertInvariant(deltaParentConsumerCorpusScan.summary.canModifyReliableDps === false, "delta parent consumer corpus scan must not modify reliable DPS");
assertInvariant(deltaParentConsumerCorpusScan.summary.exactParentConsumerProven === false, "delta parent consumer corpus scan must not prove exact parent automatically");
assertInvariant(deltaParentExpandedDecodePlan.summary.canModifyReliableDps === false, "delta parent expanded decode plan must not modify reliable DPS");
assertInvariant(deltaParentExpandedDecodePlan.summary.upgradeAnalogyAssets >= 1, "delta parent expanded decode plan must keep upgrade analogies");
assertInvariant(deltaParentUpgradeStructureAudit.summary.canModifyReliableDps === false, "delta parent upgrade structure audit must not modify reliable DPS");
assertInvariant(deltaParentUpgradeStructureAudit.summary.exactParentConsumerProven === false, "delta parent upgrade structure audit must not prove exact parent automatically");
assertInvariant(deltaParentUpgradeStructureAudit.summary.upgradeAnalogyAssets >= 1, "delta parent upgrade structure audit must inspect upgrade analogies");
assertInvariant(deltaParentOffsetReferenceGraph.summary.canModifyReliableDps === false, "delta parent offset reference graph must not modify reliable DPS");
assertInvariant(deltaParentOffsetReferenceGraph.summary.exactParentConsumerProven === false, "delta parent offset reference graph must not prove exact parent automatically");
assertInvariant(deltaParentOffsetReferenceGraph.summary.inspectedAnchors >= 1, "delta parent offset reference graph must inspect anchors");
assertInvariant(deltaParentSystemsTuningContexts.summary.canModifyReliableDps === false, "delta parent systems tuning contexts must not modify reliable DPS");
assertInvariant(deltaParentSystemsTuningContexts.summary.exactParentConsumerProven === false, "delta parent systems tuning contexts must not prove exact parent automatically");
assertInvariant(deltaParentSystemsTuningContexts.summary.targetContexts >= 1, "delta parent systems tuning contexts must inspect the target hash");
assertInvariant(deltaParentUndecodedSourcePlan.summary.canModifyReliableDps === false, "delta parent undecoded source plan must not modify reliable DPS");
assertInvariant(deltaParentUndecodedSourcePlan.summary.exactParentConsumerProven === false, "delta parent undecoded source plan must not prove exact parent automatically");
assertInvariant(deltaParentUndecodedSourcePlan.summary.scoredAssets >= 1, "delta parent undecoded source plan must score assets");
assertInvariant(deltaParentNontextTableSignals.summary.canModifyReliableDps === false, "delta parent nontext table signals must not modify reliable DPS");
assertInvariant(deltaParentNontextTableSignals.summary.exactParentConsumerProven === false, "delta parent nontext table signals must not prove exact parent automatically");
assertInvariant(deltaParentNontextTableSignals.summary.inspectedPayloads >= 1, "delta parent nontext table signals must inspect payloads");
assertInvariant(deltaLocalExhaustionConclusion.summary.canModifyReliableDps === false, "delta local exhaustion conclusion must not modify reliable DPS");
assertInvariant(deltaLocalExhaustionConclusion.summary.exactParentConsumerProven === false, "delta local exhaustion conclusion must not prove exact parent automatically");
assertInvariant(deltaLocalExhaustionConclusion.summary.sf33LocalExhausted === true, "delta local exhaustion conclusion should close local SF_33 exploration");
assertInvariant(sf32LocalExhaustionConclusion.summary.canModifyReliableDps === false, "SF_32 local exhaustion conclusion must not modify reliable DPS");
assertInvariant(sf32LocalExhaustionConclusion.summary.fieldOwnershipProven === false, "SF_32 local exhaustion conclusion must not prove field ownership automatically");
assertInvariant(sf32LocalExhaustionConclusion.summary.sf32LocalExhausted === true, "SF_32 local exhaustion conclusion should close local SF_32 exploration");
assertInvariant(uptimeLocalExhaustionConclusion.summary.canModifyReliableDps === false, "uptime local exhaustion conclusion must not modify reliable DPS");
assertInvariant(uptimeLocalExhaustionConclusion.summary.uptimeReliableProven === false, "uptime local exhaustion conclusion must not prove reliable uptime automatically");
assertInvariant(uptimeLocalExhaustionConclusion.summary.userScenarioSeparated === true, "uptime local exhaustion conclusion should keep user what-if separated");

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
    { id: "new-binary-family-delta-parent-safe", status: "passed", value: newBinaryFamilyDeltaParentAudit.summary.canModifyReliableDps },
    { id: "new-binary-family-delta-parent-sf33-blocked", status: "passed", value: newBinaryFamilyDeltaParentAudit.summary.failedGateIds },
    { id: "delta-parent-consumer-corpus-safe", status: "passed", value: deltaParentConsumerCorpusScan.summary.canModifyReliableDps },
    { id: "delta-parent-consumer-not-auto-proven", status: "passed", value: deltaParentConsumerCorpusScan.summary.exactParentConsumerProven },
    { id: "delta-parent-expanded-decode-safe", status: "passed", value: deltaParentExpandedDecodePlan.summary.canModifyReliableDps },
    { id: "delta-parent-upgrade-analogies-present", status: "passed", value: deltaParentExpandedDecodePlan.summary.upgradeAnalogyAssets },
    { id: "delta-parent-upgrade-structure-safe", status: "passed", value: deltaParentUpgradeStructureAudit.summary.canModifyReliableDps },
    { id: "delta-parent-upgrade-structure-not-auto-proven", status: "passed", value: deltaParentUpgradeStructureAudit.summary.exactParentConsumerProven },
    { id: "delta-parent-upgrade-structure-assets-present", status: "passed", value: deltaParentUpgradeStructureAudit.summary.upgradeAnalogyAssets },
    { id: "delta-parent-offset-reference-safe", status: "passed", value: deltaParentOffsetReferenceGraph.summary.canModifyReliableDps },
    { id: "delta-parent-offset-reference-not-auto-proven", status: "passed", value: deltaParentOffsetReferenceGraph.summary.exactParentConsumerProven },
    { id: "delta-parent-offset-reference-anchors-present", status: "passed", value: deltaParentOffsetReferenceGraph.summary.inspectedAnchors },
    { id: "delta-parent-systems-tuning-safe", status: "passed", value: deltaParentSystemsTuningContexts.summary.canModifyReliableDps },
    { id: "delta-parent-systems-tuning-not-auto-proven", status: "passed", value: deltaParentSystemsTuningContexts.summary.exactParentConsumerProven },
    { id: "delta-parent-systems-tuning-target-context-present", status: "passed", value: deltaParentSystemsTuningContexts.summary.targetContexts },
    { id: "delta-parent-undecoded-source-safe", status: "passed", value: deltaParentUndecodedSourcePlan.summary.canModifyReliableDps },
    { id: "delta-parent-undecoded-source-not-auto-proven", status: "passed", value: deltaParentUndecodedSourcePlan.summary.exactParentConsumerProven },
    { id: "delta-parent-undecoded-source-assets-scored", status: "passed", value: deltaParentUndecodedSourcePlan.summary.scoredAssets },
    { id: "delta-parent-nontext-table-safe", status: "passed", value: deltaParentNontextTableSignals.summary.canModifyReliableDps },
    { id: "delta-parent-nontext-table-not-auto-proven", status: "passed", value: deltaParentNontextTableSignals.summary.exactParentConsumerProven },
    { id: "delta-parent-nontext-table-payloads-inspected", status: "passed", value: deltaParentNontextTableSignals.summary.inspectedPayloads },
    { id: "delta-local-exhaustion-safe", status: "passed", value: deltaLocalExhaustionConclusion.summary.canModifyReliableDps },
    { id: "delta-local-sf33-exhausted", status: "passed", value: deltaLocalExhaustionConclusion.summary.sf33LocalExhausted },
    { id: "delta-local-next-focus", status: "passed", value: deltaLocalExhaustionConclusion.summary.recommendedNextFocus },
    { id: "sf32-local-exhaustion-safe", status: "passed", value: sf32LocalExhaustionConclusion.summary.canModifyReliableDps },
    { id: "sf32-local-field-not-proven", status: "passed", value: sf32LocalExhaustionConclusion.summary.fieldOwnershipProven },
    { id: "sf32-local-next-focus", status: "passed", value: sf32LocalExhaustionConclusion.summary.recommendedNextFocus },
    { id: "uptime-local-exhaustion-safe", status: "passed", value: uptimeLocalExhaustionConclusion.summary.canModifyReliableDps },
    { id: "uptime-local-reliable-not-proven", status: "passed", value: uptimeLocalExhaustionConclusion.summary.uptimeReliableProven },
    { id: "uptime-local-user-scenario-separated", status: "passed", value: uptimeLocalExhaustionConclusion.summary.userScenarioSeparated },
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
assertInvariant(optimizerPlan.newBinaryFamilyDeltaParentAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent audit");
assertInvariant(optimizerPlan.deltaParentConsumerCorpusScan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent corpus scan");
assertInvariant(optimizerPlan.deltaParentExpandedDecodePlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent expanded decode plan");
assertInvariant(optimizerPlan.deltaParentUpgradeStructureAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent upgrade structure audit");
assertInvariant(optimizerPlan.deltaParentOffsetReferenceGraph?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent offset reference graph");
assertInvariant(optimizerPlan.deltaParentSystemsTuningContexts?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent systems tuning contexts");
assertInvariant(optimizerPlan.deltaParentUndecodedSourcePlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent undecoded source plan");
assertInvariant(optimizerPlan.deltaParentNontextTableSignals?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta parent nontext table signals");
assertInvariant(optimizerPlan.deltaLocalExhaustionConclusion?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta local exhaustion conclusion");
assertInvariant(optimizerPlan.sf32LocalExhaustionConclusion?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_32 local exhaustion conclusion");
assertInvariant(optimizerPlan.uptimeLocalExhaustionConclusion?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe uptime local exhaustion conclusion");
assertInvariant(optimizerPlan.summary.reliableStrictBuilds === 0, "no reliable strict build should exist yet");

console.log(JSON.stringify({ outFile, summary }, null, 2));
