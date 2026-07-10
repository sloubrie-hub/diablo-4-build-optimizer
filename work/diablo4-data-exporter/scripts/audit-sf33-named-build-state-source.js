const fs = require("fs");
const path = require("path");

const nameSearchFile = process.argv[2] ?? "outputs/diablo4-sf33-soil-ruler-name-search/external-target-search.json";
const parentSemanticsFile = process.argv[3] ?? "outputs/diablo4-sf33-parent-run-semantics/sf33-parent-run-semantics.json";
const definitionSearchFile = process.argv[4] ?? "outputs/diablo4-conditional-definition-search-full-target-scan/conditional-definition-search.json";
const outDir = process.argv[5] ?? "outputs/diablo4-sf33-named-build-state-source";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function containsTerm(filePath, pattern) {
  if (!fs.existsSync(filePath)) return false;
  return pattern.test(fs.readFileSync(filePath, "utf8"));
}

function groupAssets(search, key) {
  return (search.groups?.[key]?.assets ?? []).map((asset) => ({
    assetId: asset.assetId,
    fileName: asset.source?.fileName ?? null,
    blteOffset: asset.source?.blteOffset ?? null,
    score: asset.score ?? 0,
    confidence: asset.confidence ?? "unknown",
    sampleValues: asset.sampleValues ?? [],
  }));
}

function externalAssets(rows, currentAssetId = 1663210) {
  return rows.filter((row) => Number(row.assetId) !== currentAssetId);
}

const nameSearch = readJson(nameSearchFile);
const parentSemantics = readJson(parentSemanticsFile);
const definitionSearch = readJsonIfExists(definitionSearchFile);
const targetDatasetHasSoil = containsTerm("outputs/diablo4-target-dataset/target-dataset.json", /Soil|Ruler|SoilRuler/i);
const optimizerDatasetHasSoil = containsTerm("outputs/diablo4-optimizer-dataset/optimizer-dataset.json", /Soil|Ruler|SoilRuler/i);
const schemaExampleHasSoil = containsTerm("work/diablo4-data-exporter/schema/target-dataset.example.json", /Soil|Ruler|SoilRuler/i);

const soilRows = groupAssets(nameSearch, "Soil");
const rulerRows = groupAssets(nameSearch, "Ruler");
const soilRulerRows = groupAssets(nameSearch, "SoilRuler");
const combinedRows = [...soilRows, ...rulerRows, ...soilRulerRows];
const externalNameRows = externalAssets(combinedRows);
const uniqueCurrentNameAssets = [...new Set(combinedRows.map((row) => row.assetId))].filter((assetId) => Number(assetId) === 1663210);
const definitionTarget = (definitionSearch?.assets ?? [])
  .flatMap((asset) => asset.targets ?? [])
  .find((target) => target.target === "Mod.SoilRuler_B") ?? null;

const hasNamedExternalSource = externalNameRows.length > 0;
const hasGeneratedOnlyName = optimizerDatasetHasSoil || schemaExampleHasSoil;
const parentSemanticsAssessment = parentSemantics.summary?.assessment ?? null;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-named-build-state-source-v1",
  source: {
    nameSearchFile,
    parentSemanticsFile,
    definitionSearchFile,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    filesScanned: nameSearch.summary?.files ?? 0,
    decodedDeadbeefEntries: nameSearch.summary?.decodedDeadbeefEntries ?? 0,
    nameSearchMatchingEntries: nameSearch.summary?.matchingEntries ?? 0,
    nameSearchGroupsMatched: nameSearch.summary?.targetGroupsMatched ?? 0,
    exactCurrentAssetNameHits: uniqueCurrentNameAssets.length,
    externalNameHits: externalNameRows.length,
    targetDatasetHasNamedSource: targetDatasetHasSoil,
    optimizerDatasetHasGeneratedName: optimizerDatasetHasSoil,
    schemaExampleHasGeneratedName: schemaExampleHasSoil,
    definitionAssessment: definitionTarget?.definitionAssessment?.kind ?? null,
    parentSemanticsKind: parentSemanticsAssessment?.kind ?? null,
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: hasNamedExternalSource
        ? "sf33-named-build-state-source-candidate-found"
        : "sf33-named-build-state-source-not-found",
      confidence: hasNamedExternalSource ? "medium" : "high",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: hasNamedExternalSource
        ? "Une source nommee externe candidate existe pour Soil/Ruler; elle doit etre decodee avant mapping."
        : "Aucune source nommee externe Soil/Ruler n'a ete trouvee; les seules mentions exploitables restent le record local 1663210 et des artefacts generes.",
      nextAction: hasNamedExternalSource
        ? "Decoder les candidats externes Soil/Ruler avant de mapper Mod.SoilRuler_B."
        : "Clore la piste nommee locale et passer soit a une recherche binaire de record parent hors texte, soit au blocage uptime, sans activer SF_33.",
    },
  },
  nameGroups: {
    Soil: soilRows,
    Ruler: rulerRows,
    SoilRuler: soilRulerRows,
  },
  externalNameRows,
  definitionTarget,
  parentSemanticsAssessment,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-named-build-state-source.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
