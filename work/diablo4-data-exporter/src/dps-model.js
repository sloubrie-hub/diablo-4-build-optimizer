const fs = require("fs");
const { decodeBlteAt } = require("./blte-reader");
const { evaluateCanonicalVariables } = require("./formula-evaluator");

function buildMinimalDpsModelFile(filePath, options = {}) {
  const evaluation = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return buildMinimalDpsModel(evaluation, options);
}

function auditDpsRolesFile(filePath) {
  const dpsModel = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return auditDpsRoles(dpsModel);
}

function buildExperimentalDpsModelFile(filePath, auditFilePath, options = {}) {
  const strictModel = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const audit = JSON.parse(fs.readFileSync(auditFilePath, "utf8"));
  return buildExperimentalDpsModel(strictModel, audit, options);
}

function compareDpsModelsFile(strictFilePath, experimentalFilePath) {
  const strictModel = JSON.parse(fs.readFileSync(strictFilePath, "utf8"));
  const experimentalModel = JSON.parse(fs.readFileSync(experimentalFilePath, "utf8"));
  return compareDpsModels(strictModel, experimentalModel);
}

function inspectDpsGapsFile(strictFilePath, comparisonFilePath, auditFilePath) {
  const strictModel = JSON.parse(fs.readFileSync(strictFilePath, "utf8"));
  const comparison = JSON.parse(fs.readFileSync(comparisonFilePath, "utf8"));
  const audit = JSON.parse(fs.readFileSync(auditFilePath, "utf8"));
  return inspectDpsGaps(strictModel, comparison, audit);
}

function inspectGapFormulaContextFile(gapFilePath, priorityInspectionFilePath) {
  const gapInspection = JSON.parse(fs.readFileSync(gapFilePath, "utf8"));
  const priorityInspection = JSON.parse(fs.readFileSync(priorityInspectionFilePath, "utf8"));
  return inspectGapFormulaContext(gapInspection, priorityInspection);
}

function inspectPromotionRisksFile(comparisonFilePath, graphsFilePath, priorityInspectionFilePath = null) {
  const comparison = JSON.parse(fs.readFileSync(comparisonFilePath, "utf8"));
  const graphs = JSON.parse(fs.readFileSync(graphsFilePath, "utf8"));
  const priorityInspection = priorityInspectionFilePath ? JSON.parse(fs.readFileSync(priorityInspectionFilePath, "utf8")) : null;
  return inspectPromotionRisks(comparison, graphs, priorityInspection);
}

function buildReviewedDpsModelFile(strictFilePath, promotionRiskFilePath) {
  const strictModel = JSON.parse(fs.readFileSync(strictFilePath, "utf8"));
  const promotionRisk = JSON.parse(fs.readFileSync(promotionRiskFilePath, "utf8"));
  return buildReviewedDpsModel(strictModel, promotionRisk);
}

function buildBranchAwareDpsModelFile(modelFilePath, branchInferenceFilePath) {
  const model = JSON.parse(fs.readFileSync(modelFilePath, "utf8"));
  const branchInference = JSON.parse(fs.readFileSync(branchInferenceFilePath, "utf8"));
  return buildBranchAwareDpsModel(model, branchInference);
}

function auditGlobalBranchSignalsFile(graphsFilePath, modelFilePath = null, options = {}) {
  const graphs = JSON.parse(fs.readFileSync(graphsFilePath, "utf8"));
  const model = modelFilePath ? JSON.parse(fs.readFileSync(modelFilePath, "utf8")) : null;
  return auditGlobalBranchSignals(graphs, model, options);
}

function inspectConditionalDamageFile(graphsFilePath, modelFilePath = null, priorityInspectionFilePath = null, options = {}) {
  const graphs = JSON.parse(fs.readFileSync(graphsFilePath, "utf8"));
  const model = modelFilePath ? JSON.parse(fs.readFileSync(modelFilePath, "utf8")) : null;
  const priorityInspection = priorityInspectionFilePath ? JSON.parse(fs.readFileSync(priorityInspectionFilePath, "utf8")) : null;
  return inspectConditionalDamage(graphs, model, priorityInspection, options);
}

function inspectConditionalDamageDedupeFile(conditionalDamageFilePath, options = {}) {
  const conditionalDamage = JSON.parse(fs.readFileSync(conditionalDamageFilePath, "utf8"));
  return inspectConditionalDamageDedupe(conditionalDamage, options);
}

function buildConditionalSfScenariosFile(conditionalDamageFilePath, dedupedCompositionFilePath, options = {}) {
  const conditionalDamage = JSON.parse(fs.readFileSync(conditionalDamageFilePath, "utf8"));
  const dedupedComposition = JSON.parse(fs.readFileSync(dedupedCompositionFilePath, "utf8"));
  return buildConditionalSfScenarios(conditionalDamage, dedupedComposition, options);
}

function inspectConditionalSfSourcesFile(conditionalDamageFilePath, priorityInspectionFilePath, sfUsageFilePath = null, sfCandidatesFilePath = null, options = {}) {
  const conditionalDamage = JSON.parse(fs.readFileSync(conditionalDamageFilePath, "utf8"));
  const priorityInspection = JSON.parse(fs.readFileSync(priorityInspectionFilePath, "utf8"));
  const sfUsage = sfUsageFilePath ? JSON.parse(fs.readFileSync(sfUsageFilePath, "utf8")) : null;
  const sfCandidates = sfCandidatesFilePath ? JSON.parse(fs.readFileSync(sfCandidatesFilePath, "utf8")) : null;
  return inspectConditionalSfSources(conditionalDamage, priorityInspection, sfUsage, sfCandidates, options);
}

function inspectConditionalExternalMetadataFile(conditionalSfSourcesFilePath, externalTargetsFilePath, externalRefsFilePath = null, options = {}) {
  const conditionalSfSources = JSON.parse(fs.readFileSync(conditionalSfSourcesFilePath, "utf8"));
  const externalTargets = JSON.parse(fs.readFileSync(externalTargetsFilePath, "utf8"));
  const externalRefs = externalRefsFilePath ? JSON.parse(fs.readFileSync(externalRefsFilePath, "utf8")) : null;
  return inspectConditionalExternalMetadata(conditionalSfSources, externalTargets, externalRefs, options);
}

function inspectConditionalMetadataValuesFile(conditionalExternalMetadataFilePath, externalTargetsFilePath, options = {}) {
  const conditionalExternalMetadata = JSON.parse(fs.readFileSync(conditionalExternalMetadataFilePath, "utf8"));
  const externalTargets = JSON.parse(fs.readFileSync(externalTargetsFilePath, "utf8"));
  return inspectConditionalMetadataValues(conditionalExternalMetadata, externalTargets, options);
}

function inspectConditionalDefinitionSearchFile(metadataValueInspectionFilePath, externalTargetsFilePath, options = {}) {
  const metadataValueInspection = JSON.parse(fs.readFileSync(metadataValueInspectionFilePath, "utf8"));
  const externalTargets = JSON.parse(fs.readFileSync(externalTargetsFilePath, "utf8"));
  return inspectConditionalDefinitionSearch(metadataValueInspection, externalTargets, options);
}

function buildConditionalCandidateContextFile(structuralRelationsFilePath, scenarioFilePath, options = {}) {
  const structuralRelations = JSON.parse(fs.readFileSync(structuralRelationsFilePath, "utf8"));
  const scenarios = JSON.parse(fs.readFileSync(scenarioFilePath, "utf8"));
  return buildConditionalCandidateContext(structuralRelations, scenarios, options);
}

function exportOptimizerDatasetFile(modelFilePath, candidateContextFilePath = null, options = {}) {
  const model = JSON.parse(fs.readFileSync(modelFilePath, "utf8"));
  const candidateContext = candidateContextFilePath ? JSON.parse(fs.readFileSync(candidateContextFilePath, "utf8")) : null;
  return exportOptimizerDataset(model, candidateContext, options);
}

function composeTargetBuildFile(filePath, assetIds, options = {}) {
  const targetDataset = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const aspectSlotReadiness = options.aspectSlotReadinessFilePath
    ? JSON.parse(fs.readFileSync(options.aspectSlotReadinessFilePath, "utf8"))
    : null;
  return composeTargetBuild(targetDataset, assetIds, {
    ...options,
    aspectSlotReadiness,
  });
}

function auditTargetBlockersFile(compositionFilePath, options = {}) {
  const composition = JSON.parse(fs.readFileSync(compositionFilePath, "utf8"));
  const candidateContext = options.candidateContextFilePath
    ? JSON.parse(fs.readFileSync(options.candidateContextFilePath, "utf8"))
    : null;
  const sfSources = options.sfSourcesFilePath
    ? JSON.parse(fs.readFileSync(options.sfSourcesFilePath, "utf8"))
    : null;
  const definitionSearch = options.definitionSearchFilePath
    ? JSON.parse(fs.readFileSync(options.definitionSearchFilePath, "utf8"))
    : null;
  const fieldRecords = options.fieldRecordsFilePath
    ? JSON.parse(fs.readFileSync(options.fieldRecordsFilePath, "utf8"))
    : null;
  const recordSegments = options.recordSegmentsFilePath
    ? JSON.parse(fs.readFileSync(options.recordSegmentsFilePath, "utf8"))
    : null;
  const recordHeaders = options.recordHeadersFilePath
    ? JSON.parse(fs.readFileSync(options.recordHeadersFilePath, "utf8"))
    : null;
  const recordHeaderPatterns = options.recordHeaderPatternsFilePath
    ? JSON.parse(fs.readFileSync(options.recordHeaderPatternsFilePath, "utf8"))
    : null;
  const recordHeaderPatternReport = options.recordHeaderPatternReportFilePath
    ? JSON.parse(fs.readFileSync(options.recordHeaderPatternReportFilePath, "utf8"))
    : null;
  const normalizedHeaderLayouts = options.normalizedHeaderLayoutsFilePath
    ? JSON.parse(fs.readFileSync(options.normalizedHeaderLayoutsFilePath, "utf8"))
    : null;
  const formulaHashLayoutFocus = options.formulaHashLayoutFocusFilePath
    ? JSON.parse(fs.readFileSync(options.formulaHashLayoutFocusFilePath, "utf8"))
    : null;
  const formulaHashFieldBoundaries = options.formulaHashFieldBoundariesFilePath
    ? JSON.parse(fs.readFileSync(options.formulaHashFieldBoundariesFilePath, "utf8"))
    : null;
  const formulaHashHeaderPreludes = options.formulaHashHeaderPreludesFilePath
    ? JSON.parse(fs.readFileSync(options.formulaHashHeaderPreludesFilePath, "utf8"))
    : null;
  const hashSuffixDefinitionLinks = options.hashSuffixDefinitionLinksFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixDefinitionLinksFilePath, "utf8"))
    : null;
  const hashSuffixValuePatterns = options.hashSuffixValuePatternsFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixValuePatternsFilePath, "utf8"))
    : null;
  const hashSuffixCandidateSemantics = options.hashSuffixCandidateSemanticsFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixCandidateSemanticsFilePath, "utf8"))
    : null;
  const hashSuffixDictionaryMining = options.hashSuffixDictionaryMiningFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixDictionaryMiningFilePath, "utf8"))
    : null;
  const hashSuffixFamilyEvidence = options.hashSuffixFamilyEvidenceFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixFamilyEvidenceFilePath, "utf8"))
    : null;
  const hashSuffixSourceNameAudit = options.hashSuffixSourceNameAuditFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixSourceNameAuditFilePath, "utf8"))
    : null;
  const hashSuffixBinarySourceAudit = options.hashSuffixBinarySourceAuditFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixBinarySourceAuditFilePath, "utf8"))
    : null;
  const hashSuffixBinaryContextComparison = options.hashSuffixBinaryContextComparisonFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixBinaryContextComparisonFilePath, "utf8"))
    : null;
  const hashSuffixSublayoutClassification = options.hashSuffixSublayoutClassificationFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixSublayoutClassificationFilePath, "utf8"))
    : null;
  const hashSuffixSublayoutFields = options.hashSuffixSublayoutFieldsFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixSublayoutFieldsFilePath, "utf8"))
    : null;
  const hashSuffixFieldShapeDecoders = options.hashSuffixFieldShapeDecodersFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixFieldShapeDecodersFilePath, "utf8"))
    : null;
  const hashSuffixDecodedOffsetLinks = options.hashSuffixDecodedOffsetLinksFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixDecodedOffsetLinksFilePath, "utf8"))
    : null;
  const hashSuffixOffsetRecordInspection = options.hashSuffixOffsetRecordInspectionFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixOffsetRecordInspectionFilePath, "utf8"))
    : null;
  const hashSuffixRecordBoundaryComparison = options.hashSuffixRecordBoundaryComparisonFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixRecordBoundaryComparisonFilePath, "utf8"))
    : null;
  const hashSuffixBoundaryPreludes = options.hashSuffixBoundaryPreludesFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixBoundaryPreludesFilePath, "utf8"))
    : null;
  const hashSuffixPreludeHeaderComparison = options.hashSuffixPreludeHeaderComparisonFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixPreludeHeaderComparisonFilePath, "utf8"))
    : null;
  const hashSuffixHeaderShapeComparison = options.hashSuffixHeaderShapeComparisonFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixHeaderShapeComparisonFilePath, "utf8"))
    : null;
  const hashSuffixCompactPatternSearch = options.hashSuffixCompactPatternSearchFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixCompactPatternSearchFilePath, "utf8"))
    : null;
  const hashSuffixNamedTableAudit = options.hashSuffixNamedTableAuditFilePath
    ? JSON.parse(fs.readFileSync(options.hashSuffixNamedTableAuditFilePath, "utf8"))
    : null;
  const recordHeaderSourceFreshnessAudit = options.recordHeaderSourceFreshnessAuditFilePath
    ? JSON.parse(fs.readFileSync(options.recordHeaderSourceFreshnessAuditFilePath, "utf8"))
    : null;
  const bonusPercentSelectorMatrix = options.bonusPercentSelectorMatrixFilePath
    ? JSON.parse(fs.readFileSync(options.bonusPercentSelectorMatrixFilePath, "utf8"))
    : null;
  const selector949PeerAudit = options.selector949PeerAuditFilePath
    ? JSON.parse(fs.readFileSync(options.selector949PeerAuditFilePath, "utf8"))
    : null;
  const selector949CompactCorpus = options.selector949CompactCorpusFilePath
    ? JSON.parse(fs.readFileSync(options.selector949CompactCorpusFilePath, "utf8"))
    : null;
  const decodedDictionaryStringScan = options.decodedDictionaryStringScanFilePath
    ? JSON.parse(fs.readFileSync(options.decodedDictionaryStringScanFilePath, "utf8"))
    : null;
  const unanchoredBonusPercentAudit = options.unanchoredBonusPercentAuditFilePath
    ? JSON.parse(fs.readFileSync(options.unanchoredBonusPercentAuditFilePath, "utf8"))
    : null;
  const metadata12337ContextAudit = options.metadata12337ContextAuditFilePath
    ? JSON.parse(fs.readFileSync(options.metadata12337ContextAuditFilePath, "utf8"))
    : null;
  const metadata12337ScaleCorpus = options.metadata12337ScaleCorpusFilePath
    ? JSON.parse(fs.readFileSync(options.metadata12337ScaleCorpusFilePath, "utf8"))
    : null;
  const selectorAssetPairCorpus = options.selectorAssetPairCorpusFilePath
    ? JSON.parse(fs.readFileSync(options.selectorAssetPairCorpusFilePath, "utf8"))
    : null;
  const selectorAssetLayoutParser = options.selectorAssetLayoutParserFilePath
    ? JSON.parse(fs.readFileSync(options.selectorAssetLayoutParserFilePath, "utf8"))
    : null;
  const selectorAssetOwnerFields = options.selectorAssetOwnerFieldsFilePath
    ? JSON.parse(fs.readFileSync(options.selectorAssetOwnerFieldsFilePath, "utf8"))
    : null;
  const bonusPercentCoverageAudit = options.bonusPercentCoverageAuditFilePath
    ? JSON.parse(fs.readFileSync(options.bonusPercentCoverageAuditFilePath, "utf8"))
    : null;
  const localTableSourceAlternatives = options.localTableSourceAlternativesFilePath
    ? JSON.parse(fs.readFileSync(options.localTableSourceAlternativesFilePath, "utf8"))
    : null;
  const sf32FieldPromotionDecision = options.sf32FieldPromotionDecisionFilePath
    ? JSON.parse(fs.readFileSync(options.sf32FieldPromotionDecisionFilePath, "utf8"))
    : null;
  const sf33BuildStateTriggerAudit = options.sf33BuildStateTriggerAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33BuildStateTriggerAuditFilePath, "utf8"))
    : null;
  const sf33ActivationSourceCorpus = options.sf33ActivationSourceCorpusFilePath
    ? JSON.parse(fs.readFileSync(options.sf33ActivationSourceCorpusFilePath, "utf8"))
    : null;
  const sf33ActivationSourceSearchAudit = options.sf33ActivationSourceSearchAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33ActivationSourceSearchAuditFilePath, "utf8"))
    : null;
  const sf33BuildStateNeighborhoodAudit = options.sf33BuildStateNeighborhoodAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33BuildStateNeighborhoodAuditFilePath, "utf8"))
    : null;
  const sf33OffsetTableEntriesAudit = options.sf33OffsetTableEntriesAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33OffsetTableEntriesAuditFilePath, "utf8"))
    : null;
  const sf33OffsetTableParentRunAudit = options.sf33OffsetTableParentRunAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33OffsetTableParentRunAuditFilePath, "utf8"))
    : null;
  const sf33ParentRunSemanticsAudit = options.sf33ParentRunSemanticsAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33ParentRunSemanticsAuditFilePath, "utf8"))
    : null;
  const sf33NamedBuildStateSourceAudit = options.sf33NamedBuildStateSourceAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33NamedBuildStateSourceAuditFilePath, "utf8"))
    : null;
  const sf33BinaryParentSourceAudit = options.sf33BinaryParentSourceAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf33BinaryParentSourceAuditFilePath, "utf8"))
    : null;
  const uptimeProofAudit = options.uptimeProofAuditFilePath
    ? JSON.parse(fs.readFileSync(options.uptimeProofAuditFilePath, "utf8"))
    : null;
  const sf28Sf29RoleAudit = options.sf28Sf29RoleAuditFilePath
    ? JSON.parse(fs.readFileSync(options.sf28Sf29RoleAuditFilePath, "utf8"))
    : null;
  const uptimeNeighborDependencyAudit = options.uptimeNeighborDependencyAuditFilePath
    ? JSON.parse(fs.readFileSync(options.uptimeNeighborDependencyAuditFilePath, "utf8"))
    : null;
  return auditTargetBlockers(composition, { candidateContext, sfSources, definitionSearch, fieldRecords, recordSegments, recordHeaders, recordHeaderPatterns, recordHeaderPatternReport, normalizedHeaderLayouts, formulaHashLayoutFocus, formulaHashFieldBoundaries, formulaHashHeaderPreludes, hashSuffixDefinitionLinks, hashSuffixValuePatterns, hashSuffixCandidateSemantics, hashSuffixDictionaryMining, hashSuffixFamilyEvidence, hashSuffixSourceNameAudit, hashSuffixBinarySourceAudit, hashSuffixBinaryContextComparison, hashSuffixSublayoutClassification, hashSuffixSublayoutFields, hashSuffixFieldShapeDecoders, hashSuffixDecodedOffsetLinks, hashSuffixOffsetRecordInspection, hashSuffixRecordBoundaryComparison, hashSuffixBoundaryPreludes, hashSuffixPreludeHeaderComparison, hashSuffixHeaderShapeComparison, hashSuffixCompactPatternSearch, hashSuffixNamedTableAudit, recordHeaderSourceFreshnessAudit, bonusPercentSelectorMatrix, selector949PeerAudit, selector949CompactCorpus, decodedDictionaryStringScan, unanchoredBonusPercentAudit, metadata12337ContextAudit, metadata12337ScaleCorpus, selectorAssetPairCorpus, selectorAssetLayoutParser, selectorAssetOwnerFields, bonusPercentCoverageAudit, localTableSourceAlternatives, sf32FieldPromotionDecision, sf33BuildStateTriggerAudit, sf33ActivationSourceCorpus, sf33ActivationSourceSearchAudit, sf33BuildStateNeighborhoodAudit, sf33OffsetTableEntriesAudit, sf33OffsetTableParentRunAudit, sf33ParentRunSemanticsAudit, sf33NamedBuildStateSourceAudit, sf33BinaryParentSourceAudit, uptimeProofAudit, sf28Sf29RoleAudit, uptimeNeighborDependencyAudit });
}

function auditDedupedDamageCompositionFile(modelFilePath, conditionalDedupeFilePath) {
  const model = JSON.parse(fs.readFileSync(modelFilePath, "utf8"));
  const conditionalDedupe = JSON.parse(fs.readFileSync(conditionalDedupeFilePath, "utf8"));
  return auditDedupedDamageComposition(model, conditionalDedupe);
}

function auditDamageComponentsFile(modelFilePath) {
  const model = JSON.parse(fs.readFileSync(modelFilePath, "utf8"));
  return auditDamageComponents(model);
}

function inspectDamageComponentContextFile(damageAuditFilePath, graphsFilePath, options = {}) {
  const damageAudit = JSON.parse(fs.readFileSync(damageAuditFilePath, "utf8"));
  const graphs = JSON.parse(fs.readFileSync(graphsFilePath, "utf8"));
  return inspectDamageComponentContext(damageAudit, graphs, options);
}

function inspectBranchControlsFile(damageContextFilePath, graphsFilePath, options = {}) {
  const damageContext = JSON.parse(fs.readFileSync(damageContextFilePath, "utf8"));
  const graphs = JSON.parse(fs.readFileSync(graphsFilePath, "utf8"));
  return inspectBranchControls(damageContext, graphs, options);
}

function exportBuildStateTemplateFile(branchControlsFilePath, options = {}) {
  const branchControls = JSON.parse(fs.readFileSync(branchControlsFilePath, "utf8"));
  return exportBuildStateTemplate(branchControls, options);
}

function evaluateBuildStateScenariosFile(buildStateFilePath, options = {}) {
  const buildState = JSON.parse(fs.readFileSync(buildStateFilePath, "utf8"));
  return evaluateBuildStateScenarios(buildState, options);
}

function inspectScenarioSfMappingsFile(scenariosFilePath, sfCandidatesFilePath, options = {}) {
  const scenarios = JSON.parse(fs.readFileSync(scenariosFilePath, "utf8"));
  const sfCandidates = JSON.parse(fs.readFileSync(sfCandidatesFilePath, "utf8"));
  return inspectScenarioSfMappings(scenarios, sfCandidates, options);
}

function inspectScenarioSfBytecodeFile(mappingsFilePath, options = {}) {
  const mappings = JSON.parse(fs.readFileSync(mappingsFilePath, "utf8"));
  return inspectScenarioSfBytecode(mappings, options);
}

function inferScenarioDamageBranchesFile(sfBytecodeFilePath, scenariosFilePath = null, options = {}) {
  const sfBytecode = JSON.parse(fs.readFileSync(sfBytecodeFilePath, "utf8"));
  const scenarios = scenariosFilePath ? JSON.parse(fs.readFileSync(scenariosFilePath, "utf8")) : null;
  return inferScenarioDamageBranches(sfBytecode, scenarios, options);
}

function analyzeDpsSensitivityFile(filePath, contextFilePath = null, options = {}) {
  const canonicalExport = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const contextOverride = contextFilePath ? JSON.parse(fs.readFileSync(contextFilePath, "utf8")) : {};
  return analyzeDpsSensitivity(canonicalExport, contextOverride, options);
}

function analyzeDpsSensitivity(canonicalExport, contextOverride = {}, options = {}) {
  const baselineValues = contextOverride.canonicalValues ?? {};
  const baselineContext = contextOverride.context ?? {};
  const baselineEvaluation = evaluateCanonicalVariables(canonicalExport, {
    values: baselineValues,
    context: baselineContext,
  });
  const baselineDps = buildMinimalDpsModel(baselineEvaluation, options);
  const baselineByAsset = new Map(baselineDps.assets.map((asset) => [String(asset.assetId), asset]));
  const variables = collectSensitivityVariables(canonicalExport, baselineValues);

  const testedVariables = variables.map((variable) => {
    const before = Number(variable.value);
    const after = nextSensitivityValue(before);
    const nextValues = cloneJson(baselineValues);
    nextValues[variable.canonicalId] = after;
    const nextEvaluation = evaluateCanonicalVariables(canonicalExport, {
      values: nextValues,
      context: baselineContext,
    });
    const nextDps = buildMinimalDpsModel(nextEvaluation, options);
    return summarizeSensitivityVariable(variable, before, after, baselineByAsset, nextDps.assets);
  });

  testedVariables.sort((a, b) => Math.abs(b.totalDeltaDps) - Math.abs(a.totalDeltaDps) || a.canonicalId.localeCompare(b.canonicalId));

  return {
    analyzedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      exportedAt: canonicalExport.exportedAt,
      canonicalSummary: canonicalExport.summary,
      contextGeneratedAt: contextOverride.generatedAt,
    },
    assumptions: {
      perturbation: "Numeric variables are increased by 10%; zero values are tested as 1.",
      note: "Prototype sensitivity report. Results depend on placeholder context and heuristic DPS classification.",
    },
    baseline: {
      summary: baselineDps.summary,
      totalEstimatedDps: sumEstimatedDps(baselineDps.assets),
    },
    summary: {
      variablesAvailable: variables.length,
      variablesTested: testedVariables.length,
      variablesWithImpact: testedVariables.filter((variable) => variable.affectedAssets > 0).length,
      assets: baselineDps.assets.length,
      topSensitivity: testedVariables.slice(0, 20).map((variable) => ({
        canonicalId: variable.canonicalId,
        kind: variable.kind,
        before: variable.before,
        after: variable.after,
        totalDeltaDps: variable.totalDeltaDps,
        totalDeltaPct: variable.totalDeltaPct,
        affectedAssets: variable.affectedAssets,
        maxAssetDeltaDps: variable.maxAssetDeltaDps,
      })),
    },
    variables: testedVariables,
  };
}

function buildMinimalDpsModel(evaluation, options = {}) {
  const weaponDamage = options.weaponDamage ?? 100;
  const attackSpeed = options.attackSpeed ?? evaluation.context?.baseContext?.variables?.Attacks_Per_Second_Total ?? 1;
  const assets = evaluation.results.map((asset) => buildAssetDpsModel(asset, { weaponDamage, attackSpeed }));

  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      evaluatedAt: evaluation.evaluatedAt,
      summary: evaluation.summary,
    },
    assumptions: {
      weaponDamage,
      attackSpeed,
      note: "Prototype DPS model. Formula values still depend on placeholder context unless explicitly configured.",
    },
    summary: summarizeDpsAssets(assets),
    assets,
  };
}

function buildAssetDpsModel(asset, assumptions) {
  const classified = asset.formulas
    .filter((formula) => formula.status === "ok" && Number.isFinite(Number(formula.value)))
    .map((formula) => ({
      ...formula,
      dpsRole: classifyDpsRole(formula),
    }));
  const damageTerms = dedupeFormulaTerms(classified.filter((formula) => formula.dpsRole.role === "damage-coefficient"));
  const multiplierTerms = dedupeFormulaTerms(classified.filter((formula) => formula.dpsRole.role === "multiplier"));
  const uptimeTerms = dedupeFormulaTerms(classified.filter((formula) => formula.dpsRole.role === "uptime-or-chance"));
  const utilityTerms = classified.filter((formula) => formula.dpsRole.role === "utility-or-scaling");

  const primaryDamageCoefficient = damageTerms.length
    ? Math.max(...damageTerms.map((formula) => Number(formula.value)))
    : 0;
  const multiplierProduct = multiplierTerms.reduce((product, formula) => product * normalizeMultiplier(Number(formula.value)), 1);
  const uptimeProduct = uptimeTerms.reduce((product, formula) => product * clamp01(Number(formula.value)), 1);
  const estimatedDps = assumptions.weaponDamage * assumptions.attackSpeed * primaryDamageCoefficient * multiplierProduct * uptimeProduct;

  return {
    assetId: asset.assetId,
    source: asset.source,
    tags: asset.tags,
    estimatedDps,
    components: {
      weaponDamage: assumptions.weaponDamage,
      attackSpeed: assumptions.attackSpeed,
      primaryDamageCoefficient,
      multiplierProduct,
      uptimeProduct,
      dedupedDamageTerms: damageTerms.length,
      dedupedMultiplierTerms: multiplierTerms.length,
      dedupedUptimeTerms: uptimeTerms.length,
    },
    formulas: classified.map((formula) => ({
      nodeId: formula.nodeId,
      value: formula.value,
      expression: formula.expression,
      canonicalExpression: formula.canonicalExpression,
      dpsRole: formula.dpsRole,
    })),
    buckets: {
      damageTerms: damageTerms.map((formula) => formula.nodeId),
      multiplierTerms: multiplierTerms.map((formula) => formula.nodeId),
      uptimeTerms: uptimeTerms.map((formula) => formula.nodeId),
      utilityTerms: utilityTerms.map((formula) => formula.nodeId),
    },
  };
}

function buildExperimentalDpsModel(strictModel, audit, options = {}) {
  const includePriority = options.includePriority ?? "high";
  const promotions = buildPromotionIndex(audit, includePriority);
  const assets = (strictModel.assets ?? []).map((asset) => rebuildAssetWithPromotions(asset, strictModel.assumptions, promotions));
  const strictTotal = sumEstimatedDps(strictModel.assets ?? []);
  const experimentalTotal = sumEstimatedDps(assets);

  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "experimental-audit-candidates",
    source: {
      strictBuiltAt: strictModel.builtAt,
      auditAuditedAt: audit.auditedAt,
      strictSummary: strictModel.summary,
      auditSummary: audit.summary,
    },
    assumptions: {
      ...(strictModel.assumptions ?? {}),
      includePriority,
      note: "Experimental DPS model. Audit candidates are included heuristically and must not replace the strict model.",
    },
    comparison: {
      strictTotalEstimatedDps: strictTotal,
      experimentalTotalEstimatedDps: experimentalTotal,
      deltaDps: experimentalTotal - strictTotal,
      deltaPct: safePct(experimentalTotal - strictTotal, strictTotal),
      promotedFormulas: assets.reduce((sum, asset) => sum + asset.experimental.promotedFormulas, 0),
    },
    summary: summarizeDpsAssets(assets),
    assets,
  };
}

function buildReviewedDpsModel(strictModel, promotionRisk) {
  const promotions = buildReviewedPromotionIndex(promotionRisk);
  const assets = (strictModel.assets ?? []).map((asset) => rebuildAssetWithPromotions(asset, strictModel.assumptions, promotions));
  const strictTotal = sumEstimatedDps(strictModel.assets ?? []);
  const reviewedTotal = sumEstimatedDps(assets);
  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "strict-reviewed",
    source: {
      strictBuiltAt: strictModel.builtAt,
      promotionRiskInspectedAt: promotionRisk.inspectedAt,
      strictSummary: strictModel.summary,
      promotionRiskSummary: promotionRisk.summary,
    },
    assumptions: {
      ...(strictModel.assumptions ?? {}),
      note: "Reviewed DPS model. Only promotions marked candidate-for-strict-review are included.",
    },
    comparison: {
      strictTotalEstimatedDps: strictTotal,
      reviewedTotalEstimatedDps: reviewedTotal,
      deltaDps: reviewedTotal - strictTotal,
      deltaPct: safePct(reviewedTotal - strictTotal, strictTotal),
      promotedFormulas: assets.reduce((sum, asset) => sum + asset.experimental.promotedFormulas, 0),
    },
    summary: summarizeDpsAssets(assets),
    assets,
  };
}

function buildBranchAwareDpsModel(model, branchInference) {
  const inferenceByAsset = new Map((branchInference.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (model.assets ?? []).map((asset) => applyBranchAwarenessToAsset(asset, inferenceByAsset.get(String(asset.assetId))));
  const baseTotal = sumEstimatedDps(model.assets ?? []);
  const branchAwareTotal = sumEstimatedDps(assets);
  const scenarioRows = assets.flatMap((asset) => asset.branchAwareness?.scenarioEstimates ?? []);
  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "strict-reviewed-with-branch-gates",
    source: {
      baseModelBuiltAt: model.builtAt,
      branchInferenceInferredAt: branchInference.inferredAt,
      baseMode: model.mode ?? "unknown",
      branchInferenceSummary: branchInference.summary,
    },
    assumptions: {
      ...(model.assumptions ?? {}),
      note: "Branch-aware gated model. Global DPS stays strict; safe scenario estimates are exposed separately.",
    },
    comparison: {
      baseTotalEstimatedDps: baseTotal,
      branchAwareTotalEstimatedDps: branchAwareTotal,
      deltaDps: branchAwareTotal - baseTotal,
      deltaPct: safePct(branchAwareTotal - baseTotal, baseTotal),
      branchAssets: assets.filter((asset) => asset.branchAwareness).length,
      scenarioEstimates: scenarioRows.length,
      appliedScenarioEstimates: scenarioRows.filter((row) => row.decision === "apply-scenario-candidate").length,
      fallbackScenarioEstimates: scenarioRows.filter((row) => row.decision === "strict-fallback").length,
    },
    summary: {
      ...summarizeDpsAssets(assets),
      branchAwareness: summarizeBranchAwareness(assets),
    },
    assets,
  };
}

function auditGlobalBranchSignals(graphExport, model = null, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const modelAssets = new Map((model?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (graphExport.graphs ?? [])
    .filter((graph) => !requestedAssetIds || requestedAssetIds.has(String(graph.assetId)))
    .map((graph) => auditAssetBranchSignals(graph, modelAssets.get(String(graph.assetId))))
    .sort((a, b) => b.priority.score - a.priority.score || b.damageSignals.tableDamageFormulas - a.damageSignals.tableDamageFormulas || String(a.assetId).localeCompare(String(b.assetId)));

  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      modelBuiltAt: model?.builtAt ?? null,
      modelMode: model?.mode ?? null,
    },
    assumptions: {
      note: "Global branch audit uses formula graph structure only. It prioritizes assets for deeper branch mapping; it does not prove gameplay semantics.",
    },
    summary: {
      assets: assets.length,
      assetsWithBranchSignals: assets.filter((asset) => asset.branchSignals.totalSignals > 0).length,
      assetsWithDamageAndBranchSignals: assets.filter((asset) => asset.damageSignals.hasDamage && asset.branchSignals.totalSignals > 0).length,
      assetsWithExplicitModFlags: assets.filter((asset) => asset.branchSignals.modFlags.length > 0).length,
      assetsWithTernaries: assets.filter((asset) => asset.branchSignals.ternaryFormulas > 0).length,
      assetsWithExternalRefs: assets.filter((asset) => asset.branchSignals.externalRefFormulas > 0).length,
      priorityCounts: sortCounts(countBy(assets, (asset) => asset.priority.level)),
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topPriorityAssets: assets.slice(0, 12).map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        priority: asset.priority,
        recommendation: asset.recommendation,
        damageSignals: asset.damageSignals,
        branchSignals: {
          totalSignals: asset.branchSignals.totalSignals,
          modFlags: asset.branchSignals.modFlags,
          ternaryFormulas: asset.branchSignals.ternaryFormulas,
          sfControlFormulas: asset.branchSignals.sfControlFormulas,
          externalRefFormulas: asset.branchSignals.externalRefFormulas,
        },
      })),
    },
    assets,
  };
}

function auditAssetBranchSignals(graph, modelAsset) {
  const formulas = (graph.nodes ?? []).filter((node) => node.id?.startsWith("formula:"));
  const formulaSignals = formulas.map((node) => auditFormulaBranchSignal(node));
  const damageSignals = summarizeAssetDamageSignals(formulaSignals, modelAsset);
  const branchSignals = summarizeAssetBranchSignals(formulaSignals);
  const priority = scoreAssetBranchPriority(damageSignals, branchSignals, modelAsset);
  return {
    assetId: graph.assetId,
    source: graph.source,
    tags: graph.tags ?? [],
    formulas: formulas.length,
    model: modelAsset
      ? {
          estimatedDps: modelAsset.estimatedDps,
          primaryDamageCoefficient: modelAsset.components?.primaryDamageCoefficient ?? null,
          damageTerms: modelAsset.components?.dedupedDamageTerms ?? null,
          multiplierProduct: modelAsset.components?.multiplierProduct ?? null,
          uptimeProduct: modelAsset.components?.uptimeProduct ?? null,
        }
      : null,
    damageSignals,
    branchSignals,
    priority,
    recommendation: recommendAssetBranchAudit(damageSignals, branchSignals, priority),
    formulasWithSignals: formulaSignals.filter((signal) => signal.signalKinds.length > 0),
  };
}

function auditFormulaBranchSignal(node) {
  const expression = node.expression ?? "";
  const dependsOn = node.dependsOn ?? {};
  const sfRefs = normalizeNumberList(dependsOn.sfRefs ?? []);
  const tableRefs = dependsOn.tables ?? extractTableRefs(expression);
  const externalRefs = extractExternalRefs(dependsOn);
  const modFlags = extractModFlags(expression);
  const tableDamageCoefficient = inferTableDamageCoefficient(expression);
  const signalKinds = [];
  if (/\?/.test(expression)) signalKinds.push("ternary");
  if (modFlags.length > 0) signalKinds.push("mod-flag");
  if (sfRefs.length > 0) signalKinds.push("sf-ref");
  if (externalRefs.length > 0) signalKinds.push("external-ref");
  if (tableRefs.length > 0) signalKinds.push("table-ref");
  if (tableDamageCoefficient !== null) signalKinds.push("table-damage-coefficient");
  return {
    nodeId: node.id,
    offset: node.offset,
    expression,
    signalKinds,
    modFlags,
    sfRefs,
    tableRefs,
    externalRefs,
    tableDamageCoefficient,
    branchKind: classifyFormulaBranchSignal(expression, sfRefs, externalRefs, modFlags, tableDamageCoefficient),
  };
}

function inferTableDamageCoefficient(expression) {
  const match = /^\s*([0-9]+(?:\.[0-9]+)?)\s*\*\s*Table\(/i.exec(expression ?? "");
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function classifyFormulaBranchSignal(expression, sfRefs, externalRefs, modFlags, tableDamageCoefficient) {
  if (tableDamageCoefficient !== null) return "damage-table-formula";
  if (modFlags.length > 0 && /\?/.test(expression)) return "explicit-upgrade-selector";
  if (/\?/.test(expression)) return "conditional-selector";
  if (sfRefs.length > 0 && externalRefs.length > 0) return "external-sf-scaling";
  if (sfRefs.length > 0) return "sf-scaling";
  if (externalRefs.length > 0) return "external-scaling";
  return "other";
}

function summarizeAssetDamageSignals(formulaSignals, modelAsset) {
  const damageFormulas = formulaSignals.filter((signal) => signal.tableDamageCoefficient !== null);
  const coefficients = damageFormulas.map((signal) => signal.tableDamageCoefficient).filter(Number.isFinite).sort((a, b) => b - a);
  return {
    hasDamage: coefficients.length > 0 || Number(modelAsset?.components?.primaryDamageCoefficient ?? 0) > 0,
    tableDamageFormulas: damageFormulas.length,
    tableDamageCoefficients: coefficients,
    uniqueTableDamageCoefficients: Array.from(new Set(coefficients)),
    modelPrimaryDamageCoefficient: modelAsset?.components?.primaryDamageCoefficient ?? null,
    modelEstimatedDps: modelAsset?.estimatedDps ?? null,
    multipleDamageCoefficients: new Set(coefficients).size > 1,
  };
}

function summarizeAssetBranchSignals(formulaSignals) {
  const withSignals = formulaSignals.filter((signal) => signal.signalKinds.length > 0);
  const modFlags = Array.from(new Set(withSignals.flatMap((signal) => signal.modFlags))).sort();
  const sfRefs = Array.from(new Set(withSignals.flatMap((signal) => signal.sfRefs))).sort((a, b) => a - b);
  const externalRefs = withSignals.flatMap((signal) => signal.externalRefs);
  return {
    totalSignals: withSignals.length,
    ternaryFormulas: withSignals.filter((signal) => signal.signalKinds.includes("ternary")).length,
    modFlagFormulas: withSignals.filter((signal) => signal.signalKinds.includes("mod-flag")).length,
    sfControlFormulas: withSignals.filter((signal) => signal.signalKinds.includes("sf-ref")).length,
    externalRefFormulas: withSignals.filter((signal) => signal.signalKinds.includes("external-ref")).length,
    tableRefFormulas: withSignals.filter((signal) => signal.signalKinds.includes("table-ref")).length,
    modFlags,
    sfRefs,
    externalRefs: externalRefs.slice(0, 12),
    branchKindCounts: sortCounts(countBy(withSignals, (signal) => signal.branchKind)),
  };
}

function scoreAssetBranchPriority(damageSignals, branchSignals, modelAsset) {
  let score = 0;
  const reasons = [];
  if (damageSignals.hasDamage) {
    score += 4;
    reasons.push("has damage signal");
  }
  if (damageSignals.multipleDamageCoefficients) {
    score += 4;
    reasons.push("multiple damage coefficients");
  }
  if (branchSignals.modFlags.length > 0) {
    score += 5;
    reasons.push("explicit Mod flags");
  }
  if (branchSignals.ternaryFormulas > 0) {
    score += 3;
    reasons.push("conditional formulas");
  }
  if (branchSignals.sfControlFormulas > 0) {
    score += 2;
    reasons.push("SF dependencies");
  }
  if (branchSignals.externalRefFormulas > 0) {
    score += 2;
    reasons.push("external references");
  }
  if (Number(modelAsset?.estimatedDps ?? 0) > 0) {
    score += 2;
    reasons.push("affects current DPS prototype");
  }
  return {
    score,
    level: score >= 14 ? "high" : score >= 8 ? "medium" : score > 0 ? "low" : "none",
    reasons,
  };
}

function recommendAssetBranchAudit(damageSignals, branchSignals, priority) {
  if (priority.level === "high" && damageSignals.hasDamage && branchSignals.modFlags.length > 0) {
    return {
      kind: "run-branch-pipeline",
      confidence: "high",
      note: "Damage and explicit build flags are present; run scenario mapping and gated DPS review.",
    };
  }
  if (damageSignals.hasDamage && branchSignals.ternaryFormulas > 0) {
    return {
      kind: "inspect-conditional-damage",
      confidence: "medium",
      note: "Damage and conditional formulas coexist; inspect selectors before summing damage terms.",
    };
  }
  if (damageSignals.hasDamage && damageSignals.multipleDamageCoefficients) {
    return {
      kind: "audit-damage-composition",
      confidence: "medium",
      note: "Multiple damage coefficients exist even without an explicit branch signal.",
    };
  }
  if (branchSignals.totalSignals > 0) {
    return {
      kind: "catalog-build-state-dependencies",
      confidence: "low",
      note: "Branch-like dependencies exist but are not currently tied to a damage coefficient.",
    };
  }
  return {
    kind: "no-branch-action",
    confidence: "medium",
    note: "No branch signal was found in the extracted formula graph.",
  };
}

function inspectConditionalDamage(graphExport, model = null, priorityInspection = null, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const modelAssets = new Map((model?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const priorityAssets = new Map((priorityInspection?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (graphExport.graphs ?? [])
    .filter((graph) => !requestedAssetIds || requestedAssetIds.has(String(graph.assetId)))
    .map((graph) => inspectAssetConditionalDamage(graph, modelAssets.get(String(graph.assetId)), priorityAssets.get(String(graph.assetId))))
    .filter((asset) => asset.conditionalDamageFormulas.length > 0 || asset.relatedUtilityFormulas.length > 0)
    .sort((a, b) => b.priority.score - a.priority.score || String(a.assetId).localeCompare(String(b.assetId)));
  const formulas = assets.flatMap((asset) => asset.conditionalDamageFormulas);

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      modelBuiltAt: model?.builtAt ?? null,
      priorityInspectedAt: priorityInspection?.inspectedAt ?? null,
    },
    assumptions: {
      note: "Conditional damage inspection classifies ternary table formulas and nearby SF utility formulas. It does not apply them to DPS automatically.",
    },
    summary: {
      assets: assets.length,
      conditionalDamageFormulas: formulas.length,
      duplicatedConditionalExpressions: formulas.filter((formula) => formula.duplicateGroupSize > 1).length,
      assetsWithModelDps: assets.filter((asset) => Number(asset.model?.estimatedDps ?? 0) > 0).length,
      priorityCounts: sortCounts(countBy(assets, (asset) => asset.priority.level)),
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topAssets: assets.slice(0, 12).map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        priority: asset.priority,
        recommendation: asset.recommendation,
        model: asset.model,
        conditionalDamageFormulas: asset.conditionalDamageFormulas.map((formula) => ({
          nodeId: formula.nodeId,
          condition: formula.condition,
          baseCoefficient: formula.baseCoefficient,
          boostedCoefficient: formula.boostedCoefficient,
          conditionSfRefs: formula.conditionSfRefs,
          scalingSfRefs: formula.scalingSfRefs,
          duplicateGroupSize: formula.duplicateGroupSize,
        })),
        relatedUtilityFormulas: asset.relatedUtilityFormulas.slice(0, 6),
      })),
    },
    assets,
  };
}

function inspectAssetConditionalDamage(graph, modelAsset, priorityAsset) {
  const nodes = (graph.nodes ?? []).filter((node) => node.id?.startsWith("formula:")).sort((a, b) => a.offset - b.offset);
  const modelFormulaByNode = new Map((modelAsset?.formulas ?? []).map((formula) => [formula.nodeId, formula]));
  const conditionalDamageFormulas = nodes
    .map((node) => inspectConditionalDamageFormula(node, modelFormulaByNode.get(node.id), priorityAsset))
    .filter(Boolean);
  const duplicateCounts = countBy(conditionalDamageFormulas, (formula) => normalizePromotionExpression(formula.expression));
  for (const formula of conditionalDamageFormulas) {
    formula.duplicateGroupSize = duplicateCounts[normalizePromotionExpression(formula.expression)] ?? 1;
  }
  const relatedSfRefs = Array.from(new Set(conditionalDamageFormulas.flatMap((formula) => [...formula.conditionSfRefs, ...formula.scalingSfRefs]))).sort((a, b) => a - b);
  const relatedUtilityFormulas = nodes
    .filter((node) => !conditionalDamageFormulas.some((formula) => formula.nodeId === node.id))
    .filter((node) => (node.dependsOn?.sfRefs ?? []).some((sfIndex) => relatedSfRefs.includes(sfIndex)) || /POW\(|min\(|\/|SF_\d+\s*\*/i.test(node.expression ?? ""))
    .map((node) => ({
      nodeId: node.id,
      offset: node.offset,
      expression: node.expression,
      sfRefs: node.dependsOn?.sfRefs ?? [],
      roleHint: classifyConditionalRelatedUtility(node.expression ?? ""),
      modelValue: modelFormulaByNode.get(node.id)?.value ?? null,
    }));
  const priority = scoreConditionalDamagePriority(conditionalDamageFormulas, relatedUtilityFormulas, modelAsset);
  return {
    assetId: graph.assetId,
    source: graph.source,
    tags: graph.tags ?? [],
    model: modelAsset
      ? {
          estimatedDps: modelAsset.estimatedDps,
          primaryDamageCoefficient: modelAsset.components?.primaryDamageCoefficient ?? null,
          damageTerms: modelAsset.components?.dedupedDamageTerms ?? null,
        }
      : null,
    conditionalDamageFormulas,
    relatedUtilityFormulas,
    priorityContext: priorityAsset
      ? {
          missingRefs: priorityAsset.missingRefs?.length ?? 0,
          formulasWithMissingRefs: priorityAsset.formulasWithMissingRefs?.length ?? 0,
          structuralWindows: priorityAsset.structuralWindows?.length ?? 0,
          targetSfIndexes: priorityAsset.summary?.targetSfIndexes ?? [],
        }
      : null,
    priority,
    recommendation: recommendConditionalDamageAsset(conditionalDamageFormulas, relatedUtilityFormulas, priority),
  };
}

function inspectConditionalDamageFormula(node, modelFormula, priorityAsset) {
  const parsed = parseConditionalTableDamageExpression(node.expression ?? "");
  if (!parsed) return null;
  const priorityFormula = (priorityAsset?.formulasWithMissingRefs ?? []).find((formula) => formula.nodeId === node.id);
  return {
    nodeId: node.id,
    offset: node.offset,
    bytecodeOffset: priorityFormula?.bytecodeOffset ?? null,
    expression: node.expression,
    canonicalExpression: modelFormula?.canonicalExpression ?? null,
    modelValue: modelFormula?.value ?? null,
    modelRole: modelFormula?.dpsRole ?? null,
    condition: parsed.condition,
    conditionSfRefs: parsed.conditionSfRefs,
    scalingSfRefs: parsed.scalingSfRefs,
    tableRefs: parsed.tableRefs,
    baseCoefficient: parsed.baseCoefficient,
    boostedCoefficient: parsed.boostedCoefficient,
    boostedExpression: parsed.boostedExpression,
    branchInterpretation: parsed.branchInterpretation,
    duplicateGroupSize: 1,
  };
}

function parseConditionalTableDamageExpression(expression) {
  const match = /^\s*\(?\s*(SF_(\d+))\s*==\s*0\s*\)?\s*\?\s*\(?\s*([0-9]+(?:\.[0-9]+)?)\s*\*\s*Table\(\s*([0-9]+)\s*,\s*([^)]+?)\s*\)\s*\)?\s*:\s*\(?\s*([0-9]+(?:\.[0-9]+)?)\s*\*\s*Table\(\s*([0-9]+)\s*,\s*([^)]+?)\s*\)\s*\*\s*\(\s*1\s*\+\s*\(?\s*SF_(\d+)\s*\)?\s*\)\s*\)?\s*$/i.exec(expression ?? "");
  if (!match) return null;
  const conditionSf = Number(match[2]);
  const baseCoefficient = Number(match[3]);
  const baseTableId = Number(match[4]);
  const baseArgument = match[5].trim();
  const boostedCoefficient = Number(match[6]);
  const boostedTableId = Number(match[7]);
  const boostedArgument = match[8].trim();
  const scalingSf = Number(match[9]);
  return {
    condition: `${match[1]} == 0`,
    conditionSfRefs: [conditionSf],
    scalingSfRefs: [scalingSf],
    tableRefs: [
      { tableId: baseTableId, argument: baseArgument },
      { tableId: boostedTableId, argument: boostedArgument },
    ],
    baseCoefficient,
    boostedCoefficient,
    boostedExpression: `${boostedCoefficient} * Table(${boostedTableId}, ${boostedArgument}) * (1 + SF_${scalingSf})`,
    branchInterpretation: {
      zeroCondition: `If SF_${conditionSf} is 0, use base coefficient ${baseCoefficient}.`,
      nonZeroCondition: `Otherwise apply SF_${scalingSf} as an additive multiplier on the same table coefficient.`,
    },
  };
}

function classifyConditionalRelatedUtility(expression) {
  if (/POW\(/i.test(expression)) return "probability-or-uptime";
  if (/min\(/i.test(expression)) return "cap-or-bound";
  if (/\/\s*SF_\d+|SF_\d+\s*\//i.test(expression)) return "ratio";
  if (/SF_\d+\s*\*/i.test(expression)) return "sf-multiplier";
  return "sf-utility";
}

function scoreConditionalDamagePriority(conditionalDamageFormulas, relatedUtilityFormulas, modelAsset) {
  let score = 0;
  const reasons = [];
  if (conditionalDamageFormulas.length > 0) {
    score += 5;
    reasons.push("conditional damage formulas");
  }
  if (conditionalDamageFormulas.some((formula) => formula.duplicateGroupSize > 1)) {
    score += 3;
    reasons.push("duplicated conditional damage expression");
  }
  if (relatedUtilityFormulas.length > 0) {
    score += 2;
    reasons.push("related SF utility formulas");
  }
  if (Number(modelAsset?.estimatedDps ?? 0) > 0) {
    score += 3;
    reasons.push("affects DPS prototype");
  }
  if (Number(modelAsset?.components?.dedupedDamageTerms ?? 0) > 1) {
    score += 2;
    reasons.push("multiple model damage terms");
  }
  return {
    score,
    level: score >= 12 ? "high" : score >= 7 ? "medium" : score > 0 ? "low" : "none",
    reasons,
  };
}

function recommendConditionalDamageAsset(conditionalDamageFormulas, relatedUtilityFormulas, priority) {
  if (conditionalDamageFormulas.some((formula) => formula.duplicateGroupSize > 1)) {
    return {
      kind: "dedupe-conditional-damage-before-branching",
      confidence: "high",
      note: "Equivalent conditional damage expressions are present; dedupe or identify rank/variant ownership before branch-aware DPS.",
    };
  }
  if (priority.level === "high" || priority.level === "medium") {
    return {
      kind: "build-conditional-sf-scenarios",
      confidence: "medium",
      note: "Conditional damage is controlled by SF refs; create scenarios for condition/scaling refs before changing DPS.",
    };
  }
  if (relatedUtilityFormulas.length > 0) {
    return {
      kind: "catalog-related-sf-utilities",
      confidence: "low",
      note: "Related SF utilities exist but are not enough to alter damage calculations.",
    };
  }
  return {
    kind: "no-conditional-damage-action",
    confidence: "medium",
    note: "No conditional damage action is needed from current extracted formulas.",
  };
}

function inspectConditionalDamageDedupe(conditionalDamageInspection, options = {}) {
  const assets = (conditionalDamageInspection.assets ?? []).map((asset) => inspectAssetConditionalDamageDedupe(asset, options));
  const groups = assets.flatMap((asset) => asset.duplicateGroups);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      conditionalDamageInspectedAt: conditionalDamageInspection.inspectedAt,
      conditionalDamageSummary: conditionalDamageInspection.summary,
    },
    assumptions: {
      note: "Dedupe inspection is a safety gate. Safe duplicates may be ignored for overcount prevention, but branch semantics still require structural proof.",
    },
    summary: {
      assets: assets.length,
      duplicateGroups: groups.length,
      duplicateFormulas: groups.reduce((sum, group) => sum + group.formulas.length, 0),
      safeDedupeGroups: groups.filter((group) => group.recommendation.kind === "dedupe-for-overcount-prevention").length,
      groupsRequiringOwnershipReview: groups.filter((group) => group.recommendation.kind === "review-rank-or-variant-ownership").length,
      strictDpsChangingGroups: groups.filter((group) => group.strictImpact.changesStrictPrimary).length,
      recommendationCounts: sortCounts(countBy(groups, (group) => group.recommendation.kind)),
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        recommendation: asset.recommendation,
        duplicateGroups: asset.duplicateGroups.map((group) => ({
          key: group.key,
          formulas: group.formulas.map((formula) => formula.nodeId),
          modelValue: group.modelValue,
          coefficient: group.coefficient,
          strictImpact: group.strictImpact,
          recommendation: group.recommendation,
        })),
      })),
    },
    assets,
  };
}

function auditDedupedDamageComposition(model, conditionalDedupe) {
  const dedupeByAsset = buildConditionalDedupeIndex(conditionalDedupe);
  const assets = (model.assets ?? [])
    .map((asset) => auditAssetDedupedDamageComposition(asset, dedupeByAsset.get(String(asset.assetId)) ?? []))
    .filter((asset) => asset.damageTerms.length > 0 && (asset.dedupe.removedTerms.length > 0 || asset.damageTerms.length > 1));
  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      modelBuiltAt: model.builtAt,
      modelMode: model.mode ?? "strict",
      conditionalDedupeInspectedAt: conditionalDedupe.inspectedAt,
      conditionalDedupeSummary: conditionalDedupe.summary,
    },
    assumptions: {
      note: "This audit applies safe conditional dedupe groups to sum-style damage audits only. Strict max DPS is not changed unless a deduped term was the selected max.",
    },
    summary: {
      assets: assets.length,
      assetsWithRemovedDuplicates: assets.filter((asset) => asset.dedupe.removedTerms.length > 0).length,
      removedDuplicateTerms: assets.reduce((sum, asset) => sum + asset.dedupe.removedTerms.length, 0),
      rawSumCoefficient: assets.reduce((sum, asset) => sum + asset.raw.sumCoefficient, 0),
      dedupedSumCoefficient: assets.reduce((sum, asset) => sum + asset.deduped.sumCoefficient, 0),
      removedCoefficient: assets.reduce((sum, asset) => sum + asset.dedupe.removedCoefficient, 0),
      strictDpsChangingAssets: assets.filter((asset) => asset.strictImpact.changesStrictPrimary).length,
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topAssets: assets
        .slice()
        .sort((a, b) => b.dedupe.removedCoefficient - a.dedupe.removedCoefficient || String(a.assetId).localeCompare(String(b.assetId)))
        .slice(0, 20)
        .map((asset) => ({
          assetId: asset.assetId,
          rawSumCoefficient: asset.raw.sumCoefficient,
          dedupedSumCoefficient: asset.deduped.sumCoefficient,
          removedCoefficient: asset.dedupe.removedCoefficient,
          currentPrimary: asset.current.primaryDamageCoefficient,
          removedTerms: asset.dedupe.removedTerms.map((term) => term.nodeId),
          recommendation: asset.recommendation,
        })),
    },
    assets,
  };
}

function buildConditionalSfScenarios(conditionalDamage, dedupedComposition, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const scenarioInputs = options.scenarios?.length ? options.scenarios : defaultConditionalSfScenarios();
  const compositionByAsset = new Map((dedupedComposition.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (conditionalDamage.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) => buildAssetConditionalSfScenarios(asset, compositionByAsset.get(String(asset.assetId)), scenarioInputs))
    .filter((asset) => asset.scenarios.length > 0);
  const rows = assets.flatMap((asset) => asset.scenarios.map((scenario) => ({ asset, scenario })));
  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "conditional-sf-scenario-audit",
    source: {
      conditionalDamageInspectedAt: conditionalDamage.inspectedAt,
      conditionalDamageSummary: conditionalDamage.summary,
      dedupedCompositionAuditedAt: dedupedComposition.auditedAt,
      dedupedCompositionSummary: dedupedComposition.summary,
    },
    assumptions: {
      note: "Local scenario audit for conditional SF damage. It applies safe duplicate removal and evaluates SF_33/SF_32 branches, but does not yet prove uptime or gameplay ownership.",
      sf33: "0 selects base damage; any non-zero scenario selects the boosted branch.",
      sf32: "Applied as additive scaling in the boosted branch: coefficient * Table(...) * (1 + SF_32).",
    },
    summary: {
      assets: assets.length,
      scenarios: rows.length,
      scenariosAboveStrict: rows.filter(({ scenario }) => scenario.deltaVsStrictDps > 1e-9).length,
      scenariosBelowStrict: rows.filter(({ scenario }) => scenario.deltaVsStrictDps < -1e-9).length,
      maxScenarioDps: rows.length ? Math.max(...rows.map(({ scenario }) => scenario.estimatedDps)) : 0,
      topScenarios: rows
        .slice()
        .sort((a, b) => b.scenario.estimatedDps - a.scenario.estimatedDps || String(a.asset.assetId).localeCompare(String(b.asset.assetId)))
        .slice(0, 20)
        .map(({ asset, scenario }) => ({
          assetId: asset.assetId,
          scenarioId: scenario.id,
          label: scenario.label,
          primaryDamageCoefficient: scenario.primaryDamageCoefficient,
          estimatedDps: scenario.estimatedDps,
          deltaVsStrictDps: scenario.deltaVsStrictDps,
          recommendation: scenario.recommendation,
        })),
    },
    assets,
  };
}

function inspectConditionalSfSources(conditionalDamage, priorityInspection, sfUsage = null, sfCandidates = null, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const priorityByAsset = new Map((priorityInspection.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const usageByAsset = new Map((sfUsage?.graphs ?? []).map((asset) => [String(asset.assetId), asset]));
  const candidatesByAsset = new Map((sfCandidates?.graphs ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (conditionalDamage.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) =>
      inspectAssetConditionalSfSources(
        asset,
        priorityByAsset.get(String(asset.assetId)),
        usageByAsset.get(String(asset.assetId)),
        candidatesByAsset.get(String(asset.assetId))
      )
    )
    .filter((asset) => asset.slots.length > 0);
  const slots = assets.flatMap((asset) => asset.slots);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      conditionalDamageInspectedAt: conditionalDamage.inspectedAt,
      priorityInspectedAt: priorityInspection.inspectedAt,
      sfUsageAnalyzedAt: sfUsage?.analyzedAt ?? null,
      sfCandidatesExportedAt: sfCandidates?.exportedAt ?? null,
    },
    assumptions: {
      note: "This report identifies local evidence for conditional SF slots. Missing standalone symbols mean the slot source is external or not decoded yet, not that the slot is invalid.",
    },
    summary: {
      assets: assets.length,
      slots: slots.length,
      slotsWithoutLocalSymbol: slots.filter((slot) => slot.localSymbolStatus === "missing").length,
      slotsWithOnlyFormulaOccurrences: slots.filter((slot) => slot.sourceAssessment.kind === "formula-only-external-slot").length,
      recommendationCounts: sortCounts(countBy(slots, (slot) => slot.recommendation.kind)),
      topSlots: slots
        .slice()
        .sort((a, b) => b.priorityScore - a.priorityScore || String(a.canonicalId).localeCompare(String(b.canonicalId)))
        .map((slot) => ({
          canonicalId: slot.canonicalId,
          role: slot.role,
          priorityScore: slot.priorityScore,
          localSymbolStatus: slot.localSymbolStatus,
          sourceAssessment: slot.sourceAssessment,
          recommendation: slot.recommendation,
        })),
    },
    assets,
  };
}

function inspectAssetConditionalSfSources(asset, priorityAsset, usageAsset, candidateAsset) {
  const slotIndexes = Array.from(
    new Set(
      (asset.conditionalDamageFormulas ?? []).flatMap((formula) => [
        ...(formula.conditionSfRefs ?? []),
        ...(formula.scalingSfRefs ?? []),
      ])
    )
  ).sort((a, b) => a - b);
  const slots = slotIndexes.map((sfIndex) => inspectConditionalSfSlot(asset, sfIndex, priorityAsset, usageAsset, candidateAsset));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    model: asset.model,
    slots,
    recommendation: recommendConditionalSfSourceAsset(slots),
  };
}

function inspectConditionalSfSlot(asset, sfIndex, priorityAsset, usageAsset, candidateAsset) {
  const conditionalFormulas = (asset.conditionalDamageFormulas ?? []).filter(
    (formula) => (formula.conditionSfRefs ?? []).includes(sfIndex) || (formula.scalingSfRefs ?? []).includes(sfIndex)
  );
  const priorityRefs = (priorityAsset?.missingRefs ?? []).filter((ref) => Number(ref.sfIndex) === sfIndex);
  const sfOccurrence = (priorityAsset?.sfOccurrences ?? []).find((item) => Number(item.sfIndex) === sfIndex);
  const usageItems = (usageAsset?.usedSf ?? []).filter((item) => Number(item.sfIndex) === sfIndex);
  const localSymbol = candidateAsset?.sfSymbolMap?.[String(sfIndex)] ?? null;
  const formulaContexts = (priorityAsset?.formulasWithMissingRefs ?? [])
    .filter((formula) => (formula.matchingSfRefs ?? []).includes(sfIndex))
    .map((formula) => summarizeConditionalSfFormulaContext(formula, sfIndex));
  const standaloneAscii = (sfOccurrence?.asciiOccurrences ?? []).filter((occurrence) => occurrence.occurrenceKind === "standalone-symbol");
  const formulaAscii = (sfOccurrence?.asciiOccurrences ?? []).filter((occurrence) => occurrence.occurrenceKind !== "standalone-symbol");
  const role = classifyConditionalSfSlotRole(sfIndex, conditionalFormulas);
  const priorityScore = scoreConditionalSfSlot(role, sfOccurrence, localSymbol, usageItems);
  const sourceAssessment = assessConditionalSfSlotSource(localSymbol, standaloneAscii, formulaAscii, sfOccurrence, usageItems);
  return {
    canonicalId: `sf:${asset.assetId}:${sfIndex}`,
    assetId: asset.assetId,
    sfIndex,
    symbol: `SF_${sfIndex}`,
    role,
    priorityScore,
    localSymbolStatus: localSymbol ? "found" : "missing",
    localSymbol: localSymbol
      ? {
          offsets: localSymbol.offsets ?? [],
          metadataProfiles: localSymbol.metadataProfiles ?? {},
          constantsAfterSamples: localSymbol.constantsAfterSamples ?? [],
        }
      : null,
    usage: {
      roles: Array.from(new Set(usageItems.flatMap((item) => item.usageRoles ?? []))).sort(),
      interestLevels: sortCounts(countBy(usageItems, (item) => item.interestLevel)),
      reasons: Array.from(new Set(usageItems.flatMap((item) => item.interestReasons ?? []))).sort(),
    },
    formulas: conditionalFormulas.map((formula) => ({
      nodeId: formula.nodeId,
      expression: formula.expression,
      conditionSfRefs: formula.conditionSfRefs,
      scalingSfRefs: formula.scalingSfRefs,
      modelValue: formula.modelValue,
      baseCoefficient: formula.baseCoefficient,
    })),
    priorityRefs,
    occurrences: {
      asciiFormulaOccurrences: formulaAscii.map((occurrence) => ({
        offset: occurrence.offset,
        runStart: occurrence.run?.start ?? null,
        runEnd: occurrence.run?.end ?? null,
        value: occurrence.run?.value ?? null,
      })),
      standaloneAsciiOccurrences: standaloneAscii.map((occurrence) => ({
        offset: occurrence.offset,
        value: occurrence.run?.value ?? null,
      })),
      bytecodeOccurrences: (sfOccurrence?.bytecodeOccurrences ?? []).map((occurrence) => ({
        offset: occurrence.offset,
      })),
    },
    formulaContexts,
    sourceAssessment,
    recommendation: recommendConditionalSfSlotSource(role, sourceAssessment),
  };
}

function summarizeConditionalSfFormulaContext(formula, sfIndex) {
  const bytecodeTokens = Array.isArray(formula.bytecode) ? formula.bytecode : formula.bytecode?.tokens ?? [];
  const sfTokens = bytecodeTokens.filter((token) => token.kind === "sf-ref");
  return {
    nodeId: formula.nodeId,
    stringOffset: formula.stringOffset,
    bytecodeOffset: formula.bytecodeOffset,
    expression: formula.expression,
    matchingSfRefs: formula.matchingSfRefs,
    sfBytecodeTokens: sfTokens.map((token) => ({
      offset: token.offset,
      raw: token.raw,
      sfIndexGuess: token.sfIndexGuess,
      matchesRequested: token.sfIndexGuess === sfIndex,
    })),
    nearbyFormulaStrings: (formula.nearbyStrings ?? [])
      .filter((item) => item.kind === "formula")
      .slice(0, 8)
      .map((item) => ({ offset: item.offset, value: item.value })),
  };
}

function classifyConditionalSfSlotRole(sfIndex, conditionalFormulas) {
  const isCondition = conditionalFormulas.some((formula) => (formula.conditionSfRefs ?? []).includes(sfIndex));
  const isScaling = conditionalFormulas.some((formula) => (formula.scalingSfRefs ?? []).includes(sfIndex));
  if (isCondition && isScaling) return "condition-and-scaling";
  if (isCondition) return "branch-condition";
  if (isScaling) return "boost-scaling";
  return "conditional-related";
}

function scoreConditionalSfSlot(role, sfOccurrence, localSymbol, usageItems) {
  let score = 0;
  if (role === "branch-condition") score += 5;
  if (role === "boost-scaling") score += 4;
  if (role === "condition-and-scaling") score += 6;
  if (!localSymbol) score += 2;
  if ((sfOccurrence?.bytecodeOccurrences ?? []).length > 0) score += 2;
  if ((sfOccurrence?.asciiOccurrences ?? []).length > 0) score += 1;
  if (usageItems.some((item) => item.interestLevel === "high")) score += 2;
  return score;
}

function assessConditionalSfSlotSource(localSymbol, standaloneAscii, formulaAscii, sfOccurrence, usageItems) {
  if (localSymbol) {
    return {
      kind: "local-symbol-found",
      confidence: "medium",
      note: "A local SF symbol exists in the candidate map; inspect metadata profiles before using it as gameplay source.",
    };
  }
  if (standaloneAscii.length === 0 && formulaAscii.length > 0 && (sfOccurrence?.bytecodeOccurrences ?? []).length > 0) {
    return {
      kind: "formula-only-external-slot",
      confidence: "high",
      note: "The slot is used by formula strings and compiled bytecode but has no standalone local symbol in current extraction.",
    };
  }
  if (usageItems.length > 0) {
    return {
      kind: "usage-only-slot",
      confidence: "medium",
      note: "The slot is visible through formula usage, but local source metadata is not resolved.",
    };
  }
  return {
    kind: "unresolved-slot",
    confidence: "low",
    note: "No reliable local source evidence was found in current reports.",
  };
}

function recommendConditionalSfSlotSource(role, sourceAssessment) {
  if (sourceAssessment.kind === "formula-only-external-slot" && role === "branch-condition") {
    return {
      kind: "search-trigger-metadata",
      confidence: "high",
      note: "Find external metadata or formulas that set the branch condition before applying scenario DPS.",
    };
  }
  if (sourceAssessment.kind === "formula-only-external-slot" && role === "boost-scaling") {
    return {
      kind: "search-scaling-value-source",
      confidence: "high",
      note: "Find the external value source and uptime for the scaling slot before accepting boosted DPS scenarios.",
    };
  }
  if (sourceAssessment.kind === "local-symbol-found") {
    return {
      kind: "inspect-local-symbol-metadata",
      confidence: "medium",
      note: "Resolve candidate metadata profiles and constants for this local symbol.",
    };
  }
  return {
    kind: "manual-source-review",
    confidence: "low",
    note: "Keep the slot visible as unresolved input until more metadata is decoded.",
  };
}

function recommendConditionalSfSourceAsset(slots) {
  if (slots.some((slot) => slot.recommendation.kind === "search-trigger-metadata")) {
    return {
      kind: "resolve-condition-and-scaling-sources",
      confidence: "high",
      note: "At least one branch condition source is unresolved; do not promote boosted scenario DPS yet.",
    };
  }
  if (slots.some((slot) => slot.recommendation.kind === "search-scaling-value-source")) {
    return {
      kind: "resolve-scaling-source",
      confidence: "high",
      note: "Scaling source is unresolved; keep boosted scenarios as sensitivity estimates.",
    };
  }
  return {
    kind: "no-source-blocker-detected",
    confidence: "medium",
    note: "No high-priority unresolved source blocker was detected.",
  };
}

function inspectConditionalExternalMetadata(conditionalSfSources, externalTargets, externalRefs = null, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const refsByAsset = new Map((externalRefs?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const targetMatchesByAsset = new Map();
  for (const match of externalTargets.matches ?? []) {
    const key = String(match.assetId);
    if (!targetMatchesByAsset.has(key)) targetMatchesByAsset.set(key, []);
    targetMatchesByAsset.get(key).push(match);
  }

  const assets = (conditionalSfSources.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) =>
      inspectAssetConditionalExternalMetadata(
        asset,
        targetMatchesByAsset.get(String(asset.assetId)) ?? [],
        refsByAsset.get(String(asset.assetId))
      )
    )
    .filter((asset) => asset.candidates.length > 0);
  const candidates = assets.flatMap((asset) => asset.candidates);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      conditionalSfSourcesInspectedAt: conditionalSfSources.inspectedAt,
      externalTargetsSearchedAt: externalTargets.searchedAt,
      externalRefsExportedAt: externalRefs?.exportedAt ?? null,
    },
    assumptions: {
      note: "External metadata candidates are ranked by proximity and semantic role. This narrows the search but does not prove runtime ownership.",
    },
    summary: {
      assets: assets.length,
      candidates: candidates.length,
      triggerCandidates: candidates.filter((candidate) => candidate.roleHints.includes("branch-trigger")).length,
      scalingCandidates: candidates.filter((candidate) => candidate.roleHints.includes("boost-scaling-source")).length,
      highConfidenceCandidates: candidates.filter((candidate) => candidate.confidence === "high").length,
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topCandidates: candidates
        .slice()
        .sort((a, b) => b.score - a.score || a.distanceToConditionalFormula - b.distanceToConditionalFormula)
        .slice(0, 20)
        .map((candidate) => ({
          assetId: candidate.assetId,
          value: candidate.value,
          offset: candidate.offset,
          distanceToConditionalFormula: candidate.distanceToConditionalFormula,
          roleHints: candidate.roleHints,
          confidence: candidate.confidence,
          recommendation: candidate.recommendation,
        })),
    },
    assets,
  };
}

function inspectAssetConditionalExternalMetadata(asset, targetMatches, externalRefAsset) {
  const conditionalOffsets = asset.slots.flatMap((slot) =>
    slot.formulas.map((formula) => Number(formula.nodeId?.split(":")[1])).filter(Number.isFinite)
  );
  const formulaOffsets = asset.slots
    .flatMap((slot) => slot.formulaContexts ?? [])
    .map((context) => context.stringOffset)
    .filter(Number.isFinite);
  const relevantOffsets = formulaOffsets.length ? formulaOffsets : conditionalOffsets;
  const strings = dedupeBy(
    targetMatches.flatMap((match) => [
      ...(match.nearbyStrings ?? []).map((item) => ({ ...item, source: "nearby-string" })),
      ...(match.targetHits ?? []).map((item) => ({ offset: item.offset, value: item.value, target: item.target, kind: item.kind, sourceKey: item.sourceKey, exact: item.exact, source: "target-hit" })),
    ]),
    (item) => `${item.offset}:${item.value}:${item.kind ?? ""}:${item.target ?? ""}`
  );
  const candidates = mergeExternalMetadataCandidates(strings
    .map((item) => inspectExternalMetadataCandidate(asset.assetId, item, relevantOffsets, externalRefAsset))
    .filter((candidate) => candidate.roleHints.length > 0))
    .sort((a, b) => b.score - a.score || a.distanceToConditionalFormula - b.distanceToConditionalFormula || String(a.value).localeCompare(String(b.value)));

  return {
    assetId: asset.assetId,
    tags: asset.tags,
    conditionalSlots: asset.slots.map((slot) => ({
      canonicalId: slot.canonicalId,
      role: slot.role,
      recommendation: slot.recommendation,
    })),
    externalIdentity: externalRefAsset?.externalIdentity ?? null,
    candidates,
    recommendation: recommendConditionalExternalMetadataAsset(candidates),
  };
}

function mergeExternalMetadataCandidates(candidates) {
  const byValueAndOffset = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.offset}:${candidate.value}`;
    const existing = byValueAndOffset.get(key);
    if (!existing) {
      byValueAndOffset.set(key, candidate);
      continue;
    }
    const roleHints = Array.from(new Set([...(existing.roleHints ?? []), ...(candidate.roleHints ?? [])])).sort();
    const exact = existing.exact || candidate.exact;
    const score = Math.max(existing.score, candidate.score) + (exact && !existing.exact ? 1 : 0);
    byValueAndOffset.set(key, {
      ...existing,
      target: existing.target ?? candidate.target,
      kind: existing.kind ?? candidate.kind,
      sourceKey: existing.sourceKey ?? candidate.sourceKey,
      exact,
      roleHints,
      score,
      confidence: score >= 14 ? "high" : score >= 8 ? "medium" : "low",
      recommendation: recommendExternalMetadataCandidate(roleHints, existing.value),
    });
  }
  return Array.from(byValueAndOffset.values());
}

function inspectExternalMetadataCandidate(assetId, item, relevantOffsets, externalRefAsset) {
  const value = String(item.value ?? "");
  const offset = Number(item.offset);
  const distance = relevantOffsets.length && Number.isFinite(offset)
    ? Math.min(...relevantOffsets.map((formulaOffset) => Math.abs(offset - formulaOffset)))
    : null;
  const roleHints = classifyExternalMetadataRole(value, item);
  const score = scoreExternalMetadataCandidate(value, roleHints, distance, item, externalRefAsset);
  return {
    assetId,
    offset,
    value,
    target: item.target ?? null,
    kind: item.kind ?? null,
    sourceKey: item.sourceKey ?? null,
    exact: Boolean(item.exact),
    source: item.source,
    distanceToConditionalFormula: distance,
    roleHints,
    score,
    confidence: score >= 14 ? "high" : score >= 8 ? "medium" : "low",
    recommendation: recommendExternalMetadataCandidate(roleHints, value),
  };
}

function classifyExternalMetadataRole(value, item) {
  const roles = [];
  if (/Mod\./.test(value)) roles.push("branch-trigger");
  if (/SystemsTuningGlobals/i.test(value)) roles.push("global-tuning-source");
  if (/Spiritborn_Talent_Ultimate_2/i.test(value)) roles.push("skill-script-source");
  if (/Bonus_Percent_Per_Power|Spiritborn_Centipede_Ultimate/i.test(value)) roles.push("boost-scaling-source");
  if (/Table\(34|SF_32|SF_33/i.test(value)) roles.push("conditional-damage-neighbor");
  if (item.exact) roles.push("exact-target-hit");
  return roles;
}

function scoreExternalMetadataCandidate(value, roleHints, distance, item, externalRefAsset) {
  let score = 0;
  if (roleHints.includes("branch-trigger")) score += 8;
  if (roleHints.includes("boost-scaling-source")) score += 8;
  if (roleHints.includes("skill-script-source")) score += 6;
  if (roleHints.includes("global-tuning-source")) score += 5;
  if (roleHints.includes("conditional-damage-neighbor")) score += 4;
  if (roleHints.includes("exact-target-hit")) score += 3;
  if (Number.isFinite(distance)) {
    if (distance <= 256) score += 5;
    else if (distance <= 768) score += 3;
    else if (distance <= 1600) score += 1;
  }
  const identities = externalRefAsset?.externalIdentity?.candidates ?? [];
  if (identities.some((candidate) => value.includes(candidate.replace(/^NameCandidate:|^PowerTag:|^HashTarget:/, "").split(".\"")[0]))) {
    score += 2;
  }
  return score;
}

function recommendExternalMetadataCandidate(roleHints, value) {
  if (roleHints.includes("branch-trigger")) {
    return {
      kind: "inspect-as-sf33-trigger-source",
      note: "Candidate can explain whether the boosted branch is active.",
    };
  }
  if (roleHints.includes("boost-scaling-source")) {
    return {
      kind: "inspect-as-sf32-scaling-source",
      note: "Candidate can explain the additive scaling value used in boosted scenarios.",
    };
  }
  if (roleHints.includes("skill-script-source")) {
    return {
      kind: "inspect-skill-script-formula-link",
      note: "Candidate may own nearby formula slots for this skill.",
    };
  }
  return {
    kind: "keep-as-context",
    note: `Keep ${value} as nearby context until more metadata is decoded.`,
  };
}

function recommendConditionalExternalMetadataAsset(candidates) {
  const hasTrigger = candidates.some((candidate) => candidate.roleHints.includes("branch-trigger"));
  const hasScaling = candidates.some((candidate) => candidate.roleHints.includes("boost-scaling-source"));
  if (hasTrigger && hasScaling) {
    return {
      kind: "inspect-trigger-and-scaling-candidates",
      confidence: "high",
      note: "Both branch trigger and scaling candidates are present near conditional formulas.",
    };
  }
  if (hasScaling) {
    return {
      kind: "inspect-scaling-candidates",
      confidence: "medium",
      note: "Scaling candidates are present but trigger ownership is still unclear.",
    };
  }
  return {
    kind: "collect-more-external-metadata",
    confidence: "low",
    note: "No strong trigger/scaling candidate was found in current target search.",
  };
}

function inspectConditionalMetadataValues(conditionalExternalMetadata, externalTargets, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const radius = options.radius ?? 900;
  const targetMatchesByAsset = new Map();
  for (const match of externalTargets.matches ?? []) {
    const key = String(match.assetId);
    if (!targetMatchesByAsset.has(key)) targetMatchesByAsset.set(key, []);
    targetMatchesByAsset.get(key).push(match);
  }
  const assets = (conditionalExternalMetadata.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) => inspectAssetConditionalMetadataValues(asset, targetMatchesByAsset.get(String(asset.assetId)) ?? [], radius))
    .filter((asset) => asset.candidates.length > 0);
  const candidates = assets.flatMap((asset) => asset.candidates);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      conditionalExternalMetadataInspectedAt: conditionalExternalMetadata.inspectedAt,
      externalTargetsSearchedAt: externalTargets.searchedAt,
    },
    assumptions: {
      radius,
      note: "Value inspection looks for nearby numeric literals and formulas around trigger/scaling candidates. It does not decode the external target payload itself.",
    },
    summary: {
      assets: assets.length,
      candidates: candidates.length,
      candidatesWithDirectNumericValue: candidates.filter((candidate) => candidate.valueAssessment.kind === "direct-numeric-neighbor").length,
      candidatesWithFormulaNeighbors: candidates.filter((candidate) => candidate.valueAssessment.kind === "formula-neighbor-review").length,
      unresolvedExternalPointers: candidates.filter((candidate) => candidate.valueAssessment.kind === "external-pointer-unresolved").length,
      recommendationCounts: sortCounts(countBy(candidates, (candidate) => candidate.recommendation.kind)),
      topCandidates: candidates.map((candidate) => ({
        assetId: candidate.assetId,
        value: candidate.value,
        roleHints: candidate.roleHints,
        valueAssessment: candidate.valueAssessment,
        recommendation: candidate.recommendation,
        nearestNeighbors: candidate.neighbors.slice(0, 6),
      })),
    },
    assets,
  };
}

function inspectAssetConditionalMetadataValues(asset, targetMatches, radius) {
  const strings = dedupeBy(
    targetMatches.flatMap((match) => match.nearbyStrings ?? []),
    (item) => `${item.offset}:${item.value}`
  ).sort((a, b) => a.offset - b.offset);
  const candidates = (asset.candidates ?? [])
    .filter((candidate) =>
      candidate.roleHints?.includes("branch-trigger") ||
      candidate.roleHints?.includes("boost-scaling-source") ||
      candidate.roleHints?.includes("skill-script-source")
    )
    .map((candidate) => inspectMetadataValueCandidate(candidate, strings, radius));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    candidates,
    recommendation: recommendMetadataValueAsset(candidates),
  };
}

function inspectMetadataValueCandidate(candidate, strings, radius) {
  const neighbors = strings
    .filter((item) => Number.isFinite(item.offset) && Math.abs(item.offset - candidate.offset) <= radius && item.offset !== candidate.offset)
    .map((item) => ({
      offset: item.offset,
      distance: item.offset - candidate.offset,
      value: item.value,
      kind: classifyMetadataNeighborValue(item.value),
    }))
    .sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance) || a.offset - b.offset);
  const valueAssessment = assessMetadataCandidateValue(candidate, neighbors);
  return {
    assetId: candidate.assetId,
    offset: candidate.offset,
    value: candidate.value,
    roleHints: candidate.roleHints,
    confidence: candidate.confidence,
    neighbors,
    valueAssessment,
    recommendation: recommendMetadataValueCandidate(candidate, valueAssessment),
  };
}

function classifyMetadataNeighborValue(value) {
  const text = String(value ?? "");
  if (/^\d+(?:\.\d+)?$/.test(text)) return "numeric-literal";
  if (/POW\(/i.test(text)) return "probability-or-uptime-formula";
  if (/min\(/i.test(text)) return "cap-or-bound-formula";
  if (/Table\(/i.test(text)) return "table-formula";
  if (/SF_\d+.*[+\-*/]|[+\-*/].*SF_\d+/i.test(text)) return "sf-formula";
  if (/PowerTag\./i.test(text)) return "power-tag";
  if (/#/.test(text)) return "hash-reference";
  if (/Mod\./i.test(text)) return "mod-flag";
  return "context-string";
}

function assessMetadataCandidateValue(candidate, neighbors) {
  const directNumeric = neighbors.find((neighbor) => neighbor.kind === "numeric-literal" && Math.abs(neighbor.distance) <= 160);
  if (directNumeric) {
    return {
      kind: "direct-numeric-neighbor",
      confidence: "low",
      value: Number(directNumeric.value),
      note: "A nearby numeric literal exists, but ownership still needs proof before using it.",
    };
  }
  const formulaNeighbors = neighbors.filter((neighbor) =>
    ["probability-or-uptime-formula", "cap-or-bound-formula", "table-formula", "sf-formula"].includes(neighbor.kind)
  );
  if (formulaNeighbors.length > 0) {
    return {
      kind: "formula-neighbor-review",
      confidence: "medium",
      formulas: formulaNeighbors.slice(0, 5),
      note: "Nearby formulas exist; inspect whether they compute value, uptime, or unrelated display scaling.",
    };
  }
  if (candidate.roleHints?.includes("boost-scaling-source") || candidate.roleHints?.includes("branch-trigger")) {
    return {
      kind: "external-pointer-unresolved",
      confidence: "high",
      note: "Candidate is a strong external pointer but no directly usable value was found in the current neighborhood.",
    };
  }
  return {
    kind: "context-only",
    confidence: "low",
    note: "No usable value evidence was found nearby.",
  };
}

function recommendMetadataValueCandidate(candidate, valueAssessment) {
  if (candidate.roleHints?.includes("boost-scaling-source")) {
    return {
      kind: valueAssessment.kind === "direct-numeric-neighbor" ? "review-sf32-numeric-candidate" : "decode-sf32-external-target",
      note: "Resolve the bonus value before using boosted DPS scenarios.",
    };
  }
  if (candidate.roleHints?.includes("branch-trigger")) {
    return {
      kind: "map-sf33-trigger-to-build-state",
      note: "Map the mod flag to a build condition before selecting boosted or base branch.",
    };
  }
  return {
    kind: "review-skill-script-neighborhood",
    note: "Use this as ownership context for nearby formulas.",
  };
}

function recommendMetadataValueAsset(candidates) {
  const needsExternal = candidates.some((candidate) => candidate.recommendation.kind === "decode-sf32-external-target");
  const needsTrigger = candidates.some((candidate) => candidate.recommendation.kind === "map-sf33-trigger-to-build-state");
  if (needsExternal && needsTrigger) {
    return {
      kind: "decode-scaling-and-map-trigger",
      confidence: "high",
      note: "Both scaling value and branch trigger still need resolution before DPS promotion.",
    };
  }
  if (needsExternal) {
    return {
      kind: "decode-scaling-value",
      confidence: "high",
      note: "Scaling value is the main unresolved blocker.",
    };
  }
  return {
    kind: "review-value-candidates",
    confidence: "medium",
    note: "Review nearby formulas and numeric candidates manually.",
  };
}

function inspectConditionalDefinitionSearch(metadataValueInspection, externalTargets, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const assets = (metadataValueInspection.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) => inspectAssetConditionalDefinitionSearch(asset, externalTargets))
    .filter((asset) => asset.targets.length > 0);
  const targets = assets.flatMap((asset) => asset.targets);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      metadataValuesInspectedAt: metadataValueInspection.inspectedAt,
      externalTargetsSearchedAt: externalTargets.searchedAt,
    },
    assumptions: {
      note: "Definition search separates exact target matches from same-key analogies. Analogies can guide decoder work but are not accepted as definitions.",
    },
    summary: {
      assets: assets.length,
      targets: targets.length,
      exactDefinitionsFound: targets.filter((target) => target.definitionAssessment.kind === "exact-definition-candidate").length,
      unresolvedExactTargets: targets.filter((target) => target.definitionAssessment.kind === "exact-target-only-current-asset").length,
      analogyOnlyTargets: targets.filter((target) => target.definitionAssessment.kind === "same-key-analogy-only").length,
      recommendationCounts: sortCounts(countBy(targets, (target) => target.recommendation.kind)),
      topTargets: targets.map((target) => ({
        target: target.target,
        role: target.role,
        definitionAssessment: target.definitionAssessment,
        exactMatches: target.exactMatches.length,
        sameKeyAnalogies: target.sameKeyAnalogies.length,
        recommendation: target.recommendation,
      })),
    },
    assets,
  };
}

function inspectAssetConditionalDefinitionSearch(asset, externalTargets) {
  const unresolved = (asset.candidates ?? []).filter((candidate) =>
    candidate.recommendation?.kind === "decode-sf32-external-target" ||
    candidate.recommendation?.kind === "map-sf33-trigger-to-build-state"
  );
  const targets = unresolved.map((candidate) => inspectDefinitionTarget(asset.assetId, candidate, externalTargets));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    targets,
    recommendation: recommendDefinitionSearchAsset(targets),
  };
}

function inspectDefinitionTarget(sourceAssetId, candidate, externalTargets) {
  const target = String(candidate.value ?? "");
  const role = candidate.roleHints?.includes("boost-scaling-source")
    ? "sf32-scaling-source"
    : candidate.roleHints?.includes("branch-trigger")
      ? "sf33-trigger-source"
      : "metadata-target";
  const allMatches = (externalTargets.matches ?? []).map((match) => summarizeDefinitionMatch(match, target, sourceAssetId)).filter(Boolean);
  const exactMatches = allMatches.filter((match) => match.matchKind === "exact-full-target");
  const sameKeyAnalogies = allMatches.filter((match) => match.matchKind === "same-key-analogy");
  const targetOnlyMatches = allMatches.filter((match) => match.matchKind === "target-name-only");
  const definitionAssessment = assessDefinitionTarget(sourceAssetId, role, exactMatches, sameKeyAnalogies, targetOnlyMatches);
  return {
    target,
    role,
    sourceCandidate: {
      offset: candidate.offset,
      roleHints: candidate.roleHints,
      valueAssessment: candidate.valueAssessment,
    },
    exactMatches,
    sameKeyAnalogies,
    targetOnlyMatches,
    definitionAssessment,
    recommendation: recommendDefinitionTarget(role, definitionAssessment),
  };
}

function summarizeDefinitionMatch(match, target, sourceAssetId) {
  const hits = (match.targetHits ?? []).filter((hit) => hitMatchesDefinitionTarget(hit, target));
  const nearbyHits = (match.nearbyStrings ?? []).filter((item) => stringMatchesDefinitionTarget(item.value, target));
  if (!hits.length && !nearbyHits.length) return null;
  const matchKind = classifyDefinitionMatchKind(hits, nearbyHits, target, match.assetId, sourceAssetId);
  return {
    assetId: match.assetId,
    source: match.source,
    score: match.score,
    matchKind,
    targetHits: hits.map((hit) => ({
      offset: hit.offset,
      value: hit.value,
      target: hit.target,
      kind: hit.kind,
      sourceKey: hit.sourceKey,
      exact: Boolean(hit.exact),
    })),
    nearbyStrings: nearbyHits.map((item) => ({
      offset: item.offset,
      value: item.value,
    })),
    formulaNeighbors: (match.nearbyStrings ?? [])
      .filter((item) => /SF_|Table\(|POW\(|min\(|PowerTag\.|#/.test(String(item.value ?? "")))
      .slice(0, 12),
  };
}

function hitMatchesDefinitionTarget(hit, target) {
  const values = [hit.value, hit.target, hit.sourceKey].map((value) => String(value ?? ""));
  if (values.some((value) => value.includes(target))) return true;
  const parsed = parseHashTarget(target);
  if (parsed && values.some((value) => value.includes(parsed.key) || value.includes(parsed.target))) return true;
  return false;
}

function stringMatchesDefinitionTarget(value, target) {
  const text = String(value ?? "");
  if (text.includes(target)) return true;
  const parsed = parseHashTarget(target);
  if (parsed && (text.includes(parsed.key) || text.includes(parsed.target))) return true;
  return false;
}

function classifyDefinitionMatchKind(hits, nearbyHits, target, assetId, sourceAssetId) {
  if (hits.some((hit) => hit.exact && String(hit.value ?? "").includes(target))) return "exact-full-target";
  if (nearbyHits.some((item) => String(item.value ?? "").includes(target))) return "exact-full-target";
  const parsed = parseHashTarget(target);
  if (parsed) {
    const text = JSON.stringify([...hits, ...nearbyHits]);
    if (text.includes(parsed.key) && !text.includes(parsed.target)) return "same-key-analogy";
    if (text.includes(parsed.target) && !text.includes(parsed.key)) return "target-name-only";
  }
  if (String(assetId) === String(sourceAssetId)) return "current-asset-context";
  return "partial-target-match";
}

function parseHashTarget(value) {
  const match = /^([^#]+)#(.+)$/.exec(String(value ?? ""));
  if (!match) return null;
  return { key: match[1], target: match[2] };
}

function assessDefinitionTarget(sourceAssetId, role, exactMatches, sameKeyAnalogies, targetOnlyMatches) {
  const externalExact = exactMatches.filter((match) => String(match.assetId) !== String(sourceAssetId));
  if (externalExact.length > 0) {
    return {
      kind: "exact-definition-candidate",
      confidence: "medium",
      note: "An exact target appears outside the source asset; inspect that payload as the likely definition.",
    };
  }
  if (exactMatches.length > 0) {
    return {
      kind: "exact-target-only-current-asset",
      confidence: "high",
      note: "The exact target is currently only seen in the source asset, so the defining payload is not yet isolated.",
    };
  }
  if (sameKeyAnalogies.length > 0) {
    return {
      kind: "same-key-analogy-only",
      confidence: "medium",
      note: "Only same-key analogies were found; useful for format inference, not as this target's value.",
    };
  }
  if (targetOnlyMatches.length > 0) {
    return {
      kind: "target-name-only",
      confidence: "low",
      note: "Only target-name matches were found without the property key.",
    };
  }
  return {
    kind: "no-definition-match",
    confidence: "low",
    note: "No usable definition candidate was found in the current target search output.",
  };
}

function recommendDefinitionTarget(role, assessment) {
  if (role === "sf32-scaling-source") {
    if (assessment.kind === "exact-definition-candidate") {
      return {
        kind: "inspect-exact-sf32-definition",
        note: "Decode the exact external payload and map its value to SF_32.",
      };
    }
    return {
      kind: "expand-search-for-sf32-definition",
      note: "Increase or redirect target search for the exact bonus definition before promoting boosted DPS.",
    };
  }
  if (role === "sf33-trigger-source") {
    return {
      kind: "map-mod-trigger-from-build-state",
      note: "Resolve the mod flag through build state or upgrade metadata rather than numeric value search.",
    };
  }
  return {
    kind: "manual-definition-review",
    note: "Review this metadata target manually.",
  };
}

function recommendDefinitionSearchAsset(targets) {
  if (targets.some((target) => target.recommendation.kind === "expand-search-for-sf32-definition")) {
    return {
      kind: "expand-external-definition-search",
      confidence: "high",
      note: "The SF_32 exact definition is still not isolated in current outputs.",
    };
  }
  return {
    kind: "review-definition-candidates",
    confidence: "medium",
    note: "Review exact candidates and analogies.",
  };
}

function buildConditionalCandidateContext(structuralRelations, scenarioReport, options = {}) {
  const assetId = structuralRelations.source?.assetId ?? null;
  const sf32Relation = (structuralRelations.relations ?? []).find((relation) => relation.kind === "sf32-scaling-candidate") ?? null;
  const sf33Relation = (structuralRelations.relations ?? []).find((relation) => relation.kind === "sf33-trigger-candidate") ?? null;
  const ownerRelation = (structuralRelations.relations ?? []).find((relation) => relation.kind === "owner-candidate") ?? null;
  const candidateSf32 = extractCandidateSf32(sf32Relation, structuralRelations.summary);
  const assetScenarios = (scenarioReport.assets ?? []).find((asset) => String(asset.assetId) === String(assetId));
  const matchingScenario = findMatchingCandidateScenario(assetScenarios, candidateSf32?.scenarioValue);

  const candidate = {
    assetId,
    canonicalId: assetId != null ? `candidate:sf:${assetId}:32` : "candidate:sf:unknown:32",
    slot: assetId != null ? `sf:${assetId}:32` : null,
    role: "conditional-boost-scaling-candidate",
    target: sf32Relation?.from ?? null,
    candidateFormula: sf32Relation?.to ?? structuralRelations.summary?.candidateSf32Value ?? null,
    scenarioValue: candidateSf32?.scenarioValue ?? null,
    confidence: structuralRelations.summary?.confidence ?? "unknown",
    evidence: sf32Relation?.evidence ?? [],
    ownerCandidate: ownerRelation
      ? {
          target: ownerRelation.to,
          evidence: ownerRelation.evidence ?? [],
        }
      : null,
    triggerCandidate: sf33Relation
      ? {
          slot: assetId != null ? `sf:${assetId}:33` : null,
          target: sf33Relation.from,
          evidence: sf33Relation.evidence ?? [],
        }
      : null,
    scenarioImpact: matchingScenario
      ? {
          scenarioId: matchingScenario.id,
          inputs: matchingScenario.inputs,
          primaryDamageCoefficient: matchingScenario.primaryDamageCoefficient,
          estimatedDps: matchingScenario.estimatedDps,
          deltaVsStrictDps: matchingScenario.deltaVsStrictDps,
          deltaVsStrictPct: matchingScenario.deltaVsStrictPct,
          recommendation: matchingScenario.recommendation,
        }
      : null,
    promotionStatus: {
      kind: "blocked-for-real-dps",
      confidence: "high",
      blockers: [
        "field-level-parser-required",
        "sf33-trigger-build-state-unmapped",
        "uptime-not-proven",
      ],
      note: "This candidate may be used for explanations and what-if scenarios, but must not replace strict DPS until field ownership, trigger state, and uptime are proven.",
    },
  };

  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "conditional-candidate-context",
    source: {
      structuralRelationsExportedAt: structuralRelations.exportedAt ?? null,
      structuralRelationsSummary: structuralRelations.summary ?? null,
      scenarioBuiltAt: scenarioReport.builtAt ?? null,
      scenarioSummary: scenarioReport.summary ?? null,
    },
    summary: {
      candidates: candidate.target ? 1 : 0,
      candidatesWithScenarioImpact: candidate.scenarioImpact ? 1 : 0,
      realDpsPromotions: 0,
      recommendation: {
        kind: candidate.target ? "store-candidate-do-not-promote" : "no-candidate-found",
        confidence: candidate.target ? "high" : "medium",
        note: candidate.target
          ? "A traced SF_32 candidate exists, but strict DPS remains authoritative."
          : "No SF_32 candidate relation was found in structural evidence.",
      },
    },
    candidates: candidate.target ? [candidate] : [],
  };
}

function exportOptimizerDataset(model, candidateContext = null, options = {}) {
  const candidatesByAsset = groupBy(candidateContext?.candidates ?? [], (candidate) => String(candidate.assetId));
  const assets = (model.assets ?? []).map((asset) => exportOptimizerAsset(asset, candidatesByAsset.get(String(asset.assetId)) ?? []));
  const usableCandidates = assets.flatMap((asset) => asset.candidates);
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "optimizer-dataset-v0",
    source: {
      modelBuiltAt: model.builtAt ?? model.reviewedAt ?? null,
      modelSummary: model.summary ?? null,
      candidateContextBuiltAt: candidateContext?.builtAt ?? null,
      candidateContextSummary: candidateContext?.summary ?? null,
    },
    assumptions: {
      strictDpsIsAuthoritative: true,
      candidatesAreWhatIfOnly: true,
      note: "This dataset separates proven strict DPS from blocked conditional candidates so the UI can explain hypotheses without using them as real optimizer truth.",
    },
    summary: {
      assets: assets.length,
      assetsWithStrictDps: assets.filter((asset) => asset.strict.estimatedDps > 0).length,
      candidateCount: usableCandidates.length,
      blockedCandidates: usableCandidates.filter((candidate) => candidate.promotionStatus?.kind === "blocked-for-real-dps").length,
      realDpsPromotions: usableCandidates.filter((candidate) => candidate.promotionStatus?.kind !== "blocked-for-real-dps").length,
      topStrictAssets: assets
        .slice()
        .sort((a, b) => b.strict.estimatedDps - a.strict.estimatedDps || String(a.assetId).localeCompare(String(b.assetId)))
        .slice(0, 10)
        .map((asset) => ({
          assetId: asset.assetId,
          label: asset.label,
          estimatedDps: asset.strict.estimatedDps,
          tags: asset.tags,
        })),
      topCandidateImpacts: usableCandidates
        .filter((candidate) => candidate.scenarioImpact)
        .slice()
        .sort((a, b) => b.scenarioImpact.deltaVsStrictDps - a.scenarioImpact.deltaVsStrictDps)
        .slice(0, 10)
        .map((candidate) => ({
          assetId: candidate.assetId,
          canonicalId: candidate.canonicalId,
          target: candidate.target,
          estimatedDps: candidate.scenarioImpact.estimatedDps,
          deltaVsStrictDps: candidate.scenarioImpact.deltaVsStrictDps,
          promotionStatus: candidate.promotionStatus,
        })),
    },
    assets,
  };
}

function composeTargetBuild(targetDataset, assetIds, options = {}) {
  const mode = options.mode ?? "strict";
  const entitiesByAsset = new Map(targetDatasetEntities(targetDataset).map((entity) => [String(entity.assetId), entity]));
  const rows = assetIds.map((assetId) => composeTargetBuildRow(assetId, entitiesByAsset.get(String(assetId))));
  const totals = rows.reduce(
    (result, row) => {
      result.strict += row.strictDps;
      result.whatIf += row.candidateDps ?? row.strictDps;
      result.effective += mode === "what-if" && row.candidateDps != null ? row.candidateDps : row.strictDps;
      result.candidateDelta += row.candidateDeltaDps;
      result.blockedCandidates += row.blockedCandidates;
      return result;
    },
    { strict: 0, whatIf: 0, effective: 0, candidateDelta: 0, blockedCandidates: 0 }
  );
  const buckets = rows.reduce((result, row) => mergeTargetBucketTotals(result, row.buckets), emptyTargetBucketTotals());
  const roundedTotals = roundTargetNumericFields(totals);
  const roundedBuckets = roundTargetNumericFields(buckets);
  const coverage = {
    requestedAssets: assetIds.length,
    resolvedAssets: rows.filter((row) => row.entityId).length,
    missingAssets: rows.filter((row) => !row.entityId).length,
  };
  const blockers = rows.flatMap((row) => row.blockers);
  const roundedRows = rows.map(roundTargetBuildRow);
  const constraints = assessTargetBuildConstraints(roundedRows, options.aspectSlotReadiness ?? null);
  const bucketEngine = buildTargetBucketEngine(roundedTotals, roundedBuckets, coverage, blockers, roundedRows, constraints);

  return {
    builtAt: new Date().toISOString(),
    schemaVersion: 1,
    method: "target-bucket-composition-v1",
    mode,
    source: {
      targetDatasetExportedAt: targetDataset.exportedAt ?? null,
      targetDatasetSchemaVersion: targetDataset.schemaVersion ?? null,
    },
    assumptions: {
      strictDpsIsAuthoritative: true,
      blockedCandidatesAreWhatIfOnly: true,
      note: "First target-dataset bucket composition. It keeps strict DPS, blocked candidates, unknown values, and future Diablo IV bucket families separate.",
    },
    input: {
      assetIds,
    },
    totals: roundedTotals,
    buckets: roundedBuckets,
    bucketEngine,
    constraints,
    coverage,
    quality: targetBuildQuality(roundedTotals, coverage, roundedBuckets),
    blockers,
    rows: roundedRows,
  };
}

function buildTargetBucketEngine(totals, buckets, coverage, blockers, rows, constraints = null) {
  const blockerKinds = Array.from(new Set((blockers ?? []).map((blocker) => blocker.kind))).sort();
  const strictOnlyDps = Number(totals.strict || 0);
  const blockedCandidateDelta = Number(totals.candidateDelta || 0);
  const reliableCandidateDelta = 0;
  const readiness = assessTargetBucketReadiness(totals, buckets, coverage, blockers, rows, constraints);
  const promotionReady = blockerKinds.length === 0
    && Number(totals.blockedCandidates || 0) === 0
    && Number(coverage.missingAssets || 0) === 0
    && Number(buckets.unknown || 0) === 0
    && constraints?.valid !== false;
  const strictBuckets = {
    baseDps: Number(buckets.strictBase || 0),
    additivePct: Number(buckets.additive || 0),
    multiplicativeProduct: Number(buckets.multiplicative || 1),
    uptimeProduct: Number(buckets.uptime || 1),
    caps: Number(buckets.caps || 0),
    unknownModifiers: Number(buckets.unknown || 0),
  };
  const calculatedStrictDps = applyTargetBucketFormula(strictBuckets);
  const parityDelta = roundFloat(calculatedStrictDps - strictOnlyDps);

  return {
    version: "diablo4-bucket-engine-preview-v1",
    status: promotionReady ? "strict-ready" : "strict-only-blocked-candidates",
    promotionReady,
    strict: {
      dps: strictOnlyDps,
      calculatedDps: roundFloat(calculatedStrictDps),
      parityDelta,
      buckets: strictBuckets,
      formula: "baseDps * (1 + additivePct / 100) * multiplicativeProduct * uptimeProduct, capped later when cap semantics are proven",
    },
    whatIf: {
      dps: Number(totals.whatIf || 0),
      blockedCandidateDelta,
      reliableCandidateDelta,
      usedForReliableDps: false,
    },
    blocked: {
      candidates: Number(totals.blockedCandidates || 0),
      dps: Number(buckets.blockedCandidate || 0),
      deltaVsStrict: blockedCandidateDelta,
      blockerKinds,
    },
    readiness,
    constraints: constraints ?? null,
    coverage: {
      requestedAssets: Number(coverage.requestedAssets || 0),
      resolvedAssets: Number(coverage.resolvedAssets || 0),
      missingAssets: Number(coverage.missingAssets || 0),
      rowsWithStrictDps: (rows ?? []).filter((row) => Number(row.strictDps || 0) > 0).length,
      rowsWithBlockedCandidates: (rows ?? []).filter((row) => Number(row.blockedCandidates || 0) > 0).length,
    },
    safeguards: [
      "Le DPS strict reste la seule valeur utilisable par l'optimiseur fiable.",
      "Les candidats conditionnels ne changent pas reliableCandidateDelta tant que champ, trigger et uptime ne sont pas prouves.",
      "Un build invalide par classe, slot ou conflit ne doit pas entrer dans l'optimiseur automatique.",
      "Les caps et conflits restent descriptifs tant que leur semantique Diablo IV n'est pas mappee.",
    ],
  };
}

function assessTargetBucketReadiness(totals, buckets, coverage, blockers, rows, constraints = null) {
  const blockerKinds = Array.from(new Set((blockers ?? []).map((blocker) => blocker.kind))).sort();
  const rowsWithStrictDps = (rows ?? []).filter((row) => Number(row.strictDps || 0) > 0).length;
  const rowsWithBlockedCandidates = (rows ?? []).filter((row) => Number(row.blockedCandidates || 0) > 0).length;
  const strictBaseReady = Number(coverage.missingAssets || 0) === 0 && rowsWithStrictDps === Number(coverage.resolvedAssets || 0);
  const hasNonBaseBuckets = Number(buckets.additive || 0) !== 0
    || Number(buckets.multiplicative || 1) !== 1
    || Number(buckets.uptime || 1) !== 1
    || Number(buckets.caps || 0) !== 0;
  const families = [
    {
      family: "strict-base",
      status: strictBaseReady ? "ready" : "blocked",
      contribution: Number(buckets.strictBase || 0),
      reason: strictBaseReady
        ? "DPS strict disponible pour tous les assets resolus."
        : "Des assets manquent ou n'ont pas de DPS strict.",
    },
    {
      family: "additive",
      status: Number(buckets.additive || 0) !== 0 ? "mapped" : "empty",
      contribution: Number(buckets.additive || 0),
      reason: Number(buckets.additive || 0) !== 0
        ? "Des modifiers additifs sont deja separes."
        : "Aucun modifier additif fin n'est encore extrait; le strict reste une valeur agregee.",
    },
    {
      family: "multiplicative",
      status: Number(buckets.multiplicative || 1) !== 1 ? "mapped" : "empty",
      contribution: Number(buckets.multiplicative || 1),
      reason: Number(buckets.multiplicative || 1) !== 1
        ? "Des multiplicateurs sont deja separes."
        : "Aucun multiplicateur fin n'est encore extrait.",
    },
    {
      family: "uptime",
      status: Number(buckets.uptime || 1) !== 1 ? "mapped" : "blocked",
      contribution: Number(buckets.uptime || 1),
      reason: Number(buckets.uptime || 1) !== 1
        ? "Une uptime exploitable est mappee."
        : "Aucune uptime prouvee; les probabilites locales restent hors DPS fiable.",
    },
    {
      family: "caps",
      status: Number(buckets.caps || 0) !== 0 ? "descriptive" : "empty",
      contribution: Number(buckets.caps || 0),
      reason: Number(buckets.caps || 0) !== 0
        ? "Des caps sont detectes mais leur semantique reste descriptive."
        : "Aucun cap exploitable n'est encore mappe.",
    },
    {
      family: "blocked-candidates",
      status: rowsWithBlockedCandidates ? "blocked" : "empty",
      contribution: Number(buckets.blockedCandidate || 0),
      reason: rowsWithBlockedCandidates
        ? "Des candidats what-if existent mais restent exclus du DPS fiable."
        : "Aucun candidat bloque dans cette composition.",
    },
  ];
  const reliableOptimizerReady = strictBaseReady
    && !blockerKinds.length
    && Number(totals.blockedCandidates || 0) === 0
    && Number(buckets.unknown || 0) === 0
    && constraints?.valid !== false
    && hasNonBaseBuckets;
  return {
    version: "target-bucket-readiness-v1",
    reliableOptimizerReady,
    strictOnlyReady: strictBaseReady,
    fineBucketsReady: hasNonBaseBuckets,
    blockedCandidateCount: Number(totals.blockedCandidates || 0),
    blockerKinds,
    invalidConstraintKinds: (constraints?.issues ?? []).map((issue) => issue.kind),
    families,
    nextMilestones: [
      hasNonBaseBuckets ? null : "extraire des modifiers fins additifs/multiplicatifs/uptime au lieu du seul estimatedDps agrege",
      constraints?.valid === false ? "corriger les contraintes de build avant optimisation automatique" : null,
      blockerKinds.length ? "garder les candidats conditionnels hors DPS fiable tant que leurs preuves restent bloquees" : null,
    ].filter(Boolean),
  };
}

function assessTargetBuildConstraints(rows, aspectSlotReadiness = null) {
  const heroClasses = Array.from(new Set(
    (rows ?? [])
      .map((row) => normalizeTargetClass(row.class))
      .filter((className) => !["all", "generic", "unknown"].includes(className))
  )).sort();
  const issues = [];
  if (heroClasses.length > 1) {
    issues.push({
      kind: "mixed-hero-classes",
      priority: "high",
      classes: heroClasses,
      assetIds: rows
        .filter((row) => heroClasses.includes(normalizeTargetClass(row.class)))
        .map((row) => row.assetId),
      reason: "le build contient des entites de plusieurs classes de heros",
      action: "filtrer le build sur une seule classe avant optimisation automatique",
    });
  }
  const missingSlotAssets = (rows ?? [])
    .filter((row) => String(row.entityId ?? "").startsWith("aspect:") && (row.allowedSlots ?? []).length === 0)
    .map((row) => row.assetId);
  const slotReadinessByAsset = new Map((aspectSlotReadiness?.aspects ?? []).map((row) => [String(row.assetId), row]));
  if (missingSlotAssets.length > 0) {
    issues.push({
      kind: "slot-data-not-normalized",
      priority: "medium",
      assetIds: missingSlotAssets,
      reason: "certains aspects n'ont pas encore de slots normalises",
      action: "extraire les slots autorises avant de resoudre les conflits d'equipement",
      evidence: missingSlotAssets.map((assetId) => {
        const readiness = slotReadinessByAsset.get(String(assetId));
        return {
          assetId,
          readiness: readiness?.assessment?.kind ?? "aspect-slot-readiness-missing",
          confidence: readiness?.assessment?.confidence ?? "low",
          detectedSlotTokens: readiness?.detectedSlotTokens ?? [],
          nextAction: readiness?.assessment?.nextAction ?? "generer l'audit aspect-slot-readiness",
        };
      }),
    });
  }

  return {
    version: "target-build-constraints-v1",
    source: {
      aspectSlotReadinessGeneratedAt: aspectSlotReadiness?.generatedAt ?? null,
      aspectSlotReadinessMode: aspectSlotReadiness?.mode ?? null,
    },
    valid: issues.length === 0,
    optimizerReady: issues.length === 0,
    selectedHeroClass: heroClasses.length === 1 ? heroClasses[0] : null,
    heroClasses,
    issues,
    summary: {
      issueCount: issues.length,
      highPriorityIssues: issues.filter((issue) => issue.priority === "high").length,
    },
  };
}

function normalizeTargetClass(className) {
  return String(className ?? "unknown").trim().toLowerCase() || "unknown";
}

function applyTargetBucketFormula(buckets) {
  const baseDps = Number(buckets.baseDps || 0);
  const additive = 1 + Number(buckets.additivePct || 0) / 100;
  const multiplicative = Number(buckets.multiplicativeProduct || 1);
  const uptime = Number(buckets.uptimeProduct || 1);
  return baseDps * additive * multiplicative * uptime;
}

function composeTargetBuildRow(assetId, entity) {
  if (!entity) {
    return {
      assetId,
      entityId: null,
      class: "unknown",
      allowedSlots: [],
      strictDps: 0,
      candidateDps: null,
      candidateDeltaDps: 0,
      blockedCandidates: 0,
      buckets: emptyTargetBucketTotals(),
      blockers: [
        {
          assetId,
          kind: "missing-target-entity",
          priority: "medium",
          reason: "asset absent du dataset cible",
          action: "convertir ou extraire cet asset avant composition fiable",
        },
      ],
      modifiers: [],
    };
  }

  const modifiers = entity.modifiers ?? [];
  const strictModifiers = modifiers.filter((modifier) => targetModifierFamily(modifier) === "strict-base");
  const candidateModifiers = modifiers.filter((modifier) => targetModifierFamily(modifier) === "blocked-candidate");
  const strictDps = strictModifiers.reduce((sum, modifier) => sum + Number(modifier.value || 0), 0);
  const candidateDps = candidateModifiers.length
    ? Math.max(...candidateModifiers.map((modifier) => Number(modifier.value || 0)))
    : null;
  const buckets = bucketTotalsFromTargetModifiers(modifiers);
  const blockers = candidateModifiers.flatMap((modifier) => targetModifierBlockers(entity, modifier));

  return {
    assetId,
    entityId: entity.id,
    class: entity.class ?? "unknown",
    allowedSlots: entity.allowedSlots ?? [],
    strictDps,
    candidateDps,
    candidateDeltaDps: candidateDps == null ? 0 : candidateDps - strictDps,
    blockedCandidates: candidateModifiers.length,
    buckets,
    blockers,
    modifiers: modifiers.map((modifier) => ({
      id: modifier.id,
      stat: modifier.stat,
      operation: modifier.operation,
      bucket: modifier.bucket,
      value: modifier.value,
      family: targetModifierFamily(modifier),
      evidenceConfidence: modifier.evidence?.confidence ?? null,
    })),
  };
}

function targetDatasetEntities(targetDataset) {
  const entities = targetDataset.entities ?? {};
  return [
    ...(entities.skills ?? []),
    ...(entities.items ?? []),
    ...(entities.affixes ?? []),
    ...(entities.aspects ?? []),
    ...(entities.paragonNodes ?? []),
    ...(entities.glyphs ?? []),
    ...(entities.runes ?? []),
  ].filter((entity) => entity && entity.assetId != null);
}

function bucketTotalsFromTargetModifiers(modifiers) {
  return modifiers.reduce((totals, modifier) => {
    const value = Number(modifier.value || 0);
    const family = targetModifierFamily(modifier);
    if (family === "strict-base") totals.strictBase += value;
    else if (family === "additive") totals.additive += value;
    else if (family === "multiplicative") totals.multiplicative *= normalizeMultiplier(value);
    else if (family === "uptime") totals.uptime *= clamp01(Number(modifier.uptime ?? value));
    else if (family === "cap") totals.caps += value;
    else if (family === "blocked-candidate") totals.blockedCandidate += value;
    else totals.unknown += 1;
    return totals;
  }, emptyTargetBucketTotals());
}

function targetModifierFamily(modifier) {
  if (modifier.stat === "estimatedDps" && modifier.bucket === "strict-reviewed-dps" && modifier.operation === "add") return "strict-base";
  if (modifier.bucket === "blocked-candidate" || modifier.operation === "unknown") return "blocked-candidate";
  if (modifier.operation === "add") return "additive";
  if (modifier.operation === "multiply") return "multiplicative";
  if (modifier.operation === "proc" || modifier.uptime != null) return "uptime";
  if (modifier.operation === "cap") return "cap";
  return "unknown";
}

function emptyTargetBucketTotals() {
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

function mergeTargetBucketTotals(totals, buckets = emptyTargetBucketTotals()) {
  totals.strictBase += Number(buckets.strictBase || 0);
  totals.additive += Number(buckets.additive || 0);
  totals.multiplicative *= Number(buckets.multiplicative || 1);
  totals.uptime *= Number(buckets.uptime || 1);
  totals.caps += Number(buckets.caps || 0);
  totals.blockedCandidate += Number(buckets.blockedCandidate || 0);
  totals.unknown += Number(buckets.unknown || 0);
  return totals;
}

function roundTargetNumericFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, Number.isFinite(Number(value)) ? roundFloat(Number(value)) : value])
  );
}

function roundTargetBuildRow(row) {
  return {
    ...row,
    strictDps: roundFloat(Number(row.strictDps || 0)),
    candidateDps: row.candidateDps == null ? null : roundFloat(Number(row.candidateDps)),
    candidateDeltaDps: roundFloat(Number(row.candidateDeltaDps || 0)),
    buckets: roundTargetNumericFields(row.buckets ?? emptyTargetBucketTotals()),
    modifiers: (row.modifiers ?? []).map((modifier) => ({
      ...modifier,
      value: Number.isFinite(Number(modifier.value)) ? roundFloat(Number(modifier.value)) : modifier.value,
    })),
  };
}

function targetModifierBlockers(entity, modifier) {
  const notes = modifier.evidence?.notes ?? [];
  const blockers = notes
    .map((note) => /^blocked:\s*(.+)$/i.exec(note)?.[1])
    .filter(Boolean);
  return (blockers.length ? blockers : ["blocked-candidate-unresolved"]).map((blocker) => ({
    assetId: entity.assetId,
    entityId: entity.id,
    modifierId: modifier.id,
    kind: blocker,
    priority: targetBlockerPriority(blocker),
    reason: targetBlockerReason(blocker),
    action: targetBlockerAction(blocker),
  }));
}

function targetBlockerPriority(blocker) {
  if (blocker === "field-level-parser-required") return "high";
  if (blocker === "sf33-trigger-build-state-unmapped") return "high";
  if (blocker === "uptime-not-proven") return "high";
  return "medium";
}

function targetBlockerReason(blocker) {
  const labels = {
    "field-level-parser-required": "champ exact du bonus non parse",
    "sf33-trigger-build-state-unmapped": "trigger SF_33 non relie a l'etat de build",
    "uptime-not-proven": "uptime non prouve",
  };
  return labels[blocker] ?? blocker;
}

function targetBlockerAction(blocker) {
  const actions = {
    "field-level-parser-required": "parser le champ local qui porte la valeur candidate",
    "sf33-trigger-build-state-unmapped": "mapper SF_33 vers une condition ou un toggle de build",
    "uptime-not-proven": "extraire ou configurer l'uptime avant promotion DPS",
  };
  return actions[blocker] ?? "inspecter ce blocage avant promotion";
}

function targetBuildQuality(totals, coverage, buckets) {
  const reasons = [];
  const nextActions = [];
  let score = 100;
  if (coverage.missingAssets > 0) {
    score -= 25;
    reasons.push("certains assets sont absents du dataset cible");
    nextActions.push("convertir les assets manquants vers le schema cible");
  }
  if (totals.blockedCandidates > 0) {
    score -= 30;
    reasons.push("des candidats conditionnels restent bloques");
    nextActions.push("prouver le champ exact, le trigger et l'uptime des candidats");
  }
  if (buckets.unknown > 0) {
    score -= 20;
    reasons.push("des modifiers restent non classes");
    nextActions.push("mapper les modifiers inconnus vers une famille de calcul");
  }
  if (buckets.additive === 0 && buckets.multiplicative === 1 && buckets.uptime === 1) {
    score -= 10;
    reasons.push("les familles additif, multiplicatif et uptime ne sont pas encore alimentees");
    nextActions.push("extraire des modifiers plus fins que estimatedDps");
  }
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = clampedScore >= 80 && totals.blockedCandidates === 0 && coverage.missingAssets === 0
    ? "fiable"
    : clampedScore >= 50
      ? "partiel"
      : "bloque";
  return {
    level,
    score: clampedScore,
    reasons: reasons.length ? reasons : ["composition cible couverte sans blocage connu"],
    nextActions: nextActions.length ? nextActions : ["continuer le mapping detaille des buckets Diablo IV"],
  };
}

function auditTargetBlockers(composition, evidence = {}) {
  const rowsByAsset = new Map((composition.rows ?? []).map((row) => [String(row.assetId), row]));
  const candidateByAsset = new Map((evidence.candidateContext?.candidates ?? []).map((candidate) => [String(candidate.assetId), candidate]));
  const sfSourceByAsset = new Map((evidence.sfSources?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const definitionByAsset = new Map((evidence.definitionSearch?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const blockerGroups = groupBy(composition.blockers ?? [], (blocker) => String(blocker.assetId));
  const assets = Array.from(blockerGroups.entries()).map(([assetId, blockers]) => {
    const candidate = candidateByAsset.get(assetId) ?? null;
    const sfSource = sfSourceByAsset.get(assetId) ?? null;
    const definition = definitionByAsset.get(assetId) ?? null;
    const row = rowsByAsset.get(assetId) ?? null;
    const uniqueBlockers = dedupeBy(blockers, (blocker) => blocker.kind);
    return {
      assetId: Number(assetId),
      entityId: row?.entityId ?? null,
      class: row?.class ?? "unknown",
      strictDps: row?.strictDps ?? 0,
      candidateDps: row?.candidateDps ?? null,
      candidateDeltaDps: row?.candidateDeltaDps ?? 0,
      blockers: uniqueBlockers.map((blocker) => auditTargetBlocker(blocker, { candidate, sfSource, definition, fieldRecords: evidence.fieldRecords, recordSegments: evidence.recordSegments, recordHeaders: evidence.recordHeaders, recordHeaderPatterns: evidence.recordHeaderPatterns, recordHeaderPatternReport: evidence.recordHeaderPatternReport, normalizedHeaderLayouts: evidence.normalizedHeaderLayouts, formulaHashLayoutFocus: evidence.formulaHashLayoutFocus, formulaHashFieldBoundaries: evidence.formulaHashFieldBoundaries, formulaHashHeaderPreludes: evidence.formulaHashHeaderPreludes, hashSuffixDefinitionLinks: evidence.hashSuffixDefinitionLinks, hashSuffixValuePatterns: evidence.hashSuffixValuePatterns, hashSuffixCandidateSemantics: evidence.hashSuffixCandidateSemantics, hashSuffixDictionaryMining: evidence.hashSuffixDictionaryMining, hashSuffixFamilyEvidence: evidence.hashSuffixFamilyEvidence, hashSuffixSourceNameAudit: evidence.hashSuffixSourceNameAudit, hashSuffixBinarySourceAudit: evidence.hashSuffixBinarySourceAudit, hashSuffixBinaryContextComparison: evidence.hashSuffixBinaryContextComparison, hashSuffixSublayoutClassification: evidence.hashSuffixSublayoutClassification, hashSuffixSublayoutFields: evidence.hashSuffixSublayoutFields, hashSuffixFieldShapeDecoders: evidence.hashSuffixFieldShapeDecoders, hashSuffixDecodedOffsetLinks: evidence.hashSuffixDecodedOffsetLinks, hashSuffixOffsetRecordInspection: evidence.hashSuffixOffsetRecordInspection, hashSuffixRecordBoundaryComparison: evidence.hashSuffixRecordBoundaryComparison, hashSuffixBoundaryPreludes: evidence.hashSuffixBoundaryPreludes, hashSuffixPreludeHeaderComparison: evidence.hashSuffixPreludeHeaderComparison, hashSuffixHeaderShapeComparison: evidence.hashSuffixHeaderShapeComparison, hashSuffixCompactPatternSearch: evidence.hashSuffixCompactPatternSearch, hashSuffixNamedTableAudit: evidence.hashSuffixNamedTableAudit, recordHeaderSourceFreshnessAudit: evidence.recordHeaderSourceFreshnessAudit, bonusPercentSelectorMatrix: evidence.bonusPercentSelectorMatrix, selector949PeerAudit: evidence.selector949PeerAudit, selector949CompactCorpus: evidence.selector949CompactCorpus, decodedDictionaryStringScan: evidence.decodedDictionaryStringScan, unanchoredBonusPercentAudit: evidence.unanchoredBonusPercentAudit, metadata12337ContextAudit: evidence.metadata12337ContextAudit, metadata12337ScaleCorpus: evidence.metadata12337ScaleCorpus, selectorAssetPairCorpus: evidence.selectorAssetPairCorpus, selectorAssetLayoutParser: evidence.selectorAssetLayoutParser, selectorAssetOwnerFields: evidence.selectorAssetOwnerFields, bonusPercentCoverageAudit: evidence.bonusPercentCoverageAudit, localTableSourceAlternatives: evidence.localTableSourceAlternatives, sf32FieldPromotionDecision: evidence.sf32FieldPromotionDecision, sf33BuildStateTriggerAudit: evidence.sf33BuildStateTriggerAudit, sf33ActivationSourceCorpus: evidence.sf33ActivationSourceCorpus, sf33ActivationSourceSearchAudit: evidence.sf33ActivationSourceSearchAudit, sf33BuildStateNeighborhoodAudit: evidence.sf33BuildStateNeighborhoodAudit, sf33OffsetTableEntriesAudit: evidence.sf33OffsetTableEntriesAudit, sf33OffsetTableParentRunAudit: evidence.sf33OffsetTableParentRunAudit, sf33ParentRunSemanticsAudit: evidence.sf33ParentRunSemanticsAudit, sf33NamedBuildStateSourceAudit: evidence.sf33NamedBuildStateSourceAudit, sf33BinaryParentSourceAudit: evidence.sf33BinaryParentSourceAudit, uptimeProofAudit: evidence.uptimeProofAudit, sf28Sf29RoleAudit: evidence.sf28Sf29RoleAudit, uptimeNeighborDependencyAudit: evidence.uptimeNeighborDependencyAudit })),
      evidenceSummary: summarizeTargetBlockerEvidence({ candidate, sfSource, definition, fieldRecords: evidence.fieldRecords, recordSegments: evidence.recordSegments, recordHeaders: evidence.recordHeaders, recordHeaderPatterns: evidence.recordHeaderPatterns, recordHeaderPatternReport: evidence.recordHeaderPatternReport, normalizedHeaderLayouts: evidence.normalizedHeaderLayouts, formulaHashLayoutFocus: evidence.formulaHashLayoutFocus, formulaHashFieldBoundaries: evidence.formulaHashFieldBoundaries, formulaHashHeaderPreludes: evidence.formulaHashHeaderPreludes, hashSuffixDefinitionLinks: evidence.hashSuffixDefinitionLinks, hashSuffixValuePatterns: evidence.hashSuffixValuePatterns, hashSuffixCandidateSemantics: evidence.hashSuffixCandidateSemantics, hashSuffixDictionaryMining: evidence.hashSuffixDictionaryMining, hashSuffixFamilyEvidence: evidence.hashSuffixFamilyEvidence, hashSuffixSourceNameAudit: evidence.hashSuffixSourceNameAudit, hashSuffixBinarySourceAudit: evidence.hashSuffixBinarySourceAudit, hashSuffixBinaryContextComparison: evidence.hashSuffixBinaryContextComparison, hashSuffixSublayoutClassification: evidence.hashSuffixSublayoutClassification, hashSuffixSublayoutFields: evidence.hashSuffixSublayoutFields, hashSuffixFieldShapeDecoders: evidence.hashSuffixFieldShapeDecoders, hashSuffixDecodedOffsetLinks: evidence.hashSuffixDecodedOffsetLinks, hashSuffixOffsetRecordInspection: evidence.hashSuffixOffsetRecordInspection, hashSuffixRecordBoundaryComparison: evidence.hashSuffixRecordBoundaryComparison, hashSuffixBoundaryPreludes: evidence.hashSuffixBoundaryPreludes, hashSuffixPreludeHeaderComparison: evidence.hashSuffixPreludeHeaderComparison, hashSuffixHeaderShapeComparison: evidence.hashSuffixHeaderShapeComparison, hashSuffixCompactPatternSearch: evidence.hashSuffixCompactPatternSearch, hashSuffixNamedTableAudit: evidence.hashSuffixNamedTableAudit, recordHeaderSourceFreshnessAudit: evidence.recordHeaderSourceFreshnessAudit, bonusPercentSelectorMatrix: evidence.bonusPercentSelectorMatrix, selector949PeerAudit: evidence.selector949PeerAudit, selector949CompactCorpus: evidence.selector949CompactCorpus, decodedDictionaryStringScan: evidence.decodedDictionaryStringScan, unanchoredBonusPercentAudit: evidence.unanchoredBonusPercentAudit, metadata12337ContextAudit: evidence.metadata12337ContextAudit, metadata12337ScaleCorpus: evidence.metadata12337ScaleCorpus, selectorAssetPairCorpus: evidence.selectorAssetPairCorpus, selectorAssetLayoutParser: evidence.selectorAssetLayoutParser, selectorAssetOwnerFields: evidence.selectorAssetOwnerFields, bonusPercentCoverageAudit: evidence.bonusPercentCoverageAudit, localTableSourceAlternatives: evidence.localTableSourceAlternatives, sf32FieldPromotionDecision: evidence.sf32FieldPromotionDecision, sf33BuildStateTriggerAudit: evidence.sf33BuildStateTriggerAudit, sf33ActivationSourceCorpus: evidence.sf33ActivationSourceCorpus, sf33ActivationSourceSearchAudit: evidence.sf33ActivationSourceSearchAudit, sf33BuildStateNeighborhoodAudit: evidence.sf33BuildStateNeighborhoodAudit, sf33OffsetTableEntriesAudit: evidence.sf33OffsetTableEntriesAudit, sf33OffsetTableParentRunAudit: evidence.sf33OffsetTableParentRunAudit, sf33ParentRunSemanticsAudit: evidence.sf33ParentRunSemanticsAudit, sf33NamedBuildStateSourceAudit: evidence.sf33NamedBuildStateSourceAudit, sf33BinaryParentSourceAudit: evidence.sf33BinaryParentSourceAudit, uptimeProofAudit: evidence.uptimeProofAudit, sf28Sf29RoleAudit: evidence.sf28Sf29RoleAudit, uptimeNeighborDependencyAudit: evidence.uptimeNeighborDependencyAudit }),
      promotionDecision: {
        kind: "keep-blocked",
        confidence: "high",
        note: "Le candidat reste utilisable en what-if seulement. Le DPS strict reste l'autorite tant que tous les blocages ne sont pas resolus.",
      },
    };
  });

  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "target-blocker-resolution-v1",
    source: {
      compositionBuiltAt: composition.builtAt ?? null,
      compositionMethod: composition.method ?? null,
      candidateContextBuiltAt: evidence.candidateContext?.builtAt ?? null,
      sfSourcesInspectedAt: evidence.sfSources?.inspectedAt ?? null,
      definitionSearchInspectedAt: evidence.definitionSearch?.inspectedAt ?? null,
    },
    summary: {
      assets: assets.length,
      blockers: assets.reduce((sum, asset) => sum + asset.blockers.length, 0),
      resolved: assets.reduce((sum, asset) => sum + asset.blockers.filter((blocker) => blocker.status === "resolved").length, 0),
      blocked: assets.reduce((sum, asset) => sum + asset.blockers.filter((blocker) => blocker.status !== "resolved").length, 0),
      promotionReady: false,
      nextActions: dedupeBy(assets.flatMap((asset) => asset.blockers.map((blocker) => blocker.nextAction)), (action) => action),
    },
    assets,
  };
}

function auditTargetBlocker(blocker, evidence) {
  if (blocker.kind === "field-level-parser-required") {
    const candidate = evidence.candidate;
    const fieldAssessment = evidence.fieldRecords?.assessment ?? null;
    const segmentAssessment = evidence.recordSegments?.summary?.clusterAssessment ?? null;
    const headerAssessment = evidence.recordHeaders?.summary?.assessment ?? null;
    const patternAssessment = evidence.recordHeaderPatterns?.summary?.assessment ?? null;
    const crossPatternAssessment = evidence.recordHeaderPatternReport?.summary?.assessment ?? null;
    const normalizedAssessment = evidence.normalizedHeaderLayouts?.summary?.assessment ?? null;
    const formulaHashFocusAssessment = evidence.formulaHashLayoutFocus?.summary?.assessment ?? null;
    const formulaHashBoundaryAssessment = evidence.formulaHashFieldBoundaries?.summary?.assessment ?? null;
    const formulaHashPreludeAssessment = evidence.formulaHashHeaderPreludes?.summary?.assessment ?? null;
    const hashSuffixDefinitionAssessment = evidence.hashSuffixDefinitionLinks?.summary?.assessment ?? null;
    const hashSuffixValuePatternAssessment = evidence.hashSuffixValuePatterns?.summary?.assessment ?? null;
    const hashSuffixCandidateSemanticAssessment = evidence.hashSuffixCandidateSemantics?.summary?.assessment ?? null;
    const hashSuffixDictionaryMiningAssessment = evidence.hashSuffixDictionaryMining?.summary?.assessment ?? null;
    const hashSuffixFamilyEvidenceAssessment = evidence.hashSuffixFamilyEvidence?.summary?.assessment ?? null;
    const hashSuffixSourceNameAssessment = evidence.hashSuffixSourceNameAudit?.summary?.assessment ?? null;
    const hashSuffixBinarySourceAssessment = evidence.hashSuffixBinarySourceAudit?.summary?.assessment ?? null;
    const hashSuffixBinaryContextAssessment = evidence.hashSuffixBinaryContextComparison?.summary?.assessment ?? null;
    const hashSuffixSublayoutAssessment = evidence.hashSuffixSublayoutClassification?.summary?.assessment ?? null;
    const hashSuffixSublayoutFieldAssessment = evidence.hashSuffixSublayoutFields?.summary?.assessment ?? null;
    const hashSuffixFieldShapeDecoderAssessment = evidence.hashSuffixFieldShapeDecoders?.summary?.assessment ?? null;
    const hashSuffixDecodedOffsetLinkAssessment = evidence.hashSuffixDecodedOffsetLinks?.summary?.assessment ?? null;
    const hashSuffixOffsetRecordAssessment = evidence.hashSuffixOffsetRecordInspection?.summary?.assessment ?? null;
    const hashSuffixRecordBoundaryAssessment = evidence.hashSuffixRecordBoundaryComparison?.summary?.assessment ?? null;
    const hashSuffixBoundaryPreludeAssessment = evidence.hashSuffixBoundaryPreludes?.summary?.assessment ?? null;
    const hashSuffixPreludeHeaderAssessment = evidence.hashSuffixPreludeHeaderComparison?.summary?.assessment ?? null;
    const hashSuffixHeaderShapeAssessment = evidence.hashSuffixHeaderShapeComparison?.summary?.assessment ?? null;
    const hashSuffixCompactPatternAssessment = evidence.hashSuffixCompactPatternSearch?.summary?.assessment ?? null;
    const hashSuffixNamedTableAssessment = evidence.hashSuffixNamedTableAudit?.summary?.assessment ?? null;
    const recordHeaderSourceFreshnessAssessment = evidence.recordHeaderSourceFreshnessAudit?.summary ?? null;
    const bonusPercentSelectorMatrixAssessment = evidence.bonusPercentSelectorMatrix?.summary?.assessment ?? null;
    const selector949PeerAssessment = evidence.selector949PeerAudit?.summary?.assessment ?? null;
    const selector949CompactCorpusAssessment = evidence.selector949CompactCorpus?.summary?.assessment ?? null;
    const decodedDictionaryStringAssessment = evidence.decodedDictionaryStringScan?.summary?.assessment ?? null;
    const unanchoredBonusPercentAssessment = evidence.unanchoredBonusPercentAudit?.summary?.assessment ?? null;
    const metadata12337ContextAssessment = evidence.metadata12337ContextAudit?.summary?.assessment ?? null;
    const metadata12337ScaleCorpusAssessment = evidence.metadata12337ScaleCorpus?.summary?.assessment ?? null;
    const selectorAssetPairAssessment = evidence.selectorAssetPairCorpus?.summary?.assessment ?? null;
    const selectorAssetLayoutAssessment = evidence.selectorAssetLayoutParser?.summary?.assessment ?? null;
    const selectorAssetOwnerFieldAssessment = evidence.selectorAssetOwnerFields?.summary?.assessment ?? null;
    const bonusPercentCoverageAssessment = evidence.bonusPercentCoverageAudit?.summary?.assessment ?? null;
    const localTableSourceAssessment = evidence.localTableSourceAlternatives?.summary?.assessment ?? null;
    const sf32FieldDecisionAssessment = evidence.sf32FieldPromotionDecision?.summary?.assessment ?? null;
    const preferredFormulaHashAction = formulaHashBoundaryAssessment?.kind === "formula-bytecode-and-hash-asset-zones-linked"
      ? sf32FieldDecisionAssessment?.nextAction ?? localTableSourceAssessment?.nextAction ?? bonusPercentCoverageAssessment?.nextAction ?? selectorAssetOwnerFieldAssessment?.nextAction ?? selectorAssetLayoutAssessment?.nextAction ?? selectorAssetPairAssessment?.nextAction ?? metadata12337ScaleCorpusAssessment?.nextAction ?? metadata12337ContextAssessment?.nextAction ?? unanchoredBonusPercentAssessment?.nextAction ?? decodedDictionaryStringAssessment?.nextAction ?? selector949CompactCorpusAssessment?.nextAction ?? selector949PeerAssessment?.nextAction ?? bonusPercentSelectorMatrixAssessment?.nextAction ?? hashSuffixNamedTableAssessment?.nextAction ?? hashSuffixCompactPatternAssessment?.nextAction ?? hashSuffixHeaderShapeAssessment?.nextAction ?? recordHeaderSourceFreshnessAssessment?.nextAction ?? hashSuffixPreludeHeaderAssessment?.nextAction ?? hashSuffixBoundaryPreludeAssessment?.nextAction ?? hashSuffixRecordBoundaryAssessment?.nextAction ?? hashSuffixOffsetRecordAssessment?.nextAction ?? hashSuffixDecodedOffsetLinkAssessment?.nextAction ?? hashSuffixFieldShapeDecoderAssessment?.nextAction ?? hashSuffixSublayoutFieldAssessment?.nextAction ?? hashSuffixSublayoutAssessment?.nextAction ?? hashSuffixBinaryContextAssessment?.nextAction ?? hashSuffixBinarySourceAssessment?.nextAction ?? hashSuffixSourceNameAssessment?.nextAction ?? hashSuffixFamilyEvidenceAssessment?.nextAction ?? hashSuffixDictionaryMiningAssessment?.nextAction ?? hashSuffixCandidateSemanticAssessment?.nextAction ?? hashSuffixValuePatternAssessment?.nextAction ?? hashSuffixDefinitionAssessment?.nextAction ?? formulaHashBoundaryAssessment?.nextAction
      : formulaHashPreludeAssessment?.nextAction ?? formulaHashBoundaryAssessment?.nextAction;
    return {
      kind: blocker.kind,
      priority: blocker.priority,
      status: "blocked",
      finding: sf32FieldDecisionAssessment?.finding ?? fieldAssessment?.finding ?? (candidate?.candidateFormula
        ? `Formule candidate tracee: ${candidate.candidateFormula}.`
        : "Formule candidate non retrouvee dans le contexte charge."),
      proofState: sf32FieldDecisionAssessment
        ? `${sf32FieldDecisionAssessment.kind}: blockers ${(sf32FieldDecisionAssessment.evidence?.blockers ?? []).length}, layouts949 ${sf32FieldDecisionAssessment.evidence?.selector949Layouts ?? 0}, second compact ${sf32FieldDecisionAssessment.evidence?.secondCompact949Assets ?? 0}, table locale ${sf32FieldDecisionAssessment.evidence?.independentTableCandidates ?? 0}`
        : fieldAssessment
        ? `${fieldAssessment.fieldOwnership}: ${fieldAssessment.confidence}${segmentAssessment ? `; ${segmentAssessment.kind}: ${segmentAssessment.confidence}` : ""}${headerAssessment ? `; ${headerAssessment.kind}: ${headerAssessment.confidence}, ownership ${headerAssessment.fieldOwnership}` : ""}${patternAssessment ? `; ${patternAssessment.kind}: ${patternAssessment.confidence}, ownership ${patternAssessment.fieldOwnership}` : ""}${crossPatternAssessment ? `; ${crossPatternAssessment.kind}: ${crossPatternAssessment.confidence}, repeated ${crossPatternAssessment.evidence?.repeatedSignatures ?? 0}` : ""}${normalizedAssessment ? `; ${normalizedAssessment.kind}: ${normalizedAssessment.confidence}, ownership ${normalizedAssessment.fieldOwnership}` : ""}${formulaHashFocusAssessment ? `; ${formulaHashFocusAssessment.kind}: ${formulaHashFocusAssessment.confidence}, ownership ${formulaHashFocusAssessment.fieldOwnership}` : ""}${formulaHashBoundaryAssessment ? `; ${formulaHashBoundaryAssessment.kind}: ${formulaHashBoundaryAssessment.confidence}, ownership ${formulaHashBoundaryAssessment.fieldOwnership}` : ""}${formulaHashPreludeAssessment ? `; ${formulaHashPreludeAssessment.kind}: ${formulaHashPreludeAssessment.confidence}, ownership ${formulaHashPreludeAssessment.fieldOwnership}` : ""}${hashSuffixDefinitionAssessment ? `; ${hashSuffixDefinitionAssessment.kind}: ${hashSuffixDefinitionAssessment.confidence}, ownership ${hashSuffixDefinitionAssessment.fieldOwnership}` : ""}${hashSuffixValuePatternAssessment ? `; ${hashSuffixValuePatternAssessment.kind}: ${hashSuffixValuePatternAssessment.confidence}, ownership ${hashSuffixValuePatternAssessment.fieldOwnership}` : ""}${hashSuffixCandidateSemanticAssessment ? `; ${hashSuffixCandidateSemanticAssessment.kind}: ${hashSuffixCandidateSemanticAssessment.confidence}, ownership ${hashSuffixCandidateSemanticAssessment.fieldOwnership}` : ""}${hashSuffixDictionaryMiningAssessment ? `; ${hashSuffixDictionaryMiningAssessment.kind}: ${hashSuffixDictionaryMiningAssessment.confidence}, ownership ${hashSuffixDictionaryMiningAssessment.fieldOwnership}` : ""}${hashSuffixFamilyEvidenceAssessment ? `; ${hashSuffixFamilyEvidenceAssessment.kind}: ${hashSuffixFamilyEvidenceAssessment.confidence}, ownership ${hashSuffixFamilyEvidenceAssessment.fieldOwnership}` : ""}${hashSuffixSourceNameAssessment ? `; ${hashSuffixSourceNameAssessment.kind}: ${hashSuffixSourceNameAssessment.confidence}, ownership ${hashSuffixSourceNameAssessment.fieldOwnership}` : ""}${hashSuffixBinarySourceAssessment ? `; ${hashSuffixBinarySourceAssessment.kind}: ${hashSuffixBinarySourceAssessment.confidence}, ownership ${hashSuffixBinarySourceAssessment.fieldOwnership}` : ""}${hashSuffixBinaryContextAssessment ? `; ${hashSuffixBinaryContextAssessment.kind}: ${hashSuffixBinaryContextAssessment.confidence}, ownership ${hashSuffixBinaryContextAssessment.fieldOwnership}` : ""}${hashSuffixSublayoutAssessment ? `; ${hashSuffixSublayoutAssessment.kind}: ${hashSuffixSublayoutAssessment.confidence}, ownership ${hashSuffixSublayoutAssessment.fieldOwnership}` : ""}${hashSuffixSublayoutFieldAssessment ? `; ${hashSuffixSublayoutFieldAssessment.kind}: ${hashSuffixSublayoutFieldAssessment.confidence}, ownership ${hashSuffixSublayoutFieldAssessment.fieldOwnership}` : ""}${hashSuffixFieldShapeDecoderAssessment ? `; ${hashSuffixFieldShapeDecoderAssessment.kind}: ${hashSuffixFieldShapeDecoderAssessment.confidence}, ownership ${hashSuffixFieldShapeDecoderAssessment.fieldOwnership}` : ""}${hashSuffixDecodedOffsetLinkAssessment ? `; ${hashSuffixDecodedOffsetLinkAssessment.kind}: ${hashSuffixDecodedOffsetLinkAssessment.confidence}, ownership ${hashSuffixDecodedOffsetLinkAssessment.fieldOwnership}` : ""}${hashSuffixOffsetRecordAssessment ? `; ${hashSuffixOffsetRecordAssessment.kind}: ${hashSuffixOffsetRecordAssessment.confidence}, ownership ${hashSuffixOffsetRecordAssessment.fieldOwnership}` : ""}${hashSuffixRecordBoundaryAssessment ? `; ${hashSuffixRecordBoundaryAssessment.kind}: ${hashSuffixRecordBoundaryAssessment.confidence}, ownership ${hashSuffixRecordBoundaryAssessment.fieldOwnership}` : ""}${hashSuffixBoundaryPreludeAssessment ? `; ${hashSuffixBoundaryPreludeAssessment.kind}: ${hashSuffixBoundaryPreludeAssessment.confidence}, ownership ${hashSuffixBoundaryPreludeAssessment.fieldOwnership}` : ""}${hashSuffixPreludeHeaderAssessment ? `; ${hashSuffixPreludeHeaderAssessment.kind}: ${hashSuffixPreludeHeaderAssessment.confidence}, ownership ${hashSuffixPreludeHeaderAssessment.fieldOwnership}` : ""}${hashSuffixHeaderShapeAssessment ? `; ${hashSuffixHeaderShapeAssessment.kind}: ${hashSuffixHeaderShapeAssessment.confidence}, ownership ${hashSuffixHeaderShapeAssessment.fieldOwnership}` : ""}${hashSuffixCompactPatternAssessment ? `; ${hashSuffixCompactPatternAssessment.kind}: ${hashSuffixCompactPatternAssessment.confidence}, ownership ${hashSuffixCompactPatternAssessment.fieldOwnership}` : ""}${hashSuffixNamedTableAssessment ? `; ${hashSuffixNamedTableAssessment.kind}: ${hashSuffixNamedTableAssessment.confidence}, ownership ${hashSuffixNamedTableAssessment.fieldOwnership}` : ""}${bonusPercentSelectorMatrixAssessment ? `; ${bonusPercentSelectorMatrixAssessment.kind}: ${bonusPercentSelectorMatrixAssessment.confidence}, selector949 ${(bonusPercentSelectorMatrixAssessment.evidence?.selector949Assets ?? []).length}, selector994 ${(bonusPercentSelectorMatrixAssessment.evidence?.selector994Assets ?? []).length}` : ""}${selector949PeerAssessment ? `; ${selector949PeerAssessment.kind}: ${selector949PeerAssessment.confidence}, compact ${(selector949PeerAssessment.evidence?.compactCandidates ?? []).length}/${selector949PeerAssessment.evidence?.peers ?? 0}` : ""}${selector949CompactCorpusAssessment ? `; ${selector949CompactCorpusAssessment.kind}: ${selector949CompactCorpusAssessment.confidence}, compact ${(evidence.selector949CompactCorpus?.summary?.compactOccurrences ?? 0)}/${(evidence.selector949CompactCorpus?.summary?.selector949Occurrences ?? 0)}` : ""}${decodedDictionaryStringAssessment ? `; ${decodedDictionaryStringAssessment.kind}: ${decodedDictionaryStringAssessment.confidence}, dictNear ${(evidence.decodedDictionaryStringScan?.summary?.dictionaryHitsNearWatchedNumbers ?? 0)}` : ""}${unanchoredBonusPercentAssessment ? `; ${unanchoredBonusPercentAssessment.kind}: ${unanchoredBonusPercentAssessment.confidence}, useful ${(evidence.unanchoredBonusPercentAudit?.summary?.usefulAnchorCandidates ?? 0)}/${(evidence.unanchoredBonusPercentAudit?.summary?.rows ?? 0)}` : ""}${metadata12337ContextAssessment ? `; ${metadata12337ContextAssessment.kind}: ${metadata12337ContextAssessment.confidence}, selectors ${(evidence.metadata12337ContextAudit?.summary?.selectors ?? []).join("/")}` : ""}${metadata12337ScaleCorpusAssessment ? `; ${metadata12337ScaleCorpusAssessment.kind}: ${metadata12337ScaleCorpusAssessment.confidence}, hits ${(evidence.metadata12337ScaleCorpus?.summary?.hits ?? 0)}` : ""}${selectorAssetPairAssessment ? `; ${selectorAssetPairAssessment.kind}: ${selectorAssetPairAssessment.confidence}, groups ${(evidence.selectorAssetPairCorpus?.summary?.groups ?? 0)}` : ""}${recordHeaderSourceFreshnessAssessment ? `; ${recordHeaderSourceFreshnessAssessment.assessment}: stale ${recordHeaderSourceFreshnessAssessment.staleOffsets ?? 0}, fresh ${recordHeaderSourceFreshnessAssessment.freshMatches ?? 0}` : ""}`
        : candidate?.confidence
          ? `preuve ${candidate.confidence}, mais ownership champ par champ encore non prouve`
          : "preuve insuffisante",
      nextAction: preferredFormulaHashAction ?? formulaHashFocusAssessment?.nextAction ?? normalizedAssessment?.nextAction ?? crossPatternAssessment?.nextAction ?? patternAssessment?.nextAction ?? headerAssessment?.nextAction ?? fieldAssessment?.nextAction ?? "ajouter un parser champ par champ autour du record cible pour prouver l'ownership de SF_32",
    };
  }
  if (blocker.kind === "sf33-trigger-build-state-unmapped") {
    const trigger = evidence.candidate?.triggerCandidate ?? null;
    const definitionTarget = findDefinitionTarget(evidence.definition, "sf33-trigger-source");
    const sf33Assessment = evidence.sf33BuildStateTriggerAudit?.summary?.assessment ?? null;
    const binaryParentAssessment = evidence.sf33BinaryParentSourceAudit?.summary?.assessment ?? null;
    const binaryParentSummary = evidence.sf33BinaryParentSourceAudit?.summary ?? null;
    const namedSourceAssessment = evidence.sf33NamedBuildStateSourceAudit?.summary?.assessment ?? null;
    const parentRunSemanticsAssessment = evidence.sf33ParentRunSemanticsAudit?.summary?.assessment ?? null;
    const namedSourceSummary = evidence.sf33NamedBuildStateSourceAudit?.summary ?? null;
    const parentRunAssessment = evidence.sf33OffsetTableParentRunAudit?.summary?.assessment ?? null;
    const parentRunSemanticsSummary = evidence.sf33ParentRunSemanticsAudit?.summary ?? null;
    const offsetTableAssessment = evidence.sf33OffsetTableEntriesAudit?.summary?.assessment ?? null;
    const parentRunSummary = evidence.sf33OffsetTableParentRunAudit?.summary ?? null;
    const neighborhoodAssessment = evidence.sf33BuildStateNeighborhoodAudit?.summary?.assessment ?? null;
    const offsetTableSummary = evidence.sf33OffsetTableEntriesAudit?.summary ?? null;
    const activationAssessment = binaryParentAssessment ?? namedSourceAssessment ?? parentRunSemanticsAssessment ?? parentRunAssessment ?? offsetTableAssessment ?? neighborhoodAssessment ?? evidence.sf33ActivationSourceSearchAudit?.summary?.assessment ?? evidence.sf33ActivationSourceCorpus?.summary?.assessment ?? null;
    const neighborhoodSummary = evidence.sf33BuildStateNeighborhoodAudit?.summary ?? null;
    const activationSearchSummary = evidence.sf33ActivationSourceSearchAudit?.summary ?? null;
    const activationCorpusSummary = evidence.sf33ActivationSourceCorpus?.summary ?? null;
    return {
      kind: blocker.kind,
      priority: blocker.priority,
      status: "blocked",
      finding: activationAssessment?.finding ?? sf33Assessment?.finding ?? (trigger?.target
        ? `Trigger candidat: ${trigger.target}.`
        : "Trigger candidat absent du contexte charge."),
      proofState: activationAssessment?.kind
        ? binaryParentSummary
          ? `${activationAssessment.kind}: trailer match ${binaryParentSummary.modTrailerMatchesAll ? "oui" : "non"}, consommateur exact ${binaryParentSummary.hasExactNeighborConsumerMatch ? "oui" : "non"}, source externe ${binaryParentSummary.externalTriggerHits ?? 0}`
          : namedSourceSummary
          ? `${activationAssessment.kind}: hits nommes externes ${namedSourceSummary.externalNameHits ?? 0}, asset courant ${namedSourceSummary.exactCurrentAssetNameHits ?? 0}, generated ${namedSourceSummary.optimizerDatasetHasGeneratedName ? "oui" : "non"}`
          : parentRunSemanticsSummary
          ? `${activationAssessment.kind}: trailer ${parentRunSemanticsSummary.targetModTrailerSignature ?? "?"}, matches upgrade ${parentRunSemanticsSummary.upgradeModTrailerMatches ?? 0}, voisins PowerTag ${parentRunSemanticsSummary.powerTagNeighbors ?? 0}, activation non prouvee`
          : parentRunSummary
          ? `${activationAssessment.kind}: run local ${parentRunSummary.targetLocalRunContiguous ? "oui" : "non"}, precedent ${parentRunSummary.targetPreviousKind ?? "?"}, ancre ${parentRunSummary.targetAnchorKind ?? "?"}, suivant ${parentRunSummary.targetNextKind ?? "?"}`
          : offsetTableSummary
          ? `${activationAssessment.kind}: ancres propres ${offsetTableSummary.cleanAnchorEntries ?? 0}, SoilRuler Mod ${offsetTableSummary.targetAnchorIsModFlag ? "oui" : "non"}, upgrades Mod ${offsetTableSummary.upgradeAnchorsAreModFlags ? "oui" : "non"}, type ${offsetTableSummary.targetAnchorTypeOrSize ?? "?"}`
          : neighborhoodSummary
          ? `${activationAssessment.kind}: refs trigger ${neighborhoodSummary.triggerDirectRefs ?? 0}, refs upgrade autonomes ${neighborhoodSummary.standaloneUpgradeDirectRefs ?? 0}, type partage ${neighborhoodSummary.sharedTargetTypeMatches ?? 0}`
          : activationSearchSummary
          ? `${activationAssessment.kind}: trigger externe ${activationSearchSummary.externalTriggerHits ?? 0}, owner externe ${activationSearchSummary.externalOwnerHits ?? 0}, analogies upgrade ${activationSearchSummary.upgradeAnalogyAssets ?? 0}`
          : `${activationAssessment.kind}: exact externe ${(activationAssessment.evidence?.externalExactAssetIds ?? []).length}, fichiers ${(activationCorpusSummary?.filesWithHits ?? 0)}`
        : sf33Assessment?.kind
        ? `${sf33Assessment.kind}: structural ${sf33Assessment.evidence?.structuralRelationFound ? "oui" : "non"}, build-state ${sf33Assessment.evidence?.hasBuildStateEntry ? "oui" : "non"}`
        : definitionTarget?.definitionAssessment?.kind
        ? `${definitionTarget.definitionAssessment.kind}: ${definitionTarget.definitionAssessment.note}`
        : "etat de build non mappe",
      nextAction: activationAssessment?.nextAction ?? sf33Assessment?.nextAction ?? "relier Mod.SoilRuler_B a un toggle ou a une source de build-state avant d'activer la branche SF_33",
    };
  }
  if (blocker.kind === "uptime-not-proven") {
    const candidate = evidence.candidate;
    const valueTarget = findDefinitionTarget(evidence.definition, "sf32-scaling-source");
    const uptimeAssessment = evidence.uptimeProofAudit?.summary?.assessment ?? null;
    const sfRoleAssessment = evidence.sf28Sf29RoleAudit?.summary?.assessment ?? null;
    const neighborDependencyAssessment = evidence.uptimeNeighborDependencyAudit?.summary?.assessment ?? null;
    return {
      kind: blocker.kind,
      priority: blocker.priority,
      status: "blocked",
      finding: neighborDependencyAssessment?.finding ?? sfRoleAssessment?.finding ?? uptimeAssessment?.finding ?? (candidate?.scenarioImpact
        ? `Scenario what-if ${candidate.scenarioImpact.scenarioId}: ${candidate.scenarioImpact.estimatedDps} DPS, delta ${candidate.scenarioImpact.deltaVsStrictDps}.`
        : "Scenario what-if non retrouve."),
      proofState: neighborDependencyAssessment?.kind
        ? `${neighborDependencyAssessment.kind}: proba locales ${evidence.uptimeNeighborDependencyAudit?.summary?.localProbabilityRows ?? 0}, liees branche ${(evidence.uptimeNeighborDependencyAudit?.summary?.probabilityRowsLinkedToBranch ?? 0)}`
        : sfRoleAssessment?.kind
        ? `${sfRoleAssessment.kind}: proba compilee ${evidence.sf28Sf29RoleAudit?.summary?.compiledProbabilityMatches ?? 0}, role uptime ${sfRoleAssessment.evidence?.hasUptimeRole ? "oui" : "non"}`
        : uptimeAssessment?.kind
        ? `${uptimeAssessment.kind}: voisins ${evidence.uptimeProofAudit?.summary?.probabilityNeighbors ?? 0}, lies ${(evidence.uptimeProofAudit?.summary?.linkedProbabilityNeighbors ?? 0)}`
        : valueTarget?.sourceCandidate?.valueAssessment?.note ?? "uptime non isole",
      nextAction: neighborDependencyAssessment?.nextAction ?? sfRoleAssessment?.nextAction ?? uptimeAssessment?.nextAction ?? "extraire ou configurer une uptime explicite avant toute promotion en DPS fiable",
    };
  }
  return {
    kind: blocker.kind,
    priority: blocker.priority,
    status: "blocked",
    finding: blocker.reason ?? blocker.kind,
    proofState: "non resolu",
    nextAction: blocker.action ?? "inspecter ce blocage",
  };
}

function summarizeTargetBlockerEvidence({ candidate, sfSource, definition, fieldRecords, recordSegments, recordHeaders, recordHeaderPatterns, recordHeaderPatternReport, normalizedHeaderLayouts, formulaHashLayoutFocus, formulaHashFieldBoundaries, formulaHashHeaderPreludes, hashSuffixDefinitionLinks, hashSuffixValuePatterns, hashSuffixCandidateSemantics, hashSuffixDictionaryMining, hashSuffixFamilyEvidence, hashSuffixSourceNameAudit, hashSuffixBinarySourceAudit, hashSuffixBinaryContextComparison, hashSuffixSublayoutClassification, hashSuffixSublayoutFields, hashSuffixFieldShapeDecoders, hashSuffixDecodedOffsetLinks, hashSuffixOffsetRecordInspection, hashSuffixRecordBoundaryComparison, hashSuffixBoundaryPreludes, hashSuffixPreludeHeaderComparison, hashSuffixHeaderShapeComparison, hashSuffixCompactPatternSearch, hashSuffixNamedTableAudit, recordHeaderSourceFreshnessAudit, bonusPercentSelectorMatrix, selector949PeerAudit, selector949CompactCorpus, decodedDictionaryStringScan, unanchoredBonusPercentAudit, metadata12337ContextAudit, metadata12337ScaleCorpus, selectorAssetPairCorpus, selectorAssetLayoutParser, selectorAssetOwnerFields, bonusPercentCoverageAudit, localTableSourceAlternatives, sf32FieldPromotionDecision, sf33BuildStateTriggerAudit, sf33ActivationSourceCorpus, sf33ActivationSourceSearchAudit, sf33BuildStateNeighborhoodAudit, sf33OffsetTableEntriesAudit, sf33OffsetTableParentRunAudit, sf33ParentRunSemanticsAudit, sf33NamedBuildStateSourceAudit, sf33BinaryParentSourceAudit, uptimeProofAudit, sf28Sf29RoleAudit, uptimeNeighborDependencyAudit }) {
  return {
    candidateFormula: candidate?.candidateFormula ?? null,
    scenarioImpact: candidate?.scenarioImpact
      ? {
          scenarioId: candidate.scenarioImpact.scenarioId,
          estimatedDps: candidate.scenarioImpact.estimatedDps,
          deltaVsStrictDps: candidate.scenarioImpact.deltaVsStrictDps,
          deltaVsStrictPct: candidate.scenarioImpact.deltaVsStrictPct,
        }
      : null,
    sfSlots: (sfSource?.slots ?? []).map((slot) => ({
      canonicalId: slot.canonicalId,
      role: slot.role,
      localSymbolStatus: slot.localSymbolStatus,
      recommendation: slot.recommendation?.kind ?? null,
    })),
    definitionTargets: (definition?.targets ?? []).map((target) => ({
      target: target.target,
      role: target.role,
      assessment: target.definitionAssessment?.kind ?? null,
      recommendation: target.recommendation?.kind ?? null,
    })),
    fieldRecordAssessment: fieldRecords?.assessment
      ? {
          fieldOwnership: fieldRecords.assessment.fieldOwnership,
          confidence: fieldRecords.assessment.confidence,
          blocker: fieldRecords.assessment.blocker,
          formulaBytecodeConstants: fieldRecords.assessment.evidence?.formulaBytecodeConstants ?? [],
          targetHasAssetId: fieldRecords.assessment.evidence?.targetHasAssetId ?? false,
        }
      : null,
    recordSegmentAssessment: recordSegments?.summary?.clusterAssessment
      ? {
          kind: recordSegments.summary.clusterAssessment.kind,
          confidence: recordSegments.summary.clusterAssessment.confidence,
          note: recordSegments.summary.clusterAssessment.note,
          clusterSegments: recordSegments.summary.clusterSegments,
          powerTagRecordLinksInPayload: recordSegments.summary.clusterAssessment.powerTagRecordLinksInPayload,
        }
      : null,
    recordHeaderAssessment: recordHeaders?.summary?.assessment
      ? {
          kind: recordHeaders.summary.assessment.kind,
          confidence: recordHeaders.summary.assessment.confidence,
          fieldOwnership: recordHeaders.summary.assessment.fieldOwnership,
          blocker: recordHeaders.summary.assessment.blocker,
          promotionReady: recordHeaders.summary.assessment.promotionReady,
          finding: recordHeaders.summary.assessment.finding,
          candidateFields: recordHeaders.summary.candidateFields,
        }
      : null,
    recordHeaderPatternAssessment: recordHeaderPatterns?.summary?.assessment
      ? {
          kind: recordHeaderPatterns.summary.assessment.kind,
          confidence: recordHeaderPatterns.summary.assessment.confidence,
          fieldOwnership: recordHeaderPatterns.summary.assessment.fieldOwnership,
          blocker: recordHeaderPatterns.summary.assessment.blocker,
          promotionReady: recordHeaderPatterns.summary.assessment.promotionReady,
          finding: recordHeaderPatterns.summary.assessment.finding,
          evidence: recordHeaderPatterns.summary.assessment.evidence,
        }
      : null,
    crossHeaderPatternAssessment: recordHeaderPatternReport?.summary?.assessment
      ? {
          kind: recordHeaderPatternReport.summary.assessment.kind,
          confidence: recordHeaderPatternReport.summary.assessment.confidence,
          fieldOwnership: recordHeaderPatternReport.summary.assessment.fieldOwnership,
          promotionReady: recordHeaderPatternReport.summary.assessment.promotionReady,
          finding: recordHeaderPatternReport.summary.assessment.finding,
          evidence: recordHeaderPatternReport.summary.assessment.evidence,
        }
      : null,
    normalizedHeaderLayoutAssessment: normalizedHeaderLayouts?.summary?.assessment
      ? {
          kind: normalizedHeaderLayouts.summary.assessment.kind,
          confidence: normalizedHeaderLayouts.summary.assessment.confidence,
          fieldOwnership: normalizedHeaderLayouts.summary.assessment.fieldOwnership,
          promotionReady: normalizedHeaderLayouts.summary.assessment.promotionReady,
          finding: normalizedHeaderLayouts.summary.assessment.finding,
          evidence: normalizedHeaderLayouts.summary.assessment.evidence,
        }
      : null,
    formulaHashLayoutFocusAssessment: formulaHashLayoutFocus?.summary?.assessment
      ? {
          kind: formulaHashLayoutFocus.summary.assessment.kind,
          confidence: formulaHashLayoutFocus.summary.assessment.confidence,
          fieldOwnership: formulaHashLayoutFocus.summary.assessment.fieldOwnership,
          promotionReady: formulaHashLayoutFocus.summary.assessment.promotionReady,
          finding: formulaHashLayoutFocus.summary.assessment.finding,
          evidence: formulaHashLayoutFocus.summary.assessment.evidence,
        }
      : null,
    formulaHashFieldBoundaryAssessment: formulaHashFieldBoundaries?.summary?.assessment
      ? {
          kind: formulaHashFieldBoundaries.summary.assessment.kind,
          confidence: formulaHashFieldBoundaries.summary.assessment.confidence,
          fieldOwnership: formulaHashFieldBoundaries.summary.assessment.fieldOwnership,
          promotionReady: formulaHashFieldBoundaries.summary.assessment.promotionReady,
          finding: formulaHashFieldBoundaries.summary.assessment.finding,
          evidence: formulaHashFieldBoundaries.summary.assessment.evidence,
        }
      : null,
    formulaHashHeaderPreludeAssessment: formulaHashHeaderPreludes?.summary?.assessment
      ? {
          kind: formulaHashHeaderPreludes.summary.assessment.kind,
          confidence: formulaHashHeaderPreludes.summary.assessment.confidence,
          fieldOwnership: formulaHashHeaderPreludes.summary.assessment.fieldOwnership,
          promotionReady: formulaHashHeaderPreludes.summary.assessment.promotionReady,
          finding: formulaHashHeaderPreludes.summary.assessment.finding,
          evidence: formulaHashHeaderPreludes.summary.assessment.evidence,
        }
      : null,
    hashSuffixDefinitionAssessment: hashSuffixDefinitionLinks?.summary?.assessment
      ? {
          kind: hashSuffixDefinitionLinks.summary.assessment.kind,
          confidence: hashSuffixDefinitionLinks.summary.assessment.confidence,
          fieldOwnership: hashSuffixDefinitionLinks.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixDefinitionLinks.summary.assessment.promotionReady,
          finding: hashSuffixDefinitionLinks.summary.assessment.finding,
          evidence: hashSuffixDefinitionLinks.summary.assessment.evidence,
        }
      : null,
    hashSuffixValuePatternAssessment: hashSuffixValuePatterns?.summary?.assessment
      ? {
          kind: hashSuffixValuePatterns.summary.assessment.kind,
          confidence: hashSuffixValuePatterns.summary.assessment.confidence,
          fieldOwnership: hashSuffixValuePatterns.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixValuePatterns.summary.assessment.promotionReady,
          finding: hashSuffixValuePatterns.summary.assessment.finding,
          evidence: hashSuffixValuePatterns.summary.assessment.evidence,
        }
      : null,
    hashSuffixCandidateSemanticAssessment: hashSuffixCandidateSemantics?.summary?.assessment
      ? {
          kind: hashSuffixCandidateSemantics.summary.assessment.kind,
          confidence: hashSuffixCandidateSemantics.summary.assessment.confidence,
          fieldOwnership: hashSuffixCandidateSemantics.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixCandidateSemantics.summary.assessment.promotionReady,
          finding: hashSuffixCandidateSemantics.summary.assessment.finding,
          evidence: hashSuffixCandidateSemantics.summary.assessment.evidence,
        }
      : null,
    hashSuffixDictionaryMiningAssessment: hashSuffixDictionaryMining?.summary?.assessment
      ? {
          kind: hashSuffixDictionaryMining.summary.assessment.kind,
          confidence: hashSuffixDictionaryMining.summary.assessment.confidence,
          fieldOwnership: hashSuffixDictionaryMining.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixDictionaryMining.summary.assessment.promotionReady,
          finding: hashSuffixDictionaryMining.summary.assessment.finding,
          evidence: hashSuffixDictionaryMining.summary.assessment.evidence,
        }
      : null,
    hashSuffixFamilyEvidenceAssessment: hashSuffixFamilyEvidence?.summary?.assessment
      ? {
          kind: hashSuffixFamilyEvidence.summary.assessment.kind,
          confidence: hashSuffixFamilyEvidence.summary.assessment.confidence,
          fieldOwnership: hashSuffixFamilyEvidence.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixFamilyEvidence.summary.assessment.promotionReady,
          finding: hashSuffixFamilyEvidence.summary.assessment.finding,
          evidence: hashSuffixFamilyEvidence.summary.assessment.evidence,
        }
      : null,
    hashSuffixSourceNameAssessment: hashSuffixSourceNameAudit?.summary?.assessment
      ? {
          kind: hashSuffixSourceNameAudit.summary.assessment.kind,
          confidence: hashSuffixSourceNameAudit.summary.assessment.confidence,
          fieldOwnership: hashSuffixSourceNameAudit.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixSourceNameAudit.summary.assessment.promotionReady,
          finding: hashSuffixSourceNameAudit.summary.assessment.finding,
          evidence: hashSuffixSourceNameAudit.summary.assessment.evidence,
        }
      : null,
    hashSuffixBinarySourceAssessment: hashSuffixBinarySourceAudit?.summary?.assessment
      ? {
          kind: hashSuffixBinarySourceAudit.summary.assessment.kind,
          confidence: hashSuffixBinarySourceAudit.summary.assessment.confidence,
          fieldOwnership: hashSuffixBinarySourceAudit.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixBinarySourceAudit.summary.assessment.promotionReady,
          finding: hashSuffixBinarySourceAudit.summary.assessment.finding,
          evidence: hashSuffixBinarySourceAudit.summary.assessment.evidence,
        }
      : null,
    hashSuffixBinaryContextAssessment: hashSuffixBinaryContextComparison?.summary?.assessment
      ? {
          kind: hashSuffixBinaryContextComparison.summary.assessment.kind,
          confidence: hashSuffixBinaryContextComparison.summary.assessment.confidence,
          fieldOwnership: hashSuffixBinaryContextComparison.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixBinaryContextComparison.summary.assessment.promotionReady,
          finding: hashSuffixBinaryContextComparison.summary.assessment.finding,
          evidence: hashSuffixBinaryContextComparison.summary.assessment.evidence,
        }
      : null,
    hashSuffixSublayoutAssessment: hashSuffixSublayoutClassification?.summary?.assessment
      ? {
          kind: hashSuffixSublayoutClassification.summary.assessment.kind,
          confidence: hashSuffixSublayoutClassification.summary.assessment.confidence,
          fieldOwnership: hashSuffixSublayoutClassification.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixSublayoutClassification.summary.assessment.promotionReady,
          finding: hashSuffixSublayoutClassification.summary.assessment.finding,
          evidence: hashSuffixSublayoutClassification.summary.assessment.evidence,
        }
      : null,
    hashSuffixSublayoutFieldAssessment: hashSuffixSublayoutFields?.summary?.assessment
      ? {
          kind: hashSuffixSublayoutFields.summary.assessment.kind,
          confidence: hashSuffixSublayoutFields.summary.assessment.confidence,
          fieldOwnership: hashSuffixSublayoutFields.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixSublayoutFields.summary.assessment.promotionReady,
          finding: hashSuffixSublayoutFields.summary.assessment.finding,
          evidence: hashSuffixSublayoutFields.summary.assessment.evidence,
        }
      : null,
    hashSuffixFieldShapeDecoderAssessment: hashSuffixFieldShapeDecoders?.summary?.assessment
      ? {
          kind: hashSuffixFieldShapeDecoders.summary.assessment.kind,
          confidence: hashSuffixFieldShapeDecoders.summary.assessment.confidence,
          fieldOwnership: hashSuffixFieldShapeDecoders.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixFieldShapeDecoders.summary.assessment.promotionReady,
          finding: hashSuffixFieldShapeDecoders.summary.assessment.finding,
          evidence: hashSuffixFieldShapeDecoders.summary.assessment.evidence,
        }
      : null,
    hashSuffixDecodedOffsetLinkAssessment: hashSuffixDecodedOffsetLinks?.summary?.assessment
      ? {
          kind: hashSuffixDecodedOffsetLinks.summary.assessment.kind,
          confidence: hashSuffixDecodedOffsetLinks.summary.assessment.confidence,
          fieldOwnership: hashSuffixDecodedOffsetLinks.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixDecodedOffsetLinks.summary.assessment.promotionReady,
          finding: hashSuffixDecodedOffsetLinks.summary.assessment.finding,
          evidence: hashSuffixDecodedOffsetLinks.summary.assessment.evidence,
        }
      : null,
    hashSuffixOffsetRecordAssessment: hashSuffixOffsetRecordInspection?.summary?.assessment
      ? {
          kind: hashSuffixOffsetRecordInspection.summary.assessment.kind,
          confidence: hashSuffixOffsetRecordInspection.summary.assessment.confidence,
          fieldOwnership: hashSuffixOffsetRecordInspection.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixOffsetRecordInspection.summary.assessment.promotionReady,
          finding: hashSuffixOffsetRecordInspection.summary.assessment.finding,
          evidence: hashSuffixOffsetRecordInspection.summary.assessment.evidence,
        }
      : null,
    hashSuffixRecordBoundaryAssessment: hashSuffixRecordBoundaryComparison?.summary?.assessment
      ? {
          kind: hashSuffixRecordBoundaryComparison.summary.assessment.kind,
          confidence: hashSuffixRecordBoundaryComparison.summary.assessment.confidence,
          fieldOwnership: hashSuffixRecordBoundaryComparison.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixRecordBoundaryComparison.summary.assessment.promotionReady,
          finding: hashSuffixRecordBoundaryComparison.summary.assessment.finding,
          evidence: hashSuffixRecordBoundaryComparison.summary.assessment.evidence,
        }
      : null,
    hashSuffixBoundaryPreludeAssessment: hashSuffixBoundaryPreludes?.summary?.assessment
      ? {
          kind: hashSuffixBoundaryPreludes.summary.assessment.kind,
          confidence: hashSuffixBoundaryPreludes.summary.assessment.confidence,
          fieldOwnership: hashSuffixBoundaryPreludes.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixBoundaryPreludes.summary.assessment.promotionReady,
          finding: hashSuffixBoundaryPreludes.summary.assessment.finding,
          evidence: hashSuffixBoundaryPreludes.summary.assessment.evidence,
        }
      : null,
    hashSuffixPreludeHeaderAssessment: hashSuffixPreludeHeaderComparison?.summary?.assessment
      ? {
          kind: hashSuffixPreludeHeaderComparison.summary.assessment.kind,
          confidence: hashSuffixPreludeHeaderComparison.summary.assessment.confidence,
          fieldOwnership: hashSuffixPreludeHeaderComparison.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixPreludeHeaderComparison.summary.assessment.promotionReady,
          finding: hashSuffixPreludeHeaderComparison.summary.assessment.finding,
          evidence: hashSuffixPreludeHeaderComparison.summary.assessment.evidence,
        }
      : null,
    hashSuffixHeaderShapeAssessment: hashSuffixHeaderShapeComparison?.summary?.assessment
      ? {
          kind: hashSuffixHeaderShapeComparison.summary.assessment.kind,
          confidence: hashSuffixHeaderShapeComparison.summary.assessment.confidence,
          fieldOwnership: hashSuffixHeaderShapeComparison.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixHeaderShapeComparison.summary.assessment.promotionReady,
          finding: hashSuffixHeaderShapeComparison.summary.assessment.finding,
          evidence: hashSuffixHeaderShapeComparison.summary.assessment.evidence,
        }
      : null,
    hashSuffixCompactPatternAssessment: hashSuffixCompactPatternSearch?.summary?.assessment
      ? {
          kind: hashSuffixCompactPatternSearch.summary.assessment.kind,
          confidence: hashSuffixCompactPatternSearch.summary.assessment.confidence,
          fieldOwnership: hashSuffixCompactPatternSearch.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixCompactPatternSearch.summary.assessment.promotionReady,
          finding: hashSuffixCompactPatternSearch.summary.assessment.finding,
          evidence: hashSuffixCompactPatternSearch.summary.assessment.evidence,
        }
      : null,
    hashSuffixNamedTableAssessment: hashSuffixNamedTableAudit?.summary?.assessment
      ? {
          kind: hashSuffixNamedTableAudit.summary.assessment.kind,
          confidence: hashSuffixNamedTableAudit.summary.assessment.confidence,
          fieldOwnership: hashSuffixNamedTableAudit.summary.assessment.fieldOwnership,
          promotionReady: hashSuffixNamedTableAudit.summary.assessment.promotionReady,
          finding: hashSuffixNamedTableAudit.summary.assessment.finding,
          evidence: hashSuffixNamedTableAudit.summary.assessment.evidence,
        }
      : null,
    bonusPercentSelectorMatrixAssessment: bonusPercentSelectorMatrix?.summary?.assessment
      ? {
          kind: bonusPercentSelectorMatrix.summary.assessment.kind,
          confidence: bonusPercentSelectorMatrix.summary.assessment.confidence,
          fieldOwnership: bonusPercentSelectorMatrix.summary.assessment.fieldOwnership,
          promotionReady: bonusPercentSelectorMatrix.summary.assessment.promotionReady,
          finding: bonusPercentSelectorMatrix.summary.assessment.finding,
          evidence: bonusPercentSelectorMatrix.summary.assessment.evidence,
        }
      : null,
    selector949PeerAssessment: selector949PeerAudit?.summary?.assessment
      ? {
          kind: selector949PeerAudit.summary.assessment.kind,
          confidence: selector949PeerAudit.summary.assessment.confidence,
          fieldOwnership: selector949PeerAudit.summary.assessment.fieldOwnership,
          promotionReady: selector949PeerAudit.summary.assessment.promotionReady,
          finding: selector949PeerAudit.summary.assessment.finding,
          evidence: selector949PeerAudit.summary.assessment.evidence,
        }
      : null,
    selector949CompactCorpusAssessment: selector949CompactCorpus?.summary?.assessment
      ? {
          kind: selector949CompactCorpus.summary.assessment.kind,
          confidence: selector949CompactCorpus.summary.assessment.confidence,
          fieldOwnership: selector949CompactCorpus.summary.assessment.fieldOwnership,
          promotionReady: selector949CompactCorpus.summary.assessment.promotionReady,
          compactOccurrences: selector949CompactCorpus.summary.compactOccurrences,
          selector949Occurrences: selector949CompactCorpus.summary.selector949Occurrences,
          compactAssetCandidates: selector949CompactCorpus.summary.compactAssetCandidates,
          nextAction: selector949CompactCorpus.summary.assessment.nextAction,
        }
      : null,
    decodedDictionaryStringAssessment: decodedDictionaryStringScan?.summary?.assessment
      ? {
          kind: decodedDictionaryStringScan.summary.assessment.kind,
          confidence: decodedDictionaryStringScan.summary.assessment.confidence,
          fieldOwnership: decodedDictionaryStringScan.summary.assessment.fieldOwnership,
          promotionReady: decodedDictionaryStringScan.summary.assessment.promotionReady,
          dictionaryHits: decodedDictionaryStringScan.summary.dictionaryHits,
          dictionaryHitsNearWatchedNumbers: decodedDictionaryStringScan.summary.dictionaryHitsNearWatchedNumbers,
          bonusPercentHits: decodedDictionaryStringScan.summary.bonusPercentHits,
          finding: decodedDictionaryStringScan.summary.assessment.finding,
          nextAction: decodedDictionaryStringScan.summary.assessment.nextAction,
        }
      : null,
    unanchoredBonusPercentAssessment: unanchoredBonusPercentAudit?.summary?.assessment
      ? {
          kind: unanchoredBonusPercentAudit.summary.assessment.kind,
          confidence: unanchoredBonusPercentAudit.summary.assessment.confidence,
          fieldOwnership: unanchoredBonusPercentAudit.summary.assessment.fieldOwnership,
          promotionReady: unanchoredBonusPercentAudit.summary.assessment.promotionReady,
          rows: unanchoredBonusPercentAudit.summary.rows,
          readablePayloads: unanchoredBonusPercentAudit.summary.readablePayloads,
          targetStringsFound: unanchoredBonusPercentAudit.summary.targetStringsFound,
          usefulAnchorCandidates: unanchoredBonusPercentAudit.summary.usefulAnchorCandidates,
          finding: unanchoredBonusPercentAudit.summary.assessment.finding,
          nextAction: unanchoredBonusPercentAudit.summary.assessment.nextAction,
        }
      : null,
    metadata12337ContextAssessment: metadata12337ContextAudit?.summary?.assessment
      ? {
          kind: metadata12337ContextAudit.summary.assessment.kind,
          confidence: metadata12337ContextAudit.summary.assessment.confidence,
          fieldOwnership: metadata12337ContextAudit.summary.assessment.fieldOwnership,
          promotionReady: metadata12337ContextAudit.summary.assessment.promotionReady,
          rows: metadata12337ContextAudit.summary.rows,
          verifiedRows: metadata12337ContextAudit.summary.verifiedRows,
          selectors: metadata12337ContextAudit.summary.selectors,
          families: metadata12337ContextAudit.summary.families,
          non949Rows: metadata12337ContextAudit.summary.non949Rows,
          finding: metadata12337ContextAudit.summary.assessment.finding,
          nextAction: metadata12337ContextAudit.summary.assessment.nextAction,
        }
      : null,
    metadata12337ScaleCorpusAssessment: metadata12337ScaleCorpus?.summary?.assessment
      ? {
          kind: metadata12337ScaleCorpus.summary.assessment.kind,
          confidence: metadata12337ScaleCorpus.summary.assessment.confidence,
          fieldOwnership: metadata12337ScaleCorpus.summary.assessment.fieldOwnership,
          promotionReady: metadata12337ScaleCorpus.summary.assessment.promotionReady,
          hits: metadata12337ScaleCorpus.summary.hits,
          filesWithHits: metadata12337ScaleCorpus.summary.filesWithHits,
          shapeCounts: metadata12337ScaleCorpus.summary.shapeCounts,
          selectorCounts: metadata12337ScaleCorpus.summary.selectorCounts,
          finding: metadata12337ScaleCorpus.summary.assessment.finding,
          nextAction: metadata12337ScaleCorpus.summary.assessment.nextAction,
        }
      : null,
    selectorAssetPairAssessment: selectorAssetPairCorpus?.summary?.assessment
      ? {
          kind: selectorAssetPairCorpus.summary.assessment.kind,
          confidence: selectorAssetPairCorpus.summary.assessment.confidence,
          fieldOwnership: selectorAssetPairCorpus.summary.assessment.fieldOwnership,
          promotionReady: selectorAssetPairCorpus.summary.assessment.promotionReady,
          hits: selectorAssetPairCorpus.summary.hits,
          groups: selectorAssetPairCorpus.summary.groups,
          selector949Groups: selectorAssetPairCorpus.summary.selector949Groups,
          selector949CompactGroups: selectorAssetPairCorpus.summary.selector949CompactGroups,
          selector949NonCompactGroups: selectorAssetPairCorpus.summary.selector949NonCompactGroups,
          selector994Groups: selectorAssetPairCorpus.summary.selector994Groups,
          finding: selectorAssetPairCorpus.summary.assessment.finding,
          nextAction: selectorAssetPairCorpus.summary.assessment.nextAction,
        }
      : null,
    selectorAssetLayoutAssessment: selectorAssetLayoutParser?.summary?.assessment
      ? {
          kind: selectorAssetLayoutParser.summary.assessment.kind,
          confidence: selectorAssetLayoutParser.summary.assessment.confidence,
          fieldOwnership: selectorAssetLayoutParser.summary.assessment.fieldOwnership,
          promotionReady: selectorAssetLayoutParser.summary.assessment.promotionReady,
          layouts: selectorAssetLayoutParser.summary.layouts,
          selector949Layouts: selectorAssetLayoutParser.summary.selector949Layouts,
          selector949CompactLayouts: selectorAssetLayoutParser.summary.selector949CompactLayouts,
          selector949NonCompactLayouts: selectorAssetLayoutParser.summary.selector949NonCompactLayouts,
          finding: selectorAssetLayoutParser.summary.assessment.finding,
          nextAction: selectorAssetLayoutParser.summary.assessment.nextAction,
          evidence: selectorAssetLayoutParser.summary.assessment.evidence,
        }
      : null,
    selectorAssetOwnerFieldAssessment: selectorAssetOwnerFields?.summary?.assessment
      ? {
          kind: selectorAssetOwnerFields.summary.assessment.kind,
          confidence: selectorAssetOwnerFields.summary.assessment.confidence,
          fieldOwnership: selectorAssetOwnerFields.summary.assessment.fieldOwnership,
          promotionReady: selectorAssetOwnerFields.summary.assessment.promotionReady,
          layouts: selectorAssetOwnerFields.summary.layouts,
          selector949Layouts: selectorAssetOwnerFields.summary.selector949Layouts,
          selector949BlockedLayouts: selectorAssetOwnerFields.summary.selector949BlockedLayouts,
          candidateFields: selectorAssetOwnerFields.summary.candidateFields,
          compact949Layouts: selectorAssetOwnerFields.summary.compact949Layouts,
          variant949Layouts: selectorAssetOwnerFields.summary.variant949Layouts,
          finding: selectorAssetOwnerFields.summary.assessment.finding,
          nextAction: selectorAssetOwnerFields.summary.assessment.nextAction,
          evidence: selectorAssetOwnerFields.summary.assessment.evidence,
        }
      : null,
    bonusPercentCoverageAssessment: bonusPercentCoverageAudit?.summary?.assessment
      ? {
          kind: bonusPercentCoverageAudit.summary.assessment.kind,
          confidence: bonusPercentCoverageAudit.summary.assessment.confidence,
          fieldOwnership: bonusPercentCoverageAudit.summary.assessment.fieldOwnership,
          promotionReady: bonusPercentCoverageAudit.summary.assessment.promotionReady,
          externalAssets: bonusPercentCoverageAudit.summary.externalAssets,
          decodedAssets: bonusPercentCoverageAudit.summary.decodedAssets,
          missingDecodedAssets: bonusPercentCoverageAudit.summary.missingDecodedAssets,
          selector949Assets: bonusPercentCoverageAudit.summary.selector949Assets,
          secondCompact949Assets: bonusPercentCoverageAudit.summary.secondCompact949Assets,
          unauditedAssets: bonusPercentCoverageAudit.summary.unauditedAssets,
          finding: bonusPercentCoverageAudit.summary.assessment.finding,
          nextAction: bonusPercentCoverageAudit.summary.assessment.nextAction,
          evidence: bonusPercentCoverageAudit.summary.assessment.evidence,
        }
      : null,
    localTableSourceAssessment: localTableSourceAlternatives?.summary?.assessment
      ? {
          kind: localTableSourceAlternatives.summary.assessment.kind,
          confidence: localTableSourceAlternatives.summary.assessment.confidence,
          fieldOwnership: localTableSourceAlternatives.summary.assessment.fieldOwnership,
          promotionReady: localTableSourceAlternatives.summary.assessment.promotionReady,
          independentTableCandidates: localTableSourceAlternatives.summary.independentTableCandidates,
          dictionaryNearWatched: localTableSourceAlternatives.summary.dictionaryNearWatched,
          missingDecodedAssets: localTableSourceAlternatives.summary.missingDecodedAssets,
          secondCompact949Assets: localTableSourceAlternatives.summary.secondCompact949Assets,
          usefulTableCandidateContexts: localTableSourceAlternatives.summary.usefulTableCandidateContexts,
          exactNumericContexts: localTableSourceAlternatives.summary.exactNumericContexts,
          finding: localTableSourceAlternatives.summary.assessment.finding,
          nextAction: localTableSourceAlternatives.summary.assessment.nextAction,
          evidence: localTableSourceAlternatives.summary.assessment.evidence,
        }
      : null,
    sf32FieldPromotionDecisionAssessment: sf32FieldPromotionDecision?.summary?.assessment
      ? {
          kind: sf32FieldPromotionDecision.summary.assessment.kind,
          confidence: sf32FieldPromotionDecision.summary.assessment.confidence,
          fieldOwnership: sf32FieldPromotionDecision.summary.assessment.fieldOwnership,
          promotionReady: sf32FieldPromotionDecision.summary.assessment.promotionReady,
          targetAssetId: sf32FieldPromotionDecision.summary.targetAssetId,
          targetField: sf32FieldPromotionDecision.summary.targetField,
          targetSelector: sf32FieldPromotionDecision.summary.targetSelector,
          metadataId: sf32FieldPromotionDecision.summary.metadataId,
          scale: sf32FieldPromotionDecision.summary.scale,
          blockers: sf32FieldPromotionDecision.summary.blockers,
          promotionGates: sf32FieldPromotionDecision.summary.promotionGates ?? [],
          optimizerPolicy: sf32FieldPromotionDecision.summary.optimizerPolicy ?? null,
          finding: sf32FieldPromotionDecision.summary.assessment.finding,
          nextAction: sf32FieldPromotionDecision.summary.assessment.nextAction,
          evidence: sf32FieldPromotionDecision.summary.assessment.evidence,
        }
      : null,
    sf33BuildStateTriggerAssessment: sf33BuildStateTriggerAudit?.summary?.assessment
      ? {
          kind: sf33BuildStateTriggerAudit.summary.assessment.kind,
          confidence: sf33BuildStateTriggerAudit.summary.assessment.confidence,
          fieldOwnership: sf33BuildStateTriggerAudit.summary.assessment.fieldOwnership,
          promotionReady: sf33BuildStateTriggerAudit.summary.assessment.promotionReady,
          blocker: sf33BuildStateTriggerAudit.summary.assessment.blocker,
          trigger: sf33BuildStateTriggerAudit.summary.trigger,
          sfSlotId: sf33BuildStateTriggerAudit.summary.sfSlotId,
          hasBranchSlot: sf33BuildStateTriggerAudit.summary.hasBranchSlot,
          hasStructuralRelation: sf33BuildStateTriggerAudit.summary.hasStructuralRelation,
          hasBuildStateEntry: sf33BuildStateTriggerAudit.summary.hasBuildStateEntry,
          hasExactDefinitionOutsideCurrentAsset: sf33BuildStateTriggerAudit.summary.hasExactDefinitionOutsideCurrentAsset,
          finding: sf33BuildStateTriggerAudit.summary.assessment.finding,
          nextAction: sf33BuildStateTriggerAudit.summary.assessment.nextAction,
          evidence: sf33BuildStateTriggerAudit.summary.assessment.evidence,
        }
      : null,
    sf33ActivationSourceAssessment: sf33ActivationSourceCorpus?.summary?.assessment
      ? {
          kind: sf33ActivationSourceCorpus.summary.assessment.kind,
          confidence: sf33ActivationSourceCorpus.summary.assessment.confidence,
          promotionReady: sf33ActivationSourceCorpus.summary.assessment.promotionReady,
          blocker: sf33ActivationSourceCorpus.summary.assessment.blocker,
          filesWithHits: sf33ActivationSourceCorpus.summary.filesWithHits,
          totalHits: sf33ActivationSourceCorpus.summary.totalHits,
          exactAssetIds: sf33ActivationSourceCorpus.summary.exactAssetIds,
          externalExactAssetIds: sf33ActivationSourceCorpus.summary.externalExactAssetIds,
          hasIndependentActivationSource: sf33ActivationSourceCorpus.summary.hasIndependentActivationSource,
          finding: sf33ActivationSourceCorpus.summary.assessment.finding,
          nextAction: sf33ActivationSourceCorpus.summary.assessment.nextAction,
          evidence: sf33ActivationSourceCorpus.summary.assessment.evidence,
        }
      : null,
    sf33ActivationSourceSearchAssessment: sf33ActivationSourceSearchAudit?.summary?.assessment
      ? {
          kind: sf33ActivationSourceSearchAudit.summary.assessment.kind,
          confidence: sf33ActivationSourceSearchAudit.summary.assessment.confidence,
          promotionReady: sf33ActivationSourceSearchAudit.summary.assessment.promotionReady,
          blocker: sf33ActivationSourceSearchAudit.summary.assessment.blocker,
          sourceFiles: sf33ActivationSourceSearchAudit.summary.sourceFiles,
          decodedDeadbeefEntries: sf33ActivationSourceSearchAudit.summary.decodedDeadbeefEntries,
          matchingEntries: sf33ActivationSourceSearchAudit.summary.matchingEntries,
          triggerHits: sf33ActivationSourceSearchAudit.summary.triggerHits,
          externalTriggerHits: sf33ActivationSourceSearchAudit.summary.externalTriggerHits,
          ownerHits: sf33ActivationSourceSearchAudit.summary.ownerHits,
          externalOwnerHits: sf33ActivationSourceSearchAudit.summary.externalOwnerHits,
          upgradeAnalogyAssets: sf33ActivationSourceSearchAudit.summary.upgradeAnalogyAssets,
          hasOnlyCurrentTrigger: sf33ActivationSourceSearchAudit.summary.hasOnlyCurrentTrigger,
          hasOnlyCurrentOwner: sf33ActivationSourceSearchAudit.summary.hasOnlyCurrentOwner,
          finding: sf33ActivationSourceSearchAudit.summary.assessment.finding,
          nextAction: sf33ActivationSourceSearchAudit.summary.assessment.nextAction,
        }
      : null,
    sf33BuildStateNeighborhoodAssessment: sf33BuildStateNeighborhoodAudit?.summary?.assessment
      ? {
          kind: sf33BuildStateNeighborhoodAudit.summary.assessment.kind,
          confidence: sf33BuildStateNeighborhoodAudit.summary.assessment.confidence,
          promotionReady: sf33BuildStateNeighborhoodAudit.summary.assessment.promotionReady,
          blocker: sf33BuildStateNeighborhoodAudit.summary.assessment.blocker,
          triggerDirectRefs: sf33BuildStateNeighborhoodAudit.summary.triggerDirectRefs,
          standaloneUpgradeDirectRefs: sf33BuildStateNeighborhoodAudit.summary.standaloneUpgradeDirectRefs,
          triggerSignature: sf33BuildStateNeighborhoodAudit.summary.triggerSignature,
          exactSignatureMatches: sf33BuildStateNeighborhoodAudit.summary.exactSignatureMatches,
          sharedTargetTypeMatches: sf33BuildStateNeighborhoodAudit.summary.sharedTargetTypeMatches,
          finding: sf33BuildStateNeighborhoodAudit.summary.assessment.finding,
          nextAction: sf33BuildStateNeighborhoodAudit.summary.assessment.nextAction,
        }
      : null,
    sf33OffsetTableEntriesAssessment: sf33OffsetTableEntriesAudit?.summary?.assessment
      ? {
          kind: sf33OffsetTableEntriesAudit.summary.assessment.kind,
          confidence: sf33OffsetTableEntriesAudit.summary.assessment.confidence,
          promotionReady: sf33OffsetTableEntriesAudit.summary.assessment.promotionReady,
          blocker: sf33OffsetTableEntriesAudit.summary.assessment.blocker,
          windows: sf33OffsetTableEntriesAudit.summary.windows,
          cleanAnchorEntries: sf33OffsetTableEntriesAudit.summary.cleanAnchorEntries,
          targetAnchorIsModFlag: sf33OffsetTableEntriesAudit.summary.targetAnchorIsModFlag,
          upgradeAnchorsAreModFlags: sf33OffsetTableEntriesAudit.summary.upgradeAnchorsAreModFlags,
          targetAnchorTypeOrSize: sf33OffsetTableEntriesAudit.summary.targetAnchorTypeOrSize,
          upgradeAnchorTypesOrSizes: sf33OffsetTableEntriesAudit.summary.upgradeAnchorTypesOrSizes,
          finding: sf33OffsetTableEntriesAudit.summary.assessment.finding,
          nextAction: sf33OffsetTableEntriesAudit.summary.assessment.nextAction,
        }
      : null,
    sf33OffsetTableParentRunAssessment: sf33OffsetTableParentRunAudit?.summary?.assessment
      ? {
          kind: sf33OffsetTableParentRunAudit.summary.assessment.kind,
          confidence: sf33OffsetTableParentRunAudit.summary.assessment.confidence,
          promotionReady: sf33OffsetTableParentRunAudit.summary.assessment.promotionReady,
          blocker: sf33OffsetTableParentRunAudit.summary.assessment.blocker,
          targetLocalRunContiguous: sf33OffsetTableParentRunAudit.summary.targetLocalRunContiguous,
          upgradeLocalRunsContiguous: sf33OffsetTableParentRunAudit.summary.upgradeLocalRunsContiguous,
          targetAnchorKind: sf33OffsetTableParentRunAudit.summary.targetAnchorKind,
          targetPreviousKind: sf33OffsetTableParentRunAudit.summary.targetPreviousKind,
          targetNextKind: sf33OffsetTableParentRunAudit.summary.targetNextKind,
          targetNextAscii: sf33OffsetTableParentRunAudit.summary.targetNextAscii,
          finding: sf33OffsetTableParentRunAudit.summary.assessment.finding,
          nextAction: sf33OffsetTableParentRunAudit.summary.assessment.nextAction,
        }
      : null,
    sf33ParentRunSemanticsAssessment: sf33ParentRunSemanticsAudit?.summary?.assessment
      ? {
          kind: sf33ParentRunSemanticsAudit.summary.assessment.kind,
          confidence: sf33ParentRunSemanticsAudit.summary.assessment.confidence,
          promotionReady: sf33ParentRunSemanticsAudit.summary.assessment.promotionReady,
          blocker: sf33ParentRunSemanticsAudit.summary.assessment.blocker,
          comparedUpgradeRuns: sf33ParentRunSemanticsAudit.summary.comparedUpgradeRuns,
          targetModTrailerSignature: sf33ParentRunSemanticsAudit.summary.targetModTrailerSignature,
          upgradeModTrailerMatches: sf33ParentRunSemanticsAudit.summary.upgradeModTrailerMatches,
          targetNextPrefixSignature: sf33ParentRunSemanticsAudit.summary.targetNextPrefixSignature,
          upgradeNextPrefixExactMatches: sf33ParentRunSemanticsAudit.summary.upgradeNextPrefixExactMatches,
          previousSignatureMatches: sf33ParentRunSemanticsAudit.summary.previousSignatureMatches,
          powerTagNeighbors: sf33ParentRunSemanticsAudit.summary.powerTagNeighbors,
          globalTuningNeighbors: sf33ParentRunSemanticsAudit.summary.globalTuningNeighbors,
          finding: sf33ParentRunSemanticsAudit.summary.assessment.finding,
          nextAction: sf33ParentRunSemanticsAudit.summary.assessment.nextAction,
        }
      : null,
    sf33NamedBuildStateSourceAssessment: sf33NamedBuildStateSourceAudit?.summary?.assessment
      ? {
          kind: sf33NamedBuildStateSourceAudit.summary.assessment.kind,
          confidence: sf33NamedBuildStateSourceAudit.summary.assessment.confidence,
          promotionReady: sf33NamedBuildStateSourceAudit.summary.assessment.promotionReady,
          blocker: sf33NamedBuildStateSourceAudit.summary.assessment.blocker,
          filesScanned: sf33NamedBuildStateSourceAudit.summary.filesScanned,
          decodedDeadbeefEntries: sf33NamedBuildStateSourceAudit.summary.decodedDeadbeefEntries,
          nameSearchMatchingEntries: sf33NamedBuildStateSourceAudit.summary.nameSearchMatchingEntries,
          exactCurrentAssetNameHits: sf33NamedBuildStateSourceAudit.summary.exactCurrentAssetNameHits,
          externalNameHits: sf33NamedBuildStateSourceAudit.summary.externalNameHits,
          targetDatasetHasNamedSource: sf33NamedBuildStateSourceAudit.summary.targetDatasetHasNamedSource,
          optimizerDatasetHasGeneratedName: sf33NamedBuildStateSourceAudit.summary.optimizerDatasetHasGeneratedName,
          schemaExampleHasGeneratedName: sf33NamedBuildStateSourceAudit.summary.schemaExampleHasGeneratedName,
          definitionAssessment: sf33NamedBuildStateSourceAudit.summary.definitionAssessment,
          parentSemanticsKind: sf33NamedBuildStateSourceAudit.summary.parentSemanticsKind,
          finding: sf33NamedBuildStateSourceAudit.summary.assessment.finding,
          nextAction: sf33NamedBuildStateSourceAudit.summary.assessment.nextAction,
        }
      : null,
    sf33BinaryParentSourceAssessment: sf33BinaryParentSourceAudit?.summary?.assessment
      ? {
          kind: sf33BinaryParentSourceAudit.summary.assessment.kind,
          confidence: sf33BinaryParentSourceAudit.summary.assessment.confidence,
          promotionReady: sf33BinaryParentSourceAudit.summary.assessment.promotionReady,
          buildStateReady: sf33BinaryParentSourceAudit.summary.assessment.buildStateReady,
          blocker: sf33BinaryParentSourceAudit.summary.assessment.blocker,
          comparedUpgradeRuns: sf33BinaryParentSourceAudit.summary.comparedUpgradeRuns,
          modTrailerMatchesAll: sf33BinaryParentSourceAudit.summary.modTrailerMatchesAll,
          hasExactNeighborConsumerMatch: sf33BinaryParentSourceAudit.summary.hasExactNeighborConsumerMatch,
          externalNameHits: sf33BinaryParentSourceAudit.summary.externalNameHits,
          externalTriggerHits: sf33BinaryParentSourceAudit.summary.externalTriggerHits,
          finding: sf33BinaryParentSourceAudit.summary.assessment.finding,
          nextAction: sf33BinaryParentSourceAudit.summary.assessment.nextAction,
          evidence: sf33BinaryParentSourceAudit.summary.assessment.evidence,
        }
      : null,
    uptimeProofAssessment: uptimeProofAudit?.summary?.assessment
      ? {
          kind: uptimeProofAudit.summary.assessment.kind,
          confidence: uptimeProofAudit.summary.assessment.confidence,
          promotionReady: uptimeProofAudit.summary.assessment.promotionReady,
          blocker: uptimeProofAudit.summary.assessment.blocker,
          probabilityNeighbors: uptimeProofAudit.summary.probabilityNeighbors,
          linkedProbabilityNeighbors: uptimeProofAudit.summary.linkedProbabilityNeighbors,
          hasExplicitUptime: uptimeProofAudit.summary.hasExplicitUptime,
          hasNumericUptime: uptimeProofAudit.summary.hasNumericUptime,
          finding: uptimeProofAudit.summary.assessment.finding,
          nextAction: uptimeProofAudit.summary.assessment.nextAction,
          evidence: uptimeProofAudit.summary.assessment.evidence,
        }
      : null,
    sf28Sf29RoleAssessment: sf28Sf29RoleAudit?.summary?.assessment
      ? {
          kind: sf28Sf29RoleAudit.summary.assessment.kind,
          confidence: sf28Sf29RoleAudit.summary.assessment.confidence,
          promotionReady: sf28Sf29RoleAudit.summary.assessment.promotionReady,
          blocker: sf28Sf29RoleAudit.summary.assessment.blocker,
          probabilityNeighbors: sf28Sf29RoleAudit.summary.probabilityNeighbors,
          linkedProbabilityNeighbors: sf28Sf29RoleAudit.summary.linkedProbabilityNeighbors,
          compiledProbabilityMatches: sf28Sf29RoleAudit.summary.compiledProbabilityMatches,
          hasUptimeRole: sf28Sf29RoleAudit.summary.hasUptimeRole,
          finding: sf28Sf29RoleAudit.summary.assessment.finding,
          nextAction: sf28Sf29RoleAudit.summary.assessment.nextAction,
          evidence: sf28Sf29RoleAudit.summary.assessment.evidence,
        }
      : null,
    uptimeNeighborDependencyAssessment: uptimeNeighborDependencyAudit?.summary?.assessment
      ? {
          kind: uptimeNeighborDependencyAudit.summary.assessment.kind,
          confidence: uptimeNeighborDependencyAudit.summary.assessment.confidence,
          promotionReady: uptimeNeighborDependencyAudit.summary.assessment.promotionReady,
          blocker: uptimeNeighborDependencyAudit.summary.assessment.blocker,
          localProbabilityRows: uptimeNeighborDependencyAudit.summary.localProbabilityRows,
          probabilityRowsLinkedToBranch: uptimeNeighborDependencyAudit.summary.probabilityRowsLinkedToBranch,
          hasExplicitUptime: uptimeNeighborDependencyAudit.summary.hasExplicitUptime,
          hasNumericUptime: uptimeNeighborDependencyAudit.summary.hasNumericUptime,
          finding: uptimeNeighborDependencyAudit.summary.assessment.finding,
          nextAction: uptimeNeighborDependencyAudit.summary.assessment.nextAction,
          evidence: uptimeNeighborDependencyAudit.summary.assessment.evidence,
        }
      : null,
    recordHeaderSourceFreshnessAssessment: recordHeaderSourceFreshnessAudit?.summary
      ? {
          kind: recordHeaderSourceFreshnessAudit.summary.assessment,
          staleOffsets: recordHeaderSourceFreshnessAudit.summary.staleOffsets,
          freshMatches: recordHeaderSourceFreshnessAudit.summary.freshMatches,
          freshCandidates: recordHeaderSourceFreshnessAudit.summary.freshCandidates,
          neighborHits: recordHeaderSourceFreshnessAudit.summary.neighborHits,
          promotionReady: recordHeaderSourceFreshnessAudit.summary.promotionReady,
          nextAction: recordHeaderSourceFreshnessAudit.summary.nextAction,
        }
      : null,
  };
}

function findDefinitionTarget(definitionAsset, role) {
  return (definitionAsset?.targets ?? []).find((target) => target.role === role) ?? null;
}

function exportOptimizerAsset(asset, candidates) {
  const damageFormulas = (asset.formulas ?? []).filter((formula) => formula.dpsRole?.role === "damage-coefficient");
  const supportFormulas = (asset.formulas ?? []).filter((formula) => formula.dpsRole?.role !== "damage-coefficient");
  return {
    assetId: asset.assetId,
    label: inferOptimizerAssetLabel(asset, candidates),
    tags: asset.tags ?? [],
    source: asset.source ?? null,
    strict: {
      estimatedDps: Number(asset.estimatedDps ?? 0),
      components: asset.components ?? {},
      method: "strict-reviewed-dps",
      authority: "authoritative-for-current-optimizer",
    },
    formulas: {
      damage: damageFormulas.map(exportOptimizerFormula),
      support: supportFormulas.map(exportOptimizerFormula),
    },
    candidates: candidates.map(exportOptimizerCandidate),
    ui: {
      showCandidateWarning: candidates.some((candidate) => candidate.promotionStatus?.kind === "blocked-for-real-dps"),
      candidateSummary: summarizeOptimizerCandidates(candidates),
    },
  };
}

function exportOptimizerFormula(formula) {
  return {
    nodeId: formula.nodeId,
    expression: formula.expression,
    canonicalExpression: formula.canonicalExpression,
    value: formula.value,
    role: formula.dpsRole ?? null,
  };
}

function exportOptimizerCandidate(candidate) {
  return {
    assetId: candidate.assetId,
    canonicalId: candidate.canonicalId,
    slot: candidate.slot,
    role: candidate.role,
    target: candidate.target,
    candidateFormula: candidate.candidateFormula,
    scenarioValue: candidate.scenarioValue,
    confidence: candidate.confidence,
    ownerCandidate: candidate.ownerCandidate,
    triggerCandidate: candidate.triggerCandidate,
    scenarioImpact: candidate.scenarioImpact,
    promotionStatus: candidate.promotionStatus,
    evidence: candidate.evidence,
  };
}

function inferOptimizerAssetLabel(asset, candidates) {
  const candidateTarget = candidates.find((candidate) => candidate.target)?.target;
  if (candidateTarget) return candidateTarget;
  const powerTag = (asset.tags ?? []).find((tag) => /Spiritborn|Necromancer|Paladin|PowerTag|Affix|Unique|Legendary/i.test(tag));
  return powerTag ? `${powerTag} asset ${asset.assetId}` : `Asset ${asset.assetId}`;
}

function summarizeOptimizerCandidates(candidates) {
  if (!candidates.length) {
    return {
      kind: "none",
      text: "No conditional candidate is attached to this asset.",
    };
  }
  const blocked = candidates.filter((candidate) => candidate.promotionStatus?.kind === "blocked-for-real-dps").length;
  return {
    kind: blocked ? "blocked-candidates-present" : "candidates-present",
    text: blocked
      ? `${blocked} conditional candidate(s) are available as what-if explanations but blocked for real DPS.`
      : `${candidates.length} conditional candidate(s) are available.`,
  };
}

function extractCandidateSf32(sf32Relation, summary = {}) {
  const expression = sf32Relation?.to ?? summary?.candidateSf32Value ?? "";
  const coefficientMatch = /(^|[^0-9.])([0-9]+(?:\.[0-9]+)?)\s*\*/.exec(expression);
  const coefficient = coefficientMatch ? Number(coefficientMatch[2]) : null;
  return {
    expression,
    scenarioValue: Number.isFinite(coefficient) ? coefficient : null,
  };
}

function findMatchingCandidateScenario(assetScenarios, sf32Value) {
  if (!assetScenarios || !Number.isFinite(sf32Value)) return null;
  return (assetScenarios.scenarios ?? []).find((scenario) =>
    Number(scenario.inputs?.sf33) !== 0 && Math.abs(Number(scenario.inputs?.sf32) - sf32Value) <= 1e-9
  ) ?? null;
}

function defaultConditionalSfScenarios() {
  return [
    { id: "sf33-zero-base", label: "SF_33 = 0, branche base", sf33: 0, sf32: 0 },
    { id: "sf33-active-no-scaling", label: "SF_33 actif, SF_32 = 0", sf33: 1, sf32: 0 },
    { id: "sf33-active-sf32-10pct", label: "SF_33 actif, SF_32 = 10%", sf33: 1, sf32: 0.1 },
    { id: "sf33-active-sf32-30pct", label: "SF_33 actif, SF_32 = 30%", sf33: 1, sf32: 0.3 },
    { id: "sf33-active-sf32-50pct", label: "SF_33 actif, SF_32 = 50%", sf33: 1, sf32: 0.5 },
  ];
}

function buildAssetConditionalSfScenarios(asset, compositionAsset, scenarioInputs) {
  const keptNodeIds = new Set(compositionAsset?.deduped?.keptTerms ?? []);
  const conditionalTerms = (asset.conditionalDamageFormulas ?? [])
    .filter((formula) => keptNodeIds.size === 0 || keptNodeIds.has(formula.nodeId))
    .map((formula) => buildConditionalScenarioTerm(formula))
    .filter(Boolean);
  const otherTerms = (compositionAsset?.damageTerms ?? [])
    .filter((term) => !conditionalTerms.some((conditional) => conditional.nodeId === term.nodeId))
    .filter((term) => !compositionAsset?.dedupe?.removedTerms?.some((removed) => removed.nodeId === term.nodeId))
    .map((term) => ({
      nodeId: term.nodeId,
      kind: "static-damage-term",
      value: Number(term.value),
      expression: term.expression,
    }))
    .filter((term) => Number.isFinite(term.value));
  const baselineDps = Number(compositionAsset?.current?.estimatedDps ?? asset.model?.estimatedDps ?? 0);
  const strictPrimary = Number(compositionAsset?.current?.primaryDamageCoefficient ?? asset.model?.primaryDamageCoefficient ?? 0);
  const dpsPerCoefficient = strictPrimary > 0 ? baselineDps / strictPrimary : 0;
  const scenarios = scenarioInputs.map((scenario) =>
    evaluateConditionalSfScenario(scenario, conditionalTerms, otherTerms, strictPrimary, baselineDps, dpsPerCoefficient)
  );

  return {
    assetId: asset.assetId,
    tags: asset.tags,
    model: asset.model,
    dedupedComposition: compositionAsset
      ? {
          rawSumCoefficient: compositionAsset.raw?.sumCoefficient ?? null,
          dedupedSumCoefficient: compositionAsset.deduped?.sumCoefficient ?? null,
          removedTerms: (compositionAsset.dedupe?.removedTerms ?? []).map((term) => term.nodeId),
          currentPrimaryDamageCoefficient: strictPrimary,
        }
      : null,
    conditionalTerms,
    otherTerms,
    scenarios,
    recommendation: recommendConditionalSfScenarios(scenarios),
  };
}

function buildConditionalScenarioTerm(formula) {
  const modelValue = Number(formula.modelValue);
  const baseCoefficient = Number(formula.baseCoefficient);
  if (!Number.isFinite(modelValue) || !Number.isFinite(baseCoefficient) || baseCoefficient === 0) return null;
  const inferredTableValue = modelValue / baseCoefficient;
  return {
    nodeId: formula.nodeId,
    kind: "conditional-sf-damage-term",
    expression: formula.expression,
    baseCoefficient,
    boostedCoefficient: Number(formula.boostedCoefficient),
    inferredTableValue,
    conditionSfRefs: formula.conditionSfRefs ?? [],
    scalingSfRefs: formula.scalingSfRefs ?? [],
  };
}

function evaluateConditionalSfScenario(scenario, conditionalTerms, otherTerms, strictPrimary, baselineDps, dpsPerCoefficient) {
  const sf33 = Number(scenario.sf33);
  const sf32 = Number(scenario.sf32);
  const evaluatedConditionalTerms = conditionalTerms.map((term) => {
    const branch = sf33 === 0 ? "base" : "boosted";
    const coefficient = term.baseCoefficient * term.inferredTableValue * (branch === "boosted" ? 1 + sf32 : 1);
    return {
      nodeId: term.nodeId,
      branch,
      coefficient: roundFloat(coefficient),
      formulaCoefficient: term.baseCoefficient,
      inferredTableValue: roundFloat(term.inferredTableValue),
    };
  });
  const evaluatedOtherTerms = otherTerms.map((term) => ({
    nodeId: term.nodeId,
    coefficient: roundFloat(term.value),
    expression: term.expression,
  }));
  const allCoefficients = [
    ...evaluatedConditionalTerms.map((term) => term.coefficient),
    ...evaluatedOtherTerms.map((term) => term.coefficient),
  ].filter(Number.isFinite);
  const primaryDamageCoefficient = allCoefficients.length ? Math.max(...allCoefficients) : 0;
  const sumCoefficient = allCoefficients.reduce((sum, value) => sum + value, 0);
  const estimatedDps = primaryDamageCoefficient * dpsPerCoefficient;
  return {
    id: scenario.id,
    label: scenario.label,
    inputs: { sf33, sf32 },
    primaryDamageCoefficient: roundFloat(primaryDamageCoefficient),
    sumCoefficient: roundFloat(sumCoefficient),
    estimatedDps: roundFloat(estimatedDps),
    deltaVsStrictDps: roundFloat(estimatedDps - baselineDps),
    deltaVsStrictPct: safePct(estimatedDps - baselineDps, baselineDps),
    conditionalTerms: evaluatedConditionalTerms,
    otherTerms: evaluatedOtherTerms,
    recommendation: recommendConditionalSfScenario(primaryDamageCoefficient, strictPrimary, scenario),
  };
}

function recommendConditionalSfScenario(primaryDamageCoefficient, strictPrimary, scenario) {
  if (primaryDamageCoefficient > strictPrimary + 1e-9) {
    return {
      kind: "candidate-dps-increase-if-condition-owned",
      confidence: "medium",
      note: "Scenario exceeds strict max; requires proof that SF_32 value and SF_33 branch are reachable with this uptime.",
    };
  }
  if (primaryDamageCoefficient < strictPrimary - 1e-9) {
    return {
      kind: "below-strict-fallback",
      confidence: "medium",
      note: "Scenario is below the strict max and should not replace fallback DPS.",
    };
  }
  return {
    kind: Number(scenario.sf33) === 0 ? "matches-strict-base" : "matches-strict-without-extra-scaling",
    confidence: "high",
    note: "Scenario matches the current strict max coefficient.",
  };
}

function recommendConditionalSfScenarios(scenarios) {
  const increases = scenarios.filter((scenario) => scenario.recommendation.kind === "candidate-dps-increase-if-condition-owned");
  if (increases.length > 0) {
    return {
      kind: "resolve-sf32-source-and-uptime",
      confidence: "medium",
      note: "Boosted scenarios can exceed strict DPS; next step is to identify SF_32 value source, SF_33 trigger, and uptime.",
    };
  }
  return {
    kind: "keep-strict-fallback",
    confidence: "high",
    note: "No scenario exceeds the strict fallback with current inputs.",
  };
}

function buildConditionalDedupeIndex(conditionalDedupe) {
  const index = new Map();
  for (const asset of conditionalDedupe.assets ?? []) {
    const safeGroups = (asset.duplicateGroups ?? []).filter((group) => group.recommendation?.kind === "dedupe-for-overcount-prevention");
    if (!safeGroups.length) continue;
    index.set(String(asset.assetId), safeGroups);
  }
  return index;
}

function auditAssetDedupedDamageComposition(asset, safeDedupeGroups) {
  const audit = auditAssetDamageComponents(asset);
  const removals = new Map();
  for (const group of safeDedupeGroups) {
    const formulas = (group.formulas ?? []).map((formula) => formula.nodeId).filter(Boolean);
    for (const nodeId of formulas.slice(1)) {
      removals.set(nodeId, {
        nodeId,
        groupKey: group.key,
        keptNodeId: formulas[0],
        reason: group.recommendation?.kind ?? "dedupe-for-overcount-prevention",
      });
    }
  }

  const removedTerms = audit.damageTerms
    .filter((term) => removals.has(term.nodeId))
    .map((term) => ({
      ...term,
      dedupe: removals.get(term.nodeId),
    }));
  const keptTerms = audit.damageTerms.filter((term) => !removals.has(term.nodeId));
  const dedupedSumCoefficient = keptTerms.reduce((sum, term) => sum + term.value, 0);
  const removedCoefficient = removedTerms.reduce((sum, term) => sum + term.value, 0);
  const currentPrimary = Number(audit.current.primaryDamageCoefficient ?? 0);
  const dedupedPrimary = keptTerms.length ? Math.max(...keptTerms.map((term) => term.value)) : 0;

  return {
    assetId: audit.assetId,
    tags: audit.tags,
    current: audit.current,
    raw: {
      sumCoefficient: audit.alternatives.sumCoefficient,
      sumMinusMax: audit.alternatives.sumMinusMax,
      summedEstimatedDps: audit.alternatives.summedEstimatedDps,
    },
    deduped: {
      sumCoefficient: dedupedSumCoefficient,
      sumMinusMax: dedupedSumCoefficient - currentPrimary,
      summedEstimatedDps:
        Number(asset.components?.weaponDamage ?? 0) *
        Number(asset.components?.attackSpeed ?? 0) *
        dedupedSumCoefficient *
        Number(asset.components?.multiplierProduct ?? 1) *
        Number(asset.components?.uptimeProduct ?? 1),
      keptTerms: keptTerms.map((term) => term.nodeId),
    },
    dedupe: {
      safeGroups: safeDedupeGroups.length,
      removedTerms,
      removedCoefficient,
    },
    strictImpact: {
      dedupedPrimaryDamageCoefficient: dedupedPrimary,
      changesStrictPrimary: Math.abs(dedupedPrimary - currentPrimary) > 1e-9,
    },
    recommendation: recommendDedupedDamageComposition(audit, removedTerms, dedupedSumCoefficient, dedupedPrimary),
    damageTerms: audit.damageTerms,
  };
}

function recommendDedupedDamageComposition(audit, removedTerms, dedupedSumCoefficient, dedupedPrimary) {
  const currentPrimary = Number(audit.current.primaryDamageCoefficient ?? 0);
  if (removedTerms.length === 0) {
    return {
      kind: "no-safe-conditional-dedupe",
      confidence: "medium",
      note: "No safe conditional duplicate was removed for this asset.",
    };
  }
  if (Math.abs(dedupedPrimary - currentPrimary) > 1e-9) {
    return {
      kind: "review-before-dps-change",
      confidence: "medium",
      note: "A removed duplicate affects the selected max coefficient; gameplay ownership must be reviewed before changing DPS.",
    };
  }
  if (Math.abs(dedupedSumCoefficient - currentPrimary) <= 1e-9) {
    return {
      kind: "dedupe-sum-now-equals-strict",
      confidence: "high",
      note: "Safe duplicate removal makes the sum audit match the strict max coefficient.",
    };
  }
  return {
    kind: "dedupe-sum-audit-only",
    confidence: "high",
    note: "Safe duplicate removal reduces sum overcount while leaving strict max DPS unchanged.",
  };
}

function inspectAssetConditionalDamageDedupe(asset, options) {
  const groupsByExpression = groupBy(
    asset.conditionalDamageFormulas ?? [],
    (formula) => normalizePromotionExpression(formula.expression)
  );
  const duplicateGroups = Array.from(groupsByExpression.entries())
    .filter(([, formulas]) => formulas.length > 1)
    .map(([key, formulas]) => inspectConditionalDuplicateGroup(key, formulas, asset));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    model: asset.model,
    duplicateGroups,
    uniqueConditionalDamageFormulas: Array.from(groupsByExpression.values()).length,
    recommendation: recommendConditionalDedupeAsset(duplicateGroups),
  };
}

function inspectConditionalDuplicateGroup(key, formulas, asset) {
  const sorted = formulas.slice().sort((a, b) => a.offset - b.offset);
  const offsets = sorted.map((formula) => formula.offset).filter(Number.isFinite);
  const bytecodeOffsets = sorted.map((formula) => formula.bytecodeOffset).filter(Number.isFinite);
  const modelValues = Array.from(new Set(sorted.map((formula) => Number(formula.modelValue)).filter(Number.isFinite))).sort((a, b) => b - a);
  const coefficients = Array.from(new Set(sorted.map((formula) => Number(formula.baseCoefficient)).filter(Number.isFinite))).sort((a, b) => b - a);
  const strictPrimary = Number(asset.model?.primaryDamageCoefficient ?? 0);
  const modelValue = modelValues[0] ?? null;
  const wouldChangeStrictPrimary = Number.isFinite(modelValue) && modelValue > strictPrimary;
  const duplicateOvercountCoefficient = modelValues.reduce((sum, value) => sum + value, 0) * Math.max(0, formulas.length - 1);
  return {
    key,
    formulas: sorted.map((formula) => ({
      nodeId: formula.nodeId,
      offset: formula.offset,
      bytecodeOffset: formula.bytecodeOffset,
      expression: formula.expression,
      modelValue: formula.modelValue,
      condition: formula.condition,
      conditionSfRefs: formula.conditionSfRefs,
      scalingSfRefs: formula.scalingSfRefs,
      baseCoefficient: formula.baseCoefficient,
      boostedCoefficient: formula.boostedCoefficient,
    })),
    formulaCount: formulas.length,
    coefficient: coefficients[0] ?? null,
    modelValue,
    spacing: {
      stringOffsetSpan: offsets.length ? offsets[offsets.length - 1] - offsets[0] : null,
      bytecodeOffsetSpan: bytecodeOffsets.length ? bytecodeOffsets[bytecodeOffsets.length - 1] - bytecodeOffsets[0] : null,
      stringOffsets: offsets,
      bytecodeOffsets,
    },
    strictImpact: {
      strictPrimaryDamageCoefficient: strictPrimary,
      changesStrictPrimary: wouldChangeStrictPrimary,
      duplicateOvercountCoefficient,
      note: wouldChangeStrictPrimary
        ? "A duplicate value exceeds the strict primary coefficient; review before dedupe."
        : "Duplicate value is not above strict primary; dedupe prevents sum overcount without changing strict max.",
    },
    recommendation: recommendConditionalDuplicateGroup(formulas, strictPrimary, modelValue),
  };
}

function recommendConditionalDuplicateGroup(formulas, strictPrimary, modelValue) {
  const sameModelValue = new Set(formulas.map((formula) => Number(formula.modelValue)).filter(Number.isFinite)).size <= 1;
  const sameSfShape = new Set(formulas.map((formula) => `${formula.conditionSfRefs.join(",")}|${formula.scalingSfRefs.join(",")}`)).size <= 1;
  if (sameModelValue && sameSfShape && Number(modelValue) <= strictPrimary) {
    return {
      kind: "dedupe-for-overcount-prevention",
      confidence: "high",
      note: "Duplicate conditional damage formulas have the same value and SF shape; dedupe for sums/audits while keeping strict max unchanged.",
    };
  }
  return {
    kind: "review-rank-or-variant-ownership",
    confidence: "medium",
    note: "Duplicate-looking formulas differ in value/SF shape or may affect strict primary; inspect ownership before dedupe.",
  };
}

function recommendConditionalDedupeAsset(duplicateGroups) {
  if (duplicateGroups.length === 0) {
    return {
      kind: "no-duplicates",
      confidence: "medium",
      note: "No duplicate conditional damage groups were found.",
    };
  }
  if (duplicateGroups.every((group) => group.recommendation.kind === "dedupe-for-overcount-prevention")) {
    return {
      kind: "dedupe-safe-for-strict-model",
      confidence: "high",
      note: "All duplicate groups can be deduped for overcount prevention without changing strict max DPS.",
    };
  }
  return {
    kind: "dedupe-needs-ownership-review",
    confidence: "medium",
    note: "At least one duplicate group needs rank/variant ownership review.",
  };
}

function applyBranchAwarenessToAsset(asset, branchAsset) {
  if (!branchAsset) return asset;
  const scenarioEstimates = (branchAsset.scenarioMappings ?? []).map((mapping) => estimateBranchScenario(asset, mapping));
  return {
    ...asset,
    estimatedDps: asset.estimatedDps,
    branchAwareness: {
      status: branchAsset.recommendation?.kind === "keep-strict-max-fallback" ? "strict-fallback-required" : "candidate-review",
      recommendation: branchAsset.recommendation,
      collisionAnalysis: branchAsset.collisionAnalysis,
      strictPrimaryDamageCoefficient: asset.components?.primaryDamageCoefficient ?? null,
      strictEstimatedDps: asset.estimatedDps,
      scenarioEstimates,
      note: "Scenario estimates do not change the global strict DPS until mappings are validated.",
    },
  };
}

function estimateBranchScenario(asset, mapping) {
  const baseCoefficient = Number(asset.components?.primaryDamageCoefficient ?? 0);
  const candidate = mapping.candidateDamageBranch ?? null;
  const canApply =
    mapping.status === "candidate" &&
    ["high", "medium"].includes(mapping.confidence) &&
    candidate &&
    (candidate.kind === "zero-damage-output" || Number.isFinite(Number(candidate.coefficient)));
  const selectedCoefficient = canApply ? Number(candidate.coefficient ?? 0) : baseCoefficient;
  const estimatedDps = estimateAssetDpsWithCoefficient(asset, selectedCoefficient);
  return {
    scenarioId: mapping.scenarioId,
    selectedExpression: mapping.selectedExpression,
    mappingStatus: mapping.status,
    mappingConfidence: mapping.confidence,
    decision: canApply ? "apply-scenario-candidate" : "strict-fallback",
    selectedDamageCoefficient: selectedCoefficient,
    strictDamageCoefficient: baseCoefficient,
    estimatedDps,
    strictEstimatedDps: asset.estimatedDps,
    deltaDps: estimatedDps - Number(asset.estimatedDps ?? 0),
    candidateDamageBranch: candidate,
    blockers: mapping.blockers ?? [],
    nextAction: mapping.nextAction,
  };
}

function estimateAssetDpsWithCoefficient(asset, coefficient) {
  return (
    Number(asset.components?.weaponDamage ?? 0) *
    Number(asset.components?.attackSpeed ?? 0) *
    Number(coefficient ?? 0) *
    Number(asset.components?.multiplierProduct ?? 1) *
    Number(asset.components?.uptimeProduct ?? 1)
  );
}

function summarizeBranchAwareness(assets) {
  const branchAssets = assets.filter((asset) => asset.branchAwareness);
  const scenarioEstimates = branchAssets.flatMap((asset) => asset.branchAwareness.scenarioEstimates ?? []);
  return {
    branchAssets: branchAssets.length,
    scenarioEstimates: scenarioEstimates.length,
    appliedScenarioEstimates: scenarioEstimates.filter((row) => row.decision === "apply-scenario-candidate").length,
    fallbackScenarioEstimates: scenarioEstimates.filter((row) => row.decision === "strict-fallback").length,
    blockedScenarioEstimates: scenarioEstimates.filter((row) => row.mappingStatus === "blocked").length,
    scenarioDeltaDpsTotal: scenarioEstimates.reduce((sum, row) => sum + Number(row.deltaDps ?? 0), 0),
    statusCounts: sortCounts(countBy(branchAssets, (asset) => asset.branchAwareness.status)),
  };
}

function auditDamageComponents(model) {
  const assets = (model.assets ?? [])
    .map(auditAssetDamageComponents)
    .filter((asset) => asset.damageTerms.length > 0);
  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      builtAt: model.builtAt,
      mode: model.mode ?? "strict",
      summary: model.summary,
    },
    summary: {
      assets: assets.length,
      assetsWithMultipleDamageTerms: assets.filter((asset) => asset.damageTerms.length > 1).length,
      hiddenDamageTerms: assets.reduce((sum, asset) => sum + asset.hiddenTerms.length, 0),
      assetsWhereSumDiffersFromMax: assets.filter((asset) => Math.abs(asset.alternatives.sumCoefficient - asset.current.primaryDamageCoefficient) > 1e-9).length,
      recommendationCounts: sortCounts(
        assets.reduce((counts, asset) => {
          counts[asset.recommendation.kind] = (counts[asset.recommendation.kind] ?? 0) + 1;
          return counts;
        }, {})
      ),
      topAssets: assets
        .slice()
        .sort((a, b) => b.alternatives.sumMinusMax - a.alternatives.sumMinusMax || b.damageTerms.length - a.damageTerms.length)
        .slice(0, 20)
        .map((asset) => ({
          assetId: asset.assetId,
          damageTerms: asset.damageTerms.length,
          currentPrimary: asset.current.primaryDamageCoefficient,
          sumCoefficient: asset.alternatives.sumCoefficient,
          sumMinusMax: asset.alternatives.sumMinusMax,
          recommendation: asset.recommendation,
        })),
    },
    assets,
  };
}

function inspectDamageComponentContext(damageAudit, graphExport, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const graphByAsset = new Map((graphExport.graphs ?? []).map((graph) => [String(graph.assetId), graph]));
  const assets = (damageAudit.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) => inspectAssetDamageContext(asset, graphByAsset.get(String(asset.assetId)), options));
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      damageAuditedAt: damageAudit.auditedAt,
      graphExportedAt: graphExport.exportedAt,
    },
    summary: {
      assets: assets.length,
      damageTerms: assets.reduce((sum, asset) => sum + asset.damageTerms.length, 0),
      likelyBranches: assets.filter((asset) => asset.contextAssessment.kind === "branch-or-rank-candidate").length,
      likelyMultiHit: assets.filter((asset) => asset.contextAssessment.kind === "multi-hit-candidate").length,
      unresolved: assets.filter((asset) => asset.contextAssessment.kind === "unresolved").length,
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        recommendation: asset.auditRecommendation,
        contextAssessment: asset.contextAssessment,
      })),
    },
    assets,
  };
}

function inspectAssetDamageContext(auditAsset, graph, options) {
  const decoded = graph?.source?.filePath ? decodeBlteAt(graph.source.filePath, graph.source.blteOffset).decoded : null;
  const nodesById = new Map((graph?.nodes ?? []).map((node) => [node.id, node]));
  const damageTerms = auditAsset.damageTerms.map((term) => inspectDamageTermContext(term, nodesById.get(term.nodeId), decoded));
  return {
    assetId: auditAsset.assetId,
    tags: auditAsset.tags,
    source: graph?.source ?? null,
    auditRecommendation: auditAsset.recommendation,
    current: auditAsset.current,
    alternatives: auditAsset.alternatives,
    contextAssessment: assessDamageCompositionContext(damageTerms, auditAsset),
    damageTerms,
  };
}

function inspectDamageTermContext(term, node, decoded) {
  const nearbyStrings = decoded && node ? extractAsciiStringsNearBuffer(decoded, node.offset, 512) : [];
  return {
    nodeId: term.nodeId,
    value: term.value,
    expression: term.expression,
    canonicalExpression: term.canonicalExpression,
    tableRefs: term.tableRefs,
    offsets: {
      stringOffset: node?.offset ?? null,
    },
    localOrder: node ? null : null,
    nearby: {
      formulas: nearbyStrings.filter((item) => item.kind === "formula"),
      sfSymbols: nearbyStrings.filter((item) => item.kind === "sf-symbol"),
      externalRefs: nearbyStrings.filter((item) => item.kind === "external-ref"),
      numericConstants: nearbyStrings.filter((item) => item.kind === "numeric-constant"),
    },
  };
}

function assessDamageCompositionContext(damageTerms, auditAsset) {
  const tableShapeKeys = new Set(damageTerms.flatMap((term) => term.tableRefs.map((ref) => `${ref.tableId}:${ref.argument}`)));
  const values = damageTerms.map((term) => Number(term.value)).filter(Number.isFinite).sort((a, b) => b - a);
  const offsets = damageTerms.map((term) => term.offsets.stringOffset).filter(Number.isFinite).sort((a, b) => a - b);
  const tightCluster = offsets.length > 1 && offsets[offsets.length - 1] - offsets[0] < 512;
  const sameTableShape = tableShapeKeys.size === 1;
  const valueRatios = values.slice(1).map((value) => value / values[0]);

  if (sameTableShape && tightCluster && valueRatios.every((ratio) => ratio > 0.25)) {
    return {
      kind: "branch-or-rank-candidate",
      confidence: "medium",
      note: "Damage formulas use the same table argument and are stored close together; likely ranks, branches, or variants rather than unconditional summed hits.",
      nextAction: "Find metadata/flags around these formulas before switching from max to sum.",
    };
  }
  if (!sameTableShape && values.length > 1) {
    return {
      kind: "multi-hit-candidate",
      confidence: "low",
      note: "Damage formulas use different table shapes; could be separate hit components.",
      nextAction: "Validate hit events or execution conditions.",
    };
  }
  if (auditAsset.recommendation.kind === "max-likely-safe") {
    return {
      kind: "max-likely-safe",
      confidence: auditAsset.recommendation.confidence,
      note: auditAsset.recommendation.note,
      nextAction: "Keep max until richer metadata is available.",
    };
  }
  return {
    kind: "unresolved",
    confidence: "low",
    note: "Local context is insufficient to choose max, sum, or branching.",
    nextAction: "Inspect decoded metadata fields or localized descriptors.",
  };
}

function extractAsciiStringsNearBuffer(buffer, offset, radius) {
  const start = Math.max(0, offset - radius);
  const end = Math.min(buffer.length, offset + radius);
  const strings = [];
  let cursor = start;
  while (cursor < end) {
    if (buffer[cursor] < 32 || buffer[cursor] > 126) {
      cursor += 1;
      continue;
    }
    const stringStart = cursor;
    while (cursor < end && buffer[cursor] >= 32 && buffer[cursor] <= 126) cursor += 1;
    const value = buffer.subarray(stringStart, cursor).toString("ascii");
    if (value.length >= 2) {
      strings.push({
        offset: stringStart,
        value,
        kind: classifyContextString(value),
      });
    }
  }
  return strings;
}

function classifyContextString(value) {
  if (/^(?:[\d.]+\s*\*\s*)?Table\(|Table\(|SF_\d|Mod\.|Pow\(|min\(/i.test(value) || /[*+/?-].*(?:SF_|Table\()/.test(value)) return "formula";
  if (/^SF_\d+$/.test(value)) return "sf-symbol";
  if (/PowerTag\.|#|Affix\./.test(value)) return "external-ref";
  if (/^[0-9]+(?:\.[0-9]+)?$/.test(value)) return "numeric-constant";
  return "other";
}

function inspectBranchControls(damageContext, graphExport, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const radius = Number.isFinite(Number(options.radius)) ? Number(options.radius) : 1600;
  const graphByAsset = new Map((graphExport.graphs ?? []).map((graph) => [String(graph.assetId), graph]));
  const assets = (damageContext.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map((asset) => inspectAssetBranchControls(asset, graphByAsset.get(String(asset.assetId)), { radius }));
  const controlKindCounts = countBy(assets.flatMap((asset) => asset.controls), (control) => control.kind);
  const recommendationCounts = countBy(assets, (asset) => asset.branchAssessment.recommendation);

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      damageContextInspectedAt: damageContext.inspectedAt,
      graphExportedAt: graphExport.exportedAt,
    },
    assumptions: {
      radius,
      note: "Controls are inferred from formula proximity and dependencies. They identify branch candidates but do not prove runtime execution order.",
    },
    summary: {
      assets: assets.length,
      damageTerms: assets.reduce((sum, asset) => sum + asset.damageTerms.length, 0),
      controls: assets.reduce((sum, asset) => sum + asset.controls.length, 0),
      assetsWithUpgradeControls: assets.filter((asset) => asset.branchAssessment.hasUpgradeControl).length,
      assetsWithExternalScaling: assets.filter((asset) => asset.branchAssessment.hasExternalScaling).length,
      controlKindCounts: sortCounts(controlKindCounts),
      recommendationCounts: sortCounts(recommendationCounts),
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        damageCluster: asset.damageCluster,
        branchAssessment: asset.branchAssessment,
        topControls: asset.controls.slice(0, 6).map((control) => ({
          nodeId: control.nodeId,
          offset: control.offset,
          kind: control.kind,
          expression: control.expression,
          distanceToDamageCluster: control.distanceToDamageCluster,
        })),
      })),
    },
    assets,
  };
}

function inspectAssetBranchControls(contextAsset, graph, options) {
  const nodes = (graph?.nodes ?? []).filter((node) => node.id?.startsWith("formula:")).sort((a, b) => a.offset - b.offset);
  const damageNodeIds = new Set((contextAsset.damageTerms ?? []).map((term) => term.nodeId));
  const damageNodes = nodes.filter((node) => damageNodeIds.has(node.id));
  const damageOffsets = damageNodes.map((node) => node.offset).filter(Number.isFinite).sort((a, b) => a - b);
  const damageCluster = summarizeDamageCluster(damageOffsets);
  const controls = nodes
    .filter((node) => !damageNodeIds.has(node.id))
    .map((node) => inspectControlNode(node, damageCluster, contextAsset.damageTerms ?? []))
    .filter((control) => control.distanceToDamageCluster <= options.radius)
    .sort((a, b) => a.distanceToDamageCluster - b.distanceToDamageCluster || a.offset - b.offset);

  return {
    assetId: contextAsset.assetId,
    tags: contextAsset.tags,
    source: graph?.source ?? contextAsset.source ?? null,
    damageCluster,
    current: contextAsset.current,
    alternatives: contextAsset.alternatives,
    contextAssessment: contextAsset.contextAssessment,
    branchAssessment: assessBranchControls(contextAsset, controls),
    damageTerms: (contextAsset.damageTerms ?? []).map((term) => ({
      nodeId: term.nodeId,
      value: term.value,
      expression: term.expression,
      canonicalExpression: term.canonicalExpression,
      offset: term.offsets?.stringOffset ?? null,
      tableRefs: term.tableRefs ?? [],
    })),
    controls,
  };
}

function summarizeDamageCluster(offsets) {
  if (!offsets.length) {
    return {
      startOffset: null,
      endOffset: null,
      span: null,
      nodes: 0,
    };
  }
  return {
    startOffset: offsets[0],
    endOffset: offsets[offsets.length - 1],
    span: offsets[offsets.length - 1] - offsets[0],
    nodes: offsets.length,
  };
}

function inspectControlNode(node, damageCluster, damageTerms) {
  const expression = node.expression ?? "";
  const flags = extractModFlags(expression);
  const sfRefs = normalizeNumberList(node.dependsOn?.sfRefs ?? []);
  const externalRefs = extractExternalRefs(node.dependsOn ?? {});
  const distanceToDamageCluster = distanceFromCluster(node.offset, damageCluster);
  return {
    nodeId: node.id,
    offset: node.offset,
    expression,
    kind: classifyBranchControl(expression, sfRefs, externalRefs, flags),
    distanceToDamageCluster,
    position: classifyPositionAgainstCluster(node.offset, damageCluster),
    flags,
    sfRefs,
    externalRefs,
    nearestDamageTerms: nearestDamageTerms(node.offset, damageTerms),
  };
}

function classifyBranchControl(expression, sfRefs, externalRefs, flags) {
  const hasTernary = /\?/.test(expression);
  const hasMod = flags.length > 0 || /Mod\.|Upgrade[A-Z]/.test(expression);
  const hasExternal = externalRefs.length > 0 || /PowerTag\.|Affix\.|#/.test(expression);
  const hasSf = sfRefs.length > 0 || /SF_\d+/.test(expression);
  if (hasMod && hasTernary) return "upgrade-branch-control";
  if (hasMod) return "upgrade-state-control";
  if (hasExternal && hasSf) return "external-sf-scaling-control";
  if (hasExternal) return "external-scaling-control";
  if (hasSf) return "sf-scaling-control";
  if (hasTernary) return "conditional-control";
  return "nearby-formula-control";
}

function assessBranchControls(contextAsset, controls) {
  const hasUpgradeControl = controls.some((control) => control.kind === "upgrade-branch-control" || control.kind === "upgrade-state-control");
  const hasExternalScaling = controls.some((control) => control.kind === "external-scaling-control" || control.kind === "external-sf-scaling-control");
  const hasSfScaling = controls.some((control) => control.kind === "sf-scaling-control" || control.kind === "external-sf-scaling-control");
  const controlKinds = Array.from(new Set(controls.map((control) => control.kind)));

  if (hasUpgradeControl) {
    return {
      kind: "explicit-branching-present",
      confidence: "high",
      hasUpgradeControl,
      hasExternalScaling,
      hasSfScaling,
      controlKinds,
      recommendation: "keep-max-until-branch-state-modeled",
      note: "Upgrade/state controls sit near the competing damage coefficients; model explicit build flags before summing them.",
    };
  }
  if (contextAsset.contextAssessment?.kind === "branch-or-rank-candidate" && (hasExternalScaling || hasSfScaling)) {
    return {
      kind: "nearby-scaling-variants",
      confidence: "medium",
      hasUpgradeControl,
      hasExternalScaling,
      hasSfScaling,
      controlKinds,
      recommendation: "keep-max-and-add-branch-review",
      note: "Nearby scaling formulas suggest variants or chained effects, but no explicit upgrade flag was found.",
    };
  }
  return {
    kind: "no-clear-branch-control",
    confidence: "low",
    hasUpgradeControl,
    hasExternalScaling,
    hasSfScaling,
    controlKinds,
    recommendation: "manual-review-before-summing",
    note: "No clear nearby control explains the competing damage coefficients.",
  };
}

function exportBuildStateTemplate(branchControls, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const assets = (branchControls.assets ?? [])
    .filter((asset) => !requestedAssetIds || requestedAssetIds.has(String(asset.assetId)))
    .map(buildAssetStateTemplate);
  const flags = mergeStateEntries(assets.flatMap((asset) => asset.requiredState.flags));
  const localScriptValues = mergeStateEntries(assets.flatMap((asset) => asset.requiredState.localScriptValues));
  const externalValues = mergeStateEntries(assets.flatMap((asset) => asset.requiredState.externalValues));

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      branchControlsInspectedAt: branchControls.inspectedAt,
      branchControlsSummary: branchControls.summary,
    },
    assumptions: {
      note: "Editable build-state template. Unknown values stay null; branch-aware DPS should fall back to strict max damage until a branch selector is mapped.",
    },
    summary: {
      assets: assets.length,
      flags: flags.length,
      localScriptValues: localScriptValues.length,
      externalValues: externalValues.length,
      branchReadyAssets: assets.filter((asset) => asset.damageSelection.status === "needs-branch-mapping").length,
    },
    state: {
      flags,
      localScriptValues,
      externalValues,
    },
    scenarios: buildDefaultScenarios(flags),
    assets,
  };
}

function buildAssetStateTemplate(asset) {
  const controls = asset.controls ?? [];
  const requiredState = {
    flags: mergeStateEntries(controls.flatMap((control) => buildFlagStateEntries(asset.assetId, control))),
    localScriptValues: mergeStateEntries(controls.flatMap((control) => buildLocalScriptStateEntries(asset.assetId, control))),
    externalValues: mergeStateEntries(controls.flatMap((control) => buildExternalStateEntries(asset.assetId, control))),
  };
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    branchAssessment: asset.branchAssessment,
    damageSelection: {
      currentMode: asset.current?.method ?? "max-damage-coefficient",
      currentPrimaryDamageCoefficient: asset.current?.primaryDamageCoefficient ?? null,
      alternativeSumCoefficient: asset.alternatives?.sumCoefficient ?? null,
      status: asset.branchAssessment?.hasUpgradeControl ? "needs-branch-mapping" : "strict-fallback",
      recommendedFallback: "max-damage-coefficient",
      note: "Map control formulas to damage terms before replacing max with conditional selection.",
    },
    damageBranches: (asset.damageTerms ?? []).map((term) => ({
      nodeId: term.nodeId,
      coefficient: term.value,
      expression: term.expression,
      canonicalExpression: term.canonicalExpression,
      offset: term.offset,
      condition: null,
      conditionStatus: "unmapped",
    })),
    controls: controls.map((control) => ({
      nodeId: control.nodeId,
      kind: control.kind,
      expression: control.expression,
      flags: control.flags ?? [],
      sfRefs: control.sfRefs ?? [],
      externalRefs: control.externalRefs ?? [],
      distanceToDamageCluster: control.distanceToDamageCluster,
    })),
    requiredState,
  };
}

function buildFlagStateEntries(assetId, control) {
  return (control.flags ?? []).map((flag) => ({
    id: `Mod.${flag}`,
    kind: "boolean-flag",
    defaultValue: false,
    label: flag,
    source: {
      assetId,
      controlNodeId: control.nodeId,
      expression: control.expression,
    },
    note: "Set from selected skill upgrade/rune/build option.",
  }));
}

function buildLocalScriptStateEntries(assetId, control) {
  return (control.sfRefs ?? []).map((sfIndex) => ({
    id: `sf:${assetId}:${sfIndex}`,
    kind: "local-script-formula",
    defaultValue: null,
    source: {
      assetId,
      sfIndex,
      controlNodeId: control.nodeId,
      expression: control.expression,
    },
    note: "Resolve from local SF definition or leave null until the extractor maps this script formula.",
  }));
}

function buildExternalStateEntries(assetId, control) {
  return (control.externalRefs ?? []).map((ref) => ({
    id: externalStateId(ref),
    kind: ref.kind,
    defaultValue: null,
    source: {
      assetId,
      controlNodeId: control.nodeId,
      expression: control.expression,
      ref,
    },
    note: "Resolve from another PowerTag, affix property, hash reference, item, or paragon source.",
  }));
}

function externalStateId(ref) {
  if (ref.kind === "powerTag") return `PowerTag.${ref.key}.${ref.field}`;
  if (ref.kind === "affixProperty") return `Affix.${ref.key}.${ref.field}`;
  if (ref.kind === "hashRef") return `${ref.key}#${ref.target}`;
  return `${ref.kind}:${ref.key ?? "unknown"}`;
}

function mergeStateEntries(entries) {
  const byId = new Map();
  for (const entry of entries) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, {
        ...entry,
        sources: entry.sources ?? [entry.source].filter(Boolean),
      });
      delete byId.get(entry.id).source;
    } else {
      byId.get(entry.id).sources.push(...(entry.sources ?? [entry.source].filter(Boolean)));
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function buildDefaultScenarios(flags) {
  const baseline = {
    id: "baseline-no-upgrades",
    label: "No explicit upgrade flags",
    flags: Object.fromEntries(flags.map((flag) => [flag.id, false])),
  };
  const singleFlagScenarios = flags.map((flag) => ({
    id: `${flag.id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}-enabled`,
    label: `${flag.id} enabled`,
    flags: Object.fromEntries(flags.map((candidate) => [candidate.id, candidate.id === flag.id])),
  }));
  return [baseline, ...singleFlagScenarios];
}

function evaluateBuildStateScenarios(buildState, options = {}) {
  const requestedScenarioIds = options.scenarioIds?.length ? new Set(options.scenarioIds.map(String)) : null;
  const scenarios = (buildState.scenarios ?? [])
    .filter((scenario) => !requestedScenarioIds || requestedScenarioIds.has(String(scenario.id)))
    .map((scenario) => evaluateBuildStateScenario(buildState, scenario));
  const controlStatuses = countBy(scenarios.flatMap((scenario) => scenario.assets.flatMap((asset) => asset.controls)), (control) => control.status);
  const assetStatuses = countBy(scenarios.flatMap((scenario) => scenario.assets), (asset) => asset.damageSelection.status);

  return {
    evaluatedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      buildStateGeneratedAt: buildState.generatedAt,
      buildStateSummary: buildState.summary,
    },
    assumptions: {
      note: "Scenario evaluation resolves known boolean flags and simple ternary selectors. It does not yet map selected selector outputs to final damage branches.",
    },
    summary: {
      scenarios: scenarios.length,
      assets: buildState.assets?.length ?? 0,
      controls: scenarios.reduce((sum, scenario) => sum + scenario.assets.reduce((assetSum, asset) => assetSum + asset.controls.length, 0), 0),
      controlStatuses: sortCounts(controlStatuses),
      assetStatuses: sortCounts(assetStatuses),
    },
    scenarios,
  };
}

function evaluateBuildStateScenario(buildState, scenario) {
  const flags = {
    ...Object.fromEntries((buildState.state?.flags ?? []).map((flag) => [flag.id, flag.defaultValue ?? false])),
    ...(scenario.flags ?? {}),
  };
  const assets = (buildState.assets ?? []).map((asset) => evaluateAssetScenario(asset, flags));
  return {
    id: scenario.id,
    label: scenario.label,
    flags,
    summary: {
      assets: assets.length,
      controlsResolved: assets.reduce((sum, asset) => sum + asset.controls.filter((control) => control.status === "resolved").length, 0),
      controlsPartiallyResolved: assets.reduce((sum, asset) => sum + asset.controls.filter((control) => control.status === "partially-resolved").length, 0),
      controlsUnresolved: assets.reduce((sum, asset) => sum + asset.controls.filter((control) => control.status === "unresolved").length, 0),
    },
    assets,
  };
}

function evaluateAssetScenario(asset, flags) {
  const controls = (asset.controls ?? []).map((control) => evaluateControlScenario(control, flags, asset.assetId));
  const branchControls = controls.filter((control) => control.kind === "upgrade-branch-control" || control.kind === "conditional-control");
  const selectorResolved = branchControls.some((control) => control.status === "resolved" || control.status === "partially-resolved");
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    damageSelection: {
      ...asset.damageSelection,
      status: selectorResolved ? "selector-resolved-branch-unmapped" : asset.damageSelection?.status ?? "strict-fallback",
      selectedSelectors: branchControls.map((control) => ({
        nodeId: control.nodeId,
        expression: control.expression,
        selectedExpression: control.selectedExpression,
        unresolvedRefs: control.unresolvedRefs,
        status: control.status,
      })),
      activeDamageBranch: null,
      fallbackCoefficient: asset.damageSelection?.currentPrimaryDamageCoefficient ?? null,
    },
    damageBranches: asset.damageBranches ?? [],
    controls,
  };
}

function evaluateControlScenario(control, flags, assetId) {
  const resolved = resolveScenarioExpression(control.expression, flags, assetId);
  return {
    nodeId: control.nodeId,
    kind: control.kind,
    expression: control.expression,
    selectedExpression: resolved.expression,
    status: resolved.status,
    reason: resolved.reason,
    unresolvedRefs: resolved.unresolvedRefs,
    flagsUsed: resolved.flagsUsed,
  };
}

function resolveScenarioExpression(expression, flags, assetId) {
  const normalized = stripOuterParens(String(expression ?? "").trim());
  const ternary = splitTopLevelTernary(normalized);
  if (ternary) {
    const condition = evaluateScenarioCondition(ternary.condition, flags);
    if (condition.status !== "resolved") {
      return {
        expression: normalized,
        status: "unresolved",
        reason: `Condition is not resolved: ${ternary.condition.trim()}`,
        unresolvedRefs: extractUnresolvedExpressionRefs(normalized, assetId),
        flagsUsed: condition.flagsUsed,
      };
    }
    const selected = condition.value ? ternary.whenTrue : ternary.whenFalse;
    const resolvedSelected = resolveScenarioExpression(selected, flags, assetId);
    return {
      ...resolvedSelected,
      reason: `${ternary.condition.trim()} resolved to ${condition.value}; selected ${stripOuterParens(selected.trim())}`,
      flagsUsed: Array.from(new Set([...(condition.flagsUsed ?? []), ...(resolvedSelected.flagsUsed ?? [])])).sort(),
    };
  }
  const unresolvedRefs = extractUnresolvedExpressionRefs(normalized, assetId);
  return {
    expression: normalized,
    status: unresolvedRefs.length ? "partially-resolved" : "resolved",
    reason: unresolvedRefs.length ? "Expression selected, but referenced values are still unresolved." : "Expression selected and contains no unresolved refs.",
    unresolvedRefs,
    flagsUsed: extractModFlags(normalized).map((flag) => `Mod.${flag}`),
  };
}

function evaluateScenarioCondition(expression, flags) {
  const normalized = stripOuterParens(String(expression ?? "").trim());
  const negated = normalized.startsWith("!");
  const flagExpression = negated ? stripOuterParens(normalized.slice(1).trim()) : normalized;
  const flagMatch = /^Mod\.([A-Za-z0-9_]+)$/.exec(flagExpression);
  if (flagMatch) {
    const id = `Mod.${flagMatch[1]}`;
    return {
      status: Object.prototype.hasOwnProperty.call(flags, id) ? "resolved" : "unresolved",
      value: Boolean(flags[id]) !== negated,
      flagsUsed: [id],
    };
  }
  if (/^(?:true|false)$/i.test(normalized)) {
    return {
      status: "resolved",
      value: /^true$/i.test(normalized),
      flagsUsed: [],
    };
  }
  return {
    status: "unresolved",
    value: null,
    flagsUsed: extractModFlags(normalized).map((flag) => `Mod.${flag}`),
  };
}

function splitTopLevelTernary(expression) {
  let depth = 0;
  let question = -1;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "?" && depth === 0) {
      question = i;
      break;
    }
  }
  if (question < 0) return null;
  depth = 0;
  for (let i = question + 1; i < expression.length; i += 1) {
    const char = expression[i];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === ":" && depth === 0) {
      return {
        condition: expression.slice(0, question).trim(),
        whenTrue: expression.slice(question + 1, i).trim(),
        whenFalse: expression.slice(i + 1).trim(),
      };
    }
  }
  return null;
}

function stripOuterParens(value) {
  let expression = value;
  while (expression.startsWith("(") && expression.endsWith(")") && outerParensWrapExpression(expression)) {
    expression = expression.slice(1, -1).trim();
  }
  return expression;
}

function outerParensWrapExpression(expression) {
  let depth = 0;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth === 0 && i < expression.length - 1) return false;
  }
  return depth === 0;
}

function extractUnresolvedExpressionRefs(expression, assetId) {
  const refs = [];
  const sfRegex = /SF_(\d+)/g;
  let sfMatch;
  while ((sfMatch = sfRegex.exec(expression))) {
    refs.push({
      kind: "local-script-formula",
      id: `sf:${assetId}:${Number(sfMatch[1])}`,
      token: sfMatch[0],
    });
  }
  for (const flag of extractModFlags(expression)) {
    refs.push({
      kind: "boolean-flag",
      id: `Mod.${flag}`,
      token: `Mod.${flag}`,
    });
  }
  const powerTagRegex = /PowerTag\.([A-Za-z0-9_]+)\."([^"]+)"/g;
  let powerMatch;
  while ((powerMatch = powerTagRegex.exec(expression))) {
    refs.push({
      kind: "powerTag",
      id: `PowerTag.${powerMatch[1]}.${powerMatch[2]}`,
      token: powerMatch[0],
    });
  }
  const hashRegex = /([A-Za-z0-9_]+)#([A-Za-z0-9_]+)/g;
  let hashMatch;
  while ((hashMatch = hashRegex.exec(expression))) {
    refs.push({
      kind: "hashRef",
      id: `${hashMatch[1]}#${hashMatch[2]}`,
      token: hashMatch[0],
    });
  }
  return refs;
}

function inspectScenarioSfMappings(scenarioEvaluation, sfCandidateExport, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const candidatesByAsset = new Map((sfCandidateExport.graphs ?? []).map((graph) => [String(graph.assetId), graph]));
  const assets = collectScenarioMappingAssets(scenarioEvaluation, requestedAssetIds).map((asset) =>
    inspectAssetScenarioSfMappings(asset, candidatesByAsset.get(String(asset.assetId)))
  );
  const selectedRefs = assets.flatMap((asset) => asset.scenarios.flatMap((scenario) => scenario.selectedRefs));
  const allRefs = assets.flatMap((asset) => asset.requiredRefs);

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      scenariosEvaluatedAt: scenarioEvaluation.evaluatedAt,
      sfCandidatesExportedAt: sfCandidateExport.exportedAt,
    },
    assumptions: {
      note: "This report maps scenario-selected SF refs to local SF symbols when available. It does not prove runtime damage branch ownership yet.",
    },
    summary: {
      assets: assets.length,
      scenarios: (scenarioEvaluation.scenarios ?? []).length,
      selectedSfRefs: selectedRefs.length,
      selectedSfRefsWithLocalSymbol: selectedRefs.filter((ref) => ref.localSymbolStatus === "found").length,
      selectedSfRefsMissingLocalSymbol: selectedRefs.filter((ref) => ref.localSymbolStatus === "missing").length,
      requiredSfRefs: allRefs.length,
      requiredSfRefsWithLocalSymbol: allRefs.filter((ref) => ref.localSymbolStatus === "found").length,
      requiredSfRefsMissingLocalSymbol: allRefs.filter((ref) => ref.localSymbolStatus === "missing").length,
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        recommendation: asset.recommendation,
        selectedRefs: asset.scenarios.flatMap((scenario) => scenario.selectedRefs.map((ref) => ({
          scenarioId: scenario.scenarioId,
          id: ref.id,
          localSymbolStatus: ref.localSymbolStatus,
          confidence: ref.confidence,
          nearestDamageBranch: ref.nearestDamageBranches[0] ?? null,
        }))),
      })),
    },
    assets,
  };
}

function collectScenarioMappingAssets(scenarioEvaluation, requestedAssetIds) {
  const byAsset = new Map();
  for (const scenario of scenarioEvaluation.scenarios ?? []) {
    for (const asset of scenario.assets ?? []) {
      if (requestedAssetIds && !requestedAssetIds.has(String(asset.assetId))) continue;
      const key = String(asset.assetId);
      if (!byAsset.has(key)) {
        byAsset.set(key, {
          assetId: asset.assetId,
          tags: asset.tags,
          damageBranches: asset.damageBranches ?? [],
          scenarios: [],
        });
      }
      byAsset.get(key).scenarios.push({
        scenarioId: scenario.id,
        label: scenario.label,
        flags: scenario.flags,
        damageSelection: asset.damageSelection,
        controls: asset.controls ?? [],
      });
    }
  }
  return Array.from(byAsset.values());
}

function inspectAssetScenarioSfMappings(asset, candidateGraph) {
  const sfSymbolMap = candidateGraph?.sfSymbolMap ?? {};
  const scenarios = asset.scenarios.map((scenario) => inspectScenarioSfRefs(asset, scenario, sfSymbolMap));
  const requiredRefs = dedupeBy(
    scenarios.flatMap((scenario) => scenario.allSfRefs),
    (ref) => ref.id
  ).sort((a, b) => a.id.localeCompare(b.id));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    source: candidateGraph?.source ?? null,
    damageBranches: asset.damageBranches,
    localSfSymbolsAvailable: Object.keys(sfSymbolMap).length,
    requiredRefs,
    scenarios,
    recommendation: recommendScenarioSfMapping(scenarios, requiredRefs),
  };
}

function inspectScenarioSfRefs(asset, scenario, sfSymbolMap) {
  const selectedRefs = (scenario.damageSelection?.selectedSelectors ?? [])
    .flatMap((selector) => selector.unresolvedRefs ?? [])
    .filter((ref) => ref.kind === "local-script-formula")
    .map((ref) => inspectSfRefMapping(ref, sfSymbolMap, asset.damageBranches, selectorSource(scenario, ref)));
  const allSfRefs = dedupeBy(
    (scenario.controls ?? [])
      .flatMap((control) =>
        (control.unresolvedRefs ?? [])
          .filter((ref) => ref.kind === "local-script-formula")
          .map((ref) => inspectSfRefMapping(ref, sfSymbolMap, asset.damageBranches, controlSource(scenario, control)))
      ),
    (ref) => ref.id
  ).sort((a, b) => a.id.localeCompare(b.id));
  return {
    scenarioId: scenario.scenarioId,
    label: scenario.label,
    flags: scenario.flags,
    selectedExpression: scenario.damageSelection?.selectedSelectors?.[0]?.selectedExpression ?? null,
    selectedRefs,
    allSfRefs,
  };
}

function inspectSfRefMapping(ref, sfSymbolMap, damageBranches, source) {
  const sfIndex = Number(String(ref.id).split(":").pop());
  const localSymbol = sfSymbolMap[String(sfIndex)] ?? null;
  const nearestDamageBranches = nearestDamageBranchesForSf(localSymbol, damageBranches);
  return {
    id: ref.id,
    token: ref.token,
    sfIndex,
    source,
    localSymbolStatus: localSymbol ? "found" : "missing",
    localSymbol: localSymbol
      ? {
          symbol: localSymbol.symbol,
          offsets: localSymbol.offsets ?? [],
          occurrences: localSymbol.occurrences ?? null,
          metadataProfiles: localSymbol.metadataProfiles ?? {},
          constantsAfterSamples: localSymbol.constantsAfterSamples ?? [],
        }
      : null,
    nearestDamageBranches,
    confidence: scoreSfMappingConfidence(localSymbol, nearestDamageBranches),
    nextAction: localSymbol
      ? "Inspect decoded structural window around this SF symbol and nearby bytecode to connect it to a damage branch."
      : "Resolve missing local SF symbol from bytecode occurrences or broader payload context.",
  };
}

function selectorSource(scenario, ref) {
  const selector = (scenario.damageSelection?.selectedSelectors ?? []).find((item) =>
    (item.unresolvedRefs ?? []).some((candidate) => candidate.id === ref.id)
  );
  return {
    scenarioId: scenario.scenarioId,
    nodeId: selector?.nodeId ?? null,
    expression: selector?.expression ?? null,
    selectedExpression: selector?.selectedExpression ?? null,
  };
}

function controlSource(scenario, control) {
  return {
    scenarioId: scenario.scenarioId,
    nodeId: control.nodeId,
    expression: control.expression,
    selectedExpression: control.selectedExpression,
  };
}

function nearestDamageBranchesForSf(localSymbol, damageBranches) {
  const offsets = localSymbol?.offsets ?? [];
  return (damageBranches ?? [])
    .map((branch) => {
      const distances = offsets
        .filter(Number.isFinite)
        .map((offset) => Math.abs(offset - Number(branch.offset)))
        .filter(Number.isFinite);
      return {
        nodeId: branch.nodeId,
        coefficient: branch.coefficient,
        expression: branch.expression,
        offset: branch.offset,
        minDistance: distances.length ? Math.min(...distances) : null,
      };
    })
    .sort((a, b) => (a.minDistance ?? Infinity) - (b.minDistance ?? Infinity))
    .slice(0, 3);
}

function scoreSfMappingConfidence(localSymbol, nearestDamageBranches) {
  if (!localSymbol) {
    return {
      level: "missing",
      reasons: ["No local SF symbol candidate was exported for this reference."],
    };
  }
  const nearest = nearestDamageBranches[0]?.minDistance;
  const reasons = [`Local symbol found at offset(s): ${(localSymbol.offsets ?? []).join(", ") || "unknown"}.`];
  if (Number.isFinite(nearest)) reasons.push(`Nearest damage branch is ${nearest} bytes away.`);
  if (Number.isFinite(nearest) && nearest <= 768) return { level: "medium", reasons };
  return { level: "low", reasons };
}

function recommendScenarioSfMapping(scenarios, requiredRefs) {
  const selectedRefs = scenarios.flatMap((scenario) => scenario.selectedRefs);
  const selectedMissing = selectedRefs.filter((ref) => ref.localSymbolStatus === "missing");
  const selectedFound = selectedRefs.filter((ref) => ref.localSymbolStatus === "found");
  if (selectedMissing.length > 0) {
    return {
      kind: "resolve-missing-selected-sf",
      confidence: "high",
      note: "At least one scenario-selected branch points to an SF ref without a local symbol candidate.",
    };
  }
  if (selectedFound.length > 0) {
    return {
      kind: "inspect-selected-sf-windows",
      confidence: "medium",
      note: "Scenario-selected SF refs have local symbols; inspect their decoded windows before mapping them to damage coefficients.",
    };
  }
  if (requiredRefs.length > 0) {
    return {
      kind: "inspect-nonselected-sf-dependencies",
      confidence: "low",
      note: "No selected SF branch was found, but unresolved SF dependencies remain in nearby controls.",
    };
  }
  return {
    kind: "no-sf-mapping-needed",
    confidence: "medium",
    note: "No unresolved SF refs were found for this asset.",
  };
}

function inspectScenarioSfBytecode(scenarioSfMappings, options = {}) {
  const radius = Number.isFinite(Number(options.radius)) ? Number(options.radius) : 128;
  const assets = (scenarioSfMappings.assets ?? []).map((asset) => inspectAssetScenarioSfBytecode(asset, { radius }));
  const selectedRefs = assets.flatMap((asset) => asset.selectedRefs);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      scenarioSfMappingsInspectedAt: scenarioSfMappings.inspectedAt,
      scenarioSfMappingsSummary: scenarioSfMappings.summary,
    },
    assumptions: {
      radius,
      sfBytecodeEncoding: "Opcode 5 followed by raw SF index, where raw = sfIndex + 6.",
      note: "Bytecode occurrences show references used by formulas. They still need semantic mapping before selecting final damage coefficients.",
    },
    summary: {
      assets: assets.length,
      selectedRefs: selectedRefs.length,
      selectedRefsWithAscii: selectedRefs.filter((ref) => ref.asciiOccurrences.length > 0).length,
      selectedRefsWithBytecode: selectedRefs.filter((ref) => ref.bytecodeOccurrences.length > 0).length,
      selectedRefsMissingStandaloneSymbol: selectedRefs.filter((ref) => ref.localSymbolStatus === "missing" && ref.bytecodeOccurrences.length > 0).length,
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        recommendation: asset.recommendation,
        selectedRefs: asset.selectedRefs.map((ref) => ({
          scenarioId: ref.scenarioId,
          id: ref.id,
          localSymbolStatus: ref.localSymbolStatus,
          asciiOccurrences: ref.asciiOccurrences.length,
          bytecodeOccurrences: ref.bytecodeOccurrences.length,
          nearestBytecodeToDamage: ref.nearestBytecodeToDamage,
          interpretation: ref.interpretation,
        })),
      })),
    },
    assets,
  };
}

function inspectAssetScenarioSfBytecode(asset, options) {
  const decoded = asset.source?.filePath && Number.isFinite(asset.source?.blteOffset)
    ? decodeBlteAt(asset.source.filePath, asset.source.blteOffset).decoded
    : null;
  const selectedRefs = dedupeBy(
    (asset.scenarios ?? []).flatMap((scenario) =>
      (scenario.selectedRefs ?? []).map((ref) => ({
        ...ref,
        scenarioId: scenario.scenarioId,
        selectedExpression: scenario.selectedExpression,
      }))
    ),
    (ref) => `${ref.scenarioId}:${ref.id}`
  ).map((ref) => inspectSelectedSfBytecodeRef(ref, decoded, asset.damageBranches ?? [], options));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    source: asset.source,
    damageBranches: asset.damageBranches ?? [],
    selectedRefs,
    recommendation: recommendScenarioSfBytecode(selectedRefs),
  };
}

function inspectSelectedSfBytecodeRef(ref, decoded, damageBranches, options) {
  const sfIndex = Number(ref.sfIndex);
  const raw = sfIndex + 6;
  const asciiOccurrences = decoded ? findAsciiOccurrencesInBuffer(decoded, `SF_${sfIndex}`).map((offset) => ({
    offset,
    kind: classifySfAsciiOccurrence(decoded, offset, `SF_${sfIndex}`),
    nearestDamageBranch: nearestOffsetDamageBranch(offset, damageBranches),
    asciiPreview: extractAsciiPreview(decoded, offset, options.radius),
  })) : [];
  const bytecodeOccurrences = decoded ? findSfBytecodeOccurrences(decoded, raw).map((offset) => ({
    offset,
    raw,
    nearestDamageBranch: nearestOffsetDamageBranch(offset, damageBranches),
    asciiPreview: extractAsciiPreview(decoded, offset, options.radius),
    words: readU32Words(decoded, Math.max(0, offset - 32), Math.min(decoded.length, offset + 64)),
  })) : [];
  const nearestBytecodeToDamage = bytecodeOccurrences
    .map((occurrence) => occurrence.nearestDamageBranch)
    .filter((branch) => Number.isFinite(branch?.distance))
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
  return {
    id: ref.id,
    token: ref.token,
    sfIndex,
    scenarioId: ref.scenarioId,
    selectedExpression: ref.selectedExpression,
    localSymbolStatus: ref.localSymbolStatus,
    encodedRaw: raw,
    asciiOccurrences,
    bytecodeOccurrences,
    nearestBytecodeToDamage,
    interpretation: interpretSelectedSfBytecode(ref, asciiOccurrences, bytecodeOccurrences, nearestBytecodeToDamage),
  };
}

function classifySfAsciiOccurrence(buffer, offset, symbol) {
  const run = findAsciiRun(buffer, offset);
  return run.value === symbol ? "standalone-symbol" : "formula-or-text";
}

function findAsciiRun(buffer, offset) {
  let start = offset;
  while (start > 0 && buffer[start - 1] >= 32 && buffer[start - 1] <= 126) start -= 1;
  let end = offset;
  while (end < buffer.length && buffer[end] >= 32 && buffer[end] <= 126) end += 1;
  return {
    start,
    end,
    value: buffer.subarray(start, end).toString("ascii"),
  };
}

function findAsciiOccurrencesInBuffer(buffer, text) {
  const needle = Buffer.from(text, "ascii");
  const offsets = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const found = buffer.indexOf(needle, cursor);
    if (found === -1) break;
    offsets.push(found);
    cursor = found + Math.max(1, needle.length);
  }
  return offsets;
}

function findSfBytecodeOccurrences(buffer, raw) {
  const needle = Buffer.alloc(8);
  needle.writeUInt32LE(5, 0);
  needle.writeUInt32LE(raw, 4);
  const offsets = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const found = buffer.indexOf(needle, cursor);
    if (found === -1) break;
    offsets.push(found);
    cursor = found + 8;
  }
  return offsets;
}

function nearestOffsetDamageBranch(offset, damageBranches) {
  return (damageBranches ?? [])
    .map((branch) => ({
      nodeId: branch.nodeId,
      coefficient: branch.coefficient,
      expression: branch.expression,
      offset: branch.offset,
      distance: Number.isFinite(Number(branch.offset)) ? Math.abs(offset - Number(branch.offset)) : null,
    }))
    .filter((branch) => Number.isFinite(branch.distance))
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function extractAsciiPreview(buffer, offset, radius) {
  const start = Math.max(0, offset - radius);
  const end = Math.min(buffer.length, offset + radius);
  return Array.from(buffer.subarray(start, end))
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
    .join("");
}

function readU32Words(buffer, start, end) {
  const words = [];
  for (let offset = start; offset + 4 <= end; offset += 4) {
    words.push({
      offset,
      u32: buffer.readUInt32LE(offset),
      i32: buffer.readInt32LE(offset),
      f32: roundFloat(buffer.readFloatLE(offset)),
      hex: buffer.subarray(offset, offset + 4).toString("hex"),
    });
  }
  return words;
}

function interpretSelectedSfBytecode(ref, asciiOccurrences, bytecodeOccurrences, nearestBytecodeToDamage) {
  if (ref.localSymbolStatus === "missing" && bytecodeOccurrences.length > 0) {
    return {
      kind: "inline-bytecode-ref-without-standalone-symbol",
      confidence: "medium",
      note: "The selected SF appears in formula bytecode but not as an exported local symbol; treat it as an inline selector reference first.",
    };
  }
  if (ref.localSymbolStatus === "found" && bytecodeOccurrences.length > 1) {
    return {
      kind: "symbol-and-selector-bytecode-ref",
      confidence: "medium",
      note: "The selected SF has a local symbol and is also referenced by the selector formula.",
    };
  }
  if (Number.isFinite(nearestBytecodeToDamage?.distance) && nearestBytecodeToDamage.distance <= 768) {
    return {
      kind: "near-damage-bytecode-ref",
      confidence: "medium",
      note: "The selected SF bytecode is close to a damage coefficient and should be inspected as a branch candidate.",
    };
  }
  return {
    kind: "needs-structural-review",
    confidence: "low",
    note: "The selected SF reference is present but not close enough to map directly to a damage branch.",
  };
}

function recommendScenarioSfBytecode(selectedRefs) {
  if (selectedRefs.some((ref) => ref.interpretation.kind === "inline-bytecode-ref-without-standalone-symbol")) {
    return {
      kind: "treat-missing-sf-as-inline-selector-ref",
      confidence: "medium",
      note: "A selected missing SF was found in selector bytecode; next map selector outputs to damage branches, not only standalone SF symbols.",
    };
  }
  if (selectedRefs.some((ref) => ref.interpretation.kind === "near-damage-bytecode-ref")) {
    return {
      kind: "map-near-damage-bytecode-ref",
      confidence: "medium",
      note: "At least one selected SF bytecode reference sits near a damage branch.",
    };
  }
  return {
    kind: "manual-structural-review",
    confidence: "low",
    note: "Selected SF bytecode exists, but more structure is needed before mapping to damage coefficients.",
  };
}

function inferScenarioDamageBranches(sfBytecodeReport, scenarioEvaluation = null, options = {}) {
  const assets = (sfBytecodeReport.assets ?? []).map((asset) =>
    inferAssetScenarioDamageBranches(asset, scenarioEvaluation, options)
  );
  const scenarioMappings = assets.flatMap((asset) => asset.scenarioMappings);
  return {
    inferredAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      sfBytecodeInspectedAt: sfBytecodeReport.inspectedAt,
      scenarioEvaluatedAt: scenarioEvaluation?.evaluatedAt ?? null,
    },
    assumptions: {
      note: "This report proposes branch-to-damage candidates. Low-confidence or colliding candidates must not change DPS.",
    },
    summary: {
      assets: assets.length,
      scenarioMappings: scenarioMappings.length,
      highConfidenceMappings: scenarioMappings.filter((mapping) => mapping.confidence === "high").length,
      mediumConfidenceMappings: scenarioMappings.filter((mapping) => mapping.confidence === "medium").length,
      lowConfidenceMappings: scenarioMappings.filter((mapping) => mapping.confidence === "low").length,
      blockedMappings: scenarioMappings.filter((mapping) => mapping.status === "blocked").length,
      recommendationCounts: sortCounts(countBy(assets, (asset) => asset.recommendation.kind)),
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        recommendation: asset.recommendation,
        scenarioMappings: asset.scenarioMappings.map((mapping) => ({
          scenarioId: mapping.scenarioId,
          selectedExpression: mapping.selectedExpression,
          status: mapping.status,
          confidence: mapping.confidence,
          candidateDamageBranch: mapping.candidateDamageBranch,
          blockers: mapping.blockers,
        })),
      })),
    },
    assets,
  };
}

function inferAssetScenarioDamageBranches(asset, scenarioEvaluation, options) {
  const scenarioSelectors = collectScenarioSelectorsForAsset(scenarioEvaluation, asset.assetId);
  const selectedRefsByScenario = new Map((asset.selectedRefs ?? []).map((ref) => [String(ref.scenarioId), ref]));
  const selectedRefs = asset.selectedRefs ?? [];
  const collisionKeys = countBy(
    selectedRefs
      .map((ref) => ref.nearestBytecodeToDamage?.nodeId)
      .filter(Boolean),
    (nodeId) => nodeId
  );
  const scenarioMappings = scenarioSelectors.length
    ? scenarioSelectors.map((selector) => inferScenarioDamageMapping(selector, selectedRefsByScenario.get(String(selector.scenarioId)), asset.damageBranches ?? [], collisionKeys))
    : selectedRefs.map((ref) => inferScenarioDamageMapping({
        scenarioId: ref.scenarioId,
        selectedExpression: ref.selectedExpression,
      }, ref, asset.damageBranches ?? [], collisionKeys));
  return {
    assetId: asset.assetId,
    tags: asset.tags,
    source: asset.source,
    damageBranches: asset.damageBranches ?? [],
    scenarioMappings,
    collisionAnalysis: {
      nearestDamageNodeCounts: sortCounts(collisionKeys),
      collidingDamageNodes: Object.entries(collisionKeys)
        .filter(([, count]) => count > 1)
        .map(([nodeId, count]) => ({ nodeId, count })),
    },
    recommendation: recommendScenarioDamageBranchMapping(scenarioMappings),
  };
}

function collectScenarioSelectorsForAsset(scenarioEvaluation, assetId) {
  if (!scenarioEvaluation) return [];
  const selectors = [];
  for (const scenario of scenarioEvaluation.scenarios ?? []) {
    const asset = (scenario.assets ?? []).find((item) => String(item.assetId) === String(assetId));
    for (const selector of asset?.damageSelection?.selectedSelectors ?? []) {
      selectors.push({
        scenarioId: scenario.id,
        label: scenario.label,
        flags: scenario.flags,
        selectorNodeId: selector.nodeId,
        selectorExpression: selector.expression,
        selectedExpression: selector.selectedExpression,
        selectorStatus: selector.status,
      });
    }
  }
  return selectors;
}

function inferScenarioDamageMapping(selector, selectedRef, damageBranches, collisionKeys) {
  const selectedExpression = selector.selectedExpression ?? selectedRef?.selectedExpression ?? null;
  if (selectedExpression === "0") {
    return {
      scenarioId: selector.scenarioId,
      label: selector.label ?? null,
      flags: selector.flags ?? null,
      selectedExpression,
      selectedRef: null,
      status: "candidate",
      confidence: "high",
      candidateDamageBranch: {
        kind: "zero-damage-output",
        coefficient: 0,
        note: "The selector resolves to literal 0.",
      },
      alternatives: [],
      blockers: [],
      nextAction: "Treat as disabled/zero selector output only after confirming this selector controls damage selection.",
    };
  }
  if (!selectedRef) {
    return {
      scenarioId: selector.scenarioId,
      label: selector.label ?? null,
      flags: selector.flags ?? null,
      selectedExpression,
      selectedRef: null,
      status: "blocked",
      confidence: "low",
      candidateDamageBranch: null,
      alternatives: damageBranches.map((branch) => ({ ...branch, distance: null })),
      blockers: ["No selected SF bytecode ref was available for this scenario."],
      nextAction: "Inspect scenario selector output and unresolved references.",
    };
  }
  const nearest = selectedRef.nearestBytecodeToDamage ?? null;
  const collisionCount = nearest?.nodeId ? collisionKeys[nearest.nodeId] ?? 0 : 0;
  const alternatives = rankDamageBranchAlternatives(selectedRef, damageBranches);
  const blockers = [];
  if (!nearest) blockers.push("No nearest bytecode-to-damage branch candidate.");
  if (collisionCount > 1) blockers.push(`Multiple selector outputs point to the same nearest damage branch ${nearest.nodeId}.`);
  if (Number.isFinite(nearest?.distance) && nearest.distance > 768) blockers.push("Nearest candidate is too far from selector bytecode for automatic mapping.");
  const confidence = blockers.length ? "low" : "medium";
  return {
    scenarioId: selector.scenarioId,
    label: selector.label ?? null,
    flags: selector.flags ?? null,
    selectedExpression,
    selectedRef: {
      id: selectedRef.id,
      token: selectedRef.token,
      localSymbolStatus: selectedRef.localSymbolStatus,
      interpretation: selectedRef.interpretation,
    },
    status: blockers.length ? "blocked" : "candidate",
    confidence,
    candidateDamageBranch: nearest
      ? {
          kind: "nearest-bytecode-distance",
          nodeId: nearest.nodeId,
          coefficient: nearest.coefficient,
          expression: nearest.expression,
          offset: nearest.offset,
          distance: nearest.distance,
        }
      : null,
    alternatives,
    blockers,
    nextAction: blockers.length
      ? "Do not apply this mapping to DPS; inspect structural ownership of the selector block."
      : "Review this candidate manually before enabling branch-aware DPS.",
  };
}

function rankDamageBranchAlternatives(selectedRef, damageBranches) {
  const occurrenceOffsets = (selectedRef.bytecodeOccurrences ?? []).map((occurrence) => occurrence.offset).filter(Number.isFinite);
  return (damageBranches ?? [])
    .map((branch) => {
      const distances = occurrenceOffsets.map((offset) => Math.abs(offset - Number(branch.offset))).filter(Number.isFinite);
      return {
        nodeId: branch.nodeId,
        coefficient: branch.coefficient,
        expression: branch.expression,
        offset: branch.offset,
        nearestBytecodeDistance: distances.length ? Math.min(...distances) : null,
      };
    })
    .sort((a, b) => (a.nearestBytecodeDistance ?? Infinity) - (b.nearestBytecodeDistance ?? Infinity));
}

function recommendScenarioDamageBranchMapping(scenarioMappings) {
  const blocked = scenarioMappings.filter((mapping) => mapping.status === "blocked");
  const highZero = scenarioMappings.filter((mapping) => mapping.confidence === "high" && mapping.candidateDamageBranch?.kind === "zero-damage-output");
  if (blocked.length > 0) {
    return {
      kind: "keep-strict-max-fallback",
      confidence: "high",
      note: "At least one non-zero selector output is ambiguous; do not replace max damage yet.",
    };
  }
  if (highZero.length === scenarioMappings.length) {
    return {
      kind: "zero-output-only",
      confidence: "medium",
      note: "Only zero outputs were inferred.",
    };
  }
  return {
    kind: "manual-review-before-dps-activation",
    confidence: "medium",
    note: "Mappings are candidates but still need semantic validation.",
  };
}

function extractModFlags(expression) {
  const flags = [];
  const regex = /Mod\.([A-Za-z0-9_]+)/g;
  let match;
  while ((match = regex.exec(expression))) {
    flags.push(match[1]);
  }
  return Array.from(new Set(flags)).sort();
}

function extractExternalRefs(dependsOn) {
  const refs = [];
  for (const item of dependsOn.powerTags ?? []) {
    refs.push({
      kind: "powerTag",
      key: item.power,
      field: item.field,
    });
  }
  for (const item of dependsOn.affixProperties ?? []) {
    refs.push({
      kind: "affixProperty",
      key: item.affix,
      field: item.property,
    });
  }
  for (const item of dependsOn.hashRefs ?? []) {
    refs.push({
      kind: "hashRef",
      key: item.key,
      target: item.target,
    });
  }
  return refs;
}

function distanceFromCluster(offset, cluster) {
  if (!Number.isFinite(offset) || !Number.isFinite(cluster.startOffset) || !Number.isFinite(cluster.endOffset)) return Infinity;
  if (offset >= cluster.startOffset && offset <= cluster.endOffset) return 0;
  if (offset < cluster.startOffset) return cluster.startOffset - offset;
  return offset - cluster.endOffset;
}

function classifyPositionAgainstCluster(offset, cluster) {
  if (!Number.isFinite(offset) || !Number.isFinite(cluster.startOffset) || !Number.isFinite(cluster.endOffset)) return "unknown";
  if (offset < cluster.startOffset) return "before-damage-cluster";
  if (offset > cluster.endOffset) return "after-damage-cluster";
  return "inside-damage-cluster";
}

function nearestDamageTerms(offset, damageTerms) {
  return damageTerms
    .map((term) => ({
      nodeId: term.nodeId,
      value: term.value,
      offset: term.offsets?.stringOffset ?? null,
      distance: Number.isFinite(term.offsets?.stringOffset) && Number.isFinite(offset) ? Math.abs(offset - term.offsets.stringOffset) : null,
    }))
    .filter((term) => Number.isFinite(term.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}

function normalizeNumberList(values) {
  return Array.from(new Set(values.map((value) => Number(value)).filter(Number.isFinite))).sort((a, b) => a - b);
}


function auditAssetDamageComponents(asset) {
  const damageTerms = (asset.formulas ?? [])
    .filter((formula) => formula.dpsRole?.role === "damage-coefficient")
    .map((formula) => ({
      nodeId: formula.nodeId,
      value: Number(formula.value),
      expression: formula.expression,
      canonicalExpression: formula.canonicalExpression,
      experimental: Boolean(formula.dpsRole?.experimental),
      confidence: formula.dpsRole?.confidence ?? null,
      reason: formula.dpsRole?.reason ?? null,
      tableRefs: extractTableRefs(formula.canonicalExpression || formula.expression || ""),
    }))
    .filter((formula) => Number.isFinite(formula.value))
    .sort((a, b) => b.value - a.value || String(a.nodeId).localeCompare(String(b.nodeId)));
  const currentPrimary = Number(asset.components?.primaryDamageCoefficient ?? 0);
  const sumCoefficient = damageTerms.reduce((sum, term) => sum + term.value, 0);
  const selectedTerms = damageTerms.filter((term) => Math.abs(term.value - currentPrimary) <= 1e-9);
  const hiddenTerms = damageTerms.filter((term) => term.value < currentPrimary || selectedTerms.length > 1 && !selectedTerms.includes(term));

  return {
    assetId: asset.assetId,
    tags: asset.tags,
    current: {
      estimatedDps: asset.estimatedDps,
      primaryDamageCoefficient: currentPrimary,
      selectedNodeIds: selectedTerms.map((term) => term.nodeId),
      method: "max-damage-coefficient",
    },
    alternatives: {
      sumCoefficient,
      sumMinusMax: sumCoefficient - currentPrimary,
      summedEstimatedDps:
        Number(asset.components?.weaponDamage ?? 0) *
        Number(asset.components?.attackSpeed ?? 0) *
        sumCoefficient *
        Number(asset.components?.multiplierProduct ?? 1) *
        Number(asset.components?.uptimeProduct ?? 1),
    },
    recommendation: recommendDamageComposition(damageTerms, currentPrimary),
    damageTerms,
    hiddenTerms,
  };
}

function recommendDamageComposition(damageTerms, currentPrimary) {
  if (damageTerms.length <= 1) {
    return {
      kind: "single-term",
      confidence: "medium",
      note: "Only one damage coefficient is present; max and sum are equivalent.",
    };
  }
  const duplicateGroups = groupBy(damageTerms, (term) => normalizePromotionExpression(term.canonicalExpression));
  const hasDuplicates = Array.from(duplicateGroups.values()).some((items) => items.length > 1);
  if (hasDuplicates) {
    return {
      kind: "dedupe-or-branch",
      confidence: "medium",
      note: "Equivalent damage terms are present; keep deduplication or identify mutually exclusive branches.",
    };
  }
  const tableShapes = new Set(damageTerms.flatMap((term) => term.tableRefs.map((ref) => `${ref.tableId}:${ref.argument}`)));
  const hasSmallHiddenTerm = damageTerms.some((term) => term.value > 0 && term.value < currentPrimary * 0.05);
  if (hasSmallHiddenTerm) {
    return {
      kind: "max-likely-safe",
      confidence: "low",
      note: "At least one hidden coefficient is tiny relative to the selected primary term; it may be secondary or display scaling.",
    };
  }
  if (tableShapes.size > 1 || damageTerms.length >= 3) {
    return {
      kind: "multi-hit-review",
      confidence: "low",
      note: "Multiple different table-scaled coefficients may represent separate hits, ranks, upgrades, or branches.",
    };
  }
  return {
    kind: "composition-review",
    confidence: "low",
    note: "Multiple damage coefficients exist; verify whether they should be max, sum, or mutually exclusive branches.",
  };
}

function extractTableRefs(expression) {
  const refs = [];
  const regex = /Table\(\s*([0-9]+)\s*,\s*([^)]+?)\s*\)/gi;
  let match;
  while ((match = regex.exec(expression))) {
    refs.push({
      tableId: Number(match[1]),
      argument: match[2].trim(),
    });
  }
  return refs;
}


function buildReviewedPromotionIndex(promotionRisk) {
  const promotions = new Map();
  for (const asset of promotionRisk.assets ?? []) {
    for (const promotion of asset.promotions ?? []) {
      if (promotion.recommendation !== "candidate-for-strict-review") continue;
      promotions.set(promotionKey(asset.assetId, promotion.nodeId, promotion.canonicalExpression), {
        role: promotion.toRole,
        confidence: "medium",
        reason: `Reviewed promotion from risk inspection: ${promotion.reasons.join("; ")}`,
        auditSuggestedRole: promotion.auditSuggestedRole,
      });
    }
  }
  return promotions;
}

function compareDpsModels(strictModel, experimentalModel) {
  const strictAssets = new Map((strictModel.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const rows = [];
  for (const experimentalAsset of experimentalModel.assets ?? []) {
    const strictAsset = strictAssets.get(String(experimentalAsset.assetId));
    const strictDps = Number(strictAsset?.estimatedDps ?? 0);
    const experimentalDps = Number(experimentalAsset.estimatedDps ?? 0);
    const deltaDps = experimentalDps - strictDps;
    const promotions = experimentalAsset.experimental?.promotions ?? [];
    rows.push({
      assetId: experimentalAsset.assetId,
      tags: experimentalAsset.tags,
      strictDps,
      experimentalDps,
      deltaDps,
      deltaPct: safePct(deltaDps, strictDps),
      promotedFormulas: promotions.length,
      changedComponents: strictAsset ? diffComponents(strictAsset.components, experimentalAsset.components) : [],
      needsDamageCoefficient:
        promotions.length > 0 &&
        strictDps === 0 &&
        experimentalDps === 0 &&
        Number(experimentalAsset.components?.primaryDamageCoefficient ?? 0) === 0,
      promotions: promotions.map((promotion) => ({
        nodeId: promotion.nodeId,
        value: promotion.value,
        canonicalExpression: promotion.canonicalExpression,
        fromRole: promotion.fromRole?.role ?? null,
        toRole: promotion.toRole?.role ?? null,
        auditSuggestedRole: promotion.toRole?.auditSuggestedRole ?? null,
        reason: promotion.toRole?.reason ?? null,
      })),
    });
  }
  rows.sort((a, b) => Math.abs(b.deltaDps) - Math.abs(a.deltaDps) || b.promotedFormulas - a.promotedFormulas || String(a.assetId).localeCompare(String(b.assetId)));

  const strictTotal = sumEstimatedDps(strictModel.assets ?? []);
  const experimentalTotal = sumEstimatedDps(experimentalModel.assets ?? []);
  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      strictBuiltAt: strictModel.builtAt,
      experimentalBuiltAt: experimentalModel.builtAt,
      experimentalMode: experimentalModel.mode,
      experimentalAssumptions: experimentalModel.assumptions,
    },
    summary: {
      strictTotalEstimatedDps: strictTotal,
      experimentalTotalEstimatedDps: experimentalTotal,
      deltaDps: experimentalTotal - strictTotal,
      deltaPct: safePct(experimentalTotal - strictTotal, strictTotal),
      assets: rows.length,
      assetsWithPromotions: rows.filter((row) => row.promotedFormulas > 0).length,
      assetsWithDpsDelta: rows.filter((row) => Math.abs(row.deltaDps) > 1e-9).length,
      promotedFormulas: rows.reduce((sum, row) => sum + row.promotedFormulas, 0),
      promotedWithoutDpsImpact: rows
        .filter((row) => row.promotedFormulas > 0 && Math.abs(row.deltaDps) <= 1e-9)
        .reduce((sum, row) => sum + row.promotedFormulas, 0),
      assetsNeedingDamageCoefficient: rows.filter((row) => row.needsDamageCoefficient).map((row) => row.assetId),
      topDeltaAssets: rows.slice(0, 10).map((row) => ({
        assetId: row.assetId,
        strictDps: row.strictDps,
        experimentalDps: row.experimentalDps,
        deltaDps: row.deltaDps,
        deltaPct: row.deltaPct,
        promotedFormulas: row.promotedFormulas,
      })),
    },
    assets: rows,
  };
}

function inspectDpsGaps(strictModel, comparison, audit) {
  const auditByAsset = groupBy(audit.formulas ?? [], (formula) => String(formula.assetId));
  const strictByAsset = new Map((strictModel.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const gapAssets = (comparison.assets ?? []).filter((asset) => asset.needsDamageCoefficient);
  const assets = gapAssets.map((gapAsset) => {
    const strictAsset = strictByAsset.get(String(gapAsset.assetId));
    const auditItems = auditByAsset.get(String(gapAsset.assetId)) ?? [];
    const formulaCandidates = buildDamageGapCandidates(strictAsset, auditItems);
    return {
      assetId: gapAsset.assetId,
      tags: gapAsset.tags,
      reason: "Promoted multipliers exist but DPS remains zero because primaryDamageCoefficient is zero.",
      strictComponents: strictAsset?.components ?? null,
      comparison: {
        promotedFormulas: gapAsset.promotedFormulas,
        changedComponents: gapAsset.changedComponents,
        promotions: gapAsset.promotions,
      },
      candidateSummary: {
        candidates: formulaCandidates.length,
        highPriority: formulaCandidates.filter((candidate) => candidate.priority === "high").length,
        mediumPriority: formulaCandidates.filter((candidate) => candidate.priority === "medium").length,
        topCandidate: formulaCandidates[0] ?? null,
      },
      candidates: formulaCandidates,
    };
  });

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      strictBuiltAt: strictModel.builtAt,
      comparisonComparedAt: comparison.comparedAt,
      auditAuditedAt: audit.auditedAt,
    },
    summary: {
      gapAssets: assets.length,
      totalCandidates: assets.reduce((sum, asset) => sum + asset.candidates.length, 0),
      assets: assets.map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        candidates: asset.candidateSummary.candidates,
        topCandidate: asset.candidateSummary.topCandidate
          ? {
              nodeId: asset.candidateSummary.topCandidate.nodeId,
              value: asset.candidateSummary.topCandidate.value,
              priority: asset.candidateSummary.topCandidate.priority,
              reason: asset.candidateSummary.topCandidate.reason,
              canonicalExpression: asset.candidateSummary.topCandidate.canonicalExpression,
            }
          : null,
      })),
    },
    assets,
  };
}

function inspectGapFormulaContext(gapInspection, priorityInspection) {
  const priorityByAsset = new Map((priorityInspection.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (gapInspection.assets ?? []).map((gapAsset) => {
    const priorityAsset = priorityByAsset.get(String(gapAsset.assetId));
    const formulasByNode = new Map((priorityAsset?.formulasWithMissingRefs ?? []).map((formula) => [formula.nodeId, formula]));
    const candidates = (gapAsset.candidates ?? []).map((candidate) =>
      summarizeGapCandidateContext(candidate, formulasByNode.get(candidate.nodeId), priorityAsset)
    );
    return {
      assetId: gapAsset.assetId,
      tags: gapAsset.tags,
      source: priorityAsset?.source ?? null,
      decodedBytes: priorityAsset?.decodedBytes ?? null,
      summary: {
        candidates: candidates.length,
        likelyPrimaryDamage: candidates.filter((candidate) => candidate.contextAssessment.likelyRole === "possible-primary-damage").length,
        likelySecondaryScaling: candidates.filter((candidate) => candidate.contextAssessment.likelyRole === "secondary-scaling-or-display").length,
        unresolved: candidates.filter((candidate) => candidate.contextAssessment.likelyRole === "unresolved").length,
        bestCandidate: candidates[0]
          ? {
              nodeId: candidates[0].nodeId,
              value: candidates[0].value,
              likelyRole: candidates[0].contextAssessment.likelyRole,
              confidence: candidates[0].contextAssessment.confidence,
              canonicalExpression: candidates[0].canonicalExpression,
            }
          : null,
      },
      candidates,
    };
  });

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      gapInspectedAt: gapInspection.inspectedAt,
      priorityInspectedAt: priorityInspection.inspectedAt,
      prioritySummary: priorityInspection.summary,
    },
    summary: {
      assets: assets.length,
      candidates: assets.reduce((sum, asset) => sum + asset.candidates.length, 0),
      likelyPrimaryDamage: assets.reduce((sum, asset) => sum + asset.summary.likelyPrimaryDamage, 0),
      likelySecondaryScaling: assets.reduce((sum, asset) => sum + asset.summary.likelySecondaryScaling, 0),
      unresolved: assets.reduce((sum, asset) => sum + asset.summary.unresolved, 0),
      topAssets: assets.map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        candidates: asset.summary.candidates,
        bestCandidate: asset.summary.bestCandidate,
      })),
    },
    assets,
  };
}

function inspectPromotionRisks(comparison, graphExport, priorityInspection = null) {
  const graphByAsset = new Map((graphExport.graphs ?? []).map((graph) => [String(graph.assetId), graph]));
  const priorityByAsset = new Map((priorityInspection?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = (comparison.assets ?? [])
    .filter((asset) => asset.promotedFormulas > 0)
    .map((asset) => inspectPromotionRiskAsset(asset, graphByAsset.get(String(asset.assetId)), priorityByAsset.get(String(asset.assetId))));
  const promotions = assets.flatMap((asset) => asset.promotions.map((promotion) => ({ assetId: asset.assetId, ...promotion })));

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      comparisonComparedAt: comparison.comparedAt,
      graphExportedAt: graphExport.exportedAt,
      priorityInspectedAt: priorityInspection?.inspectedAt ?? null,
    },
    summary: {
      assets: assets.length,
      promotions: promotions.length,
      riskCounts: sortCounts(
        promotions.reduce((counts, promotion) => {
          counts[promotion.riskLevel] = (counts[promotion.riskLevel] ?? 0) + 1;
          return counts;
        }, {})
      ),
      likelySafe: promotions.filter((promotion) => promotion.recommendation === "candidate-for-strict-review").length,
      likelyOvercount: promotions.filter((promotion) => promotion.recommendation === "do-not-promote-yet").length,
      topRisks: promotions
        .slice()
        .sort((a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel) || Math.abs(Number(b.deltaDps ?? 0)) - Math.abs(Number(a.deltaDps ?? 0)))
        .slice(0, 20)
        .map((promotion) => ({
          assetId: promotion.assetId,
          nodeId: promotion.nodeId,
          value: promotion.value,
          toRole: promotion.toRole,
          riskLevel: promotion.riskLevel,
          recommendation: promotion.recommendation,
          reasons: promotion.reasons,
          canonicalExpression: promotion.canonicalExpression,
        })),
    },
    assets,
  };
}

function inspectPromotionRiskAsset(comparisonAsset, graph, priorityAsset) {
  const graphNodes = new Map((graph?.nodes ?? []).map((node) => [node.id, node]));
  const formulas = graph?.nodes ?? [];
  const damageFormulaCount = formulas.filter((node) => /Table\(/i.test(node.expression)).length;
  const duplicateGroups = groupPromotionsByNormalizedExpression(comparisonAsset.promotions ?? []);
  const promotions = (comparisonAsset.promotions ?? []).map((promotion) => {
    const graphNode = graphNodes.get(promotion.nodeId);
    const duplicateGroup = duplicateGroups.get(normalizePromotionExpression(promotion.canonicalExpression)) ?? [];
    return assessPromotionRisk(promotion, {
      comparisonAsset,
      graphNode,
      formulas,
      damageFormulaCount,
      duplicateCount: duplicateGroup.length,
      priorityAsset,
    });
  });

  return {
    assetId: comparisonAsset.assetId,
    tags: comparisonAsset.tags,
    strictDps: comparisonAsset.strictDps,
    experimentalDps: comparisonAsset.experimentalDps,
    deltaDps: comparisonAsset.deltaDps,
    promotedFormulas: comparisonAsset.promotedFormulas,
    graphContext: {
      formulas: formulas.length,
      tableFormulas: damageFormulaCount,
      hasPriorityInspection: Boolean(priorityAsset),
    },
    summary: {
      riskCounts: sortCounts(
        promotions.reduce((counts, promotion) => {
          counts[promotion.riskLevel] = (counts[promotion.riskLevel] ?? 0) + 1;
          return counts;
        }, {})
      ),
      recommendationCounts: sortCounts(
        promotions.reduce((counts, promotion) => {
          counts[promotion.recommendation] = (counts[promotion.recommendation] ?? 0) + 1;
          return counts;
        }, {})
      ),
    },
    promotions,
  };
}

function assessPromotionRisk(promotion, context) {
  const expression = promotion.canonicalExpression ?? "";
  const value = Number(promotion.value);
  const reasons = [];
  let riskScore = 0;
  let positiveScore = 0;

  if (context.duplicateCount > 1) {
    riskScore += 4;
    reasons.push("duplicate-or-equivalent promoted expression in same asset");
  }
  if (context.damageFormulaCount >= 2 && promotion.toRole === "multiplier") {
    riskScore += 2;
    reasons.push("asset already has multiple Table(...) damage formulas; SF promotion may be an upgrade/display variant");
  }
  if (value > 0 && value < 1 && promotion.toRole === "multiplier") {
    riskScore += 2;
    reasons.push("fractional value is normalized as 1 + value in prototype, which may overcount");
  }
  if (/sf:[^:\s]+:\d+\s*[/*+-]\s*sf:[^:\s]+:\d+/i.test(expression)) {
    riskScore += 1;
    reasons.push("pure SF ratio/product without field metadata");
  }
  if (/Table\(/i.test(expression) && promotion.toRole === "damage-coefficient") {
    positiveScore += 4;
    reasons.push("uses Table(...), current strongest signal for damage coefficient");
  }
  if (promotion.auditSuggestedRole === "small-table-coefficient-candidate") {
    positiveScore += 2;
    reasons.push("audit independently suggested small table coefficient");
  }
  if (value >= 1 && value <= 5 && promotion.toRole === "multiplier" && context.duplicateCount === 1) {
    positiveScore += 1;
    reasons.push("value is in plausible multiplier range and not duplicated");
  }

  const net = riskScore - positiveScore;
  const riskLevel = net >= 4 ? "high" : net >= 2 ? "medium" : "low";
  const recommendation = riskLevel === "low" && positiveScore >= 2 ? "candidate-for-strict-review" : "do-not-promote-yet";

  return {
    nodeId: promotion.nodeId,
    value,
    canonicalExpression: expression,
    fromRole: promotion.fromRole,
    toRole: promotion.toRole,
    auditSuggestedRole: promotion.auditSuggestedRole,
    riskLevel,
    riskScore,
    positiveScore,
    recommendation,
    reasons,
    sourceExpression: context.graphNode?.expression ?? null,
    nearbyAssetFormulas: context.formulas.map((node) => ({
      nodeId: node.id,
      expression: node.expression,
      isTableFormula: /Table\(/i.test(node.expression),
    })),
  };
}

function groupPromotionsByNormalizedExpression(promotions) {
  const map = new Map();
  for (const promotion of promotions) {
    const key = normalizePromotionExpression(promotion.canonicalExpression);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(promotion);
  }
  return map;
}

function normalizePromotionExpression(expression) {
  return String(expression ?? "").replace(/\s+/g, "").toLowerCase();
}

function riskRank(level) {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}


function summarizeGapCandidateContext(candidate, formulaContext, priorityAsset) {
  const sfIndexes = Array.from(new Set([...(candidate.canonicalExpression.matchAll(/\bsf:[^:\s]+:([0-9]+)\b/gi))].map((match) => Number(match[1])))).sort((a, b) => a - b);
  const localSymbols = Object.fromEntries(
    sfIndexes.map((index) => [String(index), priorityAsset?.localSfSymbolMap?.[String(index)] ?? null])
  );
  const nearbyStrings = (formulaContext?.nearbyStrings ?? []).map((item) => ({
    offset: item.offset,
    value: item.value,
    kind: item.kind,
  }));
  const numericNeighbors = nearbyStrings.filter((item) => item.kind === "numeric-constant");
  const externalNeighbors = nearbyStrings.filter((item) => item.kind === "external-ref");
  const formulaNeighbors = nearbyStrings.filter((item) => item.kind === "formula");
  const bytecodeTokens = (formulaContext?.bytecode?.tokens ?? []).map((token) => {
    if (token.kind === "number") return { offset: token.offset, kind: token.kind, value: token.value };
    if (token.kind === "sf-ref") return { offset: token.offset, kind: token.kind, sfIndexGuess: token.sfIndexGuess, raw: token.raw };
    if (token.kind === "operator") return { offset: token.offset, kind: token.kind, operator: token.operator };
    return { offset: token.offset, kind: token.kind, opcode: token.opcode };
  });

  return {
    assetId: candidate.assetId,
    nodeId: candidate.nodeId,
    value: candidate.value,
    expression: candidate.expression,
    canonicalExpression: candidate.canonicalExpression,
    gapScore: candidate.score,
    gapPriority: candidate.priority,
    offsets: {
      stringOffset: formulaContext?.stringOffset ?? null,
      bytecodeOffset: formulaContext?.bytecodeOffset ?? null,
    },
    contextAssessment: assessGapCandidateContext(candidate, {
      localSymbols,
      numericNeighbors,
      externalNeighbors,
      formulaNeighbors,
      bytecodeTokens,
    }),
    sfIndexes,
    localSymbols,
    nearby: {
      numericConstants: numericNeighbors,
      externalRefs: externalNeighbors,
      formulas: formulaNeighbors,
    },
    bytecode: {
      expressionGuess: formulaContext?.bytecode?.expressionGuess ?? null,
      tokens: bytecodeTokens,
    },
  };
}

function assessGapCandidateContext(candidate, context) {
  const expression = candidate.canonicalExpression ?? "";
  const value = Number(candidate.value);
  const hasTable = /Table\(/i.test(expression);
  const hasNearbyPrimaryDamageShape = context.formulaNeighbors.some((item) => /Table\(|Damage|Power_Percent|Bonus_Percent/i.test(item.value));
  const hasExternalDamageNeighbor = context.externalNeighbors.some((item) => /Bonus_Percent|Spiritborn_Spirit_Bonus|Power/i.test(item.value));
  const hasRepeatedSf10Shape = /sf:[^:\s]+:10\b/i.test(expression) && value >= 20;
  const isPureSfProduct = /^sf:[^:\s]+:\d+\s*\*\s*sf:[^:\s]+:\d+$/i.test(expression.trim());
  const reasons = [];

  if (hasTable) {
    reasons.push("uses Table(...), which is the strongest current damage-coefficient signal");
    return {
      likelyRole: "possible-primary-damage",
      confidence: "medium",
      reasons,
      nextAction: "Validate whether this table-scaled value is a hit coefficient or a secondary table scalar.",
    };
  }
  if (isPureSfProduct || hasRepeatedSf10Shape) {
    reasons.push("pure/local SF scaling without Table(...), clustered near external Spiritborn power references");
    if (hasExternalDamageNeighbor) reasons.push("nearby external references are bonus/multiplier-like");
    return {
      likelyRole: "secondary-scaling-or-display",
      confidence: "medium",
      reasons,
      nextAction: "Treat as secondary until asset metadata identifies this as hit damage.",
    };
  }
  if (hasNearbyPrimaryDamageShape) {
    reasons.push("nearby formulas include damage-like syntax, but this candidate lacks direct Table(...) evidence");
    return {
      likelyRole: "unresolved",
      confidence: "low",
      reasons,
      nextAction: "Inspect field names or localized metadata around this asset before promotion.",
    };
  }
  reasons.push("no table or direct damage keyword evidence in local context");
  return {
    likelyRole: "unresolved",
    confidence: "low",
    reasons,
    nextAction: "Keep excluded from strict DPS until metadata improves.",
  };
}


function buildDamageGapCandidates(strictAsset, auditItems) {
  const candidates = [];
  const auditedByKey = new Map(auditItems.map((item) => [promotionKey(item.assetId, item.nodeId, item.canonicalExpression), item]));
  for (const formula of strictAsset?.formulas ?? []) {
    const value = Number(formula.value);
    if (!Number.isFinite(value) || value <= 0) continue;
    const auditItem = auditedByKey.get(promotionKey(strictAsset.assetId, formula.nodeId, formula.canonicalExpression));
    const candidate = scoreDamageGapCandidate(formula, strictAsset, auditItem);
    if (!candidate) continue;
    candidates.push(candidate);
  }
  candidates.sort(
    (a, b) =>
      rolePriority({ priority: b.priority }) - rolePriority({ priority: a.priority }) ||
      b.score - a.score ||
      Math.abs(Number(b.value ?? 0)) - Math.abs(Number(a.value ?? 0))
  );
  return candidates;
}

function scoreDamageGapCandidate(formula, asset, auditItem) {
  const expression = formula.canonicalExpression || formula.expression || "";
  const value = Number(formula.value);
  const hasTable = /Table\(/i.test(expression);
  const hasSf = /\bsf:[^:\s]+:[0-9]+\b/i.test(expression);
  const isAlreadyMultiplier = formula.dpsRole?.role === "multiplier";
  const auditSuggestion = auditItem?.suggestion?.suggestedRole ?? null;
  let score = 0;
  const reasons = [];

  if (hasTable) {
    score += 5;
    reasons.push("uses Table(...)");
  }
  if (hasSf) {
    score += 2;
    reasons.push("uses local SF values");
  }
  if (value >= 5 && value <= 500) {
    score += 3;
    reasons.push("evaluates in plausible coefficient/flat scaling range");
  }
  if (value > 0 && value < 5) {
    score += 1;
    reasons.push("small positive coefficient candidate");
  }
  if (auditSuggestion === "flat-or-secondary-scaling-candidate") {
    score += 3;
    reasons.push("audit suggested flat/secondary scaling");
  }
  if (auditSuggestion === "small-table-coefficient-candidate") {
    score += 4;
    reasons.push("audit suggested small table coefficient");
  }
  if (isAlreadyMultiplier) {
    score -= 4;
    reasons.push("already classified as multiplier, less likely to be primary damage");
  }

  if (score <= 1) return null;
  return {
    assetId: asset.assetId,
    nodeId: formula.nodeId,
    value,
    expression: formula.expression,
    canonicalExpression: expression,
    currentRole: formula.dpsRole,
    auditSuggestion,
    score,
    priority: score >= 7 ? "high" : score >= 4 ? "medium" : "low",
    reason: reasons.join("; "),
    proposedAction: "Verify whether this formula should become a damage-coefficient or remain secondary metadata.",
  };
}

function rebuildAssetWithPromotions(asset, assumptions, promotions) {
  const promoted = [];
  const classified = (asset.formulas ?? []).map((formula) => {
    const promotion = promotions.get(promotionKey(asset.assetId, formula.nodeId, formula.canonicalExpression));
    if (!promotion) return formula;
    const promotedFormula = {
      ...formula,
      dpsRole: {
        role: promotion.role,
        confidence: promotion.confidence,
        reason: promotion.reason,
        experimental: true,
        auditSuggestedRole: promotion.auditSuggestedRole,
      },
    };
    promoted.push({
      nodeId: formula.nodeId,
      value: formula.value,
      canonicalExpression: formula.canonicalExpression,
      fromRole: formula.dpsRole,
      toRole: promotedFormula.dpsRole,
    });
    return promotedFormula;
  });

  const damageTerms = dedupeFormulaTerms(classified.filter((formula) => formula.dpsRole.role === "damage-coefficient"));
  const multiplierTerms = dedupeFormulaTerms(classified.filter((formula) => formula.dpsRole.role === "multiplier"));
  const uptimeTerms = dedupeFormulaTerms(classified.filter((formula) => formula.dpsRole.role === "uptime-or-chance"));
  const utilityTerms = classified.filter((formula) => formula.dpsRole.role === "utility-or-scaling");
  const weaponDamage = assumptions.weaponDamage ?? 100;
  const attackSpeed = assumptions.attackSpeed ?? 1;
  const primaryDamageCoefficient = damageTerms.length
    ? Math.max(...damageTerms.map((formula) => Number(formula.value)))
    : 0;
  const multiplierProduct = multiplierTerms.reduce((product, formula) => product * normalizeMultiplier(Number(formula.value)), 1);
  const uptimeProduct = uptimeTerms.reduce((product, formula) => product * clamp01(Number(formula.value)), 1);
  const estimatedDps = weaponDamage * attackSpeed * primaryDamageCoefficient * multiplierProduct * uptimeProduct;

  return {
    ...asset,
    estimatedDps,
    components: {
      ...asset.components,
      weaponDamage,
      attackSpeed,
      primaryDamageCoefficient,
      multiplierProduct,
      uptimeProduct,
      dedupedDamageTerms: damageTerms.length,
      dedupedMultiplierTerms: multiplierTerms.length,
      dedupedUptimeTerms: uptimeTerms.length,
    },
    formulas: classified,
    buckets: {
      damageTerms: damageTerms.map((formula) => formula.nodeId),
      multiplierTerms: multiplierTerms.map((formula) => formula.nodeId),
      uptimeTerms: uptimeTerms.map((formula) => formula.nodeId),
      utilityTerms: utilityTerms.map((formula) => formula.nodeId),
    },
    experimental: {
      promotedFormulas: promoted.length,
      promotions: promoted,
      strictEstimatedDps: asset.estimatedDps,
      deltaDps: estimatedDps - Number(asset.estimatedDps ?? 0),
      deltaPct: safePct(estimatedDps - Number(asset.estimatedDps ?? 0), Number(asset.estimatedDps ?? 0)),
    },
  };
}

function buildPromotionIndex(audit, includePriority) {
  const priorities = prioritySet(includePriority);
  const promotions = new Map();
  for (const formula of audit.formulas ?? []) {
    if (!priorities.has(formula.suggestion?.priority)) continue;
    const role = roleFromSuggestion(formula.suggestion?.suggestedRole);
    if (!role) continue;
    promotions.set(promotionKey(formula.assetId, formula.nodeId, formula.canonicalExpression), {
      role,
      confidence: formula.suggestion.confidence ?? "low",
      reason: `Experimental promotion from audit: ${formula.suggestion.reason}`,
      auditSuggestedRole: formula.suggestion.suggestedRole,
    });
  }
  return promotions;
}

function roleFromSuggestion(suggestedRole) {
  if (suggestedRole === "local-sf-multiplier-candidate") return "multiplier";
  if (suggestedRole === "small-table-coefficient-candidate") return "damage-coefficient";
  if (suggestedRole === "percent-or-chance-candidate") return "uptime-or-chance";
  return null;
}

function prioritySet(includePriority) {
  if (includePriority === "medium") return new Set(["high", "medium"]);
  if (includePriority === "low") return new Set(["high", "medium", "low"]);
  return new Set(["high"]);
}

function promotionKey(assetId, nodeId, canonicalExpression) {
  return `${assetId}::${nodeId ?? ""}::${canonicalExpression ?? ""}`;
}

function auditDpsRoles(dpsModel) {
  const audits = [];
  for (const asset of dpsModel.assets ?? []) {
    for (const formula of asset.formulas ?? []) {
      if (formula.dpsRole?.role !== "utility-or-scaling") continue;
      audits.push({
        assetId: asset.assetId,
        tags: asset.tags,
        nodeId: formula.nodeId,
        value: formula.value,
        expression: formula.expression,
        canonicalExpression: formula.canonicalExpression,
        currentRole: formula.dpsRole,
        suggestion: suggestDpsRole(formula, asset),
      });
    }
  }
  audits.sort(
    (a, b) =>
      rolePriority(b.suggestion) - rolePriority(a.suggestion) ||
      Math.abs(Number(b.value ?? 0)) - Math.abs(Number(a.value ?? 0)) ||
      String(a.assetId).localeCompare(String(b.assetId))
  );

  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      builtAt: dpsModel.builtAt,
      summary: dpsModel.summary,
    },
    summary: {
      assets: new Set(audits.map((item) => item.assetId)).size,
      utilityFormulas: audits.length,
      suggestedCounts: sortCounts(
        audits.reduce((counts, item) => {
          counts[item.suggestion.suggestedRole] = (counts[item.suggestion.suggestedRole] ?? 0) + 1;
          return counts;
        }, {})
      ),
      highPriority: audits.filter((item) => item.suggestion.priority === "high").length,
      mediumPriority: audits.filter((item) => item.suggestion.priority === "medium").length,
      topSuggestions: audits.slice(0, 20).map((item) => ({
        assetId: item.assetId,
        value: item.value,
        suggestedRole: item.suggestion.suggestedRole,
        priority: item.suggestion.priority,
        reason: item.suggestion.reason,
        canonicalExpression: item.canonicalExpression,
      })),
    },
    formulas: audits,
  };
}

function dedupeFormulaTerms(formulas) {
  const seen = new Set();
  const result = [];
  for (const formula of formulas) {
    const key = formula.canonicalExpression || formula.expression;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(formula);
  }
  return result;
}

function classifyDpsRole(formula) {
  const expression = formula.canonicalExpression;
  const value = Number(formula.value);
  const refs = formula.canonicalRefs ?? [];
  const hasTable = refs.some((ref) => ref.kind === "table") || /Table\(/i.test(expression);
  const hasAffix = refs.some((ref) => ref.kind === "affix-value") || /affix:/.test(expression);
  const hasPower = refs.some((ref) => ref.kind?.startsWith("power")) || /power:/.test(expression);
  const hasExternal = refs.some((ref) => ref.kind === "hash-ref") || /external:/.test(expression);
  const percentLike = /\/\s*100|\*\s*100|Percent|Pct|Chance|Bonus/i.test(expression);
  const chanceLike = /Chance|Duration|Uptime|Bonus_Percent|Pct/i.test(expression);

  if (hasTable && value >= 5) {
    return {
      role: "damage-coefficient",
      confidence: "medium",
      reason: "Formula uses Table(...) and evaluates as a coefficient-like damage term.",
    };
  }
  if ((hasAffix || hasPower || hasExternal) && value > 0 && value <= 5 && !chanceLike) {
    return {
      role: "multiplier",
      confidence: "low",
      reason: "External/canonical variable evaluates near multiplier range.",
    };
  }
  if ((chanceLike || percentLike) && value >= 0 && value <= 1.5) {
    return {
      role: "uptime-or-chance",
      confidence: "low",
      reason: "Expression looks chance/percent/duration related and evaluates in small range.",
    };
  }
  return {
    role: "utility-or-scaling",
    confidence: "low",
    reason: "Formula is calculable but not safely classed as direct DPS yet.",
  };
}

function suggestDpsRole(formula, asset) {
  const expression = formula.canonicalExpression || formula.expression || "";
  const value = Number(formula.value);
  const tags = asset.tags ?? [];
  const lowerExpression = expression.toLowerCase();
  const hasTable = /Table\(/i.test(expression);
  const hasSf = /\bsf:[^:\s]+:[0-9]+\b/i.test(expression);
  const hasDamageTag = tags.some((tag) => /damage|power|legendary|unique|necromancer|spiritborn|paladin/i.test(tag));
  const percentMath = /\/\s*100|\*\s*100|pow\(|min\(|max\(|chance|percent|pct|bonus/i.test(expression);
  const ratioLike = /\//.test(expression);

  if (hasTable && value > 0 && value < 5) {
    return {
      suggestedRole: "small-table-coefficient-candidate",
      priority: "high",
      confidence: "medium",
      reason: "Uses Table(...) but evaluates below the current damage-coefficient threshold.",
      proposedAction: "Review as a possible small damage coefficient instead of utility.",
    };
  }
  if (hasSf && hasDamageTag && value > 0 && value <= 5 && !percentMath) {
    return {
      suggestedRole: "local-sf-multiplier-candidate",
      priority: "high",
      confidence: "low",
      reason: "Uses local SF values, is attached to a damage-like asset, and evaluates in multiplier range.",
      proposedAction: "Verify source meaning before adding to multiplierProduct.",
    };
  }
  if ((percentMath || lowerExpression.includes("chance")) && value >= 0 && value <= 100) {
    return {
      suggestedRole: "percent-or-chance-candidate",
      priority: "medium",
      confidence: "low",
      reason: "Expression contains percent/chance math and evaluates in a plausible percent range.",
      proposedAction: "Decide whether it represents uptime, proc chance, or display-only scaling.",
    };
  }
  if (ratioLike && value > 0 && value <= 2) {
    return {
      suggestedRole: "ratio-scaling-candidate",
      priority: "medium",
      confidence: "low",
      reason: "Expression is ratio-like and evaluates near scaling range.",
      proposedAction: "Check whether it should normalize another DPS component.",
    };
  }
  if (value >= 5 && value <= 500 && hasDamageTag) {
    return {
      suggestedRole: "flat-or-secondary-scaling-candidate",
      priority: "medium",
      confidence: "low",
      reason: "Damage-like asset with a finite positive scaling value not currently used by DPS.",
      proposedAction: "Map this formula to damage, cooldown, duration, or display metadata.",
    };
  }
  return {
    suggestedRole: "manual-review",
    priority: "low",
    confidence: "low",
    reason: "No safe DPS role inferred from current heuristics.",
    proposedAction: "Keep visible but excluded from DPS until metadata improves.",
  };
}

function rolePriority(suggestion) {
  if (suggestion.priority === "high") return 3;
  if (suggestion.priority === "medium") return 2;
  return 1;
}

function normalizeMultiplier(value) {
  if (!Number.isFinite(value)) return 1;
  if (value <= 0) return 1;
  if (value < 1) return 1 + value;
  return value;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function summarizeDpsAssets(assets) {
  return {
    assets: assets.length,
    assetsWithDamageTerms: assets.filter((asset) => asset.components.primaryDamageCoefficient > 0).length,
    topEstimatedDps: assets
      .slice()
      .sort((a, b) => b.estimatedDps - a.estimatedDps)
      .slice(0, 20)
      .map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        estimatedDps: asset.estimatedDps,
        components: asset.components,
      })),
    roleCounts: sortCounts(
      assets
        .flatMap((asset) => asset.formulas)
        .reduce((counts, formula) => {
          counts[formula.dpsRole.role] = (counts[formula.dpsRole.role] ?? 0) + 1;
          return counts;
        }, {})
    ),
  };
}

function collectSensitivityVariables(canonicalExport, baselineValues) {
  const values = { ...baselineValues };
  const variables = Object.values(canonicalExport.variables ?? {});
  for (const variable of variables) {
    if (!(variable.canonicalId in values)) {
      values[variable.canonicalId] = variable.placeholderValue ?? defaultSensitivityValue(variable);
    }
  }

  return variables
    .map((variable) => ({
      canonicalId: variable.canonicalId,
      kind: variable.kind,
      confidenceCounts: variable.confidenceCounts,
      occurrences: Array.isArray(variable.occurrences) ? variable.occurrences.length : variable.occurrences,
      value: Number(values[variable.canonicalId]),
    }))
    .filter((variable) => Number.isFinite(variable.value));
}

function defaultSensitivityValue(variable) {
  if (variable.kind === "table") return 100;
  if (variable.kind === "affix-value") return 10;
  return 1;
}

function summarizeSensitivityVariable(variable, before, after, baselineByAsset, nextAssets) {
  const assets = [];
  for (const nextAsset of nextAssets) {
    const baselineAsset = baselineByAsset.get(String(nextAsset.assetId));
    if (!baselineAsset) continue;
    const beforeDps = Number(baselineAsset.estimatedDps);
    const afterDps = Number(nextAsset.estimatedDps);
    const deltaDps = afterDps - beforeDps;
    if (Math.abs(deltaDps) <= 1e-9) continue;
    assets.push({
      assetId: nextAsset.assetId,
      tags: nextAsset.tags,
      beforeDps,
      afterDps,
      deltaDps,
      deltaPct: safePct(deltaDps, beforeDps),
      changedComponents: diffComponents(baselineAsset.components, nextAsset.components),
    });
  }

  assets.sort((a, b) => Math.abs(b.deltaDps) - Math.abs(a.deltaDps) || String(a.assetId).localeCompare(String(b.assetId)));
  const totalBefore = Array.from(baselineByAsset.values()).reduce((sum, asset) => sum + Number(asset.estimatedDps || 0), 0);
  const totalAfter = nextAssets.reduce((sum, asset) => sum + Number(asset.estimatedDps || 0), 0);
  const totalDeltaDps = totalAfter - totalBefore;

  return {
    canonicalId: variable.canonicalId,
    kind: variable.kind,
    occurrences: variable.occurrences,
    confidenceCounts: variable.confidenceCounts,
    before,
    after,
    deltaInputPct: safePct(after - before, before),
    totalBeforeDps: totalBefore,
    totalAfterDps: totalAfter,
    totalDeltaDps,
    totalDeltaPct: safePct(totalDeltaDps, totalBefore),
    affectedAssets: assets.length,
    maxAssetDeltaDps: assets[0]?.deltaDps ?? 0,
    assets,
  };
}

function diffComponents(before, after) {
  const fields = ["primaryDamageCoefficient", "multiplierProduct", "uptimeProduct", "weaponDamage", "attackSpeed"];
  return fields
    .map((field) => ({
      field,
      before: Number(before[field]),
      after: Number(after[field]),
      delta: Number(after[field]) - Number(before[field]),
    }))
    .filter((item) => Math.abs(item.delta) > 1e-9);
}

function nextSensitivityValue(value) {
  if (!Number.isFinite(value)) return 1;
  if (value === 0) return 1;
  return value * 1.1;
}

function sumEstimatedDps(assets) {
  return assets.reduce((sum, asset) => sum + Number(asset.estimatedDps || 0), 0);
}

function safePct(delta, base) {
  if (!Number.isFinite(delta) || !Number.isFinite(base) || base === 0) return null;
  return (delta / base) * 100;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function roundFloat(value) {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1000000) / 1000000;
}

function sortCounts(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  );
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

module.exports = {
  analyzeDpsSensitivity,
  analyzeDpsSensitivityFile,
  auditDamageComponents,
  auditDamageComponentsFile,
  auditDedupedDamageComposition,
  auditDedupedDamageCompositionFile,
  auditGlobalBranchSignals,
  auditGlobalBranchSignalsFile,
  auditTargetBlockers,
  auditTargetBlockersFile,
  auditDpsRoles,
  auditDpsRolesFile,
  buildExperimentalDpsModel,
  buildExperimentalDpsModelFile,
  buildConditionalCandidateContext,
  buildConditionalCandidateContextFile,
  buildConditionalSfScenarios,
  buildConditionalSfScenariosFile,
  buildBranchAwareDpsModel,
  buildBranchAwareDpsModelFile,
  buildMinimalDpsModel,
  buildMinimalDpsModelFile,
  composeTargetBuild,
  composeTargetBuildFile,
  buildReviewedDpsModel,
  buildReviewedDpsModelFile,
  compareDpsModels,
  compareDpsModelsFile,
  evaluateBuildStateScenarios,
  evaluateBuildStateScenariosFile,
  exportOptimizerDataset,
  exportOptimizerDatasetFile,
  exportBuildStateTemplate,
  exportBuildStateTemplateFile,
  inspectBranchControls,
  inspectBranchControlsFile,
  inspectConditionalDamage,
  inspectConditionalDamageDedupe,
  inspectConditionalDamageDedupeFile,
  inspectConditionalDamageFile,
  inspectConditionalSfSources,
  inspectConditionalSfSourcesFile,
  inspectConditionalExternalMetadata,
  inspectConditionalExternalMetadataFile,
  inspectConditionalMetadataValues,
  inspectConditionalMetadataValuesFile,
  inspectConditionalDefinitionSearch,
  inspectConditionalDefinitionSearchFile,
  inferScenarioDamageBranches,
  inferScenarioDamageBranchesFile,
  inspectDpsGaps,
  inspectDpsGapsFile,
  inspectDamageComponentContext,
  inspectDamageComponentContextFile,
  inspectGapFormulaContext,
  inspectGapFormulaContextFile,
  inspectPromotionRisks,
  inspectPromotionRisksFile,
  inspectScenarioSfBytecode,
  inspectScenarioSfBytecodeFile,
  inspectScenarioSfMappings,
  inspectScenarioSfMappingsFile,
};
