const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-fill-form-"));
const outDir = path.join(tempDir, "form");

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

run("build-delta-evidence-fill-form.js", [
  "outputs/diablo4-delta-human-action-plan/delta-human-action-plan.json",
  outDir,
]);

const form = readJson(path.join(outDir, "delta-evidence-fill-form.json"));
const markdown = fs.readFileSync(path.join(outDir, "delta-evidence-fill-form.md"), "utf8");

assertInvariant(form.summary.candidateId === "draft-delta-proof-sf32-owner", "form should target the SF_32 draft");
assertInvariant(form.summary.claimType === "sf32-field-ownership", "form should target SF_32 ownership");
assertInvariant(form.summary.claimField === "eAttrib:994 + local-role:949", "form should target revised SF_32 field");
assertInvariant(form.summary.fields === 7, "form should expose seven fields");
assertInvariant(form.summary.requiredFields === 7, "all current fields should be required");
assertInvariant(form.summary.completedFields === 0, "empty form should have no completed fields");
assertInvariant(form.summary.readyForDraftPatch === false, "empty form should not be ready for draft patch");
assertInvariant(form.summary.writesRealIntake === false, "form must not write real intake");
assertInvariant(form.summary.canModifyReliableDps === false, "form must not modify reliable DPS");
assertInvariant(form.summary.canUseForReliableDps === false, "form must not allow reliable DPS");
assertInvariant(form.summary.canUseForRanking === false, "form must not allow ranking");
assertInvariant(form.summary.promotionReady === false, "form must not mark promotion ready");
assertInvariant(form.fields.every((field) => field.value === "" && field.status === "empty"), "all form fields should be empty");
assertInvariant(form.fields[0].field === "source.title", "first field should be source.title");
assertInvariant(markdown.includes("| source.title |"), "markdown form should include source.title row");
assertInvariant(markdown.includes("Formulaire preuve delta"), "markdown form should include title");

console.log(JSON.stringify({
  status: "delta-evidence-fill-form-test-ok",
  candidateId: form.summary.candidateId,
  fields: form.summary.fields,
  completedFields: form.summary.completedFields,
  readyForDraftPatch: form.summary.readyForDraftPatch,
  canModifyReliableDps: form.summary.canModifyReliableDps,
  promotionReady: form.summary.promotionReady,
}, null, 2));
