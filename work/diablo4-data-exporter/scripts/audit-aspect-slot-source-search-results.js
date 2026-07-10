const fs = require("fs");
const path = require("path");

const mergedSearchFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-source-search-plan/slot-source-search-merged/external-target-search-merged.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-slot-source-search-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function groupKind(key) {
  if (/^(allowedSlots|AllowedSlots|Allowed_Slots|AllowedSlot|Allowed_Slot|equipmentSlot|EquipmentSlot|Equipment_Slot|EquipSlot|Equip_Slot|slotMask|SlotMask|ItemType|Item_Type|itemType|ItemEquipLocation|EquipLocation)$/i.test(key)) {
    return "direct-field-name";
  }
  if (/^(AspectEquipment|Aspect_Equipment|LegendaryPower|Legendary_Power|UniquePower|Unique_Power|CodexPower|Codex_Power|PowerAspect)$/i.test(key)) {
    return "aspect-equipment-table-name";
  }
  if (/^(Helm_|Chest_|Gloves_|Pants_|Boots_|Amulet_|Ring_|Weapon_|Offhand_|1HShield_|2H)$/i.test(key)) {
    return "slot-prefix-name";
  }
  if (/^(Helm_Unique_Necro_100|Affix_Flat_Value_1#Helm_Unique_Necro_100|legendary_necro_012|Affix_Value_1#legendary_necro_012|Necromancer_Talent_Caster_T3_N1)$/i.test(key)) {
    return "known-lead";
  }
  if (/^(Aspect|Legendary|Unique)$/i.test(key)) return "generic-noise";
  return "other";
}

function priorityForKind(kind) {
  if (kind === "direct-field-name" || kind === "aspect-equipment-table-name") return "high";
  if (kind === "slot-prefix-name" || kind === "known-lead") return "medium";
  return "low";
}

function scoreCandidate(asset, groupKey, kind) {
  let score = Number(asset.score || 0);
  if (kind === "direct-field-name") score += 100;
  if (kind === "aspect-equipment-table-name") score += 80;
  if (kind === "slot-prefix-name") score += 40;
  if (kind === "known-lead") score += 30;
  const sample = (asset.sampleValues ?? []).join(" ");
  if (/Affix\.|Affix_Value|#/.test(sample)) score += 20;
  if (/allowed|equip|itemtype|slot/i.test(sample)) score += 40;
  if (/^\{c_|icon:/i.test(sample)) score -= 40;
  return score;
}

function rowFromAsset(groupKey, kind, asset) {
  return {
    assetId: asset.assetId,
    fileName: asset.source?.fileName ?? null,
    blteOffset: asset.source?.blteOffset ?? null,
    groupKey,
    kind,
    priority: priorityForKind(kind),
    score: scoreCandidate(asset, groupKey, kind),
    sourceScore: asset.score ?? 0,
    confidence: asset.confidence ?? "unknown",
    sampleValues: asset.sampleValues ?? [],
    recommendation: recommendationFor(kind, asset),
  };
}

function recommendationFor(kind, asset) {
  const sample = (asset.sampleValues ?? []).join(" ");
  if (kind === "direct-field-name") {
    return /itemtype/i.test(sample)
      ? "inspecter ce payload pour voir si ItemType est un champ equipement ou seulement un texte UI"
      : "inspecter ce payload en priorite comme possible champ de slot";
  }
  if (kind === "aspect-equipment-table-name") return "inspecter comme candidat de table aspect/equipement";
  if (kind === "slot-prefix-name") return "inspecter comme candidat de nommage slot, sans promotion allowedSlots";
  if (kind === "known-lead") return "garder comme piste liee a 1461593, sans preuve directe de slot";
  return "ignorer sauf si croise avec un champ direct de slot";
}

const merged = readJson(mergedSearchFile);
const groups = merged.groups ?? {};
const groupRows = Object.entries(groups).map(([key, group]) => ({
  key,
  kind: groupKind(key),
  priority: priorityForKind(groupKind(key)),
  hits: group.hits ?? 0,
  assets: (group.assets ?? []).length,
}));

const candidates = Object.entries(groups).flatMap(([key, group]) => {
  const kind = groupKind(key);
  return (group.assets ?? []).map((asset) => rowFromAsset(key, kind, asset));
});

const actionableCandidates = candidates
  .filter((row) => row.priority !== "low")
  .sort((a, b) => b.score - a.score || String(a.assetId).localeCompare(String(b.assetId)));
const directFieldCandidates = actionableCandidates.filter((row) => row.kind === "direct-field-name");
const tableCandidates = actionableCandidates.filter((row) => row.kind === "aspect-equipment-table-name");
const slotPrefixCandidates = actionableCandidates.filter((row) => row.kind === "slot-prefix-name");
const knownLeadCandidates = actionableCandidates.filter((row) => row.kind === "known-lead");

const hasDirectAllowedSlotProof = directFieldCandidates.some((row) => /allowed|equip.*slot|slotmask/i.test(row.groupKey));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-source-search-results-audit-v1",
  source: {
    mergedSearchFile,
    mergedAt: merged.mergedAt ?? null,
  },
  summary: {
    sourceFiles: merged.summary?.files ?? 0,
    decodedDeadbeefEntries: merged.summary?.decodedDeadbeefEntries ?? 0,
    matchingEntries: merged.summary?.matchingEntries ?? 0,
    targetGroupsMatched: merged.summary?.targetGroupsMatched ?? 0,
    groups: groupRows.length,
    actionableCandidates: actionableCandidates.length,
    directFieldCandidates: directFieldCandidates.length,
    tableCandidates: tableCandidates.length,
    slotPrefixCandidates: slotPrefixCandidates.length,
    knownLeadCandidates: knownLeadCandidates.length,
    hasDirectAllowedSlotProof,
    promotionReady: false,
    assessment: {
      kind: hasDirectAllowedSlotProof
        ? "direct-slot-field-candidate-needs-payload-inspection"
        : directFieldCandidates.length > 0
          ? "itemtype-candidates-need-payload-inspection"
          : "slot-source-search-has-name-candidates-only",
      confidence: "medium-high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: hasDirectAllowedSlotProof
        ? "Le scan a trouve un candidat de champ slot direct, mais il doit etre inspecte avant promotion."
        : directFieldCandidates.length > 0
          ? "Le scan a trouve des candidats ItemType, mais aucune preuve directe allowedSlots/equipmentSlot."
          : "Le scan contient seulement des noms de slots ou des pistes generiques, pas de champ source promouvable.",
      nextAction: directFieldCandidates.length > 0
        ? "Decoder/inspecter les meilleurs candidats ItemType avant de modifier allowedSlots."
        : "Elargir les termes ou chercher une autre famille de records equipement/aspect.",
    },
  },
  groups: groupRows,
  topActionableCandidates: actionableCandidates.slice(0, 40),
  directFieldCandidates: directFieldCandidates.slice(0, 40),
  slotPrefixCandidates: slotPrefixCandidates.slice(0, 40),
  knownLeadCandidates: knownLeadCandidates.slice(0, 40),
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-source-search-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
