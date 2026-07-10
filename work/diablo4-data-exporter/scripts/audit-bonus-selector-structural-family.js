const fs = require("fs");
const path = require("path");

const selectorMatrixFile = process.argv[2] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json";
const outDir = process.argv[3] ?? "outputs/diablo4-bonus-selector-structural-family";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readU32(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  return buffer.readUInt32LE(offset);
}

function readF32(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  const value = buffer.readFloatLE(offset);
  return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
}

function unique(values) {
  return Array.from(new Set(values.filter((value) => value != null)));
}

function uniqueSortedNumbers(values) {
  return unique(values.map(Number).filter(Number.isFinite)).sort((a, b) => a - b);
}

function decodedPathFor(row) {
  const assetId = Number(row.assetId);
  const fileName = row.fileName;
  const blteOffset = row.blteOffset;
  const expected = path.join(
    "outputs",
    `diablo4-source-asset-${assetId}-payload`,
    `${fileName}.${blteOffset}.decoded.bin`
  );
  if (fs.existsSync(expected)) return expected;

  const payloadDir = path.join("outputs", `diablo4-source-asset-${assetId}-payload`);
  if (!fs.existsSync(payloadDir)) return null;
  const hit = fs.readdirSync(payloadDir).find((name) => name.endsWith(".decoded.bin"));
  return hit ? path.join(payloadDir, hit) : null;
}

function anchorRows(row) {
  return (row.anchors ?? []).map((anchor) => ({
    offset: Number(anchor.offset),
    selector: Number(anchor.selector),
    target: anchor.normalizedTarget ?? anchor.previousString ?? null,
    previousString: anchor.previousString ?? null,
    family: anchor.family ?? null,
    classHint: anchor.classHint ?? null,
    metadataId: anchor.metadataId ?? null,
    metadataFloat: anchor.metadataFloat ?? null,
    metadataEncoding: anchor.metadataEncoding ?? null,
  })).filter((anchor) => Number.isFinite(anchor.offset) && Number.isFinite(anchor.selector));
}

function wordWindow(buffer, centerOffset) {
  return [-48, -44, -40, -36, -32, -28, -24, -20, -16, -12, -8, -4, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48]
    .map((distance) => ({
      distance,
      u32: readU32(buffer, centerOffset + distance),
      f32: readF32(buffer, centerOffset + distance),
    }));
}

function signatureFromWindow(window, distances) {
  return distances.map((distance) => {
    const word = window.find((entry) => entry.distance === distance);
    return word?.u32 ?? "";
  }).join("|");
}

function analyzeFixedOffsets(samples) {
  const rows = [];
  for (let offset = 0; offset <= 512; offset += 4) {
    const selectors = Array.from(new Set(samples.map((sample) => sample.selector))).sort((a, b) => a - b);
    const selectorGroups = selectors.map((selector) => {
      const values = samples
        .filter((sample) => sample.selector === selector)
        .map((sample) => readU32(sample.buffer, offset));
      const distinct = unique(values);
      return {
        selector,
        samples: values.length,
        distinct,
        stable: values.length >= 2 && distinct.length === 1,
      };
    });

    const stableGroups = selectorGroups.filter((group) => group.stable);
    const stableValues = unique(stableGroups.map((group) => group.distinct[0]));
    const separatesSelectors = stableGroups.length >= 2 && stableValues.length >= 2;
    const usefulValue = stableValues.some((value) => Number.isInteger(value) && value > 0 && value < 10000000);
    const candidateScore = stableGroups.length * 10 + stableValues.length * 8 + (separatesSelectors ? 30 : 0) + (usefulValue ? 10 : 0);

    if (candidateScore > 0) {
      rows.push({
        offset,
        stableGroups: stableGroups.length,
        stableValues,
        separatesSelectors,
        usefulValue,
        candidateScore,
        candidate: separatesSelectors && usefulValue,
        selectorGroups,
      });
    }
  }
  return rows.sort((a, b) => b.candidateScore - a.candidateScore || a.offset - b.offset);
}

function analyzeAnchorWindows(samples) {
  const signatures = new Map();
  for (const sample of samples) {
    const signature = signatureFromWindow(sample.window, [-24, -20, -16, -12, -8, -4]);
    if (!signatures.has(signature)) {
      signatures.set(signature, {
        signature,
        hits: 0,
        selectors: new Set(),
        assets: new Set(),
        families: new Set(),
        examples: [],
      });
    }
    const entry = signatures.get(signature);
    entry.hits += 1;
    entry.selectors.add(sample.selector);
    entry.assets.add(sample.assetId);
    entry.families.add(sample.family);
    if (entry.examples.length < 6) {
      entry.examples.push({
        assetId: sample.assetId,
        selector: sample.selector,
        family: sample.family,
        classHint: sample.classHint,
        target: sample.target,
        anchorOffset: sample.anchorOffset,
      });
    }
  }

  return Array.from(signatures.values())
    .map((entry) => ({
      signature: entry.signature,
      hits: entry.hits,
      selectors: Array.from(entry.selectors).sort((a, b) => a - b),
      assets: Array.from(entry.assets).sort((a, b) => a - b),
      families: Array.from(entry.families).filter(Boolean).sort(),
      examples: entry.examples,
    }))
    .sort((a, b) => b.hits - a.hits || b.selectors.length - a.selectors.length);
}

