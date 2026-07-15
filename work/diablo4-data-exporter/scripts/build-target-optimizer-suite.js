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
  "build-diablo-tools-attribute-source-audit.js",
  "test-diablo-tools-attribute-source-audit.js",
  "build-selector-949-reconciliation-audit.js",
  "test-selector-949-reconciliation-audit.js",
  "build-selector-949-window-reparse-audit.js",
  "test-selector-949-window-reparse-audit.js",
  "build-external-evidence-submission-pack.js",
  "test-external-evidence-submission-pack.js",
  "build-external-evidence-submission-gate.js",
  "test-external-evidence-submission-gate.js",
  "preview-external-evidence-submission-intake.js",
  "test-external-evidence-submission-intake-preview.js",
  "audit-external-evidence-submission-post-copy-intake.js",
  "test-external-evidence-submission-post-copy-intake.js",
  "build-external-evidence-submission-manual-review-gate.js",
  "test-external-evidence-submission-manual-review-gate.js",
  "build-external-evidence-submission-review-decision-package.js",
  "test-external-evidence-submission-review-decision-package.js",
  "audit-external-evidence-submission-review-decision.js",
  "test-external-evidence-submission-review-decision-audit.js",
  "build-external-evidence-submission-promotion-audit.js",
  "test-external-evidence-submission-promotion-audit.js",
  "build-external-evidence-submission-implementation-dry-run.js",
  "test-external-evidence-submission-implementation-dry-run.js",
  "build-external-evidence-submission-application-gate.js",
  "test-external-evidence-submission-application-gate.js",
  "build-external-evidence-submission-apply-plan.js",
  "test-external-evidence-submission-apply-plan.js",
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
  "build-delta-evidence-fill-form.js",
  "test-delta-evidence-fill-form.js",
  "apply-delta-evidence-fill-form.js",
  "test-delta-evidence-filled-draft.js",
  "audit-delta-evidence-filled-draft.js",
  "test-delta-evidence-filled-draft-audit.js",
  "preview-delta-evidence-filled-draft-intake.js",
  "test-delta-evidence-filled-draft-intake-preview.js",
  "build-delta-evidence-intake-copy-gate.js",
  "test-delta-evidence-intake-copy-gate.js",
  "audit-delta-evidence-post-copy-intake.js",
  "test-delta-evidence-post-copy-intake.js",
  "build-delta-evidence-manual-review-gate.js",
  "test-delta-evidence-manual-review-gate.js",
  "build-delta-evidence-review-decision-package.js",
  "test-delta-evidence-review-decision-package.js",
  "audit-delta-evidence-review-decision.js",
  "test-delta-evidence-review-decision-audit.js",
  "build-delta-evidence-promotion-audit.js",
  "test-delta-evidence-promotion-audit.js",
  "build-delta-promotion-implementation-dry-run.js",
  "test-delta-promotion-implementation-dry-run.js",
  "build-delta-promotion-application-gate.js",
  "test-delta-promotion-application-gate.js",
  "build-delta-promotion-apply-plan.js",
  "test-delta-promotion-apply-plan.js",
  "build-delta-local-exhaustion-conclusion.js",
  "build-delta-next-action-decision.js",
  "test-delta-next-action-decision.js",
  "build-sf32-owner-source-hunt-plan.js",
  "test-sf32-owner-source-hunt-plan.js",
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
const externalEvidenceSubmissionPack = readJson("outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json");
const externalEvidenceSubmissionGate = readJson("outputs/diablo4-external-evidence-submission-gate/external-evidence-submission-gate.json");
const externalEvidenceSubmissionIntakePreview = readJson("outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-submission-intake-preview.json");
const externalEvidenceSubmissionPostCopyIntake = readJson("outputs/diablo4-external-evidence-submission-post-copy-intake/external-evidence-submission-post-copy-intake.json");
const externalEvidenceSubmissionManualReviewGate = readJson("outputs/diablo4-external-evidence-submission-manual-review-gate/external-evidence-submission-manual-review-gate.json");
const externalEvidenceSubmissionReviewDecisionPackage = readJson("outputs/diablo4-external-evidence-submission-review-decision-package/external-evidence-submission-review-decision-package.json");
const externalEvidenceSubmissionReviewDecisionAudit = readJson("outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json");
const externalEvidenceSubmissionPromotionAudit = readJson("outputs/diablo4-external-evidence-submission-promotion-audit/external-evidence-submission-promotion-audit.json");
const externalEvidenceSubmissionImplementationDryRun = readJson("outputs/diablo4-external-evidence-submission-implementation-dry-run/external-evidence-submission-implementation-dry-run.json");
const externalEvidenceSubmissionApplicationGate = readJson("outputs/diablo4-external-evidence-submission-application-gate/external-evidence-submission-application-gate.json");
const externalEvidenceSubmissionApplyPlan = readJson("outputs/diablo4-external-evidence-submission-apply-plan/external-evidence-submission-apply-plan.json");
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
const deltaNextActionDecision = readJson("outputs/diablo4-delta-next-action-decision/delta-next-action-decision.json");
const sf32LocalExhaustionConclusion = readJson("outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json");
const sf32OwnerSourcePacket = readJson("outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json");
const sf32OwnerSourceHuntPlan = readJson("outputs/diablo4-sf32-owner-source-hunt-plan/sf32-owner-source-hunt-plan.json");
const diabloToolsAttributeSourceAudit = readJson("outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json");
const selector949ReconciliationAudit = readJson("outputs/diablo4-selector-949-reconciliation-audit/selector-949-reconciliation-audit.json");
const selector949WindowReparseAudit = readJson("outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json");
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
const deltaEvidenceFillForm = readJson("outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json");
const deltaEvidenceFilledDraft = readJson("outputs/diablo4-delta-evidence-filled-draft/delta-evidence-filled-draft.json");
const deltaEvidenceFilledDraftAudit = readJson("outputs/diablo4-delta-evidence-filled-draft-audit/delta-evidence-filled-draft-audit.json");
const deltaEvidenceFilledDraftIntakePreview = readJson("outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json");
const deltaEvidenceIntakeCopyGate = readJson("outputs/diablo4-delta-evidence-intake-copy-gate/delta-evidence-intake-copy-gate.json");
const deltaEvidencePostCopyIntake = readJson("outputs/diablo4-delta-evidence-post-copy-intake/delta-evidence-post-copy-intake.json");
const deltaEvidenceManualReviewGate = readJson("outputs/diablo4-delta-evidence-manual-review-gate/delta-evidence-manual-review-gate.json");
const deltaEvidenceReviewDecisionPackage = readJson("outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.json");
const deltaEvidenceReviewDecisionAudit = readJson("outputs/diablo4-delta-evidence-review-decision-audit/delta-evidence-review-decision-audit.json");
const deltaEvidencePromotionAudit = readJson("outputs/diablo4-delta-evidence-promotion-audit/delta-evidence-promotion-audit.json");
const deltaPromotionImplementationDryRun = readJson("outputs/diablo4-delta-promotion-implementation-dry-run/delta-promotion-implementation-dry-run.json");
const deltaPromotionApplicationGate = readJson("outputs/diablo4-delta-promotion-application-gate/delta-promotion-application-gate.json");
const deltaPromotionApplyPlan = readJson("outputs/diablo4-delta-promotion-apply-plan/delta-promotion-apply-plan.json");
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
assertInvariant(externalEvidenceSubmissionPack.summary.canModifyReliableDps === false, "external evidence submission pack must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionPack.summary.writesIntake === false, "external evidence submission pack must not write intake");
assertInvariant(externalEvidenceSubmissionPack.summary.nextTaskId === "delta-proof-sf32-owner", "external evidence submission pack must target next SF_32 proof");
assertInvariant(externalEvidenceSubmissionPack.summary.templateNeedsRevision === true, "external evidence submission pack must revise SF_32 template after 949 reparse");
assertInvariant(externalEvidenceSubmissionPack.summary.claimField === "eAttrib:994 + local-role:949", "external evidence submission pack must target revised 994 + local 949 field");
assertInvariant(externalEvidenceSubmissionGate.summary.canModifyReliableDps === false, "external evidence submission gate must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionGate.summary.writesIntake === false, "external evidence submission gate must not write intake");
assertInvariant(externalEvidenceSubmissionGate.summary.readyForIntakeCopy === false, "real external evidence submission gate should remain blocked");
assertInvariant(externalEvidenceSubmissionIntakePreview.summary.canModifyReliableDps === false, "external evidence submission intake preview must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionIntakePreview.summary.writesRealIntake === false, "external evidence submission intake preview must not write intake");
assertInvariant(externalEvidenceSubmissionIntakePreview.summary.previewMergeReady === false, "real external evidence submission intake preview should remain blocked");
assertInvariant(externalEvidenceSubmissionPostCopyIntake.summary.canModifyReliableDps === false, "external evidence submission post-copy intake must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionPostCopyIntake.summary.writesRealIntake === false, "external evidence submission post-copy intake must not write intake");
assertInvariant(externalEvidenceSubmissionPostCopyIntake.summary.readyForManualReview === false, "real external evidence submission post-copy intake should remain blocked");
assertInvariant(externalEvidenceSubmissionManualReviewGate.summary.canModifyReliableDps === false, "external evidence submission manual review gate must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionManualReviewGate.summary.writesRealIntake === false, "external evidence submission manual review gate must not write intake");
assertInvariant(externalEvidenceSubmissionManualReviewGate.summary.readyForReviewerDecision === false, "real external evidence submission manual review gate should remain blocked");
assertInvariant(externalEvidenceSubmissionReviewDecisionPackage.summary.canModifyReliableDps === false, "external evidence submission review decision package must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionReviewDecisionPackage.summary.readyForDecisionInput === false, "real external evidence submission review decision package should remain blocked");
assertInvariant(externalEvidenceSubmissionReviewDecisionPackage.summary.writesRealIntake === false, "external evidence submission review decision package must not write real intake");
assertInvariant(externalEvidenceSubmissionReviewDecisionPackage.summary.acceptedForBridge === false, "external evidence submission review decision package must not accept for bridge");
assertInvariant(externalEvidenceSubmissionReviewDecisionPackage.summary.promotionReady === false, "external evidence submission review decision package must not auto-promote");
assertInvariant(externalEvidenceSubmissionReviewDecisionAudit.summary.canModifyReliableDps === false, "external evidence submission review decision audit must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionReviewDecisionAudit.summary.readyForPromotionAudit === false, "real external evidence submission review decision audit should remain blocked");
assertInvariant(externalEvidenceSubmissionReviewDecisionAudit.summary.writesRealIntake === false, "external evidence submission review decision audit must not write real intake");
assertInvariant(externalEvidenceSubmissionReviewDecisionAudit.summary.acceptedForBridge === false, "external evidence submission review decision audit must not accept for bridge");
assertInvariant(externalEvidenceSubmissionReviewDecisionAudit.summary.promotionReady === false, "external evidence submission review decision audit must not auto-promote");
assertInvariant(externalEvidenceSubmissionPromotionAudit.summary.canModifyReliableDps === false, "external evidence submission promotion audit must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionPromotionAudit.summary.readyForPromotionImplementation === false, "real external evidence submission promotion audit should remain blocked");
assertInvariant(externalEvidenceSubmissionPromotionAudit.summary.writesRealIntake === false, "external evidence submission promotion audit must not write real intake");
assertInvariant(externalEvidenceSubmissionPromotionAudit.summary.acceptedForBridge === false, "external evidence submission promotion audit must not accept for bridge");
assertInvariant(externalEvidenceSubmissionPromotionAudit.summary.promotionReady === false, "external evidence submission promotion audit must not auto-promote");
assertInvariant(externalEvidenceSubmissionImplementationDryRun.summary.canModifyReliableDps === false, "external evidence submission implementation dry-run must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionImplementationDryRun.summary.patchPreviewReady === false, "real external evidence submission implementation dry-run should remain blocked");
assertInvariant(externalEvidenceSubmissionImplementationDryRun.summary.writesTargetDataset === false, "external evidence submission implementation dry-run must not write target dataset");
assertInvariant(externalEvidenceSubmissionImplementationDryRun.summary.acceptedForBridge === false, "external evidence submission implementation dry-run must not accept for bridge");
assertInvariant(externalEvidenceSubmissionImplementationDryRun.summary.promotionReady === false, "external evidence submission implementation dry-run must not auto-promote");
assertInvariant(externalEvidenceSubmissionApplicationGate.summary.canModifyReliableDps === false, "external evidence submission application gate must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionApplicationGate.summary.manualApplyAllowed === false, "real external evidence submission application gate should remain blocked");
assertInvariant(externalEvidenceSubmissionApplicationGate.summary.writesTargetDataset === false, "external evidence submission application gate must not write target dataset");
assertInvariant(externalEvidenceSubmissionApplicationGate.summary.acceptedForBridge === false, "external evidence submission application gate must not accept for bridge");
assertInvariant(externalEvidenceSubmissionApplicationGate.summary.promotionReady === false, "external evidence submission application gate must not auto-promote");
assertInvariant(externalEvidenceSubmissionApplyPlan.summary.canModifyReliableDps === false, "external evidence submission apply plan must not modify reliable DPS");
assertInvariant(externalEvidenceSubmissionApplyPlan.summary.applyPlanReady === false, "real external evidence submission apply plan should remain blocked");
assertInvariant(externalEvidenceSubmissionApplyPlan.summary.writesTargetDataset === false, "external evidence submission apply plan must not write target dataset");
assertInvariant(externalEvidenceSubmissionApplyPlan.summary.acceptedForBridge === false, "external evidence submission apply plan must not accept for bridge");
assertInvariant(externalEvidenceSubmissionApplyPlan.summary.promotionReady === false, "external evidence submission apply plan must not auto-promote");
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
assertInvariant(deltaNextActionDecision.summary.canModifyReliableDps === false, "delta next action decision must not modify reliable DPS");
assertInvariant(deltaNextActionDecision.summary.recommendedActionId === "collect-source-backed-delta-proof", "delta next action should prioritize source-backed proof");
assertInvariant(deltaNextActionDecision.summary.externalProofMissing === true, "delta next action should keep external proof missing in real run");
assertInvariant(deltaNextActionDecision.rankedActions.length === 3, "delta next action decision must expose three actions");
assertInvariant(sf32LocalExhaustionConclusion.summary.canModifyReliableDps === false, "SF_32 local exhaustion conclusion must not modify reliable DPS");
assertInvariant(sf32LocalExhaustionConclusion.summary.fieldOwnershipProven === false, "SF_32 local exhaustion conclusion must not prove field ownership automatically");
assertInvariant(sf32LocalExhaustionConclusion.summary.sf32LocalExhausted === true, "SF_32 local exhaustion conclusion should close local SF_32 exploration");
assertInvariant(sf32OwnerSourcePacket.summary.canModifyReliableDps === false, "SF_32 owner source packet must not modify reliable DPS");
assertInvariant(sf32OwnerSourcePacket.summary.parserBridgeRequired === true, "SF_32 owner source packet must require a parser bridge");
assertInvariant(sf32OwnerSourcePacket.requiredClaim?.field === "selector:949", "SF_32 owner source packet must target selector:949");
assertInvariant(sf32OwnerSourceHuntPlan.summary.canModifyReliableDps === false, "SF_32 source hunt plan must not modify reliable DPS");
assertInvariant(sf32OwnerSourceHuntPlan.summary.searches === 4, "SF_32 source hunt plan must expose four searches");
assertInvariant(sf32OwnerSourceHuntPlan.summary.candidateSnippetReady === true, "SF_32 source hunt plan must carry the pending candidate snippet");
assertInvariant(sf32OwnerSourceHuntPlan.summary.templateNeedsRevision === true, "SF_32 source hunt plan must require template revision after 949 reparse");
assertInvariant(sf32OwnerSourceHuntPlan.summary.candidateSnippetUsable === false, "SF_32 source hunt plan must supersede old selector 949 candidate");
assertInvariant(diabloToolsAttributeSourceAudit.summary.canModifyReliableDps === false, "DiabloTools attribute audit must not modify reliable DPS");
assertInvariant(diabloToolsAttributeSourceAudit.summary.selector949Name === "Damage_Percent_Reduction_From_Elites", "DiabloTools must map eAttrib 949 to Damage_Percent_Reduction_From_Elites");
assertInvariant(diabloToolsAttributeSourceAudit.summary.bonusPercentPerPowerEAttrib === 994, "DiabloTools must map Bonus_Percent_Per_Power to eAttrib 994");
assertInvariant(diabloToolsAttributeSourceAudit.summary.sourceContradictsPriorSelectorAssumption === true, "DiabloTools audit must flag selector assumption mismatch");
assertInvariant(selector949ReconciliationAudit.summary.canModifyReliableDps === false, "selector 949 reconciliation must not modify reliable DPS");
assertInvariant(selector949ReconciliationAudit.summary.selector994Aligned === true, "selector 949 reconciliation must align selector 994");
assertInvariant(selector949ReconciliationAudit.summary.selector949Contradicted === true, "selector 949 reconciliation must flag 949 contradiction");
assertInvariant(selector949ReconciliationAudit.summary.needsReinterpretation === true, "selector 949 reconciliation must require reinterpretation");
assertInvariant(selector949WindowReparseAudit.summary.canModifyReliableDps === false, "selector 949 window reparse must not modify reliable DPS");
assertInvariant(selector949WindowReparseAudit.summary.selector994DirectExamples >= 3, "selector 949 window reparse must keep selector 994 examples");
assertInvariant(selector949WindowReparseAudit.summary.selector949NotBonusEAttrib === true, "selector 949 window reparse must reject 949 as bonus eAttrib");
assertInvariant(selector949WindowReparseAudit.summary.sf32TemplateNeedsRevision === true, "selector 949 window reparse must require SF_32 template revision");
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
assertInvariant(deltaEvidenceFillForm.summary.canModifyReliableDps === false, "delta evidence fill form must not modify reliable DPS");
assertInvariant(deltaEvidenceFillForm.summary.fields === 7, "delta evidence fill form should expose the current fields");
assertInvariant(deltaEvidenceFillForm.summary.completedFields === 0, "delta evidence fill form should start empty");
assertInvariant(deltaEvidenceFillForm.summary.promotionReady === false, "delta evidence fill form must not auto-promote");
assertInvariant(deltaEvidenceFilledDraft.summary.canModifyReliableDps === false, "delta evidence filled draft must not modify reliable DPS");
assertInvariant(deltaEvidenceFilledDraft.summary.completedFields === 0, "real delta evidence filled draft should remain empty");
assertInvariant(deltaEvidenceFilledDraft.summary.readyForDraftAudit === false, "real delta evidence filled draft should remain blocked");
assertInvariant(deltaEvidenceFilledDraft.summary.writesRealIntake === false, "delta evidence filled draft must not write real intake");
assertInvariant(deltaEvidenceFilledDraft.summary.promotionReady === false, "delta evidence filled draft must not auto-promote");
assertInvariant(deltaEvidenceFilledDraftAudit.summary.canModifyReliableDps === false, "delta evidence filled draft audit must not modify reliable DPS");
assertInvariant(deltaEvidenceFilledDraftAudit.summary.readyForPreview === false, "real delta evidence filled draft audit should remain blocked");
assertInvariant(deltaEvidenceFilledDraftAudit.summary.writesRealIntake === false, "delta evidence filled draft audit must not write real intake");
assertInvariant(deltaEvidenceFilledDraftAudit.summary.acceptedForBridge === false, "delta evidence filled draft audit must not accept for bridge");
assertInvariant(deltaEvidenceFilledDraftAudit.summary.promotionReady === false, "delta evidence filled draft audit must not auto-promote");
assertInvariant(deltaEvidenceFilledDraftIntakePreview.summary.canModifyReliableDps === false, "delta evidence filled draft intake preview must not modify reliable DPS");
assertInvariant(deltaEvidenceFilledDraftIntakePreview.summary.previewMergeReady === false, "real delta evidence filled draft intake preview should remain blocked");
assertInvariant(deltaEvidenceFilledDraftIntakePreview.summary.writesRealIntake === false, "delta evidence filled draft intake preview must not write real intake");
assertInvariant(deltaEvidenceFilledDraftIntakePreview.summary.acceptedForBridge === false, "delta evidence filled draft intake preview must not accept for bridge");
assertInvariant(deltaEvidenceFilledDraftIntakePreview.summary.promotionReady === false, "delta evidence filled draft intake preview must not auto-promote");
assertInvariant(deltaEvidenceIntakeCopyGate.summary.canModifyReliableDps === false, "delta evidence intake copy gate must not modify reliable DPS");
assertInvariant(deltaEvidenceIntakeCopyGate.summary.readyForManualCopy === false, "real delta evidence intake copy gate should remain blocked");
assertInvariant(deltaEvidenceIntakeCopyGate.summary.writesRealIntake === false, "delta evidence intake copy gate must not write real intake");
assertInvariant(deltaEvidenceIntakeCopyGate.summary.acceptedForBridge === false, "delta evidence intake copy gate must not accept for bridge");
assertInvariant(deltaEvidenceIntakeCopyGate.summary.promotionReady === false, "delta evidence intake copy gate must not auto-promote");
assertInvariant(deltaEvidencePostCopyIntake.summary.canModifyReliableDps === false, "delta evidence post-copy intake must not modify reliable DPS");
assertInvariant(deltaEvidencePostCopyIntake.summary.readyForManualReview === false, "real delta evidence post-copy intake should remain blocked");
assertInvariant(deltaEvidencePostCopyIntake.summary.writesRealIntake === false, "delta evidence post-copy intake must not write real intake");
assertInvariant(deltaEvidencePostCopyIntake.summary.acceptedForBridge === false, "delta evidence post-copy intake must not accept for bridge");
assertInvariant(deltaEvidencePostCopyIntake.summary.promotionReady === false, "delta evidence post-copy intake must not auto-promote");
assertInvariant(deltaEvidenceManualReviewGate.summary.canModifyReliableDps === false, "delta evidence manual review gate must not modify reliable DPS");
assertInvariant(deltaEvidenceManualReviewGate.summary.readyForReviewerDecision === false, "real delta evidence manual review gate should remain blocked");
assertInvariant(deltaEvidenceManualReviewGate.summary.writesRealIntake === false, "delta evidence manual review gate must not write real intake");
assertInvariant(deltaEvidenceManualReviewGate.summary.acceptedForBridge === false, "delta evidence manual review gate must not accept for bridge");
assertInvariant(deltaEvidenceManualReviewGate.summary.promotionReady === false, "delta evidence manual review gate must not auto-promote");
assertInvariant(deltaEvidenceReviewDecisionPackage.summary.canModifyReliableDps === false, "delta evidence review decision package must not modify reliable DPS");
assertInvariant(deltaEvidenceReviewDecisionPackage.summary.readyForDecisionInput === false, "real delta evidence review decision package should remain blocked");
assertInvariant(deltaEvidenceReviewDecisionPackage.summary.writesRealIntake === false, "delta evidence review decision package must not write real intake");
assertInvariant(deltaEvidenceReviewDecisionPackage.summary.acceptedForBridge === false, "delta evidence review decision package must not accept for bridge");
assertInvariant(deltaEvidenceReviewDecisionPackage.summary.promotionReady === false, "delta evidence review decision package must not auto-promote");
assertInvariant(deltaEvidenceReviewDecisionAudit.summary.canModifyReliableDps === false, "delta evidence review decision audit must not modify reliable DPS");
assertInvariant(deltaEvidenceReviewDecisionAudit.summary.readyForPromotionAudit === false, "real delta evidence review decision audit should remain blocked");
assertInvariant(deltaEvidenceReviewDecisionAudit.summary.writesRealIntake === false, "delta evidence review decision audit must not write real intake");
assertInvariant(deltaEvidenceReviewDecisionAudit.summary.acceptedForBridge === false, "delta evidence review decision audit must not accept for bridge");
assertInvariant(deltaEvidenceReviewDecisionAudit.summary.promotionReady === false, "delta evidence review decision audit must not auto-promote");
assertInvariant(deltaEvidencePromotionAudit.summary.canModifyReliableDps === false, "delta evidence promotion audit must not modify reliable DPS");
assertInvariant(deltaEvidencePromotionAudit.summary.readyForPromotionImplementation === false, "real delta evidence promotion audit should remain blocked");
assertInvariant(deltaEvidencePromotionAudit.summary.writesRealIntake === false, "delta evidence promotion audit must not write real intake");
assertInvariant(deltaEvidencePromotionAudit.summary.acceptedForBridge === false, "delta evidence promotion audit must not accept for bridge");
assertInvariant(deltaEvidencePromotionAudit.summary.promotionReady === false, "delta evidence promotion audit must not auto-promote");
assertInvariant(deltaPromotionImplementationDryRun.summary.canModifyReliableDps === false, "delta promotion implementation dry-run must not modify reliable DPS");
assertInvariant(deltaPromotionImplementationDryRun.summary.patchPreviewReady === false, "real delta promotion implementation dry-run should remain blocked");
assertInvariant(deltaPromotionImplementationDryRun.summary.writesTargetDataset === false, "delta promotion implementation dry-run must not write target dataset");
assertInvariant(deltaPromotionImplementationDryRun.summary.acceptedForBridge === false, "delta promotion implementation dry-run must not accept for bridge");
assertInvariant(deltaPromotionImplementationDryRun.summary.promotionReady === false, "delta promotion implementation dry-run must not auto-promote");
assertInvariant(deltaPromotionApplicationGate.summary.canModifyReliableDps === false, "delta promotion application gate must not modify reliable DPS");
assertInvariant(deltaPromotionApplicationGate.summary.manualApplyAllowed === false, "real delta promotion application gate should remain blocked");
assertInvariant(deltaPromotionApplicationGate.summary.writesTargetDataset === false, "delta promotion application gate must not write target dataset");
assertInvariant(deltaPromotionApplicationGate.summary.acceptedForBridge === false, "delta promotion application gate must not accept for bridge");
assertInvariant(deltaPromotionApplicationGate.summary.promotionReady === false, "delta promotion application gate must not auto-promote");
assertInvariant(deltaPromotionApplyPlan.summary.canModifyReliableDps === false, "delta promotion apply plan must not modify reliable DPS");
assertInvariant(deltaPromotionApplyPlan.summary.applyPlanReady === false, "real delta promotion apply plan should remain blocked");
assertInvariant(deltaPromotionApplyPlan.summary.writesTargetDataset === false, "delta promotion apply plan must not write target dataset");
assertInvariant(deltaPromotionApplyPlan.summary.acceptedForBridge === false, "delta promotion apply plan must not accept for bridge");
assertInvariant(deltaPromotionApplyPlan.summary.promotionReady === false, "delta promotion apply plan must not auto-promote");
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
    { id: "external-evidence-submission-pack-safe", status: "passed", value: externalEvidenceSubmissionPack.summary.canModifyReliableDps },
    { id: "external-evidence-submission-pack-no-write", status: "passed", value: externalEvidenceSubmissionPack.summary.writesIntake },
    { id: "external-evidence-submission-pack-next-task", status: "passed", value: externalEvidenceSubmissionPack.summary.nextTaskId },
    { id: "external-evidence-submission-pack-template-revision", status: "passed", value: externalEvidenceSubmissionPack.summary.templateNeedsRevision },
    { id: "external-evidence-submission-pack-revised-field", status: "passed", value: externalEvidenceSubmissionPack.summary.claimField },
    { id: "external-evidence-submission-gate-safe", status: "passed", value: externalEvidenceSubmissionGate.summary.canModifyReliableDps },
    { id: "external-evidence-submission-gate-no-write", status: "passed", value: externalEvidenceSubmissionGate.summary.writesIntake },
    { id: "external-evidence-submission-gate-blocked-real", status: "passed", value: externalEvidenceSubmissionGate.summary.readyForIntakeCopy },
    { id: "external-evidence-submission-intake-preview-safe", status: "passed", value: externalEvidenceSubmissionIntakePreview.summary.canModifyReliableDps },
    { id: "external-evidence-submission-intake-preview-no-write", status: "passed", value: externalEvidenceSubmissionIntakePreview.summary.writesRealIntake },
    { id: "external-evidence-submission-intake-preview-blocked-real", status: "passed", value: externalEvidenceSubmissionIntakePreview.summary.previewMergeReady },
    { id: "external-evidence-submission-post-copy-safe", status: "passed", value: externalEvidenceSubmissionPostCopyIntake.summary.canModifyReliableDps },
    { id: "external-evidence-submission-post-copy-no-write", status: "passed", value: externalEvidenceSubmissionPostCopyIntake.summary.writesRealIntake },
    { id: "external-evidence-submission-post-copy-blocked-real", status: "passed", value: externalEvidenceSubmissionPostCopyIntake.summary.readyForManualReview },
    { id: "external-evidence-submission-manual-review-safe", status: "passed", value: externalEvidenceSubmissionManualReviewGate.summary.canModifyReliableDps },
    { id: "external-evidence-submission-manual-review-no-write", status: "passed", value: externalEvidenceSubmissionManualReviewGate.summary.writesRealIntake },
    { id: "external-evidence-submission-manual-review-blocked-real", status: "passed", value: externalEvidenceSubmissionManualReviewGate.summary.readyForReviewerDecision },
    { id: "external-evidence-submission-review-decision-package-safe", status: "passed", value: externalEvidenceSubmissionReviewDecisionPackage.summary.canModifyReliableDps },
    { id: "external-evidence-submission-review-decision-package-blocked-real", status: "passed", value: externalEvidenceSubmissionReviewDecisionPackage.summary.readyForDecisionInput },
    { id: "external-evidence-submission-review-decision-package-no-write", status: "passed", value: externalEvidenceSubmissionReviewDecisionPackage.summary.writesRealIntake },
    { id: "external-evidence-submission-review-decision-package-not-accepted", status: "passed", value: externalEvidenceSubmissionReviewDecisionPackage.summary.acceptedForBridge },
    { id: "external-evidence-submission-review-decision-package-not-auto-promoted", status: "passed", value: externalEvidenceSubmissionReviewDecisionPackage.summary.promotionReady },
    { id: "external-evidence-submission-review-decision-audit-safe", status: "passed", value: externalEvidenceSubmissionReviewDecisionAudit.summary.canModifyReliableDps },
    { id: "external-evidence-submission-review-decision-audit-blocked-real", status: "passed", value: externalEvidenceSubmissionReviewDecisionAudit.summary.readyForPromotionAudit },
    { id: "external-evidence-submission-review-decision-audit-no-write", status: "passed", value: externalEvidenceSubmissionReviewDecisionAudit.summary.writesRealIntake },
    { id: "external-evidence-submission-review-decision-audit-not-accepted", status: "passed", value: externalEvidenceSubmissionReviewDecisionAudit.summary.acceptedForBridge },
    { id: "external-evidence-submission-review-decision-audit-not-auto-promoted", status: "passed", value: externalEvidenceSubmissionReviewDecisionAudit.summary.promotionReady },
    { id: "external-evidence-submission-promotion-audit-safe", status: "passed", value: externalEvidenceSubmissionPromotionAudit.summary.canModifyReliableDps },
    { id: "external-evidence-submission-promotion-audit-blocked-real", status: "passed", value: externalEvidenceSubmissionPromotionAudit.summary.readyForPromotionImplementation },
    { id: "external-evidence-submission-promotion-audit-no-write", status: "passed", value: externalEvidenceSubmissionPromotionAudit.summary.writesRealIntake },
    { id: "external-evidence-submission-promotion-audit-not-accepted", status: "passed", value: externalEvidenceSubmissionPromotionAudit.summary.acceptedForBridge },
    { id: "external-evidence-submission-promotion-audit-not-auto-promoted", status: "passed", value: externalEvidenceSubmissionPromotionAudit.summary.promotionReady },
    { id: "external-evidence-submission-implementation-dry-run-safe", status: "passed", value: externalEvidenceSubmissionImplementationDryRun.summary.canModifyReliableDps },
    { id: "external-evidence-submission-implementation-dry-run-blocked-real", status: "passed", value: externalEvidenceSubmissionImplementationDryRun.summary.patchPreviewReady },
    { id: "external-evidence-submission-implementation-dry-run-no-write", status: "passed", value: externalEvidenceSubmissionImplementationDryRun.summary.writesTargetDataset },
    { id: "external-evidence-submission-implementation-dry-run-not-accepted", status: "passed", value: externalEvidenceSubmissionImplementationDryRun.summary.acceptedForBridge },
    { id: "external-evidence-submission-implementation-dry-run-not-auto-promoted", status: "passed", value: externalEvidenceSubmissionImplementationDryRun.summary.promotionReady },
    { id: "external-evidence-submission-application-gate-safe", status: "passed", value: externalEvidenceSubmissionApplicationGate.summary.canModifyReliableDps },
    { id: "external-evidence-submission-application-gate-blocked-real", status: "passed", value: externalEvidenceSubmissionApplicationGate.summary.manualApplyAllowed },
    { id: "external-evidence-submission-application-gate-no-write", status: "passed", value: externalEvidenceSubmissionApplicationGate.summary.writesTargetDataset },
    { id: "external-evidence-submission-application-gate-not-accepted", status: "passed", value: externalEvidenceSubmissionApplicationGate.summary.acceptedForBridge },
    { id: "external-evidence-submission-application-gate-not-auto-promoted", status: "passed", value: externalEvidenceSubmissionApplicationGate.summary.promotionReady },
    { id: "external-evidence-submission-apply-plan-safe", status: "passed", value: externalEvidenceSubmissionApplyPlan.summary.canModifyReliableDps },
    { id: "external-evidence-submission-apply-plan-blocked-real", status: "passed", value: externalEvidenceSubmissionApplyPlan.summary.applyPlanReady },
    { id: "external-evidence-submission-apply-plan-no-write", status: "passed", value: externalEvidenceSubmissionApplyPlan.summary.writesTargetDataset },
    { id: "external-evidence-submission-apply-plan-not-accepted", status: "passed", value: externalEvidenceSubmissionApplyPlan.summary.acceptedForBridge },
    { id: "external-evidence-submission-apply-plan-not-auto-promoted", status: "passed", value: externalEvidenceSubmissionApplyPlan.summary.promotionReady },
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
    { id: "delta-next-action-decision-safe", status: "passed", value: deltaNextActionDecision.summary.canModifyReliableDps },
    { id: "delta-next-action-decision-priority", status: "passed", value: deltaNextActionDecision.summary.recommendedActionId },
    { id: "delta-next-action-decision-external-missing", status: "passed", value: deltaNextActionDecision.summary.externalProofMissing },
    { id: "delta-next-action-decision-actions", status: "passed", value: deltaNextActionDecision.summary.actions },
    { id: "sf32-local-exhaustion-safe", status: "passed", value: sf32LocalExhaustionConclusion.summary.canModifyReliableDps },
    { id: "sf32-local-field-not-proven", status: "passed", value: sf32LocalExhaustionConclusion.summary.fieldOwnershipProven },
    { id: "sf32-local-next-focus", status: "passed", value: sf32LocalExhaustionConclusion.summary.recommendedNextFocus },
    { id: "sf32-owner-source-packet-safe", status: "passed", value: sf32OwnerSourcePacket.summary.canModifyReliableDps },
    { id: "sf32-owner-source-packet-bridge-required", status: "passed", value: sf32OwnerSourcePacket.summary.parserBridgeRequired },
    { id: "sf32-owner-source-packet-field", status: "passed", value: sf32OwnerSourcePacket.requiredClaim?.field },
    { id: "sf32-owner-source-hunt-safe", status: "passed", value: sf32OwnerSourceHuntPlan.summary.canModifyReliableDps },
    { id: "sf32-owner-source-hunt-searches", status: "passed", value: sf32OwnerSourceHuntPlan.summary.searches },
    { id: "sf32-owner-source-hunt-snippet-ready", status: "passed", value: sf32OwnerSourceHuntPlan.summary.candidateSnippetReady },
    { id: "sf32-owner-source-hunt-template-revision", status: "passed", value: sf32OwnerSourceHuntPlan.summary.templateNeedsRevision },
    { id: "sf32-owner-source-hunt-snippet-superseded", status: "passed", value: sf32OwnerSourceHuntPlan.summary.candidateSnippetUsable },
    { id: "diablo-tools-attribute-audit-safe", status: "passed", value: diabloToolsAttributeSourceAudit.summary.canModifyReliableDps },
    { id: "diablo-tools-attribute-audit-949-name", status: "passed", value: diabloToolsAttributeSourceAudit.summary.selector949Name },
    { id: "diablo-tools-attribute-audit-bonus-eattrib", status: "passed", value: diabloToolsAttributeSourceAudit.summary.bonusPercentPerPowerEAttrib },
    { id: "diablo-tools-attribute-audit-contradiction", status: "passed", value: diabloToolsAttributeSourceAudit.summary.sourceContradictsPriorSelectorAssumption },
    { id: "selector-949-reconciliation-safe", status: "passed", value: selector949ReconciliationAudit.summary.canModifyReliableDps },
    { id: "selector-949-reconciliation-994-aligned", status: "passed", value: selector949ReconciliationAudit.summary.selector994Aligned },
    { id: "selector-949-reconciliation-949-conflict", status: "passed", value: selector949ReconciliationAudit.summary.selector949Contradicted },
    { id: "selector-949-reconciliation-next-focus", status: "passed", value: selector949ReconciliationAudit.summary.recommendedNextFocus },
    { id: "selector-949-window-reparse-safe", status: "passed", value: selector949WindowReparseAudit.summary.canModifyReliableDps },
    { id: "selector-949-window-reparse-994-examples", status: "passed", value: selector949WindowReparseAudit.summary.selector994DirectExamples },
    { id: "selector-949-window-reparse-not-bonus", status: "passed", value: selector949WindowReparseAudit.summary.selector949NotBonusEAttrib },
    { id: "selector-949-window-reparse-template-revision", status: "passed", value: selector949WindowReparseAudit.summary.sf32TemplateNeedsRevision },
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
    { id: "delta-evidence-fill-form-safe", status: "passed", value: deltaEvidenceFillForm.summary.canModifyReliableDps },
    { id: "delta-evidence-fill-form-fields", status: "passed", value: deltaEvidenceFillForm.summary.fields },
    { id: "delta-evidence-fill-form-empty", status: "passed", value: deltaEvidenceFillForm.summary.completedFields },
    { id: "delta-evidence-fill-form-not-auto-promoted", status: "passed", value: deltaEvidenceFillForm.summary.promotionReady },
    { id: "delta-evidence-filled-draft-safe", status: "passed", value: deltaEvidenceFilledDraft.summary.canModifyReliableDps },
    { id: "delta-evidence-filled-draft-empty-real", status: "passed", value: deltaEvidenceFilledDraft.summary.completedFields },
    { id: "delta-evidence-filled-draft-blocked-real", status: "passed", value: deltaEvidenceFilledDraft.summary.readyForDraftAudit },
    { id: "delta-evidence-filled-draft-no-write", status: "passed", value: deltaEvidenceFilledDraft.summary.writesRealIntake },
    { id: "delta-evidence-filled-draft-not-auto-promoted", status: "passed", value: deltaEvidenceFilledDraft.summary.promotionReady },
    { id: "delta-evidence-filled-draft-audit-safe", status: "passed", value: deltaEvidenceFilledDraftAudit.summary.canModifyReliableDps },
    { id: "delta-evidence-filled-draft-audit-blocked-real", status: "passed", value: deltaEvidenceFilledDraftAudit.summary.readyForPreview },
    { id: "delta-evidence-filled-draft-audit-no-write", status: "passed", value: deltaEvidenceFilledDraftAudit.summary.writesRealIntake },
    { id: "delta-evidence-filled-draft-audit-not-accepted", status: "passed", value: deltaEvidenceFilledDraftAudit.summary.acceptedForBridge },
    { id: "delta-evidence-filled-draft-audit-not-auto-promoted", status: "passed", value: deltaEvidenceFilledDraftAudit.summary.promotionReady },
    { id: "delta-evidence-filled-draft-preview-safe", status: "passed", value: deltaEvidenceFilledDraftIntakePreview.summary.canModifyReliableDps },
    { id: "delta-evidence-filled-draft-preview-blocked-real", status: "passed", value: deltaEvidenceFilledDraftIntakePreview.summary.previewMergeReady },
    { id: "delta-evidence-filled-draft-preview-no-write", status: "passed", value: deltaEvidenceFilledDraftIntakePreview.summary.writesRealIntake },
    { id: "delta-evidence-filled-draft-preview-not-accepted", status: "passed", value: deltaEvidenceFilledDraftIntakePreview.summary.acceptedForBridge },
    { id: "delta-evidence-filled-draft-preview-not-auto-promoted", status: "passed", value: deltaEvidenceFilledDraftIntakePreview.summary.promotionReady },
    { id: "delta-evidence-intake-copy-gate-safe", status: "passed", value: deltaEvidenceIntakeCopyGate.summary.canModifyReliableDps },
    { id: "delta-evidence-intake-copy-gate-blocked-real", status: "passed", value: deltaEvidenceIntakeCopyGate.summary.readyForManualCopy },
    { id: "delta-evidence-intake-copy-gate-no-write", status: "passed", value: deltaEvidenceIntakeCopyGate.summary.writesRealIntake },
    { id: "delta-evidence-intake-copy-gate-not-accepted", status: "passed", value: deltaEvidenceIntakeCopyGate.summary.acceptedForBridge },
    { id: "delta-evidence-intake-copy-gate-not-auto-promoted", status: "passed", value: deltaEvidenceIntakeCopyGate.summary.promotionReady },
    { id: "delta-evidence-post-copy-intake-safe", status: "passed", value: deltaEvidencePostCopyIntake.summary.canModifyReliableDps },
    { id: "delta-evidence-post-copy-intake-blocked-real", status: "passed", value: deltaEvidencePostCopyIntake.summary.readyForManualReview },
    { id: "delta-evidence-post-copy-intake-no-write", status: "passed", value: deltaEvidencePostCopyIntake.summary.writesRealIntake },
    { id: "delta-evidence-post-copy-intake-not-accepted", status: "passed", value: deltaEvidencePostCopyIntake.summary.acceptedForBridge },
    { id: "delta-evidence-post-copy-intake-not-auto-promoted", status: "passed", value: deltaEvidencePostCopyIntake.summary.promotionReady },
    { id: "delta-evidence-manual-review-gate-safe", status: "passed", value: deltaEvidenceManualReviewGate.summary.canModifyReliableDps },
    { id: "delta-evidence-manual-review-gate-blocked-real", status: "passed", value: deltaEvidenceManualReviewGate.summary.readyForReviewerDecision },
    { id: "delta-evidence-manual-review-gate-no-write", status: "passed", value: deltaEvidenceManualReviewGate.summary.writesRealIntake },
    { id: "delta-evidence-manual-review-gate-not-accepted", status: "passed", value: deltaEvidenceManualReviewGate.summary.acceptedForBridge },
    { id: "delta-evidence-manual-review-gate-not-auto-promoted", status: "passed", value: deltaEvidenceManualReviewGate.summary.promotionReady },
    { id: "delta-evidence-review-decision-package-safe", status: "passed", value: deltaEvidenceReviewDecisionPackage.summary.canModifyReliableDps },
    { id: "delta-evidence-review-decision-package-blocked-real", status: "passed", value: deltaEvidenceReviewDecisionPackage.summary.readyForDecisionInput },
    { id: "delta-evidence-review-decision-package-no-write", status: "passed", value: deltaEvidenceReviewDecisionPackage.summary.writesRealIntake },
    { id: "delta-evidence-review-decision-package-not-accepted", status: "passed", value: deltaEvidenceReviewDecisionPackage.summary.acceptedForBridge },
    { id: "delta-evidence-review-decision-package-not-auto-promoted", status: "passed", value: deltaEvidenceReviewDecisionPackage.summary.promotionReady },
    { id: "delta-evidence-review-decision-audit-safe", status: "passed", value: deltaEvidenceReviewDecisionAudit.summary.canModifyReliableDps },
    { id: "delta-evidence-review-decision-audit-blocked-real", status: "passed", value: deltaEvidenceReviewDecisionAudit.summary.readyForPromotionAudit },
    { id: "delta-evidence-review-decision-audit-no-write", status: "passed", value: deltaEvidenceReviewDecisionAudit.summary.writesRealIntake },
    { id: "delta-evidence-review-decision-audit-not-accepted", status: "passed", value: deltaEvidenceReviewDecisionAudit.summary.acceptedForBridge },
    { id: "delta-evidence-review-decision-audit-not-auto-promoted", status: "passed", value: deltaEvidenceReviewDecisionAudit.summary.promotionReady },
    { id: "delta-evidence-promotion-audit-safe", status: "passed", value: deltaEvidencePromotionAudit.summary.canModifyReliableDps },
    { id: "delta-evidence-promotion-audit-blocked-real", status: "passed", value: deltaEvidencePromotionAudit.summary.readyForPromotionImplementation },
    { id: "delta-evidence-promotion-audit-no-write", status: "passed", value: deltaEvidencePromotionAudit.summary.writesRealIntake },
    { id: "delta-evidence-promotion-audit-not-accepted", status: "passed", value: deltaEvidencePromotionAudit.summary.acceptedForBridge },
    { id: "delta-evidence-promotion-audit-not-auto-promoted", status: "passed", value: deltaEvidencePromotionAudit.summary.promotionReady },
    { id: "delta-promotion-implementation-dry-run-safe", status: "passed", value: deltaPromotionImplementationDryRun.summary.canModifyReliableDps },
    { id: "delta-promotion-implementation-dry-run-blocked-real", status: "passed", value: deltaPromotionImplementationDryRun.summary.patchPreviewReady },
    { id: "delta-promotion-implementation-dry-run-no-write", status: "passed", value: deltaPromotionImplementationDryRun.summary.writesTargetDataset },
    { id: "delta-promotion-implementation-dry-run-not-accepted", status: "passed", value: deltaPromotionImplementationDryRun.summary.acceptedForBridge },
    { id: "delta-promotion-implementation-dry-run-not-auto-promoted", status: "passed", value: deltaPromotionImplementationDryRun.summary.promotionReady },
    { id: "delta-promotion-application-gate-safe", status: "passed", value: deltaPromotionApplicationGate.summary.canModifyReliableDps },
    { id: "delta-promotion-application-gate-blocked-real", status: "passed", value: deltaPromotionApplicationGate.summary.manualApplyAllowed },
    { id: "delta-promotion-application-gate-no-write", status: "passed", value: deltaPromotionApplicationGate.summary.writesTargetDataset },
    { id: "delta-promotion-application-gate-not-accepted", status: "passed", value: deltaPromotionApplicationGate.summary.acceptedForBridge },
    { id: "delta-promotion-application-gate-not-auto-promoted", status: "passed", value: deltaPromotionApplicationGate.summary.promotionReady },
    { id: "delta-promotion-apply-plan-safe", status: "passed", value: deltaPromotionApplyPlan.summary.canModifyReliableDps },
    { id: "delta-promotion-apply-plan-blocked-real", status: "passed", value: deltaPromotionApplyPlan.summary.applyPlanReady },
    { id: "delta-promotion-apply-plan-no-write", status: "passed", value: deltaPromotionApplyPlan.summary.writesTargetDataset },
    { id: "delta-promotion-apply-plan-not-accepted", status: "passed", value: deltaPromotionApplyPlan.summary.acceptedForBridge },
    { id: "delta-promotion-apply-plan-not-auto-promoted", status: "passed", value: deltaPromotionApplyPlan.summary.promotionReady },
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
assertInvariant(optimizerPlan.externalEvidenceSubmissionPack?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission pack");
assertInvariant(optimizerPlan.externalEvidenceSubmissionGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission gate");
assertInvariant(optimizerPlan.externalEvidenceSubmissionIntakePreview?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission intake preview");
assertInvariant(optimizerPlan.externalEvidenceSubmissionPostCopyIntake?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission post-copy intake");
assertInvariant(optimizerPlan.externalEvidenceSubmissionManualReviewGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission manual review gate");
assertInvariant(optimizerPlan.externalEvidenceSubmissionReviewDecisionPackage?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission review decision package");
assertInvariant(optimizerPlan.externalEvidenceSubmissionReviewDecisionAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission review decision audit");
assertInvariant(optimizerPlan.externalEvidenceSubmissionPromotionAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission promotion audit");
assertInvariant(optimizerPlan.externalEvidenceSubmissionImplementationDryRun?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission implementation dry-run");
assertInvariant(optimizerPlan.externalEvidenceSubmissionApplicationGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission application gate");
assertInvariant(optimizerPlan.externalEvidenceSubmissionApplyPlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe external evidence submission apply plan");
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
assertInvariant(optimizerPlan.deltaNextActionDecision?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta next action decision");
assertInvariant(optimizerPlan.sf32LocalExhaustionConclusion?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_32 local exhaustion conclusion");
assertInvariant(optimizerPlan.sf32OwnerSourcePacket?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_32 owner source packet");
assertInvariant(optimizerPlan.sf32OwnerSourceHuntPlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe SF_32 owner source hunt plan");
assertInvariant(optimizerPlan.diabloToolsAttributeSourceAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe DiabloTools attribute audit");
assertInvariant(optimizerPlan.selector949ReconciliationAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe selector 949 reconciliation audit");
assertInvariant(optimizerPlan.selector949WindowReparseAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe selector 949 window reparse audit");
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
assertInvariant(optimizerPlan.deltaEvidenceFillForm?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence fill form");
assertInvariant(optimizerPlan.deltaEvidenceFilledDraft?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence filled draft");
assertInvariant(optimizerPlan.deltaEvidenceFilledDraftAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence filled draft audit");
assertInvariant(optimizerPlan.deltaEvidenceFilledDraftIntakePreview?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence filled draft intake preview");
assertInvariant(optimizerPlan.deltaEvidenceIntakeCopyGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence intake copy gate");
assertInvariant(optimizerPlan.deltaEvidencePostCopyIntake?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence post-copy intake");
assertInvariant(optimizerPlan.deltaEvidenceManualReviewGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence manual review gate");
assertInvariant(optimizerPlan.deltaEvidenceReviewDecisionPackage?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence review decision package");
assertInvariant(optimizerPlan.deltaEvidenceReviewDecisionAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence review decision audit");
assertInvariant(optimizerPlan.deltaEvidencePromotionAudit?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta evidence promotion audit");
assertInvariant(optimizerPlan.deltaPromotionImplementationDryRun?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta promotion implementation dry-run");
assertInvariant(optimizerPlan.deltaPromotionApplicationGate?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta promotion application gate");
assertInvariant(optimizerPlan.deltaPromotionApplyPlan?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe delta promotion apply plan");
assertInvariant(optimizerPlan.userWhatIfContract?.summary?.canModifyReliableDps === false, "optimizer plan must embed safe user what-if contract");
assertInvariant(optimizerPlan.summary.reliableStrictBuilds === 0, "no reliable strict build should exist yet");

console.log(JSON.stringify({ outFile, summary }, null, 2));
