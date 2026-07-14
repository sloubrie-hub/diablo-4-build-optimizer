const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-filled-draft-"));
const emptyOutDir = path.join(tempDir, "empty");
const filledOutDir = path.join(tempDir, "filled");
const filledFormFile = path.join(tempDir, "delta-evidence-fill-form.filled.json");

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

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

const originalInput = readJson("inputs/external-evidence-candidates.json");

run("apply-delta-evidence-fill-form.js", [
  "outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json",
  "outputs/diablo4-delta-evidence-draft/external-evidence-candidates.draft.json",
  emptyOutDir,
]);

const emptyReport = readJson(path.join(emptyOutDir, "delta-evidence-filled-draft.json"));
const emptyDraft = readJson(path.join(emptyOutDir, "external-evidence-candidates.filled-draft.json"));
const afterEmptyInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterEmptyInput), "empty patch must not write real intake");
assertInvariant(emptyReport.summary.completedFields === 0, "empty form should not patch fields");
assertInvariant(emptyReport.summary.missingFields === 7, "empty form should expose seven missing fields");
assertInvariant(emptyReport.summary.readyForDraftAudit === false, "empty form should not be ready for audit");
assertInvariant(emptyReport.summary.canModifyReliableDps === false, "empty patch must not modify reliable DPS");
assertInvariant(emptyReport.summary.promotionReady === false, "empty patch must not auto-promote");
assertInvariant(emptyDraft.candidates[0].reviewer.status === "pending", "empty patch must preserve pending status");

const filledForm = readJson("outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json");
const values = new Map([
  ["source.title", "Synthetic exact SF_32 source for test"],
  ["source.version", "3.0.4.72271-test"],
  ["source.capturedAt", "2026-07-15"],
  ["claim.value", "SF_32"],
  ["claim.excerpt", "1663210 selector:949 SF_32"],
  ["claim.mapping", "1663210 -> selector:949 -> SF_32"],
  ["reviewer.notes[4]", "Synthetic test note: source fields replaced for dry-run audit."],
]);
filledForm.fields = filledForm.fields.map((field) => ({
  ...field,
  value: values.get(field.field) ?? "",
  status: values.has(field.field) ? "filled" : field.status,
}));
writeJson(filledFormFile, filledForm);

run("apply-delta-evidence-fill-form.js", [
  filledFormFile,
  "outputs/diablo4-delta-evidence-draft/external-evidence-candidates.draft.json",
  filledOutDir,
]);

const filledReport = readJson(path.join(filledOutDir, "delta-evidence-filled-draft.json"));
const filledDraft = readJson(path.join(filledOutDir, "external-evidence-candidates.filled-draft.json"));
const afterFilledInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterFilledInput), "filled patch must not write real intake");
assertInvariant(filledReport.summary.completedFields === 7, "filled form should patch seven fields");
assertInvariant(filledReport.summary.missingFields === 0, "filled form should have no missing fields");
assertInvariant(filledReport.summary.remainingPlaceholderFields === 0, "filled form should remove placeholders");
assertInvariant(filledReport.summary.readyForDraftAudit === true, "filled form should be ready for dry-run audit");
assertInvariant(filledReport.summary.canModifyReliableDps === false, "filled patch must not modify reliable DPS");
assertInvariant(filledReport.summary.canUseForReliableDps === false, "filled patch must not allow reliable DPS");
assertInvariant(filledReport.summary.canUseForRanking === false, "filled patch must not allow ranking");
assertInvariant(filledReport.summary.promotionReady === false, "filled patch must not auto-promote");
assertInvariant(filledDraft.candidates[0].source.title === "Synthetic exact SF_32 source for test", "filled draft should patch source title");
assertInvariant(filledDraft.candidates[0].reviewer.status === "pending", "filled draft must stay pending");

console.log(JSON.stringify({
  status: "delta-evidence-filled-draft-test-ok",
  emptyReadyForDraftAudit: emptyReport.summary.readyForDraftAudit,
  filledReadyForDraftAudit: filledReport.summary.readyForDraftAudit,
  completedFields: filledReport.summary.completedFields,
  canModifyReliableDps: filledReport.summary.canModifyReliableDps,
  promotionReady: filledReport.summary.promotionReady,
}, null, 2));
