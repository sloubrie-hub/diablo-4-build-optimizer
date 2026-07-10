const fs = require("fs");
const path = require("path");

const localTableFile = process.argv[2] ?? "outputs/diablo4-local-table-source-alternatives/local-table-source-alternatives.json";
const tableCandidatesFile = process.argv[3] ?? "outputs/diablo4-table-candidates/table-candidates.json";
const strictTableCandidatesFile = process.argv[4] ?? "outputs/diablo4-table-candidates-strict/table-candidates.json";
const outDir = process.argv[5] ?? "outputs/diablo4-sf32-table-numeric-contexts";

const WATCHED = new Set([949, 12337]);
const WATCHED_STRINGS = new Set(["949", "12337"]);
const CONTEXT_LIMIT = 40;
const NOISE_LIMIT = 20;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function classify(pathParts, value, parent) {
  const pathText = pathParts.join(".").toLowerCase();
  const key = String(pathParts[pathParts.length - 1] ?? "").toLowerCase();
  const parentKeys = parent && typeof parent === "object" ? Object.keys(parent).map((name) => name.toLowerCase()) : [];
  const hasNameLikeKey = parentKeys.some((name) => /name|label|field|selector|metadata|dictionary|enum|table/.test(name));

  if (/score|offset|length|size|count|index|rank|distance|start|end|file|byte|run/.test(key)) {
    return "numeric-metric-or-offset-noise";
  }

  if (/assetid|asset-id|asset/.test(key)) {
    return "asset-id-or-reference-noise";
  }

  if (/tableid|table-id/.test(key)) {
    return "table-id-context";
  }

  if (/selector/.test(key) && Number(value) === 949) {
    return "selector-949-context";
  }

  if (/metadata/.test(key) && Number(value) === 12337) {
    return "metadata-12337-context";
  }

  if (hasNameLikeKey) {
    return "potential-source-context";
  }

  return "unqualified-numeric-context";
}

function makeExcerpt(parent) {
  if (!parent || typeof parent !== "object") return null;
  const excerpt = {};
  for (const [key, value] of Object.entries(parent).slice(0, 16)) {
    if (value === null || typeof value !== "object") {
      excerpt[key] = value;
    } else if (Array.isArray(value)) {
      excerpt[key] = `[array:${value.length}]`;
    } else {
      excerpt[key] = `{object:${Object.keys(value).length}}`;
    }
  }
  return excerpt;
}

function walk(node, pathParts, parent, state) {
  if (typeof node === "number") {
    if (Number.isInteger(node) && WATCHED.has(node)) {
      const classification = classify(pathParts, node, parent);
      state.exactIntegerHits.push({
        path: pathParts.join("."),
        value: node,
        classification,
        parentExcerpt: makeExcerpt(parent),
      });
    } else if (String(node).includes("949")) {
      state.decimalSubstringHits += 1;
      if (state.decimalSubstringSamples.length < NOISE_LIMIT) {
        state.decimalSubstringSamples.push({
          path: pathParts.join("."),
          value: node,
          classification: "decimal-substring-noise",
        });
      }
    }
    return;
  }

  if (typeof node === "string") {
    if (WATCHED_STRINGS.has(node)) {
      const classification = classify(pathParts, node, parent);
      state.exactStringHits.push({
        path: pathParts.join("."),
        value: node,
        classification,
        parentExcerpt: makeExcerpt(parent),
      });
    } else if (node.includes("949")) {
      state.stringSubstringHits += 1;
      if (state.stringSubstringSamples.length < NOISE_LIMIT) {
        state.stringSubstringSamples.push({
          path: pathParts.join("."),
          value: node.slice(0, 160),
          classification: "string-substring-noise",
        });
      }
    }
    return;
  }

  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    node.forEach((value, index) => walk(value, pathParts.concat(index), node, state));
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    walk(value, pathParts.concat(key), node, state);
  }
}

function scanFile(filePath) {
  const json = readJson(filePath);
  const state = {
    filePath,
    exactIntegerHits: [],
    exactStringHits: [],
    decimalSubstringHits: 0,
    decimalSubstringSamples: [],
    stringSubstringHits: 0,
    stringSubstringSamples: [],
  };
  walk(json, [path.basename(filePath, ".json")], null, state);
  return state;
}

