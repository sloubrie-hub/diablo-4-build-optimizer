const fs = require("fs");
const path = require("path");

const sourceSearchAuditFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-source-search-audit/aspect-slot-source-search-audit.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-binary-parser-seed";

const decodedRoots = ["outputs"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function decodedKeyFromPath(filePath) {
  const name = path.basename(filePath);
  const match = name.match(/^(data\.\d+)\.(\d+)\.decoded\.bin$/);
  if (!match) return null;
  return `${match[1]}@${match[2]}`;
}

function extractAsciiStrings(buffer, minLength = 4) {
  const rows = [];
  let start = null;
  for (let i = 0; i <= buffer.length; i += 1) {
    const byte = i < buffer.length ? buffer[i] : 0;
    const printable = byte >= 32 && byte <= 126;
    if (printable && start == null) start = i;
    if ((!printable || i === buffer.length) && start != null) {
      if (i - start >= minLength) rows.push({ offset: start, value: buffer.subarray(start, i).toString("ascii") });
      start = null;
    }
  }
  return rows;
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function f32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  const value = buffer.readFloatLE(offset);
  return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
}

function wordWindow(buffer, anchor, radius = 48) {
  const start = Math.max(0, anchor - radius);
  const alignedStart = start - (start % 4);
  const end = Math.min(buffer.length - 4, anchor + radius);
  const rows = [];
  for (let offset = alignedStart; offset <= end; offset += 4) {
    rows.push({
      offset,
      distance: offset - anchor,
      u32: u32At(buffer, offset),
      f32: f32At(buffer, offset),
      hex: buffer.subarray(offset, offset + 4).toString("hex"),
    });
  }
  return rows;
}

function classifyString(value) {
  if (/allowedSlots|equipmentSlot|EquipSlot|slotMask|ItemEquipLocation|EquipLocation/i.test(value)) {
    return "direct-slot-field";
  }
  if (/ItemType/i.test(value)) return "itemtype-condition";
  if (/Affix(_Value|\.|IsEquipped)|Static Value|#/.test(value)) return "affix-value-reference";
  if (/Helm_|Chest_|Gloves_|Pants_|Boots_|Amulet_|Ring_|Weapon_|Offhand_|2H/i.test(value)) return "slot-name-reference";
  return "other";
}

function findCandidateStrings(strings, sampleValues) {
  const samples = (sampleValues ?? []).filter(Boolean);
  const matches = [];
  for (const string of strings) {
    const exactSample = samples.find((sample) => string.value.includes(sample) || sample.includes(string.value));
    const kind = classifyString(string.value);
    if (exactSample || kind !== "other") {
      matches.push({
        offset: string.offset,
        value: string.value,
        kind,
        matchedSample: exactSample ?? null,
      });
    }
  }
  return matches;
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const rows = [];
  for (const candidate of candidates) {
    const key = `${candidate.fileName}@${candidate.blteOffset}@${candidate.assetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(candidate);
  }
  return rows;
}

const decodedFiles = collectFiles(".")
  .filter((filePath) => decodedRoots.some((root) => path.normalize(filePath).includes(path.normalize(root))));
const decodedByKey = new Map(decodedFiles.map((filePath) => [decodedKeyFromPath(filePath), filePath]).filter(([key]) => key));
const sourceSearchAudit = readJson(sourceSearchAuditFile);
const candidates = dedupeCandidates([
  ...(sourceSearchAudit.directFieldCandidates ?? []),
  ...(sourceSearchAudit.slotPrefixCandidates ?? []),
  ...(sourceSearchAudit.knownLeadCandidates ?? []),
]);

const inspected = [];
const missingDecode = [];
for (const candidate of candidates) {
  const key = `${candidate.fileName}@${candidate.blteOffset}`;
  const decodedPath = decodedByKey.get(key);
  if (!decodedPath) {
    missingDecode.push({
      assetId: candidate.assetId,
      fileName: candidate.fileName,
      blteOffset: candidate.blteOffset,
      groupKey: candidate.groupKey,
      kind: candidate.kind,
      score: candidate.score,
      sampleValues: candidate.sampleValues ?? [],
    });
    continue;
  }
  const buffer = fs.readFileSync(decodedPath);
  const strings = extractAsciiStrings(buffer);
  const matchedStrings = findCandidateStrings(strings, candidate.sampleValues).slice(0, 30);
  inspected.push({
    assetId: candidate.assetId,
    fileName: candidate.fileName,
    blteOffset: candidate.blteOffset,
    decodedPath,
    decodedBytes: buffer.length,
    groupKey: candidate.groupKey,
    kind: candidate.kind,
    score: candidate.score,
    header: {
      magic: buffer.subarray(0, 4).toString("hex"),
      assetIdAt16: u32At(buffer, 16),
      firstWords: wordWindow(buffer, 0, 64).slice(0, 18),
    },
    strings: {
      count: strings.length,
      matched: matchedStrings.map((string) => ({
        ...string,
        wordWindow: wordWindow(buffer, string.offset),
      })),
      byKind: matchedStrings.reduce((counts, string) => {
        counts[string.kind] = (counts[string.kind] ?? 0) + 1;
        return counts;
      }, {}),
    },
    parserSignals: {
      directSlotFieldStrings: matchedStrings.filter((string) => string.kind === "direct-slot-field").length,
      itemTypeConditionStrings: matchedStrings.filter((string) => string.kind === "itemtype-condition").length,
      affixValueReferenceStrings: matchedStrings.filter((string) => string.kind === "affix-value-reference").length,
      slotNameReferenceStrings: matchedStrings.filter((string) => string.kind === "slot-name-reference").length,
    },
  });
}

const decodePlan = missingDecode.slice(0, 12).map((candidate) => ({
  assetId: candidate.assetId,
  fileName: candidate.fileName,
  blteOffset: candidate.blteOffset,
  groupKey: candidate.groupKey,
  reason: candidate.kind === "known-lead"
    ? "candidat lie directement a Helm_Unique_Necro_100"
    : candidate.groupKey === "Helm_"
      ? "candidat helm pour comparaison avec 1461593"
      : "candidat de forme slot/affix pour apprendre le layout binaire",
  command: `node work\\diablo4-data-exporter\\d4export.js decode-blte --file "C:\\Program Files (x86)\\Diablo IV\\Data\\data\\${candidate.fileName}" --offset ${candidate.blteOffset} --out outputs\\diablo4-source-asset-${candidate.assetId}-payload`,
}));

const inspectedWithDirectSlot = inspected.filter((row) => row.parserSignals.directSlotFieldStrings > 0);
const allCandidatesDecoded = missingDecode.length === 0 && candidates.length > 0;
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-binary-parser-seed-v1",
  source: {
    sourceSearchAuditFile,
    decodedRoots,
  },
  summary: {
    candidates: candidates.length,
    decodedCandidates: inspected.length,
    missingDecode: missingDecode.length,
    inspectedWithDirectSlot: inspectedWithDirectSlot.length,
    allCandidatesDecoded,
    promotionReady: false,
    assessment: {
      kind: inspectedWithDirectSlot.length
        ? "binary-parser-seed-has-direct-slot-string"
        : allCandidatesDecoded
          ? "binary-parser-seed-local-candidates-exhausted-no-direct-slot"
        : "binary-parser-seed-needs-more-decodes",
      confidence: "medium",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: inspectedWithDirectSlot.length
        ? "Au moins un payload decode contient un champ direct de slot; il faut parser son contexte binaire avant promotion."
        : allCandidatesDecoded
          ? "Tous les candidats locaux de layout slot sont decodes; aucun ne contient un champ direct de slot."
        : "Les payloads deja decodes ne suffisent pas a trouver un champ direct de slot; il faut decoder les meilleurs candidats de layout.",
      nextAction: allCandidatesDecoded
        ? "Arreter la piste des candidats de noms de slots et chercher une table aspect-equipement distincte."
        : "Decoder les candidats Helm/Ring/Boots les mieux scores puis comparer leurs fenetres binaires autour des references Affix_Value.",
    },
  },
  inspected,
  missingDecode,
  decodePlan,
  safeguards: [
    "Ce rapport prepare le parseur; il ne prouve pas allowedSlots.",
    "Les references Affix_Value et Static Value restent des cibles de valeurs, pas des slots autorises.",
    "Toute promotion devra pointer un champ direct ou une table source aspect-equipement.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-binary-parser-seed.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
