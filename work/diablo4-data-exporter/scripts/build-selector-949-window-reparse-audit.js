const fs = require("fs");
const path = require("path");

const inputs = {
  selectorMatrix: process.argv[2] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
  selector949PeerAudit: process.argv[3] ?? "outputs/diablo4-selector-949-peer-audit/selector-949-peer-audit.json",
  metadata12337ContextAudit: process.argv[4] ?? "outputs/diablo4-metadata-12337-context-audit/metadata-12337-context-audit.json",
  diabloToolsAttributeAudit: process.argv[5] ?? "outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json",
  outDir: process.argv[6] ?? "outputs/diablo4-selector-949-window-reparse-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function groupBySelector(matrix, selector) {
  return (matrix.groups ?? []).find((group) => Number(group.selector) === selector) ?? null;
}

function countBy(rows, predicate) {
  return rows.filter(predicate).length;
}

const selectorMatrix = readJson(inputs.selectorMatrix);
const selector949PeerAudit = readJson(inputs.selector949PeerAudit);
const metadata12337ContextAudit = readJson(inputs.metadata12337ContextAudit);
const diabloToolsAttributeAudit = readJson(inputs.diabloToolsAttributeAudit);

const group994 = groupBySelector(selectorMatrix, 994);
const group949 = groupBySelector(selectorMatrix, 949);
const selector994Examples = group994?.examples ?? [];
const selector949Examples = group949?.examples ?? [];
const peerRows = selector949PeerAudit.rows ?? [];
const asset1663210Peer = peerRows.find((row) => Number(row.assetId) === 1663210) ?? null;

const selector994DirectExamples = countBy(selector994Examples, (item) => item.family === "direct-bonus-percent");
const selector949CompactExamples = countBy(peerRows, (row) => row.compactCandidate === true);
const selector949NonCompactExamples = countBy(peerRows, (row) => row.compactCandidate !== true);
const selector994AlignedWithAttribute =
  diabloToolsAttributeAudit.summary?.bonusPercentPerPowerEAttrib === 994 &&
  diabloToolsAttributeAudit.summary?.selector994Name === "Bonus_Percent_Per_Power";
const selector949NotBonusEAttrib =
  diabloToolsAttributeAudit.summary?.selector949Name === "Damage_Percent_Reduction_From_Elites" &&
  diabloToolsAttributeAudit.summary?.sourceContradictsPriorSelectorAssumption === true;
const metadata12337CrossSelector = (metadata12337ContextAudit.summary?.selectors ?? []).some((selector) => Number(selector) !== 949);
const selector949CompactHasAssetInline =
  asset1663210Peer?.compactCandidate === true &&
  asset1663210Peer?.nearest?.assetId?.distance === 4 &&
  asset1663210Peer?.nearest?.metadata12337?.distance === 16 &&
  asset1663210Peer?.nearest?.float10?.distance === 24;

const wrapperOrLayoutCandidate =
  selector994AlignedWithAttribute &&
  selector949NotBonusEAttrib &&
  selector949CompactHasAssetInline &&
  selector949NonCompactExamples > 0;

const comparisons = [
  {
    id: "selector-994-direct-bonus-anchor",
    status: selector994AlignedWithAttribute ? "source-backed" : "unproven",
    selector: 994,
    examples: selector994Examples,
    finding: selector994AlignedWithAttribute
      ? "selector 994 est l'ancre source-backed pour Bonus_Percent_Per_Power."
      : "selector 994 n'est pas encore aligne avec une source externe.",
  },
  {
    id: "selector-949-local-window",
    status: selector949NotBonusEAttrib ? "not-bonus-eattrib" : "open",
    selector: 949,
    examples: selector949Examples,
    peerEvidence: {
      compactExamples: selector949CompactExamples,
      nonCompactExamples: selector949NonCompactExamples,
      asset1663210Window: asset1663210Peer
        ? {
            anchorOffset: asset1663210Peer.anchorOffset,
            nearest: asset1663210Peer.nearest,
            words: asset1663210Peer.words,
          }
        : null,
    },
    finding: selector949NotBonusEAttrib
      ? "selector 949 ne doit plus etre interprete comme l'eAttrib Bonus_Percent_Per_Power."
      : "Le role de selector 949 reste a prouver.",
  },
  {
    id: "metadata-12337-scale-10",
    status: metadata12337CrossSelector ? "cross-selector-not-owner-proof" : "local-only",
    selectors: metadata12337ContextAudit.summary?.selectors ?? [],
    finding: metadata12337CrossSelector
      ? "metadata 12337 / scale 10 ne prouve pas l'ownership SF_32 car le motif traverse plusieurs selectors."
      : "metadata 12337 / scale 10 reste local dans les donnees disponibles.",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-949-window-reparse-audit-v1",
  source: inputs,
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    selector994DirectExamples,
    selector949Examples: selector949Examples.length,
    selector949CompactExamples,
    selector949NonCompactExamples,
    selector994AlignedWithAttribute,
    selector949NotBonusEAttrib,
    selector949CompactHasAssetInline,
    metadata12337CrossSelector,
    windowReparseStatus: wrapperOrLayoutCandidate ? "wrapper-or-layout-candidate" : "inconclusive",
    sf32TemplateNeedsRevision: wrapperOrLayoutCandidate,
    recommendedNextFocus: wrapperOrLayoutCandidate ? "parse-selector-949-as-local-wrapper-or-layout" : "continue-selector-source-hunt",
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: wrapperOrLayoutCandidate
        ? "selector-949-window-reparse-wrapper-or-layout-candidate"
        : "selector-949-window-reparse-inconclusive",
      confidence: wrapperOrLayoutCandidate ? "high" : "medium",
      promotionReady: false,
      finding: wrapperOrLayoutCandidate
        ? "La fenetre locale 1663210 doit etre reparsee comme wrapper/layout potentiel; 949 n'est plus une preuve directe SF_32."
        : "La fenetre 949 ne suffit pas encore a corriger le template SF_32.",
      nextAction: wrapperOrLayoutCandidate
        ? "Construire le prochain parser autour de l'ancre 994 et traiter 949 comme role local jusqu'a decodage complet."
        : "Continuer la recherche de source avant tout changement.",
    },
  },
  comparisons,
  revisedClaims: [
    {
      id: "sf32-field-ownership-selector-949",
      status: "suspended",
      reason: "DiabloTools mappe eAttrib 949 vers Damage_Percent_Reduction_From_Elites, pas Bonus_Percent_Per_Power.",
    },
    {
      id: "bonus-percent-attribute-anchor-selector-994",
      status: selector994AlignedWithAttribute ? "source-backed" : "open",
      reason: "DiabloTools mappe Bonus_Percent_Per_Power vers eAttrib 994.",
    },
    {
      id: "local-window-949-role",
      status: wrapperOrLayoutCandidate ? "wrapper-or-layout-candidate" : "open",
      reason: "La fenetre compacte 1663210 contient asset/metadata/scale inline, mais un peer 949 existe en forme non compacte.",
    },
  ],
  safeguards: {
    noTargetDatasetWrite: true,
    noTemplateAutoRewrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
    reason: "Cette passe corrige une hypothese de parsing; elle ne prouve pas SF_32, SF_33 ni uptime.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "selector-949-window-reparse-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
