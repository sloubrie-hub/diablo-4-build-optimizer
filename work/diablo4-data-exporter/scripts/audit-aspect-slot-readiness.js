const fs = require("fs");
const path = require("path");

const targetDatasetFile = process.argv[2] ?? "outputs/diablo4-target-dataset/target-dataset.json";
const optimizerDatasetFile = process.argv[3] ?? "outputs/diablo4-optimizer-dataset/optimizer-dataset.json";
const outDir = process.argv[4] ?? "outputs/diablo4-aspect-slot-readiness";
const sourceEvidenceFile = process.argv[5] ?? null;
const externalBridgeFile = process.argv[6] ?? null;
const tableSourceFile = process.argv[7] ?? null;
const prefixCandidatesFile = process.argv[8] ?? null;
const blockerConclusionFile = process.argv[9] ?? null;

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function normalizeClass(className) {
  return String(className ?? "unknown").trim().toLowerCase() || "unknown";
}

function knownSlotTokens(asset) {
  const text = [
    asset?.name,
    asset?.label,
    ...(asset?.tags ?? []),
    ...(asset?.formulas?.damage ?? []).map((formula) => formula.expression),
    ...(asset?.formulas?.support ?? []).map((formula) => formula.expression),
  ].filter(Boolean).join(" ");
  const patterns = [
    ["helm", /\b(helm|helmet|head)\b/i],
    ["chest", /\b(chest|torso)\b/i],
    ["gloves", /\b(gloves|hands)\b/i],
    ["pants", /\b(pants|legs)\b/i],
    ["boots", /\b(boots|feet)\b/i],
    ["amulet", /\b(amulet|neck)\b/i],
    ["ring", /\b(ring)\b/i],
    ["weapon", /\b(weapon|sword|axe|mace|bow|staff|wand|dagger|polearm|scythe)\b/i],
    ["offhand", /\b(offhand|focus|totem|shield)\b/i],
  ];
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([slot]) => slot);
}

function aspectAssessment(aspect, optimizerAsset, sourceEvidence, externalBridge, tableSource, prefixCandidates, blockerConclusion) {
  const allowedSlots = aspect.allowedSlots ?? [];
  const tokenSlots = knownSlotTokens({ ...optimizerAsset, name: aspect.name });
  const sourceAssessment = sourceEvidence?.summary?.assessment ?? null;
  const externalAssessment = externalBridge?.summary?.assessment ?? null;
  const externalInferredSlots = externalBridge?.summary?.inferredSlots ?? [];
  const tableAssessment = tableSource?.summary?.assessment ?? null;
  const prefixAssessment = prefixCandidates?.summary?.assessment ?? null;
  const blockerConclusionAssessment = blockerConclusion?.summary?.assessment ?? null;
  const hasProvenSlots = allowedSlots.length > 0;
  const hasTokenSlots = tokenSlots.length > 0;
  return {
    assetId: aspect.assetId,
    entityId: aspect.id,
    name: aspect.name,
    class: normalizeClass(aspect.class),
    currentAllowedSlots: allowedSlots,
    detectedSlotTokens: tokenSlots,
    sourceTags: optimizerAsset?.tags ?? [],
    evidence: {
      targetDatasetField: "entities.aspects[].allowedSlots",
      optimizerDatasetAssetFound: Boolean(optimizerAsset),
      sourceFile: optimizerAsset?.source?.fileName ?? aspect.evidence?.file ?? null,
      sourceOffset: optimizerAsset?.source?.blteOffset ?? aspect.evidence?.offset ?? null,
      sourceEvidenceMode: sourceEvidence?.mode ?? null,
      sourceEvidenceAssessment: sourceAssessment?.kind ?? null,
      sourceEvidenceSlotTokenHits: sourceEvidence?.summary?.totalSlotTokenHits ?? null,
      externalBridgeMode: externalBridge?.mode ?? null,
      externalBridgeAssessment: externalAssessment?.kind ?? null,
      externalInferredSlots,
      externalUsableAllowedSlotProofs: externalBridge?.summary?.usableAllowedSlotProofs ?? null,
      tableSourceMode: tableSource?.mode ?? null,
      tableSourceAssessment: tableAssessment?.kind ?? null,
      tableSourceDirectProofs: tableSource?.summary?.directSourceProofs ?? null,
      prefixCandidatesMode: prefixCandidates?.mode ?? null,
      prefixCandidatesAssessment: prefixAssessment?.kind ?? null,
      prefixCandidatesUsableProofs: prefixCandidates?.summary?.usableAllowedSlotProofs ?? null,
      prefixCandidatesHelmCandidates: prefixCandidates?.summary?.helmCandidates ?? null,
      blockerConclusionMode: blockerConclusion?.mode ?? null,
      blockerConclusionAssessment: blockerConclusionAssessment?.kind ?? null,
      existingEvidenceExhausted: blockerConclusion?.summary?.existingEvidenceExhausted === true,
      blockerConclusionUsableProofSignals: blockerConclusion?.summary?.usableProofSignals ?? null,
    },
    assessment: {
      kind: hasProvenSlots
        ? "aspect-slots-normalized"
        : hasTokenSlots
          ? "aspect-slot-token-needs-parser-confirmation"
          : "aspect-slots-not-found",
      confidence: hasProvenSlots ? "high" : hasTokenSlots ? "medium" : "medium-high",
      slotConstraintReady: hasProvenSlots,
      promotionReady: hasProvenSlots,
      blocker: hasProvenSlots ? null : "slot-data-not-normalized",
      finding: hasProvenSlots
        ? "Les slots autorises sont deja presents dans le dataset cible."
        : hasTokenSlots
          ? "Des tokens de slot existent dans les textes disponibles, mais ils doivent etre confirmes par un parser de champ avant contrainte fiable."
          : blockerConclusionAssessment?.kind === "aspect-slot-existing-evidence-exhausted"
            ? "Les preuves existantes sont epuisees pour 1461593: source locale, pont externe, tables JSON, ItemType et prefixes ne prouvent pas allowedSlots."
          : externalAssessment?.kind === "external-slot-name-only-not-proof" && prefixAssessment?.kind === "slot-prefix-candidates-name-only"
            ? "Un nom externe suggere un slot, mais les prefixes de slots audites sont seulement des noms d'affixes/uniques; aucune preuve allowedSlots n'est disponible."
          : externalAssessment?.kind === "external-slot-name-only-not-proof"
            ? "Un nom externe suggere un slot, mais aucune preuve allowedSlots n'est disponible dans les sources auditees."
          : prefixAssessment?.kind === "slot-prefix-candidates-name-only"
            ? "Les prefixes de slots trouves dans le scan source sont des noms d'affixes/uniques, pas des preuves allowedSlots."
          : tableAssessment?.kind === "aspect-slot-table-source-not-found"
            ? "Aucune table ou champ source de slot d'aspect n'est disponible dans les sorties auditees."
          : sourceAssessment?.kind === "slot-token-not-found-in-decoded-source"
            ? "Aucun slot equipement explicite n'est disponible dans les donnees normalisees ni dans les payloads source locaux scannes."
            : "Aucun slot equipement explicite n'est disponible dans les tags, labels ou formules normalises.",
      nextAction: hasProvenSlots
        ? "Utiliser ces slots dans le solveur de conflits d'equipement."
        : "Chercher les champs de slot dans les records source ou une table d'aspects avant de contraindre l'equipement.",
    },
  };
}

