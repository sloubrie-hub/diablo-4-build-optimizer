const fs = require("fs");
const path = require("path");

const undecodedPlanFile = process.argv[2] ?? "outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json";
const systemsTuningFile = process.argv[3] ?? "outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-parent-nontext-table-signals";

const TARGET_ASSET_ID = 1663210;
const TARGET_SELECTOR = 949;
const TARGET_METADATA = 12337;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function findU32Offsets(buffer, value) {
  const offsets = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    if (u32At(buffer, offset) === value) offsets.push(offset);
  }
  return offsets;
}

function extractAsciiStrings(buffer, center, radius = 192) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  const text = buffer.subarray(start, end).toString("latin1");
  const rows = [];
  const regex = /[\x20-\x7e]{4,}/g;
  let match;
  while ((match = regex.exec(text))) {
    rows.push({
      offset: start + match.index,
      delta: start + match.index - center,
      value: match[0],
    });
  }
  return rows;
}

function wordWindow(buffer, center, before = 32, after = 80) {
  const start = Math.max(0, center - before);
  const alignedStart = start - (start % 4);
  const end = Math.min(buffer.length - 4, center + after);
  const rows = [];
  for (let offset = alignedStart; offset <= end; offset += 4) {
    const u32 = u32At(buffer, offset);
    rows.push({
      offset,
      delta: offset - center,
      u32,
      f32: f32At(buffer, offset),
      pointerLike: Number.isInteger(u32) && u32 >= 0 && u32 < buffer.length,
    });
  }
  return rows;
}

function nearest(offsets, center, maxDistance = 128) {
  return offsets
    .map((offset) => ({ offset, delta: offset - center, distance: Math.abs(offset - center) }))
    .filter((row) => row.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance || a.offset - b.offset)[0] ?? null;
}

function classifyOccurrence({ valueName, center, strings, selectorOffsets, assetOffsets, metadataOffsets, triggerOffsets, systemsPrefixOffsets }) {
  const nearText = strings.some((row) => Math.abs(row.delta) <= 64);
  const nearTrigger = nearest(triggerOffsets, center, 128);
  const nearSystemsPrefix = nearest(systemsPrefixOffsets, center, 128);
  const nearSelector = nearest(selectorOffsets, center, 64);
  const nearAsset = nearest(assetOffsets, center, 64);
  const nearMetadata = nearest(metadataOffsets, center, 64);
  if (valueName === "targetHash" && nearTrigger && nearSystemsPrefix) return "target-hash-inline-systems-tuning";
  if (valueName === "targetHash" && !nearText) return "target-hash-nontext-table-signal";
  if (valueName === "selector949" && nearAsset) return "selector-asset-layout-signal";
  if (valueName === "metadata12337" && (nearSelector || nearAsset)) return "metadata-selector-asset-layout-signal";
  if (nearText) return "text-adjacent-signal";
  return "unclassified-nontext-signal";
}

function inspectDecodedPayload(asset, decodedFile, targetHash) {
  const buffer = fs.readFileSync(decodedFile);
  const targetHashOffsets = findU32Offsets(buffer, targetHash);
  const selectorOffsets = findU32Offsets(buffer, TARGET_SELECTOR);
  const assetOffsets = findU32Offsets(buffer, TARGET_ASSET_ID);
  const metadataOffsets = findU32Offsets(buffer, TARGET_METADATA);
  const triggerOffsets = [];
  const triggerNeedle = Buffer.from("Mod.SoilRuler_B", "ascii");
  for (let offset = buffer.indexOf(triggerNeedle); offset >= 0; offset = buffer.indexOf(triggerNeedle, offset + 1)) triggerOffsets.push(offset);
  const systemsNeedle = Buffer.from("PowerTag.SystemsTuningGlobals", "ascii");
  const systemsPrefixOffsets = [];
  for (let offset = buffer.indexOf(systemsNeedle); offset >= 0; offset = buffer.indexOf(systemsNeedle, offset + 1)) systemsPrefixOffsets.push(offset);

  const occurrenceInputs = [
    ...targetHashOffsets.map((offset) => ({ valueName: "targetHash", value: targetHash, offset })),
    ...selectorOffsets.map((offset) => ({ valueName: "selector949", value: TARGET_SELECTOR, offset })),
    ...metadataOffsets.map((offset) => ({ valueName: "metadata12337", value: TARGET_METADATA, offset })),
    ...assetOffsets.map((offset) => ({ valueName: "targetAssetId", value: TARGET_ASSET_ID, offset })),
  ];

  const occurrences = occurrenceInputs.map((row) => {
    const strings = extractAsciiStrings(buffer, row.offset);
    const words = wordWindow(buffer, row.offset);
    return {
      ...row,
      kind: classifyOccurrence({
        valueName: row.valueName,
        center: row.offset,
        strings,
        selectorOffsets,
        assetOffsets,
        metadataOffsets,
        triggerOffsets,
        systemsPrefixOffsets,
      }),
      nearSelector: nearest(selectorOffsets, row.offset, 96),
      nearTargetAsset: nearest(assetOffsets, row.offset, 96),
      nearMetadata: nearest(metadataOffsets, row.offset, 96),
      nearTrigger: nearest(triggerOffsets, row.offset, 160),
      nearSystemsPrefix: nearest(systemsPrefixOffsets, row.offset, 160),
      pointerLikeWords: words.filter((word) => word.pointerLike && word.u32 !== row.offset).slice(0, 12),
      words,
      strings: strings.slice(0, 16),
    };
  });

  const targetHashNontext = occurrences.filter((row) => row.kind === "target-hash-nontext-table-signal");
  const selectorAssetLayouts = occurrences.filter((row) => row.kind === "selector-asset-layout-signal" || row.kind === "metadata-selector-asset-layout-signal");
  return {
    assetId: asset.assetId,
    decodedFile,
    decodedBytes: buffer.length,
    summary: {
      targetHashOffsets: targetHashOffsets.length,
      selector949Offsets: selectorOffsets.length,
      targetAssetIdOffsets: assetOffsets.length,
      metadata12337Offsets: metadataOffsets.length,
      targetHashNontextSignals: targetHashNontext.length,
      selectorAssetLayoutSignals: selectorAssetLayouts.length,
    },
    occurrences,
  };
}

