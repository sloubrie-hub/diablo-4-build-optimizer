const fs = require("fs");
const path = require("path");

const parserSeedFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-structural-family";

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

function normalizedGroupKey(groupKey) {
  return String(groupKey ?? "unknown");
}

function analyzeFixedOffsets(samples) {
  const rows = [];
  for (let offset = 0; offset <= 512; offset += 4) {
    const byGroup = new Map();
    for (const sample of samples) {
      if (!byGroup.has(sample.groupKey)) byGroup.set(sample.groupKey, []);
      byGroup.get(sample.groupKey).push(readU32(sample.buffer, offset));
    }

    const groups = Array.from(byGroup.entries()).map(([groupKey, values]) => {
      const distinct = unique(values);
      return {
        groupKey,
        samples: values.length,
        distinct,
        stable: distinct.length === 1,
      };
    });

    const multiSampleGroups = groups.filter((group) => group.samples >= 2);
    const stableMultiGroups = multiSampleGroups.filter((group) => group.stable);
    const stableValues = unique(stableMultiGroups.map((group) => group.distinct[0]));
    const valueLooksUseful = stableValues.some((value) => Number.isInteger(value) && value > 0 && value < 1000000);
    const distinctEnough = stableValues.length >= 3;

    rows.push({
      offset,
      stableMultiGroups: stableMultiGroups.length,
      multiSampleGroups: multiSampleGroups.length,
      stableValues,
      candidateScore: stableMultiGroups.length * 10 + stableValues.length * 5 + (distinctEnough ? 20 : 0) + (valueLooksUseful ? 10 : 0),
      candidate: stableMultiGroups.length >= 3 && distinctEnough && valueLooksUseful,
      groups,
    });
  }

  return rows
    .filter((row) => row.candidateScore > 0)
    .sort((a, b) => b.candidateScore - a.candidateScore || a.offset - b.offset);
}

function stringWindows(sample) {
  const rows = [];
  for (const match of sample.strings?.matched ?? []) {
    const offset = Number(match.offset);
    if (!Number.isFinite(offset)) continue;
    rows.push({
      stringOffset: offset,
      stringKind: match.kind,
      value: match.value,
      window: [-32, -28, -24, -20, -16, -12, -8, -4, 4, 8, 12, 16, 20, 24, 28, 32].map((distance) => ({
        distance,
        u32: readU32(sample.buffer, offset + distance),
        f32: readF32(sample.buffer, offset + distance),
      })),
    });
  }
  return rows;
}

function analyzeStringWindows(samples) {
  const signatures = new Map();
  for (const sample of samples) {
    for (const row of stringWindows(sample)) {
      const key = row.window
        .filter((word) => [-16, -12, -8, -4].includes(word.distance))
        .map((word) => word.u32 ?? "")
        .join("|");
      if (!signatures.has(key)) {
        signatures.set(key, {
          key,
          hits: 0,
          groups: new Set(),
          assets: new Set(),
          stringKinds: new Set(),
          examples: [],
        });
      }
      const entry = signatures.get(key);
      entry.hits += 1;
      entry.groups.add(sample.groupKey);
      entry.assets.add(sample.assetId);
      entry.stringKinds.add(row.stringKind);
      if (entry.examples.length < 5) {
        entry.examples.push({
          assetId: sample.assetId,
          groupKey: sample.groupKey,
          stringKind: row.stringKind,
          stringOffset: row.stringOffset,
          value: row.value,
        });
      }
    }
  }

  return Array.from(signatures.values())
    .map((entry) => ({
      ...entry,
      groups: Array.from(entry.groups).sort(),
      assets: Array.from(entry.assets).sort((a, b) => a - b),
      stringKinds: Array.from(entry.stringKinds).sort(),
    }))
    .sort((a, b) => b.hits - a.hits || b.groups.length - a.groups.length);
}

