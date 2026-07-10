const fs = require("fs");
const path = require("path");

const inputFile = process.argv[2] ?? "outputs/diablo4-selector-asset-pair-corpus/selector-asset-pair-corpus-scan.json";
const outDir = process.argv[3] ?? "outputs/diablo4-selector-asset-layout-parser";

function layoutIdForShape(shape) {
  if (shape === "selector-asset-compact-metadata-scale") return "compact-metadata-scale-layout";
  if (shape === "selector-asset-no-local-metadata") return "no-local-metadata-layout";
  if (shape === "selector-asset-wrapper-or-variant") return "wrapper-or-variant-layout";
  if (shape === "selector-asset-divergent-tail") return "divergent-tail-layout";
  return "unknown-layout";
}

function fieldRolesForLayout(layoutId) {
  const common = [
    { offset: 0, role: "selector", status: "observed" },
    { offset: 4, role: "assetRef", status: "observed" },
  ];
  if (layoutId === "compact-metadata-scale-layout") {
    return common.concat([
      { offset: 8, role: "postAssetA", expected: 0, status: "observed" },
      { offset: 12, role: "postAssetB", expected: 0, status: "observed" },
      { offset: 16, role: "metadataId", expected: 12337, status: "candidate" },
      { offset: 20, role: "opcode", expected: 6, status: "candidate" },
      { offset: 24, role: "scale", expected: 10, status: "candidate" },
    ]);
  }
  if (layoutId === "no-local-metadata-layout") {
    return common.concat([
      { offset: 8, role: "postAssetA", expected: 0, status: "observed" },
      { offset: 12, role: "postAssetB", expected: 0, status: "observed" },
      { offset: 16, role: "metadataId", status: "not-local" },
      { offset: 24, role: "scale", status: "not-local" },
    ]);
  }
  if (layoutId === "wrapper-or-variant-layout") {
    return common.concat([
      { offset: 8, role: "postAssetA", expected: 0, status: "observed" },
      { offset: 12, role: "variantOrWrapperId", status: "candidate" },
      { offset: 16, role: "metadataId", expected: 0, status: "not-proven" },
    ]);
  }
  return common.concat([
    { offset: 8, role: "tail", status: "divergent" },
  ]);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((value) => value !== null && value !== undefined))).sort((a, b) =>
    typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))
  );
}

const scan = JSON.parse(fs.readFileSync(inputFile, "utf8"));
const layoutsById = new Map();

for (const group of scan.groups ?? []) {
  const layoutId = layoutIdForShape(group.shape);
  if (!layoutsById.has(layoutId)) {
    layoutsById.set(layoutId, {
      layoutId,
      shapes: [],
      selectors: [],
      families: [],
      assetCandidates: [],
      count: 0,
      groups: [],
      fieldRoles: fieldRolesForLayout(layoutId),
      promotionReady: false,
    });
  }
  const layout = layoutsById.get(layoutId);
  layout.shapes = uniqueSorted(layout.shapes.concat(group.shape));
  layout.selectors = uniqueSorted(layout.selectors.concat(group.selector));
  layout.families = uniqueSorted(layout.families.concat(group.family));
  layout.assetCandidates = uniqueSorted(layout.assetCandidates.concat(group.assetCandidates ?? []));
  layout.count += group.count ?? 0;
  layout.groups.push({
    key: group.key,
    selector: group.selector,
    shape: group.shape,
    family: group.family,
    count: group.count,
    assetCandidates: group.assetCandidates ?? [],
    examples: (group.examples ?? []).slice(0, 3),
  });
}

const layouts = Array.from(layoutsById.values()).sort((a, b) => b.count - a.count || a.layoutId.localeCompare(b.layoutId));
const selector949Layouts = layouts.filter((layout) => layout.selectors.includes(949));
const selector949CompactLayouts = selector949Layouts.filter((layout) => layout.layoutId === "compact-metadata-scale-layout");
const selector949NonCompactLayouts = selector949Layouts.filter((layout) => layout.layoutId !== "compact-metadata-scale-layout");

const assessmentKind = selector949CompactLayouts.length && selector949NonCompactLayouts.length
  ? "selector-949-layout-parser-blocked-mixed-layout"
  : selector949CompactLayouts.length
    ? "selector-949-layout-parser-compact-only-unproven"
    : "selector-949-layout-parser-no-compact-proof";

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-asset-layout-parser-v1",
  source: {
    selectorAssetPairCorpus: inputFile,
    sourceGeneratedAt: scan.generatedAt ?? null,
  },
  summary: {
    layouts: layouts.length,
    sourceGroups: scan.summary?.groups ?? 0,
    sourceHits: scan.summary?.hits ?? 0,
    selector949Layouts: selector949Layouts.length,
    selector949CompactLayouts: selector949CompactLayouts.length,
    selector949NonCompactLayouts: selector949NonCompactLayouts.length,
    assessment: {
      kind: assessmentKind,
      confidence: selector949Layouts.length >= 2 ? "high" : "medium",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: selector949CompactLayouts.length && selector949NonCompactLayouts.length
        ? "Le parser separe selector 949 en layout compact et layout variant; le champ proprietaire du bonus n'est donc pas stablement prouve."
        : "Le parser ne trouve pas assez de layouts repetes pour prouver le champ proprietaire du bonus selector 949.",
      nextAction: "Parser les champs proprietaires par layout, puis trouver une seconde preuve compacte ou une table source avant toute promotion DPS.",
      evidence: {
        selector949Layouts: selector949Layouts.map((layout) => layout.layoutId),
        compactAssetCandidates: uniqueSorted(selector949CompactLayouts.flatMap((layout) => layout.assetCandidates)),
        nonCompactAssetCandidates: uniqueSorted(selector949NonCompactLayouts.flatMap((layout) => layout.assetCandidates)),
      },
    },
  },
  layouts,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "selector-asset-layout-parser.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
