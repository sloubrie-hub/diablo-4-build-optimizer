const fs = require("fs");
const path = require("path");

const inputs = {
  externalEvidenceIntake: process.argv[2] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json",
  reliableDpsGates: process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  bucketEngineContract: process.argv[4] ?? "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json",
};
const outDir = process.argv[5] ?? "outputs/diablo4-external-evidence-bridge-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function acceptedForDomain(intake, domain) {
  return (intake.candidates ?? []).filter((candidate) => candidate.status === "accepted" && candidate.domain === domain);
}

function step({ id, domain, title, acceptedEvidence, requiredParser, requiredContract, unlocks }) {
  const ready = acceptedEvidence.length > 0;
  return {
    id,
    domain,
    title,
    status: ready ? "ready-for-parser-bridge" : "blocked-waiting-for-accepted-evidence",
    acceptedEvidence: acceptedEvidence.map((candidate) => ({
      id: candidate.id,
      assetId: candidate.assetId,
      entityId: candidate.entityId,
      claim: candidate.claim,
      source: candidate.source,
    })),
    requiredParser,
    requiredContract,
    unlocks,
    canModifyReliableDps: false,
    guard: "bridge plan only; parser implementation and suite invariants must be updated separately",
  };
}

const intake = readJson(inputs.externalEvidenceIntake);
const reliableDpsGates = readJson(inputs.reliableDpsGates);
const bucketEngineContract = readJson(inputs.bucketEngineContract);

const steps = [
  step({
    id: "bridge-delta-1663210",
    domain: "delta-1663210",
    title: "Relier les preuves externes au delta 1663210",
    acceptedEvidence: acceptedForDomain(intake, "delta-1663210"),
    requiredParser: [
      "mapper la preuve acceptee vers SF_32, SF_33 ou uptime",
      "mettre a jour la conclusion delta sans changer reliableDps tant que les trois preuves ne sont pas pretes",
      "ajouter un invariant de suite pour toute promotion eventuelle",
    ],
    requiredContract: [
      "reliableDpsGates.canUseForReliableDps reste false tant que toutes les portes ne passent pas",
      "bucketEngineContract doit rester strict-only-safe avant promotion",
    ],
    unlocks: "Peut fermer blocked-delta-cleared seulement si SF_32, SF_33 et uptime sont tous prouves.",
  }),
  step({
    id: "bridge-slots-1461593",
    domain: "slots-1461593",
    title: "Relier les preuves externes aux slots de 1461593",
    acceptedEvidence: acceptedForDomain(intake, "slots-1461593"),
    requiredParser: [
      "mapper la preuve acceptee vers allowedSlots",
      "mettre a jour la readiness slots",
      "recalculer les contraintes de build sans utiliser de libelle UI seul",
    ],
    requiredContract: [
      "slot-constraints-proven passe seulement pour les assets couverts",
      "les builds multi-classes restent invalides",
    ],
    unlocks: "Peut rendre le plan necromancer chargeable si les autres contraintes restent valides.",
  }),
  step({
    id: "bridge-additive-buckets",
    domain: "additive-buckets",
    title: "Relier les preuves externes aux buckets fins",
    acceptedEvidence: acceptedForDomain(intake, "additive-buckets"),
    requiredParser: [
      "mapper la preuve acceptee vers additive, multiplicative, uptime ou cap",
      "mettre a jour le plan buckets fins",
      "ajouter des tests de parite strict/what-if avant tout ranking fiable",
    ],
    requiredContract: [
      "fine-buckets-ready passe uniquement pour les familles couvertes",
      "les candidats bloques restent exclus du reliableDps",
    ],
    unlocks: "Peut alimenter le vrai moteur Diablo IV par buckets fins.",
  }),
];

const readySteps = steps.filter((row) => row.status === "ready-for-parser-bridge");
const blockedSteps = steps.filter((row) => row.status !== "ready-for-parser-bridge");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-bridge-plan-v1",
  source: inputs,
  summary: {
    steps: steps.length,
    readySteps: readySteps.length,
    blockedSteps: blockedSteps.length,
    acceptedEvidence: intake.summary?.accepted ?? 0,
    canModifyReliableDps: false,
    reliableDpsStillBlocked: reliableDpsGates.summary?.canUseForReliableDps === false,
    bucketContractSafe: bucketEngineContract.summary?.status === "bucket-engine-contract-ok",
    assessment: {
      kind: readySteps.length ? "external-evidence-bridge-ready" : "external-evidence-bridge-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readySteps.length
        ? "Des preuves acceptees peuvent maintenant etre reliees a un parseur, mais le bridge ne modifie pas reliableDps."
        : "Aucune preuve acceptee ne permet encore de construire un pont parseur.",
      nextAction: readySteps.length
        ? "Implementer le parser cible pour le domaine pret, puis ajouter les invariants de promotion."
        : "Ajouter une preuve externe acceptee dans l'intake avant de modifier un parseur.",
    },
  },
  steps,
  safeguards: [
    "Le bridge plan ne modifie aucun score.",
    "Chaque domaine doit passer par un parseur cible explicite.",
    "Toute promotion future doit ajouter un invariant de suite avant d'etre exploitable.",
    "Les garde-fous strict/what-if/blocked restent prioritaires.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-bridge-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
