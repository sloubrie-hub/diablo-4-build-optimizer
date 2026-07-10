const fs = require("fs");
const path = require("path");

const outDir = process.argv[2] ?? "outputs/diablo4-aspect-slot-blocker-conclusion";
const inputs = {
  sourceEvidence: process.argv[3] ?? "outputs/diablo4-aspect-slot-source-evidence/aspect-slot-source-evidence.json",
  externalBridge: process.argv[4] ?? "outputs/diablo4-aspect-slot-external-bridge/aspect-slot-external-bridge.json",
  tableSource: process.argv[5] ?? "outputs/diablo4-aspect-slot-table-source/aspect-slot-table-source.json",
  sourceSearch: process.argv[6] ?? "outputs/diablo4-aspect-slot-source-search-audit/aspect-slot-source-search-audit.json",
  itemTypeCandidate: process.argv[7] ?? "outputs/diablo4-aspect-slot-itemtype-candidate/aspect-slot-itemtype-candidate.json",
  prefixCandidates: process.argv[8] ?? "outputs/diablo4-aspect-slot-prefix-candidates/aspect-slot-prefix-candidates.json",
  binaryLayout: process.argv[9] ?? "outputs/diablo4-aspect-slot-binary-layout/aspect-slot-binary-layout.json",
  aspectEquipmentFieldSearch: process.argv[10] ?? "outputs/diablo4-aspect-equipment-field-search-audit/aspect-equipment-field-search-audit.json",
  aspectEquipmentSourceCandidates: process.argv[11] ?? "outputs/diablo4-aspect-equipment-source-candidate-audit/aspect-equipment-source-candidate-audit.json",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function row(id, report, metrics = {}) {
  const summary = report.summary ?? {};
  const assessment = summary.assessment ?? {};
  return {
    id,
    mode: report.mode ?? null,
    assessment: assessment.kind ?? null,
    confidence: assessment.confidence ?? "unknown",
    slotConstraintReady: assessment.slotConstraintReady === true,
    promotionReady: summary.promotionReady === true,
    finding: assessment.finding ?? null,
    nextAction: assessment.nextAction ?? null,
    metrics,
  };
}

const reports = {
  sourceEvidence: readJson(inputs.sourceEvidence),
  externalBridge: readJson(inputs.externalBridge),
  tableSource: readJson(inputs.tableSource),
  sourceSearch: readJson(inputs.sourceSearch),
  itemTypeCandidate: readJson(inputs.itemTypeCandidate),
  prefixCandidates: readJson(inputs.prefixCandidates),
  binaryLayout: readJson(inputs.binaryLayout),
  aspectEquipmentFieldSearch: readOptionalJson(inputs.aspectEquipmentFieldSearch),
  aspectEquipmentSourceCandidates: readOptionalJson(inputs.aspectEquipmentSourceCandidates),
};

const probes = [
  row("local-decoded-source", reports.sourceEvidence, {
    filesScanned: reports.sourceEvidence.summary?.filesScanned ?? 0,
    totalSlotTokenHits: reports.sourceEvidence.summary?.totalSlotTokenHits ?? 0,
  }),
  row("external-name-bridge", reports.externalBridge, {
    slotNameCandidates: reports.externalBridge.summary?.slotNameCandidates ?? 0,
    usableAllowedSlotProofs: reports.externalBridge.summary?.usableAllowedSlotProofs ?? 0,
    inferredSlots: reports.externalBridge.summary?.inferredSlots ?? [],
  }),
  row("json-table-source", reports.tableSource, {
    jsonFilesScanned: reports.tableSource.summary?.jsonFilesScanned ?? 0,
    directSourceProofs: reports.tableSource.summary?.directSourceProofs ?? 0,
  }),
  row("full-source-search", reports.sourceSearch, {
    sourceFiles: reports.sourceSearch.summary?.sourceFiles ?? 0,
    matchingEntries: reports.sourceSearch.summary?.matchingEntries ?? 0,
    directFieldCandidates: reports.sourceSearch.summary?.directFieldCandidates ?? 0,
    hasDirectAllowedSlotProof: reports.sourceSearch.summary?.hasDirectAllowedSlotProof === true,
  }),
  row("itemtype-candidate", reports.itemTypeCandidate, {
    itemTypeStrings: reports.itemTypeCandidate.summary?.itemTypeStrings ?? 0,
    allowedSlotLikeStrings: reports.itemTypeCandidate.summary?.allowedSlotLikeStrings ?? 0,
    techniqueItemTypeStrings: reports.itemTypeCandidate.summary?.techniqueItemTypeStrings ?? 0,
  }),
  row("slot-prefix-candidates", reports.prefixCandidates, {
    slotPrefixCandidates: reports.prefixCandidates.summary?.slotPrefixCandidates ?? 0,
    helmCandidates: reports.prefixCandidates.summary?.helmCandidates ?? 0,
    usableAllowedSlotProofs: reports.prefixCandidates.summary?.usableAllowedSlotProofs ?? 0,
  }),
  row("binary-layout-seed", reports.binaryLayout, {
    inspectedCandidates: reports.binaryLayout.summary?.inspectedCandidates ?? 0,
    matchedStrings: reports.binaryLayout.summary?.matchedStrings ?? 0,
    affixValueReferences: reports.binaryLayout.summary?.affixValueReferences ?? 0,
    directSlotFieldStrings: reports.binaryLayout.summary?.directSlotFieldStrings ?? 0,
  }),
  reports.aspectEquipmentFieldSearch ? row("aspect-equipment-field-search", reports.aspectEquipmentFieldSearch, {
    searchedFiles: reports.aspectEquipmentFieldSearch.summary?.searchedFiles ?? 0,
    matchingEntries: reports.aspectEquipmentFieldSearch.summary?.matchingEntries ?? 0,
    topMatchTarget: reports.aspectEquipmentFieldSearch.summary?.topMatchTarget ?? null,
    directSlotFieldStrings: reports.aspectEquipmentFieldSearch.summary?.directSlotFieldStrings ?? 0,
    uiLikeScore: reports.aspectEquipmentFieldSearch.summary?.uiLikeScore ?? 0,
  }) : null,
  reports.aspectEquipmentSourceCandidates ? row("aspect-equipment-source-candidates", reports.aspectEquipmentSourceCandidates, {
    searchedFiles: reports.aspectEquipmentSourceCandidates.summary?.searchedFiles ?? 0,
    targetTerms: reports.aspectEquipmentSourceCandidates.summary?.targetTerms ?? 0,
    matchingEntries: reports.aspectEquipmentSourceCandidates.summary?.matchingEntries ?? 0,
    sourceCandidates: reports.aspectEquipmentSourceCandidates.summary?.sourceCandidates ?? 0,
    directSlotCandidates: reports.aspectEquipmentSourceCandidates.summary?.directSlotCandidates ?? 0,
  }) : null,
].filter(Boolean);

const readyProbes = probes.filter((probe) => probe.slotConstraintReady || probe.promotionReady);
const usableProofSignals = [
  reports.sourceEvidence.summary?.totalSlotTokenHits > 0,
  reports.externalBridge.summary?.usableAllowedSlotProofs > 0,
  reports.tableSource.summary?.directSourceProofs > 0,
  reports.sourceSearch.summary?.hasDirectAllowedSlotProof === true,
  reports.itemTypeCandidate.summary?.allowedSlotLikeStrings > 0,
  reports.prefixCandidates.summary?.usableAllowedSlotProofs > 0,
  reports.binaryLayout.summary?.directSlotFieldStrings > 0,
  reports.aspectEquipmentFieldSearch?.summary?.sourceProofReady === true,
  reports.aspectEquipmentSourceCandidates?.summary?.sourceProofReady === true,
].filter(Boolean).length;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-blocker-conclusion-v1",
  source: inputs,
  summary: {
    probes: probes.length,
    readyProbes: readyProbes.length,
    usableProofSignals,
    existingEvidenceExhausted: readyProbes.length === 0 && usableProofSignals === 0,
    slotConstraintReady: false,
    promotionReady: false,
    blocker: "slot-data-not-normalized",
    assessment: {
      kind: "aspect-slot-existing-evidence-exhausted",
      confidence: "high",
      finding: "Les artefacts existants ne contiennent aucune preuve allowedSlots pour 1461593; les pistes locale, externe, table JSON, ItemType, prefixes, layouts binaires seed, Codex UI et noms de champs source aspect-equipement sont non promouvables.",
      nextAction: "Chercher une autre famille de records binaires ou obtenir une source externe fiable de slots avant toute promotion.",
    },
  },
  probes,
  safeguards: [
    "Ne pas convertir le nom Helm_Unique_Necro_100 en allowedSlots.",
    "Ne pas utiliser ItemType comme slot d'aspect: le candidat audite concerne arme/technique.",
    "Ne pas utiliser les prefixes Helm_/Boots_/Ring_ comme preuve: ils sont nominatifs.",
    "Ne pas utiliser les records Affix_Value comme preuve de slot: le layout binaire seed ne montre aucun champ direct allowedSlots.",
    "Ne pas utiliser CodexOfPower comme preuve: l'asset trouve est une surface UI/localisation, pas une source aspect-equipement.",
    "Ne pas supposer des noms de champs source absents: le scan cible Allowed/Imprint/Extract/PowerRecord ne trouve aucun candidat.",
    "Garder necromancer bloque tant que le champ source allowedSlots n'est pas prouve.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-blocker-conclusion.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
