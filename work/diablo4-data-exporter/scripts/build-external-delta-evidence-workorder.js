const fs = require("fs");
const path = require("path");

const externalDeltaEvidencePlanFile = process.argv[2] ?? "outputs/diablo4-external-delta-evidence-plan/external-delta-evidence-plan.json";
const externalEvidenceIntakeFile = process.argv[3] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const outDir = process.argv[4] ?? "outputs/diablo4-external-delta-evidence-workorder";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const plan = readJson(externalDeltaEvidencePlanFile);
const intake = readJson(externalEvidenceIntakeFile);
const acceptedIds = new Set((intake.candidates ?? [])
  .filter((candidate) => candidate.status === "accepted")
  .map((candidate) => candidate.id));

function reviewChecklist(proof) {
  return [
    `La source contient ${proof.mustContain?.join(" + ") ?? proof.acceptedClaim?.field ?? "le champ cible"}.`,
    `Le claim utilise type=${proof.acceptedClaim?.type ?? "n/a"} et field=${proof.acceptedClaim?.field ?? "n/a"}.`,
    "Le reviewer.status reste pending tant que la source n'est pas verifiee.",
    `Rejeter: ${(proof.rejects ?? []).join(", ")}.`,
    "Ne pas modifier reliableDps depuis cette preuve.",
  ];
}

function taskFromProof(proof, index) {
  const ready = proof.status === "ready-for-parser-bridge";
  const template = (plan.exampleCandidates ?? []).find((candidate) =>
    candidate.claim?.type === proof.acceptedClaim?.type
    && candidate.claim?.field === proof.acceptedClaim?.field);
  const acceptedEvidence = (proof.acceptedEvidence ?? []).filter((candidate) => acceptedIds.has(candidate.id));
  return {
    rank: index + 1,
    id: proof.id,
    gateId: proof.gateId,
    title: proof.title,
    priority: proof.priority,
    status: ready ? "ready-for-parser-bridge" : "needs-source-backed-evidence",
    claim: proof.acceptedClaim,
    requiredSourceKinds: proof.acceptedSourceKinds ?? [],
    mustContain: proof.mustContain ?? [],
    rejects: proof.rejects ?? [],
    parserBridge: proof.parserBridge,
    acceptedEvidenceIds: acceptedEvidence.map((candidate) => candidate.id),
    reviewChecklist: reviewChecklist(proof),
    intakeTemplate: template
      ? {
          ...template,
          reviewer: {
            status: "pending",
            notes: [
              "Renseigner depuis une source verifiee puis passer a approved apres revue.",
              "Ne pas approuver une preuve par inference, label UI ou analogie locale.",
            ],
          },
        }
      : null,
  };
}

const tasks = (plan.requiredProofs ?? []).map(taskFromProof);
const readyTasks = tasks.filter((task) => task.status === "ready-for-parser-bridge");
const openTasks = tasks.filter((task) => task.status !== "ready-for-parser-bridge");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-delta-evidence-workorder-v1",
  source: {
    externalDeltaEvidencePlanFile,
    externalEvidenceIntakeFile,
    outDir,
  },
  summary: {
    assetId: plan.summary?.assetId ?? 1663210,
    entityId: plan.summary?.entityId ?? "skill:1663210",
    tasks: tasks.length,
    readyTasks: readyTasks.length,
    openTasks: openTasks.length,
    acceptedExternalEvidence: intake.summary?.accepted ?? 0,
    nextTaskId: openTasks[0]?.id ?? "parser-bridge-after-evidence",
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: openTasks.length
        ? "external-delta-evidence-workorder-open"
        : "external-delta-evidence-workorder-ready-for-parser-bridge",
      confidence: "high",
      promotionReady: false,
      finding: openTasks.length
        ? "La collecte de preuves externes delta reste ouverte; les templates indiquent exactement quelles preuves fournir."
        : "Les preuves externes delta sont presentes pour preparer un bridge parseur, sans promotion automatique.",
      nextAction: openTasks.length
        ? `Collecter et verifier ${openTasks[0].id}, puis l'ajouter dans inputs/external-evidence-candidates.json.`
        : "Construire un parser bridge cible et ajouter des invariants de promotion separes.",
    },
  },
  tasks,
  intakeAppendix: {
    targetFile: "inputs/external-evidence-candidates.json",
    pendingTemplates: openTasks.map((task) => task.intakeTemplate).filter(Boolean),
    usage: [
      "Copier une seule entree a la fois dans candidates.",
      "Remplacer les champs A REMPLIR par la source exacte.",
      "Garder reviewer.status=pending pendant la verification.",
      "Passer a approved seulement apres controle de la source et des rejets.",
    ],
  },
  safeguards: [
    "Ce workorder ne modifie aucun DPS.",
    "Les templates ne sont pas des preuves.",
    "Une entree approved ouvre seulement un parser bridge cible.",
    "La promotion fiable reste impossible sans invariants dedies.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-delta-evidence-workorder.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