const seed = readJson(parserSeedFile);
const samples = (seed.inspected ?? [])
  .filter((row) => row.decodedPath && fs.existsSync(row.decodedPath))
  .map((row) => ({
    assetId: Number(row.assetId),
    fileName: row.fileName,
    blteOffset: row.blteOffset,
    decodedPath: row.decodedPath,
    decodedBytes: row.decodedBytes,
    groupKey: normalizedGroupKey(row.groupKey),
    kind: row.kind,
    score: row.score,
    strings: row.strings,
    buffer: fs.readFileSync(row.decodedPath),
  }));

const groups = Array.from(samples.reduce((map, sample) => {
  if (!map.has(sample.groupKey)) {
    map.set(sample.groupKey, {
      groupKey: sample.groupKey,
      samples: 0,
      assets: [],
      decodedBytes: [],
      kinds: new Set(),
    });
  }
  const group = map.get(sample.groupKey);
  group.samples += 1;
  group.assets.push(sample.assetId);
  group.decodedBytes.push(sample.buffer.length);
  group.kinds.add(sample.kind);
  return map;
}, new Map()).values()).map((group) => ({
  ...group,
  assets: group.assets.sort((a, b) => a - b),
  kinds: Array.from(group.kinds).sort(),
  minDecodedBytes: Math.min(...group.decodedBytes),
  maxDecodedBytes: Math.max(...group.decodedBytes),
}));

const fixedOffsetRows = analyzeFixedOffsets(samples);
const structuralCandidates = fixedOffsetRows.filter((row) => row.candidate);
const stringSignatures = analyzeStringWindows(samples);

const strongStructuralCandidates = structuralCandidates.filter((row) => {
  const usefulGroups = row.groups.filter((group) => group.samples >= 2 && group.stable && group.distinct[0] !== 0);
  return usefulGroups.length >= 3;
});

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-structural-family-audit-v1",
  source: {
    parserSeedFile,
    seedMode: seed.mode ?? null,
  },
  summary: {
    samples: samples.length,
    groups: groups.length,
    multiSampleGroups: groups.filter((group) => group.samples >= 2).length,
    fixedOffsetsScanned: 129,
    structuralCandidates: structuralCandidates.length,
    strongStructuralCandidates: strongStructuralCandidates.length,
    stringWindowSignatures: stringSignatures.length,
    sourceProofReady: false,
    promotionReady: false,
    assessment: {
      kind: strongStructuralCandidates.length > 0
        ? "slot-structural-family-candidates-need-broad-validation"
        : structuralCandidates.length > 0
          ? "slot-structural-family-weak-candidates-only"
          : "slot-structural-family-no-stable-discriminator",
      confidence: strongStructuralCandidates.length > 0 ? "medium" : "high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: strongStructuralCandidates.length > 0
        ? "Des offsets numeriques stables par famille existent, mais ils peuvent etre des layouts/affixes et doivent etre valides sur un corpus plus large avant toute promotion."
        : "Aucun discriminateur binaire stable et promouvable ne relie les payloads aux slots autorises.",
      nextAction: strongStructuralCandidates.length > 0
        ? "Elargir le corpus autour des offsets candidats et verifier un mapping explicite slot/equipement."
        : "Chercher une autre famille de records ou une source externe fiable pour allowedSlots.",
    },
  },
  groups,
  topFixedOffsetCandidates: fixedOffsetRows.slice(0, 30).map((row) => ({
    offset: row.offset,
    candidateScore: row.candidateScore,
    candidate: row.candidate,
    stableValues: row.stableValues,
    groups: row.groups.filter((group) => group.samples >= 2).map((group) => ({
      groupKey: group.groupKey,
      samples: group.samples,
      distinct: group.distinct,
      stable: group.stable,
    })),
  })),
  topStringWindowSignatures: stringSignatures.slice(0, 30),
  safeguards: [
    "Ne pas convertir un offset numerique stable en allowedSlots sans semantique explicite.",
    "Ne pas utiliser un discriminateur observe seulement sur des noms d'affixes comme preuve de slot.",
    "Un candidat structurel doit etre valide sur plusieurs familles et relie a une source equipment/aspect avant promotion.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-structural-family.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