const targetDataset = readJsonIfExists(targetDatasetFile);
const optimizerDataset = readJsonIfExists(optimizerDatasetFile);
const sourceEvidence = readJsonIfExists(sourceEvidenceFile);
const externalBridge = readJsonIfExists(externalBridgeFile);
const tableSource = readJsonIfExists(tableSourceFile);
const prefixCandidates = readJsonIfExists(prefixCandidatesFile);
const blockerConclusion = readJsonIfExists(blockerConclusionFile);

if (!targetDataset) throw new Error(`Missing target dataset: ${targetDatasetFile}`);

const optimizerAssetsById = new Map((optimizerDataset?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
const aspects = targetDataset.entities?.aspects ?? [];
const rows = aspects.map((aspect) => aspectAssessment(
  aspect,
  optimizerAssetsById.get(String(aspect.assetId)),
  sourceEvidence,
  externalBridge,
  tableSource,
  prefixCandidates,
  blockerConclusion,
));
const blocked = rows.filter((row) => !row.assessment.slotConstraintReady);
const tokenCandidates = rows.filter((row) => row.assessment.kind === "aspect-slot-token-needs-parser-confirmation");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-readiness-v1",
  source: {
    targetDataset: targetDatasetFile,
    optimizerDataset: optimizerDatasetFile,
    sourceEvidence: sourceEvidenceFile,
    externalBridge: externalBridgeFile,
    tableSource: tableSourceFile,
    prefixCandidates: prefixCandidatesFile,
    blockerConclusion: blockerConclusionFile,
  },
  summary: {
    aspects: rows.length,
    normalized: rows.filter((row) => row.assessment.kind === "aspect-slots-normalized").length,
    blocked: blocked.length,
    tokenCandidates: tokenCandidates.length,
    promotionReady: blocked.length === 0,
    blockerCounts: {
      "slot-data-not-normalized": blocked.length,
    },
    nextActions: blocked.length
      ? ["chercher les champs de slot dans les records source ou une table d'aspects"]
      : ["brancher les slots normalises au solveur de conflits d'equipement"],
  },
  aspects: rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-readiness.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
