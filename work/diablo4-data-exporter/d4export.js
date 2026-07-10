#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { analyzeIndexFile } = require("./src/index-analyzer");
const {
  catalogBlteDirectory,
  catalogBlteFile,
  decodeBlteAt,
  scanForMagic,
} = require("./src/blte-reader");
const {
  analyzeDeadbeefDirectory,
  analyzeDeadbeefFile,
  buildFormulaGraphs,
  exportFormulaDirectory,
  searchTableCandidatesDirectory,
  searchDeadbeefStringsDirectory,
} = require("./src/deadbeef-analyzer");
const { probeIdxPayloads } = require("./src/payload-prober");
const { scanInstall } = require("./src/scanner");
const { validateTargetDatasetFile } = require("./src/schema-validator");
const { exportTargetDatasetFromOptimizerFile } = require("./src/target-dataset-exporter");
const { writeJson } = require("./src/fs-utils");
const {
  analyzeDpsSensitivityFile,
  auditDamageComponentsFile,
  auditDedupedDamageCompositionFile,
  auditDpsRolesFile,
  buildConditionalCandidateContextFile,
  buildConditionalSfScenariosFile,
  auditGlobalBranchSignalsFile,
  auditTargetBlockersFile,
  buildBranchAwareDpsModelFile,
  buildExperimentalDpsModelFile,
  buildMinimalDpsModelFile,
  composeTargetBuildFile,
  buildReviewedDpsModelFile,
  compareDpsModelsFile,
  evaluateBuildStateScenariosFile,
  exportOptimizerDatasetFile,
  exportBuildStateTemplateFile,
  inferScenarioDamageBranchesFile,
  inspectBranchControlsFile,
  inspectConditionalDamageFile,
  inspectConditionalDamageDedupeFile,
  inspectConditionalDefinitionSearchFile,
  inspectConditionalExternalMetadataFile,
  inspectConditionalMetadataValuesFile,
  inspectConditionalSfSourcesFile,
  inspectDamageComponentContextFile,
  inspectDpsGapsFile,
  inspectGapFormulaContextFile,
  inspectPromotionRisksFile,
  inspectScenarioSfBytecodeFile,
  inspectScenarioSfMappingsFile,
} = require("./src/dps-model");
const {
  buildCanonicalContextTemplateFile,
  evaluateCanonicalVariablesFile,
  evaluateFormulaGraphsFile,
} = require("./src/formula-evaluator");
const {
  exportCanonicalExternalVariablesFromFiles,
  exportExternalReferencesFromFiles,
  inspectExternalValuesFromFiles,
  mergeExternalTargetSearchesFromFiles,
  searchExternalTargetsFromFiles,
} = require("./src/external-ref-analyzer");
const { inspectTableCandidatesFromFile } = require("./src/table-inspector");
const {
  analyzeSfUsageFromFiles,
  exportSfCandidateDefinitionsFromGraphsFile,
  inspectPriorityAssetsFromFiles,
  inspectSfDefinitionsFromGraphsFile,
  resolveMissingSfReferencesFromFiles,
} = require("./src/sf-inspector");

const DEFAULT_GAME_PATH = "C:\\Program Files (x86)\\Diablo IV";

function parseArgs(argv) {
  const command = !argv[2] || argv[2] === "--help" || argv[2] === "-h" ? "help" : argv[2];
  const args = {
    command,
    gamePath: DEFAULT_GAME_PATH,
    outDir: path.resolve(process.cwd(), "outputs", "diablo4-local-export"),
    file: null,
    dataDir: null,
    maxRecords: 2000,
    readBytes: 256,
    offset: null,
    magic: "BLTE",
    maxHits: 200,
    fileLimit: 5,
    fileOffset: 0,
    fileNames: null,
    decodedTypes: null,
    chunkSize: 64,
    totalFiles: null,
    maxDecodeMb: 128,
    terms: null,
    tableIds: null,
    assetIds: null,
    sfCandidates: null,
    missingSf: null,
    priorityInspection: null,
    externalRefs: null,
    externalTargets: null,
    externalValues: null,
    mergeFiles: null,
    contextFile: null,
    candidateContext: null,
    auditFile: null,
    comparisonFile: null,
    experimentalFile: null,
    gapFile: null,
    graphsFile: null,
    damageContextFile: null,
    branchControlsFile: null,
    buildStateFile: null,
    scenariosFile: null,
    scenarioDamageBranchesFile: null,
    conditionalDedupe: null,
    dedupedComposition: null,
    structuralRelations: null,
    sfUsage: null,
    sfSources: null,
    definitionSearch: null,
    fieldRecords: null,
    recordSegments: null,
    recordHeaders: null,
    recordHeaderPatterns: null,
    recordHeaderPatternReport: null,
    recordHeaderPayloadPlan: null,
    normalizedHeaderLayouts: null,
    formulaHashLayoutFocus: null,
    formulaHashFieldBoundaries: null,
    formulaHashHeaderPreludes: null,
    hashSuffixDefinitionLinks: null,
    hashSuffixValuePatterns: null,
    hashSuffixCandidateSemantics: null,
    hashSuffixDictionaryMining: null,
    hashSuffixFamilyEvidence: null,
    hashSuffixSourceNameAudit: null,
    hashSuffixBinarySourceAudit: null,
    hashSuffixBinaryContextComparison: null,
    hashSuffixSublayoutClassification: null,
    hashSuffixSublayoutFields: null,
    hashSuffixFieldShapeDecoders: null,
    hashSuffixDecodedOffsetLinks: null,
    hashSuffixOffsetRecordInspection: null,
    hashSuffixRecordBoundaryComparison: null,
    hashSuffixBoundaryPreludes: null,
    hashSuffixPreludeHeaderComparison: null,
    hashSuffixHeaderShapeComparison: null,
    hashSuffixCompactPatternSearch: null,
    hashSuffixNamedTableAudit: null,
    recordHeaderSourceFreshnessAudit: null,
    bonusPercentSelectorMatrix: null,
    selector949PeerAudit: null,
    selector949CompactCorpus: null,
    decodedDictionaryStringScan: null,
    unanchoredBonusPercentAudit: null,
    metadata12337ContextAudit: null,
    metadata12337ScaleCorpus: null,
    selectorAssetPairCorpus: null,
    selectorAssetLayoutParser: null,
    selectorAssetOwnerFields: null,
    bonusPercentCoverageAudit: null,
    localTableSourceAlternatives: null,
    sf32FieldPromotionDecision: null,
    sf33BuildStateTriggerAudit: null,
    sf33ActivationSourceCorpus: null,
    sf33ActivationSourceSearchAudit: null,
    sf33BuildStateNeighborhoodAudit: null,
    sf33OffsetTableEntriesAudit: null,
    sf33OffsetTableParentRunAudit: null,
    sf33ParentRunSemanticsAudit: null,
    sf33NamedBuildStateSourceAudit: null,
    sf33BinaryParentSourceAudit: null,
    uptimeProofAudit: null,
    sf28Sf29RoleAudit: null,
    uptimeNeighborDependencyAudit: null,
    aspectSlotReadiness: null,
    clusterStart: 18844,
    clusterEnd: 19040,
    includePriority: "high",
    promotionRiskFile: null,
    mode: "strict",
    maxFileMb: 50,
  };

  for (let i = 3; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--game-path") {
      args.gamePath = argv[++i];
    } else if (arg === "--out") {
      args.outDir = path.resolve(argv[++i]);
    } else if (arg === "--file") {
      args.file = argv[++i];
    } else if (arg === "--data-dir") {
      args.dataDir = argv[++i];
    } else if (arg === "--max-records") {
      args.maxRecords = Number(argv[++i]);
    } else if (arg === "--max-hits") {
      args.maxHits = Number(argv[++i]);
    } else if (arg === "--file-limit") {
      args.fileLimit = Number(argv[++i]);
    } else if (arg === "--file-offset") {
      args.fileOffset = Number(argv[++i]);
    } else if (arg === "--file-names") {
      args.fileNames = argv[++i].split(",").map((name) => name.trim()).filter(Boolean);
    } else if (arg === "--decoded-types") {
      args.decodedTypes = argv[++i].split(",").map((name) => name.trim()).filter(Boolean);
    } else if (arg === "--chunk-size") {
      args.chunkSize = Number(argv[++i]);
    } else if (arg === "--total-files") {
      args.totalFiles = Number(argv[++i]);
    } else if (arg === "--max-decode-mb") {
      args.maxDecodeMb = Number(argv[++i]);
    } else if (arg === "--max-file-mb") {
      args.maxFileMb = Number(argv[++i]);
    } else if (arg === "--terms") {
      args.terms = argv[++i].split(",").map((term) => term.trim()).filter(Boolean);
    } else if (arg === "--table-ids") {
      args.tableIds = argv[++i]
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(Number.isFinite);
    } else if (arg === "--asset-ids") {
      args.assetIds = argv[++i]
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(Number.isFinite);
    } else if (arg === "--sf-candidates") {
      args.sfCandidates = argv[++i];
    } else if (arg === "--missing-sf") {
      args.missingSf = argv[++i];
    } else if (arg === "--priority-inspection") {
      args.priorityInspection = argv[++i];
    } else if (arg === "--external-refs") {
      args.externalRefs = argv[++i];
    } else if (arg === "--external-targets") {
      args.externalTargets = argv[++i];
    } else if (arg === "--external-values") {
      args.externalValues = argv[++i];
    } else if (arg === "--merge-files") {
      args.mergeFiles = argv[++i].split(",").map((file) => file.trim()).filter(Boolean);
    } else if (arg === "--context-file") {
      args.contextFile = argv[++i];
    } else if (arg === "--candidate-context") {
      args.candidateContext = argv[++i];
    } else if (arg === "--audit-file") {
      args.auditFile = argv[++i];
    } else if (arg === "--comparison-file") {
      args.comparisonFile = argv[++i];
    } else if (arg === "--experimental-file") {
      args.experimentalFile = argv[++i];
    } else if (arg === "--gap-file") {
      args.gapFile = argv[++i];
    } else if (arg === "--graphs-file") {
      args.graphsFile = argv[++i];
    } else if (arg === "--damage-context") {
      args.damageContextFile = argv[++i];
    } else if (arg === "--branch-controls") {
      args.branchControlsFile = argv[++i];
    } else if (arg === "--build-state") {
      args.buildStateFile = argv[++i];
    } else if (arg === "--scenarios-file") {
      args.scenariosFile = argv[++i];
    } else if (arg === "--scenario-damage-branches") {
      args.scenarioDamageBranchesFile = argv[++i];
    } else if (arg === "--conditional-dedupe") {
      args.conditionalDedupe = argv[++i];
    } else if (arg === "--deduped-composition") {
      args.dedupedComposition = argv[++i];
    } else if (arg === "--structural-relations") {
      args.structuralRelations = argv[++i];
    } else if (arg === "--sf-usage") {
      args.sfUsage = argv[++i];
    } else if (arg === "--sf-sources") {
      args.sfSources = argv[++i];
    } else if (arg === "--definition-search") {
      args.definitionSearch = argv[++i];
    } else if (arg === "--field-records") {
      args.fieldRecords = argv[++i];
    } else if (arg === "--record-segments") {
      args.recordSegments = argv[++i];
    } else if (arg === "--record-headers") {
      args.recordHeaders = argv[++i];
    } else if (arg === "--record-header-patterns") {
      args.recordHeaderPatterns = argv[++i];
    } else if (arg === "--record-header-pattern-report") {
      args.recordHeaderPatternReport = argv[++i];
    } else if (arg === "--record-header-payload-plan") {
      args.recordHeaderPayloadPlan = argv[++i];
    } else if (arg === "--normalized-header-layouts") {
      args.normalizedHeaderLayouts = argv[++i];
    } else if (arg === "--formula-hash-layout-focus") {
      args.formulaHashLayoutFocus = argv[++i];
    } else if (arg === "--formula-hash-field-boundaries") {
      args.formulaHashFieldBoundaries = argv[++i];
    } else if (arg === "--formula-hash-header-preludes") {
      args.formulaHashHeaderPreludes = argv[++i];
    } else if (arg === "--hash-suffix-definition-links") {
      args.hashSuffixDefinitionLinks = argv[++i];
    } else if (arg === "--hash-suffix-value-patterns") {
      args.hashSuffixValuePatterns = argv[++i];
    } else if (arg === "--hash-suffix-candidate-semantics") {
      args.hashSuffixCandidateSemantics = argv[++i];
    } else if (arg === "--hash-suffix-dictionary-mining") {
      args.hashSuffixDictionaryMining = argv[++i];
    } else if (arg === "--hash-suffix-family-evidence") {
      args.hashSuffixFamilyEvidence = argv[++i];
    } else if (arg === "--hash-suffix-source-name-audit") {
      args.hashSuffixSourceNameAudit = argv[++i];
    } else if (arg === "--hash-suffix-binary-source-audit") {
      args.hashSuffixBinarySourceAudit = argv[++i];
    } else if (arg === "--hash-suffix-binary-context-comparison") {
      args.hashSuffixBinaryContextComparison = argv[++i];
    } else if (arg === "--hash-suffix-sublayout-classification") {
      args.hashSuffixSublayoutClassification = argv[++i];
    } else if (arg === "--hash-suffix-sublayout-fields") {
      args.hashSuffixSublayoutFields = argv[++i];
    } else if (arg === "--hash-suffix-field-shape-decoders") {
      args.hashSuffixFieldShapeDecoders = argv[++i];
    } else if (arg === "--hash-suffix-decoded-offset-links") {
      args.hashSuffixDecodedOffsetLinks = argv[++i];
    } else if (arg === "--hash-suffix-offset-record-inspection") {
      args.hashSuffixOffsetRecordInspection = argv[++i];
    } else if (arg === "--hash-suffix-record-boundary-comparison") {
      args.hashSuffixRecordBoundaryComparison = argv[++i];
    } else if (arg === "--hash-suffix-boundary-preludes") {
      args.hashSuffixBoundaryPreludes = argv[++i];
    } else if (arg === "--hash-suffix-prelude-header-comparison") {
      args.hashSuffixPreludeHeaderComparison = argv[++i];
    } else if (arg === "--hash-suffix-header-shape-comparison") {
      args.hashSuffixHeaderShapeComparison = argv[++i];
    } else if (arg === "--hash-suffix-compact-pattern-search") {
      args.hashSuffixCompactPatternSearch = argv[++i];
    } else if (arg === "--hash-suffix-named-table-audit") {
      args.hashSuffixNamedTableAudit = argv[++i];
    } else if (arg === "--record-header-source-freshness-audit") {
      args.recordHeaderSourceFreshnessAudit = argv[++i];
    } else if (arg === "--bonus-percent-selector-matrix") {
      args.bonusPercentSelectorMatrix = argv[++i];
    } else if (arg === "--selector-949-peer-audit") {
      args.selector949PeerAudit = argv[++i];
    } else if (arg === "--selector-949-compact-corpus") {
      args.selector949CompactCorpus = argv[++i];
    } else if (arg === "--decoded-dictionary-string-scan") {
      args.decodedDictionaryStringScan = argv[++i];
    } else if (arg === "--unanchored-bonus-percent-audit") {
      args.unanchoredBonusPercentAudit = argv[++i];
    } else if (arg === "--metadata-12337-context-audit") {
      args.metadata12337ContextAudit = argv[++i];
    } else if (arg === "--metadata-12337-scale-corpus") {
      args.metadata12337ScaleCorpus = argv[++i];
    } else if (arg === "--selector-asset-pair-corpus") {
      args.selectorAssetPairCorpus = argv[++i];
    } else if (arg === "--selector-asset-layout-parser") {
      args.selectorAssetLayoutParser = argv[++i];
    } else if (arg === "--selector-asset-owner-fields") {
      args.selectorAssetOwnerFields = argv[++i];
    } else if (arg === "--bonus-percent-coverage-audit") {
      args.bonusPercentCoverageAudit = argv[++i];
    } else if (arg === "--local-table-source-alternatives") {
      args.localTableSourceAlternatives = argv[++i];
    } else if (arg === "--sf32-field-promotion-decision") {
      args.sf32FieldPromotionDecision = argv[++i];
    } else if (arg === "--sf33-build-state-trigger-audit") {
      args.sf33BuildStateTriggerAudit = argv[++i];
    } else if (arg === "--sf33-activation-source-corpus") {
      args.sf33ActivationSourceCorpus = argv[++i];
    } else if (arg === "--sf33-activation-source-search-audit") {
      args.sf33ActivationSourceSearchAudit = argv[++i];
    } else if (arg === "--sf33-build-state-neighborhood-audit") {
      args.sf33BuildStateNeighborhoodAudit = argv[++i];
    } else if (arg === "--sf33-offset-table-entries-audit") {
      args.sf33OffsetTableEntriesAudit = argv[++i];
    } else if (arg === "--sf33-offset-table-parent-run-audit") {
      args.sf33OffsetTableParentRunAudit = argv[++i];
    } else if (arg === "--sf33-parent-run-semantics-audit") {
      args.sf33ParentRunSemanticsAudit = argv[++i];
    } else if (arg === "--sf33-named-build-state-source-audit") {
      args.sf33NamedBuildStateSourceAudit = argv[++i];
    } else if (arg === "--sf33-binary-parent-source-audit") {
      args.sf33BinaryParentSourceAudit = argv[++i];
    } else if (arg === "--uptime-proof-audit") {
      args.uptimeProofAudit = argv[++i];
    } else if (arg === "--sf28-sf29-role-audit") {
      args.sf28Sf29RoleAudit = argv[++i];
    } else if (arg === "--uptime-neighbor-dependency-audit") {
      args.uptimeNeighborDependencyAudit = argv[++i];
    } else if (arg === "--aspect-slot-readiness") {
      args.aspectSlotReadiness = argv[++i];
    } else if (arg === "--cluster-start") {
      args.clusterStart = Number(argv[++i]);
    } else if (arg === "--cluster-end") {
      args.clusterEnd = Number(argv[++i]);
    } else if (arg === "--promotion-risk-file") {
      args.promotionRiskFile = argv[++i];
    } else if (arg === "--mode") {
      args.mode = argv[++i];
    } else if (arg === "--include-priority") {
      args.includePriority = argv[++i];
    } else if (arg === "--read-bytes") {
      args.readBytes = Number(argv[++i]);
    } else if (arg === "--offset") {
      args.offset = Number(argv[++i]);
    } else if (arg === "--magic") {
      args.magic = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.command = "help";
    }
  }

  return args;
}

function printHelp() {
  console.log(`Diablo IV Data Exporter

Usage:
  node d4export.js scan [--game-path <path>] [--out <dir>]
  node d4export.js inspect-index --file <idx-or-index> [--out <dir>] [--max-records <n>]
  node d4export.js probe-payloads --file <idx> [--data-dir <dir>] [--out <dir>]
  node d4export.js scan-magic --file <data-file> [--magic BLTE] [--out <dir>]
  node d4export.js decode-blte --file <data-file> --offset <n> [--out <dir>]
  node d4export.js inspect-decoded-strings --file <decoded.bin> [--terms a,b,c] [--out <dir>]
  node d4export.js inspect-field-records --file <decoded.bin> [--terms a,b,c] [--out <dir>]
  node d4export.js inspect-record-segments --file <decoded.bin> [--out <dir>]
  node d4export.js inspect-record-headers --file <decoded.bin> [--cluster-start <n>] [--cluster-end <n>] [--out <dir>]
  node d4export.js compare-record-header-patterns --file <decoded.bin> [--asset-ids 1663210] [--out <dir>]
  node d4export.js compare-record-header-pattern-reports --merge-files <record-header-pattern-comparison.json,...> [--out <dir>]
  node d4export.js compare-normalized-header-layouts --merge-files <record-header-pattern-comparison.json,...> [--out <dir>]
  node d4export.js compare-formula-hash-layouts --merge-files <record-header-pattern-comparison.json,...> [--out <dir>]
  node d4export.js inspect-formula-hash-field-boundaries --merge-files <record-header-pattern-comparison.json,...> [--out <dir>]
  node d4export.js inspect-formula-hash-header-preludes --merge-files <record-header-pattern-comparison.json,...> [--read-bytes <n>] [--out <dir>]
  node d4export.js compare-hash-suffix-definitions --formula-hash-field-boundaries <formula-hash-field-boundaries.json> --definition-search <conditional-definition-search.json> [--out <dir>]
  node d4export.js analyze-hash-suffix-value-patterns --formula-hash-field-boundaries <formula-hash-field-boundaries.json> [--out <dir>]
  node d4export.js analyze-hash-suffix-candidate-semantics --formula-hash-field-boundaries <formula-hash-field-boundaries.json> [--out <dir>]
  node d4export.js mine-hash-suffix-dictionary --formula-hash-field-boundaries <formula-hash-field-boundaries.json> [--data-dir <decoded-bin-root>] [--out <dir>]
  node d4export.js summarize-hash-suffix-family-evidence --hash-suffix-dictionary-mining <hash-suffix-dictionary-mining.json> [--out <dir>]
  node d4export.js audit-hash-suffix-source-names --hash-suffix-family-evidence <hash-suffix-family-evidence.json> --data-dir <outputs-root> [--out <dir>]
  node d4export.js audit-hash-suffix-binary-sources --hash-suffix-family-evidence <hash-suffix-family-evidence.json> --data-dir <decoded-bin-root> [--out <dir>]
  node d4export.js compare-hash-suffix-binary-contexts --hash-suffix-binary-source-audit <hash-suffix-binary-source-audit.json> [--out <dir>]
  node d4export.js classify-hash-suffix-sublayouts --hash-suffix-family-evidence <hash-suffix-family-evidence.json> --hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json> [--out <dir>]
  node d4export.js parse-hash-suffix-sublayout-fields --hash-suffix-sublayout-classification <hash-suffix-sublayout-classification.json> [--out <dir>]
  node d4export.js decode-hash-suffix-field-shapes --hash-suffix-sublayout-fields <hash-suffix-sublayout-fields.json> [--out <dir>]
  node d4export.js link-hash-suffix-decoded-offsets --hash-suffix-field-shape-decoders <hash-suffix-field-shape-decoders.json> --hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json> [--out <dir>]
  node d4export.js inspect-hash-suffix-offset-records --hash-suffix-decoded-offset-links <hash-suffix-decoded-offset-links.json> --field-records <field-record-inspection.json> [--out <dir>]
  node d4export.js compare-hash-suffix-record-boundaries --hash-suffix-decoded-offset-links <hash-suffix-decoded-offset-links.json> --merge-files <field-record-inspection.json,...> [--out <dir>]
  node d4export.js inspect-hash-suffix-boundary-preludes --hash-suffix-record-boundary-comparison <hash-suffix-record-boundary-comparison.json> --data-dir <outputs-root> [--read-bytes <n>] [--out <dir>]
  node d4export.js compare-hash-suffix-preludes-with-header-patterns --hash-suffix-boundary-preludes <hash-suffix-boundary-preludes.json> --merge-files <record-header-pattern-comparison.json,...> [--out <dir>]
  node d4export.js compare-hash-suffix-header-shapes --merge-files <record-header-pattern-comparison.json,...> [--out <dir>]
  node d4export.js search-hash-suffix-compact-pattern --data-dir <decoded-bin-root> [--out <dir>]
  node d4export.js audit-hash-suffix-named-tables --data-dir <outputs-root> [--out <dir>]
  node d4export.js summarize-bonus-percent-sample-coverage --graphs-file <formula-graphs.json> --record-header-payload-plan <record-header-payload-plan.json> --hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json> [--out <dir>]
  node d4export.js plan-record-header-payloads --file <external-target-search.json> [--out <dir>]
  node d4export.js mine-formula-hash-candidates --file <deadbeef-string-search.json> [--out <dir>]
  node d4export.js catalog-blte --file <data-file> [--out <dir>] [--max-hits <n>]
  node d4export.js catalog-blte-dir --data-dir <dir> [--out <dir>] [--file-limit <n>] [--max-decode-mb <n>]
  node d4export.js analyze-deadbeef --file <data-file> [--out <dir>]
  node d4export.js analyze-deadbeef-dir --data-dir <dir> [--out <dir>]
  node d4export.js search-deadbeef-strings --data-dir <dir> [--terms a,b,c]
  node d4export.js audit-local-artifact-terms --data-dir <dir> --terms a,b,c [--out <dir>] [--max-file-mb <n>]
  node d4export.js export-formulas --data-dir <dir> [--out <dir>]
  node d4export.js export-formula-graphs --file <formulas.json> [--out <dir>]
  node d4export.js evaluate-formula-graphs --file <formula-graphs.json> [--out <dir>]
  node d4export.js inspect-sf --file <formula-graphs.json> [--out <dir>]
  node d4export.js export-sf-candidates --file <formula-graphs.json> [--out <dir>]
  node d4export.js analyze-sf-usage --file <formula-graphs.json> --sf-candidates <sf-candidates.json> [--out <dir>]
  node d4export.js resolve-missing-sf --file <sf-usage-analysis.json> --sf-candidates <sf-candidates.json> [--out <dir>]
  node d4export.js inspect-priority-assets --file <formula-graphs.json> --sf-candidates <sf-candidates.json> --missing-sf <missing-sf-resolution.json> [--asset-ids 1461593,1663210] [--out <dir>]
  node d4export.js export-external-refs --file <formula-graphs.json> [--priority-inspection <priority-asset-inspection.json>] [--out <dir>]
  node d4export.js search-external-targets --data-dir <dir> --external-refs <external-references.json> [--out <dir>] [--file-limit <n>] [--file-offset <n>] [--file-names data.064,data.065] [--decoded-types deadbeef-binary,unknown-binary]
  node d4export.js plan-external-target-scan --data-dir <dir> --external-refs <external-references.json> [--terms a,b,c] [--chunk-size 64] [--total-files 222] [--out <dir>]
  node d4export.js merge-external-target-searches --merge-files <external-target-search.json,...> [--out <dir>]
  node d4export.js inspect-external-values --file <formula-graphs.json> [--asset-ids 1882772] [--out <dir>]
  node d4export.js export-canonical-vars --file <formula-graphs.json> [--external-values <external-value-inspection.json>] [--out <dir>]
  node d4export.js export-canonical-context --file <canonical-external-variables.json> [--out <dir>]
  node d4export.js evaluate-canonical-vars --file <canonical-external-variables.json> [--context-file <canonical-context.json>] [--out <dir>]
  node d4export.js build-dps-model --file <canonical-formula-evaluation.json> [--out <dir>]
  node d4export.js export-optimizer-dataset --file <reviewed-dps-model.json> [--candidate-context <conditional-candidate-context.json>] [--out <dir>]
  node d4export.js export-target-dataset --file <optimizer-dataset.json> [--out <dir>]
  node d4export.js validate-target-dataset --file <target-dataset.json> [--out <dir>]
  node d4export.js compose-target-build --file <target-dataset.json> --asset-ids 1461593,1663210 [--mode strict|what-if] [--aspect-slot-readiness <aspect-slot-readiness.json>] [--out <dir>]
  node d4export.js audit-target-blockers --file <target-build-composition.json> [--candidate-context <conditional-candidate-context.json>] [--sf-sources <conditional-sf-source-inspection.json>] [--definition-search <conditional-definition-search.json>] [--field-records <field-record-inspection.json>] [--record-segments <record-segment-inspection.json>] [--record-headers <record-header-inspection.json>] [--record-header-patterns <record-header-pattern-comparison.json>] [--record-header-pattern-report <record-header-pattern-report-comparison.json>] [--normalized-header-layouts <normalized-header-layout-comparison.json>] [--formula-hash-layout-focus <formula-hash-layout-focus.json>] [--formula-hash-field-boundaries <formula-hash-field-boundaries.json>] [--formula-hash-header-preludes <formula-hash-header-preludes.json>] [--hash-suffix-definition-links <hash-suffix-definition-links.json>] [--hash-suffix-value-patterns <hash-suffix-value-patterns.json>] [--hash-suffix-candidate-semantics <hash-suffix-candidate-semantics.json>] [--hash-suffix-dictionary-mining <hash-suffix-dictionary-mining.json>] [--hash-suffix-family-evidence <hash-suffix-family-evidence.json>] [--hash-suffix-source-name-audit <hash-suffix-source-name-audit.json>] [--hash-suffix-binary-source-audit <hash-suffix-binary-source-audit.json>] [--hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json>] [--hash-suffix-sublayout-classification <hash-suffix-sublayout-classification.json>] [--hash-suffix-sublayout-fields <hash-suffix-sublayout-fields.json>] [--hash-suffix-field-shape-decoders <hash-suffix-field-shape-decoders.json>] [--hash-suffix-decoded-offset-links <hash-suffix-decoded-offset-links.json>] [--hash-suffix-offset-record-inspection <hash-suffix-offset-record-inspection.json>] [--hash-suffix-record-boundary-comparison <hash-suffix-record-boundary-comparison.json>] [--hash-suffix-boundary-preludes <hash-suffix-boundary-preludes.json>] [--hash-suffix-prelude-header-comparison <hash-suffix-prelude-header-comparison.json>] [--hash-suffix-header-shape-comparison <hash-suffix-header-shape-comparison.json>] [--record-header-source-freshness-audit <record-header-source-freshness-audit.json>] [--bonus-percent-selector-matrix <bonus-percent-selector-matrix.json>] [--selector-949-peer-audit <selector-949-peer-audit.json>] [--selector-949-compact-corpus <selector-949-compact-corpus-scan.json>] [--decoded-dictionary-string-scan <decoded-dictionary-string-scan.json>] [--unanchored-bonus-percent-audit <unanchored-bonus-percent-audit.json>] [--metadata-12337-context-audit <metadata-12337-context-audit.json>] [--metadata-12337-scale-corpus <metadata-12337-scale-corpus-scan.json>] [--selector-asset-pair-corpus <selector-asset-pair-corpus-scan.json>] [--selector-asset-layout-parser <selector-asset-layout-parser.json>] [--selector-asset-owner-fields <selector-asset-owner-fields.json>] [--bonus-percent-coverage-audit <bonus-percent-coverage-audit.json>] [--local-table-source-alternatives <local-table-source-alternatives.json>] [--sf33-activation-source-search-audit <sf33-activation-source-search-audit.json>] [--out <dir>]
  node d4export.js analyze-dps-sensitivity --file <canonical-external-variables.json> [--context-file <canonical-context.json>] [--out <dir>]
  node d4export.js audit-dps-roles --file <minimal-dps-model.json> [--out <dir>]
  node d4export.js audit-damage-components --file <dps-model.json> [--out <dir>]
  node d4export.js audit-global-branch-signals --graphs-file <formula-graphs.json> [--file <dps-model.json>] [--out <dir>]
  node d4export.js inspect-conditional-damage --graphs-file <formula-graphs.json> [--file <dps-model.json>] [--priority-inspection <priority-asset-inspection.json>] [--asset-ids 1663210] [--out <dir>]
  node d4export.js inspect-conditional-damage-dedupe --file <conditional-damage-inspection.json> [--out <dir>]
  node d4export.js audit-deduped-damage-composition --file <dps-model.json> --conditional-dedupe <conditional-damage-dedupe.json> [--out <dir>]
  node d4export.js build-conditional-sf-scenarios --file <conditional-damage-inspection.json> --deduped-composition <deduped-damage-composition-audit.json> [--asset-ids 1663210] [--out <dir>]
  node d4export.js build-conditional-candidate-context --structural-relations <structural-relations.json> --scenarios-file <conditional-sf-scenarios.json> [--out <dir>]
  node d4export.js inspect-conditional-sf-sources --file <conditional-damage-inspection.json> --priority-inspection <priority-asset-inspection.json> [--sf-usage <sf-usage-analysis.json>] [--sf-candidates <sf-candidates.json>] [--asset-ids 1663210] [--out <dir>]
  node d4export.js inspect-conditional-external-metadata --file <conditional-sf-source-inspection.json> --external-targets <external-target-search.json> [--external-refs <external-references.json>] [--asset-ids 1663210] [--out <dir>]
  node d4export.js inspect-conditional-metadata-values --file <conditional-external-metadata-inspection.json> --external-targets <external-target-search.json> [--asset-ids 1663210] [--out <dir>]
  node d4export.js inspect-conditional-definition-search --file <conditional-metadata-value-inspection.json> --external-targets <external-target-search.json> [--asset-ids 1663210] [--out <dir>]
  node d4export.js inspect-damage-context --file <damage-component-audit.json> --graphs-file <formula-graphs.json> [--asset-ids 2302974] [--out <dir>]
  node d4export.js inspect-branch-controls --damage-context <damage-context-inspection.json> --graphs-file <formula-graphs.json> [--asset-ids 2302974] [--out <dir>]
  node d4export.js export-build-state-template --branch-controls <branch-control-inspection.json> [--asset-ids 2302974] [--out <dir>]
  node d4export.js evaluate-build-state-scenarios --build-state <build-state-template.json> [--out <dir>]
  node d4export.js inspect-scenario-sf-mappings --scenarios-file <build-state-scenarios.json> --sf-candidates <sf-candidates.json> [--asset-ids 2302974] [--out <dir>]
  node d4export.js inspect-scenario-sf-bytecode --file <scenario-sf-mappings.json> [--out <dir>]
  node d4export.js infer-scenario-damage-branches --file <scenario-sf-bytecode.json> [--scenarios-file <build-state-scenarios.json>] [--out <dir>]
  node d4export.js build-branch-aware-dps-model --file <reviewed-dps-model.json> --scenario-damage-branches <scenario-damage-branches.json> [--out <dir>]
  node d4export.js build-experimental-dps-model --file <minimal-dps-model.json> --audit-file <dps-role-audit.json> [--include-priority high|medium|low] [--out <dir>]
  node d4export.js compare-dps-models --file <strict-minimal-dps-model.json> --experimental-file <experimental-dps-model.json> [--out <dir>]
  node d4export.js inspect-dps-gaps --file <strict-minimal-dps-model.json> --comparison-file <dps-model-comparison.json> --audit-file <dps-role-audit.json> [--out <dir>]
  node d4export.js inspect-gap-context --gap-file <dps-gap-inspection.json> --priority-inspection <priority-asset-inspection.json> [--out <dir>]
  node d4export.js inspect-promotion-risks --comparison-file <dps-model-comparison.json> --graphs-file <formula-graphs.json> [--priority-inspection <priority-asset-inspection.json>] [--out <dir>]
  node d4export.js build-reviewed-dps-model --file <strict-minimal-dps-model.json> --promotion-risk-file <promotion-risk-inspection.json> [--out <dir>]
  node d4export.js search-table-candidates --data-dir <dir> [--table-ids 34,35] [--out <dir>]
  node d4export.js inspect-table-candidates --file <table-candidates-strong.json> [--asset-ids 1961745,79921] [--out <dir>]

Commands:
  scan           Inventory the local install and analyze sample index files.
  inspect-index  Analyze one .idx or .index file and export a JSON report.
  probe-payloads Validate index-to-data mapping hypotheses on tiny samples.
  scan-magic     Find magic signatures inside a data file.
  decode-blte    Decode one unencrypted BLTE payload.
  inspect-decoded-strings Inspect ASCII strings plus nearby binary words in a decoded payload.
  inspect-field-records Inspect string-to-string field records and typed formula tokens.
  inspect-record-segments Compare binary segments between decoded ASCII strings.
  inspect-record-headers Inspect candidate field headers around a decoded string cluster.
  compare-record-header-patterns Compare formula/hash/asset-like header patterns in a decoded payload.
  compare-record-header-pattern-reports Compare several record header pattern reports.
  compare-normalized-header-layouts Compare normalized token layouts across header pattern reports.
  compare-formula-hash-layouts Compare validated formula->hash and hash->asset layouts only.
  audit-hash-suffix-source-names Audit current artifacts for named selector/metadata sources.
  audit-hash-suffix-binary-sources Audit decoded binaries for selector/metadata source contexts.
  compare-hash-suffix-binary-contexts Compare binary family contexts around watched selector/metadata ids.
  classify-hash-suffix-sublayouts Classify repeated suffix selector sublayouts without promoting DPS.
  parse-hash-suffix-sublayout-fields Build blocked field candidates from classified suffix sublayouts.
  decode-hash-suffix-field-shapes Validate candidate decoders for suffix field shapes without promotion.
  link-hash-suffix-decoded-offsets Link decoded suffix candidates back to binary offsets.
  inspect-hash-suffix-offset-records Inspect decoded offset links against local string records.
  compare-hash-suffix-record-boundaries Compare suffix record boundaries across assets.
  inspect-hash-suffix-boundary-preludes Inspect bytes before localized suffix boundaries.
  compare-hash-suffix-preludes-with-header-patterns Compare suffix preludes with known header transitions.
  compare-hash-suffix-header-shapes Compare hash-to-asset suffix shapes directly from header transitions.
  search-hash-suffix-compact-pattern Search decoded binaries for compact 949/12337/10 suffix pattern.
  audit-hash-suffix-named-tables Audit local artifacts for independent names/tables for 949/12337.
  summarize-bonus-percent-sample-coverage Summarize current Percent_Per_Power sample coverage and next scan need.
  plan-record-header-payloads Prioritize payloads to decode for cross-header comparison.
  mine-formula-hash-candidates Mine adjacent formula/hash candidates from existing string-search exports.
  catalog-blte   Catalog local BLTE payloads and their 30-byte pre-headers.
  catalog-blte-dir Catalog BLTE payload summaries across several data files.
  analyze-deadbeef Analyze decoded EF BE AD DE binary payloads.
  analyze-deadbeef-dir Analyze EF BE AD DE payloads across several data files.
  search-deadbeef-strings Search decoded EF BE AD DE payload strings.
  audit-local-artifact-terms Search existing local artifacts for exact terms.
  export-formulas Export normalized formula-bearing records to formulas.json.
  export-formula-graphs Build dependency graphs from formulas.json.
  evaluate-formula-graphs Evaluate formula graphs with placeholder context.
  inspect-sf     Inspect compiled formula bytecode for SF references.
  export-sf-candidates Export nearby SF symbols, constants, and formula candidates.
  analyze-sf-usage Cross SF symbols with formulas and classify DPS usefulness.
  resolve-missing-sf Explain SF refs used by formulas but missing locally.
  inspect-priority-assets Deep-inspect formula/SF offsets in priority assets.
  export-external-refs Group PowerTag, Affix, hash, table, and priority links.
  search-external-targets Search payloads for assets defining external targets.
  plan-external-target-scan Generate shard commands and a PowerShell scan script.
  merge-external-target-searches Merge several external target search shards.
  inspect-external-values Inspect Affix/Hash refs and infer value mappings.
  export-canonical-vars Export canonical external variables for the DPS engine.
  export-canonical-context Export editable placeholder context for canonical evaluation.
  evaluate-canonical-vars Evaluate canonical formulas with placeholder values.
  build-dps-model Build a minimal traceable DPS prototype from canonical evaluation.
  export-optimizer-dataset Export strict DPS plus blocked candidates for the future site.
  export-target-dataset Convert optimizer-dataset-v0 into the normalized target schema.
  validate-target-dataset Validate a normalized optimizer target dataset.
  compose-target-build Compose selected target entities into strict and what-if bucket totals.
  audit-target-blockers Summarize blocker evidence and next actions for a composed target build.
  analyze-dps-sensitivity Rank canonical variables by impact on the DPS prototype.
  audit-dps-roles Suggest likely roles for formulas excluded from DPS.
  audit-damage-components Audit max/sum choices for damage coefficients.
  audit-global-branch-signals Rank assets by branch, selector, and damage signals.
  inspect-conditional-damage Inspect ternary table damage controlled by SF refs.
  inspect-conditional-damage-dedupe Inspect duplicate conditional damage groups.
  audit-deduped-damage-composition Audit sum-style damage after safe conditional dedupe.
  build-conditional-sf-scenarios Build local SF_33/SF_32 scenario estimates.
  build-conditional-candidate-context Build non-promoted candidate context for traced conditional SF values.
  inspect-conditional-sf-sources Inspect local evidence for conditional SF slot sources.
  inspect-conditional-external-metadata Rank external metadata candidates for conditional SF slots.
  inspect-conditional-metadata-values Inspect nearby values around conditional metadata candidates.
  inspect-conditional-definition-search Search exact definitions and same-key analogies for conditional metadata.
  inspect-damage-context Inspect local context around damage coefficients.
  inspect-branch-controls Inspect nearby branch/state controls for damage coefficients.
  export-build-state-template Export editable build flags and unresolved branch state.
  evaluate-build-state-scenarios Resolve known build flags across generated scenarios.
  inspect-scenario-sf-mappings Map scenario-selected SF refs to local SF candidates.
  inspect-scenario-sf-bytecode Inspect selected SF refs in decoded formula bytecode.
  infer-scenario-damage-branches Infer selector-output to damage-branch candidates.
  build-branch-aware-dps-model Build strict DPS enriched with gated scenario estimates.
  build-experimental-dps-model Build an optimistic DPS model from audit candidates.
  compare-dps-models Compare strict and experimental DPS models.
  inspect-dps-gaps Inspect assets with promoted multipliers but no damage coefficient.
  inspect-gap-context Summarize local formula context for DPS gap candidates.
  inspect-promotion-risks Inspect overcount risk for experimental promotions.
  build-reviewed-dps-model Build strict DPS plus reviewed low-risk promotions.
  search-table-candidates Search decoded payloads for numeric table candidates.
  inspect-table-candidates Export row-shape guesses for candidate numeric tables.

Safety:
  This tool reads local metadata and index structures. It does not decrypt,
  bypass protections, or modify the Diablo IV installation.
`);
}

function auditLocalArtifactTerms(dataDir, terms, options = {}) {
  const maxFileBytes = (options.maxFileMb ?? 50) * 1024 * 1024;
  const files = listFilesRecursive(dataDir);
  const hits = [];
  const skipped = [];

  for (const filePath of files) {
    const stat = fs.statSync(filePath);
    if (stat.size > maxFileBytes) {
      skipped.push({
        filePath,
        size: stat.size,
        reason: "file-too-large",
      });
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    for (const term of terms) {
      const needle = Buffer.from(term, "ascii");
      let offset = buffer.indexOf(needle);
      while (offset !== -1) {
        hits.push({
          term,
          filePath,
          relativePath: path.relative(dataDir, filePath),
          artifactKind: classifyLocalArtifact(filePath),
          offset,
          preview: buildAsciiPreview(buffer, offset, needle.length),
        });
        offset = buffer.indexOf(needle, offset + 1);
      }
    }
  }

  const filesWithHits = new Set(hits.map((hit) => hit.filePath));
  const byTerm = {};
  const byArtifactKind = {};
  for (const hit of hits) {
    byTerm[hit.term] = (byTerm[hit.term] ?? 0) + 1;
    byArtifactKind[hit.artifactKind] = (byArtifactKind[hit.artifactKind] ?? 0) + 1;
  }

  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      dataDir,
    },
    options: {
      terms,
      maxFileBytes,
    },
    summary: {
      filesScanned: files.length - skipped.length,
      filesSkipped: skipped.length,
      filesWithHits: filesWithHits.size,
      hits: hits.length,
      byTerm,
      byArtifactKind,
      recommendation: recommendLocalArtifactAudit(hits),
    },
    skipped,
    hits: hits.slice(0, options.maxHits ?? 1000),
  };
}

function listFilesRecursive(rootDir) {
  const files = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(filePath));
    } else if (entry.isFile()) {
      files.push(filePath);
    }
  }
  return files.sort();
}

function classifyLocalArtifact(filePath) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (normalized.endsWith(".decoded.bin")) return "decoded-binary";
  if (normalized.includes("external-target-search")) return "derived-external-target-search";
  if (normalized.includes("conditional-")) return "derived-conditional-report";
  if (normalized.includes("canonical-")) return "derived-canonical-report";
  if (normalized.endsWith(".md")) return "human-report";
  if (normalized.endsWith(".json")) return "derived-json";
  return "other";
}

function buildAsciiPreview(buffer, offset, length) {
  const start = Math.max(0, offset - 80);
  const end = Math.min(buffer.length, offset + length + 80);
  return buffer
    .subarray(start, end)
    .toString("ascii")
    .replace(/[^\x20-\x7e]+/g, " ")
    .trim();
}

function recommendLocalArtifactAudit(hits) {
  const sourceHits = hits.filter((hit) => hit.artifactKind === "decoded-binary" || hit.artifactKind === "other");
  if (sourceHits.length > 0) {
    return {
      kind: "inspect-source-artifact-hits",
      confidence: "medium",
      note: "At least one term appears in a source-like artifact; inspect previews and offsets next.",
    };
  }
  if (hits.length > 0) {
    return {
      kind: "derived-artifacts-only",
      confidence: "high",
      note: "Terms only appear in generated reports/JSON in the scanned directory.",
    };
  }
  return {
    kind: "no-local-hits",
    confidence: "high",
    note: "No searched terms were found in the scanned local artifacts.",
  };
}

function planExternalTargetScan(args) {
  const dataDir = path.resolve(args.dataDir);
  const externalRefs = path.resolve(args.externalRefs);
  const chunkSize = Number.isFinite(args.chunkSize) && args.chunkSize > 0 ? args.chunkSize : 64;
  const discoveredFiles = discoverDataFiles(dataDir);
  const totalFiles = discoveredFiles.length || (Number.isFinite(args.totalFiles) && args.totalFiles > 0 ? args.totalFiles : 0);
  const chunks = [];

  for (let offset = 0; offset < totalFiles; offset += chunkSize) {
    const limit = Math.min(chunkSize, totalFiles - offset);
    const suffix = String(offset).padStart(3, "0");
    const outDir = path.join(args.outDir, `external-target-search-offset-${suffix}`);
    const command = buildExternalTargetScanCommand({
      dataDir,
      externalRefs,
      terms: args.terms,
      fileOffset: offset,
      fileLimit: limit,
      maxHits: args.maxHits,
      maxDecodeMb: args.maxDecodeMb,
      outDir,
    });
    chunks.push({
      index: chunks.length + 1,
      fileOffset: offset,
      fileLimit: limit,
      outDir,
      expectedOutput: path.join(outDir, "external-target-search.json"),
      command,
      selectedFiles: discoveredFiles.slice(offset, offset + limit),
    });
  }

  const mergeOutDir = path.join(args.outDir, "external-target-search-merged");
  const mergeFiles = chunks.map((chunk) => chunk.expectedOutput);
  const mergeCommand = buildMergeExternalTargetSearchCommand({
    mergeFiles,
    outDir: mergeOutDir,
  });
  const script = buildExternalTargetScanScript(chunks, mergeCommand);

  return {
    plannedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      dataDir,
      externalRefs,
      dataDirReadable: discoveredFiles.length > 0,
      discoveredFiles: discoveredFiles.length,
    },
    options: {
      chunkSize,
      totalFiles,
      terms: args.terms ?? null,
      maxHits: args.maxHits,
      maxDecodeMb: args.maxDecodeMb,
    },
    summary: {
      chunks: chunks.length,
      totalFiles,
      mergeOutDir,
      readyToRun: chunks.length > 0,
      recommendation: chunks.length
        ? "run-generated-powershell-script"
        : "provide-readable-data-dir-or-total-files",
    },
    chunks,
    merge: {
      outDir: mergeOutDir,
      expectedOutput: path.join(mergeOutDir, "external-target-search-merged.json"),
      command: mergeCommand,
    },
    script,
  };
}

function discoverDataFiles(dataDir) {
  try {
    return fs
      .readdirSync(dataDir)
      .filter((name) => /^data\.\d{3}$/.test(name))
      .sort();
  } catch {
    return [];
  }
}

function buildExternalTargetScanCommand(options) {
  const parts = [
    psQuote(process.execPath),
    psQuote(path.resolve(__filename)),
    "search-external-targets",
    "--data-dir",
    psQuote(options.dataDir),
    "--external-refs",
    psQuote(options.externalRefs),
    "--file-offset",
    String(options.fileOffset),
    "--file-limit",
    String(options.fileLimit),
    "--max-hits",
    String(options.maxHits),
    "--max-decode-mb",
    String(options.maxDecodeMb),
  ];
  if (options.terms?.length) {
    parts.push("--terms", psQuote(options.terms.join(",")));
  }
  parts.push("--out", psQuote(options.outDir));
  return `& ${parts.join(" ")}`;
}

function buildMergeExternalTargetSearchCommand(options) {
  return [
    "&",
    psQuote(process.execPath),
    psQuote(path.resolve(__filename)),
    "merge-external-target-searches",
    "--merge-files",
    psQuote(options.mergeFiles.join(",")),
    "--out",
    psQuote(options.outDir),
  ].join(" ");
}

function buildExternalTargetScanScript(chunks, mergeCommand) {
  const lines = [
    "$ErrorActionPreference = 'Stop'",
    "",
  ];
  for (const chunk of chunks) {
    lines.push(`# Shard ${chunk.index}: offset ${chunk.fileOffset}, limit ${chunk.fileLimit}`);
    lines.push(chunk.command);
    lines.push("");
  }
  lines.push("# Merge shards");
  lines.push(mergeCommand);
  lines.push("");
  return lines.join("\r\n");
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function inspectDecodedStrings(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const requestedTerms = options.terms?.length ? options.terms : null;
  const selectedStrings = requestedTerms
    ? strings.filter((item) => requestedTerms.some((term) => item.value.includes(term)))
    : strings;
  const directOffsetRefs = findDirectOffsetRefs(buffer, strings.map((item) => item.offset));

  const inspected = selectedStrings.map((item) => ({
    ...item,
    prefixWords: readWordsAround(buffer, Math.max(0, item.offset - 48), item.offset),
    suffixWords: readWordsAround(buffer, item.endOffset + 1, Math.min(buffer.length, item.endOffset + 49)),
    directOffsetReferences: directOffsetRefs[String(item.offset)] ?? [],
    nearbyStrings: strings
      .filter((other) => other.offset !== item.offset && Math.abs(other.offset - item.offset) <= 700)
      .map((other) => ({
        delta: other.offset - item.offset,
        offset: other.offset,
        value: other.value,
      })),
  }));

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      filePath,
      bytes: buffer.length,
    },
    options: {
      terms: requestedTerms,
    },
    summary: {
      strings: strings.length,
      inspectedStrings: inspected.length,
      stringsWithDirectOffsetReferences: inspected.filter((item) => item.directOffsetReferences.length > 0).length,
      directOffsetReferenceTargets: Object.keys(directOffsetRefs).length,
    },
    strings,
    inspected,
  };
}

function inspectFieldRecords(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const requestedTerms = options.terms?.length ? options.terms : [
    "0.3 * Table(34",
    "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate",
    "PowerTag.Spiritborn_Talent_Ultimate_2",
    "Mod.SoilRuler_B",
  ];
  const selected = strings.filter((item) => requestedTerms.some((term) => item.value.includes(term)));
  const records = selected.map((item) => inspectStringRecord(buffer, strings, item));
  const formulaRecord = records.find((record) => record.value.includes("0.3 * Table(34"));
  const targetRecord = records.find((record) => record.value.includes("Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate"));
  const ownerRecords = records.filter((record) => record.value.includes("PowerTag.Spiritborn_Talent_Ultimate_2"));
  const triggerRecord = records.find((record) => record.value === "Mod.SoilRuler_B");
  const assessment = assessFieldOwnership({ formulaRecord, targetRecord, ownerRecords, triggerRecord });

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "field-record-inspection-v1",
    source: {
      filePath,
      bytes: buffer.length,
    },
    options: {
      terms: requestedTerms,
    },
    summary: {
      strings: strings.length,
      selectedRecords: records.length,
      formulaRecord: formulaRecord ? formulaRecord.offset : null,
      targetRecord: targetRecord ? targetRecord.offset : null,
      fieldOwnership: assessment.fieldOwnership,
      confidence: assessment.confidence,
      blocker: assessment.blocker,
      nextAction: assessment.nextAction,
    },
    assessment,
    records,
  };
}

function inspectRecordSegments(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const segments = [];
  for (let index = 0; index < strings.length - 1; index += 1) {
    const from = strings[index];
    const to = strings[index + 1];
    const start = from.endOffset + 1;
    const end = to.offset;
    const byteLength = end - start;
    if (byteLength <= 0) continue;
    const tokens = decodeTypedRecordTokens(buffer, start, end);
    const signature = segmentSignature(tokens);
    segments.push({
      index,
      start,
      end,
      byteLength,
      from: {
        offset: from.offset,
        value: from.value,
        kind: classifyDecodedStringValue(from.value),
      },
      to: {
        offset: to.offset,
        value: to.value,
        kind: classifyDecodedStringValue(to.value),
      },
      signature,
      roles: classifyRecordSegmentRoles(tokens, from, to),
      tokens,
    });
  }

  const interesting = segments.filter((segment) =>
    segment.roles.length > 0 ||
    /PowerTag|Bonus_|Mod\.|Table\(|SF_/i.test(segment.from.value) ||
    /PowerTag|Bonus_|Mod\.|Table\(|SF_/i.test(segment.to.value)
  );
  const clusterStart = options.clusterStart ?? 18844;
  const clusterEnd = options.clusterEnd ?? 19020;
  const clusterSegments = segments.filter((segment) => segment.start <= clusterEnd && segment.end >= clusterStart);
  const signatureCounts = countBy(segments, (segment) => segment.signature);
  const repeatedSignatures = Object.entries(signatureCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([signature, count]) => ({ signature, count }));

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "record-segment-inspection-v1",
    source: {
      filePath,
      bytes: buffer.length,
    },
    summary: {
      strings: strings.length,
      segments: segments.length,
      interestingSegments: interesting.length,
      clusterSegments: clusterSegments.length,
      repeatedSignatures: repeatedSignatures.length,
      clusterAssessment: assessRecordCluster(clusterSegments, segments),
    },
    repeatedSignatures: repeatedSignatures.slice(0, 20),
    clusterSegments,
    interestingSegments: interesting.slice(0, 80),
  };
}

function inspectRecordHeaders(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const clusterStart = Number.isFinite(options.clusterStart) ? options.clusterStart : 18844;
  const clusterEnd = Number.isFinite(options.clusterEnd) ? options.clusterEnd : 19040;
  const clusterStrings = strings.filter((item) => item.offset <= clusterEnd && item.endOffset >= clusterStart);
  const previousString = strings.filter((item) => item.endOffset < clusterStart).at(-1) ?? null;
  const nextString = strings.find((item) => item.offset > clusterEnd) ?? null;
  const boundaries = [
    ...(previousString ? [previousString] : []),
    ...clusterStrings,
    ...(nextString ? [nextString] : []),
  ].sort((a, b) => a.offset - b.offset);

  const candidateFields = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const from = boundaries[index];
    const to = boundaries[index + 1];
    const start = Math.max(clusterStart, from.endOffset + 1);
    const end = Math.min(clusterEnd, to.offset);
    if (end <= start) continue;
    const tokens = decodeTypedRecordTokens(buffer, start, end);
    const words = readWordsAround(buffer, start, end)
      .filter((word) => word.uint32 !== 0)
      .map((word) => ({
        offset: word.offset,
        uint32: word.uint32,
        float32: word.float32,
        ascii: word.ascii,
      }));
    candidateFields.push({
      index: candidateFields.length,
      start,
      end,
      byteLength: end - start,
      from: pickStringBoundary(from, start),
      to: pickStringBoundary(to, start),
      fromKind: classifyDecodedStringValue(from.value),
      toKind: classifyDecodedStringValue(to.value),
      interpretation: interpretCandidateHeader(tokens, from, to),
      signature: segmentSignature(tokens),
      tokens,
      nonZeroWords: words,
    });
  }

  const assessment = assessHeaderCluster(candidateFields);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "record-header-inspection-v1",
    source: {
      filePath,
      bytes: buffer.length,
    },
    options: {
      clusterStart,
      clusterEnd,
    },
    summary: {
      clusterStart,
      clusterEnd,
      stringsInCluster: clusterStrings.length,
      candidateFields: candidateFields.length,
      assessment,
    },
    stringsInCluster: clusterStrings,
    candidateFields,
  };
}

function compareRecordHeaderPatterns(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const currentAssetId = Number.isFinite(options.currentAssetId) ? options.currentAssetId : 1663210;
  const transitions = [];
  for (let index = 0; index < strings.length - 1; index += 1) {
    const from = strings[index];
    const to = strings[index + 1];
    const start = from.endOffset + 1;
    const end = to.offset;
    if (end <= start) continue;
    const tokens = decodeTypedRecordTokens(buffer, start, end);
    const signature = segmentSignature(tokens);
    const kind = classifyHeaderTransition(from, to, tokens, { currentAssetId });
    transitions.push({
      index,
      start,
      end,
      byteLength: end - start,
      kind,
      signature,
      from: {
        offset: from.offset,
        value: from.value,
        kind: classifyDecodedStringValue(from.value),
      },
      to: {
        offset: to.offset,
        value: to.value,
        kind: classifyDecodedStringValue(to.value),
      },
      tokenSummary: summarizeTokens(tokens),
      tokens,
    });
  }

  const relevant = transitions.filter((transition) => transition.kind !== "other");
  const signatureGroupMap = new Map();
  for (const transition of relevant) {
    const key = JSON.stringify([transition.kind, transition.signature]);
    if (!signatureGroupMap.has(key)) {
      signatureGroupMap.set(key, {
        kind: transition.kind,
        signature: transition.signature,
        items: [],
      });
    }
    signatureGroupMap.get(key).items.push(transition);
  }
  const signatureGroups = Array.from(signatureGroupMap.values())
    .map((group) => ({
      kind: group.kind,
      signature: group.signature,
      count: group.items.length,
      examples: group.items.slice(0, 8).map((item) => ({
        index: item.index,
        start: item.start,
        end: item.end,
        from: item.from.value,
        to: item.to.value,
      })),
    }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));
  const candidateCluster = relevant.filter((transition) =>
    transition.from.value.includes("PowerTag.Spiritborn_Talent_Ultimate_2") ||
    transition.from.value.includes("0.3 * Table(34") ||
    transition.from.value.includes("Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate") ||
    transition.to.value.includes("0.3 * Table(34") ||
    transition.to.value.includes("Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate")
  );
  const assessment = assessHeaderPatternComparison(relevant, signatureGroups, candidateCluster, { currentAssetId });

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "record-header-pattern-comparison-v1",
    source: {
      filePath,
      bytes: buffer.length,
    },
    options: {
      currentAssetId,
      candidateTarget: "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate",
    },
    summary: {
      strings: strings.length,
      transitions: transitions.length,
      relevantTransitions: relevant.length,
      signatureGroups: signatureGroups.length,
      assessment,
    },
    signatureGroups: signatureGroups.slice(0, 40),
    candidateCluster,
    relevantTransitions: relevant.slice(0, 120),
  };
}

function compareRecordHeaderPatternReports(filePaths) {
  const reports = filePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      sourceFile: report.source?.filePath ?? null,
      summary: report.summary,
      groups: report.signatureGroups ?? [],
    };
  });
  const groups = new Map();
  for (const report of reports) {
    for (const group of report.groups) {
      const key = JSON.stringify([group.kind, group.signature]);
      if (!groups.has(key)) {
        groups.set(key, {
          kind: group.kind,
          signature: group.signature,
          reports: [],
          totalCount: 0,
        });
      }
      const entry = groups.get(key);
      entry.reports.push({
        assetId: report.assetId,
        filePath: report.filePath,
        count: group.count,
        examples: group.examples,
      });
      entry.totalCount += group.count;
    }
  }
  const matrix = Array.from(groups.values())
    .map((group) => ({
      ...group,
      reportCount: group.reports.length,
    }))
    .sort((a, b) => b.reportCount - a.reportCount || b.totalCount - a.totalCount || a.kind.localeCompare(b.kind));
  const byKind = Object.entries(groupBy(matrix, (group) => group.kind))
    .map(([kind, items]) => ({
      kind,
      signatures: items.length,
      repeatedAcrossReports: items.filter((item) => item.reportCount > 1).length,
      reportCount: new Set(items.flatMap((item) => item.reports.map((report) => report.assetId))).size,
      assetIds: Array.from(new Set(items.flatMap((item) => item.reports.map((report) => report.assetId)))),
      totalCount: items.reduce((sum, item) => sum + item.totalCount, 0),
      examples: items.slice(0, 8).map((item) => ({
        signature: item.signature,
        reportCount: item.reportCount,
        totalCount: item.totalCount,
        assetIds: item.reports.map((report) => report.assetId),
      })),
    }))
    .sort((a, b) => b.totalCount - a.totalCount || a.kind.localeCompare(b.kind));
  const formulaToHashReports = reports.filter((report) => report.groups.some((group) => group.kind === "formula-to-hash-bytecode")).map((report) => report.assetId);
  const hashToAssetReports = reports.filter((report) => report.groups.some((group) => group.kind === "hash-to-current-asset")).map((report) => report.assetId);
  const repeatedSignatures = matrix.filter((group) => group.reportCount > 1);
  const repeatedFamilies = byKind.filter((kind) => kind.reportCount > 1);
  const assessment = {
    kind: repeatedSignatures.length > 0
      ? "cross-payload-repeated-header-signatures-found"
      : repeatedFamilies.length > 0
        ? "cross-payload-layout-families-repeat-without-exact-signature"
        : "cross-payload-no-repeated-header-signature-yet",
    confidence: repeatedSignatures.length > 0 ? "medium" : repeatedFamilies.length > 0 ? "medium-low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: repeatedSignatures.length > 0
      ? "Des signatures de header se repetent entre payloads, mais pas encore assez pour attribuer le champ SF_32."
      : repeatedFamilies.length > 0
        ? "Des familles de layout se repetent entre payloads, mais les signatures exactes divergent encore selon le bytecode et les constantes."
        : "Les payloads compares confirment des familles de motifs, mais aucune signature exacte ne se repete encore entre les rapports charges.",
    nextAction: repeatedFamilies.length > 0
      ? "Comparer les layouts normalises par famille, pas seulement les signatures exactes, pour isoler les champs stables du suffixe hash."
      : "Ajouter d'autres payloads decodes contenant des couples formule/hash pour obtenir au moins un motif repete comparable au cluster 1663210.",
    evidence: {
      reports: reports.length,
      formulaToHashReports,
      hashToAssetReports,
      repeatedSignatures: repeatedSignatures.length,
      repeatedFamilies: repeatedFamilies.map((kind) => ({
        kind: kind.kind,
        reportCount: kind.reportCount,
        assetIds: kind.assetIds,
      })),
    },
  };

  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "record-header-pattern-report-comparison-v1",
    source: {
      files: filePaths,
    },
    summary: {
      reports: reports.length,
      assets: reports.map((report) => report.assetId),
      signatures: matrix.length,
      repeatedSignatures: repeatedSignatures.length,
      kinds: byKind.length,
      assessment,
    },
    byKind,
    repeatedSignatures,
    signatureMatrix: matrix.slice(0, 120),
    reports: reports.map((report) => ({
      assetId: report.assetId,
      filePath: report.filePath,
      sourceFile: report.sourceFile,
      assessment: report.summary?.assessment ?? null,
    })),
  };
}

function compareNormalizedHeaderLayouts(filePaths) {
  const reports = filePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      transitions: report.relevantTransitions ?? [],
    };
  });
  const transitions = reports.flatMap((report) =>
    report.transitions.map((transition) => ({
      reportFile: report.filePath,
      assetId: report.assetId,
      kind: transition.kind,
      from: transition.from,
      to: transition.to,
      byteLength: transition.byteLength,
      layout: normalizeHeaderTransitionLayout(transition, report.assetId),
    }))
  );
  const byKind = Object.entries(groupBy(transitions, (transition) => transition.kind))
    .map(([kind, items]) => summarizeNormalizedLayoutFamily(kind, items))
    .sort((a, b) => b.reportCount - a.reportCount || b.transitions - a.transitions || a.kind.localeCompare(b.kind));
  const hashFamily = byKind.find((family) => family.kind === "hash-to-current-asset") ?? null;
  const formulaHashFamily = byKind.find((family) => family.kind === "formula-to-hash-bytecode") ?? null;
  const assessment = assessNormalizedLayouts({ byKind, hashFamily, formulaHashFamily });

  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "normalized-header-layout-comparison-v1",
    source: {
      files: filePaths,
    },
    summary: {
      reports: reports.length,
      assets: reports.map((report) => report.assetId),
      transitions: transitions.length,
      families: byKind.length,
      assessment,
    },
    byKind,
  };
}

function compareFormulaHashLayouts(filePaths) {
  const reports = filePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      transitions: report.relevantTransitions ?? [],
    };
  });
  const transitions = reports.flatMap((report) =>
    report.transitions
      .filter((transition) => transition.kind === "formula-to-hash-bytecode" || transition.kind === "hash-to-current-asset")
      .map((transition) => ({
        reportFile: report.filePath,
        assetId: report.assetId,
        kind: transition.kind,
        from: transition.from,
        to: transition.to,
        byteLength: transition.byteLength,
        signature: transition.signature,
        tokenSummary: transition.tokenSummary,
        layout: normalizeHeaderTransitionLayout(transition, report.assetId),
      }))
  );
  const byKind = Object.entries(groupBy(transitions, (transition) => transition.kind))
    .map(([kind, items]) => summarizeFocusedLayoutFamily(kind, items))
    .sort((a, b) => b.reportCount - a.reportCount || b.transitions - a.transitions || a.kind.localeCompare(b.kind));
  const formulaHash = byKind.find((family) => family.kind === "formula-to-hash-bytecode") ?? null;
  const hashAsset = byKind.find((family) => family.kind === "hash-to-current-asset") ?? null;
  const assessment = assessFormulaHashLayoutFocus(formulaHash, hashAsset);

  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "formula-hash-layout-focus-v1",
    source: {
      files: filePaths,
    },
    summary: {
      reports: reports.length,
      assets: reports.map((report) => report.assetId),
      focusedTransitions: transitions.length,
      formulaToHashReports: formulaHash?.reportCount ?? 0,
      hashToAssetReports: hashAsset?.reportCount ?? 0,
      assessment,
    },
    byKind,
  };
}

function inspectFormulaHashFieldBoundaries(filePaths) {
  const reports = filePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      transitions: report.relevantTransitions ?? [],
    };
  });
  const transitions = reports.flatMap((report) =>
    report.transitions
      .filter((transition) => transition.kind === "formula-to-hash-bytecode" || transition.kind === "hash-to-current-asset")
      .map((transition) => {
        const layout = normalizeHeaderTransitionLayout(transition, report.assetId);
        return {
          reportFile: report.filePath,
          assetId: report.assetId,
          kind: transition.kind,
          from: transition.from,
          to: transition.to,
          start: transition.start,
          end: transition.end,
          byteLength: transition.byteLength,
          signature: transition.signature,
          tokenSummary: transition.tokenSummary,
          tokens: transition.tokens ?? [],
          layout,
          boundary: classifyFormulaHashBoundary(transition, layout),
          transitionZone: classifyFormulaHashTransitionZone(transition, layout),
        };
      })
  );
  const formulaBoundaries = transitions.filter((transition) => transition.kind === "formula-to-hash-bytecode");
  const hashBoundaries = transitions.filter((transition) => transition.kind === "hash-to-current-asset");
  const formulaCoreHits = formulaBoundaries.filter((transition) => transition.boundary.formulaOpcodeCore?.found);
  const hashAnchorHits = hashBoundaries.filter((transition) => transition.boundary.hashAssetAnchor?.found);
  const assessment = assessFormulaHashFieldBoundaries({ transitions, formulaBoundaries, hashBoundaries, formulaCoreHits, hashAnchorHits });

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "formula-hash-field-boundaries-v1",
    source: {
      files: filePaths,
    },
    summary: {
      reports: reports.length,
      assets: reports.map((report) => report.assetId),
      focusedTransitions: transitions.length,
      formulaTransitions: formulaBoundaries.length,
      hashAssetTransitions: hashBoundaries.length,
      formulaOpcodeCoreHits: formulaCoreHits.length,
      hashAssetAnchorHits: hashAnchorHits.length,
      assessment,
    },
    boundaries: transitions.map((transition) => ({
      assetId: transition.assetId,
      kind: transition.kind,
      from: transition.from?.value ?? null,
      to: transition.to?.value ?? null,
      start: transition.start,
      end: transition.end,
      byteLength: transition.byteLength,
      signature: transition.signature,
      roles: transition.layout.map((token) => token.role),
      boundary: transition.boundary,
      transitionZone: transition.transitionZone,
    })),
  };
}

function classifyFormulaHashTransitionZone(transition, layout) {
  const tokens = transition.tokens ?? [];
  const start = Number(transition.start);
  const end = Number(transition.end);
  const fromOffset = Number(transition.from?.offset);
  const toOffset = Number(transition.to?.offset);
  const fromValue = transition.from?.value ?? "";
  const toValue = transition.to?.value ?? "";
  const fromEnd = Number.isFinite(fromOffset) ? fromOffset + Buffer.byteLength(fromValue, "ascii") : null;
  const toEnd = Number.isFinite(toOffset) ? toOffset + Buffer.byteLength(toValue, "ascii") : null;
  const enrichedTokens = tokens.map((token, index) => ({
    index,
    offset: token.offset,
    kind: token.kind,
    role: layout[index]?.role ?? token.kind,
    opcode: token.opcode ?? null,
    name: token.name ?? null,
    value: token.value ?? token.u32 ?? null,
  }));
  const tokenRoles = enrichedTokens.map((token) => token.role);
  return {
    fromString: {
      offset: Number.isFinite(fromOffset) ? fromOffset : null,
      end: fromEnd,
      value: fromValue,
      kind: transition.from?.kind ?? null,
      bytesToTransition: Number.isFinite(start) && Number.isFinite(fromEnd) ? start - fromEnd : null,
    },
    postTransition: {
      start: Number.isFinite(start) ? start : null,
      end: Number.isFinite(toOffset) ? toOffset : Number.isFinite(end) ? end : null,
      byteLength: Number.isFinite(start) && Number.isFinite(toOffset) ? toOffset - start : null,
      tokenRoles,
      tokens: enrichedTokens,
      interpretation: interpretPostTransitionZone(transition.kind, tokenRoles),
    },
    toString: {
      offset: Number.isFinite(toOffset) ? toOffset : null,
      end: toEnd,
      value: toValue,
      kind: transition.to?.kind ?? null,
      startsAtTransitionEnd: Number.isFinite(end) && Number.isFinite(toOffset) ? end === toOffset : null,
    },
  };
}

function interpretPostTransitionZone(kind, tokenRoles) {
  if (kind === "formula-to-hash-bytecode" && orderedContains(tokenRoles, ["one", "op:add", "op:multiply"])) {
    return "formula-bytecode-before-target-hash";
  }
  if (kind === "hash-to-current-asset" && orderedContains(tokenRoles, ["ref:0", "raw", "asset-id-raw"])) {
    return "hash-metadata-suffix-before-next-string";
  }
  return "unclassified-post-transition-zone";
}

function inspectFormulaHashHeaderPreludes(filePaths, options = {}) {
  const windowBytes = options.windowBytes ?? 32;
  const reports = filePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      sourceFile: report.source?.filePath ?? null,
      transitions: report.relevantTransitions ?? [],
    };
  });
  const preludes = reports.flatMap((report) => {
    const buffer = report.sourceFile && fs.existsSync(report.sourceFile) ? fs.readFileSync(report.sourceFile) : null;
    return report.transitions
      .filter((transition) => transition.kind === "formula-to-hash-bytecode" || transition.kind === "hash-to-current-asset")
      .map((transition) => inspectTransitionHeaderPrelude({ report, transition, buffer, windowBytes }));
  });
  const byKind = Object.entries(groupBy(preludes, (prelude) => prelude.kind))
    .map(([kind, items]) => summarizeHeaderPreludes(kind, items))
    .sort((a, b) => b.transitions - a.transitions || a.kind.localeCompare(b.kind));
  const assessment = assessFormulaHashHeaderPreludes(byKind, preludes);

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "formula-hash-header-preludes-v1",
    source: {
      files: filePaths,
      windowBytes,
    },
    summary: {
      reports: reports.length,
      assets: reports.map((report) => report.assetId),
      inspectedTransitions: preludes.length,
      readableTransitions: preludes.filter((prelude) => prelude.readable).length,
      assessment,
    },
    byKind,
    preludes,
  };
}

function inspectTransitionHeaderPrelude({ report, transition, buffer, windowBytes }) {
  const readable = Boolean(buffer);
  const start = Number(transition.start);
  const fromOffset = Number(transition.from?.offset);
  const toOffset = Number(transition.to?.offset);
  const readStart = readable && Number.isFinite(start) ? Math.max(0, start - windowBytes) : null;
  const readEnd = readable && Number.isFinite(start) ? Math.min(buffer.length, start) : null;
  const words = readable && readStart !== null && readEnd !== null
    ? readWordsAround(buffer, readStart, readEnd).map((word) => ({
        ...word,
        relativeOffset: word.offset - start,
        role: classifyHeaderPreludeWord(word, { assetId: report.assetId, transition, fromOffset, toOffset }),
      }))
    : [];
  const nearbyHex = readable && readStart !== null && readEnd !== null
    ? buffer.subarray(readStart, readEnd).toString("hex")
    : null;
  const zoneComparison = readable
    ? comparePreludeZones({ buffer, transition, start, fromOffset, readStart })
    : null;
  return {
    assetId: report.assetId,
    kind: transition.kind,
    reportFile: report.filePath,
    sourceFile: report.sourceFile,
    readable,
    from: transition.from?.value ?? null,
    to: transition.to?.value ?? null,
    fromOffset: Number.isFinite(fromOffset) ? fromOffset : null,
    toOffset: Number.isFinite(toOffset) ? toOffset : null,
    start,
    end: transition.end,
    byteLength: transition.byteLength,
    signature: transition.signature,
    nearbyHex,
    zoneComparison,
    words,
  };
}

function comparePreludeZones({ buffer, transition, start, fromOffset, readStart }) {
  if (!buffer || !Number.isFinite(start) || !Number.isFinite(fromOffset)) return null;
  const fromValue = transition.from?.value ?? "";
  const fromStringEnd = Math.min(buffer.length, fromOffset + Buffer.byteLength(fromValue, "ascii"));
  const beforeStart = Math.max(0, readStart ?? Math.max(0, start - 128));
  const beforeEnd = Math.max(beforeStart, fromOffset);
  const stringStart = Math.max(0, fromOffset);
  const stringEnd = Math.min(buffer.length, Math.max(fromStringEnd, fromOffset));
  const betweenStart = stringEnd;
  const betweenEnd = Math.max(betweenStart, start);
  return {
    fromString: {
      offset: fromOffset,
      expectedEnd: fromStringEnd,
      transitionDistance: start - fromOffset,
      asciiPreview: buffer.subarray(stringStart, Math.min(stringEnd, stringStart + 96)).toString("ascii"),
      printableRatio: printableRatio(buffer.subarray(stringStart, stringEnd)),
    },
    beforeFromString: summarizeByteZone(buffer, beforeStart, beforeEnd),
    fromStringToTransition: summarizeByteZone(buffer, stringStart, start),
    afterFromStringBeforeTransition: summarizeByteZone(buffer, betweenStart, betweenEnd),
  };
}

function summarizeByteZone(buffer, start, end) {
  const safeStart = Math.max(0, Math.min(buffer.length, start));
  const safeEnd = Math.max(safeStart, Math.min(buffer.length, end));
  const slice = buffer.subarray(safeStart, safeEnd);
  const words = readWordsAround(buffer, safeStart, safeEnd);
  return {
    start: safeStart,
    end: safeEnd,
    byteLength: safeEnd - safeStart,
    printableRatio: printableRatio(slice),
    asciiPreview: slice.subarray(0, 96).toString("ascii").replace(/[^\x20-\x7e]+/g, "."),
    markerRoles: words
      .map((word) => classifyHeaderPreludeWord(word, { assetId: null, transition: {}, fromOffset: null, toOffset: null }))
      .filter((role) => role !== "raw" && role !== "zero"),
    rawWordCount: words.length,
  };
}

function printableRatio(buffer) {
  if (!buffer.length) return 0;
  let printable = 0;
  for (const byte of buffer) {
    if (byte >= 32 && byte <= 126) printable += 1;
  }
  return Number((printable / buffer.length).toFixed(4));
}

function classifyHeaderPreludeWord(word, context) {
  const value = word.uint32;
  const transition = context.transition;
  if (value === 0) return "zero";
  if (value === 1) return "one";
  if (value === context.assetId) return "asset-id";
  if (Number.isFinite(transition.byteLength) && value === transition.byteLength) return "transition-byte-length";
  if (Number.isFinite(context.fromOffset) && value === context.fromOffset) return "from-string-offset";
  if (Number.isFinite(context.toOffset) && value === context.toOffset) return "to-string-offset";
  if (Number.isFinite(context.fromOffset) && value === context.transition.start - context.fromOffset) return "distance-from-string-to-transition";
  if (Number.isFinite(context.toOffset) && value === context.toOffset - context.transition.start) return "distance-transition-to-next-string";
  if (value > 0 && value <= 255) return "small-counter-or-length";
  if (value >= 1000 && value <= 13000) return "small-table-or-string-id";
  if (value > 1000000 && value < 4000000) return "asset-like-id";
  return "raw";
}

function summarizeHeaderPreludes(kind, preludes) {
  const readable = preludes.filter((prelude) => prelude.readable);
  const relativeOffsets = Array.from(new Set(readable.flatMap((prelude) => prelude.words.map((word) => word.relativeOffset)))).sort((a, b) => a - b);
  const stableRelativeWords = relativeOffsets.map((relativeOffset) => {
    const roles = readable.map((prelude) => prelude.words.find((word) => word.relativeOffset === relativeOffset)?.role ?? "missing");
    const entries = Object.entries(countBy(roles, (role) => role)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return {
      relativeOffset,
      dominantRole: entries[0]?.[0] ?? "missing",
      count: entries[0]?.[1] ?? 0,
      coverage: Number(((entries[0]?.[1] ?? 0) / Math.max(1, readable.length)).toFixed(4)),
      stable: (entries[0]?.[1] ?? 0) === readable.length,
      roles: entries.map(([role, count]) => ({ role, count })),
    };
  });
  const markerHits = readable.map((prelude) => ({
    assetId: prelude.assetId,
    start: prelude.start,
    markers: prelude.words
      .filter((word) => word.role !== "raw")
      .map((word) => ({ relativeOffset: word.relativeOffset, role: word.role, uint32: word.uint32, hex: word.hex })),
  }));
  const markerSequences = readable.map((prelude) => {
    const markers = prelude.words
      .filter((word) => word.role !== "raw" && word.role !== "zero")
      .map((word) => ({
        relativeOffset: word.relativeOffset,
        role: word.role,
        valueKey: markerValueKey(word),
        uint32: word.uint32,
      }));
    return {
      assetId: prelude.assetId,
      start: prelude.start,
      fromOffset: prelude.fromOffset,
      toOffset: prelude.toOffset,
      from: prelude.from,
      to: prelude.to,
      roles: markers.map((marker) => marker.role),
      valueKeys: markers.map((marker) => marker.valueKey),
      markers,
    };
  });
  const roleSequences = markerSequences.map((sequence) => sequence.roles);
  const commonOrderedMarkerRoles = roleSequences.length
    ? roleSequences.reduce((common, sequence) => longestCommonRoleSubsequence(common, sequence))
    : [];
  const repeatedRoleNgrams = summarizeRepeatedMarkerNgrams(markerSequences, "roles");
  const repeatedValueNgrams = summarizeRepeatedMarkerNgrams(markerSequences, "valueKeys");
  const motifWindowClasses = summarizeMotifWindowClasses([...repeatedRoleNgrams, ...repeatedValueNgrams]);
  const zoneComparisons = summarizePreludeZoneComparisons(readable);
  return {
    kind,
    transitions: preludes.length,
    readableTransitions: readable.length,
    stableRelativeWords,
    markerHits,
    markerSequences,
    commonOrderedMarkerRoles,
    repeatedRoleNgrams,
    repeatedValueNgrams,
    motifWindowClasses,
    zoneComparisons,
  };
}

function assessFormulaHashHeaderPreludes(byKind, preludes) {
  const readable = preludes.filter((prelude) => prelude.readable);
  const stableMarkers = byKind.flatMap((family) =>
    family.stableRelativeWords.filter((word) =>
      word.stable &&
      word.dominantRole !== "missing" &&
      word.dominantRole !== "raw" &&
      word.dominantRole !== "zero"
    ).map((word) => ({ kind: family.kind, ...word }))
  );
  const hasSizeOrOffsetMarker = stableMarkers.some((word) =>
    ["transition-byte-length", "from-string-offset", "to-string-offset", "distance-from-string-to-transition", "distance-transition-to-next-string", "small-counter-or-length"].includes(word.dominantRole)
  );
  const sequenceMotifs = byKind.flatMap((family) =>
    (family.repeatedRoleNgrams ?? [])
      .filter((ngram) => ngram.length >= 2 && ngram.sequence.some((role) => role !== "small-counter-or-length"))
      .slice(0, 8)
      .map((ngram) => ({ kind: family.kind, ...ngram }))
  );
  const motifWindowClasses = byKind.flatMap((family) =>
    (family.motifWindowClasses ?? []).map((item) => ({ kind: family.kind, ...item }))
  );
  const zoneComparisons = byKind.flatMap((family) =>
    (family.zoneComparisons ?? []).map((item) => ({ kind: family.kind, ...item }))
  );
  const hasSequenceMotifs = sequenceMotifs.length > 0;
  const hasClassifiedMotifWindows = motifWindowClasses.some((item) => item.classification !== "unknown");
  const hasPrologueVsStringBody = motifWindowClasses.some((item) => item.kind === "formula-to-hash-bytecode" && item.classification === "before-from-string")
    && zoneComparisons.some((item) => item.kind === "formula-to-hash-bytecode" && item.fromStringToTransitionPrintableRatio >= 0.85);
  return {
    kind: hasSizeOrOffsetMarker
      ? "header-prelude-markers-found"
      : hasPrologueVsStringBody
        ? "header-prelude-prologue-before-string-classified"
      : hasClassifiedMotifWindows
        ? "header-prelude-motif-windows-classified"
        : hasSequenceMotifs
        ? "header-prelude-marker-sequences-found"
        : "header-prelude-markers-inconclusive",
    confidence: hasSizeOrOffsetMarker ? "medium-low" : hasPrologueVsStringBody ? "medium-low" : hasClassifiedMotifWindows ? "low" : hasSequenceMotifs ? "low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: hasSizeOrOffsetMarker
      ? "Des marqueurs relatifs apparaissent dans les octets precedant les transitions, mais ils ne suffisent pas encore a attribuer SF_32 comme champ proprietaire."
      : hasPrologueVsStringBody
        ? "Les motifs repetes formula-to-hash sont classes avant la string source, tandis que la zone jusqu'a la transition est essentiellement le texte de la formule. Cela separe mieux prologue et bytecode sans prouver SF_32."
      : hasClassifiedMotifWindows
        ? "Des motifs de marqueurs repetes peuvent etre classes par rapport aux bornes de strings, mais cela distingue seulement des zones candidates sans prouver l'ownership de SF_32."
      : hasSequenceMotifs
        ? "Des motifs de marqueurs se repetent dans les preludes, mais sans alignement ni attribution de champ suffisants pour prouver SF_32."
        : "Les octets precedant les transitions ne donnent pas encore de compteur ou taille de champ stable assez clair.",
    nextAction: hasSizeOrOffsetMarker
      ? "Comparer ces marqueurs avec les offsets de strings et les longueurs de records complets pour construire un decodeur de header champ par champ."
      : hasPrologueVsStringBody
        ? "Inspecter les octets apres la transition pour relier explicitement bytecode de formule, hash cible et suffixe asset sans confondre le prologue avant string."
      : hasClassifiedMotifWindows
        ? "Comparer les motifs classes avant la string source avec les octets situes entre la string et la transition pour separer prologue de record et bytecode adjacent."
      : hasSequenceMotifs
        ? "Comparer les fenetres locales portant ces motifs avec les bornes de strings pour distinguer prologue de record et bytecode adjacent."
        : "Elargir la fenetre de prelude ou ajouter des payloads comparables avant de tenter le decodeur champ par champ.",
    evidence: {
      inspectedTransitions: preludes.length,
      readableTransitions: readable.length,
      stableMarkers: stableMarkers.slice(0, 20),
      sequenceMotifs: sequenceMotifs.slice(0, 20),
      motifWindowClasses: motifWindowClasses.slice(0, 20),
      zoneComparisons: zoneComparisons.slice(0, 20),
    },
  };
}

function compareHashSuffixPreludesWithHeaderPatterns(boundaryPreludeFilePath, headerPatternFilePaths) {
  const preludeReport = JSON.parse(fs.readFileSync(boundaryPreludeFilePath, "utf8"));
  const headerReports = headerPatternFilePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      assessment: report.summary?.assessment ?? null,
      transitions: report.relevantTransitions ?? [],
    };
  });
  const reportsByAsset = new Map(headerReports.map((report) => [String(report.assetId), report]));
  const matches = (preludeReport.windows ?? []).map((window) => {
    const report = reportsByAsset.get(String(window.assetId)) ?? null;
    const candidates = (report?.transitions ?? [])
      .filter((transition) => transition.kind === "hash-to-current-asset")
      .map((transition) => scoreHashSuffixPreludeHeaderMatch(window, transition))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || a.offsetDistance - b.offsetDistance);
    const best = candidates[0] ?? null;
    return {
      assetId: window.assetId,
      fieldId: window.fieldId,
      linkClass: window.linkClass,
      recordValue: window.recordValue,
      selectorOffset: window.selectorOffset,
      metadataOffset: window.metadataOffset,
      betweenRecordAndSelectorSignature: window.betweenRecordAndSelectorSignature,
      headerReportFile: report?.filePath ?? null,
      headerAssessment: report?.assessment
        ? {
            kind: report.assessment.kind,
            confidence: report.assessment.confidence,
            fieldOwnership: report.assessment.fieldOwnership,
            promotionReady: report.assessment.promotionReady,
          }
        : null,
      matchStatus: best
        ? best.exactOffsetHit
          ? "matched-header-transition-at-selector"
          : "matched-header-transition-near-selector"
        : "not-matched",
      bestMatch: best,
      alternatives: candidates.slice(1, 4),
      finding: best
        ? "Le prelude de suffixe retombe sur une transition header hash-to-current-asset, mais cette transition ne nomme pas encore le champ proprietaire."
        : "Aucune transition header hash-to-current-asset suffisamment proche n'a ete retrouvee pour ce prelude.",
    };
  });
  const groups = Object.entries(groupBy(matches, (match) => `${match.fieldId}|${match.matchStatus}|${match.bestMatch?.transitionKind ?? "none"}|${match.bestMatch?.signature ?? "none"}`))
    .map(([key, items]) => ({
      key,
      fieldId: items[0]?.fieldId ?? null,
      matchStatus: items[0]?.matchStatus ?? null,
      transitionKind: items[0]?.bestMatch?.transitionKind ?? null,
      signature: items[0]?.bestMatch?.signature ?? null,
      count: items.length,
      assets: items.map((item) => item.assetId),
      records: items.map((item) => item.recordValue),
    }))
    .sort((a, b) => b.count - a.count || String(a.fieldId).localeCompare(String(b.fieldId)));
  const assessment = assessHashSuffixPreludeHeaderComparison(matches, groups, preludeReport, headerReports);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-prelude-header-comparison-v1",
    source: {
      boundaryPreludeFile: boundaryPreludeFilePath,
      headerPatternFiles: headerPatternFilePaths,
    },
    summary: {
      windows: matches.length,
      matchedWindows: matches.filter((match) => match.matchStatus !== "not-matched").length,
      exactSelectorMatches: matches.filter((match) => match.matchStatus === "matched-header-transition-at-selector").length,
      groups: groups.length,
      assessment,
    },
    groups,
    matches,
  };
}

function scoreHashSuffixPreludeHeaderMatch(window, transition) {
  const transitionRawWords = transition.tokenSummary?.rawWords ?? [];
  const transitionRefs = transition.tokenSummary?.refs ?? [];
  const selector = Number(window.fieldId?.split(":")[1]);
  const selectorHit = Number.isFinite(selector) && transitionRawWords.includes(selector);
  const assetHit = transitionRawWords.includes(Number(window.assetId));
  const recordHit = transition.from?.value === window.recordValue || transition.to?.value === window.recordValue;
  const exactOffsetHit = Number(transition.start) <= Number(window.selectorOffset) && Number(window.selectorOffset) <= Number(transition.end);
  const offsetDistance = Number.isFinite(Number(window.selectorOffset)) && Number.isFinite(Number(transition.start))
    ? Math.abs(Number(window.selectorOffset) - Number(transition.start))
    : Number.POSITIVE_INFINITY;
  const preludeHit = (window.betweenRecordAndSelectorSignature ?? "").includes("small:5") && transitionRefs.includes(0);
  let score = 0;
  if (recordHit) score += 4;
  if (selectorHit) score += 3;
  if (assetHit) score += 3;
  if (exactOffsetHit) score += 3;
  if (preludeHit) score += 1;
  if (!recordHit && !selectorHit && !assetHit) score = 0;
  return {
    transitionKind: transition.kind,
    transitionIndex: transition.index,
    start: transition.start,
    end: transition.end,
    byteLength: transition.byteLength,
    from: transition.from?.value ?? null,
    to: transition.to?.value ?? null,
    signature: transition.signature,
    rawWords: transitionRawWords,
    refs: transitionRefs,
    selectorHit,
    assetHit,
    recordHit,
    preludeHit,
    exactOffsetHit,
    offsetDistance,
    score,
  };
}

function assessHashSuffixPreludeHeaderComparison(matches, groups, preludeReport, headerReports) {
  const matchedWindows = matches.filter((match) => match.matchStatus !== "not-matched");
  const exactSelectorMatches = matches.filter((match) => match.matchStatus === "matched-header-transition-at-selector");
  const repeatedGroups = groups.filter((group) => group.count > 1);
  const allMatched = matches.length > 0 && matchedWindows.length === matches.length;
  return {
    kind: allMatched
      ? "hash-suffix-preludes-match-header-transitions-without-field-name"
      : matchedWindows.length
        ? "hash-suffix-preludes-partially-match-header-transitions"
        : "hash-suffix-preludes-not-linked-to-header-transitions",
    confidence: allMatched && exactSelectorMatches.length ? "medium-high" : matchedWindows.length ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: allMatched
      ? "Les preludes de suffixe correspondent aux transitions header hash-to-current-asset deja detectees. Cela confirme le contexte du suffixe, mais ne nomme pas encore le champ exact ni son ownership."
      : matchedWindows.length
        ? "Une partie des preludes de suffixe correspond aux transitions header hash-to-current-asset, mais l'echantillon reste incomplet."
        : "Les preludes de suffixe ne sont pas encore relies aux transitions header connues.",
    nextAction: repeatedGroups.length
      ? "Elargir l'echantillon de payloads selector:994 et selector:949 pour isoler le mot qui nomme ou borne le champ proprietaire."
      : "Ajouter des payloads comparables contenant Bonus_Percent_Per_Power et relancer la comparaison prelude/header.",
    evidence: {
      windows: matches.length,
      matchedWindows: matchedWindows.length,
      exactSelectorMatches: exactSelectorMatches.length,
      repeatedGroups: repeatedGroups.length,
      preludeAssessment: preludeReport.summary?.assessment?.kind ?? null,
      headerReports: headerReports.length,
    },
  };
}

function compareHashSuffixHeaderShapes(filePaths) {
  const reports = filePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      assessment: report.summary?.assessment ?? null,
      transitions: report.relevantTransitions ?? [],
    };
  });
  const rows = reports.flatMap((report) =>
    report.transitions
      .filter((transition) => transition.kind === "hash-to-current-asset")
      .map((transition) => summarizeHashSuffixHeaderShape(report, transition))
  );
  const groups = summarizeHashSuffixHeaderShapeGroups(rows);
  const assessment = assessHashSuffixHeaderShapes(rows, groups);
  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-header-shape-comparison-v1",
    source: {
      files: filePaths,
    },
    summary: {
      reports: reports.length,
      transitions: rows.length,
      selectors: Array.from(new Set(rows.map((row) => row.selector?.normalizedKey).filter(Boolean))).length,
      groups: groups.length,
      assessment,
    },
    groups,
    rows,
  };
}

function summarizeHashSuffixHeaderShape(report, transition) {
  const tokens = transition.tokens ?? [];
  const rawTokens = tokens.filter((token) => token.kind === "raw-word");
  const refZero = tokens.find((token) => token.kind === "reference-or-field" && token.value === 0) ?? null;
  const selectorToken = rawTokens.find((token) => Number(token.u32) === Number(report.assetId)) ? rawTokens[0] : rawTokens[0] ?? null;
  const selector = selectorToken ? normalizeRawSelector(selectorToken.u32) : null;
  const assetToken = rawTokens.find((token) => Number(token.u32) === Number(report.assetId)) ?? null;
  const metadataCandidates = rawTokens
    .filter((token) => token !== selectorToken && token !== assetToken && token.u32 >= 8000 && token.u32 <= 14000)
    .map((token) => ({ value: token.u32, offset: token.offset }));
  const floatCandidates = tokens
    .filter((token) => token.kind === "float-constant")
    .map((token) => ({ value: token.value, offset: token.valueOffset ?? token.offset }));
  const shapeClass = classifyHashSuffixHeaderShape({
    selector,
    assetToken,
    metadataCandidates,
    floatCandidates,
    transition,
  });
  return {
    assetId: report.assetId,
    reportFile: report.filePath,
    transitionIndex: transition.index,
    start: transition.start,
    end: transition.end,
    byteLength: transition.byteLength,
    from: transition.from?.value ?? null,
    to: transition.to?.value ?? null,
    fromFamily: classifyHashTargetFamily(transition.from?.value),
    toFamily: classifyHashTargetFamily(transition.to?.value),
    selector: selector
      ? {
          value: selector.original,
          normalized: selector.normalized,
          normalizedKey: selector.normalizedKey,
          encoding: selector.encoding,
          offset: selectorToken.offset,
        }
      : null,
    refZero: Boolean(refZero),
    assetAnchor: assetToken
      ? {
          value: assetToken.u32,
          offset: assetToken.offset,
          matchesCurrentAsset: Number(assetToken.u32) === Number(report.assetId),
        }
      : null,
    metadataCandidates,
    floatCandidates,
    signature: transition.signature,
    shapeClass,
    promotionReady: false,
    finding: explainHashSuffixHeaderShape(shapeClass, selector, metadataCandidates, floatCandidates),
  };
}

function classifyHashSuffixHeaderShape({ selector, assetToken, metadataCandidates, floatCandidates, transition }) {
  if (!selector || !assetToken) return "hash-suffix-header-shape-incomplete";
  if (selector.normalized === 949 && metadataCandidates.some((item) => item.value === 12337) && floatCandidates.some((item) => item.value === 10)) {
    return "compact-selector-949-metadata-12337-scale-10";
  }
  if (selector.normalized === 994) return "selector-994-no-local-scale";
  if (selector.normalized === 168 && selector.encoding === "high-bit-encoded") return "high-bit-selector-168-divergent";
  if (selector.normalized === 168) return "plain-selector-168-divergent";
  if (transition.signature?.includes("op:add") || transition.signature?.includes("op:multiply")) return "formula-wrapper-or-expression-suffix";
  if (metadataCandidates.length || floatCandidates.length) return "selector-asset-with-unclassified-values";
  return "selector-asset-only";
}

function explainHashSuffixHeaderShape(shapeClass, selector, metadataCandidates, floatCandidates) {
  if (shapeClass === "compact-selector-949-metadata-12337-scale-10") {
    return "Shape compact local compatible avec selector 949, metadata 12337 et scale 10, mais observe sans ownership de champ.";
  }
  if (shapeClass === "selector-994-no-local-scale") {
    return "Selector 994 ancre l'asset courant sans scale locale visible.";
  }
  if (shapeClass === "high-bit-selector-168-divergent") {
    return "Selector 168 encode high-bit confirme un contexte divergent, pas le shape compact de 1663210.";
  }
  if (shapeClass === "plain-selector-168-divergent") {
    return "Selector 168 plain confirme un contexte divergent, sans scale locale stable.";
  }
  if (metadataCandidates.length || floatCandidates.length) {
    return "Le suffixe contient des valeurs candidates mais leur role exact n'est pas nomme.";
  }
  return selector ? "Le suffixe ancre un selector et l'asset courant, sans autre valeur candidate stable." : "Le suffixe est incomplet pour le parser actuel.";
}

function summarizeHashSuffixHeaderShapeGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.shapeClass}|${row.selector?.normalizedKey ?? "selector:missing"}|${row.fromFamily}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        shapeClass: row.shapeClass,
        selector: row.selector?.normalizedKey ?? null,
        selectorEncoding: new Set(),
        fromFamily: row.fromFamily,
        count: 0,
        assets: new Set(),
        examples: [],
      });
    }
    const group = groups.get(key);
    group.count += 1;
    if (row.assetId != null) group.assets.add(row.assetId);
    if (row.selector?.encoding) group.selectorEncoding.add(row.selector.encoding);
    if (group.examples.length < 8) {
      group.examples.push({
        assetId: row.assetId,
        from: row.from,
        to: row.to,
        selector: row.selector,
        metadataCandidates: row.metadataCandidates,
        floatCandidates: row.floatCandidates,
      });
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      key: group.key,
      shapeClass: group.shapeClass,
      selector: group.selector,
      selectorEncoding: Array.from(group.selectorEncoding).sort(),
      fromFamily: group.fromFamily,
      count: group.count,
      assetCount: group.assets.size,
      assets: Array.from(group.assets).sort((a, b) => a - b),
      promotionReady: false,
      examples: group.examples,
    }))
    .sort((a, b) => b.assetCount - a.assetCount || b.count - a.count || a.key.localeCompare(b.key));
}

function assessHashSuffixHeaderShapes(rows, groups) {
  const compact949 = rows.filter((row) => row.shapeClass === "compact-selector-949-metadata-12337-scale-10");
  const highBit = rows.filter((row) => row.selector?.encoding === "high-bit-encoded");
  const divergentGroups = groups.filter((group) => group.shapeClass !== "compact-selector-949-metadata-12337-scale-10");
  return {
    kind: compact949.length && divergentGroups.length
      ? "hash-suffix-header-shapes-compact-local-and-divergent"
      : compact949.length
        ? "hash-suffix-header-shapes-compact-local-only"
        : rows.length
          ? "hash-suffix-header-shapes-divergent-only"
          : "hash-suffix-header-shapes-empty",
    confidence: rows.length >= 4 ? "medium" : rows.length ? "medium-low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: compact949.length && divergentGroups.length
      ? "Les headers montrent le shape compact 949/12337/10, mais aussi plusieurs shapes divergents; aucun champ unique ne peut etre promu."
      : compact949.length
        ? "Le shape compact est visible dans les headers, mais pas assez repete pour prouver l'ownership."
        : "Les headers ne montrent que des shapes divergents ou incomplets.",
    nextAction: compact949.length < 2
      ? "Trouver un second header compact 949/12337/10 ou une table nommee avant toute promotion DPS."
      : "Comparer les headers compacts repetes avec les bornes de records pour prouver le champ exact.",
    evidence: {
      transitions: rows.length,
      compact949: compact949.length,
      highBitSelectors: highBit.length,
      groups: groups.length,
      divergentGroups: divergentGroups.length,
    },
  };
}

function searchHashSuffixCompactPattern(dataDir) {
  const files = collectDecodedBinFiles(dataDir);
  const exactHits = [];
  const valueHits = [];
  for (const filePath of files) {
    const buffer = fs.readFileSync(filePath);
    for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
      const value = buffer.readUInt32LE(offset);
      if (value === 949 || value === 12337) {
        valueHits.push(summarizeCompactPatternValueHit({ buffer, filePath, offset, value }));
      }
      if (offset + 28 <= buffer.length && isExactCompact949Pattern(buffer, offset)) {
        exactHits.push(summarizeExactCompact949Hit({ buffer, filePath, offset }));
      }
    }
  }
  const filesWithValues = summarizeCompactPatternFiles(valueHits);
  const assessment = assessHashSuffixCompactPatternSearch({ files, exactHits, valueHits, filesWithValues });
  return {
    searchedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-compact-pattern-search-v1",
    source: {
      dataDir,
    },
    summary: {
      filesScanned: files.length,
      exactCompact949Hits: exactHits.length,
      valueHits: valueHits.length,
      filesWithValues: filesWithValues.length,
      assessment,
    },
    exactHits,
    filesWithValues,
    valueHits: valueHits.slice(0, 120),
  };
}

function isExactCompact949Pattern(buffer, offset) {
  return buffer.readUInt32LE(offset) === 949
    && buffer.readUInt32LE(offset + 8) === 0
    && buffer.readUInt32LE(offset + 12) === 0
    && buffer.readUInt32LE(offset + 16) === 12337
    && buffer.readUInt32LE(offset + 20) === 6
    && Math.abs(buffer.readFloatLE(offset + 24) - 10) < 0.000001;
}

function summarizeExactCompact949Hit({ buffer, filePath, offset }) {
  return {
    filePath,
    assetId: inferAssetIdFromPath(filePath) ?? buffer.readUInt32LE(offset + 4),
    offset,
    selector: 949,
    assetCandidate: buffer.readUInt32LE(offset + 4),
    metadataId: buffer.readUInt32LE(offset + 16),
    opcode: buffer.readUInt32LE(offset + 20),
    scale: Number(buffer.readFloatLE(offset + 24).toPrecision(7)),
    hexWindow: buffer.subarray(Math.max(0, offset - 16), Math.min(buffer.length, offset + 40)).toString("hex"),
    words: readWordsAround(buffer, Math.max(0, offset - 16), Math.min(buffer.length, offset + 40)),
    promotionReady: false,
  };
}

function summarizeCompactPatternValueHit({ buffer, filePath, offset, value }) {
  const words = readWordsAround(buffer, Math.max(0, offset - 24), Math.min(buffer.length, offset + 40));
  const nearbyText = extractDecodedAsciiStrings(buffer, { minLength: 4 })
    .filter((item) => Math.abs(item.offset - offset) < 256 || Math.abs(item.endOffset - offset) < 256)
    .slice(0, 6)
    .map((item) => ({
      offset: item.offset,
      endOffset: item.endOffset,
      value: item.value,
      family: classifyHashTargetFamily(item.value),
    }));
  return {
    filePath,
    assetId: inferAssetIdFromPath(filePath),
    offset,
    value,
    role: value === 949 ? "selector-949" : "metadata-12337",
    exactCompact949AtOffset: value === 949 && offset + 28 <= buffer.length ? isExactCompact949Pattern(buffer, offset) : false,
    nearbyText,
    words,
  };
}

function summarizeCompactPatternFiles(valueHits) {
  const groups = new Map();
  for (const hit of valueHits) {
    if (!groups.has(hit.filePath)) {
      groups.set(hit.filePath, {
        filePath: hit.filePath,
        assetId: hit.assetId,
        hits: 0,
        values: new Map(),
        nearbyFamilies: new Set(),
        examples: [],
      });
    }
    const group = groups.get(hit.filePath);
    group.hits += 1;
    group.values.set(hit.value, (group.values.get(hit.value) ?? 0) + 1);
    for (const text of hit.nearbyText ?? []) {
      if (text.family !== "unknown") group.nearbyFamilies.add(text.family);
    }
    if (group.examples.length < 8) {
      group.examples.push({
        offset: hit.offset,
        value: hit.value,
        role: hit.role,
        exactCompact949AtOffset: hit.exactCompact949AtOffset,
        nearbyText: hit.nearbyText,
      });
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      filePath: group.filePath,
      assetId: group.assetId,
      hits: group.hits,
      values: Array.from(group.values.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => Number(a.value) - Number(b.value)),
      nearbyFamilies: Array.from(group.nearbyFamilies).sort(),
      examples: group.examples,
    }))
    .sort((a, b) => b.hits - a.hits || a.filePath.localeCompare(b.filePath));
}

function assessHashSuffixCompactPatternSearch({ files, exactHits, valueHits, filesWithValues }) {
  return {
    kind: exactHits.length > 1
      ? "hash-suffix-compact-pattern-repeated"
      : exactHits.length === 1
        ? "hash-suffix-compact-pattern-local-only"
        : valueHits.length
          ? "hash-suffix-compact-values-without-exact-pattern"
          : "hash-suffix-compact-pattern-not-found",
    confidence: exactHits.length === 1 ? "medium-high" : valueHits.length ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: exactHits.length === 1
      ? "Le motif compact 949/12337/10 est retrouve une seule fois dans les binaires decodes actuels."
      : exactHits.length > 1
        ? "Le motif compact se repete, mais l'ownership champ par champ reste a prouver."
        : "Les valeurs 949 ou 12337 existent, mais le motif compact exact n'est pas repete.",
    nextAction: exactHits.length > 1
      ? "Comparer les occurrences compactes repetees aux bornes de records pour prouver le champ exact."
      : "Chercher une table nommee pour 949/12337 ou decoder davantage de payloads Bonus_Percent_Per_Power avant toute promotion DPS.",
    evidence: {
      filesScanned: files.length,
      exactCompact949Hits: exactHits.length,
      valueHits: valueHits.length,
      filesWithValues: filesWithValues.length,
    },
  };
}

function auditHashSuffixNamedTables(dataDir) {
  const jsonFiles = listFilesRecursive(dataDir).filter((filePath) => filePath.toLowerCase().endsWith(".json"));
  const terms = ["949", "12337"];
  const contexts = [];
  for (const filePath of jsonFiles) {
    const text = fs.readFileSync(filePath, "utf8");
    for (const term of terms) {
      contexts.push(...collectExactNumericContexts(text, term).map((context) => ({
        filePath,
        artifactKind: classifyNamedTableArtifact(filePath),
        term,
        ...context,
        classification: classifyNamedTableContext(filePath, context.preview),
      })));
    }
  }
  const independentCandidates = contexts.filter((context) => context.classification === "independent-table-or-dictionary-candidate");
  const generatedContexts = contexts.filter((context) => context.classification === "generated-hash-suffix-context");
  const numericNoise = contexts.filter((context) => context.classification === "numeric-noise-or-unrelated-table");
  const byTerm = countBy(contexts, (context) => context.term);
  const byClassification = countBy(contexts, (context) => context.classification);
  const assessment = assessHashSuffixNamedTableAudit({ contexts, independentCandidates, generatedContexts, numericNoise });
  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-named-table-audit-v1",
    source: {
      dataDir,
      terms,
    },
    summary: {
      filesScanned: jsonFiles.length,
      contexts: contexts.length,
      independentCandidates: independentCandidates.length,
      generatedContexts: generatedContexts.length,
      numericNoise: numericNoise.length,
      byTerm,
      byClassification,
      assessment,
    },
    independentCandidates: independentCandidates.slice(0, 80),
    generatedContexts: generatedContexts.slice(0, 80),
    numericNoise: numericNoise.slice(0, 80),
  };
}

function collectExactNumericContexts(text, term) {
  const contexts = [];
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<![0-9.])${escaped}(?![0-9.])`, "g");
  let match;
  while ((match = regex.exec(text)) && contexts.length < 120) {
    const offset = match.index;
    const start = Math.max(0, offset - 260);
    const end = Math.min(text.length, offset + term.length + 260);
    contexts.push({
      offset,
      line: text.slice(0, offset).split(/\r?\n/).length,
      preview: text.slice(start, end).replace(/\s+/g, " ").trim(),
    });
  }
  return contexts;
}

function classifyNamedTableArtifact(filePath) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("hash-suffix")) return "generated-hash-suffix-report";
  if (normalized.includes("table-candidates") || normalized.includes("table-inspection")) return "derived-table-report";
  if (normalized.includes("formula") || normalized.includes("canonical") || normalized.includes("conditional")) return "derived-formula-report";
  if (normalized.includes("target-dataset") || normalized.includes("optimizer-dataset")) return "derived-dataset";
  return "derived-json";
}

function classifyNamedTableContext(filePath, preview) {
  const artifactKind = classifyNamedTableArtifact(filePath);
  const text = String(preview ?? "");
  const hasTableWords = /\b(table|dictionary|lookup|enum|field|selector|metadata|schema|name|label)\b/i.test(text);
  const hasGeneratedSuffix = /hash-suffix|fieldOwnership|promotionReady|Bonus_Percent_Per_Power|selector:|metadata:/i.test(text);
  const hasTableCandidateShape = /tableId|numericRuns|table-candidates|table-inspection|row|column/i.test(text);
  if (artifactKind === "generated-hash-suffix-report" || hasGeneratedSuffix) return "generated-hash-suffix-context";
  if (hasTableWords && hasTableCandidateShape) return "independent-table-or-dictionary-candidate";
  if (hasTableWords && artifactKind !== "derived-table-report") return "weak-name-like-context";
  return "numeric-noise-or-unrelated-table";
}

function assessHashSuffixNamedTableAudit({ contexts, independentCandidates, generatedContexts, numericNoise }) {
  return {
    kind: independentCandidates.length
      ? "hash-suffix-named-table-candidates-found"
      : generatedContexts.length
        ? "hash-suffix-named-table-not-found-generated-only"
        : contexts.length
          ? "hash-suffix-named-table-not-found-numeric-only"
          : "hash-suffix-named-table-no-local-hits",
    confidence: independentCandidates.length ? "medium-low" : generatedContexts.length ? "medium-high" : contexts.length ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: independentCandidates.length
      ? "Des contextes locaux ressemblent a une table ou un dictionnaire pour 949/12337, mais ils restent a valider contre le binaire source."
      : generatedContexts.length
        ? "Les seuls contextes nommes pour 949/12337 viennent des rapports generes; aucune table source independante n'est identifiee."
        : contexts.length
          ? "Les valeurs 949/12337 apparaissent localement, mais sans contexte nomme exploitable."
          : "Aucune occurrence locale exacte de 949/12337 n'a ete retrouvee dans les artefacts JSON.",
    nextAction: independentCandidates.length
      ? "Verifier les candidats table/dictionnaire contre les payloads sources avant toute promotion DPS."
      : "Decoder davantage de payloads Bonus_Percent_Per_Power ou chercher une table source externe aux rapports generes.",
    evidence: {
      contexts: contexts.length,
      independentCandidates: independentCandidates.length,
      generatedContexts: generatedContexts.length,
      numericNoise: numericNoise.length,
    },
  };
}

function summarizePreludeZoneComparisons(preludes) {
  return preludes
    .filter((prelude) => prelude.zoneComparison)
    .map((prelude) => ({
      assetId: prelude.assetId,
      start: prelude.start,
      fromOffset: prelude.fromOffset,
      from: prelude.from,
      to: prelude.to,
      beforeFromStringByteLength: prelude.zoneComparison.beforeFromString.byteLength,
      beforeFromStringMarkerRoles: prelude.zoneComparison.beforeFromString.markerRoles,
      fromStringTransitionDistance: prelude.zoneComparison.fromString.transitionDistance,
      fromStringToTransitionPrintableRatio: prelude.zoneComparison.fromStringToTransition.printableRatio,
      fromStringToTransitionPreview: prelude.zoneComparison.fromStringToTransition.asciiPreview,
      afterFromStringBeforeTransitionByteLength: prelude.zoneComparison.afterFromStringBeforeTransition.byteLength,
      afterFromStringBeforeTransitionMarkerRoles: prelude.zoneComparison.afterFromStringBeforeTransition.markerRoles,
    }));
}

function markerValueKey(word) {
  if (word.role === "small-counter-or-length") return `${word.role}:${word.uint32}`;
  if (word.role === "small-table-or-string-id") return `${word.role}:${word.uint32}`;
  if (word.role === "one" || word.role === "asset-id" || word.role === "transition-byte-length") return `${word.role}:${word.uint32}`;
  return word.role;
}

function summarizeRepeatedMarkerNgrams(markerSequences, property) {
  const groups = new Map();
  for (const sequence of markerSequences) {
    const values = sequence[property] ?? [];
    const seenInSequence = new Set();
    for (let length = 2; length <= 4; length += 1) {
      for (let index = 0; index + length <= values.length; index += 1) {
        const slice = values.slice(index, index + length);
        const key = slice.join("|");
        const sequenceKey = `${sequence.assetId}:${sequence.start}:${key}`;
        if (seenInSequence.has(sequenceKey)) continue;
        seenInSequence.add(sequenceKey);
        if (!groups.has(key)) {
          groups.set(key, {
            sequence: slice,
            length,
            occurrences: 0,
            examples: [],
          });
        }
        const group = groups.get(key);
        group.occurrences += 1;
        if (group.examples.length < 8) {
          const window = classifyMarkerMotifWindow(sequence, index, length);
          group.examples.push({
            assetId: sequence.assetId,
            start: sequence.start,
            fromOffset: sequence.fromOffset,
            toOffset: sequence.toOffset,
            from: sequence.from,
            to: sequence.to,
            index,
            window,
          });
        }
      }
    }
  }
  return Array.from(groups.values())
    .filter((group) => group.occurrences > 1)
    .sort((a, b) => b.occurrences - a.occurrences || b.length - a.length || a.sequence.join("|").localeCompare(b.sequence.join("|")))
    .slice(0, 40);
}

function classifyMarkerMotifWindow(sequence, index, length) {
  const markers = sequence.markers.slice(index, index + length);
  if (!markers.length || !Number.isFinite(sequence.start)) {
    return {
      classification: "unknown",
      relativeStart: null,
      relativeEnd: null,
    };
  }
  const relativeStart = Math.min(...markers.map((marker) => marker.relativeOffset));
  const relativeEnd = Math.max(...markers.map((marker) => marker.relativeOffset)) + 4;
  const absoluteStart = sequence.start + relativeStart;
  const absoluteEnd = sequence.start + relativeEnd;
  const fromOffset = Number(sequence.fromOffset);
  let classification = "near-transition-prelude";
  if (Number.isFinite(fromOffset)) {
    if (absoluteEnd <= fromOffset) {
      classification = "before-from-string";
    } else if (absoluteStart < fromOffset && absoluteEnd > fromOffset) {
      classification = "overlaps-from-string-boundary";
    } else if (absoluteStart >= fromOffset && absoluteEnd <= sequence.start) {
      classification = "between-from-string-and-transition";
    }
  }
  return {
    classification,
    relativeStart,
    relativeEnd,
    absoluteStart,
    absoluteEnd,
    distanceToFromOffset: Number.isFinite(fromOffset) ? absoluteStart - fromOffset : null,
    distanceToTransition: absoluteEnd - sequence.start,
    markerRoles: markers.map((marker) => marker.role),
    markerValueKeys: markers.map((marker) => marker.valueKey),
  };
}

function summarizeMotifWindowClasses(ngrams) {
  const counts = new Map();
  for (const ngram of ngrams) {
    for (const example of ngram.examples ?? []) {
      const classification = example.window?.classification ?? "unknown";
      const key = `${ngram.sequence.join("|")}::${classification}`;
      if (!counts.has(key)) {
        counts.set(key, {
          sequence: ngram.sequence,
          length: ngram.length,
          classification,
          occurrences: 0,
          examples: [],
        });
      }
      const entry = counts.get(key);
      entry.occurrences += 1;
      if (entry.examples.length < 6) entry.examples.push(example);
    }
  }
  return Array.from(counts.values())
    .filter((entry) => entry.classification !== "unknown")
    .sort((a, b) => b.occurrences - a.occurrences || b.length - a.length || a.classification.localeCompare(b.classification))
    .slice(0, 30);
}

function classifyFormulaHashBoundary(transition, layout) {
  const roles = layout.map((token) => token.role);
  const formulaCore = findOrderedRoleWindow(roles, ["one", "op:add", "op:multiply"]);
  const formulaConstants = layout.filter((token) => token.role === "float").map((token) => token.index);
  const hashAssetAnchor = findOrderedRoleWindow(roles, ["ref:0", "raw", "asset-id-raw"]);
  const assetIdPositions = layout
    .filter((token) => token.valueClass === "asset-id")
    .map((token) => ({ index: token.index, role: token.role }));
  const beforeCore = formulaCore.found ? roles.slice(0, formulaCore.startIndex) : roles;
  const afterCore = formulaCore.found ? roles.slice(formulaCore.endIndex + 1) : [];
  const beforeAnchor = hashAssetAnchor.found ? roles.slice(0, hashAssetAnchor.startIndex) : roles;
  const afterAnchor = hashAssetAnchor.found ? roles.slice(hashAssetAnchor.endIndex + 1) : [];

  return {
    kind: transition.kind === "formula-to-hash-bytecode"
      ? "formula-bytecode-before-hash"
      : transition.kind === "hash-to-current-asset"
        ? "hash-metadata-before-next-string"
        : "unknown",
    formulaOpcodeCore: {
      found: formulaCore.found,
      positions: formulaCore.positions,
      constantsBeforeCore: formulaConstants.filter((index) => !formulaCore.found || index < formulaCore.startIndex),
      rolesBeforeCore: beforeCore,
      rolesAfterCore: afterCore,
    },
    hashAssetAnchor: {
      found: hashAssetAnchor.found,
      positions: hashAssetAnchor.positions,
      assetIdPositions,
      rolesBeforeAnchor: beforeAnchor,
      rolesAfterAnchor: afterAnchor,
    },
    interpretation: interpretFormulaHashBoundary(transition, { formulaCore, hashAssetAnchor, roles }),
  };
}

function findOrderedRoleWindow(roles, needle) {
  const positions = [];
  let cursor = 0;
  for (let index = 0; index < roles.length; index += 1) {
    if (roles[index] === needle[cursor]) {
      positions.push(index);
      cursor += 1;
      if (cursor === needle.length) {
        return {
          found: true,
          positions,
          startIndex: positions[0],
          endIndex: positions[positions.length - 1],
          contiguous: positions.every((position, itemIndex) => itemIndex === 0 || position === positions[itemIndex - 1] + 1),
        };
      }
    }
  }
  return {
    found: false,
    positions,
    startIndex: null,
    endIndex: null,
    contiguous: false,
  };
}

function interpretFormulaHashBoundary(transition, anchors) {
  if (transition.kind === "formula-to-hash-bytecode" && anchors.formulaCore.found) {
    return "bytecode-formule-isole-avant-hash";
  }
  if (transition.kind === "hash-to-current-asset" && anchors.hashAssetAnchor.found) {
    return "suffixe-hash-asset-isole-apres-hash";
  }
  if (transition.kind === "formula-to-hash-bytecode") {
    return "formule-vers-hash-sans-noyau-opcode-complet";
  }
  if (transition.kind === "hash-to-current-asset") {
    return "hash-vers-asset-sans-triplet-stable-complet";
  }
  return "non-classe";
}

function assessFormulaHashFieldBoundaries({ formulaBoundaries, hashBoundaries, formulaCoreHits, hashAnchorHits }) {
  const hasFormulaBoundaries = formulaBoundaries.length > 0 && formulaCoreHits.length === formulaBoundaries.length;
  const hasHashBoundaries = hashBoundaries.length > 0 && hashAnchorHits.length >= Math.ceil(hashBoundaries.length * 0.6);
  const formulaZonesLinked = formulaBoundaries.length > 0 && formulaBoundaries.every((transition) =>
    transition.transitionZone?.postTransition?.interpretation === "formula-bytecode-before-target-hash" &&
    transition.transitionZone?.toString?.startsAtTransitionEnd === true
  );
  const hashZonesLinked = hashBoundaries.length > 0 && hashBoundaries.every((transition) =>
    transition.transitionZone?.postTransition?.interpretation === "hash-metadata-suffix-before-next-string" &&
    transition.transitionZone?.toString?.startsAtTransitionEnd === true
  );
  const kind = hasFormulaBoundaries && hasHashBoundaries
    ? formulaZonesLinked && hashZonesLinked
      ? "formula-bytecode-and-hash-asset-zones-linked"
      : "formula-bytecode-and-hash-suffix-separated"
    : "formula-hash-field-boundaries-incomplete";
  return {
    kind,
    confidence: formulaZonesLinked && hashZonesLinked ? "medium-high" : hasFormulaBoundaries && hasHashBoundaries ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: formulaZonesLinked && hashZonesLinked
      ? "Les zones post-transition relient la string de formule au bytecode puis au hash cible, et le hash au suffixe asset avant la string suivante. Cela mappe mieux la structure sans attribuer SF_32 comme champ proprietaire."
      : hasFormulaBoundaries && hasHashBoundaries
      ? "Le noyau bytecode de formule et le suffixe hash->asset sont separables sur les transitions comparees, mais aucun champ SF_32 n'est encore attribue comme proprietaire."
      : "Les transitions disponibles ne suffisent pas encore a separer toutes les frontieres formule/hash/asset.",
    nextAction: formulaZonesLinked && hashZonesLinked
      ? "Comparer les valeurs du suffixe hash avec les definitions externes candidates pour identifier le champ exact de bonus, sans promotion DPS."
      : hasFormulaBoundaries && hasHashBoundaries
      ? "Lire les octets de header immediatement avant chaque transition pour identifier les compteurs/tailles de champs et tester une attribution SF_32 sans promotion DPS."
      : "Ajouter des payloads comparables ou durcir le decodage des tokens avant de tenter l'attribution de champ.",
    evidence: {
      formulaTransitions: formulaBoundaries.length,
      formulaOpcodeCoreHits: formulaCoreHits.length,
      hashAssetTransitions: hashBoundaries.length,
      hashAssetAnchorHits: hashAnchorHits.length,
      requiredHashAnchorHits: Math.ceil(hashBoundaries.length * 0.6),
      formulaZonesLinked,
      hashZonesLinked,
    },
  };
}

function compareHashSuffixDefinitions(boundariesFilePath, definitionSearchFilePath) {
  const boundaries = JSON.parse(fs.readFileSync(boundariesFilePath, "utf8"));
  const definitionSearch = JSON.parse(fs.readFileSync(definitionSearchFilePath, "utf8"));
  const definitionTargets = (definitionSearch.assets ?? []).flatMap((asset) =>
    (asset.targets ?? []).map((target) => ({
      assetId: asset.assetId,
      target: target.target,
      role: target.role,
      exactMatches: target.exactMatches ?? [],
      sameKeyAnalogies: target.sameKeyAnalogies ?? [],
      targetOnlyMatches: target.targetOnlyMatches ?? [],
      definitionAssessment: target.definitionAssessment ?? null,
      recommendation: target.recommendation ?? null,
    }))
  );
  const hashBoundaries = (boundaries.boundaries ?? []).filter((boundary) => boundary.kind === "hash-to-current-asset");
  const links = hashBoundaries.map((boundary) => compareHashBoundaryToDefinitions(boundary, definitionTargets));
  const targetLinks = links.filter((link) => link.definitionTarget);
  const exactExternalLinks = targetLinks.filter((link) => link.definitionTarget.definitionAssessment?.kind === "exact-definition-candidate");
  const currentOnlyLinks = targetLinks.filter((link) => link.definitionTarget.definitionAssessment?.kind === "exact-target-only-current-asset");
  const unknownSuffixValues = links.flatMap((link) => link.suffixValues.filter((value) => value.definitionLink === "unknown"));
  const assessment = assessHashSuffixDefinitionLinks({ links, targetLinks, exactExternalLinks, currentOnlyLinks, unknownSuffixValues });

  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-definition-links-v1",
    source: {
      formulaHashFieldBoundaries: boundariesFilePath,
      definitionSearch: definitionSearchFilePath,
      boundariesInspectedAt: boundaries.inspectedAt ?? null,
      definitionSearchInspectedAt: definitionSearch.inspectedAt ?? null,
    },
    summary: {
      hashBoundaries: hashBoundaries.length,
      linkedDefinitionTargets: targetLinks.length,
      exactExternalDefinitionLinks: exactExternalLinks.length,
      currentAssetOnlyLinks: currentOnlyLinks.length,
      unknownSuffixValues: unknownSuffixValues.length,
      assessment,
    },
    links,
  };
}

function compareHashBoundaryToDefinitions(boundary, definitionTargets) {
  const definitionTarget = definitionTargets.find((target) => target.target === boundary.from) ?? null;
  const suffixTokens = boundary.transitionZone?.postTransition?.tokens ?? [];
  const suffixValues = suffixTokens.map((token) => classifyHashSuffixToken(token, boundary, definitionTarget));
  const assetIdLinked = suffixValues.some((value) => value.definitionLink === "current-asset-id");
  const candidateValueTokens = suffixValues.filter((value) => value.definitionLink === "candidate-value-or-field-id");
  return {
    assetId: boundary.assetId,
    hashTarget: boundary.from,
    nextString: boundary.to,
    definitionTarget: definitionTarget
      ? {
          assetId: definitionTarget.assetId,
          role: definitionTarget.role,
          definitionAssessment: definitionTarget.definitionAssessment,
          recommendation: definitionTarget.recommendation,
          exactMatches: definitionTarget.exactMatches.length,
          sameKeyAnalogies: definitionTarget.sameKeyAnalogies.length,
          targetOnlyMatches: definitionTarget.targetOnlyMatches.length,
        }
      : null,
    suffixRoles: boundary.roles,
    suffixValues,
    linkAssessment: {
      kind: definitionTarget
        ? assetIdLinked && candidateValueTokens.length
          ? "hash-suffix-linked-to-current-asset-with-candidate-values"
          : assetIdLinked
            ? "hash-suffix-linked-to-current-asset"
            : "hash-suffix-target-context-only"
        : "hash-suffix-without-definition-target",
      fieldOwnership: "not-proven",
      promotionReady: false,
    },
  };
}

function classifyHashSuffixToken(token, boundary, definitionTarget) {
  const value = token.value;
  let definitionLink = "unknown";
  let note = "No definition link inferred for this suffix value.";
  if (token.role === "asset-id-raw" && Number(value) === Number(boundary.assetId)) {
    definitionLink = "current-asset-id";
    note = "Suffix value matches the current asset id, confirming current-asset context but not the bonus field.";
  } else if (token.role === "ref:0") {
    definitionLink = "local-reference-zero";
    note = "Local reference anchor seen in repeated hash suffix layouts.";
  } else if (token.role === "small-table-or-string-id" || token.role === "float" || token.role === "raw") {
    definitionLink = definitionTarget ? "candidate-value-or-field-id" : "unknown";
    note = definitionTarget
      ? "Candidate suffix value near a known target; exact semantic field still unproven."
      : "Candidate suffix value without matching definition target.";
  }
  return {
    index: token.index,
    offset: token.offset,
    role: token.role,
    kind: token.kind,
    value,
    definitionLink,
    note,
  };
}

function assessHashSuffixDefinitionLinks({ links, targetLinks, exactExternalLinks, currentOnlyLinks, unknownSuffixValues }) {
  const currentAssetContextLinks = links.filter((link) => link.suffixValues.some((value) => value.definitionLink === "current-asset-id"));
  return {
    kind: exactExternalLinks.length
      ? "hash-suffix-external-definition-candidate-found"
      : currentAssetContextLinks.length && currentOnlyLinks.length
        ? "hash-suffix-current-asset-context-only"
        : targetLinks.length
          ? "hash-suffix-definition-target-context-only"
          : "hash-suffix-definition-links-missing",
    confidence: exactExternalLinks.length ? "medium" : currentAssetContextLinks.length ? "medium-low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: exactExternalLinks.length
      ? "Un suffixe hash pointe vers une cible de definition externe candidate, mais l'ownership du champ reste a valider."
      : currentAssetContextLinks.length
        ? "Les suffixes hash confirment le contexte d'asset courant, mais les valeurs candidates du suffixe ne sont pas encore reliees a une definition externe exacte."
        : "Les suffixes hash ne peuvent pas encore etre relies a une definition exploitable.",
    nextAction: exactExternalLinks.length
      ? "Decoder le payload de definition externe candidat et verifier le champ exact avant toute promotion DPS."
      : "Chercher une definition externe exacte ou decoder la semantique des valeurs candidates du suffixe hash avant toute promotion DPS.",
    evidence: {
      hashBoundaries: links.length,
      linkedDefinitionTargets: targetLinks.length,
      exactExternalDefinitionLinks: exactExternalLinks.length,
      currentAssetContextLinks: currentAssetContextLinks.length,
      currentAssetOnlyLinks: currentOnlyLinks.length,
      unknownSuffixValues: unknownSuffixValues.length,
    },
  };
}

function analyzeHashSuffixValuePatterns(boundariesFilePath) {
  const boundaries = JSON.parse(fs.readFileSync(boundariesFilePath, "utf8"));
  const hashBoundaries = (boundaries.boundaries ?? []).filter((boundary) => boundary.kind === "hash-to-current-asset");
  const suffixes = hashBoundaries.map((boundary) => {
    const tokens = boundary.transitionZone?.postTransition?.tokens ?? [];
    return {
      assetId: boundary.assetId,
      hashTarget: boundary.from,
      nextString: boundary.to,
      suffixRoles: boundary.roles ?? tokens.map((token) => token.role),
      values: tokens.map((token) => ({
        index: token.index,
        offset: token.offset,
        role: token.role,
        kind: token.kind,
        value: token.value,
        valueClass: classifyHashSuffixPatternValue(token, boundary),
      })),
    };
  });
  const rolePositionPatterns = summarizeHashSuffixRolePositions(suffixes);
  const valuePatterns = summarizeHashSuffixValues(suffixes);
  const repeatedConstants = valuePatterns.filter((pattern) =>
    isSemanticHashSuffixCandidate(pattern) &&
    pattern.occurrences > 1
  );
  const crossAssetRepeatedConstants = repeatedConstants.filter((pattern) => pattern.assetCount > 1);
  const assetContextHits = valuePatterns.filter((pattern) => pattern.valueClass === "current-asset-id");
  const assessment = assessHashSuffixValuePatterns({ suffixes, rolePositionPatterns, repeatedConstants, crossAssetRepeatedConstants, assetContextHits });
  return {
    analyzedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-value-patterns-v1",
    source: {
      formulaHashFieldBoundaries: boundariesFilePath,
      boundariesInspectedAt: boundaries.inspectedAt ?? null,
    },
    summary: {
      hashBoundaries: hashBoundaries.length,
      suffixes: suffixes.length,
      rolePositionPatterns: rolePositionPatterns.length,
      repeatedConstants: repeatedConstants.length,
      crossAssetRepeatedConstants: crossAssetRepeatedConstants.length,
      assetContextHits: assetContextHits.length,
      assessment,
    },
    rolePositionPatterns,
    valuePatterns,
    repeatedConstants,
    crossAssetRepeatedConstants,
    suffixes,
  };
}

function classifyHashSuffixPatternValue(token, boundary) {
  if (token.value === null || token.value === undefined) return token.role ?? "no-value";
  const value = Number(token.value);
  if (token.role === "ref:0" || value === 0) return "local-reference-zero";
  if (Number.isFinite(value) && Number(value) === Number(boundary.assetId)) return "current-asset-id";
  if (token.role === "float") return "float-constant";
  if (token.role === "small-table-or-string-id") return "small-id-candidate";
  if (Number.isFinite(value) && value > 1000000 && value < 4000000) return "asset-like-id";
  if (Number.isFinite(value) && value > 0 && value < 10000) return "small-raw-candidate";
  return token.role ?? "raw";
}

function isSemanticHashSuffixCandidate(pattern) {
  if (pattern.valueClass === "current-asset-id") return false;
  if (pattern.valueClass === "local-reference-zero") return false;
  if (pattern.valueClass === "minus-one") return false;
  if (String(pattern.role ?? "").startsWith("op:")) return false;
  if (pattern.value === null || pattern.value === undefined) return false;
  if (pattern.role === "one" && Number(pattern.value) === 1) return false;
  if (pattern.role === "float" && Number(pattern.value) === 1) return false;
  return true;
}

function summarizeHashSuffixRolePositions(suffixes) {
  const groups = new Map();
  for (const suffix of suffixes) {
    for (const value of suffix.values) {
      const key = `${value.index}:${value.role}`;
      if (!groups.has(key)) {
        groups.set(key, {
          index: value.index,
          role: value.role,
          occurrences: 0,
          valueClasses: new Map(),
          values: new Map(),
          examples: [],
        });
      }
      const group = groups.get(key);
      group.occurrences += 1;
      group.valueClasses.set(value.valueClass, (group.valueClasses.get(value.valueClass) ?? 0) + 1);
      const valueKey = String(value.value);
      group.values.set(valueKey, (group.values.get(valueKey) ?? 0) + 1);
      if (group.examples.length < 8) {
        group.examples.push({
          assetId: suffix.assetId,
          hashTarget: suffix.hashTarget,
          nextString: suffix.nextString,
          offset: value.offset,
          value: value.value,
          valueClass: value.valueClass,
        });
      }
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      index: group.index,
      role: group.role,
      occurrences: group.occurrences,
      coverage: Number((group.occurrences / Math.max(1, suffixes.length)).toFixed(4)),
      dominantValueClass: topCount(group.valueClasses).value,
      dominantValueClassCount: topCount(group.valueClasses).count,
      distinctValues: group.values.size,
      repeatedValues: Array.from(group.values.entries())
        .filter(([, count]) => count > 1)
        .map(([value, count]) => ({ value: numericOrString(value), count }))
        .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)))
        .slice(0, 12),
      examples: group.examples,
    }))
    .sort((a, b) => a.index - b.index || a.role.localeCompare(b.role));
}

function summarizeHashSuffixValues(suffixes) {
  const groups = new Map();
  for (const suffix of suffixes) {
    for (const value of suffix.values) {
      const key = `${value.role}:${value.valueClass}:${value.value}`;
      if (!groups.has(key)) {
        groups.set(key, {
          role: value.role,
          valueClass: value.valueClass,
          value: value.value,
          occurrences: 0,
          assets: new Set(),
          targets: new Set(),
          examples: [],
        });
      }
      const group = groups.get(key);
      group.occurrences += 1;
      group.assets.add(suffix.assetId);
      group.targets.add(suffix.hashTarget);
      if (group.examples.length < 8) {
        group.examples.push({
          assetId: suffix.assetId,
          hashTarget: suffix.hashTarget,
          nextString: suffix.nextString,
          offset: value.offset,
          index: value.index,
        });
      }
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      role: group.role,
      valueClass: group.valueClass,
      value: group.value,
      occurrences: group.occurrences,
      assetCount: group.assets.size,
      targetCount: group.targets.size,
      examples: group.examples,
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.assetCount - a.assetCount || String(a.value).localeCompare(String(b.value)));
}

function assessHashSuffixValuePatterns({ suffixes, rolePositionPatterns, repeatedConstants, crossAssetRepeatedConstants, assetContextHits }) {
  const fullRoleCoverage = rolePositionPatterns.filter((pattern) => pattern.coverage >= 0.8);
  const hasStableAssetContext = assetContextHits.length > 0;
  const hasRepeatedConstants = repeatedConstants.length > 0;
  const hasCrossAssetConstants = crossAssetRepeatedConstants.length > 0;
  return {
    kind: hasStableAssetContext && hasCrossAssetConstants
      ? "hash-suffix-patterns-asset-context-with-cross-asset-candidates"
      : hasStableAssetContext && hasRepeatedConstants
      ? "hash-suffix-patterns-asset-context-with-local-candidates"
      : hasStableAssetContext
        ? "hash-suffix-patterns-asset-context-only"
        : hasRepeatedConstants
          ? "hash-suffix-patterns-repeated-candidates-only"
          : "hash-suffix-patterns-inconclusive",
    confidence: hasStableAssetContext && fullRoleCoverage.length >= 3 ? "medium-low" : hasStableAssetContext ? "low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: hasStableAssetContext && hasCrossAssetConstants
      ? "Le suffixe contient un ancrage vers l'asset courant et au moins une constante candidate repetee sur plusieurs assets, mais aucune semantique de champ exacte n'est encore prouvee."
      : hasStableAssetContext && hasRepeatedConstants
        ? "Le suffixe contient un ancrage vers l'asset courant et des constantes candidates locales, mais elles ne se repetent pas encore assez entre assets."
      : hasStableAssetContext
        ? "Le suffixe confirme surtout le contexte d'asset courant; les autres valeurs restent trop peu repetees pour etre nommees."
        : "Les valeurs de suffixe ne donnent pas encore un motif stable exploitable.",
    nextAction: hasRepeatedConstants
      ? "Relier les constantes repetees du suffixe a des tables, ids de strings ou champs de records avant toute promotion DPS."
      : "Ajouter davantage de transitions hash comparables ou chercher une definition externe exacte avant toute promotion DPS.",
    evidence: {
      suffixes: suffixes.length,
      fullRoleCoverage: fullRoleCoverage.slice(0, 8),
      repeatedConstants: repeatedConstants.slice(0, 12),
      crossAssetRepeatedConstants: crossAssetRepeatedConstants.slice(0, 12),
      assetContextHits: assetContextHits.slice(0, 12),
    },
  };
}

function topCount(map) {
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  return {
    value: entries[0]?.[0] ?? null,
    count: entries[0]?.[1] ?? 0,
  };
}

function numericOrString(value) {
  const number = Number(value);
  return Number.isFinite(number) && String(number) === String(value) ? number : value;
}

function analyzeHashSuffixCandidateSemantics(boundariesFilePath) {
  const boundaries = JSON.parse(fs.readFileSync(boundariesFilePath, "utf8"));
  const hashBoundaries = (boundaries.boundaries ?? []).filter((boundary) => boundary.kind === "hash-to-current-asset");
  const rows = hashBoundaries.map((boundary) => summarizeHashSuffixSemanticRow(boundary));
  const selectorGroups = summarizeSemanticGroups(rows, (row) => row.rawSelector?.normalizedKey ?? "missing");
  const metadataGroups = summarizeSemanticGroups(rows, (row) => row.metadata?.id === null ? "missing" : String(row.metadata.id));
  const floatGroups = summarizeSemanticGroups(rows, (row) => row.metadata?.float === null ? "missing" : String(row.metadata.float));
  const assessment = assessHashSuffixCandidateSemantics(rows, selectorGroups, metadataGroups, floatGroups);
  return {
    analyzedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-candidate-semantics-v1",
    source: {
      formulaHashFieldBoundaries: boundariesFilePath,
      boundariesInspectedAt: boundaries.inspectedAt ?? null,
    },
    summary: {
      hashBoundaries: hashBoundaries.length,
      rows: rows.length,
      selectors: selectorGroups.length,
      metadataIds: metadataGroups.filter((group) => group.key !== "missing").length,
      metadataFloats: floatGroups.filter((group) => group.key !== "missing").length,
      assessment,
    },
    selectorGroups,
    metadataGroups,
    floatGroups,
    rows,
  };
}

function summarizeHashSuffixSemanticRow(boundary) {
  const tokens = boundary.transitionZone?.postTransition?.tokens ?? [];
  const rawSelectorToken = tokens.find((token, index) =>
    token.role === "raw" &&
    tokens[index - 1]?.role === "ref:0" &&
    tokens[index + 1]?.role === "asset-id-raw"
  ) ?? tokens.find((token) => token.role === "raw") ?? null;
  const assetToken = tokens.find((token) => token.role === "asset-id-raw") ?? null;
  const metadataIdToken = tokens.find((token, index) =>
    token.role === "small-table-or-string-id" &&
    index > (assetToken?.index ?? -1)
  ) ?? null;
  const metadataFloatToken = tokens.find((token, index) =>
    token.role === "float" &&
    index > (metadataIdToken?.index ?? assetToken?.index ?? -1)
  ) ?? null;
  const rawSelector = rawSelectorToken ? normalizeRawSelector(rawSelectorToken.value) : null;
  const metadata = {
    id: metadataIdToken?.value ?? null,
    float: metadataFloatToken?.value ?? null,
    idOffset: metadataIdToken?.offset ?? null,
    floatOffset: metadataFloatToken?.offset ?? null,
    interpretation: metadataIdToken && metadataFloatToken
      ? "metadata-id-plus-float-candidate"
      : metadataIdToken
        ? "metadata-id-candidate"
        : metadataFloatToken
          ? "metadata-float-candidate"
          : "metadata-not-present",
  };
  return {
    assetId: boundary.assetId,
    hashTarget: boundary.from,
    nextString: boundary.to,
    targetFamily: classifyHashTargetFamily(boundary.from),
    suffixRoles: boundary.roles,
    rawSelector: rawSelector
      ? {
          value: rawSelector.original,
          offset: rawSelectorToken.offset,
          encoding: rawSelector.encoding,
          normalized: rawSelector.normalized,
          normalizedKey: rawSelector.normalizedKey,
          interpretation: "selector-or-field-kind-candidate",
        }
      : null,
    assetAnchor: assetToken
      ? {
          value: assetToken.value,
          offset: assetToken.offset,
          matchesCurrentAsset: Number(assetToken.value) === Number(boundary.assetId),
        }
      : null,
    metadata,
    hypothesis: classifyHashSuffixSemanticHypothesis({ boundary, rawSelector, metadata }),
  };
}

function normalizeRawSelector(value) {
  const number = Number(value);
  const highBit = 0x80000000;
  if (Number.isFinite(number) && number >= highBit) {
    const normalized = number - highBit;
    return {
      original: number,
      encoding: "high-bit-encoded",
      normalized,
      normalizedKey: `selector:${normalized}`,
    };
  }
  return {
    original: number,
    encoding: "plain",
    normalized: number,
    normalizedKey: Number.isFinite(number) ? `selector:${number}` : "selector:unknown",
  };
}

function classifyHashTargetFamily(target) {
  const text = String(target ?? "");
  if (/Bonus_Percent_Per_Power/i.test(text)) return "bonus-percent-per-power";
  if (/Chance_.*Per_Power/i.test(text)) return "chance-per-power";
  if (/Power_Duration_Bonus_Pct/i.test(text)) return "duration-bonus-pct";
  if (/#/.test(text)) return "hash-reference";
  if (/[+\-*/()]|Min\(/i.test(text)) return "formula-expression";
  return "other";
}

function classifyHashSuffixSemanticHypothesis({ boundary, rawSelector, metadata }) {
  const hasAssetAnchor = (boundary.transitionZone?.postTransition?.tokens ?? []).some((token) =>
    token.role === "asset-id-raw" && Number(token.value) === Number(boundary.assetId)
  );
  if (!hasAssetAnchor) {
    return {
      kind: "suffix-without-current-asset-anchor",
      confidence: "low",
      note: "Le suffixe ne confirme pas l'asset courant.",
    };
  }
  if (rawSelector && metadata.id !== null && metadata.float !== null) {
    return {
      kind: "selector-asset-metadata-triplet",
      confidence: "low",
      note: "Le motif ressemble a un triplet selecteur, asset courant, metadata id/float. Le role exact du metadata reste inconnu.",
    };
  }
  if (rawSelector) {
    return {
      kind: "selector-asset-anchor",
      confidence: "low",
      note: "Le motif relie un selecteur candidat a l'asset courant, sans metadata supplementaire stable.",
    };
  }
  return {
    kind: "asset-anchor-only",
    confidence: "low",
    note: "Le suffixe confirme seulement l'asset courant.",
  };
}

function summarizeSemanticGroups(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        occurrences: 0,
        assetIds: new Set(),
        targetFamilies: new Map(),
        examples: [],
      });
    }
    const group = groups.get(key);
    group.occurrences += 1;
    group.assetIds.add(row.assetId);
    group.targetFamilies.set(row.targetFamily, (group.targetFamilies.get(row.targetFamily) ?? 0) + 1);
    if (group.examples.length < 8) {
      group.examples.push({
        assetId: row.assetId,
        hashTarget: row.hashTarget,
        targetFamily: row.targetFamily,
        rawSelector: row.rawSelector?.normalized ?? null,
        metadataId: row.metadata?.id ?? null,
        metadataFloat: row.metadata?.float ?? null,
      });
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      key: group.key,
      occurrences: group.occurrences,
      assetCount: group.assetIds.size,
      targetFamilies: Array.from(group.targetFamilies.entries())
        .map(([family, count]) => ({ family, count }))
        .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family)),
      examples: group.examples,
    }))
    .sort((a, b) => b.occurrences - a.occurrences || a.key.localeCompare(b.key));
}

function assessHashSuffixCandidateSemantics(rows, selectorGroups, metadataGroups, floatGroups) {
  const currentAssetAnchors = rows.filter((row) => row.assetAnchor?.matchesCurrentAsset);
  const triplets = rows.filter((row) => row.hypothesis.kind === "selector-asset-metadata-triplet");
  const repeatedSelectors = selectorGroups.filter((group) => group.key !== "missing" && group.occurrences > 1);
  const repeatedMetadataIds = metadataGroups.filter((group) => group.key !== "missing" && group.occurrences > 1);
  const repeatedMetadataFloats = floatGroups.filter((group) => group.key !== "missing" && group.occurrences > 1);
  return {
    kind: triplets.length
      ? repeatedMetadataIds.length || repeatedMetadataFloats.length
        ? "hash-suffix-semantic-triplets-with-repeated-metadata"
        : "hash-suffix-semantic-triplets-local-only"
      : currentAssetAnchors.length
        ? "hash-suffix-semantic-selector-asset-anchors"
        : "hash-suffix-semantics-inconclusive",
    confidence: triplets.length ? "low" : currentAssetAnchors.length ? "low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: triplets.length
      ? "Les suffixes montrent des triplets candidats selecteur/asset/metadata, mais les ids metadata ne sont pas encore relies a un dictionnaire, une table ou un champ de record."
      : currentAssetAnchors.length
        ? "Les suffixes confirment des ancres vers l'asset courant, mais la semantique des selecteurs reste inconnue."
        : "Les suffixes ne suffisent pas encore a proposer une semantique exploitable.",
    nextAction: "Construire ou retrouver le dictionnaire des selecteurs de suffixe et des metadata ids avant toute promotion DPS.",
    evidence: {
      rows: rows.length,
      currentAssetAnchors: currentAssetAnchors.length,
      triplets: triplets.length,
      repeatedSelectors,
      repeatedMetadataIds,
      repeatedMetadataFloats,
    },
  };
}

function mineHashSuffixDictionary(boundariesFilePath, options = {}) {
  const boundaries = JSON.parse(fs.readFileSync(boundariesFilePath, "utf8"));
  const reportFiles = boundaries.source?.files ?? [];
  const reports = reportFiles.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: report.options?.currentAssetId ?? null,
      decodedFile: report.source?.filePath ?? null,
    };
  }).filter((report) => report.assetId && report.decodedFile && fs.existsSync(report.decodedFile));
  const scans = reports.map((report) => mineHashSuffixDictionaryInDecodedReport(report));
  const wideScans = options.decodedRoot
    ? collectDecodedBinFiles(options.decodedRoot)
      .map((filePath) => mineHashSuffixDictionaryInDecodedFile(filePath))
      .filter((scan) => scan.anchors.length > 0)
    : [];
  const allScans = [...scans, ...wideScans];
  const anchors = dedupeMinedAnchors(allScans.flatMap((scan) => scan.anchors));
  const selectorGroups = summarizeMinedDictionaryGroups(anchors, (anchor) => anchor.selector?.normalizedKey ?? "missing");
  const metadataIdGroups = summarizeMinedDictionaryGroups(anchors, (anchor) => anchor.metadataCandidates[0]?.id === undefined ? "missing" : String(anchor.metadataCandidates[0].id));
  const assessment = assessMinedHashSuffixDictionary({ scans: allScans, anchors, selectorGroups, metadataIdGroups });
  return {
    minedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-dictionary-mining-v1",
    source: {
      formulaHashFieldBoundaries: boundariesFilePath,
      decodedRoot: options.decodedRoot ?? null,
      reports: reports.map((report) => ({
        filePath: report.filePath,
        assetId: report.assetId,
        decodedFile: report.decodedFile,
      })),
    },
    summary: {
      reports: reports.length,
      wideScans: wideScans.length,
      anchors: anchors.length,
      selectors: selectorGroups.filter((group) => group.key !== "missing").length,
      metadataIds: metadataIdGroups.filter((group) => group.key !== "missing").length,
      assessment,
    },
    selectorGroups,
    metadataIdGroups,
    scans: allScans,
  };
}

function collectDecodedBinFiles(rootDir) {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".decoded.bin")) {
        files.push(fullPath);
      }
    }
  }
  walk(rootDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function dedupeMinedAnchors(anchors) {
  const seen = new Set();
  const deduped = [];
  for (const anchor of anchors) {
    const assetKey = anchor.assetLikeId ?? anchor.assetAnchor?.value ?? anchor.assetId ?? "unknown-asset";
    const key = [
      assetKey,
      anchor.offset,
      anchor.selector?.normalizedKey ?? "selector:unknown",
      anchor.previousString?.value ?? "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(anchor);
  }
  return deduped;
}

function mineHashSuffixDictionaryInDecodedFile(decodedFile) {
  const buffer = fs.readFileSync(decodedFile);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const anchors = [];
  for (let index = 0; index < strings.length; index += 1) {
    const item = strings[index];
    if (!isHashSuffixMiningString(item.value)) continue;
    const nextString = strings[index + 1] ?? null;
    const anchor = inspectPotentialHashSuffixAfterString({
      buffer,
      strings,
      decodedFile,
      previousString: item,
      nextString,
    });
    if (anchor) anchors.push(anchor);
  }
  return {
    assetId: inferAssetIdFromPath(decodedFile),
    decodedFile,
    bytes: buffer.length,
    anchors,
  };
}

function isHashSuffixMiningString(value) {
  const text = String(value ?? "");
  if (!/#/.test(text)) return false;
  if (/Bonus_|Chance_|Power_|Duration|Damage|Percent|Per_Power|Pct|Affix_Value/i.test(text)) return true;
  if (/^[A-Za-z0-9_]+\s*[+\-*/]/.test(text)) return true;
  return false;
}

function inspectPotentialHashSuffixAfterString({ buffer, strings, decodedFile, previousString, nextString }) {
  const start = previousString.endOffset + 1;
  const end = Math.min(buffer.length, nextString?.offset ?? start + 192, start + 192);
  const words = readWordsAround(buffer, start, end);
  for (let index = 0; index < words.length; index += 1) {
    const assetWord = words[index];
    if (!isAssetLikeId(assetWord.uint32)) continue;
    const selectorWord = words[index - 1] ?? null;
    const refWord = words[index - 2] ?? null;
    if (!selectorWord) continue;
    const selector = normalizeRawSelector(selectorWord.uint32);
    const metadataCandidates = mineMetadataCandidatesAfterAnchor(buffer, assetWord.offset, end);
    const looksLikeSuffix = selector.normalized >= 1 && selector.normalized <= 2000
      && (refWord?.uint32 === 0 || selector.encoding === "high-bit-encoded" || selector.normalized >= 128);
    if (!looksLikeSuffix) continue;
    return {
      assetId: inferAssetIdFromPath(decodedFile),
      offset: assetWord.offset,
      assetLikeId: assetWord.uint32,
      selector: {
        value: selector.original,
        encoding: selector.encoding,
        normalized: selector.normalized,
        normalizedKey: selector.normalizedKey,
        offset: selectorWord.offset,
      },
      refAnchor: refWord
        ? {
            offset: refWord.offset,
            value: refWord.uint32,
            looksLikeRef0: refWord.uint32 === 0,
          }
        : null,
      previousString: {
        offset: previousString.offset,
        value: previousString.value,
        family: classifyHashTargetFamily(previousString.value),
        distanceToAsset: assetWord.offset - previousString.endOffset - 1,
      },
      nextString: nextString
        ? {
            offset: nextString.offset,
            value: nextString.value,
            family: classifyHashTargetFamily(nextString.value),
            distanceFromAsset: nextString.offset - assetWord.offset,
          }
        : null,
      metadataCandidates,
      classification: "probable-hash-suffix-anchor",
      sourceKind: "wide-decoded-string-scan",
    };
  }
  return null;
}

function isAssetLikeId(value) {
  return Number.isFinite(value) && value > 100000 && value < 4000000;
}

function inferAssetIdFromPath(filePath) {
  const match = String(filePath).match(/source-asset-(\d+)/i);
  return match ? Number(match[1]) : null;
}

function mineHashSuffixDictionaryInDecodedReport(report) {
  const buffer = fs.readFileSync(report.decodedFile);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const anchors = [];
  const needle = Buffer.alloc(4);
  needle.writeUInt32LE(Number(report.assetId));
  let hit = buffer.indexOf(needle);
  while (hit !== -1) {
    const anchor = inspectPotentialHashSuffixAnchor({ buffer, strings, report, offset: hit });
    if (anchor) anchors.push(anchor);
    hit = buffer.indexOf(needle, hit + 4);
  }
  return {
    assetId: report.assetId,
    decodedFile: report.decodedFile,
    bytes: buffer.length,
    anchors,
  };
}

function inspectPotentialHashSuffixAnchor({ buffer, strings, report, offset }) {
  const selectorWord = readWordAt(buffer, offset - 4);
  const refWord = readWordAt(buffer, offset - 12);
  const selector = selectorWord ? normalizeRawSelector(selectorWord.uint32) : null;
  const previousString = strings.filter((item) => item.endOffset < offset).at(-1) ?? null;
  const nextString = strings.find((item) => item.offset > offset) ?? null;
  const metadataCandidates = mineMetadataCandidatesAfterAnchor(buffer, offset, nextString?.offset ?? Math.min(buffer.length, offset + 160));
  const looksLikeSuffix = Boolean(selector)
    && previousString
    && /#|Bonus_|Chance_|Power_|Min\(|\+|Table\(/i.test(previousString.value)
    && (refWord?.uint32 === 0 || selector.original >= 128);
  return {
    assetId: report.assetId,
    offset,
    selector: selector
      ? {
          value: selector.original,
          encoding: selector.encoding,
          normalized: selector.normalized,
          normalizedKey: selector.normalizedKey,
          offset: offset - 4,
        }
      : null,
    refAnchor: refWord
      ? {
          offset: offset - 12,
          value: refWord.uint32,
          looksLikeRef0: refWord.uint32 === 0,
        }
      : null,
    previousString: previousString
      ? {
          offset: previousString.offset,
          value: previousString.value,
          family: classifyHashTargetFamily(previousString.value),
          distanceToAsset: offset - previousString.endOffset - 1,
        }
      : null,
    nextString: nextString
      ? {
          offset: nextString.offset,
          value: nextString.value,
          family: classifyHashTargetFamily(nextString.value),
          distanceFromAsset: nextString.offset - offset,
        }
      : null,
    metadataCandidates,
    classification: looksLikeSuffix ? "probable-hash-suffix-anchor" : "asset-id-occurrence",
  };
}

function readWordAt(buffer, offset) {
  if (!Number.isFinite(offset) || offset < 0 || offset + 4 > buffer.length) return null;
  const float32 = buffer.readFloatLE(offset);
  return {
    offset,
    uint32: buffer.readUInt32LE(offset),
    int32: buffer.readInt32LE(offset),
    float32: Number.isFinite(float32) ? Number(float32.toPrecision(7)) : null,
    hex: buffer.subarray(offset, offset + 4).toString("hex"),
  };
}

function mineMetadataCandidatesAfterAnchor(buffer, assetOffset, endOffset) {
  const limit = Math.max(assetOffset + 4, Math.min(buffer.length, endOffset, assetOffset + 160));
  const candidates = [];
  for (let offset = assetOffset + 4; offset + 8 <= limit; offset += 4) {
    const idWord = readWordAt(buffer, offset);
    const floatWord = readWordAt(buffer, offset + 4);
    const opcodeWord = readWordAt(buffer, offset + 4);
    const encodedFloatWord = readWordAt(buffer, offset + 8);
    if (!idWord || !floatWord) continue;
    const id = idWord.uint32;
    const float = floatWord.float32;
    if (id >= 8000 && id <= 14000 && Number.isFinite(float) && Math.abs(float) >= 0.000001 && Math.abs(float) <= 500) {
      candidates.push({
        offset,
        id,
        float,
        distanceFromAsset: offset - assetOffset,
      });
    } else if (id >= 8000 && id <= 14000 && opcodeWord?.uint32 === 6 && encodedFloatWord && Number.isFinite(encodedFloatWord.float32) && Math.abs(encodedFloatWord.float32) <= 500) {
      candidates.push({
        offset,
        id,
        float: encodedFloatWord.float32,
        floatOffset: offset + 8,
        encoding: "opcode-6-float",
        distanceFromAsset: offset - assetOffset,
      });
    }
  }
  return candidates.slice(0, 12);
}

function summarizeMinedDictionaryGroups(anchors, keyFn) {
  const probable = anchors.filter((anchor) => anchor.classification === "probable-hash-suffix-anchor");
  const groups = new Map();
  for (const anchor of probable) {
    const key = keyFn(anchor);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        occurrences: 0,
        assets: new Set(),
        families: new Map(),
        examples: [],
      });
    }
    const group = groups.get(key);
    group.occurrences += 1;
    group.assets.add(anchor.assetId);
    const family = anchor.previousString?.family ?? "unknown";
    group.families.set(family, (group.families.get(family) ?? 0) + 1);
    if (group.examples.length < 10) {
      group.examples.push({
        assetId: anchor.assetId,
        offset: anchor.offset,
        previousString: anchor.previousString?.value ?? null,
        selector: anchor.selector?.normalized ?? null,
        metadata: anchor.metadataCandidates[0] ?? null,
      });
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      key: group.key,
      occurrences: group.occurrences,
      assetCount: group.assets.size,
      families: Array.from(group.families.entries()).map(([family, count]) => ({ family, count })).sort((a, b) => b.count - a.count || a.family.localeCompare(b.family)),
      examples: group.examples,
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.assetCount - a.assetCount || a.key.localeCompare(b.key));
}

function assessMinedHashSuffixDictionary({ scans, anchors, selectorGroups, metadataIdGroups }) {
  const probableAnchors = anchors.filter((anchor) => anchor.classification === "probable-hash-suffix-anchor");
  const repeatedSelectors = selectorGroups.filter((group) => group.key !== "missing" && group.occurrences > 1);
  const repeatedMetadataIds = metadataIdGroups.filter((group) => group.key !== "missing" && group.occurrences > 1);
  return {
    kind: repeatedSelectors.length || repeatedMetadataIds.length
      ? "hash-suffix-dictionary-repeated-candidates-found"
      : probableAnchors.length
        ? "hash-suffix-dictionary-local-candidates-only"
        : "hash-suffix-dictionary-mining-inconclusive",
    confidence: repeatedSelectors.length || repeatedMetadataIds.length ? "low" : probableAnchors.length ? "low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: repeatedSelectors.length || repeatedMetadataIds.length
      ? "Le minage local trouve des selecteurs ou metadata ids repetes, mais aucun libelle externe ne les nomme encore."
      : probableAnchors.length
        ? "Le minage local retrouve des ancres de suffixe probables, mais les candidats restent locaux ou peu repetes."
        : "Le minage local ne retrouve pas assez d'ancres suffixe exploitables.",
    nextAction: "Scanner davantage de payloads ou relier les selecteurs/mined metadata a des strings nommees avant toute promotion DPS.",
    evidence: {
      scans: scans.length,
      anchors: anchors.length,
      probableAnchors: probableAnchors.length,
      repeatedSelectors,
      repeatedMetadataIds,
    },
  };
}

function summarizeHashSuffixFamilyEvidence(miningFilePath) {
  const mining = JSON.parse(fs.readFileSync(miningFilePath, "utf8"));
  const anchors = dedupeMinedAnchors((mining.scans ?? []).flatMap((scan) => scan.anchors ?? []))
    .filter((anchor) => anchor.classification === "probable-hash-suffix-anchor");
  const selectorEvidence = (mining.selectorGroups ?? [])
    .filter((group) => group.key !== "missing")
    .map((group) => summarizeSelectorFamilyEvidence(group, anchors))
    .sort((a, b) => b.score - a.score || b.occurrences - a.occurrences || a.selector.localeCompare(b.selector));
  const metadataEvidence = (mining.metadataIdGroups ?? [])
    .filter((group) => group.key !== "missing")
    .map((group) => summarizeMetadataFamilyEvidence(group, anchors))
    .sort((a, b) => b.score - a.score || b.occurrences - a.occurrences || a.metadataId.localeCompare(b.metadataId));
  const assessment = assessHashSuffixFamilyEvidence(selectorEvidence, metadataEvidence);
  return {
    summarizedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-family-evidence-v1",
    source: {
      hashSuffixDictionaryMining: miningFilePath,
      minedAt: mining.minedAt ?? null,
    },
    summary: {
      selectors: selectorEvidence.length,
      metadataIds: metadataEvidence.length,
      assessment,
    },
    selectorEvidence,
    metadataEvidence,
  };
}

function auditHashSuffixSourceNames(familyEvidenceFilePath, options = {}) {
  const familyEvidence = JSON.parse(fs.readFileSync(familyEvidenceFilePath, "utf8"));
  const dataDir = options.dataDir;
  const selectorEvidence = familyEvidence.selectorEvidence ?? [];
  const metadataEvidence = familyEvidence.metadataEvidence ?? [];
  const watchedSelectors = selectorEvidence
    .filter((item) => item.selector && item.score >= 6)
    .map((item) => String(item.selector));
  const watchedMetadataIds = metadataEvidence
    .filter((item) => item.metadataId && item.score >= 5)
    .map((item) => String(item.metadataId));
  const watchedFamilies = Array.from(new Set(selectorEvidence.map((item) => item.dominantFamily).filter(Boolean)));
  const terms = Array.from(new Set([
    ...watchedSelectors,
    ...watchedMetadataIds,
    "Bonus_Percent_Per_Power",
  ]));
  const jsonFiles = dataDir
    ? listFilesRecursive(dataDir).filter((filePath) => filePath.toLowerCase().endsWith(".json"))
    : [];
  const fileHits = [];
  for (const filePath of jsonFiles) {
    const text = fs.readFileSync(filePath, "utf8");
    const termHits = terms
      .map((term) => countTextOccurrences(text, term))
      .filter((hit) => hit.count > 0);
    if (!termHits.length) continue;
    const contexts = [];
    for (const term of terms) {
      contexts.push(...collectTextContexts(text, term, { maxContexts: 4 }).map((context) => ({
        term,
        ...context,
      })));
    }
    fileHits.push({
      filePath,
      artifactKind: classifyHashSuffixSourceArtifact(filePath),
      termHits,
      hasSelectorAndFamily: watchedSelectors.some((selector) => text.includes(selector)) && /Bonus_Percent_Per_Power/.test(text),
      hasMetadataAndFamily: watchedMetadataIds.some((metadataId) => text.includes(metadataId)) && /Bonus_Percent_Per_Power/.test(text),
      contexts: contexts.slice(0, 16),
    });
  }
  const sourceNameCandidates = findHashSuffixSourceNameCandidates(fileHits, watchedSelectors, watchedMetadataIds);
  const assessment = assessHashSuffixSourceNameAudit({
    sourceNameCandidates,
    fileHits,
    watchedSelectors,
    watchedMetadataIds,
    watchedFamilies,
  });
  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-source-name-audit-v1",
    source: {
      hashSuffixFamilyEvidence: familyEvidenceFilePath,
      dataDir: dataDir ?? null,
      familyEvidenceSummarizedAt: familyEvidence.summarizedAt ?? null,
    },
    watched: {
      selectors: watchedSelectors,
      metadataIds: watchedMetadataIds,
      families: watchedFamilies,
      terms,
    },
    summary: {
      filesScanned: jsonFiles.length,
      filesWithHits: fileHits.length,
      sourceNameCandidates: sourceNameCandidates.length,
      numericFamilyFiles: fileHits.filter((hit) => hit.hasSelectorAndFamily || hit.hasMetadataAndFamily).length,
      assessment,
    },
    sourceNameCandidates,
    fileHits: fileHits
      .sort((a, b) => Number(b.hasSelectorAndFamily) - Number(a.hasSelectorAndFamily) || Number(b.hasMetadataAndFamily) - Number(a.hasMetadataAndFamily) || a.filePath.localeCompare(b.filePath))
      .slice(0, options.maxHits ?? 80),
  };
}

function countTextOccurrences(text, term) {
  let count = 0;
  let offset = String(text).indexOf(term);
  while (offset !== -1) {
    count += 1;
    offset = text.indexOf(term, offset + term.length);
  }
  return { term, count };
}

function collectTextContexts(text, term, options = {}) {
  const contexts = [];
  const maxContexts = options.maxContexts ?? 5;
  let offset = String(text).indexOf(term);
  while (offset !== -1 && contexts.length < maxContexts) {
    const line = text.slice(0, offset).split(/\r?\n/).length;
    const start = Math.max(0, offset - 180);
    const end = Math.min(text.length, offset + term.length + 180);
    contexts.push({
      line,
      preview: text.slice(start, end).replace(/\s+/g, " ").trim(),
    });
    offset = text.indexOf(term, offset + term.length);
  }
  return contexts;
}

function classifyHashSuffixSourceArtifact(filePath) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("hash-suffix")) return "derived-hash-suffix-report";
  if (normalized.includes("sf-candidates") || normalized.includes("sf-")) return "derived-sf-report";
  if (normalized.includes("conditional-")) return "derived-conditional-report";
  if (normalized.includes("canonical-")) return "derived-canonical-report";
  if (normalized.includes("formula")) return "derived-formula-report";
  return "derived-json";
}

function findHashSuffixSourceNameCandidates(fileHits, watchedSelectors, watchedMetadataIds) {
  const candidates = [];
  for (const hit of fileHits) {
    if (hit.artifactKind === "derived-hash-suffix-report") continue;
    for (const context of hit.contexts ?? []) {
      const mentionsSelector = watchedSelectors.some((selector) => context.preview.includes(selector));
      const mentionsMetadata = watchedMetadataIds.some((metadataId) => context.preview.includes(metadataId));
      const mentionsFamily = /Bonus_Percent_Per_Power/.test(context.preview);
      const looksNamed = /"?(name|label|sourceSyntax|target|key|value)"?\s*:/i.test(context.preview);
      if ((mentionsSelector || mentionsMetadata) && mentionsFamily && looksNamed) {
        candidates.push({
          filePath: hit.filePath,
          artifactKind: hit.artifactKind,
          line: context.line,
          selectorMentioned: mentionsSelector,
          metadataMentioned: mentionsMetadata,
          familyMentioned: mentionsFamily,
          authority: "generated-artifact",
          promotionReady: false,
          preview: context.preview,
        });
      }
    }
  }
  return candidates.slice(0, 40);
}

function assessHashSuffixSourceNameAudit({ sourceNameCandidates, fileHits, watchedSelectors, watchedMetadataIds, watchedFamilies }) {
  const generatedCandidates = sourceNameCandidates.filter((candidate) => candidate.authority === "generated-artifact");
  return {
    kind: sourceNameCandidates.length
      ? "generated-source-name-like-contexts-only"
      : "hash-suffix-source-name-not-found",
    confidence: "medium",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: sourceNameCandidates.length
      ? "Les artefacts actuels contiennent des contextes nommes generes autour des ids, mais aucun dictionnaire source independant ne nomme le selecteur ou la metadata."
      : "Aucune source nommee independante pour les ids de suffixe n'a ete trouvee dans les artefacts JSON actuels.",
    nextAction: "Chercher ou decoder une table/dictionnaire source des selecteurs de suffixe; conserver 949/12337 comme preuve locale non promotable.",
    evidence: {
      watchedSelectors,
      watchedMetadataIds,
      watchedFamilies,
      filesWithHits: fileHits.length,
      numericFamilyFiles: fileHits.filter((hit) => hit.hasSelectorAndFamily || hit.hasMetadataAndFamily).length,
      generatedCandidates: generatedCandidates.length,
    },
  };
}

function auditHashSuffixBinarySources(familyEvidenceFilePath, options = {}) {
  const familyEvidence = JSON.parse(fs.readFileSync(familyEvidenceFilePath, "utf8"));
  const selectorEvidence = familyEvidence.selectorEvidence ?? [];
  const metadataEvidence = familyEvidence.metadataEvidence ?? [];
  const watchedSelectors = selectorEvidence
    .filter((item) => item.selector && item.score >= 6)
    .map((item) => Number(item.selector));
  const watchedMetadataIds = metadataEvidence
    .filter((item) => item.metadataId && item.score >= 5)
    .map((item) => Number(item.metadataId));
  const watchedValues = [
    ...watchedSelectors.flatMap((value) => selectorWatchValues(value)),
    ...watchedMetadataIds.map((value) => ({ role: "metadata-id", value })),
  ].filter((item) => Number.isFinite(item.value));
  const files = options.dataDir ? collectDecodedBinFiles(options.dataDir) : [];
  const fileReports = files.map((filePath) => inspectHashSuffixBinarySourceFile(filePath, watchedValues))
    .filter((report) => report.hits.length > 0);
  const hits = fileReports.flatMap((report) => report.hits.map((hit) => ({ ...hit, filePath: report.filePath, assetId: report.assetId })));
  const dictionaryLikeHits = hits.filter((hit) => hit.classification === "dictionary-like-context");
  const familyContextHits = hits.filter((hit) => hit.nearbyFamily);
  const assessment = assessHashSuffixBinarySourceAudit({
    files,
    fileReports,
    hits,
    dictionaryLikeHits,
    familyContextHits,
    watchedSelectors,
    watchedMetadataIds,
  });
  return {
    auditedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-binary-source-audit-v1",
    source: {
      hashSuffixFamilyEvidence: familyEvidenceFilePath,
      dataDir: options.dataDir ?? null,
      familyEvidenceSummarizedAt: familyEvidence.summarizedAt ?? null,
    },
    watched: {
      selectors: watchedSelectors,
      metadataIds: watchedMetadataIds,
    },
    summary: {
      filesScanned: files.length,
      filesWithHits: fileReports.length,
      hits: hits.length,
      dictionaryLikeHits: dictionaryLikeHits.length,
      familyContextHits: familyContextHits.length,
      assessment,
    },
    dictionaryLikeHits: dictionaryLikeHits.slice(0, options.maxHits ?? 80),
    familyContextHits: familyContextHits.slice(0, options.maxHits ?? 80),
    fileReports: fileReports.slice(0, options.maxHits ?? 80),
  };
}

function selectorWatchValues(value) {
  const items = [{ role: "selector", value, normalizedValue: value, encoding: "plain" }];
  const highBitValue = value + 0x80000000;
  if (Number.isFinite(highBitValue) && highBitValue <= 0xffffffff) {
    items.push({ role: "selector", value: highBitValue, normalizedValue: value, encoding: "high-bit-encoded" });
  }
  return items;
}

function inspectHashSuffixBinarySourceFile(filePath, watchedValues) {
  const buffer = fs.readFileSync(filePath);
  const strings = extractDecodedAsciiStrings(buffer, { minLength: 4 });
  const hits = [];
  const watchByValue = new Map();
  for (const item of watchedValues) {
    if (!watchByValue.has(item.value)) watchByValue.set(item.value, []);
    watchByValue.get(item.value).push(item);
  }
  for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
    const value = buffer.readUInt32LE(offset);
    const roles = watchByValue.get(value);
    if (!roles) continue;
    for (const watch of roles) {
      hits.push(classifyHashSuffixBinarySourceHit({ buffer, strings, filePath, offset, value, watch }));
    }
  }
  return {
    filePath,
    assetId: inferAssetIdFromPath(filePath),
    bytes: buffer.length,
    strings: strings.length,
    hits,
  };
}

function classifyHashSuffixBinarySourceHit({ buffer, strings, filePath, offset, value, watch }) {
  const before = strings.filter((item) => item.endOffset < offset).slice(-4);
  const after = strings.filter((item) => item.offset > offset).slice(0, 4);
  const nearby = [...before, ...after].map((item) => ({
    offset: item.offset,
    distance: item.offset > offset ? item.offset - offset : offset - item.endOffset,
    value: item.value,
    family: classifyHashTargetFamily(item.value),
  }));
  const nearbyText = nearby.map((item) => item.value).join(" ");
  const nearbyFamily = /Bonus_Percent_Per_Power/i.test(nearbyText);
  const dictionaryWords = /(selector|metadata|dictionary|lookup|field)/i;
  const dictionaryLike = dictionaryWords.test(nearbyText) && !/^\s*$/.test(nearbyText);
  const wordWindow = readWordsAround(buffer, Math.max(0, offset - 24), Math.min(buffer.length, offset + 40));
  return {
    role: watch.role,
    value,
    normalizedValue: watch.normalizedValue ?? value,
    encoding: watch.encoding ?? "plain",
    offset,
    hex: buffer.subarray(offset, offset + 4).toString("hex"),
    assetId: inferAssetIdFromPath(filePath),
    nearbyFamily,
    classification: dictionaryLike
      ? "dictionary-like-context"
      : nearbyFamily
        ? "family-formula-context"
        : "numeric-context-only",
    promotionReady: false,
    nearbyStrings: nearby,
    wordWindow,
  };
}

function assessHashSuffixBinarySourceAudit({ files, fileReports, hits, dictionaryLikeHits, familyContextHits, watchedSelectors, watchedMetadataIds }) {
  return {
    kind: dictionaryLikeHits.length
      ? "binary-dictionary-like-contexts-found"
      : familyContextHits.length
        ? "binary-family-contexts-without-dictionary-name"
        : hits.length
          ? "binary-numeric-contexts-only"
          : "binary-source-context-not-found",
    confidence: dictionaryLikeHits.length ? "medium-low" : familyContextHits.length ? "medium" : hits.length ? "low" : "medium",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: dictionaryLikeHits.length
      ? "Les binaires decodes contiennent des contextes texte proches des ids surveilles, mais cela ne prouve pas encore un dictionnaire source ni l'ownership du champ."
      : familyContextHits.length
        ? "Les binaires decodes relient les ids surveilles a des contextes de famille, sans nommer un dictionnaire source."
        : hits.length
          ? "Les ids surveilles existent dans les binaires decodes, mais sans contexte texte exploitable."
          : "Les ids surveilles ne sont pas retrouves dans les binaires decodes scannes.",
    nextAction: dictionaryLikeHits.length
      ? "Isoler les hits binaires proches de strings dictionary-like puis comparer leurs structures avec les ancres formule/hash avant toute promotion DPS."
      : familyContextHits.length
        ? "Comparer les contextes binaires de famille autour de 949/12337 avec davantage de cibles Bonus_Percent_Per_Power avant toute promotion DPS."
        : "Elargir le scan binaire ou decoder d'autres payloads pour trouver une source de suffixe nommee avant toute promotion DPS.",
    evidence: {
      watchedSelectors,
      watchedMetadataIds,
      filesScanned: files.length,
      filesWithHits: fileReports.length,
      hits: hits.length,
      dictionaryLikeHits: dictionaryLikeHits.length,
      familyContextHits: familyContextHits.length,
    },
  };
}

function compareHashSuffixBinaryContexts(binarySourceAuditFilePath) {
  const audit = JSON.parse(fs.readFileSync(binarySourceAuditFilePath, "utf8"));
  const hits = audit.familyContextHits ?? [];
  const assetGroups = summarizeHashSuffixBinaryAssetContexts(hits);
  const selectorPatternGroups = summarizeSelectorPatternGroups(assetGroups);
  const metadataPatternGroups = summarizeMetadataPatternGroups(assetGroups);
  const assessment = assessHashSuffixBinaryContextComparison({
    assetGroups,
    selectorPatternGroups,
    metadataPatternGroups,
  });
  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-binary-context-comparison-v1",
    source: {
      hashSuffixBinarySourceAudit: binarySourceAuditFilePath,
      auditedAt: audit.auditedAt ?? null,
    },
    summary: {
      assets: assetGroups.length,
      selectorPatternGroups: selectorPatternGroups.length,
      metadataPatternGroups: metadataPatternGroups.length,
      assessment,
    },
    assetGroups,
    selectorPatternGroups,
    metadataPatternGroups,
  };
}

function summarizeHashSuffixBinaryAssetContexts(hits) {
  const groups = new Map();
  for (const hit of hits) {
    const assetKey = String(hit.assetId ?? hit.filePath ?? "unknown");
    if (!groups.has(assetKey)) {
      groups.set(assetKey, {
        assetId: hit.assetId ?? null,
        filePath: hit.filePath,
        targetStrings: new Set(),
        selectorHits: [],
        metadataHits: [],
      });
    }
    const group = groups.get(assetKey);
    for (const text of hit.nearbyStrings ?? []) {
      if (text.family === "bonus-percent-per-power") group.targetStrings.add(text.value);
    }
    if (hit.role === "selector") group.selectorHits.push(summarizeSelectorBinaryHit(hit));
    if (hit.role === "metadata-id") group.metadataHits.push(summarizeMetadataBinaryHit(hit));
  }
  return Array.from(groups.values())
    .map((group) => {
      const selector = group.selectorHits[0] ?? null;
      const effectiveAssetId = group.assetId ?? inferAssetIdFromSelectorHits(group.selectorHits);
      const metadataDistances = group.metadataHits
        .map((metadata) => selector ? metadata.offset - selector.offset : null)
        .filter((value) => value !== null);
      const immediateMetadata = metadataDistances.some((distance) => distance === 16);
      const hasSelector949 = group.selectorHits.some((hit) => hit.value === 949);
      const hasMetadata12337 = group.metadataHits.some((hit) => hit.value === 12337);
      return {
        assetId: effectiveAssetId,
        filePath: group.filePath,
        targetStrings: Array.from(group.targetStrings).sort(),
        selectorHits: group.selectorHits,
        metadataHits: group.metadataHits,
        relation: {
          hasSelector949,
          hasMetadata12337,
          metadataDistancesFromSelector: metadataDistances,
          immediateSelectorMetadataTriplet: immediateMetadata,
          finding: hasSelector949 && immediateMetadata
            ? "selector et metadata sont dans le meme suffixe compact"
            : hasSelector949 && metadataDistances.length
              ? "selector et metadata existent dans le meme asset mais pas dans le meme suffixe compact"
              : hasMetadata12337
                ? "metadata 12337 observee pres de la famille sans selector 949 proche"
                : group.selectorHits.length
                  ? "selecteurs candidats non-949 observes pres de la famille sans metadata 12337 proche"
                  : "aucun selector surveille ni metadata 12337 proche dans les hits de famille",
        },
      };
    })
    .sort((a, b) => Number(a.assetId ?? 0) - Number(b.assetId ?? 0));
}

function inferAssetIdFromSelectorHits(selectorHits) {
  const hit = (selectorHits ?? []).find((item) => Number.isFinite(item.assetCandidate) && item.assetCandidate > 100000 && item.assetCandidate < 4000000);
  return hit?.assetCandidate ?? null;
}

function summarizeSelectorBinaryHit(hit) {
  const words = hit.wordWindow ?? [];
  const wordAt = (relativeOffset) => words.find((word) => word.offset - hit.offset === relativeOffset) ?? null;
  const assetCandidate = wordAt(4)?.uint32 ?? null;
  const metadataCandidate = wordAt(16)?.uint32 ?? null;
  const opcodeCandidate = wordAt(20)?.uint32 ?? null;
  const floatCandidate = wordAt(24)?.float32 ?? null;
  return {
    value: hit.normalizedValue ?? hit.value,
    encodedValue: hit.value,
    encoding: hit.encoding ?? "plain",
    offset: hit.offset,
    assetCandidate,
    metadataCandidate,
    opcodeCandidate,
    floatCandidate,
    patternSignature: [
      "selector",
      classifyRelativeWord(wordAt(4), "asset-candidate"),
      classifyRelativeWord(wordAt(8), "post-asset-a"),
      classifyRelativeWord(wordAt(12), "post-asset-b"),
      classifyRelativeWord(wordAt(16), "metadata-candidate"),
      classifyRelativeWord(wordAt(20), "opcode-candidate"),
      classifyRelativeWord(wordAt(24), "float-candidate"),
    ].join("|"),
    targetStrings: (hit.nearbyStrings ?? []).filter((item) => item.family === "bonus-percent-per-power").map((item) => item.value),
  };
}

function summarizeMetadataBinaryHit(hit) {
  const words = hit.wordWindow ?? [];
  const wordAt = (relativeOffset) => words.find((word) => word.offset - hit.offset === relativeOffset) ?? null;
  return {
    value: hit.value,
    offset: hit.offset,
    previousId: wordAt(-16)?.uint32 ?? null,
    previousFloat: wordAt(-8)?.float32 ?? null,
    opcodeCandidate: wordAt(4)?.uint32 ?? null,
    floatCandidate: wordAt(8)?.float32 ?? null,
    patternSignature: [
      classifyRelativeWord(wordAt(-16), "previous-id"),
      classifyRelativeWord(wordAt(-12), "previous-opcode"),
      classifyRelativeWord(wordAt(-8), "previous-float"),
      classifyRelativeWord(wordAt(-4), "pre-zero"),
      "metadata",
      classifyRelativeWord(wordAt(4), "opcode-candidate"),
      classifyRelativeWord(wordAt(8), "float-candidate"),
    ].join("|"),
  };
}

function classifyRelativeWord(word, label) {
  if (!word) return `${label}:missing`;
  if (word.uint32 === 0) return `${label}:zero`;
  if (word.uint32 === 6) return `${label}:opcode-6`;
  if (word.uint32 === 4294967295) return `${label}:minus-one`;
  if (isAssetLikeId(word.uint32)) return `${label}:asset-like`;
  if (word.uint32 >= 8000 && word.uint32 <= 14000) return `${label}:metadata-like`;
  if (Number.isFinite(word.float32) && Math.abs(word.float32) >= 0.000001 && Math.abs(word.float32) <= 500) return `${label}:float-${word.float32}`;
  return `${label}:raw`;
}

function summarizeSelectorPatternGroups(assetGroups) {
  return summarizeBinaryContextPatternGroups(assetGroups.flatMap((group) =>
    group.selectorHits.map((hit) => ({
      assetId: group.assetId,
      targetStrings: group.targetStrings,
      signature: hit.patternSignature,
      example: hit,
    }))
  ));
}

function summarizeMetadataPatternGroups(assetGroups) {
  return summarizeBinaryContextPatternGroups(assetGroups.flatMap((group) =>
    group.metadataHits.map((hit) => ({
      assetId: group.assetId,
      targetStrings: group.targetStrings,
      signature: hit.patternSignature,
      example: hit,
    }))
  ));
}

function summarizeBinaryContextPatternGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.signature)) {
      groups.set(row.signature, {
        signature: row.signature,
        occurrences: 0,
        assetIds: new Set(),
        targetStrings: new Set(),
        examples: [],
      });
    }
    const group = groups.get(row.signature);
    group.occurrences += 1;
    if (row.assetId !== null && row.assetId !== undefined) group.assetIds.add(row.assetId);
    for (const target of row.targetStrings ?? []) group.targetStrings.add(target);
    if (group.examples.length < 6) {
      group.examples.push({
        assetId: row.assetId,
        targetStrings: row.targetStrings,
        hit: row.example,
      });
    }
  }
  return Array.from(groups.values())
    .map((group) => ({
      signature: group.signature,
      occurrences: group.occurrences,
      assetCount: group.assetIds.size,
      targetStrings: Array.from(group.targetStrings).sort(),
      examples: group.examples,
    }))
    .sort((a, b) => b.assetCount - a.assetCount || b.occurrences - a.occurrences || a.signature.localeCompare(b.signature));
}

function assessHashSuffixBinaryContextComparison({ assetGroups, selectorPatternGroups, metadataPatternGroups }) {
  const bonusAssets = assetGroups.filter((group) => group.targetStrings.length > 0);
  const compactTriplets = bonusAssets.filter((group) => group.relation.immediateSelectorMetadataTriplet);
  const divergentSelectorPatterns = selectorPatternGroups.length > 1;
  return {
    kind: compactTriplets.length >= 2
      ? "binary-context-compact-triplet-repeated"
      : compactTriplets.length === 1 && divergentSelectorPatterns
        ? "binary-context-selector-repeats-but-layout-diverges"
        : bonusAssets.length >= 2
          ? "binary-context-family-repeats-without-stable-layout"
          : "binary-context-comparison-inconclusive",
    confidence: compactTriplets.length === 1 && divergentSelectorPatterns ? "medium" : bonusAssets.length >= 2 ? "medium-low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: compactTriplets.length === 1 && divergentSelectorPatterns
      ? "Le selecteur 949 se repete sur la famille Bonus_Percent_Per_Power, mais le layout du suffixe diverge entre les assets compares."
      : compactTriplets.length >= 2
        ? "Le triplet compact selector/asset/metadata se repete, mais l'ownership champ par champ reste a prouver."
        : "La famille se repete, mais pas assez pour stabiliser le layout du suffixe.",
    nextAction: "Decoder ou identifier d'autres cibles Bonus_Percent_Per_Power afin de confirmer si le suffixe 949 porte toujours un asset-like, puis parser le champ avant promotion DPS.",
    evidence: {
      assets: assetGroups.length,
      bonusAssets: bonusAssets.length,
      compactTriplets: compactTriplets.length,
      selectorPatternGroups: selectorPatternGroups.length,
      metadataPatternGroups: metadataPatternGroups.length,
    },
  };
}

function classifyHashSuffixSublayouts({ familyEvidenceFilePath, binaryContextComparisonFilePath }) {
  const familyEvidence = JSON.parse(fs.readFileSync(familyEvidenceFilePath, "utf8"));
  const comparison = JSON.parse(fs.readFileSync(binaryContextComparisonFilePath, "utf8"));
  const selectorRows = buildHashSuffixSelectorSublayouts(familyEvidence, comparison);
  const metadataRows = buildHashSuffixMetadataSublayouts(familyEvidence, comparison);
  const groups = summarizeHashSuffixSublayoutGroups(selectorRows);
  const assessment = assessHashSuffixSublayoutClassification({ selectorRows, metadataRows, groups });
  return {
    classifiedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-sublayout-classification-v1",
    source: {
      hashSuffixFamilyEvidence: familyEvidenceFilePath,
      hashSuffixBinaryContextComparison: binaryContextComparisonFilePath,
      familySummarizedAt: familyEvidence.summarizedAt ?? null,
      binaryComparedAt: comparison.comparedAt ?? null,
    },
    summary: {
      selectors: selectorRows.length,
      metadataIds: metadataRows.length,
      groups: groups.length,
      assessment,
    },
    groups,
    selectors: selectorRows,
    metadataIds: metadataRows,
  };
}

function buildHashSuffixSelectorSublayouts(familyEvidence, comparison) {
  return (familyEvidence.selectorEvidence ?? []).map((selector) => {
    const binaryHits = (comparison.assetGroups ?? []).flatMap((asset) =>
      (asset.selectorHits ?? [])
        .filter((hit) => String(hit.value) === String(selector.selector))
        .map((hit) => ({
          assetId: asset.assetId,
          targetStrings: asset.targetStrings ?? [],
          relation: asset.relation ?? null,
          hit,
        }))
    );
    const compactMetadataHits = binaryHits.filter((row) => row.hit.metadataCandidate === 12337 && row.hit.opcodeCandidate === 6 && row.hit.floatCandidate === 10);
    const hasMetadataEvidence = (selector.metadataIds ?? []).includes(12337);
    return {
      selector: selector.selector,
      dominantFamily: selector.dominantFamily,
      occurrences: selector.occurrences,
      assetCount: selector.assetCount,
      confidence: selector.confidence,
      score: selector.score,
      metadataIds: selector.metadataIds ?? [],
      class: classifySelectorSublayout({ selector, binaryHits, compactMetadataHits, hasMetadataEvidence }),
      promotionReady: false,
      finding: explainSelectorSublayout({ selector, binaryHits, compactMetadataHits, hasMetadataEvidence }),
      examples: selector.examples ?? [],
      binaryHits: binaryHits.map((row) => ({
        assetId: row.assetId,
        targetStrings: row.targetStrings,
        immediateSelectorMetadataTriplet: Boolean(row.relation?.immediateSelectorMetadataTriplet),
        assetCandidate: row.hit.assetCandidate,
        metadataCandidate: row.hit.metadataCandidate,
        opcodeCandidate: row.hit.opcodeCandidate,
        floatCandidate: row.hit.floatCandidate,
        patternSignature: row.hit.patternSignature,
      })),
    };
  }).sort((a, b) => b.score - a.score || b.assetCount - a.assetCount || a.selector.localeCompare(b.selector));
}

function classifySelectorSublayout({ selector, binaryHits, compactMetadataHits, hasMetadataEvidence }) {
  if (compactMetadataHits.length && binaryHits.length > compactMetadataHits.length) return "mixed-compact-metadata-and-noncompact-selector";
  if (compactMetadataHits.length) return "compact-selector-asset-metadata-scale";
  if (hasMetadataEvidence) return "mined-metadata-scale-without-binary-selector-hit";
  if (selector.dominantFamily === "bonus-percent-per-power" && binaryHits.length) return "bonus-percent-selector-no-metadata-scale";
  if (selector.dominantFamily === "chance-per-power") return "chance-per-power-selector";
  if (selector.dominantFamily === "hash-reference") return "formula-wrapper-or-hash-reference-selector";
  return "unclassified-selector-sublayout";
}

function explainSelectorSublayout({ selector, binaryHits, compactMetadataHits, hasMetadataEvidence }) {
  if (compactMetadataHits.length && binaryHits.length > compactMetadataHits.length) {
    return `Le selecteur ${selector.selector} porte parfois un triplet compact avec metadata, mais pas dans tous ses contextes.`;
  }
  if (compactMetadataHits.length) {
    return `Le selecteur ${selector.selector} forme un triplet compact selector/asset/metadata 12337/10 dans les hits binaires observes.`;
  }
  if (hasMetadataEvidence) {
    return `Le selecteur ${selector.selector} est lie a metadata 12337/10 dans le minage, mais pas comme hit selecteur binaire stable.`;
  }
  if (selector.dominantFamily === "bonus-percent-per-power" && binaryHits.length) {
    return `Le selecteur ${selector.selector} se repete sur Bonus_Percent_Per_Power sans metadata 12337/10 proche.`;
  }
  if (selector.dominantFamily === "chance-per-power") {
    return `Le selecteur ${selector.selector} se repete sur Chance_For_Double_Damage_Per_Power.`;
  }
  if (selector.dominantFamily === "hash-reference") {
    return `Le selecteur ${selector.selector} semble representer une expression wrapper ou reference hash, pas un bonus direct prouve.`;
  }
  return `Le selecteur ${selector.selector} reste insuffisamment classe.`;
}

function buildHashSuffixMetadataSublayouts(familyEvidence, comparison) {
  return (familyEvidence.metadataEvidence ?? []).map((metadata) => {
    const binaryHits = (comparison.assetGroups ?? []).flatMap((asset) =>
      (asset.metadataHits ?? [])
        .filter((hit) => String(hit.value) === String(metadata.metadataId))
        .map((hit) => ({
          assetId: asset.assetId,
          targetStrings: asset.targetStrings ?? [],
          previousId: hit.previousId,
          previousFloat: hit.previousFloat,
          opcodeCandidate: hit.opcodeCandidate,
          floatCandidate: hit.floatCandidate,
          patternSignature: hit.patternSignature,
        }))
    );
    return {
      metadataId: metadata.metadataId,
      occurrences: metadata.occurrences,
      assetCount: metadata.assetCount,
      floats: metadata.floats ?? [],
      selectors: metadata.selectors ?? [],
      confidence: metadata.confidence,
      class: metadata.floats?.length === 1 && metadata.floats[0] === 10
        ? "repeated-scale-metadata-10"
        : "metadata-unclassified",
      promotionReady: false,
      finding: metadata.floats?.length === 1
        ? `Metadata ${metadata.metadataId} se repete avec float ${metadata.floats[0]}, mais elle est partagee par plusieurs selecteurs.`
        : `Metadata ${metadata.metadataId} reste insuffisamment stabilisee.`,
      examples: metadata.examples ?? [],
      binaryHits,
    };
  });
}

function summarizeHashSuffixSublayoutGroups(selectorRows) {
  const groups = new Map();
  for (const row of selectorRows) {
    if (!groups.has(row.class)) {
      groups.set(row.class, {
        class: row.class,
        selectors: [],
        dominantFamilies: new Map(),
        examples: [],
      });
    }
    const group = groups.get(row.class);
    group.selectors.push(row.selector);
    group.dominantFamilies.set(row.dominantFamily ?? "unknown", (group.dominantFamilies.get(row.dominantFamily ?? "unknown") ?? 0) + 1);
    if (group.examples.length < 8) {
      group.examples.push({
        selector: row.selector,
        family: row.dominantFamily,
        finding: row.finding,
      });
    }
  }
  return Array.from(groups.values()).map((group) => ({
    class: group.class,
    selectors: group.selectors.sort((a, b) => Number(a) - Number(b)),
    selectorCount: group.selectors.length,
    dominantFamilies: Array.from(group.dominantFamilies.entries())
      .map(([family, count]) => ({ family, count }))
      .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family)),
    examples: group.examples,
  })).sort((a, b) => b.selectorCount - a.selectorCount || a.class.localeCompare(b.class));
}

function assessHashSuffixSublayoutClassification({ selectorRows, metadataRows, groups }) {
  const bonusSelectors = selectorRows.filter((row) => row.dominantFamily === "bonus-percent-per-power");
  const compactSelectors = selectorRows.filter((row) => row.class.includes("compact"));
  const noMetadataBonusSelectors = bonusSelectors.filter((row) => row.class === "bonus-percent-selector-no-metadata-scale");
  return {
    kind: bonusSelectors.length > 1 && groups.length > 1
      ? "hash-suffix-sublayouts-classified-divergent"
      : "hash-suffix-sublayout-classification-inconclusive",
    confidence: bonusSelectors.length > 1 ? "medium" : "medium-low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les suffixes Bonus_Percent_Per_Power se repartissent en plusieurs sous-layouts; aucun selecteur unique ne peut etre promu comme champ DPS fiable.",
    nextAction: "Construire un parser de sous-layouts selector/asset/metadata et valider chaque classe separement avant toute promotion DPS.",
    evidence: {
      selectors: selectorRows.length,
      metadataIds: metadataRows.length,
      groups: groups.length,
      bonusSelectors: bonusSelectors.map((row) => row.selector),
      compactSelectors: compactSelectors.map((row) => row.selector),
      noMetadataBonusSelectors: noMetadataBonusSelectors.map((row) => row.selector),
    },
  };
}

function parseHashSuffixSublayoutFields(classificationFilePath) {
  const classification = JSON.parse(fs.readFileSync(classificationFilePath, "utf8"));
  const fieldCandidates = (classification.selectors ?? []).map((selector) => buildHashSuffixSublayoutFieldCandidate(selector));
  const metadataFields = (classification.metadataIds ?? []).map((metadata) => ({
    fieldId: `metadata:${metadata.metadataId}`,
    metadataId: metadata.metadataId,
    class: metadata.class,
    candidateRole: metadata.class === "repeated-scale-metadata-10" ? "shared-scale-candidate" : "unknown-metadata",
    valueCandidate: metadata.floats?.length === 1 ? metadata.floats[0] : null,
    selectors: metadata.selectors ?? [],
    confidence: metadata.confidence ?? "low",
    status: "blocked",
    promotionReady: false,
    blocker: "field-level-parser-required",
    finding: metadata.finding,
  }));
  const assessment = assessParsedHashSuffixSublayoutFields(fieldCandidates, metadataFields);
  return {
    parsedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-sublayout-field-parser-v1",
    source: {
      hashSuffixSublayoutClassification: classificationFilePath,
      classifiedAt: classification.classifiedAt ?? null,
    },
    summary: {
      fields: fieldCandidates.length,
      metadataFields: metadataFields.length,
      blockedFields: fieldCandidates.filter((field) => field.status === "blocked").length + metadataFields.filter((field) => field.status === "blocked").length,
      promotableFields: fieldCandidates.filter((field) => field.promotionReady).length + metadataFields.filter((field) => field.promotionReady).length,
      assessment,
    },
    fieldCandidates,
    metadataFields,
  };
}

function buildHashSuffixSublayoutFieldCandidate(selector) {
  const compactHits = (selector.binaryHits ?? []).filter((hit) => hit.immediateSelectorMetadataTriplet);
  const binaryAssets = Array.from(new Set((selector.binaryHits ?? []).map((hit) => hit.assetId).filter((assetId) => assetId != null))).sort((a, b) => a - b);
  const targetStrings = Array.from(new Set((selector.binaryHits ?? []).flatMap((hit) => hit.targetStrings ?? []))).sort();
  const fieldShape = inferHashSuffixFieldShape(selector, compactHits);
  return {
    fieldId: `selector:${selector.selector}`,
    selector: selector.selector,
    class: selector.class,
    family: selector.dominantFamily ?? null,
    candidateRole: inferHashSuffixCandidateRole(selector),
    fieldShape,
    binaryAssets,
    targetStrings,
    metadataIds: selector.metadataIds ?? [],
    compactTripletAssets: compactHits.map((hit) => hit.assetId),
    valueCandidates: inferHashSuffixValueCandidates(selector, compactHits),
    confidence: selector.confidence ?? "low",
    status: "blocked",
    promotionReady: false,
    blocker: "field-level-parser-required",
    finding: selector.finding,
    nextAction: nextHashSuffixFieldAction(selector),
  };
}

function inferHashSuffixCandidateRole(selector) {
  if (selector.class === "mixed-compact-metadata-and-noncompact-selector") return "bonus-percent-selector-mixed";
  if (selector.class === "compact-selector-asset-metadata-scale") return "bonus-percent-compact-scale-candidate";
  if (selector.class === "bonus-percent-selector-no-metadata-scale") return "bonus-percent-selector-without-local-scale";
  if (selector.class === "mined-metadata-scale-without-binary-selector-hit") return "metadata-linked-selector";
  if (selector.class === "formula-wrapper-or-hash-reference-selector") return "formula-wrapper-or-reference";
  if (selector.class === "chance-per-power-selector") return "chance-scaling-selector";
  return "unknown-selector";
}

function inferHashSuffixFieldShape(selector, compactHits) {
  if (compactHits.length) return "selector -> asset-like -> padding/opcode -> metadata-id -> opcode-6 -> float-scale";
  if (selector.class === "bonus-percent-selector-no-metadata-scale") return "selector -> asset-like/context without nearby metadata scale";
  if (selector.class === "mined-metadata-scale-without-binary-selector-hit") return "selector linked to metadata in mined anchors, binary selector shape not stable";
  if (selector.class === "formula-wrapper-or-hash-reference-selector") return "formula/reference wrapper, not direct bonus field";
  return "unknown-or-divergent-suffix-shape";
}

function inferHashSuffixValueCandidates(selector, compactHits) {
  if (!compactHits.length) return [];
  return compactHits.map((hit) => ({
    assetId: hit.assetId,
    selector: selector.selector,
    assetCandidate: hit.assetCandidate,
    metadataCandidate: hit.metadataCandidate,
    opcodeCandidate: hit.opcodeCandidate,
    floatCandidate: hit.floatCandidate,
    status: "blocked",
  }));
}

function nextHashSuffixFieldAction(selector) {
  if (selector.class === "mixed-compact-metadata-and-noncompact-selector") {
    return "Separer le layout compact du layout non compact avant d'attribuer metadata et scale au selecteur.";
  }
  if (selector.class === "bonus-percent-selector-no-metadata-scale") {
    return "Parser le contexte asset-like sans metadata proche et chercher une source de scale separee.";
  }
  if (selector.class === "mined-metadata-scale-without-binary-selector-hit") {
    return "Relier le selecteur mine a un hit binaire stable ou le garder comme metadata externe.";
  }
  if (selector.class === "formula-wrapper-or-hash-reference-selector") {
    return "Traiter ce selecteur comme wrapper/reference et ne pas l'utiliser comme bonus direct.";
  }
  return "Collecter plus de contextes binaires avant attribution DPS.";
}

function assessParsedHashSuffixSublayoutFields(fieldCandidates, metadataFields) {
  const bonusFields = fieldCandidates.filter((field) => field.family === "bonus-percent-per-power");
  return {
    kind: "hash-suffix-sublayout-fields-built-blocked",
    confidence: bonusFields.length >= 2 ? "medium" : "medium-low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les sous-layouts sont convertis en champs candidats bloques; aucune valeur n'est promue au DPS fiable.",
    nextAction: "Coder les decodeurs binaires par fieldShape, puis tester chaque classe contre ses assets avant promotion.",
    evidence: {
      fieldCandidates: fieldCandidates.length,
      metadataFields: metadataFields.length,
      bonusFields: bonusFields.map((field) => field.fieldId),
    },
  };
}

function decodeHashSuffixFieldShapes(fieldsFilePath) {
  const fields = JSON.parse(fs.readFileSync(fieldsFilePath, "utf8"));
  const decodedFields = (fields.fieldCandidates ?? []).map((field) => decodeHashSuffixFieldCandidate(field));
  const decodedMetadata = (fields.metadataFields ?? []).map((field) => decodeHashSuffixMetadataField(field));
  const shapeDecoders = summarizeHashSuffixShapeDecoders(decodedFields);
  const assessment = assessHashSuffixShapeDecoders(decodedFields, decodedMetadata, shapeDecoders);
  return {
    decodedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-field-shape-decoder-v1",
    source: {
      hashSuffixSublayoutFields: fieldsFilePath,
      parsedAt: fields.parsedAt ?? null,
    },
    summary: {
      decodedFields: decodedFields.length,
      decodedMetadata: decodedMetadata.length,
      shapeDecoders: shapeDecoders.length,
      blockedOutputs: decodedFields.filter((field) => field.status === "blocked").length + decodedMetadata.filter((field) => field.status === "blocked").length,
      promotableOutputs: decodedFields.filter((field) => field.promotionReady).length + decodedMetadata.filter((field) => field.promotionReady).length,
      assessment,
    },
    shapeDecoders,
    decodedFields,
    decodedMetadata,
  };
}

function decodeHashSuffixFieldCandidate(field) {
  if (field.fieldShape === "selector -> asset-like -> padding/opcode -> metadata-id -> opcode-6 -> float-scale") {
    return decodeCompactHashSuffixField(field);
  }
  if (field.fieldShape === "selector -> asset-like/context without nearby metadata scale") {
    return decodeBonusNoLocalScaleField(field);
  }
  if (field.fieldShape === "selector linked to metadata in mined anchors, binary selector shape not stable") {
    return decodeMinedMetadataLinkedField(field);
  }
  if (field.fieldShape === "formula/reference wrapper, not direct bonus field") {
    return decodeFormulaWrapperField(field);
  }
  return decodeUnknownHashSuffixField(field);
}

function decodeCompactHashSuffixField(field) {
  const decodedValues = (field.valueCandidates ?? []).map((candidate) => ({
    assetId: candidate.assetId,
    selector: candidate.selector,
    targetAssetId: candidate.assetCandidate,
    metadataId: candidate.metadataCandidate,
    opcode: candidate.opcodeCandidate,
    scale: candidate.floatCandidate,
    interpretation: candidate.metadataCandidate === 12337 && candidate.opcodeCandidate === 6 && candidate.floatCandidate === 10
      ? "blocked-compact-scale-10-candidate"
      : "blocked-compact-scale-unknown",
    promotionReady: false,
  }));
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: "compact-selector-asset-metadata-scale-decoder",
    class: field.class,
    family: field.family,
    status: "blocked",
    confidence: decodedValues.length === 1 ? "medium" : "medium-low",
    promotionReady: false,
    decodedValues,
    blockers: compactFieldBlockers(field, decodedValues),
    finding: decodedValues.length
      ? "Le shape compact decode selector/asset/metadata/opcode/scale, mais il n'est observe en compact que sur une partie des contextes."
      : "Le shape compact est declare mais aucune valeur compacte n'est disponible.",
    nextAction: "Tester le decodeur compact sur davantage de hits et separer explicitement les variantes compactes/non compactes.",
  };
}

function compactFieldBlockers(field, decodedValues) {
  const blockers = ["field-level-parser-required", "layout-variant-split-required", "uptime-not-proven"];
  if ((field.binaryAssets ?? []).length > decodedValues.length) blockers.push("noncompact-context-present");
  return blockers;
}

function decodeBonusNoLocalScaleField(field) {
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: "bonus-selector-without-local-scale-decoder",
    class: field.class,
    family: field.family,
    status: "blocked",
    confidence: field.binaryAssets?.length >= 2 ? "medium-low" : "low",
    promotionReady: false,
    decodedValues: (field.binaryAssets ?? []).map((assetId) => ({
      assetId,
      selector: field.selector,
      scale: null,
      interpretation: "blocked-bonus-selector-with-external-or-missing-scale",
      promotionReady: false,
    })),
    blockers: ["scale-source-not-local", "field-level-parser-required"],
    finding: "Le selecteur bonus est repetable, mais le scale n'est pas dans le suffixe local observe.",
    nextAction: "Chercher la scale dans un champ voisin, une metadata externe ou une table separee avant calcul DPS.",
  };
}

function decodeMinedMetadataLinkedField(field) {
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: "mined-metadata-linked-selector-decoder",
    class: field.class,
    family: field.family,
    status: "blocked",
    confidence: "low",
    promotionReady: false,
    decodedValues: (field.metadataIds ?? []).map((metadataId) => ({
      selector: field.selector,
      metadataId,
      interpretation: "blocked-mined-link-without-stable-binary-shape",
      promotionReady: false,
    })),
    blockers: ["binary-selector-hit-required", "field-level-parser-required"],
    finding: "Le lien selector/metadata existe dans le minage, mais le hit binaire stable manque.",
    nextAction: "Retrouver le hit binaire du selecteur ou classer cette valeur comme metadata partagee hors suffixe.",
  };
}

function decodeFormulaWrapperField(field) {
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: "formula-wrapper-reference-decoder",
    class: field.class,
    family: field.family,
    status: "blocked",
    confidence: "medium-low",
    promotionReady: false,
    decodedValues: (field.binaryAssets ?? []).map((assetId) => ({
      assetId,
      selector: field.selector,
      interpretation: "reference-wrapper-not-direct-dps-bonus",
      promotionReady: false,
    })),
    blockers: ["not-direct-bonus-field"],
    finding: "Le shape est traite comme wrapper ou reference de formule, pas comme bonus direct.",
    nextAction: "Le brancher au parser d'expressions, pas au bucket DPS direct.",
  };
}

function decodeUnknownHashSuffixField(field) {
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: "unknown-suffix-shape-decoder",
    class: field.class,
    family: field.family,
    status: "blocked",
    confidence: "very-low",
    promotionReady: false,
    decodedValues: [],
    blockers: ["unknown-field-shape"],
    finding: "Le shape reste trop divergent ou peu observe pour etre decode.",
    nextAction: "Collecter davantage de hits binaires ou rattacher ce selecteur a une famille nommee.",
  };
}

function decodeHashSuffixMetadataField(field) {
  return {
    fieldId: field.fieldId,
    metadataId: field.metadataId,
    decoder: field.class === "repeated-scale-metadata-10" ? "shared-scale-metadata-decoder" : "unknown-metadata-decoder",
    class: field.class,
    status: "blocked",
    confidence: field.confidence ?? "low",
    promotionReady: false,
    decodedValue: {
      value: field.valueCandidate,
      selectors: field.selectors ?? [],
      interpretation: field.class === "repeated-scale-metadata-10"
        ? "blocked-shared-scale-10-candidate"
        : "blocked-unknown-metadata",
    },
    blockers: ["metadata-shared-by-multiple-selectors", "field-level-parser-required"],
    finding: field.finding,
    nextAction: "Prouver le dictionnaire metadata ou rattacher cette metadata a un shape binaire unique.",
  };
}

function summarizeHashSuffixShapeDecoders(decodedFields) {
  const byDecoder = new Map();
  for (const field of decodedFields) {
    if (!byDecoder.has(field.decoder)) {
      byDecoder.set(field.decoder, {
        decoder: field.decoder,
        fields: [],
        classes: new Set(),
        families: new Set(),
        decodedValues: 0,
      });
    }
    const row = byDecoder.get(field.decoder);
    row.fields.push(field.fieldId);
    if (field.class) row.classes.add(field.class);
    if (field.family) row.families.add(field.family);
    row.decodedValues += field.decodedValues?.length ?? 0;
  }
  return Array.from(byDecoder.values()).map((row) => ({
    decoder: row.decoder,
    fieldCount: row.fields.length,
    fields: row.fields.sort(),
    classes: Array.from(row.classes).sort(),
    families: Array.from(row.families).sort(),
    decodedValues: row.decodedValues,
    promotionReady: false,
  })).sort((a, b) => b.fieldCount - a.fieldCount || a.decoder.localeCompare(b.decoder));
}

function assessHashSuffixShapeDecoders(decodedFields, decodedMetadata, shapeDecoders) {
  const compactDecoder = shapeDecoders.find((row) => row.decoder === "compact-selector-asset-metadata-scale-decoder");
  const bonusNoScaleDecoder = shapeDecoders.find((row) => row.decoder === "bonus-selector-without-local-scale-decoder");
  return {
    kind: "hash-suffix-field-shape-decoders-built-blocked",
    confidence: compactDecoder && bonusNoScaleDecoder ? "medium" : "medium-low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les decodeurs par fieldShape produisent des sorties candidates, mais toutes restent bloquees faute d'ownership et de source de scale stable.",
    nextAction: "Comparer les sorties decodees aux offsets binaires originaux et rattacher chaque decoder a un champ record prouve.",
    evidence: {
      decodedFields: decodedFields.length,
      decodedMetadata: decodedMetadata.length,
      shapeDecoders: shapeDecoders.length,
      compactDecodedValues: compactDecoder?.decodedValues ?? 0,
      bonusNoScaleFields: bonusNoScaleDecoder?.fieldCount ?? 0,
    },
  };
}

function linkHashSuffixDecodedOffsets({ fieldShapeDecodersFilePath, binaryContextComparisonFilePath }) {
  const decoded = JSON.parse(fs.readFileSync(fieldShapeDecodersFilePath, "utf8"));
  const comparison = JSON.parse(fs.readFileSync(binaryContextComparisonFilePath, "utf8"));
  const linkedFields = (decoded.decodedFields ?? []).map((field) => linkDecodedFieldToOffsets(field, comparison));
  const linkedMetadata = (decoded.decodedMetadata ?? []).map((field) => linkDecodedMetadataToOffsets(field, comparison));
  const assessment = assessHashSuffixDecodedOffsetLinks(linkedFields, linkedMetadata);
  return {
    linkedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-decoded-offset-links-v1",
    source: {
      hashSuffixFieldShapeDecoders: fieldShapeDecodersFilePath,
      hashSuffixBinaryContextComparison: binaryContextComparisonFilePath,
      decodedAt: decoded.decodedAt ?? null,
      comparedAt: comparison.comparedAt ?? null,
    },
    summary: {
      linkedFields: linkedFields.length,
      linkedMetadata: linkedMetadata.length,
      offsetLinks: linkedFields.reduce((sum, field) => sum + (field.offsetLinks?.length ?? 0), 0) + linkedMetadata.reduce((sum, field) => sum + (field.offsetLinks?.length ?? 0), 0),
      compactOffsetLinks: linkedFields.flatMap((field) => field.offsetLinks ?? []).filter((link) => link.linkClass === "compact-selector-metadata-offset-link").length,
      promotableLinks: linkedFields.flatMap((field) => field.offsetLinks ?? []).filter((link) => link.promotionReady).length + linkedMetadata.flatMap((field) => field.offsetLinks ?? []).filter((link) => link.promotionReady).length,
      assessment,
    },
    linkedFields,
    linkedMetadata,
  };
}

function linkDecodedFieldToOffsets(field, comparison) {
  const offsetLinks = [];
  for (const value of field.decodedValues ?? []) {
    const asset = findHashSuffixAssetGroup(comparison, value.assetId);
    if (!asset) {
      offsetLinks.push(buildMissingOffsetLink(field, value, "asset-group-not-found"));
      continue;
    }
    const selectorHit = (asset.selectorHits ?? []).find((hit) => String(hit.value) === String(value.selector));
    const metadataHit = (asset.metadataHits ?? []).find((hit) =>
      value.metadataId != null
        ? String(hit.value) === String(value.metadataId) && hit.offset >= (selectorHit?.offset ?? -Infinity)
        : false
    ) ?? (asset.metadataHits ?? []).find((hit) => value.metadataId != null && String(hit.value) === String(value.metadataId));
    offsetLinks.push(buildDecodedOffsetLink({ field, value, asset, selectorHit, metadataHit }));
  }
  if (!offsetLinks.length && ["bonus-selector-without-local-scale-decoder", "formula-wrapper-reference-decoder"].includes(field.decoder)) {
    for (const assetId of inferFieldAssetsFromDecodedValues(field)) {
      const asset = findHashSuffixAssetGroup(comparison, assetId);
      const selectorHit = (asset?.selectorHits ?? []).find((hit) => String(hit.value) === String(field.selector));
      offsetLinks.push(buildDecodedOffsetLink({ field, value: { assetId, selector: field.selector }, asset, selectorHit, metadataHit: null }));
    }
  }
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: field.decoder,
    status: "blocked",
    confidence: field.confidence,
    promotionReady: false,
    offsetLinks,
    blockers: Array.from(new Set([...(field.blockers ?? []), ...offsetLinks.flatMap((link) => link.blockers ?? [])])),
    finding: offsetLinks.length
      ? "Les sorties decodees sont rattachees aux offsets binaires disponibles, mais aucun lien ne prouve encore un champ record promouvable."
      : "Aucun offset binaire stable n'a ete rattache a cette sortie decodee.",
  };
}

function inferFieldAssetsFromDecodedValues(field) {
  return Array.from(new Set((field.decodedValues ?? []).map((value) => value.assetId).filter((assetId) => assetId != null)));
}

function findHashSuffixAssetGroup(comparison, assetId) {
  return (comparison.assetGroups ?? []).find((asset) => Number(asset.assetId) === Number(assetId)) ?? null;
}

function buildMissingOffsetLink(field, value, reason) {
  return {
    assetId: value.assetId ?? null,
    selector: value.selector ?? field.selector ?? null,
    linkClass: "missing-offset-link",
    selectorOffset: null,
    metadataOffset: null,
    distance: null,
    promotionReady: false,
    blockers: [reason, "field-level-parser-required"],
    finding: "La sortie decodee ne peut pas encore etre rattachee a un offset binaire source.",
  };
}

function buildDecodedOffsetLink({ field, value, asset, selectorHit, metadataHit }) {
  const selectorOffset = selectorHit?.offset ?? null;
  const metadataOffset = metadataHit?.offset ?? null;
  const distance = selectorOffset != null && metadataOffset != null ? metadataOffset - selectorOffset : null;
  const compact = selectorOffset != null
    && metadataOffset != null
    && distance === 16
    && selectorHit?.metadataCandidate === metadataHit?.value
    && selectorHit?.opcodeCandidate === metadataHit?.opcodeCandidate
    && selectorHit?.floatCandidate === metadataHit?.floatCandidate;
  const noLocalScale = selectorOffset != null && metadataOffset == null && field.decoder === "bonus-selector-without-local-scale-decoder";
  return {
    assetId: value.assetId ?? asset?.assetId ?? null,
    targetStrings: asset?.targetStrings ?? [],
    selector: value.selector ?? field.selector ?? null,
    decoder: field.decoder,
    linkClass: compact
      ? "compact-selector-metadata-offset-link"
      : noLocalScale
        ? "selector-offset-without-local-scale"
        : selectorOffset != null || metadataOffset != null
          ? "partial-offset-link"
          : "missing-offset-link",
    selectorOffset,
    metadataOffset,
    distance,
    selectorPatternSignature: selectorHit?.patternSignature ?? null,
    metadataPatternSignature: metadataHit?.patternSignature ?? null,
    decodedValue: {
      targetAssetId: value.targetAssetId ?? selectorHit?.assetCandidate ?? null,
      metadataId: value.metadataId ?? metadataHit?.value ?? null,
      opcode: value.opcode ?? selectorHit?.opcodeCandidate ?? metadataHit?.opcodeCandidate ?? null,
      scale: value.scale ?? selectorHit?.floatCandidate ?? metadataHit?.floatCandidate ?? null,
    },
    promotionReady: false,
    blockers: inferDecodedOffsetLinkBlockers({ field, compact, noLocalScale, selectorOffset, metadataOffset }),
    finding: compact
      ? "Le candidat decode est rattache a un lien compact selector -> metadata dans le payload, mais le champ record et l'uptime restent non prouves."
      : noLocalScale
        ? "Le selecteur est rattache a un offset binaire, mais aucune scale locale n'est presente."
        : "Le lien offset est partiel ou divergent et ne prouve pas un champ DPS direct.",
  };
}

function inferDecodedOffsetLinkBlockers({ field, compact, noLocalScale, selectorOffset, metadataOffset }) {
  const blockers = ["field-level-parser-required"];
  if (!compact) blockers.push("record-field-ownership-not-proven");
  if (compact) blockers.push("uptime-not-proven");
  if (noLocalScale) blockers.push("scale-source-not-local");
  if (selectorOffset == null) blockers.push("selector-offset-missing");
  if (field.decoder === "compact-selector-asset-metadata-scale-decoder" && metadataOffset == null) blockers.push("metadata-offset-missing");
  if ((field.blockers ?? []).includes("noncompact-context-present")) blockers.push("noncompact-context-present");
  return Array.from(new Set(blockers));
}

function linkDecodedMetadataToOffsets(field, comparison) {
  const offsetLinks = [];
  for (const asset of comparison.assetGroups ?? []) {
    for (const hit of asset.metadataHits ?? []) {
      if (String(hit.value) !== String(field.metadataId)) continue;
      offsetLinks.push({
        assetId: asset.assetId,
        targetStrings: asset.targetStrings ?? [],
        metadataId: field.metadataId,
        metadataOffset: hit.offset,
        previousId: hit.previousId,
        opcode: hit.opcodeCandidate,
        scale: hit.floatCandidate,
        patternSignature: hit.patternSignature,
        linkClass: "metadata-offset-link",
        promotionReady: false,
        blockers: ["metadata-shared-by-multiple-selectors", "field-level-parser-required"],
        finding: "La metadata est rattachee a un offset, mais elle reste partagee par plusieurs selecteurs.",
      });
    }
  }
  return {
    fieldId: field.fieldId,
    metadataId: field.metadataId,
    decoder: field.decoder,
    status: "blocked",
    confidence: field.confidence,
    promotionReady: false,
    offsetLinks,
    blockers: Array.from(new Set([...(field.blockers ?? []), ...offsetLinks.flatMap((link) => link.blockers ?? [])])),
    finding: offsetLinks.length
      ? "La metadata decodee est rattachee a des offsets binaires, mais reste partagee et non promouvable."
      : "La metadata decodee n'a pas encore d'offset binaire rattache.",
  };
}

function assessHashSuffixDecodedOffsetLinks(linkedFields, linkedMetadata) {
  const allFieldLinks = linkedFields.flatMap((field) => field.offsetLinks ?? []);
  const compactLinks = allFieldLinks.filter((link) => link.linkClass === "compact-selector-metadata-offset-link");
  const selectorOnlyLinks = allFieldLinks.filter((link) => link.linkClass === "selector-offset-without-local-scale");
  return {
    kind: "hash-suffix-decoded-offsets-linked-blocked",
    confidence: compactLinks.length && selectorOnlyLinks.length ? "medium" : compactLinks.length ? "medium-low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les sorties decodees sont rattachees a des offsets binaires, mais aucun lien ne prouve encore un champ record DPS promouvable.",
    nextAction: "Construire une inspection de record autour des offsets rattaches pour prouver les bornes et l'ownership du champ.",
    evidence: {
      linkedFields: linkedFields.length,
      linkedMetadata: linkedMetadata.length,
      offsetLinks: allFieldLinks.length + linkedMetadata.flatMap((field) => field.offsetLinks ?? []).length,
      compactLinks: compactLinks.length,
      selectorOnlyLinks: selectorOnlyLinks.length,
    },
  };
}

function inspectHashSuffixOffsetRecords({ decodedOffsetLinksFilePath, fieldRecordsFilePath }) {
  const offsetLinks = JSON.parse(fs.readFileSync(decodedOffsetLinksFilePath, "utf8"));
  const fieldRecords = JSON.parse(fs.readFileSync(fieldRecordsFilePath, "utf8"));
  const recordLinks = (offsetLinks.linkedFields ?? []).map((field) => inspectDecodedFieldRecordLinks(field, fieldRecords));
  const metadataRecordLinks = (offsetLinks.linkedMetadata ?? []).map((field) => inspectDecodedMetadataRecordLinks(field, fieldRecords));
  const assessment = assessHashSuffixOffsetRecordInspection(recordLinks, metadataRecordLinks);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-offset-record-inspection-v1",
    source: {
      hashSuffixDecodedOffsetLinks: decodedOffsetLinksFilePath,
      fieldRecords: fieldRecordsFilePath,
      linkedAt: offsetLinks.linkedAt ?? null,
      fieldRecordsInspectedAt: fieldRecords.inspectedAt ?? null,
    },
    summary: {
      fields: recordLinks.length,
      metadataFields: metadataRecordLinks.length,
      recordLinks: recordLinks.reduce((sum, field) => sum + (field.recordLinks?.length ?? 0), 0) + metadataRecordLinks.reduce((sum, field) => sum + (field.recordLinks?.length ?? 0), 0),
      suffixRecordLinks: recordLinks.flatMap((field) => field.recordLinks ?? []).filter((link) => link.recordPlacement === "suffix-of-current-record").length,
      ownerProvenLinks: recordLinks.flatMap((field) => field.recordLinks ?? []).filter((link) => link.fieldOwnership === "proven").length,
      assessment,
    },
    recordLinks,
    metadataRecordLinks,
  };
}

function inspectDecodedFieldRecordLinks(field, fieldRecords) {
  const recordLinks = (field.offsetLinks ?? []).map((link) => inspectOffsetLinkAgainstRecords(link, fieldRecords));
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    decoder: field.decoder,
    status: "blocked",
    promotionReady: false,
    recordLinks,
    blockers: Array.from(new Set([...(field.blockers ?? []), ...recordLinks.flatMap((link) => link.blockers ?? [])])),
    finding: recordLinks.some((link) => link.recordPlacement === "suffix-of-current-record")
      ? "Au moins un offset decode est localise dans le suffixe d'un record texte, mais l'ownership champ reste non prouve."
      : "Les offsets decodees ne prouvent pas encore de placement record exploitable.",
  };
}

function inspectDecodedMetadataRecordLinks(field, fieldRecords) {
  const recordLinks = (field.offsetLinks ?? []).map((link) => inspectMetadataOffsetAgainstRecords(link, fieldRecords));
  return {
    fieldId: field.fieldId,
    metadataId: field.metadataId,
    decoder: field.decoder,
    status: "blocked",
    promotionReady: false,
    recordLinks,
    blockers: Array.from(new Set([...(field.blockers ?? []), ...recordLinks.flatMap((link) => link.blockers ?? [])])),
    finding: "Les metadata offsets sont localises quand possible, mais restent partagees et non promouvables.",
  };
}

function inspectOffsetLinkAgainstRecords(link, fieldRecords) {
  const selectorRecord = findRecordContainingOffset(fieldRecords, link.selectorOffset);
  const metadataRecord = findRecordContainingOffset(fieldRecords, link.metadataOffset);
  const sameRecord = selectorRecord?.record?.offset != null && selectorRecord?.record?.offset === metadataRecord?.record?.offset;
  const recordPlacement = sameRecord
    ? selectorRecord.placement
    : selectorRecord?.placement ?? metadataRecord?.placement ?? "not-in-selected-records";
  const fieldOwnership = sameRecord && selectorRecord.placement === "suffix-of-current-record"
    ? "suffix-local-not-owner-proven"
    : "not-proven";
  return {
    assetId: link.assetId,
    selector: link.selector,
    linkClass: link.linkClass,
    selectorOffset: link.selectorOffset,
    metadataOffset: link.metadataOffset,
    distance: link.distance,
    decodedValue: link.decodedValue,
    selectorRecord: summarizeRecordPlacement(selectorRecord),
    metadataRecord: summarizeRecordPlacement(metadataRecord),
    sameRecord,
    recordPlacement,
    fieldOwnership,
    promotionReady: false,
    blockers: inferOffsetRecordBlockers({ link, sameRecord, recordPlacement, fieldOwnership }),
    finding: sameRecord && recordPlacement === "suffix-of-current-record"
      ? "Selector et metadata sont dans le suffixe du meme record texte; cela prouve le placement local, pas l'ownership champ DPS."
      : "Le placement record est partiel, divergent ou absent des records selectionnes.",
  };
}

function inspectMetadataOffsetAgainstRecords(link, fieldRecords) {
  const placement = findRecordContainingOffset(fieldRecords, link.metadataOffset);
  return {
    assetId: link.assetId,
    metadataId: link.metadataId,
    metadataOffset: link.metadataOffset,
    scale: link.scale,
    record: summarizeRecordPlacement(placement),
    recordPlacement: placement?.placement ?? "not-in-selected-records",
    fieldOwnership: "not-proven",
    promotionReady: false,
    blockers: ["metadata-shared-by-multiple-selectors", "field-level-parser-required"],
    finding: placement
      ? "La metadata est localisee dans un record inspecte, mais reste partagee."
      : "La metadata n'est pas localisee dans les records selectionnes.",
  };
}

function findRecordContainingOffset(fieldRecords, offset) {
  if (!Number.isFinite(offset)) return null;
  for (const record of fieldRecords.records ?? []) {
    const prefix = (record.prefixTokens ?? []).find((token) => tokenCoversOffset(token, offset));
    if (prefix) return { placement: "prefix-of-current-record", record, token: prefix };
    if (offset >= record.offset && offset <= record.endOffset) return { placement: "string-body", record, token: null };
    const suffix = (record.suffixTokens ?? []).find((token) => tokenCoversOffset(token, offset));
    if (suffix) return { placement: "suffix-of-current-record", record, token: suffix };
  }
  return null;
}

function tokenCoversOffset(token, offset) {
  if (!Number.isFinite(offset) || !Number.isFinite(token?.offset)) return false;
  const valueEnd = Number.isFinite(token.valueOffset) ? token.valueOffset + 3 : token.offset + 3;
  return offset >= token.offset && offset <= valueEnd;
}

function summarizeRecordPlacement(placement) {
  if (!placement) return null;
  return {
    placement: placement.placement,
    recordOffset: placement.record.offset,
    recordEndOffset: placement.record.endOffset,
    recordValue: placement.record.value,
    previousString: placement.record.previousString?.value ?? null,
    nextString: placement.record.nextString?.value ?? null,
    token: placement.token
      ? {
          offset: placement.token.offset,
          kind: placement.token.kind,
          value: placement.token.value ?? placement.token.u32 ?? null,
          opcode: placement.token.opcode ?? null,
          valueOffset: placement.token.valueOffset ?? null,
        }
      : null,
  };
}

function inferOffsetRecordBlockers({ link, sameRecord, recordPlacement, fieldOwnership }) {
  const blockers = ["field-level-parser-required"];
  if (!sameRecord) blockers.push("record-boundary-not-shared");
  if (recordPlacement !== "suffix-of-current-record") blockers.push("record-placement-not-suffix");
  if (fieldOwnership !== "proven") blockers.push("record-field-ownership-not-proven");
  if ((link.blockers ?? []).includes("scale-source-not-local")) blockers.push("scale-source-not-local");
  if ((link.blockers ?? []).includes("noncompact-context-present")) blockers.push("noncompact-context-present");
  return Array.from(new Set(blockers));
}

function assessHashSuffixOffsetRecordInspection(recordLinks, metadataRecordLinks) {
  const allLinks = recordLinks.flatMap((field) => field.recordLinks ?? []);
  const suffixLinks = allLinks.filter((link) => link.recordPlacement === "suffix-of-current-record");
  const ownerProven = allLinks.filter((link) => link.fieldOwnership === "proven");
  return {
    kind: "hash-suffix-offset-records-inspected-blocked",
    confidence: suffixLinks.length ? "medium" : "medium-low",
    fieldOwnership: ownerProven.length ? "partially-proven" : "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les offsets decodees sont localisees dans les records inspectes, mais aucun champ record DPS n'est encore possede de facon prouvee.",
    nextAction: "Comparer les bornes du suffixe record avec d'autres assets et identifier un header/longueur de champ stable avant promotion.",
    evidence: {
      fieldLinks: allLinks.length,
      metadataLinks: metadataRecordLinks.flatMap((field) => field.recordLinks ?? []).length,
      suffixLinks: suffixLinks.length,
      ownerProvenLinks: ownerProven.length,
    },
  };
}

function compareHashSuffixRecordBoundaries({ decodedOffsetLinksFilePath, fieldRecordFilePaths }) {
  const offsetLinks = JSON.parse(fs.readFileSync(decodedOffsetLinksFilePath, "utf8"));
  const recordReports = fieldRecordFilePaths.map((filePath) => {
    const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      filePath,
      assetId: inferAssetIdFromPath(filePath),
      report,
    };
  });
  const assetRecords = new Map(recordReports.map((entry) => [String(entry.assetId), entry]));
  const selectorRows = (offsetLinks.linkedFields ?? [])
    .flatMap((field) => (field.offsetLinks ?? []).map((link) => compareSelectorBoundaryRow(field, link, assetRecords)));
  const metadataRows = (offsetLinks.linkedMetadata ?? [])
    .flatMap((field) => (field.offsetLinks ?? []).map((link) => compareMetadataBoundaryRow(field, link, assetRecords)));
  const boundaryGroups = summarizeHashSuffixBoundaryGroups(selectorRows, metadataRows);
  const assessment = assessHashSuffixRecordBoundaryComparison({ selectorRows, metadataRows, boundaryGroups });
  return {
    comparedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-record-boundary-comparison-v1",
    source: {
      hashSuffixDecodedOffsetLinks: decodedOffsetLinksFilePath,
      fieldRecordFiles: fieldRecordFilePaths,
      linkedAt: offsetLinks.linkedAt ?? null,
    },
    summary: {
      selectorRows: selectorRows.length,
      metadataRows: metadataRows.length,
      assetsWithRecords: recordReports.filter((entry) => entry.assetId != null).length,
      boundaryGroups: boundaryGroups.length,
      suffixRows: selectorRows.filter((row) => row.recordPlacement === "suffix-of-current-record").length + metadataRows.filter((row) => row.recordPlacement === "suffix-of-current-record").length,
      ownerProvenRows: selectorRows.filter((row) => row.fieldOwnership === "proven").length + metadataRows.filter((row) => row.fieldOwnership === "proven").length,
      assessment,
    },
    boundaryGroups,
    selectorRows,
    metadataRows,
  };
}

function inferAssetIdFromPath(filePath) {
  const match = String(filePath).match(/source-asset-(\d+)/i);
  return match ? Number(match[1]) : null;
}

function compareSelectorBoundaryRow(field, link, assetRecords) {
  const recordsEntry = assetRecords.get(String(link.assetId));
  const selectorPlacement = recordsEntry ? findRecordContainingOffset(recordsEntry.report, link.selectorOffset) : null;
  const metadataPlacement = recordsEntry ? findRecordContainingOffset(recordsEntry.report, link.metadataOffset) : null;
  const sameRecord = selectorPlacement?.record?.offset != null && selectorPlacement.record.offset === metadataPlacement?.record?.offset;
  const primaryPlacement = selectorPlacement ?? metadataPlacement;
  return {
    fieldId: field.fieldId,
    selector: field.selector,
    assetId: link.assetId,
    targetStrings: link.targetStrings ?? [],
    linkClass: link.linkClass,
    selectorOffset: link.selectorOffset,
    metadataOffset: link.metadataOffset,
    distance: link.distance,
    recordPlacement: sameRecord ? selectorPlacement.placement : primaryPlacement?.placement ?? "not-in-record-report",
    sameRecord,
    fieldOwnership: "not-proven",
    boundarySignature: buildBoundarySignature({ selectorPlacement, metadataPlacement, link }),
    suffixTokenSignature: buildSuffixTokenSignature(primaryPlacement?.record),
    selectorRecord: summarizeRecordPlacement(selectorPlacement),
    metadataRecord: summarizeRecordPlacement(metadataPlacement),
    promotionReady: false,
    blockers: inferBoundaryComparisonBlockers({ sameRecord, primaryPlacement, link }),
    finding: sameRecord && selectorPlacement.placement === "suffix-of-current-record"
      ? "Le selecteur et la metadata partagent un suffixe record local, mais la borne/header du champ n'est pas stablement prouvee."
      : primaryPlacement?.placement === "suffix-of-current-record"
        ? "Le selecteur est dans un suffixe record, mais la metadata ou la scale n'est pas dans le meme champ."
        : "Aucune borne record comparable ne stabilise ce lien.",
  };
}

function compareMetadataBoundaryRow(field, link, assetRecords) {
  const recordsEntry = assetRecords.get(String(link.assetId));
  const placement = recordsEntry ? findRecordContainingOffset(recordsEntry.report, link.metadataOffset) : null;
  return {
    fieldId: field.fieldId,
    metadataId: field.metadataId,
    assetId: link.assetId,
    targetStrings: link.targetStrings ?? [],
    metadataOffset: link.metadataOffset,
    previousId: link.previousId,
    scale: link.scale,
    recordPlacement: placement?.placement ?? "not-in-record-report",
    fieldOwnership: "not-proven",
    boundarySignature: buildBoundarySignature({ metadataPlacement: placement, link }),
    suffixTokenSignature: buildSuffixTokenSignature(placement?.record),
    metadataRecord: summarizeRecordPlacement(placement),
    promotionReady: false,
    blockers: ["metadata-shared-by-multiple-selectors", "field-level-parser-required", "record-field-ownership-not-proven"],
    finding: placement
      ? "La metadata est comparable dans un record local, mais elle reste partagee et non proprietaire."
      : "La metadata n'est pas localisee dans le rapport record de cet asset.",
  };
}

function buildBoundarySignature({ selectorPlacement = null, metadataPlacement = null, link }) {
  const selectorPart = selectorPlacement
    ? `selector:${selectorPlacement.placement}:record-delta:${Number(link.selectorOffset) - Number(selectorPlacement.record.endOffset)}`
    : "selector:not-localized";
  const metadataPart = metadataPlacement
    ? `metadata:${metadataPlacement.placement}:record-delta:${Number(link.metadataOffset) - Number(metadataPlacement.record.endOffset)}`
    : "metadata:not-localized";
  return `${selectorPart}|${metadataPart}|distance:${link.distance ?? "none"}|class:${link.linkClass}`;
}

function buildSuffixTokenSignature(record) {
  if (!record) return "no-record";
  return (record.suffixTokens ?? [])
    .map((token) => {
      if (token.kind === "float-constant") return `f:${token.value}`;
      if (token.kind === "reference-or-field") return `ref:${token.value}`;
      if (token.kind === "operator") return `op:${token.name}`;
      if (token.kind === "raw-word") return classifyRawWordToken(token);
      return token.kind;
    })
    .join("|") || "empty-suffix";
}

function classifyRawWordToken(token) {
  if (token.u32 === 0) return "raw:zero";
  if (token.u32 === 4294967295) return "raw:minus-one";
  if (token.u32 > 100000) return "raw:asset-like";
  if (token.u32 > 10000) return "raw:metadata-like";
  return "raw:small";
}

function inferBoundaryComparisonBlockers({ sameRecord, primaryPlacement, link }) {
  const blockers = ["field-level-parser-required", "record-field-ownership-not-proven"];
  if (!sameRecord && link.metadataOffset != null) blockers.push("record-boundary-not-shared");
  if (primaryPlacement?.placement !== "suffix-of-current-record") blockers.push("record-placement-not-suffix");
  if (link.linkClass === "selector-offset-without-local-scale") blockers.push("scale-source-not-local");
  if (link.linkClass === "compact-selector-metadata-offset-link") blockers.push("layout-variant-split-required");
  return Array.from(new Set(blockers));
}

function summarizeHashSuffixBoundaryGroups(selectorRows, metadataRows) {
  const groups = new Map();
  for (const row of [...selectorRows, ...metadataRows]) {
    const key = row.boundarySignature ?? "unknown";
    if (!groups.has(key)) {
      groups.set(key, {
        boundarySignature: key,
        rows: [],
        placements: new Map(),
        suffixSignatures: new Map(),
      });
    }
    const group = groups.get(key);
    group.rows.push({
      fieldId: row.fieldId,
      assetId: row.assetId,
      targetStrings: row.targetStrings,
      recordPlacement: row.recordPlacement,
    });
    group.placements.set(row.recordPlacement, (group.placements.get(row.recordPlacement) ?? 0) + 1);
    group.suffixSignatures.set(row.suffixTokenSignature, (group.suffixSignatures.get(row.suffixTokenSignature) ?? 0) + 1);
  }
  return Array.from(groups.values()).map((group) => ({
    boundarySignature: group.boundarySignature,
    rowCount: group.rows.length,
    placements: Array.from(group.placements.entries()).map(([placement, count]) => ({ placement, count })).sort((a, b) => b.count - a.count || a.placement.localeCompare(b.placement)),
    suffixSignatures: Array.from(group.suffixSignatures.entries()).map(([signature, count]) => ({ signature, count })).sort((a, b) => b.count - a.count || a.signature.localeCompare(b.signature)),
    rows: group.rows,
    promotionReady: false,
  })).sort((a, b) => b.rowCount - a.rowCount || a.boundarySignature.localeCompare(b.boundarySignature));
}

function assessHashSuffixRecordBoundaryComparison({ selectorRows, metadataRows, boundaryGroups }) {
  const suffixRows = [...selectorRows, ...metadataRows].filter((row) => row.recordPlacement === "suffix-of-current-record");
  const repeatedBoundaryGroups = boundaryGroups.filter((group) => group.rowCount > 1);
  const compactSuffixRows = selectorRows.filter((row) => row.linkClass === "compact-selector-metadata-offset-link" && row.recordPlacement === "suffix-of-current-record");
  return {
    kind: repeatedBoundaryGroups.length
      ? "hash-suffix-record-boundaries-repeat-but-not-owned"
      : "hash-suffix-record-boundaries-local-only-blocked",
    confidence: suffixRows.length ? "medium" : "medium-low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les bornes de suffixe sont comparables entre assets, mais aucun header ou longueur de champ stable ne prouve encore l'ownership DPS.",
    nextAction: "Inspecter les octets precedant les suffixes localises pour chercher un header/length stable de champ.",
    evidence: {
      selectorRows: selectorRows.length,
      metadataRows: metadataRows.length,
      suffixRows: suffixRows.length,
      compactSuffixRows: compactSuffixRows.length,
      repeatedBoundaryGroups: repeatedBoundaryGroups.length,
    },
  };
}

function inspectHashSuffixBoundaryPreludes({ boundaryComparisonFilePath, dataDir, readBytes = 32 }) {
  const comparison = JSON.parse(fs.readFileSync(boundaryComparisonFilePath, "utf8"));
  const suffixRows = (comparison.selectorRows ?? []).filter((row) => row.recordPlacement === "suffix-of-current-record" && Number.isFinite(row.selectorOffset));
  const windows = suffixRows.map((row) => inspectHashSuffixPreludeWindow(row, dataDir, readBytes));
  const groups = summarizeHashSuffixPreludeGroups(windows);
  const assessment = assessHashSuffixPreludeInspection(windows, groups);
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "hash-suffix-boundary-prelude-inspection-v1",
    source: {
      hashSuffixRecordBoundaryComparison: boundaryComparisonFilePath,
      dataDir,
      comparedAt: comparison.comparedAt ?? null,
    },
    options: {
      readBytes,
    },
    summary: {
      windows: windows.length,
      readableWindows: windows.filter((window) => window.status === "read").length,
      groups: groups.length,
      repeatedPreludeGroups: groups.filter((group) => group.windowCount > 1).length,
      assessment,
    },
    groups,
    windows,
  };
}

function inspectHashSuffixPreludeWindow(row, dataDir, readBytes) {
  const decodedPath = findDecodedPayloadForAsset(dataDir, row.assetId);
  if (!decodedPath) {
    return {
      assetId: row.assetId,
      fieldId: row.fieldId,
      status: "missing-payload",
      finding: "Payload decode introuvable pour cet asset.",
    };
  }
  const buffer = fs.readFileSync(decodedPath);
  const recordEnd = row.selectorRecord?.recordEndOffset ?? null;
  const selectorOffset = row.selectorOffset;
  const windowStart = Math.max(0, Math.min(recordEnd ?? selectorOffset, selectorOffset) - readBytes);
  const windowEnd = Math.min(buffer.length, selectorOffset + 24);
  const bytes = buffer.subarray(windowStart, windowEnd);
  const words = readWordsAround(buffer, windowStart, windowEnd).map((word) => ({
    ...word,
    role: classifyPreludeWordRole(word, { recordEnd, selectorOffset, metadataOffset: row.metadataOffset }),
  }));
  const betweenWords = words.filter((word) => recordEnd != null && word.offset > recordEnd && word.offset < selectorOffset);
  const preSelectorWords = words.filter((word) => word.offset >= selectorOffset - 16 && word.offset < selectorOffset);
  return {
    assetId: row.assetId,
    fieldId: row.fieldId,
    linkClass: row.linkClass,
    targetStrings: row.targetStrings ?? [],
    recordValue: row.selectorRecord?.recordValue ?? null,
    decodedPath,
    status: "read",
    recordEndOffset: recordEnd,
    selectorOffset,
    metadataOffset: row.metadataOffset ?? null,
    selectorDeltaFromRecordEnd: recordEnd != null ? selectorOffset - recordEnd : null,
    metadataDeltaFromRecordEnd: recordEnd != null && row.metadataOffset != null ? row.metadataOffset - recordEnd : null,
    windowStart,
    windowEnd,
    hex: bytes.toString("hex"),
    preludeSignature: buildPreludeSignature({ words, recordEnd, selectorOffset }),
    betweenRecordAndSelectorSignature: betweenWords.map((word) => wordRoleSignature(word)).join("|") || "empty-between",
    preSelectorSignature: preSelectorWords.map((word) => wordRoleSignature(word)).join("|") || "empty-pre-selector",
    words,
    finding: "Fenetre de preambule lue autour de la borne record/suffixe.",
  };
}

function findDecodedPayloadForAsset(dataDir, assetId) {
  const root = path.resolve(dataDir);
  const stack = [root];
  const assetPattern = new RegExp(`source-asset-${assetId}.*payload`, "i");
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (assetPattern.test(full) || !/node_modules|\.git/i.test(full)) stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".decoded.bin") && assetPattern.test(full)) {
        return full;
      }
    }
  }
  return null;
}

function classifyPreludeWordRole(word, { recordEnd, selectorOffset, metadataOffset }) {
  if (recordEnd != null && word.offset <= recordEnd && word.offset + 3 >= recordEnd) return "record-end-overlap";
  if (word.offset === selectorOffset) return "selector";
  if (metadataOffset != null && word.offset === metadataOffset) return "metadata";
  if (recordEnd != null && word.offset > recordEnd && word.offset < selectorOffset) return "between-record-and-selector";
  if (word.offset < selectorOffset) return "pre-selector";
  return "post-selector";
}

function buildPreludeSignature({ words, recordEnd, selectorOffset }) {
  return words
    .filter((word) => recordEnd == null || (word.offset > recordEnd - 4 && word.offset <= selectorOffset + 16))
    .map((word) => wordRoleSignature(word))
    .join("|") || "empty";
}

function wordRoleSignature(word) {
  return `${word.role}:${classifyPreludeWordValue(word)}`;
}

function classifyPreludeWordValue(word) {
  if (word.uint32 === 0) return "zero";
  if (word.uint32 === 1) return "one";
  if (word.uint32 === 4294967295) return "minus-one";
  if (word.uint32 > 100000) return "asset-like";
  if (word.uint32 > 10000) return "metadata-like";
  if (word.uint32 < 2048) return `small:${word.uint32}`;
  return "raw";
}

function summarizeHashSuffixPreludeGroups(windows) {
  const groups = new Map();
  for (const window of windows.filter((row) => row.status === "read")) {
    const key = `${window.selectorDeltaFromRecordEnd}|${window.betweenRecordAndSelectorSignature}|${window.preSelectorSignature}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        selectorDeltaFromRecordEnd: window.selectorDeltaFromRecordEnd,
        betweenRecordAndSelectorSignature: window.betweenRecordAndSelectorSignature,
        preSelectorSignature: window.preSelectorSignature,
        windows: [],
      });
    }
    groups.get(key).windows.push({
      assetId: window.assetId,
      fieldId: window.fieldId,
      linkClass: window.linkClass,
      recordValue: window.recordValue,
    });
  }
  return Array.from(groups.values()).map((group) => ({
    key: group.key,
    selectorDeltaFromRecordEnd: group.selectorDeltaFromRecordEnd,
    betweenRecordAndSelectorSignature: group.betweenRecordAndSelectorSignature,
    preSelectorSignature: group.preSelectorSignature,
    windowCount: group.windows.length,
    windows: group.windows,
    promotionReady: false,
  })).sort((a, b) => b.windowCount - a.windowCount || String(a.key).localeCompare(String(b.key)));
}

function assessHashSuffixPreludeInspection(windows, groups) {
  const readable = windows.filter((window) => window.status === "read");
  const repeatedGroups = groups.filter((group) => group.windowCount > 1);
  const repeatedSelector994 = repeatedGroups.some((group) => group.windows.some((window) => window.fieldId === "selector:994"));
  return {
    kind: repeatedGroups.length
      ? "hash-suffix-boundary-preludes-repeat-without-ownership"
      : "hash-suffix-boundary-preludes-local-only",
    confidence: repeatedSelector994 ? "medium" : readable.length ? "medium-low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: "Les preludes de suffixe montrent des repetitions locales, mais aucun header/length de champ promouvable n'est encore prouve.",
    nextAction: "Comparer les mots de prelude avec les transitions header-patterns pour nommer le champ ou elargir l'echantillon.",
    evidence: {
      windows: windows.length,
      readableWindows: readable.length,
      repeatedGroups: repeatedGroups.length,
    },
  };
}

function summarizeBonusPercentSampleCoverage({ graphsFilePath, payloadPlanFilePath, binaryContextComparisonFilePath }) {
  const graphs = JSON.parse(fs.readFileSync(graphsFilePath, "utf8"));
  const payloadPlan = JSON.parse(fs.readFileSync(payloadPlanFilePath, "utf8"));
  const comparison = JSON.parse(fs.readFileSync(binaryContextComparisonFilePath, "utf8"));
  const percentRefs = (graphs.summary?.hashRefs ?? [])
    .filter((ref) => /Percent_Per_Power|Power_Duration_Bonus_Pct/i.test(ref))
    .map((ref) => ({
      ref,
      family: classifyPercentPerPowerRef(ref),
      classHint: inferClassHintFromRef(ref),
    }));
  const planRows = (payloadPlan.candidates ?? []).map((candidate) => ({
    assetId: candidate.assetId,
    decodedAvailable: Boolean(candidate.decodedAvailable),
    recommendation: candidate.recommendation,
    exactTargets: candidate.exactTargets ?? [],
    bonusTargets: candidate.bonusTargets ?? [],
    targetBonusHits: candidate.targetBonusHits ?? [],
    percentTargets: (candidate.targets ?? []).filter((target) => /Percent_Per_Power|Power_Duration_Bonus_Pct/i.test(target)),
  }));
  const bonusPercentRefs = percentRefs.filter((item) => item.family === "bonus-percent-per-power");
  const comparedBonusTargets = (comparison.assetGroups ?? []).flatMap((group) =>
    (group.targetStrings ?? []).map((target) => ({
      assetId: group.assetId,
      target,
      immediateSelectorMetadataTriplet: Boolean(group.relation?.immediateSelectorMetadataTriplet),
      finding: group.relation?.finding ?? null,
    }))
  );
  const decodedPercentAssets = planRows.filter((row) => row.decodedAvailable && row.percentTargets.length > 0);
  const needsDecodePercentAssets = planRows.filter((row) => !row.decodedAvailable && row.percentTargets.length > 0);
  const assessment = assessBonusPercentSampleCoverage({
    percentRefs,
    bonusPercentRefs,
    comparedBonusTargets,
    decodedPercentAssets,
    needsDecodePercentAssets,
    comparisonAssessment: comparison.summary?.assessment ?? null,
  });
  return {
    summarizedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "bonus-percent-sample-coverage-v1",
    source: {
      formulaGraphs: graphsFilePath,
      recordHeaderPayloadPlan: payloadPlanFilePath,
      hashSuffixBinaryContextComparison: binaryContextComparisonFilePath,
    },
    summary: {
      percentRefs: percentRefs.length,
      bonusPercentRefs: bonusPercentRefs.length,
      decodedPercentAssets: decodedPercentAssets.length,
      needsDecodePercentAssets: needsDecodePercentAssets.length,
      comparedBonusTargets: comparedBonusTargets.length,
      assessment,
    },
    percentRefs,
    comparedBonusTargets,
    decodedPercentAssets,
    needsDecodePercentAssets,
  };
}

function classifyPercentPerPowerRef(ref) {
  if (/^Bonus_Percent_Per_Power/i.test(ref) || /\+\s*Bonus_Percent_Per_Power/i.test(ref)) return "bonus-percent-per-power";
  if (/CC_Duration_Bonus_Percent_Per_Power/i.test(ref)) return "cc-duration-bonus-percent-per-power";
  if (/Chance_For_Double_Damage_Per_Power/i.test(ref)) return "chance-double-damage-per-power";
  if (/Power_Duration_Bonus_Pct/i.test(ref)) return "power-duration-bonus-pct";
  return "other-percent-per-power";
}

function inferClassHintFromRef(ref) {
  const match = String(ref).match(/#([A-Za-z]+)_/);
  return match ? match[1].toLowerCase() : null;
}

function assessBonusPercentSampleCoverage({ percentRefs, bonusPercentRefs, comparedBonusTargets, decodedPercentAssets, needsDecodePercentAssets, comparisonAssessment }) {
  const divergent = comparisonAssessment?.kind === "binary-context-selector-repeats-but-layout-diverges";
  return {
    kind: divergent && comparedBonusTargets.length >= bonusPercentRefs.length
      ? "local-bonus-percent-sample-covered-but-layout-diverges"
      : comparedBonusTargets.length < bonusPercentRefs.length
        ? "local-bonus-percent-sample-incomplete"
        : "bonus-percent-sample-coverage-inconclusive",
    confidence: divergent ? "medium" : "medium-low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: divergent
      ? "Les cibles Bonus_Percent_Per_Power connues localement sont couvertes, mais leur layout de suffixe diverge."
      : "La couverture locale ne suffit pas encore a stabiliser le layout Bonus_Percent_Per_Power.",
    nextAction: needsDecodePercentAssets.length
      ? "Decoder les assets percent-per-power restants puis relancer la comparaison suffixe."
      : "Elargir le scan externe pour trouver d'autres cibles Bonus_Percent_Per_Power, puis relancer l'audit binaire.",
    evidence: {
      percentRefs: percentRefs.length,
      bonusPercentRefs: bonusPercentRefs.length,
      comparedBonusTargets: comparedBonusTargets.length,
      decodedPercentAssets: decodedPercentAssets.length,
      needsDecodePercentAssets: needsDecodePercentAssets.length,
      comparisonKind: comparisonAssessment?.kind ?? null,
    },
  };
}

function summarizeSelectorFamilyEvidence(group, anchors) {
  const selector = group.key.replace(/^selector:/, "");
  const matching = anchors.filter((anchor) => anchor.selector?.normalizedKey === group.key);
  const families = group.families ?? [];
  const dominantFamily = families[0] ?? null;
  const metadataIds = Array.from(new Set(matching.flatMap((anchor) => anchor.metadataCandidates?.[0]?.id ?? []))).sort((a, b) => Number(a) - Number(b));
  const allSameFamily = dominantFamily && families.length === 1 && group.occurrences >= 2;
  const score = (group.occurrences >= 2 ? 2 : 0)
    + (group.assetCount >= 2 ? 2 : 0)
    + (allSameFamily ? 3 : 0)
    + (metadataIds.length ? 1 : 0);
  return {
    selector,
    occurrences: group.occurrences,
    assetCount: group.assetCount,
    dominantFamily: dominantFamily?.family ?? null,
    families,
    metadataIds,
    hypothesis: allSameFamily
      ? `selector ${selector} candidat pour la famille ${dominantFamily.family}`
      : `selector ${selector} observe mais famille encore insuffisamment stable`,
    confidence: score >= 6 ? "medium-low" : score >= 3 ? "low" : "very-low",
    promotionReady: false,
    score,
    examples: group.examples,
  };
}

function summarizeMetadataFamilyEvidence(group, anchors) {
  const matching = anchors.filter((anchor) => String(anchor.metadataCandidates?.[0]?.id) === group.key);
  const floats = Array.from(new Set(matching.map((anchor) => anchor.metadataCandidates?.[0]?.float).filter((value) => value !== undefined))).sort((a, b) => Number(a) - Number(b));
  const selectors = Array.from(new Set(matching.map((anchor) => anchor.selector?.normalized).filter((value) => value !== undefined))).sort((a, b) => Number(a) - Number(b));
  const score = (group.occurrences >= 2 ? 2 : 0) + (group.assetCount >= 2 ? 2 : 0) + (floats.length === 1 ? 1 : 0);
  return {
    metadataId: group.key,
    occurrences: group.occurrences,
    assetCount: group.assetCount,
    families: group.families ?? [],
    floats,
    selectors,
    hypothesis: group.occurrences >= 2
      ? `metadata ${group.key} repetee avec float ${floats.join(", ")}`
      : `metadata ${group.key} observee localement`,
    confidence: score >= 5 ? "low" : score >= 3 ? "low" : "very-low",
    promotionReady: false,
    score,
    examples: group.examples,
  };
}

function assessHashSuffixFamilyEvidence(selectorEvidence, metadataEvidence) {
  const selector949 = selectorEvidence.find((entry) => entry.selector === "949");
  const metadata12337 = metadataEvidence.find((entry) => entry.metadataId === "12337");
  const hasSelectorFamily = selector949?.dominantFamily === "bonus-percent-per-power" && selector949.occurrences >= 2;
  const hasMetadataRepeat = (metadata12337?.occurrences ?? 0) >= 2 && (metadata12337?.floats ?? []).includes(10);
  return {
    kind: hasSelectorFamily && hasMetadataRepeat
      ? "selector-family-and-metadata-repeat-found"
      : hasSelectorFamily
        ? "selector-family-repeat-found"
        : hasMetadataRepeat
          ? "metadata-repeat-found"
          : "hash-suffix-family-evidence-inconclusive",
    confidence: hasSelectorFamily && hasMetadataRepeat ? "medium-low" : hasSelectorFamily || hasMetadataRepeat ? "low" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: hasSelectorFamily && hasMetadataRepeat
      ? "Le selecteur 949 se repete sur la famille Bonus_Percent_Per_Power et la metadata 12337/10 se repete, mais aucun libelle externe ne nomme encore ces ids."
      : "Les indices de famille restent insuffisants pour nommer les ids de suffixe.",
    nextAction: "Trouver une source nommee pour le selecteur 949 ou verifier davantage de Bonus_Percent_Per_Power avant toute promotion DPS.",
    evidence: {
      selector949,
      metadata12337,
    },
  };
}

function summarizeFocusedLayoutFamily(kind, transitions) {
  const assetIds = Array.from(new Set(transitions.map((transition) => transition.assetId).filter(Boolean)));
  const sequences = transitions.map((transition) => transition.layout.map((token) => token.role));
  const commonOrderedRoles = sequences.length ? sequences.reduce((common, sequence) => longestCommonRoleSubsequence(common, sequence)) : [];
  const maxLength = Math.max(0, ...sequences.map((sequence) => sequence.length));
  const commonPositions = [];
  for (let index = 0; index < maxLength; index += 1) {
    const roles = sequences.map((sequence) => sequence[index] ?? "missing");
    const roleCounts = countBy(roles, (role) => role);
    const entries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    commonPositions.push({
      index,
      dominantRole: entries[0]?.[0] ?? "missing",
      count: entries[0]?.[1] ?? 0,
      coverage: Number(((entries[0]?.[1] ?? 0) / Math.max(1, sequences.length)).toFixed(4)),
      stable: (entries[0]?.[1] ?? 0) === sequences.length,
      roles: entries.map(([role, count]) => ({ role, count })),
    });
  }
  return {
    kind,
    transitions: transitions.length,
    reportCount: assetIds.length,
    assetIds,
    commonOrderedRoles,
    commonPositions,
    examples: transitions.map((transition) => ({
      assetId: transition.assetId,
      from: transition.from?.value ?? null,
      to: transition.to?.value ?? null,
      byteLength: transition.byteLength,
      signature: transition.signature,
      roles: transition.layout.map((token) => token.role),
      tokenSummary: transition.tokenSummary,
    })),
  };
}

function longestCommonRoleSubsequence(left, right) {
  const dp = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      result.push(left[i]);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return result;
}

function assessFormulaHashLayoutFocus(formulaHash, hashAsset) {
  const formulaRoles = formulaHash?.commonOrderedRoles ?? [];
  const hashRoles = hashAsset?.commonOrderedRoles ?? [];
  const hasFormulaOpcodeAnchor = orderedContains(formulaRoles, ["one", "op:add", "op:multiply"]);
  const hasHashAssetAnchor = orderedContains(hashRoles, ["ref:0", "raw", "asset-id-raw"]);
  return {
    kind: hasFormulaOpcodeAnchor && hasHashAssetAnchor
      ? "formula-hash-and-hash-asset-anchors-found"
      : "formula-hash-anchors-incomplete",
    confidence: hasFormulaOpcodeAnchor && hasHashAssetAnchor ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: hasFormulaOpcodeAnchor && hasHashAssetAnchor
      ? "Les transitions formule->hash partagent un noyau opcode commun, et les suffixes hash->asset partagent un ancrage ref/raw/asset-id. Cela renforce le layout structurel sans prouver l'ownership de SF_32."
      : "Les transitions disponibles ne donnent pas encore assez d'ancres communes pour isoler le champ.",
    nextAction: hasFormulaOpcodeAnchor
      ? "Parser les champs autour du noyau one/add/multiply et comparer le suffixe hash adjacent pour distinguer bytecode de formule et metadata du hash."
      : "Ajouter d'autres transitions formule->hash validees avant d'isoler les champs.",
    evidence: {
      formulaToHashReports: formulaHash?.reportCount ?? 0,
      hashToAssetReports: hashAsset?.reportCount ?? 0,
      formulaCommonOrderedRoles: formulaRoles,
      hashAssetCommonOrderedRoles: hashRoles,
      hasFormulaOpcodeAnchor,
      hasHashAssetAnchor,
    },
  };
}

function orderedContains(sequence, needle) {
  let cursor = 0;
  for (const role of sequence) {
    if (role === needle[cursor]) cursor += 1;
    if (cursor === needle.length) return true;
  }
  return false;
}

function normalizeHeaderTransitionLayout(transition, assetId) {
  const tokens = transition.tokens ?? [];
  return tokens.map((token, index) => {
    const normalized = {
      index,
      kind: token.kind,
      role: token.kind,
      opcode: token.opcode ?? null,
    };
    if (token.kind === "reference-or-field") {
      normalized.role = token.value === assetId ? "asset-id-ref" : `ref:${token.value}`;
      normalized.valueClass = token.value === assetId ? "asset-id" : "reference";
    } else if (token.kind === "raw-word") {
      normalized.role = token.u32 === assetId ? "asset-id-raw" : classifyRawWordForLayout(token.u32);
      normalized.valueClass = token.u32 === assetId ? "asset-id" : normalized.role;
    } else if (token.kind === "float-constant") {
      normalized.role = "float";
      normalized.valueClass = "float";
    } else if (token.kind === "operator") {
      normalized.role = `op:${token.name}`;
      normalized.valueClass = "operator";
    }
    return normalized;
  });
}

function classifyRawWordForLayout(value) {
  if (value === 0) return "zero";
  if (value === 1) return "one";
  if (value === 0xffffffff) return "minus-one";
  if (value >= 1000 && value <= 13000) return "small-table-or-string-id";
  if (value > 1000000 && value < 4000000) return "asset-like-id";
  return "raw";
}

function summarizeNormalizedLayoutFamily(kind, transitions) {
  const assetIds = Array.from(new Set(transitions.map((transition) => transition.assetId).filter(Boolean)));
  const roleSequences = Object.entries(countBy(transitions, (transition) => transition.layout.map((token) => token.role).join("|") || "empty"))
    .map(([layout, count]) => ({ layout, count }))
    .sort((a, b) => b.count - a.count || a.layout.localeCompare(b.layout));
  const maxLength = Math.max(0, ...transitions.map((transition) => transition.layout.length));
  const stablePositions = [];
  for (let index = 0; index < maxLength; index += 1) {
    const roles = transitions.map((transition) => transition.layout[index]?.role ?? "missing");
    const roleCounts = countBy(roles, (role) => role);
    const entries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    stablePositions.push({
      index,
      dominantRole: entries[0]?.[0] ?? "missing",
      count: entries[0]?.[1] ?? 0,
      coverage: Number(((entries[0]?.[1] ?? 0) / transitions.length).toFixed(4)),
      roles: entries.map(([role, count]) => ({ role, count })),
    });
  }
  return {
    kind,
    transitions: transitions.length,
    reportCount: assetIds.length,
    assetIds,
    roleSequences: roleSequences.slice(0, 12),
    stablePositions,
    examples: transitions.slice(0, 8).map((transition) => ({
      assetId: transition.assetId,
      from: transition.from?.value ?? null,
      to: transition.to?.value ?? null,
      byteLength: transition.byteLength,
      layout: transition.layout.map((token) => token.role).join("|") || "empty",
    })),
  };
}

function assessNormalizedLayouts({ byKind, hashFamily, formulaHashFamily }) {
  const hashAssetStable = hashFamily?.stablePositions?.some((position) => position.dominantRole === "asset-id-raw" && position.coverage >= 0.75) ?? false;
  const hashAssetReports = hashFamily?.reportCount ?? 0;
  const formulaHashReports = formulaHashFamily?.reportCount ?? 0;
  return {
    kind: hashAssetStable
      ? "normalized-hash-asset-layout-repeats"
      : "normalized-layouts-not-yet-stable",
    confidence: hashAssetStable ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: hashAssetStable
      ? "Le layout normalise du suffixe hash contient une position asset-id stable sur plusieurs payloads, mais cela ne prouve pas encore le champ SF_32."
      : "Les layouts normalises ne montrent pas encore de position stable suffisante pour attribuer le champ.",
    nextAction: formulaHashReports > 1
      ? "Comparer le layout normalise des transitions formule->hash avec le suffixe hash->asset pour isoler le champ bonus."
      : "Trouver ou decoder d'autres transitions formule->hash, car ce motif reste insuffisamment represente.",
    evidence: {
      families: byKind.length,
      hashToAssetReports: hashAssetReports,
      formulaToHashReports: formulaHashReports,
      hashAssetStable,
    },
  };
}

function planRecordHeaderPayloads(searchFilePath, options = {}) {
  const search = JSON.parse(fs.readFileSync(searchFilePath, "utf8"));
  const matches = search.matches ?? search.mergedMatches ?? search.summary?.topMatches ?? [];
  const knownDecoded = findDecodedPayloads(path.resolve(process.cwd(), "outputs"));
  const candidates = matches.map((match) => {
    const source = match.source ?? {};
    const assetId = Number(match.assetId ?? source.assetId);
    const fileName = match.fileName ?? source.fileName ?? null;
    const blteOffset = Number(match.blteOffset ?? source.blteOffset);
    const targets = collectMatchTargets(match);
    const formulaTargets = targets.filter(isFormulaTarget);
    const hashTargets = targets.filter(isHashTarget);
    const bonusTargets = targets.filter((target) => /Bonus_|Affix_|Chance_|Power_Duration|Duration_Bonus/i.test(target));
    const spiritbornTargets = targets.filter((target) => /Spiritborn/i.test(target));
    const targetBonusHits = targets.filter((target) => /Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate/i.test(target));
    const exactTargets = (match.targetHits ?? []).filter((hit) => hit.exact).map((hit) => hit.sourceKey ?? hit.target).filter(Boolean);
    const decodedPayload = findBestDecodedPayload(knownDecoded, { assetId, fileName, sourceOffset: blteOffset });
    const decodedContent = validateDecodedPayloadContent(decodedPayload, targets);
    const decodedPath = decodedContent.usable ? decodedPayload?.path ?? null : null;
    const score = Number(match.score ?? 0)
      + formulaTargets.length * 12
      + hashTargets.length * 10
      + bonusTargets.length * 8
      + spiritbornTargets.length * 12
      + targetBonusHits.length * 30
      + exactTargets.length * 6
      + (decodedPath ? 20 : 0)
      - (assetId === 1663210 ? 10 : 0);
    const command = fileName && Number.isFinite(blteOffset)
      ? `node work/diablo4-data-exporter/d4export.js decode-blte --file "<game-data-dir>/${fileName}" --offset ${blteOffset} --out outputs/diablo4-source-asset-${assetId}-payload`
      : null;
    return {
      assetId,
      fileName,
      blteOffset: Number.isFinite(blteOffset) ? blteOffset : null,
      sourceScore: Number(match.score ?? 0),
      priorityScore: score,
      decodedAvailable: Boolean(decodedPath),
      decodedPath,
      decodedProbe: decodedContent,
      formulaTargets,
      hashTargets,
      bonusTargets,
      spiritbornTargets,
      targetBonusHits,
      exactTargets,
      targets: Array.from(new Set(targets)).slice(0, 30),
      recommendation: recommendHeaderPayloadCandidate({ assetId, decodedPath, formulaTargets, hashTargets, bonusTargets }),
      commands: {
        decode: command,
        compare: decodedPath
          ? `node work/diablo4-data-exporter/d4export.js compare-record-header-patterns --file ${toCliPath(decodedPath)} --asset-ids ${assetId} --out outputs/diablo4-source-asset-${assetId}-header-patterns`
          : null,
      },
    };
  })
    .filter((candidate) => candidate.assetId && candidate.fileName && candidate.blteOffset !== null)
    .filter((candidate) => candidate.formulaTargets.length || candidate.hashTargets.length || candidate.bonusTargets.length)
    .sort((a, b) => b.priorityScore - a.priorityScore || b.sourceScore - a.sourceScore || a.assetId - b.assetId);
  const top = dedupeBy(candidates, (candidate) => `${candidate.assetId}:${candidate.fileName}:${candidate.blteOffset}`).slice(0, options.limit ?? 20);
  const alreadyDecoded = top.filter((candidate) => candidate.decodedAvailable);
  const needsDecode = top.filter((candidate) => !candidate.decodedAvailable);

  return {
    plannedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "record-header-payload-plan-v1",
    source: {
      filePath: searchFilePath,
      matches: matches.length,
    },
    summary: {
      candidates: top.length,
      alreadyDecoded: alreadyDecoded.length,
      needsDecode: needsDecode.length,
      topAssetIds: top.slice(0, 8).map((candidate) => candidate.assetId),
      nextAssetId: needsDecode[0]?.assetId ?? alreadyDecoded[0]?.assetId ?? null,
      nextAction: needsDecode.length
        ? "Decoder les premiers payloads non disponibles, puis lancer compare-record-header-patterns sur chacun."
        : "Lancer compare-record-header-patterns sur les payloads deja disponibles.",
    },
    candidates: top,
  };
}

function collectMatchTargets(match) {
  const targets = [];
  for (const target of match.targets ?? []) targets.push(target);
  for (const hit of match.targetHits ?? []) {
    if (hit.sourceKey) targets.push(hit.sourceKey);
    if (hit.target) targets.push(hit.target);
    if (hit.value) targets.push(hit.value);
  }
  for (const item of match.nearbyStrings ?? []) {
    if (item.value) targets.push(item.value);
  }
  return Array.from(new Set(targets.filter(Boolean).map(String)));
}

function isFormulaTarget(value) {
  return /Script Formula|PowerTag\.|Table\(|SF_|Mod\./i.test(value);
}

function isHashTarget(value) {
  return /#|Bonus_|Affix_|Chance_|Power_Duration|Duration_Bonus/i.test(value);
}

function recommendHeaderPayloadCandidate({ assetId, decodedPath, formulaTargets, hashTargets, bonusTargets }) {
  if (assetId === 1663210) return "reference-already-covered";
  if (decodedPath && formulaTargets.length && hashTargets.length) return "compare-now";
  if (formulaTargets.length && hashTargets.length) return "decode-next";
  if (hashTargets.length && bonusTargets.length) return "decode-for-hash-asset-pattern";
  return "low-priority-context";
}

function mineFormulaHashCandidates(searchFilePath, options = {}) {
  const search = JSON.parse(fs.readFileSync(searchFilePath, "utf8"));
  const matches = search.matches ?? [];
  const knownDecoded = findDecodedPayloads(path.resolve(process.cwd(), "outputs"));
  const knownHeaderReports = findHeaderPatternReports(path.resolve(process.cwd(), "outputs"));
  const candidates = [];

  for (const match of matches) {
    const strings = (match.matchedStrings ?? match.nearbyStrings ?? [])
      .filter((item) => item && typeof item.value === "string" && Number.isFinite(Number(item.offset)))
      .map((item) => ({
        offset: Number(item.offset),
        value: item.value,
        kind: classifyDecodedStringValue(item.value),
      }))
      .sort((a, b) => a.offset - b.offset);
    const assetId = Number(match.assetId ?? match.source?.assetId);
    const fileName = match.fileName ?? match.source?.fileName ?? null;
    const sourceOffset = Number(match.offset ?? match.blteOffset ?? match.source?.blteOffset);
    if (!Number.isFinite(assetId) || !fileName || !Number.isFinite(sourceOffset)) continue;

    for (let index = 0; index < strings.length - 1; index += 1) {
      const from = strings[index];
      const to = strings[index + 1];
      const gapBytes = to.offset - from.offset;
      const fromLooksFormula = isFormulaTarget(from.value) || from.kind === "formula" || from.kind === "power-tag-ref";
      const toLooksHash = isHashTarget(to.value) || to.kind === "hash-target";
      if (!fromLooksFormula || !toLooksHash) continue;
      const decodedPayload = findBestDecodedPayload(knownDecoded, { assetId, fileName, sourceOffset });
      const decodedContent = validateDecodedPayloadContent(decodedPayload, [from.value, to.value]);
      const formulaStrength = from.kind === "formula" ? 3 : from.kind === "power-tag-ref" ? 1 : 2;
      const hashStrength = to.kind === "hash-target" ? 3 : isHashTarget(to.value) ? 2 : 1;
      const localityScore = gapBytes > 0 ? Math.max(0, 160 - Math.min(gapBytes, 160)) / 8 : 0;
      const sourceScore = Number(match.score ?? 0);
      const headerValidation = validateFormulaHashCandidateWithHeaderReport(knownHeaderReports.get(assetId), { from, to });
      const score = sourceScore
        + formulaStrength * 20
        + hashStrength * 20
        + localityScore
        + (decodedContent.usable ? 30 : 0)
        + (headerValidation.kind === "validated-formula-to-hash-bytecode" ? 35 : 0)
        + (/Spiritborn|Bonus_Percent_Per_Power/i.test(`${from.value} ${to.value}`) ? 18 : 0)
        + (assetId === 1663210 ? 8 : 0);
      candidates.push({
        assetId,
        fileName,
        sourceOffset,
        decodedAvailable: decodedContent.usable,
        decodedPath: decodedContent.usable ? decodedPayload?.path ?? null : null,
        correctedDecodedOffset: decodedPayload?.blteOffset ?? null,
        decodedProbe: decodedContent,
        headerValidation,
        pairIndex: index,
        score: Number(score.toFixed(3)),
        gapBytes,
        from,
        to,
        recommendation: recommendFormulaHashCandidate({
          assetId,
          decodedPayload: decodedContent.usable ? decodedPayload : null,
          from,
          to,
          gapBytes,
        }),
        commands: {
          decode: `node work/diablo4-data-exporter/d4export.js decode-blte --file "<game-data-dir>/${fileName}" --offset ${sourceOffset} --out outputs/diablo4-source-asset-${assetId}-payload`,
          compare: decodedContent.usable && decodedPayload
            ? `node work/diablo4-data-exporter/d4export.js compare-record-header-patterns --file ${toCliPath(decodedPayload.path)} --asset-ids ${assetId} --out outputs/diablo4-source-asset-${assetId}-header-patterns`
            : null,
        },
      });
    }
  }

  const ranked = dedupeBy(
    candidates.sort((a, b) => b.score - a.score || a.gapBytes - b.gapBytes || a.assetId - b.assetId),
    (candidate) => `${candidate.assetId}:${candidate.fileName}:${candidate.sourceOffset}:${candidate.from.value}:${candidate.to.value}`
  ).slice(0, options.limit ?? 40);
  const decoded = ranked.filter((candidate) => candidate.decodedAvailable);
  const needsDecode = ranked.filter((candidate) => !candidate.decodedAvailable);
  const formulaHashLike = ranked.filter((candidate) => candidate.from.kind === "formula" && candidate.to.kind === "hash-target");
  const validatedFormulaHash = ranked.filter((candidate) => candidate.headerValidation.kind === "validated-formula-to-hash-bytecode");

  return {
    minedAt: new Date().toISOString(),
    schemaVersion: 1,
    mode: "formula-hash-candidate-mining-v1",
    source: {
      filePath: searchFilePath,
      matches: matches.length,
    },
    summary: {
      candidates: ranked.length,
      decodedAvailable: decoded.length,
      needsDecode: needsDecode.length,
      formulaHashLike: formulaHashLike.length,
      validatedFormulaHash: validatedFormulaHash.length,
      topAssetIds: ranked.slice(0, 8).map((candidate) => candidate.assetId),
      nextAssetId: needsDecode[0]?.assetId ?? decoded[0]?.assetId ?? null,
      assessment: assessFormulaHashCandidateMining(ranked),
    },
    candidates: ranked,
  };
}

function findBestDecodedPayload(knownDecoded, { assetId, fileName, sourceOffset }) {
  return knownDecoded.find((payload) => payload.fileName === fileName && payload.blteOffset === sourceOffset)
    ?? knownDecoded.find((payload) => payload.assetId === assetId && payload.fileName === fileName)
    ?? null;
}

function validateDecodedPayloadContent(decodedPayload, expectedStrings = []) {
  const expected = Array.from(new Set(expectedStrings
    .filter((value) => typeof value === "string" && value.length >= 4)
    .filter((value) => /[A-Za-z_#.]|\d/.test(value))
    .slice(0, 12)));
  if (!decodedPayload) {
    return {
      kind: "missing-decoded-payload",
      usable: false,
      checkedStrings: expected,
      foundStrings: [],
      missingStrings: expected,
      note: "Aucun payload decode connu pour cet asset/fichier.",
    };
  }
  let buffer = null;
  try {
    buffer = fs.readFileSync(decodedPayload.path);
  } catch {
    return {
      kind: "decoded-payload-unreadable",
      usable: false,
      decodedPath: decodedPayload.path,
      decodedOffset: decodedPayload.blteOffset,
      checkedStrings: expected,
      foundStrings: [],
      missingStrings: expected,
      note: "Le payload decode reference existe dans l'index local mais ne peut pas etre lu.",
    };
  }
  const foundStrings = expected.filter((value) => buffer.indexOf(Buffer.from(value, "ascii")) !== -1);
  const missingStrings = expected.filter((value) => !foundStrings.includes(value));
  const usable = expected.length === 0 || foundStrings.length > 0;
  return {
    kind: usable ? "decoded-payload-contains-expected-strings" : "decoded-payload-mismatch",
    usable,
    decodedPath: decodedPayload.path,
    decodedOffset: decodedPayload.blteOffset,
    decodedBytes: buffer.length,
    checkedStrings: expected,
    foundStrings,
    missingStrings,
    note: usable
      ? "Le payload decode contient au moins une chaine attendue."
      : "Le payload decode ne contient pas les chaines attendues; il s'agit probablement d'un BLTE voisin ou d'un offset corrige inadapte a ce rapport.",
  };
}

function findHeaderPatternReports(outputsDir) {
  const reports = new Map();
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "record-header-pattern-comparison.json") {
        try {
          const report = JSON.parse(fs.readFileSync(fullPath, "utf8"));
          const assetId = Number(report.options?.currentAssetId);
          if (Number.isFinite(assetId)) reports.set(assetId, report);
        } catch {
          // Ignore incomplete reports while mining advisory candidates.
        }
      }
    }
  }
  walk(outputsDir);
  return reports;
}

function validateFormulaHashCandidateWithHeaderReport(report, { from, to }) {
  if (!report) {
    return {
      kind: "not-compared",
      promotionReady: false,
      note: "Aucun rapport header-patterns existant pour cet asset.",
    };
  }
  const exactTransition = (report.relevantTransitions ?? []).find((transition) =>
    transition.from?.value === from.value && transition.to?.value === to.value
  );
  if (exactTransition) {
    return {
      kind: exactTransition.kind === "formula-to-hash-bytecode"
        ? "validated-formula-to-hash-bytecode"
        : "seen-but-not-formula-to-hash-bytecode",
      transitionKind: exactTransition.kind,
      signature: exactTransition.signature,
      promotionReady: false,
      note: exactTransition.kind === "formula-to-hash-bytecode"
        ? "Le rapport header-patterns confirme une transition formule->hash avec bytecode."
        : "Le couple est visible dans les headers, mais n'est pas classe comme formule->hash bytecode.",
    };
  }
  return {
    kind: "not-seen-in-header-report",
    promotionReady: false,
    note: "Le couple visible dans les chaines n'apparait pas comme transition comparable dans le rapport header-patterns existant.",
  };
}

function recommendFormulaHashCandidate({ assetId, decodedPayload, from, to, gapBytes }) {
  if (assetId === 1663210) return "reference-formula-hash";
  if (decodedPayload && from.kind === "formula" && to.kind === "hash-target" && gapBytes <= 200) return "compare-now-strong-formula-hash";
  if (decodedPayload) return "compare-now-context";
  if (from.kind === "formula" && to.kind === "hash-target" && gapBytes <= 200) return "decode-next-strong-formula-hash";
  return "decode-later-context";
}

function assessFormulaHashCandidateMining(candidates) {
  const strong = candidates.filter((candidate) => candidate.from.kind === "formula" && candidate.to.kind === "hash-target");
  const decodedStrong = strong.filter((candidate) => candidate.decodedAvailable);
  const validated = candidates.filter((candidate) => candidate.headerValidation.kind === "validated-formula-to-hash-bytecode");
  return {
    kind: validated.length > 1
      ? "additional-header-validated-formula-hash-candidates-found"
      : strong.length > 1
        ? "string-visible-formula-hash-candidates-need-header-validation"
      : strong.length === 1
        ? "reference-formula-hash-only-plus-context"
        : "no-formula-hash-candidates-found",
    confidence: validated.length > 1 ? "medium" : strong.length > 0 ? "low" : "none",
    fieldOwnership: "not-proven",
    promotionReady: false,
    finding: validated.length > 1
      ? "Des couples formule->hash supplementaires sont valides par les rapports de headers, mais l'ownership du champ reste a prouver."
      : strong.length > 1
        ? "Des couples formule->hash supplementaires sont visibles dans les exports de chaines, mais les rapports de headers ne les valident pas encore."
      : "Le minage ne fournit pas encore assez de couples formule->hash valides pour resoudre le champ.",
    nextAction: validated.length > 1
      ? "Comparer les layouts normalises des transitions formule->hash validees."
      : decodedStrong.length
        ? "Inspecter pourquoi les couples visibles dans les chaines ne produisent pas de transitions formula-to-hash-bytecode dans les headers."
      : "Decoder les meilleurs candidats formule->hash avant de regenerer la comparaison de headers.",
    evidence: {
      candidates: candidates.length,
      strongFormulaHashCandidates: strong.length,
      decodedStrongFormulaHashCandidates: decodedStrong.length,
      headerValidatedFormulaHashCandidates: validated.length,
    },
  };
}

function findDecodedPayloads(outputsDir) {
  const found = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const match = entry.name.match(/^(data\.\d+)\.(\d+)\.decoded\.bin$/);
        if (match) {
          const assetMatch = fullPath.match(/diablo4-source-asset-(\d+)-/);
          found.push({
            path: fullPath,
            fileName: match[1],
            blteOffset: Number(match[2]),
            assetId: assetMatch ? Number(assetMatch[1]) : null,
          });
        }
      }
    }
  }
  walk(outputsDir);
  return found;
}

function toCliPath(filePath) {
  const relative = path.relative(process.cwd(), filePath);
  return relative && !relative.startsWith("..") ? relative.replace(/\\/g, "/") : filePath;
}

function classifyHeaderTransition(from, to, tokens, options = {}) {
  const currentAssetId = Number.isFinite(options.currentAssetId) ? options.currentAssetId : 1663210;
  const fromKind = classifyDecodedStringValue(from.value);
  const toKind = classifyDecodedStringValue(to.value);
  const hasCurrentAsset = tokens.some((token) =>
    (token.kind === "raw-word" && token.u32 === currentAssetId) ||
    (token.kind === "reference-or-field" && token.value === currentAssetId)
  );
  const hasFormulaBytecode = tokens.some((token) => token.kind === "float-constant")
    && tokens.some((token) => token.kind === "operator");
  if (fromKind === "power-tag-ref" && toKind === "formula") return "power-tag-to-formula";
  if (fromKind === "formula" && toKind === "hash-target" && hasFormulaBytecode) return "formula-to-hash-bytecode";
  if (fromKind === "hash-target" && hasCurrentAsset) return "hash-to-current-asset";
  if (fromKind === "formula" && hasFormulaBytecode) return "formula-bytecode-tail";
  if (toKind === "hash-target") return "to-hash-target";
  if (hasCurrentAsset) return "current-asset-reference";
  return "other";
}

function summarizeTokens(tokens) {
  return {
    floats: tokens.filter((token) => token.kind === "float-constant").map((token) => token.value),
    refs: tokens.filter((token) => token.kind === "reference-or-field").map((token) => token.value),
    rawWords: tokens.filter((token) => token.kind === "raw-word").map((token) => token.u32),
    operators: tokens.filter((token) => token.kind === "operator").map((token) => token.name),
  };
}

function assessHeaderPatternComparison(relevant, signatureGroups, candidateCluster, options = {}) {
  const currentAssetId = Number.isFinite(options.currentAssetId) ? options.currentAssetId : 1663210;
  const candidateKinds = new Set(candidateCluster.map((transition) => transition.kind));
  const formulaHashGroups = signatureGroups.filter((group) => group.kind === "formula-to-hash-bytecode");
  const hashAssetGroups = signatureGroups.filter((group) => group.kind === "hash-to-current-asset");
  const structureMatches = candidateKinds.has("power-tag-to-formula")
    && candidateKinds.has("formula-to-hash-bytecode")
    && candidateKinds.has("hash-to-current-asset");
  const localComparables = formulaHashGroups.length > 0 && hashAssetGroups.length > 0;
  return {
    kind: structureMatches
      ? "candidate-cluster-matches-local-header-patterns"
      : localComparables
        ? "local-formula-hash-asset-patterns-found"
        : "candidate-cluster-partially-matched",
    confidence: structureMatches ? "medium-high" : localComparables ? "medium" : "low",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: structureMatches
      ? "Le cluster candidat correspond aux familles locales PowerTag->formule, formule->hash bytecode et hash->asset, mais le payload ne contient pas encore assez de clusters comparables pour isoler le layout exact de SF_32."
      : localComparables
        ? "Ce payload contient des motifs formule->hash et hash->asset courant comparables, utilisables pour etablir une matrice de layouts."
        : "Le cluster candidat n'est que partiellement comparable dans ce payload.",
    nextAction: "Etendre la comparaison a d'autres payloads contenant des couples formule/hash afin de trouver un motif repete de champ bonus.",
    evidence: {
      currentAssetId,
      relevantTransitions: relevant.length,
      formulaToHashGroups: formulaHashGroups.length,
      hashToCurrentAssetGroups: hashAssetGroups.length,
      candidateClusterTransitions: candidateCluster.length,
    },
  };
}

function interpretCandidateHeader(tokens, from, to) {
  const floatValues = tokens.filter((token) => token.kind === "float-constant").map((token) => token.value);
  const refs = tokens.filter((token) => token.kind === "reference-or-field").map((token) => token.value);
  const raws = tokens.filter((token) => token.kind === "raw-word").map((token) => token.u32);
  const ops = tokens.filter((token) => token.kind === "operator").map((token) => token.name);

  if (from.value.includes("PowerTag.Spiritborn_Talent_Ultimate_2") && to.value.includes("0.3 * Table(34")) {
    return {
      role: "power-tag-to-formula-header",
      confidence: refs.includes(5) && raws.includes(1648387) ? "high" : "medium",
      finding: "Le header relie le PowerTag a la formule script via une reference locale et une valeur brute stable.",
    };
  }

  if (from.value.includes("0.3 * Table(34") && to.value.includes("Bonus_Percent_Per_Power")) {
    return {
      role: "formula-bytecode-tail",
      confidence: floatValues.includes(0.3) && floatValues.includes(34) && ops.includes("multiply") ? "high" : "medium",
      finding: "Le gap contient le bytecode compile de la formule, pas un champ direct du hash bonus.",
    };
  }

  if (from.value.includes("Bonus_Percent_Per_Power") && raws.includes(1663210)) {
    return {
      role: "bonus-hash-to-asset-header",
      confidence: "high",
      finding: "Le suffixe du hash bonus reference l'asset courant, ce qui prouve une proximite structurelle sans prouver l'ownership de SF_32.",
    };
  }

  return {
    role: "unclassified-header",
    confidence: tokens.length ? "low" : "empty",
    finding: "Header non classe dans le cluster cible.",
  };
}

function assessHeaderCluster(candidateFields) {
  const roles = new Set(candidateFields.map((field) => field.interpretation.role));
  const hasPowerTagLink = roles.has("power-tag-to-formula-header");
  const hasFormulaTail = roles.has("formula-bytecode-tail");
  const hasBonusAssetLink = roles.has("bonus-hash-to-asset-header");
  const structureProven = hasPowerTagLink && hasFormulaTail && hasBonusAssetLink;
  return {
    kind: structureProven
      ? "power-tag-formula-bytecode-bonus-asset-headers"
      : "partial-header-cluster",
    confidence: structureProven ? "high" : "medium",
    fieldOwnership: "not-proven",
    blocker: "field-level-parser-required",
    promotionReady: false,
    finding: structureProven
      ? "Les headers prouvent une chaine structurelle PowerTag -> formule -> bytecode -> hash bonus -> asset id, mais pas encore un champ SF_32 possede par le hash bonus."
      : "Les headers du cluster restent partiels et ne suffisent pas a prouver l'ownership du champ.",
    nextAction: "Comparer ces headers avec d'autres clusters formule/hash pour identifier le layout exact du champ bonus et isoler SF_32.",
  };
}

function segmentSignature(tokens) {
  if (!tokens.length) return "empty";
  return tokens.map((token) => {
    if (token.kind === "float-constant") return `f:${token.value}`;
    if (token.kind === "reference-or-field") return `ref:${token.value}`;
    if (token.kind === "operator") return `op:${token.name}`;
    return `raw:${token.u32}`;
  }).join("|");
}

function classifyDecodedStringValue(value) {
  if (/^PowerTag\./.test(value)) return "power-tag-ref";
  if (/^Mod\./.test(value)) return "mod-flag";
  if (/#/.test(value)) return "hash-target";
  if (/Table\(|SF_|\?|POW\(|min\(|Floor\(/i.test(value)) return "formula";
  if (/^[0-9.]+$/.test(value)) return "numeric-literal";
  return "text";
}

function classifyRecordSegmentRoles(tokens, from, to) {
  const roles = [];
  const floatValues = tokens.filter((token) => token.kind === "float-constant").map((token) => token.value);
  const rawValues = tokens.filter((token) => token.kind === "raw-word").map((token) => token.u32);
  const refValues = tokens.filter((token) => token.kind === "reference-or-field").map((token) => token.value);
  const opNames = tokens.filter((token) => token.kind === "operator").map((token) => token.name);

  if (floatValues.length && opNames.length) roles.push("formula-bytecode-tail");
  if (refValues.includes(5) && rawValues.includes(1648387)) roles.push("power-tag-record-link");
  if (rawValues.includes(1663210)) roles.push("asset-id-link");
  if (from.value.includes("0.3 * Table(34") && to.value.includes("Bonus_Percent_Per_Power")) roles.push("candidate-formula-to-bonus-gap");
  if (from.value.includes("Bonus_Percent_Per_Power") && rawValues.includes(1663210)) roles.push("bonus-to-asset-gap");
  if (from.value.includes("Mod.SoilRuler_B")) roles.push("trigger-followup-gap");
  return roles;
}

function assessRecordCluster(clusterSegments, allSegments) {
  const roles = new Set(clusterSegments.flatMap((segment) => segment.roles));
  const hasFormulaTail = roles.has("formula-bytecode-tail");
  const hasFormulaToBonus = roles.has("candidate-formula-to-bonus-gap");
  const hasBonusToAsset = roles.has("bonus-to-asset-gap");
  const powerLinkCount = allSegments.filter((segment) => segment.roles.includes("power-tag-record-link")).length;
  return {
    kind: hasFormulaTail && hasFormulaToBonus && hasBonusToAsset
      ? "formula-bytecode-plus-adjacent-hash-asset-cluster"
      : "unclassified-cluster",
    confidence: hasFormulaTail && hasBonusToAsset ? "high" : "medium",
    note: hasFormulaTail && hasFormulaToBonus && hasBonusToAsset
      ? "Le cluster contient une queue de bytecode de formule, puis un hash bonus adjacent, puis l'asset id courant. Cela soutient une relation structurelle, mais pas encore un ownership direct du champ."
      : "Le cluster doit etre compare a plus de segments avant d'attribuer un ownership.",
    powerTagRecordLinksInPayload: powerLinkCount,
  };
}

function inspectStringRecord(buffer, strings, item) {
  const previous = strings.filter((other) => other.offset < item.offset).at(-1) ?? null;
  const next = strings.find((other) => other.offset > item.offset) ?? null;
  const afterStart = item.endOffset + 1;
  const afterEnd = next ? next.offset : Math.min(buffer.length, afterStart + 160);
  const beforeStart = previous ? previous.endOffset + 1 : Math.max(0, item.offset - 160);
  const beforeEnd = item.offset;
  return {
    offset: item.offset,
    endOffset: item.endOffset,
    length: item.length,
    value: item.value,
    previousString: previous ? pickStringBoundary(previous, item.offset) : null,
    nextString: next ? pickStringBoundary(next, item.offset) : null,
    bytesToPrevious: previous ? item.offset - previous.endOffset - 1 : null,
    bytesToNext: next ? next.offset - item.endOffset - 1 : null,
    prefixTokens: decodeTypedRecordTokens(buffer, beforeStart, beforeEnd),
    suffixTokens: decodeTypedRecordTokens(buffer, afterStart, afterEnd),
    directOffsetReferences: findDirectOffsetRefs(buffer, [item.offset])[String(item.offset)] ?? [],
  };
}

function pickStringBoundary(item, fromOffset) {
  return {
    offset: item.offset,
    endOffset: item.endOffset,
    delta: item.offset - fromOffset,
    value: item.value,
  };
}

function decodeTypedRecordTokens(buffer, start, end) {
  const tokens = [];
  const alignedStart = start + ((4 - (start % 4)) % 4);
  for (let offset = alignedStart; offset + 4 <= end; offset += 4) {
    const opcode = buffer.readUInt32LE(offset);
    if (opcode === 6 && offset + 8 <= end) {
      tokens.push({
        offset,
        kind: "float-constant",
        opcode,
        valueOffset: offset + 4,
        value: Number(buffer.readFloatLE(offset + 4).toPrecision(7)),
      });
      offset += 4;
    } else if (opcode === 5 && offset + 8 <= end) {
      tokens.push({
        offset,
        kind: "reference-or-field",
        opcode,
        valueOffset: offset + 4,
        value: buffer.readUInt32LE(offset + 4),
      });
      offset += 4;
    } else if ([9, 11, 12, 13, 14, 16].includes(opcode)) {
      tokens.push({
        offset,
        kind: "operator",
        opcode,
        name: formulaOpcodeName(opcode),
      });
    } else if (opcode !== 0) {
      const float32 = buffer.readFloatLE(offset);
      tokens.push({
        offset,
        kind: "raw-word",
        u32: opcode,
        f32: Number.isFinite(float32) ? Number(float32.toPrecision(7)) : null,
        ascii: buffer.subarray(offset, offset + 4).toString("ascii").replace(/[^\x20-\x7e]+/g, "."),
      });
    }
  }
  return tokens;
}

function formulaOpcodeName(opcode) {
  const names = {
    9: "equals-probable",
    11: "add",
    12: "subtract",
    13: "multiply",
    14: "divide",
    16: "conditional-or-ref",
  };
  return names[opcode] ?? "unknown";
}

function assessFieldOwnership({ formulaRecord, targetRecord, ownerRecords, triggerRecord }) {
  const formulaConstants = (formulaRecord?.suffixTokens ?? []).filter((token) => token.kind === "float-constant");
  const hasFormulaBytecode = formulaConstants.some((token) => Math.abs(Number(token.value) - 0.3) < 0.0001)
    && formulaConstants.some((token) => Math.abs(Number(token.value) - 34) < 0.0001);
  const targetHasAssetId = (targetRecord?.suffixTokens ?? []).some((token) => token.kind === "raw-word" && Number(token.u32) === 1663210)
    || (targetRecord?.suffixTokens ?? []).some((token) => token.kind === "reference-or-field" && Number(token.value) === 1663210);
  const targetPrefixLooksLikeFormulaTail = (targetRecord?.prefixTokens ?? []).some((token) => token.kind === "float-constant" && Math.abs(Number(token.value) - 0.3) < 0.0001)
    && (targetRecord?.prefixTokens ?? []).some((token) => token.kind === "operator" && token.name === "multiply");
  const ownerNearby = ownerRecords.some((record) => Math.abs(record.offset - (formulaRecord?.offset ?? 0)) <= 200);
  const triggerHasDirectRef = (triggerRecord?.directOffsetReferences ?? []).length > 0;

  if (hasFormulaBytecode && targetPrefixLooksLikeFormulaTail && targetHasAssetId) {
    return {
      fieldOwnership: "adjacent-record-cluster-not-field-owned",
      confidence: "high",
      blocker: "field-level-parser-required",
      finding: "Les mots types 0.3 et 34 se decodent comme le bytecode suffixe de la formule placee avant le hash bonus. Le hash bonus est adjacent et suivi par l'asset id courant, mais cela ne prouve pas encore que SF_32 possede ce champ.",
      nextAction: "Parser les headers binaires autour des offsets 18844-19020 pour mapper formule, bytecode, hash bonus et asset id comme champs explicites.",
      evidence: {
        formulaBytecodeConstants: formulaConstants,
        targetHasAssetId,
        ownerNearby,
        triggerHasDirectRef,
      },
    };
  }

  return {
    fieldOwnership: "unresolved",
    confidence: hasFormulaBytecode ? "medium" : "low",
    blocker: "field-level-parser-required",
    finding: "Le voisinage local est pertinent, mais le decoupage actuel ne suffit pas a prouver l'ownership du champ.",
    nextAction: "Etendre le parser de records et comparer ce cluster avec des records formule/hash similaires.",
    evidence: {
      formulaBytecodeConstants: formulaConstants,
      targetHasAssetId,
      ownerNearby,
      triggerHasDirectRef,
    },
  };
}

function extractDecodedAsciiStrings(buffer, options = {}) {
  const minLength = options.minLength ?? 4;
  const strings = [];
  let start = null;
  for (let i = 0; i <= buffer.length; i += 1) {
    const byte = i < buffer.length ? buffer[i] : 0;
    const printable = byte >= 32 && byte <= 126;
    if (printable && start === null) {
      start = i;
    } else if (!printable && start !== null) {
      const length = i - start;
      if (length >= minLength) {
        strings.push({
          offset: start,
          endOffset: i - 1,
          length,
          value: buffer.subarray(start, i).toString("ascii"),
        });
      }
      start = null;
    }
  }
  return strings;
}

function readWordsAround(buffer, start, end) {
  const words = [];
  const alignedStart = start + ((4 - (start % 4)) % 4);
  for (let offset = alignedStart; offset + 4 <= end; offset += 4) {
    const uint32 = buffer.readUInt32LE(offset);
    const int32 = buffer.readInt32LE(offset);
    const float32 = buffer.readFloatLE(offset);
    words.push({
      offset,
      uint32,
      int32,
      float32: Number.isFinite(float32) ? Number(float32.toPrecision(7)) : null,
      hex: buffer.subarray(offset, offset + 4).toString("hex"),
      ascii: buffer.subarray(offset, offset + 4).toString("ascii").replace(/[^\x20-\x7e]+/g, "."),
    });
  }
  return words;
}

function findDirectOffsetRefs(buffer, offsets) {
  const refs = {};
  for (const offset of offsets) {
    const needle = Buffer.alloc(4);
    needle.writeUInt32LE(offset);
    let hit = buffer.indexOf(needle);
    while (hit !== -1) {
      if (hit !== offset) {
        refs[String(offset)] = refs[String(offset)] ?? [];
        refs[String(offset)].push({
          offset: hit,
          nearbyHex: buffer.subarray(Math.max(0, hit - 16), Math.min(buffer.length, hit + 20)).toString("hex"),
        });
      }
      hit = buffer.indexOf(needle, hit + 1);
    }
  }
  return refs;
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const key = keyFn(item) ?? "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
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

function main() {
  const args = parseArgs(process.argv);

  if (args.command === "help") {
    printHelp();
    return;
  }

  if (args.command === "scan") {
    const manifest = scanInstall(args.gamePath, args.outDir);
    console.log(`Scan complete: ${args.outDir}`);
    console.log(`Detected build: ${manifest.detectedBuild?.name ?? "unknown"}`);
    console.log(`Files indexed: ${manifest.counts.files}`);
    console.log(`Local .idx files: ${manifest.counts.localIdxFiles}`);
    console.log(`CDN .index files: ${manifest.counts.cdnIndexFiles}`);
    return;
  }

  if (args.command === "inspect-index") {
    if (!args.file) {
      throw new Error("inspect-index requires --file <path>");
    }
    const analysis = analyzeIndexFile(path.resolve(args.file), {
      maxRecords: args.maxRecords,
    });
    const outFile = path.join(
      args.outDir,
      `${path.basename(args.file).replace(/[^a-zA-Z0-9_.-]/g, "_")}.analysis.json`
    );
    writeJson(outFile, analysis);
    console.log(`Index analysis complete: ${outFile}`);
    console.log(`Format hypothesis: ${analysis.formatHypothesis}`);
    console.log(`Records/candidates: ${analysis.parsedRecords ?? analysis.candidates?.length ?? 0}`);
    return;
  }

  if (args.command === "probe-payloads") {
    if (!args.file) {
      throw new Error("probe-payloads requires --file <path>");
    }
    const dataDir = args.dataDir ?? path.dirname(path.resolve(args.file));
    const report = probeIdxPayloads(path.resolve(args.file), path.resolve(dataDir), {
      maxRecords: args.maxRecords,
      readBytes: args.readBytes,
    });
    const outFile = path.join(
      args.outDir,
      `${path.basename(args.file).replace(/[^a-zA-Z0-9_.-]/g, "_")}.payload-probe.json`
    );
    writeJson(outFile, report);
    console.log(`Payload probe complete: ${outFile}`);
    console.log(`Candidates probed: ${report.candidates.length}`);
    console.log(`Top candidate magic counts: ${JSON.stringify(report.candidates[0]?.hitsByMagic ?? {})}`);
    return;
  }

  if (args.command === "scan-magic") {
    if (!args.file) {
      throw new Error("scan-magic requires --file <path>");
    }
    const report = scanForMagic(path.resolve(args.file), {
      magic: args.magic,
    });
    const outFile = path.join(
      args.outDir,
      `${path.basename(args.file).replace(/[^a-zA-Z0-9_.-]/g, "_")}.${args.magic}.scan.json`
    );
    writeJson(outFile, report);
    console.log(`Magic scan complete: ${outFile}`);
    console.log(`Hits: ${report.hits.join(", ") || "none"}`);
    return;
  }

  if (args.command === "decode-blte") {
    if (!args.file) {
      throw new Error("decode-blte requires --file <path>");
    }
    if (!Number.isFinite(args.offset)) {
      throw new Error("decode-blte requires --offset <number>");
    }
    const decoded = decodeBlteAt(path.resolve(args.file), args.offset);
    const base = `${path.basename(args.file).replace(/[^a-zA-Z0-9_.-]/g, "_")}.${args.offset}`;
    const report = {
      filePath: decoded.filePath,
      fileName: decoded.fileName,
      offset: decoded.offset,
      totalCompressedBytes: decoded.totalCompressedBytes,
      header: decoded.header,
      chunks: decoded.chunks.map((chunk) => ({
        compressedSize: chunk.compressedSize,
        decompressedSize: chunk.decompressedSize,
        checksum: chunk.checksum,
        dataOffset: chunk.dataOffset,
        mode: chunk.mode,
        decodedSize: chunk.decodedSize,
        note: chunk.note,
      })),
      decodedSize: decoded.decoded.length,
      decodedPreviewHex: decoded.decoded.subarray(0, 128).toString("hex"),
      decodedPreviewAscii: Array.from(decoded.decoded.subarray(0, 256))
        .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
        .join(""),
    };
    writeJson(path.join(args.outDir, `${base}.blte.json`), report);
    require("fs").writeFileSync(path.join(args.outDir, `${base}.decoded.bin`), decoded.decoded);
    console.log(`BLTE decode complete: ${path.join(args.outDir, `${base}.blte.json`)}`);
    console.log(`Decoded bytes: ${decoded.decoded.length}`);
    return;
  }

  if (args.command === "inspect-decoded-strings") {
    if (!args.file) {
      throw new Error("inspect-decoded-strings requires --file <decoded.bin>");
    }
    const report = inspectDecodedStrings(path.resolve(args.file), {
      terms: args.terms ?? undefined,
    });
    const outFile = path.join(args.outDir, "decoded-string-structure.json");
    writeJson(outFile, report);
    console.log(`Decoded string inspection complete: ${outFile}`);
    console.log(`Strings: ${report.summary.strings}`);
    console.log(`Inspected strings: ${report.summary.inspectedStrings}`);
    console.log(`Direct offset reference targets: ${report.summary.directOffsetReferenceTargets}`);
    return;
  }

  if (args.command === "inspect-field-records") {
    if (!args.file) {
      throw new Error("inspect-field-records requires --file <decoded.bin>");
    }
    const report = inspectFieldRecords(path.resolve(args.file), {
      terms: args.terms ?? undefined,
    });
    const outFile = path.join(args.outDir, "field-record-inspection.json");
    writeJson(outFile, report);
    console.log(`Field record inspection complete: ${outFile}`);
    console.log(`Selected records: ${report.summary.selectedRecords}`);
    console.log(`Field ownership: ${report.summary.fieldOwnership}`);
    console.log(`Confidence: ${report.summary.confidence}`);
    console.log(`Blocker: ${report.summary.blocker}`);
    return;
  }

  if (args.command === "inspect-record-segments") {
    if (!args.file) {
      throw new Error("inspect-record-segments requires --file <decoded.bin>");
    }
    const report = inspectRecordSegments(path.resolve(args.file));
    const outFile = path.join(args.outDir, "record-segment-inspection.json");
    writeJson(outFile, report);
    console.log(`Record segment inspection complete: ${outFile}`);
    console.log(`Segments: ${report.summary.segments}`);
    console.log(`Interesting: ${report.summary.interestingSegments}`);
    console.log(`Cluster kind: ${report.summary.clusterAssessment.kind}`);
    console.log(`Confidence: ${report.summary.clusterAssessment.confidence}`);
    return;
  }

  if (args.command === "inspect-record-headers") {
    if (!args.file) {
      throw new Error("inspect-record-headers requires --file <decoded.bin>");
    }
    const report = inspectRecordHeaders(path.resolve(args.file), {
      clusterStart: args.clusterStart,
      clusterEnd: args.clusterEnd,
    });
    const outFile = path.join(args.outDir, "record-header-inspection.json");
    writeJson(outFile, report);
    console.log(`Record header inspection complete: ${outFile}`);
    console.log(`Candidate fields: ${report.summary.candidateFields}`);
    console.log(`Cluster kind: ${report.summary.assessment.kind}`);
    console.log(`Field ownership: ${report.summary.assessment.fieldOwnership}`);
    console.log(`Promotion ready: ${report.summary.assessment.promotionReady}`);
    return;
  }

  if (args.command === "compare-record-header-patterns") {
    if (!args.file) {
      throw new Error("compare-record-header-patterns requires --file <decoded.bin>");
    }
    const report = compareRecordHeaderPatterns(path.resolve(args.file), {
      currentAssetId: args.assetIds?.[0] ?? 1663210,
    });
    const outFile = path.join(args.outDir, "record-header-pattern-comparison.json");
    writeJson(outFile, report);
    console.log(`Record header pattern comparison complete: ${outFile}`);
    console.log(`Relevant transitions: ${report.summary.relevantTransitions}`);
    console.log(`Signature groups: ${report.summary.signatureGroups}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    console.log(`Promotion ready: ${report.summary.assessment.promotionReady}`);
    return;
  }

  if (args.command === "compare-record-header-pattern-reports") {
    if (!args.mergeFiles?.length) {
      throw new Error("compare-record-header-pattern-reports requires --merge-files <report.json,...>");
    }
    const report = compareRecordHeaderPatternReports(args.mergeFiles.map((file) => path.resolve(file)));
    const outFile = path.join(args.outDir, "record-header-pattern-report-comparison.json");
    writeJson(outFile, report);
    console.log(`Record header pattern report comparison complete: ${outFile}`);
    console.log(`Reports: ${report.summary.reports}`);
    console.log(`Signatures: ${report.summary.signatures}`);
    console.log(`Repeated signatures: ${report.summary.repeatedSignatures}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-normalized-header-layouts") {
    if (!args.mergeFiles?.length) {
      throw new Error("compare-normalized-header-layouts requires --merge-files <report.json,...>");
    }
    const report = compareNormalizedHeaderLayouts(args.mergeFiles.map((file) => path.resolve(file)));
    const outFile = path.join(args.outDir, "normalized-header-layout-comparison.json");
    writeJson(outFile, report);
    console.log(`Normalized header layout comparison complete: ${outFile}`);
    console.log(`Reports: ${report.summary.reports}`);
    console.log(`Families: ${report.summary.families}`);
    console.log(`Transitions: ${report.summary.transitions}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-formula-hash-layouts") {
    if (!args.mergeFiles?.length) {
      throw new Error("compare-formula-hash-layouts requires --merge-files <report.json,...>");
    }
    const report = compareFormulaHashLayouts(args.mergeFiles.map((file) => path.resolve(file)));
    const outFile = path.join(args.outDir, "formula-hash-layout-focus.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "formula-hash-layout-focus-summary.json");
    writeJson(summaryFile, {
      comparedAt: report.comparedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Formula/hash layout focus complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Formula->hash reports: ${report.summary.formulaToHashReports}`);
    console.log(`Hash->asset reports: ${report.summary.hashToAssetReports}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "inspect-formula-hash-field-boundaries") {
    if (!args.mergeFiles?.length) {
      throw new Error("inspect-formula-hash-field-boundaries requires --merge-files <report.json,...>");
    }
    const report = inspectFormulaHashFieldBoundaries(args.mergeFiles.map((file) => path.resolve(file)));
    const outFile = path.join(args.outDir, "formula-hash-field-boundaries.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "formula-hash-field-boundaries-summary.json");
    writeJson(summaryFile, {
      inspectedAt: report.inspectedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Formula/hash field boundary inspection complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Formula core hits: ${report.summary.formulaOpcodeCoreHits}/${report.summary.formulaTransitions}`);
    console.log(`Hash asset anchor hits: ${report.summary.hashAssetAnchorHits}/${report.summary.hashAssetTransitions}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "inspect-formula-hash-header-preludes") {
    if (!args.mergeFiles?.length) {
      throw new Error("inspect-formula-hash-header-preludes requires --merge-files <report.json,...>");
    }
    const report = inspectFormulaHashHeaderPreludes(args.mergeFiles.map((file) => path.resolve(file)), {
      windowBytes: Number.isFinite(args.readBytes) ? args.readBytes : 32,
    });
    const outFile = path.join(args.outDir, "formula-hash-header-preludes.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "formula-hash-header-preludes-summary.json");
    writeJson(summaryFile, {
      inspectedAt: report.inspectedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Formula/hash header prelude inspection complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Readable transitions: ${report.summary.readableTransitions}/${report.summary.inspectedTransitions}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-hash-suffix-definitions") {
    if (!args.formulaHashFieldBoundaries) {
      throw new Error("compare-hash-suffix-definitions requires --formula-hash-field-boundaries <formula-hash-field-boundaries.json>");
    }
    if (!args.definitionSearch) {
      throw new Error("compare-hash-suffix-definitions requires --definition-search <conditional-definition-search.json>");
    }
    const report = compareHashSuffixDefinitions(path.resolve(args.formulaHashFieldBoundaries), path.resolve(args.definitionSearch));
    const outFile = path.join(args.outDir, "hash-suffix-definition-links.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-definition-links-summary.json");
    writeJson(summaryFile, {
      comparedAt: report.comparedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix definition comparison complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Linked definition targets: ${report.summary.linkedDefinitionTargets}`);
    console.log(`External definitions: ${report.summary.exactExternalDefinitionLinks}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "analyze-hash-suffix-value-patterns") {
    if (!args.formulaHashFieldBoundaries) {
      throw new Error("analyze-hash-suffix-value-patterns requires --formula-hash-field-boundaries <formula-hash-field-boundaries.json>");
    }
    const report = analyzeHashSuffixValuePatterns(path.resolve(args.formulaHashFieldBoundaries));
    const outFile = path.join(args.outDir, "hash-suffix-value-patterns.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-value-patterns-summary.json");
    writeJson(summaryFile, {
      analyzedAt: report.analyzedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix value pattern analysis complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Suffixes: ${report.summary.suffixes}`);
    console.log(`Repeated constants: ${report.summary.repeatedConstants}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "analyze-hash-suffix-candidate-semantics") {
    if (!args.formulaHashFieldBoundaries) {
      throw new Error("analyze-hash-suffix-candidate-semantics requires --formula-hash-field-boundaries <formula-hash-field-boundaries.json>");
    }
    const report = analyzeHashSuffixCandidateSemantics(path.resolve(args.formulaHashFieldBoundaries));
    const outFile = path.join(args.outDir, "hash-suffix-candidate-semantics.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-candidate-semantics-summary.json");
    writeJson(summaryFile, {
      analyzedAt: report.analyzedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix candidate semantic analysis complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Rows: ${report.summary.rows}`);
    console.log(`Metadata ids: ${report.summary.metadataIds}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "mine-hash-suffix-dictionary") {
    if (!args.formulaHashFieldBoundaries) {
      throw new Error("mine-hash-suffix-dictionary requires --formula-hash-field-boundaries <formula-hash-field-boundaries.json>");
    }
    const report = mineHashSuffixDictionary(path.resolve(args.formulaHashFieldBoundaries), {
      decodedRoot: args.dataDir ? path.resolve(args.dataDir) : null,
    });
    const outFile = path.join(args.outDir, "hash-suffix-dictionary-mining.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-dictionary-mining-summary.json");
    writeJson(summaryFile, {
      minedAt: report.minedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix dictionary mining complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Anchors: ${report.summary.anchors}`);
    console.log(`Selectors: ${report.summary.selectors}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "summarize-hash-suffix-family-evidence") {
    if (!args.hashSuffixDictionaryMining) {
      throw new Error("summarize-hash-suffix-family-evidence requires --hash-suffix-dictionary-mining <hash-suffix-dictionary-mining.json>");
    }
    const report = summarizeHashSuffixFamilyEvidence(path.resolve(args.hashSuffixDictionaryMining));
    const outFile = path.join(args.outDir, "hash-suffix-family-evidence.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-family-evidence-summary.json");
    writeJson(summaryFile, {
      summarizedAt: report.summarizedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix family evidence summary complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Selectors: ${report.summary.selectors}`);
    console.log(`Metadata ids: ${report.summary.metadataIds}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "audit-hash-suffix-source-names") {
    if (!args.hashSuffixFamilyEvidence) {
      throw new Error("audit-hash-suffix-source-names requires --hash-suffix-family-evidence <hash-suffix-family-evidence.json>");
    }
    if (!args.dataDir) {
      throw new Error("audit-hash-suffix-source-names requires --data-dir <outputs-root>");
    }
    const report = auditHashSuffixSourceNames(path.resolve(args.hashSuffixFamilyEvidence), {
      dataDir: path.resolve(args.dataDir),
      maxHits: args.maxHits,
    });
    const outFile = path.join(args.outDir, "hash-suffix-source-name-audit.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-source-name-audit-summary.json");
    writeJson(summaryFile, {
      auditedAt: report.auditedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix source-name audit complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Files with hits: ${report.summary.filesWithHits}`);
    console.log(`Source-name candidates: ${report.summary.sourceNameCandidates}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "audit-hash-suffix-binary-sources") {
    if (!args.hashSuffixFamilyEvidence) {
      throw new Error("audit-hash-suffix-binary-sources requires --hash-suffix-family-evidence <hash-suffix-family-evidence.json>");
    }
    if (!args.dataDir) {
      throw new Error("audit-hash-suffix-binary-sources requires --data-dir <decoded-bin-root>");
    }
    const report = auditHashSuffixBinarySources(path.resolve(args.hashSuffixFamilyEvidence), {
      dataDir: path.resolve(args.dataDir),
      maxHits: args.maxHits,
    });
    const outFile = path.join(args.outDir, "hash-suffix-binary-source-audit.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-binary-source-audit-summary.json");
    writeJson(summaryFile, {
      auditedAt: report.auditedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix binary-source audit complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Files with hits: ${report.summary.filesWithHits}`);
    console.log(`Binary hits: ${report.summary.hits}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-hash-suffix-binary-contexts") {
    if (!args.hashSuffixBinarySourceAudit) {
      throw new Error("compare-hash-suffix-binary-contexts requires --hash-suffix-binary-source-audit <hash-suffix-binary-source-audit.json>");
    }
    const report = compareHashSuffixBinaryContexts(path.resolve(args.hashSuffixBinarySourceAudit));
    const outFile = path.join(args.outDir, "hash-suffix-binary-context-comparison.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-binary-context-comparison-summary.json");
    writeJson(summaryFile, {
      comparedAt: report.comparedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix binary context comparison complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Selector pattern groups: ${report.summary.selectorPatternGroups}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "classify-hash-suffix-sublayouts") {
    if (!args.hashSuffixFamilyEvidence) {
      throw new Error("classify-hash-suffix-sublayouts requires --hash-suffix-family-evidence <hash-suffix-family-evidence.json>");
    }
    if (!args.hashSuffixBinaryContextComparison) {
      throw new Error("classify-hash-suffix-sublayouts requires --hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json>");
    }
    const report = classifyHashSuffixSublayouts({
      familyEvidenceFilePath: path.resolve(args.hashSuffixFamilyEvidence),
      binaryContextComparisonFilePath: path.resolve(args.hashSuffixBinaryContextComparison),
    });
    const outFile = path.join(args.outDir, "hash-suffix-sublayout-classification.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-sublayout-classification-summary.json");
    writeJson(summaryFile, {
      classifiedAt: report.classifiedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix sublayout classification complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Selectors: ${report.summary.selectors}`);
    console.log(`Groups: ${report.summary.groups}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "parse-hash-suffix-sublayout-fields") {
    if (!args.hashSuffixSublayoutClassification) {
      throw new Error("parse-hash-suffix-sublayout-fields requires --hash-suffix-sublayout-classification <hash-suffix-sublayout-classification.json>");
    }
    const report = parseHashSuffixSublayoutFields(path.resolve(args.hashSuffixSublayoutClassification));
    const outFile = path.join(args.outDir, "hash-suffix-sublayout-fields.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-sublayout-fields-summary.json");
    writeJson(summaryFile, {
      parsedAt: report.parsedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix sublayout fields complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Fields: ${report.summary.fields}`);
    console.log(`Blocked fields: ${report.summary.blockedFields}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "decode-hash-suffix-field-shapes") {
    if (!args.hashSuffixSublayoutFields) {
      throw new Error("decode-hash-suffix-field-shapes requires --hash-suffix-sublayout-fields <hash-suffix-sublayout-fields.json>");
    }
    const report = decodeHashSuffixFieldShapes(path.resolve(args.hashSuffixSublayoutFields));
    const outFile = path.join(args.outDir, "hash-suffix-field-shape-decoders.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-field-shape-decoders-summary.json");
    writeJson(summaryFile, {
      decodedAt: report.decodedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix field shape decoders complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Decoded fields: ${report.summary.decodedFields}`);
    console.log(`Shape decoders: ${report.summary.shapeDecoders}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "link-hash-suffix-decoded-offsets") {
    if (!args.hashSuffixFieldShapeDecoders) {
      throw new Error("link-hash-suffix-decoded-offsets requires --hash-suffix-field-shape-decoders <hash-suffix-field-shape-decoders.json>");
    }
    if (!args.hashSuffixBinaryContextComparison) {
      throw new Error("link-hash-suffix-decoded-offsets requires --hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json>");
    }
    const report = linkHashSuffixDecodedOffsets({
      fieldShapeDecodersFilePath: path.resolve(args.hashSuffixFieldShapeDecoders),
      binaryContextComparisonFilePath: path.resolve(args.hashSuffixBinaryContextComparison),
    });
    const outFile = path.join(args.outDir, "hash-suffix-decoded-offset-links.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-decoded-offset-links-summary.json");
    writeJson(summaryFile, {
      linkedAt: report.linkedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix decoded offset links complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Offset links: ${report.summary.offsetLinks}`);
    console.log(`Compact offset links: ${report.summary.compactOffsetLinks}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "inspect-hash-suffix-offset-records") {
    if (!args.hashSuffixDecodedOffsetLinks) {
      throw new Error("inspect-hash-suffix-offset-records requires --hash-suffix-decoded-offset-links <hash-suffix-decoded-offset-links.json>");
    }
    if (!args.fieldRecords) {
      throw new Error("inspect-hash-suffix-offset-records requires --field-records <field-record-inspection.json>");
    }
    const report = inspectHashSuffixOffsetRecords({
      decodedOffsetLinksFilePath: path.resolve(args.hashSuffixDecodedOffsetLinks),
      fieldRecordsFilePath: path.resolve(args.fieldRecords),
    });
    const outFile = path.join(args.outDir, "hash-suffix-offset-record-inspection.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-offset-record-inspection-summary.json");
    writeJson(summaryFile, {
      inspectedAt: report.inspectedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix offset record inspection complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Record links: ${report.summary.recordLinks}`);
    console.log(`Suffix record links: ${report.summary.suffixRecordLinks}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-hash-suffix-record-boundaries") {
    if (!args.hashSuffixDecodedOffsetLinks) {
      throw new Error("compare-hash-suffix-record-boundaries requires --hash-suffix-decoded-offset-links <hash-suffix-decoded-offset-links.json>");
    }
    if (!args.mergeFiles?.length) {
      throw new Error("compare-hash-suffix-record-boundaries requires --merge-files <field-record-inspection.json,...>");
    }
    const report = compareHashSuffixRecordBoundaries({
      decodedOffsetLinksFilePath: path.resolve(args.hashSuffixDecodedOffsetLinks),
      fieldRecordFilePaths: args.mergeFiles.map((file) => path.resolve(file)),
    });
    const outFile = path.join(args.outDir, "hash-suffix-record-boundary-comparison.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-record-boundary-comparison-summary.json");
    writeJson(summaryFile, {
      comparedAt: report.comparedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix record boundary comparison complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Boundary groups: ${report.summary.boundaryGroups}`);
    console.log(`Suffix rows: ${report.summary.suffixRows}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "inspect-hash-suffix-boundary-preludes") {
    if (!args.hashSuffixRecordBoundaryComparison) {
      throw new Error("inspect-hash-suffix-boundary-preludes requires --hash-suffix-record-boundary-comparison <hash-suffix-record-boundary-comparison.json>");
    }
    if (!args.dataDir) {
      throw new Error("inspect-hash-suffix-boundary-preludes requires --data-dir <outputs-root>");
    }
    const report = inspectHashSuffixBoundaryPreludes({
      boundaryComparisonFilePath: path.resolve(args.hashSuffixRecordBoundaryComparison),
      dataDir: path.resolve(args.dataDir),
      readBytes: args.readBytes,
    });
    const outFile = path.join(args.outDir, "hash-suffix-boundary-preludes.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-boundary-preludes-summary.json");
    writeJson(summaryFile, {
      inspectedAt: report.inspectedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix boundary preludes complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Windows: ${report.summary.windows}`);
    console.log(`Repeated groups: ${report.summary.repeatedPreludeGroups}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-hash-suffix-preludes-with-header-patterns") {
    if (!args.hashSuffixBoundaryPreludes) {
      throw new Error("compare-hash-suffix-preludes-with-header-patterns requires --hash-suffix-boundary-preludes <hash-suffix-boundary-preludes.json>");
    }
    if (!args.mergeFiles?.length) {
      throw new Error("compare-hash-suffix-preludes-with-header-patterns requires --merge-files <record-header-pattern-comparison.json,...>");
    }
    const report = compareHashSuffixPreludesWithHeaderPatterns(
      path.resolve(args.hashSuffixBoundaryPreludes),
      args.mergeFiles.map((file) => path.resolve(file))
    );
    const outFile = path.join(args.outDir, "hash-suffix-prelude-header-comparison.json");
    writeJson(outFile, report);
    console.log(`Hash suffix prelude/header comparison complete: ${outFile}`);
    console.log(`Windows: ${report.summary.windows}`);
    console.log(`Matched windows: ${report.summary.matchedWindows}`);
    console.log(`Exact selector matches: ${report.summary.exactSelectorMatches}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "compare-hash-suffix-header-shapes") {
    if (!args.mergeFiles?.length) {
      throw new Error("compare-hash-suffix-header-shapes requires --merge-files <record-header-pattern-comparison.json,...>");
    }
    const report = compareHashSuffixHeaderShapes(args.mergeFiles.map((file) => path.resolve(file)));
    const outFile = path.join(args.outDir, "hash-suffix-header-shape-comparison.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-header-shape-comparison-summary.json");
    writeJson(summaryFile, {
      comparedAt: report.comparedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix header shape comparison complete: ${outFile}`);
    console.log(`Transitions: ${report.summary.transitions}`);
    console.log(`Groups: ${report.summary.groups}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "search-hash-suffix-compact-pattern") {
    if (!args.dataDir) {
      throw new Error("search-hash-suffix-compact-pattern requires --data-dir <decoded-bin-root>");
    }
    const report = searchHashSuffixCompactPattern(path.resolve(args.dataDir));
    const outFile = path.join(args.outDir, "hash-suffix-compact-pattern-search.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-compact-pattern-search-summary.json");
    writeJson(summaryFile, {
      searchedAt: report.searchedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix compact pattern search complete: ${outFile}`);
    console.log(`Files scanned: ${report.summary.filesScanned}`);
    console.log(`Exact compact hits: ${report.summary.exactCompact949Hits}`);
    console.log(`Value hits: ${report.summary.valueHits}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "audit-hash-suffix-named-tables") {
    if (!args.dataDir) {
      throw new Error("audit-hash-suffix-named-tables requires --data-dir <outputs-root>");
    }
    const report = auditHashSuffixNamedTables(path.resolve(args.dataDir));
    const outFile = path.join(args.outDir, "hash-suffix-named-table-audit.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "hash-suffix-named-table-audit-summary.json");
    writeJson(summaryFile, {
      auditedAt: report.auditedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Hash suffix named table audit complete: ${outFile}`);
    console.log(`Contexts: ${report.summary.contexts}`);
    console.log(`Independent candidates: ${report.summary.independentCandidates}`);
    console.log(`Generated contexts: ${report.summary.generatedContexts}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "summarize-bonus-percent-sample-coverage") {
    if (!args.graphsFile) {
      throw new Error("summarize-bonus-percent-sample-coverage requires --graphs-file <formula-graphs.json>");
    }
    if (!args.recordHeaderPayloadPlan) {
      throw new Error("summarize-bonus-percent-sample-coverage requires --record-header-payload-plan <record-header-payload-plan.json>");
    }
    if (!args.hashSuffixBinaryContextComparison) {
      throw new Error("summarize-bonus-percent-sample-coverage requires --hash-suffix-binary-context-comparison <hash-suffix-binary-context-comparison.json>");
    }
    const report = summarizeBonusPercentSampleCoverage({
      graphsFilePath: path.resolve(args.graphsFile),
      payloadPlanFilePath: path.resolve(args.recordHeaderPayloadPlan),
      binaryContextComparisonFilePath: path.resolve(args.hashSuffixBinaryContextComparison),
    });
    const outFile = path.join(args.outDir, "bonus-percent-sample-coverage.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "bonus-percent-sample-coverage-summary.json");
    writeJson(summaryFile, {
      summarizedAt: report.summarizedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Bonus percent sample coverage complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Bonus refs: ${report.summary.bonusPercentRefs}`);
    console.log(`Compared bonus targets: ${report.summary.comparedBonusTargets}`);
    console.log(`Assessment: ${report.summary.assessment.kind}`);
    return;
  }

  if (args.command === "plan-record-header-payloads") {
    if (!args.file) {
      throw new Error("plan-record-header-payloads requires --file <external-target-search.json>");
    }
    const report = planRecordHeaderPayloads(path.resolve(args.file));
    const outFile = path.join(args.outDir, "record-header-payload-plan.json");
    writeJson(outFile, report);
    console.log(`Record header payload plan complete: ${outFile}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Already decoded: ${report.summary.alreadyDecoded}`);
    console.log(`Needs decode: ${report.summary.needsDecode}`);
    console.log(`Next asset: ${report.summary.nextAssetId}`);
    return;
  }

  if (args.command === "mine-formula-hash-candidates") {
    if (!args.file) {
      throw new Error("mine-formula-hash-candidates requires --file <deadbeef-string-search.json>");
    }
    const report = mineFormulaHashCandidates(path.resolve(args.file));
    const outFile = path.join(args.outDir, "formula-hash-candidates.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "formula-hash-candidates-summary.json");
    writeJson(summaryFile, {
      minedAt: report.minedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Formula/hash candidate mining complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Formula/hash-like: ${report.summary.formulaHashLike}`);
    console.log(`Needs decode: ${report.summary.needsDecode}`);
    console.log(`Next asset: ${report.summary.nextAssetId}`);
    return;
  }

  if (args.command === "catalog-blte") {
    if (!args.file) {
      throw new Error("catalog-blte requires --file <path>");
    }
    const report = catalogBlteFile(path.resolve(args.file), {
      maxHits: args.maxHits,
      decode: true,
    });
    const outFile = path.join(
      args.outDir,
      `${path.basename(args.file).replace(/[^a-zA-Z0-9_.-]/g, "_")}.blte-catalog.json`
    );
    writeJson(outFile, report);
    console.log(`BLTE catalog complete: ${outFile}`);
    console.log(`Entries: ${report.summary.entries}`);
    console.log(`Decoded types: ${JSON.stringify(report.summary.decodedTypeCounts)}`);
    return;
  }

  if (args.command === "catalog-blte-dir") {
    if (!args.dataDir) {
      throw new Error("catalog-blte-dir requires --data-dir <path>");
    }
    const report = catalogBlteDirectory(path.resolve(args.dataDir), {
      fileLimit: args.fileLimit,
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
    });
    const outFile = path.join(args.outDir, "blte-directory-catalog.json");
    writeJson(outFile, report);
    console.log(`BLTE directory catalog complete: ${outFile}`);
    console.log(`Files: ${report.aggregate.files}`);
    console.log(`Entries: ${report.aggregate.entries}`);
    console.log(`Decoded types: ${JSON.stringify(report.aggregate.decodedTypeCounts)}`);
    console.log(`Header span matches: ${report.aggregate.spanMatches}`);
    return;
  }

  if (args.command === "analyze-deadbeef") {
    if (!args.file) {
      throw new Error("analyze-deadbeef requires --file <path>");
    }
    const report = analyzeDeadbeefFile(path.resolve(args.file), {
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
    });
    const outFile = path.join(
      args.outDir,
      `${path.basename(args.file).replace(/[^a-zA-Z0-9_.-]/g, "_")}.deadbeef-analysis.json`
    );
    writeJson(outFile, report);
    console.log(`Deadbeef analysis complete: ${outFile}`);
    console.log(`Entries: ${report.summary.entries}`);
    console.log(`Layouts: ${JSON.stringify(report.summary.layoutCounts)}`);
    return;
  }

  if (args.command === "analyze-deadbeef-dir") {
    if (!args.dataDir) {
      throw new Error("analyze-deadbeef-dir requires --data-dir <path>");
    }
    const report = analyzeDeadbeefDirectory(path.resolve(args.dataDir), {
      fileLimit: args.fileLimit,
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
    });
    const outFile = path.join(args.outDir, "deadbeef-directory-analysis.json");
    writeJson(outFile, report);
    console.log(`Deadbeef directory analysis complete: ${outFile}`);
    console.log(`Entries: ${report.summary.entries}`);
    console.log(`Layouts: ${JSON.stringify(report.summary.layoutCounts)}`);
    return;
  }

  if (args.command === "search-deadbeef-strings") {
    if (!args.dataDir) {
      throw new Error("search-deadbeef-strings requires --data-dir <path>");
    }
    const report = searchDeadbeefStringsDirectory(path.resolve(args.dataDir), {
      fileLimit: args.fileLimit,
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
      terms: args.terms ?? undefined,
    });
    const outFile = path.join(args.outDir, "deadbeef-string-search.json");
    writeJson(outFile, report);
    console.log(`Deadbeef string search complete: ${outFile}`);
    console.log(`Decoded entries: ${report.summary.decodedDeadbeefEntries}`);
    console.log(`Matching entries: ${report.summary.matchingEntries}`);
    console.log(`Term counts: ${JSON.stringify(report.summary.termCounts)}`);
    return;
  }

  if (args.command === "audit-local-artifact-terms") {
    if (!args.dataDir) {
      throw new Error("audit-local-artifact-terms requires --data-dir <path>");
    }
    if (!args.terms?.length) {
      throw new Error("audit-local-artifact-terms requires --terms a,b,c");
    }
    const report = auditLocalArtifactTerms(path.resolve(args.dataDir), args.terms, {
      maxFileMb: args.maxFileMb,
      maxHits: args.maxHits,
    });
    const outFile = path.join(args.outDir, "local-artifact-term-audit.json");
    writeJson(outFile, report);
    console.log(`Local artifact term audit complete: ${outFile}`);
    console.log(`Files with hits: ${report.summary.filesWithHits}`);
    console.log(`Hits: ${report.summary.hits}`);
    console.log(`Recommendation: ${report.summary.recommendation.kind}`);
    return;
  }

  if (args.command === "export-formulas") {
    if (!args.dataDir) {
      throw new Error("export-formulas requires --data-dir <path>");
    }
    const report = exportFormulaDirectory(path.resolve(args.dataDir), {
      fileLimit: args.fileLimit,
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
    });
    const outFile = path.join(args.outDir, "formulas.json");
    writeJson(outFile, report);
    console.log(`Formula export complete: ${outFile}`);
    console.log(`Records: ${report.summary.formulaRecords}`);
    console.log(`Formula strings: ${report.summary.formulaStrings}`);
    console.log(`Kinds: ${JSON.stringify(report.summary.kindCounts)}`);
    return;
  }

  if (args.command === "export-formula-graphs") {
    if (!args.file) {
      throw new Error("export-formula-graphs requires --file <formulas.json>");
    }
    const formulaExport = JSON.parse(require("fs").readFileSync(path.resolve(args.file), "utf8"));
    const report = buildFormulaGraphs(formulaExport);
    const outFile = path.join(args.outDir, "formula-graphs.json");
    writeJson(outFile, report);
    console.log(`Formula graph export complete: ${outFile}`);
    console.log(`Records: ${report.summary.records}`);
    console.log(`Formula nodes: ${report.summary.formulaNodes}`);
    console.log(`SF refs: ${report.summary.sfRefs.length}`);
    console.log(`Tables: ${report.summary.tables.length}`);
    return;
  }

  if (args.command === "evaluate-formula-graphs") {
    if (!args.file) {
      throw new Error("evaluate-formula-graphs requires --file <formula-graphs.json>");
    }
    const report = evaluateFormulaGraphsFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "formula-evaluation.json");
    writeJson(outFile, report);
    console.log(`Formula evaluation complete: ${outFile}`);
    console.log(`Nodes: ${report.summary.nodes}`);
    console.log(`OK: ${report.summary.ok}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Error kinds: ${JSON.stringify(report.summary.errorKinds)}`);
    return;
  }

  if (args.command === "inspect-sf") {
    if (!args.file) {
      throw new Error("inspect-sf requires --file <formula-graphs.json>");
    }
    const report = inspectSfDefinitionsFromGraphsFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "sf-inspection.json");
    writeJson(outFile, report);
    console.log(`SF inspection complete: ${outFile}`);
    console.log(`Graphs: ${report.summary.graphs}`);
    console.log(`Nodes: ${report.summary.nodes}`);
    console.log(`Inferred SF refs: ${report.summary.inferredSfRefs}`);
    console.log(`Constants: ${report.summary.constants}`);
    return;
  }

  if (args.command === "export-sf-candidates") {
    if (!args.file) {
      throw new Error("export-sf-candidates requires --file <formula-graphs.json>");
    }
    const report = exportSfCandidateDefinitionsFromGraphsFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "sf-candidates.json");
    writeJson(outFile, report);
    console.log(`SF candidate export complete: ${outFile}`);
    console.log(`Graphs: ${report.summary.graphs}`);
    console.log(`Strings: ${report.summary.strings}`);
    console.log(`Kinds: ${JSON.stringify(report.summary.kindCounts)}`);
    return;
  }

  if (args.command === "analyze-sf-usage") {
    if (!args.file) {
      throw new Error("analyze-sf-usage requires --file <formula-graphs.json>");
    }
    if (!args.sfCandidates) {
      throw new Error("analyze-sf-usage requires --sf-candidates <sf-candidates.json>");
    }
    const report = analyzeSfUsageFromFiles(path.resolve(args.file), path.resolve(args.sfCandidates));
    const outFile = path.join(args.outDir, "sf-usage-analysis.json");
    writeJson(outFile, report);
    console.log(`SF usage analysis complete: ${outFile}`);
    console.log(`Used references: ${report.summary.usedReferences}`);
    console.log(`Roles: ${JSON.stringify(report.summary.roles)}`);
    console.log(`Interest levels: ${JSON.stringify(report.summary.interestLevels)}`);
    return;
  }

  if (args.command === "resolve-missing-sf") {
    if (!args.file) {
      throw new Error("resolve-missing-sf requires --file <sf-usage-analysis.json>");
    }
    if (!args.sfCandidates) {
      throw new Error("resolve-missing-sf requires --sf-candidates <sf-candidates.json>");
    }
    const report = resolveMissingSfReferencesFromFiles(path.resolve(args.file), path.resolve(args.sfCandidates));
    const outFile = path.join(args.outDir, "missing-sf-resolution.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "missing-sf-resolution-summary.json");
    writeJson(summaryFile, {
      resolvedAt: report.resolvedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Missing SF resolution complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Missing references: ${report.summary.missingReferences}`);
    console.log(`Classifications: ${JSON.stringify(report.summary.classificationCounts)}`);
    return;
  }

  if (args.command === "inspect-priority-assets") {
    if (!args.file) {
      throw new Error("inspect-priority-assets requires --file <formula-graphs.json>");
    }
    if (!args.sfCandidates) {
      throw new Error("inspect-priority-assets requires --sf-candidates <sf-candidates.json>");
    }
    if (!args.missingSf) {
      throw new Error("inspect-priority-assets requires --missing-sf <missing-sf-resolution.json>");
    }
    const report = inspectPriorityAssetsFromFiles(
      path.resolve(args.file),
      path.resolve(args.sfCandidates),
      path.resolve(args.missingSf),
      {
        assetIds: args.assetIds ?? undefined,
      }
    );
    const outFile = path.join(args.outDir, "priority-asset-inspection.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "priority-asset-inspection-summary.json");
    writeJson(summaryFile, {
      inspectedAt: report.inspectedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Priority asset inspection complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Formulas with missing refs: ${report.summary.formulasWithMissingRefs}`);
    console.log(`Bytecode SF occurrences: ${report.summary.bytecodeSfOccurrences}`);
    return;
  }

  if (args.command === "export-external-refs") {
    if (!args.file) {
      throw new Error("export-external-refs requires --file <formula-graphs.json>");
    }
    const report = exportExternalReferencesFromFiles(
      path.resolve(args.file),
      args.priorityInspection ? path.resolve(args.priorityInspection) : null
    );
    const outFile = path.join(args.outDir, "external-references.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "external-references-summary.json");
    writeJson(summaryFile, {
      exportedAt: report.exportedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`External reference export complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Assets with external refs: ${report.summary.assetsWithExternalRefs}`);
    console.log(`PowerTag groups: ${report.summary.powerTagGroups}`);
    console.log(`Hash target groups: ${report.summary.hashTargetGroups}`);
    return;
  }

  if (args.command === "search-external-targets") {
    if (!args.dataDir) {
      throw new Error("search-external-targets requires --data-dir <path>");
    }
    if (!args.externalRefs) {
      throw new Error("search-external-targets requires --external-refs <external-references.json>");
    }
    const report = searchExternalTargetsFromFiles(path.resolve(args.dataDir), path.resolve(args.externalRefs), {
      fileLimit: args.fileLimit,
      fileOffset: args.fileOffset,
      fileNames: args.fileNames ?? undefined,
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
      targets: args.terms ?? undefined,
      decodedTypes: args.decodedTypes ?? undefined,
    });
    const outFile = path.join(args.outDir, "external-target-search.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "external-target-search-summary.json");
    writeJson(summaryFile, {
      searchedAt: report.searchedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`External target search complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Matching entries: ${report.summary.matchingEntries}`);
    console.log(`Target groups matched: ${report.summary.targetGroupsMatched}`);
    return;
  }

  if (args.command === "plan-external-target-scan") {
    if (!args.dataDir) {
      throw new Error("plan-external-target-scan requires --data-dir <path>");
    }
    if (!args.externalRefs) {
      throw new Error("plan-external-target-scan requires --external-refs <external-references.json>");
    }
    const report = planExternalTargetScan(args);
    const outFile = path.join(args.outDir, "external-target-scan-plan.json");
    writeJson(outFile, report);
    const scriptFile = path.join(args.outDir, "run-external-target-scan.ps1");
    fs.mkdirSync(args.outDir, { recursive: true });
    fs.writeFileSync(scriptFile, report.script, "utf8");
    console.log(`External target scan plan complete: ${outFile}`);
    console.log(`PowerShell script: ${scriptFile}`);
    console.log(`Chunks: ${report.summary.chunks}`);
    console.log(`Total files: ${report.summary.totalFiles}`);
    console.log(`Recommendation: ${report.summary.recommendation}`);
    return;
  }

  if (args.command === "merge-external-target-searches") {
    if (!args.mergeFiles?.length) {
      throw new Error("merge-external-target-searches requires --merge-files <external-target-search.json,...>");
    }
    const report = mergeExternalTargetSearchesFromFiles(args.mergeFiles.map((file) => path.resolve(file)));
    const outFile = path.join(args.outDir, "external-target-search-merged.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "external-target-search-merged-summary.json");
    writeJson(summaryFile, {
      mergedAt: report.mergedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`External target search merge complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Source reports: ${report.source.reports.length}`);
    console.log(`Matching entries: ${report.summary.matchingEntries}`);
    console.log(`Target groups matched: ${report.summary.targetGroupsMatched}`);
    return;
  }

  if (args.command === "inspect-external-values") {
    if (!args.file) {
      throw new Error("inspect-external-values requires --file <formula-graphs.json>");
    }
    const report = inspectExternalValuesFromFiles(path.resolve(args.file), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "external-value-inspection.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "external-value-inspection-summary.json");
    writeJson(summaryFile, {
      inspectedAt: report.inspectedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`External value inspection complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Equivalences: ${report.summary.equivalences}`);
    console.log(`High confidence: ${report.summary.highConfidenceEquivalences}`);
    return;
  }

  if (args.command === "export-canonical-vars") {
    if (!args.file) {
      throw new Error("export-canonical-vars requires --file <formula-graphs.json>");
    }
    const report = exportCanonicalExternalVariablesFromFiles(
      path.resolve(args.file),
      args.externalValues ? path.resolve(args.externalValues) : null
    );
    const outFile = path.join(args.outDir, "canonical-external-variables.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "canonical-external-variables-summary.json");
    writeJson(summaryFile, {
      exportedAt: report.exportedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Canonical variable export complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Variables: ${report.summary.variables}`);
    console.log(`Proven variables: ${report.summary.provenVariables}`);
    return;
  }

  if (args.command === "export-canonical-context") {
    if (!args.file) {
      throw new Error("export-canonical-context requires --file <canonical-external-variables.json>");
    }
    const report = buildCanonicalContextTemplateFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "canonical-context.json");
    writeJson(outFile, report);
    console.log(`Canonical context export complete: ${outFile}`);
    console.log(`Canonical values: ${Object.keys(report.canonicalValues).length}`);
    return;
  }

  if (args.command === "evaluate-canonical-vars") {
    if (!args.file) {
      throw new Error("evaluate-canonical-vars requires --file <canonical-external-variables.json>");
    }
    const contextOverride = args.contextFile
      ? JSON.parse(require("fs").readFileSync(path.resolve(args.contextFile), "utf8"))
      : null;
    const report = evaluateCanonicalVariablesFile(path.resolve(args.file), {
      values: contextOverride?.canonicalValues ?? undefined,
      context: contextOverride?.context ?? undefined,
    });
    const outFile = path.join(args.outDir, "canonical-formula-evaluation.json");
    writeJson(outFile, report);
    console.log(`Canonical formula evaluation complete: ${outFile}`);
    console.log(`Formulas: ${report.summary.formulas}`);
    console.log(`OK: ${report.summary.ok}`);
    console.log(`Errors: ${report.summary.errors}`);
    return;
  }

  if (args.command === "build-dps-model") {
    if (!args.file) {
      throw new Error("build-dps-model requires --file <canonical-formula-evaluation.json>");
    }
    const report = buildMinimalDpsModelFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "minimal-dps-model.json");
    writeJson(outFile, report);
    console.log(`Minimal DPS model complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Assets with damage terms: ${report.summary.assetsWithDamageTerms}`);
    console.log(`Role counts: ${JSON.stringify(report.summary.roleCounts)}`);
    return;
  }

  if (args.command === "export-optimizer-dataset") {
    if (!args.file) {
      throw new Error("export-optimizer-dataset requires --file <reviewed-dps-model.json>");
    }
    const report = exportOptimizerDatasetFile(
      path.resolve(args.file),
      args.candidateContext ? path.resolve(args.candidateContext) : null
    );
    const outFile = path.join(args.outDir, "optimizer-dataset.json");
    writeJson(outFile, report);
    const summaryFile = path.join(args.outDir, "optimizer-dataset-summary.json");
    writeJson(summaryFile, {
      exportedAt: report.exportedAt,
      schemaVersion: report.schemaVersion,
      summary: report.summary,
    });
    console.log(`Optimizer dataset export complete: ${outFile}`);
    console.log(`Summary: ${summaryFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Candidates: ${report.summary.candidateCount}`);
    console.log(`Real DPS promotions: ${report.summary.realDpsPromotions}`);
    return;
  }

  if (args.command === "export-target-dataset") {
    if (!args.file) {
      throw new Error("export-target-dataset requires --file <optimizer-dataset.json>");
    }
    const report = exportTargetDatasetFromOptimizerFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "target-dataset.json");
    writeJson(outFile, report);
    console.log(`Target dataset export complete: ${outFile}`);
    console.log(`Skills: ${report.entities.skills.length}`);
    console.log(`Affixes: ${report.entities.affixes.length}`);
    console.log(`Aspects: ${report.entities.aspects.length}`);
    console.log(`Formulas: ${report.entities.formulas.length}`);
    console.log(`Conditions: ${report.entities.conditions.length}`);
    console.log(`Relations: ${report.relations.length}`);
    return;
  }

  if (args.command === "validate-target-dataset") {
    if (!args.file) {
      throw new Error("validate-target-dataset requires --file <target-dataset.json>");
    }
    const report = validateTargetDatasetFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "target-dataset-validation.json");
    writeJson(outFile, report);
    console.log(`Target dataset validation complete: ${outFile}`);
    console.log(`OK: ${report.ok}`);
    console.log(`Issues: ${report.summary.issues}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    if (!report.ok) {
      process.exitCode = 1;
    }
    return;
  }

  if (args.command === "compose-target-build") {
    if (!args.file) {
      throw new Error("compose-target-build requires --file <target-dataset.json>");
    }
    if (!args.assetIds?.length) {
      throw new Error("compose-target-build requires --asset-ids <id,id>");
    }
    const report = composeTargetBuildFile(path.resolve(args.file), args.assetIds, {
      mode: args.mode,
      aspectSlotReadinessFilePath: args.aspectSlotReadiness ? path.resolve(args.aspectSlotReadiness) : null,
    });
    const outFile = path.join(args.outDir, "target-build-composition.json");
    writeJson(outFile, report);
    console.log(`Target build composition complete: ${outFile}`);
    console.log(`Mode: ${report.mode}`);
    console.log(`Strict total: ${report.totals.strict}`);
    console.log(`What-if total: ${report.totals.whatIf}`);
    console.log(`Candidate delta: ${report.totals.candidateDelta}`);
    console.log(`Quality: ${report.quality.level} ${report.quality.score}/100`);
    console.log(`Blockers: ${report.blockers.length}`);
    return;
  }

  if (args.command === "audit-target-blockers") {
    if (!args.file) {
      throw new Error("audit-target-blockers requires --file <target-build-composition.json>");
    }
    const report = auditTargetBlockersFile(path.resolve(args.file), {
      candidateContextFilePath: args.candidateContext ? path.resolve(args.candidateContext) : null,
      sfSourcesFilePath: args.sfSources ? path.resolve(args.sfSources) : null,
      definitionSearchFilePath: args.definitionSearch ? path.resolve(args.definitionSearch) : null,
      fieldRecordsFilePath: args.fieldRecords ? path.resolve(args.fieldRecords) : null,
      recordSegmentsFilePath: args.recordSegments ? path.resolve(args.recordSegments) : null,
      recordHeadersFilePath: args.recordHeaders ? path.resolve(args.recordHeaders) : null,
      recordHeaderPatternsFilePath: args.recordHeaderPatterns ? path.resolve(args.recordHeaderPatterns) : null,
      recordHeaderPatternReportFilePath: args.recordHeaderPatternReport ? path.resolve(args.recordHeaderPatternReport) : null,
      normalizedHeaderLayoutsFilePath: args.normalizedHeaderLayouts ? path.resolve(args.normalizedHeaderLayouts) : null,
      formulaHashLayoutFocusFilePath: args.formulaHashLayoutFocus ? path.resolve(args.formulaHashLayoutFocus) : null,
      formulaHashFieldBoundariesFilePath: args.formulaHashFieldBoundaries ? path.resolve(args.formulaHashFieldBoundaries) : null,
      formulaHashHeaderPreludesFilePath: args.formulaHashHeaderPreludes ? path.resolve(args.formulaHashHeaderPreludes) : null,
      hashSuffixDefinitionLinksFilePath: args.hashSuffixDefinitionLinks ? path.resolve(args.hashSuffixDefinitionLinks) : null,
      hashSuffixValuePatternsFilePath: args.hashSuffixValuePatterns ? path.resolve(args.hashSuffixValuePatterns) : null,
      hashSuffixCandidateSemanticsFilePath: args.hashSuffixCandidateSemantics ? path.resolve(args.hashSuffixCandidateSemantics) : null,
      hashSuffixDictionaryMiningFilePath: args.hashSuffixDictionaryMining ? path.resolve(args.hashSuffixDictionaryMining) : null,
      hashSuffixFamilyEvidenceFilePath: args.hashSuffixFamilyEvidence ? path.resolve(args.hashSuffixFamilyEvidence) : null,
      hashSuffixSourceNameAuditFilePath: args.hashSuffixSourceNameAudit ? path.resolve(args.hashSuffixSourceNameAudit) : null,
      hashSuffixBinarySourceAuditFilePath: args.hashSuffixBinarySourceAudit ? path.resolve(args.hashSuffixBinarySourceAudit) : null,
      hashSuffixBinaryContextComparisonFilePath: args.hashSuffixBinaryContextComparison ? path.resolve(args.hashSuffixBinaryContextComparison) : null,
      hashSuffixSublayoutClassificationFilePath: args.hashSuffixSublayoutClassification ? path.resolve(args.hashSuffixSublayoutClassification) : null,
      hashSuffixSublayoutFieldsFilePath: args.hashSuffixSublayoutFields ? path.resolve(args.hashSuffixSublayoutFields) : null,
      hashSuffixFieldShapeDecodersFilePath: args.hashSuffixFieldShapeDecoders ? path.resolve(args.hashSuffixFieldShapeDecoders) : null,
      hashSuffixDecodedOffsetLinksFilePath: args.hashSuffixDecodedOffsetLinks ? path.resolve(args.hashSuffixDecodedOffsetLinks) : null,
      hashSuffixOffsetRecordInspectionFilePath: args.hashSuffixOffsetRecordInspection ? path.resolve(args.hashSuffixOffsetRecordInspection) : null,
      hashSuffixRecordBoundaryComparisonFilePath: args.hashSuffixRecordBoundaryComparison ? path.resolve(args.hashSuffixRecordBoundaryComparison) : null,
      hashSuffixBoundaryPreludesFilePath: args.hashSuffixBoundaryPreludes ? path.resolve(args.hashSuffixBoundaryPreludes) : null,
      hashSuffixPreludeHeaderComparisonFilePath: args.hashSuffixPreludeHeaderComparison ? path.resolve(args.hashSuffixPreludeHeaderComparison) : null,
      hashSuffixHeaderShapeComparisonFilePath: args.hashSuffixHeaderShapeComparison ? path.resolve(args.hashSuffixHeaderShapeComparison) : null,
      hashSuffixCompactPatternSearchFilePath: args.hashSuffixCompactPatternSearch ? path.resolve(args.hashSuffixCompactPatternSearch) : null,
      hashSuffixNamedTableAuditFilePath: args.hashSuffixNamedTableAudit ? path.resolve(args.hashSuffixNamedTableAudit) : null,
      recordHeaderSourceFreshnessAuditFilePath: args.recordHeaderSourceFreshnessAudit ? path.resolve(args.recordHeaderSourceFreshnessAudit) : null,
      bonusPercentSelectorMatrixFilePath: args.bonusPercentSelectorMatrix ? path.resolve(args.bonusPercentSelectorMatrix) : null,
      selector949PeerAuditFilePath: args.selector949PeerAudit ? path.resolve(args.selector949PeerAudit) : null,
      selector949CompactCorpusFilePath: args.selector949CompactCorpus ? path.resolve(args.selector949CompactCorpus) : null,
      decodedDictionaryStringScanFilePath: args.decodedDictionaryStringScan ? path.resolve(args.decodedDictionaryStringScan) : null,
      unanchoredBonusPercentAuditFilePath: args.unanchoredBonusPercentAudit ? path.resolve(args.unanchoredBonusPercentAudit) : null,
      metadata12337ContextAuditFilePath: args.metadata12337ContextAudit ? path.resolve(args.metadata12337ContextAudit) : null,
      metadata12337ScaleCorpusFilePath: args.metadata12337ScaleCorpus ? path.resolve(args.metadata12337ScaleCorpus) : null,
      selectorAssetPairCorpusFilePath: args.selectorAssetPairCorpus ? path.resolve(args.selectorAssetPairCorpus) : null,
      selectorAssetLayoutParserFilePath: args.selectorAssetLayoutParser ? path.resolve(args.selectorAssetLayoutParser) : null,
      selectorAssetOwnerFieldsFilePath: args.selectorAssetOwnerFields ? path.resolve(args.selectorAssetOwnerFields) : null,
      bonusPercentCoverageAuditFilePath: args.bonusPercentCoverageAudit ? path.resolve(args.bonusPercentCoverageAudit) : null,
      localTableSourceAlternativesFilePath: args.localTableSourceAlternatives ? path.resolve(args.localTableSourceAlternatives) : null,
      sf32FieldPromotionDecisionFilePath: args.sf32FieldPromotionDecision ? path.resolve(args.sf32FieldPromotionDecision) : null,
      sf33BuildStateTriggerAuditFilePath: args.sf33BuildStateTriggerAudit ? path.resolve(args.sf33BuildStateTriggerAudit) : null,
      sf33ActivationSourceCorpusFilePath: args.sf33ActivationSourceCorpus ? path.resolve(args.sf33ActivationSourceCorpus) : null,
      sf33ActivationSourceSearchAuditFilePath: args.sf33ActivationSourceSearchAudit ? path.resolve(args.sf33ActivationSourceSearchAudit) : null,
      sf33BuildStateNeighborhoodAuditFilePath: args.sf33BuildStateNeighborhoodAudit ? path.resolve(args.sf33BuildStateNeighborhoodAudit) : null,
      sf33OffsetTableEntriesAuditFilePath: args.sf33OffsetTableEntriesAudit ? path.resolve(args.sf33OffsetTableEntriesAudit) : null,
      sf33OffsetTableParentRunAuditFilePath: args.sf33OffsetTableParentRunAudit ? path.resolve(args.sf33OffsetTableParentRunAudit) : null,
      sf33ParentRunSemanticsAuditFilePath: args.sf33ParentRunSemanticsAudit ? path.resolve(args.sf33ParentRunSemanticsAudit) : null,
      sf33NamedBuildStateSourceAuditFilePath: args.sf33NamedBuildStateSourceAudit ? path.resolve(args.sf33NamedBuildStateSourceAudit) : null,
      sf33BinaryParentSourceAuditFilePath: args.sf33BinaryParentSourceAudit ? path.resolve(args.sf33BinaryParentSourceAudit) : null,
      uptimeProofAuditFilePath: args.uptimeProofAudit ? path.resolve(args.uptimeProofAudit) : null,
      sf28Sf29RoleAuditFilePath: args.sf28Sf29RoleAudit ? path.resolve(args.sf28Sf29RoleAudit) : null,
      uptimeNeighborDependencyAuditFilePath: args.uptimeNeighborDependencyAudit ? path.resolve(args.uptimeNeighborDependencyAudit) : null,
    });
    const outFile = path.join(args.outDir, "target-blocker-resolution.json");
    writeJson(outFile, report);
    console.log(`Target blocker audit complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Blockers: ${report.summary.blockers}`);
    console.log(`Resolved: ${report.summary.resolved}`);
    console.log(`Still blocked: ${report.summary.blocked}`);
    console.log(`Promotion ready: ${report.summary.promotionReady}`);
    return;
  }

  if (args.command === "analyze-dps-sensitivity") {
    if (!args.file) {
      throw new Error("analyze-dps-sensitivity requires --file <canonical-external-variables.json>");
    }
    const report = analyzeDpsSensitivityFile(
      path.resolve(args.file),
      args.contextFile ? path.resolve(args.contextFile) : null
    );
    const outFile = path.join(args.outDir, "dps-sensitivity.json");
    writeJson(outFile, report);
    console.log(`DPS sensitivity analysis complete: ${outFile}`);
    console.log(`Variables tested: ${report.summary.variablesTested}`);
    console.log(`Variables with impact: ${report.summary.variablesWithImpact}`);
    console.log(`Top variable: ${report.summary.topSensitivity[0]?.canonicalId ?? "none"}`);
    return;
  }

  if (args.command === "audit-dps-roles") {
    if (!args.file) {
      throw new Error("audit-dps-roles requires --file <minimal-dps-model.json>");
    }
    const report = auditDpsRolesFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "dps-role-audit.json");
    writeJson(outFile, report);
    console.log(`DPS role audit complete: ${outFile}`);
    console.log(`Utility formulas: ${report.summary.utilityFormulas}`);
    console.log(`Suggested counts: ${JSON.stringify(report.summary.suggestedCounts)}`);
    return;
  }

  if (args.command === "audit-damage-components") {
    if (!args.file) {
      throw new Error("audit-damage-components requires --file <dps-model.json>");
    }
    const report = auditDamageComponentsFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "damage-component-audit.json");
    writeJson(outFile, report);
    console.log(`Damage component audit complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Assets with multiple damage terms: ${report.summary.assetsWithMultipleDamageTerms}`);
    console.log(`Recommendation counts: ${JSON.stringify(report.summary.recommendationCounts)}`);
    return;
  }

  if (args.command === "audit-global-branch-signals") {
    if (!args.graphsFile) {
      throw new Error("audit-global-branch-signals requires --graphs-file <formula-graphs.json>");
    }
    const report = auditGlobalBranchSignalsFile(
      path.resolve(args.graphsFile),
      args.file ? path.resolve(args.file) : null,
      { assetIds: args.assetIds ?? undefined }
    );
    const outFile = path.join(args.outDir, "global-branch-audit.json");
    writeJson(outFile, report);
    console.log(`Global branch audit complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Assets with damage and branch signals: ${report.summary.assetsWithDamageAndBranchSignals}`);
    console.log(`Priority counts: ${JSON.stringify(report.summary.priorityCounts)}`);
    return;
  }

  if (args.command === "inspect-conditional-damage") {
    if (!args.graphsFile) {
      throw new Error("inspect-conditional-damage requires --graphs-file <formula-graphs.json>");
    }
    const report = inspectConditionalDamageFile(
      path.resolve(args.graphsFile),
      args.file ? path.resolve(args.file) : null,
      args.priorityInspection ? path.resolve(args.priorityInspection) : null,
      { assetIds: args.assetIds ?? undefined }
    );
    const outFile = path.join(args.outDir, "conditional-damage-inspection.json");
    writeJson(outFile, report);
    console.log(`Conditional damage inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Conditional damage formulas: ${report.summary.conditionalDamageFormulas}`);
    console.log(`Recommendations: ${JSON.stringify(report.summary.recommendationCounts)}`);
    return;
  }

  if (args.command === "inspect-conditional-damage-dedupe") {
    if (!args.file) {
      throw new Error("inspect-conditional-damage-dedupe requires --file <conditional-damage-inspection.json>");
    }
    const report = inspectConditionalDamageDedupeFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "conditional-damage-dedupe.json");
    writeJson(outFile, report);
    console.log(`Conditional damage dedupe inspection complete: ${outFile}`);
    console.log(`Duplicate groups: ${report.summary.duplicateGroups}`);
    console.log(`Safe dedupe groups: ${report.summary.safeDedupeGroups}`);
    console.log(`Recommendations: ${JSON.stringify(report.summary.recommendationCounts)}`);
    return;
  }

  if (args.command === "audit-deduped-damage-composition") {
    if (!args.file) {
      throw new Error("audit-deduped-damage-composition requires --file <dps-model.json>");
    }
    if (!args.conditionalDedupe) {
      throw new Error("audit-deduped-damage-composition requires --conditional-dedupe <conditional-damage-dedupe.json>");
    }
    const report = auditDedupedDamageCompositionFile(path.resolve(args.file), path.resolve(args.conditionalDedupe));
    const outFile = path.join(args.outDir, "deduped-damage-composition-audit.json");
    writeJson(outFile, report);
    console.log(`Deduped damage composition audit complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Assets with removed duplicates: ${report.summary.assetsWithRemovedDuplicates}`);
    console.log(`Removed duplicate terms: ${report.summary.removedDuplicateTerms}`);
    console.log(`Recommendations: ${JSON.stringify(report.summary.recommendationCounts)}`);
    return;
  }

  if (args.command === "build-conditional-sf-scenarios") {
    if (!args.file) {
      throw new Error("build-conditional-sf-scenarios requires --file <conditional-damage-inspection.json>");
    }
    if (!args.dedupedComposition) {
      throw new Error("build-conditional-sf-scenarios requires --deduped-composition <deduped-damage-composition-audit.json>");
    }
    const report = buildConditionalSfScenariosFile(path.resolve(args.file), path.resolve(args.dedupedComposition), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "conditional-sf-scenarios.json");
    writeJson(outFile, report);
    console.log(`Conditional SF scenarios complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Scenarios: ${report.summary.scenarios}`);
    console.log(`Scenarios above strict: ${report.summary.scenariosAboveStrict}`);
    console.log(`Max scenario DPS: ${report.summary.maxScenarioDps}`);
    return;
  }

  if (args.command === "build-conditional-candidate-context") {
    if (!args.structuralRelations) {
      throw new Error("build-conditional-candidate-context requires --structural-relations <structural-relations.json>");
    }
    if (!args.scenariosFile) {
      throw new Error("build-conditional-candidate-context requires --scenarios-file <conditional-sf-scenarios.json>");
    }
    const report = buildConditionalCandidateContextFile(
      path.resolve(args.structuralRelations),
      path.resolve(args.scenariosFile)
    );
    const outFile = path.join(args.outDir, "conditional-candidate-context.json");
    writeJson(outFile, report);
    console.log(`Conditional candidate context complete: ${outFile}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Candidates with scenario impact: ${report.summary.candidatesWithScenarioImpact}`);
    console.log(`Real DPS promotions: ${report.summary.realDpsPromotions}`);
    return;
  }

  if (args.command === "inspect-conditional-sf-sources") {
    if (!args.file) {
      throw new Error("inspect-conditional-sf-sources requires --file <conditional-damage-inspection.json>");
    }
    if (!args.priorityInspection) {
      throw new Error("inspect-conditional-sf-sources requires --priority-inspection <priority-asset-inspection.json>");
    }
    const report = inspectConditionalSfSourcesFile(
      path.resolve(args.file),
      path.resolve(args.priorityInspection),
      args.sfUsage ? path.resolve(args.sfUsage) : null,
      args.sfCandidates ? path.resolve(args.sfCandidates) : null,
      { assetIds: args.assetIds ?? undefined }
    );
    const outFile = path.join(args.outDir, "conditional-sf-source-inspection.json");
    writeJson(outFile, report);
    console.log(`Conditional SF source inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Slots: ${report.summary.slots}`);
    console.log(`Slots without local symbol: ${report.summary.slotsWithoutLocalSymbol}`);
    console.log(`Recommendations: ${JSON.stringify(report.summary.recommendationCounts)}`);
    return;
  }

  if (args.command === "inspect-conditional-external-metadata") {
    if (!args.file) {
      throw new Error("inspect-conditional-external-metadata requires --file <conditional-sf-source-inspection.json>");
    }
    if (!args.externalTargets) {
      throw new Error("inspect-conditional-external-metadata requires --external-targets <external-target-search.json>");
    }
    const report = inspectConditionalExternalMetadataFile(
      path.resolve(args.file),
      path.resolve(args.externalTargets),
      args.externalRefs ? path.resolve(args.externalRefs) : null,
      { assetIds: args.assetIds ?? undefined }
    );
    const outFile = path.join(args.outDir, "conditional-external-metadata-inspection.json");
    writeJson(outFile, report);
    console.log(`Conditional external metadata inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Trigger candidates: ${report.summary.triggerCandidates}`);
    console.log(`Scaling candidates: ${report.summary.scalingCandidates}`);
    return;
  }

  if (args.command === "inspect-conditional-metadata-values") {
    if (!args.file) {
      throw new Error("inspect-conditional-metadata-values requires --file <conditional-external-metadata-inspection.json>");
    }
    if (!args.externalTargets) {
      throw new Error("inspect-conditional-metadata-values requires --external-targets <external-target-search.json>");
    }
    const report = inspectConditionalMetadataValuesFile(path.resolve(args.file), path.resolve(args.externalTargets), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "conditional-metadata-value-inspection.json");
    writeJson(outFile, report);
    console.log(`Conditional metadata value inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Direct numeric values: ${report.summary.candidatesWithDirectNumericValue}`);
    console.log(`Unresolved external pointers: ${report.summary.unresolvedExternalPointers}`);
    return;
  }

  if (args.command === "inspect-conditional-definition-search") {
    if (!args.file) {
      throw new Error("inspect-conditional-definition-search requires --file <conditional-metadata-value-inspection.json>");
    }
    if (!args.externalTargets) {
      throw new Error("inspect-conditional-definition-search requires --external-targets <external-target-search.json>");
    }
    const report = inspectConditionalDefinitionSearchFile(path.resolve(args.file), path.resolve(args.externalTargets), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "conditional-definition-search.json");
    writeJson(outFile, report);
    console.log(`Conditional definition search complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Targets: ${report.summary.targets}`);
    console.log(`Exact definitions found: ${report.summary.exactDefinitionsFound}`);
    console.log(`Unresolved exact targets: ${report.summary.unresolvedExactTargets}`);
    return;
  }

  if (args.command === "inspect-damage-context") {
    if (!args.file) {
      throw new Error("inspect-damage-context requires --file <damage-component-audit.json>");
    }
    if (!args.graphsFile) {
      throw new Error("inspect-damage-context requires --graphs-file <formula-graphs.json>");
    }
    const report = inspectDamageComponentContextFile(path.resolve(args.file), path.resolve(args.graphsFile), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "damage-context-inspection.json");
    writeJson(outFile, report);
    console.log(`Damage context inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Damage terms: ${report.summary.damageTerms}`);
    console.log(`Likely branches: ${report.summary.likelyBranches}`);
    return;
  }

  if (args.command === "inspect-branch-controls") {
    if (!args.damageContextFile) {
      throw new Error("inspect-branch-controls requires --damage-context <damage-context-inspection.json>");
    }
    if (!args.graphsFile) {
      throw new Error("inspect-branch-controls requires --graphs-file <formula-graphs.json>");
    }
    const report = inspectBranchControlsFile(path.resolve(args.damageContextFile), path.resolve(args.graphsFile), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "branch-control-inspection.json");
    writeJson(outFile, report);
    console.log(`Branch control inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Controls: ${report.summary.controls}`);
    console.log(`Upgrade controls: ${report.summary.assetsWithUpgradeControls}`);
    return;
  }

  if (args.command === "export-build-state-template") {
    if (!args.branchControlsFile) {
      throw new Error("export-build-state-template requires --branch-controls <branch-control-inspection.json>");
    }
    const report = exportBuildStateTemplateFile(path.resolve(args.branchControlsFile), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "build-state-template.json");
    writeJson(outFile, report);
    console.log(`Build state template export complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Flags: ${report.summary.flags}`);
    console.log(`External values: ${report.summary.externalValues}`);
    return;
  }

  if (args.command === "evaluate-build-state-scenarios") {
    if (!args.buildStateFile) {
      throw new Error("evaluate-build-state-scenarios requires --build-state <build-state-template.json>");
    }
    const report = evaluateBuildStateScenariosFile(path.resolve(args.buildStateFile));
    const outFile = path.join(args.outDir, "build-state-scenarios.json");
    writeJson(outFile, report);
    console.log(`Build state scenario evaluation complete: ${outFile}`);
    console.log(`Scenarios: ${report.summary.scenarios}`);
    console.log(`Controls: ${report.summary.controls}`);
    console.log(`Control statuses: ${JSON.stringify(report.summary.controlStatuses)}`);
    return;
  }

  if (args.command === "inspect-scenario-sf-mappings") {
    if (!args.scenariosFile) {
      throw new Error("inspect-scenario-sf-mappings requires --scenarios-file <build-state-scenarios.json>");
    }
    if (!args.sfCandidates) {
      throw new Error("inspect-scenario-sf-mappings requires --sf-candidates <sf-candidates.json>");
    }
    const report = inspectScenarioSfMappingsFile(path.resolve(args.scenariosFile), path.resolve(args.sfCandidates), {
      assetIds: args.assetIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "scenario-sf-mappings.json");
    writeJson(outFile, report);
    console.log(`Scenario SF mapping inspection complete: ${outFile}`);
    console.log(`Assets: ${report.summary.assets}`);
    console.log(`Selected SF refs: ${report.summary.selectedSfRefs}`);
    console.log(`Selected missing local symbols: ${report.summary.selectedSfRefsMissingLocalSymbol}`);
    return;
  }

  if (args.command === "inspect-scenario-sf-bytecode") {
    if (!args.file) {
      throw new Error("inspect-scenario-sf-bytecode requires --file <scenario-sf-mappings.json>");
    }
    const report = inspectScenarioSfBytecodeFile(path.resolve(args.file));
    const outFile = path.join(args.outDir, "scenario-sf-bytecode.json");
    writeJson(outFile, report);
    console.log(`Scenario SF bytecode inspection complete: ${outFile}`);
    console.log(`Selected SF refs: ${report.summary.selectedRefs}`);
    console.log(`Selected refs with bytecode: ${report.summary.selectedRefsWithBytecode}`);
    console.log(`Missing standalone symbols with bytecode: ${report.summary.selectedRefsMissingStandaloneSymbol}`);
    return;
  }

  if (args.command === "infer-scenario-damage-branches") {
    if (!args.file) {
      throw new Error("infer-scenario-damage-branches requires --file <scenario-sf-bytecode.json>");
    }
    const report = inferScenarioDamageBranchesFile(
      path.resolve(args.file),
      args.scenariosFile ? path.resolve(args.scenariosFile) : null
    );
    const outFile = path.join(args.outDir, "scenario-damage-branches.json");
    writeJson(outFile, report);
    console.log(`Scenario damage branch inference complete: ${outFile}`);
    console.log(`Scenario mappings: ${report.summary.scenarioMappings}`);
    console.log(`Blocked mappings: ${report.summary.blockedMappings}`);
    console.log(`Recommendations: ${JSON.stringify(report.summary.recommendationCounts)}`);
    return;
  }

  if (args.command === "build-branch-aware-dps-model") {
    if (!args.file) {
      throw new Error("build-branch-aware-dps-model requires --file <reviewed-dps-model.json>");
    }
    if (!args.scenarioDamageBranchesFile) {
      throw new Error("build-branch-aware-dps-model requires --scenario-damage-branches <scenario-damage-branches.json>");
    }
    const report = buildBranchAwareDpsModelFile(path.resolve(args.file), path.resolve(args.scenarioDamageBranchesFile));
    const outFile = path.join(args.outDir, "branch-aware-dps-model.json");
    writeJson(outFile, report);
    console.log(`Branch-aware DPS model complete: ${outFile}`);
    console.log(`Branch assets: ${report.comparison.branchAssets}`);
    console.log(`Applied scenario estimates: ${report.comparison.appliedScenarioEstimates}`);
    console.log(`Global delta: ${report.comparison.deltaDps}`);
    return;
  }

  if (args.command === "build-experimental-dps-model") {
    if (!args.file) {
      throw new Error("build-experimental-dps-model requires --file <minimal-dps-model.json>");
    }
    if (!args.auditFile) {
      throw new Error("build-experimental-dps-model requires --audit-file <dps-role-audit.json>");
    }
    const report = buildExperimentalDpsModelFile(path.resolve(args.file), path.resolve(args.auditFile), {
      includePriority: args.includePriority,
    });
    const outFile = path.join(args.outDir, "experimental-dps-model.json");
    writeJson(outFile, report);
    console.log(`Experimental DPS model complete: ${outFile}`);
    console.log(`Promoted formulas: ${report.comparison.promotedFormulas}`);
    console.log(`Strict total DPS: ${report.comparison.strictTotalEstimatedDps}`);
    console.log(`Experimental total DPS: ${report.comparison.experimentalTotalEstimatedDps}`);
    console.log(`Delta: ${report.comparison.deltaDps}`);
    return;
  }

  if (args.command === "compare-dps-models") {
    if (!args.file) {
      throw new Error("compare-dps-models requires --file <strict-minimal-dps-model.json>");
    }
    if (!args.experimentalFile) {
      throw new Error("compare-dps-models requires --experimental-file <experimental-dps-model.json>");
    }
    const report = compareDpsModelsFile(path.resolve(args.file), path.resolve(args.experimentalFile));
    const outFile = path.join(args.outDir, "dps-model-comparison.json");
    writeJson(outFile, report);
    console.log(`DPS model comparison complete: ${outFile}`);
    console.log(`Assets with promotions: ${report.summary.assetsWithPromotions}`);
    console.log(`Assets with DPS delta: ${report.summary.assetsWithDpsDelta}`);
    console.log(`Promoted without DPS impact: ${report.summary.promotedWithoutDpsImpact}`);
    return;
  }

  if (args.command === "inspect-dps-gaps") {
    if (!args.file) {
      throw new Error("inspect-dps-gaps requires --file <strict-minimal-dps-model.json>");
    }
    if (!args.comparisonFile) {
      throw new Error("inspect-dps-gaps requires --comparison-file <dps-model-comparison.json>");
    }
    if (!args.auditFile) {
      throw new Error("inspect-dps-gaps requires --audit-file <dps-role-audit.json>");
    }
    const report = inspectDpsGapsFile(
      path.resolve(args.file),
      path.resolve(args.comparisonFile),
      path.resolve(args.auditFile)
    );
    const outFile = path.join(args.outDir, "dps-gap-inspection.json");
    writeJson(outFile, report);
    console.log(`DPS gap inspection complete: ${outFile}`);
    console.log(`Gap assets: ${report.summary.gapAssets}`);
    console.log(`Total candidates: ${report.summary.totalCandidates}`);
    return;
  }

  if (args.command === "inspect-gap-context") {
    if (!args.gapFile) {
      throw new Error("inspect-gap-context requires --gap-file <dps-gap-inspection.json>");
    }
    if (!args.priorityInspection) {
      throw new Error("inspect-gap-context requires --priority-inspection <priority-asset-inspection.json>");
    }
    const report = inspectGapFormulaContextFile(path.resolve(args.gapFile), path.resolve(args.priorityInspection));
    const outFile = path.join(args.outDir, "dps-gap-context.json");
    writeJson(outFile, report);
    console.log(`DPS gap context inspection complete: ${outFile}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Likely primary damage: ${report.summary.likelyPrimaryDamage}`);
    console.log(`Likely secondary/display: ${report.summary.likelySecondaryScaling}`);
    return;
  }

  if (args.command === "inspect-promotion-risks") {
    if (!args.comparisonFile) {
      throw new Error("inspect-promotion-risks requires --comparison-file <dps-model-comparison.json>");
    }
    if (!args.graphsFile) {
      throw new Error("inspect-promotion-risks requires --graphs-file <formula-graphs.json>");
    }
    const report = inspectPromotionRisksFile(
      path.resolve(args.comparisonFile),
      path.resolve(args.graphsFile),
      args.priorityInspection ? path.resolve(args.priorityInspection) : null
    );
    const outFile = path.join(args.outDir, "promotion-risk-inspection.json");
    writeJson(outFile, report);
    console.log(`Promotion risk inspection complete: ${outFile}`);
    console.log(`Promotions: ${report.summary.promotions}`);
    console.log(`Risk counts: ${JSON.stringify(report.summary.riskCounts)}`);
    console.log(`Likely safe: ${report.summary.likelySafe}`);
    return;
  }

  if (args.command === "build-reviewed-dps-model") {
    if (!args.file) {
      throw new Error("build-reviewed-dps-model requires --file <strict-minimal-dps-model.json>");
    }
    if (!args.promotionRiskFile) {
      throw new Error("build-reviewed-dps-model requires --promotion-risk-file <promotion-risk-inspection.json>");
    }
    const report = buildReviewedDpsModelFile(path.resolve(args.file), path.resolve(args.promotionRiskFile));
    const outFile = path.join(args.outDir, "reviewed-dps-model.json");
    writeJson(outFile, report);
    console.log(`Reviewed DPS model complete: ${outFile}`);
    console.log(`Promoted formulas: ${report.comparison.promotedFormulas}`);
    console.log(`Strict total DPS: ${report.comparison.strictTotalEstimatedDps}`);
    console.log(`Reviewed total DPS: ${report.comparison.reviewedTotalEstimatedDps}`);
    console.log(`Delta: ${report.comparison.deltaDps}`);
    return;
  }

  if (args.command === "search-table-candidates") {
    if (!args.dataDir) {
      throw new Error("search-table-candidates requires --data-dir <path>");
    }
    const report = searchTableCandidatesDirectory(path.resolve(args.dataDir), {
      fileLimit: args.fileLimit,
      maxHits: args.maxHits,
      maxDecodeCompressedBytes: args.maxDecodeMb * 1024 * 1024,
      tableIds: args.tableIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "table-candidates.json");
    writeJson(outFile, report);
    console.log(`Table candidate search complete: ${outFile}`);
    console.log(`Decoded entries: ${report.summary.decodedDeadbeefEntries}`);
    console.log(`Candidates: ${report.summary.candidates}`);
    console.log(`Top scores: ${JSON.stringify(report.summary.topScores.slice(0, 5))}`);
    return;
  }

  if (args.command === "inspect-table-candidates") {
    if (!args.file) {
      throw new Error("inspect-table-candidates requires --file <table-candidates-strong.json>");
    }
    const report = inspectTableCandidatesFromFile(path.resolve(args.file), {
      assetIds: args.assetIds ?? undefined,
      tableIds: args.tableIds ?? undefined,
    });
    const outFile = path.join(args.outDir, "table-inspection.json");
    writeJson(outFile, report);
    console.log(`Table inspection complete: ${outFile}`);
    console.log(`Selected candidates: ${report.selected.length}`);
    for (const item of report.selected) {
      const strongest = item.inspection.summary.strongestRun;
      console.log(
        `Asset ${item.assetId}: runs=${item.inspection.summary.runs}, strongest=${strongest?.length ?? 0} floats, bestWidth=${strongest?.bestWidth ?? "n/a"}`
      );
    }
    return;
  }

  throw new Error(`Unknown command: ${args.command}`);
}

main();
