const fs = require("fs");
const path = require("path");

const filledDraftInputFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-filled-draft/external-evidence-candidates.filled-draft.json";
const filledDraftAuditFile = process.argv[3] ?? "outputs/diablo4-delta-evidence-filled-draft-audit/delta-evidence-filled-draft-audit.json";
const currentIntakeFile = process.argv[4] ?? "inputs/external-evidence-candidates.json";
const outDir = process.argv[5] ?? "outputs/diablo4-delta-evidence-filled-draft-intake-preview";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function sanitizeDraftCandidate(candidate) {
  const copy = JSON.parse(JSON.stringify(candidate));
  delete copy.draft;
  delete copy.templateId;
  copy.reviewer = {
    ...(copy.reviewer ?? {}),
    status: "pending",
  };
  return copy;
}

const filledDraftInput = readJson(filledDraftInputFile);
const filledDraftAudit = readJson(filledDraftAuditFile);
const currentIntake = readJson(currentIntakeFile);
const draftCandidates = filledDraftInput.candidates ?? [];
const currentCandidates = currentIntake.candidates ?? [];
const currentIds = new Set(currentCandidates.map((candidate) => candidate.id));
const duplicateIds = draftCandidates.map((candidate) => candidate.id).filter((id) => currentIds.has(id));
const readyForPreview = filledDraftAudit.summary?.readyForPreview === true;
const canPreviewMerge = readyForPreview && duplicateIds.length === 0;
const previewCandidates = canPreviewMerge
  ? [...currentCandidates, ...draftCandidates.map(sanitizeDraftCandidate)]
  : currentCandidates;

const preview = {
  schemaVersion: currentIntake.schemaVersion ?? 1,
  notes: [
    ...((currentIntake.notes ?? []).map(String)),
    "Preview generee depuis brouillon patch: verifier avant copie vers inputs/external-evidence-candidates.json.",
  ],
  candidates: previewCandidates,
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-evidence-filled-draft-intake-preview-v1",
  source: {
    filledDraftInputFile,
    filledDraftAuditFile,
    currentIntakeFile,
    outDir,
  },
  summary: {
    currentCandidates: currentCandidates.length,
    draftCandidates: draftCandidates.length,
    previewCandidates: preview.candidates.length,
    duplicateIds,
    readyForPreview,
    previewMergeReady: canPreviewMerge,
    reviewerStatus: canPreviewMerge ? preview.candidates.at(-1)?.reviewer?.status ?? null : null,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: canPreviewMerge
        ? "delta-evidence-filled-draft-intake-preview-ready"
        : "delta-evidence-filled-draft-intake-preview-blocked",
      confidence: "high",
      promotionReady: false,
      finding: canPreviewMerge
        ? "La preview intake du brouillon patch est prete en pending."
        : "La preview intake du brouillon patch reste bloquee.",
      nextAction: canPreviewMerge
        ? "Relire la preview, puis copier manuellement le candidat en pending si la source est correcte."
        : "Completer et auditer le brouillon patch avant preview.",
    },
  },
  filledDraftAuditSummary: filledDraftAudit.summary,
  blockers: {
    duplicateIds,
    missingFields: filledDraftAudit.blockers?.missingFields ?? [],
    remainingPlaceholderFields: filledDraftAudit.blockers?.remainingPlaceholderFields ?? [],
    placeholderFields: filledDraftAudit.blockers?.placeholderFields ?? [],
    structuralBlockers: filledDraftAudit.blockers?.structuralBlockers ?? [],
    reviewBlockers: filledDraftAudit.blockers?.reviewBlockers ?? [],
  },
  preview,
  safeguards: [
    "Ce script n'ecrit jamais dans inputs/external-evidence-candidates.json.",
    "La preview force reviewer.status=pending pour le candidat ajoute.",
    "Une preview pending n'est pas une preuve approved.",
    "acceptedForBridge, reliableDps, ranking et promotionReady restent false.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-evidence-filled-draft-intake-preview.json");
const previewFile = path.join(outDir, "external-evidence-candidates.filled-draft.preview.json");
writeJson(outFile, report);
writeJson(previewFile, preview);
console.log(JSON.stringify({ outFile, previewFile, summary: report.summary }, null, 2));
