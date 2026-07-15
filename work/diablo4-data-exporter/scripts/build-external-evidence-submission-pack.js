const fs = require("fs");
const path = require("path");

const workorderFile = process.argv[2] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const intakeFile = process.argv[3] ?? "inputs/external-evidence-candidates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-external-evidence-submission-pack";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function candidateIdForTask(taskId) {
  return `draft-${taskId}`;
}

function markdownEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

const workorder = readJson(workorderFile);
const intake = readJson(intakeFile);
const tasks = workorder.tasks ?? [];
const nextTask = tasks.find((task) => task.status !== "ready-for-parser-bridge") ?? tasks[0] ?? null;
const template = nextTask?.intakeTemplate ? clone(nextTask.intakeTemplate) : null;

if (template && nextTask?.id) {
  template.id = candidateIdForTask(nextTask.id);
  template.reviewer = {
    ...(template.reviewer ?? {}),
    status: "pending",
    notes: [
      ...(template.reviewer?.notes ?? []),
      "Ce brouillon reste pending tant que la source exacte n'est pas collee et revue.",
    ],
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-pack-v1",
  source: {
    workorderFile,
    intakeFile,
    outDir,
  },
  summary: {
    assetId: workorder.summary?.assetId ?? 1663210,
    entityId: workorder.summary?.entityId ?? "skill:1663210",
    nextTaskId: nextTask?.id ?? null,
    claimType: nextTask?.claim?.type ?? null,
    claimField: nextTask?.claim?.field ?? null,
    existingCandidates: (intake.candidates ?? []).length,
    candidateSnippetReady: Boolean(template),
    reviewerStatus: template?.reviewer?.status ?? null,
    writesIntake: false,
    writesTargetDataset: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: template
        ? "external-evidence-submission-pack-ready"
        : "external-evidence-submission-pack-blocked",
      confidence: "high",
      promotionReady: false,
      finding: template
        ? "Le prochain brouillon de preuve externe est pret a remplir, mais il n'est pas une preuve acceptee."
        : "Aucun template de preuve externe n'est disponible.",
      nextAction: template
        ? "Coller une source exacte dans le brouillon, garder reviewer.status=pending, puis relancer l'audit intake."
        : "Regenerer le workorder delta avant de preparer une soumission.",
    },
  },
  targetTask: nextTask
    ? {
        id: nextTask.id,
        title: nextTask.title,
        priority: nextTask.priority,
        status: nextTask.status,
        claim: nextTask.claim,
        mustContain: nextTask.mustContain,
        rejects: nextTask.rejects,
        reviewChecklist: nextTask.reviewChecklist,
      }
    : null,
  candidateSnippet: template,
  submissionSteps: [
    "Copier candidateSnippet dans inputs/external-evidence-candidates.json.",
    "Remplacer tous les champs A REMPLIR par la source exacte.",
    "Verifier mustContain et rejects avant toute revue.",
    "Garder reviewer.status=pending tant que la source n'est pas relue.",
    "Relancer l'audit intake; approved ne peut venir qu'apres revue explicite.",
  ],
  safeguards: [
    "Ce paquet ne modifie pas inputs/external-evidence-candidates.json.",
    "Le brouillon pending ne peut pas ouvrir de bridge.",
    "Aucune valeur reliableDps n'est modifiee.",
    "Une source incomplete ou inferentielle doit rester rejetee ou pending.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-pack.json");
const markdownFile = path.join(outDir, "external-evidence-submission-pack.md");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(markdownFile, [
  "# Paquet soumission preuve externe",
  "",
  `- Tache: \`${markdownEscape(report.summary.nextTaskId)}\``,
  `- Claim: \`${markdownEscape(report.summary.claimType)} / ${markdownEscape(report.summary.claimField)}\``,
  `- Candidats existants: \`${report.summary.existingCandidates}\``,
  `- Ecrit intake: \`${report.summary.writesIntake}\``,
  `- Reliable DPS modifiable: \`${report.summary.canModifyReliableDps}\``,
  "",
  "## Must contain",
  "",
  ...(report.targetTask?.mustContain ?? []).map((item) => `- \`${markdownEscape(item)}\``),
  "",
  "## Rejets",
  "",
  ...(report.targetTask?.rejects ?? []).map((item) => `- ${markdownEscape(item)}`),
  "",
  "## Brouillon JSON",
  "",
  "```json",
  JSON.stringify(report.candidateSnippet, null, 2),
  "```",
  "",
  "## Etapes",
  "",
  ...report.submissionSteps.map((step) => `- ${step}`),
  "",
].join("\n"));

console.log(JSON.stringify({ outFile, markdownFile, summary: report.summary }, null, 2));
