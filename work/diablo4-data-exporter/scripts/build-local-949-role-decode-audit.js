const fs = require("fs");
const path = require("path");

const inputs = {
  selectorAssetLayoutParser: process.argv[2] ?? "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  selector949WindowReparseAudit: process.argv[3] ?? "outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json",
  selectorMatrix: process.argv[4] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
  outDir: process.argv[5] ?? "outputs/diablo4-local-949-role-decode-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fieldRole(layout, role) {
  return (layout?.fieldRoles ?? []).find((item) => item.role === role) ?? null;
}

function groupBySelector(matrix, selector) {
  return (matrix.groups ?? []).find((group) => Number(group.selector) === selector) ?? null;
}

const layoutParser = readJson(inputs.selectorAssetLayoutParser);
const reparseAudit = readJson(inputs.selector949WindowReparseAudit);
const selectorMatrix = readJson(inputs.selectorMatrix);

const layouts = layoutParser.layouts ?? [];
const selector949Layouts = layouts.filter((layout) => (layout.selectors ?? []).includes(949));
const selector994Layouts = layouts.filter((layout) => (layout.selectors ?? []).includes(994));
const compact949Layout = selector949Layouts.find((layout) => layout.layoutId === "compact-metadata-scale-layout") ?? null;
const nonCompact949Layouts = selector949Layouts.filter((layout) => layout.layoutId !== "compact-metadata-scale-layout");
const noLocal994Layout = selector994Layouts.find((layout) => layout.layoutId === "no-local-metadata-layout") ?? selector994Layouts[0] ?? null;
const group949 = groupBySelector(selectorMatrix, 949);
const group994 = groupBySelector(selectorMatrix, 994);

const selector949AtRecordHead = selector949Layouts.every((layout) => fieldRole(layout, "selector")?.offset === 0);
const selector949HasAssetRef = selector949Layouts.every((layout) => fieldRole(layout, "assetRef")?.offset === 4);
const selector994AtRecordHead = selector994Layouts.every((layout) => fieldRole(layout, "selector")?.offset === 0);
const selector994HasAssetRef = selector994Layouts.every((layout) => fieldRole(layout, "assetRef")?.offset === 4);
const compactHasMetadataOpcodeScale =
  fieldRole(compact949Layout, "metadataId")?.offset === 16 &&
  fieldRole(compact949Layout, "opcode")?.offset === 20 &&
  fieldRole(compact949Layout, "scale")?.offset === 24;
const nonCompactHasVariantTail = nonCompact949Layouts.length > 0;
const externalBonusAnchorIs994 = reparseAudit.summary?.selector994AlignedWithAttribute === true;
const selector949NotBonusEAttrib = reparseAudit.summary?.selector949NotBonusEAttrib === true;

const roleDecoded =
  selector949AtRecordHead &&
  selector949HasAssetRef &&
  selector994AtRecordHead &&
  selector994HasAssetRef &&
  compactHasMetadataOpcodeScale &&
  nonCompactHasVariantTail &&
  externalBonusAnchorIs994 &&
  selector949NotBonusEAttrib;

