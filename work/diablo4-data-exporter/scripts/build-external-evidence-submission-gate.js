const fs = require("fs");
const path = require("path");

const submissionPackFile = process.argv[2] ?? "outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json";
const outDir = process.argv[3] ?? "outputs/diablo4-external-evidence-submission-gate";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}

function containsPlaceholder(value) {
  return String(value ?? "").includes("A REMPLIR") || String(value ?? "").includes("YYYY-MM-DD");
}

const pack = readJson(submissionPackFile);
const summary = pack.summary ?? {};
const task = pack.targetTask ?? {};
const candidate = pack.candidateSnippet ?? {};
const source = candidate.source ?? {};
const claim = candidate.claim ?? {};
const reviewer = candidate.reviewer ?? {};
const evidenceText = `${source.title} ${source.url} ${source.version} ${source.capturedAt} ${claim.value} ${claim.excerpt} ${claim.mapping}`;
const mustContain = task.mustContain ?? [];

const gateChecks = [
  {
    id: "candidate-snippet-ready",
    status: summary.candidateSnippetReady === true && candidate.id ? "passed" : "failed",
    finding: "Le paquet doit fournir un brouillon candidat.",
  },
  {
    id: "reviewer-pending",
    status: reviewer.status === "pending" ? "passed" : "failed",
    finding: "La soumission doit rester pending avant revue.",
  },
  {
    id: "source-reference-filled",
    status: hasText(source.title) && (hasText(source.url) || hasText(source.version)) ? "passed" : "failed",
    finding: "La source doit avoir un titre et une URL ou version.",
  },
  {
    id: "no-placeholders",
    status: containsPlaceholder(evidenceText) ? "failed" : "passed",
    finding: "Aucun champ A REMPLIR ou YYYY-MM-DD ne doit rester avant copie.",
  },
  {
    id: "must-contain-satisfied",
    status: mustContain.every((term) => evidenceText.toLowerCase().includes(String(term).toLowerCase())) ? "passed" : "failed",
    finding: `La preuve doit contenir ${mustContain.join(" + ")}.`,
  },
  {
    id: "claim-target-matches",
    status: claim.type === summary.claimType && claim.field === summary.claimField ? "passed" : "failed",
    finding: "Le claim doit correspondre a la tache cible.",
  },
  {
    id: "no-write-in-gate",
    status: summary.writesIntake === false && summary.writesTargetDataset === false ? "passed" : "failed",
    finding: "Le gate ne doit rien ecrire.",
  },
];

const failedChecks = gateChecks.filter((check) => check.status !== "passed");
const readyForIntakeCopy = failedChecks.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-submission-gate-v1",
  source: {
    submissionPackFile,
    outDir,
  },
  summary: {
    assetId: summary.assetId ?? 1663210,
    entityId: summary.entityId ?? "skill:1663210",
    candidateId: candidate.id ?? null,
    nextTaskId: summary.nextTaskId ?? null,
    claimType: summary.claimType ?? null,
    claimField: summary.claimField ?? null,
    checks: gateChecks.length,
    failedChecks: failedChecks.length,
    readyForIntakeCopy,
    reviewerStatus: reviewer.status ?? null,
    writesIntake: false,
    writesTargetDataset: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: readyForIntakeCopy
        ? "external-evidence-submission-gate-ready-for-copy"
        : "external-evidence-submission-gate-blocked",
      confidence: "high",
      promotionReady: false,
      finding: readyForIntakeCopy
        ? "Le brouillon est assez complet pour une copie manuelle pending vers l'intake."
        : "Le brouillon ne peut pas encore etre copie vers l'intake.",
      nextAction: readyForIntakeCopy
        ? "Copier manuellement le candidat en pending, puis relancer l'audit intake."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  gateChecks,
  candidateToCopy: readyForIntakeCopy ? candidate : null,
  manualCopyTarget: "inputs/external-evidence-candidates.json",
  safeguards: [
    "Ce gate ne modifie pas inputs/external-evidence-candidates.json.",
    "readyForIntakeCopy ne vaut pas approved.",
    "acceptedForBridge reste false.",
    "Aucune sortie ne peut modifier reliableDps, ranking ou promotionReady.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-submission-gate.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
