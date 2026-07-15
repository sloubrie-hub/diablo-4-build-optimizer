const fs = require("fs");
const path = require("path");
const { SF32_OWNER_CLAIM } = require("../src/delta-evidence-contract");

const sourcePacketFile = process.argv[2] ?? "outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json";
const reliableGatesFile = process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-sf32-owner-parser-bridge";

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
const requiredTerms = packet.requiredClaim?.mustContain ?? [...SF32_OWNER_CLAIM.mustContain];
const requiredField = packet.requiredClaim?.field ?? SF32_OWNER_CLAIM.field;
const acceptedEvidence = (packet.acceptedEvidence ?? []).filter((evidence) =>
  evidence.claim?.type === SF32_OWNER_CLAIM.type
  && evidence.claim?.field === requiredField
  && acceptedEvidenceContainsRequiredTerms(evidence, requiredTerms));

const mappings = acceptedEvidence.map((evidence) => ({
  id: "sf32-owner-eattrib-994-local-role-949",
  assetId: packet.summary?.assetId ?? 1663210,
  entityId: packet.summary?.entityId ?? "skill:1663210",
  sourceAnchor: "eAttrib:994",
  localRole: "local-role:949",
  ownerField: "SF_32",
  sourceEvidenceId: evidence.id,
  status: "normalized-from-accepted-evidence",
  canModifyReliableDps: false,
}));

const bridgeReady = mappings.length > 0;
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-owner-parser-bridge-v1",
  source: {
    sourcePacketFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: packet.summary?.assetId ?? 1663210,
    entityId: packet.summary?.entityId ?? "skill:1663210",
    sourceAnchor: "eAttrib:994",
    localRole: "local-role:949",
    ownerField: "SF_32",
    acceptedEvidence: acceptedEvidence.length,
    mappings: mappings.length,
    bridgeReady,
    reliableDpsStillBlocked: reliableGates.summary?.canUseForReliableDps === false,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: bridgeReady
        ? "sf32-owner-parser-bridge-ready"
        : "sf32-owner-parser-bridge-blocked",
      confidence: "high",
      promotionReady: false,
      finding: bridgeReady
        ? "Le mapping eAttrib:994 + local-role:949 -> SF_32 peut etre normalise depuis une preuve acceptee, sans modifier reliableDps."
        : "Le bridge parser SF_32 reste bloque faute de preuve acceptee.",
      nextAction: bridgeReady
        ? "Consommer ce mapping dans une conclusion SF_32 dediee, puis garder le delta bloque tant que SF_33 et uptime manquent."
        : "Ajouter une preuve acceptee au packet source SF_32 avant de produire un mapping.",
    },
  },
  mappings,
  rejectedLocalSignals: packet.rejectedLocalSignals ?? [],
  requiredInvariants: [
    "Le mapping exige une preuve acceptee sf32-field-ownership / eAttrib:994 + local-role:949.",
    "Le mapping ne modifie pas reliableDps.",
    "Le mapping ne ferme pas SF_33 ni uptime.",
    "Le delta 48960 reste hors ranking fiable tant que toutes les gates ne passent pas.",
  ],
  safeguards: [
    "Bridge parser cible uniquement l'ownership SF_32.",
    "Aucun score n'est recalcalue par ce script.",
    "Aucune promotion fiable n'est autorisee par un mapping SF_32 seul.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf32-owner-parser-bridge.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
