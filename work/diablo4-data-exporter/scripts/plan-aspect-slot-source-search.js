const fs = require("fs");
const path = require("path");

const previousPlanFile = process.argv[2] ?? "outputs/diablo4-external-target-scan-plan/external-target-scan-plan.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-source-search-plan";
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
    id: "slot-field-names",
    priority: "high",
    terms: [
      "allowedSlots",
      "AllowedSlots",
      "Allowed_Slots",
      "AllowedSlot",
      "Allowed_Slot",
      "equipmentSlot",
      "EquipmentSlot",
      "Equipment_Slot",
      "EquipSlot",
      "Equip_Slot",
      "slotMask",
      "SlotMask",
      "ItemType",
      "Item_Type",
      "itemType",
      "ItemEquipLocation",
      "EquipLocation",
    ],
  },
  {
    id: "aspect-equipment-table-names",
    priority: "high",
    terms: [
      "AspectEquipment",
      "Aspect_Equipment",
      "LegendaryPower",
      "Legendary_Power",
      "UniquePower",
      "Unique_Power",
      "CodexPower",
      "Codex_Power",
      "PowerAspect",
      "Aspect",
      "Legendary",
      "Unique",
    ],
  },
  {
    id: "slot-token-prefixes",
    priority: "medium",
    terms: [
      "Helm_",
      "Chest_",
      "Gloves_",
      "Pants_",
      "Boots_",
      "Amulet_",
      "Ring_",
      "Weapon_",
      "Offhand_",
      "1HShield_",
      "2H",
    ],
  },
  {
    id: "known-necro-slot-leads",
    priority: "medium",
    terms: [
      "Helm_Unique_Necro_100",
      "Affix_Flat_Value_1#Helm_Unique_Necro_100",
      "legendary_necro_012",
      "Affix_Value_1#legendary_necro_012",
      "Necromancer_Talent_Caster_T3_N1",
    ],
  },
];

const scanChunks = chunk(fileNames, 32).map((files, index) => {
  const fileOffset = index * 32;
  const fileLimit = files.length;
  const suffix = String(fileOffset).padStart(3, "0");
  const shardOutDir = path.join(outDir, `slot-source-search-offset-${suffix}`);
  const terms = termGroups.flatMap((group) => group.terms);
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
    "500",
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

const mergeOutDir = path.join(outDir, "slot-source-search-merged");
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
  mode: "aspect-slot-source-search-plan-v1",
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
    terms: termGroups.reduce((sum, group) => sum + group.terms.length, 0),
    readyToRun: scanChunks.length > 0,
    promotionReady: false,
    recommendation: "run-slot-source-search-script-then-audit-results-before-filling-allowedSlots",
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
const outFile = path.join(outDir, "aspect-slot-source-search-plan.json");
const scriptFile = path.join(outDir, "run-aspect-slot-source-search.ps1");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(scriptFile, script);
console.log(JSON.stringify({ outFile, scriptFile, summary: report.summary }, null, 2));
