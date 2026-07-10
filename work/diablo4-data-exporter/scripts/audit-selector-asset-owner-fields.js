const fs = require("fs");
const path = require("path");

const layoutParserFile = process.argv[2] ?? "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json";
const outDir = process.argv[3] ?? "outputs/diablo4-selector-asset-owner-fields";

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((value) => value !== null && value !== undefined))).sort((a, b) =>
    typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))
  );
}

function confidenceForLayout(layout) {
  if ((layout.count ?? 0) >= 3) return "medium";
  if ((layout.count ?? 0) >= 2) return "medium-low";
  return "low";
}

function ownershipForLayout(layout) {
  const selectors = layout.selectors ?? [];
  const roles = layout.fieldRoles ?? [];
  const metadataRole = roles.find((role) => role.role === "metadataId");
  const scaleRole = roles.find((role) => role.role === "scale");
  const hasCompactCandidate = layout.layoutId === "compact-metadata-scale-layout" && metadataRole?.expected === 12337 && scaleRole?.expected === 10;
  const hasSelector949 = selectors.includes(949);

  if (hasCompactCandidate && hasSelector949 && selectors.length > 1) {
    return {
      status: "blocked-cross-selector-compact",
      confidence: confidenceForLayout(layout),
      finding: "Le layout compact porte metadata 12337 et scale 10, mais il est partage par plusieurs selecteurs; le champ bonus 949 n'est pas proprietaire.",
      blockers: ["selector-not-unique", "metadata-cross-selector", "field-owner-not-proven"],
    };
  }
  if (hasCompactCandidate) {
    return {
      status: "blocked-compact-candidate",
      confidence: confidenceForLayout(layout),
      finding: "Le layout compact expose un candidat metadata/scale, mais il ne suffit pas a prouver un champ proprietaire DPS.",
      blockers: ["field-owner-not-proven"],
    };
  }
  if (layout.layoutId === "wrapper-or-variant-layout") {
    return {
      status: "blocked-wrapper-or-variant",
      confidence: confidenceForLayout(layout),
      finding: "Le layout wrapper/variant garde un asset-like proche de selector 949, mais sans metadata/scale locale comparable.",
      blockers: ["layout-variant", "missing-local-scale", "field-owner-not-proven"],
    };
  }
  if (layout.layoutId === "no-local-metadata-layout") {
    return {
      status: "blocked-scale-source-not-local",
      confidence: confidenceForLayout(layout),
      finding: "Le layout repete des cibles bonus sans metadata/scale locale; la source de valeur est ailleurs.",
      blockers: ["scale-source-not-local", "field-owner-not-proven"],
    };
  }
  return {
    status: "blocked-divergent-layout",
    confidence: confidenceForLayout(layout),
    finding: "Le layout diverge de la famille bonus compacte et reste non attribuable.",
    blockers: ["divergent-layout", "field-owner-not-proven"],
  };
}

function buildFieldCandidate(layout, role) {
  return {
    fieldId: `${layout.layoutId}:${role.role}`,
    layoutId: layout.layoutId,
    role: role.role,
    offset: role.offset,
    expected: role.expected ?? null,
    roleStatus: role.status,
    selectors: layout.selectors ?? [],
    families: layout.families ?? [],
    assetCandidates: layout.assetCandidates ?? [],
    status: role.status === "candidate" ? "candidate-blocked" : "context-only",
    promotionReady: false,
  };
}

const layoutParser = JSON.parse(fs.readFileSync(layoutParserFile, "utf8"));
const layouts = (layoutParser.layouts ?? []).map((layout) => {
  const ownership = ownershipForLayout(layout);
  return {
    layoutId: layout.layoutId,
    selectors: layout.selectors ?? [],
    families: layout.families ?? [],
    assetCandidates: layout.assetCandidates ?? [],
    count: layout.count ?? 0,
    ownershipStatus: ownership.status,
    confidence: ownership.confidence,
    fieldOwnership: "not-proven",
    promotionReady: false,
    blockers: ownership.blockers,
    finding: ownership.finding,
    fieldCandidates: (layout.fieldRoles ?? []).map((role) => buildFieldCandidate(layout, role)),
  };
});

const selector949Layouts = layouts.filter((layout) => layout.selectors.includes(949));
const selector949BlockedLayouts = selector949Layouts.filter((layout) => layout.fieldOwnership !== "proven");
const compact949 = selector949Layouts.filter((layout) => layout.layoutId === "compact-metadata-scale-layout");
const variant949 = selector949Layouts.filter((layout) => layout.layoutId !== "compact-metadata-scale-layout");
const candidateFields = layouts.flatMap((layout) => layout.fieldCandidates).filter((field) => field.status === "candidate-blocked");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-asset-owner-field-audit-v1",
  source: {
    selectorAssetLayoutParser: layoutParserFile,
    sourceGeneratedAt: layoutParser.generatedAt ?? null,
  },
  summary: {
    layouts: layouts.length,
    selector949Layouts: selector949Layouts.length,
    selector949BlockedLayouts: selector949BlockedLayouts.length,
    candidateFields: candidateFields.length,
    compact949Layouts: compact949.length,
    variant949Layouts: variant949.length,
    assessment: {
      kind: "selector-949-owner-fields-blocked-by-mixed-layout",
      confidence: compact949.length && variant949.length ? "high" : "medium",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: "Les champs candidats sont identifies par layout, mais selector 949 reste partage entre compact metadata/scale et wrapper/variant.",
      nextAction: "Chercher une table source nommee ou une seconde preuve compacte selector 949 avant d'attribuer metadata 12337/scale 10 au bonus.",
      evidence: {
        selector949LayoutIds: selector949Layouts.map((layout) => layout.layoutId),
        blockedLayouts: selector949BlockedLayouts.map((layout) => layout.layoutId),
        compactAssetCandidates: uniqueSorted(compact949.flatMap((layout) => layout.assetCandidates)),
        variantAssetCandidates: uniqueSorted(variant949.flatMap((layout) => layout.assetCandidates)),
        candidateFieldIds: candidateFields.map((field) => field.fieldId),
      },
    },
  },
  layouts,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "selector-asset-owner-fields.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
