const fs = require("fs");
const path = require("path");

const sf33SearchAuditFile = process.argv[2] ?? "outputs/diablo4-sf33-activation-source-search-audit/sf33-activation-source-search-audit.json";
const soilRulerStringsFile = process.argv[3] ?? "outputs/diablo4-source-asset-1663210-string-structure/decoded-string-structure.json";
const outDir = process.argv[4] ?? "outputs/diablo4-sf33-upgrade-analogy-patterns";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function uniq(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined))];
}

function wordSignature(words) {
  return (words ?? []).map((word) => `${word.offsetDelta}:${word.u32}`).slice(0, 10);
}

function interestingNearbyStrings(item) {
  return (item.nearbyStrings ?? [])
    .filter((nearby) => /Mod\.|Upgrade|PowerTag|Script Formula|SF_|Talent|Bonus_|Ruler/i.test(nearby.value))
    .map((nearby) => ({
      delta: nearby.delta,
      offset: nearby.offset,
      value: nearby.value,
    }));
}

function summarizeStringItem(item) {
  return {
    offset: item.offset,
    value: item.value,
    directOffsetReferences: item.directOffsetReferences ?? [],
    directOffsetReferenceCount: (item.directOffsetReferences ?? []).length,
    prefixSignature: wordSignature(item.prefixWords),
    suffixSignature: wordSignature(item.suffixWords),
    nearbyInterestingStrings: interestingNearbyStrings(item),
  };
}

function classifyUpgradeItem(item) {
  const value = item.value ?? "";
  if (/^Mod\.Upgrade[ABC]$/.test(value)) return "standalone-mod-flag";
  if (/Mod\.Upgrade[ABC].*\?/.test(value)) return "conditional-formula-flag";
  if (/Upgrade[ABC]/.test(value)) return "upgrade-reference";
  return "other";
}

function scoreUpgradeItem(item) {
  let score = 0;
  const kind = classifyUpgradeItem(item);
  if (kind === "standalone-mod-flag") score += 80;
  if (kind === "conditional-formula-flag") score += 45;
  if (kind === "upgrade-reference") score += 25;
  score += Math.min(40, (item.directOffsetReferences ?? []).length * 10);
  if (interestingNearbyStrings(item).some((nearby) => /PowerTag|Script Formula/i.test(nearby.value))) score += 20;
  if (interestingNearbyStrings(item).some((nearby) => /SF_/i.test(nearby.value))) score += 10;
  return score;
}

const searchAudit = readJson(sf33SearchAuditFile);
const soilRulerStrings = readJson(soilRulerStringsFile);
const triggerItems = (soilRulerStrings.inspected ?? []).filter((item) => /Mod\.SoilRuler_B|SoilRuler/i.test(item.value));
const triggerPattern = triggerItems.map(summarizeStringItem);

const assets = uniq((searchAudit.upgradeAnalogyAssets ?? []).map((asset) => Number(asset.assetId))).sort((a, b) => a - b);
const assetReports = assets.map((assetId) => {
  const stringsFile = `outputs/diablo4-source-asset-${assetId}-strings/decoded-string-structure.json`;
  const inspection = readJsonIfExists(stringsFile);
  const inspected = inspection?.inspected ?? [];
  const upgradeItems = inspected.filter((item) => /Mod\.Upgrade|Upgrade[ABC]/.test(item.value ?? ""));
  const rows = upgradeItems.map((item) => ({
    ...summarizeStringItem(item),
    kind: classifyUpgradeItem(item),
    score: scoreUpgradeItem(item),
  })).sort((a, b) => b.score - a.score || a.offset - b.offset);
  return {
    assetId,
    source: {
      stringsFile,
      bytes: inspection?.source?.bytes ?? null,
      totalStrings: inspection?.summary?.strings ?? null,
      inspectedStrings: inspection?.summary?.inspectedStrings ?? null,
      directOffsetReferenceTargets: inspection?.summary?.directOffsetReferenceTargets ?? null,
    },
    summary: {
      upgradeItems: rows.length,
      standaloneModFlags: rows.filter((row) => row.kind === "standalone-mod-flag").length,
      conditionalFormulaFlags: rows.filter((row) => row.kind === "conditional-formula-flag").length,
      withDirectOffsetRefs: rows.filter((row) => row.directOffsetReferenceCount > 0).length,
      maxScore: rows[0]?.score ?? 0,
    },
    rows,
  };
});

const topPatterns = assetReports
  .flatMap((asset) => asset.rows.map((row) => ({ assetId: asset.assetId, ...row })))
  .sort((a, b) => b.score - a.score || String(a.assetId).localeCompare(String(b.assetId)))
  .slice(0, 20);

const standaloneAssets = assetReports.filter((asset) => asset.summary.standaloneModFlags > 0);
const hasComparableStandaloneFlags = standaloneAssets.length > 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-upgrade-analogy-patterns-v1",
  source: {
    sf33SearchAuditFile,
    soilRulerStringsFile,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    triggerItems: triggerPattern.length,
    upgradeAnalogyAssets: assetReports.length,
    standaloneModFlagAssets: standaloneAssets.length,
    topPatternAssets: uniq(topPatterns.slice(0, 8).map((row) => row.assetId)),
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: hasComparableStandaloneFlags
        ? "upgrade-standalone-flag-patterns-ready-for-binary-neighborhood"
        : "upgrade-analogies-are-formula-only",
      confidence: hasComparableStandaloneFlags ? "medium-high" : "medium",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: hasComparableStandaloneFlags
        ? "Plusieurs assets UpgradeB/C portent des flags Mod.* autonomes comparables a Mod.SoilRuler_B, mais aucune relation d'activation SF_33 n'est prouvee."
        : "Les analogies UpgradeB/C trouvees sont surtout des formules conditionnelles, pas des flags autonomes directement comparables.",
      nextAction: hasComparableStandaloneFlags
        ? "Comparer le voisinage binaire des meilleurs flags Mod.UpgradeB/C avec Mod.SoilRuler_B pour isoler un motif de champ build-state."
        : "Elargir la recherche a d'autres flags Mod.* autonomes avant de chercher un motif binaire.",
    },
  },
  triggerPattern,
  topPatterns,
  assets: assetReports,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-upgrade-analogy-patterns.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
