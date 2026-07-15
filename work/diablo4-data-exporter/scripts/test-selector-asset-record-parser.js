const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-selector-asset-record-parser-"));
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

run("build-selector-asset-record-parser.js", [
  "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  "outputs/diablo4-selector-asset-record-parser-contract/selector-asset-record-parser-contract.json",
  "outputs/diablo4-d4data-parser-reference-audit/d4data-parser-reference-audit.json",
  outDir,
]);

const report = readJson(path.join(outDir, "selector-asset-record-parser.json"));
const targetRecords = (report.records ?? []).filter((record) => record.assetRef === 1663210);
const targetCompact949 = targetRecords.find((record) =>
  record.selector === 949 && record.layoutId === "compact-metadata-scale-layout"
);
const forbiddenKeys = ["reliableDps", "promotionReady", "canUseForReliableDps", "acceptedForBridge"];

assertInvariant(report.summary.readOnlyParserReady === true, "read-only parser should be ready");
assertInvariant(report.summary.records === 5, "parser should emit five contracted records");
assertInvariant(report.summary.targetRecords === 1, "parser should emit one target 1663210 record");
assertInvariant(report.summary.sourceBackedAnchorRecords === 3, "parser should keep three source-backed 994 anchors");
assertInvariant(report.summary.unresolvedPayloadRecords === 2, "parser should keep two unresolved 949 payload records");
assertInvariant(report.summary.failedInvariants === 0, "parser invariants should pass");
assertInvariant(report.summary.canModifyReliableDps === false, "parser must not modify reliable DPS");
assertInvariant(report.summary.acceptedForBridge === false, "parser must not open bridge");
assertInvariant(Boolean(targetCompact949), "target compact 949 record missing");
assertInvariant(targetCompact949.payloadStatus === "payload-unresolved", "target compact 949 must remain unresolved");
assertInvariant(targetCompact949.fields.some((field) => field.role === "metadataId" && field.value === 12337), "target metadataId missing");
assertInvariant(targetCompact949.fields.some((field) => field.role === "opcode" && field.value === 6), "target opcode missing");
assertInvariant(targetCompact949.fields.some((field) => field.role === "scale" && field.value === 10), "target scale missing");
assertInvariant((report.records ?? []).every((record) => forbiddenKeys.every((key) => !(key in record))), "records must not contain forbidden top-level output fields");
assertInvariant((report.records ?? []).every((record) => record.safeguards?.canModifyReliableDps === false), "record safeguards must protect reliable DPS");

console.log(JSON.stringify({
  status: "selector-asset-record-parser-test-ok",
  records: report.summary.records,
  targetRecords: report.summary.targetRecords,
  readOnlyParserReady: report.summary.readOnlyParserReady,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
