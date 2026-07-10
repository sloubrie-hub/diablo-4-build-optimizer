const fs = require("fs");
const path = require("path");

const ownerFieldsFile = process.argv[2] ?? "outputs/diablo4-selector-asset-owner-fields/selector-asset-owner-fields.json";
const bonusCoverageFile = process.argv[3] ?? "outputs/diablo4-bonus-percent-coverage-audit/bonus-percent-coverage-audit.json";
const localTableFile = process.argv[4] ?? "outputs/diablo4-local-table-source-alternatives/local-table-source-alternatives.json";
const metadataCorpusFile = process.argv[5] ?? "outputs/diablo4-metadata-12337-scale-corpus/metadata-12337-scale-corpus-scan.json";
const freshnessFile = process.argv[6] ?? "outputs/diablo4-record-header-source-freshness-audit/record-header-source-freshness-audit.json";
const compactAnalogyFile = process.argv[7] ?? "outputs/diablo4-sf32-compact-selector-analogy/sf32-compact-selector-analogy.json";
const tableNumericContextsFile = process.argv[8] ?? "outputs/diablo4-sf32-table-numeric-contexts/sf32-table-numeric-contexts.json";
const outDir = process.argv[9] ?? "outputs/diablo4-sf32-field-promotion-decision";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assessment(report) {
  return report?.summary?.assessment ?? report?.summary ?? null;
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

const ownerFields = readJson(ownerFieldsFile);
const bonusCoverage = readJson(bonusCoverageFile);
const localTable = readJson(localTableFile);
const metadataCorpus = readJson(metadataCorpusFile);
const freshness = readJson(freshnessFile);
const compactAnalogy = readOptionalJson(compactAnalogyFile);
const tableNumericContexts = readOptionalJson(tableNumericContextsFile);

const ownerAssessment = assessment(ownerFields);
const coverageAssessment = assessment(bonusCoverage);
const tableAssessment = assessment(localTable);
const metadataAssessment = assessment(metadataCorpus);
const compactAnalogyAssessment = assessment(compactAnalogy);
const tableNumericContextsAssessment = assessment(tableNumericContexts);
const freshnessSummary = freshness.summary ?? {};

const hasMixedSelector949Layouts = (ownerFields.summary?.selector949Layouts ?? 0) > 1;
const hasSecondCompact949 = (bonusCoverage.summary?.secondCompact949Assets ?? 0) > 0 || (localTable.summary?.secondCompact949Assets ?? 0) > 0;
const hasLocalTableSource = (localTable.summary?.independentTableCandidates ?? 0) > 0 || (localTable.summary?.usefulTableCandidateContexts ?? 0) > 0;
const metadataCrossSelector = Object.keys(metadataCorpus.summary?.selectorCounts ?? {}).filter((key) => key !== "none").length > 1;
const staleSourceLinks = (freshnessSummary.staleOffsets ?? 0) > 0 && (freshnessSummary.freshMatches ?? 0) === 0;
const compactAnalogyCrossSelector = compactAnalogy?.summary?.assessment?.evidence?.hasCrossSelectorCompact === true;
const tableNumericContextsNoProof = tableNumericContexts?.summary?.assessment?.kind === "sf32-table-numeric-contexts-no-source-proof";
const promotionReady = false;

const blockers = [
  hasMixedSelector949Layouts ? "selector-949-mixed-layout" : null,
  !hasSecondCompact949 ? "second-compact-selector-949-missing" : null,
  metadataCrossSelector ? "metadata-12337-scale-10-cross-selector" : null,
  !hasLocalTableSource ? "local-table-source-missing" : null,
  staleSourceLinks ? "record-header-source-links-stale" : null,
  compactAnalogyCrossSelector ? "compact-layout-cross-selector-not-owner-proof" : null,
  tableNumericContextsNoProof ? "table-numeric-contexts-not-source-proof" : null,
].filter(Boolean);

const promotionGates = [
  {
    id: "single-selector-layout",
    label: "selector 949 has a single field layout",
    status: hasMixedSelector949Layouts ? "failed" : "passed",
    blocker: hasMixedSelector949Layouts ? "selector-949-mixed-layout" : null,
    evidence: {
      selector949Layouts: ownerFields.summary?.selector949Layouts ?? 0,
      layoutIds: ownerAssessment?.evidence?.selector949LayoutIds ?? [],
    },
  },
  {
    id: "second-compact-proof",
    label: "a second compact selector 949 proof exists outside the target asset",
    status: hasSecondCompact949 ? "passed" : "failed",
    blocker: hasSecondCompact949 ? null : "second-compact-selector-949-missing",
    evidence: {
      secondCompact949Assets: bonusCoverage.summary?.secondCompact949Assets ?? 0,
      compactAssetCandidates: ownerAssessment?.evidence?.compactAssetCandidates ?? [],
    },
  },
  {
    id: "metadata-selector-specificity",
    label: "metadata 12337 / scale 10 is specific to selector 949",
    status: metadataCrossSelector ? "failed" : "passed",
    blocker: metadataCrossSelector ? "metadata-12337-scale-10-cross-selector" : null,
    evidence: {
      selectorCounts: metadataCorpus.summary?.selectorCounts ?? {},
      compactAnalogy: compactAnalogyAssessment?.kind ?? null,
    },
  },
  {
    id: "named-source-table",
    label: "a named source table or dictionary maps the field",
    status: hasLocalTableSource ? "passed" : "failed",
    blocker: hasLocalTableSource ? null : "local-table-source-missing",
    evidence: {
      independentTableCandidates: localTable.summary?.independentTableCandidates ?? 0,
      usefulTableCandidateContexts: localTable.summary?.usefulTableCandidateContexts ?? 0,
      exactNumericContexts: localTable.summary?.exactNumericContexts ?? 0,
      tableNumericContextsAssessment: tableNumericContextsAssessment?.kind ?? null,
      tableNumericUsefulContexts: tableNumericContexts?.summary?.usefulContexts ?? null,
    },
  },
  {
    id: "fresh-record-source-links",
    label: "record header/source links are fresh for the current install",
    status: staleSourceLinks ? "failed" : "passed",
    blocker: staleSourceLinks ? "record-header-source-links-stale" : null,
    evidence: {
      staleOffsets: freshnessSummary.staleOffsets ?? 0,
      freshMatches: freshnessSummary.freshMatches ?? 0,
    },
  },
];

const failedGates = promotionGates.filter((gate) => gate.status !== "passed");
const optimizerPolicy = {
  reliableDps: "strict-only",
  candidateDelta: "blocked-what-if",
  canUseForRanking: false,
  canExposeAsScenario: true,
  requiredBeforePromotion: failedGates.map((gate) => gate.id),
};

const assessmentResult = {
  kind: "sf32-field-promotion-blocked-by-selector-949-evidence",
  confidence: blockers.length >= 4 ? "high" : "medium-high",
  fieldOwnership: "not-proven",
  blocker: "field-level-parser-required",
  promotionReady,
  finding: "Le champ candidat SF_32 reste non promouvable: selector 949 est en layouts mixtes, aucun second compact 949 n'est confirme, metadata 12337/scale 10 est transverse, et aucune table source locale n'est trouvee.",
  nextAction: "Chercher une table source nommee ou une preuve compacte externe de selector 949; sinon garder le delta what-if bloque et passer au moteur de buckets sans promotion DPS.",
  evidence: {
    selector949Layouts: ownerFields.summary?.selector949Layouts ?? 0,
    selector949BlockedLayouts: ownerFields.summary?.selector949BlockedLayouts ?? 0,
    selector949LayoutIds: ownerAssessment?.evidence?.selector949LayoutIds ?? [],
    compactAssetCandidates: ownerAssessment?.evidence?.compactAssetCandidates ?? [],
    variantAssetCandidates: ownerAssessment?.evidence?.variantAssetCandidates ?? [],
    externalBonusAssets: bonusCoverage.summary?.externalAssets ?? 0,
    decodedBonusAssets: bonusCoverage.summary?.decodedAssets ?? 0,
    selector949Assets: bonusCoverage.summary?.selector949Assets ?? 0,
    secondCompact949Assets: bonusCoverage.summary?.secondCompact949Assets ?? 0,
    independentTableCandidates: localTable.summary?.independentTableCandidates ?? 0,
    dictionaryNearWatched: localTable.summary?.dictionaryNearWatched ?? 0,
    usefulTableCandidateContexts: localTable.summary?.usefulTableCandidateContexts ?? 0,
    metadata12337Hits: metadataCorpus.summary?.hits ?? 0,
    metadata12337SelectorCounts: metadataCorpus.summary?.selectorCounts ?? {},
    staleOffsets: freshnessSummary.staleOffsets ?? 0,
    freshMatches: freshnessSummary.freshMatches ?? 0,
    compactAnalogyAssessment: compactAnalogyAssessment?.kind ?? null,
    compactAnalogySelectors: compactAnalogy?.summary?.compactSelectors ?? [],
    compactAnalogyAssets: compactAnalogy?.summary?.compactAssets ?? [],
    compactAnalogyCrossSelector,
    tableNumericContextsAssessment: tableNumericContextsAssessment?.kind ?? null,
    tableNumericExactIntegerHits: tableNumericContexts?.summary?.exactIntegerHits ?? null,
    tableNumericExactStringHits: tableNumericContexts?.summary?.exactStringHits ?? null,
    tableNumericUsefulContexts: tableNumericContexts?.summary?.usefulContexts ?? null,
    tableNumericPotentialSourceContexts: tableNumericContexts?.summary?.potentialSourceContexts ?? null,
    blockers,
    gatesPassed: promotionGates.length - failedGates.length,
    gatesFailed: failedGates.length,
    failedGateIds: failedGates.map((gate) => gate.id),
    sourceAssessments: {
      ownerFields: ownerAssessment?.kind ?? null,
      bonusCoverage: coverageAssessment?.kind ?? null,
      localTable: tableAssessment?.kind ?? null,
      metadataCorpus: metadataAssessment?.kind ?? null,
      compactAnalogy: compactAnalogyAssessment?.kind ?? null,
      tableNumericContexts: tableNumericContextsAssessment?.kind ?? null,
      freshness: freshnessSummary.assessment ?? null,
    },
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-field-promotion-decision-v1",
  source: {
    ownerFieldsFile,
    bonusCoverageFile,
    localTableFile,
    metadataCorpusFile,
    freshnessFile,
    compactAnalogyFile: compactAnalogy ? compactAnalogyFile : null,
    tableNumericContextsFile: tableNumericContexts ? tableNumericContextsFile : null,
  },
  summary: {
    targetAssetId: 1663210,
    targetField: "SF_32",
    targetSelector: 949,
    metadataId: 12337,
    scale: 10,
    blockers,
    promotionGates,
    optimizerPolicy,
    promotionReady,
    assessment: assessmentResult,
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf32-field-promotion-decision.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
