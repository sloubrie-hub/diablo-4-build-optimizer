const fs = require("fs");
const path = require("path");

const externalDeltaWorkorderFile = process.argv[2] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const deltaBridgeReadinessFile = process.argv[3] ?? "outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json";
const deltaPromotionReviewFile = process.argv[4] ?? "outputs/diablo4-delta-promotion-review/delta-promotion-review.json";
const outDir = process.argv[5] ?? "outputs/diablo4-delta-evidence-intake-package";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const workorder = readJson(externalDeltaWorkorderFile);
const readiness = readJson(deltaBridgeReadinessFile);
const promotionReview = readJson(deltaPromotionReviewFile);

const tasks = workorder.tasks ?? [];
const templates = tasks
  .map((task) => task.intakeTemplate)
  .filter(Boolean)
  .map((template) => ({
    ...template,
    reviewer: {
      ...(template.reviewer ?? {}),
      status: "pending",
      notes: [
        ...((template.reviewer?.notes ?? []).filter(Boolean)),
        "Ne jamais passer a approved sans source verifiee.",
        "Ne jamais utiliser ce template seul comme preuve.",
      ],
    },
  }));

const reviewRows = tasks.map((task) => ({
  id: task.id,
  gateId: task.gateId,
  title: task.title,
  claim: task.claim,
  mustContain: task.mustContain ?? [],
  requiredSourceKinds: task.requiredSourceKinds ?? [],
  rejects: task.rejects ?? [],
  checklist: task.reviewChecklist ?? [],
  parserBridge: task.parserBridge,
  status: task.status,
}));

const packageBlocked = templates.length !== tasks.length || workorder.summary?.openTasks !== tasks.length;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-intake-package-v1",
  source: {
    externalDeltaWorkorderFile,
    deltaBridgeReadinessFile,
    deltaPromotionReviewFile,
    outDir,
  },
  summary: {
    assetId: workorder.summary?.assetId ?? 1663210,
    entityId: workorder.summary?.entityId ?? "skill:1663210",
    tasks: tasks.length,
    templates: templates.length,
    openTasks: workorder.summary?.openTasks ?? 0,
    readyTasks: workorder.summary?.readyTasks ?? 0,
    acceptedExternalEvidence: workorder.summary?.acceptedExternalEvidence ?? 0,
    bridgeReadyGates: readiness.summary?.readyGates ?? 0,
    bridgeBlockedGates: readiness.summary?.blockedGates ?? 3,
    promotionReviewFailedChecks: promotionReview.summary?.failedChecks ?? 0,
    targetFile: "inputs/external-evidence-candidates.json",
    packageReady: templates.length === 3,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: packageBlocked
        ? "delta-evidence-intake-package-open"
        : "delta-evidence-intake-package-ready",
      confidence: "high",
      promotionReady: false,
      finding: packageBlocked
        ? "Le package de collecte reste ouvert; les templates sont prets mais aucune preuve n'est acceptee."
        : "Les trois templates delta sont prets pour collecte et revue source-backed.",
      nextAction: "Copier une seule entree template dans inputs/external-evidence-candidates.json, renseigner la source exacte, puis garder reviewer.status=pending pendant la revue.",
    },
  },
  targetFile: "inputs/external-evidence-candidates.json",
  reviewRows,
  templates,
  usage: [
    "Copier une seule entree depuis templates vers candidates.",
    "Remplacer les champs A REMPLIR par une source exacte.",
    "Verifier mustContain et rejects avant toute approbation.",
    "Passer reviewer.status a approved seulement apres revue.",
    "Relancer la suite complete apres modification de l'intake.",
  ],
  safeguards: [
    "Ce package ne modifie aucun DPS.",
    "Ces templates ne sont pas des preuves.",
    "Une preuve approved ouvre seulement le bridge cible correspondant.",
    "La promotion fiable reste bloquee par la revue de promotion dediee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-intake-package.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
