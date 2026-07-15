const fs = require("fs");
const path = require("path");

const inputs = {
  local949RoleDecodeAudit: process.argv[2] ?? "outputs/diablo4-local-949-role-decode-audit/local-949-role-decode-audit.json",
  selectorAssetLayoutParser: process.argv[3] ?? "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  outDir: process.argv[4] ?? "outputs/diablo4-selector-asset-record-parser-contract",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fieldRolesFor(layout) {
  return (layout?.fieldRoles ?? []).map((role) => ({
    offset: role.offset,
    role: role.role,
    expected: role.expected ?? null,
    status: role.status,
  }));
}

function findLayout(layouts, layoutId) {
  return layouts.find((layout) => layout.layoutId === layoutId) ?? null;
}

const roleAudit = readJson(inputs.local949RoleDecodeAudit);
const layoutParser = readJson(inputs.selectorAssetLayoutParser);
const layouts = layoutParser.layouts ?? [];

const noLocal994 = findLayout(layouts, "no-local-metadata-layout");
const compact949 = findLayout(layouts, "compact-metadata-scale-layout");
const variant949 = findLayout(layouts, "wrapper-or-variant-layout");
const roleDecoded = roleAudit.summary?.roleDecoded === true;
const localRole = roleAudit.summary?.localRole ?? "unknown";
const contractReady = roleDecoded && Boolean(noLocal994) && Boolean(compact949) && Boolean(variant949);

const parserLayouts = [
  {
    id: "bonus-anchor-994",
    selector: 994,
    sourceLayoutId: noLocal994?.layoutId ?? null,
    parserStatus: "readable-anchor",
    semanticStatus: "source-backed-bonus-anchor",
    fields: fieldRolesFor(noLocal994),
    acceptedUses: [
      "identifier un record selector -> asset",
      "relier Bonus_Percent_Per_Power a eAttrib 994",
      "alimenter les preuves de structure du parser",
    ],
    forbiddenUses: [
      "calculer reliableDps",
      "deduire SF_32",
      "promouvoir un bucket additif/multiplicatif",
    ],
  },
  {
    id: "local-compact-949",
    selector: 949,
    sourceLayoutId: compact949?.layoutId ?? null,
    parserStatus: "readable-local-payload",
    semanticStatus: "payload-unresolved",
    fields: fieldRolesFor(compact949),
    acceptedUses: [
      "lire selector + assetRef + tail metadata/opcode/scale",
      "isoler le payload compact de 1663210",
      "preparer une preuve source-backed future",
    ],
    forbiddenUses: [
      "traiter 949 comme eAttrib bonus",
      "traiter metadata/opcode/scale comme SF_32 prouve",
      "ouvrir un bridge DPS",
    ],
  },
  {
    id: "local-variant-949",
    selector: 949,
    sourceLayoutId: variant949?.layoutId ?? null,
    parserStatus: "readable-local-variant",
    semanticStatus: "payload-unresolved",
    fields: fieldRolesFor(variant949),
    acceptedUses: [
      "detecter la surcharge de layout de 949",
      "separer variant/wrapper du compact metadata/scale",
    ],
    forbiddenUses: [
      "generaliser le tail compact a tous les records 949",
      "deduire une semantique globale du selecteur 949",
    ],
  },
];

const requiredInvariants = [
  {
    id: "record-head-selector-offset",
    status: parserLayouts.every((layout) => layout.fields.some((field) => field.role === "selector" && field.offset === 0)) ? "passed" : "failed",
    rule: "chaque layout expose selector a l'offset 0",
  },
  {
    id: "record-head-asset-offset",
    status: parserLayouts.every((layout) => layout.fields.some((field) => field.role === "assetRef" && field.offset === 4)) ? "passed" : "failed",
    rule: "chaque layout expose assetRef a l'offset +4",
  },
  {
    id: "compact-tail-not-semantic-proof",
    status: roleAudit.summary?.bridgeReady === false ? "passed" : "failed",
    rule: "le tail compact metadata/opcode/scale ne peut pas ouvrir un bridge",
  },
  {
    id: "reliable-dps-immutable",
    status: roleAudit.summary?.canModifyReliableDps === false ? "passed" : "failed",
    rule: "le contrat parser ne modifie jamais reliableDps",
  },
];

const failedInvariants = requiredInvariants.filter((item) => item.status !== "passed");

const contract = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-asset-record-parser-contract-v1",
  source: inputs,
  summary: {
    parserRoot: "selector-asset-record",
    assetId: 1663210,
    entityId: "skill:1663210",
    localRole,
    contractReady,
    parserLayouts: parserLayouts.length,
    failedInvariants: failedInvariants.length,
    bonusAnchorSelector: 994,
    localPayloadSelector: 949,
    compactTailReadable: compact949 != null,
    variantTailReadable: variant949 != null,
    semanticBridgeReady: false,
    acceptedForBridge: false,
    writesTargetDataset: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: contractReady
        ? "selector-asset-record-parser-contract-ready-structural-only"
        : "selector-asset-record-parser-contract-incomplete",
      confidence: contractReady ? "high" : "medium",
      promotionReady: false,
      finding: contractReady
        ? "Le contrat parser peut lire les layouts selector->asset 994 et 949, mais la semantique du payload compact reste non promouvable."
        : "Le contrat parser manque encore un layout requis.",
      nextAction: contractReady
        ? "Implementer un parser structurel read-only qui emet des records et des payloads, puis attendre une preuve source-backed avant bridge DPS."
        : "Completer les layouts avant implementation.",
    },
  },
  parserLayouts,
  requiredInvariants,
  failedInvariants,
  outputContract: {
    recordShape: {
      selector: "number",
      assetRef: "number",
      layoutId: "string",
      payloadStatus: "source-backed-bonus-anchor | payload-unresolved",
      fields: "array<{offset, role, value?, status}>",
      evidence: "array",
    },
    forbiddenOutputFields: [
      "reliableDps",
      "promotionReady",
      "canUseForReliableDps",
      "acceptedForBridge",
    ],
  },
  safeguards: {
    readOnlyParser: true,
    noTargetDatasetWrite: true,
    noIntakeWrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "selector-asset-record-parser-contract.json");
fs.writeFileSync(outFile, JSON.stringify(contract, null, 2));
console.log(JSON.stringify({ outFile, summary: contract.summary }, null, 2));
