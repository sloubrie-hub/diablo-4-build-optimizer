const fs = require("fs");
const path = require("path");

const rootDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-table-source";

const watchedTerms = [
  "allowedSlots",
  "allowed_slots",
  "equipmentSlot",
  "equipment_slot",
  "EquipSlot",
  "ItemType",
  "itemType",
  "aspectEquipment",
  "aspect_equipment",
  "slotMask",
  "slot_mask",
  "LegendaryPower",
  "UniquePower",
];

const slotTerms = [
  "helm",
  "chest",
  "gloves",
  "pants",
  "boots",
  "amulet",
  "ring",
  "weapon",
  "shield",
  "offhand",
];

const excludedDirFragments = [
  "diablo4-aspect-slot-readiness",
  "diablo4-aspect-slot-source-evidence",
  "diablo4-aspect-slot-external-bridge",
  "diablo4-aspect-slot-table-source",
];

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (excludedDirFragments.some((fragment) => fullPath.includes(fragment))) return [];
    if (entry.isDirectory()) return collectJsonFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function contextAround(text, index, size = 180) {
  const start = Math.max(0, index - size);
  const end = Math.min(text.length, index + size);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function findTermContexts(filePath, text) {
  const contexts = [];
  for (const term of watchedTerms) {
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    let match;
    while ((match = pattern.exec(text))) {
      const context = contextAround(text, match.index);
      contexts.push({
        filePath,
        term: match[0],
        offset: match.index,
        context,
        directSlotFieldLike: /allowedSlots|allowed_slots|equipmentSlot|equipment_slot|EquipSlot|slotMask|slot_mask/i.test(match[0]),
        containsAspectLike: /aspect|legendary|unique|affix/i.test(context),
        containsSlotName: new RegExp(`\\b(${slotTerms.join("|")})\\b`, "i").test(context),
      });
    }
  }
  return contexts;
}

function findSlotNameContexts(filePath, text) {
  const contexts = [];
  const pattern = new RegExp(`\\b(${slotTerms.join("|")})\\b`, "ig");
  let match;
  while ((match = pattern.exec(text))) {
    const context = contextAround(text, match.index);
    if (!/aspect|legendary|unique|affix|equipment|item/i.test(context)) continue;
    contexts.push({
      filePath,
      slot: match[0].toLowerCase(),
      offset: match.index,
      context,
      usableForAllowedSlots: /allowedSlots|allowed_slots|equipmentSlot|equipment_slot|EquipSlot|slotMask|slot_mask/i.test(context),
    });
  }
  return contexts;
}

const files = collectJsonFiles(rootDir);
const termContexts = [];
const slotNameContexts = [];

for (const filePath of files) {
  const text = fs.readFileSync(filePath, "utf8");
  termContexts.push(...findTermContexts(filePath, text));
  slotNameContexts.push(...findSlotNameContexts(filePath, text));
}

const directFieldContexts = termContexts.filter((row) => row.directSlotFieldLike);
const directSourceProofs = directFieldContexts.filter(
  (row) => row.containsAspectLike && row.containsSlotName && !/currentAllowedSlots|targetDatasetField|slot-data-not-normalized/i.test(row.context)
);
const usableSlotNameContexts = slotNameContexts.filter((row) => row.usableForAllowedSlots);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-table-source-audit-v1",
  input: {
    rootDir,
    watchedTerms,
    slotTerms,
    excludedDirFragments,
  },
  summary: {
    jsonFilesScanned: files.length,
    watchedTermContexts: termContexts.length,
    directSlotFieldContexts: directFieldContexts.length,
    slotNameContexts: slotNameContexts.length,
    usableSlotNameContexts: usableSlotNameContexts.length,
    directSourceProofs: directSourceProofs.length,
    promotionReady: false,
    assessment: {
      kind: directSourceProofs.length > 0
        ? "aspect-slot-table-source-candidate-needs-parser"
        : "aspect-slot-table-source-not-found",
      confidence: directSourceProofs.length > 0 ? "medium" : "medium-high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: directSourceProofs.length > 0
        ? "Des contextes ressemblent a une source de slot, mais ils doivent etre parses avant promotion."
        : "Aucune table ou champ source allowedSlots/equipmentSlot/aspect-equipment exploitable n'a ete trouve dans les sorties JSON actuelles.",
      nextAction: "Elargir le decode vers des assets/tables d'equipement ou ajouter un parseur de records source nommant les slots.",
    },
  },
  directFieldContexts: directFieldContexts.slice(0, 40),
  slotNameContexts: slotNameContexts.slice(0, 40),
  directSourceProofs: directSourceProofs.slice(0, 40),
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-table-source.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
