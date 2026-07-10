const fs = require("fs");
const path = require("path");

const outputsDir = process.argv[2] ?? "outputs";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-activation-source-corpus";
const trigger = process.argv[4] ?? "Mod.SoilRuler_B";
const currentAssetId = Number(process.argv[5] ?? 1663210);

const DEFINITION_REPORT_NAMES = new Set([
  "diablo4-conditional-definition-search",
  "diablo4-conditional-definition-search-full-target-scan",
  "diablo4-conditional-definition-search-merged-test",
]);

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (/\.(json|md|txt)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function classifyPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  if (/rapport-outil-exportateur-diablo4\.md$/.test(normalized)) return "project-report";
  if (/diablo4-sf33-build-state-trigger-audit\//.test(normalized)) return "sf33-generated-audit";
  if (/diablo4-target-blocker-resolution\//.test(normalized)) return "target-blocker-report";
  if (/diablo4-source-asset-1663210/.test(normalized)) return "current-source-asset";
  if (/diablo4-conditional-definition-search/.test(normalized)) return "definition-search-report";
  if (/diablo4-conditional-/.test(normalized)) return "conditional-derived-report";
  if (/diablo4-deadbeef-analysis-v2/.test(normalized)) return "raw-directory-analysis";
  if (/diablo4-priority-asset-inspection/.test(normalized)) return "priority-asset-derived-report";
  if (/diablo4-sf-candidates/.test(normalized)) return "sf-candidate-derived-report";
  if (/diablo4-external-target-scan-plan/.test(normalized)) return "scan-plan";
  if (/diablo4-external-target/.test(normalized)) return "external-target-search-report";
  if (/diablo4-build-state/.test(normalized)) return "build-state-report";
  return "other-generated-report";
}

function collectTextHits(files) {
  const rows = [];
  for (const filePath of files) {
    const stat = fs.statSync(filePath);
    if (stat.size > 80 * 1024 * 1024) continue;
    const text = fs.readFileSync(filePath, "utf8");
    const count = [...text.matchAll(new RegExp(escapeRegExp(trigger), "g"))].length;
    if (!count) continue;
    rows.push({
      filePath,
      category: classifyPath(filePath),
      bytes: stat.size,
      hits: count,
    });
  }
  return rows.sort((a, b) => b.hits - a.hits || a.filePath.localeCompare(b.filePath));
}

function collectDefinitionEvidence(outputsRoot) {
  const reports = [];
  for (const reportName of DEFINITION_REPORT_NAMES) {
    const filePath = path.join(outputsRoot, reportName, "conditional-definition-search.json");
    const report = readJsonIfExists(filePath);
    if (!report) continue;
    const targets = [];
    for (const asset of report.assets ?? []) {
      for (const target of asset.targets ?? []) {
        if (target.target !== trigger) continue;
        targets.push({
          reportName,
          reportPath: filePath,
          ownerAssetId: asset.assetId ?? null,
          role: target.role,
          definitionAssessment: target.definitionAssessment ?? null,
          exactMatchAssetIds: (target.exactMatches ?? []).map((match) => match.assetId).filter(Number.isFinite),
          sameKeyAnalogies: target.sameKeyAnalogies?.length ?? 0,
          sourceCandidate: target.sourceCandidate ?? null,
        });
      }
    }
    reports.push(...targets);
  }
  return reports;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const files = walkFiles(outputsDir);
const textHits = collectTextHits(files);
const definitionEvidence = collectDefinitionEvidence(outputsDir);
const exactAssetIds = [...new Set(definitionEvidence.flatMap((row) => row.exactMatchAssetIds))].sort((a, b) => a - b);
const externalExactAssetIds = exactAssetIds.filter((assetId) => assetId !== currentAssetId);
const categories = Object.fromEntries(
  [...new Set(textHits.map((row) => row.category))]
    .sort()
    .map((category) => [
      category,
      {
        files: textHits.filter((row) => row.category === category).length,
        hits: textHits.filter((row) => row.category === category).reduce((sum, row) => sum + row.hits, 0),
      },
    ])
);

const hasIndependentActivationSource = externalExactAssetIds.length > 0;
const assessment = {
  kind: hasIndependentActivationSource
    ? "sf33-activation-source-candidate-found"
    : "sf33-activation-source-not-found-local-corpus",
  confidence: definitionEvidence.length ? "high" : "medium",
  promotionReady: false,
  blocker: hasIndependentActivationSource ? "uptime-not-proven" : "sf33-trigger-build-state-unmapped",
  finding: hasIndependentActivationSource
    ? "Un ou plusieurs assets externes contiennent le trigger exact; ils doivent etre inspectes avant toute promotion."
    : "Le corpus local ne montre pas de source d'activation autonome pour Mod.SoilRuler_B; les definitions exactes restent limitees a l'asset 1663210.",
  nextAction: hasIndependentActivationSource
    ? "Decoder et inspecter les assets externes qui portent Mod.SoilRuler_B, puis mapper le toggle de build sans promouvoir l'uptime."
    : "Elargir la recherche hors artefacts locaux ou explorer les donnees d'upgrade/aspect/passif liees a Spiritborn_Talent_Ultimate_2.",
  evidence: {
    trigger,
    currentAssetId,
    exactAssetIds,
    externalExactAssetIds,
    definitionReports: definitionEvidence.map((row) => ({
      reportName: row.reportName,
      ownerAssetId: row.ownerAssetId,
      role: row.role,
      assessment: row.definitionAssessment?.kind ?? null,
      exactMatchAssetIds: row.exactMatchAssetIds,
      sameKeyAnalogies: row.sameKeyAnalogies,
      sourceCandidate: row.sourceCandidate,
    })),
    categories,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-activation-source-corpus-audit-v1",
  source: {
    outputsDir,
    trigger,
    currentAssetId,
    scannedFiles: files.length,
  },
  summary: {
    filesWithHits: textHits.length,
    totalHits: textHits.reduce((sum, row) => sum + row.hits, 0),
    exactAssetIds,
    externalExactAssetIds,
    hasIndependentActivationSource,
    assessment,
  },
  hitFiles: textHits.slice(0, 200),
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-activation-source-corpus.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
