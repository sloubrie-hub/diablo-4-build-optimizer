const fs = require("fs");
const path = require("path");

const inputs = {
  tableCandidates: process.argv[2] ?? "outputs/diablo4-table-candidates/table-candidates.json",
  strictTableCandidates: process.argv[3] ?? "outputs/diablo4-table-candidates-strict/table-candidates.json",
  strongTableCandidates: process.argv[4] ?? "outputs/diablo4-table-candidates-strict/table-candidates-strong.json",
  selectorMatrix: process.argv[5] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
};
const outDir = process.argv[6] ?? "outputs/diablo4-bucket-binary-table-source";

const FLOAT_10_BITS = 1092616192;

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value != null).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

function watchedValues(selectorMatrix) {
  const matrixAssets = uniqueSorted((selectorMatrix?.rows ?? []).map((row) => row.assetId));
  return {
    selectors: [949, 994],
    metadata: [12337],
    scaleBits: [FLOAT_10_BITS],
    assets: matrixAssets,
    all: uniqueSorted([949, 994, 12337, FLOAT_10_BITS, ...matrixAssets]),
  };
}

function classifyHit(pathParts, value, parent, watched) {
  const key = String(pathParts[pathParts.length - 1] ?? "").toLowerCase();
  const pathText = pathParts.join(".").toLowerCase();
  const parentKeys = parent && typeof parent === "object" && !Array.isArray(parent)
    ? Object.keys(parent).map((name) => name.toLowerCase())
    : [];
  const hasNameLikeSibling = parentKeys.some((name) => /name|label|field|selector|metadata|table|schema|enum|kind|type|family/.test(name));
  const hasSourceSibling = parentKeys.some((name) => /string|term|source|target|asset|selector|metadata|tableid|layout/.test(name));

  if (/offset|length|size|bytes|score|count|rank|index|sample|min|max|pairs|filelimit|lim/i.test(key)) {
    return "metric-or-offset-noise";
  }
  if (/assetid/.test(key) && watched.assets.includes(Number(value))) {
    return "watched-asset-reference";
  }
  if (/selector/.test(key) && watched.selectors.includes(Number(value))) {
    return "selector-context";
  }
  if (/metadata/.test(key) && watched.metadata.includes(Number(value))) {
    return "metadata-context";
  }
  if (/tableid/.test(key) && watched.all.includes(Number(value))) {
    return "table-id-context";
  }
  if (hasNameLikeSibling && hasSourceSibling) {
    return "potential-source-context";
  }
  if (pathText.includes("tableidhits")) {
    return "table-id-hit-context";
  }
  return "unqualified-table-number";
}

function makeExcerpt(parent) {
  if (!parent || typeof parent !== "object" || Array.isArray(parent)) return null;
  const excerpt = {};
  for (const [key, value] of Object.entries(parent).slice(0, 18)) {
    if (value == null || typeof value !== "object") {
      excerpt[key] = value;
    } else if (Array.isArray(value)) {
      excerpt[key] = `[array:${value.length}]`;
    } else {
      excerpt[key] = `{object:${Object.keys(value).length}}`;
    }
  }
  return excerpt;
}

function walk(node, pathParts, parent, watched, state) {
  if (typeof node === "number") {
    if (Number.isInteger(node) && watched.all.includes(node)) {
      state.exactHits.push({
        path: pathParts.join("."),
        value: node,
        valueKind: watched.selectors.includes(node)
          ? "selector"
          : watched.metadata.includes(node)
            ? "metadata"
            : watched.scaleBits.includes(node)
              ? "scale-bits"
              : watched.assets.includes(node)
                ? "asset"
                : "unknown",
        classification: classifyHit(pathParts, node, parent, watched),
        parentExcerpt: makeExcerpt(parent),
      });
    }
    return;
  }

  if (typeof node === "string") {
    const numeric = Number(node);
    if (Number.isInteger(numeric) && watched.all.includes(numeric)) {
      state.exactStringHits.push({
        path: pathParts.join("."),
        value: node,
        numericValue: numeric,
        classification: classifyHit(pathParts, numeric, parent, watched),
        parentExcerpt: makeExcerpt(parent),
      });
    }
    return;
  }

  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((value, index) => walk(value, pathParts.concat(index), node, watched, state));
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    walk(value, pathParts.concat(key), node, watched, state);
  }
}