const undecodedPlan = readJson(undecodedPlanFile);
const systemsTuning = readJson(systemsTuningFile);
const targetHash = systemsTuning.summary?.targetHash;
const highPriority = undecodedPlan.highPriority ?? [];
const inspectedAssets = highPriority.map((asset) => ({
  assetId: asset.assetId,
  decodedPayloads: asset.decodedPayloads ?? [],
  inspections: (asset.decodedPayloads ?? []).map((decodedFile) => inspectDecodedPayload(asset, decodedFile, targetHash)),
}));

const allInspections = inspectedAssets.flatMap((asset) => asset.inspections);
const allOccurrences = allInspections.flatMap((inspection) => inspection.occurrences.map((occurrence) => ({
  assetId: inspection.assetId,
  decodedFile: inspection.decodedFile,
  ...occurrence,
})));
const targetHashNontextSignals = allOccurrences.filter((row) => row.kind === "target-hash-nontext-table-signal");
const linkedTargetHashSignals = targetHashNontextSignals.filter((row) => row.nearSelector || row.nearTargetAsset || row.nearTrigger);
const selectorAssetLayoutSignals = allOccurrences.filter((row) =>
  row.kind === "selector-asset-layout-signal" || row.kind === "metadata-selector-asset-layout-signal"
);
const exactParentConsumerProven = false;
const canModifyReliableDps = false;
const promotionReady = false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-nontext-table-signals-v1",
  source: {
    undecodedPlanFile,
    systemsTuningFile,
    targetHash,
    targetAssetId: TARGET_ASSET_ID,
    selector: TARGET_SELECTOR,
    metadata: TARGET_METADATA,
  },
  summary: {
    inspectedAssets: inspectedAssets.length,
    inspectedPayloads: allInspections.length,
    occurrences: allOccurrences.length,
    targetHashNontextSignals: targetHashNontextSignals.length,
    linkedTargetHashSignals: linkedTargetHashSignals.length,
    selectorAssetLayoutSignals: selectorAssetLayoutSignals.length,
    exactParentConsumerProven,
    promotionReady,
    canModifyReliableDps,
    assessment: {
      kind: targetHashNontextSignals.length && linkedTargetHashSignals.length === 0
        ? "delta-parent-nontext-target-hash-unlinked"
        : linkedTargetHashSignals.length
          ? "delta-parent-nontext-target-hash-linked-candidate"
          : "delta-parent-nontext-no-target-hash-signal",
      confidence: targetHashNontextSignals.length && linkedTargetHashSignals.length === 0 ? "high" : "medium",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady,
      finding: targetHashNontextSignals.length && linkedTargetHashSignals.length === 0
        ? "Une occurrence non textuelle du hash cible existe, mais elle n'est pas reliee localement au trigger, au selector ou a l'asset cible."
        : linkedTargetHashSignals.length
          ? "Une occurrence non textuelle du hash cible est proche d'un signal cible et doit etre inspectee manuellement avant toute promotion."
          : "Aucun signal de table superieure non textuelle n'a ete trouve pour le hash cible.",
      nextAction: linkedTargetHashSignals.length
        ? "Inspecter manuellement les mots autour des candidats lies et exiger un champ source explicite."
        : "Clore cette couche locale pour SF_33 et prioriser un autre blocage ou une preuve externe source-backed.",
    },
  },
  inspectedAssets,
  targetHashNontextSignals,
  linkedTargetHashSignals,
  selectorAssetLayoutSignals: selectorAssetLayoutSignals.slice(0, 40),
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Un signal numerique non textuel sans lien local au trigger/selector/asset ne prouve pas SF_33.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-nontext-table-signals.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
