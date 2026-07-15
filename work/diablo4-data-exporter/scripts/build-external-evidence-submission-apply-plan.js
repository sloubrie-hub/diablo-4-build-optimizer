const fs = require("fs");
const path = require("path");

const applicationGateFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-application-gate/external-evidence-submission-application-gate.json";
const outDir = process.argv[3] ?? "outputs/diablo4-external-evidence-submission-apply-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const applicationGate = readJson(applicationGateFile);
const summary = applicationGate.summary ?? {};
const patchPreview = applicationGate.patchPreview ?? null;
const applyContract = applicationGate.applyContract ?? {};

const planChecks = [
  {
    id: "manual-apply-allowed",
    status: summary.manualApplyAllowed === true ? "passed" : "failed",
    finding: summary.manualApplyAllowed === true
      ? "La porte externe autorise la preparation d'une application manuelle."
      : "La porte d'application externe est fermee.",
  },
  {
    id: "patch-preview-complete",
    status: patchPreview?.before === 163200 && patchPreview?.after === 212160 ? "passed" : "failed",
    finding: patchPreview?.before === 163200 && patchPreview?.after === 212160
      ? "La preview de patch contient les valeurs attendues."
      : "La preview de patch est incomplete ou inattendue.",
  },
  {
    id: "required-apply-safeguards",
    status: (applyContract.requiredBeforeApply ?? []).length >= 4 ? "passed" : "failed",
    finding: (applyContract.requiredBeforeApply ?? []).length >= 4
      ? "Les garde-fous avant application sont presents."
      : "Les garde-fous avant application sont incomplets.",
  },
  {
    id: "no-write-in-plan",
    status: summary.writesTargetDataset === false ? "passed" : "failed",
    finding: summary.writesTargetDataset === false
      ? "Le plan n'est pas une ecriture."
      : "Une ecriture prematuree est detectee.",
  },
];

const failedChecks = planChecks.filter((check) => check.status !== "passed");
const applyPlanReady = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-apply-plan-v1",
  source: {
    applicationGateFile,
    outDir,
  },
  summary: {
    assetId: summary.assetId ?? 1663210,
    entityId: summary.entityId ?? "skill:1663210",
    candidateId: summary.candidateId ?? "draft-delta-proof-sf32-owner",
    proposedReliableDps: summary.proposedReliableDps ?? 212160,
    checks: planChecks.length,
    failedChecks: failedChecks.length,
    applyPlanReady,
    patchBefore: patchPreview?.before ?? null,
    patchAfter: patchPreview?.after ?? null,
    writesTargetDataset: false,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: applyPlanReady
        ? "external-evidence-submission-apply-plan-ready"
        : "external-evidence-submission-apply-plan-blocked",
      confidence: "high",
      promotionReady: false,
      finding: applyPlanReady
        ? "Le plan d'application externe explicite est pret, mais n'applique rien."
        : "Le plan d'application externe reste bloque.",
      nextAction: applyPlanReady
        ? "Executer une application dediee seulement apres confirmation humaine finale."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  planChecks,
  applySteps: [
    {
      id: "backup-target-dataset",
      action: "Creer une sauvegarde horodatee de outputs/diablo4-target-dataset/target-dataset.json.",
      required: true,
    },
    {
      id: "apply-reliable-dps-patch",
      action: "Remplacer uniquement entities.*[].dps.reliable pour skill:1663210 de 163200 vers 212160.",
      required: true,
    },
    {
      id: "run-regression-suite",
      action: "Relancer la suite cible complete et verifier asset 1663210 plus build 1461593+1663210.",
      required: true,
    },
    {
      id: "review-diff",
      action: "Relire le diff et confirmer qu'aucun champ hors reliableDps cible n'a change.",
      required: true,
    },
  ],
  patchPreview,
  safeguards: [
    "Ce plan ne modifie aucun fichier.",
    "applyPlanReady ne vaut pas application.",
    "Toute application future doit etre confirmee explicitement.",
    "Le ranking fiable reste strict-only dans cette sortie.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-apply-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
