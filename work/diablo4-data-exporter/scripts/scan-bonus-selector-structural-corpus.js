const fs = require("fs");
const path = require("path");

const structuralFamilyFile = process.argv[2] ?? "outputs/diablo4-bonus-selector-structural-family/bonus-selector-structural-family.json";
const rootDir = process.argv[3] ?? "outputs";
const outDir = process.argv[4] ?? "outputs/diablo4-bonus-selector-structural-corpus";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listDecodedBins(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDecodedBins(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function readU32(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  return buffer.readUInt32LE(offset);
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value != null).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

function assetIdFromPath(filePath) {
  const match = String(filePath).match(/diablo4-source-asset-(\d+)-payload/i);
  return match ? Number(match[1]) : null;
}

function extractStrings(buffer, minLength = 4) {
  return buffer
    .toString("latin1")
    .split(/[^\x20-\x7e]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= minLength);
}

function sourceLikeStrings(strings) {
  return strings.filter((value) => (
    /bucket|additive|multiplicative|damage|bonus|power|modifier|affix|formula|sf_|selector|source|scale|coefficient/i.test(value)
  )).slice(0, 40);
}

function selectorAnchorHits(buffer, selectors) {
  const hits = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    const value = readU32(buffer, offset);
    if (selectors.includes(value)) {
      hits.push({
        offset,
        selector: value,
        previousWords: [-16, -12, -8, -4].map((distance) => readU32(buffer, offset + distance)),
        nextWords: [4, 8, 12, 16, 20, 24].map((distance) => readU32(buffer, offset + distance)),
      });
    }
  }
  return hits;
}

function buildSignatures(report) {
  const candidateRows = (report.topFixedOffsetCandidates ?? []).filter((row) => row.candidate);
  const bySelector = new Map();
  for (const row of candidateRows) {
    for (const group of row.selectorGroups ?? []) {
      if (!group.stable || group.distinct?.length !== 1) continue;
      if (!bySelector.has(group.selector)) bySelector.set(group.selector, []);
      bySelector.get(group.selector).push({
        offset: row.offset,
        value: group.distinct[0],
      });
    }
  }

  return Array.from(bySelector.entries()).map(([selector, words]) => ({
    selector: Number(selector),
    words: words.sort((a, b) => a.offset - b.offset),
  }));
}

function matchSignature(buffer, signature) {
  const words = signature.words.filter((word) => word.offset + 4 <= buffer.length);
  if (!words.length) {
    return {
      selector: signature.selector,
      comparableWords: 0,
      matchingWords: 0,
      matchRatio: 0,
      exact: false,
      mismatches: signature.words.slice(0, 8),
    };
  }

  const mismatches = [];
  let matchingWords = 0;
  for (const word of words) {
    const observed = readU32(buffer, word.offset);
    if (observed === word.value) {
      matchingWords += 1;
    } else if (mismatches.length < 8) {
      mismatches.push({
        offset: word.offset,
        expected: word.value,
        observed,
      });
    }
  }

  return {
    selector: signature.selector,
    comparableWords: words.length,
    matchingWords,
    matchRatio: Number((matchingWords / words.length).toFixed(4)),
    exact: matchingWords === words.length,
    mismatches,
  };
}

const structuralFamily = readJson(structuralFamilyFile);
const signatures = buildSignatures(structuralFamily);
const files = listDecodedBins(rootDir);
const selectors = signatures.map((signature) => signature.selector);
const knownAssets = uniqueSorted((structuralFamily.samples ?? []).map((sample) => sample.assetId));
const matches = [];

for (const file of files) {
  const buffer = fs.readFileSync(file);
  const signatureMatches = signatures.map((signature) => matchSignature(buffer, signature));
  const best = signatureMatches.slice().sort((a, b) => b.matchRatio - a.matchRatio || b.matchingWords - a.matchingWords)[0] ?? null;
  if (!best || best.matchRatio < 0.75) continue;

  const strings = extractStrings(buffer);
  const assetId = assetIdFromPath(file);
  const exactSelectors = signatureMatches.filter((row) => row.exact).map((row) => row.selector);
  matches.push({
    file,
    assetId,
    decodedBytes: buffer.length,
    knownStructuralAsset: knownAssets.includes(Number(assetId)),
    bestSelector: best.selector,
    bestMatchRatio: best.matchRatio,
    exactSelectors,
    signatureMatches,
    bonusStrings: strings.filter((value) => /Bonus_Percent_Per_Power/i.test(value)).slice(0, 12),
    sourceLikeStrings: sourceLikeStrings(strings),
    selectorAnchorHits: selectorAnchorHits(buffer, selectors).slice(0, 20),
  });
}

const exactMatches = matches.filter((match) => match.exactSelectors.length > 0);
const newExactAssets = uniqueSorted(exactMatches.map((match) => match.assetId).filter((assetId) => !knownAssets.includes(assetId)));
const exactMatchesWithSelectorAnchors = exactMatches.filter((match) => match.selectorAnchorHits.length > 0);
const newExactAssetsWithSelectorAnchors = uniqueSorted(exactMatchesWithSelectorAnchors
  .map((match) => match.assetId)
  .filter((assetId) => !knownAssets.includes(assetId)));
const sourceNamedMatches = matches.filter((match) => match.sourceLikeStrings.some((value) => /additive|multiplicative|bucket/i.test(value)));
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bonus-selector-structural-corpus-scan-v1",
  source: {
    structuralFamilyFile,
    rootDir,
    knownAssets,
  },
  summary: {
    filesScanned: files.length,
    signatures: signatures.length,
    signatureWords: Object.fromEntries(signatures.map((signature) => [String(signature.selector), signature.words.length])),
    matches: matches.length,
    exactMatches: exactMatches.length,
    knownExactMatches: exactMatches.filter((match) => match.knownStructuralAsset).length,
    newExactAssets,
    exactMatchesWithSelectorAnchors: exactMatchesWithSelectorAnchors.length,
    newExactAssetsWithSelectorAnchors,
    sourceNamedMatches: sourceNamedMatches.length,
    promotionReady: false,
    sourceProofReady: false,
    assessment: {
      kind: newExactAssets.length > 0
        ? newExactAssetsWithSelectorAnchors.length > 0
          ? "bonus-selector-structural-corpus-has-new-anchored-peers"
          : "bonus-selector-structural-corpus-has-layout-only-peers"
        : exactMatches.length > 0
          ? "bonus-selector-structural-corpus-known-layout-only"
          : "bonus-selector-structural-corpus-no-exact-peers",
      confidence: matches.length ? "medium-high" : "medium",
      blocker: "selector-source-proof-missing",
      finding: newExactAssets.length > 0
        ? newExactAssetsWithSelectorAnchors.length > 0
          ? "Les empreintes structurelles retrouvent de nouveaux peers avec ancres, mais aucun ne nomme la famille de bucket."
          : "Les empreintes structurelles retrouvent de nouveaux peers de layout, mais sans ancres selecteur et sans famille de bucket nommee."
        : "Les empreintes structurelles ne trouvent pas de source nommee ni de peer exact exploitable hors corpus connu.",
      nextAction: "Si des peers nouveaux existent, les decoder/inspecter comme corpus elargi; sinon chercher une table source hors empreinte fixe.",
    },
  },
  signatures,
  matches: matches
    .sort((a, b) => b.bestMatchRatio - a.bestMatchRatio || Number(a.assetId ?? 0) - Number(b.assetId ?? 0))
    .slice(0, 80),
  safeguards: [
    "Une empreinte fixe peut identifier un layout, pas une semantique de bucket.",
    "Les chaines contenant Bonus_Percent_Per_Power restent non promouvables sans champ source nomme.",
    "Aucun match structurel ne doit alimenter reliableDps avant classification additive/multiplicative prouvee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bonus-selector-structural-corpus.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
