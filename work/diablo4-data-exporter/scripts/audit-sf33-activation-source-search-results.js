const fs = require("fs");
const path = require("path");

const mergedSearchFile = process.argv[2] ?? "outputs/diablo4-sf33-activation-source-search-plan/sf33-activation-source-merged/external-target-search-merged.json";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-activation-source-search-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function groupAssets(groups, key) {
  return groups[key]?.assets ?? [];
}

function uniqueAssets(assets) {
  const seen = new Set();
  const rows = [];
  for (const asset of assets) {
    const assetId = asset.assetId ?? null;
    const rowKey = `${assetId}:${asset.source?.fileName ?? ""}:${asset.source?.blteOffset ?? ""}`;
    if (seen.has(rowKey)) continue;
    seen.add(rowKey);
    rows.push({
      assetId,
      fileName: asset.source?.fileName ?? null,
      blteOffset: asset.source?.blteOffset ?? null,
      score: asset.score ?? 0,
      confidence: asset.confidence ?? "unknown",
      hitKinds: asset.hitKinds ?? [],
      sampleValues: asset.sampleValues ?? [],
    });
  }
  return rows;
}

function byAssetId(rows, assetId) {
  return rows.filter((row) => Number(row.assetId) === Number(assetId));
}

function withoutAssetId(rows, assetId) {
  return rows.filter((row) => Number(row.assetId) !== Number(assetId));
}

function collectRows(groups, keys) {
  return uniqueAssets(keys.flatMap((key) => groupAssets(groups, key).map((asset) => ({ ...asset, groupKey: key }))));
}

function compactGroup(groups, key) {
  const group = groups[key];
  if (!group) {
    return {
      key,
      hits: 0,
      assets: [],
    };
  }
  return {
    key,
    hits: group.hits ?? 0,
    assets: uniqueAssets(group.assets ?? []),
  };
}

const merged = readJson(mergedSearchFile);
const groups = merged.groups ?? {};
const targetAssetId = 1663210;

const triggerKeys = ["Mod.SoilRuler_B", "SoilRuler", "Soil_Ruler"];
const ownerKeys = [
  "Spiritborn_Talent_Ultimate_2",
  "PowerTag.Spiritborn_Talent_Ultimate_2",
  "Spiritborn_Centipede_Ultimate",
  "Centipede_Ultimate",
  "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate",
  "Ultimate_2",
];
const genericUpgradeKeys = ["Mod.UpgradeB", "Mod.UpgradeC", "UpgradeB", "UpgradeC"];

const triggerRows = collectRows(groups, triggerKeys);
const ownerRows = collectRows(groups, ownerKeys);
const upgradeRows = collectRows(groups, genericUpgradeKeys);
const externalTriggerRows = withoutAssetId(triggerRows, targetAssetId);
const externalOwnerRows = withoutAssetId(ownerRows, targetAssetId);
const currentTriggerRows = byAssetId(triggerRows, targetAssetId);
const currentOwnerRows = byAssetId(ownerRows, targetAssetId);

const upgradeAssets = upgradeRows.map((row) => {
  const groupsForAsset = genericUpgradeKeys.filter((key) =>
    groupAssets(groups, key).some((asset) => Number(asset.assetId) === Number(row.assetId))
  );
  return {
    ...row,
    groups: groupsForAsset,
    relevance: groupsForAsset.some((key) => /^Mod\.Upgrade/.test(key))
      ? "generic-build-state-analogy"
      : "generic-upgrade-name",
  };
});

const hasExternalTrigger = externalTriggerRows.length > 0;
const hasExternalOwner = externalOwnerRows.length > 0;
const hasOnlyCurrentTrigger = currentTriggerRows.length > 0 && !hasExternalTrigger;
const hasOnlyCurrentOwner = currentOwnerRows.length > 0 && !hasExternalOwner;
const hasUpgradeAnalogies = upgradeAssets.length > 0;

const assessmentKind = hasExternalTrigger
  ? "sf33-external-trigger-candidate-found"
  : hasUpgradeAnalogies
    ? "sf33-trigger-not-found-upgrade-analogies-only"
    : "sf33-trigger-not-found";

const finding = hasExternalTrigger
  ? "Le scan a trouve au moins une occurrence externe de Mod.SoilRuler_B a inspecter avant mapping."
  : hasUpgradeAnalogies
    ? "Le scan complet retrouve des flags generiques UpgradeB/C, mais Mod.SoilRuler_B et les proprietaires Spiritborn restent limites a l'asset 1663210."
    : "Le scan complet ne retrouve aucune source externe d'activation pour Mod.SoilRuler_B.";

const nextAction = hasExternalTrigger
  ? "Decoder les candidats externes Mod.SoilRuler_B et chercher le record qui active SF_33 sans promouvoir l'uptime."
  : hasUpgradeAnalogies
    ? "Utiliser les assets UpgradeB/C comme patrons de structure build-state, puis chercher un champ equivalent a SoilRuler_B par voisinage binaire plutot que par texte exact."
    : "Passer a une recherche binaire de voisinage ou traiter le blocage uptime sans activer SF_33.";

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-activation-source-search-results-audit-v1",
  source: {
    mergedSearchFile,
    mergedAt: merged.mergedAt ?? null,
  },
  summary: {
    sourceFiles: merged.summary?.files ?? 0,
    decodedDeadbeefEntries: merged.summary?.decodedDeadbeefEntries ?? 0,
    matchingEntries: merged.summary?.matchingEntries ?? 0,
    targetGroupsMatched: merged.summary?.targetGroupsMatched ?? 0,
    targetAssetId,
    trigger: "Mod.SoilRuler_B",
    triggerHits: triggerRows.length,
    externalTriggerHits: externalTriggerRows.length,
    ownerHits: ownerRows.length,
    externalOwnerHits: externalOwnerRows.length,
    upgradeAnalogyAssets: upgradeAssets.length,
    hasOnlyCurrentTrigger,
    hasOnlyCurrentOwner,
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: assessmentKind,
      confidence: "high",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding,
      nextAction,
    },
  },
  triggerGroups: triggerKeys.map((key) => compactGroup(groups, key)),
  ownerGroups: ownerKeys.map((key) => compactGroup(groups, key)),
  upgradeAnalogyGroups: genericUpgradeKeys.map((key) => compactGroup(groups, key)),
  externalTriggerRows,
  externalOwnerRows,
  upgradeAnalogyAssets: upgradeAssets,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-activation-source-search-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
