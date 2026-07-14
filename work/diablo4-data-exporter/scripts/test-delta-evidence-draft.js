const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-draft-"));
const outDir = path.join(tempDir, "draft");

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

const originalInput = readJson("inputs/external-evidence-candidates.json");
run("build-delta-evidence-draft.js", [
  "outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json",
  outDir,
]);
const afterInput = readJson("inputs/external-evidence-candidates.json");

const report = readJson(path.join(outDir, "delta-evidence-draft.json"));
const dryRun = readJson(path.join(outDir, "external-evidence-candidates.draft.json"));

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterInput), "draft builder must not write the real intake");
assertInvariant(report.summary.templateId === "template-delta-proof-sf32-owner", "default draft should use first open SF_32 template");
assertInvariant(report.summary.candidateId === "draft-delta-proof-sf32-owner", "candidate id should be derived from template id");
assertInvariant(report.summary.placeholderFields > 0, "draft should expose placeholder fields");
assertInvariant(report.summary.draftReadyForCopy === false, "draft should not be copy-ready with placeholders");
assertInvariant(report.summary.canModifyReliableDps === false, "draft must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "draft must not mark promotion ready");
assertInvariant(report.candidate.reviewer?.status === "pending", "draft reviewer status must stay pending");
assertInvariant(dryRun.candidates?.length === 1, "dry run file should include one candidate");
assertInvariant(dryRun.candidates[0].draft === true, "dry run candidate should be marked as draft");

console.log(JSON.stringify({
  status: "delta-evidence-draft-test-ok",
  templateId: report.summary.templateId,
  candidateId: report.summary.candidateId,
  placeholderFields: report.summary.placeholderFields,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
