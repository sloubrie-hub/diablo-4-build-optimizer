const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-filled-draft-audit-"));
const blockedOutDir = path.join(tempDir, "blocked-audit");
const filledPatchOutDir = path.join(tempDir, "filled-patch");
const readyAuditOutDir = path.join(tempDir, "ready-audit");
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

run("audit-delta-evidence-filled-draft.js", [
  "outputs/diablo4-delta-evidence-filled-draft/external-evidence-candidates.filled-draft.json",
  "outputs/diablo4-delta-evidence-filled-draft/delta-evidence-filled-draft.json",
  blockedOutDir,
]);

const blockedAudit = readJson(path.join(blockedOutDir, "delta-evidence-filled-draft-audit.json"));
const afterBlockedInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterBlockedInput), "blocked audit must not write real intake");
assertInvariant(blockedAudit.summary.readyForPreview === false, "real empty filled draft should not be ready for preview");
assertInvariant(blockedAudit.summary.auditReadyForIntake === false, "real empty filled draft should not be intake-ready");
assertInvariant(blockedAudit.summary.canModifyReliableDps === false, "blocked audit must not modify reliable DPS");
assertInvariant(blockedAudit.summary.canUseForReliableDps === false, "blocked audit must not allow reliable DPS");
assertInvariant(blockedAudit.summary.promotionReady === false, "blocked audit must not auto-promote");

const filledForm = readJson("outputs/diablo4-delta-evidence-fill-form/delta-evidence-fill-form.json");
const values = new Map([
  ["source.title", "Synthetic exact SF_32 source for audit test"],
  ["source.version", "3.0.4.72271-test"],
  ["source.capturedAt", "2026-07-15"],
  ["claim.value", "SF_32"],
  ["claim.excerpt", "1663210 selector:949 SF_32"],
  ["claim.mapping", "1663210 -> selector:949 -> SF_32"],
  ["reviewer.notes[4]", "Synthetic audit note: source fields replaced for dry-run audit."],
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
  readyAuditOutDir,
]);

const readyAudit = readJson(path.join(readyAuditOutDir, "delta-evidence-filled-draft-audit.json"));
const afterReadyInput = readJson("inputs/external-evidence-candidates.json");

assertInvariant(JSON.stringify(originalInput) === JSON.stringify(afterReadyInput), "ready audit must not write real intake");
assertInvariant(readyAudit.summary.readyForPreview === true, "synthetic filled draft should be ready for preview");
assertInvariant(readyAudit.summary.auditReadyForIntake === true, "synthetic filled draft should be intake-ready in pending");
assertInvariant(readyAudit.summary.structuralBlockers === 0, "synthetic filled draft should have no structural blockers");
assertInvariant(readyAudit.summary.reviewBlockers === 1, "synthetic filled draft should still require manual review");
assertInvariant(readyAudit.summary.acceptedForBridge === false, "ready audit must not accept for bridge");
assertInvariant(readyAudit.summary.canModifyReliableDps === false, "ready audit must not modify reliable DPS");
assertInvariant(readyAudit.summary.canUseForReliableDps === false, "ready audit must not allow reliable DPS");
assertInvariant(readyAudit.summary.canUseForRanking === false, "ready audit must not allow ranking");
assertInvariant(readyAudit.summary.promotionReady === false, "ready audit must not auto-promote");

console.log(JSON.stringify({
  status: "delta-evidence-filled-draft-audit-test-ok",
  realReadyForPreview: blockedAudit.summary.readyForPreview,
  syntheticReadyForPreview: readyAudit.summary.readyForPreview,
  syntheticReviewBlockers: readyAudit.summary.reviewBlockers,
  canModifyReliableDps: readyAudit.summary.canModifyReliableDps,
  promotionReady: readyAudit.summary.promotionReady,
}, null, 2));
