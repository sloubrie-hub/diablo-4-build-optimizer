const fs = require("fs");
const path = require("path");

const inputs = {
  selectorAssetLayoutParser: process.argv[2] ?? "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  selectorAssetRecordParserContract: process.argv[3] ?? "outputs/diablo4-selector-asset-record-parser-contract/selector-asset-record-parser-contract.json",
  d4dataParserReferenceAudit: process.argv[4] ?? "outputs/diablo4-d4data-parser-reference-audit/d4data-parser-reference-audit.json",
  outDir: process.argv[5] ?? "outputs/diablo4-selector-asset-record-parser",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fieldValue(role, selector, assetRef) {
  if (role.role === "selector") return selector;
  if (role.role === "assetRef") return assetRef;
  if (Object.prototype.hasOwnProperty.call(role, "expected")) return role.expected;
  return null;
}

function payloadStatus(parserLayout) {
  return parserLayout.semanticStatus === "source-backed-bonus-anchor"
    ? "source-backed-bonus-anchor"
    : "payload-unresolved";
}

function recordStatus(parserLayout) {
  return parserLayout.semanticStatus === "source-backed-bonus-anchor"
    ? "read-only-source-backed-anchor"
    : "read-only-unresolved-payload";
}

function buildRecord({ parserLayout, layout, group, example, index }) {
  const assetRef = Number(example.assetCandidate);
  const selector = Number(group.selector);
  const fields = (layout.fieldRoles ?? []).map((role) => ({
    offset: role.offset,
    role: role.role,
    value: fieldValue(role, selector, assetRef),
    status: role.status,
    evidenceStatus: role.status === "candidate" || role.status === "not-proven" ? "structural-only" : "observed",
  }));

  return {
    id: `${parserLayout.id}:${selector}:${assetRef}:${example.offset}:${index}`,
    parserLayoutId: parserLayout.id,
    sourceLayoutId: layout.layoutId,
    selector,
    assetRef,
    layoutId: layout.layoutId,
    shape: group.shape,
    family: group.family,
    sourceFile: example.file,
    sourceOffset: example.offset,
    payloadStatus: payloadStatus(parserLayout),
    recordStatus: recordStatus(parserLayout),
    fields,
    labels: {
      selectorLabel: selector === 994 ? "Bonus_Percent_Per_Power" : null,
      assetLabel: (example.nearbyStrings ?? []).find((item) => item.includes("#")) ?? null,
    },
    evidence: [
      {
        kind: "layout-parser-example",
        sourceGroupKey: group.key,
        file: example.file,
        offset: example.offset,
        nearbyStrings: example.nearbyStrings ?? [],
      },
      {
        kind: "parser-contract",
        parserLayoutId: parserLayout.id,
        semanticStatus: parserLayout.semanticStatus,
        acceptedUses: parserLayout.acceptedUses ?? [],
        forbiddenUses: parserLayout.forbiddenUses ?? [],
      },
    ],
    safeguards: {
      writesTargetDataset: false,
      writesRealIntake: false,
      canModifyReliableDps: false,
      canUseForReliableDps: false,
      canUseForRanking: false,
      acceptedForBridge: false,
      promotionReady: false,
    },
  };
}

const layoutParser = readJson(inputs.selectorAssetLayoutParser);
const contract = readJson(inputs.selectorAssetRecordParserContract);
const d4dataReference = readJson(inputs.d4dataParserReferenceAudit);

const layoutsById = new Map((layoutParser.layouts ?? []).map((layout) => [layout.layoutId, layout]));
const contractLayouts = contract.parserLayouts ?? [];
const allowedLayouts = contractLayouts.filter((layout) =>
  ["bonus-anchor-994", "local-compact-949", "local-variant-949"].includes(layout.id)
);

const records = [];
const skippedGroups = [];

for (const parserLayout of allowedLayouts) {
  const layout = layoutsById.get(parserLayout.sourceLayoutId);
  if (!layout) continue;
  for (const group of layout.groups ?? []) {
    if (Number(group.selector) !== Number(parserLayout.selector)) {
      skippedGroups.push({
        reason: "selector-not-in-parser-contract",
        parserLayoutId: parserLayout.id,
        sourceLayoutId: layout.layoutId,
        selector: group.selector,
        key: group.key,
      });
      continue;
    }
    for (const [index, example] of (group.examples ?? []).entries()) {
      records.push(buildRecord({ parserLayout, layout, group, example, index }));
    }
  }
}

for (const layout of layoutParser.layouts ?? []) {
  if (allowedLayouts.some((parserLayout) => parserLayout.sourceLayoutId === layout.layoutId)) continue;
  for (const group of layout.groups ?? []) {
    skippedGroups.push({
      reason: "layout-not-in-parser-contract",
      sourceLayoutId: layout.layoutId,
      selector: group.selector,
      key: group.key,
    });
  }
}

const targetRecords = records.filter((record) => record.assetRef === 1663210);
const unresolvedPayloadRecords = records.filter((record) => record.payloadStatus === "payload-unresolved");
const sourceBackedAnchorRecords = records.filter((record) => record.payloadStatus === "source-backed-bonus-anchor");
const failedInvariants = [];

if (contract.summary?.contractReady !== true) failedInvariants.push("contract-not-ready");
if (d4dataReference.summary?.d4dataReferenceReady !== true) failedInvariants.push("d4data-reference-not-ready");
if (records.some((record) => record.safeguards.canModifyReliableDps !== false)) failedInvariants.push("record-can-modify-reliable-dps");
if (records.some((record) => record.safeguards.acceptedForBridge !== false)) failedInvariants.push("record-opens-bridge");
if (!targetRecords.some((record) => record.selector === 949 && record.layoutId === "compact-metadata-scale-layout")) {
  failedInvariants.push("target-1663210-compact-949-missing");
}

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-asset-record-parser-v1",
  source: inputs,
  summary: {
    parserRoot: "selector-asset-record",
    assetId: 1663210,
    entityId: "skill:1663210",
    records: records.length,
    targetRecords: targetRecords.length,
    sourceBackedAnchorRecords: sourceBackedAnchorRecords.length,
    unresolvedPayloadRecords: unresolvedPayloadRecords.length,
    skippedGroups: skippedGroups.length,
    parserLayoutsUsed: allowedLayouts.length,
    failedInvariants: failedInvariants.length,
    d4dataReferenceReady: d4dataReference.summary?.d4dataReferenceReady === true,
    contractReady: contract.summary?.contractReady === true,
    readOnlyParserReady: failedInvariants.length === 0,
    semanticBridgeReady: false,
    acceptedForBridge: false,
    writesTargetDataset: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: failedInvariants.length === 0
        ? "selector-asset-record-parser-read-only-ready"
        : "selector-asset-record-parser-invariant-failed",
      confidence: failedInvariants.length === 0 ? "high" : "medium",
      promotionReady: false,
      finding: failedInvariants.length === 0
        ? "Le parser emet des records selector-asset read-only avec evidence, sans ouvrir de bridge DPS."
        : "Le parser read-only a des invariants echoues.",
      nextAction: failedInvariants.length === 0
        ? "Brancher ensuite une lecture binaire bas niveau ou une preuve source-backed SF_32/SF_33/uptime avant tout bridge."
        : "Corriger les invariants avant de poursuivre.",
    },
  },
  records,
  skippedGroups,
  failedInvariants,
  safeguards: {
    readOnlyParser: true,
    noTargetDatasetWrite: true,
    noIntakeWrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "selector-asset-record-parser.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
