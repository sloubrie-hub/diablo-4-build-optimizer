const fs = require("fs");
const path = require("path");

const selectorMatrixFile = process.argv[2] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json";
const coverageFile = process.argv[3] ?? "outputs/diablo4-bonus-percent-coverage-audit/bonus-percent-coverage-audit.json";
const externalScanFile = process.argv[4] ?? "outputs/diablo4-bonus-percent-external-scan-all/external-target-search.json";
const unanchoredFile = process.argv[5] ?? "outputs/diablo4-unanchored-bonus-percent-audit/unanchored-bonus-percent-audit.json";
const sf32DecisionFile = process.argv[6] ?? "outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json";
const selectorSourceProofFile = process.argv[7] ?? "outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json";
const outDir = process.argv[8] ?? "outputs/diablo4-additive-bucket-source-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value != null).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

function summarizeMatrixRows(matrix) {
  return (matrix.rows ?? []).map((row) => ({
    assetId: row.assetId ?? null,
    target: row.target ?? row.targetString ?? null,
    selector: row.selector ?? row.selectorId ?? row.anchor?.selector ?? null,
    metadataId: row.metadataId ?? row.metadata ?? row.anchor?.metadataId ?? null,
    scale: row.scale ?? row.anchor?.scale ?? null,
    shape: row.shape ?? row.layout ?? row.anchor?.shape ?? null,
    anchorKind: row.anchorKind ?? row.kind ?? row.anchor?.kind ?? null,
    sourceAssessment: row.assessment?.kind ?? row.assessment ?? null,
  }));
}

function externalAssets(report) {
  const direct = report.summary?.topGroups?.flatMap((group) => group.assets ?? []) ?? [];
  const matches = report.matches ?? [];
  return uniqueSorted([
    ...direct.map((row) => row.assetId),
    ...matches.map((row) => row.assetId),
    ...(report.summary?.topMatches ?? []).map((row) => row.assetId),
  ]);
}

const selectorMatrix = readOptionalJson(selectorMatrixFile);
const coverage = readOptionalJson(coverageFile);
const externalScan = readOptionalJson(externalScanFile);
const unanchored = readOptionalJson(unanchoredFile);
const sf32Decision = readOptionalJson(sf32DecisionFile);
const selectorSourceProof = readOptionalJson(selectorSourceProofFile);

const matrixRows = summarizeMatrixRows(selectorMatrix ?? {});
const matrixAssets = uniqueSorted(matrixRows.map((row) => row.assetId));
const explicitAssets = externalAssets(externalScan ?? {});
const decodedAssets = uniqueSorted(coverage?.summary?.assessment?.evidence?.decodedAssets ?? coverage?.summary?.decodedAssets ?? []);
const selector949Assets = uniqueSorted(coverage?.summary?.assessment?.evidence?.selector949Assets ?? coverage?.summary?.selector949Assets ?? []);
const selector994Assets = uniqueSorted(selectorMatrix?.summary?.assessment?.evidence?.selector994Assets ?? []);
const sourceNamed = false;
const selectorSourceNamed = selectorSourceProof?.summary?.sourceNamed === true;
const selectorFamiliesClassified = selectorSourceProof?.summary?.selectorFamiliesClassified ?? 0;
const sourceProofReady = selectorSourceProof?.summary?.promotionReady === true;
const fieldOwnershipProven = sf32Decision?.summary?.promotionReady === true;
const hasBonusPercentCorpus = explicitAssets.length > 0 || matrixAssets.length > 0;
const hasDivergentSelectors = (selectorMatrix?.summary?.selectorGroups ?? 0) > 1;
const hasUnanchoredUseful = (unanchored?.summary?.usefulAnchorCandidates ?? 0) > 0;

