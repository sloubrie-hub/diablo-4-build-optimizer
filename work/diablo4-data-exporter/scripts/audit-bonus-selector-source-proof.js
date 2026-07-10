const fs = require("fs");
const path = require("path");

const selectorMatrixFile = process.argv[2] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json";
const namedTableAuditFile = process.argv[3] ?? "outputs/diablo4-hash-suffix-named-table-audit/hash-suffix-named-table-audit.json";
const localTableAuditFile = process.argv[4] ?? "outputs/diablo4-local-table-source-alternatives/local-table-source-alternatives.json";
const dictionaryScanFile = process.argv[5] ?? "outputs/diablo4-decoded-dictionary-string-scan/decoded-dictionary-string-scan.json";
const tableNumericContextsFile = process.argv[6] ?? "outputs/diablo4-sf32-table-numeric-contexts/sf32-table-numeric-contexts.json";
const additiveBucketSourceFile = process.argv[7] ?? "outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json";
const structuralFamilyFile = process.argv[8] ?? "outputs/diablo4-bonus-selector-structural-family/bonus-selector-structural-family.json";
const structuralCorpusFile = process.argv[9] ?? "outputs/diablo4-bonus-selector-structural-corpus/bonus-selector-structural-corpus.json";
const outDir = process.argv[10] ?? "outputs/diablo4-bonus-selector-source-proof";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value != null).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

function assessmentKind(report) {
  return report?.summary?.assessment?.kind ?? null;
}

function evidenceNumber(report, key, fallback = null) {
  return report?.summary?.assessment?.evidence?.[key] ?? report?.summary?.[key] ?? fallback;
}

const selectorMatrix = readOptionalJson(selectorMatrixFile);
const namedTableAudit = readOptionalJson(namedTableAuditFile);
const localTableAudit = readOptionalJson(localTableAuditFile);
const dictionaryScan = readOptionalJson(dictionaryScanFile);
const tableNumericContexts = readOptionalJson(tableNumericContextsFile);
const additiveBucketSource = readOptionalJson(additiveBucketSourceFile);
const structuralFamily = readOptionalJson(structuralFamilyFile);
const structuralCorpus = readOptionalJson(structuralCorpusFile);

const matrixGroups = selectorMatrix?.groups ?? [];
const matrixRows = selectorMatrix?.rows ?? [];
const selectorFamilies = matrixGroups.map((group) => {
  const selector = Number(group.selector);
  const rows = matrixRows.filter((row) => (row.selectors ?? []).map(Number).includes(selector));
  const assets = uniqueSorted([...(group.assets ?? []), ...rows.map((row) => row.assetId)]);
  const sourceNamed = false;
  const bucketFamily = "unknown";
  const classified = false;
  const blockers = [
    "selector-source-table-not-named",
    "selector-bucket-family-unclassified",
    selector === 949 ? "selector-949-layout-local-or-divergent" : null,
    selector === 994 ? "selector-994-has-repetition-but-no-family-name" : null,
  ].filter(Boolean);

  return {
    selector,
    assets,
    assetCount: assets.length,
    classHints: group.classHints ?? {},
    observedFamilies: group.families ?? {},
    metadataIds: group.metadataIds ?? {},
    examples: (group.examples ?? []).slice(0, 3),
    sourceNamed,
    bucketFamily,
    classified,
    ready: sourceNamed && classified,
    blockers,
  };
});

const readyFamilies = selectorFamilies.filter((family) => family.ready);
const blockedFamilies = selectorFamilies.filter((family) => !family.ready);
const sourceSignals = {
  namedTable: {
    assessment: assessmentKind(namedTableAudit),
    independentCandidates: evidenceNumber(namedTableAudit, "independentCandidates", 0),
    generatedContexts: evidenceNumber(namedTableAudit, "generatedContexts", 0),
    numericNoise: evidenceNumber(namedTableAudit, "numericNoise", 0),
  },
  localTableAlternatives: {
    assessment: assessmentKind(localTableAudit),
    independentTableCandidates: evidenceNumber(localTableAudit, "independentTableCandidates", 0),
    dictionaryNearWatched: evidenceNumber(localTableAudit, "dictionaryNearWatched", 0),
    usefulTableCandidateContexts: evidenceNumber(localTableAudit, "usefulTableCandidateContexts", 0),
    exactNumericContexts: evidenceNumber(localTableAudit, "exactNumericContexts", 0),
  },
  decodedDictionary: {
    assessment: assessmentKind(dictionaryScan),
    dictionaryHits: dictionaryScan?.summary?.dictionaryHits ?? null,
    dictionaryHitsNearWatchedNumbers: dictionaryScan?.summary?.dictionaryHitsNearWatchedNumbers ?? null,
    bonusPercentHits: dictionaryScan?.summary?.bonusPercentHits ?? null,
  },
  tableNumericContexts: {
    assessment: assessmentKind(tableNumericContexts),
    exact949Contexts: tableNumericContexts?.summary?.exact949Contexts ?? null,
    exact12337Contexts: tableNumericContexts?.summary?.exact12337Contexts ?? null,
    usefulContexts: tableNumericContexts?.summary?.usefulContexts ?? null,
    potentialSourceContexts: tableNumericContexts?.summary?.potentialSourceContexts ?? null,
  },
  structuralFamily: {
    assessment: assessmentKind(structuralFamily),
    samples: structuralFamily?.summary?.samples ?? null,
    strongStructuralCandidates: structuralFamily?.summary?.strongStructuralCandidates ?? null,
    selectorSpecificWindowSignatures: structuralFamily?.summary?.selectorSpecificWindowSignatures ?? null,
    sourceProofReady: structuralFamily?.summary?.sourceProofReady === true,
    promotionReady: structuralFamily?.summary?.promotionReady === true,
  },
  structuralCorpus: {
    assessment: assessmentKind(structuralCorpus),
    matches: structuralCorpus?.summary?.matches ?? null,
    exactMatches: structuralCorpus?.summary?.exactMatches ?? null,
    newExactAssets: structuralCorpus?.summary?.newExactAssets ?? [],
    exactMatchesWithSelectorAnchors: structuralCorpus?.summary?.exactMatchesWithSelectorAnchors ?? null,
    newExactAssetsWithSelectorAnchors: structuralCorpus?.summary?.newExactAssetsWithSelectorAnchors ?? [],
    sourceNamedMatches: structuralCorpus?.summary?.sourceNamedMatches ?? null,
    sourceProofReady: structuralCorpus?.summary?.sourceProofReady === true,
    promotionReady: structuralCorpus?.summary?.promotionReady === true,
  },
};

