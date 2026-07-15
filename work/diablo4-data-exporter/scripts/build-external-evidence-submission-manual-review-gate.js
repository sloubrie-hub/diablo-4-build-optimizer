const fs = require("fs");
const path = require("path");

const postCopyIntakeFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-post-copy-intake/external-evidence-submission-post-copy-intake.json";
const outDir = process.argv[3] ?? "outputs/diablo4-external-evidence-submission-manual-review-gate";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const postCopy = readJson(postCopyIntakeFile);
const summary = postCopy.summary ?? {};
const targetCandidate = postCopy.targetCandidate ?? null;
const targetBlockers = postCopy.blockers?.targetCandidateBlockers ?? [];

const gateChecks = [
  {
    id: "post-copy-ready-for-review",
    status: summary.readyForManualReview === true ? "passed" : "failed",
    finding: summary.readyForManualReview === true
      ? "La simulation post-copie est prete pour revue humaine."
      : "La simulation post-copie n'est pas prete pour revue humaine.",
  },
  {
    id: "candidate-pending",
    status: summary.targetCandidateStatus === "pending" ? "passed" : "failed",
    finding: summary.targetCandidateStatus === "pending"
      ? "Le candidat cible est en pending."
      : "Le candidat cible n'est pas en pending.",
  },
  {
    id: "manual-review-required",
    status: targetBlockers.includes("manual-review-required") ? "passed" : "failed",
    finding: targetBlockers.includes("manual-review-required")
      ? "La revue humaine reste explicitement requise."
      : "Le bloqueur manual-review-required est absent.",
  },
  {
    id: "not-approved",
    status: targetCandidate?.reviewer?.status !== "approved" ? "passed" : "failed",
    finding: targetCandidate?.reviewer?.status !== "approved"
      ? "Le candidat n'est pas approuve automatiquement."
      : "Le candidat est deja approved, ce qui est interdit ici.",
  },
  {
    id: "no-real-intake-write",
    status: summary.writesRealIntake === false ? "passed" : "failed",
    finding: summary.writesRealIntake === false
      ? "Aucune ecriture dans l'intake reel."
      : "Une ecriture intake reelle a ete detectee.",
  },
  {
    id: "not-accepted-for-bridge",
    status: summary.acceptedForBridge === false ? "passed" : "failed",
    finding: summary.acceptedForBridge === false
      ? "Aucun bridge n'accepte la preuve."
      : "Une acceptation bridge interdite a ete detectee.",
  },
];

const failedChecks = gateChecks.filter((check) => check.status !== "passed");
const readyForReviewerDecision = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-manual-review-gate-v1",
  source: {
    postCopyIntakeFile,
    outDir,
  },
  summary: {
    assetId: summary.assetId ?? 1663210,
    entityId: summary.entityId ?? "skill:1663210",
    candidateId: summary.candidateId ?? "draft-delta-proof-sf32-owner",
    checks: gateChecks.length,
    failedChecks: failedChecks.length,
    readyForReviewerDecision,
    targetCandidateStatus: summary.targetCandidateStatus ?? null,
    reviewBlockerPresent: targetBlockers.includes("manual-review-required"),
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForReviewerDecision
        ? "external-evidence-submission-manual-review-gate-ready"
        : "external-evidence-submission-manual-review-gate-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForReviewerDecision
        ? "Le candidat pending peut etre relu par un humain, sans approbation automatique."
        : "La revue humaine reste bloquee tant que la simulation post-copie n'est pas prete.",
      nextAction: readyForReviewerDecision
        ? "Verifier la source exacte, puis produire une decision reviewer separee."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  gateChecks,
  targetCandidate,
  reviewerDecisionTemplate: {
    candidateId: summary.candidateId ?? "draft-delta-proof-sf32-owner",
    allowedStatuses: ["approved", "rejected"],
    requiredReviewerInputs: [
      "reviewer.id",
      "reviewer.date",
      "reviewer.decision",
      "reviewer.reason",
      "source rechecked",
    ],
    forbiddenAutomaticActions: [
      "changer reviewer.status sans decision humaine",
      "modifier reliableDps",
      "accepter un bridge",
      "promouvoir le delta",
    ],
  },
  safeguards: [
    "Cette porte ne modifie jamais inputs/external-evidence-candidates.json.",
    "readyForReviewerDecision ne vaut pas approved.",
    "La decision humaine doit etre produite par une etape separee et auditee.",
    "Aucune sortie ne peut modifier reliableDps, ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-manual-review-gate.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
