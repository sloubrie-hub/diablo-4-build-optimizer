const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const scriptFile = path.join(__dirname, "build-external-evidence-submission-pack.js");
const workorderFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-delta-evidence-workorder",
  "external-delta-evidence-workorder.json",
);
const intakeFile = path.join(rootDir, "inputs", "external-evidence-candidates.json");
const reparseFile = path.join(
  rootDir,
  "outputs",
  "diablo4-selector-949-window-reparse-audit",
  "selector-949-window-reparse-audit.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-pack-"));
const intakeBefore = fs.readFileSync(intakeFile, "utf8");
execFileSync(nodeBin, [scriptFile, workorderFile, intakeFile, reparseFile, outDir], {
  cwd: rootDir,
  stdio: "pipe",
});

const report = readJson(path.join(outDir, "external-evidence-submission-pack.json"));
const markdown = fs.readFileSync(path.join(outDir, "external-evidence-submission-pack.md"), "utf8");
const intakeAfter = fs.readFileSync(intakeFile, "utf8");

assert(report.summary.nextTaskId === "delta-proof-sf32-owner", "submission pack must focus the next SF_32 proof");
assert(report.summary.claimType === "sf32-field-ownership", "submission pack must expose canonical sf32-field-ownership claim");
assert(report.summary.claimField === "eAttrib:994 + local-role:949", "submission pack must expose revised 994 + local 949 field");
assert(report.summary.templateNeedsRevision === true, "submission pack must consume reparse template revision");
assert(report.summary.priorClaimSuspended === true, "submission pack must suspend prior selector 949 claim");
assert(report.summary.candidateSnippetReady === true, "submission pack must include a candidate snippet");
assert(report.summary.reviewerStatus === "pending", "candidate snippet must remain pending");
assert(report.summary.writesIntake === false, "submission pack must not write intake");
assert(report.summary.acceptedForBridge === false, "submission pack must not accept for bridge");
assert(report.summary.canModifyReliableDps === false, "submission pack must not modify reliable DPS");
assert(report.summary.promotionReady === false, "submission pack must not promote");
assert(report.candidateSnippet.id === "draft-delta-proof-sf32-owner", "candidate snippet id must be draft-scoped");
assert(report.candidateSnippet.reviewer.status === "pending", "candidate snippet reviewer status must be pending");
assert(report.candidateSnippet.claim.excerpt.includes("A REMPLIR"), "candidate snippet must keep source placeholders");
assert(report.candidateSnippet.claim.field === "eAttrib:994 + local-role:949", "candidate snippet field must be revised");
assert((report.targetTask.mustContain ?? []).includes("1663210"), "target task must require asset id evidence");
assert((report.targetTask.mustContain ?? []).includes("eAttrib:994"), "target task must require 994 evidence");
assert((report.targetTask.mustContain ?? []).includes("Bonus_Percent_Per_Power"), "target task must require bonus name evidence");
assert((report.targetTask.mustContain ?? []).includes("local-role:949"), "target task must require local 949 role evidence");
assert((report.targetTask.mustContain ?? []).includes("SF_32"), "target task must require SF_32 evidence");
assert(report.supersededClaim?.obsolete === true, "original selector 949 claim must be superseded");
assert(report.supersededClaim?.claim?.field === "selector:949", "superseded claim must preserve the old direct field for traceability");
assert(markdown.includes("draft-delta-proof-sf32-owner"), "markdown must include the draft candidate id");
assert(intakeAfter === intakeBefore, "submission pack test must not change intake");

console.log("external-evidence-submission-pack-test-ok");
