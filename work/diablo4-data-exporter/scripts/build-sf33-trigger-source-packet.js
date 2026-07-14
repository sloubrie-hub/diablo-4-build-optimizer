const fs = require("fs");
const path = require("path");

const deltaLocalConclusionFile = process.argv[2] ?? "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json";
const externalDeltaWorkorderFile = process.argv[3] ?? "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json";
const externalEvidenceIntakeFile = process.argv[4] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const outDir = process.argv[5] ?? "outputs/diablo4-sf33-trigger-source-packet";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const delta = readJson(deltaLocalConclusionFile);
const workorder = readJson(externalDeltaWorkorderFile);
const intake = readJson(externalEvidenceIntakeFile);

const sf33Task = (workorder.tasks ?? []).find((task) => task.id === "delta-proof-sf33-trigger") ?? null;
const acceptedEvidence = (intake.candidates ?? []).filter((candidate) =>
  candidate.status === "accepted"
  && candidate.domain === "delta-1663210"
  && candidate.claim?.type === "sf33-trigger"
  && candidate.claim?.field === "Mod.SoilRuler_B");

const sf33Gate = delta.gates?.sf33 ?? null;
const rejectedLocalSignals = (delta.sf33Evidence ?? []).map((check) => ({
  id: check.id,
  status: check.status,
  finding: check.finding,
  reasonRejectedForTrigger: check.id === "delta-parent-audit"
    ? "contexte structurel local sans parent ou consommateur exact"
    : check.id === "decoded-corpus-scan"
      ? "aucun parent/consommateur externe dans le corpus decode"
      : check.id === "systems-tuning-contexts"
        ? "SystemsTuningGlobals local ou hash seul ne prouve pas l'activation"
        : check.id === "nontext-table-signals"
          ? "occurrence non textuelle non reliee au trigger, selector ou asset cible"
          : "signal insuffisant pour mapper Mod.SoilRuler_B a une activation build-state",
  metric: check.metric ?? null,
}));

const sourcePacket = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-trigger-source-packet-v1",
  source: {
    deltaLocalConclusionFile,
    externalDeltaWorkorderFile,
    externalEvidenceIntakeFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    targetField: "SF_33",
    targetTrigger: "Mod.SoilRuler_B",
    acceptedEvidence: acceptedEvidence.length,
    rejectedLocalSignals: rejectedLocalSignals.length,
    localEvidenceExhausted: delta.summary?.sf33LocalExhausted === true,
    exactParentConsumerProven: delta.summary?.exactParentConsumerProven === true,
    nextTaskId: sf33Task?.id ?? "delta-proof-sf33-trigger",
    nextAcceptedClaimType: sf33Task?.claim?.type ?? "sf33-trigger",
    nextAcceptedClaimField: sf33Task?.claim?.field ?? "Mod.SoilRuler_B",
    parserBridgeRequired: true,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: acceptedEvidence.length
        ? "sf33-trigger-source-packet-has-accepted-evidence"
        : "sf33-trigger-source-packet-awaiting-source",
      confidence: "high",
      promotionReady: false,
      finding: acceptedEvidence.length
        ? "Une preuve externe SF_33 est acceptee pour revue bridge, mais aucun DPS fiable n'est modifie."
        : "Aucune preuve source-backed ne mappe encore Mod.SoilRuler_B vers SF_33; les signaux locaux restent rejetes.",
      nextAction: acceptedEvidence.length
        ? "Construire un parser bridge cible avec invariants de promotion separes."
        : "Fournir une source officielle, extracted-game-data ou documented-dataset contenant 1663210 + Mod.SoilRuler_B + SF_33.",
    },
  },
  requiredClaim: {
    domain: "delta-1663210",
    assetId: 1663210,
    entityId: "skill:1663210",
    type: sf33Task?.claim?.type ?? "sf33-trigger",
    field: sf33Task?.claim?.field ?? "Mod.SoilRuler_B",
    mustContain: sf33Task?.mustContain ?? ["1663210", "Mod.SoilRuler_B", "SF_33"],
    acceptedSourceKinds: sf33Task?.requiredSourceKinds ?? ["official", "extracted-game-data", "tool-output", "documented-dataset"],
    rejects: sf33Task?.rejects ?? ["chaine locale seule", "voisinage d'offset sans parent", "inference-only"],
  },
  localGate: sf33Gate,
  rejectedLocalSignals,
  intakeTemplate: sf33Task?.intakeTemplate ?? null,
  parserBridgeContract: {
    id: "parser-bridge-sf33-trigger-soilruler-b",
    status: acceptedEvidence.length ? "ready-after-review" : "blocked-waiting-for-source",
    input: "accepted external evidence claim sf33-trigger / Mod.SoilRuler_B",
    output: "normalized trigger mapping Mod.SoilRuler_B -> SF_33 for asset 1663210",
    forbiddenOutputs: ["reliableDps", "promotionReady", "canUseForReliableDps"],
    requiredInvariants: [
      "accepted evidence exists",
      "claim contains 1663210, Mod.SoilRuler_B and SF_33",
      "reliableDps remains strict-only",
      "delta 48960 remains blocked until SF_32 and uptime are also proven",
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
const outFile = path.join(outDir, "sf33-trigger-source-packet.json");
fs.writeFileSync(outFile, JSON.stringify(sourcePacket, null, 2));
console.log(JSON.stringify({ outFile, summary: sourcePacket.summary }, null, 2));
