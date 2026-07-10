const fs = require("fs");
const path = require("path");

const parserSeedFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-binary-layout";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function wordAt(window, distance) {
  return (window ?? []).find((word) => word.distance === distance)?.u32 ?? null;
}

function classifyPrelude(match) {
  const w16 = wordAt(match.wordWindow, -16);
  const w12 = wordAt(match.wordWindow, -12);
  const w8 = wordAt(match.wordWindow, -8);
  const w4 = wordAt(match.wordWindow, -4);
  if (w16 === 0 && w12 === 0 && Number.isInteger(w8) && w8 > match.offset && [12, 24, 36].includes(w4)) {
    return "string-table-pointer-length";
  }
  if (w16 === 6 && [1065353216, 1073741824, 1094713344, 1097859072, 1120403456].includes(w12) && [0, 14].includes(w8) && w4 === 0) {
    return "typed-float-or-scale-record";
  }
  if (Number.isInteger(w16) && w16 > 100000 && w12 === 0 && w8 === 0 && w4 === 0) {
    return "asset-like-link-record";
  }
  if (Number.isInteger(w16) && w16 < 20000 && w12 === 6 && w4 === 0) {
    return "small-id-typed-value-record";
  }
  if (w16 === 994 && Number.isInteger(w12) && w12 > 100000 && w8 === 0 && w4 === 0) {
    return "selector-994-asset-link-record";
  }
  return "other-prelude";
}

function signature(match) {
  return [-16, -12, -8, -4].map((distance) => wordAt(match.wordWindow, distance)).join("|");
}

const seed = readJson(parserSeedFile);
const stringRows = (seed.inspected ?? []).flatMap((candidate) =>
  (candidate.strings?.matched ?? []).map((match) => ({
    assetId: candidate.assetId,
    fileName: candidate.fileName,
    blteOffset: candidate.blteOffset,
    groupKey: candidate.groupKey,
    candidateKind: candidate.kind,
    stringKind: match.kind,
    stringOffset: match.offset,
    value: match.value,
    preludeKind: classifyPrelude(match),
    signature: signature(match),
    words: [-16, -12, -8, -4].map((distance) => ({
      distance,
      u32: wordAt(match.wordWindow, distance),
    })),
  })),
);

const groups = Array.from(stringRows.reduce((map, row) => {
  const key = `${row.stringKind}|${row.preludeKind}|${row.signature}`;
  if (!map.has(key)) {
    map.set(key, {
      key,
      stringKind: row.stringKind,
      preludeKind: row.preludeKind,
      signature: row.signature,
      hits: 0,
      assets: new Set(),
      groupKeys: new Set(),
      examples: [],
    });
  }
  const group = map.get(key);
  group.hits += 1;
  group.assets.add(row.assetId);
  group.groupKeys.add(row.groupKey);
  if (group.examples.length < 5) group.examples.push({
    assetId: row.assetId,
    groupKey: row.groupKey,
    value: row.value,
    stringOffset: row.stringOffset,
  });
  return map;
}, new Map()).values())
  .map((group) => ({
    ...group,
    assets: Array.from(group.assets).sort((a, b) => a - b),
    groupKeys: Array.from(group.groupKeys).sort(),
  }))
  .sort((a, b) => b.hits - a.hits || a.preludeKind.localeCompare(b.preludeKind));

const affixRows = stringRows.filter((row) => row.stringKind === "affix-value-reference");
const directSlotRows = stringRows.filter((row) => row.stringKind === "direct-slot-field");
const slotNameRows = stringRows.filter((row) => row.stringKind === "slot-name-reference");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-binary-layout-audit-v1",
  source: {
    parserSeedFile,
    seedMode: seed.mode ?? null,
  },
  summary: {
    inspectedCandidates: seed.summary?.decodedCandidates ?? 0,
    matchedStrings: stringRows.length,
    affixValueReferences: affixRows.length,
    directSlotFieldStrings: directSlotRows.length,
    slotNameReferenceStrings: slotNameRows.length,
    preludeGroups: groups.length,
    promotionReady: false,
    assessment: {
      kind: directSlotRows.length
        ? "binary-layout-direct-slot-string-needs-field-parser"
        : "binary-layout-affix-value-records-only",
      confidence: "medium-high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: directSlotRows.length
        ? "Des chaines de champ slot existent dans les payloads inspectes, mais leur record binaire doit etre parse avant promotion."
        : "Les payloads inspectes exposent des records de valeurs d'affixes, pas de champ direct allowedSlots.",
      nextAction: "Construire le parseur autour des preludes de chaine, puis chercher une table aspect-equipement qui porte un champ slot direct.",
    },
  },
  preludeGroups: groups,
  stringRows,
  parserHypotheses: [
    {
      id: "string-table-pointer-length",
      status: groups.some((group) => group.preludeKind === "string-table-pointer-length") ? "observed" : "missing",
      meaning: "possible entree de table de chaines avec offset et longueur avant la chaine",
      promotionReady: false,
    },
    {
      id: "typed-float-or-scale-record",
      status: groups.some((group) => group.preludeKind === "typed-float-or-scale-record") ? "observed" : "missing",
      meaning: "possible record type + constante float associee a une formule ou valeur d'affixe",
      promotionReady: false,
    },
    {
      id: "asset-like-link-record",
      status: groups.some((group) => group.preludeKind === "asset-like-link-record") ? "observed" : "missing",
      meaning: "possible lien vers asset/affixe voisin, a comparer au record proprietaire",
      promotionReady: false,
    },
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-binary-layout.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
