const fs = require("fs");
const path = require("path");

const sf32BridgeFile = process.argv[2] ?? "outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json";
const sf33BridgeFile = process.argv[3] ?? "outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json";
const uptimeBridgeFile = process.argv[4] ?? "outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json";
const reliableGatesFile = process.argv[5] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[6] ?? "outputs/diablo4-delta-bridge-readiness";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function gateFromBridge({ id, title, bridge, requiredMapping }) {
  const mappingCount = Number(bridge.summary?.mappings ?? 0);
  const bridgeReady = bridge.summary?.bridgeReady === true && mappingCount > 0;
  return {
    id,
    title,
    status: bridgeReady ? "ready-for-combined-review" : "blocked",
    bridgeReady,
    mappings: mappingCount,
    acceptedEvidence: Number(bridge.summary?.acceptedEvidence ?? 0),
    requiredMapping,
    assessment: bridge.summary?.assessment?.kind ?? null,
    canModifyReliableDps: bridge.summary?.canModifyReliableDps === true,
  };
}

const sf32Bridge = readJson(sf32BridgeFile);
const sf33Bridge = readJson(sf33BridgeFile);
const uptimeBridge = readJson(uptimeBridgeFile);
const reliableGates = readJson(reliableGatesFile);

const gates = [
  gateFromBridge({
    id: "sf32-owner",
    title: "Ownership SF_32",
    bridge: sf32Bridge,
    requiredMapping: "selector:949 -> SF_32",
  }),
  gateFromBridge({
    id: "sf33-trigger",
    title: "Trigger SF_33",
    bridge: sf33Bridge,
    requiredMapping: "Mod.SoilRuler_B -> SF_33",
  }),
  gateFromBridge({
    id: "uptime",
    title: "Uptime",
    bridge: uptimeBridge,
    requiredMapping: "1663210 -> uptime numeric 0..1",
  }),
];

const readyGates = gates.filter((gate) => gate.bridgeReady);
const blockedGates = gates.filter((gate) => !gate.bridgeReady);
const allBridgeReady = blockedGates.length === 0;
const anyUnsafeBridge = gates.some((gate) => gate.canModifyReliableDps);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-bridge-readiness-v1",
  source: {
    sf32BridgeFile,
    sf33BridgeFile,
    uptimeBridgeFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    strictDps: reliableGates.summary?.strictDps ?? 163200,
    blockedDeltaDps: reliableGates.summary?.blockedDeltaDps ?? 48960,
    gates: gates.length,
    readyGates: readyGates.length,
    blockedGates: blockedGates.length,
    allBridgeReady,
    reliableDpsStillBlocked: reliableGates.summary?.canUseForReliableDps === false,
    anyUnsafeBridge,
    canUseForUserWhatIf: allBridgeReady,
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: allBridgeReady
        ? "delta-bridge-ready-for-manual-promotion-review"
        : "delta-bridge-blocked",
      confidence: "high",
      promotionReady: false,
      finding: allBridgeReady
        ? "Les trois bridges delta ont des mappings, mais la promotion fiable reste manuelle et interdite par defaut."
        : "Le delta 48960 reste bloque car tous les bridges SF_32, SF_33 et uptime ne sont pas prets.",
      nextAction: allBridgeReady
        ? "Ajouter une etape de revue/promotion separee qui recalculera les gates fiables sans modifier reliableDps automatiquement."
        : `Completer les gates bloquees: ${blockedGates.map((gate) => gate.id).join(", ")}.`,
    },
  },
  gates,
  blockedGateIds: blockedGates.map((gate) => gate.id),
  requiredInvariants: [
    "Les trois bridges SF_32, SF_33 et uptime doivent etre prets ensemble.",
    "Chaque bridge doit rester canModifyReliableDps=false.",
    "Une readiness combinee n'est pas une promotion DPS.",
    "La promotion fiable exige une etape separee de revue et recalcul des gates.",
  ],
  safeguards: [
    "Ce rapport ne recalcule aucun DPS.",
    "Ce rapport ne modifie pas reliableDps.",
    "Un bridge partiel garde le delta entierement bloque.",
    "Un bridge complet ouvre seulement une revue de promotion manuelle.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-bridge-readiness.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
