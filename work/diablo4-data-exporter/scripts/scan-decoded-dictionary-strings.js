const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-decoded-dictionary-string-scan";
const terms = [
  "selector",
  "metadata",
  "dictionary",
  "lookup",
  "enum",
  "field",
  "schema",
  "table",
  "Bonus_Percent_Per_Power",
  "Affix_Value_1",
];

function listDecodedBins(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDecodedBins(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function extractStrings(buffer, minLength = 4) {
  const strings = [];
  let start = null;
  for (let index = 0; index <= buffer.length; index += 1) {
    const byte = index < buffer.length ? buffer[index] : 0;
    const printable = byte >= 0x20 && byte <= 0x7e;
    if (printable && start === null) start = index;
    if ((!printable || index === buffer.length) && start !== null) {
      if (index - start >= minLength) {
        strings.push({
          offset: start,
          value: buffer.subarray(start, index).toString("latin1"),
        });
      }
      start = null;
    }
  }
  return strings;
}

function classify(value) {
  if (/Bonus_Percent_Per_Power/i.test(value)) return "bonus-percent-family";
  if (/Affix_Value_1/i.test(value)) return "metadata-neighbor-family";
  if (/(selector|metadata|dictionary|lookup|enum|schema|field)/i.test(value)) return "dictionary-word";
  if (/\btable\b/i.test(value)) return "table-word";
  return "other";
}

function nearbyNumbers(buffer, offset, radius = 96) {
  const start = Math.max(0, offset - radius);
  const end = Math.min(buffer.length - 4, offset + radius);
  const numbers = [];
  for (let cursor = start - (start % 4); cursor <= end; cursor += 4) {
    const u32 = buffer.readUInt32LE(cursor);
    if (u32 === 949 || u32 === 12337 || u32 === 1092616192) {
      numbers.push({
        offset: cursor,
        distance: cursor - offset,
        value: u32 === 1092616192 ? "float10-bits" : u32,
      });
    }
  }
  return numbers;
}

const files = listDecodedBins(rootDir);
const rows = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const strings = extractStrings(buffer);
  const hits = strings
    .map((entry) => {
      const matchedTerms = terms.filter((term) => entry.value.toLowerCase().includes(term.toLowerCase()));
      if (!matchedTerms.length) return null;
      return {
        offset: entry.offset,
        value: entry.value,
        matchedTerms,
        classification: classify(entry.value),
        nearbyWatchedNumbers: nearbyNumbers(buffer, entry.offset),
      };
    })
    .filter(Boolean);
  if (hits.length) {
    rows.push({
      file,
      decodedBytes: buffer.length,
      hits,
    });
  }
}

const dictionaryHits = rows.flatMap((row) =>
  row.hits
    .filter((hit) => hit.classification === "dictionary-word" || hit.classification === "table-word")
    .map((hit) => ({ file: row.file, ...hit }))
);
const dictionaryHitsNearWatchedNumbers = dictionaryHits.filter((hit) => hit.nearbyWatchedNumbers.length);
const bonusHits = rows.flatMap((row) =>
  row.hits
    .filter((hit) => hit.classification === "bonus-percent-family")
    .map((hit) => ({ file: row.file, ...hit }))
);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "decoded-dictionary-string-scan-v1",
  source: {
    rootDir,
    terms,
  },
  summary: {
    filesScanned: files.length,
    filesWithHits: rows.length,
    totalHits: rows.reduce((sum, row) => sum + row.hits.length, 0),
    dictionaryHits: dictionaryHits.length,
    dictionaryHitsNearWatchedNumbers: dictionaryHitsNearWatchedNumbers.length,
    bonusPercentHits: bonusHits.length,
    assessment: {
      kind: dictionaryHitsNearWatchedNumbers.length
        ? "decoded-dictionary-strings-near-watched-values"
        : dictionaryHits.length
          ? "decoded-dictionary-strings-not-near-watched-values"
          : "decoded-dictionary-source-strings-not-found",
      confidence: "medium",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: dictionaryHitsNearWatchedNumbers.length
        ? "Des chaines dictionnaire/table existent pres des valeurs surveillees; elles doivent etre inspectees avant promotion."
        : "Aucune chaine dictionnaire/table exploitable ne nomme selector 949, metadata 12337 ou scale 10 dans les payloads decodes actuels.",
      nextAction: "Decoder davantage de payloads candidats ou chercher une source de table hors du corpus decode actuel.",
    },
  },
  dictionaryHitsNearWatchedNumbers,
  dictionaryHits,
  bonusHits,
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "decoded-dictionary-string-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
