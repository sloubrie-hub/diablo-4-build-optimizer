const fs = require("fs");
const path = require("path");

const sourcePacketFile = process.argv[2] ?? "outputs/diablo4-uptime-source-packet/uptime-source-packet.json";
const reliableGatesFile = process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-uptime-parser-bridge";

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

function parseUptimeValue(evidence) {
  const candidates = [
    evidence.claim?.numericValue,
    evidence.claim?.uptime,
    evidence.claim?.value,
  ];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) return numeric;
  }

  const text = [
    evidence.claim?.value,
    evidence.claim?.excerpt,
    evidence.claim?.mapping,
  ].map((value) => String(value ?? "")).join(" ");
  const percent = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (percent) return Number(percent[1].replace(",", ".")) / 100;
  const decimal = text.match(/\b0(?:[.,]\d+)?\b|\b1(?:[.,]0+)?\b/);
  if (decimal) return Number(decimal[0].replace(",", "."));
  return null;
}

function validUptime(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

const packet = readJson(sourcePacketFile);
const reliableGates = readJson(reliableGatesFile);
const requiredTerms = packet.requiredClaim?.mustContain ?? ["1663210", "uptime"];
const acceptedEvidence = (packet.acceptedEvidence ?? [])
  .map((evidence) => ({ evidence, uptime: parseUptimeValue(evidence) }))
  .filter(({ evidence, uptime }) =>
    evidence.claim?.type === "uptime"
    && evidence.claim?.field === "uptime"
    && acceptedEvidenceContainsRequiredTerms(evidence, requiredTerms)
    && validUptime(uptime));

const mappings = acceptedEvidence.map(({ evidence, uptime }) => ({
  id: "uptime-1663210",
  assetId: packet.summary?.assetId ?? 1663210,
  entityId: packet.summary?.entityId ?? "skill:1663210",
  targetField: "uptime",
  uptime,
  sourceEvidenceId: evidence.id,
  status: "normalized-from-accepted-evidence",
  canModifyReliableDps: false,
  canUseForUserWhatIf: true,
}));

const bridgeReady = mappings.length > 0;
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "uptime-parser-bridge-v1",
  source: {
    sourcePacketFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: packet.summary?.assetId ?? 1663210,
    entityId: packet.summary?.entityId ?? "skill:1663210",
    targetField: "uptime",
    acceptedEvidence: acceptedEvidence.length,
    mappings: mappings.length,
    bridgeReady,
    reliableDpsStillBlocked: reliableGates.summary?.canUseForReliableDps === false,
    canModifyReliableDps: false,
    canUseForUserWhatIf: bridgeReady,
    promotionReady: false,
    assessment: {
      kind: bridgeReady
        ? "uptime-parser-bridge-ready"
        : "uptime-parser-bridge-blocked",
      confidence: "high",
      promotionReady: false,
      finding: bridgeReady
        ? "Une uptime numerique source-backed peut etre normalisee pour le what-if, sans modifier reliableDps."
        : "Le bridge parser uptime reste bloque faute de preuve numerique acceptee.",
      nextAction: bridgeReady
        ? "Consommer cette uptime comme mapping dedie, puis garder le delta bloque tant que SF_32 et SF_33 manquent."
        : "Ajouter une preuve acceptee avec uptime numerique bornee entre 0 et 1.",
    },
  },
  mappings,
  rejectedLocalSignals: packet.rejectedLocalSignals ?? [],
  requiredInvariants: [
    "Le mapping exige une preuve acceptee uptime / uptime.",
    "La valeur uptime doit etre numerique et bornee entre 0 et 1.",
    "Le mapping ne modifie pas reliableDps.",
    "Le mapping ne ferme pas SF_32 ni SF_33.",
    "Le delta 48960 reste hors ranking fiable tant que toutes les gates ne passent pas.",
  ],
  safeguards: [
    "Bridge parser cible uniquement l'uptime.",
    "Aucun score fiable n'est recalcalue par ce script.",
    "Une uptime source-backed seule peut alimenter un what-if controle, pas une promotion fiable.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "uptime-parser-bridge.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
