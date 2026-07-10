const fs = require("fs");
const path = require("path");

const externalSearchFile = process.argv[2] ?? "outputs/diablo4-bonus-percent-external-scan-all/external-target-search.json";
const selectorMatrixFile = process.argv[3] ?? "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json";
const ownerFieldsFile = process.argv[4] ?? "outputs/diablo4-selector-asset-owner-fields/selector-asset-owner-fields.json";
const outputsDir = process.argv[5] ?? "outputs";
const outDir = process.argv[6] ?? "outputs/diablo4-bonus-percent-coverage-audit";

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((value) => value !== null && value !== undefined))).sort((a, b) =>
    typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))
  );
}

function findDecodedPayload(assetId, source) {
  const dir = path.join(outputsDir, `diablo4-source-asset-${assetId}-payload`);
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
    const hit = entries.find((entry) => entry.isFile() && entry.name.endsWith(".decoded.bin"));
    if (hit) return { decoded: true, decodedKind: "source-asset-payload", decodedFile: path.join(dir, hit.name) };
  }

  const fileName = source?.fileName;
  const blteOffset = source?.blteOffset;
  if (fileName && blteOffset != null) {
    const expectedName = `${fileName}.${blteOffset}.decoded.bin`;
    const stack = [outputsDir];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (entry.isFile() && entry.name === expectedName) {
          return { decoded: true, decodedKind: "offset-payload", decodedFile: fullPath };
        }
      }
    }
  }

  return { decoded: false, decodedKind: "missing", decodedFile: null };
}

function matrixRowFor(matrix, assetId) {
  return (matrix.rows ?? []).find((row) => Number(row.assetId) === Number(assetId)) ?? null;
}

function ownerLayoutFor(ownerFields, assetId) {
  return (ownerFields.layouts ?? []).find((layout) => (layout.assetCandidates ?? []).includes(assetId)) ?? null;
}

const externalSearch = JSON.parse(fs.readFileSync(externalSearchFile, "utf8"));
const selectorMatrix = JSON.parse(fs.readFileSync(selectorMatrixFile, "utf8"));
const ownerFields = JSON.parse(fs.readFileSync(ownerFieldsFile, "utf8"));

const externalAssetRows = (externalSearch.groups?.Bonus_Percent_Per_Power?.assets ?? [])
  .map((entry) => ({
    assetId: entry.assetId,
    source: {
      fileName: entry.source?.fileName,
      blteOffset: entry.source?.blteOffset,
    },
    target: entry.sampleValues?.[0] ?? null,
  }));

const externalAssets = uniqueSorted((externalSearch.summary?.topGroups ?? [])
  .flatMap((group) => group.assets ?? [])
  .map((asset) => asset.assetId));

const rows = externalAssets.map((assetId) => {
  const externalRow = externalAssetRows.find((row) => Number(row.assetId) === Number(assetId)) ?? {};
  const matrixRow = matrixRowFor(selectorMatrix, assetId);
  const layout = ownerLayoutFor(ownerFields, assetId);
  const decodedPayload = findDecodedPayload(assetId, externalRow.source);
  const decoded = decodedPayload.decoded;
  const selectors = uniqueSorted(matrixRow?.selectors ?? layout?.selectors ?? []);
  const metadataIds = uniqueSorted(matrixRow?.metadataIds ?? []);
  const families = uniqueSorted(matrixRow?.families ?? layout?.families ?? []);
  return {
    assetId,
    decoded,
    decodedKind: decodedPayload.decodedKind,
    decodedFile: decodedPayload.decodedFile,
    target: matrixRow?.targets?.[0] ?? externalRow.target ?? null,
    selectors,
    metadataIds,
    layoutId: layout?.layoutId ?? null,
    ownershipStatus: layout?.ownershipStatus ?? "not-audited",
    fieldOwnership: layout?.fieldOwnership ?? "not-proven",
    promotionReady: false,
    usefulForSecondCompact949: selectors.includes(949) && layout?.layoutId === "compact-metadata-scale-layout" && assetId !== 1663210,
    blockers: [
      ...(!decoded ? ["payload-not-decoded"] : []),
      ...(selectors.includes(949) ? [] : ["selector-949-not-present"]),
      ...(layout?.layoutId === "compact-metadata-scale-layout" ? [] : ["compact-949-layout-not-present"]),
      ...(assetId === 1663210 ? ["reference-asset-only"] : []),
    ],
  };
});

const decodedRows = rows.filter((row) => row.decoded);
const missingDecodedRows = rows.filter((row) => !row.decoded);
const selector949Rows = rows.filter((row) => row.selectors.includes(949));
const secondCompact949Rows = rows.filter((row) => row.usefulForSecondCompact949);
const unauditedRows = rows.filter((row) => !row.layoutId);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "bonus-percent-coverage-audit-v1",
  source: {
    externalSearch: externalSearchFile,
    selectorMatrix: selectorMatrixFile,
    ownerFields: ownerFieldsFile,
    outputsDir,
  },
  summary: {
    externalAssets: rows.length,
    decodedAssets: decodedRows.length,
    missingDecodedAssets: missingDecodedRows.length,
    selector949Assets: selector949Rows.length,
    secondCompact949Assets: secondCompact949Rows.length,
    unauditedAssets: unauditedRows.length,
    assessment: {
      kind: secondCompact949Rows.length
        ? "bonus-percent-coverage-second-compact-candidate-found"
        : missingDecodedRows.length
          ? "bonus-percent-coverage-has-undecoded-candidates"
          : "bonus-percent-coverage-exhausted-no-second-compact-949",
      confidence: rows.length && !missingDecodedRows.length ? "high" : "medium",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: secondCompact949Rows.length
        ? "La couverture contient au moins un candidat compact 949 supplementaire a inspecter."
        : missingDecodedRows.length
          ? "La couverture Bonus_Percent_Per_Power contient encore des payloads non decodes."
          : "Tous les assets Bonus_Percent_Per_Power explicites du scan large sont deja decodes/audites; aucun second compact selector 949 n'apparait.",
      nextAction: secondCompact949Rows.length
        ? "Inspecter les candidats compacts selector 949 supplementaires avant toute promotion DPS."
        : missingDecodedRows.length
          ? "Decoder les payloads Bonus_Percent_Per_Power manquants, puis relancer les audits selector/layout."
          : "Elargir la recherche au-dela des hits explicites Bonus_Percent_Per_Power ou trouver une source table hors des artefacts actuels.",
      evidence: {
        externalAssets,
        decodedAssets: decodedRows.map((row) => row.assetId),
        missingDecodedAssets: missingDecodedRows.map((row) => row.assetId),
        selector949Assets: selector949Rows.map((row) => row.assetId),
        secondCompact949Assets: secondCompact949Rows.map((row) => row.assetId),
      },
    },
  },
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "bonus-percent-coverage-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
