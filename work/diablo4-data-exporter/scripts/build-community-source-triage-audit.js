const fs = require("fs");
const path = require("path");

const outDir = process.argv[2] ?? "outputs/diablo4-community-source-triage-audit";

const sources = [
  {
    id: "diablotools-org",
    url: "https://github.com/DiabloTools",
    role: "organisation-source",
    status: "active-candidate",
    priority: 1,
    usefulFor: ["current-tools", "d4data-fork", "attribute-dictionaries"],
    observed: {
      note: "Organisation contenant Diablo4Tools-Releases et d4data.",
    },
  },
  {
    id: "diablotools-d4data",
    url: "https://github.com/DiabloTools/d4data",
    role: "active-d4data-fork",
    status: "active",
    priority: 1,
    usefulFor: ["definitions", "field-types", "parse-reference", "attribute-list", "names"],
    observed: {
      archived: false,
      defaultBranch: "master",
      pushedAt: "2026-07-01T04:50:26Z",
      license: "MIT",
      filesSeen: [
        "attributeList.json",
        "attributes.json",
        "definitions.json",
        "field_types.txt",
        "parse.js",
        "names",
        "json",
      ],
      readmeSignals: [
        "files pulled from the game and parsed into json",
        "DT_SNO and DT_SNONAME fields are file references",
        "DT_GBID references a game balance array element",
      ],
      parserSignals: [
        "parse.js resolves field hashes and type readers",
        "parse.js enriches eAttribute values from attributeList.json",
        "parse.js includes readers for DT_SNO, DT_SNO_NAME and DT_GBID",
      ],
    },
  },
  {
    id: "blizzhackers-d4data",
    url: "https://github.com/blizzhackers/d4data",
    role: "upstream-historical-d4data",
    status: "archived",
    priority: 3,
    usefulFor: ["history", "older-atlas-context"],
    observed: {
      archived: true,
      defaultBranch: "master",
      pushedAt: "2024-08-20T23:32:45Z",
      license: "MIT",
      description: "Development halted; Use the linked repo instead.",
    },
  },
  {
    id: "mfloob-diablo4-data-harvest",
    url: "https://github.com/mfloob/diablo4-data-harvest",
    role: "format-parser-reference",
    status: "archived",
    priority: 2,
    usefulFor: ["stl-parser-reference", "aff-parser-reference", "skl-parser-reference"],
    observed: {
      archived: true,
      defaultBranch: "main",
      pushedAt: "2023-04-02T23:02:13Z",
      license: null,
      readmeSignals: ["Rust rewrite of diablo4-string-parser", "supports .stl .aff .skl"],
      srcFilesSeen: ["app.rs", "main.rs", "parsers", "utils.rs"],
      parserSignals: ["UI and CLI paths call Stl, Aff and Skl parsers over folders"],
    },
  },
];

const recommendedUse = [
  {
    id: "use-diablotools-d4data-as-structure-reference",
    sourceId: "diablotools-d4data",
    status: "recommended",
    action: "Comparer nos records selector->asset avec definitions.json, field_types.txt et parse.js avant d'ecrire le parser read-only.",
  },
  {
    id: "keep-blizzhackers-as-history-only",
    sourceId: "blizzhackers-d4data",
    status: "historical-only",
    action: "Ne pas preferer ce depot a DiabloTools/d4data pour les donnees courantes, car il est archive.",
  },
  {
    id: "use-mfloob-for-format-cross-check",
    sourceId: "mfloob-diablo4-data-harvest",
    status: "limited-reference",
    action: "Utiliser les parsers .aff/.skl/.stl comme reference de format seulement si le prochain payload touche ces familles.",
  },
];

const blockers = [
  {
    id: "sf32-owner-not-proven-by-community-sources",
    status: "still-blocked",
    reason: "Les sources listent des parsers et dictionnaires, mais aucune preuve directe du champ exact SF_32 pour asset 1663210 n'a ete validee.",
  },
  {
    id: "sf33-trigger-not-proven-by-community-sources",
    status: "still-blocked",
    reason: "Aucune source inspectee ne prouve le trigger/build-state SF_33.",
  },
  {
    id: "uptime-not-proven-by-community-sources",
    status: "still-blocked",
    reason: "Aucune source inspectee ne prouve l'uptime du candidat.",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "community-source-triage-audit-v1",
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    sourcesReviewed: sources.length,
    activeSources: sources.filter((source) => source.status === "active" || source.status === "active-candidate").length,
    archivedSources: sources.filter((source) => source.status === "archived").length,
    bestNextSourceId: "diablotools-d4data",
    bestNextAction: "Comparer le parser read-only selector-asset-record avec parse.js, definitions.json et field_types.txt de DiabloTools/d4data.",
    sourceTriageReady: true,
    acceptedForBridge: false,
    writesTargetDataset: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: "community-sources-useful-for-parser-not-promotion",
      confidence: "high",
      promotionReady: false,
      finding: "Les sources communautaires aident surtout a cadrer les parsers et dictionnaires; elles ne prouvent pas encore SF_32, SF_33 ni l'uptime.",
      nextAction: "Auditer DiabloTools/d4data contre le contrat selector-asset-record avant de decoder les payloads read-only.",
    },
  },
  sources,
  recommendedUse,
  blockers,
  safeguards: {
    noAutomaticApproval: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
    reason: "Une source externe communautaire peut orienter un parser, mais ne suffit pas a promouvoir un delta sans preuve champ/trigger/uptime.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "community-source-triage-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
