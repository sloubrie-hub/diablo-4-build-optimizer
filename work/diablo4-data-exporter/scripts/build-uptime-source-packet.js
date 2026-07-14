const fs = require("fs");
const path = require("path");

const uptimeLocalConclusionFile = process.argv[2] ?? "outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json";
const externalDeltaWorkorderFile = process.argv[3] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const externalEvidenceIntakeFile = process.argv[4] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const outDir = process.argv[5] ?? "outputs/diablo4-uptime-source-packet";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const uptime = readJson(uptimeLocalConclusionFile);
const workorder = readJson(externalDeltaWorkorderFile);
const intake = readJson(externalEvidenceIntakeFile);

const uptimeTask = (workorder.tasks ?? []).find((task) => task.id === "delta-proof-uptime") ?? null;
const acceptedEvidence = (intake.candidates ?? []).filter((candidate) =>
  candidate.status === "accepted"
  && candidate.domain === "delta-1663210"
  && candidate.claim?.type === "uptime"
  && candidate.claim?.field === "uptime");

const rejectedLocalSignals = (uptime.localEvidenceChecks ?? []).map((check) => ({
  id: check.id,
  status: check.status,
  sourceAssessment: check.sourceAssessment,
  finding: check.finding,
  reasonRejectedForReliableUptime: check.id === "neighbor-probability-formulas"
    ? "formules de probabilite voisines sans reference a SF_32/SF_33"
    : check.id === "sf28-sf29-role"
      ? "SF_28/SF_29 restent des probabilites/procs locaux, pas une uptime prouvee"
      : check.id === "probability-chain"
        ? "chaine de probabilite sans lien a la branche boostee ni duree"
        : check.id === "neighbor-dependency"
          ? "proximite du hash bonus sans dependance d'uptime exploitable"
          : "hypothese utilisateur exploitable seulement en what-if separe",
  metric: check.metric ?? null,
}));

const sourcePacket = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "uptime-source-packet-v1",
  source: {
    uptimeLocalConclusionFile,
    externalDeltaWorkorderFile,
    externalEvidenceIntakeFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    targetField: "uptime",
    acceptedEvidence: acceptedEvidence.length,
    rejectedLocalSignals: rejectedLocalSignals.length,
    localReliableEvidenceExhausted: uptime.summary?.localReliableEvidenceExhausted === true,
    userScenarioSeparated: uptime.summary?.userScenarioSeparated === true,
    hasExplicitUptime: uptime.summary?.hasExplicitUptime === true,
    hasNumericUptime: uptime.summary?.hasNumericUptime === true,
    nextTaskId: uptimeTask?.id ?? "delta-proof-uptime",
    nextAcceptedClaimType: uptimeTask?.claim?.type ?? "uptime",
    nextAcceptedClaimField: uptimeTask?.claim?.field ?? "uptime",
    parserBridgeRequired: true,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: acceptedEvidence.length
        ? "uptime-source-packet-has-accepted-evidence"
        : "uptime-source-packet-awaiting-source",
      confidence: "high",
      promotionReady: false,
      finding: acceptedEvidence.length
        ? "Une preuve externe uptime est acceptee pour revue bridge, mais aucun DPS fiable n'est modifie."
        : "Aucune preuve source-backed ne donne encore une uptime fiable pour 1663210; l'uptime utilisateur reste separee.",
      nextAction: acceptedEvidence.length
        ? "Construire un parser bridge uptime avec bornage numerique et invariants de promotion separes."
        : "Fournir une source officielle, extracted-game-data ou documented-dataset contenant 1663210 + uptime numerique.",
    },
  },
  requiredClaim: {
    domain: "delta-1663210",
    assetId: 1663210,
    entityId: "skill:1663210",
    type: uptimeTask?.claim?.type ?? "uptime",
    field: uptimeTask?.claim?.field ?? "uptime",
    mustContain: uptimeTask?.mustContain ?? ["1663210", "uptime"],
    acceptedSourceKinds: uptimeTask?.requiredSourceKinds ?? ["official", "extracted-game-data", "tool-output", "documented-dataset"],
    rejects: uptimeTask?.rejects ?? ["SF_28/SF_29 sans SF_32/SF_33", "probabilite locale seule", "valeur utilisateur non sourcee"],
  },
  rejectedLocalSignals,
  intakeTemplate: uptimeTask?.intakeTemplate ?? null,
  parserBridgeContract: {
    id: "parser-bridge-uptime-1663210",
    status: acceptedEvidence.length ? "ready-after-review" : "blocked-waiting-for-source",
    input: "accepted external evidence claim uptime / uptime",
    output: "normalized uptime mapping for asset 1663210",
    forbiddenOutputs: ["reliableDps", "promotionReady", "canUseForReliableDps"],
    requiredInvariants: [
      "accepted evidence exists",
      "claim contains 1663210 and uptime",
      "uptime value is numeric and bounded between 0 and 1",
      "reliableDps remains strict-only",
      "delta 48960 remains blocked until SF_32 and SF_33 are also proven",
    ],
  },
  acceptedEvidence: acceptedEvidence.map((candidate) => ({
    id: candidate.id,
    source: candidate.source,
    claim: candidate.claim,
    reviewer: candidate.reviewer,
  })),
  safeguards: [
    "Ce packet ne cree aucune preuve.",
    "Les probabilites locales SF_28/SF_29 restent rejetees pour reliableDps.",
    "Une preuve acceptee ouvre seulement un bridge parseur.",
    "Le delta 48960 reste exclu de reliableDps.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "uptime-source-packet.json");
fs.writeFileSync(outFile, JSON.stringify(sourcePacket, null, 2));
console.log(JSON.stringify({ outFile, summary: sourcePacket.summary }, null, 2));
