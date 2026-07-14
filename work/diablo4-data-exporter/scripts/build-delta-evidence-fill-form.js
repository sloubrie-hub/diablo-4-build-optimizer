const fs = require("fs");
const path = require("path");

const humanActionPlanFile = process.argv[2] ?? "outputs/diablo4-delta-human-action-plan/delta-human-action-plan.json";
const outDir = process.argv[3] ?? "outputs/diablo4-delta-evidence-fill-form";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function markdownEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

const actionPlan = readJson(humanActionPlanFile);
const summary = actionPlan.summary ?? {};
const fillTasks = actionPlan.fillTasks ?? [];
const candidate = actionPlan.candidateSnapshot ?? {};

const fields = fillTasks.map((task) => ({
  field: task.field,
  label: task.field,
  hint: task.hint,
  required: task.required === true,
  value: "",
  status: "empty",
}));

const form = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-fill-form-v1",
  source: {
    humanActionPlanFile,
    outDir,
  },
  summary: {
    assetId: summary.assetId ?? 1663210,
    entityId: summary.entityId ?? "skill:1663210",
    candidateId: summary.candidateId ?? "draft-delta-proof-sf32-owner",
    claimType: summary.claimType ?? "sf32-field-ownership",
    claimField: summary.claimField ?? "selector:949",
    fields: fields.length,
    requiredFields: fields.filter((field) => field.required).length,
    completedFields: 0,
    readyForDraftPatch: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: "delta-evidence-fill-form-empty",
      confidence: "high",
      promotionReady: false,
      finding: "Le formulaire liste les champs a renseigner pour le brouillon SF_32.",
      nextAction: fields[0]
        ? `Renseigner ${fields[0].field} depuis une source exacte.`
        : "Aucun champ a renseigner.",
    },
  },
  candidateContext: {
    id: candidate.id ?? summary.candidateId,
    domain: candidate.domain ?? "delta-1663210",
    assetId: candidate.assetId ?? summary.assetId,
    entityId: candidate.entityId ?? summary.entityId,
    claim: candidate.claim ?? {
      type: summary.claimType,
      field: summary.claimField,
    },
  },
  fields,
  instructions: [
    "Renseigner uniquement depuis une source exacte.",
    "Ne pas changer reviewer.status vers approved dans ce formulaire.",
    "Relancer la suite complete apres transformation du formulaire en brouillon rempli.",
    "Conserver la separation strict, what-if, candidat bloque et valeur inconnue.",
  ],
  safeguards: [
    "Ce formulaire n'ecrit pas dans inputs/external-evidence-candidates.json.",
    "Ce formulaire n'ecrit pas dans le brouillon source.",
    "Un formulaire rempli ne vaut pas preuve approuvee.",
    "Aucun champ ne peut modifier reliableDps, le ranking ou promotionReady.",
  ],
};

const markdown = [
  `# Formulaire preuve delta ${form.summary.candidateId}`,
  "",
  `- Asset: ${form.summary.assetId}`,
  `- Entite: ${form.summary.entityId}`,
  `- Claim: ${form.summary.claimType} / ${form.summary.claimField}`,
  `- Statut initial: pending`,
  "",
  "## Champs a remplir",
  "",
  "| Champ | Valeur | Indication |",
  "| --- | --- | --- |",
  ...fields.map((field) => `| ${markdownEscape(field.field)} |  | ${markdownEscape(field.hint)} |`),
  "",
  "## Regles",
  "",
  ...form.instructions.map((item) => `- ${item}`),
  "",
  "## Garde-fous",
  "",
  ...form.safeguards.map((item) => `- ${item}`),
  "",
].join("\n");

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-fill-form.json");
const markdownFile = path.join(outDir, "delta-evidence-fill-form.md");
fs.writeFileSync(outFile, JSON.stringify(form, null, 2));
fs.writeFileSync(markdownFile, markdown);
console.log(JSON.stringify({ outFile, markdownFile, summary: form.summary }, null, 2));
