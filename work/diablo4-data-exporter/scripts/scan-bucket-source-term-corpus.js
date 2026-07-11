const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-bucket-source-term-corpus";

const watchedNumbers = [949, 994, 12337, 1092616192, 1065353216];
const termGroups = [
  {
    group: "bucket-family",
    terms: [
      "additive",
      "multiplicative",
      "damage bucket",
      "damage_bucket",
      "damagebucket",
      "bucket",
    ],
  },
  {
    group: "damage-modifier-source",
    terms: [
      "damage bonus",
      "damage_bonus",
      "damagebonus",
      "damage modifier",
      "damage_modifier",
      "modifier",
      "coefficient",
      "scaling",
      "multiplier",
    ],
  },
  {
    group: "formula-source",
    terms: [
      "script formula",
      "static value",
      "power tag",
      "affix value",
      "bonus_percent_per_power",
      "Bonus_Percent_Per_Power",
    ],
  },
];

function listDecodedBins(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDecodedBins(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function assetIdFromPath(filePath) {
  const match = String(filePath).match(/diablo4-source-asset-(\d+)-payload/i);
  return match ? Number(match[1]) : null;
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

function extractStrings(buffer) {
  const rows = [];
  const text = buffer.toString("latin1");
  const regex = /[\x20-\x7e]{4,}/g;
  let match;
  while ((match = regex.exec(text))) {
    rows.push({
      offset: match.index,
      value: match[0].trim(),
    });
  }
  return rows.filter((row) => row.value.length >= 4);
}

function matchedGroups(value) {
  const lowered = value.toLowerCase();
  return termGroups.flatMap((group) => {
    const terms = group.terms.filter((term) => lowered.includes(term.toLowerCase()));
    return terms.length ? [{ group: group.group, terms }] : [];
  });
}

function nearbyWatchedNumbers(buffer, center, radius = 256) {
  const rows = [];
  const start = Math.max(0, center - radius);
  const alignedStart = start - (start % 4);
  const end = Math.min(buffer.length - 4, center + radius);
  for (let offset = alignedStart; offset <= end; offset += 4) {
    const u32 = readU32(buffer, offset);
    if (watchedNumbers.includes(u32)) {
      rows.push({
        offset,
        distance: offset - center,
        u32,
        f32: readF32(buffer, offset),
      });
    }
  }
  return rows;
}

function nearbyStrings(strings, center, radius = 220) {
  return strings
    .filter((row) => Math.abs(row.offset - center) <= radius)
    .map((row) => row.value)
    .slice(0, 20);
}

function kindForHit(groups, nearNumbers, nearStrings) {
  const groupNames = groups.map((entry) => entry.group);
  const hasBucketFamilyTerm = groupNames.includes("bucket-family");
  const hasBonusString = nearStrings.some((value) => /Bonus_Percent_Per_Power/i.test(value));
  const hasSelector = nearNumbers.some((row) => row.u32 === 949 || row.u32 === 994);
  const hasMetadata = nearNumbers.some((row) => row.u32 === 12337 || row.u32 === 1092616192);
  if (hasBucketFamilyTerm && (hasSelector || hasMetadata || hasBonusString)) return "candidate-bucket-source-near-watched";
  if (hasBucketFamilyTerm) return "bucket-term-unlinked";
  if (hasBonusString && (hasSelector || hasMetadata)) return "formula-term-near-bonus-selector";
  if (hasSelector || hasMetadata) return "source-term-near-watched-number";
  return "source-term-unlinked";
}

const files = listDecodedBins(rootDir);
const hits = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const strings = extractStrings(buffer);
  for (const row of strings) {
    const groups = matchedGroups(row.value);
    if (!groups.length) continue;
    const nearNumbers = nearbyWatchedNumbers(buffer, row.offset);
    const nearStrings = nearbyStrings(strings, row.offset);
    hits.push({
      file,
      assetId: assetIdFromPath(file),
      offset: row.offset,
      value: row.value,
      groups,
      kind: kindForHit(groups, nearNumbers, nearStrings),
      nearbyWatchedNumbers: nearNumbers,
      nearbyStrings: nearStrings,
    });
  }
}

const kindCounts = {};
const groupCounts = {};
for (const hit of hits) {
  kindCounts[hit.kind] = (kindCounts[hit.kind] ?? 0) + 1;
  for (const group of hit.groups) {
    groupCounts[group.group] = (groupCounts[group.group] ?? 0) + 1;
  }
}

const candidateSourceHits = hits.filter((hit) => hit.kind === "candidate-bucket-source-near-watched");
const bucketTermHits = hits.filter((hit) => hit.groups.some((group) => group.group === "bucket-family"));
const nearWatchedHits = hits.filter((hit) => hit.nearbyWatchedNumbers.length > 0);
const bonusPercentHits = hits.filter((hit) => /Bonus_Percent_Per_Power/i.test(hit.value) || hit.nearbyStrings.some((value) => /Bonus_Percent_Per_Power/i.test(value)));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bucket-source-term-corpus-scan-v1",
  source: {
    rootDir,
    termGroups,
    watchedNumbers,
  },
  summary: {
    filesScanned: files.length,
    hits: hits.length,
    bucketTermHits: bucketTermHits.length,
    nearWatchedHits: nearWatchedHits.length,
    bonusPercentHits: bonusPercentHits.length,
    candidateSourceHits: candidateSourceHits.length,
    kindCounts,
    groupCounts,
    sourceProofReady: candidateSourceHits.length > 0,
    promotionReady: false,
    assessment: {
      kind: candidateSourceHits.length
        ? "bucket-source-terms-near-watched-values"
        : bucketTermHits.length
          ? "bucket-source-terms-unlinked"
          : "bucket-source-terms-not-found",
      confidence: hits.length ? "medium-high" : "medium",
      blocker: candidateSourceHits.length ? "semantic-validation-required" : "bucket-source-term-not-linked",
      finding: candidateSourceHits.length
        ? "Des termes bucket/source apparaissent pres de valeurs surveillees; ils doivent etre valides semantiquement avant promotion."
        : "Aucun terme source additif/multiplicatif/bucket n'est relie aux selecteurs ou aux chaines Bonus_Percent_Per_Power dans le corpus decode.",
      nextAction: candidateSourceHits.length
        ? "Inspecter manuellement les hits candidats et verifier s'ils nomment une famille de bucket."
        : "Chercher une source hors chaines decodees ou elargir le scan aux tables binaires non textuelles.",
    },
  },
  candidateSourceHits: candidateSourceHits.slice(0, 50),
  bucketTermHits: bucketTermHits.slice(0, 50),
  nearWatchedHits: nearWatchedHits.slice(0, 50),
  bonusPercentHits: bonusPercentHits.slice(0, 50),
  safeguards: [
    "Un mot source non relie a un selecteur ou une chaine cible ne prouve pas la famille de bucket.",
    "Les termes formula/source restent descriptifs tant qu'ils ne nomment pas additive ou multiplicative.",
    "Aucun hit de ce scan ne doit alimenter reliableDps sans validation semantique.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bucket-source-term-corpus.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
