const fs = require("fs");
const path = require("path");

const sf32LocalConclusionFile = process.argv[2] ?? "outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json";
const externalDeltaWorkorderFile = process.argv[3] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const externalEvidenceIntakeFile = process.argv[4] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const outDir = process.argv[5] ?? "outputs/diablo4-sf32-owner-source-packet";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const sf32 = readJson(sf32LocalConclusionFile);
const workorder = readJson(externalDeltaWorkorderFile);
const intake = readJson(externalEvidenceIntakeFile);

const sf32Task = (workorder.tasks ?? []).find((task) => task.id === "delta-proof-sf32-owner") ?? null;
const acceptedEvidence = (intake.candidates ?? []).filter((candidate) =>
  candidate.status === "accepted"
  && candidate.domain === "delta-1663210"
  && candidate.claim?.type === "sf32-field-ownership"
  && candidate.claim?.field === "selector:949");

const rejectedLocalSignals = (sf32.localEvidenceChecks ?? []).map((check) => ({
  id: check.id,
  sourceAssessment: check.sourceAssessment,
  finding: check.finding,
  reasonRejectedForOwnership: check.id === "selector-owner-fields"
    ? "selector 949 a plusieurs layouts; ownership non stable"
    : check.id === "second-compact-selector-949"
      ? "aucun second compact comparable hors 1663210"
      : check.id === "metadata-12337-scale-10"
        ? "metadata/scale est transverse et non proprietaire"
        : check.id === "named-local-source-table"
          ? "aucune table locale nommee ne relie selector 949 a SF_32"
          : "signal insuffisant pour nommer le champ proprietaire",
  metric: check.metric ?? null,
}));

const sourcePacket = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-owner-source-packet-v1",
  source: {
    sf32LocalConclusionFile,
    externalDeltaWorkorderFile,
    externalEvidenceIntakeFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    targetField: "SF_32",
    targetSelector: "selector:949",
    acceptedEvidence: acceptedEvidence.length,
    rejectedLocalSignals: rejectedLocalSignals.length,
    localEvidenceExhausted: sf32.summary?.sf32LocalExhausted === true,
    nextTaskId: sf32Task?.id ?? "delta-proof-sf32-owner",
    nextAcceptedClaimType: sf32Task?.claim?.type ?? "sf32-field-ownership",
    nextAcceptedClaimField: sf32Task?.claim?.field ?? "selector:949",
    parserBridgeRequired: true,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: acceptedEvidence.length
        ? "sf32-owner-source-packet-has-accepted-evidence"
        : "sf32-owner-source-packet-awaiting-source",
      confidence: "high",
      promotionReady: false,
      finding: acceptedEvidence.length
        ? "Une preuve externe SF_32 est acceptee pour revue bridge, mais aucun DPS fiable n'est modifie."
        : "Aucune preuve source-backed ne prouve encore selector:949 -> SF_32; les signaux locaux restent rejetes.",
      nextAction: acceptedEvidence.length
        ? "Construire un parser bridge cible avec invariants de promotion separes."
        : "Fournir une source officielle, extracted-game-data ou documented-dataset contenant 1663210 + selector:949 + SF_32.",
    },
  },
  requiredClaim: {
    domain: "delta-1663210",
    assetId: 1663210,
    entityId: "skill:1663210",
    type: sf32Task?.claim?.type ?? "sf32-field-ownership",
    field: sf32Task?.claim?.field ?? "selector:949",
    mustContain: sf32Task?.mustContain ?? ["1663210", "selector:949", "SF_32"],
    acceptedSourceKinds: sf32Task?.requiredSourceKinds ?? ["official", "extracted-game-data", "tool-output", "documented-dataset"],
    rejects: sf32Task?.rejects ?? ["layout-analogy", "metadata 12337 seule", "scale 10 seul", "label UI"],
  },
  rejectedLocalSignals,
  intakeTemplate: sf32Task?.intakeTemplate ?? null,
  parserBridgeContract: {
    id: "parser-bridge-sf32-owner-selector-949",
    status: acceptedEvidence.length ? "ready-after-review" : "blocked-waiting-for-source",
    input: "accepted external evidence claim sf32-field-ownership / selector:949",
    output: "normalized field ownership mapping selector:949 -> SF_32 for asset 1663210",
    forbiddenOutputs: ["reliableDps", "promotionReady", "canUseForReliableDps"],
    requiredInvariants: [
      "accepted evidence exists",
      "claim contains 1663210, selector:949 and SF_32",
      "reliableDps remains strict-only",
      "delta 48960 remains blocked until SF_33 and uptime are also proven",
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
    "Les signaux locaux rejetes restent rejetes.",
    "Une preuve acceptee ouvre seulement un bridge parseur.",
    "Le delta 48960 reste exclu de reliableDps.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf32-owner-source-packet.json");
fs.writeFileSync(outFile, JSON.stringify(sourcePacket, null, 2));
console.log(JSON.stringify({ outFile, summary: sourcePacket.summary }, null, 2));
