const fs = require("fs");
const path = require("path");

const decisionPackageFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-review-decision-package/external-evidence-submission-review-decision-package.json";
const decisionInputFile = process.argv[3] ?? "inputs/external-evidence-submission-review-decision.json";
const outDir = process.argv[4] ?? "outputs/diablo4-external-evidence-submission-review-decision-audit";

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function valueAt(object, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => current?.[key], object);
}

const decisionPackage = JSON.parse(fs.readFileSync(decisionPackageFile, "utf8"));
const decisionInput = readJsonIfExists(decisionInputFile);
const packageSummary = decisionPackage.summary ?? {};
const requiredFields = decisionPackage.decisionInputTemplate?.requiredFields ?? [];
const allowedStatuses = decisionPackage.decisionInputTemplate?.requiredStatusValues ?? ["approved", "rejected"];
const templateFile = path.join(outDir, "external-evidence-submission-review-decision.template.json");

const template = {
  schemaVersion: 1,
  candidateId: packageSummary.candidateId ?? "draft-delta-proof-sf32-owner",
  reviewer: {
    id: "",
    date: "",
    status: "",
    decision: "",
    reason: "",
    sourceRechecked: false,
  },
  safeguards: [
    "Renseigner uniquement apres revue humaine de la source exacte.",
    "Ne pas changer reliableDps dans ce fichier.",
    "approved ne vaut pas promotion automatique.",
    "rejected garde le delta hors reliableDps.",
  ],
};

const missingFields = requiredFields.filter((field) => {
  const value = valueAt(decisionInput, field);
  return value === undefined || value === null || value === "";
});
const reviewerStatus = decisionInput?.reviewer?.status ?? null;
const sourceRechecked = decisionInput?.reviewer?.sourceRechecked === true;
const hasInput = decisionInput !== null;

const auditChecks = [
  {
    id: "decision-package-ready",
    status: packageSummary.readyForDecisionInput === true ? "passed" : "failed",
    finding: packageSummary.readyForDecisionInput === true
      ? "Le paquet autorise une saisie de decision."
      : "Le paquet de decision est encore bloque.",
  },
  {
    id: "decision-input-present",
    status: hasInput ? "passed" : "failed",
    finding: hasInput
      ? "Un fichier de decision reviewer est present."
      : "Aucun fichier de decision reviewer n'est present.",
  },
  {
    id: "required-fields-complete",
    status: hasInput && missingFields.length === 0 ? "passed" : "failed",
    finding: hasInput && missingFields.length === 0
      ? "Tous les champs reviewer requis sont renseignes."
      : `Champs manquants: ${missingFields.join(", ") || "decision input absent"}.`,
  },
  {
    id: "status-allowed",
    status: allowedStatuses.includes(reviewerStatus) ? "passed" : "failed",
    finding: allowedStatuses.includes(reviewerStatus)
      ? `Le statut ${reviewerStatus} est autorise.`
      : `Le statut ${reviewerStatus ?? "absent"} n'est pas autorise.`,
  },
  {
    id: "source-rechecked",
    status: sourceRechecked ? "passed" : "failed",
    finding: sourceRechecked
      ? "La source est marquee comme reverifiee."
      : "La source n'est pas marquee comme reverifiee.",
  },
];

const failedChecks = auditChecks.filter((check) => check.status !== "passed");
const decisionAcceptedForPromotionReview = failedChecks.length === 0 && reviewerStatus === "approved";
const decisionRejected = failedChecks.length === 0 && reviewerStatus === "rejected";

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-review-decision-audit-v1",
  source: {
    decisionPackageFile,
    decisionInputFile,
    decisionInputPresent: hasInput,
    outDir,
  },
  summary: {
    assetId: packageSummary.assetId ?? 1663210,
    entityId: packageSummary.entityId ?? "skill:1663210",
    candidateId: packageSummary.candidateId ?? "draft-delta-proof-sf32-owner",
    checks: auditChecks.length,
    failedChecks: failedChecks.length,
    reviewerStatus,
    decisionAcceptedForPromotionReview,
    decisionRejected,
    readyForPromotionAudit: decisionAcceptedForPromotionReview,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: decisionAcceptedForPromotionReview
        ? "external-evidence-submission-review-decision-approved-for-promotion-audit"
        : decisionRejected
          ? "external-evidence-submission-review-decision-rejected"
          : "external-evidence-submission-review-decision-audit-blocked",
      confidence: "high",
      promotionReady: false,
      finding: decisionAcceptedForPromotionReview
        ? "La decision approved peut ouvrir un audit de promotion separe, sans changer reliableDps."
        : decisionRejected
          ? "La decision rejected garde le delta hors reliableDps."
          : "La decision reviewer n'est pas encore auditable.",
      nextAction: decisionAcceptedForPromotionReview
        ? "Construire un audit de promotion separe avant tout bridge ou changement reliableDps."
        : decisionRejected
          ? "Conserver le delta en what-if bloque et documenter le rejet."
          : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  auditChecks,
  decisionInput,
  template,
  safeguards: [
    "Cet audit ne modifie jamais inputs/external-evidence-candidates.json.",
    "Une decision approved ouvre seulement un audit de promotion separe.",
    "Une decision rejected ne peut pas modifier reliableDps.",
    "Aucune sortie ne peut modifier reliableDps, le ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-review-decision-audit.json");
writeJson(outFile, report);
writeJson(templateFile, template);
console.log(JSON.stringify({ outFile, templateFile, summary: report.summary }, null, 2));
