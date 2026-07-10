const fs = require("fs");
const path = require("path");

const layoutParserFile = process.argv[2] ?? "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json";
const selectorMatrixFile = process.argv[3] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json";
const metadataCorpusFile = process.argv[4] ?? "outputs/diablo4-metadata-12337-scale-corpus/metadata-12337-scale-corpus-scan.json";
const outDir = process.argv[5] ?? "outputs/diablo4-sf32-compact-selector-analogy";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((value) => value != null))).sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
}

const layoutParser = readJson(layoutParserFile);
const selectorMatrix = readJson(selectorMatrixFile);
const metadataCorpus = readJson(metadataCorpusFile);

const compactLayout = (layoutParser.layouts ?? []).find((layout) => layout.layoutId === "compact-metadata-scale-layout");
const compactGroups = compactLayout?.groups ?? [];
const selectorGroups = selectorMatrix.groups ?? [];
const metadataSelectorCounts = metadataCorpus.summary?.selectorCounts ?? {};

const selectorRows = compactGroups.map((group) => {
  const matrixGroup = selectorGroups.find((row) => Number(row.selector) === Number(group.selector));
  return {
    selector: group.selector,
    shape: group.shape,
    family: group.family,
    count: group.count,
    assetCandidates: group.assetCandidates ?? [],
    matrixFamilies: matrixGroup?.families ?? {},
    matrixClassHints: matrixGroup?.classHints ?? {},
    metadata12337Count: Number(metadataSelectorCounts[String(group.selector)] ?? 0),
    examples: (group.examples ?? []).map((example) => ({
      assetCandidate: example.assetCandidate,
      offset: example.offset,
      nearbyStrings: example.nearbyStrings ?? [],
    })),
  };
});

const compactSelectors = uniqueSorted(selectorRows.map((row) => Number(row.selector)));
const compactAssets = uniqueSorted(selectorRows.flatMap((row) => row.assetCandidates ?? []));
const selector949 = selectorRows.find((row) => Number(row.selector) === 949);
const hasCrossSelectorCompact = compactSelectors.length > 1;
const hasSecondSelector949Compact = (selector949?.count ?? 0) > 1;
const hasMetadataCrossSelector = Object.entries(metadataSelectorCounts)
  .filter(([selector, count]) => selector !== "none" && Number(count) > 0)
  .length > 1;

const assessment = {
  kind: hasCrossSelectorCompact
    ? "compact-layout-analogy-cross-selector-not-owner-proof"
    : "compact-layout-analogy-selector-local-only",
  confidence: hasCrossSelectorCompact ? "high" : "medium-high",
  fieldOwnership: "not-proven",
  blocker: "field-level-parser-required",
  promotionReady: false,
  finding: hasCrossSelectorCompact
    ? "Le layout compact metadata/scale existe pour plusieurs selecteurs; il prouve une forme de record, pas l'ownership specifique de SF_32/selector 949."
    : "Le layout compact reste local au selector 949; sans repetition externe ou table source, l'ownership reste non prouve.",
  nextAction: hasSecondSelector949Compact
    ? "Comparer les deux compacts selector 949 et chercher une table source nommee avant promotion."
    : "Chercher une seconde preuve compacte selector 949 ou une table source nommee; ne pas utiliser l'analogie selector 997 comme promotion.",
  evidence: {
    compactSelectors,
    compactAssets,
    selector949CompactCount: selector949?.count ?? 0,
    hasSecondSelector949Compact,
    hasCrossSelectorCompact,
    hasMetadataCrossSelector,
    metadataSelectorCounts,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-compact-selector-analogy-v1",
  source: {
    layoutParserFile,
    selectorMatrixFile,
    metadataCorpusFile,
  },
  summary: {
    targetAssetId: 1663210,
    targetField: "SF_32",
    targetSelector: 949,
    compactLayoutId: compactLayout?.layoutId ?? null,
    compactSelectors,
    compactAssets,
    selector949CompactCount: selector949?.count ?? 0,
    promotionReady: false,
    assessment,
  },
  selectorRows,
  safeguards: [
    "Ne pas promouvoir SF_32 par analogie avec selector 997.",
    "Ne pas traiter metadata 12337 / scale 10 comme specifique a selector 949 tant que le corpus montre des selecteurs multiples.",
    "Utiliser le compact cross-selector pour documenter le layout, pas pour le DPS fiable.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf32-compact-selector-analogy.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
