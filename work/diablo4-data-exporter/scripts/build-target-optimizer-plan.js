const fs = require("fs");
const path = require("path");

const targetDatasetFile = process.argv[2] ?? "outputs/diablo4-target-dataset/target-dataset.json";
const compositionFile = process.argv[3] ?? "outputs/diablo4-target-build-composition/target-build-composition.json";
const blockerResolutionFile = process.argv[4] ?? "outputs/diablo4-target-blocker-resolution/target-blocker-resolution.json";
const outDir = process.argv[5] ?? "outputs/diablo4-target-optimizer-plan";
const aspectSlotReadinessFile = "outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json";
const deltaUnblockPlanFile = "outputs/diablo4-delta-unblock-plan/delta-unblock-plan.json";
const deltaPromotionConclusionFile = "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json";
const targetBucketEngineFile = "outputs/diablo4-target-bucket-engine/target-bucket-engine.json";
const fineBucketExtractionPlanFile = "outputs/diablo4-fine-bucket-extraction-plan/fine-bucket-extraction-plan.json";
const additiveBucketSourceConclusionFile = "outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json";
const aspectSlotNextSourcePlanFile = "outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json";
const nextEvidenceRoadmapFile = "outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json";
const externalEvidenceIntakeFile = "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const externalEvidenceBridgePlanFile = "outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json";
const externalDeltaEvidencePlanFile = "outputs/diablo4-external-delta-evidence-plan/external-delta-evidence-plan.json";
const externalDeltaEvidenceWorkorderFile = "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const externalEvidenceSubmissionPackFile = "outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json";
const externalEvidenceSubmissionGateFile = "outputs/diablo4-external-evidence-submission-gate/external-evidence-submission-gate.json";
const externalEvidenceSubmissionIntakePreviewFile = "outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-submission-intake-preview.json";
const externalEvidenceSubmissionPostCopyIntakeFile = "outputs/diablo4-external-evidence-submission-post-copy-intake/external-evidence-submission-post-copy-intake.json";
const externalEvidenceSubmissionManualReviewGateFile = "outputs/diablo4-external-evidence-submission-manual-review-gate/external-evidence-submission-manual-review-gate.json";
const externalEvidenceSubmissionReviewDecisionPackageFile = "outputs/diablo4-external-evidence-submission-review-decision-package/external-evidence-submission-review-decision-package.json";
const externalEvidenceSubmissionReviewDecisionAuditFile = "outputs/diablo4-external-evidence-submission-review-decision-audit/external-evidence-submission-review-decision-audit.json";
const externalEvidenceSubmissionPromotionAuditFile = "outputs/diablo4-external-evidence-submission-promotion-audit/external-evidence-submission-promotion-audit.json";
const externalEvidenceSubmissionImplementationDryRunFile = "outputs/diablo4-external-evidence-submission-implementation-dry-run/external-evidence-submission-implementation-dry-run.json";
const externalEvidenceSubmissionApplicationGateFile = "outputs/diablo4-external-evidence-submission-application-gate/external-evidence-submission-application-gate.json";
const externalEvidenceSubmissionApplyPlanFile = "outputs/diablo4-external-evidence-submission-apply-plan/external-evidence-submission-apply-plan.json";
const newBinaryFamilyPlanFile = "outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json";
const newBinaryFamilyDeltaParentAuditFile = "outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json";
const deltaParentConsumerCorpusScanFile = "outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json";
const deltaParentExpandedDecodePlanFile = "outputs/diablo4-delta-parent-expanded-decode-plan/delta-parent-expanded-decode-plan.json";
const deltaParentUpgradeStructureAuditFile = "outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json";
const deltaParentOffsetReferenceGraphFile = "outputs/diablo4-delta-parent-offset-reference-graph/delta-parent-offset-reference-graph.json";
const deltaParentSystemsTuningContextsFile = "outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json";
const deltaParentUndecodedSourcePlanFile = "outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json";
const deltaParentNontextTableSignalsFile = "outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json";
const deltaLocalExhaustionConclusionFile = "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json";
const deltaNextActionDecisionFile = "outputs/diablo4-delta-next-action-decision/delta-next-action-decision.json";
const sf32LocalExhaustionConclusionFile = "outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json";
const sf32OwnerSourcePacketFile = "outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json";
const sf32OwnerSourceHuntPlanFile = "outputs/diablo4-sf32-owner-source-hunt-plan/sf32-owner-source-hunt-plan.json";
const diabloToolsAttributeSourceAuditFile = "outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json";
const communitySourceTriageAuditFile = "outputs/diablo4-community-source-triage-audit/community-source-triage-audit.json";
const d4dataParserReferenceAuditFile = "outputs/diablo4-d4data-parser-reference-audit/d4data-parser-reference-audit.json";
const selectorAssetRecordParserFile = "outputs/diablo4-selector-asset-record-parser/selector-asset-record-parser.json";
const selector949ReconciliationAuditFile = "outputs/diablo4-selector-949-reconciliation-audit/selector-949-reconciliation-audit.json";
const selector949WindowReparseAuditFile = "outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json";
const local949RoleDecodeAuditFile = "outputs/diablo4-local-949-role-decode-audit/local-949-role-decode-audit.json";
const selectorAssetRecordParserContractFile = "outputs/diablo4-selector-asset-record-parser-contract/selector-asset-record-parser-contract.json";
const sf32OwnerParserBridgeFile = "outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json";
const sf33TriggerSourcePacketFile = "outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json";
const sf33TriggerParserBridgeFile = "outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json";
const uptimeLocalExhaustionConclusionFile = "outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json";
const uptimeSourcePacketFile = "outputs/diablo4-uptime-source-packet/uptime-source-packet.json";
const uptimeParserBridgeFile = "outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json";
const deltaBridgeReadinessFile = "outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json";
const deltaPromotionReviewFile = "outputs/diablo4-delta-promotion-review/delta-promotion-review.json";
const deltaEvidenceIntakePackageFile = "outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json";
const deltaEvidenceDraftFile = "outputs/diablo4-delta-evidence-draft/delta-evidence-draft.json";
const deltaEvidenceDraftAuditFile = "outputs/diablo4-delta-evidence-draft-audit/delta-evidence-draft-audit.json";
const deltaEvidenceIntakeUpdatePreviewFile = "outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json";
const deltaManualPromotionGateFile = "outputs/diablo4-delta-manual-promotion-gate/delta-manual-promotion-gate.json";
const deltaHumanActionPlanFile = "outputs/diablo4-delta-human-action-plan/delta-human-action-plan.json";
const deltaEvidenceFillFormFile = "outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json";
const deltaEvidenceFilledDraftFile = "outputs/diablo4-delta-evidence-filled-draft/delta-evidence-filled-draft.json";
const deltaEvidenceFilledDraftAuditFile = "outputs/diablo4-delta-evidence-filled-draft-audit/delta-evidence-filled-draft-audit.json";
const deltaEvidenceFilledDraftIntakePreviewFile = "outputs/diablo4-delta-evidence-filled-draft-intake-preview/delta-evidence-filled-draft-intake-preview.json";
const deltaEvidenceIntakeCopyGateFile = "outputs/diablo4-delta-evidence-intake-copy-gate/delta-evidence-intake-copy-gate.json";
const deltaEvidencePostCopyIntakeFile = "outputs/diablo4-delta-evidence-post-copy-intake/delta-evidence-post-copy-intake.json";
const deltaEvidenceManualReviewGateFile = "outputs/diablo4-delta-evidence-manual-review-gate/delta-evidence-manual-review-gate.json";
const deltaEvidenceReviewDecisionPackageFile = "outputs/diablo4-delta-evidence-review-decision-package/delta-evidence-review-decision-package.json";
const deltaEvidenceReviewDecisionAuditFile = "outputs/diablo4-delta-evidence-review-decision-audit/delta-evidence-review-decision-audit.json";
const deltaEvidencePromotionAuditFile = "outputs/diablo4-delta-evidence-promotion-audit/delta-evidence-promotion-audit.json";
const deltaPromotionImplementationDryRunFile = "outputs/diablo4-delta-promotion-implementation-dry-run/delta-promotion-implementation-dry-run.json";
const deltaPromotionApplicationGateFile = "outputs/diablo4-delta-promotion-application-gate/delta-promotion-application-gate.json";
const deltaPromotionApplyPlanFile = "outputs/diablo4-delta-promotion-apply-plan/delta-promotion-apply-plan.json";
const userWhatIfScenariosFile = "outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json";
const userWhatIfContractFile = "outputs/diablo4-user-whatif-contract/user-whatif-contract.json";
const reliableDpsGatesFile = "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const workingBaseContractFile = "outputs/diablo4-working-base-contract/working-base-contract.json";
const bucketEngineContractFile = "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json";
const targetOptimizerSuiteFile = "outputs/diablo4-target-optimizer-suite/target-optimizer-suite.json";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function allEntities(targetDataset) {
  const entities = targetDataset.entities ?? {};
  return [
    ...(entities.skills ?? []),
    ...(entities.items ?? []),
    ...(entities.affixes ?? []),
    ...(entities.aspects ?? []),
    ...(entities.paragonNodes ?? []),
    ...(entities.glyphs ?? []),
    ...(entities.runes ?? []),
  ].filter((entity) => entity?.assetId != null);
}

function strictDps(entity) {
  return (entity.modifiers ?? [])
    .filter((modifier) => modifier.bucket === "strict-reviewed-dps" && modifier.operation === "add")
    .reduce((sum, modifier) => sum + Number(modifier.value || 0), 0);
}

function roundDps(value) {
  return Math.round(Number(value || 0));
}

function blockedDelta(entity) {
  const strict = strictDps(entity);
  const bestBlocked = Math.max(0, ...(entity.modifiers ?? [])
    .filter((modifier) => modifier.bucket === "blocked-candidate" || modifier.operation === "unknown")
    .map((modifier) => Number(modifier.value || 0)));
  return bestBlocked > strict ? bestBlocked - strict : 0;
}

function normalizeClass(className) {
  return String(className ?? "unknown").trim().toLowerCase() || "unknown";
}

function entityKind(entity) {
  if (String(entity.id ?? "").includes(":")) return String(entity.id).split(":")[0];
  return entity.kind ?? "entity";
}

function isKnownHeroClass(className) {
  return !["unknown", "all", "generic"].includes(normalizeClass(className));
}

function scoreEntity(entity) {
  const strict = strictDps(entity);
  const delta = blockedDelta(entity);
  const blocked = delta > 0;
  return {
    assetId: entity.assetId,
    entityId: entity.id,
    kind: entityKind(entity),
    class: normalizeClass(entity.class),
    name: entity.name ?? entity.label ?? entity.id,
    strictDps: roundDps(strict),
    blockedCandidateDelta: roundDps(delta),
    reliableDps: roundDps(strict),
    whatIfDps: roundDps(strict + delta),
    optimizerStatus: blocked ? "strict-only-candidate-blocked" : "strict-ready",
    evidenceConfidence: (entity.modifiers ?? [])[0]?.evidence?.confidence ?? null,
  };
}

