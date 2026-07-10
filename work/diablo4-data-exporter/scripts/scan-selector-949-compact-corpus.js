const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-selector-949-compact-corpus";
const FLOAT_10 = 1092616192;

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function nearestOffset(offsets, anchor) {
  if (!offsets.length) return null;
  const best = offsets
    .map((offset) => ({ offset, distance: offset - anchor, absDistance: Math.abs(offset - anchor) }))
    .sort((a, b) => a.absDistance - b.absDistance || a.offset - b.offset)[0];
  return { offset: best.offset, distance: best.distance };
}

function findU32Offsets(buffer, value) {
  const offsets = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    if (buffer.readUInt32LE(offset) === value) offsets.push(offset);
  }
  return offsets;
}

function extractAscii(buffer, center, radius = 96) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  return buffer
    .subarray(start, end)
    .toString("latin1")
    .replace(/[^\x20-\x7e]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 220);
}

function inspectSelector(buffer, offset) {
  const words = [];
  for (let wordOffset = offset; wordOffset <= offset + 24; wordOffset += 4) {
    words.push(u32At(buffer, wordOffset));
  }
  const compact =
    words[0] === 949 &&
    words[2] === 0 &&
    words[3] === 0 &&
    words[4] === 12337 &&
    words[5] === 6 &&
    words[6] === FLOAT_10;
  return {
    offset,
    assetCandidate: words[1],
    compact,
    words,
  };
}

const files = listFiles(rootDir);
const rows = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const selectorOffsets = findU32Offsets(buffer, 949);
  if (!selectorOffsets.length) continue;
  const metadataOffsets = findU32Offsets(buffer, 12337);
  const float10Offsets = findU32Offsets(buffer, FLOAT_10);
  const selectors = selectorOffsets.map((offset) => {
    const inspected = inspectSelector(buffer, offset);
    return {
      ...inspected,
      nearestMetadata12337: nearestOffset(metadataOffsets, offset),
      nearestFloat10: nearestOffset(float10Offsets, offset),
      nearbyAscii: extractAscii(buffer, offset),
    };
  });
  rows.push({
    file,
    decodedBytes: buffer.length,
    selector949Count: selectorOffsets.length,
    compactCount: selectors.filter((selector) => selector.compact).length,
    selectors,
  });
}

const compactSelectors = rows.flatMap((row) =>
  row.selectors
    .filter((selector) => selector.compact)
    .map((selector) => ({
      file: row.file,
      offset: selector.offset,
      assetCandidate: selector.assetCandidate,
      words: selector.words,
      nearbyAscii: selector.nearbyAscii,
    }))
);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-949-compact-corpus-scan-v1",
  summary: {
    filesScanned: files.length,
    filesWithSelector949: rows.length,
    selector949Occurrences: rows.reduce((sum, row) => sum + row.selector949Count, 0),
    compactOccurrences: compactSelectors.length,
    compactAssetCandidates: [...new Set(compactSelectors.map((selector) => selector.assetCandidate))],
    assessment: {
      kind: compactSelectors.length > 1
        ? "selector-949-compact-repeated-in-local-corpus"
        : compactSelectors.length === 1
          ? "selector-949-compact-local-only-in-decoded-corpus"
          : "selector-949-compact-not-found-in-decoded-corpus",
      confidence: rows.length ? "medium-high" : "low",
      fieldOwnership: "not-proven",
      promotionReady: false,
      nextAction: compactSelectors.length > 1
        ? "Comparer les compacts repetees pour isoler les champs communs avant toute promotion DPS."
        : "Chercher une table source nommee pour selector 949 / metadata 12337 / scale 10, ou decoder davantage de payloads candidats.",
    },
  },
  compactSelectors,
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "selector-949-compact-corpus-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
