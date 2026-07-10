const fs = require("fs");
const path = require("path");

const fieldSearchFile = process.argv[2] ?? "outputs/diablo4-aspect-equipment-field-search/external-target-search.json";
const codexStringInspectionFile = process.argv[3] ?? "outputs/diablo4-source-asset-1197664-strings/decoded-string-structure.json";
const outDir = process.argv[4] ?? "outputs/diablo4-aspect-equipment-field-search-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function countMatching(strings, pattern) {
  return strings.filter((row) => pattern.test(row.value ?? "")).length;
}

const fieldSearch = readJson(fieldSearchFile);
const codexInspection = readOptionalJson(codexStringInspectionFile);
const strings = codexInspection?.strings ?? [];
const matches = fieldSearch.matches ?? [];
const topMatch = matches[0] ?? null;

const uiStringPatterns = {
  tabs: /^(Tab_|TabName|TabNameFormat|AspectTabName|RecipesTabName)/i,
  localization: /Kodex|Macht|Gegenstandstypen|Aspekt|Waffe|Defensiv|Offensiv|Ressource|Vielseitigkeit|Mobilit|Klasse|Saisonal|Gesperrt/i,
  filters: /Filter|ClassFilter|ShowAllClasses|FavoriteFilter|KeywordSearch/i,
  tooltip: /Tooltip|Progress|Discovered|Unlock|AspectUnlocked|AspectUpgraded/i,
  icons: /\{icon:/i,
};

const uiSignals = Object.fromEntries(
  Object.entries(uiStringPatterns).map(([key, pattern]) => [key, countMatching(strings, pattern)])
);

const directSlotFieldStrings = strings.filter((row) =>
  /allowedSlots|equipmentSlot|EquipSlot|slotMask|ItemEquipLocation|EquipLocation|AllowedItemType|AllowedItemTypes/i.test(row.value ?? "")
);
const codexStrings = strings.filter((row) => /CodexOfPower|AspectPower|CanBeImbued|Gegenstandstypen|Tab_Weapon/i.test(row.value ?? ""));
const hasOnlyCodexHit = fieldSearch.summary?.matchingEntries === 1 && fieldSearch.summary?.topGroups?.[0]?.key === "CodexOfPower";
const uiLikeScore = Object.values(uiSignals).reduce((sum, value) => sum + value, 0);
const sourceProofReady = directSlotFieldStrings.length > 0 && !hasOnlyCodexHit;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-equipment-field-search-audit-v1",
  source: {
    fieldSearchFile,
    codexStringInspectionFile: codexInspection ? codexStringInspectionFile : null,
  },
  summary: {
    searchedFiles: fieldSearch.summary?.files ?? 0,
    decodedDeadbeefEntries: fieldSearch.summary?.decodedDeadbeefEntries ?? 0,
    targetTerms: fieldSearch.summary?.targets ?? 0,
    matchingEntries: fieldSearch.summary?.matchingEntries ?? 0,
    targetGroupsMatched: fieldSearch.summary?.targetGroupsMatched ?? 0,
    topMatchAssetId: topMatch?.assetId ?? null,
    topMatchTarget: topMatch?.targetHits?.[0]?.target ?? fieldSearch.summary?.topGroups?.[0]?.key ?? null,
    codexStrings: codexStrings.length,
    directSlotFieldStrings: directSlotFieldStrings.length,
    uiLikeScore,
    sourceProofReady,
    promotionReady: false,
    assessment: {
      kind: sourceProofReady
        ? "aspect-equipment-field-source-candidate-needs-parser"
        : hasOnlyCodexHit
          ? "aspect-equipment-field-search-codex-ui-only"
          : "aspect-equipment-field-source-not-found",
      confidence: hasOnlyCodexHit ? "high" : "medium-high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: hasOnlyCodexHit
        ? "La recherche bas niveau ne trouve qu'un asset CodexOfPower contenant des chaines UI/localisation, pas une table source allowedSlots."
        : "La recherche bas niveau ne fournit pas de champ source aspect-equipement promouvable.",
      nextAction: "Ne pas promouvoir CodexOfPower; chercher une table non-localisation ou un champ binaire d'equipement/aspect distinct.",
    },
  },
  uiSignals,
  codexStrings: codexStrings.slice(0, 40),
  directSlotFieldStrings: directSlotFieldStrings.slice(0, 40),
  matches: matches.slice(0, 10),
  safeguards: [
    "CodexOfPower est une surface UI/localisation tant qu'aucun champ record de slots n'est prouve.",
    "CanBeImbued et Gegenstandstypen decrivent l'affichage des types d'objets, pas allowedSlots pour 1461593.",
    "Les categories UI Defensive/Offensive/Resource/Utility/Mobility/Weapon ne doivent pas etre converties en slots d'equipement.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-equipment-field-search-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
