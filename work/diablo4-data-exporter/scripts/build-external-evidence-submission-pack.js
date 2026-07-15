const fs = require("fs");
const path = require("path");
const { SF32_OWNER_CLAIM } = require("../src/delta-evidence-contract");

const workorderFile = process.argv[2] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const intakeFile = process.argv[3] ?? "inputs/external-evidence-candidates.json";
const selector949WindowReparseAuditFile = process.argv[4] ?? "outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json";
const outDir = process.argv[5] ?? "outputs/diablo4-external-evidence-submission-pack";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function candidateIdForTask(taskId) {
  return `draft-${taskId}`;
}

function markdownEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

const workorder = readJson(workorderFile);
const intake = readJson(intakeFile);
const selector949WindowReparseAudit = readOptionalJson(selector949WindowReparseAuditFile);
const tasks = workorder.tasks ?? [];
const nextTask = tasks.find((task) => task.status !== "ready-for-parser-bridge") ?? tasks[0] ?? null;
const template = nextTask?.intakeTemplate ? clone(nextTask.intakeTemplate) : null;
const templateNeedsRevision = selector949WindowReparseAudit?.summary?.sf32TemplateNeedsRevision === true
  && nextTask?.id === "delta-proof-sf32-owner";
const revisedMustContain = templateNeedsRevision
  ? [...SF32_OWNER_CLAIM.mustContain]
  : nextTask?.mustContain ?? [];
const revisedClaim = templateNeedsRevision
  ? {
      type: SF32_OWNER_CLAIM.type,
      field: SF32_OWNER_CLAIM.field,
    }
  : nextTask?.claim ?? null;

if (template && nextTask?.id) {
  template.id = candidateIdForTask(nextTask.id);
  if (templateNeedsRevision) {
    template.claim = {
      type: revisedClaim.type,
      field: revisedClaim.field,
      value: "A REMPLIR",
      excerpt: "A REMPLIR: extrait court contenant 1663210 + eAttrib 994 + Bonus_Percent_Per_Power + role local 949 + SF_32",
      mapping: "1663210 -> eAttrib:994 / Bonus_Percent_Per_Power -> local-role:949 -> SF_32 A REMPLIR",
    };
  }
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
    selector949WindowReparseAuditFile,
    outDir,
  },
  summary: {
    assetId: workorder.summary?.assetId ?? 1663210,
    entityId: workorder.summary?.entityId ?? "skill:1663210",
    nextTaskId: nextTask?.id ?? null,
    claimType: revisedClaim?.type ?? null,
    claimField: revisedClaim?.field ?? null,
    templateNeedsRevision,
    priorClaimSuspended: templateNeedsRevision,
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
        ? templateNeedsRevision
          ? "external-evidence-submission-pack-revised-ready"
          : "external-evidence-submission-pack-ready"
        : "external-evidence-submission-pack-blocked",
      confidence: "high",
      promotionReady: false,
      finding: template
        ? templateNeedsRevision
          ? "Le brouillon de preuve externe a ete revise: il part de l'ancre 994 et traite 949 comme role local a decoder."
          : "Le prochain brouillon de preuve externe est pret a remplir, mais il n'est pas une preuve acceptee."
        : "Aucun template de preuve externe n'est disponible.",
      nextAction: template
        ? templateNeedsRevision
          ? "Coller une source exacte qui prouve eAttrib 994 / Bonus_Percent_Per_Power et explique le role local 949 avant SF_32."
          : "Coller une source exacte dans le brouillon, garder reviewer.status=pending, puis relancer l'audit intake."
        : "Regenerer le workorder delta avant de preparer une soumission.",
    },
  },
  targetTask: nextTask
    ? {
        id: nextTask.id,
        title: nextTask.title,
        priority: nextTask.priority,
        status: nextTask.status,
        claim: revisedClaim,
        originalClaim: nextTask.claim,
        mustContain: revisedMustContain,
        rejects: templateNeedsRevision
          ? [
              "mapping direct selector:949 -> Bonus_Percent_Per_Power",
              ...(nextTask.rejects ?? []),
            ]
          : nextTask.rejects,
        reviewChecklist: nextTask.reviewChecklist,
      }
    : null,
  candidateSnippet: template,
  supersededClaim: {
    obsolete: templateNeedsRevision,
    claim: templateNeedsRevision
      ? { type: SF32_OWNER_CLAIM.type, field: SF32_OWNER_CLAIM.supersededField }
      : null,
    reason: templateNeedsRevision
      ? "L'audit reparse 949 impose 994 comme ancre bonus; selector:949 ne peut plus etre soumis comme preuve directe SF_32."
      : null,
  },
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
