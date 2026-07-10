const fs = require("fs");
const path = require("path");

const parserSeedFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json";
const binaryLayoutFile = process.argv[3] ?? "outputs/diablo4-aspect-slot-binary-layout/aspect-slot-binary-layout.json";
const blockerConclusionFile = process.argv[4] ?? "outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json";
const equipmentFieldSearchFile = process.argv[5] ?? "outputs/diablo4-aspect-equipment-field-search-audit/aspect-equipment-field-search-audit.json";
const readinessFile = process.argv[6] ?? "outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json";
const outDir = process.argv[7] ?? "outputs/diablo4-aspect-slot-next-source-plan";
const equipmentSourceCandidateFile = process.argv[8] ?? "outputs/diablo4-aspect-equipment-source-candidate-audit/aspect-equipment-source-candidate-audit.json";
const structuralFamilyFile = process.argv[9] ?? "outputs/diablo4-aspect-slot-structural-family/aspect-slot-structural-family.json";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

const parserSeed = readJson(parserSeedFile);
const binaryLayout = readJson(binaryLayoutFile);
const blockerConclusion = readJson(blockerConclusionFile);
const equipmentFieldSearch = readJson(equipmentFieldSearchFile);
const readiness = readJson(readinessFile);
const equipmentSourceCandidate = readOptionalJson(equipmentSourceCandidateFile);
const structuralFamily = readOptionalJson(structuralFamilyFile);

const targetAspect = readiness.aspects?.find((aspect) => Number(aspect.assetId) === 1461593) ?? readiness.aspects?.[0] ?? {};
const parserSummary = parserSeed.summary ?? {};
const layoutSummary = binaryLayout.summary ?? {};
const blockerSummary = blockerConclusion.summary ?? {};
const equipmentSummary = equipmentFieldSearch.summary ?? {};
const sourceCandidateSummary = equipmentSourceCandidate?.summary ?? {};
const structuralSummary = structuralFamily?.summary ?? {};

const steps = [
  {
    id: "slot-next-step-01-source-table",
    title: "Chercher une table aspect-equipement non localisation",
    family: "source-table",
    priority: "high",
    status: "blocked",
    blocker: "aspect-equipment-source-table-missing",
    evidence: {
      codexSearchAssessment: equipmentSummary.assessment?.kind ?? null,
      codexTopMatch: equipmentSummary.topMatchTarget ?? null,
      directSlotFieldStrings: equipmentSummary.directSlotFieldStrings ?? 0,
      uiLikeScore: equipmentSummary.uiLikeScore ?? null,
      sourceCandidateAssessment: sourceCandidateSummary.assessment?.kind ?? null,
      sourceCandidateTerms: sourceCandidateSummary.targetTerms ?? null,
      sourceCandidateMatches: sourceCandidateSummary.matchingEntries ?? null,
      sourceCandidates: sourceCandidateSummary.sourceCandidates ?? null,
      directSlotCandidates: sourceCandidateSummary.directSlotCandidates ?? null,
    },
    nextAction: sourceCandidateSummary.matchingEntries === 0
      ? "Changer de strategie: les noms de champs source explicites sont absents; chercher une famille binaire par structure ou source externe fiable."
      : "Decoder les meilleurs candidats source avant de remplir allowedSlots.",
  },
  {
    id: "slot-next-step-02-binary-field-parser",
    title: "Isoler un champ binaire direct de slot",
    family: "binary-field-parser",
    priority: "high",
    status: "blocked",
    blocker: "direct-slot-field-missing",
    evidence: {
      localCandidatesDecoded: parserSummary.decodedCandidates ?? 0,
      localCandidatesMissing: parserSummary.missingDecode ?? 0,
      allCandidatesDecoded: parserSummary.allCandidatesDecoded === true,
      layoutAssessment: layoutSummary.assessment?.kind ?? null,
      directSlotFieldStrings: layoutSummary.directSlotFieldStrings ?? 0,
      affixValueReferences: layoutSummary.affixValueReferences ?? 0,
      structuralAssessment: structuralSummary.assessment?.kind ?? null,
      structuralSamples: structuralSummary.samples ?? null,
      structuralGroups: structuralSummary.groups ?? null,
      strongStructuralCandidates: structuralSummary.strongStructuralCandidates ?? null,
    },
    nextAction: structuralSummary.strongStructuralCandidates === 0
      ? "Abandonner les discriminateurs fixes sur ce corpus; chercher une autre famille de records binaires ou une source externe fiable."
      : "Elargir le corpus autour des offsets structurels candidats avant toute promotion.",
  },
  {
    id: "slot-next-step-03-external-reference",
    title: "Obtenir une reference externe verifiee des slots",
    family: "external-reference",
    priority: "medium",
    status: "blocked",
    blocker: "external-slot-source-not-provided",
    evidence: {
      externalInferredSlots: targetAspect.evidence?.externalInferredSlots ?? [],
      externalUsableAllowedSlotProofs: targetAspect.evidence?.externalUsableAllowedSlotProofs ?? 0,
      externalBridgeAssessment: targetAspect.evidence?.externalBridgeAssessment ?? null,
    },
    nextAction: "Accepter seulement une source qui donne explicitement allowedSlots/equipment slots pour l'aspect, pas un nom d'affixe.",
  },
  {
    id: "slot-next-step-04-target-dataset-normalization",
    title: "Normaliser allowedSlots dans le dataset cible",
    family: "target-dataset",
    priority: "high",
    status: "blocked",
    blocker: "allowedSlots-empty",
    evidence: {
      currentAllowedSlots: targetAspect.currentAllowedSlots ?? [],
      readinessAssessment: targetAspect.assessment?.kind ?? null,
      blocker: targetAspect.assessment?.blocker ?? null,
    },
    nextAction: "Remplir allowedSlots uniquement apres preuve source; tant que vide, garder le plan necromancer bloque.",
  },
];