function slotReadinessByAsset(aspectSlotReadiness) {
  return new Map((aspectSlotReadiness?.aspects ?? []).map((aspect) => [Number(aspect.assetId), aspect]));
}

function buildConstraintIssues(className, entities, aspectSlots) {
  const issues = [];
  const entityClasses = Array.from(new Set(entities.map((entity) => entity.class).filter(isKnownHeroClass)));
  if (!isKnownHeroClass(className)) {
    issues.push({
      kind: "hero-class-unknown",
      priority: "high",
      assetIds: entities.map((entity) => entity.assetId),
      reason: "classe de heros non prouvee pour cette recommandation",
      action: "normaliser la classe avant de proposer ce build",
    });
  }
  if (entityClasses.length > 1) {
    issues.push({
      kind: "mixed-hero-classes",
      priority: "high",
      classes: entityClasses,
      assetIds: entities.map((entity) => entity.assetId),
      reason: "la recommandation contient plusieurs classes de heros",
      action: "filtrer les choix sur une seule classe",
    });
  }

  for (const entity of entities) {
    if (entity.kind !== "aspect") continue;
    const readiness = aspectSlots.get(Number(entity.assetId));
    if (!readiness?.assessment?.slotConstraintReady) {
      issues.push({
        kind: "slot-data-not-normalized",
        priority: "medium",
        assetIds: [entity.assetId],
        reason: "slots d'aspect non prouves",
        action: "extraire les slots autorises avant de valider les conflits d'equipement",
        evidence: readiness
          ? {
              assessment: readiness.assessment.kind,
              confidence: readiness.assessment.confidence,
              detectedSlotTokens: readiness.detectedSlotTokens ?? [],
              externalInferredSlots: readiness.evidence?.externalInferredSlots ?? [],
              prefixCandidatesAssessment: readiness.evidence?.prefixCandidatesAssessment ?? null,
              prefixCandidatesUsableProofs: readiness.evidence?.prefixCandidatesUsableProofs ?? null,
              prefixCandidatesHelmCandidates: readiness.evidence?.prefixCandidatesHelmCandidates ?? null,
              blockerConclusionAssessment: readiness.evidence?.blockerConclusionAssessment ?? null,
              existingEvidenceExhausted: readiness.evidence?.existingEvidenceExhausted === true,
              blockerConclusionUsableProofSignals: readiness.evidence?.blockerConclusionUsableProofSignals ?? null,
            }
          : null,
      });
    }
  }

  return issues;
}

function buildReliabilityGates({ className, entities, issues, blockedCandidateDelta, readiness, blockerSummary }) {
  const issueKinds = new Set(issues.map((issue) => issue.kind));
  const entityClasses = Array.from(new Set(entities.map((entity) => entity.class).filter(isKnownHeroClass)));
  const gates = [
    {
      id: "hero-class-known",
      status: isKnownHeroClass(className) ? "passed" : "failed",
      reason: isKnownHeroClass(className) ? "classe de heros connue" : "classe de heros non prouvee",
    },
    {
      id: "single-hero-class",
      status: entityClasses.length <= 1 ? "passed" : "failed",
      reason: entityClasses.length <= 1 ? "une seule classe de heros" : `classes melangees: ${entityClasses.join(", ")}`,
    },
    {
      id: "slot-constraints-proven",
      status: issueKinds.has("slot-data-not-normalized") ? "failed" : "passed",
      reason: issueKinds.has("slot-data-not-normalized") ? "slots d'aspect non prouves" : "contraintes de slots OK pour ce plan",
    },
    {
      id: "blocked-delta-cleared",
      status: blockedCandidateDelta === 0 ? "passed" : "failed",
      reason: blockedCandidateDelta === 0 ? "aucun delta conditionnel bloque" : "delta conditionnel exclu du ranking fiable",
    },
    {
      id: "fine-buckets-ready",
      status: readiness?.fineBucketsReady === true ? "passed" : "failed",
      reason: readiness?.fineBucketsReady === true ? "buckets fins disponibles" : "modifiers fins additifs/multiplicatifs/uptime manquants",
    },
    {
      id: "global-blockers-cleared",
      status: (blockerSummary?.blocked ?? 0) === 0 ? "passed" : "failed",
      reason: (blockerSummary?.blocked ?? 0) === 0 ? "aucun blocage global actif" : `${blockerSummary?.blocked ?? 0} blocage(s) global(aux) actif(s)`,
    },
  ];
  return {
    gates,
    passed: gates.filter((gate) => gate.status === "passed").length,
    failed: gates.filter((gate) => gate.status !== "passed").length,
    failedGateIds: gates.filter((gate) => gate.status !== "passed").map((gate) => gate.id),
  };
}

function buildStrictPlan(row, aspectSlots, readiness, blockerSummary) {
  const entities = row.topStrictChoices;
  const issues = buildConstraintIssues(row.class, entities, aspectSlots);
  const blockedCandidateDelta = roundDps(row.blockedCandidateDelta);
  const strictConstraintValid = issues.length === 0;
  const reliability = buildReliabilityGates({
    className: row.class,
    entities,
    issues,
    blockedCandidateDelta,
    readiness,
    blockerSummary,
  });
  const reliableOptimizerReady = strictConstraintValid && reliability.failed === 0;
  return {
    class: row.class,
    assetIds: entities.map((entity) => entity.assetId),
    strictDps: roundDps(row.strictDps),
    blockedCandidateDelta,
    reliableDps: roundDps(row.strictDps),
    whatIfDps: roundDps(row.strictDps + blockedCandidateDelta),
    strictConstraintValid,
    reliableOptimizerReady,
    status: !strictConstraintValid
      ? "blocked-by-constraints"
      : blockedCandidateDelta > 0
        ? "strict-valid-with-blocked-delta"
        : reliableOptimizerReady
          ? "reliable-ready"
          : "strict-valid-not-reliable",
    reliability,
    optimizerDecision: {
      reliableDps: roundDps(row.strictDps),
      rankingMode: "strict-only",
      canRankAsReliable: reliableOptimizerReady,
      canLoadAsWorkingBase: strictConstraintValid,
      blockedWhatIfDelta: blockedCandidateDelta,
      nextGate: reliability.failedGateIds[0] ?? null,
    },
    constraintSummary: {
      issueCount: issues.length,
      highPriorityIssues: issues.filter((issue) => issue.priority === "high").length,
      mediumPriorityIssues: issues.filter((issue) => issue.priority === "medium").length,
      issueKinds: Array.from(new Set(issues.map((issue) => issue.kind))).sort(),
    },
    issues,
    topStrictChoices: entities,
    note: blockedCandidateDelta
      ? "Le build strict est evalue sans le delta bloque; le what-if reste explicatif."
      : "Le build strict ne depend pas d'un candidat conditionnel bloque.",
  };
}

