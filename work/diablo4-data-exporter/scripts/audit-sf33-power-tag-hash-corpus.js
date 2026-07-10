const fs = require("fs");
const path = require("path");

const parentSemanticsFile = process.argv[2] ?? "outputs/diablo4-sf33-parent-run-semantics/sf33-parent-run-semantics.json";
const outputsDir = process.argv[3] ?? "outputs";
const outDir = process.argv[4] ?? "outputs/diablo4-sf33-power-tag-hash-corpus";

const POWER_TAG = Buffer.from("PowerTag.SystemsTuningGlobals", "ascii");
const CONTEXT_LIMIT = 80;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(dir, predicate, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, result);
    } else if (predicate(fullPath)) {
      result.push(fullPath);
    }
  }
  return result;
}

function readUInt32Safe(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  return buffer.readUInt32LE(offset);
}

function extractAssetId(filePath) {
  const match = filePath.match(/diablo4-source-asset-(\d+)-payload/i);
  return match ? Number(match[1]) : null;
}

function findAll(buffer, needle) {
  const offsets = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const found = buffer.indexOf(needle, cursor);
    if (found < 0) break;
    offsets.push(found);
    cursor = found + 1;
  }
  return offsets;
}

function uint32Needle(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function compactContext(filePath, buffer, asciiOffset) {
  const prefixOffset = asciiOffset - 16;
  const prefixWords = [0, 4, 8, 12].map((delta) => readUInt32Safe(buffer, prefixOffset + delta));
  return {
    filePath,
    assetId: extractAssetId(filePath),
    asciiOffset,
    prefixOffset,
    prefixWords,
    prefixSignature: prefixWords.join(":"),
    hash: prefixWords[1],
    asciiPreview: buffer.subarray(asciiOffset, Math.min(buffer.length, asciiOffset + 80)).toString("ascii").replace(/[^\x20-\x7e]+/g, "."),
  };
}

function scanFile(filePath, targetHash, watchedHashes) {
  const buffer = fs.readFileSync(filePath);
  const powerTagContexts = findAll(buffer, POWER_TAG).map((offset) => compactContext(filePath, buffer, offset));
  const directHashHits = [];

  for (const hash of watchedHashes) {
    const needle = uint32Needle(hash);
    for (const offset of findAll(buffer, needle)) {
      directHashHits.push({
        filePath,
        assetId: extractAssetId(filePath),
        hash,
        offset,
        nearPowerTag: powerTagContexts.some((context) => Math.abs(context.prefixOffset + 4 - offset) <= 16),
      });
    }
  }

  return {
    filePath,
    powerTagContexts,
    directHashHits,
    hasTargetHash: directHashHits.some((hit) => hit.hash === targetHash),
  };
}

const parentSemantics = readJson(parentSemanticsFile);
const targetHash = parentSemantics.target?.next?.prefixWords?.[1]?.uint32 ?? null;
const upgradeHashes = (parentSemantics.upgrades ?? [])
  .map((row) => row.next?.prefixWords?.[1]?.uint32)
  .filter((value) => Number.isInteger(value));
const watchedHashes = [...new Set([targetHash, ...upgradeHashes].filter((value) => Number.isInteger(value)))];

const decodedFiles = walkFiles(outputsDir, (filePath) => filePath.endsWith(".decoded.bin"));
const scans = decodedFiles.map((filePath) => scanFile(filePath, targetHash, watchedHashes));
const powerTagContexts = scans.flatMap((scan) => scan.powerTagContexts);
const validPowerTagContexts = powerTagContexts.filter((context) =>
  context.prefixWords[0] === 0xffffffff && context.prefixWords[2] === 0 && context.prefixWords[3] === 0
);
const targetPowerTagContexts = validPowerTagContexts.filter((context) => context.hash === targetHash);
const externalTargetPowerTagContexts = targetPowerTagContexts.filter((context) => context.assetId !== 1663210);
const directTargetHashHits = scans.flatMap((scan) => scan.directHashHits).filter((hit) => hit.hash === targetHash);
const externalDirectTargetHashHits = directTargetHashHits.filter((hit) => hit.assetId !== 1663210);

const hashCounts = {};
for (const context of validPowerTagContexts) {
  hashCounts[context.hash] = (hashCounts[context.hash] ?? 0) + 1;
}

const hasExternalTargetPowerTag = externalTargetPowerTagContexts.length > 0;
const hasExternalTargetHash = externalDirectTargetHashHits.length > 0;

const assessment = {
  kind: hasExternalTargetPowerTag
    ? "sf33-power-tag-hash-has-external-systems-tuning-match"
    : hasExternalTargetHash
      ? "sf33-power-tag-hash-has-external-raw-hash-only"
      : "sf33-power-tag-hash-local-only",
  confidence: hasExternalTargetPowerTag ? "medium-high" : "high",
  blocker: "sf33-trigger-build-state-unmapped",
  promotionReady: false,
  buildStateReady: false,
  finding: hasExternalTargetPowerTag
    ? "Le hash PowerTag voisin de Mod.SoilRuler_B apparait aussi dans un contexte SystemsTuningGlobals externe, ce qui donne une piste de consommateur a decoder."
    : hasExternalTargetHash
      ? "Le hash PowerTag voisin de Mod.SoilRuler_B apparait ailleurs en brut, mais pas comme contexte SystemsTuningGlobals exploitable."
      : "Le hash PowerTag voisin de Mod.SoilRuler_B reste local aux payloads connus de l'asset cible et ne prouve pas de consommateur externe.",
  nextAction: hasExternalTargetPowerTag
    ? "Decoder les contextes externes qui partagent le hash PowerTag avant toute activation SF_33."
    : "Ne pas assimiler SystemsTuningGlobals a une activation; passer a une recherche corpus plus large ou traiter l'uptime.",
  evidence: {
    targetHash,
    watchedHashes,
    decodedFiles: decodedFiles.length,
    systemsTuningContexts: powerTagContexts.length,
    validSystemsTuningPrefixContexts: validPowerTagContexts.length,
    targetPowerTagContexts: targetPowerTagContexts.length,
    externalTargetPowerTagContexts: externalTargetPowerTagContexts.length,
    directTargetHashHits: directTargetHashHits.length,
    externalDirectTargetHashHits: externalDirectTargetHashHits.length,
    hashCounts,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-power-tag-hash-corpus-v1",
  source: {
    parentSemanticsFile,
    outputsDir,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    targetAssetId: 1663210,
    targetHash,
    decodedFiles: decodedFiles.length,
    systemsTuningContexts: powerTagContexts.length,
    validSystemsTuningPrefixContexts: validPowerTagContexts.length,
    targetPowerTagContexts: targetPowerTagContexts.length,
    externalTargetPowerTagContexts: externalTargetPowerTagContexts.length,
    directTargetHashHits: directTargetHashHits.length,
    externalDirectTargetHashHits: externalDirectTargetHashHits.length,
    promotionReady: false,
    buildStateReady: false,
    assessment,
  },
  targetPowerTagContexts: targetPowerTagContexts.slice(0, CONTEXT_LIMIT),
  externalTargetPowerTagContexts: externalTargetPowerTagContexts.slice(0, CONTEXT_LIMIT),
  directTargetHashHits: directTargetHashHits.slice(0, CONTEXT_LIMIT),
  externalDirectTargetHashHits: externalDirectTargetHashHits.slice(0, CONTEXT_LIMIT),
  validPowerTagContexts: validPowerTagContexts.slice(0, CONTEXT_LIMIT),
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-power-tag-hash-corpus.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
