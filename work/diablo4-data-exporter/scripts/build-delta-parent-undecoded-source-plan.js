const fs = require("fs");
const path = require("path");

const externalRefsFile = process.argv[2] ?? "outputs/diablo4-external-references/external-references.json";
const systemsTuningFile = process.argv[3] ?? "outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-parent-undecoded-source-plan";
const dataDir = process.argv[5] ?? "C:\\Program Files (x86)\\Diablo IV\\Data\\data";

const TARGET_ASSET_ID = 1663210;
const TARGET_TERMS = [
  "Mod.SoilRuler_B",
  "SoilRuler",
  "Spiritborn_Talent_Ultimate_2",
  "PowerTag.Spiritborn_Talent_Ultimate_2",
  "Spiritborn_Centipede_Ultimate",
  "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate",
  "SystemsTuningGlobals.Script Formula 0",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function decodedPayloads(assetId) {
  const dir = path.join("outputs", `diablo4-source-asset-${assetId}-payload`);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".decoded.bin"))
    .map((name) => path.join(dir, name));
}

function textFromAsset(asset) {
  return JSON.stringify({
    assetId: asset.assetId,
    tags: asset.tags,
    externalIdentity: asset.externalIdentity,
    required: asset.required,
    mergedReferences: asset.mergedReferences,
  });
}

function scoreAsset(asset, systemsTuning) {
  const text = textFromAsset(asset);
  const matchedTerms = TARGET_TERMS.filter((term) => text.includes(term));
  const classTags = asset.externalIdentity?.classTags ?? [];
  const hasSpiritborn = /Spiritborn/i.test(text) || classTags.includes("Spiritborn");
  const hasPowerTag = asset.externalIdentity?.hasPowerTag === true || /PowerTag/i.test(text);
  const hasTableScaling = asset.externalIdentity?.hasTableScaling === true || /Table/i.test(text);
  const hasTargetBonus = /Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate/.test(text);
  const isTargetAsset = Number(asset.assetId) === TARGET_ASSET_ID;
  const alreadyDecoded = decodedPayloads(asset.assetId).length > 0;
  const externalHashAssetIds = new Set((systemsTuning.externalTargetContexts ?? []).map((row) => Number(row.assetId)));
  const contextHashAssetIds = new Set(systemsTuning.summary?.contextAssetIds ?? []);
  let score = 0;
  if (isTargetAsset) score += 100;
  score += matchedTerms.length * 20;
  if (hasTargetBonus) score += 35;
  if (hasSpiritborn) score += 25;
  if (hasPowerTag) score += 10;
  if (hasTableScaling) score += 8;
  if (externalHashAssetIds.has(Number(asset.assetId))) score += 50;
  if (contextHashAssetIds.has(Number(asset.assetId))) score += 8;
  if (!alreadyDecoded) score += 12;
  return {
    score,
    matchedTerms,
    hasSpiritborn,
    hasPowerTag,
    hasTableScaling,
    hasTargetBonus,
    isTargetAsset,
    alreadyDecoded,
  };
}

function decodeCommand(asset) {
  const source = asset.source ?? {};
  if (!source.fileName || !Number.isFinite(Number(source.blteOffset))) return null;
  return [
    "&",
    psQuote(process.execPath),
    psQuote(path.resolve("work", "diablo4-data-exporter", "d4export.js")),
    "decode-blte",
    "--file",
    psQuote(path.join(dataDir, source.fileName)),
    "--offset",
    String(source.blteOffset),
    "--out",
    psQuote(path.resolve("outputs", `diablo4-source-asset-${asset.assetId}-payload`)),
  ].join(" ");
}

const externalRefs = readJson(externalRefsFile);
const systemsTuning = readJson(systemsTuningFile);
const rows = (externalRefs.assets ?? []).map((asset) => {
  const score = scoreAsset(asset, systemsTuning);
  return {
    assetId: asset.assetId,
    fileName: asset.source?.fileName ?? null,
    blteOffset: asset.source?.blteOffset ?? null,
    tags: asset.tags ?? [],
    score: score.score,
    matchedTerms: score.matchedTerms,
    hasSpiritborn: score.hasSpiritborn,
    hasPowerTag: score.hasPowerTag,
    hasTableScaling: score.hasTableScaling,
    hasTargetBonus: score.hasTargetBonus,
    alreadyDecoded: score.alreadyDecoded,
    decodedPayloads: decodedPayloads(asset.assetId),
    externalIdentity: asset.externalIdentity ?? null,
    required: asset.required ?? null,
    requiredAction: score.alreadyDecoded ? "already-decoded-review-structure" : "decode-targeted-source",
    decodeCommand: score.alreadyDecoded ? null : decodeCommand(asset),
  };
}).filter((row) => row.score > 0)
  .sort((a, b) => b.score - a.score || a.assetId - b.assetId);

const highPriority = rows.filter((row) => row.hasSpiritborn || row.hasTargetBonus || row.assetId === TARGET_ASSET_ID);
const missingDecode = highPriority.filter((row) => !row.alreadyDecoded && row.decodeCommand);
const alreadyDecoded = highPriority.filter((row) => row.alreadyDecoded);
const nextDecodeQueue = missingDecode.slice(0, 8);
const scriptLines = [
  "$ErrorActionPreference = 'Stop'",
  "",
  ...nextDecodeQueue.flatMap((row) => [
    `# Decode asset ${row.assetId} (${row.fileName} @ ${row.blteOffset})`,
    row.decodeCommand,
    "",
  ]),
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-undecoded-source-plan-v1",
  source: {
    externalRefsFile,
    systemsTuningFile,
    dataDir,
    targetAssetId: TARGET_ASSET_ID,
    targetTerms: TARGET_TERMS,
  },
  summary: {
    externalReferenceAssets: externalRefs.assets?.length ?? 0,
    scoredAssets: rows.length,
    highPriorityAssets: highPriority.length,
    alreadyDecodedHighPriority: alreadyDecoded.length,
    missingDecodeHighPriority: missingDecode.length,
    nextDecodeAssets: nextDecodeQueue.map((row) => row.assetId),
    exactParentConsumerProven: false,
    promotionReady: false,
    canModifyReliableDps: false,
    assessment: {
      kind: missingDecode.length
        ? "delta-parent-undecoded-source-plan-has-targeted-decodes"
        : "delta-parent-undecoded-source-plan-no-missing-targeted-decodes",
      confidence: "high",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: missingDecode.length
        ? "Des assets sources pertinents pour SoilRuler/SF33 ne sont pas encore decodes et doivent etre inspectes avant de chercher un consommateur non textuel."
        : "Les assets sources prioritaires du graphe externe sont deja decodes ou absents de la cible SoilRuler.",
      nextAction: missingDecode.length
        ? "Decoder uniquement la file ciblee, puis relancer les scans de contextes et de references."
        : "Passer a une inspection de tables superieures non textuelles sur les payloads deja disponibles.",
    },
  },
  highPriority,
  nextDecodeQueue,
  allScoredAssets: rows,
  decodeScript: {
    path: path.join(outDir, "run-targeted-delta-parent-decodes.ps1"),
    commands: nextDecodeQueue.map((row) => row.decodeCommand),
  },
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Un plan de decodage cible ne prouve pas SF_33 et ne modifie pas reliableDps.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-undecoded-source-plan.json");
const scriptFile = path.join(outDir, "run-targeted-delta-parent-decodes.ps1");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(scriptFile, scriptLines.join("\r\n"));
console.log(JSON.stringify({ outFile, scriptFile, summary: report.summary }, null, 2));
