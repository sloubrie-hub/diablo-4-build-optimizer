const fs = require("fs");
const path = require("path");

const packageFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json";
const outDir = process.argv[3] ?? "outputs/diablo4-delta-evidence-draft";
const requestedTemplateId = process.argv[4] ?? "";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasPlaceholder(value) {
  return typeof value === "string" && (
    value.includes("A REMPLIR")
    || value.includes("YYYY-MM-DD")
  );
}

function collectPlaceholders(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPlaceholders(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => collectPlaceholders(child, prefix ? `${prefix}.${key}` : key));
  }
  return hasPlaceholder(value) ? [prefix] : [];
}

function candidateIdFromTemplate(template) {
  return String(template.id ?? "template-delta-proof")
    .replace(/^template-/, "draft-")
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

const intakePackage = readJson(packageFile);
const templates = intakePackage.templates ?? [];
const selectedTemplate = requestedTemplateId
  ? templates.find((template) => template.id === requestedTemplateId || template.claim?.type === requestedTemplateId)
  : templates[0];

if (!selectedTemplate) {
  throw new Error(`No delta evidence template found for ${requestedTemplateId || "first template"}`);
}

const draftCandidate = cloneJson(selectedTemplate);
draftCandidate.id = candidateIdFromTemplate(selectedTemplate);
draftCandidate.templateId = selectedTemplate.id;
draftCandidate.draft = true;
draftCandidate.reviewer = {
  ...(draftCandidate.reviewer ?? {}),
  status: "pending",
  notes: [
    ...((draftCandidate.reviewer?.notes ?? []).filter(Boolean)),
    "Brouillon genere: remplacer tous les champs A REMPLIR avant revue.",
    "Ne jamais copier en approved sans controle source.",
  ],
};

const placeholderFields = collectPlaceholders(draftCandidate);
const dryRunInput = {
  schemaVersion: 1,
  notes: [
    "Brouillon genere depuis le package intake delta.",
    "Ce fichier n'est pas l'intake reel; copier vers inputs/external-evidence-candidates.json seulement apres remplissage.",
  ],
  candidates: [draftCandidate],
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-draft-v1",
  source: {
    packageFile,
    outDir,
    requestedTemplateId: requestedTemplateId || null,
  },
  summary: {
    assetId: intakePackage.summary?.assetId ?? 1663210,
    entityId: intakePackage.summary?.entityId ?? "skill:1663210",
    templateId: selectedTemplate.id,
    candidateId: draftCandidate.id,
    claimType: draftCandidate.claim?.type ?? null,
    claimField: draftCandidate.claim?.field ?? null,
    placeholderFields: placeholderFields.length,
    targetFile: intakePackage.targetFile ?? "inputs/external-evidence-candidates.json",
    draftReadyForCopy: false,
    reviewerStatus: draftCandidate.reviewer?.status ?? "pending",
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: "delta-evidence-draft-needs-source",
      confidence: "high",
      promotionReady: false,
      finding: "Un brouillon de preuve est pret, mais il contient encore des placeholders et reste hors intake reel.",
      nextAction: "Remplacer les placeholders par une source exacte, puis copier le candidat dans inputs/external-evidence-candidates.json avec reviewer.status=pending.",
    },
  },
  placeholderFields,
  dryRunInput,
  candidate: draftCandidate,
  usage: [
    "Remplacer tous les champs A REMPLIR et YYYY-MM-DD.",
    "Garder reviewer.status=pending lors de la premiere copie.",
    "Relancer la suite complete pour auditer le candidat.",
    "Passer a approved seulement apres revue humaine de la source.",
  ],
  safeguards: [
    "Ce brouillon n'ecrit pas dans inputs/external-evidence-candidates.json.",
    "Ce brouillon ne modifie aucun DPS.",
    "Un brouillon rempli reste une preuve candidate, pas une promotion fiable.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-draft.json");
const dryRunFile = path.join(outDir, "external-evidence-candidates.draft.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(dryRunFile, JSON.stringify(dryRunInput, null, 2));
console.log(JSON.stringify({ outFile, dryRunFile, summary: report.summary }, null, 2));
