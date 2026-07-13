const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const deltaParentAuditFile = process.argv[3] ?? "outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-parent-consumer-corpus-scan";

const TARGET_ASSET_ID = 1663210;
const TARGET_TRIGGER = "Mod.SoilRuler_B";
const TARGET_BONUS_HASH = "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate";
const TARGET_POWER_TAG_HASH = 2084621218;
const TARGET_SELECTOR = 949;
const TARGET_METADATA = 12337;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

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

function u32At(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  return buffer.readUInt32LE(offset);
}

function f32At(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  const value = buffer.readFloatLE(offset);
  return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
}

function findAsciiOffsets(buffer, needle) {
  const offsets = [];
  const target = Buffer.from(needle, "ascii");
  let start = 0;
  while (start < buffer.length) {
    const index = buffer.indexOf(target, start);
    if (index < 0) break;
    offsets.push(index);
    start = index + 1;
  }
  return offsets;
}

function findU32Offsets(buffer, value) {
  const offsets = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    if (u32At(buffer, offset) === value) offsets.push(offset);
  }
  return offsets;
}

function extractAsciiStrings(buffer, center, radius = 220) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  const text = buffer.subarray(start, end).toString("latin1");
  const rows = [];
  const regex = /[\x20-\x7e]{4,}/g;
  let match;
  while ((match = regex.exec(text))) {
    rows.push({
      offset: start + match.index,
      value: match[0],
    });
  }
  return rows.slice(0, 24);
}

function wordWindow(buffer, center, before = 32, after = 64) {
  const rows = [];
  const start = Math.max(0, center - before);
  const alignedStart = start - (start % 4);
  const end = Math.min(buffer.length - 4, center + after);
  for (let offset = alignedStart; offset <= end; offset += 4) {
    rows.push({
      offset,
      distance: offset - center,
      u32: u32At(buffer, offset),
      f32: f32At(buffer, offset),
    });
  }
  return rows;
}

function nearest(offsets, center, maxDistance = 512) {
  const rows = offsets
    .map((offset) => ({ offset, distance: offset - center, absDistance: Math.abs(offset - center) }))
    .filter((row) => row.absDistance <= maxDistance)
    .sort((a, b) => a.absDistance - b.absDistance || a.offset - b.offset);
  return rows[0] ?? null;
}

function classifyHit({ assetId, triggerOffsets, bonusOffsets, hashOffsets, assetOffsets, selectorOffsets, metadataOffsets, directOffsetRefs }) {
  const targetAsset = Number(assetId) === TARGET_ASSET_ID;
  if (!targetAsset && (triggerOffsets.length || bonusOffsets.length)) return "external-explicit-string-candidate";
  if (!targetAsset && hashOffsets.length && directOffsetRefs.length) return "external-hash-reference-candidate";
  if (!targetAsset && hashOffsets.length) return "external-hash-only";
  if (targetAsset && directOffsetRefs.length) return "target-local-trigger-with-offset-reference";
  if (targetAsset && (triggerOffsets.length || bonusOffsets.length || hashOffsets.length)) return "target-local-context";
  if (!targetAsset && selectorOffsets.length && metadataOffsets.length && assetOffsets.length) return "external-selector-asset-layout-only";
  return "unclassified";
}

function buildFileHit(file) {
  const buffer = fs.readFileSync(file);
  const assetId = assetIdFromPath(file);
  const triggerOffsets = findAsciiOffsets(buffer, TARGET_TRIGGER);
  const bonusOffsets = findAsciiOffsets(buffer, TARGET_BONUS_HASH);
  const hashOffsets = findU32Offsets(buffer, TARGET_POWER_TAG_HASH);
  const assetOffsets = findU32Offsets(buffer, TARGET_ASSET_ID);
  const selectorOffsets = findU32Offsets(buffer, TARGET_SELECTOR);
  const metadataOffsets = findU32Offsets(buffer, TARGET_METADATA);
  const directOffsetRefs = triggerOffsets.flatMap((triggerOffset) => findU32Offsets(buffer, triggerOffset)
    .map((offset) => ({ offset, value: triggerOffset })));
  const interesting = [
    ...triggerOffsets.map((offset) => ({ kind: "trigger-string", offset })),
    ...bonusOffsets.map((offset) => ({ kind: "bonus-string", offset })),
    ...hashOffsets.map((offset) => ({ kind: "power-tag-hash", offset })),
    ...directOffsetRefs.map((row) => ({ kind: "direct-trigger-offset-ref", offset: row.offset })),
  ].sort((a, b) => a.offset - b.offset);

  if (!interesting.length && !(selectorOffsets.length && metadataOffsets.length && assetOffsets.length)) return null;

  const centers = interesting.length ? interesting.slice(0, 8) : selectorOffsets.slice(0, 4).map((offset) => ({ kind: "selector-layout", offset }));
  return {
    file,
    assetId,
    decodedBytes: buffer.length,
    kind: classifyHit({ assetId, triggerOffsets, bonusOffsets, hashOffsets, assetOffsets, selectorOffsets, metadataOffsets, directOffsetRefs }),
    counts: {
      triggerOffsets: triggerOffsets.length,
      bonusOffsets: bonusOffsets.length,
      targetPowerTagHashOffsets: hashOffsets.length,
      targetAssetIdOffsets: assetOffsets.length,
      selector949Offsets: selectorOffsets.length,
      metadata12337Offsets: metadataOffsets.length,
      directTriggerOffsetRefs: directOffsetRefs.length,
    },
    nearestLinks: triggerOffsets.slice(0, 4).map((triggerOffset) => ({
      triggerOffset,
      nearestHash: nearest(hashOffsets, triggerOffset),
      nearestBonus: nearest(bonusOffsets, triggerOffset),
      nearestAsset: nearest(assetOffsets, triggerOffset),
      nearestSelector: nearest(selectorOffsets, triggerOffset),
      nearestMetadata: nearest(metadataOffsets, triggerOffset),
    })),
    contexts: centers.map((center) => ({
      kind: center.kind,
      offset: center.offset,
      strings: extractAsciiStrings(buffer, center.offset),
      words: wordWindow(buffer, center.offset),
    })),
  };
}

