const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-selector-asset-pair-corpus";
const selectors = [949, 994, 997, 1126];
const FLOAT_10_BITS = 1092616192;

function listDecodedBins(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDecodedBins(fullPath);
    return entry.isFile() && entry.name.endsWith(".decoded.bin") ? [fullPath] : [];
  });
}

function u32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return buffer.readUInt32LE(offset);
}

function f32At(buffer, offset) {
  if (offset < 0 || offset > buffer.length - 4) return null;
  return Number(buffer.readFloatLE(offset).toFixed(6));
}

function normalizeSelector(raw) {
  return raw >= 2147483648 ? raw - 2147483648 : raw;
}

function isAssetLike(value) {
  return Number.isInteger(value) && value > 100000 && value < 10000000;
}

function extractStrings(buffer, center, radius = 220) {
  const start = Math.max(0, center - radius);
  const end = Math.min(buffer.length, center + radius);
  return buffer
    .subarray(start, end)
    .toString("latin1")
    .split(/[^\x20-\x7e]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 4)
    .slice(0, 24);
}

function inferFamily(strings) {
  const joined = strings.join(" ");
  if (/Bonus_Percent_Per_Power#/i.test(joined)) return "bonus-percent-per-power";
  if (/Affix_Value_1#/i.test(joined)) return "affix-value";
  if (/Chance_For_Double_Damage_Per_Power#/i.test(joined)) return "chance-per-power";
  if (/CC_Duration_Bonus_Percent_Per_Power#/i.test(joined)) return "duration-bonus-percent";
  return "unknown";
}

function words(buffer, offset) {
  const list = [];
  for (let cursor = offset - 16; cursor <= offset + 40; cursor += 4) {
    list.push({
      offset: cursor,
      distance: cursor - offset,
      u32: u32At(buffer, cursor),
      f32: f32At(buffer, cursor),
    });
  }
  return list;
}

function classify(buffer, offset, normalizedSelector, assetCandidate) {
  const postA = u32At(buffer, offset + 8);
  const postB = u32At(buffer, offset + 12);
  const metadata = u32At(buffer, offset + 16);
  const opcode = u32At(buffer, offset + 20);
  const scale = u32At(buffer, offset + 24);
  if (postA === 0 && postB === 0 && metadata === 12337 && opcode === 6 && scale === FLOAT_10_BITS) {
    return "selector-asset-compact-metadata-scale";
  }
  if (postA === 0 && postB === 0) return "selector-asset-no-local-metadata";
  if (postA === 0 && postB !== 0 && metadata === 0) return "selector-asset-wrapper-or-variant";
  return "selector-asset-divergent-tail";
}

const files = listDecodedBins(rootDir);
const hits = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  for (let offset = 0; offset <= buffer.length - 28; offset += 4) {
    const rawSelector = u32At(buffer, offset);
    const normalizedSelector = normalizeSelector(rawSelector);
    if (!selectors.includes(normalizedSelector)) continue;
    const assetCandidate = u32At(buffer, offset + 4);
    if (!isAssetLike(assetCandidate)) continue;
    const nearbyStrings = extractStrings(buffer, offset);
    hits.push({
      file,
      offset,
      rawSelector,
      selector: normalizedSelector,
      selectorEncoding: rawSelector === normalizedSelector ? "plain" : "highbit",
      assetCandidate,
      shape: classify(buffer, offset, normalizedSelector, assetCandidate),
      family: inferFamily(nearbyStrings),
      nearbyStrings,
      words: words(buffer, offset),
    });
  }
}

const groups = {};
for (const hit of hits) {
  const key = `selector:${hit.selector}|${hit.shape}|${hit.family}`;
  groups[key] = groups[key] || {
    key,
    selector: hit.selector,
    shape: hit.shape,
    family: hit.family,
    count: 0,
    assetCandidates: [],
    files: [],
    examples: [],
  };
  groups[key].count += 1;
  if (!groups[key].assetCandidates.includes(hit.assetCandidate)) groups[key].assetCandidates.push(hit.assetCandidate);
  if (!groups[key].files.includes(hit.file)) groups[key].files.push(hit.file);
  if (groups[key].examples.length < 8) {
    groups[key].examples.push({
      file: hit.file,
      offset: hit.offset,
      assetCandidate: hit.assetCandidate,
      nearbyStrings: hit.nearbyStrings.slice(0, 6),
    });
  }
}

const groupRows = Object.values(groups).sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
const selector949Groups = groupRows.filter((group) => Number(group.selector) === 949);
const selector949Compact = selector949Groups.filter((group) => group.shape === "selector-asset-compact-metadata-scale");
const selector949NonCompact = selector949Groups.filter((group) => group.shape !== "selector-asset-compact-metadata-scale");
const selector994Groups = groupRows.filter((group) => Number(group.selector) === 994);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-asset-pair-corpus-scan-v1",
  source: {
    rootDir,
    selectors,
  },
  summary: {
    filesScanned: files.length,
    hits: hits.length,
    groups: groupRows.length,
    selector949Groups: selector949Groups.length,
    selector949CompactGroups: selector949Compact.length,
    selector949NonCompactGroups: selector949NonCompact.length,
    selector994Groups: selector994Groups.length,
    assessment: {
      kind: selector949Compact.length && selector949NonCompact.length
        ? "selector-949-owner-pair-mixed-layout"
        : selector949Compact.length
          ? "selector-949-owner-pair-compact-only"
          : "selector-949-owner-pair-not-found",
      confidence: hits.length ? "medium-high" : "low",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: selector949Compact.length && selector949NonCompact.length
        ? "Le couple selector 949 -> asset-like est observe, mais il existe en layout compact et non compact; ownership du champ bonus reste bloque."
        : "Le corpus ne suffit pas a prouver un layout proprietaire stable pour selector 949.",
      nextAction: "Separer les layouts selector->asset compact et non compact, puis parser le champ proprietaire avant toute promotion DPS.",
    },
  },
  groups: groupRows,
  hits,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "selector-asset-pair-corpus-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
