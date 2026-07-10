const fs = require("fs");
const path = require("path");

const sourceSearchAuditFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-source-search-audit/aspect-slot-source-search-audit.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-prefix-candidates";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inferSlotFromGroup(groupKey) {
  const key = String(groupKey ?? "").toLowerCase();
  if (key.startsWith("helm")) return "helm";
  if (key.startsWith("chest")) return "chest";
  if (key.startsWith("gloves")) return "gloves";
  if (key.startsWith("pants")) return "pants";
  if (key.startsWith("boots")) return "boots";
  if (key.startsWith("amulet")) return "amulet";
  if (key.startsWith("ring")) return "ring";
  if (key.startsWith("weapon") || key === "2h") return "weapon";
  if (key.startsWith("offhand") || key.startsWith("1hshield")) return "offhand";
  return null;
}

function classifySamples(sampleValues) {
  const joined = (sampleValues ?? []).join("\n");
  const hasAffixValue = /Affix(_|\.|_Value)|Static Value|#/.test(joined);
  const hasDirectSlotField = /allowedSlots|equipmentSlot|EquipSlot|slotMask|ItemEquipLocation|EquipLocation/i.test(joined);
  const hasAspectTableSignal = /AspectEquipment|LegendaryPower|CodexPower|PowerAspect|allowed/i.test(joined);
  const hasActiveWeaponState = /Active_Weapon_Slot/i.test(joined);
  return {
    hasAffixValue,
    hasDirectSlotField,
    hasAspectTableSignal,
    hasActiveWeaponState,
    usableAsAllowedSlotsProof: hasDirectSlotField || hasAspectTableSignal,
  };
}

function classifyCandidate(candidate) {
  const sampleClass = classifySamples(candidate.sampleValues);
  const inferredSlot = inferSlotFromGroup(candidate.groupKey);
  return {
    assetId: candidate.assetId,
    fileName: candidate.fileName,
    blteOffset: candidate.blteOffset,
    groupKey: candidate.groupKey,
    inferredSlot,
    score: candidate.score,
    sourceScore: candidate.sourceScore,
    sampleValues: candidate.sampleValues ?? [],
    classification: sampleClass,
    assessment: sampleClass.usableAsAllowedSlotsProof
      ? "slot-prefix-has-direct-field-signal"
      : sampleClass.hasActiveWeaponState
        ? "slot-prefix-active-weapon-state-not-aspect-slot"
        : sampleClass.hasAffixValue
          ? "slot-prefix-affix-name-only"
          : "slot-prefix-name-only",
  };
}

const sourceSearchAudit = readJson(sourceSearchAuditFile);
const candidates = (sourceSearchAudit.slotPrefixCandidates ?? []).map(classifyCandidate);
const usable = candidates.filter((candidate) => candidate.classification.usableAsAllowedSlotsProof);
const nameOnly = candidates.filter((candidate) => !candidate.classification.usableAsAllowedSlotsProof);
const helmCandidates = candidates.filter((candidate) => candidate.inferredSlot === "helm");
const bySlot = Array.from(candidates.reduce((map, candidate) => {
  const key = candidate.inferredSlot ?? "unknown";
  if (!map.has(key)) map.set(key, { slot: key, candidates: 0, usableProofs: 0, assetIds: new Set() });
  const row = map.get(key);
  row.candidates += 1;
  if (candidate.classification.usableAsAllowedSlotsProof) row.usableProofs += 1;
  row.assetIds.add(candidate.assetId);
  return map;
}, new Map()).values()).map((row) => ({
  slot: row.slot,
  candidates: row.candidates,
  usableProofs: row.usableProofs,
  assets: row.assetIds.size,
}));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-prefix-candidates-audit-v1",
  source: {
    sourceSearchAuditFile,
    sourceSearchAssessment: sourceSearchAudit.summary?.assessment?.kind ?? null,
  },
  summary: {
    slotPrefixCandidates: candidates.length,
    slotsMentioned: bySlot.length,
    usableAllowedSlotProofs: usable.length,
    nameOnlyCandidates: nameOnly.length,
    helmCandidates: helmCandidates.length,
    promotionReady: false,
    assessment: {
      kind: usable.length
        ? "slot-prefix-direct-field-signal-needs-inspection"
        : "slot-prefix-candidates-name-only",
      confidence: "high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: usable.length
        ? "Certains candidats de prefixe portent un signal de champ direct, mais doivent etre inspectes avant promotion."
        : "Les candidats de prefixe de slot sont des noms d'affixes/uniques ou d'etat d'arme, pas des preuves allowedSlots.",
      nextAction: usable.length
        ? "Decoder les candidats avec signal direct avant de modifier allowedSlots."
        : "Clore la piste des prefixes de nom et chercher une table/champ source aspect-equipement distinct.",
    },
  },
  bySlot,
  candidates: candidates.slice(0, 80),
  helmCandidates,
  usableCandidates: usable,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-prefix-candidates.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
