const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-d4data-parser-reference-"));
const outDir = path.join(tempDir, "out");

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

run("build-community-source-triage-audit.js", [path.join(tempDir, "community")]);
run("build-selector-asset-record-parser-contract.js", [
  "outputs/diablo4-local-949-role-decode-audit/local-949-role-decode-audit.json",
  "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  path.join(tempDir, "contract"),
]);
run("build-d4data-parser-reference-audit.js", [
  path.join(tempDir, "community", "community-source-triage-audit.json"),
  path.join(tempDir, "contract", "selector-asset-record-parser-contract.json"),
  outDir,
]);

const report = readJson(path.join(outDir, "d4data-parser-reference-audit.json"));
const checkStatuses = new Set((report.checks ?? []).map((check) => check.status));

assertInvariant(report.summary.sourceId === "diablotools-d4data", "source should be DiabloTools/d4data");
assertInvariant(report.summary.d4dataReferenceReady === true, "d4data reference should be ready");
assertInvariant(report.summary.parserContractCompatible === true, "parser contract should be compatible");
assertInvariant(report.summary.failedChecks === 0, "d4data reference checks should pass");
assertInvariant(report.summary.canImplementReadOnlyParser === true, "read-only parser should be implementable");
assertInvariant(report.summary.semanticBridgeReady === false, "semantic bridge must remain closed");
assertInvariant(report.summary.canModifyReliableDps === false, "d4data audit must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "d4data audit must not be promotion ready");
assertInvariant(!checkStatuses.has("failed"), "no checks should fail");

console.log(JSON.stringify({
  status: "d4data-parser-reference-audit-test-ok",
  sourceId: report.summary.sourceId,
  d4dataReferenceReady: report.summary.d4dataReferenceReady,
  failedChecks: report.summary.failedChecks,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