function actionForGate(gateId, plan, context = {}) {
  const deltaPlan = context.deltaUnblockPlan;
  const deltaConclusion = context.deltaPromotionConclusion;
  const blockerResolution = context.blockerResolution;
  const fineBucketPlan = context.fineBucketExtractionPlan;
  const additiveBucketConclusion = context.additiveBucketSourceConclusion;
  const aspectSlotPlan = context.aspectSlotNextSourcePlan;
  const gateActions = {
    "blocked-delta-cleared": {
      priority: "high",
      focus: "asset:1663210",
      title: "Debloquer le delta conditionnel spiritborn",
      action: "Resoudre SF_32, SF_33 et uptime avant toute promotion du delta 48960.",
      expectedImpact: "Permettre au plan spiritborn de passer du strict-only au candidat fiable si les preuves convergent.",
      subPlan: deltaPlan
        ? {
            mode: deltaPlan.mode,
            file: deltaUnblockPlanFile,
            blockedSteps: deltaPlan.summary?.blockedSteps ?? null,
            readySteps: deltaPlan.summary?.readySteps ?? null,
            nextStepId: deltaPlan.summary?.nextStepId ?? null,
            nextStepTitle: deltaPlan.summary?.nextStepTitle ?? null,
            assessment: deltaPlan.summary?.assessment?.kind ?? null,
            promotionConclusion: deltaConclusion
              ? {
                  file: deltaPromotionConclusionFile,
                  assessment: deltaConclusion.summary?.assessment?.kind ?? null,
                  confidence: deltaConclusion.summary?.assessment?.confidence ?? null,
                  localEvidenceExhausted: deltaConclusion.summary?.localEvidenceExhausted === true,
                  canUseForReliableDps: deltaConclusion.summary?.canUseForReliableDps === true,
                  canExposeAsWhatIf: deltaConclusion.summary?.canExposeAsWhatIf === true,
                  nextAction: deltaConclusion.summary?.assessment?.nextAction ?? null,
                }
              : null,
          }
        : null,
    },
    "slot-constraints-proven": {
      priority: "high",
      focus: "asset:1461593",
      title: "Prouver les slots d'aspect necromancer",
      action: "Trouver un champ source aspect-equipement ou une source externe fiable pour allowedSlots.",
      expectedImpact: "Debloquer le plan necromancer et les futurs conflits d'equipement.",
      subPlan: aspectSlotPlan
        ? {
            mode: aspectSlotPlan.mode,
            file: aspectSlotNextSourcePlanFile,
            blockedSteps: aspectSlotPlan.summary?.blockedSteps ?? null,
            readySteps: aspectSlotPlan.summary?.readySteps ?? null,
            nextStepId: aspectSlotPlan.summary?.nextStepId ?? null,
            nextStepTitle: aspectSlotPlan.summary?.nextStepTitle ?? null,
            assessment: aspectSlotPlan.summary?.assessment?.kind ?? null,
            slotConclusion: {
              file: aspectSlotNextSourcePlanFile,
              confidence: aspectSlotPlan.summary?.assessment?.confidence ?? null,
              localEvidenceExhausted: aspectSlotPlan.summary?.existingEvidenceExhausted === true,
              slotConstraintReady: aspectSlotPlan.summary?.assessment?.slotConstraintReady === true,
              usableProofSignals: aspectSlotPlan.summary?.usableProofSignals ?? null,
              sourceCandidateMatches: aspectSlotPlan.summary?.sourceCandidateMatches ?? null,
              strongStructuralCandidates: aspectSlotPlan.summary?.strongStructuralCandidates ?? null,
              nextAction: aspectSlotPlan.summary?.assessment?.nextAction ?? null,
            },
          }
        : null,
    },
    "fine-buckets-ready": {
      priority: "medium",
      focus: "bucket-engine",
      title: "Alimenter les buckets fins",
      action: "Extraire des modifiers additifs, multiplicatifs, uptime et caps au lieu du seul DPS agrege.",
      expectedImpact: "Preparer le vrai calcul Diablo IV sans changer les garde-fous de promotion.",
      subPlan: fineBucketPlan
        ? {
            mode: fineBucketPlan.mode,
            file: fineBucketExtractionPlanFile,
            blockedSteps: fineBucketPlan.summary?.blockedSteps ?? null,
            readySteps: fineBucketPlan.summary?.readySteps ?? null,
            nextStepId: fineBucketPlan.summary?.nextStepId ?? null,
            nextStepTitle: fineBucketPlan.summary?.nextStepTitle ?? null,
            assessment: fineBucketPlan.summary?.assessment?.kind ?? null,
            sourceConclusion: additiveBucketConclusion
              ? {
                  file: additiveBucketSourceConclusionFile,
                  assessment: additiveBucketConclusion.summary?.assessment?.kind ?? null,
                  confidence: additiveBucketConclusion.summary?.assessment?.confidence ?? null,
                  localEvidenceExhausted: additiveBucketConclusion.summary?.localEvidenceExhausted === true,
                  nextAction: additiveBucketConclusion.summary?.assessment?.nextAction ?? null,
                }
              : null,
          }
        : null,
    },
    "global-blockers-cleared": {
      priority: "medium",
      focus: "target-blocker-resolution",
      title: "Fermer les blocages globaux",
      action: "Resoudre ou expliciter les blocages encore actifs avant de declarer un plan fiable.",
      expectedImpact: "Faire passer reliableStrictBuilds au-dessus de zero lorsque les autres portes sont pretes.",
      subPlan: blockerResolution
        ? {
            mode: blockerResolution.mode,
            file: blockerResolutionFile,
            blockedSteps: blockerResolution.summary?.blocked ?? null,
            readySteps: blockerResolution.summary?.resolved ?? null,
            nextStepId: blockerResolution.assets?.[0]?.blockers?.[0]?.kind ?? null,
            nextStepTitle: deltaConclusion?.summary?.assessment?.nextAction
              ?? blockerResolution.summary?.nextActions?.[0]
              ?? "Fermer les blocages globaux actifs",
            assessment: blockerResolution.summary?.promotionReady === true
              ? "target-blockers-cleared"
              : "target-blockers-active",
            blockerConclusion: {
              assets: blockerResolution.summary?.assets ?? null,
              blockers: blockerResolution.summary?.blockers ?? null,
              promotionReady: blockerResolution.summary?.promotionReady === true,
              deltaConclusionAssessment: deltaConclusion?.summary?.assessment?.kind ?? null,
              deltaLocalEvidenceExhausted: deltaConclusion?.summary?.localEvidenceExhausted === true,
              blockerKinds: Array.from(new Set((blockerResolution.assets ?? [])
                .flatMap((asset) => asset.blockers ?? [])
                .map((blocker) => blocker.kind))).sort(),
              nextActions: blockerResolution.summary?.nextActions ?? [],
            },
          }
        : null,
    },
    "hero-class-known": {
      priority: "medium",
      focus: "target-dataset",
      title: "Normaliser les classes inconnues",
      action: "Mapper les entites unknown/generic vers une classe prouvee ou les exclure du ranking classe.",
      expectedImpact: "Eviter les plans ambigus par classe.",
    },
    "single-hero-class": {
      priority: "high",
      focus: "build-constraints",
      title: "Eviter les builds multi-classes",
      action: "Filtrer les compositions automatiques sur une seule classe de heros.",
      expectedImpact: "Garantir que les builds proposes sont jouables.",
    },
  };
  const template = gateActions[gateId] ?? {
    priority: "low",
    focus: "optimizer",
    title: `Resoudre ${gateId}`,
    action: "Analyser cette porte de fiabilite avant ranking fiable.",
    expectedImpact: "Reduire l'incertitude du plan.",
  };
  return {
    gateId,
    class: plan.class,
    assetIds: plan.assetIds,
    ...template,
  };
}

function priorityRank(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] ?? 0;
}

function buildActionQueue(plans, context = {}) {
  const actions = [];
  for (const plan of plans) {
    const failedGateIds = plan.reliability?.failedGateIds ?? [];
    for (const gateId of failedGateIds) actions.push(actionForGate(gateId, plan, context));
  }
  const deduped = Array.from(new Map(actions.map((action) => [
    `${action.gateId}:${action.focus}`,
    {
      ...action,
      classes: Array.from(new Set(actions
        .filter((candidate) => candidate.gateId === action.gateId && candidate.focus === action.focus)
        .map((candidate) => candidate.class))).sort(),
      assetIds: Array.from(new Set(actions
        .filter((candidate) => candidate.gateId === action.gateId && candidate.focus === action.focus)
        .flatMap((candidate) => candidate.assetIds))).sort((a, b) => a - b),
    },
  ])).values());
  return deduped
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || a.gateId.localeCompare(b.gateId))
    .map((action, index) => ({
      id: `optimizer-action-${String(index + 1).padStart(2, "0")}`,
      rank: index + 1,
      ...action,
    }));
}

function groupBy(values, keyFn) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFn(value);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }
  return groups;
}

const targetDataset = readJson(targetDatasetFile);
const composition = readJson(compositionFile);
const blockerResolution = readJson(blockerResolutionFile);
const aspectSlotReadiness = readOptionalJson(aspectSlotReadinessFile);
const deltaUnblockPlan = readOptionalJson(deltaUnblockPlanFile);
const deltaPromotionConclusion = readOptionalJson(deltaPromotionConclusionFile);
const targetBucketEngine = readOptionalJson(targetBucketEngineFile);
const fineBucketExtractionPlan = readOptionalJson(fineBucketExtractionPlanFile);
const additiveBucketSourceConclusion = readOptionalJson(additiveBucketSourceConclusionFile);
const aspectSlotNextSourcePlan = readOptionalJson(aspectSlotNextSourcePlanFile);
const nextEvidenceRoadmap = readOptionalJson(nextEvidenceRoadmapFile);
const externalEvidenceIntake = readOptionalJson(externalEvidenceIntakeFile);
const externalEvidenceBridgePlan = readOptionalJson(externalEvidenceBridgePlanFile);
const externalDeltaEvidencePlan = readOptionalJson(externalDeltaEvidencePlanFile);
const externalDeltaEvidenceWorkorder = readOptionalJson(externalDeltaEvidenceWorkorderFile);
const externalEvidenceSubmissionPack = readOptionalJson(externalEvidenceSubmissionPackFile);
const externalEvidenceSubmissionGate = readOptionalJson(externalEvidenceSubmissionGateFile);
const externalEvidenceSubmissionIntakePreview = readOptionalJson(externalEvidenceSubmissionIntakePreviewFile);
const externalEvidenceSubmissionPostCopyIntake = readOptionalJson(externalEvidenceSubmissionPostCopyIntakeFile);
const externalEvidenceSubmissionManualReviewGate = readOptionalJson(externalEvidenceSubmissionManualReviewGateFile);
const externalEvidenceSubmissionReviewDecisionPackage = readOptionalJson(externalEvidenceSubmissionReviewDecisionPackageFile);
const externalEvidenceSubmissionReviewDecisionAudit = readOptionalJson(externalEvidenceSubmissionReviewDecisionAuditFile);
const externalEvidenceSubmissionPromotionAudit = readOptionalJson(externalEvidenceSubmissionPromotionAuditFile);
const externalEvidenceSubmissionImplementationDryRun = readOptionalJson(externalEvidenceSubmissionImplementationDryRunFile);
const externalEvidenceSubmissionApplicationGate = readOptionalJson(externalEvidenceSubmissionApplicationGateFile);
const externalEvidenceSubmissionApplyPlan = readOptionalJson(externalEvidenceSubmissionApplyPlanFile);
const newBinaryFamilyPlan = readOptionalJson(newBinaryFamilyPlanFile);
const newBinaryFamilyDeltaParentAudit = readOptionalJson(newBinaryFamilyDeltaParentAuditFile);
const deltaParentConsumerCorpusScan = readOptionalJson(deltaParentConsumerCorpusScanFile);
const deltaParentExpandedDecodePlan = readOptionalJson(deltaParentExpandedDecodePlanFile);
const deltaParentUpgradeStructureAudit = readOptionalJson(deltaParentUpgradeStructureAuditFile);
const deltaParentOffsetReferenceGraph = readOptionalJson(deltaParentOffsetReferenceGraphFile);
const deltaParentSystemsTuningContexts = readOptionalJson(deltaParentSystemsTuningContextsFile);
const deltaParentUndecodedSourcePlan = readOptionalJson(deltaParentUndecodedSourcePlanFile);
const deltaParentNontextTableSignals = readOptionalJson(deltaParentNontextTableSignalsFile);
const deltaLocalExhaustionConclusion = readOptionalJson(deltaLocalExhaustionConclusionFile);
const deltaNextActionDecision = readOptionalJson(deltaNextActionDecisionFile);
const sf32LocalExhaustionConclusion = readOptionalJson(sf32LocalExhaustionConclusionFile);
const sf32OwnerSourcePacket = readOptionalJson(sf32OwnerSourcePacketFile);
const sf32OwnerSourceHuntPlan = readOptionalJson(sf32OwnerSourceHuntPlanFile);
const diabloToolsAttributeSourceAudit = readOptionalJson(diabloToolsAttributeSourceAuditFile);
const communitySourceTriageAudit = readOptionalJson(communitySourceTriageAuditFile);
const d4dataParserReferenceAudit = readOptionalJson(d4dataParserReferenceAuditFile);
const selectorAssetRecordParser = readOptionalJson(selectorAssetRecordParserFile);
const selector949ReconciliationAudit = readOptionalJson(selector949ReconciliationAuditFile);
const selector949WindowReparseAudit = readOptionalJson(selector949WindowReparseAuditFile);
const local949RoleDecodeAudit = readOptionalJson(local949RoleDecodeAuditFile);
const selectorAssetRecordParserContract = readOptionalJson(selectorAssetRecordParserContractFile);
const sf32OwnerParserBridge = readOptionalJson(sf32OwnerParserBridgeFile);
const sf33TriggerSourcePacket = readOptionalJson(sf33TriggerSourcePacketFile);
const sf33TriggerParserBridge = readOptionalJson(sf33TriggerParserBridgeFile);
const uptimeLocalExhaustionConclusion = readOptionalJson(uptimeLocalExhaustionConclusionFile);
const uptimeSourcePacket = readOptionalJson(uptimeSourcePacketFile);
const uptimeParserBridge = readOptionalJson(uptimeParserBridgeFile);
const deltaBridgeReadiness = readOptionalJson(deltaBridgeReadinessFile);
const deltaPromotionReview = readOptionalJson(deltaPromotionReviewFile);
const deltaEvidenceIntakePackage = readOptionalJson(deltaEvidenceIntakePackageFile);
const deltaEvidenceDraft = readOptionalJson(deltaEvidenceDraftFile);
const deltaEvidenceDraftAudit = readOptionalJson(deltaEvidenceDraftAuditFile);
const deltaEvidenceIntakeUpdatePreview = readOptionalJson(deltaEvidenceIntakeUpdatePreviewFile);
const deltaManualPromotionGate = readOptionalJson(deltaManualPromotionGateFile);
const deltaHumanActionPlan = readOptionalJson(deltaHumanActionPlanFile);
const deltaEvidenceFillForm = readOptionalJson(deltaEvidenceFillFormFile);
const deltaEvidenceFilledDraft = readOptionalJson(deltaEvidenceFilledDraftFile);
const deltaEvidenceFilledDraftAudit = readOptionalJson(deltaEvidenceFilledDraftAuditFile);
const deltaEvidenceFilledDraftIntakePreview = readOptionalJson(deltaEvidenceFilledDraftIntakePreviewFile);
const deltaEvidenceIntakeCopyGate = readOptionalJson(deltaEvidenceIntakeCopyGateFile);
const deltaEvidencePostCopyIntake = readOptionalJson(deltaEvidencePostCopyIntakeFile);
const deltaEvidenceManualReviewGate = readOptionalJson(deltaEvidenceManualReviewGateFile);
const deltaEvidenceReviewDecisionPackage = readOptionalJson(deltaEvidenceReviewDecisionPackageFile);
const deltaEvidenceReviewDecisionAudit = readOptionalJson(deltaEvidenceReviewDecisionAuditFile);
const deltaEvidencePromotionAudit = readOptionalJson(deltaEvidencePromotionAuditFile);
const deltaPromotionImplementationDryRun = readOptionalJson(deltaPromotionImplementationDryRunFile);
const deltaPromotionApplicationGate = readOptionalJson(deltaPromotionApplicationGateFile);
const deltaPromotionApplyPlan = readOptionalJson(deltaPromotionApplyPlanFile);
const userWhatIfScenarios = readOptionalJson(userWhatIfScenariosFile);
const userWhatIfContract = readOptionalJson(userWhatIfContractFile);
const reliableDpsGates = readOptionalJson(reliableDpsGatesFile);
const workingBaseContract = readOptionalJson(workingBaseContractFile);
const bucketEngineContract = readOptionalJson(bucketEngineContractFile);
const targetOptimizerSuite = readOptionalJson(targetOptimizerSuiteFile);
const aspectSlots = slotReadinessByAsset(aspectSlotReadiness);
const scored = allEntities(targetDataset)
  .map(scoreEntity)
  .filter((entity) => entity.strictDps > 0 || entity.blockedCandidateDelta > 0)
  .sort((a, b) => b.reliableDps - a.reliableDps || b.blockedCandidateDelta - a.blockedCandidateDelta);
