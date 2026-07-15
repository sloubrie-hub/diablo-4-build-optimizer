const DATASET_URL = "../outputs/diablo4-optimizer-dataset/optimizer-dataset.json";
const TARGET_DATASET_URL = "../outputs/diablo4-target-dataset/target-dataset.json";
const TARGET_VALIDATION_URL = "../outputs/diablo4-target-dataset-validation/target-dataset-validation.json";
const BLOCKER_AUDIT_URL = "../outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json";
const TARGET_OPTIMIZER_PLAN_URL = "../outputs/diablo4-target-optimizer-plan/target-optimizer-plan.json";
const DELTA_PROMOTION_CONCLUSION_URL = "../outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json";
const ASPECT_SLOT_NEXT_SOURCE_PLAN_URL = "../outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json";
const BONUS_SELECTOR_SOURCE_PROOF_URL = "../outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json";
const ADDITIVE_BUCKET_SOURCE_CONCLUSION_URL = "../outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json";
const NEXT_EVIDENCE_ROADMAP_URL = "../outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json";
const EXTERNAL_DELTA_EVIDENCE_PLAN_URL = "../outputs/diablo4-external-delta-evidence-plan/external-delta-evidence-plan.json";
const EXTERNAL_DELTA_EVIDENCE_WORKORDER_URL = "../outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const EXTERNAL_EVIDENCE_SUBMISSION_PACK_URL = "../outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json";
const EXTERNAL_EVIDENCE_SUBMISSION_GATE_URL = "../outputs/diablo4-external-evidence-submission-gate/external-evidence-submission-gate.json";
const EXTERNAL_EVIDENCE_SUBMISSION_INTAKE_PREVIEW_URL = "../outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-submission-intake-preview.json";
const EXTERNAL_EVIDENCE_SUBMISSION_POST_COPY_INTAKE_URL = "../outputs/diablo4-external-evidence-submission-post-copy-intake/external-evidence-submission-post-copy-intake.json";
const EXTERNAL_EVIDENCE_SUBMISSION_MANUAL_REVIEW_GATE_URL = "../outputs/diablo4-external-evidence-submission-manual-review-gate/external-evidence-submission-manual-review-gate.json";
const EXTERNAL_EVIDENCE_SUBMISSION_REVIEW_DECISION_PACKAGE_URL = "../outputs/diablo4-external-evidence-submission-review-decision-package/external-evidence-submission-review-decision-package.json";
const EXTERNAL_EVIDENCE_SUBMISSION_REVIEW_DECISION_AUDIT_URL = "../outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json";
const EXTERNAL_EVIDENCE_SUBMISSION_PROMOTION_AUDIT_URL = "../outputs/diablo4-external-evidence-submission-promotion-audit/external-evidence-submission-promotion-audit.json";
const EXTERNAL_EVIDENCE_SUBMISSION_IMPLEMENTATION_DRY_RUN_URL = "../outputs/diablo4-external-evidence-submission-implementation-dry-run/external-evidence-submission-implementation-dry-run.json";
const EXTERNAL_EVIDENCE_SUBMISSION_APPLICATION_GATE_URL = "../outputs/diablo4-external-evidence-submission-application-gate/external-evidence-submission-application-gate.json";
const EXTERNAL_EVIDENCE_SUBMISSION_APPLY_PLAN_URL = "../outputs/diablo4-external-evidence-submission-apply-plan/external-evidence-submission-apply-plan.json";
const NEW_BINARY_FAMILY_PLAN_URL = "../outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json";
const NEW_BINARY_FAMILY_DELTA_PARENT_AUDIT_URL = "../outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json";
const DELTA_PARENT_CONSUMER_CORPUS_SCAN_URL = "../outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json";
const DELTA_PARENT_EXPANDED_DECODE_PLAN_URL = "../outputs/diablo4-delta-parent-expanded-decode-plan/delta-parent-expanded-decode-plan.json";
const DELTA_PARENT_UPGRADE_STRUCTURE_AUDIT_URL = "../outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json";
const DELTA_PARENT_OFFSET_REFERENCE_GRAPH_URL = "../outputs/diablo4-delta-parent-offset-reference-graph/delta-parent-offset-reference-graph.json";
const DELTA_PARENT_SYSTEMS_TUNING_CONTEXTS_URL = "../outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json";
const DELTA_PARENT_UNDECODED_SOURCE_PLAN_URL = "../outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json";
const DELTA_PARENT_NONTEXT_TABLE_SIGNALS_URL = "../outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json";
const DELTA_LOCAL_EXHAUSTION_CONCLUSION_URL = "../outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json";
const DELTA_NEXT_ACTION_DECISION_URL = "../outputs/diablo4-delta-next-action-decision/delta-next-action-decision.json";
const SF32_LOCAL_EXHAUSTION_CONCLUSION_URL = "../outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json";
const SF32_OWNER_SOURCE_PACKET_URL = "../outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json";
const SF32_OWNER_SOURCE_HUNT_PLAN_URL = "../outputs/diablo4-sf32-owner-source-hunt-plan/sf32-owner-source-hunt-plan.json";
const DIABLO_TOOLS_ATTRIBUTE_SOURCE_AUDIT_URL = "../outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json";
const SELECTOR_949_RECONCILIATION_AUDIT_URL = "../outputs/diablo4-selector-949-reconciliation-audit/selector-949-reconciliation-audit.json";
const SELECTOR_949_WINDOW_REPARSE_AUDIT_URL = "../outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json";
const SF32_OWNER_PARSER_BRIDGE_URL = "../outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json";
const SF33_TRIGGER_SOURCE_PACKET_URL = "../outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json";
const SF33_TRIGGER_PARSER_BRIDGE_URL = "../outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json";
const UPTIME_LOCAL_EXHAUSTION_CONCLUSION_URL = "../outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json";
const UPTIME_SOURCE_PACKET_URL = "../outputs/diablo4-uptime-source-packet/uptime-source-packet.json";
const UPTIME_PARSER_BRIDGE_URL = "../outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json";
const DELTA_BRIDGE_READINESS_URL = "../outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json";
const DELTA_PROMOTION_REVIEW_URL = "../outputs/diablo4-delta-promotion-review/delta-promotion-review.json";
const DELTA_EVIDENCE_INTAKE_PACKAGE_URL = "../outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json";
const DELTA_EVIDENCE_DRAFT_URL = "../outputs/diablo4-delta-evidence-draft/delta-evidence-draft.json";
const DELTA_EVIDENCE_DRAFT_AUDIT_URL = "../outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json";
const DELTA_EVIDENCE_INTAKE_UPDATE_PREVIEW_URL = "../outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json";
const DELTA_MANUAL_PROMOTION_GATE_URL = "../outputs/diablo4-delta-manual-promotion-gate/delta-manual-promotion-gate.json";
const DELTA_HUMAN_ACTION_PLAN_URL = "../outputs/diablo4-delta-human-action-plan/delta-human-action-plan.json";
const DELTA_EVIDENCE_FILL_FORM_URL = "../outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json";
const DELTA_EVIDENCE_FILLED_DRAFT_URL = "../outputs/diablo4-delta-evidence-filled-draft/delta-evidence-filled-draft.json";
const DELTA_EVIDENCE_FILLED_DRAFT_AUDIT_URL = "../outputs/diablo4-delta-evidence-filled-draft-audit/delta-evidence-filled-draft-audit.json";
const DELTA_EVIDENCE_FILLED_DRAFT_INTAKE_PREVIEW_URL = "../outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json";
const DELTA_EVIDENCE_INTAKE_COPY_GATE_URL = "../outputs/diablo4-delta-evidence-intake-copy-gate/delta-evidence-intake-copy-gate.json";
const DELTA_EVIDENCE_POST_COPY_INTAKE_URL = "../outputs/diablo4-delta-evidence-post-copy-intake/delta-evidence-post-copy-intake.json";
const DELTA_EVIDENCE_MANUAL_REVIEW_GATE_URL = "../outputs/diablo4-delta-evidence-manual-review-gate/delta-evidence-manual-review-gate.json";
const DELTA_EVIDENCE_REVIEW_DECISION_PACKAGE_URL = "../outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.json";
const DELTA_EVIDENCE_REVIEW_DECISION_AUDIT_URL = "../outputs/diablo4-delta-evidence-review-decision-audit/delta-evidence-review-decision-audit.json";
const DELTA_EVIDENCE_PROMOTION_AUDIT_URL = "../outputs/diablo4-delta-evidence-promotion-audit/delta-evidence-promotion-audit.json";
const DELTA_PROMOTION_IMPLEMENTATION_DRY_RUN_URL = "../outputs/diablo4-delta-promotion-implementation-dry-run/delta-promotion-implementation-dry-run.json";
const DELTA_PROMOTION_APPLICATION_GATE_URL = "../outputs/diablo4-delta-promotion-application-gate/delta-promotion-application-gate.json";
const DELTA_PROMOTION_APPLY_PLAN_URL = "../outputs/diablo4-delta-promotion-apply-plan/delta-promotion-apply-plan.json";
const USER_WHATIF_SCENARIOS_URL = "../outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json";
const USER_WHATIF_CONTRACT_URL = "../outputs/diablo4-user-whatif-contract/user-whatif-contract.json";
const RELIABLE_DPS_GATES_URL = "../outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const STORAGE_KEY = "d4-build-optimizer-state-v1";

const state = {
  dataset: null,
  targetDataset: null,
  targetValidation: null,
  blockerAudit: null,
  targetOptimizerPlan: null,
  deltaPromotionConclusion: null,
  aspectSlotNextSourcePlan: null,
  bonusSelectorSourceProof: null,
  additiveBucketSourceConclusion: null,
  nextEvidenceRoadmap: null,
  externalDeltaEvidencePlan: null,
  externalDeltaEvidenceWorkorder: null,
  externalEvidenceSubmissionPack: null,
  externalEvidenceSubmissionGate: null,
  externalEvidenceSubmissionIntakePreview: null,
  externalEvidenceSubmissionPostCopyIntake: null,
  externalEvidenceSubmissionManualReviewGate: null,
  externalEvidenceSubmissionReviewDecisionPackage: null,
  externalEvidenceSubmissionReviewDecisionAudit: null,
  externalEvidenceSubmissionPromotionAudit: null,
  externalEvidenceSubmissionImplementationDryRun: null,
  externalEvidenceSubmissionApplicationGate: null,
  externalEvidenceSubmissionApplyPlan: null,
  newBinaryFamilyPlan: null,
  newBinaryFamilyDeltaParentAudit: null,
  deltaParentConsumerCorpusScan: null,
  deltaParentExpandedDecodePlan: null,
  deltaParentUpgradeStructureAudit: null,
  deltaParentOffsetReferenceGraph: null,
  deltaParentSystemsTuningContexts: null,
  deltaParentUndecodedSourcePlan: null,
  deltaParentNontextTableSignals: null,
  deltaLocalExhaustionConclusion: null,
  deltaNextActionDecision: null,
  sf32LocalExhaustionConclusion: null,
  sf32OwnerSourcePacket: null,
  sf32OwnerSourceHuntPlan: null,
  diabloToolsAttributeSourceAudit: null,
  selector949ReconciliationAudit: null,
  selector949WindowReparseAudit: null,
  sf32OwnerParserBridge: null,
  sf33TriggerSourcePacket: null,
  sf33TriggerParserBridge: null,
  uptimeLocalExhaustionConclusion: null,
  uptimeSourcePacket: null,
  uptimeParserBridge: null,
  deltaBridgeReadiness: null,
  deltaPromotionReview: null,
  deltaEvidenceIntakePackage: null,
  deltaEvidenceDraft: null,
  deltaEvidenceDraftAudit: null,
  deltaEvidenceIntakeUpdatePreview: null,
  deltaManualPromotionGate: null,
  deltaHumanActionPlan: null,
  deltaEvidenceFillForm: null,
  deltaEvidenceFilledDraft: null,
  deltaEvidenceFilledDraftAudit: null,
  deltaEvidenceFilledDraftIntakePreview: null,
  deltaEvidenceIntakeCopyGate: null,
  deltaEvidencePostCopyIntake: null,
  deltaEvidenceManualReviewGate: null,
  deltaEvidenceReviewDecisionPackage: null,
  deltaEvidenceReviewDecisionAudit: null,
  deltaEvidencePromotionAudit: null,
  deltaPromotionImplementationDryRun: null,
  deltaPromotionApplicationGate: null,
  deltaPromotionApplyPlan: null,
  userWhatIfScenarios: null,
  userWhatIfContract: null,
  reliableDpsGates: null,
  userScenario: {
    sf33Active: false,
    uptime: 1,
  },
  selectedAssetId: null,
  filter: "all",
  includeCandidates: false,
  optimizerMode: "effective",
  optimizerTag: "all",
  optimizerSearch: "",
  targetEntityType: "all",
  targetEntityClass: "all",
  targetEntitySearch: "",
  selectedTargetEntityId: null,
  buildAssetIds: [],
};

const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value || 0));

