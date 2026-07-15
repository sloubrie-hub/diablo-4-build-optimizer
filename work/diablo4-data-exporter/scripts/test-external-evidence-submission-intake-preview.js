const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const previewScript = path.join(__dirname, "preview-external-evidence-submission-intake.js");
const gateScript = path.join(__dirname, "build-external-evidence-submission-gate.js");
const packFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-evidence-submission-pack",
  "external-evidence-submission-pack.json",
);
const realGateFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-evidence-submission-gate",
  "external-evidence-submission-gate.json",
);
const intakeFile = path.join(rootDir, "inputs", "external-evidence-candidates.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runPreview(gateFile, outDir) {
  execFileSync(nodeBin, [previewScript, gateFile, intakeFile, outDir], {
    cwd: rootDir,
    stdio: "pipe",
  });
  return readJson(path.join(outDir, "external-evidence-submission-intake-preview.json"));
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-preview-"));
const intakeBefore = fs.readFileSync(intakeFile, "utf8");
const realPreview = runPreview(realGateFile, path.join(tmpRoot, "real-preview"));

assert(realPreview.summary.gateReadyForIntakeCopy === false, "real preview must see blocked gate");
assert(realPreview.summary.previewMergeReady === false, "real preview must not be merge-ready");
assert(realPreview.summary.addedCandidates === 0, "real preview must not add candidates");
assert(realPreview.candidatePreview === null, "real preview must not expose candidate preview");
assert(realPreview.summary.writesRealIntake === false, "real preview must not write intake");
assert(realPreview.summary.canModifyReliableDps === false, "real preview must not modify reliable DPS");

const syntheticPack = readJson(packFile);
syntheticPack.candidateSnippet.source = {
  kind: "extracted-game-data",
  title: "Synthetic verified SF_32 revised 994 local role export",
  url: "",
  version: "test-build-1",
  capturedAt: "2026-07-15",
};
syntheticPack.candidateSnippet.claim = {
  type: "sf32-field-ownership",
  field: "eAttrib:994 + local-role:949",
  value: "SF_32 revised owner mapping",
  excerpt: "asset 1663210 eAttrib:994 Bonus_Percent_Per_Power local-role:949 maps toward SF_32 in the verified test export",
  mapping: "1663210 -> eAttrib:994 / Bonus_Percent_Per_Power -> local-role:949 -> SF_32",
};
syntheticPack.candidateSnippet.reviewer = {
  status: "pending",
  notes: ["Synthetic source-filled pending submission."],
};
const syntheticPackFile = path.join(tmpRoot, "synthetic-pack.json");
fs.writeFileSync(syntheticPackFile, JSON.stringify(syntheticPack, null, 2));

const readyGateDir = path.join(tmpRoot, "ready-gate");
execFileSync(nodeBin, [gateScript, syntheticPackFile, readyGateDir], {
  cwd: rootDir,
  stdio: "pipe",
});
const readyGateFile = path.join(readyGateDir, "external-evidence-submission-gate.json");
const readyPreviewDir = path.join(tmpRoot, "ready-preview");
const readyPreview = runPreview(readyGateFile, readyPreviewDir);
const previewIntake = readJson(path.join(readyPreviewDir, "external-evidence-candidates.submission-preview.json"));
const addedCandidate = previewIntake.candidates.at(-1);

assert(readyPreview.summary.gateReadyForIntakeCopy === true, "synthetic preview must see ready gate");
assert(readyPreview.summary.previewMergeReady === true, "synthetic preview must be merge-ready");
assert(readyPreview.summary.addedCandidates === 1, "synthetic preview must add one candidate");
assert(readyPreview.summary.previewCandidates === readyPreview.summary.originalCandidates + 1, "synthetic preview must increment candidate count");
assert(addedCandidate.id === "draft-delta-proof-sf32-owner", "synthetic preview must add target candidate");
assert(addedCandidate.reviewer.status === "pending", "synthetic preview candidate must stay pending");
assert(readyPreview.summary.writesRealIntake === false, "synthetic preview must not write intake");
assert(readyPreview.summary.acceptedForBridge === false, "synthetic preview must not accept bridge");
assert(readyPreview.summary.canModifyReliableDps === false, "synthetic preview must not modify reliable DPS");
assert(readyPreview.summary.promotionReady === false, "synthetic preview must not promote");

const intakeAfter = fs.readFileSync(intakeFile, "utf8");
assert(intakeAfter === intakeBefore, "submission preview test must not change real intake");

console.log("external-evidence-submission-intake-preview-test-ok");
