const fs = require("fs");
const path = require("path");

const reviewGateFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-manual-review-gate/external-evidence-submission-manual-review-gate.json";
const outDir = process.argv[3] ?? "outputs/diablo4-external-evidence-submission-review-decision-package";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function renderDecisionMarkdown(report) {
  const summary = report.summary;
  const fields = report.decisionInputTemplate.requiredFields;
  const checks = report.readinessChecks;
  return [
    "# Decision reviewer soumission preuve externe 1663210",
    "",
    `- candidat: \`${summary.candidateId}\``,
    `- statut: \`${summary.readyForDecisionInput ? "pret pour saisie humaine" : "bloque"}\``,
    `- checks: \`${summary.checks - summary.failedChecks}/${summary.checks}\``,
    `- reliableDps modifiable: \`${summary.canModifyReliableDps}\``,
    "",
    "## Champs requis",
    "",
    ...fields.map((field) => `- ${field}: A REMPLIR`),
    "",
    "## Checks",
    "",
    ...checks.map((check) => `- ${check.id}: ${check.status} - ${check.finding}`),
    "",
    "## Actions interdites",
    "",
    ...report.decisionInputTemplate.forbiddenActions.map((action) => `- ${action}`),
    "",
  ].join("\n");
}

const reviewGate = readJson(reviewGateFile);
const gateSummary = reviewGate.summary ?? {};
const template = reviewGate.reviewerDecisionTemplate ?? {};

const readinessChecks = [
  {
    id: "review-gate-ready",
    status: gateSummary.readyForReviewerDecision === true ? "passed" : "failed",
    finding: gateSummary.readyForReviewerDecision === true
      ? "La porte de revue autorise une saisie de decision humaine."
      : "La porte de revue humaine est encore fermee.",
  },
  {
    id: "candidate-still-pending",
    status: gateSummary.targetCandidateStatus === "pending" ? "passed" : "failed",
    finding: gateSummary.targetCandidateStatus === "pending"
      ? "Le candidat reste pending avant decision."
      : "Le candidat n'est pas pending.",
  },
  {
    id: "manual-review-blocker-present",
    status: gateSummary.reviewBlockerPresent === true ? "passed" : "failed",
    finding: gateSummary.reviewBlockerPresent === true
      ? "Le bloqueur manual-review-required est conserve."
      : "Le bloqueur manual-review-required est absent.",
  },
  {
    id: "no-automatic-promotion",
    status: gateSummary.promotionReady === false && gateSummary.canModifyReliableDps === false ? "passed" : "failed",
    finding: gateSummary.promotionReady === false && gateSummary.canModifyReliableDps === false
      ? "La decision preparee ne peut pas promouvoir le DPS fiable."
      : "Une promotion automatique interdite a ete detectee.",
  },
];

const failedChecks = readinessChecks.filter((check) => check.status !== "passed");
const readyForDecisionInput = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-review-decision-package-v1",
  source: {
    reviewGateFile,
    outDir,
  },
  summary: {
    assetId: gateSummary.assetId ?? 1663210,
    entityId: gateSummary.entityId ?? "skill:1663210",
    candidateId: gateSummary.candidateId ?? "draft-delta-proof-sf32-owner",
    checks: readinessChecks.length,
    failedChecks: failedChecks.length,
    readyForDecisionInput,
    targetCandidateStatus: gateSummary.targetCandidateStatus ?? null,
    reviewBlockerPresent: gateSummary.reviewBlockerPresent === true,
    decisionStatuses: template.allowedStatuses ?? ["approved", "rejected"],
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForDecisionInput
        ? "external-evidence-submission-review-decision-package-ready"
        : "external-evidence-submission-review-decision-package-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForDecisionInput
        ? "Le paquet de decision peut etre rempli par un reviewer humain, sans action automatique."
        : "Le paquet de decision reste bloque tant que la revue humaine n'est pas ouverte.",
      nextAction: readyForDecisionInput
        ? "Renseigner une decision approved ou rejected dans une etape separee, puis l'auditer."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  readinessChecks,
  targetCandidate: reviewGate.targetCandidate ?? null,
  decisionInputTemplate: {
    candidateId: gateSummary.candidateId ?? "draft-delta-proof-sf32-owner",
    allowedStatuses: template.allowedStatuses ?? ["approved", "rejected"],
    requiredFields: [
      "reviewer.id",
      "reviewer.date",
      "reviewer.status",
      "reviewer.decision",
      "reviewer.reason",
      "reviewer.sourceRechecked",
    ],
    requiredStatusValues: ["approved", "rejected"],
    blockedStatusValues: ["pending"],
    forbiddenActions: [
      "ecrire automatiquement dans inputs/external-evidence-candidates.json",
      "changer reliableDps",
      "activer un bridge",
      "promouvoir le delta",
      "utiliser la decision pour le ranking sans audit de promotion separe",
    ],
  },
  safeguards: [
    "Ce paquet prepare une decision; il ne l'applique pas.",
    "Une decision approved devra encore passer par un audit de promotion separe.",
    "Une decision rejected doit conserver le delta hors reliableDps.",
    "Aucune sortie ne peut modifier reliableDps, le ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-review-decision-package.json");
const markdownFile = path.join(outDir, "external-evidence-submission-review-decision-package.md");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(markdownFile, renderDecisionMarkdown(report));
console.log(JSON.stringify({ outFile, markdownFile, summary: report.summary }, null, 2));
