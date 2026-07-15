const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-diablo-tools-attribute-audit-"));
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

run("build-diablo-tools-attribute-source-audit.js", [
  "outputs/tools/Diablo4Tools_2026-06-19_win.7z",
  "outputs/tools/Diablo4Tools_2026-06-19_data/data/attributes.json",
  outDir,
]);

const report = readJson(path.join(outDir, "diablo-tools-attribute-source-audit.json"));
assertInvariant(report.source.archiveHashMatches === true, "archive hash must match the GitHub release digest");
assertInvariant(report.summary.selector949Name === "Damage_Percent_Reduction_From_Elites", "eAttrib 949 should map to Damage_Percent_Reduction_From_Elites");
assertInvariant(report.summary.bonusPercentPerPowerEAttrib === 994, "Bonus_Percent_Per_Power should map to eAttrib 994");
assertInvariant(report.summary.targetSelectorMapsToBonus === false, "selector 949 should not map to Bonus_Percent_Per_Power");
assertInvariant(report.summary.bonusMapsToSelector994 === true, "Bonus_Percent_Per_Power should map to selector 994");
assertInvariant(report.summary.sourceContradictsPriorSelectorAssumption === true, "audit should flag the prior selector assumption");
assertInvariant(report.summary.acceptedForBridge === false, "audit must not open bridge");
assertInvariant(report.summary.canModifyReliableDps === false, "audit must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "audit must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "audit must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "audit must not mark promotion ready");

console.log(JSON.stringify({
  status: "diablo-tools-attribute-source-audit-test-ok",
  selector949Name: report.summary.selector949Name,
  bonusPercentPerPowerEAttrib: report.summary.bonusPercentPerPowerEAttrib,
  sourceContradictsPriorSelectorAssumption: report.summary.sourceContradictsPriorSelectorAssumption,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