const matrix = readJson(selectorMatrixFile);
const samples = [];
const missingDecodedAssets = [];

for (const row of matrix.rows ?? []) {
  const decodedPath = decodedPathFor(row);
  const anchors = anchorRows(row);
  if (!decodedPath || anchors.length === 0) {
    if (!decodedPath) missingDecodedAssets.push(Number(row.assetId));
    continue;
  }

  const buffer = fs.readFileSync(decodedPath);
  for (const anchor of anchors) {
    samples.push({
      assetId: Number(row.assetId),
      fileName: row.fileName,
      blteOffset: row.blteOffset,
      decodedPath,
      decodedBytes: buffer.length,
      selector: anchor.selector,
      family: anchor.family,
      classHint: anchor.classHint,
      metadataId: anchor.metadataId,
      metadataFloat: anchor.metadataFloat,
      metadataEncoding: anchor.metadataEncoding,
      target: anchor.target,
      anchorOffset: anchor.offset,
      window: wordWindow(buffer, anchor.offset),
      buffer,
    });
  }
}

const selectors = uniqueSortedNumbers(samples.map((sample) => sample.selector));
const families = selectors.map((selector) => {
  const rows = samples.filter((sample) => sample.selector === selector);
  return {
    selector,
    samples: rows.length,
    assets: uniqueSortedNumbers(rows.map((row) => row.assetId)),
    targetFamilies: rows.reduce((counts, row) => {
      const key = row.family ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
    classHints: rows.reduce((counts, row) => {
      const key = row.classHint ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
    metadataIds: rows.reduce((counts, row) => {
      if (row.metadataId == null) return counts;
      const key = String(row.metadataId);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
  };
});

const fixedOffsets = analyzeFixedOffsets(samples);
const structuralCandidates = fixedOffsets.filter((row) => row.candidate);
const anchorSignatures = analyzeAnchorWindows(samples);
const selectorSpecificWindowSignatures = anchorSignatures.filter((row) => row.selectors.length === 1 && row.hits >= 2);
const strongStructuralCandidates = structuralCandidates.filter((row) => row.separatesSelectors && row.stableGroups >= 2);
const sourceProofReady = false;
const promotionReady = false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bonus-selector-structural-family-audit-v1",
  source: {
    selectorMatrixFile,
    matrixAssessment: matrix.summary?.assessment?.kind ?? null,
  },
  summary: {
    samples: samples.length,
    selectors: selectors.length,
    decodedFamilies: families.filter((family) => family.samples > 0).length,
    missingDecodedAssets: uniqueSortedNumbers(missingDecodedAssets),
    fixedOffsetsScanned: 129,
    structuralCandidates: structuralCandidates.length,
    strongStructuralCandidates: strongStructuralCandidates.length,
    anchorWindowSignatures: anchorSignatures.length,
    selectorSpecificWindowSignatures: selectorSpecificWindowSignatures.length,
    sourceProofReady,
    promotionReady,
    assessment: {
      kind: strongStructuralCandidates.length > 0 || selectorSpecificWindowSignatures.length > 0
        ? "bonus-selector-structural-family-candidates-need-source-proof"
        : "bonus-selector-structural-family-no-promotable-discriminator",
      confidence: strongStructuralCandidates.length > 0 ? "medium" : "high",
      blocker: "selector-source-proof-missing",
      finding: strongStructuralCandidates.length > 0 || selectorSpecificWindowSignatures.length > 0
        ? "Les selecteurs 949/994 ont des signatures structurelles observables, mais elles ne nomment pas la famille additive ou multiplicative."
        : "Aucun discriminateur structurel promouvable ne classe les selecteurs 949/994 en famille additive ou multiplicative.",
      nextAction: "Utiliser ces signatures seulement comme indices de recherche; chercher une table/champ source nomme avant toute promotion DPS.",
    },
  },
  families,
  topFixedOffsetCandidates: fixedOffsets.slice(0, 30).map((row) => ({
    offset: row.offset,
    candidateScore: row.candidateScore,
    candidate: row.candidate,
    separatesSelectors: row.separatesSelectors,
    stableValues: row.stableValues,
    selectorGroups: row.selectorGroups,
  })),
  topAnchorWindowSignatures: anchorSignatures.slice(0, 30),
  samples: samples.map((sample) => ({
    assetId: sample.assetId,
    selector: sample.selector,
    family: sample.family,
    classHint: sample.classHint,
    metadataId: sample.metadataId,
    metadataFloat: sample.metadataFloat,
    metadataEncoding: sample.metadataEncoding,
    target: sample.target,
    anchorOffset: sample.anchorOffset,
    decodedPath: sample.decodedPath,
    decodedBytes: sample.decodedBytes,
    window: sample.window,
  })),
  safeguards: [
    "Une signature structurelle n'est pas une preuve de bucket additif ou multiplicatif.",
    "Le selector 994 repete et le selector 949 compact restent exclus de reliableDps sans source nommee.",
    "Les signatures servent a orienter la recherche, pas a classer les modifiers.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bonus-selector-structural-family.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
