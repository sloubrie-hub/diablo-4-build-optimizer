const fs = require("fs");
const path = require("path");

const matrixPath = "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json";
const outDir = "outputs/diablo4-unanchored-bonus-percent-audit";
const watchedValues = new Set([949, 994, 12337, 1092616192, 2147483816]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function existingDecodedFile(assetId, headerShapeGroups) {
  const payloadDir = path.join("outputs", `diablo4-source-asset-${assetId}-payload`);
  if (fs.existsSync(payloadDir)) {
    const decoded = fs.readdirSync(payloadDir).find((name) => name.endsWith(".decoded.bin"));
    if (decoded) return path.join(payloadDir, decoded);
  }
  const headerDir = path.join("outputs", `diablo4-source-asset-${assetId}-header-patterns`);
  const headerFile = path.join(headerDir, "record-header-pattern-comparison.json");
  if (fs.existsSync(headerFile)) {
    const report = readJson(headerFile);
    if (report.source?.filePath && fs.existsSync(report.source.filePath)) return report.source.filePath;
  }
  if (headerShapeGroups) return null;
  return null;
}

function findAscii(buffer, value) {
  const needle = Buffer.from(value, "latin1");
  const offsets = [];
  let offset = buffer.indexOf(needle);
  while (offset !== -1) {
    offsets.push(offset);
    offset = buffer.indexOf(needle, offset + 1);
  }
  return offsets;
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function floatAt(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  const value = buffer.readFloatLE(offset);
  return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
}

function asciiWord(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return "";
  return buffer.subarray(offset, offset + 4).toString("latin1").replace(/[^\x20-\x7e]/g, ".");
}

function wordWindow(buffer, center, radius = 96) {
  const start = Math.max(0, center - radius);
  const alignedStart = start - (start % 4);
  const end = Math.min(buffer.length - 4, center + radius);
  const words = [];
  for (let offset = alignedStart; offset <= end; offset += 4) {
    const u32 = u32At(buffer, offset);
    words.push({
      offset,
      distance: offset - center,
      u32,
      float32: floatAt(buffer, offset),
      ascii: asciiWord(buffer, offset),
      watched: watchedValues.has(u32),
    });
  }
  return words;
}

function nearbyStrings(buffer, center, radius = 240) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  const text = buffer.subarray(start, end).toString("latin1");
  return text
    .split(/[^\x20-\x7e]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 4)
    .slice(0, 24);
}

function findWatchedOffsets(buffer) {
  const hits = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    const u32 = buffer.readUInt32LE(offset);
    if (watchedValues.has(u32)) {
      hits.push({
        offset,
        value: u32 === 1092616192 ? "float10-bits" : u32 === 2147483816 ? "highbit-168" : u32,
      });
    }
  }
  return hits;
}

function nearestWatched(hits, center) {
  return hits
    .map((hit) => ({ ...hit, distance: hit.offset - center, absDistance: Math.abs(hit.offset - center) }))
    .sort((a, b) => a.absDistance - b.absDistance || a.offset - b.offset)
    .slice(0, 12)
    .map(({ absDistance, ...hit }) => hit);
}

function classifyRow({ row, targetOffsets, nearest }) {
  if (!targetOffsets.length) {
    return {
      kind: "target-string-not-found-in-decoded-payload",
      anchorUseful: false,
      finding: "La chaine cible de la matrice n'est pas presente dans le payload decode disponible.",
    };
  }
  const closeWatched = nearest.filter((hit) => Math.abs(hit.distance) <= 64);
  if (closeWatched.some((hit) => hit.value === 949 || hit.value === 994)) {
    return {
      kind: "unanchored-target-with-near-selector",
      anchorUseful: true,
      finding: "La cible sans ancre possede un selecteur surveille proche; elle merite une inspection de layout.",
    };
  }
  if (closeWatched.some((hit) => hit.value === "highbit-168")) {
    return {
      kind: "unanchored-target-with-divergent-highbit-168",
      anchorUseful: false,
      finding: "La cible sans ancre possede seulement le selecteur divergent highbit-168 proche, pas un selecteur 949/994 utile.",
    };
  }
  if (closeWatched.length) {
    return {
      kind: "unanchored-target-with-near-metadata-only",
      anchorUseful: false,
      finding: "La cible sans ancre possede seulement une metadata/scale surveillee proche, sans selecteur utilisable.",
    };
  }
  return {
    kind: "unanchored-target-no-near-watched-values",
    anchorUseful: false,
    finding: "La cible sans ancre ne porte pas de valeur surveillee proche dans le payload decode actuel.",
  };
}

const matrix = readJson(matrixPath);
const unanchoredRows = (matrix.rows || []).filter((row) => !(row.anchors || []).length);
const rows = unanchoredRows.map((row) => {
  const decodedFile = existingDecodedFile(row.assetId, row.headerShapeGroups);
  if (!decodedFile) {
    return {
      assetId: row.assetId,
      targets: row.targets,
      decodedFile: null,
      readable: false,
      assessment: {
        kind: "decoded-payload-not-available",
        anchorUseful: false,
        finding: "Aucun payload decode lisible n'est disponible dans le workspace.",
      },
    };
  }
  const buffer = fs.readFileSync(decodedFile);
  const targetOffsets = (row.targets || []).flatMap((target) => findAscii(buffer, target));
  const normalizedOffsets = (row.targets || [])
    .flatMap((target) => {
      const match = String(target).match(/Bonus_Percent_Per_Power#[A-Za-z0-9_]+/);
      return match ? findAscii(buffer, match[0]) : [];
    });
  const offsets = [...new Set([...targetOffsets, ...normalizedOffsets])].sort((a, b) => a - b);
  const watchedHits = findWatchedOffsets(buffer);
  const center = offsets[0] ?? 0;
  const nearest = nearestWatched(watchedHits, center);
  return {
    assetId: row.assetId,
    fileName: row.fileName,
    blteOffset: row.blteOffset,
    targets: row.targets,
    decodedFile,
    decodedBytes: buffer.length,
    readable: true,
    targetOffsets: offsets,
    nearestWatched: nearest,
    nearbyStrings: offsets.length ? nearbyStrings(buffer, center) : [],
    wordWindow: offsets.length ? wordWindow(buffer, center) : [],
    assessment: classifyRow({ row, targetOffsets: offsets, nearest }),
  };
});

const usefulRows = rows.filter((row) => row.assessment.anchorUseful);
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "unanchored-bonus-percent-audit-v1",
  source: {
    matrix: matrixPath,
  },
  summary: {
    rows: rows.length,
    readablePayloads: rows.filter((row) => row.readable).length,
    targetStringsFound: rows.filter((row) => (row.targetOffsets || []).length).length,
    usefulAnchorCandidates: usefulRows.length,
    assessment: {
      kind: usefulRows.length
        ? "unanchored-bonus-percent-anchor-candidates-found"
        : "unanchored-bonus-percent-no-extra-anchor-candidates",
      confidence: rows.length ? "medium" : "low",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: usefulRows.length
        ? "Au moins une cible sans ancre possede un selecteur surveille proche."
        : "Les cibles sans ancre n'ajoutent pas de nouveau compact ni de selecteur utile dans les payloads decodes actuels.",
      nextAction: usefulRows.length
        ? "Inspecter les candidats sans ancre proches d'un selecteur avant toute promotion DPS."
        : "Decoder davantage de payloads candidats ou chercher une table source hors du corpus decode actuel.",
    },
  },
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "unanchored-bonus-percent-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
