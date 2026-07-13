const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const structureAuditFile = process.argv[3] ?? "outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-parent-systems-tuning-contexts";

const TARGET_ASSET_ID = 1663210;
const TARGET_TRIGGER = "Mod.SoilRuler_B";
const SYSTEMS_TUNING_PREFIX = "PowerTag.SystemsTuningGlobals";

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

function findU32Offsets(buffer, value) {
  const offsets = [];
  for (let offset = 0; offset <= buffer.length - 4; offset += 4) {
    if (u32At(buffer, offset) === value) offsets.push(offset);
  }
  return offsets;
}

function findAsciiOffsets(buffer, value) {
  const needle = Buffer.from(value, "ascii");
  const offsets = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const offset = buffer.indexOf(needle, cursor);
    if (offset < 0) break;
    offsets.push(offset);
    cursor = offset + 1;
  }
  return offsets;
}

function extractAsciiStrings(buffer, center, radius = 360) {
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
  return rows.slice(0, 32);
}

function wordSignature(buffer, center) {
  const rows = [];
  const start = Math.max(0, center - 16);
  const alignedStart = start - (start % 4);
  for (let offset = alignedStart; offset <= Math.min(buffer.length - 4, center + 24); offset += 4) {
    rows.push({
      delta: offset - center,
      u32: u32At(buffer, offset),
    });
  }
  return rows;
}

function nearest(offsets, center, maxDistance = 192) {
  return offsets
    .map((offset) => ({ offset, delta: offset - center, distance: Math.abs(offset - center) }))
    .filter((row) => row.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance || a.offset - b.offset)[0] ?? null;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value != null))].sort((a, b) => a - b);
}

function buildHashTargets(structureAudit) {
  const rows = [
    ...(structureAudit.target?.hits ?? []).map((hit) => ({ role: "target", ...hit })),
    ...(structureAudit.topHits ?? []).map((hit) => ({ role: "upgrade", ...hit })),
  ];
  const byHash = new Map();
  for (const row of rows) {
    const hash = row.suffixWords?.[3];
    if (!Number.isInteger(hash)) continue;
    const current = byHash.get(hash) ?? {
      hash,
      roles: new Set(),
      terms: new Set(),
      assetIds: new Set(),
      trailerSignatures: new Set(),
    };
    current.roles.add(row.role);
    current.terms.add(row.term);
    current.assetIds.add(Number(row.assetId));
    current.trailerSignatures.add(row.trailerSignature);
    byHash.set(hash, current);
  }
  return [...byHash.values()].map((row) => ({
    hash: row.hash,
    roles: [...row.roles].sort(),
    terms: [...row.terms].sort(),
    assetIds: [...row.assetIds].sort((a, b) => a - b),
    trailerSignatures: [...row.trailerSignatures].sort(),
  }));
}

function classifyContext({ assetId, target, prefixNear, modStrings }) {
  const localToKnownAsset = target.assetIds.includes(Number(assetId));
  const isTargetHash = target.roles.includes("target");
  if (isTargetHash && Number(assetId) !== TARGET_ASSET_ID) return "external-target-hash-context";
  if (isTargetHash && Number(assetId) === TARGET_ASSET_ID && prefixNear) return "target-local-systems-tuning-context";
  if (!isTargetHash && localToKnownAsset && prefixNear) return "upgrade-local-systems-tuning-context";
  if (!isTargetHash && !localToKnownAsset && prefixNear) return "upgrade-hash-external-context";
  if (modStrings.length) return "hash-near-mod-string";
  return "hash-only";
}

