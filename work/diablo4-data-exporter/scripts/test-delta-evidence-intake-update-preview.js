const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-intake-update-preview-"));
const draftOutDir = path.join(tempDir, "draft");
const blockedPreviewOutDir = path.join(tempDir, "blocked-preview");
const filledInput = path.join(tempDir, "external-evidence-candidates.filled.json");
const readyPreviewOutDir = path.join(tempDir, "ready-preview");

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

const originalIntake = readJson("inputs/external-evidence-candidates.json");

run("build-delta-evidence-draft.js", [
  "outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json",
  draftOutDir,
]);
const draftInput = path.join(draftOutDir, "external-evidence-candidates.draft.json");
run("preview-delta-evidence-intake-update.js", [
  draftInput,
  "inputs/external-evidence-candidates.json",
  blockedPreviewOutDir,
]);

const blockedReport = readJson(path.join(blockedPreviewOutDir, "delta-evidence-intake-update-preview.json"));
assertInvariant(blockedReport.summary.previewMergeReady === false, "placeholder draft must not be merge-ready");
assertInvariant(blockedReport.summary.previewCandidates === originalIntake.candidates.length, "blocked preview should not add candidates");
assertInvariant(blockedReport.summary.writesRealIntake === false, "preview must not write real intake");
assertInvariant(blockedReport.summary.canModifyReliableDps === false, "blocked preview must not modify reliable DPS");

const filled = readJson(draftInput);
filled.candidates[0].source.title = "Fixture extracted table";
filled.candidates[0].source.version = "fixture-build";
filled.candidates[0].source.capturedAt = "2026-07-14";
filled.candidates[0].claim.value = "SF_32 owner mapping";
filled.candidates[0].claim.excerpt = "1663210 eAttrib:994 Bonus_Percent_Per_Power local-role:949 SF_32";
filled.candidates[0].claim.mapping = "1663210 -> eAttrib:994 / Bonus_Percent_Per_Power -> local-role:949 -> SF_32";
filled.candidates[0].reviewer.status = "pending";
filled.candidates[0].reviewer.notes = [
  "Fixture source verified structurally; reviewer approval still required.",
];
writeJson(filledInput, filled);
run("preview-delta-evidence-intake-update.js", [
  filledInput,
  "inputs/external-evidence-candidates.json",
  readyPreviewOutDir,
]);

const readyReport = readJson(path.join(readyPreviewOutDir, "delta-evidence-intake-update-preview.json"));
const readyPreview = readJson(path.join(readyPreviewOutDir, "external-evidence-candidates.preview.json"));
const afterIntake = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalIntake) === JSON.stringify(afterIntake), "preview builder must not write real intake");
assertInvariant(readyReport.summary.previewMergeReady === true, "filled pending draft should be merge-ready");
assertInvariant(readyReport.summary.previewCandidates === originalIntake.candidates.length + 1, "ready preview should append one candidate");
assertInvariant(readyReport.summary.acceptedForBridge === false, "preview must not mark accepted for bridge");
assertInvariant(readyReport.summary.canModifyReliableDps === false, "ready preview must not modify reliable DPS");
assertInvariant(readyReport.summary.promotionReady === false, "ready preview must not mark promotion ready");
assertInvariant(readyPreview.candidates.at(-1).draft == null, "preview candidate should remove draft-only marker");
assertInvariant(readyPreview.candidates.at(-1).templateId == null, "preview candidate should remove template id");
assertInvariant(readyPreview.candidates.at(-1).reviewer.status === "pending", "preview candidate must remain pending");

console.log(JSON.stringify({
  status: "delta-evidence-intake-update-preview-test-ok",
  blockedPreviewMergeReady: blockedReport.summary.previewMergeReady,
  readyPreviewMergeReady: readyReport.summary.previewMergeReady,
  previewCandidates: readyReport.summary.previewCandidates,
  writesRealIntake: readyReport.summary.writesRealIntake,
  canModifyReliableDps: readyReport.summary.canModifyReliableDps,
  promotionReady: readyReport.summary.promotionReady,
}, null, 2));