const sourceNamed =
  Number(sourceSignals.namedTable.independentCandidates || 0) > 0 ||
  Number(sourceSignals.localTableAlternatives.independentTableCandidates || 0) > 0 ||
  Number(sourceSignals.localTableAlternatives.usefulTableCandidateContexts || 0) > 0 ||
  Number(sourceSignals.tableNumericContexts.potentialSourceContexts || 0) > 0 ||
  Number(sourceSignals.decodedDictionary.dictionaryHitsNearWatchedNumbers || 0) > 0 ||
  Number(sourceSignals.structuralCorpus.sourceNamedMatches || 0) > 0;

const selectorFamiliesClassified = readyFamilies.length;
const assessment = sourceNamed && readyFamilies.length === selectorFamilies.length
  ? {
      kind: "bonus-selector-source-proof-ready",
      confidence: "medium",
      promotionReady: true,
      blocker: null,
      finding: "Chaque selecteur Bonus_Percent_Per_Power dispose d'une source nommee et d'une famille bucket classifiee.",
      nextAction: "Relier les familles classifiees au moteur buckets et verifier la parite DPS.",
    }
  : {
      kind: "bonus-selector-source-proof-not-found",
      confidence: "high",
      promotionReady: false,
      blocker: "selector-source-proof-missing",
      finding: "Les selecteurs 949/994 sont observes, mais aucune source nommee ne prouve leur famille additive ou multiplicative.",
      nextAction: "Chercher une table source nommee ou decoder un champ proprietaire qui distingue les familles de buckets avant toute promotion DPS.",
    };

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bonus-selector-source-proof-v1",
  source: {
    selectorMatrixFile: selectorMatrix ? selectorMatrixFile : null,
    namedTableAuditFile: namedTableAudit ? namedTableAuditFile : null,
    localTableAuditFile: localTableAudit ? localTableAuditFile : null,
    dictionaryScanFile: dictionaryScan ? dictionaryScanFile : null,
    tableNumericContextsFile: tableNumericContexts ? tableNumericContextsFile : null,
    additiveBucketSourceFile: additiveBucketSource ? additiveBucketSourceFile : null,
    structuralFamilyFile: structuralFamily ? structuralFamilyFile : null,
    structuralCorpusFile: structuralCorpus ? structuralCorpusFile : null,
  },
  summary: {
    selectorsObserved: selectorFamilies.length,
    sourceNamed,
    selectorFamiliesClassified,
    readyFamilies: readyFamilies.length,
    blockedFamilies: blockedFamilies.length,
    additiveBucketReady: false,
    structuralFamilyAssessment: sourceSignals.structuralFamily.assessment,
    strongStructuralCandidates: sourceSignals.structuralFamily.strongStructuralCandidates,
    selectorSpecificWindowSignatures: sourceSignals.structuralFamily.selectorSpecificWindowSignatures,
    structuralCorpusAssessment: sourceSignals.structuralCorpus.assessment,
    structuralCorpusMatches: sourceSignals.structuralCorpus.matches,
    structuralCorpusExactMatches: sourceSignals.structuralCorpus.exactMatches,
    structuralCorpusNewExactAssets: sourceSignals.structuralCorpus.newExactAssets,
    structuralCorpusExactMatchesWithSelectorAnchors: sourceSignals.structuralCorpus.exactMatchesWithSelectorAnchors,
    structuralCorpusNewExactAssetsWithSelectorAnchors: sourceSignals.structuralCorpus.newExactAssetsWithSelectorAnchors,
    structuralCorpusSourceNamedMatches: sourceSignals.structuralCorpus.sourceNamedMatches,
    promotionReady: assessment.promotionReady,
    matrixAssessment: assessmentKind(selectorMatrix),
    additiveSourceAssessment: assessmentKind(additiveBucketSource),
    nextSelector: blockedFamilies[0]?.selector ?? null,
    assessment,
  },
  selectorFamilies,
  sourceSignals,
  safeguards: [
    "Un selecteur observe ne prouve pas la famille de bucket.",
    "La repetition du selector 994 ne suffit pas a le classer additif.",
    "Le compact selector 949/metadata 12337/scale 10 reste un candidat local tant que la source n'est pas nommee.",
    "Aucune famille non classifiee ne doit alimenter reliableDps.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bonus-selector-source-proof.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