const deltaParentAudit = readJson(deltaParentAuditFile);
const files = listDecodedBins(rootDir);
const hits = files.map(buildFileHit).filter(Boolean);
const explicitExternalCandidates = hits.filter((hit) => hit.kind === "external-explicit-string-candidate");
const hashReferenceCandidates = hits.filter((hit) => hit.kind === "external-hash-reference-candidate");
const hashOnlyCandidates = hits.filter((hit) => hit.kind === "external-hash-only");
const targetLocalHits = hits.filter((hit) => hit.kind.startsWith("target-local"));
const selectorLayoutOnly = hits.filter((hit) => hit.kind === "external-selector-asset-layout-only");
const parentConsumerCandidates = [...explicitExternalCandidates, ...hashReferenceCandidates];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-consumer-corpus-scan-v1",
  source: {
    rootDir,
    deltaParentAuditFile,
    target: {
      assetId: TARGET_ASSET_ID,
      trigger: TARGET_TRIGGER,
      bonusHash: TARGET_BONUS_HASH,
      powerTagHash: TARGET_POWER_TAG_HASH,
      selector: TARGET_SELECTOR,
      metadata: TARGET_METADATA,
    },
  },
  summary: {
    filesScanned: files.length,
    hits: hits.length,
    targetLocalHits: targetLocalHits.length,
    explicitExternalCandidates: explicitExternalCandidates.length,
    hashReferenceCandidates: hashReferenceCandidates.length,
    hashOnlyCandidates: hashOnlyCandidates.length,
    selectorLayoutOnly: selectorLayoutOnly.length,
    parentConsumerCandidates: parentConsumerCandidates.length,
    previousFailedGates: deltaParentAudit.summary?.failedGateIds ?? [],
    exactParentConsumerProven: false,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: parentConsumerCandidates.length
        ? "delta-parent-consumer-corpus-has-review-candidates"
        : hashOnlyCandidates.length
          ? "delta-parent-consumer-corpus-hash-only-candidates"
          : "delta-parent-consumer-corpus-local-only",
      confidence: hits.length ? "medium-high" : "medium",
      promotionReady: false,
      finding: parentConsumerCandidates.length
        ? "Le corpus decode contient des candidats externes a examiner, mais aucune preuve n'est promue automatiquement."
        : hashOnlyCandidates.length
          ? "Le corpus decode contient des occurrences du hash cible hors asset local, sans reference parent/consommateur exploitable."
          : "Le corpus decode actuel ne trouve pas de parent/consommateur externe pour Mod.SoilRuler_B.",
      nextAction: parentConsumerCandidates.length
        ? "Inspecter les candidats externes et exiger un champ source explicite avant tout bridge."
        : "Elargir le scan aux payloads non encore decodes ou aux tables binaires hors chaines.",
    },
  },
  candidates: parentConsumerCandidates.slice(0, 40),
  hashOnlyCandidates: hashOnlyCandidates.slice(0, 40),
  targetLocalHits,
  selectorLayoutOnly: selectorLayoutOnly.slice(0, 40),
  safeguards: [
    "Un hit de hash sans champ source explicite ne prouve pas SF_33.",
    "Une occurrence locale dans 1663210 reste contexte local, pas parent externe.",
    "Aucun candidat de ce scan ne peut modifier reliableDps sans bridge parseur et invariant dedie.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-consumer-corpus-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
