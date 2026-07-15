const fs = require("fs");
const path = require("path");

const inputs = {
  communitySourceTriageAudit: process.argv[2] ?? "outputs/diablo4-community-source-triage-audit/community-source-triage-audit.json",
  selectorAssetRecordParserContract: process.argv[3] ?? "outputs/diablo4-selector-asset-record-parser-contract/selector-asset-record-parser-contract.json",
  outDir: process.argv[4] ?? "outputs/diablo4-d4data-parser-reference-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const communityAudit = readJson(inputs.communitySourceTriageAudit);
const parserContract = readJson(inputs.selectorAssetRecordParserContract);
const d4dataSource = (communityAudit.sources ?? []).find((source) => source.id === "diablotools-d4data");

const referenceFiles = [
  {
    path: "parse.js",
    role: "parser-control-flow-reference",
    observedSignals: [
      "type reader dispatch exists",
      "DT_SNO reader exists",
      "DT_SNO_NAME reader exists",
      "DT_GBID reader exists",
      "eAttribute enrichment from attributeList.json exists",
    ],
    useForSelectorAssetParser: [
      "mirror read-only parser dispatch style",
      "keep raw typed values and resolved labels separate",
      "emit evidence fields rather than direct DPS writes",
    ],
  },
  {
    path: "definitions.json",
    role: "field-definition-reference",
    observedSignals: [
      "field hash catalogue exists",
      "typed field definitions exist",
    ],
    useForSelectorAssetParser: [
      "cross-check field names for parser output labels",
      "avoid guessing names for unresolved payload bytes",
    ],
  },
  {
    path: "field_types.txt",
    role: "field-type-hash-reference",
    observedSignals: [
      "format/type hash pairs exist",
      "can support future field hash reconciliation",
    ],
    useForSelectorAssetParser: [
      "map unknown field hashes only after exact type evidence",
      "keep hash/type evidence separate from gameplay semantics",
    ],
  },
  {
    path: "attributeList.json",
    role: "attribute-dictionary-reference",
    observedSignals: [
      "Bonus_Percent_Per_Power maps to eAttrib 994",
      "eAttrib 949 maps to Damage_Percent_Reduction_From_Elites",
    ],
    useForSelectorAssetParser: [
      "use selector 994 as the source-backed bonus anchor",
      "keep selector 949 as local payload role, not direct bonus eAttrib",
    ],
  },
];

const contractLayouts = parserContract.parserLayouts ?? [];
const requiredLayoutIds = new Set(["bonus-anchor-994", "local-compact-949", "local-variant-949"]);
const contractHasRequiredLayouts = [...requiredLayoutIds].every((id) => contractLayouts.some((layout) => layout.id === id));
const d4dataUsable = d4dataSource?.status === "active" && d4dataSource?.observed?.filesSeen?.includes("parse.js");
const parserContractCompatible =
  d4dataUsable &&
  parserContract.summary?.contractReady === true &&
  parserContract.summary?.semanticBridgeReady === false &&
  parserContract.summary?.canModifyReliableDps === false &&
  contractHasRequiredLayouts;

const checks = [
  {
    id: "active-d4data-source",
    status: d4dataSource?.status === "active" ? "passed" : "failed",
    evidence: d4dataSource?.url ?? null,
  },
  {
    id: "parser-reference-files-known",
    status: referenceFiles.every((file) => file.observedSignals.length > 0) ? "passed" : "failed",
    evidence: referenceFiles.map((file) => file.path),
  },
  {
    id: "selector-asset-contract-ready",
    status: parserContract.summary?.contractReady === true ? "passed" : "failed",
    evidence: parserContract.summary?.parserRoot ?? null,
  },
  {
    id: "required-layouts-present",
    status: contractHasRequiredLayouts ? "passed" : "failed",
    evidence: contractLayouts.map((layout) => layout.id),
  },
  {
    id: "semantic-bridge-remains-closed",
    status: parserContract.summary?.semanticBridgeReady === false ? "passed" : "failed",
    evidence: parserContract.summary?.semanticBridgeReady ?? null,
  },
  {
    id: "reliable-dps-immutable",
    status: parserContract.summary?.canModifyReliableDps === false ? "passed" : "failed",
    evidence: parserContract.summary?.canModifyReliableDps ?? null,
  },
];

const failedChecks = checks.filter((check) => check.status !== "passed");

const parserImplementationPlan = [
  {
    id: "emit-raw-selector-asset-records",
    status: parserContractCompatible ? "ready" : "blocked",
    sourceReferences: ["parse.js", "definitions.json"],
    output: "records read-only: selector, assetRef, layoutId, payload fields, evidence",
  },
  {
    id: "attach-attribute-dictionary-labels",
    status: parserContractCompatible ? "ready" : "blocked",
    sourceReferences: ["attributeList.json"],
    output: "994 labelled Bonus_Percent_Per_Power; 949 kept as local payload role",
  },
  {
    id: "defer-semantic-bridge",
    status: "blocked-until-source-proof",
    sourceReferences: ["field_types.txt", "future exact source evidence"],
    output: "no SF_32, SF_33 or uptime bridge before exact proof",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "d4data-parser-reference-audit-v1",
  source: {
    repository: d4dataSource?.url ?? "https://github.com/DiabloTools/d4data",
    sourceId: d4dataSource?.id ?? "diablotools-d4data",
    sourceStatus: d4dataSource?.status ?? "unknown",
    triageFile: inputs.communitySourceTriageAudit,
    parserContractFile: inputs.selectorAssetRecordParserContract,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    sourceId: d4dataSource?.id ?? "diablotools-d4data",
    referenceFiles: referenceFiles.length,
    checks: checks.length,
    failedChecks: failedChecks.length,
    parserRoot: parserContract.summary?.parserRoot ?? null,
    parserContractCompatible,
    d4dataReferenceReady: parserContractCompatible,
    canImplementReadOnlyParser: parserContractCompatible,
    semanticBridgeReady: false,
    acceptedForBridge: false,
    writesTargetDataset: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: parserContractCompatible
        ? "d4data-parser-reference-ready-read-only"
        : "d4data-parser-reference-incomplete",
      confidence: parserContractCompatible ? "high" : "medium",
      promotionReady: false,
      finding: parserContractCompatible
        ? "DiabloTools/d4data fournit une reference suffisante pour cadrer le parser read-only, mais pas pour ouvrir un bridge DPS."
        : "La reference d4data ou le contrat parser est incomplet.",
      nextAction: parserContractCompatible
        ? "Implementer l'emission read-only des records selector-asset avec labels et evidence, sans modifier reliableDps."
        : "Completer la reference d4data ou le contrat avant implementation.",
    },
  },
  referenceFiles,
  checks,
  failedChecks,
  parserImplementationPlan,
  safeguards: {
    readOnlyParserOnly: true,
    noTargetDatasetWrite: true,
    noIntakeWrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
    reason: "d4data peut guider le parsing, mais ne prouve pas SF_32, SF_33 ni uptime pour le delta 1663210.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "d4data-parser-reference-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