const candidateRows = uniqueSorted([...explicitAssets, ...matrixAssets, ...decodedAssets]).map((assetId) => {
  const matrixMatches = matrixRows.filter((row) => Number(row.assetId) === Number(assetId));
  const selectorIds = uniqueSorted(matrixMatches.map((row) => row.selector));
  const isTargetAsset = Number(assetId) === 1663210;
  const isSelector949 = selector949Assets.includes(Number(assetId));
  const isSelector994 = selector994Assets.includes(Number(assetId));
  const bucketCandidate = hasBonusPercentCorpus && (isSelector949 || isSelector994 || matrixMatches.length > 0);
  const blockers = [
    sourceNamed ? null : "named-additive-source-missing",
    sourceProofReady ? null : "selector-source-proof-missing",
    fieldOwnershipProven ? null : "field-ownership-not-proven",
    hasDivergentSelectors ? "selector-family-divergent" : null,
    isTargetAsset && sf32Decision?.summary?.promotionReady !== true ? "target-delta-proof-gates-open" : null,
  ].filter(Boolean);
  return {
    assetId,
    selectors: selectorIds,
    selectorFamily: isSelector949 ? "selector-949" : isSelector994 ? "selector-994" : selectorIds.length ? `selector-${selectorIds.join("-")}` : "unknown",
    explicitBonusPercentHit: explicitAssets.includes(Number(assetId)),
    decoded: decodedAssets.includes(Number(assetId)),
    bucketCandidate,
    additiveBucketReady: blockers.length === 0,
    blockers,
    matrixRows: matrixMatches,
  };
});

const readyRows = candidateRows.filter((row) => row.additiveBucketReady);
const blockedCandidates = candidateRows.filter((row) => row.bucketCandidate && !row.additiveBucketReady);
const targetRow = candidateRows.find((row) => row.assetId === 1663210) ?? null;
const assessmentKind = readyRows.length
  ? "additive-bucket-source-ready"
  : blockedCandidates.length
    ? "additive-bucket-source-candidates-blocked-by-proof"
    : "additive-bucket-source-not-found";

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "additive-bucket-source-audit-v1",
  source: {
    selectorMatrixFile: selectorMatrix ? selectorMatrixFile : null,
    coverageFile: coverage ? coverageFile : null,
    externalScanFile: externalScan ? externalScanFile : null,
    unanchoredFile: unanchored ? unanchoredFile : null,
    sf32DecisionFile: sf32Decision ? sf32DecisionFile : null,
    selectorSourceProofFile: selectorSourceProof ? selectorSourceProofFile : null,
  },
  summary: {
    explicitAssets: explicitAssets.length,
    matrixAssets: matrixAssets.length,
    decodedAssets: decodedAssets.length,
    candidateRows: candidateRows.length,
    blockedCandidates: blockedCandidates.length,
    readyRows: readyRows.length,
    additiveBucketReady: readyRows.length > 0,
    selectorGroups: selectorMatrix?.summary?.selectorGroups ?? null,
    selector949Assets,
    selector994Assets,
    sourceNamed,
    selectorSourceNamed,
    selectorFamiliesClassified,
    sourceProofReady,
    fieldOwnershipProven,
    hasUnanchoredUseful,
    nextAssetId: targetRow?.assetId ?? blockedCandidates[0]?.assetId ?? null,
    nextStep: "Prouver une table/champ source qui nomme la famille additive avant d'alimenter reliableDps.",
    assessment: {
      kind: assessmentKind,
      confidence: readyRows.length ? "medium" : "high",
      promotionReady: readyRows.length > 0,
      blocker: readyRows.length ? null : "additive-bucket-source-missing",
      finding: readyRows.length
        ? "Au moins une source additive est prete pour validation bucket."
        : "Les hits Bonus_Percent_Per_Power donnent des candidats additifs, mais aucun n'a de table/champ source et d'ownership prouves.",
      nextAction: "Chercher une table source nommee pour les selecteurs Bonus_Percent_Per_Power ou decoder un champ qui distingue additif/multiplicatif.",
      evidence: {
        selectorMatrixAssessment: selectorMatrix?.summary?.assessment?.kind ?? null,
        coverageAssessment: coverage?.summary?.assessment?.kind ?? null,
        unanchoredAssessment: unanchored?.summary?.assessment?.kind ?? null,
        sf32Assessment: sf32Decision?.summary?.assessment?.kind ?? null,
        selectorSourceProofAssessment: selectorSourceProof?.summary?.assessment?.kind ?? null,
      },
    },
  },
  candidateRows,
  safeguards: [
    "Un hit Bonus_Percent_Per_Power n'est pas automatiquement un bucket additif.",
    "Un selecteur divergent bloque la promotion tant que la table source n'est pas nommee.",
    "Les candidats de 1663210 restent exclus de reliableDps tant que SF_32/SF_33/uptime ne sont pas prouves.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "additive-bucket-source-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