const blockedSteps = steps.filter((step) => step.status === "blocked").length;
const readySteps = steps.filter((step) => step.status === "ready").length;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-next-source-plan-v1",
  source: {
    parserSeedFile,
    binaryLayoutFile,
    blockerConclusionFile,
    equipmentFieldSearchFile,
    equipmentSourceCandidateFile: equipmentSourceCandidate ? equipmentSourceCandidateFile : null,
    structuralFamilyFile: structuralFamily ? structuralFamilyFile : null,
    readinessFile,
  },
  target: {
    assetId: Number(targetAspect.assetId ?? 1461593),
    entityId: targetAspect.entityId ?? "aspect:1461593",
    class: targetAspect.class ?? "necromancer",
  },
  summary: {
    steps: steps.length,
    blockedSteps,
    readySteps,
    nextStepId: steps[0].id,
    nextStepTitle: steps[0].title,
    localCandidatesDecoded: parserSummary.decodedCandidates ?? 0,
    localCandidatesMissing: parserSummary.missingDecode ?? 0,
    directSlotFieldStrings: layoutSummary.directSlotFieldStrings ?? 0,
    usableProofSignals: blockerSummary.usableProofSignals ?? 0,
    sourceCandidateMatches: sourceCandidateSummary.matchingEntries ?? null,
    strongStructuralCandidates: structuralSummary.strongStructuralCandidates ?? null,
    existingEvidenceExhausted: blockerSummary.existingEvidenceExhausted === true,
    promotionReady: false,
    assessment: {
      kind: "aspect-slot-next-source-plan-blocked-local-exhausted",
      confidence: "high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: "Les sources locales, noms, prefixes, ItemType, Affix_Value, Codex UI, noms de champs source explicites et discriminateurs structurels sont epuisees ou non promouvables pour 1461593.",
      nextAction: "Chercher une famille binaire par structure ou obtenir une source externe fiable avant de remplir allowedSlots.",
    },
  },
  steps,
  safeguards: [
    "Ne pas promouvoir les prefixes Helm_/Ring_/2H comme slots autorises.",
    "Ne pas promouvoir CodexOfPower, CanBeImbued ou Gegenstandstypen: ce sont des signaux UI/localisation.",
    "Ne pas inventer de champ Allowed/Imprint/Extract: le scan cible ne trouve aucun hit.",
    "Ne pas convertir un offset structurel en slot: aucun discriminateur stable promouvable n'a ete trouve.",
    "Ne pas promouvoir Affix_Value ou Static Value comme preuve d'equipement.",
    "Garder allowedSlots vide tant qu'aucun champ direct ou source externe fiable n'est prouve.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-next-source-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
