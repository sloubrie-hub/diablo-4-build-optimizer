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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-pack-"));
const intakeBefore = fs.readFileSync(intakeFile, "utf8");
execFileSync(nodeBin, [scriptFile, workorderFile, intakeFile, outDir], {
  cwd: rootDir,
  stdio: "pipe",
});

const report = readJson(path.join(outDir, "external-evidence-submission-pack.json"));
const markdown = fs.readFileSync(path.join(outDir, "external-evidence-submission-pack.md"), "utf8");
const intakeAfter = fs.readFileSync(intakeFile, "utf8");

assert(report.summary.nextTaskId === "delta-proof-sf32-owner", "submission pack must focus the next SF_32 proof");
assert(report.summary.claimType === "sf32-field-ownership", "submission pack must expose sf32-field-ownership claim");
assert(report.summary.claimField === "selector:949", "submission pack must expose selector:949 field");
assert(report.summary.candidateSnippetReady === true, "submission pack must include a candidate snippet");
assert(report.summary.reviewerStatus === "pending", "candidate snippet must remain pending");
assert(report.summary.writesIntake === false, "submission pack must not write intake");
assert(report.summary.acceptedForBridge === false, "submission pack must not accept for bridge");
assert(report.summary.canModifyReliableDps === false, "submission pack must not modify reliable DPS");
assert(report.summary.promotionReady === false, "submission pack must not promote");
assert(report.candidateSnippet.id === "draft-delta-proof-sf32-owner", "candidate snippet id must be draft-scoped");
assert(report.candidateSnippet.reviewer.status === "pending", "candidate snippet reviewer status must be pending");
assert(report.candidateSnippet.claim.excerpt.includes("A REMPLIR"), "candidate snippet must keep source placeholders");
assert((report.targetTask.mustContain ?? []).includes("1663210"), "target task must require asset id evidence");
assert((report.targetTask.mustContain ?? []).includes("selector:949"), "target task must require selector evidence");
assert((report.targetTask.mustContain ?? []).includes("SF_32"), "target task must require SF_32 evidence");
assert(markdown.includes("draft-delta-proof-sf32-owner"), "markdown must include the draft candidate id");
assert(intakeAfter === intakeBefore, "submission pack test must not change intake");

console.log("external-evidence-submission-pack-test-ok");
