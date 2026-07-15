const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-human-action-plan-"));
const outDir = path.join(tempDir, "plan");

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

run("build-delta-human-action-plan.js", [
  "outputs/diablo4-delta-manual-promotion-gate/delta-manual-promotion-gate.json",
  "outputs/diablo4-delta-evidence-draft/delta-evidence-draft.json",
  "outputs/diablo4-delta-evidence-intake-update-preview/delta-evidence-intake-update-preview.json",
  outDir,
]);

const report = readJson(path.join(outDir, "delta-human-action-plan.json"));
assertInvariant(report.summary.candidateId === "draft-delta-proof-sf32-owner", "action plan should target the SF_32 draft");
assertInvariant(report.summary.claimType === "sf32-field-ownership", "action plan should target SF_32 ownership");
assertInvariant(report.summary.claimField === "eAttrib:994 + local-role:949", "action plan should target revised SF_32 field");
assertInvariant(report.fillTasks.find((task) => task.field === "claim.mapping")?.hint.includes("eAttrib:994"), "action plan should guide the revised mapping");
assertInvariant(report.summary.placeholderFields === 7, "action plan should expose the seven current placeholders");
assertInvariant(report.fillTasks.length === 7, "action plan should include one fill task per placeholder");
assertInvariant(report.fillTasks[0].field === "source.title", "first fill task should be source.title");
assertInvariant(report.summary.failedGateIds.includes("preview-merge-ready"), "action plan should include preview gate failure");
assertInvariant(report.summary.failedGateIds.includes("draft-ready-for-intake"), "action plan should include draft gate failure");
assertInvariant(report.summary.writesRealIntake === false, "action plan must not write real intake");
assertInvariant(report.summary.canModifyReliableDps === false, "action plan must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "action plan must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "action plan must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "action plan must not mark promotion ready");
assertInvariant(report.orderedActions[0].id === "fill-draft-source", "first action should be filling the draft");
assertInvariant(report.orderedActions[0].status === "blocked", "first action should remain blocked while placeholders exist");

console.log(JSON.stringify({
  status: "delta-human-action-plan-test-ok",
  candidateId: report.summary.candidateId,
  placeholderFields: report.summary.placeholderFields,
  failedGateIds: report.summary.failedGateIds,
  writesRealIntake: report.summary.writesRealIntake,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
