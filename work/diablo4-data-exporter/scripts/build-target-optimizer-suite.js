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
  "build-user-whatif-contract.js",
  "test-user-whatif-import-contract.js",
  "audit-external-evidence-intake.js",
  "test-external-evidence-intake-rejections.js",
  "build-external-evidence-bridge-plan.js",
  "test-external-evidence-bridge.js",
  "build-external-delta-evidence-plan.js",
  "test-external-delta-evidence-plan.js",
  "build-external-delta-evidence-workorder.js",
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
  "build-sf32-local-exhaustion-conclusion.js",
  "build-sf32-owner-source-packet.js",
  "build-sf32-owner-parser-bridge.js",
  "test-sf32-owner-parser-bridge.js",
  "build-sf33-trigger-source-packet.js",
  "build-sf33-trigger-parser-bridge.js",
  "test-sf33-trigger-parser-bridge.js",
  "build-uptime-local-exhaustion-conclusion.js",
  "build-uptime-source-packet.js",
  "build-uptime-parser-bridge.js",
  "test-uptime-parser-bridge.js",
  "build-delta-bridge-readiness.js",
  "test-delta-bridge-readiness.js",
  "build-delta-promotion-review.js",
  "test-delta-promotion-review.js",
  "build-delta-evidence-intake-package.js",
  "test-delta-evidence-intake-package.js",
  "build-delta-evidence-draft.js",
  "test-delta-evidence-draft.js",
  "audit-delta-evidence-draft.js",
  "test-delta-evidence-draft-audit.js",
  "preview-delta-evidence-intake-update.js",
  "test-delta-evidence-intake-update-preview.js",
  "build-delta-manual-promotion-gate.js",
  "test-delta-manual-promotion-gate.js",
  "build-delta-human-action-plan.js",
  "test-delta-human-action-plan.js",
  "build-delta-local-exhaustion-conclusion.js",
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
const externalDeltaEvidencePlan = readJson("outputs/diablo4-external-delta-evidence-plan/external-delta-evidence-plan.json");
const externalDeltaEvidenceWorkorder = readJson("outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json");
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
const sf32OwnerSourcePacket = readJson("outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json");
const sf32OwnerParserBridge = readJson("outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json");
const sf33TriggerSourcePacket = readJson("outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json");
const sf33TriggerParserBridge = readJson("outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json");
const uptimeLocalExhaustionConclusion = readJson("outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json");
const uptimeSourcePacket = readJson("outputs/diablo4-uptime-source-packet/uptime-source-packet.json");
const uptimeParserBridge = readJson("outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json");
const deltaBridgeReadiness = readJson("outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json");
const deltaPromotionReview = readJson("outputs/diablo4-delta-promotion-review/delta-promotion-review.json");
const deltaEvidenceIntakePackage = readJson("outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json");
const deltaEvidenceDraft = readJson("outputs/diablo4-delta-evidence-draft/delta-evidence-draft.json");
const deltaEvidenceDraftAudit = readJson("outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json");
const deltaEvidenceIntakeUpdatePreview = readJson("outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json");
const deltaManualPromotionGate = readJson("outputs/diablo4-delta-manual-promotion-gate/delta-manual-promotion-gate.json");
const deltaHumanActionPlan = readJson("outputs/diablo4-delta-human-action-plan/delta-human-action-plan.json");
const userWhatIfContract = readJson("outputs/diablo4-user-whatif-contract/user-whatif-contract.json");

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
assertInvariant(externalDeltaEvidencePlan.summary.canModifyReliableDps === false, "external delta evidence plan must not modify reliable DPS");
assertInvariant(externalDeltaEvidencePlan.summary.requiredProofs === 3, "external delta evidence plan must require the three delta proofs");
assertInvariant(externalDeltaEvidenceWorkorder.summary.canModifyReliableDps === false, "external delta evidence workorder must not modify reliable DPS");
assertInvariant(externalDeltaEvidenceWorkorder.summary.tasks === 3, "external delta evidence workorder must track the three delta tasks");
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
assertInvariant(deltaLocalExhaustionConclusion.summary.allLocalEvidenceExhausted === true, "delta local exhaustion conclusion should close all local delta evidence");
assertInvariant(sf32LocalExhaustionConclusion.summary.canModifyReliableDps === false, "SF_32 local exhaustion conclusion must not modify reliable DPS");
assertInvariant(sf32LocalExhaustionConclusion.summary.fieldOwnershipProven === false, "SF_32 local exhaustion conclusion must not prove field ownership automatically");
assertInvariant(sf32LocalExhaustionConclusion.summary.sf32LocalExhausted === true, "SF_32 local exhaustion conclusion should close local SF_32 exploration");
assertInvariant(sf32OwnerSourcePacket.summary.canModifyReliableDps === false, "SF_32 owner source packet must not modify reliable DPS");
assertInvariant(sf32OwnerSourcePacket.summary.parserBridgeRequired === true, "SF_32 owner source packet must require a parser bridge");
assertInvariant(sf32OwnerSourcePacket.requiredClaim?.field === "selector:949", "SF_32 owner source packet must target selector:949");
assertInvariant(sf32OwnerParserBridge.summary.canModifyReliableDps === false, "SF_32 owner parser bridge must not modify reliable DPS");
assertInvariant(sf32OwnerParserBridge.summary.bridgeReady === false, "real SF_32 owner parser bridge should remain blocked without accepted evidence");
assertInvariant(sf32OwnerParserBridge.summary.reliableDpsStillBlocked === true, "SF_32 owner parser bridge must keep reliable gates blocked");
assertInvariant(sf33TriggerSourcePacket.summary.canModifyReliableDps === false, "SF_33 trigger source packet must not modify reliable DPS");
assertInvariant(sf33TriggerSourcePacket.summary.parserBridgeRequired === true, "SF_33 trigger source packet must require a parser bridge");
assertInvariant(sf33TriggerSourcePacket.requiredClaim?.field === "Mod.SoilRuler_B", "SF_33 trigger source packet must target Mod.SoilRuler_B");
assertInvariant(sf33TriggerParserBridge.summary.canModifyReliableDps === false, "SF_33 trigger parser bridge must not modify reliable DPS");
assertInvariant(sf33TriggerParserBridge.summary.bridgeReady === false, "real SF_33 trigger parser bridge should remain blocked without accepted evidence");
assertInvariant(sf33TriggerParserBridge.summary.reliableDpsStillBlocked === true, "SF_33 trigger parser bridge must keep reliable gates blocked");
assertInvariant(uptimeLocalExhaustionConclusion.summary.canModifyReliableDps === false, "uptime local exhaustion conclusion must not modify reliable DPS");
assertInvariant(uptimeLocalExhaustionConclusion.summary.uptimeReliableProven === false, "uptime local exhaustion conclusion must not prove reliable uptime automatically");
assertInvariant(uptimeLocalExhaustionConclusion.summary.userScenarioSeparated === true, "uptime local exhaustion conclusion should keep user what-if separated");
assertInvariant(uptimeSourcePacket.summary.canModifyReliableDps === false, "uptime source packet must not modify reliable DPS");
assertInvariant(uptimeSourcePacket.summary.parserBridgeRequired === true, "uptime source packet must require a parser bridge");
assertInvariant(uptimeSourcePacket.requiredClaim?.field === "uptime", "uptime source packet must target uptime");
assertInvariant(uptimeParserBridge.summary.canModifyReliableDps === false, "uptime parser bridge must not modify reliable DPS");
assertInvariant(uptimeParserBridge.summary.bridgeReady === false, "real uptime parser bridge should remain blocked without accepted evidence");
assertInvariant(uptimeParserBridge.summary.reliableDpsStillBlocked === true, "uptime parser bridge must keep reliable gates blocked");
assertInvariant(deltaBridgeReadiness.summary.canModifyReliableDps === false, "delta bridge readiness must not modify reliable DPS");
assertInvariant(deltaBridgeReadiness.summary.allBridgeReady === false, "real delta bridge readiness should remain blocked without all evidence");
assertInvariant(deltaBridgeReadiness.summary.blockedGates === 3, "real delta bridge readiness should keep the three gates blocked");
assertInvariant(deltaBridgeReadiness.summary.reliableDpsStillBlocked === true, "delta bridge readiness must keep reliable gates blocked");
assertInvariant(deltaPromotionReview.summary.canModifyReliableDps === false, "delta promotion review must not modify reliable DPS");
assertInvariant(deltaPromotionReview.summary.readyForManualReview === false, "real delta promotion review should remain blocked");
assertInvariant(deltaPromotionReview.summary.canUseForReliableDps === false, "delta promotion review must not allow reliable DPS");
assertInvariant(deltaPromotionReview.summary.promotionReady === false, "delta promotion review must not auto-promote");
assertInvariant(deltaEvidenceIntakePackage.summary.canModifyReliableDps === false, "delta evidence intake package must not modify reliable DPS");
assertInvariant(deltaEvidenceIntakePackage.summary.templates === 3, "delta evidence intake package must include the three templates");
assertInvariant(deltaEvidenceIntakePackage.summary.packageReady === true, "delta evidence intake package should be ready for collection");
assertInvariant(deltaEvidenceIntakePackage.summary.promotionReady === false, "delta evidence intake package must not auto-promote");
assertInvariant(deltaEvidenceDraft.summary.canModifyReliableDps === false, "delta evidence draft must not modify reliable DPS");
assertInvariant(deltaEvidenceDraft.summary.draftReadyForCopy === false, "delta evidence draft should require source filling");
assertInvariant(deltaEvidenceDraft.summary.placeholderFields > 0, "delta evidence draft must expose placeholders");
assertInvariant(deltaEvidenceDraft.summary.promotionReady === false, "delta evidence draft must not auto-promote");
assertInvariant(deltaEvidenceDraftAudit.summary.canModifyReliableDps === false, "delta evidence draft audit must not modify reliable DPS");
assertInvariant(deltaEvidenceDraftAudit.summary.readyForIntake === false, "real delta evidence draft audit should remain blocked with placeholders");
assertInvariant(deltaEvidenceDraftAudit.summary.placeholderFields > 0, "real delta evidence draft audit must expose placeholders");
assertInvariant(deltaEvidenceDraftAudit.summary.promotionReady === false, "delta evidence draft audit must not auto-promote");
assertInvariant(deltaEvidenceIntakeUpdatePreview.summary.canModifyReliableDps === false, "delta evidence intake update preview must not modify reliable DPS");
assertInvariant(deltaEvidenceIntakeUpdatePreview.summary.previewMergeReady === false, "real delta evidence intake update preview should remain blocked with placeholders");
assertInvariant(deltaEvidenceIntakeUpdatePreview.summary.writesRealIntake === false, "delta evidence intake update preview must never write real intake");
assertInvariant(deltaEvidenceIntakeUpdatePreview.summary.promotionReady === false, "delta evidence intake update preview must not auto-promote");
assertInvariant(deltaManualPromotionGate.summary.canModifyReliableDps === false, "delta manual promotion gate must not modify reliable DPS");
assertInvariant(deltaManualPromotionGate.summary.readyForHumanAction === false, "real delta manual promotion gate should remain blocked");
assertInvariant(deltaManualPromotionGate.summary.canUseForReliableDps === false, "delta manual promotion gate must not allow reliable DPS");
assertInvariant(deltaManualPromotionGate.summary.promotionReady === false, "delta manual promotion gate must not auto-promote");
assertInvariant(deltaHumanActionPlan.summary.canModifyReliableDps === false, "delta human action plan must not modify reliable DPS");
assertInvariant(deltaHumanActionPlan.summary.placeholderFields === 7, "delta human action plan should expose the current placeholders");
assertInvariant(deltaHumanActionPlan.summary.writesRealIntake === false, "delta human action plan must not write real intake");
assertInvariant(deltaHumanActionPlan.summary.promotionReady === false, "delta human action plan must not auto-promote");
assertInvariant(userWhatIfContract.summary.canModifyReliableDps === false, "user what-if contract must not modify reliable DPS");
assertInvariant(userWhatIfContract.summary.failedChecks === 0, "user what-if contract checks must pass");
assertInvariant(userWhatIfContract.samples.find((sample) => sample.uptime === 0.5)?.configuredWhatIfDps === 187680, "user what-if 50pct sample drifted");

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
    { id: "external-delta-evidence-safe", status: "passed", value: externalDeltaEvidencePlan.summary.canModifyReliableDps },
    { id: "external-delta-evidence-proof-count", status: "passed", value: externalDeltaEvidencePlan.summary.requiredProofs },
    { id: "external-delta-evidence-workorder-safe", status: "passed", value: externalDeltaEvidenceWorkorder.summary.canModifyReliableDps },
    { id: "external-delta-evidence-workorder-task-count", status: "passed", value: externalDeltaEvidenceWorkorder.summary.tasks },
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
    { id: "delta-local-all-exhausted", status: "passed", value: deltaLocalExhaustionConclusion.summary.allLocalEvidenceExhausted },
    { id: "delta-local-next-focus", status: "passed", value: deltaLocalExhaustionConclusion.summary.recommendedNextFocus },
    { id: "sf32-local-exhaustion-safe", status: "passed", value: sf32LocalExhaustionConclusion.summary.canModifyReliableDps },
    { id: "sf32-local-field-not-proven", status: "passed", value: sf32LocalExhaustionConclusion.summary.fieldOwnershipProven },
    { id: "sf32-local-next-focus", status: "passed", value: sf32LocalExhaustionConclusion.summary.recommendedNextFocus },
    { id: "sf32-owner-source-packet-safe", status: "passed", value: sf32OwnerSourcePacket.summary.canModifyReliableDps },
    { id: "sf32-owner-source-packet-bridge-required", status: "passed", value: sf32OwnerSourcePacket.summary.parserBridgeRequired },
    { id: "sf32-owner-source-packet-field", status: "passed", value: sf32OwnerSourcePacket.requiredClaim?.field },
    { id: "sf32-owner-parser-bridge-safe", status: "passed", value: sf32OwnerParserBridge.summary.canModifyReliableDps },
    { id: "sf32-owner-parser-bridge-blocked-real", status: "passed", value: sf32OwnerParserBridge.summary.bridgeReady },
    { id: "sf32-owner-parser-bridge-gates-blocked", status: "passed", value: sf32OwnerParserBridge.summary.reliableDpsStillBlocked },
    { id: "sf33-trigger-source-packet-safe", status: "passed", value: sf33TriggerSourcePacket.summary.canModifyReliableDps },
    { id: "sf33-trigger-source-packet-bridge-required", status: "passed", value: sf33TriggerSourcePacket.summary.parserBridgeRequired },
    { id: "sf33-trigger-source-packet-field", status: "passed", value: sf33TriggerSourcePacket.requiredClaim?.field },
    { id: "sf33-trigger-parser-bridge-safe", status: "passed", value: sf33TriggerParserBridge.summary.canModifyReliableDps },
    { id: "sf33-trigger-parser-bridge-blocked-real", status: "passed", value: sf33TriggerParserBridge.summary.bridgeReady },
    { id: "sf33-trigger-parser-bridge-gates-blocked", status: "passed", value: sf33TriggerParserBridge.summary.reliableDpsStillBlocked },
    { id: "uptime-local-exhaustion-safe", status: "passed", value: uptimeLocalExhaustionConclusion.summary.canModifyReliableDps },
    { id: "uptime-local-reliable-not-proven", status: "passed", value: uptimeLocalExhaustionConclusion.summary.uptimeReliableProven },
    { id: "uptime-local-user-scenario-separated", status: "passed", value: uptimeLocalExhaustionConclusion.summary.userScenarioSeparated },
    { id: "uptime-source-packet-safe", status: "passed", value: uptimeSourcePacket.summary.canModifyReliableDps },
    { id: "uptime-source-packet-bridge-required", status: "passed", value: uptimeSourcePacket.summary.parserBridgeRequired },
    { id: "uptime-source-packet-field", status: "passed", value: uptimeSourcePacket.requiredClaim?.field },
    { id: "uptime-parser-bridge-safe", status: "passed", value: uptimeParserBridge.summary.canModifyReliableDps },
    { id: "uptime-parser-bridge-blocked-real", status: "passed", value: uptimeParserBridge.summary.bridgeReady },
    { id: "uptime-parser-bridge-gates-blocked", status: "passed", value: uptimeParserBridge.summary.reliableDpsStillBlocked },
    { id: "delta-bridge-readiness-safe", status: "passed", value: deltaBridgeReadiness.summary.canModifyReliableDps },
    { id: "delta-bridge-readiness-blocked-real", status: "passed", value: deltaBridgeReadiness.summary.allBridgeReady },
    { id: "delta-bridge-readiness-blocked-gates", status: "passed", value: deltaBridgeReadiness.summary.blockedGates },
    { id: "delta-bridge-readiness-gates-blocked", status: "passed", value: deltaBridgeReadiness.summary.reliableDpsStillBlocked },
    { id: "delta-promotion-review-safe", status: "passed", value: deltaPromotionReview.summary.canModifyReliableDps },
    { id: "delta-promotion-review-blocked-real", status: "passed", value: deltaPromotionReview.summary.readyForManualReview },
    { id: "delta-promotion-review-reliable-blocked", status: "passed", value: deltaPromotionReview.summary.canUseForReliableDps },
    { id: "delta-promotion-review-not-auto-promoted", status: "passed", value: deltaPromotionReview.summary.promotionReady },
    { id: "delta-evidence-intake-package-safe", status: "passed", value: deltaEvidenceIntakePackage.summary.canModifyReliableDps },
    { id: "delta-evidence-intake-package-templates", status: "passed", value: deltaEvidenceIntakePackage.summary.templates },
    { id: "delta-evidence-intake-package-ready", status: "passed", value: deltaEvidenceIntakePackage.summary.packageReady },
    { id: "delta-evidence-intake-package-not-auto-promoted", status: "passed", value: deltaEvidenceIntakePackage.summary.promotionReady },
    { id: "delta-evidence-draft-safe", status: "passed", value: deltaEvidenceDraft.summary.canModifyReliableDps },
    { id: "delta-evidence-draft-needs-source", status: "passed", value: deltaEvidenceDraft.summary.draftReadyForCopy },
    { id: "delta-evidence-draft-placeholders", status: "passed", value: deltaEvidenceDraft.summary.placeholderFields },
    { id: "delta-evidence-draft-not-auto-promoted", status: "passed", value: deltaEvidenceDraft.summary.promotionReady },
    { id: "delta-evidence-draft-audit-safe", status: "passed", value: deltaEvidenceDraftAudit.summary.canModifyReliableDps },
    { id: "delta-evidence-draft-audit-blocked-real", status: "passed", value: deltaEvidenceDraftAudit.summary.readyForIntake },
    { id: "delta-evidence-draft-audit-placeholders", status: "passed", value: deltaEvidenceDraftAudit.summary.placeholderFields },
    { id: "delta-evidence-draft-audit-not-auto-promoted", status: "passed", value: deltaEvidenceDraftAudit.summary.promotionReady },
    { id: "delta-evidence-intake-update-preview-safe", status: "passed", value: deltaEvidenceIntakeUpdatePreview.summary.canModifyReliableDps },
    { id: "delta-evidence-intake-update-preview-blocked-real", status: "passed", value: deltaEvidenceIntakeUpdatePreview.summary.previewMergeReady },
    { id: "delta-evidence-intake-update-preview-no-write", status: "passed", value: deltaEvidenceIntakeUpdatePreview.summary.writesRealIntake },
    { id: "delta-evidence-intake-update-preview-not-auto-promoted", status: "passed", value: deltaEvidenceIntakeUpdatePreview.summary.promotionReady },
    { id: "delta-manual-promotion-gate-safe", status: "passed", value: deltaManualPromotionGate.summary.canModifyReliableDps },
    { id: "delta-manual-promotion-gate-blocked-real", status: "passed", value: deltaManualPromotionGate.summary.readyForHumanAction },
    { id: "delta-manual-promotion-gate-reliable-blocked", status: "passed", value: deltaManualPromotionGate.summary.canUseForReliableDps },
    { id: "delta-manual-promotion-gate-not-auto-promoted", status: "passed", value: deltaManualPromotionGate.summary.promotionReady },
    { id: "delta-human-action-plan-safe", status: "passed", value: deltaHumanActionPlan.summary.canModifyReliableDps },
    { id: "delta-human-action-plan-placeholders", status: "passed", value: deltaHumanActionPlan.summary.placeholderFields },
    { id: "delta-human-action-plan-no-write", status: "passed", value: deltaHumanActionPlan.summary.writesRealIntake },
    { id: "delta-human-action-plan-not-auto-promoted", status: "passed", value: deltaHumanActionPlan.summary.promotionReady },
    { id: "user-whatif-contract-safe", status: "passed", value: userWhatIfContract.summary.canModifyReliableDps },
    { id: "user-whatif-contract-checks", status: "passed", value: userWhatIfContract.summary.failedChecks },
    { id: "user-whatif-contract-50pct", status: "passed", value: userWhatIfContract.samples.find((sample) => sample.uptime === 0.5)?.configuredWhatIfDps },
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
assertInvariant(optimizerPlan.externalDeltaEvidencePlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external delta evidence plan");
assertInvariant(optimizerPlan.externalDeltaEvidenceWorkorder?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external delta evidence workorder");
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
assertInvariant(optimizerPlan.sf32OwnerSourcePacket?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_32 owner source packet");
assertInvariant(optimizerPlan.sf32OwnerParserBridge?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_32 owner parser bridge");
assertInvariant(optimizerPlan.sf33TriggerSourcePacket?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_33 trigger source packet");
assertInvariant(optimizerPlan.sf33TriggerParserBridge?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_33 trigger parser bridge");
assertInvariant(optimizerPlan.uptimeLocalExhaustionConclusion?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe uptime local exhaustion conclusion");
assertInvariant(optimizerPlan.uptimeSourcePacket?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe uptime source packet");
assertInvariant(optimizerPlan.uptimeParserBridge?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe uptime parser bridge");
assertInvariant(optimizerPlan.deltaBridgeReadiness?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta bridge readiness");
assertInvariant(optimizerPlan.deltaPromotionReview?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta promotion review");
assertInvariant(optimizerPlan.deltaEvidenceIntakePackage?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence intake package");
assertInvariant(optimizerPlan.deltaEvidenceDraft?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence draft");
assertInvariant(optimizerPlan.deltaEvidenceDraftAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence draft audit");
assertInvariant(optimizerPlan.deltaEvidenceIntakeUpdatePreview?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence intake update preview");
assertInvariant(optimizerPlan.deltaManualPromotionGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta manual promotion gate");
assertInvariant(optimizerPlan.deltaHumanActionPlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta human action plan");
assertInvariant(optimizerPlan.userWhatIfContract?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe user what-if contract");
assertInvariant(optimizerPlan.summary.reliableStrictBuilds === 0, "no reliable strict build should exist yet");

console.log(JSON.stringify({ outFile, summary }, null, 2));
