const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const draftInputFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-draft/external-evidence-candidates.draft.json";
const currentIntakeFile = process.argv[3] ?? "inputs/external-evidence-candidates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-evidence-intake-update-preview";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function runDraftAudit(sourceFile) {
  const auditOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-intake-update-preview-"));
  const auditScript = path.join(__dirname, "audit-delta-evidence-draft.js");
  const result = spawnSync(process.execPath, [auditScript, sourceFile, auditOutDir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`audit-delta-evidence-draft failed with exit code ${result.status}`);
  }
  return readJson(path.join(auditOutDir, "delta-evidence-draft-audit.json"));
}

function sanitizeDraftCandidate(candidate) {
  const copy = JSON.parse(JSON.stringify(candidate));
  delete copy.draft;
  delete copy.templateId;
  return copy;
}

const draftInput = readJson(draftInputFile);
const currentIntake = readJson(currentIntakeFile);
const draftAudit = runDraftAudit(draftInputFile);
const draftCandidates = draftInput.candidates ?? [];
const currentCandidates = currentIntake.candidates ?? [];
const currentIds = new Set(currentCandidates.map((candidate) => candidate.id));
const duplicateIds = draftCandidates.map((candidate) => candidate.id).filter((id) => currentIds.has(id));
const canPreviewMerge = draftAudit.summary?.readyForIntake === true && duplicateIds.length === 0;
const mergeCandidates = canPreviewMerge
  ? [...currentCandidates, ...draftCandidates.map(sanitizeDraftCandidate)]
  : currentCandidates;

const preview = {
  schemaVersion: currentIntake.schemaVersion ?? 1,
  notes: [
    ...((currentIntake.notes ?? []).map(String)),
    "Preview generee: verifier avant toute copie vers inputs/external-evidence-candidates.json.",
  ],
  candidates: mergeCandidates,
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-intake-update-preview-v1",
  source: {
    draftInputFile,
    currentIntakeFile,
    outDir,
  },
  summary: {
    currentCandidates: currentCandidates.length,
    draftCandidates: draftCandidates.length,
    previewCandidates: preview.candidates.length,
    duplicateIds,
    readyForIntake: draftAudit.summary?.readyForIntake === true,
    previewMergeReady: canPreviewMerge,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: canPreviewMerge
        ? "delta-evidence-intake-update-preview-ready"
        : "delta-evidence-intake-update-preview-blocked",
      confidence: "high",
      promotionReady: false,
      finding: canPreviewMerge
        ? "La preview de merge est prete; elle peut etre relue avant copie manuelle dans l'intake reel."
        : "La preview refuse de fusionner le brouillon tant que l'audit n'est pas pret ou qu'un id existe deja.",
      nextAction: canPreviewMerge
        ? "Relire la preview, puis copier manuellement le candidat en pending dans inputs/external-evidence-candidates.json."
        : "Remplir le brouillon, retirer les doublons, puis relancer la preview.",
    },
  },
  draftAuditSummary: draftAudit.summary,
  blockers: {
    duplicateIds,
    placeholderFields: draftAudit.placeholderFields ?? [],
    structuralBlockers: draftAudit.structuralBlockers ?? [],
    reviewBlockers: draftAudit.reviewBlockers ?? [],
  },
  preview,
  safeguards: [
    "Ce script n'ecrit jamais dans inputs/external-evidence-candidates.json.",
    "La preview conserve reviewer.status tel quel, normalement pending.",
    "Une preview merge-ready n'est pas une preuve approved.",
    "acceptedForBridge reste false; seuls les scripts d'intake et de bridge cibles peuvent consommer une preuve approuvee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-intake-update-preview.json");
const previewFile = path.join(outDir, "external-evidence-candidates.preview.json");
writeJson(outFile, report);
writeJson(previewFile, preview);
console.log(JSON.stringify({ outFile, previewFile, summary: report.summary }, null, 2));
