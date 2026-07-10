const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-metadata-12337-scale-corpus";
const FLOAT_10_BITS = 1092616192;
const watchedSelectors = new Set([949, 997, 1126, 994, 168, 1037, 146]);

function listDecodedBins(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDecodedBins(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function f32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return Number(buffer.readFloatLE(offset).toFixed(6));
}

function asciiNear(buffer, center, radius = 180) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  return buffer
    .subarray(start, end)
    .toString("latin1")
    .replace(/[^\x20-\x7e]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNearbyStrings(buffer, center, radius = 220) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  return buffer
    .subarray(start, end)
    .toString("latin1")
    .split(/[^\x20-\x7e]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 4)
    .slice(0, 16);
}

function previousSelector(buffer, metadataOffset) {
  const candidates = [];
  for (let offset = Math.max(0, metadataOffset - 64); offset < metadataOffset; offset += 4) {
    const raw = u32At(buffer, offset);
    const normalized = raw >= 2147483648 ? raw - 2147483648 : raw;
    if (watchedSelectors.has(raw) || watchedSelectors.has(normalized)) {
      candidates.push({
        offset,
        distance: offset - metadataOffset,
        raw,
        normalized,
        encoding: raw === normalized ? "plain" : "highbit",
      });
    }
  }
  return candidates.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance))[0] ?? null;
}

function wordWindow(buffer, center, radius = 48) {
  const start = Math.max(0, center - radius);
  const alignedStart = start - (start % 4);
  const end = Math.min(buffer.length - 4, center + radius);
  const words = [];
  for (let offset = alignedStart; offset <= end; offset += 4) {
    words.push({
      offset,
      distance: offset - center,
      u32: u32At(buffer, offset),
      f32: f32At(buffer, offset),
    });
  }
  return words;
}

function classifyHit(buffer, offset, selector) {
  const wordsBetweenSelectorAndMetadata = [];
  if (selector) {
    for (let cursor = selector.offset + 8; cursor < offset; cursor += 4) {
      wordsBetweenSelectorAndMetadata.push(u32At(buffer, cursor));
    }
  }
  if (selector?.normalized === 949 && selector.distance === -16 && wordsBetweenSelectorAndMetadata.join(",") === "0,0") {
    return "compact-selector-949-current-asset-scale";
  }
  if (selector?.normalized === 997 && selector.distance === -16 && wordsBetweenSelectorAndMetadata.join(",") === "0,0") {
    return "compact-selector-997-current-asset-scale";
  }
  if (selector?.normalized === 1126 && selector.distance === -28) {
    return "extended-selector-1126-affix-normalization-scale";
  }
  if (selector) return "metadata-scale-with-near-selector";
  return "metadata-scale-without-near-selector";
}

const files = listDecodedBins(rootDir);
const rows = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const hits = [];
  for (let offset = 0; offset <= buffer.length - 12; offset += 4) {
    if (u32At(buffer, offset) !== 12337) continue;
    if (u32At(buffer, offset + 4) !== 6) continue;
    if (u32At(buffer, offset + 8) !== FLOAT_10_BITS) continue;
    const selector = previousSelector(buffer, offset);
    hits.push({
      offset,
      selector,
      shape: classifyHit(buffer, offset, selector),
      nearbyStrings: extractNearbyStrings(buffer, offset),
      asciiNear: asciiNear(buffer, offset),
      wordWindow: wordWindow(buffer, offset),
    });
  }
  if (hits.length) {
    rows.push({
      file,
      decodedBytes: buffer.length,
      hits,
    });
  }
}

const flatHits = rows.flatMap((row) => row.hits.map((hit) => ({ file: row.file, ...hit })));
const shapeCounts = {};
for (const hit of flatHits) {
  shapeCounts[hit.shape] = (shapeCounts[hit.shape] || 0) + 1;
}
const selectorCounts = {};
for (const hit of flatHits) {
  const key = hit.selector ? String(hit.selector.normalized) : "none";
  selectorCounts[key] = (selectorCounts[key] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "metadata-12337-scale-corpus-scan-v1",
  source: {
    rootDir,
  },
  summary: {
    filesScanned: files.length,
    filesWithHits: rows.length,
    hits: flatHits.length,
    shapeCounts,
    selectorCounts,
    assessment: {
      kind: Object.keys(selectorCounts).length > 1
        ? "metadata-12337-scale-cross-selector-corpus-confirmed"
        : "metadata-12337-scale-single-selector-corpus",
      confidence: flatHits.length ? "medium-high" : "low",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: Object.keys(selectorCounts).length > 1
        ? "Le scan corpus confirme que metadata 12337 / scale 10 apparait sous plusieurs selecteurs."
        : "Le scan corpus ne trouve pas assez de repetition pour separer metadata et selecteur.",
      nextAction: "Interpreter metadata 12337 / scale 10 comme une metadata transversale, puis isoler le champ proprietaire du selecteur 949.",
    },
  },
  hits: flatHits,
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "metadata-12337-scale-corpus-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
