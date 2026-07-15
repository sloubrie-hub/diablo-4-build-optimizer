const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-selector-949-reconcile-"));
const outDir = path.join(tempDir, "audit");

function run(scriptName, args) {
  const result = spawnSync(process.execPath, [path.join(scriptDir, scriptName), ...args], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${scriptName} failed with exit code ${result.status}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

run("build-selector-949-reconciliation-audit.js", [
  "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
  "outputs/diablo4-selector-949-peer-audit/selector-949-peer-audit.json",
  "outputs/diablo4-metadata-12337-context-audit/metadata-12337-context-audit.json",
  "outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json",
  outDir,
]);

const report = readJson(path.join(outDir, "selector-949-reconciliation-audit.json"));
assertInvariant(report.summary.assetId === 1663210, "reconciliation must target asset 1663210");
assertInvariant(report.summary.selector994Aligned === true, "selector 994 must align with DiabloTools");
assertInvariant(report.summary.selector949Contradicted === true, "selector 949 must be contradicted by DiabloTools");
assertInvariant(report.summary.compact949Unique === true, "compact 949 should remain unique");
assertInvariant(report.summary.metadataCrossSelector === true, "metadata 12337 should be cross-selector");
assertInvariant(report.summary.needsReinterpretation === true, "949 should need reinterpretation");
assertInvariant(report.summary.recommendedNextFocus === "reinterpret-local-949-as-non-eattrib-or-wrapper", "next focus should reinterpret local 949");
assertInvariant(report.summary.acceptedForBridge === false, "reconciliation must not open bridge");
assertInvariant(report.summary.canModifyReliableDps === false, "reconciliation must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "reconciliation must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "reconciliation must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "reconciliation must not mark promotion ready");
assertInvariant(report.revisedHypotheses.some((item) => item.id === "h2-994-is-bonus-eattrib" && item.status === "favored"), "994 hypothesis should be favored");

console.log(JSON.stringify({
  status: "selector-949-reconciliation-audit-test-ok",
  selector994Aligned: report.summary.selector994Aligned,
  selector949Contradicted: report.summary.selector949Contradicted,
  recommendedNextFocus: report.summary.recommendedNextFocus,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
