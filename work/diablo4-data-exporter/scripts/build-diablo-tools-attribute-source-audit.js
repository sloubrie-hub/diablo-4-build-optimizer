const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const inputs = {
  archiveFile: process.argv[2] ?? "outputs/tools/Diablo4Tools_2026-06-19_win.7z",
  attributesFile: process.argv[3] ?? "outputs/tools/Diablo4Tools_2026-06-19_data/data/attributes.json",
  outDir: process.argv[4] ?? "outputs/diablo4-diablo-tools-attribute-source-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function findByEAttrib(attributes, eAttrib) {
  return Object.entries(attributes)
    .filter(([, value]) => value.eAttrib === eAttrib)
    .map(([key, value]) => ({ key, ...value }));
}

function findByName(attributes, name) {
  const value = attributes[name];
  return value ? { key: name, ...value } : null;
}

const attributes = readJson(inputs.attributesFile);
const expectedArchiveSha256 = "4c3b8dd01c43b82cc37dd65b384c17a4de4c02b878ba6f5885424b9c0e9b57f0";
const actualArchiveSha256 = fs.existsSync(inputs.archiveFile) ? sha256(inputs.archiveFile) : null;
const archiveHashMatches = actualArchiveSha256 === expectedArchiveSha256;

const selector949 = findByEAttrib(attributes, 949);
const selector994 = findByEAttrib(attributes, 994);
const bonusPercentPerPower = findByName(attributes, "Bonus_Percent_Per_Power");
const targetSelectorMapsToBonus = selector949.some((item) => item.name === "Bonus_Percent_Per_Power");
const bonusMapsToSelector994 = bonusPercentPerPower?.eAttrib === 994;
const selector949Name = selector949[0]?.name ?? null;
const attributeSourceUsable = archiveHashMatches && selector949.length > 0 && bonusPercentPerPower !== null;
const sourceContradictsPriorSelectorAssumption = attributeSourceUsable && !targetSelectorMapsToBonus && bonusMapsToSelector994;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "diablo-tools-attribute-source-audit-v1",
  source: {
    repository: "https://github.com/DiabloTools/Diablo4Tools-Releases",
    release: "2026-06-19 Diablo IV 3.0.4",
    asset: "Diablo4Tools_2026-06-19_win.7z",
    archiveFile: inputs.archiveFile,
    attributesFile: inputs.attributesFile,
    expectedArchiveSha256,
    actualArchiveSha256,
    archiveHashMatches,
  },
  summary: {
    sourceName: "Diablo4Tools attributes.json",
    assetId: 1663210,
    entityId: "skill:1663210",
    targetSelector: "selector:949",
    targetExpectedField: "SF_32",
    selector949Entries: selector949.length,
    selector949Name,
    selector994Entries: selector994.length,
    selector994Name: selector994[0]?.name ?? null,
    bonusPercentPerPowerEAttrib: bonusPercentPerPower?.eAttrib ?? null,
    targetSelectorMapsToBonus,
    bonusMapsToSelector994,
    sourceContradictsPriorSelectorAssumption,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: sourceContradictsPriorSelectorAssumption
        ? "diablo-tools-attribute-source-contradicts-selector-949-bonus"
        : "diablo-tools-attribute-source-inconclusive",
      confidence: attributeSourceUsable ? "high" : "medium",
      promotionReady: false,
      finding: sourceContradictsPriorSelectorAssumption
        ? "DiabloTools mappe eAttrib 949 vers Damage_Percent_Reduction_From_Elites et Bonus_Percent_Per_Power vers eAttrib 994."
        : "DiabloTools ne suffit pas a prouver le mapping SF_32 cible.",
      nextAction: sourceContradictsPriorSelectorAssumption
        ? "Reviser l'hypothese selector:949 avant toute preuve SF_32; verifier si le raw 949 local est un eAttrib ou un autre index."
        : "Conserver la recherche source SF_32 sans promotion.",
    },
  },
  evidence: {
    selector949,
    selector994,
    bonusPercentPerPower,
  },
  impact: [
    {
      id: "sf32-owner-source-hunt",
      status: sourceContradictsPriorSelectorAssumption ? "needs-reconciliation" : "unchanged",
      reason: "Le plan de collecte demandait selector:949 + SF_32; la source externe mappe 949 vers un autre attribut.",
    },
    {
      id: "blocked-delta-1663210",
      status: "still-blocked",
      reason: "Cette source peut corriger le dictionnaire de selecteurs mais ne prouve pas SF_33 ni uptime.",
    },
  ],
  safeguards: {
    noAutomaticApproval: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
    reason: "Une contradiction de dictionnaire est une preuve de correction d'hypothese, pas une promotion DPS.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "diablo-tools-attribute-source-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
