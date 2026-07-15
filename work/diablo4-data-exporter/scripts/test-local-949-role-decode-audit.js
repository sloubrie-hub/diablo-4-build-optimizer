const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-local-949-role-"));
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

run("build-local-949-role-decode-audit.js", [
  "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  "outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json",
  "outputs/diablo4-bonus-percent-selector-matrix/bonus-percent-selector-matrix.json",
  outDir,
]);

const report = readJson(path.join(outDir, "local-949-role-decode-audit.json"));
assertInvariant(report.summary.assetId === 1663210, "local 949 role audit must target asset 1663210");
assertInvariant(report.summary.localRole === "local-record-selector-with-layout-overload", "949 should decode as overloaded local record selector");
assertInvariant(report.summary.selector949Layouts >= 2, "949 should keep mixed layouts");
assertInvariant(report.summary.selector949AtRecordHead === true, "949 should be at record head");
assertInvariant(report.summary.selector949HasAssetRef === true, "949 should have assetRef at +4");
assertInvariant(report.summary.selector994AtRecordHead === true, "994 reference should be at record head");
assertInvariant(report.summary.compactHasMetadataOpcodeScale === true, "949 compact should keep metadata/opcode/scale tail");
assertInvariant(report.summary.nonCompactHasVariantTail === true, "949 should keep non compact variant tail");
assertInvariant(report.summary.externalBonusAnchorIs994 === true, "994 should remain the external bonus anchor");
assertInvariant(report.summary.selector949NotBonusEAttrib === true, "949 should not be treated as bonus eAttrib");
assertInvariant(report.summary.roleDecoded === true, "949 local role should be decoded structurally");
assertInvariant(report.summary.bridgeReady === false, "local role decode must not open bridge");
assertInvariant(report.summary.canModifyReliableDps === false, "local role decode must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "local role decode must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "local role decode must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "local role decode must not mark promotion ready");
assertInvariant(report.rejectedRoles.some((item) => item.role === "opcode" && item.status === "rejected"), "opcode role must be rejected");
assertInvariant(report.rejectedRoles.some((item) => item.role === "direct-bonus-eattrib" && item.status === "rejected"), "direct bonus eAttrib role must be rejected");

console.log(JSON.stringify({
  status: "local-949-role-decode-audit-test-ok",
  localRole: report.summary.localRole,
  roleDecoded: report.summary.roleDecoded,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
