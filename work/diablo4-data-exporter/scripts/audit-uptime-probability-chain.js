const fs = require("fs");
const path = require("path");

const stringStructureFile = process.argv[2] ?? "outputs/diablo4-source-asset-1663210-string-structure/decoded-string-structure.json";
const recordSegmentsFile = process.argv[3] ?? "outputs/diablo4-source-asset-1663210-record-segments/record-segment-inspection.json";
const outDir = process.argv[4] ?? "outputs/diablo4-uptime-probability-chain";

const assetId = 1663210;
const watchedSf = new Set([9, 28, 29, 32, 33]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sfRefs(value) {
  return [...new Set([...String(value ?? "").matchAll(/\bSF_(\d+)\b/g)].map((match) => Number(match[1])))]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

function compactString(row, index) {
  return {
    index,
    offset: row.offset ?? null,
    endOffset: row.endOffset ?? null,
    kind: row.kind ?? null,
    value: row.value ?? null,
    sfRefs: sfRefs(row.value),
  };
}

function compactSegment(segment) {
  return {
    index: segment.index ?? null,
    start: segment.start ?? null,
    end: segment.end ?? null,
    from: segment.from
      ? {
          offset: segment.from.offset ?? null,
          kind: segment.from.kind ?? null,
          value: segment.from.value ?? null,
          sfRefs: sfRefs(segment.from.value),
        }
      : null,
    to: segment.to
      ? {
          offset: segment.to.offset ?? null,
          kind: segment.to.kind ?? null,
          value: segment.to.value ?? null,
          sfRefs: sfRefs(segment.to.value),
        }
      : null,
    signature: segment.signature ?? null,
    roles: segment.roles ?? [],
    tokenSummary: (segment.tokens ?? []).map((token) => ({
      offset: token.offset ?? null,
      kind: token.kind ?? null,
      value: token.value ?? token.name ?? token.u32 ?? null,
    })),
  };
}

function classifyFormula(value) {
  const refs = sfRefs(value);
  const isCumulativeProbability = /1\s*-\s*POW\s*\(/i.test(value) || /POW\(/i.test(value);
  const usesBoostBranch = refs.includes(32) || refs.includes(33);
  const usesAttackSpeed = refs.includes(28);
  const usesWindowScalar = refs.includes(9);
  const hasDurationHint = /duration|uptime|cooldown|seconds|proc/i.test(value);
  return {
    refs,
    isCumulativeProbability,
    usesBoostBranch,
    usesAttackSpeed,
    usesWindowScalar,
    hasDurationHint,
  };
}

function findNearestSource(strings, targetOffset, pattern, direction) {
  const rows = strings.filter((row) => {
    if (direction === "before" && !(Number(row.offset) < Number(targetOffset))) return false;
    if (direction === "after" && !(Number(row.offset) > Number(targetOffset))) return false;
    return pattern.test(String(row.value ?? ""));
  });
  rows.sort((a, b) => direction === "before" ? Number(b.offset) - Number(a.offset) : Number(a.offset) - Number(b.offset));
  return rows[0] ?? null;
}

const stringStructure = readJson(stringStructureFile);
const recordSegments = readJson(recordSegmentsFile);
const strings = (stringStructure.strings ?? []).map(compactString);
const segments = (recordSegments.interestingSegments ?? []).map(compactSegment);

const probabilityRows = strings.filter((row) => /POW\(/i.test(String(row.value ?? "")));
const boostBranchRows = strings.filter((row) => row.sfRefs.includes(32) || row.sfRefs.includes(33));
const watchedRows = strings.filter((row) => row.sfRefs.some((ref) => watchedSf.has(ref)) || /Attacks_Per_Second_Total/i.test(String(row.value ?? "")));

const chains = probabilityRows.map((row) => {
  const classification = classifyFormula(row.value);
  const sourceHint = row.sfRefs.includes(28)
    ? findNearestSource(strings, row.offset, /Attacks_Per_Second_Total/i, "before")
    : null;
  const nearestPreviousBoost = findNearestSource(strings, row.offset, /\bSF_32\b|\bSF_33\b/, "before");
  const nearestNextBoost = findNearestSource(strings, row.offset, /\bSF_32\b|\bSF_33\b/, "after");
  return {
    row,
    classification,
    sourceHint,
    nearestPreviousBoost,
    nearestNextBoost,
    distanceFromPreviousBoost: nearestPreviousBoost ? Number(row.offset) - Number(nearestPreviousBoost.offset) : null,
    distanceFromSourceHint: sourceHint ? Number(row.offset) - Number(sourceHint.offset) : null,
  };
});

const segmentLinks = segments.filter((segment) => {
  const text = JSON.stringify(segment);
  return /SF_28|SF_29|SF_9|SF_32|SF_33|Attacks_Per_Second_Total/.test(text);
});

const probabilityChains = chains.filter((chain) => chain.classification.isCumulativeProbability);
const chainsLinkedToBoost = probabilityChains.filter((chain) => chain.classification.usesBoostBranch);
const chainsWithDurationHint = probabilityChains.filter((chain) => chain.classification.hasDurationHint);
const chainsWithAttackSpeedSource = probabilityChains.filter((chain) => chain.sourceHint);

const assessment = {
  kind: chainsLinkedToBoost.length > 0
    ? "uptime-probability-chain-has-boost-link"
    : probabilityChains.length > 0
      ? "uptime-probability-chain-proc-local-not-boost-uptime"
      : "uptime-probability-chain-not-found",
  confidence: probabilityChains.length > 0 && chainsLinkedToBoost.length === 0 ? "high" : "medium",
  blocker: chainsLinkedToBoost.length > 0 ? "uptime-not-proven" : "uptime-not-proven",
  promotionReady: false,
  finding: chainsLinkedToBoost.length > 0
    ? "Une chaine de probabilite reference la branche boostee, mais elle exige encore une valeur d'uptime explicite avant promotion."
    : "Les chaines SF_28/SF_29 sont des probabilites/proc locales; elles ne referencent pas SF_32/SF_33 et ne prouvent pas l'uptime du boost.",
  nextAction: chainsLinkedToBoost.length > 0
    ? "Chercher la valeur numerique d'uptime associee avant promotion."
    : "Garder SF_28/SF_29 hors DPS fiable; utiliser une hypothese utilisateur separee si un scenario de proc doit etre expose.",
  evidence: {
    probabilityChains: probabilityChains.length,
    chainsLinkedToBoost: chainsLinkedToBoost.length,
    chainsWithDurationHint: chainsWithDurationHint.length,
    chainsWithAttackSpeedSource: chainsWithAttackSpeedSource.length,
    boostBranchRows: boostBranchRows.length,
    watchedRows: watchedRows.length,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "uptime-probability-chain-v1",
  source: {
    stringStructureFile,
    recordSegmentsFile,
  },
  summary: {
    assetId,
    probabilityRows: probabilityRows.length,
    probabilityChains: probabilityChains.length,
    chainsLinkedToBoost: chainsLinkedToBoost.length,
    chainsWithDurationHint: chainsWithDurationHint.length,
    chainsWithAttackSpeedSource: chainsWithAttackSpeedSource.length,
    promotionReady: false,
    assessment,
  },
  probabilityChains,
  boostBranchRows,
  watchedRows,
  segmentLinks,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "uptime-probability-chain.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
