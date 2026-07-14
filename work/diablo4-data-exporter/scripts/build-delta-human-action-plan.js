const fs = require("fs");
const path = require("path");

const manualGateFile = process.argv[2] ?? "outputs/diablo4-delta-manual-promotion-gate/delta-manual-promotion-gate.json";
const draftFile = process.argv[3] ?? "outputs/diablo4-delta-evidence-draft/delta-evidence-draft.json";
const intakeUpdatePreviewFile = process.argv[4] ?? "outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json";
const outDir = process.argv[5] ?? "outputs/diablo4-delta-human-action-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const manualGate = readJson(manualGateFile);
const draft = readJson(draftFile);
const preview = readJson(intakeUpdatePreviewFile);

const placeholderFields = draft.placeholderFields ?? [];
const failedGateIds = (manualGate.gateChecks ?? [])
  .filter((check) => check.status !== "passed")
  .map((check) => check.id);
const candidate = draft.candidate ?? {};

const fieldHints = {
  "source.title": "Nom exact de la table, export, rapport ou fichier source.",
  "source.version": "Version du build ou du dataset utilise.",
  "source.capturedAt": "Date de capture au format YYYY-MM-DD.",
  "claim.value": "Valeur sourcee qui confirme le mapping attendu.",
  "claim.excerpt": "Extrait court contenant 1663210, selector:949 et SF_32.",
  "claim.mapping": "Mapping explicite du type 1663210 -> selector:949 -> SF_32.",
  "reviewer.notes[4]": "Remplacer la note placeholder par une note de revue factuelle.",
};

const fillTasks = placeholderFields.map((field, index) => ({
  rank: index + 1,
  field,
  hint: fieldHints[field] ?? "Remplacer le placeholder par une valeur sourcee.",
  required: true,
}));

const orderedActions = [
  {
    id: "fill-draft-source",
    status: placeholderFields.length ? "blocked" : "ready",
    title: "Remplir le brouillon SF_32",
    details: fillTasks,
  },
  {
    id: "regenerate-audit-preview",
    status: preview.summary?.previewMergeReady ? "ready" : "blocked",
    title: "Regenerer audit et preview",
    command: ".\\run-target-optimizer-suite.ps1",
  },
  {
    id: "manual-copy-pending",
    status: preview.summary?.previewMergeReady ? "ready" : "blocked",
    title: "Copier manuellement en pending dans inputs/external-evidence-candidates.json",
    targetFile: "inputs/external-evidence-candidates.json",
  },
  {
    id: "manual-review-only-after-source-check",
    status: "blocked",
    title: "Passer a approved uniquement apres revue humaine de la source",
  },
  {
    id: "rerun-bridges",
    status: "blocked",
    title: "Relancer intake, bridges et porte manuelle",
    command: ".\\run-target-optimizer-suite.ps1",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-human-action-plan-v1",
  source: {
    manualGateFile,
    draftFile,
    intakeUpdatePreviewFile,
    outDir,
  },
  summary: {
    assetId: manualGate.summary?.assetId ?? 1663210,
    entityId: manualGate.summary?.entityId ?? "skill:1663210",
    candidateId: candidate.id ?? draft.summary?.candidateId ?? "draft-delta-proof-sf32-owner",
    claimType: candidate.claim?.type ?? draft.summary?.claimType ?? "sf32-field-ownership",
    claimField: candidate.claim?.field ?? draft.summary?.claimField ?? "selector:949",
    placeholderFields: placeholderFields.length,
    failedGateIds,
    actions: orderedActions.length,
    readyActions: orderedActions.filter((action) => action.status === "ready").length,
    blockedActions: orderedActions.filter((action) => action.status !== "ready").length,
    previewMergeReady: preview.summary?.previewMergeReady === true,
    readyForHumanAction: manualGate.summary?.readyForHumanAction === true,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: placeholderFields.length
        ? "delta-human-action-plan-fill-draft-first"
        : "delta-human-action-plan-ready-for-preview-review",
      confidence: "high",
      promotionReady: false,
      finding: placeholderFields.length
        ? "La prochaine action utile est de remplacer les placeholders du brouillon SF_32."
        : "Le brouillon ne contient plus de placeholders; verifier la preview avant copie manuelle.",
      nextAction: placeholderFields.length
        ? `Remplir ${placeholderFields[0]} puis relancer la suite.`
        : "Relire la preview et copier manuellement en pending si la source est correcte.",
    },
  },
  candidateSnapshot: candidate,
  fillTasks,
  orderedActions,
  safeguards: [
    "Ce plan n'ecrit jamais dans l'intake reel.",
    "Une action humaine ouverte ne vaut pas promotion fiable.",
    "Le candidat doit rester pending lors de la premiere copie.",
    "Aucun champ de ce plan ne peut alimenter reliableDps ou le ranking.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-human-action-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
