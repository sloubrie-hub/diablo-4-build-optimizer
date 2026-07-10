const fs = require("fs");
const path = require("path");

const parserSeedFile = process.argv[2] ?? "outputs/diablo4-aspect-slot-binary-parser-seed/aspect-slot-binary-parser-seed.json";
const binaryLayoutFile = process.argv[3] ?? "outputs/diablo4-aspect-slot-binary-layout/aspect-slot-binary-layout.json";
const blockerConclusionFile = process.argv[4] ?? "outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json";
const equipmentFieldSearchFile = process.argv[5] ?? "outputs/diablo4-aspect-equipment-field-search-audit/aspect-equipment-field-search-audit.json";
const readinessFile = process.argv[6] ?? "outputs/diablo4-aspect-slot-readiness/aspect-slot-readiness.json";
const outDir = process.argv[7] ?? "outputs/diablo4-aspect-slot-next-source-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const parserSeed = readJson(parserSeedFile);
const binaryLayout = readJson(binaryLayoutFile);
const blockerConclusion = readJson(blockerConclusionFile);
const equipmentFieldSearch = readJson(equipmentFieldSearchFile);
const readiness = readJson(readinessFile);

const targetAspect = readiness.aspects?.find((aspect) => Number(aspect.assetId) === 1461593) ?? readiness.aspects?.[0] ?? {};
const parserSummary = parserSeed.summary ?? {};
const layoutSummary = binaryLayout.summary ?? {};
const blockerSummary = blockerConclusion.summary ?? {};
const equipmentSummary = equipmentFieldSearch.summary ?? {};

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
    },
    nextAction: "Chercher un asset/table non UI qui relie aspect power, categories d'equipement et slots autorises.",
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
    },
    nextAction: "Ne plus parser les seuls records Affix_Value comme slot; chercher le record proprietaire qui porte l'equipement autorise.",
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
    existingEvidenceExhausted: blockerSummary.existingEvidenceExhausted === true,
    promotionReady: false,
    assessment: {
      kind: "aspect-slot-next-source-plan-blocked-local-exhausted",
      confidence: "high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: "Les sources locales, noms, prefixes, ItemType, Affix_Value et Codex UI sont epuisees ou non promouvables pour 1461593.",
      nextAction: "Chercher une table aspect-equipement non localisation ou un champ binaire direct avant de remplir allowedSlots.",
    },
  },
  steps,
  safeguards: [
    "Ne pas promouvoir les prefixes Helm_/Ring_/2H comme slots autorises.",
    "Ne pas promouvoir CodexOfPower, CanBeImbued ou Gegenstandstypen: ce sont des signaux UI/localisation.",
    "Ne pas promouvoir Affix_Value ou Static Value comme preuve d'equipement.",
    "Garder allowedSlots vide tant qu'aucun champ direct ou source externe fiable n'est prouve.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-next-source-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
