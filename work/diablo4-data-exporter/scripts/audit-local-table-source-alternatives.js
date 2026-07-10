const fs = require("fs");
const path = require("path");

const namedTableAuditFile = process.argv[2] ?? "outputs/diablo4-hash-suffix-named-table-audit/hash-suffix-named-table-audit.json";
const decodedDictionaryScanFile = process.argv[3] ?? "outputs/diablo4-decoded-dictionary-string-scan/decoded-dictionary-string-scan.json";
const coverageAuditFile = process.argv[4] ?? "outputs/diablo4-bonus-percent-coverage-audit/bonus-percent-coverage-audit.json";
const tableCandidatesFile = process.argv[5] ?? "outputs/diablo4-table-candidates/table-candidates.json";
const strictTableCandidatesFile = process.argv[6] ?? "outputs/diablo4-table-candidates-strict/table-candidates.json";
const outDir = process.argv[7] ?? "outputs/diablo4-local-table-source-alternatives";

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function countLiteralContexts(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      exists: false,
      byteLength: 0,
      exact949Contexts: 0,
      exact12337Contexts: 0,
      exactTableId949Contexts: 0,
      exactTableId12337Contexts: 0,
      nameLikeContexts: 0,
      usefulCandidates: 0,
    };
  }
  const text = fs.readFileSync(filePath, "utf8");
  const exact949Contexts = (text.match(/:\s*949(?:,|\n|\r|\})/g) ?? []).length;
  const exact12337Contexts = (text.match(/:\s*12337(?:,|\n|\r|\})/g) ?? []).length;
  const exactTableId949Contexts = (text.match(/"tableId"\s*:\s*949(?:,|\n|\r|\})/g) ?? []).length;
  const exactTableId12337Contexts = (text.match(/"tableId"\s*:\s*12337(?:,|\n|\r|\})/g) ?? []).length;
  const nameLikeContexts = (text.match(/selector|metadata|dictionary|lookup|enum|schema/gi) ?? []).length;
  return {
    filePath,
    exists: true,
    byteLength: Buffer.byteLength(text),
    exact949Contexts,
    exact12337Contexts,
    exactTableId949Contexts,
    exactTableId12337Contexts,
    nameLikeContexts,
    usefulCandidates: exactTableId949Contexts + exactTableId12337Contexts,
  };
}

const namedTableAudit = readJsonIfExists(namedTableAuditFile);
const decodedDictionaryScan = readJsonIfExists(decodedDictionaryScanFile);
const coverageAudit = readJsonIfExists(coverageAuditFile);
const tableCandidateContexts = [
  countLiteralContexts(tableCandidatesFile),
  countLiteralContexts(strictTableCandidatesFile),
];

const independentTableCandidates = namedTableAudit?.summary?.independentCandidates ?? 0;
const dictionaryNearWatched = decodedDictionaryScan?.summary?.dictionaryHitsNearWatchedNumbers ?? 0;
const missingDecodedAssets = coverageAudit?.summary?.missingDecodedAssets ?? null;
const secondCompact949Assets = coverageAudit?.summary?.secondCompact949Assets ?? null;
const usefulTableCandidateContexts = tableCandidateContexts.reduce((sum, row) => sum + row.usefulCandidates, 0);
const exactNumericContexts = tableCandidateContexts.reduce(
  (sum, row) => sum + row.exact949Contexts + row.exact12337Contexts,
  0
);

const localSourceExhausted =
  independentTableCandidates === 0 &&
  dictionaryNearWatched === 0 &&
  missingDecodedAssets === 0 &&
  secondCompact949Assets === 0 &&
  usefulTableCandidateContexts === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "local-table-source-alternative-audit-v1",
  source: {
    namedTableAudit: namedTableAuditFile,
    decodedDictionaryScan: decodedDictionaryScanFile,
    coverageAudit: coverageAuditFile,
    tableCandidates: tableCandidatesFile,
    strictTableCandidates: strictTableCandidatesFile,
  },
  summary: {
    independentTableCandidates,
    dictionaryNearWatched,
    missingDecodedAssets,
    secondCompact949Assets,
    usefulTableCandidateContexts,
    exactNumericContexts,
    assessment: {
      kind: localSourceExhausted
        ? "local-table-source-alternatives-exhausted"
        : "local-table-source-alternatives-still-open",
      confidence: localSourceExhausted ? "high" : "medium",
      fieldOwnership: "not-proven",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: localSourceExhausted
        ? "Les artefacts locaux ne contiennent ni table source nommee, ni dictionnaire proche, ni second compact selector 949 exploitable."
        : "Une ou plusieurs pistes locales restent a inspecter avant de fermer la recherche de table source.",
      nextAction: localSourceExhausted
        ? "Basculer vers une recherche hors artefacts locaux ou traiter les autres blocages SF_33/uptime sans promouvoir le delta DPS."
        : "Inspecter les pistes locales restantes avant toute promotion DPS.",
      evidence: {
        independentTableCandidates,
        dictionaryNearWatched,
        missingDecodedAssets,
        secondCompact949Assets,
        usefulTableCandidateContexts,
        exactNumericContexts,
      },
    },
  },
  tableCandidateContexts,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "local-table-source-alternatives.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