const localRole = roleDecoded
  ? "local-record-selector-with-layout-overload"
  : "local-record-selector-unresolved";

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "local-949-role-decode-audit-v1",
  source: inputs,
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    localValue: 949,
    localRole,
    selector949Layouts: selector949Layouts.length,
    selector949LayoutIds: selector949Layouts.map((layout) => layout.layoutId),
    selector949AtRecordHead,
    selector949HasAssetRef,
    selector994ReferenceLayouts: selector994Layouts.length,
    selector994AtRecordHead,
    selector994HasAssetRef,
    compactHasMetadataOpcodeScale,
    nonCompactHasVariantTail,
    externalBonusAnchorIs994,
    selector949NotBonusEAttrib,
    roleDecoded,
    bridgeReady: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: roleDecoded
        ? "local-949-role-record-selector-overloaded"
        : "local-949-role-still-unresolved",
      confidence: roleDecoded ? "high" : "medium",
      promotionReady: false,
      finding: roleDecoded
        ? "Le 949 local se comporte comme un selecteur de record surcharge par layout; il n'est ni opcode, ni scale, ni preuve de champ proprietaire SF_32."
        : "Le role local de 949 reste insuffisamment decode.",
      nextAction: roleDecoded
        ? "Construire le prochain parser sur les layouts: 994 pour l'ancre bonus, puis tail compact 949 comme payload local a decoder."
        : "Elargir le corpus de layouts avant de construire un parser.",
    },
  },
  roleEvidence: [
    {
      id: "record-head-position",
      status: selector949AtRecordHead && selector949HasAssetRef ? "passed" : "failed",
      finding: "949 apparait a l'offset 0 et l'assetRef a l'offset 4 dans les layouts connus.",
      evidence: selector949Layouts.map((layout) => ({
        layoutId: layout.layoutId,
        fieldRoles: layout.fieldRoles,
        assetCandidates: layout.assetCandidates,
      })),
    },
    {
      id: "reference-994-layout",
      status: selector994AtRecordHead && selector994HasAssetRef ? "passed" : "failed",
      finding: "994 occupe la meme position record-selector dans le layout source-backed Bonus_Percent_Per_Power.",
      evidence: selector994Layouts.map((layout) => ({
        layoutId: layout.layoutId,
        fieldRoles: layout.fieldRoles,
        assetCandidates: layout.assetCandidates,
      })),
    },
    {
      id: "compact-tail-payload",
      status: compactHasMetadataOpcodeScale ? "candidate-payload" : "missing",
      finding: "Le compact 1663210 porte un tail metadata/opcode/scale a +16/+20/+24.",
      evidence: compact949Layout
        ? {
            layoutId: compact949Layout.layoutId,
            fieldRoles: compact949Layout.fieldRoles,
            groups: compact949Layout.groups,
          }
        : null,
    },
    {
      id: "variant-tail-overload",
      status: nonCompactHasVariantTail ? "overloaded" : "not-observed",
      finding: "949 existe aussi en layout non compact; le tail ne peut pas etre attribue globalement au selecteur.",
      evidence: nonCompact949Layouts.map((layout) => ({
        layoutId: layout.layoutId,
        fieldRoles: layout.fieldRoles,
        groups: layout.groups,
      })),
    },
  ],
  rejectedRoles: [
    {
      role: "opcode",
      status: "rejected",
      reason: "L'opcode candidat du compact est a l'offset +20; 949 est a l'offset 0, avant assetRef.",
    },
    {
      role: "scale",
      status: "rejected",
      reason: "La scale candidate est le float 10 a l'offset +24; 949 n'est pas dans le champ scale.",
    },
    {
      role: "direct-bonus-eattrib",
      status: "rejected",
      reason: "DiabloTools mappe Bonus_Percent_Per_Power vers eAttrib 994 et eAttrib 949 vers Damage_Percent_Reduction_From_Elites.",
    },
    {
      role: "sf32-owner-proof",
      status: "rejected-for-promotion",
      reason: "Le role de record-selector local ne prouve pas le champ proprietaire SF_32, SF_33 ni uptime.",
    },
  ],
  parserImplications: {
    recommendedParserRoot: "selector-asset-record",
    bonusAnchorSelector: 994,
    localPayloadSelector: 949,
    compactTail: compactHasMetadataOpcodeScale ? ["metadataId:+16", "opcode:+20", "scale:+24"] : [],
    requiredNextProof: "source-backed mapping from local 949 compact payload to SF_32 owner semantics",
  },
  safeguards: {
    noTargetDatasetWrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
    reason: "Le decodage du role local structure le parser, mais ne prouve pas les conditions gameplay.",
  },
  selectorGroups: {
    selector949: group949,
    selector994: group994,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "local-949-role-decode-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