function scanFile(file, hashTargets) {
  const buffer = fs.readFileSync(file);
  const assetId = assetIdFromPath(file);
  const prefixOffsets = findAsciiOffsets(buffer, SYSTEMS_TUNING_PREFIX);
  const targetTriggerOffsets = findAsciiOffsets(buffer, TARGET_TRIGGER);
  const rows = [];
  for (const target of hashTargets) {
    for (const offset of findU32Offsets(buffer, target.hash)) {
      const strings = extractAsciiStrings(buffer, offset);
      const modStrings = strings.filter((row) => /Mod\.|Upgrade|SoilRuler|PowerTag\.SystemsTuningGlobals/i.test(row.value));
      const prefixNear = nearest(prefixOffsets, offset, 96);
      rows.push({
        file,
        assetId,
        hash: target.hash,
        roles: target.roles,
        terms: target.terms,
        targetAssetIds: target.assetIds,
        offset,
        kind: classifyContext({ assetId, target, prefixNear, modStrings }),
        prefixNear,
        targetTriggerNear: nearest(targetTriggerOffsets, offset, 256),
        wordSignature: wordSignature(buffer, offset),
        strings: modStrings.slice(0, 16),
      });
    }
  }
  return rows;
}

const structureAudit = readJson(structureAuditFile);
const hashTargets = buildHashTargets(structureAudit);
const files = listDecodedBins(rootDir);
const contexts = files.flatMap((file) => scanFile(file, hashTargets));
const targetHash = hashTargets.find((row) => row.roles.includes("target"))?.hash ?? null;
const targetContexts = contexts.filter((row) => row.hash === targetHash);
const externalTargetContexts = targetContexts.filter((row) => row.assetId !== TARGET_ASSET_ID);
const upgradeContexts = contexts.filter((row) => row.hash !== targetHash);
const externalUpgradeContexts = upgradeContexts.filter((row) => !(row.targetAssetIds ?? []).includes(Number(row.assetId)));
const systemsTuningContexts = contexts.filter((row) => row.prefixNear);
const externalTargetSystemsTuningContexts = externalTargetContexts.filter((row) => row.prefixNear);
const exactParentConsumerProven = false;
const canModifyReliableDps = false;
const promotionReady = false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-systems-tuning-contexts-v1",
  source: {
    rootDir,
    structureAuditFile,
    systemsTuningPrefix: SYSTEMS_TUNING_PREFIX,
    hashTargets,
  },
  summary: {
    filesScanned: files.length,
    hashTargets: hashTargets.length,
    contexts: contexts.length,
    systemsTuningContexts: systemsTuningContexts.length,
    targetHash,
    targetContexts: targetContexts.length,
    externalTargetContexts: externalTargetContexts.length,
    externalTargetSystemsTuningContexts: externalTargetSystemsTuningContexts.length,
    upgradeContexts: upgradeContexts.length,
    externalUpgradeContexts: externalUpgradeContexts.length,
    contextAssetIds: uniqueSorted(contexts.map((row) => row.assetId)),
    exactParentConsumerProven,
    promotionReady,
    canModifyReliableDps,
    assessment: {
      kind: externalTargetSystemsTuningContexts.length
        ? "delta-parent-systems-tuning-external-target-contexts-found"
        : externalTargetContexts.length
          ? "delta-parent-systems-tuning-external-target-hash-only"
          : "delta-parent-systems-tuning-target-local-only",
      confidence: externalTargetContexts.length ? "medium-high" : "high",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady,
      finding: externalTargetSystemsTuningContexts.length
        ? "Le hash SystemsTuningGlobals cible apparait hors asset local dans un contexte PowerTag exploitable, a decoder avant promotion."
        : externalTargetContexts.length
          ? "Le hash cible apparait hors asset local, mais pas dans un contexte SystemsTuningGlobals exploitable."
          : "Le hash SystemsTuningGlobals cible reste local a l'asset SoilRuler dans le corpus decode.",
      nextAction: externalTargetSystemsTuningContexts.length
        ? "Auditer ces contextes externes et exiger un lien explicite vers une option de build-state."
        : "Poursuivre vers les payloads non decodes ou les tables superieures non textuelles; garder SF_33 bloque.",
    },
  },
  targetContexts,
  externalTargetContexts,
  upgradeContexts: upgradeContexts.slice(0, 80),
  externalUpgradeContexts: externalUpgradeContexts.slice(0, 80),
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Un contexte SystemsTuningGlobals local ou un hash seul ne prouve pas l'activation SF_33.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-systems-tuning-contexts.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
