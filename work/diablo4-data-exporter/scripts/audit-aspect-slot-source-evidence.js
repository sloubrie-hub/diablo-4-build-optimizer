const fs = require("fs");
const path = require("path");

const assetId = Number(process.argv[2] ?? 1461593);
const decodedDirs = (process.argv[3] ?? [
  `outputs/diablo4-source-asset-${assetId}-payload`,
  `outputs/diablo4-source-asset-${assetId}-payload-neighbor-scan`,
].join(",")).split(",").map((item) => item.trim()).filter(Boolean);
const outDir = process.argv[4] ?? `outputs/diablo4-aspect-slot-source-evidence`;

const slotPatterns = [
  ["helm", /\b(helm|helmet|head)\b/gi],
  ["chest", /\b(chest|torso)\b/gi],
  ["gloves", /\b(gloves|hands)\b/gi],
  ["pants", /\b(pants|legs)\b/gi],
  ["boots", /\b(boots|feet)\b/gi],
  ["amulet", /\b(amulet|neck)\b/gi],
  ["ring", /\bring\b/gi],
  ["weapon", /\b(weapon|sword|axe|mace|bow|staff|wand|dagger|polearm|scythe)\b/gi],
  ["offhand", /\b(offhand|focus|totem|shield)\b/gi],
];

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return entry.isFile() && (entry.name.endsWith(".decoded.bin") || entry.name.endsWith(".json")) ? [fullPath] : [];
  });
}

function printableContext(buffer, offset, size = 96) {
  const start = Math.max(0, offset - size);
  const end = Math.min(buffer.length, offset + size);
  return buffer.subarray(start, end).toString("latin1").replace(/[^\x20-\x7e]+/g, " ").trim();
}

function scanFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const text = buffer.toString("latin1");
  const hits = [];
  for (const [slot, pattern] of slotPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text))) {
      hits.push({
        slot,
        offset: match.index,
        value: match[0],
        context: printableContext(buffer, match.index),
      });
    }
  }
  return {
    filePath,
    byteLength: buffer.length,
    hits,
  };
}

const files = decodedDirs.flatMap(collectFiles);
const scanned = files.map(scanFile);
const hitRows = scanned.filter((row) => row.hits.length > 0);
const directAssetFiles = scanned.filter((row) => row.filePath.includes(`source-asset-${assetId}-payload\\`) || row.filePath.includes(`source-asset-${assetId}-payload/`));
const directHits = directAssetFiles.flatMap((row) => row.hits.map((hit) => ({ ...hit, filePath: row.filePath })));
const allHits = hitRows.flatMap((row) => row.hits.map((hit) => ({ ...hit, filePath: row.filePath })));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-source-evidence-v1",
  input: {
    assetId,
    decodedDirs,
  },
  summary: {
    filesScanned: scanned.length,
    filesWithSlotTokens: hitRows.length,
    totalSlotTokenHits: allHits.length,
    directAssetSlotTokenHits: directHits.length,
    promotionReady: false,
    assessment: {
      kind: directHits.length > 0
        ? "slot-token-direct-hit-needs-field-parser"
        : allHits.length > 0
          ? "slot-token-neighbor-only-not-proof"
          : "slot-token-not-found-in-decoded-source",
      confidence: directHits.length > 0 ? "medium" : "medium-high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: directHits.length > 0
        ? "Des tokens de slot existent dans le payload direct, mais il faut prouver le champ proprietaire avant allowedSlots."
        : allHits.length > 0
          ? "Des tokens de slot existent seulement dans les voisins decodes, pas comme preuve directe de l'aspect."
          : "Aucun token de slot n'a ete trouve dans le payload direct ni les voisins decodes locaux.",
      nextAction: "Decoder ou parser la table/champ source des slots d'aspects avant toute contrainte equipement fiable.",
    },
  },
  hits: allHits.slice(0, 50),
  scannedFiles: scanned.map((row) => ({
    filePath: row.filePath,
    byteLength: row.byteLength,
    hits: row.hits.length,
  })),
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-source-evidence.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
