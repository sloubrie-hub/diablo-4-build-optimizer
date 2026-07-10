const fs = require("fs");
const path = require("path");

const peers = [
  {
    assetId: 1663210,
    label: "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate",
    file: "outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin",
    anchorOffset: 19016,
  },
  {
    assetId: 1953817,
    label: "1 + Bonus_Percent_Per_Power#Spiritborn_Feather_Spawn",
    file: "outputs/diablo4-source-asset-1953817-payload/data.007.8270942.decoded.bin",
    anchorOffset: 6764,
  },
];

function findU32(buffer, value) {
  const offsets = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    if (buffer.readUInt32LE(offset) === value) offsets.push(offset);
  }
  return offsets;
}

function findFloat32(buffer, value) {
  const offsets = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    if (Math.abs(buffer.readFloatLE(offset) - value) < 0.00001) offsets.push(offset);
  }
  return offsets;
}

function nearest(offsets, anchor) {
  if (!offsets.length) return null;
  const best = offsets
    .map((offset) => ({ offset, distance: offset - anchor, absDistance: Math.abs(offset - anchor) }))
    .sort((a, b) => a.absDistance - b.absDistance || a.offset - b.offset)[0];
  return { offset: best.offset, distance: best.distance };
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function hexWindow(buffer, center, radius = 32) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  return {
    start,
    end,
    hex: buffer.subarray(start, end).toString("hex"),
  };
}

function inspectPeer(peer) {
  const buffer = fs.readFileSync(peer.file);
  const selectorOffsets = findU32(buffer, 949);
  const metadataOffsets = findU32(buffer, 12337);
  const float10Offsets = findFloat32(buffer, 10);
  const assetOffsets = findU32(buffer, peer.assetId);
  const anchor = nearest(selectorOffsets, peer.anchorOffset) ?? { offset: peer.anchorOffset, distance: 0 };
  const words = [];
  for (let offset = anchor.offset - 32; offset <= anchor.offset + 48; offset += 4) {
    words.push({
      offset,
      distance: offset - anchor.offset,
      u32: u32At(buffer, offset),
    });
  }

  const nearestMetadata = nearest(metadataOffsets, anchor.offset);
  const nearestFloat10 = nearest(float10Offsets, anchor.offset);
  const nearestAsset = nearest(assetOffsets, anchor.offset);
  const compactCandidate =
    nearestMetadata &&
    nearestFloat10 &&
    nearestAsset &&
    nearestAsset.distance === 4 &&
    nearestMetadata.distance === 16 &&
    nearestFloat10.distance === 24;

  return {
    assetId: peer.assetId,
    label: peer.label,
    file: peer.file,
    decodedBytes: buffer.length,
    anchorOffset: anchor.offset,
    selector949Offsets: selectorOffsets,
    metadata12337Offsets: metadataOffsets,
    float10Offsets,
    assetIdOffsets: assetOffsets,
    nearest: {
      metadata12337: nearestMetadata,
      float10: nearestFloat10,
      assetId: nearestAsset,
    },
    compactCandidate,
    words,
    hexWindow: hexWindow(buffer, anchor.offset),
  };
}

const rows = peers.map(inspectPeer);
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-949-peer-audit-v1",
  summary: {
    peers: rows.length,
    compactCandidates: rows.filter((row) => row.compactCandidate).length,
    selector949Assets: rows.map((row) => row.assetId),
    assessment: {
      kind: "selector-949-peer-compact-not-repeated",
      confidence: "high",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding:
        "Les deux assets selector:949 ne partagent pas le compact 949/asset/0/0/12337/6/10; seul 1663210 porte metadata 12337 et float 10 dans la fenetre locale.",
      nextAction:
        "Trouver un second asset selector:949 avec metadata 12337/10 dans la meme fenetre locale, ou une table source qui explique la divergence.",
      evidence: {
        peers: rows.length,
        compactCandidates: rows.filter((row) => row.compactCandidate).map((row) => row.assetId),
      },
    },
  },
  rows,
};

const outDir = "outputs/diablo4-selector-949-peer-audit";
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "selector-949-peer-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
