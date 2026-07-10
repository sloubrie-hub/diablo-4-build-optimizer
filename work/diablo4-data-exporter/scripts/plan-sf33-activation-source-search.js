const fs = require("fs");
const path = require("path");

const previousPlanFile = process.argv[2] ?? "outputs/diablo4-external-target-scan-plan/external-target-scan-plan.json";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-activation-source-search-plan";
const dataDir = process.argv[4] ?? "C:\\Program Files (x86)\\Diablo IV\\Data\\data";
const externalRefs = process.argv[5] ?? "outputs/diablo4-external-references/external-references.json";

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

const previousPlan = readJsonIfExists(previousPlanFile);
const selectedFiles = previousPlan?.chunks?.flatMap((row) => row.selectedFiles ?? []) ?? [];
const totalFiles = previousPlan?.summary?.totalFiles ?? (selectedFiles.length || 205);
const fileNames = selectedFiles.length
  ? selectedFiles
  : Array.from({ length: totalFiles }, (_, index) => `data.${String(index).padStart(3, "0")}`);

const termGroups = [
  {
    id: "sf33-trigger",
    priority: "high",
    terms: ["Mod.SoilRuler_B", "SoilRuler", "Soil_Ruler"],
  },
  {
    id: "skill-and-power-owner",
    priority: "high",
    terms: [
      "Spiritborn_Talent_Ultimate_2",
      "PowerTag.Spiritborn_Talent_Ultimate_2",
      "Spiritborn_Centipede_Ultimate",
      "Centipede_Ultimate",
      "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate",
    ],
  },
  {
    id: "possible-build-state-fields",
    priority: "medium",
    terms: ["Ultimate_2", "UpgradeB", "UpgradeC", "Mod.UpgradeB", "Mod.UpgradeC"],
  },
];

const terms = [...new Set(termGroups.flatMap((group) => group.terms))];
const scanChunks = chunk(fileNames, 32).map((files, index) => {
  const fileOffset = index * 32;
  const fileLimit = files.length;
  const suffix = String(fileOffset).padStart(3, "0");
  const shardOutDir = path.join(outDir, `sf33-activation-source-offset-${suffix}`);
  const command = [
    "&",
    psQuote(process.execPath),
    psQuote(path.resolve("work", "diablo4-data-exporter", "d4export.js")),
    "search-external-targets",
    "--data-dir",
    psQuote(dataDir),
    "--external-refs",
    psQuote(path.resolve(externalRefs)),
    "--file-offset",
    String(fileOffset),
    "--file-limit",
    String(fileLimit),
    "--max-hits",
    "800",
    "--max-decode-mb",
    "128",
    "--terms",
    psQuote(terms.join(",")),
    "--out",
    psQuote(path.resolve(shardOutDir)),
  ].join(" ");
  return {
    index: index + 1,
    fileOffset,
    fileLimit,
    selectedFiles: files,
    outDir: shardOutDir,
    expectedOutput: path.join(shardOutDir, "external-target-search.json"),
    command,
  };
});

const mergeOutDir = path.join(outDir, "sf33-activation-source-merged");
const mergeCommand = [
  "&",
  psQuote(process.execPath),
  psQuote(path.resolve("work", "diablo4-data-exporter", "d4export.js")),
  "merge-external-target-searches",
  "--merge-files",
  psQuote(scanChunks.map((row) => path.resolve(row.expectedOutput)).join(",")),
  "--out",
  psQuote(path.resolve(mergeOutDir)),
].join(" ");

const script = [
  "$ErrorActionPreference = 'Stop'",
  "",
  ...scanChunks.flatMap((row) => [
    `# Shard ${row.index}: offset ${row.fileOffset}, limit ${row.fileLimit}`,
    row.command,
    "",
  ]),
  "# Merge shards",
  mergeCommand,
  "",
].join("\r\n");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-activation-source-search-plan-v1",
  source: {
    previousPlan: previousPlanFile,
    dataDir,
    externalRefs,
    filesFromPreviousPlan: selectedFiles.length,
  },
  summary: {
    totalFiles: fileNames.length,
    chunks: scanChunks.length,
    termGroups: termGroups.length,
    terms: terms.length,
    trigger: "Mod.SoilRuler_B",
    promotionReady: false,
    recommendation: "run-search-then-audit-before-mapping-sf33-build-state",
  },
  termGroups,
  chunks: scanChunks,
  merge: {
    outDir: mergeOutDir,
    expectedOutput: path.join(mergeOutDir, "external-target-search-merged.json"),
    command: mergeCommand,
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-activation-source-search-plan.json");
const scriptFile = path.join(outDir, "run-sf33-activation-source-search.ps1");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(scriptFile, script);
console.log(JSON.stringify({ outFile, scriptFile, summary: report.summary }, null, 2));