function scanNamedJson(name, filePath, watched) {
  const json = readJsonIfExists(filePath);
  if (!json) {
    return {
      name,
      filePath,
      exists: false,
      exactHits: [],
      exactStringHits: [],
    };
  }
  const state = {
    exactHits: [],
    exactStringHits: [],
  };
  walk(json, [name], null, watched, state);
  return {
    name,
    filePath,
    exists: true,
    summary: json.summary ?? null,
    exactHits: state.exactHits,
    exactStringHits: state.exactStringHits,
  };
}

const selectorMatrix = readJsonIfExists(inputs.selectorMatrix);
const watched = watchedValues(selectorMatrix);
const scans = [
  scanNamedJson("tableCandidates", inputs.tableCandidates, watched),
  scanNamedJson("strictTableCandidates", inputs.strictTableCandidates, watched),
  scanNamedJson("strongTableCandidates", inputs.strongTableCandidates, watched),
].filter((scan) => scan.exists);

const exactHits = scans.flatMap((scan) => scan.exactHits.map((hit) => ({ sourceName: scan.name, filePath: scan.filePath, ...hit })));
const exactStringHits = scans.flatMap((scan) => scan.exactStringHits.map((hit) => ({ sourceName: scan.name, filePath: scan.filePath, ...hit })));
const allHits = exactHits.concat(exactStringHits);
const usefulClassifications = new Set([
  "selector-context",
  "metadata-context",
  "table-id-context",
  "potential-source-context",
]);
const usefulHits = allHits.filter((hit) => usefulClassifications.has(hit.classification));
const sourceCandidates = usefulHits.filter((hit) => hit.classification === "potential-source-context" || hit.classification === "table-id-context");

const valueCounts = {};
const classificationCounts = {};
for (const hit of allHits) {
  const key = String(hit.numericValue ?? hit.value);
  valueCounts[key] = (valueCounts[key] ?? 0) + 1;
  classificationCounts[hit.classification] = (classificationCounts[hit.classification] ?? 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bucket-binary-table-source-audit-v1",
  source: {
    ...inputs,
    watched,
  },
  summary: {
    filesScanned: scans.length,
    exactHits: exactHits.length,
    exactStringHits: exactStringHits.length,
    usefulHits: usefulHits.length,
    sourceCandidates: sourceCandidates.length,
    valueCounts,
    classificationCounts,
    sourceProofReady: false,
    promotionReady: false,
    assessment: {
      kind: sourceCandidates.length
        ? "bucket-binary-table-source-has-unvalidated-candidates"
        : usefulHits.length
          ? "bucket-binary-table-source-has-unlinked-contexts"
          : "bucket-binary-table-source-not-found",
      confidence: sourceCandidates.length ? "medium" : "high",
      blocker: sourceCandidates.length ? "binary-table-parser-required" : "binary-table-source-not-found",
      finding: sourceCandidates.length
        ? "Des contextes de table contiennent des valeurs surveillees, mais aucun ne nomme une famille additive/multiplicative."
        : "Les candidats de tables binaires ne relient pas les selecteurs 949/994, metadata 12337 ou les assets Bonus_Percent_Per_Power a une source de bucket.",
      nextAction: sourceCandidates.length
        ? "Parser les candidats binaires marques sourceCandidates avant toute promotion."
        : "Considerer les tables candidates locales comme non promouvables pour les buckets; chercher une autre famille de records ou une source externe fiable.",
    },
  },
  scans: scans.map((scan) => ({
    name: scan.name,
    filePath: scan.filePath,
    exists: scan.exists,
    summary: scan.summary,
    exactHits: scan.exactHits.length,
    exactStringHits: scan.exactStringHits.length,
  })),
  usefulHits: usefulHits.slice(0, 80),
  sourceCandidates: sourceCandidates.slice(0, 80),
  exactHits: allHits.slice(0, 120),
  safeguards: [
    "Une valeur surveillee dans un JSON de candidat table peut etre un score, offset, sample ou asset id; elle ne prouve pas une source.",
    "Une table binaire doit nommer ou encoder une famille additive/multiplicative avant toute promotion.",
    "Aucun candidat table ne doit alimenter reliableDps tant que la semantique de bucket n'est pas prouvee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bucket-binary-table-source.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
