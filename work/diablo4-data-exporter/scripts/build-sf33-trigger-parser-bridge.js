const fs = require("fs");
const path = require("path");

const sourcePacketFile = process.argv[2] ?? "outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json";
const reliableGatesFile = process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-sf33-trigger-parser-bridge";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function acceptedEvidenceContainsRequiredTerms(evidence, requiredTerms) {
  const text = [
    evidence.claim?.value,
    evidence.claim?.excerpt,
    evidence.claim?.mapping,
  ].map((value) => String(value ?? "").toLowerCase()).join(" ");
  return requiredTerms.every((term) => text.includes(String(term).toLowerCase()));
}

const packet = readJson(sourcePacketFile);
const reliableGates = readJson(reliableGatesFile);
const requiredTerms = packet.requiredClaim?.mustContain ?? ["1663210", "Mod.SoilRuler_B", "SF_33"];
const acceptedEvidence = (packet.acceptedEvidence ?? []).filter((evidence) =>
  evidence.claim?.type === "sf33-trigger"
  && evidence.claim?.field === "Mod.SoilRuler_B"
  && acceptedEvidenceContainsRequiredTerms(evidence, requiredTerms));

const mappings = acceptedEvidence.map((evidence) => ({
  id: "sf33-trigger-soilruler-b",
  assetId: packet.summary?.assetId ?? 1663210,
  entityId: packet.summary?.entityId ?? "skill:1663210",
  trigger: "Mod.SoilRuler_B",
  targetField: "SF_33",
  sourceEvidenceId: evidence.id,
  status: "normalized-from-accepted-evidence",
  canModifyReliableDps: false,
}));

const bridgeReady = mappings.length > 0;
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-trigger-parser-bridge-v1",
  source: {
    sourcePacketFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: packet.summary?.assetId ?? 1663210,
    entityId: packet.summary?.entityId ?? "skill:1663210",
    trigger: "Mod.SoilRuler_B",
    targetField: "SF_33",
    acceptedEvidence: acceptedEvidence.length,
    mappings: mappings.length,
    bridgeReady,
    reliableDpsStillBlocked: reliableGates.summary?.canUseForReliableDps === false,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: bridgeReady
        ? "sf33-trigger-parser-bridge-ready"
        : "sf33-trigger-parser-bridge-blocked",
      confidence: "high",
      promotionReady: false,
      finding: bridgeReady
        ? "Le mapping Mod.SoilRuler_B -> SF_33 peut etre normalise depuis une preuve acceptee, sans modifier reliableDps."
        : "Le bridge parser SF_33 reste bloque faute de preuve acceptee.",
      nextAction: bridgeReady
        ? "Consommer ce mapping dans une conclusion SF_33 dediee, puis garder le delta bloque tant que SF_32 et uptime manquent."
        : "Ajouter une preuve acceptee au packet source SF_33 avant de produire un mapping.",
    },
  },
  mappings,
  rejectedLocalSignals: packet.rejectedLocalSignals ?? [],
  requiredInvariants: [
    "Le mapping exige une preuve acceptee sf33-trigger / Mod.SoilRuler_B.",
    "Le mapping ne modifie pas reliableDps.",
    "Le mapping ne ferme pas SF_32 ni uptime.",
    "Le delta 48960 reste hors ranking fiable tant que toutes les gates ne passent pas.",
  ],
  safeguards: [
    "Bridge parser cible uniquement le trigger SF_33.",
    "Aucun score n'est recalcalue par ce script.",
    "Aucune promotion fiable n'est autorisee par un mapping SF_33 seul.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-trigger-parser-bridge.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