function summarize(scans) {
  const exactIntegerHits = scans.flatMap((scan) =>
    scan.exactIntegerHits.map((hit) => ({ filePath: scan.filePath, ...hit }))
  );
  const exactStringHits = scans.flatMap((scan) =>
    scan.exactStringHits.map((hit) => ({ filePath: scan.filePath, ...hit }))
  );
  const allExactHits = exactIntegerHits.concat(exactStringHits);
  const usefulClassifications = new Set([
    "table-id-context",
    "selector-949-context",
    "metadata-12337-context",
    "potential-source-context",
  ]);
  const usefulContexts = allExactHits.filter((hit) => usefulClassifications.has(hit.classification));
  const potentialSourceContexts = allExactHits.filter((hit) => hit.classification === "potential-source-context");
  const decimalSubstringHits = scans.reduce((sum, scan) => sum + scan.decimalSubstringHits, 0);
  const stringSubstringHits = scans.reduce((sum, scan) => sum + scan.stringSubstringHits, 0);

  const exact949Contexts = allExactHits.filter((hit) => String(hit.value) === "949");
  const exact12337Contexts = allExactHits.filter((hit) => String(hit.value) === "12337");

  const assessment = {
    kind: usefulContexts.length > 0
      ? "sf32-table-numeric-contexts-has-potential-source"
      : "sf32-table-numeric-contexts-no-source-proof",
    confidence: usefulContexts.length > 0 ? "medium" : "high",
    fieldOwnership: "not-proven",
    blocker: usefulContexts.length > 0 ? "field-level-parser-required" : "table-numeric-contexts-not-source-proof",
    promotionReady: false,
    finding: usefulContexts.length > 0
      ? "Des contextes numeriques exacts meritent une inspection, mais ils ne suffisent pas a promouvoir SF_32 sans source nommee."
      : "Les contextes numeriques `949/12337` des candidats table ne fournissent pas de table source nommee ni de preuve de champ proprietaire.",
    nextAction: usefulContexts.length > 0
      ? "Inspecter manuellement les contextes marques potential-source-context avant toute promotion."
      : "Considerer les candidats table locaux comme epuises pour SF_32 et chercher une source externe ou un decodeur de tables plus bas niveau.",
    evidence: {
      exactIntegerHits: exactIntegerHits.length,
      exactStringHits: exactStringHits.length,
      exact949Contexts: exact949Contexts.length,
      exact12337Contexts: exact12337Contexts.length,
      decimalSubstringHits,
      stringSubstringHits,
      usefulContexts: usefulContexts.length,
      potentialSourceContexts: potentialSourceContexts.length,
    },
  };

  return {
    exactIntegerHits,
    exactStringHits,
    usefulContexts,
    potentialSourceContexts,
    decimalSubstringSamples: scans.flatMap((scan) =>
      scan.decimalSubstringSamples.map((sample) => ({ filePath: scan.filePath, ...sample }))
    ).slice(0, CONTEXT_LIMIT),
    stringSubstringSamples: scans.flatMap((scan) =>
      scan.stringSubstringSamples.map((sample) => ({ filePath: scan.filePath, ...sample }))
    ).slice(0, CONTEXT_LIMIT),
    assessment,
  };
}

const inputFiles = [localTableFile, tableCandidatesFile, strictTableCandidatesFile].filter((filePath) => fs.existsSync(filePath));
const scans = inputFiles.map(scanFile);
const details = summarize(scans);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-table-numeric-contexts-v1",
  source: {
    localTableFile,
    tableCandidatesFile,
    strictTableCandidatesFile,
  },
  summary: {
    filesScanned: scans.length,
    exactIntegerHits: details.exactIntegerHits.length,
    exactStringHits: details.exactStringHits.length,
    exact949Contexts: details.exactIntegerHits.concat(details.exactStringHits).filter((hit) => String(hit.value) === "949").length,
    exact12337Contexts: details.exactIntegerHits.concat(details.exactStringHits).filter((hit) => String(hit.value) === "12337").length,
    decimalSubstringHits: scans.reduce((sum, scan) => sum + scan.decimalSubstringHits, 0),
    stringSubstringHits: scans.reduce((sum, scan) => sum + scan.stringSubstringHits, 0),
    usefulContexts: details.usefulContexts.length,
    potentialSourceContexts: details.potentialSourceContexts.length,
    assessment: details.assessment,
  },
  exactIntegerHits: details.exactIntegerHits.slice(0, CONTEXT_LIMIT),
  exactStringHits: details.exactStringHits.slice(0, CONTEXT_LIMIT),
  usefulContexts: details.usefulContexts.slice(0, CONTEXT_LIMIT),
  potentialSourceContexts: details.potentialSourceContexts.slice(0, CONTEXT_LIMIT),
  decimalSubstringSamples: details.decimalSubstringSamples,
  stringSubstringSamples: details.stringSubstringSamples,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf32-table-numeric-contexts.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
