const fs = require("fs");
const path = require("path");

const formFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json";
const draftInputFile = process.argv[3] ?? "outputs/diablo4-delta-evidence-draft/external-evidence-candidates.draft.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-evidence-filled-draft";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
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

function pathParts(fieldPath) {
  const parts = [];
  for (const segment of String(fieldPath).split(".")) {
    const match = /^([^\[]+)(?:\[(\d+)\])?$/.exec(segment);
    if (!match) throw new Error(`Unsupported field path: ${fieldPath}`);
    parts.push(match[1]);
    if (match[2] != null) parts.push(Number(match[2]));
  }
  return parts;
}

function setValueAtPath(target, fieldPath, value) {
  const parts = pathParts(fieldPath);
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (cursor[part] == null) cursor[part] = typeof parts[index + 1] === "number" ? [] : {};
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function cleanFieldValue(value) {
  return typeof value === "string" ? value.trim() : value;
}

const form = readJson(formFile);
const draftInput = readJson(draftInputFile);
const fields = form.fields ?? [];
const draftCandidates = cloneJson(draftInput.candidates ?? []);
const targetCandidateId = form.summary?.candidateId;
const candidate = draftCandidates.find((item) => item.id === targetCandidateId) ?? draftCandidates[0];

if (!candidate) {
  throw new Error("No draft candidate available to patch");
}

const completedFields = [];
const missingFields = [];

for (const field of fields) {
  const value = cleanFieldValue(field.value);
  if (value == null || value === "") {
    missingFields.push(field.field);
    continue;
  }
  setValueAtPath(candidate, field.field, value);
  completedFields.push(field.field);
}

candidate.reviewer = {
  ...(candidate.reviewer ?? {}),
  status: "pending",
  notes: [
    ...((candidate.reviewer?.notes ?? []).filter(Boolean)),
    "Brouillon patch dry-run: verifier la source avant copie ou approbation.",
  ],
};
candidate.draft = true;

const remainingPlaceholderFields = collectPlaceholders(candidate);
const readyForDraftAudit = missingFields.length === 0 && remainingPlaceholderFields.length === 0;
const patchedDraftInput = {
  schemaVersion: draftInput.schemaVersion ?? 1,
  notes: [
    ...((draftInput.notes ?? []).map(String)),
    "Brouillon patch depuis formulaire: dry-run seulement, ne pas copier sans revue.",
  ],
  candidates: draftCandidates,
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-filled-draft-v1",
  source: {
    formFile,
    draftInputFile,
    outDir,
  },
  summary: {
    assetId: form.summary?.assetId ?? candidate.assetId ?? 1663210,
    entityId: form.summary?.entityId ?? candidate.entityId ?? "skill:1663210",
    candidateId: candidate.id,
    claimType: candidate.claim?.type ?? form.summary?.claimType ?? null,
    claimField: candidate.claim?.field ?? form.summary?.claimField ?? null,
    fields: fields.length,
    completedFields: completedFields.length,
    missingFields: missingFields.length,
    remainingPlaceholderFields: remainingPlaceholderFields.length,
    readyForDraftAudit,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForDraftAudit
        ? "delta-evidence-filled-draft-ready-for-audit"
        : "delta-evidence-filled-draft-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForDraftAudit
        ? "Le brouillon patch contient tous les champs requis; il peut etre audite en dry-run."
        : "Le brouillon patch reste incomplet et ne doit pas etre copie.",
      nextAction: readyForDraftAudit
        ? "Auditer le brouillon patch, puis produire une preview intake si elle reste pending."
        : `Renseigner ${missingFields[0] ?? remainingPlaceholderFields[0] ?? "les champs manquants"}.`,
    },
  },
  completedFields,
  missingFields,
  remainingPlaceholderFields,
  patchedCandidate: candidate,
  patchedDraftInput,
  safeguards: [
    "Ce script n'ecrit pas dans inputs/external-evidence-candidates.json.",
    "Le brouillon patch conserve reviewer.status=pending.",
    "Un brouillon complet reste une preuve candidate, pas une preuve approved.",
    "Aucun champ ne peut modifier reliableDps, le ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-filled-draft.json");
const patchedDraftFile = path.join(outDir, "external-evidence-candidates.filled-draft.json");
writeJson(outFile, report);
writeJson(patchedDraftFile, patchedDraftInput);
console.log(JSON.stringify({ outFile, patchedDraftFile, summary: report.summary }, null, 2));
