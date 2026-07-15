const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-selector-949-window-reparse-"));
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

run("build-selector-949-window-reparse-audit.js", [
  "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
  "outputs/diablo4-selector-949-peer-audit/selector-949-peer-audit.json",
  "outputs/diablo4-metadata-12337-context-audit/metadata-12337-context-audit.json",
  "outputs/diablo4-diablo-tools-attribute-source-audit/diablo-tools-attribute-source-audit.json",
  outDir,
]);

const report = readJson(path.join(outDir, "selector-949-window-reparse-audit.json"));
assertInvariant(report.summary.assetId === 1663210, "window reparse must target asset 1663210");
assertInvariant(report.summary.selector994DirectExamples >= 3, "window reparse must keep selector 994 direct examples");
assertInvariant(report.summary.selector949Examples === 2, "window reparse must keep two selector 949 examples");
assertInvariant(report.summary.selector949CompactExamples === 1, "window reparse must keep one compact selector 949 example");
assertInvariant(report.summary.selector949NonCompactExamples === 1, "window reparse must keep one non compact selector 949 example");
assertInvariant(report.summary.selector994AlignedWithAttribute === true, "selector 994 must align with Bonus_Percent_Per_Power");
assertInvariant(report.summary.selector949NotBonusEAttrib === true, "selector 949 must not be treated as Bonus_Percent_Per_Power");
assertInvariant(report.summary.selector949CompactHasAssetInline === true, "asset 1663210 compact window must keep inline asset metadata");
assertInvariant(report.summary.metadata12337CrossSelector === true, "metadata 12337 must remain cross-selector");
assertInvariant(report.summary.windowReparseStatus === "wrapper-or-layout-candidate", "949 window should be wrapper/layout candidate");
assertInvariant(report.summary.sf32TemplateNeedsRevision === true, "SF_32 template should need revision");
assertInvariant(report.summary.acceptedForBridge === false, "window reparse must not open bridge");
assertInvariant(report.summary.canModifyReliableDps === false, "window reparse must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "window reparse must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "window reparse must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "window reparse must not mark promotion ready");
assertInvariant(report.revisedClaims.some((item) => item.id === "sf32-field-ownership-selector-949" && item.status === "suspended"), "selector 949 SF_32 claim must be suspended");
assertInvariant(report.revisedClaims.some((item) => item.id === "bonus-percent-attribute-anchor-selector-994" && item.status === "source-backed"), "selector 994 claim must be source-backed");

console.log(JSON.stringify({
  status: "selector-949-window-reparse-audit-test-ok",
  windowReparseStatus: report.summary.windowReparseStatus,
  sf32TemplateNeedsRevision: report.summary.sf32TemplateNeedsRevision,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
