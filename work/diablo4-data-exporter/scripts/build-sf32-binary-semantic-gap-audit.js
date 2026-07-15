const fs = require("fs");
const path = require("path");

const inputs = {
  binaryVerification: process.argv[2] ?? "outputs/diablo4-selector-asset-record-binary-verification/selector-asset-record-binary-verification.json",
  sf32SourceHuntPlan: process.argv[3] ?? "outputs/diablo4-sf32-owner-source-hunt-plan/sf32-owner-source-hunt-plan.json",
  outDir: process.argv[4] ?? "outputs/diablo4-sf32-binary-semantic-gap-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const binaryVerification = readJson(inputs.binaryVerification);
const sourceHuntPlan = readJson(inputs.sf32SourceHuntPlan);

const target = (binaryVerification.verifications ?? []).find((record) =>
  Number(record.assetRef) === 1663210 &&
  Number(record.selector) === 949 &&
  record.layoutId === "compact-metadata-scale-layout"
);

function targetField(role) {
  return target?.fields?.find((field) => field.role === role) ?? null;
}

const validatedStructure = [
  {
    id: "binary-selector",
    status: binaryVerification.summary?.targetSelectorU32 === 949 ? "passed" : "failed",
    value: binaryVerification.summary?.targetSelectorU32 ?? null,
    meaning: "selecteur local confirme",
  },
  {
    id: "binary-asset-ref",
    status: binaryVerification.summary?.targetAssetRefU32 === 1663210 ? "passed" : "failed",
    value: binaryVerification.summary?.targetAssetRefU32 ?? null,
    meaning: "assetRef cible confirme",
  },
  {
    id: "binary-metadata-id",
    status: binaryVerification.summary?.targetMetadataIdU32 === 12337 ? "passed" : "failed",
    value: binaryVerification.summary?.targetMetadataIdU32 ?? null,
    meaning: "metadataId local confirme",
  },
  {
    id: "binary-opcode",
    status: binaryVerification.summary?.targetOpcodeU32 === 6 ? "passed" : "failed",
    value: binaryVerification.summary?.targetOpcodeU32 ?? null,
    meaning: "opcode local confirme",
  },
  {
    id: "binary-scale",
    status: binaryVerification.summary?.targetScaleF32 === 10 ? "passed" : "failed",
    value: binaryVerification.summary?.targetScaleF32 ?? null,
    meaning: "scale locale confirmee en f32",
  },
];

const semanticRequirements = [
  {
    id: "named-sf32-owner-field",
    status: "missing",
    requiredEvidence: "source nommee ou parser champ-par-champ qui relie le payload au champ SF_32",
  },
  {
    id: "local-role-949-named",
    status: "missing",
    requiredEvidence: "source qui explique le role local 949 sans le confondre avec eAttrib 994",
  },
  {
    id: "metadata-12337-named",
    status: "missing",
    requiredEvidence: "dictionnaire/table nommant metadata 12337 ou son type de champ",
  },
  {
    id: "scale-10-semantics",
    status: "missing",
    requiredEvidence: "preuve que scale 10 exprime la valeur ou l'echelle de SF_32, et pas seulement un parametre de layout",
  },
];

const rejectedPromotions = [
  {
    id: "promote-from-selector-949",
    reason: "949 est un selecteur local surcharge par layout, pas une preuve directe de Bonus_Percent_Per_Power ni SF_32.",
  },
  {
    id: "promote-from-metadata-12337",
    reason: "metadata 12337 est confirme binaire mais non nomme semantiquement.",
  },
  {
    id: "promote-from-scale-10",
    reason: "scale 10 est confirme binaire mais son sens gameplay n'est pas prouve.",
  },
  {
    id: "promote-from-binary-adjacency",
    reason: "l'adjacence binaire confirme la structure, pas l'ownership exact de SF_32.",
  },
];

const failedStructure = validatedStructure.filter((item) => item.status !== "passed");
const missingSemantics = semanticRequirements.filter((item) => item.status !== "satisfied");
const sourcePlanOpen = sourceHuntPlan.summary?.acceptedEvidence === 0 && sourceHuntPlan.summary?.candidateSnippetUsable === false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-binary-semantic-gap-audit-v1",
  source: inputs,
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    targetSelector: 949,
    targetMetadataId: 12337,
    targetOpcode: 6,
    targetScale: 10,
    binaryStructureReady: failedStructure.length === 0 && binaryVerification.summary?.targetBinaryVerified === true,
    validatedStructure: validatedStructure.filter((item) => item.status === "passed").length,
    failedStructure: failedStructure.length,
    semanticRequirements: semanticRequirements.length,
    missingSemantics: missingSemantics.length,
    sourcePlanOpen,
    sf32OwnerProven: false,
    semanticBridgeReady: false,
    acceptedForBridge: false,
    writesTargetDataset: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: failedStructure.length === 0 ? "sf32-binary-structure-ready-semantic-gap-open" : "sf32-binary-structure-incomplete",
      confidence: failedStructure.length === 0 ? "high" : "medium",
      promotionReady: false,
      finding: failedStructure.length === 0
        ? "La structure binaire du payload 949/1663210 est prouvee, mais l'ownership SF_32 reste non prouve."
        : "La structure binaire cible doit encore etre corrigee avant la recherche semantique.",
      nextAction: failedStructure.length === 0
        ? "Chercher une table/dictionnaire qui nomme local-role 949 ou metadata 12337, ou parser le champ exact avant tout bridge DPS."
        : "Corriger la verification binaire avant de poursuivre.",
    },
  },
  targetBinaryFields: target?.fields ?? [],
  validatedStructure,
  semanticRequirements,
  rejectedPromotions,
  sourceHuntSnapshot: {
    targetField: sourceHuntPlan.summary?.targetField ?? null,
    targetSelector: sourceHuntPlan.summary?.targetSelector ?? null,
    searches: sourceHuntPlan.summary?.searches ?? 0,
    highPrioritySearches: sourceHuntPlan.summary?.highPrioritySearches ?? 0,
    acceptedEvidence: sourceHuntPlan.summary?.acceptedEvidence ?? 0,
    candidateSnippetUsable: sourceHuntPlan.summary?.candidateSnippetUsable ?? false,
  },
  safeguards: {
    noTargetDatasetWrite: true,
    noIntakeWrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "sf32-binary-semantic-gap-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
