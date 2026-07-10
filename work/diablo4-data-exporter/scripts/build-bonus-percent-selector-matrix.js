const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function unique(values) {
  return Array.from(new Set(values.filter((value) => value !== null && value !== undefined)));
}

function inferFamily(value) {
  if (/^1\s*\+/.test(value)) return "expression-wrapper";
  if (/^Bonus_Percent_Per_Power#/i.test(value)) return "direct-bonus-percent";
  if (/Bonus_Percent_Per_Power#/i.test(value)) return "nested-bonus-percent";
  return "other";
}

function inferClass(value) {
  const classes = [
    "Barbarian",
    "Druid",
    "Necromancer",
    "Paladin",
    "Rogue",
    "Sorcerer",
    "Spiritborn",
  ];
  return classes.find((name) => new RegExp(name, "i").test(value)) ?? "unknown";
}

function normalizeTarget(value) {
  const match = String(value).match(/Bonus_Percent_Per_Power#[A-Za-z0-9_]+/);
  return match ? match[0] : value;
}

const dictionary = readJson("outputs/diablo4-hash-suffix-dictionary-mining/hash-suffix-dictionary-mining.json");
const headerShapes = readJson("outputs/diablo4-hash-suffix-header-shape-comparison/hash-suffix-header-shape-comparison.json");
const expandedSearch = readJson(
  "outputs/diablo4-bonus-percent-external-scan-expanded/external-target-search-merged/external-target-search-merged.json"
);

const searchRows = (expandedSearch.matches || expandedSearch.mergedMatches || []).map((match) => ({
  assetId: Number(match.assetId),
  fileName: match.source?.fileName ?? match.fileName ?? null,
  blteOffset: match.source?.blteOffset ?? match.blteOffset ?? null,
  targets: unique((match.targetHits || []).map((hit) => hit.value || hit.target || hit.sourceKey)),
}));

const selectorExamples = (dictionary.summary?.assessment?.evidence?.repeatedSelectors || [])
  .flatMap((group) => (group.examples || []).map((example) => ({
    ...example,
    selector: example.selector ?? group.selector ?? Number(String(group.key || "").replace("selector:", "")),
  })));

const scanAnchors = (dictionary.scans || []).flatMap((scan) => scan.anchors || scan.probableAnchors || []);
const allAnchors = selectorExamples.length ? selectorExamples : scanAnchors;

const bonusAnchors = allAnchors
  .filter((anchor) => /Bonus_Percent_Per_Power#/i.test(anchor.previousString || ""))
  .map((anchor) => ({
    assetId: Number(anchor.assetId),
    offset: anchor.offset,
    previousString: anchor.previousString,
    normalizedTarget: normalizeTarget(anchor.previousString),
    family: inferFamily(anchor.previousString),
    classHint: inferClass(anchor.previousString),
    selector: anchor.selector,
    metadataId: anchor.metadata?.id ?? null,
    metadataFloat: anchor.metadata?.float ?? null,
    metadataEncoding: anchor.metadata?.encoding ?? null,
  }));

const headerGroups = new Map();
for (const group of headerShapes.groups || []) {
  for (const assetId of group.assets || []) {
    const list = headerGroups.get(Number(assetId)) || [];
    list.push({
      key: group.key,
      count: group.count,
    });
    headerGroups.set(Number(assetId), list);
  }
}

const rows = searchRows.map((search) => {
  const anchors = bonusAnchors.filter((anchor) => anchor.assetId === search.assetId);
  return {
    assetId: search.assetId,
    fileName: search.fileName,
    blteOffset: search.blteOffset,
    targets: search.targets,
    anchors,
    selectors: unique(anchors.map((anchor) => anchor.selector)).sort((a, b) => Number(a) - Number(b)),
    metadataIds: unique(anchors.map((anchor) => anchor.metadataId)).sort((a, b) => Number(a) - Number(b)),
    families: unique(anchors.map((anchor) => anchor.family)).sort(),
    classHints: unique(anchors.map((anchor) => anchor.classHint)).sort(),
    headerShapeGroups: headerGroups.get(search.assetId) || [],
  };
}).sort((a, b) => a.assetId - b.assetId);

const selectorGroups = {};
for (const row of rows) {
  for (const anchor of row.anchors) {
    const key = `selector:${anchor.selector}`;
    selectorGroups[key] = selectorGroups[key] || {
      selector: anchor.selector,
      assets: [],
      families: {},
      classHints: {},
      metadataIds: {},
      examples: [],
    };
    if (!selectorGroups[key].assets.includes(row.assetId)) selectorGroups[key].assets.push(row.assetId);
    selectorGroups[key].families[anchor.family] = (selectorGroups[key].families[anchor.family] || 0) + 1;
    selectorGroups[key].classHints[anchor.classHint] = (selectorGroups[key].classHints[anchor.classHint] || 0) + 1;
    if (anchor.metadataId !== null) {
      selectorGroups[key].metadataIds[anchor.metadataId] = (selectorGroups[key].metadataIds[anchor.metadataId] || 0) + 1;
    }
    selectorGroups[key].examples.push({
      assetId: row.assetId,
      target: anchor.normalizedTarget,
      family: anchor.family,
      classHint: anchor.classHint,
      metadataId: anchor.metadataId,
      metadataFloat: anchor.metadataFloat,
    });
  }
}

const groups = Object.values(selectorGroups)
  .map((group) => ({
    ...group,
    assets: group.assets.sort((a, b) => a - b),
    assetCount: group.assets.length,
    examples: group.examples.slice(0, 12),
  }))
  .sort((a, b) => b.assetCount - a.assetCount || Number(a.selector) - Number(b.selector));

const selector949 = groups.find((group) => Number(group.selector) === 949);
const selector994 = groups.find((group) => Number(group.selector) === 994);
const assessment = {
  kind: "bonus-percent-selector-matrix-divergent",
  confidence: "medium",
  fieldOwnership: "not-proven",
  blocker: "field-level-parser-required",
  promotionReady: false,
  finding:
    "Les cibles Bonus_Percent_Per_Power se repartissent entre plusieurs selecteurs; selector:994 est plus repete que selector:949, tandis que le compact 949/12337/10 reste local a 1663210.",
  nextAction:
    "Chercher une table source nommant les selecteurs ou un second asset direct Bonus_Percent_Per_Power avec selector:949 et metadata 12337/10.",
  evidence: {
    assets: rows.length,
    rowsWithAnchors: rows.filter((row) => row.anchors.length > 0).length,
    selectorGroups: groups.length,
    selector949Assets: selector949?.assets ?? [],
    selector994Assets: selector994?.assets ?? [],
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bonus-percent-selector-matrix-v1",
  source: {
    dictionary: "outputs/diablo4-hash-suffix-dictionary-mining/hash-suffix-dictionary-mining.json",
    headerShapes: "outputs/diablo4-hash-suffix-header-shape-comparison/hash-suffix-header-shape-comparison.json",
    expandedSearch:
      "outputs/diablo4-bonus-percent-external-scan-expanded/external-target-search-merged/external-target-search-merged.json",
  },
  summary: {
    assets: rows.length,
    rowsWithAnchors: rows.filter((row) => row.anchors.length > 0).length,
    selectorGroups: groups.length,
    directTargets: rows.filter((row) => row.anchors.some((anchor) => anchor.family === "direct-bonus-percent")).length,
    wrappedTargets: rows.filter((row) => row.anchors.some((anchor) => anchor.family === "expression-wrapper")).length,
    assessment,
  },
  groups,
  rows,
};

const outDir = path.join("outputs", "diablo4-bonus-percent-selector-matrix");
ensureDir(outDir);
const outFile = path.join(outDir, "bonus-percent-selector-matrix.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