const byClass = Array.from(groupBy(scored, (entity) => entity.class).entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([className, entities]) => ({
    class: className,
    strictDps: roundDps(entities.reduce((sum, entity) => sum + entity.reliableDps, 0)),
    blockedCandidateDelta: roundDps(entities.reduce((sum, entity) => sum + entity.blockedCandidateDelta, 0)),
    optimizerReady: entities.length > 0 && !composition.bucketEngine?.readiness?.reliableOptimizerReady ? false : true,
    topStrictChoices: entities.slice(0, 5),
  }));

const currentBuild = {
  assetIds: composition.input?.assetIds ?? [],
  strictDps: composition.totals?.strict ?? 0,
  whatIfDps: composition.totals?.whatIf ?? 0,
  candidateDelta: composition.totals?.candidateDelta ?? 0,
  quality: composition.quality ?? null,
  constraints: composition.constraints ?? null,
  readiness: composition.bucketEngine?.readiness ?? null,
  blockers: blockerResolution.summary ?? null,
};

const recommendedStrictByClass = byClass
  .filter((row) => isKnownHeroClass(row.class))
  .map((row) => buildStrictPlan(row, aspectSlots, composition.bucketEngine?.readiness ?? null, blockerResolution.summary ?? null));

const validStrictBuilds = recommendedStrictByClass.filter((row) => row.strictConstraintValid);
const reliableStrictBuilds = recommendedStrictByClass.filter((row) => row.reliableOptimizerReady);
const actionQueue = buildActionQueue(recommendedStrictByClass, {
  blockerResolution,
  deltaUnblockPlan,
  deltaPromotionConclusion,
  fineBucketExtractionPlan,
  additiveBucketSourceConclusion,
  aspectSlotNextSourcePlan,
});

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "target-optimizer-plan-v1",
  source: {
    targetDatasetFile,
    compositionFile,
    blockerResolutionFile,
    aspectSlotReadinessFile: aspectSlotReadiness ? aspectSlotReadinessFile : null,
    deltaUnblockPlanFile: deltaUnblockPlan ? deltaUnblockPlanFile : null,
    deltaPromotionConclusionFile: deltaPromotionConclusion ? deltaPromotionConclusionFile : null,
    targetBucketEngineFile: targetBucketEngine ? targetBucketEngineFile : null,
    fineBucketExtractionPlanFile: fineBucketExtractionPlan ? fineBucketExtractionPlanFile : null,
    additiveBucketSourceConclusionFile: additiveBucketSourceConclusion ? additiveBucketSourceConclusionFile : null,
    aspectSlotNextSourcePlanFile: aspectSlotNextSourcePlan ? aspectSlotNextSourcePlanFile : null,
    nextEvidenceRoadmapFile: nextEvidenceRoadmap ? nextEvidenceRoadmapFile : null,
    externalEvidenceIntakeFile: externalEvidenceIntake ? externalEvidenceIntakeFile : null,
    externalEvidenceBridgePlanFile: externalEvidenceBridgePlan ? externalEvidenceBridgePlanFile : null,
    externalDeltaEvidencePlanFile: externalDeltaEvidencePlan ? externalDeltaEvidencePlanFile : null,
    externalDeltaEvidenceWorkorderFile: externalDeltaEvidenceWorkorder ? externalDeltaEvidenceWorkorderFile : null,
    externalEvidenceSubmissionPackFile: externalEvidenceSubmissionPack ? externalEvidenceSubmissionPackFile : null,
    externalEvidenceSubmissionGateFile: externalEvidenceSubmissionGate ? externalEvidenceSubmissionGateFile : null,
    externalEvidenceSubmissionIntakePreviewFile: externalEvidenceSubmissionIntakePreview ? externalEvidenceSubmissionIntakePreviewFile : null,
    externalEvidenceSubmissionPostCopyIntakeFile: externalEvidenceSubmissionPostCopyIntake ? externalEvidenceSubmissionPostCopyIntakeFile : null,
    externalEvidenceSubmissionManualReviewGateFile: externalEvidenceSubmissionManualReviewGate ? externalEvidenceSubmissionManualReviewGateFile : null,
    externalEvidenceSubmissionReviewDecisionPackageFile: externalEvidenceSubmissionReviewDecisionPackage ? externalEvidenceSubmissionReviewDecisionPackageFile : null,
    externalEvidenceSubmissionReviewDecisionAuditFile: externalEvidenceSubmissionReviewDecisionAudit ? externalEvidenceSubmissionReviewDecisionAuditFile : null,
    externalEvidenceSubmissionPromotionAuditFile: externalEvidenceSubmissionPromotionAudit ? externalEvidenceSubmissionPromotionAuditFile : null,
    externalEvidenceSubmissionImplementationDryRunFile: externalEvidenceSubmissionImplementationDryRun ? externalEvidenceSubmissionImplementationDryRunFile : null,
    externalEvidenceSubmissionApplicationGateFile: externalEvidenceSubmissionApplicationGate ? externalEvidenceSubmissionApplicationGateFile : null,
    externalEvidenceSubmissionApplyPlanFile: externalEvidenceSubmissionApplyPlan ? externalEvidenceSubmissionApplyPlanFile : null,
    newBinaryFamilyPlanFile: newBinaryFamilyPlan ? newBinaryFamilyPlanFile : null,
    newBinaryFamilyDeltaParentAuditFile: newBinaryFamilyDeltaParentAudit ? newBinaryFamilyDeltaParentAuditFile : null,
    deltaParentConsumerCorpusScanFile: deltaParentConsumerCorpusScan ? deltaParentConsumerCorpusScanFile : null,
    deltaParentExpandedDecodePlanFile: deltaParentExpandedDecodePlan ? deltaParentExpandedDecodePlanFile : null,
    deltaParentUpgradeStructureAuditFile: deltaParentUpgradeStructureAudit ? deltaParentUpgradeStructureAuditFile : null,
    deltaParentOffsetReferenceGraphFile: deltaParentOffsetReferenceGraph ? deltaParentOffsetReferenceGraphFile : null,
    deltaParentSystemsTuningContextsFile: deltaParentSystemsTuningContexts ? deltaParentSystemsTuningContextsFile : null,
    deltaParentUndecodedSourcePlanFile: deltaParentUndecodedSourcePlan ? deltaParentUndecodedSourcePlanFile : null,
    deltaParentNontextTableSignalsFile: deltaParentNontextTableSignals ? deltaParentNontextTableSignalsFile : null,
    deltaLocalExhaustionConclusionFile: deltaLocalExhaustionConclusion ? deltaLocalExhaustionConclusionFile : null,
    deltaNextActionDecisionFile: deltaNextActionDecision ? deltaNextActionDecisionFile : null,
    sf32LocalExhaustionConclusionFile: sf32LocalExhaustionConclusion ? sf32LocalExhaustionConclusionFile : null,
    sf32OwnerSourcePacketFile: sf32OwnerSourcePacket ? sf32OwnerSourcePacketFile : null,
    sf32OwnerSourceHuntPlanFile: sf32OwnerSourceHuntPlan ? sf32OwnerSourceHuntPlanFile : null,
    diabloToolsAttributeSourceAuditFile: diabloToolsAttributeSourceAudit ? diabloToolsAttributeSourceAuditFile : null,
    communitySourceTriageAuditFile: communitySourceTriageAudit ? communitySourceTriageAuditFile : null,
    d4dataParserReferenceAuditFile: d4dataParserReferenceAudit ? d4dataParserReferenceAuditFile : null,
    selectorAssetRecordParserFile: selectorAssetRecordParser ? selectorAssetRecordParserFile : null,
    selector949ReconciliationAuditFile: selector949ReconciliationAudit ? selector949ReconciliationAuditFile : null,
    selector949WindowReparseAuditFile: selector949WindowReparseAudit ? selector949WindowReparseAuditFile : null,
    local949RoleDecodeAuditFile: local949RoleDecodeAudit ? local949RoleDecodeAuditFile : null,
    selectorAssetRecordParserContractFile: selectorAssetRecordParserContract ? selectorAssetRecordParserContractFile : null,
    sf32OwnerParserBridgeFile: sf32OwnerParserBridge ? sf32OwnerParserBridgeFile : null,
    sf33TriggerSourcePacketFile: sf33TriggerSourcePacket ? sf33TriggerSourcePacketFile : null,
    sf33TriggerParserBridgeFile: sf33TriggerParserBridge ? sf33TriggerParserBridgeFile : null,
    uptimeLocalExhaustionConclusionFile: uptimeLocalExhaustionConclusion ? uptimeLocalExhaustionConclusionFile : null,
    uptimeSourcePacketFile: uptimeSourcePacket ? uptimeSourcePacketFile : null,
    uptimeParserBridgeFile: uptimeParserBridge ? uptimeParserBridgeFile : null,
    deltaBridgeReadinessFile: deltaBridgeReadiness ? deltaBridgeReadinessFile : null,
    deltaPromotionReviewFile: deltaPromotionReview ? deltaPromotionReviewFile : null,
    deltaEvidenceIntakePackageFile: deltaEvidenceIntakePackage ? deltaEvidenceIntakePackageFile : null,
    deltaEvidenceDraftFile: deltaEvidenceDraft ? deltaEvidenceDraftFile : null,
    deltaEvidenceDraftAuditFile: deltaEvidenceDraftAudit ? deltaEvidenceDraftAuditFile : null,
    deltaEvidenceIntakeUpdatePreviewFile: deltaEvidenceIntakeUpdatePreview ? deltaEvidenceIntakeUpdatePreviewFile : null,
    deltaManualPromotionGateFile: deltaManualPromotionGate ? deltaManualPromotionGateFile : null,
    deltaHumanActionPlanFile: deltaHumanActionPlan ? deltaHumanActionPlanFile : null,
    deltaEvidenceFillFormFile: deltaEvidenceFillForm ? deltaEvidenceFillFormFile : null,
    deltaEvidenceFilledDraftFile: deltaEvidenceFilledDraft ? deltaEvidenceFilledDraftFile : null,
    deltaEvidenceFilledDraftAuditFile: deltaEvidenceFilledDraftAudit ? deltaEvidenceFilledDraftAuditFile : null,
    deltaEvidenceFilledDraftIntakePreviewFile: deltaEvidenceFilledDraftIntakePreview ? deltaEvidenceFilledDraftIntakePreviewFile : null,
    deltaEvidenceIntakeCopyGateFile: deltaEvidenceIntakeCopyGate ? deltaEvidenceIntakeCopyGateFile : null,
    deltaEvidencePostCopyIntakeFile: deltaEvidencePostCopyIntake ? deltaEvidencePostCopyIntakeFile : null,
    deltaEvidenceManualReviewGateFile: deltaEvidenceManualReviewGate ? deltaEvidenceManualReviewGateFile : null,
    deltaEvidenceReviewDecisionPackageFile: deltaEvidenceReviewDecisionPackage ? deltaEvidenceReviewDecisionPackageFile : null,
    deltaEvidenceReviewDecisionAuditFile: deltaEvidenceReviewDecisionAudit ? deltaEvidenceReviewDecisionAuditFile : null,
    deltaEvidencePromotionAuditFile: deltaEvidencePromotionAudit ? deltaEvidencePromotionAuditFile : null,
    deltaPromotionImplementationDryRunFile: deltaPromotionImplementationDryRun ? deltaPromotionImplementationDryRunFile : null,
    deltaPromotionApplicationGateFile: deltaPromotionApplicationGate ? deltaPromotionApplicationGateFile : null,
    deltaPromotionApplyPlanFile: deltaPromotionApplyPlan ? deltaPromotionApplyPlanFile : null,
    userWhatIfScenariosFile: userWhatIfScenarios ? userWhatIfScenariosFile : null,
    reliableDpsGatesFile: reliableDpsGates ? reliableDpsGatesFile : null,
    workingBaseContractFile: workingBaseContract ? workingBaseContractFile : null,
    bucketEngineContractFile: bucketEngineContract ? bucketEngineContractFile : null,
    targetOptimizerSuiteFile: targetOptimizerSuite ? targetOptimizerSuiteFile : null,
  },
  summary: {
    scoredEntities: scored.length,
    classes: byClass.length,
    reliableOptimizerReady: targetBucketEngine?.summary?.reliableOptimizerReady === true || composition.bucketEngine?.readiness?.reliableOptimizerReady === true,
    currentBuildValid: composition.constraints?.valid === true,
    strictOnlyReady: targetBucketEngine?.summary?.strictOnlyReady === true || composition.bucketEngine?.readiness?.strictOnlyReady === true,
    fineBucketsReady: targetBucketEngine?.summary?.fineBucketsReady === true || composition.bucketEngine?.readiness?.fineBucketsReady === true,
    blockedCandidates: composition.totals?.blockedCandidates ?? 0,
    constrainedPlans: recommendedStrictByClass.length,
    validStrictBuilds: validStrictBuilds.length,
    reliableStrictBuilds: reliableStrictBuilds.length,
    reliabilityGateFailures: Array.from(new Set(recommendedStrictByClass.flatMap((row) => row.reliability?.failedGateIds ?? []))).sort(),
    actionQueueSize: actionQueue.length,
    topAction: actionQueue[0]?.title ?? null,
    recommendation: "strict-only-class-constrained-plan",
    promotionReady: false,
    nextAction: "Utiliser le meilleur build strict valide comme base de travail, puis debloquer slots et deltas conditionnels avant toute optimisation fiable.",
  },
  currentBuild,
  deltaUnblockPlan: deltaUnblockPlan
    ? {
        file: deltaUnblockPlanFile,
        summary: deltaUnblockPlan.summary,
      }
    : null,
  deltaPromotionConclusion: deltaPromotionConclusion
    ? {
        file: deltaPromotionConclusionFile,
        summary: deltaPromotionConclusion.summary,
      }
    : null,
  targetBucketEngine: targetBucketEngine
    ? {
        file: targetBucketEngineFile,
        summary: targetBucketEngine.summary,
        buckets: targetBucketEngine.buckets,
        gates: targetBucketEngine.gates,
        classPlans: targetBucketEngine.classPlans,
        bestStrictClassPlan: targetBucketEngine.bestStrictClassPlan,
        bestReliableClassPlan: targetBucketEngine.bestReliableClassPlan,
      }
    : null,
  fineBucketExtractionPlan: fineBucketExtractionPlan
    ? {
        file: fineBucketExtractionPlanFile,
        summary: fineBucketExtractionPlan.summary,
      }
    : null,
  additiveBucketSourceConclusion: additiveBucketSourceConclusion
    ? {
        file: additiveBucketSourceConclusionFile,
        summary: additiveBucketSourceConclusion.summary,
      }
    : null,
  aspectSlotNextSourcePlan: aspectSlotNextSourcePlan
    ? {
        file: aspectSlotNextSourcePlanFile,
        summary: aspectSlotNextSourcePlan.summary,
      }
    : null,
  nextEvidenceRoadmap: nextEvidenceRoadmap
    ? {
        file: nextEvidenceRoadmapFile,
        summary: nextEvidenceRoadmap.summary,
        roadmap: nextEvidenceRoadmap.roadmap,
      }
    : null,
  externalEvidenceIntake: externalEvidenceIntake
    ? {
        file: externalEvidenceIntakeFile,
        summary: externalEvidenceIntake.summary,
        candidates: externalEvidenceIntake.candidates,
        requirements: externalEvidenceIntake.requirements,
        safeguards: externalEvidenceIntake.safeguards,
      }
    : null,
  externalEvidenceBridgePlan: externalEvidenceBridgePlan
    ? {
        file: externalEvidenceBridgePlanFile,
        summary: externalEvidenceBridgePlan.summary,
        steps: externalEvidenceBridgePlan.steps,
        safeguards: externalEvidenceBridgePlan.safeguards,
      }
    : null,
  externalDeltaEvidencePlan: externalDeltaEvidencePlan
    ? {
        file: externalDeltaEvidencePlanFile,
        summary: externalDeltaEvidencePlan.summary,
        requiredProofs: externalDeltaEvidencePlan.requiredProofs,
        exampleCandidates: externalDeltaEvidencePlan.exampleCandidates,
        safeguards: externalDeltaEvidencePlan.safeguards,
      }
    : null,
  externalDeltaEvidenceWorkorder: externalDeltaEvidenceWorkorder
    ? {
        file: externalDeltaEvidenceWorkorderFile,
        summary: externalDeltaEvidenceWorkorder.summary,
        tasks: externalDeltaEvidenceWorkorder.tasks,
        intakeAppendix: externalDeltaEvidenceWorkorder.intakeAppendix,
        safeguards: externalDeltaEvidenceWorkorder.safeguards,
      }
    : null,
  externalEvidenceSubmissionPack: externalEvidenceSubmissionPack
    ? {
        file: externalEvidenceSubmissionPackFile,
        markdownFile: "outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.md",
        summary: externalEvidenceSubmissionPack.summary,
        targetTask: externalEvidenceSubmissionPack.targetTask,
        candidateSnippet: externalEvidenceSubmissionPack.candidateSnippet,
        supersededClaim: externalEvidenceSubmissionPack.supersededClaim,
        submissionSteps: externalEvidenceSubmissionPack.submissionSteps,
        safeguards: externalEvidenceSubmissionPack.safeguards,
      }
    : null,
  externalEvidenceSubmissionGate: externalEvidenceSubmissionGate
    ? {
        file: externalEvidenceSubmissionGateFile,
        summary: externalEvidenceSubmissionGate.summary,
        gateChecks: externalEvidenceSubmissionGate.gateChecks,
        candidateToCopy: externalEvidenceSubmissionGate.candidateToCopy,
        manualCopyTarget: externalEvidenceSubmissionGate.manualCopyTarget,
        safeguards: externalEvidenceSubmissionGate.safeguards,
      }
    : null,
  externalEvidenceSubmissionIntakePreview: externalEvidenceSubmissionIntakePreview
    ? {
        file: externalEvidenceSubmissionIntakePreviewFile,
        previewFile: "outputs/diablo4-external-evidence-submission-intake-preview/external-evidence-candidates.submission-preview.json",
        summary: externalEvidenceSubmissionIntakePreview.summary,
        candidatePreview: externalEvidenceSubmissionIntakePreview.candidatePreview,
        safeguards: externalEvidenceSubmissionIntakePreview.safeguards,
      }
    : null,
  externalEvidenceSubmissionPostCopyIntake: externalEvidenceSubmissionPostCopyIntake
    ? {
        file: externalEvidenceSubmissionPostCopyIntakeFile,
        summary: externalEvidenceSubmissionPostCopyIntake.summary,
        candidateToCopy: externalEvidenceSubmissionPostCopyIntake.candidateToCopy,
        targetCandidate: externalEvidenceSubmissionPostCopyIntake.targetCandidate,
        blockers: externalEvidenceSubmissionPostCopyIntake.blockers,
        safeguards: externalEvidenceSubmissionPostCopyIntake.safeguards,
      }
    : null,
  externalEvidenceSubmissionManualReviewGate: externalEvidenceSubmissionManualReviewGate
    ? {
        file: externalEvidenceSubmissionManualReviewGateFile,
        summary: externalEvidenceSubmissionManualReviewGate.summary,
        gateChecks: externalEvidenceSubmissionManualReviewGate.gateChecks,
        targetCandidate: externalEvidenceSubmissionManualReviewGate.targetCandidate,
        reviewerDecisionTemplate: externalEvidenceSubmissionManualReviewGate.reviewerDecisionTemplate,
        safeguards: externalEvidenceSubmissionManualReviewGate.safeguards,
      }
    : null,
  externalEvidenceSubmissionReviewDecisionPackage: externalEvidenceSubmissionReviewDecisionPackage
    ? {
        file: externalEvidenceSubmissionReviewDecisionPackageFile,
        summary: externalEvidenceSubmissionReviewDecisionPackage.summary,
        readinessChecks: externalEvidenceSubmissionReviewDecisionPackage.readinessChecks,
        targetCandidate: externalEvidenceSubmissionReviewDecisionPackage.targetCandidate,
        decisionInputTemplate: externalEvidenceSubmissionReviewDecisionPackage.decisionInputTemplate,
        safeguards: externalEvidenceSubmissionReviewDecisionPackage.safeguards,
      }
    : null,
  externalEvidenceSubmissionReviewDecisionAudit: externalEvidenceSubmissionReviewDecisionAudit
    ? {
        file: externalEvidenceSubmissionReviewDecisionAuditFile,
        summary: externalEvidenceSubmissionReviewDecisionAudit.summary,
        auditChecks: externalEvidenceSubmissionReviewDecisionAudit.auditChecks,
        decisionInput: externalEvidenceSubmissionReviewDecisionAudit.decisionInput,
        template: externalEvidenceSubmissionReviewDecisionAudit.template,
        safeguards: externalEvidenceSubmissionReviewDecisionAudit.safeguards,
      }
    : null,
  externalEvidenceSubmissionPromotionAudit: externalEvidenceSubmissionPromotionAudit
    ? {
        file: externalEvidenceSubmissionPromotionAuditFile,
        summary: externalEvidenceSubmissionPromotionAudit.summary,
        auditChecks: externalEvidenceSubmissionPromotionAudit.auditChecks,
        gateRows: externalEvidenceSubmissionPromotionAudit.gateRows,
        implementationContract: externalEvidenceSubmissionPromotionAudit.implementationContract,
        safeguards: externalEvidenceSubmissionPromotionAudit.safeguards,
      }
    : null,
  externalEvidenceSubmissionImplementationDryRun: externalEvidenceSubmissionImplementationDryRun
    ? {
        file: externalEvidenceSubmissionImplementationDryRunFile,
        summary: externalEvidenceSubmissionImplementationDryRun.summary,
        dryRunChecks: externalEvidenceSubmissionImplementationDryRun.dryRunChecks,
        patchPreview: externalEvidenceSubmissionImplementationDryRun.patchPreview,
        regressionTargets: externalEvidenceSubmissionImplementationDryRun.regressionTargets,
        safeguards: externalEvidenceSubmissionImplementationDryRun.safeguards,
      }
    : null,
  externalEvidenceSubmissionApplicationGate: externalEvidenceSubmissionApplicationGate
    ? {
        file: externalEvidenceSubmissionApplicationGateFile,
        summary: externalEvidenceSubmissionApplicationGate.summary,
        gateChecks: externalEvidenceSubmissionApplicationGate.gateChecks,
        patchPreview: externalEvidenceSubmissionApplicationGate.patchPreview,
        applyContract: externalEvidenceSubmissionApplicationGate.applyContract,
        safeguards: externalEvidenceSubmissionApplicationGate.safeguards,
      }
    : null,
  externalEvidenceSubmissionApplyPlan: externalEvidenceSubmissionApplyPlan
    ? {
        file: externalEvidenceSubmissionApplyPlanFile,
        summary: externalEvidenceSubmissionApplyPlan.summary,
        planChecks: externalEvidenceSubmissionApplyPlan.planChecks,
        applySteps: externalEvidenceSubmissionApplyPlan.applySteps,
        patchPreview: externalEvidenceSubmissionApplyPlan.patchPreview,
        safeguards: externalEvidenceSubmissionApplyPlan.safeguards,
      }
    : null,
  newBinaryFamilyPlan: newBinaryFamilyPlan
    ? {
        file: newBinaryFamilyPlanFile,
        summary: newBinaryFamilyPlan.summary,
        probes: newBinaryFamilyPlan.probes,
        safeguards: newBinaryFamilyPlan.safeguards,
      }
    : null,
  newBinaryFamilyDeltaParentAudit: newBinaryFamilyDeltaParentAudit
    ? {
        file: newBinaryFamilyDeltaParentAuditFile,
        summary: newBinaryFamilyDeltaParentAudit.summary,
        gates: newBinaryFamilyDeltaParentAudit.gates,
        nextSearchPlan: newBinaryFamilyDeltaParentAudit.nextSearchPlan,
        safeguards: newBinaryFamilyDeltaParentAudit.safeguards,
      }
    : null,
  deltaParentConsumerCorpusScan: deltaParentConsumerCorpusScan
    ? {
        file: deltaParentConsumerCorpusScanFile,
        summary: deltaParentConsumerCorpusScan.summary,
        candidates: deltaParentConsumerCorpusScan.candidates,
        hashOnlyCandidates: deltaParentConsumerCorpusScan.hashOnlyCandidates,
        targetLocalHits: deltaParentConsumerCorpusScan.targetLocalHits,
        safeguards: deltaParentConsumerCorpusScan.safeguards,
      }
    : null,
  deltaParentExpandedDecodePlan: deltaParentExpandedDecodePlan
    ? {
        file: deltaParentExpandedDecodePlanFile,
        summary: deltaParentExpandedDecodePlan.summary,
        candidates: deltaParentExpandedDecodePlan.candidates,
        nextInspectionQueue: deltaParentExpandedDecodePlan.nextInspectionQueue,
        decodeScript: deltaParentExpandedDecodePlan.decodeScript,
        safeguards: deltaParentExpandedDecodePlan.safeguards,
      }
    : null,
  deltaParentUpgradeStructureAudit: deltaParentUpgradeStructureAudit
    ? {
        file: deltaParentUpgradeStructureAuditFile,
        summary: deltaParentUpgradeStructureAudit.summary,
        target: deltaParentUpgradeStructureAudit.target,
        assets: deltaParentUpgradeStructureAudit.assets,
        topHits: deltaParentUpgradeStructureAudit.topHits,
        safeguards: deltaParentUpgradeStructureAudit.safeguards,
      }
    : null,
  deltaParentOffsetReferenceGraph: deltaParentOffsetReferenceGraph
    ? {
        file: deltaParentOffsetReferenceGraphFile,
        summary: deltaParentOffsetReferenceGraph.summary,
        target: deltaParentOffsetReferenceGraph.target,
        upgrades: deltaParentOffsetReferenceGraph.upgrades,
        anchorsWithParentRefs: deltaParentOffsetReferenceGraph.anchorsWithParentRefs,
        safeguards: deltaParentOffsetReferenceGraph.safeguards,
      }
    : null,
  deltaParentSystemsTuningContexts: deltaParentSystemsTuningContexts
    ? {
        file: deltaParentSystemsTuningContextsFile,
        summary: deltaParentSystemsTuningContexts.summary,
        targetContexts: deltaParentSystemsTuningContexts.targetContexts,
        externalTargetContexts: deltaParentSystemsTuningContexts.externalTargetContexts,
        externalUpgradeContexts: deltaParentSystemsTuningContexts.externalUpgradeContexts,
        safeguards: deltaParentSystemsTuningContexts.safeguards,
      }
    : null,
  deltaParentUndecodedSourcePlan: deltaParentUndecodedSourcePlan
    ? {
        file: deltaParentUndecodedSourcePlanFile,
        summary: deltaParentUndecodedSourcePlan.summary,
        highPriority: deltaParentUndecodedSourcePlan.highPriority,
        nextDecodeQueue: deltaParentUndecodedSourcePlan.nextDecodeQueue,
        decodeScript: deltaParentUndecodedSourcePlan.decodeScript,
        safeguards: deltaParentUndecodedSourcePlan.safeguards,
      }
    : null,
  deltaParentNontextTableSignals: deltaParentNontextTableSignals
    ? {
        file: deltaParentNontextTableSignalsFile,
        summary: deltaParentNontextTableSignals.summary,
        targetHashNontextSignals: deltaParentNontextTableSignals.targetHashNontextSignals,
        linkedTargetHashSignals: deltaParentNontextTableSignals.linkedTargetHashSignals,
        selectorAssetLayoutSignals: deltaParentNontextTableSignals.selectorAssetLayoutSignals,
        safeguards: deltaParentNontextTableSignals.safeguards,
      }
    : null,
  deltaLocalExhaustionConclusion: deltaLocalExhaustionConclusion
    ? {
        file: deltaLocalExhaustionConclusionFile,
        summary: deltaLocalExhaustionConclusion.summary,
        gates: deltaLocalExhaustionConclusion.gates,
        localConclusions: deltaLocalExhaustionConclusion.localConclusions,
        sf33Evidence: deltaLocalExhaustionConclusion.sf33Evidence,
        nextFocus: deltaLocalExhaustionConclusion.nextFocus,
        safeguards: deltaLocalExhaustionConclusion.safeguards,
      }
    : null,
  deltaNextActionDecision: deltaNextActionDecision
    ? {
        file: deltaNextActionDecisionFile,
        summary: deltaNextActionDecision.summary,
        rankedActions: deltaNextActionDecision.rankedActions,
        evidenceState: deltaNextActionDecision.evidenceState,
        safeguards: deltaNextActionDecision.safeguards,
      }
    : null,
  sf32LocalExhaustionConclusion: sf32LocalExhaustionConclusion
    ? {
        file: sf32LocalExhaustionConclusionFile,
        summary: sf32LocalExhaustionConclusion.summary,
        localEvidenceChecks: sf32LocalExhaustionConclusion.localEvidenceChecks,
        requiredProofs: sf32LocalExhaustionConclusion.requiredProofs,
        safeguards: sf32LocalExhaustionConclusion.safeguards,
      }
    : null,
  sf32OwnerSourcePacket: sf32OwnerSourcePacket
    ? {
        file: sf32OwnerSourcePacketFile,
        summary: sf32OwnerSourcePacket.summary,
        requiredClaim: sf32OwnerSourcePacket.requiredClaim,
        rejectedLocalSignals: sf32OwnerSourcePacket.rejectedLocalSignals,
        parserBridgeContract: sf32OwnerSourcePacket.parserBridgeContract,
        safeguards: sf32OwnerSourcePacket.safeguards,
      }
    : null,
  sf32OwnerSourceHuntPlan: sf32OwnerSourceHuntPlan
    ? {
        file: sf32OwnerSourceHuntPlanFile,
        summary: sf32OwnerSourceHuntPlan.summary,
        requiredClaim: sf32OwnerSourceHuntPlan.requiredClaim,
        searches: sf32OwnerSourceHuntPlan.searches,
        acceptanceChecklist: sf32OwnerSourceHuntPlan.acceptanceChecklist,
        rejectionChecklist: sf32OwnerSourceHuntPlan.rejectionChecklist,
        safeguards: sf32OwnerSourceHuntPlan.safeguards,
      }
    : null,
  diabloToolsAttributeSourceAudit: diabloToolsAttributeSourceAudit
    ? {
        file: diabloToolsAttributeSourceAuditFile,
        source: diabloToolsAttributeSourceAudit.source,
        summary: diabloToolsAttributeSourceAudit.summary,
        evidence: diabloToolsAttributeSourceAudit.evidence,
        impact: diabloToolsAttributeSourceAudit.impact,
        safeguards: diabloToolsAttributeSourceAudit.safeguards,
      }
    : null,
  communitySourceTriageAudit: communitySourceTriageAudit
    ? {
        file: communitySourceTriageAuditFile,
        summary: communitySourceTriageAudit.summary,
        sources: communitySourceTriageAudit.sources,
        recommendedUse: communitySourceTriageAudit.recommendedUse,
        blockers: communitySourceTriageAudit.blockers,
        safeguards: communitySourceTriageAudit.safeguards,
      }
    : null,
  d4dataParserReferenceAudit: d4dataParserReferenceAudit
    ? {
        file: d4dataParserReferenceAuditFile,
        source: d4dataParserReferenceAudit.source,
        summary: d4dataParserReferenceAudit.summary,
        referenceFiles: d4dataParserReferenceAudit.referenceFiles,
        checks: d4dataParserReferenceAudit.checks,
        parserImplementationPlan: d4dataParserReferenceAudit.parserImplementationPlan,
        safeguards: d4dataParserReferenceAudit.safeguards,
      }
    : null,
  selectorAssetRecordParser: selectorAssetRecordParser
    ? {
        file: selectorAssetRecordParserFile,
        summary: selectorAssetRecordParser.summary,
        records: selectorAssetRecordParser.records,
        skippedGroups: selectorAssetRecordParser.skippedGroups,
        failedInvariants: selectorAssetRecordParser.failedInvariants,
        safeguards: selectorAssetRecordParser.safeguards,
      }
    : null,
  selector949ReconciliationAudit: selector949ReconciliationAudit
    ? {
        file: selector949ReconciliationAuditFile,
        summary: selector949ReconciliationAudit.summary,
        selectorFindings: selector949ReconciliationAudit.selectorFindings,
        revisedHypotheses: selector949ReconciliationAudit.revisedHypotheses,
        safeguards: selector949ReconciliationAudit.safeguards,
      }
    : null,
  selector949WindowReparseAudit: selector949WindowReparseAudit
    ? {
        file: selector949WindowReparseAuditFile,
        summary: selector949WindowReparseAudit.summary,
        comparisons: selector949WindowReparseAudit.comparisons,
        revisedClaims: selector949WindowReparseAudit.revisedClaims,
        safeguards: selector949WindowReparseAudit.safeguards,
      }
    : null,
  local949RoleDecodeAudit: local949RoleDecodeAudit
    ? {
        file: local949RoleDecodeAuditFile,
        summary: local949RoleDecodeAudit.summary,
        roleEvidence: local949RoleDecodeAudit.roleEvidence,
        rejectedRoles: local949RoleDecodeAudit.rejectedRoles,
        parserImplications: local949RoleDecodeAudit.parserImplications,
        safeguards: local949RoleDecodeAudit.safeguards,
      }
    : null,
  selectorAssetRecordParserContract: selectorAssetRecordParserContract
    ? {
        file: selectorAssetRecordParserContractFile,
        summary: selectorAssetRecordParserContract.summary,
        parserLayouts: selectorAssetRecordParserContract.parserLayouts,
        requiredInvariants: selectorAssetRecordParserContract.requiredInvariants,
        outputContract: selectorAssetRecordParserContract.outputContract,
        safeguards: selectorAssetRecordParserContract.safeguards,
      }
    : null,
  sf32OwnerParserBridge: sf32OwnerParserBridge
    ? {
        file: sf32OwnerParserBridgeFile,
        summary: sf32OwnerParserBridge.summary,
        mappings: sf32OwnerParserBridge.mappings,
        requiredInvariants: sf32OwnerParserBridge.requiredInvariants,
        safeguards: sf32OwnerParserBridge.safeguards,
      }
    : null,
  sf33TriggerSourcePacket: sf33TriggerSourcePacket
    ? {
        file: sf33TriggerSourcePacketFile,
        summary: sf33TriggerSourcePacket.summary,
        requiredClaim: sf33TriggerSourcePacket.requiredClaim,
        localGate: sf33TriggerSourcePacket.localGate,
        rejectedLocalSignals: sf33TriggerSourcePacket.rejectedLocalSignals,
        parserBridgeContract: sf33TriggerSourcePacket.parserBridgeContract,
        safeguards: sf33TriggerSourcePacket.safeguards,
      }
    : null,
  sf33TriggerParserBridge: sf33TriggerParserBridge
    ? {
        file: sf33TriggerParserBridgeFile,
        summary: sf33TriggerParserBridge.summary,
        mappings: sf33TriggerParserBridge.mappings,
        requiredInvariants: sf33TriggerParserBridge.requiredInvariants,
        safeguards: sf33TriggerParserBridge.safeguards,
      }
    : null,
  uptimeLocalExhaustionConclusion: uptimeLocalExhaustionConclusion
    ? {
        file: uptimeLocalExhaustionConclusionFile,
        summary: uptimeLocalExhaustionConclusion.summary,
        localEvidenceChecks: uptimeLocalExhaustionConclusion.localEvidenceChecks,
        requiredProofs: uptimeLocalExhaustionConclusion.requiredProofs,
        safeguards: uptimeLocalExhaustionConclusion.safeguards,
      }
    : null,
  uptimeSourcePacket: uptimeSourcePacket
    ? {
        file: uptimeSourcePacketFile,
        summary: uptimeSourcePacket.summary,
        requiredClaim: uptimeSourcePacket.requiredClaim,
        rejectedLocalSignals: uptimeSourcePacket.rejectedLocalSignals,
        parserBridgeContract: uptimeSourcePacket.parserBridgeContract,
        safeguards: uptimeSourcePacket.safeguards,
      }
    : null,
  uptimeParserBridge: uptimeParserBridge
    ? {
        file: uptimeParserBridgeFile,
        summary: uptimeParserBridge.summary,
        mappings: uptimeParserBridge.mappings,
        requiredInvariants: uptimeParserBridge.requiredInvariants,
        safeguards: uptimeParserBridge.safeguards,
      }
    : null,
  deltaBridgeReadiness: deltaBridgeReadiness
    ? {
        file: deltaBridgeReadinessFile,
        summary: deltaBridgeReadiness.summary,
        gates: deltaBridgeReadiness.gates,
        blockedGateIds: deltaBridgeReadiness.blockedGateIds,
        requiredInvariants: deltaBridgeReadiness.requiredInvariants,
        safeguards: deltaBridgeReadiness.safeguards,
      }
    : null,
  deltaPromotionReview: deltaPromotionReview
    ? {
        file: deltaPromotionReviewFile,
        summary: deltaPromotionReview.summary,
        reviewChecks: deltaPromotionReview.reviewChecks,
        promotionPolicy: deltaPromotionReview.promotionPolicy,
        safeguards: deltaPromotionReview.safeguards,
      }
    : null,
  deltaEvidenceIntakePackage: deltaEvidenceIntakePackage
    ? {
        file: deltaEvidenceIntakePackageFile,
        summary: deltaEvidenceIntakePackage.summary,
        targetFile: deltaEvidenceIntakePackage.targetFile,
        reviewRows: deltaEvidenceIntakePackage.reviewRows,
        templates: deltaEvidenceIntakePackage.templates,
        usage: deltaEvidenceIntakePackage.usage,
        safeguards: deltaEvidenceIntakePackage.safeguards,
      }
    : null,
  deltaEvidenceDraft: deltaEvidenceDraft
    ? {
        file: deltaEvidenceDraftFile,
        summary: deltaEvidenceDraft.summary,
        placeholderFields: deltaEvidenceDraft.placeholderFields,
        candidate: deltaEvidenceDraft.candidate,
        usage: deltaEvidenceDraft.usage,
        safeguards: deltaEvidenceDraft.safeguards,
      }
    : null,
  deltaEvidenceDraftAudit: deltaEvidenceDraftAudit
    ? {
        file: deltaEvidenceDraftAuditFile,
        summary: deltaEvidenceDraftAudit.summary,
        placeholderFields: deltaEvidenceDraftAudit.placeholderFields,
        structuralBlockers: deltaEvidenceDraftAudit.structuralBlockers,
        reviewBlockers: deltaEvidenceDraftAudit.reviewBlockers,
        candidates: deltaEvidenceDraftAudit.candidates,
        safeguards: deltaEvidenceDraftAudit.safeguards,
      }
    : null,
  deltaEvidenceIntakeUpdatePreview: deltaEvidenceIntakeUpdatePreview
    ? {
        file: deltaEvidenceIntakeUpdatePreviewFile,
        summary: deltaEvidenceIntakeUpdatePreview.summary,
        blockers: deltaEvidenceIntakeUpdatePreview.blockers,
        preview: deltaEvidenceIntakeUpdatePreview.preview,
        safeguards: deltaEvidenceIntakeUpdatePreview.safeguards,
      }
    : null,
  deltaManualPromotionGate: deltaManualPromotionGate
    ? {
        file: deltaManualPromotionGateFile,
        summary: deltaManualPromotionGate.summary,
        gateChecks: deltaManualPromotionGate.gateChecks,
        nextManualSteps: deltaManualPromotionGate.nextManualSteps,
        safeguards: deltaManualPromotionGate.safeguards,
      }
    : null,
  deltaHumanActionPlan: deltaHumanActionPlan
    ? {
        file: deltaHumanActionPlanFile,
        summary: deltaHumanActionPlan.summary,
        fillTasks: deltaHumanActionPlan.fillTasks,
        orderedActions: deltaHumanActionPlan.orderedActions,
        safeguards: deltaHumanActionPlan.safeguards,
      }
    : null,
  deltaEvidenceFillForm: deltaEvidenceFillForm
    ? {
        file: deltaEvidenceFillFormFile,
        summary: deltaEvidenceFillForm.summary,
        candidateContext: deltaEvidenceFillForm.candidateContext,
        fields: deltaEvidenceFillForm.fields,
        instructions: deltaEvidenceFillForm.instructions,
        safeguards: deltaEvidenceFillForm.safeguards,
      }
    : null,
  deltaEvidenceFilledDraft: deltaEvidenceFilledDraft
    ? {
        file: deltaEvidenceFilledDraftFile,
        summary: deltaEvidenceFilledDraft.summary,
        completedFields: deltaEvidenceFilledDraft.completedFields,
        missingFields: deltaEvidenceFilledDraft.missingFields,
        remainingPlaceholderFields: deltaEvidenceFilledDraft.remainingPlaceholderFields,
        patchedCandidate: deltaEvidenceFilledDraft.patchedCandidate,
        safeguards: deltaEvidenceFilledDraft.safeguards,
      }
    : null,
  deltaEvidenceFilledDraftAudit: deltaEvidenceFilledDraftAudit
    ? {
        file: deltaEvidenceFilledDraftAuditFile,
        summary: deltaEvidenceFilledDraftAudit.summary,
        filledDraftSummary: deltaEvidenceFilledDraftAudit.filledDraftSummary,
        draftAuditSummary: deltaEvidenceFilledDraftAudit.draftAuditSummary,
        blockers: deltaEvidenceFilledDraftAudit.blockers,
        safeguards: deltaEvidenceFilledDraftAudit.safeguards,
      }
    : null,
  deltaEvidenceFilledDraftIntakePreview: deltaEvidenceFilledDraftIntakePreview
    ? {
        file: deltaEvidenceFilledDraftIntakePreviewFile,
        summary: deltaEvidenceFilledDraftIntakePreview.summary,
        filledDraftAuditSummary: deltaEvidenceFilledDraftIntakePreview.filledDraftAuditSummary,
        blockers: deltaEvidenceFilledDraftIntakePreview.blockers,
        preview: deltaEvidenceFilledDraftIntakePreview.preview,
        safeguards: deltaEvidenceFilledDraftIntakePreview.safeguards,
      }
    : null,
  deltaEvidenceIntakeCopyGate: deltaEvidenceIntakeCopyGate
    ? {
        file: deltaEvidenceIntakeCopyGateFile,
        summary: deltaEvidenceIntakeCopyGate.summary,
        gateChecks: deltaEvidenceIntakeCopyGate.gateChecks,
        candidateToCopy: deltaEvidenceIntakeCopyGate.candidateToCopy,
        manualCopyTarget: deltaEvidenceIntakeCopyGate.manualCopyTarget,
        manualSteps: deltaEvidenceIntakeCopyGate.manualSteps,
        safeguards: deltaEvidenceIntakeCopyGate.safeguards,
      }
    : null,
  deltaEvidencePostCopyIntake: deltaEvidencePostCopyIntake
    ? {
        file: deltaEvidencePostCopyIntakeFile,
        summary: deltaEvidencePostCopyIntake.summary,
        candidateToCopy: deltaEvidencePostCopyIntake.candidateToCopy,
        targetCandidate: deltaEvidencePostCopyIntake.targetCandidate,
        intakeAuditSummary: deltaEvidencePostCopyIntake.intakeAuditSummary,
        blockers: deltaEvidencePostCopyIntake.blockers,
        safeguards: deltaEvidencePostCopyIntake.safeguards,
      }
    : null,
  deltaEvidenceManualReviewGate: deltaEvidenceManualReviewGate
    ? {
        file: deltaEvidenceManualReviewGateFile,
        summary: deltaEvidenceManualReviewGate.summary,
        gateChecks: deltaEvidenceManualReviewGate.gateChecks,
        targetCandidate: deltaEvidenceManualReviewGate.targetCandidate,
        reviewerDecisionTemplate: deltaEvidenceManualReviewGate.reviewerDecisionTemplate,
        safeguards: deltaEvidenceManualReviewGate.safeguards,
      }
    : null,
  deltaEvidenceReviewDecisionPackage: deltaEvidenceReviewDecisionPackage
    ? {
        file: deltaEvidenceReviewDecisionPackageFile,
        summary: deltaEvidenceReviewDecisionPackage.summary,
        readinessChecks: deltaEvidenceReviewDecisionPackage.readinessChecks,
        targetCandidate: deltaEvidenceReviewDecisionPackage.targetCandidate,
        decisionInputTemplate: deltaEvidenceReviewDecisionPackage.decisionInputTemplate,
        safeguards: deltaEvidenceReviewDecisionPackage.safeguards,
      }
    : null,
  deltaEvidenceReviewDecisionAudit: deltaEvidenceReviewDecisionAudit
    ? {
        file: deltaEvidenceReviewDecisionAuditFile,
        summary: deltaEvidenceReviewDecisionAudit.summary,
        auditChecks: deltaEvidenceReviewDecisionAudit.auditChecks,
        decisionInput: deltaEvidenceReviewDecisionAudit.decisionInput,
        template: deltaEvidenceReviewDecisionAudit.template,
        safeguards: deltaEvidenceReviewDecisionAudit.safeguards,
      }
    : null,
  deltaEvidencePromotionAudit: deltaEvidencePromotionAudit
    ? {
        file: deltaEvidencePromotionAuditFile,
        summary: deltaEvidencePromotionAudit.summary,
        auditChecks: deltaEvidencePromotionAudit.auditChecks,
        gateRows: deltaEvidencePromotionAudit.gateRows,
        implementationContract: deltaEvidencePromotionAudit.implementationContract,
        safeguards: deltaEvidencePromotionAudit.safeguards,
      }
    : null,
  deltaPromotionImplementationDryRun: deltaPromotionImplementationDryRun
    ? {
        file: deltaPromotionImplementationDryRunFile,
        summary: deltaPromotionImplementationDryRun.summary,
        dryRunChecks: deltaPromotionImplementationDryRun.dryRunChecks,
        patchPreview: deltaPromotionImplementationDryRun.patchPreview,
        regressionTargets: deltaPromotionImplementationDryRun.regressionTargets,
        safeguards: deltaPromotionImplementationDryRun.safeguards,
      }
    : null,
  deltaPromotionApplicationGate: deltaPromotionApplicationGate
    ? {
        file: deltaPromotionApplicationGateFile,
        summary: deltaPromotionApplicationGate.summary,
        gateChecks: deltaPromotionApplicationGate.gateChecks,
        patchPreview: deltaPromotionApplicationGate.patchPreview,
        applyContract: deltaPromotionApplicationGate.applyContract,
        safeguards: deltaPromotionApplicationGate.safeguards,
      }
    : null,
  deltaPromotionApplyPlan: deltaPromotionApplyPlan
    ? {
        file: deltaPromotionApplyPlanFile,
        summary: deltaPromotionApplyPlan.summary,
        planChecks: deltaPromotionApplyPlan.planChecks,
        applySteps: deltaPromotionApplyPlan.applySteps,
        patchPreview: deltaPromotionApplyPlan.patchPreview,
        safeguards: deltaPromotionApplyPlan.safeguards,
      }
    : null,
  userWhatIfScenarios: userWhatIfScenarios
    ? {
        file: userWhatIfScenariosFile,
        summary: userWhatIfScenarios.summary,
        scenarios: userWhatIfScenarios.scenarios,
      }
    : null,
  userWhatIfContract: userWhatIfContract
    ? {
        file: userWhatIfContractFile,
        summary: userWhatIfContract.summary,
        scenario: userWhatIfContract.scenario,
        samples: userWhatIfContract.samples,
        contractChecks: userWhatIfContract.contractChecks,
        exportPolicy: userWhatIfContract.exportPolicy,
        safeguards: userWhatIfContract.safeguards,
      }
    : null,
  reliableDpsGates: reliableDpsGates
    ? {
        file: reliableDpsGatesFile,
        summary: reliableDpsGates.summary,
        gates: reliableDpsGates.gates,
        policy: reliableDpsGates.policy,
      }
    : null,
  workingBaseContract: workingBaseContract
    ? {
        file: workingBaseContractFile,
        summary: workingBaseContract.summary,
        workingBase: workingBaseContract.workingBase,
        reliableDpsPolicy: workingBaseContract.reliableDpsPolicy,
        nextEvidence: workingBaseContract.nextEvidence,
        safeguards: workingBaseContract.safeguards,
      }
    : null,
  bucketEngineContract: bucketEngineContract
    ? {
        file: bucketEngineContractFile,
        summary: bucketEngineContract.summary,
        invariants: bucketEngineContract.invariants,
        safeguards: bucketEngineContract.safeguards,
      }
    : null,
  targetOptimizerSuite: targetOptimizerSuite
    ? {
        file: targetOptimizerSuiteFile,
        summary: targetOptimizerSuite.summary,
        steps: targetOptimizerSuite.steps,
        invariants: targetOptimizerSuite.invariants,
      }
    : null,
  byClass,
  recommendedStrictByClass,
  actionQueue,
  bestValidStrictBuild: validStrictBuilds
    .sort((a, b) => b.reliableDps - a.reliableDps || b.blockedCandidateDelta - a.blockedCandidateDelta)[0] ?? null,
  bestReliableStrictBuild: reliableStrictBuilds
    .sort((a, b) => b.reliableDps - a.reliableDps)[0] ?? null,
  safeguards: [
    "Le classement reliableDps utilise uniquement strictDps.",
    "Les deltas bloques restent visibles mais exclus du score fiable.",
    "Les builds mixtes de classes ne sont pas proposes comme optimisation valide.",
    "Les slots/conflits/uniques restent bloquants tant que leurs donnees ne sont pas normalisees.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "target-optimizer-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
