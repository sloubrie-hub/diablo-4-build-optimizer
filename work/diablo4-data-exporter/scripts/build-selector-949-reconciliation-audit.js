const fs = require("fs");
const path = require("path");

const inputs = {
  selectorMatrix: process.argv[2] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
  selector949PeerAudit: process.argv[3] ?? "outputs/diablo4-selector-949-peer-audit/selector-949-peer-audit.json",
  metadata12337ContextAudit: process.argv[4] ?? "outputs/diablo4-metadata-12337-context-audit/metadata-12337-context-audit.json",
  diabloToolsAttributeAudit: process.argv[5] ?? "outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json",
  outDir: process.argv[6] ?? "outputs/diablo4-selector-949-reconciliation-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function groupBySelector(matrix, selector) {
  return (matrix.groups ?? []).find((group) => group.selector === selector) ?? null;
}

const selectorMatrix = readJson(inputs.selectorMatrix);
const selector949PeerAudit = readJson(inputs.selector949PeerAudit);
const metadata12337ContextAudit = readJson(inputs.metadata12337ContextAudit);
const diabloToolsAttributeAudit = readJson(inputs.diabloToolsAttributeAudit);

const group949 = groupBySelector(selectorMatrix, 949);
const group994 = groupBySelector(selectorMatrix, 994);
const selector949ExternalName = diabloToolsAttributeAudit.summary?.selector949Name ?? null;
const bonusExternalEAttrib = diabloToolsAttributeAudit.summary?.bonusPercentPerPowerEAttrib ?? null;
const selector994ExternalName = diabloToolsAttributeAudit.summary?.selector994Name ?? null;
const selector994Aligned = group994?.selector === bonusExternalEAttrib && selector994ExternalName === "Bonus_Percent_Per_Power";
const selector949Contradicted = diabloToolsAttributeAudit.summary?.sourceContradictsPriorSelectorAssumption === true;
const compact949Unique = selector949PeerAudit.summary?.compactCandidates === 1;
const metadataCrossSelector = (metadata12337ContextAudit.summary?.selectors ?? []).filter((selector) => selector !== 949).length > 0;

const selectorFindings = [
  {
    id: "selector-994-aligned-with-diablo-tools",
    status: selector994Aligned ? "aligned" : "not-aligned",
    localEvidence: {
      selector: group994?.selector ?? null,
      assets: group994?.assets ?? [],
      families: group994?.families ?? {},
    },
    externalEvidence: {
      eAttrib: bonusExternalEAttrib,
      name: selector994ExternalName,
    },
    finding: selector994Aligned
      ? "Le selector local 994 s'aligne avec eAttrib 994 = Bonus_Percent_Per_Power dans DiabloTools."
      : "Le selector 994 ne peut pas etre aligne avec DiabloTools.",
  },
  {
    id: "selector-949-contradicted-by-diablo-tools",
    status: selector949Contradicted ? "conflict" : "not-conflict",
    localEvidence: {
      selector: group949?.selector ?? null,
      assets: group949?.assets ?? [],
      families: group949?.families ?? {},
      metadataIds: group949?.metadataIds ?? {},
    },
    externalEvidence: {
      eAttrib: 949,
      name: selector949ExternalName,
    },
    finding: selector949Contradicted
      ? "Le selector local 949 est adjacent a des cibles Bonus_Percent_Per_Power, mais DiabloTools mappe eAttrib 949 vers un autre attribut."
      : "Aucune contradiction externe claire pour 949.",
  },
  {
    id: "metadata-12337-not-owner-proof",
    status: metadataCrossSelector ? "cross-selector" : "local-only",
    localEvidence: {
      selectors: metadata12337ContextAudit.summary?.selectors ?? [],
      families: metadata12337ContextAudit.summary?.families ?? [],
    },
    finding: metadataCrossSelector
      ? "metadata 12337 / scale 10 traverse plusieurs selecteurs et ne peut pas sauver l'ownership de 949."
      : "metadata 12337 reste locale dans les donnees disponibles.",
  },
  {
    id: "compact-949-not-repeated",
    status: compact949Unique ? "unique-compact" : "repeated",
    localEvidence: {
      selector949Assets: selector949PeerAudit.summary?.selector949Assets ?? [],
      compactCandidates: selector949PeerAudit.summary?.compactCandidates ?? 0,
    },
    finding: compact949Unique
      ? "Le compact 949/asset/metadata/scale existe seulement sur 1663210."
      : "Le compact 949 se repete dans plusieurs assets.",
  },
];

const needsReinterpretation = selector994Aligned && selector949Contradicted && compact949Unique;
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-949-reconciliation-audit-v1",
  source: inputs,
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    localSelector: "selector:949",
    expectedClaim: "sf32-field-ownership",
    selector994Aligned,
    selector949Contradicted,
    compact949Unique,
    metadataCrossSelector,
    needsReinterpretation,
    recommendedNextFocus: needsReinterpretation ? "reinterpret-local-949-as-non-eattrib-or-wrapper" : "continue-source-hunt",
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: needsReinterpretation
        ? "selector-949-needs-reinterpretation-after-diablo-tools"
        : "selector-949-reconciliation-inconclusive",
      confidence: needsReinterpretation ? "high" : "medium",
      promotionReady: false,
      finding: needsReinterpretation
        ? "Le selector 994 est le candidat source-backed pour Bonus_Percent_Per_Power; le raw 949 local doit etre reinterprete avant toute preuve SF_32."
        : "La reconciliation ne suffit pas a changer le plan de preuve.",
      nextAction: needsReinterpretation
        ? "Verifier si le 949 local est un opcode/layout/wrapper ou un champ different, puis corriger les templates SF_32 si necessaire."
        : "Continuer la recherche source sans promotion.",
    },
  },
  selectorFindings,
  revisedHypotheses: [
    {
      id: "h1-949-is-not-bonus-eattrib",
      confidence: selector949Contradicted ? "high" : "medium",
      status: selector949Contradicted ? "favored" : "open",
      implication: "Ne plus demander une preuve externe qui mappe selector:949 directement vers Bonus_Percent_Per_Power.",
    },
    {
      id: "h2-994-is-bonus-eattrib",
      confidence: selector994Aligned ? "high" : "medium",
      status: selector994Aligned ? "favored" : "open",
      implication: "Utiliser 994 comme ancre dictionnaire pour la famille Bonus_Percent_Per_Power.",
    },
    {
      id: "h3-949-is-wrapper-or-local-layout-value",
      confidence: needsReinterpretation ? "medium-high" : "medium",
      status: needsReinterpretation ? "open-next" : "open",
      implication: "Reparser la fenetre 1663210 comme structure composite plutot que field owner direct.",
    },
  ],
  safeguards: {
    noTemplateAutoRewrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
    reason: "La reconciliation corrige les hypotheses, mais ne prouve ni SF_32, ni SF_33, ni uptime.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "selector-949-reconciliation-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
