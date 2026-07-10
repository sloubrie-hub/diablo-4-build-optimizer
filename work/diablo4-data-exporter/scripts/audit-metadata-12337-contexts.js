const fs = require("fs");
const path = require("path");

const familyEvidencePath = "outputs/diablo4-hash-suffix-family-evidence/hash-suffix-family-evidence.json";
const outDir = "outputs/diablo4-metadata-12337-context-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function decodedFileForAsset(assetId) {
  const payloadDir = path.join("outputs", `diablo4-source-asset-${assetId}-payload`);
  if (fs.existsSync(payloadDir)) {
    const decoded = fs.readdirSync(payloadDir).find((name) => name.endsWith(".decoded.bin"));
    if (decoded) return path.join(payloadDir, decoded);
  }
  return null;
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function f32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return Number(buffer.readFloatLE(offset).toFixed(6));
}

function asciiNear(buffer, center, radius = 140) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  return buffer
    .subarray(start, end)
    .toString("latin1")
    .replace(/[^\x20-\x7e]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordWindow(buffer, center, radius = 40) {
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

function classifyFamily(value) {
  if (/^Bonus_Percent_Per_Power#/i.test(value)) return "direct-bonus-percent";
  if (/Bonus_Percent_Per_Power#/i.test(value)) return "wrapped-or-nested-bonus-percent";
  if (/Affix_Value_1#/i.test(value)) return "affix-value-normalized";
  return "other";
}

const familyEvidence = readJson(familyEvidencePath);
const examples = familyEvidence.summary?.assessment?.evidence?.metadata12337?.examples || [];
const rows = examples.map((example) => {
  const decodedFile = decodedFileForAsset(example.assetId);
  const buffer = decodedFile ? fs.readFileSync(decodedFile) : null;
  const metadataOffset = example.metadata?.offset ?? null;
  const floatOffset = example.metadata?.floatOffset ?? null;
  const verified = Boolean(
    buffer &&
    metadataOffset !== null &&
    floatOffset !== null &&
    u32At(buffer, metadataOffset) === 12337 &&
    Math.abs(f32At(buffer, floatOffset) - 10) < 0.00001
  );
  return {
    assetId: example.assetId,
    selector: example.selector,
    previousString: example.previousString,
    family: classifyFamily(example.previousString || ""),
    metadata: example.metadata,
    decodedFile,
    verified,
    selectorDiffersFrom949: Number(example.selector) !== 949,
    asciiNearMetadata: buffer && metadataOffset !== null ? asciiNear(buffer, metadataOffset) : null,
    wordWindow: buffer && metadataOffset !== null ? wordWindow(buffer, metadataOffset) : [],
  };
});

const selectorSet = [...new Set(rows.map((row) => row.selector))].sort((a, b) => Number(a) - Number(b));
const familySet = [...new Set(rows.map((row) => row.family))].sort();
const non949Rows = rows.filter((row) => row.selectorDiffersFrom949);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "metadata-12337-context-audit-v1",
  source: {
    familyEvidence: familyEvidencePath,
  },
  summary: {
    rows: rows.length,
    verifiedRows: rows.filter((row) => row.verified).length,
    selectors: selectorSet,
    families: familySet,
    non949Rows: non949Rows.length,
    assessment: {
      kind: non949Rows.length
        ? "metadata-12337-scale-10-cross-selector"
        : "metadata-12337-scale-10-selector-949-only",
      confidence: rows.every((row) => row.verified) ? "medium-high" : "medium",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: non949Rows.length
        ? "Metadata 12337 / scale 10 se repete avec plusieurs selecteurs; elle ne prouve pas a elle seule le role du selecteur 949."
        : "Metadata 12337 / scale 10 est observee uniquement avec selector 949 dans le corpus actuel.",
      nextAction: "Identifier la signification de metadata 12337 / scale 10 separement du selecteur, puis chercher le champ proprietaire du selector 949.",
    },
  },
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "metadata-12337-context-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
