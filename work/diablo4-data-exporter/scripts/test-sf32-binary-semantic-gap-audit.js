const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-sf32-binary-semantic-gap-"));
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

run("build-sf32-binary-semantic-gap-audit.js", [
  "outputs/diablo4-selector-asset-record-binary-verification/selector-asset-record-binary-verification.json",
  "outputs/diablo4-sf32-owner-source-hunt-plan/sf32-owner-source-hunt-plan.json",
  outDir,
]);

const report = readJson(path.join(outDir, "sf32-binary-semantic-gap-audit.json"));

assertInvariant(report.summary.binaryStructureReady === true, "binary structure should be ready");
assertInvariant(report.summary.validatedStructure === 5, "five structural facts should be validated");
assertInvariant(report.summary.failedStructure === 0, "no structural facts should fail");
assertInvariant(report.summary.missingSemantics === 4, "semantic requirements should remain missing");
assertInvariant(report.summary.sf32OwnerProven === false, "SF_32 ownership must remain unproven");
assertInvariant(report.summary.semanticBridgeReady === false, "semantic bridge must stay closed");
assertInvariant(report.summary.canModifyReliableDps === false, "semantic gap audit must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "semantic gap audit must not be promotion ready");
assertInvariant((report.rejectedPromotions ?? []).length === 4, "four promotion shortcuts should be rejected");
assertInvariant(report.sourceHuntSnapshot.acceptedEvidence === 0, "source hunt should still have no accepted evidence");

console.log(JSON.stringify({
  status: "sf32-binary-semantic-gap-audit-test-ok",
  binaryStructureReady: report.summary.binaryStructureReady,
  missingSemantics: report.summary.missingSemantics,
  sf32OwnerProven: report.summary.sf32OwnerProven,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
