const fs = require("fs");
const path = require("path");

const stringInspectionFile = process.argv[2] ?? "outputs/diablo4-source-asset-1092943-strings/decoded-string-structure.json";
const sourceSearchAuditFile = process.argv[3] ?? "outputs/diablo4-aspect-slot-source-search-audit/aspect-slot-source-search-audit.json";
const outDir = process.argv[4] ?? "outputs/diablo4-aspect-slot-itemtype-candidate";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const strings = readJson(stringInspectionFile);
const sourceAudit = readJson(sourceSearchAuditFile);
const values = (strings.strings ?? []).map((row) => row.value);
const itemTypeValues = values.filter((value) => /ItemType/i.test(value));
const allowedSlotValues = values.filter((value) => /allowedSlots|equipmentSlot|EquipSlot|slotMask/i.test(value));
const techniqueValues = values.filter((value) => /TechniqueSlotIsItemType|GetItemTypeCountForPower/i.test(value));
const directCandidates = sourceAudit.directFieldCandidates ?? [];

const isTechniqueItemTypeOnly =
  itemTypeValues.length > 0 &&
  techniqueValues.length === itemTypeValues.length &&
  allowedSlotValues.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-itemtype-candidate-audit-v1",
  source: {
    stringInspectionFile,
    sourceSearchAuditFile,
  },
  summary: {
    directFieldCandidates: directCandidates.length,
    strings: values.length,
    itemTypeStrings: itemTypeValues.length,
    allowedSlotLikeStrings: allowedSlotValues.length,
    techniqueItemTypeStrings: techniqueValues.length,
    promotionReady: false,
    assessment: {
      kind: isTechniqueItemTypeOnly
        ? "itemtype-technique-condition-not-aspect-slot-source"
        : allowedSlotValues.length > 0
          ? "itemtype-payload-has-slot-like-strings-needs-parser"
          : "itemtype-candidate-inconclusive",
      confidence: isTechniqueItemTypeOnly ? "high" : "medium",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: isTechniqueItemTypeOnly
        ? "Le meilleur candidat ItemType correspond a des conditions de technique/arme, pas a une table allowedSlots d'aspect."
        : allowedSlotValues.length > 0
          ? "Le payload contient des chaines proches de slots, mais un parser de champ reste necessaire."
          : "Le payload ne suffit pas a etablir une source de slot d'aspect.",
      nextAction: "Ne pas promouvoir ItemType comme allowedSlots; chercher une table aspect/equipement distincte ou inspecter d'autres familles de records.",
    },
  },
  itemTypeValues,
  allowedSlotValues,
  techniqueValues,
  directCandidates,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-itemtype-candidate.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
