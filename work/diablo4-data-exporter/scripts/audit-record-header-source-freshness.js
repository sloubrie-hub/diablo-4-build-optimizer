const fs = require("fs");
const path = require("path");

const staleAssets = [1461593, 2474146, 1408295];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function optionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

const oldPlan = readJson("outputs/diablo4-record-header-payload-plan/record-header-payload-plan.json");
const freshSearch = readJson("outputs/diablo4-record-header-source-freshness-scan/external-target-search.json");
const freshPlan = readJson("outputs/diablo4-record-header-source-freshness-plan/record-header-payload-plan.json");
const neighborScan = optionalJson("outputs/diablo4-record-header-neighbor-scan/record-header-neighbor-scan.json");

const oldCandidates = new Map(
  (oldPlan.candidates || [])
    .filter((candidate) => staleAssets.includes(Number(candidate.assetId)))
    .map((candidate) => [Number(candidate.assetId), candidate])
);
const neighborAssets = new Map(
  (neighborScan?.assets || []).map((asset) => [Number(asset.assetId), asset])
);

const assets = staleAssets.map((assetId) => {
  const oldCandidate = oldCandidates.get(assetId);
  const neighbor = neighborAssets.get(assetId);
  return {
    assetId,
    previous: oldCandidate
      ? {
          fileName: oldCandidate.fileName,
          blteOffset: oldCandidate.blteOffset,
          sourceScore: oldCandidate.sourceScore,
          recommendation: oldCandidate.recommendation,
          decodedProbeKind: oldCandidate.decodedProbe?.kind ?? null,
          expectedTargets: oldCandidate.targets ?? [],
        }
      : null,
    freshSearchMatches: (freshSearch.matches || []).filter((match) => Number(match.assetId) === assetId).length,
    freshPlanCandidates: (freshPlan.candidates || []).filter((candidate) => Number(candidate.assetId) === assetId).length,
    neighborScan: neighbor
      ? {
          nearestScanned: neighbor.nearestScanned,
          hits: neighbor.hits,
        }
      : null,
    assessment: "stale-source-offset-not-reconfirmed",
    promotionReady: false,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "record-header-source-freshness-audit-v1",
  source: {
    oldPlan: "outputs/diablo4-record-header-payload-plan/record-header-payload-plan.json",
    freshSearch: "outputs/diablo4-record-header-source-freshness-scan/external-target-search.json",
    freshPlan: "outputs/diablo4-record-header-source-freshness-plan/record-header-payload-plan.json",
    neighborScan: "outputs/diablo4-record-header-neighbor-scan/record-header-neighbor-scan.json",
  },
  summary: {
    assets: assets.length,
    staleOffsets: assets.filter((asset) => asset.previous).length,
    freshMatches: freshSearch.summary?.matchingEntries ?? 0,
    freshCandidates: freshPlan.summary?.candidates ?? 0,
    neighborHits: assets.reduce((sum, asset) => sum + Number(asset.neighborScan?.hits ?? 0), 0),
    assessment: "record-header-source-links-stale",
    nextAction: "Rebuild external target search with current BLTE/catalog conventions before reusing these mismatch offsets.",
    promotionReady: false,
  },
  assets,
};

const outDir = path.join("outputs", "diablo4-record-header-source-freshness-audit");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "record-header-source-freshness-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
