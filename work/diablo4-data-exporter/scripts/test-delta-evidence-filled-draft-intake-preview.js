const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-filled-draft-preview-"));
const blockedPreviewOutDir = path.join(tempDir, "blocked-preview");
const filledPatchOutDir = path.join(tempDir, "filled-patch");
const filledAuditOutDir = path.join(tempDir, "filled-audit");
const readyPreviewOutDir = path.join(tempDir, "ready-preview");
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

run("preview-delta-evidence-filled-draft-intake.js", [
  "outputs/diablo4-delta-evidence-filled-draft/external-evidence-candidates.filled-draft.json",
  "outputs/diablo4-delta-evidence-filled-draft-audit/delta-evidence-filled-draft-audit.json",
  "inputs/external-evidence-candidates.json",
  blockedPreviewOutDir,
]);

const blockedPreview = readJson(path.join(blockedPreviewOutDir, "delta-evidence-filled-draft-intake-preview.json"));
const afterBlockedInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterBlockedInput), "blocked preview must not write real intake");
assertInvariant(blockedPreview.summary.previewMergeReady === false, "real empty patch should not be preview-ready");
assertInvariant(blockedPreview.summary.previewCandidates === originalInput.candidates.length, "blocked preview should not add candidates");
assertInvariant(blockedPreview.summary.canModifyReliableDps === false, "blocked preview must not modify reliable DPS");
assertInvariant(blockedPreview.summary.promotionReady === false, "blocked preview must not auto-promote");

const filledForm = readJson("outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json");
const values = new Map([
  ["source.title", "Synthetic exact SF_32 source for preview test"],
  ["source.version", "3.0.4.72271-test"],
  ["source.capturedAt", "2026-07-15"],
  ["claim.value", "SF_32"],
  ["claim.excerpt", "1663210 eAttrib:994 Bonus_Percent_Per_Power local-role:949 SF_32"],
  ["claim.mapping", "1663210 -> eAttrib:994 / Bonus_Percent_Per_Power -> local-role:949 -> SF_32"],
  ["reviewer.notes[4]", "Synthetic preview note: source fields replaced for dry-run preview."],
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
  filledPatchOutDir,
]);

run("audit-delta-evidence-filled-draft.js", [
  path.join(filledPatchOutDir, "external-evidence-candidates.filled-draft.json"),
  path.join(filledPatchOutDir, "delta-evidence-filled-draft.json"),
  filledAuditOutDir,
]);

run("preview-delta-evidence-filled-draft-intake.js", [
  path.join(filledPatchOutDir, "external-evidence-candidates.filled-draft.json"),
  path.join(filledAuditOutDir, "delta-evidence-filled-draft-audit.json"),
  "inputs/external-evidence-candidates.json",
  readyPreviewOutDir,
]);

const readyPreview = readJson(path.join(readyPreviewOutDir, "delta-evidence-filled-draft-intake-preview.json"));
const readyPreviewFile = readJson(path.join(readyPreviewOutDir, "external-evidence-candidates.filled-draft.preview.json"));
const afterReadyInput = readJson("inputs/external-evidence-candidates.json");
const addedCandidate = readyPreviewFile.candidates.at(-1);

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterReadyInput), "ready preview must not write real intake");
assertInvariant(readyPreview.summary.previewMergeReady === true, "synthetic filled patch should be preview-ready");
assertInvariant(readyPreview.summary.previewCandidates === originalInput.candidates.length + 1, "ready preview should add one candidate");
assertInvariant(addedCandidate.id === "draft-delta-proof-sf32-owner", "ready preview should add target candidate");
assertInvariant(addedCandidate.reviewer.status === "pending", "ready preview candidate must stay pending");
assertInvariant(addedCandidate.draft == null, "ready preview should remove draft flag");
assertInvariant(addedCandidate.templateId == null, "ready preview should remove template id");
assertInvariant(readyPreview.summary.writesRealIntake === false, "ready preview must not write real intake");
assertInvariant(readyPreview.summary.acceptedForBridge === false, "ready preview must not accept bridge");
assertInvariant(readyPreview.summary.canModifyReliableDps === false, "ready preview must not modify reliable DPS");
assertInvariant(readyPreview.summary.canUseForReliableDps === false, "ready preview must not allow reliable DPS");
assertInvariant(readyPreview.summary.canUseForRanking === false, "ready preview must not allow ranking");
assertInvariant(readyPreview.summary.promotionReady === false, "ready preview must not auto-promote");

console.log(JSON.stringify({
  status: "delta-evidence-filled-draft-intake-preview-test-ok",
  realPreviewMergeReady: blockedPreview.summary.previewMergeReady,
  syntheticPreviewMergeReady: readyPreview.summary.previewMergeReady,
  previewCandidates: readyPreview.summary.previewCandidates,
  reviewerStatus: addedCandidate.reviewer.status,
  canModifyReliableDps: readyPreview.summary.canModifyReliableDps,
  promotionReady: readyPreview.summary.promotionReady,
}, null, 2));
