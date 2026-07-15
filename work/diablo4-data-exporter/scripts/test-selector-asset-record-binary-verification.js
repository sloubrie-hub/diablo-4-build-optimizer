const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-selector-asset-binary-verification-"));
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

run("build-selector-asset-record-binary-verification.js", [
  "outputs/diablo4-selector-asset-record-parser/selector-asset-record-parser.json",
  outDir,
]);

const report = readJson(path.join(outDir, "selector-asset-record-binary-verification.json"));
const target = (report.verifications ?? []).find((record) =>
  record.assetRef === 1663210 &&
  record.selector === 949 &&
  record.layoutId === "compact-metadata-scale-layout"
);
const field = (role) => target?.fields?.find((item) => item.role === role);

assertInvariant(report.summary.binaryVerificationReady === true, "binary verification should be ready");
assertInvariant(report.summary.records === 5, "binary verification should inspect five records");
assertInvariant(report.summary.binaryVerifiedRecords === 5, "all records should verify against binary offsets");
assertInvariant(report.summary.failedRecordVerifications === 0, "no binary verification should fail");
assertInvariant(report.summary.targetBinaryVerified === true, "target 1663210 should verify");
assertInvariant(report.summary.targetSelectorU32 === 949, "target selector should be 949");
assertInvariant(report.summary.targetAssetRefU32 === 1663210, "target assetRef should be 1663210");
assertInvariant(report.summary.targetMetadataIdU32 === 12337, "target metadataId should be 12337");
assertInvariant(report.summary.targetOpcodeU32 === 6, "target opcode should be 6");
assertInvariant(report.summary.targetScaleF32 === 10, "target scale should be float 10");
assertInvariant(report.summary.canModifyReliableDps === false, "binary verification must not modify reliable DPS");
assertInvariant(report.summary.acceptedForBridge === false, "binary verification must not open bridge");
assertInvariant(Boolean(target), "target verification missing");
assertInvariant(field("scale")?.read?.preferredValueKind === "f32", "scale should be read as f32");
assertInvariant((report.verifications ?? []).every((record) => record.safeguards?.canModifyReliableDps === false), "record safeguards must protect reliable DPS");

console.log(JSON.stringify({
  status: "selector-asset-record-binary-verification-test-ok",
  records: report.summary.records,
  targetBinaryVerified: report.summary.targetBinaryVerified,
  targetScaleF32: report.summary.targetScaleF32,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
