const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const scriptFile = path.join(__dirname, "build-external-evidence-submission-gate.js");
const packFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-evidence-submission-pack",
  "external-evidence-submission-pack.json",
);
const intakeFile = path.join(rootDir, "inputs", "external-evidence-candidates.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runGate(inputFile, outDir) {
  execFileSync(nodeBin, [scriptFile, inputFile, outDir], {
    cwd: rootDir,
    stdio: "pipe",
  });
  return readJson(path.join(outDir, "external-evidence-submission-gate.json"));
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-gate-"));
const intakeBefore = fs.readFileSync(intakeFile, "utf8");
const realGate = runGate(packFile, path.join(tmpRoot, "real"));

assert(realGate.summary.readyForIntakeCopy === false, "real submission gate must remain blocked");
assert(realGate.summary.failedChecks > 0, "real submission gate must expose failed checks");
assert(realGate.gateChecks.some((check) => check.id === "no-placeholders" && check.status === "failed"), "real gate must fail placeholders");
assert(realGate.summary.writesIntake === false, "real gate must not write intake");
assert(realGate.summary.acceptedForBridge === false, "real gate must not accept bridge");
assert(realGate.summary.canModifyReliableDps === false, "real gate must not modify reliable DPS");
assert(realGate.candidateToCopy === null, "blocked gate must not expose candidateToCopy");

const syntheticPack = readJson(packFile);
syntheticPack.candidateSnippet.source = {
  kind: "extracted-game-data",
  title: "Synthetic verified SF_32 selector export",
  url: "",
  version: "test-build-1",
  capturedAt: "2026-07-15",
};
syntheticPack.candidateSnippet.claim = {
  type: "sf32-field-ownership",
  field: "selector:949",
  value: "SF_32 owner mapping",
  excerpt: "asset 1663210 selector:949 maps to SF_32 in the verified test export",
  mapping: "1663210 -> selector:949 -> SF_32",
};
syntheticPack.candidateSnippet.reviewer = {
  status: "pending",
  notes: ["Synthetic source-filled pending submission."],
};
const syntheticPackFile = path.join(tmpRoot, "synthetic-pack.json");
fs.writeFileSync(syntheticPackFile, JSON.stringify(syntheticPack, null, 2));

const readyGate = runGate(syntheticPackFile, path.join(tmpRoot, "ready"));
assert(readyGate.summary.readyForIntakeCopy === true, "filled synthetic gate should be ready for manual copy");
assert(readyGate.summary.failedChecks === 0, "filled synthetic gate should pass checks");
assert(readyGate.summary.reviewerStatus === "pending", "ready gate must remain pending");
assert(readyGate.summary.writesIntake === false, "ready gate must not write intake");
assert(readyGate.summary.acceptedForBridge === false, "ready gate must not accept bridge");
assert(readyGate.summary.canModifyReliableDps === false, "ready gate must not modify reliable DPS");
assert(readyGate.summary.promotionReady === false, "ready gate must not promote");
assert(readyGate.candidateToCopy?.id === "draft-delta-proof-sf32-owner", "ready gate must expose draft candidate for manual copy");

const intakeAfter = fs.readFileSync(intakeFile, "utf8");
assert(intakeAfter === intakeBefore, "submission gate test must not change intake");

console.log("external-evidence-submission-gate-test-ok");
