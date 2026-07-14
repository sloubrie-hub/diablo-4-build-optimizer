const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-draft-audit-"));
const draftOutDir = path.join(tempDir, "draft");
const auditOutDir = path.join(tempDir, "audit");
const filledInput = path.join(tempDir, "external-evidence-candidates.filled.json");
const filledAuditOutDir = path.join(tempDir, "filled-audit");

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

run("build-delta-evidence-draft.js", [
  "outputs/diablo4-delta-evidence-intake-package/delta-evidence-intake-package.json",
  draftOutDir,
]);
const draftInput = path.join(draftOutDir, "external-evidence-candidates.draft.json");
run("audit-delta-evidence-draft.js", [draftInput, auditOutDir]);

const blockedReport = readJson(path.join(auditOutDir, "delta-evidence-draft-audit.json"));
assertInvariant(blockedReport.summary.readyForIntake === false, "placeholder draft must not be ready for intake");
assertInvariant(blockedReport.summary.placeholderFields > 0, "placeholder draft should report placeholders");
assertInvariant(blockedReport.summary.canModifyReliableDps === false, "blocked draft audit must not modify reliable DPS");

const filled = readJson(draftInput);
filled.candidates[0].source.title = "Fixture extracted table";
filled.candidates[0].source.version = "fixture-build";
filled.candidates[0].source.capturedAt = "2026-07-14";
filled.candidates[0].claim.value = "SF_32 owner mapping";
filled.candidates[0].claim.excerpt = "1663210 selector:949 SF_32";
filled.candidates[0].claim.mapping = "1663210 -> selector:949 -> SF_32";
filled.candidates[0].reviewer.status = "pending";
filled.candidates[0].reviewer.notes = [
  "Fixture source verified structurally; reviewer approval still required.",
];
writeJson(filledInput, filled);
run("audit-delta-evidence-draft.js", [filledInput, filledAuditOutDir]);

const filledReport = readJson(path.join(filledAuditOutDir, "delta-evidence-draft-audit.json"));
assertInvariant(filledReport.summary.readyForIntake === true, "filled pending draft should be ready for real intake copy");
assertInvariant(filledReport.summary.acceptedForBridge === false, "pending draft should not be accepted for bridge");
assertInvariant(filledReport.summary.placeholderFields === 0, "filled draft should have no placeholders");
assertInvariant(filledReport.summary.structuralBlockers === 0, "filled draft should have no structural blockers");
assertInvariant(filledReport.summary.reviewBlockers === 1, "filled pending draft should still need review");
assertInvariant(filledReport.summary.canModifyReliableDps === false, "filled draft audit must not modify reliable DPS");
assertInvariant(filledReport.summary.promotionReady === false, "filled draft audit must not mark promotion ready");

console.log(JSON.stringify({
  status: "delta-evidence-draft-audit-test-ok",
  blockedReadyForIntake: blockedReport.summary.readyForIntake,
  filledReadyForIntake: filledReport.summary.readyForIntake,
  filledAcceptedForBridge: filledReport.summary.acceptedForBridge,
  canModifyReliableDps: filledReport.summary.canModifyReliableDps,
  promotionReady: filledReport.summary.promotionReady,
}, null, 2));