const formatPercent = (value) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(Number(value || 0))}%`;

const formatMultiplier = (value) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value || 0));

const safePercent = (delta, base) => {
  const numericDelta = Number(delta);
  const numericBase = Number(base);
  if (!Number.isFinite(numericDelta) || !Number.isFinite(numericBase) || numericBase === 0) return 0;
  return (numericDelta / numericBase) * 100;
};

const byId = (id) => document.getElementById(id);

async function boot() {
  try {
    const response = await fetch(DATASET_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.dataset = await response.json();
    await loadTargetDataset();
    await loadBlockerAudit();
    await loadTargetOptimizerPlan();
    await loadDeltaPromotionConclusion();
    await loadAspectSlotNextSourcePlan();
    await loadBonusSelectorSourceProof();
    await loadAdditiveBucketSourceConclusion();
    await loadNextEvidenceRoadmap();
    await loadExternalDeltaEvidencePlan();
    await loadExternalDeltaEvidenceWorkorder();
    await loadExternalEvidenceSubmissionPack();
    await loadExternalEvidenceSubmissionGate();
    await loadExternalEvidenceSubmissionIntakePreview();
    await loadExternalEvidenceSubmissionPostCopyIntake();
    await loadExternalEvidenceSubmissionManualReviewGate();
    await loadExternalEvidenceSubmissionReviewDecisionPackage();
    await loadExternalEvidenceSubmissionReviewDecisionAudit();
    await loadExternalEvidenceSubmissionPromotionAudit();
    await loadExternalEvidenceSubmissionImplementationDryRun();
    await loadExternalEvidenceSubmissionApplicationGate();
    await loadExternalEvidenceSubmissionApplyPlan();
    await loadNewBinaryFamilyPlan();
    await loadNewBinaryFamilyDeltaParentAudit();
    await loadDeltaParentConsumerCorpusScan();
    await loadDeltaParentExpandedDecodePlan();
    await loadDeltaParentUpgradeStructureAudit();
    await loadDeltaParentOffsetReferenceGraph();
    await loadDeltaParentSystemsTuningContexts();
    await loadDeltaParentUndecodedSourcePlan();
    await loadDeltaParentNontextTableSignals();
    await loadDeltaLocalExhaustionConclusion();
    await loadDeltaNextActionDecision();
    await loadSf32LocalExhaustionConclusion();
    await loadSf32OwnerSourcePacket();
    await loadSf32OwnerSourceHuntPlan();
    await loadDiabloToolsAttributeSourceAudit();
    await loadSelector949ReconciliationAudit();
    await loadSelector949WindowReparseAudit();
    await loadSf32OwnerParserBridge();
    await loadSf33TriggerSourcePacket();
    await loadSf33TriggerParserBridge();
    await loadUptimeLocalExhaustionConclusion();
    await loadUptimeSourcePacket();
    await loadUptimeParserBridge();
    await loadDeltaBridgeReadiness();
    await loadDeltaPromotionReview();
    await loadDeltaEvidenceIntakePackage();
    await loadDeltaEvidenceDraft();
    await loadDeltaEvidenceDraftAudit();
    await loadDeltaEvidenceIntakeUpdatePreview();
    await loadDeltaManualPromotionGate();
    await loadDeltaHumanActionPlan();
    await loadDeltaEvidenceFillForm();
    await loadDeltaEvidenceFilledDraft();
    await loadDeltaEvidenceFilledDraftAudit();
    await loadDeltaEvidenceFilledDraftIntakePreview();
    await loadDeltaEvidenceIntakeCopyGate();
    await loadDeltaEvidencePostCopyIntake();
    await loadDeltaEvidenceManualReviewGate();
    await loadDeltaEvidenceReviewDecisionPackage();
    await loadDeltaEvidenceReviewDecisionAudit();
    await loadDeltaEvidencePromotionAudit();
    await loadDeltaPromotionImplementationDryRun();
    await loadDeltaPromotionApplicationGate();
    await loadDeltaPromotionApplyPlan();
    await loadUserWhatIfScenarios();
    await loadUserWhatIfContract();
    await loadReliableDpsGates();
    restoreState();
    state.selectedAssetId = selectRestoredAsset(state.dataset);
    byId("datasetStatus").textContent = "Dataset charge";
    renderOptimizerTagOptions();
    renderTargetFilterOptions();
    normalizeRestoredState();
    syncControls();
    byId("assetFilter").addEventListener("change", (event) => {
      state.filter = event.target.value;
      render();
    });
    byId("candidateToggle").addEventListener("change", (event) => {
      state.includeCandidates = event.target.checked;
      render();
    });
    byId("optimizerMode").addEventListener("change", (event) => {
      state.optimizerMode = event.target.value;
      render();
    });
    byId("optimizerTag").addEventListener("change", (event) => {
      state.optimizerTag = event.target.value;
      render();
    });
    byId("optimizerSearch").addEventListener("input", (event) => {
      state.optimizerSearch = event.target.value.trim().toLowerCase();
      render();
    });
    byId("targetEntityType").addEventListener("change", (event) => {
      state.targetEntityType = event.target.value;
      render();
    });
    byId("targetEntityClass").addEventListener("change", (event) => {
      state.targetEntityClass = event.target.value;
      render();
    });
    byId("targetEntitySearch").addEventListener("input", (event) => {
      state.targetEntitySearch = event.target.value.trim().toLowerCase();
      render();
    });
    byId("clearBuild").addEventListener("click", () => {
      state.buildAssetIds = [];
      setBuildExportStatus("");
      render();
    });
    byId("userScenarioSf33").addEventListener("change", (event) => {
      state.userScenario.sf33Active = event.target.checked;
      if (state.userScenario.sf33Active) state.includeCandidates = true;
      render();
    });
    byId("userScenarioUptime").addEventListener("input", (event) => {
      state.userScenario.uptime = normalizeUptimeValue(Number(event.target.value) / 100);
      if (state.userScenario.uptime > 0 && state.userScenario.sf33Active) state.includeCandidates = true;
      render();
    });
    byId("exportBuild").addEventListener("click", exportBuildJson);
    byId("importBuild").addEventListener("click", importBuildJson);
    document.addEventListener("click", handleGlobalClick);
    render();
  } catch (error) {
    byId("datasetStatus").textContent = "Dataset indisponible";
    byId("assetDetail").innerHTML = `<div class="empty-state">Impossible de charger ${DATASET_URL}</div>`;
  }
}

function selectInitialAsset(dataset) {
  const withCandidate = dataset.assets.find((asset) => asset.candidates.length);
  return (withCandidate ?? dataset.assets[0])?.assetId ?? null;
}

function selectRestoredAsset(dataset) {
  const exists = dataset.assets.some((asset) => String(asset.assetId) === String(state.selectedAssetId));
  return exists ? state.selectedAssetId : selectInitialAsset(dataset);
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.selectedAssetId = saved.selectedAssetId ?? state.selectedAssetId;
    state.filter = saved.filter ?? state.filter;
    state.includeCandidates = Boolean(saved.includeCandidates);
    state.optimizerMode = saved.optimizerMode ?? state.optimizerMode;
    state.optimizerTag = saved.optimizerTag ?? state.optimizerTag;
    state.optimizerSearch = saved.optimizerSearch ?? state.optimizerSearch;
    state.targetEntityType = saved.targetEntityType ?? state.targetEntityType;
    state.targetEntityClass = saved.targetEntityClass ?? state.targetEntityClass;
    state.targetEntitySearch = saved.targetEntitySearch ?? state.targetEntitySearch;
    state.selectedTargetEntityId = saved.selectedTargetEntityId ?? state.selectedTargetEntityId;
    state.buildAssetIds = Array.isArray(saved.buildAssetIds) ? saved.buildAssetIds.map(Number) : [];
    state.userScenario = {
      sf33Active: Boolean(saved.userScenario?.sf33Active),
      uptime: normalizeUptimeValue(saved.userScenario?.uptime ?? 1),
    };
  } catch {
    state.buildAssetIds = [];
  }
}

function persistState() {
  const snapshot = {
    selectedAssetId: state.selectedAssetId,
    filter: state.filter,
    includeCandidates: state.includeCandidates,
    optimizerMode: state.optimizerMode,
    optimizerTag: state.optimizerTag,
    optimizerSearch: state.optimizerSearch,
    targetEntityType: state.targetEntityType,
    targetEntityClass: state.targetEntityClass,
    targetEntitySearch: state.targetEntitySearch,
    selectedTargetEntityId: state.selectedTargetEntityId,
    buildAssetIds: state.buildAssetIds,
    userScenario: state.userScenario,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Local storage can be disabled in some browser contexts.
  }
}

function normalizeRestoredState() {
  const knownAssetIds = new Set(state.dataset.assets.map((asset) => Number(asset.assetId)));
  const knownTags = new Set(["all", ...state.dataset.assets.flatMap((asset) => asset.tags || [])]);
  const knownModes = new Set(["effective", "strict", "candidate"]);
  const knownFilters = new Set(["all", "strict", "candidate"]);
  const knownTargetTypes = new Set(["all", ...targetAllEntities().map((entity) => entity.collection)]);
  const knownTargetClasses = new Set(["all", ...targetAllEntities().map((entity) => entity.class ?? "generic")]);

  state.buildAssetIds = state.buildAssetIds.filter((assetId) => knownAssetIds.has(Number(assetId)));
  if (!knownAssetIds.has(Number(state.selectedAssetId))) state.selectedAssetId = selectInitialAsset(state.dataset);
  if (!knownTags.has(state.optimizerTag)) state.optimizerTag = "all";
  if (!knownModes.has(state.optimizerMode)) state.optimizerMode = "effective";
  if (!knownFilters.has(state.filter)) state.filter = "all";
  if (!knownTargetTypes.has(state.targetEntityType)) state.targetEntityType = "all";
  if (!knownTargetClasses.has(state.targetEntityClass)) state.targetEntityClass = "all";
  if (state.selectedTargetEntityId && !targetAllEntities().some((entity) => entity.id === state.selectedTargetEntityId)) {
    state.selectedTargetEntityId = null;
  }
}

function syncControls() {
  byId("assetFilter").value = state.filter;
  byId("candidateToggle").checked = state.includeCandidates;
  byId("optimizerMode").value = state.optimizerMode;
  byId("optimizerTag").value = state.optimizerTag;
  byId("optimizerSearch").value = state.optimizerSearch;
  byId("targetEntityType").value = state.targetEntityType;
  byId("targetEntityClass").value = state.targetEntityClass;
  byId("targetEntitySearch").value = state.targetEntitySearch;
  byId("userScenarioSf33").checked = state.userScenario.sf33Active;
  byId("userScenarioUptime").value = String(Math.round(normalizeUptimeValue(state.userScenario.uptime) * 100));
  byId("userScenarioUptimeValue").textContent = formatPercent(normalizeUptimeValue(state.userScenario.uptime) * 100);
}

function render() {
  persistState();
  renderSummary();
  renderTargetDatasetPanel();
  renderOptimizerRanking();
  renderTargetOptimizerPlan();
  renderBuildSelection();
  renderBlockerAuditPanel();
  renderAssetList();
  renderDetail();
}

async function loadTargetDataset() {
  const [targetDataset, targetValidation] = await Promise.all([
    fetchOptionalJson(TARGET_DATASET_URL),
    fetchOptionalJson(TARGET_VALIDATION_URL),
  ]);
  state.targetDataset = targetDataset;
  state.targetValidation = targetValidation;
  byId("targetDatasetStatus").textContent = targetDataset ? "Schema cible charge" : "Schema cible absent";
}

async function loadBlockerAudit() {
  state.blockerAudit = await fetchOptionalJson(BLOCKER_AUDIT_URL);
  byId("blockerAuditStatus").textContent = state.blockerAudit ? "Diagnostic charge" : "Diagnostic absent";
}

async function loadTargetOptimizerPlan() {
  state.targetOptimizerPlan = await fetchOptionalJson(TARGET_OPTIMIZER_PLAN_URL);
  byId("targetOptimizerStatus").textContent = state.targetOptimizerPlan ? "Plan charge" : "Plan absent";
}

async function loadDeltaPromotionConclusion() {
  state.deltaPromotionConclusion = await fetchOptionalJson(DELTA_PROMOTION_CONCLUSION_URL);
}

async function loadAspectSlotNextSourcePlan() {
  state.aspectSlotNextSourcePlan = await fetchOptionalJson(ASPECT_SLOT_NEXT_SOURCE_PLAN_URL);
}

async function loadBonusSelectorSourceProof() {
  state.bonusSelectorSourceProof = await fetchOptionalJson(BONUS_SELECTOR_SOURCE_PROOF_URL);
}

async function loadAdditiveBucketSourceConclusion() {
  state.additiveBucketSourceConclusion = await fetchOptionalJson(ADDITIVE_BUCKET_SOURCE_CONCLUSION_URL);
}

async function loadNextEvidenceRoadmap() {
  state.nextEvidenceRoadmap = await fetchOptionalJson(NEXT_EVIDENCE_ROADMAP_URL);
}

async function loadExternalDeltaEvidencePlan() {
  state.externalDeltaEvidencePlan = await fetchOptionalJson(EXTERNAL_DELTA_EVIDENCE_PLAN_URL);
}

async function loadExternalDeltaEvidenceWorkorder() {
  state.externalDeltaEvidenceWorkorder = await fetchOptionalJson(EXTERNAL_DELTA_EVIDENCE_WORKORDER_URL);
}

async function loadExternalEvidenceSubmissionPack() {
  state.externalEvidenceSubmissionPack = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_PACK_URL);
}

async function loadExternalEvidenceSubmissionGate() {
  state.externalEvidenceSubmissionGate = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_GATE_URL);
}

async function loadExternalEvidenceSubmissionIntakePreview() {
  state.externalEvidenceSubmissionIntakePreview = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_INTAKE_PREVIEW_URL);
}

async function loadExternalEvidenceSubmissionPostCopyIntake() {
  state.externalEvidenceSubmissionPostCopyIntake = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_POST_COPY_INTAKE_URL);
}

async function loadExternalEvidenceSubmissionManualReviewGate() {
  state.externalEvidenceSubmissionManualReviewGate = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_MANUAL_REVIEW_GATE_URL);
}

async function loadExternalEvidenceSubmissionReviewDecisionPackage() {
  state.externalEvidenceSubmissionReviewDecisionPackage = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_REVIEW_DECISION_PACKAGE_URL);
}

async function loadExternalEvidenceSubmissionReviewDecisionAudit() {
  state.externalEvidenceSubmissionReviewDecisionAudit = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_REVIEW_DECISION_AUDIT_URL);
}

async function loadExternalEvidenceSubmissionPromotionAudit() {
  state.externalEvidenceSubmissionPromotionAudit = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_PROMOTION_AUDIT_URL);
}

async function loadExternalEvidenceSubmissionImplementationDryRun() {
  state.externalEvidenceSubmissionImplementationDryRun = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_IMPLEMENTATION_DRY_RUN_URL);
}

async function loadExternalEvidenceSubmissionApplicationGate() {
  state.externalEvidenceSubmissionApplicationGate = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_APPLICATION_GATE_URL);
}

async function loadExternalEvidenceSubmissionApplyPlan() {
  state.externalEvidenceSubmissionApplyPlan = await fetchOptionalJson(EXTERNAL_EVIDENCE_SUBMISSION_APPLY_PLAN_URL);
}

async function loadNewBinaryFamilyPlan() {
  state.newBinaryFamilyPlan = await fetchOptionalJson(NEW_BINARY_FAMILY_PLAN_URL);
}

async function loadNewBinaryFamilyDeltaParentAudit() {
  state.newBinaryFamilyDeltaParentAudit = await fetchOptionalJson(NEW_BINARY_FAMILY_DELTA_PARENT_AUDIT_URL);
}

async function loadDeltaParentConsumerCorpusScan() {
  state.deltaParentConsumerCorpusScan = await fetchOptionalJson(DELTA_PARENT_CONSUMER_CORPUS_SCAN_URL);
}

async function loadDeltaParentExpandedDecodePlan() {
  state.deltaParentExpandedDecodePlan = await fetchOptionalJson(DELTA_PARENT_EXPANDED_DECODE_PLAN_URL);
}

async function loadDeltaParentUpgradeStructureAudit() {
  state.deltaParentUpgradeStructureAudit = await fetchOptionalJson(DELTA_PARENT_UPGRADE_STRUCTURE_AUDIT_URL);
}

async function loadDeltaParentOffsetReferenceGraph() {
  state.deltaParentOffsetReferenceGraph = await fetchOptionalJson(DELTA_PARENT_OFFSET_REFERENCE_GRAPH_URL);
}

async function loadDeltaParentSystemsTuningContexts() {
  state.deltaParentSystemsTuningContexts = await fetchOptionalJson(DELTA_PARENT_SYSTEMS_TUNING_CONTEXTS_URL);
}

async function loadDeltaParentUndecodedSourcePlan() {
  state.deltaParentUndecodedSourcePlan = await fetchOptionalJson(DELTA_PARENT_UNDECODED_SOURCE_PLAN_URL);
}

async function loadDeltaParentNontextTableSignals() {
  state.deltaParentNontextTableSignals = await fetchOptionalJson(DELTA_PARENT_NONTEXT_TABLE_SIGNALS_URL);
}

async function loadDeltaLocalExhaustionConclusion() {
  state.deltaLocalExhaustionConclusion = await fetchOptionalJson(DELTA_LOCAL_EXHAUSTION_CONCLUSION_URL);
}

async function loadDeltaNextActionDecision() {
  state.deltaNextActionDecision = await fetchOptionalJson(DELTA_NEXT_ACTION_DECISION_URL);
}

async function loadSf32LocalExhaustionConclusion() {
  state.sf32LocalExhaustionConclusion = await fetchOptionalJson(SF32_LOCAL_EXHAUSTION_CONCLUSION_URL);
}

async function loadSf32OwnerSourcePacket() {
  state.sf32OwnerSourcePacket = await fetchOptionalJson(SF32_OWNER_SOURCE_PACKET_URL);
}

async function loadSf32OwnerSourceHuntPlan() {
  state.sf32OwnerSourceHuntPlan = await fetchOptionalJson(SF32_OWNER_SOURCE_HUNT_PLAN_URL);
}

async function loadDiabloToolsAttributeSourceAudit() {
  state.diabloToolsAttributeSourceAudit = await fetchOptionalJson(DIABLO_TOOLS_ATTRIBUTE_SOURCE_AUDIT_URL);
}

async function loadSelector949ReconciliationAudit() {
  state.selector949ReconciliationAudit = await fetchOptionalJson(SELECTOR_949_RECONCILIATION_AUDIT_URL);
}

async function loadSelector949WindowReparseAudit() {
  state.selector949WindowReparseAudit = await fetchOptionalJson(SELECTOR_949_WINDOW_REPARSE_AUDIT_URL);
}

async function loadSf32OwnerParserBridge() {
  state.sf32OwnerParserBridge = await fetchOptionalJson(SF32_OWNER_PARSER_BRIDGE_URL);
}

async function loadSf33TriggerSourcePacket() {
  state.sf33TriggerSourcePacket = await fetchOptionalJson(SF33_TRIGGER_SOURCE_PACKET_URL);
}

async function loadSf33TriggerParserBridge() {
  state.sf33TriggerParserBridge = await fetchOptionalJson(SF33_TRIGGER_PARSER_BRIDGE_URL);
}

async function loadUptimeLocalExhaustionConclusion() {
  state.uptimeLocalExhaustionConclusion = await fetchOptionalJson(UPTIME_LOCAL_EXHAUSTION_CONCLUSION_URL);
}

async function loadUptimeSourcePacket() {
  state.uptimeSourcePacket = await fetchOptionalJson(UPTIME_SOURCE_PACKET_URL);
}

async function loadUptimeParserBridge() {
  state.uptimeParserBridge = await fetchOptionalJson(UPTIME_PARSER_BRIDGE_URL);
}

async function loadDeltaBridgeReadiness() {
  state.deltaBridgeReadiness = await fetchOptionalJson(DELTA_BRIDGE_READINESS_URL);
}

async function loadDeltaPromotionReview() {
  state.deltaPromotionReview = await fetchOptionalJson(DELTA_PROMOTION_REVIEW_URL);
}

async function loadDeltaEvidenceIntakePackage() {
  state.deltaEvidenceIntakePackage = await fetchOptionalJson(DELTA_EVIDENCE_INTAKE_PACKAGE_URL);
}

async function loadDeltaEvidenceDraft() {
  state.deltaEvidenceDraft = await fetchOptionalJson(DELTA_EVIDENCE_DRAFT_URL);
}

async function loadDeltaEvidenceDraftAudit() {
  state.deltaEvidenceDraftAudit = await fetchOptionalJson(DELTA_EVIDENCE_DRAFT_AUDIT_URL);
}

async function loadDeltaEvidenceIntakeUpdatePreview() {
  state.deltaEvidenceIntakeUpdatePreview = await fetchOptionalJson(DELTA_EVIDENCE_INTAKE_UPDATE_PREVIEW_URL);
}

async function loadDeltaManualPromotionGate() {
  state.deltaManualPromotionGate = await fetchOptionalJson(DELTA_MANUAL_PROMOTION_GATE_URL);
}

async function loadDeltaHumanActionPlan() {
  state.deltaHumanActionPlan = await fetchOptionalJson(DELTA_HUMAN_ACTION_PLAN_URL);
}

async function loadDeltaEvidenceFillForm() {
  state.deltaEvidenceFillForm = await fetchOptionalJson(DELTA_EVIDENCE_FILL_FORM_URL);
}

async function loadDeltaEvidenceFilledDraft() {
  state.deltaEvidenceFilledDraft = await fetchOptionalJson(DELTA_EVIDENCE_FILLED_DRAFT_URL);
}

async function loadDeltaEvidenceFilledDraftAudit() {
  state.deltaEvidenceFilledDraftAudit = await fetchOptionalJson(DELTA_EVIDENCE_FILLED_DRAFT_AUDIT_URL);
}

async function loadDeltaEvidenceFilledDraftIntakePreview() {
  state.deltaEvidenceFilledDraftIntakePreview = await fetchOptionalJson(DELTA_EVIDENCE_FILLED_DRAFT_INTAKE_PREVIEW_URL);
}

async function loadDeltaEvidenceIntakeCopyGate() {
  state.deltaEvidenceIntakeCopyGate = await fetchOptionalJson(DELTA_EVIDENCE_INTAKE_COPY_GATE_URL);
}

async function loadDeltaEvidencePostCopyIntake() {
  state.deltaEvidencePostCopyIntake = await fetchOptionalJson(DELTA_EVIDENCE_POST_COPY_INTAKE_URL);
}

async function loadDeltaEvidenceManualReviewGate() {
  state.deltaEvidenceManualReviewGate = await fetchOptionalJson(DELTA_EVIDENCE_MANUAL_REVIEW_GATE_URL);
}

async function loadDeltaEvidenceReviewDecisionPackage() {
  state.deltaEvidenceReviewDecisionPackage = await fetchOptionalJson(DELTA_EVIDENCE_REVIEW_DECISION_PACKAGE_URL);
}

async function loadDeltaEvidenceReviewDecisionAudit() {
  state.deltaEvidenceReviewDecisionAudit = await fetchOptionalJson(DELTA_EVIDENCE_REVIEW_DECISION_AUDIT_URL);
}

async function loadDeltaEvidencePromotionAudit() {
  state.deltaEvidencePromotionAudit = await fetchOptionalJson(DELTA_EVIDENCE_PROMOTION_AUDIT_URL);
}

async function loadDeltaPromotionImplementationDryRun() {
  state.deltaPromotionImplementationDryRun = await fetchOptionalJson(DELTA_PROMOTION_IMPLEMENTATION_DRY_RUN_URL);
}

async function loadDeltaPromotionApplicationGate() {
  state.deltaPromotionApplicationGate = await fetchOptionalJson(DELTA_PROMOTION_APPLICATION_GATE_URL);
}

async function loadDeltaPromotionApplyPlan() {
  state.deltaPromotionApplyPlan = await fetchOptionalJson(DELTA_PROMOTION_APPLY_PLAN_URL);
}

async function loadUserWhatIfScenarios() {
  state.userWhatIfScenarios = await fetchOptionalJson(USER_WHATIF_SCENARIOS_URL);
}

async function loadUserWhatIfContract() {
  state.userWhatIfContract = await fetchOptionalJson(USER_WHATIF_CONTRACT_URL);
}

async function loadReliableDpsGates() {
  state.reliableDpsGates = await fetchOptionalJson(RELIABLE_DPS_GATES_URL);
}

async function fetchOptionalJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function renderTargetOptimizerPlan() {
  const plan = state.targetOptimizerPlan;
  if (!plan) {
    byId("targetOptimizerPlan").innerHTML = `<div class="optimizer-empty">Aucun plan optimiseur cible genere.</div>`;
    return;
  }

  const summary = plan.summary ?? {};
  const current = plan.currentBuild ?? {};
  const recommendations = plan.recommendedStrictByClass ?? [];
  const readiness = current.readiness ?? {};
  byId("targetOptimizerPlan").innerHTML = `
    <div class="target-optimizer-grid">
      ${targetMetric("Entites scorees", summary.scoredEntities)}
      ${targetMetric("Classes", summary.classes)}
      ${targetMetric("Strict", summary.strictOnlyReady ? "pret" : "bloque")}
      ${targetMetric("Optimiseur fiable", summary.reliableOptimizerReady ? "pret" : "bloque")}
      ${targetMetric("Build valide", summary.currentBuildValid ? "oui" : "non")}
      ${targetMetric("Candidats bloques", summary.blockedCandidates)}
      ${targetMetric("Plans valides", summary.validStrictBuilds)}
      ${targetMetric("Fiables", summary.reliableStrictBuilds)}
      ${targetMetric("Actions", summary.actionQueueSize)}
    </div>
    <div class="target-optimizer-gate-summary">
      ${(summary.reliabilityGateFailures ?? []).map((gate) => `<span>${gate}</span>`).join("") || `<span>Toutes les portes de fiabilite sont ouvertes.</span>`}
    </div>
    <div class="target-optimizer-current">
      <strong>Build courant ${current.assetIds?.join(" + ") || "n/a"}</strong>
      <span>Strict ${formatNumber(current.strictDps)} - what-if ${formatNumber(current.whatIfDps)} - delta bloque +${formatNumber(current.candidateDelta)}</span>
      <span>Qualite ${current.quality?.level ?? "n/a"} ${current.quality?.score != null ? `${formatNumber(current.quality.score)}/100` : ""}</span>
      ${plan.bestValidStrictBuild ? `<span>Meilleur plan strict valide : ${plan.bestValidStrictBuild.class} - ${formatNumber(plan.bestValidStrictBuild.strictDps)} DPS strict</span>` : `<span>Aucun plan strict valide pour le moment.</span>`}
      <span>${(readiness.nextMilestones ?? []).slice(0, 2).join(" - ")}</span>
    </div>
    ${renderTargetOptimizerSuite(plan.targetOptimizerSuite)}
    ${renderTargetBucketEnginePlan(plan.targetBucketEngine)}
    ${renderBucketEngineContract(plan.bucketEngineContract)}
    ${renderWorkingBaseContract(plan.workingBaseContract)}
    ${renderDeltaPromotionConclusion(state.deltaPromotionConclusion ?? plan.deltaPromotionConclusion)}
    ${renderReliableDpsGates(state.reliableDpsGates ?? plan.reliableDpsGates)}
    ${renderAspectSlotNextSourcePlan(state.aspectSlotNextSourcePlan ?? plan.aspectSlotNextSourcePlan)}
    ${renderBonusSelectorSourceProof(state.bonusSelectorSourceProof)}
    ${renderAdditiveBucketSourceConclusion(state.additiveBucketSourceConclusion ?? plan.additiveBucketSourceConclusion)}
    ${renderNextEvidenceRoadmap(state.nextEvidenceRoadmap ?? plan.nextEvidenceRoadmap)}
    ${renderExternalDeltaEvidencePlan(state.externalDeltaEvidencePlan ?? plan.externalDeltaEvidencePlan)}
    ${renderExternalDeltaEvidenceWorkorder(state.externalDeltaEvidenceWorkorder ?? plan.externalDeltaEvidenceWorkorder)}
    ${renderExternalEvidenceSubmissionPack(state.externalEvidenceSubmissionPack ?? plan.externalEvidenceSubmissionPack)}
    ${renderExternalEvidenceSubmissionGate(state.externalEvidenceSubmissionGate ?? plan.externalEvidenceSubmissionGate)}
    ${renderExternalEvidenceSubmissionIntakePreview(state.externalEvidenceSubmissionIntakePreview ?? plan.externalEvidenceSubmissionIntakePreview)}
    ${renderExternalEvidenceSubmissionPostCopyIntake(state.externalEvidenceSubmissionPostCopyIntake ?? plan.externalEvidenceSubmissionPostCopyIntake)}
    ${renderExternalEvidenceSubmissionManualReviewGate(state.externalEvidenceSubmissionManualReviewGate ?? plan.externalEvidenceSubmissionManualReviewGate)}
    ${renderExternalEvidenceSubmissionReviewDecisionPackage(state.externalEvidenceSubmissionReviewDecisionPackage ?? plan.externalEvidenceSubmissionReviewDecisionPackage)}
    ${renderExternalEvidenceSubmissionReviewDecisionAudit(state.externalEvidenceSubmissionReviewDecisionAudit ?? plan.externalEvidenceSubmissionReviewDecisionAudit)}
    ${renderExternalEvidenceSubmissionPromotionAudit(state.externalEvidenceSubmissionPromotionAudit ?? plan.externalEvidenceSubmissionPromotionAudit)}
    ${renderExternalEvidenceSubmissionImplementationDryRun(state.externalEvidenceSubmissionImplementationDryRun ?? plan.externalEvidenceSubmissionImplementationDryRun)}
    ${renderExternalEvidenceSubmissionApplicationGate(state.externalEvidenceSubmissionApplicationGate ?? plan.externalEvidenceSubmissionApplicationGate)}
    ${renderExternalEvidenceSubmissionApplyPlan(state.externalEvidenceSubmissionApplyPlan ?? plan.externalEvidenceSubmissionApplyPlan)}
    ${renderNewBinaryFamilyPlan(state.newBinaryFamilyPlan ?? plan.newBinaryFamilyPlan)}
    ${renderNewBinaryFamilyDeltaParentAudit(state.newBinaryFamilyDeltaParentAudit ?? plan.newBinaryFamilyDeltaParentAudit)}
    ${renderDeltaParentConsumerCorpusScan(state.deltaParentConsumerCorpusScan ?? plan.deltaParentConsumerCorpusScan)}
    ${renderDeltaParentExpandedDecodePlan(state.deltaParentExpandedDecodePlan ?? plan.deltaParentExpandedDecodePlan)}
    ${renderDeltaParentUpgradeStructureAudit(state.deltaParentUpgradeStructureAudit ?? plan.deltaParentUpgradeStructureAudit)}
    ${renderDeltaParentOffsetReferenceGraph(state.deltaParentOffsetReferenceGraph ?? plan.deltaParentOffsetReferenceGraph)}
    ${renderDeltaParentSystemsTuningContexts(state.deltaParentSystemsTuningContexts ?? plan.deltaParentSystemsTuningContexts)}
    ${renderDeltaParentUndecodedSourcePlan(state.deltaParentUndecodedSourcePlan ?? plan.deltaParentUndecodedSourcePlan)}
    ${renderDeltaParentNontextTableSignals(state.deltaParentNontextTableSignals ?? plan.deltaParentNontextTableSignals)}
    ${renderDeltaLocalExhaustionConclusion(state.deltaLocalExhaustionConclusion ?? plan.deltaLocalExhaustionConclusion)}
    ${renderDeltaNextActionDecision(state.deltaNextActionDecision ?? plan.deltaNextActionDecision)}
    ${renderSf32LocalExhaustionConclusion(state.sf32LocalExhaustionConclusion ?? plan.sf32LocalExhaustionConclusion)}
    ${renderSf32OwnerSourcePacket(state.sf32OwnerSourcePacket ?? plan.sf32OwnerSourcePacket)}
    ${renderSf32OwnerSourceHuntPlan(state.sf32OwnerSourceHuntPlan ?? plan.sf32OwnerSourceHuntPlan)}
    ${renderDiabloToolsAttributeSourceAudit(state.diabloToolsAttributeSourceAudit ?? plan.diabloToolsAttributeSourceAudit)}
    ${renderSelector949ReconciliationAudit(state.selector949ReconciliationAudit ?? plan.selector949ReconciliationAudit)}
    ${renderSelector949WindowReparseAudit(state.selector949WindowReparseAudit ?? plan.selector949WindowReparseAudit)}
    ${renderSf32OwnerParserBridge(state.sf32OwnerParserBridge ?? plan.sf32OwnerParserBridge)}
    ${renderSf33TriggerSourcePacket(state.sf33TriggerSourcePacket ?? plan.sf33TriggerSourcePacket)}
    ${renderSf33TriggerParserBridge(state.sf33TriggerParserBridge ?? plan.sf33TriggerParserBridge)}
    ${renderUptimeLocalExhaustionConclusion(state.uptimeLocalExhaustionConclusion ?? plan.uptimeLocalExhaustionConclusion)}
    ${renderUptimeSourcePacket(state.uptimeSourcePacket ?? plan.uptimeSourcePacket)}
    ${renderUptimeParserBridge(state.uptimeParserBridge ?? plan.uptimeParserBridge)}
    ${renderDeltaBridgeReadiness(state.deltaBridgeReadiness ?? plan.deltaBridgeReadiness)}
    ${renderDeltaPromotionReview(state.deltaPromotionReview ?? plan.deltaPromotionReview)}
    ${renderDeltaEvidenceIntakePackage(state.deltaEvidenceIntakePackage ?? plan.deltaEvidenceIntakePackage)}
    ${renderDeltaEvidenceDraft(state.deltaEvidenceDraft ?? plan.deltaEvidenceDraft)}
    ${renderDeltaEvidenceDraftAudit(state.deltaEvidenceDraftAudit ?? plan.deltaEvidenceDraftAudit)}
    ${renderDeltaEvidenceIntakeUpdatePreview(state.deltaEvidenceIntakeUpdatePreview ?? plan.deltaEvidenceIntakeUpdatePreview)}
    ${renderDeltaManualPromotionGate(state.deltaManualPromotionGate ?? plan.deltaManualPromotionGate)}
    ${renderDeltaHumanActionPlan(state.deltaHumanActionPlan ?? plan.deltaHumanActionPlan)}
    ${renderDeltaEvidenceFillForm(state.deltaEvidenceFillForm ?? plan.deltaEvidenceFillForm)}
    ${renderDeltaEvidenceFilledDraft(state.deltaEvidenceFilledDraft ?? plan.deltaEvidenceFilledDraft)}
    ${renderDeltaEvidenceFilledDraftAudit(state.deltaEvidenceFilledDraftAudit ?? plan.deltaEvidenceFilledDraftAudit)}
    ${renderDeltaEvidenceFilledDraftIntakePreview(state.deltaEvidenceFilledDraftIntakePreview ?? plan.deltaEvidenceFilledDraftIntakePreview)}
    ${renderDeltaEvidenceIntakeCopyGate(state.deltaEvidenceIntakeCopyGate ?? plan.deltaEvidenceIntakeCopyGate)}
    ${renderDeltaEvidencePostCopyIntake(state.deltaEvidencePostCopyIntake ?? plan.deltaEvidencePostCopyIntake)}
    ${renderDeltaEvidenceManualReviewGate(state.deltaEvidenceManualReviewGate ?? plan.deltaEvidenceManualReviewGate)}
    ${renderDeltaEvidenceReviewDecisionPackage(state.deltaEvidenceReviewDecisionPackage ?? plan.deltaEvidenceReviewDecisionPackage)}
    ${renderDeltaEvidenceReviewDecisionAudit(state.deltaEvidenceReviewDecisionAudit ?? plan.deltaEvidenceReviewDecisionAudit)}
    ${renderDeltaEvidencePromotionAudit(state.deltaEvidencePromotionAudit ?? plan.deltaEvidencePromotionAudit)}
    ${renderDeltaPromotionImplementationDryRun(state.deltaPromotionImplementationDryRun ?? plan.deltaPromotionImplementationDryRun)}
    ${renderDeltaPromotionApplicationGate(state.deltaPromotionApplicationGate ?? plan.deltaPromotionApplicationGate)}
    ${renderDeltaPromotionApplyPlan(state.deltaPromotionApplyPlan ?? plan.deltaPromotionApplyPlan)}
    ${renderUserWhatIfContract(state.userWhatIfContract ?? plan.userWhatIfContract)}
    ${renderExternalEvidenceIntake(plan.externalEvidenceIntake)}
    ${renderExternalEvidenceBridgePlan(plan.externalEvidenceBridgePlan)}
    ${renderTargetOptimizerActionQueue(plan.actionQueue ?? [])}
    <div class="target-optimizer-recommendations">
      ${recommendations.map(renderTargetOptimizerRecommendation).join("") || `<div class="optimizer-empty">Aucune recommandation stricte exploitable.</div>`}
    </div>
    <div class="target-optimizer-safeguards">
      ${(plan.safeguards ?? []).map((item) => `<span>${item}</span>`).join("")}
    </div>
  `;
}

function renderBucketEngineContract(contract) {
  if (!contract) return "";
  const summary = contract.summary ?? {};
  const invariants = contract.invariants ?? [];
  return `
    <div class="bonus-selector-proof bucket-engine-contract">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Contrat buckets</strong>
          <span>${summary.status ?? "n/a"}</span>
        </div>
        <div class="${summary.status === "bucket-engine-contract-ok" ? "positive" : "blocked"}">
          ${summary.status === "bucket-engine-contract-ok" ? "ok" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Invariants", summary.invariants)}
        ${targetMetric("Passes", summary.passed)}
        ${targetMetric("Echecs", summary.failed)}
        ${targetMetric("Parite", summary.strictParityDelta)}
      </div>
      <div class="bonus-selector-signals">
        <span>Strict recalcule ${formatNumber(summary.recomputedStrictDps)}</span>
        <span>Reliable ${formatNumber(summary.reliableDps)}</span>
        <span>Delta bloque +${formatNumber(summary.blockedCandidateDelta)}</span>
        <span>What-if ${formatNumber(summary.whatIfDps)}</span>
      </div>
      <div class="suite-invariant-list">
        ${invariants.map((item) => `
          <span class="${item.status === "passed" ? "passed" : "failed"}">${item.id}: ${item.status}</span>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderTargetOptimizerSuite(suite) {
  if (!suite) return "";
  const summary = suite.summary ?? {};
  const invariants = suite.invariants ?? [];
  return `
    <div class="bonus-selector-proof target-optimizer-suite">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Suite generation</strong>
          <span>${summary.status ?? "n/a"}</span>
        </div>
        <div class="${summary.status === "target-optimizer-suite-ok" ? "positive" : "blocked"}">
          ${summary.status === "target-optimizer-suite-ok" ? "ok" : "a verifier"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Etapes", summary.steps)}
        ${targetMetric("Parite", summary.strictParityDelta)}
        ${targetMetric("Base", summary.workingBaseClass ?? "n/a")}
        ${targetMetric("Fiables", summary.reliableStrictBuilds)}
      </div>
      <div class="suite-invariant-list">
        ${invariants.map((item) => `
          <span class="${item.status === "passed" ? "passed" : "failed"}">${item.id}: ${item.value}</span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderWorkingBaseContract(contract) {
  if (!contract) return "";
  const summary = contract.summary ?? {};
  const base = contract.workingBase ?? {};
  const policy = contract.reliableDpsPolicy ?? {};
  return `
    <div class="bonus-selector-proof working-base-contract">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Base de travail</strong>
          <span>${summary.status ?? "n/a"}</span>
        </div>
        <div class="${summary.reliableOptimizerReady ? "positive" : "blocked"}">
          ${summary.reliableOptimizerReady ? "fiable" : summary.canLoadAsWorkingBase ? "chargeable" : "bloquee"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Classe", summary.class ?? "n/a")}
        ${targetMetric("Strict", formatNumber(summary.strictDps))}
        ${targetMetric("Delta bloque", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("What-if", formatNumber(summary.whatIfDps))}
      </div>
      <div class="working-base-actions">
        <div>
          <strong>Autorise</strong>
          ${(summary.allowedActions ?? []).slice(0, 4).map((item) => `<span>${item}</span>`).join("")}
        </div>
        <div>
          <strong>Interdit</strong>
          ${(summary.forbiddenActions ?? []).slice(0, 4).map((item) => `<span>${item}</span>`).join("")}
        </div>
      </div>
      <div class="target-bucket-class-gates">
        ${Object.entries(base.gateSummary ?? {}).map(([id, status]) => `<span class="${status === "passed" ? "passed" : "failed"}">${id}: ${status}</span>`).join("")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ranking ${policy.reliableRankingUses ?? "strictDps"}</span>
        <span>Reliable ${policy.canUseForReliableDps ? "oui" : "non"}</span>
        <span>What-if utilisateur ${policy.canUseForUserWhatIf ? "oui" : "non"}</span>
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderReliableDpsGates(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const assessment = summary.assessment ?? {};
  const gates = report.gates ?? [];
  return `
    <div class="bonus-selector-proof reliable-dps-gates">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Portes DPS fiable ${summary.assetId ?? "n/a"}</strong>
          <span>${assessment.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.canUseForReliableDps ? "positive" : "blocked"}">
          ${summary.canUseForReliableDps ? "promouvable" : "strict-only"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Strict", formatNumber(summary.strictDps))}
        ${targetMetric("Delta bloque", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("Passees", summary.passedGates)}
        ${targetMetric("Bloquees", summary.failedGates)}
      </div>
      <div class="reliable-gate-list">
        ${gates.map((gate) => `
          <span class="${gate.status === "passed" ? "ready" : "blocked"}">
            <strong>${gate.title}</strong>
            <em>${gate.status}</em>
          </span>
        `).join("")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ranking ${summary.canUseForRanking ? "what-if autorise" : "strict uniquement"}</span>
        <span>What-if utilisateur ${summary.canUseForUserWhatIf ? "oui" : "non"}</span>
        <span>Local epuise ${summary.localEvidenceExhausted ? "oui" : "non"}</span>
      </div>
      <p>${assessment.finding ?? ""}</p>
      <p>${assessment.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceBridgePlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const steps = report.steps ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-bridge">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Pont preuves</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readySteps > 0 ? "positive" : "blocked"}">
          ${summary.readySteps > 0 ? "pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Etapes", summary.steps)}
        ${targetMetric("Pretes", summary.readySteps)}
        ${targetMetric("Bloquees", summary.blockedSteps)}
        ${targetMetric("Preuves", summary.acceptedEvidence)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Portes DPS ${summary.reliableDpsStillBlocked ? "bloquees" : "ouvertes"}</span>
        <span>Contrat buckets ${summary.bucketContractSafe ? "ok" : "a verifier"}</span>
      </div>
      <div class="next-evidence-actions">
        ${steps.map((item) => `
          <article>
            <span>${item.status}</span>
            <strong>${item.title}</strong>
            <p>${item.unlocks}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderNewBinaryFamilyPlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const probes = report.probes ?? [];
  return `
    <div class="bonus-selector-proof new-binary-family-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Famille binaire</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyProbes > 0 ? "positive" : "blocked"}">
          ${summary.readyProbes > 0 ? "pret" : "a scanner"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Sondes", summary.probes)}
        ${targetMetric("Pretes", summary.readyProbes)}
        ${targetMetric("Bloquees", summary.blockedProbes)}
        ${targetMetric("Priorite", summary.nextProbeId ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Preuves locales ${summary.localEvidenceExhausted ? "epuisees" : "a verifier"}</span>
        <span>Pont externe ${formatNumber(summary.externalBridgeReadySteps)} pret</span>
      </div>
      <div class="next-evidence-actions">
        ${probes.map((item) => `
          <article>
            <span>${item.priority} - ${item.status}</span>
            <strong>${item.title}</strong>
            <p>${(item.missingGates ?? []).join(" - ") || item.unlocks}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderNewBinaryFamilyDeltaParentAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const gates = report.gates ?? [];
  const nextSearch = report.nextSearchPlan ?? {};
  return `
    <div class="bonus-selector-proof new-binary-family-delta-parent-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit delta parent</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.promotionReady ? "positive" : "blocked"}">
          ${summary.promotionReady ? "promouvable" : "non promouvable"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Asset", summary.assetId)}
        ${targetMetric("Gates", summary.gates)}
        ${targetMetric("Echecs", summary.failedGates)}
        ${targetMetric("Recherche", summary.nextSearchKind ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>SF_32 ${summary.sf32OwnershipProven ? "prouve" : "bloque"}</span>
        <span>Uptime ${summary.uptimeProvenOrSeparated ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${gates.map((gate) => `
          <span class="${gate.status === "passed" ? "passed" : "failed"}">${gate.id}: ${gate.status}</span>
        `).join("")}
      </div>
      <div class="next-evidence-actions">
        <article>
          <span>${nextSearch.priority ?? "high"}</span>
          <strong>${nextSearch.id ?? "corpus-binary-parent-consumer-scan-1663210"}</strong>
          <p>${(nextSearch.targetAnchors ?? []).join(" - ")}</p>
        </article>
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentConsumerCorpusScan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const candidates = report.candidates ?? [];
  const hashOnly = report.hashOnlyCandidates ?? [];
  return `
    <div class="bonus-selector-proof delta-parent-consumer-corpus-scan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Scan corpus delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.parentConsumerCandidates > 0 ? "positive" : "blocked"}">
          ${summary.parentConsumerCandidates > 0 ? "a revoir" : "local only"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Fichiers", summary.filesScanned)}
        ${targetMetric("Hits", summary.hits)}
        ${targetMetric("Candidats", summary.parentConsumerCandidates)}
        ${targetMetric("Hash seuls", summary.hashOnlyCandidates)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>Local ${formatNumber(summary.targetLocalHits)}</span>
        <span>Layout seul ${formatNumber(summary.selectorLayoutOnly)}</span>
      </div>
      <div class="next-evidence-actions">
        ${(candidates.length ? candidates : hashOnly).slice(0, 4).map((item) => `
          <article>
            <span>${item.kind}</span>
            <strong>${item.assetId ?? "asset inconnu"}</strong>
            <p>${Object.entries(item.counts ?? {}).filter(([, value]) => value).map(([key, value]) => `${key}:${value}`).join(" - ")}</p>
          </article>
        `).join("") || `
          <article>
            <span>scan</span>
            <strong>Aucun candidat externe promouvable</strong>
            <p>Elargir aux payloads non decodes ou aux tables binaires hors chaines.</p>
          </article>
        `}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentExpandedDecodePlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const queue = report.nextInspectionQueue ?? [];
  const missing = (report.candidates ?? []).filter((item) => !item.decoded);
  return `
    <div class="bonus-selector-proof delta-parent-expanded-decode-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Extension decode delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.missingDecode > 0 ? "blocked" : "positive"}">
          ${summary.missingDecode > 0 ? "decode requis" : "pret inspection"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Analogies", summary.upgradeAnalogyAssets)}
        ${targetMetric("Decodees", summary.decodedCandidates)}
        ${targetMetric("Manquantes", summary.missingDecode)}
        ${targetMetric("Haute conf.", summary.highConfidenceDecoded)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Inspection ${(summary.nextInspectionAssets ?? []).join(", ") || "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        ${(missing.length ? missing : queue).slice(0, 5).map((item) => `
          <article>
            <span>${item.requiredAction ?? "inspect"}</span>
            <strong>${item.assetId} - ${item.fileName}</strong>
            <p>${(item.sampleValues ?? []).slice(0, 2).join(" - ")}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentUpgradeStructureAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const topHits = report.topHits ?? [];
  return `
    <div class="bonus-selector-proof delta-parent-upgrade-structure-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Structure Upgrade</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.exactParentConsumerProven ? "positive" : "blocked"}">
          ${summary.exactParentConsumerProven ? "parent prouve" : "motif seul"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Assets", summary.upgradeAnalogyAssets)}
        ${targetMetric("Hits", summary.upgradeHits)}
        ${targetMetric("Flags", summary.standaloneFlags)}
        ${targetMetric("Trailer", summary.trailerMatchesTarget)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>Motif reutilisable ${summary.reusablePatternCandidate ? "oui" : "non"}</span>
        <span>Assets ${(summary.trailerMatchAssets ?? []).join(", ") || "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        ${topHits.slice(0, 5).map((item) => `
          <article>
            <span>${item.kind}</span>
            <strong>${item.assetId} - ${item.term}</strong>
            <p>${item.trailerSignature || "n/a"} - refs ${formatNumber(item.directOffsetReferenceCount)}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentOffsetReferenceGraph(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const parentRefs = report.anchorsWithParentRefs ?? [];
  return `
    <div class="bonus-selector-proof delta-parent-offset-reference-graph">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Graphe offsets</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.anchorsWithParentRefs > 0 ? "positive" : "blocked"}">
          ${summary.anchorsWithParentRefs > 0 ? "parent candidat" : "terminal"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Ancres", summary.inspectedAnchors)}
        ${targetMetric("Cible", summary.targetAnchors)}
        ${targetMetric("Upgrade", summary.upgradeAnchors)}
        ${targetMetric("Parents", summary.anchorsWithParentRefs)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>Refs cible ${formatNumber(summary.targetParentRefs)}</span>
        <span>Refs upgrade ${formatNumber(summary.upgradeParentRefs)}</span>
      </div>
      <div class="next-evidence-actions">
        ${parentRefs.slice(0, 4).map((item) => `
          <article>
            <span>${item.term}</span>
            <strong>${item.assetId} - ${item.entryOffset}</strong>
            <p>${(item.entryRefs ?? []).join(", ") || "n/a"}</p>
          </article>
        `).join("") || `
          <article>
            <span>scan</span>
            <strong>Aucun parent local direct</strong>
            <p>Chercher dans une table superieure ou un record binaire non textuel.</p>
          </article>
        `}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentSystemsTuningContexts(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const externalTargets = report.externalTargetContexts ?? [];
  const targetContexts = report.targetContexts ?? [];
  return `
    <div class="bonus-selector-proof delta-parent-systems-tuning-contexts">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>SystemsTuning</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.externalTargetSystemsTuningContexts > 0 ? "positive" : "blocked"}">
          ${summary.externalTargetSystemsTuningContexts > 0 ? "externe" : "local"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Fichiers", summary.filesScanned)}
        ${targetMetric("Contextes", summary.contexts)}
        ${targetMetric("Cible", summary.targetContexts)}
        ${targetMetric("Ext.", summary.externalTargetContexts)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Hash cible ${summary.targetHash ?? "n/a"}</span>
        <span>Systems ext. ${formatNumber(summary.externalTargetSystemsTuningContexts)}</span>
        <span>Upgrade ext. ${formatNumber(summary.externalUpgradeContexts)}</span>
      </div>
      <div class="next-evidence-actions">
        ${(externalTargets.length ? externalTargets : targetContexts).slice(0, 4).map((item) => `
          <article>
            <span>${item.kind}</span>
            <strong>${item.assetId} - ${item.hash}</strong>
            <p>${(item.strings ?? []).slice(0, 2).map((row) => row.value).join(" - ") || "n/a"}</p>
          </article>
        `).join("") || `
          <article>
            <span>scan</span>
            <strong>Aucun contexte cible</strong>
            <p>Elargir le corpus decode avant de conclure.</p>
          </article>
        `}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentUndecodedSourcePlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const queue = report.nextDecodeQueue ?? [];
  const highPriority = report.highPriority ?? [];
  return `
    <div class="bonus-selector-proof delta-parent-undecoded-source-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Sources non decodees</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.missingDecodeHighPriority > 0 ? "blocked" : "positive"}">
          ${summary.missingDecodeHighPriority > 0 ? "decode cible" : "pret"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Assets", summary.externalReferenceAssets)}
        ${targetMetric("Scores", summary.scoredAssets)}
        ${targetMetric("Priorite", summary.highPriorityAssets)}
        ${targetMetric("A decoder", summary.missingDecodeHighPriority)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>Deja decodes ${formatNumber(summary.alreadyDecodedHighPriority)}</span>
        <span>File ${(summary.nextDecodeAssets ?? []).join(", ") || "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        ${(queue.length ? queue : highPriority).slice(0, 5).map((item) => `
          <article>
            <span>${item.requiredAction}</span>
            <strong>${item.assetId} - ${item.fileName}</strong>
            <p>${(item.matchedTerms ?? []).slice(0, 2).join(" - ") || item.tags?.join(", ") || "n/a"}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaParentNontextTableSignals(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const linked = report.linkedTargetHashSignals ?? [];
  const unlinked = report.targetHashNontextSignals ?? [];
  return `
    <div class="bonus-selector-proof delta-parent-nontext-table-signals">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Tables non texte</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.linkedTargetHashSignals > 0 ? "positive" : "blocked"}">
          ${summary.linkedTargetHashSignals > 0 ? "candidat lie" : "non lie"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Payloads", summary.inspectedPayloads)}
        ${targetMetric("Occurrences", summary.occurrences)}
        ${targetMetric("Hash non texte", summary.targetHashNontextSignals)}
        ${targetMetric("Lies", summary.linkedTargetHashSignals)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>Layouts ${formatNumber(summary.selectorAssetLayoutSignals)}</span>
      </div>
      <div class="next-evidence-actions">
        ${(linked.length ? linked : unlinked).slice(0, 4).map((item) => `
          <article>
            <span>${item.kind}</span>
            <strong>${item.assetId} - ${item.valueName} @ ${item.offset}</strong>
            <p>${(item.pointerLikeWords ?? []).slice(0, 3).map((word) => `${word.delta}:${word.u32}`).join(" - ") || "n/a"}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaLocalExhaustionConclusion(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const evidence = report.sf33Evidence ?? [];
  const localConclusions = report.localConclusions ?? [];
  const nextFocus = report.nextFocus ?? [];
  return `
    <div class="bonus-selector-proof delta-local-exhaustion-conclusion">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Conclusion delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.allLocalEvidenceExhausted ? "blocked" : "positive"}">
          ${summary.allLocalEvidenceExhausted ? "local clos" : "a revoir"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("SF32", summary.sf32LocalExhausted ? "clos" : "ouvert")}
        ${targetMetric("SF33", summary.sf33LocalExhausted ? "clos" : "ouvert")}
        ${targetMetric("Uptime", summary.uptimeLocalReliableEvidenceExhausted ? "clos" : "ouvert")}
        ${targetMetric("Delta", summary.blockedDeltaDps)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Parent exact ${summary.exactParentConsumerProven ? "prouve" : "absent"}</span>
        <span>What-if utilisateur ${summary.userScenarioSeparated ? "separe" : "a verifier"}</span>
      </div>
      <div class="suite-invariant-list">
        ${localConclusions.map((item) => `
          <span class="${item.status?.includes("exhausted") ? "failed" : "passed"}">${item.id}: ${item.status}</span>
        `).join("")}
      </div>
      <div class="next-evidence-actions">
        ${(nextFocus.length ? nextFocus : evidence).slice(0, 5).map((item) => `
          <article>
            <span>${item.priority ?? item.status ?? "audit"}</span>
            <strong>${item.id}</strong>
            <p>${item.nextAction ?? item.finding ?? item.reason ?? ""}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaNextActionDecision(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const actions = report.rankedActions ?? [];
  return `
    <div class="bonus-selector-proof delta-next-action-decision">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Decision delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.promotionReady ? "positive" : "blocked"}">
          ${summary.promotionReady ? "pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Action", summary.recommendedActionId ?? "n/a")}
        ${targetMetric("Priorite", summary.recommendedPriority ?? "n/a")}
        ${targetMetric("Actions", summary.actions)}
        ${targetMetric("Delta", summary.blockedDeltaDps)}
      </div>
      <div class="bonus-selector-signals">
        <span>Preuve externe ${summary.externalProofMissing ? "manquante" : "presente"}</span>
        <span>Famille binaire ${summary.binaryProbeAvailable ? "sonde" : "absente"}</span>
        <span>What-if ${summary.whatIfSeparated ? "separe" : "a cadrer"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="next-evidence-actions">
        ${actions.map((action) => `
          <article>
            <span>#${action.rank} ${action.priority} - ${action.readiness}</span>
            <strong>${action.title}</strong>
            <p>${action.nextStep}</p>
            <em>${action.id}</em>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSf32LocalExhaustionConclusion(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.localEvidenceChecks ?? [];
  const requiredProofs = report.requiredProofs ?? [];
  return `
    <div class="bonus-selector-proof sf32-local-exhaustion-conclusion">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Conclusion SF_32</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.sf32LocalExhausted ? "blocked" : "positive"}">
          ${summary.sf32LocalExhausted ? "local clos" : "a revoir"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Portes", `${formatNumber(summary.failedPromotionGates)}/${formatNumber(summary.promotionGates)}`)}
        ${targetMetric("Checks", summary.localEvidenceChecks)}
        ${targetMetric("Signaux", summary.readySignals)}
        ${targetMetric("Focus", summary.recommendedNextFocus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ownership ${summary.fieldOwnershipProven ? "prouve" : "absent"}</span>
        <span>Preuve externe ${formatNumber(summary.acceptedExternalEvidence)}</span>
        <span>Pont ${formatNumber(summary.bridgeReadySteps)}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.slice(0, 7).map((check) => `
          <span class="${check.status === "passed" || check.status === "ready" ? "passed" : "failed"}">${check.id}: ${check.status}</span>
        `).join("")}
      </div>
      <div class="next-evidence-actions">
        ${requiredProofs.map((item) => `
          <article>
            <span>${item.priority}</span>
            <strong>${item.id}</strong>
            <p>${item.requiredEvidence}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSf32OwnerSourcePacket(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const claim = report.requiredClaim ?? {};
  const bridge = report.parserBridgeContract ?? {};
  const rejected = report.rejectedLocalSignals ?? [];
  return `
    <div class="bonus-selector-proof sf32-owner-source-packet">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Packet SF_32</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.acceptedEvidence > 0 ? "positive" : "blocked"}">
          ${summary.acceptedEvidence > 0 ? "preuve acceptee" : "source requise"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Asset", summary.assetId)}
        ${targetMetric("Champ", summary.targetField ?? "n/a")}
        ${targetMetric("Selecteur", summary.targetSelector ?? "n/a")}
        ${targetMetric("Rejets locaux", summary.rejectedLocalSignals)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Bridge ${bridge.status ?? "n/a"}</span>
        <span>Claim ${claim.type ?? "n/a"} / ${claim.field ?? "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        ${rejected.slice(0, 4).map((item) => `
          <article>
            <span>${item.sourceAssessment ?? item.id}</span>
            <strong>${item.id}</strong>
            <p>${item.reasonRejectedForOwnership}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSf32OwnerSourceHuntPlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const searches = report.searches ?? [];
  const accept = report.acceptanceChecklist ?? [];
  return `
    <div class="bonus-selector-proof sf32-owner-source-hunt-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Recherche source SF_32</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.acceptedEvidence > 0 ? "positive" : "blocked"}">
          ${summary.acceptedEvidence > 0 ? "source presente" : "a chercher"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Recherches", summary.searches)}
        ${targetMetric("Priorite haute", summary.highPrioritySearches)}
        ${targetMetric("Termes requis", summary.requiredTerms)}
        ${targetMetric("Candidat", summary.candidateSnippetReady ? "pret" : "absent")}
      </div>
      <div class="bonus-selector-signals">
        <span>${summary.targetSelector ?? "selector"} -> ${summary.targetField ?? "field"}</span>
        <span>Intake ${summary.writesIntake ? "ecrit" : "protege"}</span>
        <span>Bridge ${summary.acceptedForBridge ? "ouvert" : "ferme"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="next-evidence-actions">
        ${searches.map((item) => `
          <article>
            <span>${item.priority} - ${item.sourceKind}</span>
            <strong>${item.id}</strong>
            <p>${item.query}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${accept.map((item) => `<span class="passed">${item}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDiabloToolsAttributeSourceAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const evidence = report.evidence ?? {};
  return `
    <div class="bonus-selector-proof diablo-tools-attribute-source-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>DiabloTools attributes</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.sourceContradictsPriorSelectorAssumption ? "blocked" : "positive"}">
          ${summary.sourceContradictsPriorSelectorAssumption ? "hypothese a reviser" : "coherent"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("eAttrib 949", summary.selector949Name ?? "n/a")}
        ${targetMetric("Bonus eAttrib", summary.bonusPercentPerPowerEAttrib ?? "n/a")}
        ${targetMetric("Hash", report.source?.archiveHashMatches ? "ok" : "non")}
        ${targetMetric("Bridge", summary.acceptedForBridge ? "ouvert" : "ferme")}
      </div>
      <div class="bonus-selector-signals">
        <span>949 -> ${summary.selector949Name ?? "inconnu"}</span>
        <span>994 -> ${summary.selector994Name ?? "inconnu"}</span>
        <span>Bonus_Percent_Per_Power -> ${summary.bonusPercentPerPowerEAttrib ?? "n/a"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="suite-invariant-list">
        ${(evidence.selector949 ?? []).map((item) => `<span class="failed">949: ${item.name}</span>`).join("")}
        ${(evidence.selector994 ?? []).map((item) => `<span class="passed">994: ${item.name}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSelector949ReconciliationAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const findings = report.selectorFindings ?? [];
  const hypotheses = report.revisedHypotheses ?? [];
  return `
    <div class="bonus-selector-proof selector-949-reconciliation-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Reconciliation 949</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.needsReinterpretation ? "blocked" : "positive"}">
          ${summary.needsReinterpretation ? "a reinterpreter" : "stable"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("994", summary.selector994Aligned ? "aligne" : "non")}
        ${targetMetric("949", summary.selector949Contradicted ? "conflit" : "ouvert")}
        ${targetMetric("Compact", summary.compact949Unique ? "unique" : "repete")}
        ${targetMetric("Focus", summary.recommendedNextFocus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Bridge ${summary.acceptedForBridge ? "ouvert" : "ferme"}</span>
        <span>Metadata ${summary.metadataCrossSelector ? "transverse" : "locale"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "non"}</span>
      </div>
      <div class="suite-invariant-list">
        ${findings.map((item) => `
          <span class="${item.status === "aligned" ? "passed" : "failed"}">${item.id}: ${item.status}</span>
        `).join("")}
      </div>
      <div class="next-evidence-actions">
        ${hypotheses.map((item) => `
          <article>
            <span>${item.status} - ${item.confidence}</span>
            <strong>${item.id}</strong>
            <p>${item.implication}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSelector949WindowReparseAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const comparisons = report.comparisons ?? [];
  const claims = report.revisedClaims ?? [];
  return `
    <div class="bonus-selector-proof selector-949-window-reparse-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Reparse fenetre 949</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.sf32TemplateNeedsRevision ? "blocked" : "positive"}">
          ${summary.sf32TemplateNeedsRevision ? "template a reviser" : "stable"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("994 directs", summary.selector994DirectExamples ?? 0)}
        ${targetMetric("949", summary.selector949Examples ?? 0)}
        ${targetMetric("Compact", `${summary.selector949CompactExamples ?? 0}/${summary.selector949NonCompactExamples ?? 0}`)}
        ${targetMetric("Statut", summary.windowReparseStatus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>949 ${summary.selector949NotBonusEAttrib ? "pas bonus" : "ouvert"}</span>
        <span>994 ${summary.selector994AlignedWithAttribute ? "source-backed" : "non prouve"}</span>
        <span>Bridge ${summary.acceptedForBridge ? "ouvert" : "ferme"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="suite-invariant-list">
        ${comparisons.map((item) => `
          <span class="${item.status === "source-backed" ? "passed" : "failed"}">${item.id}: ${item.status}</span>
        `).join("")}
      </div>
      <div class="next-evidence-actions">
        ${claims.map((item) => `
          <article>
            <span>${item.status}</span>
            <strong>${item.id}</strong>
            <p>${item.reason}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSf32OwnerParserBridge(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const mappings = report.mappings ?? [];
  const invariants = report.requiredInvariants ?? [];
  return `
    <div class="bonus-selector-proof sf32-owner-parser-bridge">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Bridge SF_32</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.bridgeReady ? "positive" : "blocked"}">
          ${summary.bridgeReady ? "mapping pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Preuves", summary.acceptedEvidence)}
        ${targetMetric("Mappings", summary.mappings)}
        ${targetMetric("Selecteur", summary.selector ?? "n/a")}
        ${targetMetric("Champ", summary.ownerField ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Gates ${summary.reliableDpsStillBlocked ? "bloquees" : "ouvertes"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${invariants.map((item) => `<span class="blocked">${item}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${mappings.map((item) => `
          <article>
            <span>${item.status}</span>
            <strong>${item.selector} -> ${item.ownerField}</strong>
            <p>${item.sourceEvidenceId}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSf33TriggerSourcePacket(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const claim = report.requiredClaim ?? {};
  const bridge = report.parserBridgeContract ?? {};
  const rejected = report.rejectedLocalSignals ?? [];
  return `
    <div class="bonus-selector-proof sf33-trigger-source-packet">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Packet SF_33</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.acceptedEvidence > 0 ? "positive" : "blocked"}">
          ${summary.acceptedEvidence > 0 ? "preuve acceptee" : "source requise"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Asset", summary.assetId)}
        ${targetMetric("Champ", summary.targetField ?? "n/a")}
        ${targetMetric("Trigger", summary.targetTrigger ?? "n/a")}
        ${targetMetric("Rejets locaux", summary.rejectedLocalSignals)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Bridge ${bridge.status ?? "n/a"}</span>
        <span>Claim ${claim.type ?? "n/a"} / ${claim.field ?? "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        ${rejected.slice(0, 4).map((item) => `
          <article>
            <span>${item.status ?? item.id}</span>
            <strong>${item.id}</strong>
            <p>${item.reasonRejectedForTrigger}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderSf33TriggerParserBridge(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const mappings = report.mappings ?? [];
  const invariants = report.requiredInvariants ?? [];
  return `
    <div class="bonus-selector-proof sf33-trigger-parser-bridge">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Bridge SF_33</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.bridgeReady ? "positive" : "blocked"}">
          ${summary.bridgeReady ? "mapping pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Preuves", summary.acceptedEvidence)}
        ${targetMetric("Mappings", summary.mappings)}
        ${targetMetric("Trigger", summary.trigger ?? "n/a")}
        ${targetMetric("Champ", summary.targetField ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Gates ${summary.reliableDpsStillBlocked ? "bloquees" : "ouvertes"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${invariants.map((item) => `<span class="blocked">${item}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${mappings.map((item) => `
          <article>
            <span>${item.status}</span>
            <strong>${item.trigger} -> ${item.targetField}</strong>
            <p>${item.sourceEvidenceId}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderUptimeLocalExhaustionConclusion(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.localEvidenceChecks ?? [];
  const requiredProofs = report.requiredProofs ?? [];
  return `
    <div class="bonus-selector-proof uptime-local-exhaustion-conclusion">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Conclusion uptime</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.userScenarioSeparated ? "positive" : "blocked"}">
          ${summary.userScenarioSeparated ? "what-if separe" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Checks", summary.localEvidenceChecks)}
        ${targetMetric("Signaux fiables", summary.reliableReadySignals)}
        ${targetMetric("Probabilites", summary.probabilityChains)}
        ${targetMetric("Focus", summary.recommendedNextFocus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Uptime fiable ${summary.uptimeReliableProven ? "prouvee" : "absente"}</span>
        <span>SF32/SF33 lies ${formatNumber(summary.chainsLinkedToBoost)}</span>
        <span>Uptime numerique ${summary.hasNumericUptime ? "oui" : "non"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.slice(0, 6).map((check) => `
          <span class="${check.status === "ready" ? "passed" : "failed"}">${check.id}: ${check.status}</span>
        `).join("")}
      </div>
      <div class="next-evidence-actions">
        ${requiredProofs.map((item) => `
          <article>
            <span>${item.priority}</span>
            <strong>${item.id}</strong>
            <p>${item.requiredEvidence}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderUptimeSourcePacket(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const claim = report.requiredClaim ?? {};
  const bridge = report.parserBridgeContract ?? {};
  const rejected = report.rejectedLocalSignals ?? [];
  return `
    <div class="bonus-selector-proof uptime-source-packet">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Packet uptime</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.acceptedEvidence > 0 ? "positive" : "blocked"}">
          ${summary.acceptedEvidence > 0 ? "preuve acceptee" : "source requise"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Asset", summary.assetId)}
        ${targetMetric("Champ", summary.targetField ?? "n/a")}
        ${targetMetric("Rejets locaux", summary.rejectedLocalSignals)}
        ${targetMetric("What-if", summary.userScenarioSeparated ? "separe" : "bloque")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Bridge ${bridge.status ?? "n/a"}</span>
        <span>Claim ${claim.type ?? "n/a"} / ${claim.field ?? "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        ${rejected.slice(0, 4).map((item) => `
          <article>
            <span>${item.sourceAssessment ?? item.id}</span>
            <strong>${item.id}</strong>
            <p>${item.reasonRejectedForReliableUptime}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderUptimeParserBridge(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const mappings = report.mappings ?? [];
  const invariants = report.requiredInvariants ?? [];
  return `
    <div class="bonus-selector-proof uptime-parser-bridge">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Bridge uptime</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.bridgeReady ? "positive" : "blocked"}">
          ${summary.bridgeReady ? "mapping pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Preuves", summary.acceptedEvidence)}
        ${targetMetric("Mappings", summary.mappings)}
        ${targetMetric("Champ", summary.targetField ?? "n/a")}
        ${targetMetric("What-if", summary.canUseForUserWhatIf ? "oui" : "non")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Gates ${summary.reliableDpsStillBlocked ? "bloquees" : "ouvertes"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${invariants.map((item) => `<span class="blocked">${item}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${mappings.map((item) => `
          <article>
            <span>${item.status}</span>
            <strong>${item.targetField} ${formatPercent(Number(item.uptime ?? 0) * 100)}</strong>
            <p>${item.sourceEvidenceId}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaBridgeReadiness(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const gates = report.gates ?? [];
  const invariants = report.requiredInvariants ?? [];
  return `
    <div class="bonus-selector-proof delta-bridge-readiness">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Readiness delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.allBridgeReady ? "positive" : "blocked"}">
          ${summary.allBridgeReady ? "revue requise" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Strict", formatNumber(summary.strictDps))}
        ${targetMetric("Delta", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("Gates pretes", `${formatNumber(summary.readyGates)}/${formatNumber(summary.gates)}`)}
        ${targetMetric("Bloquees", summary.blockedGates)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>What-if ${summary.canUseForUserWhatIf ? "possible" : "bloque"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "manuelle/interdite"}</span>
      </div>
      <div class="next-evidence-actions">
        ${gates.map((gate) => `
          <article>
            <span>${gate.status}</span>
            <strong>${gate.title}</strong>
            <p>${gate.requiredMapping} - ${gate.assessment ?? "n/a"}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${invariants.map((item) => `<span class="blocked">${item}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaPromotionReview(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.reviewChecks ?? [];
  const policy = report.promotionPolicy ?? {};
  return `
    <div class="bonus-selector-proof delta-promotion-review">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Revue promotion</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForManualReview ? "positive" : "blocked"}">
          ${summary.readyForManualReview ? "revue manuelle" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Strict", formatNumber(summary.strictDps))}
        ${targetMetric("Delta", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Reliable", summary.canUseForReliableDps ? "oui" : "non")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ranking ${summary.canUseForRanking ? "autorise" : "interdit"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "non automatique"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `
          <span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>
        `).join("")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable avant revue ${formatNumber(policy.reliableDpsBeforeReview)}</span>
        <span>What-if seul ${formatNumber(policy.whatIfOnlyDps)}</span>
        <span>Etape future ${policy.requiredFutureStep ?? "n/a"}</span>
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceIntakePackage(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const rows = report.reviewRows ?? [];
  const usage = report.usage ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-intake-package">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Package intake</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.packageReady ? "positive" : "blocked"}">
          ${summary.packageReady ? "templates prets" : "incomplet"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Templates", `${formatNumber(summary.templates)}/${formatNumber(summary.tasks)}`)}
        ${targetMetric("Ouvertes", summary.openTasks)}
        ${targetMetric("Preuves acceptees", summary.acceptedExternalEvidence)}
        ${targetMetric("Fichier", summary.targetFile ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
        <span>Bridges ${formatNumber(summary.bridgeReadyGates)}/${formatNumber(summary.bridgeReadyGates + summary.bridgeBlockedGates)}</span>
      </div>
      <div class="next-evidence-actions">
        ${rows.map((row) => `
          <article>
            <span>${row.status}</span>
            <strong>${row.title}</strong>
            <p>${(row.mustContain ?? []).join(" + ")} | rejeter: ${(row.rejects ?? []).join(", ")}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${usage.map((item) => `<span class="blocked">${item}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceDraft(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const candidate = report.candidate ?? {};
  const usage = report.usage ?? [];
  const placeholderFields = report.placeholderFields ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-draft">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Brouillon preuve</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.draftReadyForCopy ? "positive" : "blocked"}">
          ${summary.draftReadyForCopy ? "copiable" : "a remplir"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Template", summary.templateId ?? "n/a")}
        ${targetMetric("Claim", `${summary.claimType ?? "n/a"} / ${summary.claimField ?? "n/a"}`)}
        ${targetMetric("Placeholders", summary.placeholderFields)}
        ${targetMetric("Statut revue", summary.reviewerStatus ?? "pending")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
        <span>Cible ${summary.targetFile ?? "n/a"}</span>
      </div>
      <div class="next-evidence-actions">
        <article>
          <span>${candidate.id ?? "draft"}</span>
          <strong>${candidate.source?.title ?? "source a renseigner"}</strong>
          <p>${candidate.claim?.mapping ?? "mapping a renseigner"}</p>
        </article>
      </div>
      <div class="suite-invariant-list">
        ${placeholderFields.slice(0, 8).map((field) => `<span class="blocked">${field}</span>`).join("")}
      </div>
      <div class="suite-invariant-list">
        ${usage.map((item) => `<span>${item}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceDraftAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const structuralBlockers = report.structuralBlockers ?? [];
  const reviewBlockers = report.reviewBlockers ?? [];
  const placeholderFields = report.placeholderFields ?? [];
  const candidates = report.candidates ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-draft-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit brouillon</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForIntake ? "positive" : "blocked"}">
          ${summary.readyForIntake ? "pret intake" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidats", summary.candidates)}
        ${targetMetric("Placeholders", summary.placeholderFields)}
        ${targetMetric("Bloqueurs structure", summary.structuralBlockers)}
        ${targetMetric("Revue", summary.reviewBlockers)}
      </div>
      <div class="bonus-selector-signals">
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="next-evidence-actions">
        ${candidates.map((candidate) => `
          <article>
            <span>${candidate.status}</span>
            <strong>${candidate.id}</strong>
            <p>${(candidate.blockers ?? []).join(" - ") || candidate.claim?.mapping || "aucun bloqueur"}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${placeholderFields.slice(0, 6).map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${structuralBlockers.map((blocker) => `<span class="blocked">${blocker}</span>`).join("")}
        ${reviewBlockers.map((blocker) => `<span>${blocker}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceIntakeUpdatePreview(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const blockers = report.blockers ?? {};
  const preview = report.preview ?? {};
  const candidates = preview.candidates ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-intake-update-preview">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Preview intake</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.previewMergeReady ? "positive" : "blocked"}">
          ${summary.previewMergeReady ? "merge pret" : "merge refuse"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Intake actuel", summary.currentCandidates)}
        ${targetMetric("Brouillon", summary.draftCandidates)}
        ${targetMetric("Preview", summary.previewCandidates)}
        ${targetMetric("Doublons", (summary.duplicateIds ?? []).length)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="next-evidence-actions">
        ${candidates.slice(-3).map((candidate) => `
          <article>
            <span>${candidate.reviewer?.status ?? "pending"}</span>
            <strong>${candidate.id}</strong>
            <p>${candidate.claim?.type ?? "claim"} / ${candidate.claim?.field ?? "field"} | ${candidate.claim?.mapping ?? "mapping"}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${(blockers.placeholderFields ?? []).slice(0, 5).map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${(blockers.structuralBlockers ?? []).map((blocker) => `<span class="blocked">${blocker}</span>`).join("")}
        ${(blockers.reviewBlockers ?? []).map((blocker) => `<span>${blocker}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaManualPromotionGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  const nextSteps = report.nextManualSteps ?? [];
  return `
    <div class="bonus-selector-proof delta-manual-promotion-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Porte manuelle</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForHumanAction ? "positive" : "blocked"}">
          ${summary.readyForHumanAction ? "action humaine" : "bloquee"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Checks", `${formatNumber((summary.checks ?? 0) - (summary.failedChecks ?? 0))}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Preview", summary.previewMergeReady ? "prete" : "bloquee")}
        ${targetMetric("Draft", summary.draftReadyForIntake ? "copiable" : "bloque")}
        ${targetMetric("Revue", summary.promotionReviewReady ? "ouverte" : "bloquee")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ranking ${summary.canUseForRanking ? "oui" : "non"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="next-evidence-actions">
        ${checks.map((check) => `
          <article>
            <span>${check.status}</span>
            <strong>${check.id}</strong>
            <p>${check.finding}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${nextSteps.map((step) => `<span>${step}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaHumanActionPlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const fillTasks = report.fillTasks ?? [];
  const actions = report.orderedActions ?? [];
  return `
    <div class="bonus-selector-proof delta-human-action-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Actions manuelles</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForHumanAction ? "positive" : "blocked"}">
          ${summary.readyForHumanAction ? "pret" : "a remplir"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Claim", `${summary.claimType ?? "n/a"} / ${summary.claimField ?? "n/a"}`)}
        ${targetMetric("Placeholders", summary.placeholderFields)}
        ${targetMetric("Actions", `${formatNumber(summary.readyActions)}/${formatNumber(summary.actions)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ranking ${summary.canUseForRanking ? "oui" : "non"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="next-evidence-actions">
        ${fillTasks.map((task) => `
          <article>
            <span>${task.field}</span>
            <strong>${task.hint}</strong>
            <p>Obligatoire: ${task.required ? "oui" : "non"}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${actions.map((action) => `<span class="${action.status === "ready" ? "positive" : "blocked"}">${action.id}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceFillForm(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const fields = report.fields ?? [];
  const instructions = report.instructions ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-fill-form">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Formulaire preuve</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForDraftPatch ? "positive" : "blocked"}">
          ${summary.readyForDraftPatch ? "pret patch" : "vide"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Claim", `${summary.claimType ?? "n/a"} / ${summary.claimField ?? "n/a"}`)}
        ${targetMetric("Champs", `${formatNumber(summary.completedFields)}/${formatNumber(summary.fields)}`)}
        ${targetMetric("Requis", summary.requiredFields)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ranking ${summary.canUseForRanking ? "oui" : "non"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="next-evidence-actions">
        ${fields.map((field) => `
          <article>
            <span>${field.status}</span>
            <strong>${field.label}</strong>
            <p>${field.hint}</p>
          </article>
        `).join("")}
      </div>
      <div class="suite-invariant-list">
        ${instructions.map((item) => `<span>${item}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceFilledDraft(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const missing = report.missingFields ?? [];
  const placeholders = report.remainingPlaceholderFields ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-filled-draft">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Patch brouillon</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForDraftAudit ? "positive" : "blocked"}">
          ${summary.readyForDraftAudit ? "pret audit" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Champs", `${formatNumber(summary.completedFields)}/${formatNumber(summary.fields)}`)}
        ${targetMetric("Manquants", summary.missingFields)}
        ${targetMetric("Placeholders", summary.remainingPlaceholderFields)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ranking ${summary.canUseForRanking ? "oui" : "non"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${missing.map((field) => `<span class="blocked">${field}</span>`).join("") || `<span class="positive">Aucun champ manquant</span>`}
        ${placeholders.map((field) => `<span class="blocked">${field}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceFilledDraftAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const blockers = report.blockers ?? {};
  const missing = blockers.missingFields ?? [];
  const placeholders = blockers.placeholderFields ?? blockers.remainingPlaceholderFields ?? [];
  const structural = blockers.structuralBlockers ?? [];
  const review = blockers.reviewBlockers ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-filled-draft-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit patch</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForPreview ? "positive" : "blocked"}">
          ${summary.readyForPreview ? "pret preview" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Audit intake", summary.auditReadyForIntake ? "pret" : "bloque")}
        ${targetMetric("Structure", summary.structuralBlockers)}
        ${targetMetric("Revue", summary.reviewBlockers)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${missing.map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${placeholders.map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${structural.map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${review.map((field) => `<span>${field}</span>`).join("")}
        ${missing.length + placeholders.length + structural.length + review.length === 0 ? `<span class="positive">Aucun bloqueur</span>` : ""}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceFilledDraftIntakePreview(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const blockers = report.blockers ?? {};
  const duplicates = blockers.duplicateIds ?? [];
  const missing = blockers.missingFields ?? [];
  const placeholders = blockers.placeholderFields ?? blockers.remainingPlaceholderFields ?? [];
  const review = blockers.reviewBlockers ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-filled-draft-intake-preview">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Preview patch</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.previewMergeReady ? "positive" : "blocked"}">
          ${summary.previewMergeReady ? "merge pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidats", `${formatNumber(summary.previewCandidates)}/${formatNumber(summary.currentCandidates)}`)}
        ${targetMetric("Brouillon", summary.draftCandidates)}
        ${targetMetric("Doublons", duplicates.length)}
        ${targetMetric("Statut", summary.reviewerStatus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${duplicates.map((id) => `<span class="blocked">duplicate:${id}</span>`).join("")}
        ${missing.map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${placeholders.map((field) => `<span class="blocked">${field}</span>`).join("")}
        ${review.map((field) => `<span>${field}</span>`).join("")}
        ${duplicates.length + missing.length + placeholders.length + review.length === 0 ? `<span class="positive">Aucun bloqueur</span>` : ""}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceIntakeCopyGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  const steps = report.manualSteps ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-intake-copy-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Copie intake</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForManualCopy ? "positive" : "blocked"}">
          ${summary.readyForManualCopy ? "copiable" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Preview", summary.previewMergeReady ? "prete" : "bloquee")}
        ${targetMetric("Statut", summary.reviewerStatus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${steps.map((step) => `
          <article>
            <span>manuel</span>
            <strong>${step}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidencePostCopyIntake(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const blockers = report.blockers ?? {};
  const targetBlockers = blockers.targetCandidateBlockers ?? [];
  const failedCopyChecks = blockers.copyGateFailedChecks ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-post-copy-intake">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Post-copie</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForManualReview ? "positive" : "blocked"}">
          ${summary.readyForManualReview ? "pret revue" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Ajoutes", summary.addedCandidates)}
        ${targetMetric("Intake", `${formatNumber(summary.auditPending)}/${formatNumber(summary.auditCandidates)}`)}
        ${targetMetric("Statut", summary.targetCandidateStatus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${failedCopyChecks.map((check) => `<span class="failed">${check}</span>`).join("")}
        ${targetBlockers.map((blocker) => `<span class="${blocker === "manual-review-required" ? "" : "failed"}">${blocker}</span>`).join("")}
        ${failedCopyChecks.length + targetBlockers.length === 0 ? `<span class="positive">Aucun bloqueur</span>` : ""}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceManualReviewGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  const required = report.reviewerDecisionTemplate?.requiredReviewerInputs ?? [];
  const forbidden = report.reviewerDecisionTemplate?.forbiddenAutomaticActions ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-manual-review-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Revue preuve</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForReviewerDecision ? "positive" : "blocked"}">
          ${summary.readyForReviewerDecision ? "pret decision" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Statut", summary.targetCandidateStatus ?? "n/a")}
        ${targetMetric("Review", summary.reviewBlockerPresent ? "requise" : "absente")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${required.map((item) => `
          <article>
            <span>requis</span>
            <strong>${item}</strong>
          </article>
        `).join("")}
        ${forbidden.map((item) => `
          <article>
            <span>interdit</span>
            <strong>${item}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceReviewDecisionPackage(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.readinessChecks ?? [];
  const fields = report.decisionInputTemplate?.requiredFields ?? [];
  const statuses = report.decisionInputTemplate?.requiredStatusValues ?? report.decisionInputTemplate?.allowedStatuses ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-review-decision-package">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Decision reviewer</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForDecisionInput ? "positive" : "blocked"}">
          ${summary.readyForDecisionInput ? "pret saisie" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Statut", summary.targetCandidateStatus ?? "n/a")}
        ${targetMetric("Decisions", statuses.join(" / ") || "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${fields.map((field) => `
          <article>
            <span>champ</span>
            <strong>${field}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidenceReviewDecisionAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.auditChecks ?? [];
  const fields = Object.keys(report.template?.reviewer ?? {});
  return `
    <div class="bonus-selector-proof delta-evidence-review-decision-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit decision</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForPromotionAudit ? "positive" : "blocked"}">
          ${summary.readyForPromotionAudit ? "pret audit" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Decision", summary.reviewerStatus ?? "absente")}
        ${targetMetric("Rejet", summary.decisionRejected ? "oui" : "non")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${fields.map((field) => `
          <article>
            <span>template</span>
            <strong>reviewer.${field}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaEvidencePromotionAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.auditChecks ?? [];
  const required = report.implementationContract?.requiredBeforeWrite ?? [];
  return `
    <div class="bonus-selector-proof delta-evidence-promotion-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit promotion</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForPromotionImplementation ? "positive" : "blocked"}">
          ${summary.readyForPromotionImplementation ? "pret implementation" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Strict", formatNumber(summary.strictDps))}
        ${targetMetric("Delta", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("Propose", formatNumber(summary.proposedReliableDps))}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${required.map((item) => `
          <article>
            <span>requis</span>
            <strong>${item}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaPromotionImplementationDryRun(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.dryRunChecks ?? [];
  const patch = report.patchPreview ?? {};
  const regressions = report.regressionTargets ?? [];
  return `
    <div class="bonus-selector-proof delta-promotion-implementation-dry-run">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Dry-run promotion</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.patchPreviewReady ? "positive" : "blocked"}">
          ${summary.patchPreviewReady ? "preview prete" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Avant", formatNumber(patch.before ?? summary.strictDps))}
        ${targetMetric("Apres", formatNumber(patch.after ?? summary.proposedReliableDps))}
        ${targetMetric("Delta", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture dataset ${summary.writesTargetDataset ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${regressions.map((item) => `
          <article>
            <span>regression</span>
            <strong>${item.id}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaPromotionApplicationGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  const required = report.applyContract?.requiredBeforeApply ?? [];
  return `
    <div class="bonus-selector-proof delta-promotion-application-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Porte application</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.manualApplyAllowed ? "positive" : "blocked"}">
          ${summary.manualApplyAllowed ? "application manuelle" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Avant", formatNumber(summary.patchBefore))}
        ${targetMetric("Apres", formatNumber(summary.patchAfter))}
        ${targetMetric("Propose", formatNumber(summary.proposedReliableDps))}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture dataset ${summary.writesTargetDataset ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${required.map((item) => `
          <article>
            <span>avant apply</span>
            <strong>${item}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaPromotionApplyPlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.planChecks ?? [];
  const steps = report.applySteps ?? [];
  const patch = report.patchPreview ?? {};
  return `
    <div class="bonus-selector-proof delta-promotion-apply-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Plan application</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.applyPlanReady ? "positive" : "blocked"}">
          ${summary.applyPlanReady ? "plan pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Avant", formatNumber(summary.patchBefore ?? patch.before))}
        ${targetMetric("Apres", formatNumber(summary.patchAfter ?? patch.after))}
        ${targetMetric("Propose", formatNumber(summary.proposedReliableDps))}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture dataset ${summary.writesTargetDataset ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${steps.map((step) => `
          <article>
            <span>${step.required ? "requis" : "option"}</span>
            <strong>${step.id}</strong>
            <p>${step.action ?? ""}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderUserWhatIfContract(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.contractChecks ?? [];
  const samples = report.samples ?? [];
  const sample50 = samples.find((sample) => Number(sample.uptime) === 0.5 && sample.sf33Active === true);
  return `
    <div class="bonus-selector-proof user-whatif-contract">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Contrat what-if</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.failedChecks === 0 ? "positive" : "blocked"}">
          ${summary.failedChecks === 0 ? "stable" : "a corriger"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Strict", formatNumber(summary.strictDps))}
        ${targetMetric("Delta", `+${formatNumber(summary.blockedDeltaDps)}`)}
        ${targetMetric("50% uptime", sample50 ? formatNumber(sample50.configuredWhatIfDps) : "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Ranking ${summary.canUseForRanking ? "autorise" : "strict-only"}</span>
        <span>Export ${report.exportPolicy?.includeInBuildExport ? "oui" : "non"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `
          <span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceIntake(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const requirements = report.requirements ?? {};
  const candidates = report.candidates ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-intake">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Preuves externes</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.accepted > 0 ? "positive" : "blocked"}">
          ${summary.accepted > 0 ? "a relier" : "requises"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidats", summary.candidates)}
        ${targetMetric("Acceptes", summary.accepted)}
        ${targetMetric("En attente", summary.pending)}
        ${targetMetric("Rejetes", summary.rejected)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Domaines ${(summary.domainsCovered ?? []).join(", ") || "aucun"}</span>
        <span>Acceptes ${(summary.acceptedDomainsCovered ?? []).join(", ") || "aucun"}</span>
      </div>
      <div class="next-evidence-actions">
        ${candidates.slice(0, 4).map((item) => `
          <article>
            <span>${item.status}</span>
            <strong>${item.domain || item.id}</strong>
            <p>${(item.blockers ?? []).join(" - ") || item.claim?.field || "preuve candidate"}</p>
          </article>
        `).join("") || `
          <article>
            <span>modele</span>
            <strong>inputs/external-evidence-candidates.json</strong>
            <p>${(requirements.requiredFields ?? []).slice(0, 4).join(" - ")}</p>
          </article>
        `}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderNextEvidenceRoadmap(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const assessment = summary.assessment ?? {};
  const roadmap = report.roadmap ?? [];
  return `
    <div class="bonus-selector-proof next-evidence-roadmap">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Plan prochaines preuves</strong>
          <span>${assessment.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.promotionReady ? "positive" : "blocked"}">
          ${summary.promotionReady ? "pret" : "preuves requises"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Domaines", summary.domains)}
        ${targetMetric("Bloques", summary.blockedDomains)}
        ${targetMetric("Epuises", summary.exhaustedDomains)}
        ${targetMetric("Actions", summary.actions)}
      </div>
      <div class="next-evidence-actions">
        ${roadmap.map((item) => `
          <article>
            <span>${item.priority}</span>
            <strong>${item.title}</strong>
            <p>${item.unlocks}</p>
          </article>
        `).join("")}
      </div>
      <p>${assessment.finding ?? ""}</p>
      <p>${assessment.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalDeltaEvidencePlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const proofs = report.requiredProofs ?? [];
  return `
    <div class="bonus-selector-proof external-delta-evidence-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Preuves externes delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyProofs === summary.requiredProofs ? "positive" : "blocked"}">
          ${summary.readyProofs === summary.requiredProofs ? "pret bridge" : "preuves manquantes"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Requises", summary.requiredProofs)}
        ${targetMetric("Pretes", summary.readyProofs)}
        ${targetMetric("Manquantes", summary.missingProofs)}
        ${targetMetric("Focus", summary.recommendedNextFocus ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Bridge ${summary.bridgeDeltaStatus ?? "n/a"}</span>
        <span>Local epuise ${summary.allLocalEvidenceExhausted ? "oui" : "non"}</span>
      </div>
      <div class="next-evidence-actions">
        ${proofs.map((item) => `
          <article>
            <span>${item.priority} - ${item.status}</span>
            <strong>${item.title}</strong>
            <p>${item.acceptedClaim?.type ?? "claim"} / ${item.acceptedClaim?.field ?? "field"}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalDeltaEvidenceWorkorder(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const tasks = report.tasks ?? [];
  return `
    <div class="bonus-selector-proof external-delta-evidence-workorder">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Collecte delta</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.openTasks === 0 ? "positive" : "blocked"}">
          ${summary.openTasks === 0 ? "pret bridge" : "a collecter"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Taches", summary.tasks)}
        ${targetMetric("Pretes", summary.readyTasks)}
        ${targetMetric("Ouvertes", summary.openTasks)}
        ${targetMetric("Prochaine", summary.nextTaskId ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Preuves acceptees ${formatNumber(summary.acceptedExternalEvidence)}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="next-evidence-actions">
        ${tasks.map((item) => `
          <article>
            <span>${item.priority} - ${item.status}</span>
            <strong>${item.id}</strong>
            <p>${item.claim?.type ?? "claim"} / ${item.claim?.field ?? "field"}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionPack(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const targetTask = report.targetTask ?? {};
  const snippet = report.candidateSnippet ?? {};
  const mustContain = targetTask.mustContain ?? [];
  const rejects = targetTask.rejects ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-submission-pack">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Soumission preuve</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.candidateSnippetReady ? "positive" : "blocked"}">
          ${summary.candidateSnippetReady ? "brouillon pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Tache", summary.nextTaskId ?? "n/a")}
        ${targetMetric("Claim", summary.claimType ?? "n/a")}
        ${targetMetric("Champ", summary.claimField ?? "n/a")}
        ${targetMetric("Candidats", summary.existingCandidates)}
      </div>
      <div class="bonus-selector-signals">
        <span>Reviewer ${summary.reviewerStatus ?? "n/a"}</span>
        <span>Ecrit intake ${summary.writesIntake ? "oui" : "non"}</span>
        <span>Bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="next-evidence-actions">
        <article>
          <span>draft</span>
          <strong>${snippet.id ?? "n/a"}</strong>
          <p>${snippet.claim?.excerpt ?? ""}</p>
        </article>
        <article>
          <span>must contain</span>
          <strong>${mustContain.join(" + ") || "n/a"}</strong>
          <p>${targetTask.title ?? ""}</p>
        </article>
        <article>
          <span>rejeter</span>
          <strong>${rejects.length} regles</strong>
          <p>${rejects.join(", ")}</p>
        </article>
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-submission-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Gate soumission</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForIntakeCopy ? "positive" : "blocked"}">
          ${summary.readyForIntakeCopy ? "copie possible" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Claim", summary.claimType ?? "n/a")}
        ${targetMetric("Champ", summary.claimField ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Reviewer ${summary.reviewerStatus ?? "n/a"}</span>
        <span>Ecrit intake ${summary.writesIntake ? "oui" : "non"}</span>
        <span>Bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionIntakePreview(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const candidate = report.candidatePreview ?? {};
  return `
    <div class="bonus-selector-proof external-evidence-submission-intake-preview">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Preview intake</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.previewMergeReady ? "positive" : "blocked"}">
          ${summary.previewMergeReady ? "merge pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Avant", formatNumber(summary.originalCandidates))}
        ${targetMetric("Preview", formatNumber(summary.previewCandidates))}
        ${targetMetric("Ajouts", formatNumber(summary.addedCandidates))}
      </div>
      <div class="bonus-selector-signals">
        <span>Gate ${summary.gateReadyForIntakeCopy ? "pret" : "bloque"}</span>
        <span>Reviewer ${summary.reviewerStatus ?? "n/a"}</span>
        <span>Ecrit intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="next-evidence-actions">
        <article>
          <span>preview</span>
          <strong>${candidate.id ?? "aucun candidat"}</strong>
          <p>${candidate.claim?.mapping ?? summary.assessment?.nextAction ?? ""}</p>
        </article>
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionPostCopyIntake(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const blockers = report.blockers ?? {};
  return `
    <div class="bonus-selector-proof external-evidence-submission-post-copy-intake">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Post-copy intake</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForManualReview ? "positive" : "blocked"}">
          ${summary.readyForManualReview ? "revue prete" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Ajouts", formatNumber(summary.addedCandidates))}
        ${targetMetric("Pending", formatNumber(summary.auditPending))}
        ${targetMetric("Acceptes", formatNumber(summary.auditAccepted))}
      </div>
      <div class="bonus-selector-signals">
        <span>Status ${summary.targetCandidateStatus ?? "n/a"}</span>
        <span>Ecrit intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="next-evidence-actions">
        <article>
          <span>blockers</span>
          <strong>${(blockers.targetCandidateBlockers ?? []).join(", ") || "n/a"}</strong>
          <p>${summary.assessment?.nextAction ?? ""}</p>
        </article>
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionManualReviewGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  const template = report.reviewerDecisionTemplate ?? {};
  return `
    <div class="bonus-selector-proof external-evidence-submission-manual-review-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Revue soumission</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForReviewerDecision ? "positive" : "blocked"}">
          ${summary.readyForReviewerDecision ? "decision humaine" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Status", summary.targetCandidateStatus ?? "n/a")}
        ${targetMetric("Blocker", summary.reviewBlockerPresent ? "present" : "absent")}
      </div>
      <div class="bonus-selector-signals">
        <span>Decisions ${(template.allowedStatuses ?? []).join("/") || "n/a"}</span>
        <span>Ecrit intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionReviewDecisionPackage(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.readinessChecks ?? [];
  const fields = report.decisionInputTemplate?.requiredFields ?? [];
  const statuses = report.decisionInputTemplate?.requiredStatusValues ?? report.decisionInputTemplate?.allowedStatuses ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-submission-review-decision-package">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Decision soumission</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForDecisionInput ? "positive" : "blocked"}">
          ${summary.readyForDecisionInput ? "pret saisie" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Statut", summary.targetCandidateStatus ?? "n/a")}
        ${targetMetric("Decisions", statuses.join(" / ") || "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${fields.map((field) => `
          <article>
            <span>champ</span>
            <strong>${field}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionReviewDecisionAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.auditChecks ?? [];
  const fields = Object.keys(report.template?.reviewer ?? {});
  return `
    <div class="bonus-selector-proof external-evidence-submission-review-decision-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit decision soumission</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForPromotionAudit ? "positive" : "blocked"}">
          ${summary.readyForPromotionAudit ? "pret audit" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
        ${targetMetric("Decision", summary.reviewerStatus ?? "absente")}
        ${targetMetric("Rejet", summary.decisionRejected ? "oui" : "non")}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${fields.map((field) => `
          <article>
            <span>template</span>
            <strong>reviewer.${field}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionPromotionAudit(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.auditChecks ?? [];
  const required = report.implementationContract?.requiredBeforeWrite ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-submission-promotion-audit">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Audit promotion externe</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.readyForPromotionImplementation ? "positive" : "blocked"}">
          ${summary.readyForPromotionImplementation ? "pret implementation" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Strict", summary.strictDps)}
        ${targetMetric("Delta", summary.blockedDeltaDps)}
        ${targetMetric("Propose", summary.proposedReliableDps)}
      </div>
      <div class="bonus-selector-signals">
        <span>Decision approved ${summary.decisionAcceptedForPromotionReview ? "oui" : "non"}</span>
        <span>Ecriture intake ${summary.writesRealIntake ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${required.map((item) => `
          <article>
            <span>requis avant ecriture</span>
            <strong>${item}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionImplementationDryRun(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.dryRunChecks ?? [];
  const patch = report.patchPreview ?? {};
  const regressions = report.regressionTargets ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-submission-implementation-dry-run">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Dry-run externe</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.patchPreviewReady ? "positive" : "blocked"}">
          ${summary.patchPreviewReady ? "patch pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Avant", patch.before ?? summary.strictDps)}
        ${targetMetric("Apres", patch.after ?? summary.proposedReliableDps)}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecrit target ${summary.writesTargetDataset ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${regressions.map((target) => `
          <article>
            <span>regression</span>
            <strong>${target.id}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionApplicationGate(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.gateChecks ?? [];
  const patch = report.patchPreview ?? {};
  const required = report.applyContract?.requiredBeforeApply ?? [];
  return `
    <div class="bonus-selector-proof external-evidence-submission-application-gate">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Porte externe</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.manualApplyAllowed ? "positive" : "blocked"}">
          ${summary.manualApplyAllowed ? "manuel autorise" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Avant", summary.patchBefore ?? patch.before)}
        ${targetMetric("Apres", summary.patchAfter ?? patch.after)}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecrit target ${summary.writesTargetDataset ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${required.map((item) => `
          <article>
            <span>avant application</span>
            <strong>${item}</strong>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderExternalEvidenceSubmissionApplyPlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const checks = report.planChecks ?? [];
  const steps = report.applySteps ?? [];
  const patch = report.patchPreview ?? {};
  return `
    <div class="bonus-selector-proof external-evidence-submission-apply-plan">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Plan externe</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.applyPlanReady ? "positive" : "blocked"}">
          ${summary.applyPlanReady ? "plan pret" : "bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Candidat", summary.candidateId ?? "n/a")}
        ${targetMetric("Avant", summary.patchBefore ?? patch.before)}
        ${targetMetric("Apres", summary.patchAfter ?? patch.after)}
        ${targetMetric("Checks", `${formatNumber(summary.checks - summary.failedChecks)}/${formatNumber(summary.checks)}`)}
      </div>
      <div class="bonus-selector-signals">
        <span>Ecrit target ${summary.writesTargetDataset ? "oui" : "non"}</span>
        <span>Accepted bridge ${summary.acceptedForBridge ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canModifyReliableDps ? "modifiable" : "protege"}</span>
        <span>Promotion ${summary.promotionReady ? "prete" : "bloquee"}</span>
      </div>
      <div class="suite-invariant-list">
        ${checks.map((check) => `<span class="${check.status === "passed" ? "passed" : "failed"}">${check.id}: ${check.status}</span>`).join("")}
      </div>
      <div class="next-evidence-actions">
        ${steps.map((step) => `
          <article>
            <span>${step.required ? "requis" : "optionnel"}</span>
            <strong>${step.id}</strong>
            <p>${step.action ?? ""}</p>
          </article>
        `).join("")}
      </div>
      <p>${summary.assessment?.finding ?? ""}</p>
      <p>${summary.assessment?.nextAction ?? ""}</p>
    </div>
  `;
}

function renderAspectSlotNextSourcePlan(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const assessment = summary.assessment ?? {};
  const target = report.target ?? {};
  return `
    <div class="bonus-selector-proof aspect-slot-conclusion">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Conclusion slots ${target.assetId ?? "n/a"}</strong>
          <span>${assessment.kind ?? "n/a"}</span>
        </div>
        <div class="${assessment.slotConstraintReady ? "positive" : "blocked"}">
          ${assessment.slotConstraintReady ? "slots prouves" : "slots bloques"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Etapes", summary.steps)}
        ${targetMetric("Pretes", summary.readySteps)}
        ${targetMetric("Bloquees", summary.blockedSteps)}
        ${targetMetric("Preuves", summary.usableProofSignals)}
      </div>
      <div class="bonus-selector-signals">
        <span>Local epuise ${summary.existingEvidenceExhausted ? "oui" : "non"}</span>
        <span>Champs slot directs ${formatNumber(summary.directSlotFieldStrings)}</span>
        <span>Structure forte ${formatNumber(summary.strongStructuralCandidates)}</span>
      </div>
      <div class="slot-step-list">
        ${(report.steps ?? []).map((step) => `
          <span class="${step.status === "ready" ? "ready" : "blocked"}">${step.title}: ${step.status}</span>
        `).join("")}
      </div>
      <p>${assessment.finding ?? ""}</p>
      <p>${assessment.nextAction ?? ""}</p>
    </div>
  `;
}

function renderDeltaPromotionConclusion(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const assessment = summary.assessment ?? {};
  return `
    <div class="bonus-selector-proof delta-promotion-conclusion">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Conclusion delta ${formatNumber(summary.candidateDeltaDps)}</strong>
          <span>${assessment.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.canUseForReliableDps ? "positive" : "blocked"}">
          ${summary.canUseForReliableDps ? "fiable" : "what-if bloque"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Preuves", summary.proofs)}
        ${targetMetric("Pretes", summary.readyProofs)}
        ${targetMetric("Bloquees", summary.blockedProofs)}
        ${targetMetric("Confiance", assessment.confidence ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Local epuise ${summary.localEvidenceExhausted ? "oui" : "non"}</span>
        <span>Reliable DPS ${summary.canUseForReliableDps ? "oui" : "non"}</span>
        <span>What-if visible ${summary.canExposeAsWhatIf ? "oui" : "non"}</span>
      </div>
      <div class="delta-proof-list">
        ${(report.proofs ?? []).map((proof) => `
          <span class="${proof.status === "ready" ? "ready" : "blocked"}">${proof.title}: ${proof.status}</span>
        `).join("")}
      </div>
      <p>${assessment.finding ?? ""}</p>
      <p>${assessment.nextAction ?? ""}</p>
    </div>
  `;
}

function renderBonusSelectorSourceProof(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const signals = report.sourceSignals ?? {};
  const families = report.selectorFamilies ?? [];
  return `
    <div class="bonus-selector-proof">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Preuve selecteurs Bonus %</strong>
          <span>${summary.assessment?.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.promotionReady ? "positive" : "blocked"}">
          ${summary.promotionReady ? "promotion possible" : "promotion bloquee"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Selecteurs", summary.selectorsObserved)}
        ${targetMetric("Source nommee", summary.sourceNamed ? "oui" : "non")}
        ${targetMetric("Familles classees", summary.selectorFamiliesClassified)}
        ${targetMetric("Familles bloquees", summary.blockedFamilies)}
      </div>
      <div class="bonus-selector-family-list">
        ${families.map(renderBonusSelectorFamily).join("")}
      </div>
      <div class="bonus-selector-signals">
        <span>Tables nommees ${formatNumber(signals.namedTable?.independentCandidates)} - contextes generes ${formatNumber(signals.namedTable?.generatedContexts)}</span>
        <span>Dictionnaire proche ${formatNumber(signals.decodedDictionary?.dictionaryHitsNearWatchedNumbers)} - bonus hits ${formatNumber(signals.decodedDictionary?.bonusPercentHits)}</span>
        <span>Contextes table utiles ${formatNumber(signals.localTableAlternatives?.usefulTableCandidateContexts)} - source potentielle ${formatNumber(signals.tableNumericContexts?.potentialSourceContexts)}</span>
      </div>
    </div>
  `;
}

function renderAdditiveBucketSourceConclusion(report) {
  if (!report) return "";
  const summary = report.summary ?? {};
  const assessment = summary.assessment ?? {};
  return `
    <div class="bonus-selector-proof additive-source-conclusion">
      <div class="bonus-selector-proof-head">
        <div>
          <strong>Conclusion source additive</strong>
          <span>${assessment.kind ?? "n/a"}</span>
        </div>
        <div class="${summary.promotionReady ? "positive" : "blocked"}">
          ${summary.promotionReady ? "promotion possible" : "promotion bloquee"}
        </div>
      </div>
      <div class="bonus-selector-proof-metrics">
        ${targetMetric("Pistes", summary.probes)}
        ${targetMetric("Pretes", summary.readyProbes)}
        ${targetMetric("Bloquees", summary.blockedProbes)}
        ${targetMetric("Confiance", assessment.confidence ?? "n/a")}
      </div>
      <div class="bonus-selector-signals">
        <span>Local epuise ${summary.localEvidenceExhausted ? "oui" : "non"}</span>
        <span>Source nommee ${summary.sourceNamed ? "oui" : "non"}</span>
        <span>Bucket additif ${summary.additiveBucketReady ? "pret" : "bloque"}</span>
      </div>
      <div class="additive-source-next">
        ${(summary.nextRequiredEvidence ?? []).map((item) => `<span>${item}</span>`).join("")}
      </div>
      <p>${assessment.finding ?? ""}</p>
      <p>${assessment.nextAction ?? ""}</p>
    </div>
  `;
}

function renderBonusSelectorFamily(family) {
  return `
    <article class="bonus-selector-family ${family.ready ? "ready" : "blocked"}">
      <div>
        <span>Selector</span>
        <strong>${family.selector}</strong>
      </div>
      <div>
        <span>Assets</span>
        <strong>${family.assets?.join(", ") || "n/a"}</strong>
      </div>
      <div>
        <span>Bucket</span>
        <strong>${family.bucketFamily ?? "unknown"}</strong>
      </div>
      <p>${(family.blockers ?? []).join(" - ")}</p>
    </article>
  `;
}

function renderTargetBucketEnginePlan(bucketEngine) {
  if (!bucketEngine) return "";
  const summary = bucketEngine.summary ?? {};
  const buckets = bucketEngine.buckets ?? {};
  const gates = bucketEngine.gates ?? [];
  const classPlans = bucketEngine.classPlans ?? [];
  const bestStrictClassPlan = bucketEngine.bestStrictClassPlan ?? null;
  return `
    <div class="target-bucket-engine-plan">
      <div>
        <strong>Moteur buckets</strong>
        <span>${summary.status ?? "n/a"}</span>
      </div>
      <div class="target-bucket-engine-metrics">
        ${targetMetric("Strict calcule", summary.calculatedStrictDps)}
        ${targetMetric("Parite", summary.parityDelta)}
        ${targetMetric("Delta bloque", `+${formatNumber(summary.blockedCandidateDelta)}`)}
        ${targetMetric("What-if", summary.whatIfDps)}
      </div>
      <div class="target-bucket-class-summary">
        <span>Plans classe ${formatNumber(summary.classPlans)}</span>
        <span>Chargeables ${formatNumber(summary.loadableClassPlans)}</span>
        <span>Fiables ${formatNumber(summary.reliableClassPlans)}</span>
        <span>Base ${bestStrictClassPlan ? `${bestStrictClassPlan.class} ${formatNumber(bestStrictClassPlan.reliableDps)}` : "aucune"}</span>
      </div>
      <div class="target-bucket-breakdown">
        <span>Base ${formatNumber(buckets.strictBase)}</span>
        <span>Additif ${formatPercent(buckets.additivePct)}</span>
        <span>Multi x${formatMultiplier(buckets.multiplicativeProduct)}</span>
        <span>Uptime x${formatMultiplier(buckets.uptimeProduct)}</span>
        <span>Caps ${formatNumber(buckets.caps)}</span>
      </div>
      <div class="target-bucket-gates">
        ${gates.map((gate) => `<span class="${gate.status === "passed" ? "passed" : "failed"}">${gate.id}</span>`).join("")}
      </div>
      <div class="target-bucket-class-plans">
        ${classPlans.map(renderBucketClassPlan).join("")}
      </div>
    </div>
  `;
}

function renderBucketClassPlan(plan) {
  const failed = plan.failedGateIds ?? [];
  const loadable = plan.canLoadAsWorkingBase === true;
  const reliable = plan.reliableOptimizerReady === true;
  return `
    <article class="${loadable ? "loadable" : "blocked"}">
      <div>
        <strong>${plan.class}</strong>
        <span>${plan.status}</span>
      </div>
      <div class="target-bucket-class-metrics">
        <span>Strict ${formatNumber(plan.reliableDps)}</span>
        <span>Delta +${formatNumber(plan.blockedCandidateDelta)}</span>
        <span>Assets ${(plan.assetIds ?? []).join(", ")}</span>
      </div>
      <div class="target-bucket-class-gates">
        ${(plan.gates ?? []).map((gate) => `<span class="${gate.status === "passed" ? "passed" : "failed"}">${gate.id}</span>`).join("")}
      </div>
      <p>${failed.length ? `Bloque: ${failed.join(", ")}` : "Toutes les portes classe sont ouvertes."}</p>
      <button
        class="ghost-button target-bucket-class-apply"
        type="button"
        data-asset-ids="${(plan.assetIds ?? []).join(",")}"
        data-plan-label="${plan.class}"
        data-plan-status="${reliable ? "fiable" : loadable ? "base stricte" : "bloque"}"
        ${loadable ? "" : "disabled"}
      >Charger base</button>
    </article>
  `;
}

function renderTargetOptimizerActionQueue(actions) {
  if (!actions.length) return "";
  return `
    <div class="target-action-queue">
      <strong>File d'actions</strong>
      ${actions.slice(0, 6).map((action) => `
        <article class="target-action-card ${action.priority}">
          <span>#${action.rank} ${action.priority}</span>
          <strong>${action.title}</strong>
          <p>${action.action}</p>
          ${renderActionSubPlan(action.subPlan)}
          <em>${action.focus} - ${action.classes?.join(", ") || "global"}</em>
        </article>
      `).join("")}
    </div>
  `;
}

function renderActionSubPlan(subPlan) {
  if (!subPlan) return "";
  const blockerKinds = subPlan.blockerConclusion?.blockerKinds ?? [];
  return `
    <div class="target-action-subplan">
      <span>${subPlan.blockedSteps ?? 0} bloquees / ${subPlan.readySteps ?? 0} pretes</span>
      <strong>${subPlan.nextStepTitle ?? "Sous-plan"}</strong>
      ${blockerKinds.length ? `<em>${blockerKinds.join(" - ")}</em>` : ""}
    </div>
  `;
}

function renderTargetOptimizerRecommendation(row) {
  const blocked = Number(row.blockedCandidateDelta || 0) > 0;
  const constraintBlocked = row.strictConstraintValid === false;
  const issues = row.constraintSummary?.issueKinds ?? [];
  return `
    <article class="target-optimizer-card ${blocked || constraintBlocked ? "blocked-plan" : ""}">
      <div>
        <span>Classe</span>
        <strong>${row.class}</strong>
      </div>
      <div>
        <span>DPS strict</span>
        <strong>${formatNumber(row.strictDps)}</strong>
      </div>
      <div>
        <span>Delta bloque</span>
        <strong class="${blocked ? "blocked" : ""}">+${formatNumber(row.blockedCandidateDelta)}</strong>
      </div>
      <div>
        <span>Statut</span>
        <strong class="${constraintBlocked || blocked ? "blocked" : "positive"}">${row.status}</strong>
      </div>
      <p>${row.note}</p>
      ${issues.length ? `<p>Blocages contraintes : ${issues.join(", ")}</p>` : `<p>Contraintes minimales : OK</p>`}
      ${renderTargetOptimizerReliability(row)}
      <button
        class="ghost-button target-optimizer-apply"
        type="button"
        data-asset-ids="${row.assetIds.join(",")}"
        data-plan-label="${row.class}"
        data-plan-status="${row.reliableOptimizerReady ? "fiable" : row.strictConstraintValid ? "base stricte" : "bloque"}"
      >Charger</button>
    </article>
  `;
}

function renderTargetOptimizerReliability(row) {
  const reliability = row.reliability;
  if (!reliability) return "";
  const decision = row.optimizerDecision ?? {};
  return `
    <div class="target-reliability">
      <div>
        <strong>Fiabilite ${reliability.passed}/${reliability.passed + reliability.failed}</strong>
        <span>Ranking ${decision.rankingMode ?? "strict-only"} - prochaine porte ${decision.nextGate ?? "aucune"}</span>
      </div>
      <div class="target-reliability-gates">
        ${(reliability.gates ?? []).map((gate) => `
          <span class="${gate.status === "passed" ? "passed" : "failed"}">
            <strong>${gate.id}</strong>
            <em>${gate.status}</em>
          </span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderBlockerAuditPanel() {
  const audit = state.blockerAudit;
  if (!audit) {
    byId("blockerAuditPanel").innerHTML = `<div class="optimizer-empty">Aucun diagnostic de blocages genere.</div>`;
    return;
  }

  byId("blockerAuditPanel").innerHTML = `
    <div class="blocker-audit-grid">
      ${targetMetric("Assets", audit.summary.assets)}
      ${targetMetric("Blocages", audit.summary.blockers)}
      ${targetMetric("Resolus", audit.summary.resolved)}
      ${targetMetric("Actifs", audit.summary.blocked)}
    </div>
    <div class="blocker-promotion ${audit.summary.promotionReady ? "ready" : "blocked"}">
      Promotion DPS fiable : ${audit.summary.promotionReady ? "possible" : "bloquee"}
    </div>
    <div class="blocker-action-list">
      ${(audit.summary.nextActions ?? []).map((action) => `<span>${action}</span>`).join("")}
    </div>
    <div class="blocker-asset-list">
      ${(audit.assets ?? []).map(renderBlockerAuditAsset).join("")}
    </div>
  `;

  document.querySelectorAll(".blocker-audit-row").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAssetId = Number(button.dataset.assetId);
      render();
      byId("assetDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderBlockerAuditAsset(asset) {
  return `
    <article class="blocker-audit-asset">
      <button class="blocker-audit-row" type="button" data-asset-id="${asset.assetId}">
        <span>
          <strong>${asset.entityId ?? asset.assetId}</strong>
          <span>${asset.class} - strict ${formatNumber(asset.strictDps)} - what-if ${formatNumber(asset.candidateDps)} - delta +${formatNumber(asset.candidateDeltaDps)}</span>
        </span>
        <span>${asset.promotionDecision?.kind ?? "blocked"}</span>
      </button>
      <div class="blocker-audit-cards">
        ${(asset.blockers ?? []).map(renderBlockerAuditCard).join("")}
      </div>
      ${renderBlockerEvidenceSummary(asset.evidenceSummary)}
    </article>
  `;
}

function renderBlockerAuditCard(blocker) {
  return `
    <div class="blocker-audit-card ${blocker.status}">
      <div>
        <strong>${blocker.kind}</strong>
        <span>${blocker.priority}</span>
      </div>
      <p>${blocker.finding}</p>
      <p>${blocker.proofState}</p>
      <span>${blocker.nextAction}</span>
    </div>
  `;
}

function renderBlockerEvidenceSummary(summary) {
  if (!summary) return "";
  const sf32Decision = summary.sf32FieldPromotionDecisionAssessment;
  return `
    <div class="blocker-evidence-summary">
      <span>Formule candidate : ${summary.candidateFormula ?? "n/a"}</span>
      <span>Scenario : ${summary.scenarioImpact?.scenarioId ?? "n/a"} (${formatNumber(summary.scenarioImpact?.estimatedDps)} DPS)</span>
      ${renderSf32PromotionDecision(sf32Decision)}
      <span>Record champ : ${summary.fieldRecordAssessment?.fieldOwnership ?? "n/a"} (${summary.fieldRecordAssessment?.confidence ?? "n/a"})</span>
      <span>Segments : ${summary.recordSegmentAssessment?.kind ?? "n/a"} (${summary.recordSegmentAssessment?.confidence ?? "n/a"})</span>
      <span>Headers : ${summary.recordHeaderAssessment?.kind ?? "n/a"} (${summary.recordHeaderAssessment?.fieldOwnership ?? "n/a"})</span>
      <span>Patterns : ${summary.recordHeaderPatternAssessment?.kind ?? "n/a"} (${summary.recordHeaderPatternAssessment?.confidence ?? "n/a"})</span>
      <span>Cross : ${summary.crossHeaderPatternAssessment?.kind ?? "n/a"} (${summary.crossHeaderPatternAssessment?.evidence?.repeatedSignatures ?? "n/a"} repetee)</span>
      <span>Layout : ${summary.normalizedHeaderLayoutAssessment?.kind ?? "n/a"} (${summary.normalizedHeaderLayoutAssessment?.confidence ?? "n/a"})</span>
      <span>Focus : ${summary.formulaHashLayoutFocusAssessment?.kind ?? "n/a"} (${summary.formulaHashLayoutFocusAssessment?.confidence ?? "n/a"})</span>
      <span>Frontiere : ${summary.formulaHashFieldBoundaryAssessment?.kind ?? "n/a"} (${summary.formulaHashFieldBoundaryAssessment?.confidence ?? "n/a"})</span>
      <span>Prelude : ${summary.formulaHashHeaderPreludeAssessment?.kind ?? "n/a"} (${summary.formulaHashHeaderPreludeAssessment?.confidence ?? "n/a"})</span>
      <span>Suffixe : ${summary.hashSuffixDefinitionAssessment?.kind ?? "n/a"} (${summary.hashSuffixDefinitionAssessment?.confidence ?? "n/a"})</span>
      <span>Motifs suffixe : ${summary.hashSuffixValuePatternAssessment?.kind ?? "n/a"} (${summary.hashSuffixValuePatternAssessment?.confidence ?? "n/a"})</span>
      <span>Semantique suffixe : ${summary.hashSuffixCandidateSemanticAssessment?.kind ?? "n/a"} (${summary.hashSuffixCandidateSemanticAssessment?.confidence ?? "n/a"})</span>
      <span>Dico suffixe : ${summary.hashSuffixDictionaryMiningAssessment?.kind ?? "n/a"} (${summary.hashSuffixDictionaryMiningAssessment?.confidence ?? "n/a"})</span>
      <span>Famille suffixe : ${summary.hashSuffixFamilyEvidenceAssessment?.kind ?? "n/a"} (${summary.hashSuffixFamilyEvidenceAssessment?.confidence ?? "n/a"})</span>
      <span>Source suffixe : ${summary.hashSuffixSourceNameAssessment?.kind ?? "n/a"} (${summary.hashSuffixSourceNameAssessment?.confidence ?? "n/a"})</span>
      <span>Binaire suffixe : ${summary.hashSuffixBinarySourceAssessment?.kind ?? "n/a"} (${summary.hashSuffixBinarySourceAssessment?.confidence ?? "n/a"})</span>
      <span>Comparaison suffixe : ${summary.hashSuffixBinaryContextAssessment?.kind ?? "n/a"} (${summary.hashSuffixBinaryContextAssessment?.confidence ?? "n/a"})</span>
      <span>Classification suffixe : ${summary.hashSuffixSublayoutAssessment?.kind ?? "n/a"} (${summary.hashSuffixSublayoutAssessment?.confidence ?? "n/a"})</span>
      <span>Champs suffixe : ${summary.hashSuffixSublayoutFieldAssessment?.kind ?? "n/a"} (${summary.hashSuffixSublayoutFieldAssessment?.confidence ?? "n/a"})</span>
      <span>Decodeurs suffixe : ${summary.hashSuffixFieldShapeDecoderAssessment?.kind ?? "n/a"} (${summary.hashSuffixFieldShapeDecoderAssessment?.confidence ?? "n/a"})</span>
      <span>Offsets suffixe : ${summary.hashSuffixDecodedOffsetLinkAssessment?.kind ?? "n/a"} (${summary.hashSuffixDecodedOffsetLinkAssessment?.confidence ?? "n/a"})</span>
      <span>Records suffixe : ${summary.hashSuffixOffsetRecordAssessment?.kind ?? "n/a"} (${summary.hashSuffixOffsetRecordAssessment?.confidence ?? "n/a"})</span>
      <span>Bornes suffixe : ${summary.hashSuffixRecordBoundaryAssessment?.kind ?? "n/a"} (${summary.hashSuffixRecordBoundaryAssessment?.confidence ?? "n/a"})</span>
      <span>Preludes suffixe : ${summary.hashSuffixBoundaryPreludeAssessment?.kind ?? "n/a"} (${summary.hashSuffixBoundaryPreludeAssessment?.confidence ?? "n/a"})</span>
      <span>Prelude/header suffixe : ${summary.hashSuffixPreludeHeaderAssessment?.kind ?? "n/a"} (${summary.hashSuffixPreludeHeaderAssessment?.confidence ?? "n/a"})</span>
      <span>Shapes header suffixe : ${summary.hashSuffixHeaderShapeAssessment?.kind ?? "n/a"} (${summary.hashSuffixHeaderShapeAssessment?.confidence ?? "n/a"})</span>
      <span>Compact suffixe : ${summary.hashSuffixCompactPatternAssessment?.kind ?? "n/a"} (${summary.hashSuffixCompactPatternAssessment?.confidence ?? "n/a"})</span>
      <span>Table suffixe : ${summary.hashSuffixNamedTableAssessment?.kind ?? "n/a"} (${summary.hashSuffixNamedTableAssessment?.confidence ?? "n/a"})</span>
      <span>Matrice bonus : ${summary.bonusPercentSelectorMatrixAssessment?.kind ?? "n/a"} (949 ${(summary.bonusPercentSelectorMatrixAssessment?.evidence?.selector949Assets ?? []).length}, 994 ${(summary.bonusPercentSelectorMatrixAssessment?.evidence?.selector994Assets ?? []).length})</span>
      <span>Peers 949 : ${summary.selector949PeerAssessment?.kind ?? "n/a"} (compact ${(summary.selector949PeerAssessment?.evidence?.compactCandidates ?? []).length}/${summary.selector949PeerAssessment?.evidence?.peers ?? 0})</span>
      <span>Corpus 949 : ${summary.selector949CompactCorpusAssessment?.kind ?? "n/a"} (compact ${summary.selector949CompactCorpusAssessment?.compactOccurrences ?? 0}/${summary.selector949CompactCorpusAssessment?.selector949Occurrences ?? 0})</span>
      <span>Strings dict : ${summary.decodedDictionaryStringAssessment?.kind ?? "n/a"} (near ${summary.decodedDictionaryStringAssessment?.dictionaryHitsNearWatchedNumbers ?? 0}/${summary.decodedDictionaryStringAssessment?.dictionaryHits ?? 0})</span>
      <span>Sans ancre : ${summary.unanchoredBonusPercentAssessment?.kind ?? "n/a"} (utile ${summary.unanchoredBonusPercentAssessment?.usefulAnchorCandidates ?? 0}/${summary.unanchoredBonusPercentAssessment?.rows ?? 0})</span>
      <span>Metadata 12337 : ${summary.metadata12337ContextAssessment?.kind ?? "n/a"} (${(summary.metadata12337ContextAssessment?.selectors ?? []).join("/") || "n/a"})</span>
      <span>Corpus 12337 : ${summary.metadata12337ScaleCorpusAssessment?.kind ?? "n/a"} (${summary.metadata12337ScaleCorpusAssessment?.hits ?? 0} hits)</span>
      <span>Pairs selector : ${summary.selectorAssetPairAssessment?.kind ?? "n/a"} (${summary.selectorAssetPairAssessment?.groups ?? 0} groupes)</span>
      <span>Layouts selector : ${summary.selectorAssetLayoutAssessment?.kind ?? "n/a"} (${summary.selectorAssetLayoutAssessment?.selector949CompactLayouts ?? 0}/${summary.selectorAssetLayoutAssessment?.selector949NonCompactLayouts ?? 0} pour 949)</span>
      <span>Champs selector : ${summary.selectorAssetOwnerFieldAssessment?.kind ?? "n/a"} (${summary.selectorAssetOwnerFieldAssessment?.candidateFields ?? 0} candidats)</span>
      <span>Couverture bonus : ${summary.bonusPercentCoverageAssessment?.kind ?? "n/a"} (${summary.bonusPercentCoverageAssessment?.decodedAssets ?? 0}/${summary.bonusPercentCoverageAssessment?.externalAssets ?? 0} decodes)</span>
      <span>Source locale : ${summary.localTableSourceAssessment?.kind ?? "n/a"} (${summary.localTableSourceAssessment?.independentTableCandidates ?? 0} tables)</span>
      <span>Trigger SF33 : ${summary.sf33BuildStateTriggerAssessment?.kind ?? "n/a"} (${summary.sf33BuildStateTriggerAssessment?.hasStructuralRelation ? "relation oui" : "relation non"}, ${summary.sf33BuildStateTriggerAssessment?.hasBuildStateEntry ? "flag oui" : "flag non"})</span>
      <span>Activation SF33 : ${summary.sf33ActivationSourceAssessment?.kind ?? "n/a"} (${(summary.sf33ActivationSourceAssessment?.externalExactAssetIds ?? []).length} externe, ${summary.sf33ActivationSourceAssessment?.filesWithHits ?? 0} fichiers)</span>
      <span>Uptime : ${summary.uptimeProofAssessment?.kind ?? "n/a"} (${summary.uptimeProofAssessment?.linkedProbabilityNeighbors ?? 0}/${summary.uptimeProofAssessment?.probabilityNeighbors ?? 0} liees)</span>
      <span>SF28/SF29 : ${summary.sf28Sf29RoleAssessment?.kind ?? "n/a"} (${summary.sf28Sf29RoleAssessment?.compiledProbabilityMatches ?? 0} proba, ${summary.sf28Sf29RoleAssessment?.hasUptimeRole ? "uptime oui" : "uptime non"})</span>
      <span>Source header : ${summary.recordHeaderSourceFreshnessAssessment?.kind ?? "n/a"} (stale ${summary.recordHeaderSourceFreshnessAssessment?.staleOffsets ?? 0}, fresh ${summary.recordHeaderSourceFreshnessAssessment?.freshMatches ?? 0}, voisins ${summary.recordHeaderSourceFreshnessAssessment?.neighborHits ?? 0})</span>
      <span>Slots : ${(summary.sfSlots ?? []).map((slot) => `${slot.canonicalId} ${slot.localSymbolStatus}`).join(" - ") || "n/a"}</span>
      <span>Cibles : ${(summary.definitionTargets ?? []).map((target) => `${target.role} ${target.assessment}`).join(" - ") || "n/a"}</span>
    </div>
  `;
}

function renderSf32PromotionDecision(decision) {
  if (!decision) return "";
  const gates = decision.promotionGates ?? [];
  const policy = decision.optimizerPolicy ?? {};
  const evidence = decision.evidence ?? {};
  return `
    <div class="sf32-promotion-decision">
      <div class="sf32-policy">
        <strong>Decision SF_32</strong>
        <span>${decision.fieldOwnership ?? "not-proven"} - ${decision.promotionReady ? "promotion possible" : "promotion bloquee"}</span>
        <span>Ranking : ${policy.canUseForRanking ? "autorise" : "strict-only"} - scenario : ${policy.canExposeAsScenario ? "visible" : "masque"}</span>
        <span>Portes ${evidence.gatesPassed ?? 0}/${(evidence.gatesPassed ?? 0) + (evidence.gatesFailed ?? 0)} - delta ${policy.candidateDelta ?? "blocked-what-if"}</span>
      </div>
      <div class="sf32-gate-grid">
        ${gates.map(renderSf32PromotionGate).join("")}
      </div>
    </div>
  `;
}

function renderSf32PromotionGate(gate) {
  const status = gate.status === "passed" ? "passed" : "failed";
  return `
    <span class="sf32-gate ${status}">
      <strong>${gate.id}</strong>
      <em>${status}</em>
    </span>
  `;
}

function renderSummary() {
  const summary = state.dataset.summary;
  const selected = selectedAsset();
  const effective = selected ? effectiveDps(selected) : null;
  const metrics = [
    ["Assets", summary.assets],
    ["DPS strict", summary.assetsWithStrictDps],
    ["Candidats", summary.candidateCount],
    ["Bloques", summary.blockedCandidates],
    [state.includeCandidates ? "DPS selection" : "DPS strict selection", effective ? effective.displayDps : 0],
  ];
  byId("summaryGrid").innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${formatNumber(value)}</strong></article>`)
    .join("");
}

function renderTargetDatasetPanel() {
  if (!state.targetDataset) {
    byId("targetDatasetPanel").innerHTML = `<div class="optimizer-empty">Dataset cible indisponible.</div>`;
    return;
  }

  const collections = state.targetValidation?.summary?.collections ?? targetCollectionCounts();
  const warningCount = state.targetValidation?.summary?.warnings ?? 0;
  const issueCount = state.targetValidation?.summary?.issues ?? 0;
  const warning = state.targetValidation?.warnings?.[0] ?? "Aucun warning.";
  const filteredEntities = targetEntities();
  const filteredTotal = targetFilteredEntityCount();
  const selectedEntity = selectedTargetEntity() ?? filteredEntities[0] ?? null;
  if (!state.selectedTargetEntityId && selectedEntity) state.selectedTargetEntityId = selectedEntity.id;
  byId("targetDatasetPanel").innerHTML = `
    <div class="target-grid">
      ${targetMetric("Skills", collections.skills)}
      ${targetMetric("Affixes", collections.affixes)}
      ${targetMetric("Aspects", collections.aspects)}
      ${targetMetric("Formules", collections.formulas)}
      ${targetMetric("Conditions", collections.conditions)}
      ${targetMetric("Relations", state.targetValidation?.summary?.relations ?? state.targetDataset.relations?.length ?? 0)}
      ${targetMetric("Issues", issueCount)}
      ${targetMetric("Warnings", warningCount)}
    </div>
    <div class="target-warning ${warningCount ? "has-warning" : ""}">
      ${warning}
    </div>
    <div class="target-entity-count">
      ${formatNumber(filteredEntities.length)} affichees / ${formatNumber(filteredTotal)} filtrees
    </div>
    <div class="target-entity-list">
      ${filteredEntities.map(renderTargetEntity).join("") || `<div class="optimizer-empty">Aucune entite pour ce filtre.</div>`}
    </div>
    ${renderTargetEntityDetail(selectedTargetEntity() ?? selectedEntity)}
  `;
}

function targetCollectionCounts() {
  return Object.fromEntries(
    Object.entries(state.targetDataset.entities ?? {}).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
  );
}

function targetMetric(label, value) {
  return `
    <article class="target-metric">
      <span>${label}</span>
      <strong>${formatNumber(value)}</strong>
    </article>
  `;
}

function targetEntities() {
  return targetAllEntities()
    .filter(matchesTargetEntityFilters)
    .slice(0, 12);
}

function targetFilteredEntityCount() {
  return targetAllEntities()
    .filter(matchesTargetEntityFilters)
    .length;
}

function matchesTargetEntityFilters(entity) {
  const matchesType = state.targetEntityType === "all" || entity.collection === state.targetEntityType;
  const matchesClass = state.targetEntityClass === "all" || (entity.class ?? "generic") === state.targetEntityClass;
  const matchesSearch = !state.targetEntitySearch || targetEntitySearchText(entity).includes(state.targetEntitySearch);
  return matchesType && matchesClass && matchesSearch;
}

function targetEntitySearchText(entity) {
  return [
    entity.id,
    entity.name,
    entity.assetId,
    entity.collection,
    entity.class,
    ...(entity.tags ?? []),
    ...(entity.modifiers ?? []).flatMap((modifier) => [
      modifier.id,
      modifier.stat,
      modifier.operation,
      modifier.bucket,
      modifier.evidence?.confidence,
    ]),
  ].join(" ").toLowerCase();
}

function targetAllEntities() {
  const entities = state.targetDataset?.entities ?? {};
  return [
    ...(entities.skills ?? []).map((entity) => ({ ...entity, collection: "skill" })),
    ...(entities.aspects ?? []).map((entity) => ({ ...entity, collection: "aspect" })),
    ...(entities.affixes ?? []).map((entity) => ({ ...entity, collection: "affix" })),
  ];
}

function renderTargetFilterOptions() {
  if (!state.targetDataset) return;
  const entities = targetAllEntities();
  const types = [...new Set(entities.map((entity) => entity.collection))].sort();
  const classes = [...new Set(entities.map((entity) => entity.class ?? "generic"))].sort();
  byId("targetEntityType").innerHTML = [
    `<option value="all">Tous types</option>`,
    ...types.map((type) => `<option value="${type}">${type}</option>`),
  ].join("");
  byId("targetEntityClass").innerHTML = [
    `<option value="all">Toutes classes</option>`,
    ...classes.map((className) => `<option value="${className}">${className}</option>`),
  ].join("");
}

function renderTargetEntity(entity) {
  const hasAsset = entity.assetId != null;
  const active = entity.id === state.selectedTargetEntityId ? " active" : "";
  return `
    <button class="target-entity-row${active}" type="button" data-target-entity-id="${entity.id}" ${hasAsset ? `data-target-asset-id="${entity.assetId}"` : ""}>
      <span>
        <span class="asset-title">${entity.name}</span>
        <span class="asset-meta">${entity.collection} - ${entity.class ?? "generic"} - asset ${entity.assetId ?? "n/a"}</span>
      </span>
      <span class="candidate-dot">${entity.modifiers?.length ?? 0} mod</span>
    </button>
  `;
}

function handleGlobalClick(event) {
  const targetOptimizerApply = event.target.closest("[data-asset-ids]");
  if (targetOptimizerApply) {
    state.buildAssetIds = targetOptimizerApply.dataset.assetIds
      .split(",")
      .map((assetId) => Number(assetId))
      .filter((assetId) => Number.isFinite(assetId));
    state.selectedAssetId = state.buildAssetIds[0] ?? state.selectedAssetId;
    const label = targetOptimizerApply.dataset.planLabel;
    const status = targetOptimizerApply.dataset.planStatus;
    const prefix = label ? `Plan ${label}` : "Plan";
    const suffix = status ? ` - ${status}` : "";
    setBuildExportStatus(`${prefix} charge${suffix} (${state.buildAssetIds.length} asset${state.buildAssetIds.length > 1 ? "s" : ""})`);
    render();
    byId("buildSummary").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const targetEntitySelection = event.target.closest("[data-target-entity-id]");
  if (targetEntitySelection) {
    state.selectedTargetEntityId = targetEntitySelection.dataset.targetEntityId;
  }

  const targetAsset = event.target.closest("[data-target-asset-id]");
  if (!targetAsset) {
    if (targetEntitySelection) render();
    return;
  }
  const assetId = Number(targetAsset.dataset.targetAssetId);
  if (!state.dataset.assets.some((asset) => Number(asset.assetId) === assetId)) return;
  state.selectedAssetId = assetId;
  render();
  byId("assetDetail").scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectedTargetEntity() {
  if (!state.selectedTargetEntityId) return null;
  return targetAllEntities().find((entity) => entity.id === state.selectedTargetEntityId) ?? null;
}

function renderTargetEntityDetail(entity) {
  if (!entity) return "";
  return `
    <section class="target-entity-detail">
      <div class="target-detail-head">
        <div>
          <h3>${entity.name}</h3>
          <div class="asset-meta">${entity.id} - ${entity.collection} - ${entity.class ?? "generic"}</div>
        </div>
        <span class="status-pill">asset ${entity.assetId ?? "n/a"}</span>
      </div>
      <div class="target-modifier-list">
        ${(entity.modifiers ?? []).map(renderTargetModifier).join("") || `<div class="optimizer-empty">Aucun modifier.</div>`}
      </div>
      ${renderTargetEvidence(entity.evidence)}
    </section>
  `;
}

function renderTargetModifier(modifier) {
  const blocked = modifier.operation === "unknown" || modifier.bucket === "blocked-candidate";
  const family = modifierCalculationFamily(modifier);
  return `
    <article class="target-modifier ${blocked ? "blocked-modifier" : ""}">
      <div><strong>${modifier.stat}</strong> - ${modifier.operation}</div>
      <div class="asset-meta">${modifier.id}</div>
      ${kv("Valeur", formatNumber(modifier.value))}
      ${kv("Bucket", modifier.bucket ?? "n/a")}
      ${kv("Famille", family)}
      ${kv("Confiance", modifier.evidence?.confidence ?? "n/a")}
      ${(modifier.evidence?.notes ?? []).length ? `<ul class="evidence-list">${modifier.evidence.notes.map((note) => `<li>${note}</li>`).join("")}</ul>` : ""}
    </article>
  `;
}

function renderTargetEvidence(evidence) {
  if (!evidence) return "";
  return `
    <div class="target-evidence">
      <strong>Preuve entite</strong>
      <span>${evidence.source} - ${evidence.file ?? "fichier n/a"} @ ${evidence.offset ?? "n/a"} - ${evidence.confidence}</span>
    </div>
  `;
}

function renderOptimizerTagOptions() {
  const tags = [...new Set(state.dataset.assets.flatMap((asset) => asset.tags || []))].sort();
  byId("optimizerTag").innerHTML = [
    `<option value="all">Tous les tags</option>`,
    ...tags.map((tag) => `<option value="${tag}">${tag}</option>`),
  ].join("");
}

function filteredAssets() {
  return state.dataset.assets.filter((asset) => {
    if (state.filter === "strict") return asset.strict.estimatedDps > 0;
    if (state.filter === "candidate") return asset.candidates.length > 0;
    return true;
  });
}

function renderAssetList() {
  const assets = filteredAssets();
  if (!assets.some((asset) => String(asset.assetId) === String(state.selectedAssetId))) {
    state.selectedAssetId = assets[0]?.assetId ?? null;
  }
  byId("assetList").innerHTML = assets
    .map((asset) => {
      const active = String(asset.assetId) === String(state.selectedAssetId) ? " active" : "";
      return `
        <button class="asset-row${active}" type="button" data-asset-id="${asset.assetId}">
          <span>
            <span class="asset-title">${asset.label}</span>
            <span class="asset-meta">Asset ${asset.assetId} - ${asset.tags.join(", ") || "sans tag"}</span>
          </span>
          <span class="dps-stack">
            <span class="dps-value">${formatNumber(effectiveDps(asset).displayDps)}</span>
            ${asset.candidates.length ? `<span class="candidate-dot">+${formatNumber(bestCandidateDelta(asset))}</span>` : ""}
          </span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".asset-row").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAssetId = Number(button.dataset.assetId);
      render();
    });
  });
}

function renderOptimizerRanking() {
  const ranked = rankedAssets().slice(0, 5);
  const best = ranked[0];
  const total = optimizerFilteredAssets().length;
  byId("optimizerRanking").innerHTML = `
    <div class="optimizer-best">
      <span>Meilleur choix</span>
      <strong>${best ? best.label : "Aucun asset"}</strong>
      <small>${best ? optimizerScoreLabel(best) : ""}</small>
      <small>${optimizerScopeLabel(total)}</small>
    </div>
    <div class="optimizer-list">
      ${ranked.map((asset, index) => `
        <button class="optimizer-row${String(asset.assetId) === String(state.selectedAssetId) ? " active" : ""}" type="button" data-asset-id="${asset.assetId}">
          <span class="rank-index">${index + 1}</span>
          <span class="rank-body">
            <span class="asset-title">${asset.label}</span>
            <span class="asset-meta">${optimizerMeta(asset)}</span>
          </span>
          <span class="dps-stack">
            <span class="dps-value">${formatNumber(optimizerScore(asset))}</span>
            ${bestCandidate(asset) ? `<span class="candidate-dot">what-if</span>` : ""}
          </span>
        </button>
      `).join("") || `<div class="optimizer-empty">Aucun asset pour ce filtre.</div>`}
    </div>
  `;

  document.querySelectorAll(".optimizer-row").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAssetId = Number(button.dataset.assetId);
      render();
    });
  });
}

function renderBuildSelection() {
  const assets = buildAssets();
  const composition = buildComposition(assets);
  const totals = composition.totals;
  renderUserScenarioStatus(composition);
  byId("buildSummary").innerHTML = `
    <article class="build-metric">
      <span>Assets retenus</span>
      <strong>${formatNumber(assets.length)}</strong>
    </article>
    <article class="build-metric">
      <span>DPS strict total</span>
      <strong>${formatNumber(totals.strict)}</strong>
    </article>
    <article class="build-metric">
      <span>DPS actif total</span>
      <strong>${formatNumber(totals.effective)}</strong>
    </article>
    <article class="build-metric">
      <span>Delta what-if</span>
      <strong class="${totals.candidateDelta > 0 ? "positive" : ""}">${totals.candidateDelta > 0 ? "+" : ""}${formatNumber(totals.candidateDelta)}</strong>
    </article>
    <article class="build-metric">
      <span>Hypotheses bloquees</span>
      <strong>${formatNumber(totals.blockedCandidates)}</strong>
    </article>
    <article class="build-metric">
      <span>Couverture cible</span>
      <strong>${formatNumber(composition.coverage.targetScored)} / ${formatNumber(composition.coverage.assets)}</strong>
    </article>
    <article class="build-metric">
      <span>Qualite modele</span>
      <strong class="${composition.quality.level}">${composition.quality.label}</strong>
    </article>
  `;

  byId("buildList").innerHTML = assets.map((asset) => `
    <button class="build-row" type="button" data-asset-id="${asset.assetId}">
      <span>
        <span class="asset-title">${asset.label}</span>
        <span class="asset-meta">${buildAssetMeta(asset)}</span>
      </span>
      <span class="candidate-dot">retirer</span>
    </button>
  `).join("") || `<div class="optimizer-empty">Aucun asset dans le build.</div>`;

  if (assets.length) {
    byId("buildList").insertAdjacentHTML("afterbegin", renderBuildCompositionNotice(composition));
  }

  document.querySelectorAll(".build-row").forEach((button) => {
    button.addEventListener("click", () => {
      toggleBuildAsset(Number(button.dataset.assetId));
    });
  });

  document.querySelectorAll(".build-blocker-row").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAssetId = Number(button.dataset.assetId);
      render();
      byId("assetDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function buildAssets() {
  return state.buildAssetIds
    .map((assetId) => state.dataset.assets.find((asset) => Number(asset.assetId) === Number(assetId)))
    .filter(Boolean);
}

function buildTotals(assets) {
  return buildComposition(assets).totals;
}

function buildComposition(assets) {
  const rows = assets.map((asset) => {
    const score = configuredDpsScore(asset);
    const candidateDelta = score.candidateDps == null ? 0 : score.candidateDps - score.strictDps;
    const blockers = buildAssetBlockers(asset, score);
    return {
      assetId: asset.assetId,
      label: asset.label,
      strictDps: score.strictDps,
      candidateDps: score.candidateDps,
      candidateDelta,
      activeDps: state.includeCandidates && score.candidateDps != null ? score.candidateDps : score.strictDps,
      blockedCandidates: score.blockedCandidates,
      scoringSource: score.source,
      targetEntityId: score.targetEntityId,
      class: score.class,
      allowedSlots: score.allowedSlots,
      buckets: score.buckets,
      blockers,
    };
  });

  const totals = rows.reduce((totals, row) => {
    totals.strict += Number(row.strictDps || 0);
    totals.whatIf += Number(row.candidateDps ?? row.strictDps ?? 0);
    totals.candidateDelta += Number(row.candidateDelta || 0);
    totals.effective += Number(row.activeDps || 0);
    totals.blockedCandidates += row.blockedCandidates;
    return totals;
  }, { strict: 0, whatIf: 0, effective: 0, candidateDelta: 0, blockedCandidates: 0 });
  const buckets = rows.reduce((totals, row) => mergeBucketTotals(totals, row.buckets), emptyBucketTotals());

  const coverage = {
    assets: rows.length,
    targetScored: rows.filter((row) => row.scoringSource === "target-dataset").length,
    fallbackScored: rows.filter((row) => row.scoringSource !== "target-dataset").length,
  };
  const blockers = buildCompositionBlockers(rows);
  const constraints = assessBuildConstraints(rows);
  const bucketEngine = buildBucketEnginePreview(totals, buckets, coverage, blockers, rows, constraints);
  const userScenario = userScenarioSnapshot();
  userScenario.deltaDps = rows.reduce((sum, row) => sum + Number(row.userScenario?.configuredDeltaDps || 0), 0);
  userScenario.rawBlockedDeltaDps = rows.reduce((sum, row) => sum + Number(row.userScenario?.rawBlockedDeltaDps || 0), 0);

  return {
    schemaVersion: 1,
    method: "target-modifier-sum-v1",
    mode: state.includeCandidates ? "what-if" : "strict",
    userScenario,
    note: "Prototype composition: sums normalized estimatedDps modifiers. It does not yet model Diablo IV additive/multiplicative buckets, caps, conflicts, uptime, or equipment slots.",
    totals,
    buckets,
    bucketEngine,
    constraints,
    coverage,
    rows,
    blockers,
    quality: buildCompositionQuality(totals, coverage, buckets),
    warnings: buildCompositionWarnings(totals, coverage, buckets),
  };
}

function renderUserScenarioStatus(composition) {
  const scenario = userScenarioDefinition();
  const applied = composition.userScenario?.applied === true;
  byId("userScenarioSf33").checked = state.userScenario.sf33Active;
  byId("userScenarioUptime").value = String(Math.round(normalizeUptimeValue(state.userScenario.uptime) * 100));
  byId("userScenarioUptimeValue").textContent = formatPercent(normalizeUptimeValue(state.userScenario.uptime) * 100);
  byId("userScenarioStatus").textContent = scenario
    ? applied
      ? `What-if utilisateur +${formatNumber(composition.userScenario.deltaDps)} DPS`
      : "What-if utilisateur inactif"
    : "Scenario utilisateur absent";
}

function userScenarioDefinition() {
  return (state.userWhatIfScenarios?.scenarios ?? [])[0] ?? null;
}

function userScenarioSnapshot() {
  const scenario = userScenarioDefinition();
  const sf33Active = state.userScenario.sf33Active === true;
  const uptime = normalizeUptimeValue(state.userScenario.uptime);
  return {
    scenarioId: scenario?.id ?? "user-scenario-1663210-sf33-uptime",
    assetId: scenario?.assetId ?? 1663210,
    sf33Active,
    uptime,
    applied: state.includeCandidates && sf33Active,
    reliableDpsAffected: false,
    mode: "what-if-user-configured",
  };
}

function configuredDpsScore(asset) {
  const score = dpsScore(asset);
  const scenario = userScenarioDefinition();
  const scenarioAssetId = Number(scenario?.assetId ?? 1663210);
  if (Number(asset.assetId) !== scenarioAssetId) return score;
  const rawDelta = Number(score.candidateDeltaDps || scenario?.blockedDeltaDps || 0);
  const uptime = normalizeUptimeValue(state.userScenario.uptime);
  const applied = state.includeCandidates && state.userScenario.sf33Active === true;
  const configuredDelta = applied ? Math.round(rawDelta * uptime) : 0;
  return {
    ...score,
    candidateDps: score.strictDps + configuredDelta,
    candidateDeltaDps: configuredDelta,
    blockedCandidates: score.blockedCandidates,
    userScenario: {
      scenarioId: scenario?.id ?? "user-scenario-1663210-sf33-uptime",
      rawBlockedDeltaDps: rawDelta,
      configuredDeltaDps: configuredDelta,
      uptime,
      sf33Active: state.userScenario.sf33Active === true,
      applied,
      reliableDpsAffected: false,
    },
  };
}

function buildBucketEnginePreview(totals, buckets, coverage, blockers, rows, constraints = null) {
  const blockerKinds = Array.from(new Set((blockers ?? []).map((blocker) => blocker.kind))).sort();
  const calculatedDps = Number(buckets.strictBase || 0)
    * (1 + Number(buckets.additive || 0) / 100)
    * Number(buckets.multiplicative || 1)
    * Number(buckets.uptime || 1);
  const strictDps = Number(totals.strict || 0);
  const readiness = assessBucketReadiness(totals, buckets, coverage, blockers, rows, constraints);
  const promotionReady = blockerKinds.length === 0
    && Number(totals.blockedCandidates || 0) === 0
    && Number(coverage.fallbackScored || 0) === 0
    && Number(buckets.unknown || 0) === 0
    && constraints?.valid !== false;

  return {
    version: "diablo4-bucket-engine-preview-v1",
    status: promotionReady ? "strict-ready" : "strict-only-blocked-candidates",
    promotionReady,
    strict: {
      dps: strictDps,
      calculatedDps,
      parityDelta: calculatedDps - strictDps,
    },
    whatIf: {
      dps: Number(totals.whatIf || 0),
      blockedCandidateDelta: Number(totals.candidateDelta || 0),
      reliableCandidateDelta: 0,
      usedForReliableDps: false,
    },
    blocked: {
      candidates: Number(totals.blockedCandidates || 0),
      dps: Number(buckets.blockedCandidate || 0),
      deltaVsStrict: Number(totals.candidateDelta || 0),
      blockerKinds,
    },
    readiness,
    constraints,
    coverage: {
      requestedAssets: rows.length,
      resolvedAssets: rows.length,
      missingAssets: 0,
    },
  };
}

function assessBucketReadiness(totals, buckets, coverage, blockers, rows, constraints = null) {
  const blockerKinds = Array.from(new Set((blockers ?? []).map((blocker) => blocker.kind))).sort();
  const rowsWithStrictDps = (rows ?? []).filter((row) => Number(row.strictDps || 0) > 0).length;
  const strictOnlyReady = Number(coverage.fallbackScored || 0) === 0 && rowsWithStrictDps === rows.length;
  const fineBucketsReady = Number(buckets.additive || 0) !== 0
    || Number(buckets.multiplicative || 1) !== 1
    || Number(buckets.uptime || 1) !== 1
    || Number(buckets.caps || 0) !== 0;
  const families = [
    {
      family: "strict-base",
      status: strictOnlyReady ? "ready" : "blocked",
      contribution: Number(buckets.strictBase || 0),
      reason: strictOnlyReady ? "DPS strict disponible pour les assets composes." : "Certains assets utilisent encore un score de secours.",
    },
    {
      family: "additive",
      status: Number(buckets.additive || 0) !== 0 ? "mapped" : "empty",
      contribution: Number(buckets.additive || 0),
      reason: Number(buckets.additive || 0) !== 0 ? "Modifiers additifs separes." : "Aucun modifier additif fin extrait.",
    },
    {
      family: "multiplicative",
      status: Number(buckets.multiplicative || 1) !== 1 ? "mapped" : "empty",
      contribution: Number(buckets.multiplicative || 1),
      reason: Number(buckets.multiplicative || 1) !== 1 ? "Multiplicateurs separes." : "Aucun multiplicateur fin extrait.",
    },
    {
      family: "uptime",
      status: Number(buckets.uptime || 1) !== 1 ? "mapped" : "blocked",
      contribution: Number(buckets.uptime || 1),
      reason: Number(buckets.uptime || 1) !== 1 ? "Uptime exploitable mappee." : "Aucune uptime prouvee.",
    },
    {
      family: "blocked-candidates",
      status: Number(totals.blockedCandidates || 0) ? "blocked" : "empty",
      contribution: Number(buckets.blockedCandidate || 0),
      reason: Number(totals.blockedCandidates || 0) ? "What-if exclu du DPS fiable." : "Aucun candidat bloque.",
    },
  ];
  return {
    version: "target-bucket-readiness-v1",
    reliableOptimizerReady: strictOnlyReady
      && fineBucketsReady
      && blockerKinds.length === 0
      && Number(totals.blockedCandidates || 0) === 0
      && constraints?.valid !== false,
    strictOnlyReady,
    fineBucketsReady,
    blockedCandidateCount: Number(totals.blockedCandidates || 0),
    blockerKinds,
    invalidConstraintKinds: (constraints?.issues ?? []).map((issue) => issue.kind),
    families,
    nextMilestones: [
      fineBucketsReady ? null : "extraire des modifiers fins additifs/multiplicatifs/uptime",
      constraints?.valid === false ? "corriger les contraintes de build avant optimisation automatique" : null,
      blockerKinds.length ? "garder les candidats conditionnels hors DPS fiable" : null,
    ].filter(Boolean),
  };
}

function assessBuildConstraints(rows) {
  const heroClasses = [...new Set(rows
    .map((row) => normalizeClassName(row.class))
    .filter((className) => !["all", "generic", "unknown"].includes(className)))]
    .sort();
  const issues = [];
  if (heroClasses.length > 1) {
    issues.push({
      kind: "mixed-hero-classes",
      priority: "high",
      classes: heroClasses,
      assetIds: rows
        .filter((row) => heroClasses.includes(normalizeClassName(row.class)))
        .map((row) => row.assetId),
      reason: "build multi-classes",
      action: "choisir une seule classe avant optimisation",
    });
  }
  const missingSlotAssets = rows
    .filter((row) => String(row.targetEntityId ?? "").startsWith("aspect:") && (row.allowedSlots ?? []).length === 0)
    .map((row) => row.assetId);
  if (missingSlotAssets.length) {
    issues.push({
      kind: "slot-data-not-normalized",
      priority: "medium",
      assetIds: missingSlotAssets,
      reason: "slots aspect non normalises",
      action: "extraire les slots autorises avant contraintes equipement",
    });
  }
  return {
    version: "target-build-constraints-v1",
    valid: issues.length === 0,
    optimizerReady: issues.length === 0,
    selectedHeroClass: heroClasses.length === 1 ? heroClasses[0] : null,
    heroClasses,
    issues,
  };
}

function buildAssetBlockers(asset, score) {
  const blockers = [];
  if (score.source !== "target-dataset") {
    blockers.push({
      kind: "fallback-score",
      priority: "medium",
      assetId: asset.assetId,
      label: asset.label,
      reason: "score encore lu depuis le dataset prototype",
      action: "convertir cet asset vers une entite cible avec modifier strict prouve",
    });
  }

  for (const candidate of asset.candidates ?? []) {
    if (candidate.promotionStatus?.kind !== "blocked-for-real-dps") continue;
    for (const blocker of candidate.promotionStatus.blockers ?? ["unknown-blocker"]) {
      blockers.push({
        kind: blocker,
        priority: blockerPriority(blocker),
        assetId: asset.assetId,
        label: asset.label,
        candidateId: candidate.canonicalId,
        reason: blockerLabel(blocker),
        action: blockerAction(blocker),
      });
    }
  }

  if (score.buckets?.unknown > 0) {
    blockers.push({
      kind: "unknown-modifier-family",
      priority: "medium",
      assetId: asset.assetId,
      label: asset.label,
      reason: "modifier cible non classe",
      action: "mapper le modifier vers additif, multiplicatif, uptime, cap ou ressource",
    });
  }

  return blockers;
}

function buildCompositionBlockers(rows) {
  return rows
    .flatMap((row) => row.blockers ?? [])
    .sort((a, b) => blockerPriorityRank(b.priority) - blockerPriorityRank(a.priority) || String(a.assetId).localeCompare(String(b.assetId)))
    .slice(0, 12);
}

function blockerPriority(blocker) {
  if (blocker === "field-level-parser-required") return "high";
  if (blocker === "sf33-trigger-build-state-unmapped") return "high";
  if (blocker === "uptime-not-proven") return "high";
  return "medium";
}

function blockerPriorityRank(priority) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function blockerLabel(blocker) {
  const labels = {
    "field-level-parser-required": "champ exact du bonus non parse",
    "sf33-trigger-build-state-unmapped": "trigger SF_33 non relie a l'etat de build",
    "uptime-not-proven": "uptime non prouve",
  };
  return labels[blocker] ?? blocker;
}

function blockerAction(blocker) {
  const actions = {
    "field-level-parser-required": "parser le champ local qui porte la valeur candidate",
    "sf33-trigger-build-state-unmapped": "mapper SF_33 vers une condition ou un toggle utilisateur",
    "uptime-not-proven": "extraire ou definir l'uptime avant promotion DPS",
  };
  return actions[blocker] ?? "inspecter ce blocage avant promotion";
}

function emptyBucketTotals() {
  return {
    strictBase: 0,
    additive: 0,
    multiplicative: 1,
    uptime: 1,
    caps: 0,
    blockedCandidate: 0,
    unknown: 0,
  };
}

function mergeBucketTotals(totals, buckets = emptyBucketTotals()) {
  totals.strictBase += Number(buckets.strictBase || 0);
  totals.additive += Number(buckets.additive || 0);
  totals.multiplicative *= Number(buckets.multiplicative || 1);
  totals.uptime *= Number(buckets.uptime || 1);
  totals.caps += Number(buckets.caps || 0);
  totals.blockedCandidate += Number(buckets.blockedCandidate || 0);
  totals.unknown += Number(buckets.unknown || 0);
  return totals;
}

function buildCompositionWarnings(totals, coverage, buckets) {
  const warnings = [];
  if (totals.blockedCandidates > 0) {
    warnings.push(`${formatNumber(totals.blockedCandidates)} hypothese${totals.blockedCandidates > 1 ? "s" : ""} bloquee${totals.blockedCandidates > 1 ? "s" : ""}`);
  }
  if (buckets.unknown > 0) {
    warnings.push(`${formatNumber(buckets.unknown)} modifier${buckets.unknown > 1 ? "s" : ""} non classe${buckets.unknown > 1 ? "s" : ""}`);
  }
  if (coverage.fallbackScored > 0) {
    warnings.push(`${formatNumber(coverage.fallbackScored)} score${coverage.fallbackScored > 1 ? "s" : ""} hors dataset cible`);
  }
  warnings.push("cumul prototype, buckets Diablo IV non modelises");
  return warnings;
}

function buildCompositionQuality(totals, coverage, buckets) {
  const reasons = [];
  const nextActions = [];

  if (coverage.assets === 0) {
    return {
      level: "quality-empty",
      label: "vide",
      score: 0,
      risk: "Aucun calcul disponible.",
      reasons: ["aucun asset dans le build"],
      nextActions: ["ajouter des assets au build"],
    };
  }

  let score = 100;
  if (coverage.fallbackScored > 0) {
    score -= 25;
    reasons.push("certains scores viennent encore du dataset prototype");
    nextActions.push("convertir tous les assets du build vers le dataset cible");
  }
  if (totals.blockedCandidates > 0) {
    score -= 30;
    reasons.push("des hypotheses conditionnelles restent bloquees");
    nextActions.push("prouver le champ exact, le trigger et l'uptime des candidats");
  }
  if (buckets.unknown > 0) {
    score -= 20;
    reasons.push("des modifiers ne sont pas encore classes");
    nextActions.push("mapper les modifiers inconnus vers additif, multiplicatif, uptime, cap ou ressource");
  }
  if (buckets.additive === 0 && buckets.multiplicative === 1 && buckets.uptime === 1) {
    score -= 10;
    reasons.push("les familles additif/multiplicatif/uptime ne sont pas encore alimentees");
    nextActions.push("extraire des modifiers plus fins que estimatedDps");
  }
  reasons.push("le cumul actuel reste un prototype");
  nextActions.push("remplacer la somme simple par le calcul par buckets Diablo IV");

  const clampedScore = Math.max(0, Math.min(100, score));
  if (clampedScore >= 80 && totals.blockedCandidates === 0 && coverage.fallbackScored === 0) {
    return {
      level: "quality-reliable",
      label: "fiable",
      score: clampedScore,
      risk: "Score strict exploitable, sous reserve du modele de buckets encore a remplacer.",
      reasons,
      nextActions,
    };
  }
  if (clampedScore >= 50) {
    return {
      level: "quality-partial",
      label: "partiel",
      score: clampedScore,
      risk: "Score utile pour comparer, mais pas encore assez prouve pour optimiser automatiquement.",
      reasons,
      nextActions,
    };
  }
  return {
    level: "quality-blocked",
    label: "bloque",
    score: clampedScore,
    risk: "Score trop incertain pour guider une optimisation.",
    reasons,
    nextActions,
  };
}

function renderBuildCompositionNotice(composition) {
  return `
    <div class="build-composition-note">
      <strong>${composition.method} - ${composition.quality.label} (${formatNumber(composition.quality.score)}/100)</strong>
      <span class="build-risk ${composition.quality.level}">${composition.quality.risk}</span>
      <span>${composition.warnings.join(" - ")}</span>
      <span>Base stricte ${formatNumber(composition.buckets.strictBase)} - additif ${formatNumber(composition.buckets.additive)} - multiplicatif x${formatMultiplier(composition.buckets.multiplicative)} - uptime x${formatMultiplier(composition.buckets.uptime)} - bloque ${formatNumber(composition.buckets.blockedCandidate)}</span>
      ${renderBucketEngineStatus(composition.bucketEngine)}
      ${renderBuildConstraints(composition.constraints)}
      <span>${composition.quality.reasons.join(" - ")}</span>
      <ul class="build-next-actions">
        ${composition.quality.nextActions.slice(0, 3).map((action) => `<li>${action}</li>`).join("")}
      </ul>
      ${renderBuildBlockers(composition.blockers)}
    </div>
  `;
}

function renderBucketEngineStatus(bucketEngine) {
  if (!bucketEngine) return "";
  const strict = bucketEngine.strict ?? {};
  const blocked = bucketEngine.blocked ?? {};
  const readiness = bucketEngine.readiness ?? null;
  const parityClass = Math.abs(Number(strict.parityDelta || 0)) < 0.0001 ? "positive" : "blocked";
  return `
    <span>Moteur buckets ${bucketEngine.status} - strict ${formatNumber(strict.dps)} - candidat fiable +${formatNumber(bucketEngine.whatIf?.reliableCandidateDelta ?? 0)} - bloque +${formatNumber(blocked.deltaVsStrict ?? 0)}</span>
    <span>Parite buckets <span class="${parityClass}">${formatNumber(strict.parityDelta ?? 0)}</span> - ${bucketEngine.promotionReady ? "promotion possible" : "promotion bloquee"}</span>
    ${readiness ? renderBucketReadiness(readiness) : ""}
  `;
}

function renderBucketReadiness(readiness) {
  const families = readiness.families ?? [];
  return `
    <div class="bucket-readiness">
      <span>Readiness buckets - strict ${readiness.strictOnlyReady ? "pret" : "bloque"} - buckets fins ${readiness.fineBucketsReady ? "presents" : "vides"} - optimiseur ${readiness.reliableOptimizerReady ? "pret" : "bloque"}</span>
      <div class="bucket-family-list">
        ${families.map((family) => `
          <span class="bucket-family ${family.status}">
            ${family.family}: ${family.status}
          </span>
        `).join("")}
      </div>
      ${readiness.nextMilestones?.length ? `<ul class="build-next-actions">${readiness.nextMilestones.slice(0, 3).map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
    </div>
  `;
}

function renderBuildConstraints(constraints) {
  if (!constraints) return "";
  const status = constraints.valid ? "contraintes OK" : "contraintes bloquees";
  const heroClass = constraints.selectedHeroClass ?? (constraints.heroClasses?.join(", ") || "non definie");
  const issues = constraints.issues ?? [];
  return `
    <span>Contraintes build ${status} - classe ${heroClass} - optimiseur ${constraints.optimizerReady ? "pret" : "bloque"}</span>
    ${issues.length ? `<ul class="build-next-actions">${issues.slice(0, 3).map((issue) => `<li>${issue.kind}: ${issue.action}</li>`).join("")}</ul>` : ""}
  `;
}

function renderBuildBlockers(blockers) {
  if (!blockers.length) return "";
  return `
    <div class="build-blockers">
      ${blockers.slice(0, 5).map((blocker) => `
        <button class="build-blocker-row" type="button" data-asset-id="${blocker.assetId}">
          <span>
            <strong>${blocker.label}</strong>
            <span>${blocker.reason}</span>
          </span>
          <span>${blocker.priority}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function buildAssetMeta(asset) {
  const score = configuredDpsScore(asset);
  const active = effectiveDps(asset).displayDps;
  const delta = score.candidateDeltaDps > 0 ? ` - delta +${formatNumber(score.candidateDeltaDps)}` : "";
  return `strict ${formatNumber(score.strictDps)} - actif ${formatNumber(active)} - ${score.source}${delta}`;
}

function buildExportPayload() {
  const assets = buildAssets();
  const composition = buildComposition(assets);
  const totals = composition.totals;
  const userScenarioContract = state.userWhatIfContract
    ? {
        scenarioId: state.userWhatIfContract.summary?.scenarioId,
        mode: state.userWhatIfContract.mode,
        canModifyReliableDps: state.userWhatIfContract.summary?.canModifyReliableDps === true,
        exportPolicy: state.userWhatIfContract.exportPolicy ?? null,
      }
    : null;
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    mode: state.includeCandidates ? "what-if" : "strict",
    totals,
    composition,
    userScenario: composition.userScenario,
    userScenarioContract,
    assetIds: assets.map((asset) => asset.assetId),
    assets: assets.map((asset) => {
      const candidate = bestCandidate(asset);
      const score = configuredDpsScore(asset);
      return {
        assetId: asset.assetId,
        label: asset.label,
        tags: asset.tags,
        strictDps: score.strictDps,
        activeDps: effectiveDps(asset).displayDps,
        scoringSource: score.source,
        targetEntityId: score.targetEntityId,
        candidate: candidate ? {
          canonicalId: candidate.canonicalId,
          target: candidate.target,
          formula: candidate.candidateFormula,
          estimatedDps: score.candidateDps ?? candidate.scenarioImpact?.estimatedDps ?? 0,
          deltaVsStrictDps: score.candidateDeltaDps ?? candidate.scenarioImpact?.deltaVsStrictDps ?? 0,
          userScenario: score.userScenario ?? null,
          promotionStatus: candidate.promotionStatus?.kind ?? "unknown",
          blockers: candidate.promotionStatus?.blockers ?? [],
        } : null,
      };
    }),
  };
}

async function exportBuildJson() {
  const payload = buildExportPayload();
  const text = JSON.stringify(payload, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setBuildExportStatus(`Export copie (${payload.assets.length} asset${payload.assets.length > 1 ? "s" : ""})`);
  } catch {
    setBuildExportStatus(text);
  }
}

function importBuildJson() {
  const raw = byId("buildImportText").value.trim();
  if (!raw) {
    setBuildExportStatus("Aucun JSON a importer.");
    return;
  }

  try {
    const payload = JSON.parse(raw);
    const assetIds = importAssetIds(payload);
    if (!assetIds.length) {
      setBuildExportStatus("Import refuse : aucun asset valide trouve.");
      return;
    }

    state.buildAssetIds = normalizeImportedAssetIds(assetIds);
    state.selectedAssetId = state.buildAssetIds[0] ?? state.selectedAssetId;
    if (payload.mode === "what-if") state.includeCandidates = true;
    if (payload.mode === "strict") state.includeCandidates = false;
    let ignoredForbiddenFields = [];
    if (payload.userScenario && typeof payload.userScenario === "object") {
      const sanitizedScenario = sanitizeImportedUserScenario(payload.userScenario);
      state.userScenario = sanitizedScenario.value;
      ignoredForbiddenFields = sanitizedScenario.ignoredForbiddenFields;
      if (state.userScenario.sf33Active) state.includeCandidates = true;
    }
    byId("buildImportText").value = "";
    syncControls();
    const ignored = ignoredForbiddenFields.length ? ` - champs ignores: ${ignoredForbiddenFields.join(", ")}` : "";
    setBuildExportStatus(`Import OK (${state.buildAssetIds.length} asset${state.buildAssetIds.length > 1 ? "s" : ""})${ignored}`);
    render();
  } catch {
    setBuildExportStatus("Import refuse : JSON invalide.");
  }
}

function sanitizeImportedUserScenario(userScenario) {
  const forbiddenFields = state.userWhatIfContract?.exportPolicy?.forbiddenFields ?? [
    "reliableDpsOverride",
    "promotionReady",
    "canUseForReliableDps",
  ];
  return {
    value: {
      sf33Active: Boolean(userScenario.sf33Active),
      uptime: normalizeUptimeValue(userScenario.uptime ?? 1),
    },
    ignoredForbiddenFields: forbiddenFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(userScenario, field)),
  };
}

function importAssetIds(payload) {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.assetIds)) return payload.assetIds;
  if (Array.isArray(payload.assets)) return payload.assets.map((asset) => asset.assetId);
  return [];
}

function normalizeImportedAssetIds(assetIds) {
  const knownAssetIds = new Set(state.dataset.assets.map((asset) => Number(asset.assetId)));
  return [...new Set(assetIds.map(Number))]
    .filter((assetId) => knownAssetIds.has(assetId));
}

function setBuildExportStatus(message) {
  byId("buildExportStatus").textContent = message;
}

function isInBuild(assetId) {
  return state.buildAssetIds.some((item) => Number(item) === Number(assetId));
}

function toggleBuildAsset(assetId) {
  if (isInBuild(assetId)) {
    state.buildAssetIds = state.buildAssetIds.filter((item) => Number(item) !== Number(assetId));
  } else {
    state.buildAssetIds = [...state.buildAssetIds, Number(assetId)];
  }
  render();
}

function rankedAssets() {
  return optimizerFilteredAssets()
    .slice()
    .sort((a, b) => optimizerScore(b) - optimizerScore(a));
}

function optimizerFilteredAssets() {
  return state.dataset.assets.filter((asset) => {
    const matchesTag = state.optimizerTag === "all" || asset.tags.includes(state.optimizerTag);
    const matchesSearch = !state.optimizerSearch || optimizerSearchText(asset).includes(state.optimizerSearch);
    return matchesTag && matchesSearch;
  });
}

function optimizerScopeLabel(total) {
  const scope = state.optimizerTag === "all" ? "tous les tags" : state.optimizerTag;
  const search = state.optimizerSearch ? `, recherche "${state.optimizerSearch}"` : "";
  return `${formatNumber(total)} asset${total > 1 ? "s" : ""} dans ${scope}${search}`;
}

function optimizerSearchText(asset) {
  const candidates = asset.candidates.flatMap((candidate) => [
    candidate.target,
    candidate.candidateFormula,
    candidate.canonicalId,
    candidate.promotionStatus?.kind,
  ]);
  return [
    asset.assetId,
    asset.label,
    asset.tags.join(" "),
    ...candidates,
  ].join(" ").toLowerCase();
}

function optimizerScore(asset) {
  if (state.optimizerMode === "strict") return configuredDpsScore(asset).strictDps;
  if (state.optimizerMode === "candidate") return bestCandidateDelta(asset);
  return effectiveDps(asset).displayDps;
}

function optimizerScoreLabel(asset) {
  if (state.optimizerMode === "strict") return `DPS strict ${formatNumber(configuredDpsScore(asset).strictDps)}`;
  if (state.optimizerMode === "candidate") return `Gain candidat +${formatNumber(bestCandidateDelta(asset))}`;
  return `${state.includeCandidates ? "DPS what-if" : "DPS strict"} ${formatNumber(effectiveDps(asset).displayDps)}`;
}

function optimizerMeta(asset) {
  const score = configuredDpsScore(asset);
  const strict = `strict ${formatNumber(score.strictDps)}`;
  const candidate = bestCandidate(asset);
  if (!candidate) return `${strict} - ${asset.tags.join(", ") || "sans tag"}`;
  return `${strict} - what-if ${formatNumber(score.candidateDps ?? candidate.scenarioImpact.estimatedDps)} - configure`;
}

function renderDetail() {
  const asset = selectedAsset();
  if (!asset) {
    byId("assetDetail").innerHTML = `<div class="empty-state">Aucun asset selectionne</div>`;
    return;
  }

  const effective = effectiveDps(asset);
  byId("assetDetail").innerHTML = `
    <div class="detail-header">
      <div>
        <h3>${asset.label}</h3>
        <div class="tag-row">${asset.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      </div>
      <div class="strict-dps">
        <span>${effective.label}</span>
        <strong>${formatNumber(effective.displayDps)}</strong>
        <button class="action-button" id="buildToggle" type="button">${isInBuild(asset.assetId) ? "Retirer du build" : "Ajouter au build"}</button>
      </div>
    </div>

    <div class="section-grid">
      ${renderComparisonSection(asset)}
      ${renderTargetScoreSection(asset)}
      ${renderStrictSection(asset)}
      ${renderCandidateSection(asset)}
      ${renderEvidenceSection(asset)}
      ${renderFormulaSection(asset)}
    </div>
  `;

  byId("buildToggle").addEventListener("click", () => {
    toggleBuildAsset(asset.assetId);
  });
}

function selectedAsset() {
  return state.dataset.assets.find((item) => String(item.assetId) === String(state.selectedAssetId));
}

function targetEntityForAsset(assetId) {
  return targetAllEntities().find((entity) => Number(entity.assetId) === Number(assetId)) ?? null;
}

function modifiersForAsset(assetId) {
  return targetEntityForAsset(assetId)?.modifiers ?? [];
}

function dpsScore(asset) {
  const targetEntity = targetEntityForAsset(asset.assetId);
  if (!targetEntity) return fallbackDpsScore(asset);

  const modifiers = targetEntity.modifiers ?? [];
  const strictModifiers = modifiers.filter(
    (modifier) =>
      modifier.stat === "estimatedDps" &&
      modifier.operation === "add" &&
      modifier.bucket === "strict-reviewed-dps"
  );
  const candidateModifiers = modifiers.filter(
    (modifier) =>
      modifier.stat === "estimatedDps" &&
      (modifier.operation === "unknown" || modifier.bucket === "blocked-candidate")
  );
  const strictDps = strictModifiers.reduce((sum, modifier) => sum + Number(modifier.value || 0), 0);
  const candidateDps = candidateModifiers.length
    ? Math.max(...candidateModifiers.map((modifier) => Number(modifier.value || 0)))
    : null;
  const buckets = bucketTotalsFromModifiers(modifiers);
  const resolvedStrictDps = strictModifiers.length ? strictDps : Number(asset.strict?.estimatedDps || 0);

  return {
    source: strictModifiers.length ? "target-dataset" : "optimizer-dataset",
    targetEntityId: targetEntity.id,
    class: targetEntity.class ?? "unknown",
    allowedSlots: targetEntity.allowedSlots ?? [],
    strictDps: resolvedStrictDps,
    candidateDps,
    candidateDeltaDps: candidateDps == null ? 0 : candidateDps - resolvedStrictDps,
    blockedCandidates: candidateModifiers.length,
    buckets,
  };
}

function fallbackDpsScore(asset) {
  const candidate = bestCandidate(asset);
  return {
    source: "optimizer-dataset",
    targetEntityId: null,
    class: classFromTags(asset.tags),
    allowedSlots: [],
    strictDps: Number(asset.strict?.estimatedDps || 0),
    candidateDps: candidate?.scenarioImpact?.estimatedDps ?? null,
    candidateDeltaDps: candidate?.scenarioImpact?.deltaVsStrictDps ?? 0,
    blockedCandidates: asset.candidates.filter((item) => item.promotionStatus?.kind === "blocked-for-real-dps").length,
    buckets: {
      ...emptyBucketTotals(),
      strictBase: Number(asset.strict?.estimatedDps || 0),
      blockedCandidate: candidate?.scenarioImpact?.estimatedDps ?? 0,
    },
  };
}

function classFromTags(tags = []) {
  const lowered = tags.join(" ").toLowerCase();
  for (const className of ["barbarian", "druid", "necromancer", "rogue", "sorcerer", "spiritborn"]) {
    if (lowered.includes(className)) return className;
  }
  return "generic";
}

function normalizeClassName(className) {
  return String(className ?? "unknown").trim().toLowerCase() || "unknown";
}

function bucketTotalsFromModifiers(modifiers) {
  return modifiers.reduce((totals, modifier) => {
    const family = modifierCalculationFamily(modifier);
    const value = Number(modifier.value || 0);
    if (family === "strict-base") totals.strictBase += value;
    else if (family === "additive") totals.additive += value;
    else if (family === "multiplicative") totals.multiplicative *= normalizeMultiplierValue(value);
    else if (family === "uptime") totals.uptime *= normalizeUptimeValue(modifier.uptime ?? value);
    else if (family === "cap") totals.caps += value;
    else if (family === "blocked-candidate") totals.blockedCandidate += value;
    else totals.unknown += 1;
    return totals;
  }, emptyBucketTotals());
}

function modifierCalculationFamily(modifier) {
  if (modifier.bucket === "strict-reviewed-dps") return "strict-base";
  if (modifier.bucket === "blocked-candidate" || modifier.operation === "unknown") return "blocked-candidate";
  if (modifier.operation === "add") return "additive";
  if (modifier.operation === "multiply") return "multiplicative";
  if (modifier.operation === "cap") return "cap";
  if (modifier.operation === "proc" || modifier.uptime != null) return "uptime";
  return "unknown";
}

function normalizeMultiplierValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  if (numeric < 1) return 1 + numeric;
  return numeric;
}

function normalizeUptimeValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(0, Math.min(1, numeric));
}

function bestCandidate(asset) {
  return asset.candidates
    .filter((candidate) => candidate.scenarioImpact)
    .slice()
    .sort((a, b) => b.scenarioImpact.estimatedDps - a.scenarioImpact.estimatedDps)[0] ?? null;
}

function bestCandidateDelta(asset) {
  return configuredDpsScore(asset).candidateDeltaDps ?? bestCandidate(asset)?.scenarioImpact?.deltaVsStrictDps ?? 0;
}

function effectiveDps(asset) {
  const candidate = bestCandidate(asset);
  const score = configuredDpsScore(asset);
  if (state.includeCandidates && candidate) {
    return {
      label: "DPS what-if",
      displayDps: score.candidateDps ?? candidate.scenarioImpact.estimatedDps,
      candidate,
    };
  }
  return {
    label: "DPS strict",
    displayDps: score.strictDps,
    candidate: null,
  };
}

function renderComparisonSection(asset) {
  const candidate = bestCandidate(asset);
  const score = configuredDpsScore(asset);
  const strict = score.strictDps;
  const candidateDps = score.candidateDps ?? candidate?.scenarioImpact?.estimatedDps ?? strict;
  const delta = score.candidateDeltaDps ?? candidate?.scenarioImpact?.deltaVsStrictDps ?? 0;
  const deltaPct = safePercent(delta, strict);
  return `
    <section class="section compare-section full">
      <h3>Comparaison</h3>
      <div class="compare-grid">
        <div>
          <span>DPS strict</span>
          <strong>${formatNumber(strict)}</strong>
        </div>
        <div>
          <span>DPS what-if</span>
          <strong>${formatNumber(candidateDps)}</strong>
        </div>
        <div>
          <span>Delta</span>
          <strong class="${delta > 0 ? "positive" : ""}">${delta > 0 ? "+" : ""}${formatNumber(delta)} / ${formatPercent(deltaPct)}</strong>
        </div>
        <div>
          <span>Statut</span>
          <strong class="${candidate ? "blocked" : ""}">${candidate?.promotionStatus?.kind ?? "strict-only"}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderTargetScoreSection(asset) {
  const score = dpsScore(asset);
  const prototypeStrict = Number(asset.strict?.estimatedDps || 0);
  const parityDelta = score.strictDps - prototypeStrict;
  const parityOk = Math.abs(parityDelta) < 1e-9;
  return `
    <section class="section score-section">
      <h3>Score cible</h3>
      ${kv("Source", score.source)}
      ${kv("Entite cible", score.targetEntityId ?? "n/a")}
      ${kv("DPS strict cible", formatNumber(score.strictDps))}
      ${kv("Candidats bloques", formatNumber(score.blockedCandidates))}
      ${kv("Parite prototype", `<span class="${parityOk ? "positive" : "blocked"}">${parityOk ? "OK" : formatNumber(parityDelta)}</span>`)}
    </section>
  `;
}

function renderStrictSection(asset) {
  const c = asset.strict.components;
  return `
    <section class="section">
      <h3>Calcul strict</h3>
      ${kv("Methode", asset.strict.method)}
      ${kv("Autorite", asset.strict.authority)}
      ${kv("Coefficient primaire", formatNumber(c.primaryDamageCoefficient))}
      ${kv("Degats arme", formatNumber(c.weaponDamage))}
      ${kv("Vitesse attaque", c.attackSpeed)}
      ${kv("Multiplicateurs", c.multiplierProduct)}
    </section>
  `;
}

function renderCandidateSection(asset) {
  if (!asset.candidates.length) {
    return `
      <section class="section">
        <h3>Candidats</h3>
        <p class="empty-state">Aucun candidat conditionnel rattache.</p>
      </section>
    `;
  }

  return asset.candidates
    .map((candidate) => `
      <section class="section">
        <h3>Candidat conditionnel</h3>
        ${kv("Statut", `<span class="blocked">${candidate.promotionStatus.kind}</span>`)}
        ${kv("Cible", candidate.target)}
        ${kv("Formule", candidate.candidateFormula)}
        ${kv("Confiance", candidate.confidence)}
        ${kv("DPS theorique", `<span class="positive">${formatNumber(candidate.scenarioImpact?.estimatedDps)}</span>`)}
        ${kv("Delta", `<span class="positive">+${formatNumber(candidate.scenarioImpact?.deltaVsStrictDps)} / ${formatPercent(candidate.scenarioImpact?.deltaVsStrictPct)}</span>`)}
        <div class="warning">${candidate.promotionStatus.note}</div>
        <ul class="evidence-list">
          ${candidate.promotionStatus.blockers.map((blocker) => `<li>${blocker}</li>`).join("")}
        </ul>
      </section>
    `)
    .join("");
}

function renderEvidenceSection(asset) {
  const candidate = bestCandidate(asset);
  if (!candidate) {
    return `
      <section class="section">
        <h3>Preuves</h3>
        <p class="empty-state">Aucune preuve conditionnelle rattachee.</p>
      </section>
    `;
  }

  return `
    <section class="section proof-section full">
      <h3>Preuves du candidat</h3>
      <div class="proof-grid">
        ${renderProofGroup("Valeur candidate", candidate.evidence)}
        ${renderProofGroup("Proprietaire", candidate.ownerCandidate?.evidence ?? [])}
        ${renderProofGroup("Trigger", candidate.triggerCandidate?.evidence ?? [])}
      </div>
    </section>
  `;
}

function renderProofGroup(title, evidence) {
  return `
    <div class="proof-group">
      <h4>${title}</h4>
      <ul class="evidence-list">
        ${evidence.map(renderEvidenceItem).join("") || "<li>Aucune preuve disponible.</li>"}
      </ul>
    </div>
  `;
}

function renderEvidenceItem(item) {
  const value = item.value ?? item.note ?? "";
  const note = item.note ? `<div class="evidence-note">${item.note}</div>` : "";
  return `
    <li>
      <div><strong>${item.type || "preuve"}</strong> @ ${item.offset ?? "n/a"} : ${value}</div>
      ${note}
    </li>
  `;
}

function renderFormulaSection(asset) {
  const formulas = asset.formulas.damage.slice(0, 8);
  return `
    <section class="section full">
      <h3>Formules de degats</h3>
      <ul class="formula-list">
        ${formulas.map((formula) => `
          <li>
            <div><strong>${formula.nodeId}</strong> - ${formula.expression}</div>
            <div class="formula-role">${formula.role?.role || "role inconnu"} - valeur ${formatNumber(formula.value)}</div>
          </li>
        `).join("") || "<li>Aucune formule de degats classee.</li>"}
      </ul>
    </section>
  `;
}

function kv(label, value) {
  return `<div class="kv"><span>${label}</span><span>${value}</span></div>`;
}

boot();
