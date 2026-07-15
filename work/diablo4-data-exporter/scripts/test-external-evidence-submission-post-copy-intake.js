const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const nodeBin = process.execPath;
const scriptFile = path.join(__dirname, "audit-external-evidence-submission-post-copy-intake.js");
const realPreviewFile = path.join(
  rootDir,
  "outputs",
  "diablo4-external-evidence-submission-intake-preview",
  "external-evidence-submission-intake-preview.json",
);
const intakeFile = path.join(rootDir, "inputs", "external-evidence-candidates.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runAudit(previewFile, outDir) {
  execFileSync(nodeBin, [scriptFile, previewFile, intakeFile, outDir], {
    cwd: rootDir,
    stdio: "pipe",
  });
  return readJson(path.join(outDir, "external-evidence-submission-post-copy-intake.json"));
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-submission-post-copy-"));
const intakeBefore = fs.readFileSync(intakeFile, "utf8");
const realAudit = runAudit(realPreviewFile, path.join(tmpRoot, "real"));

assert(realAudit.summary.previewMergeReady === false, "real post-copy audit must see blocked preview");
assert(realAudit.summary.addedCandidates === 0, "real post-copy audit must not add candidates");
assert(realAudit.summary.readyForManualReview === false, "real post-copy audit must not be ready for review");
assert(realAudit.summary.writesRealIntake === false, "real post-copy audit must not write intake");
assert(realAudit.summary.canModifyReliableDps === false, "real post-copy audit must not modify reliable DPS");
assert(realAudit.summary.promotionReady === false, "real post-copy audit must not promote");

const readyPreview = readJson(realPreviewFile);
readyPreview.summary = {
  ...readyPreview.summary,
  gateReadyForIntakeCopy: true,
  previewMergeReady: true,
  originalCandidates: 0,
  previewCandidates: 1,
  addedCandidates: 1,
  duplicateIds: [],
  reviewerStatus: "pending",
  writesRealIntake: false,
  acceptedForBridge: false,
  canModifyReliableDps: false,
  canUseForReliableDps: false,
  canUseForRanking: false,
  promotionReady: false,
};
readyPreview.candidatePreview = {
  id: "draft-delta-proof-sf32-owner",
  domain: "delta-1663210",
  assetId: 1663210,
  entityId: "skill:1663210",
  source: {
    kind: "extracted-game-data",
    title: "Synthetic exact SF_32 source for post-copy test",
    version: "3.0.4.72271-test",
    capturedAt: "2026-07-15",
  },
  claim: {
    type: "sf32-field-ownership",
    field: "selector:949",
    value: "SF_32",
    excerpt: "1663210 selector:949 SF_32",
    mapping: "1663210 -> selector:949 -> SF_32",
  },
  reviewer: {
    status: "pending",
    notes: ["Synthetic pending candidate for post-copy intake test."],
  },
};
const readyPreviewFile = path.join(tmpRoot, "ready-preview.json");
fs.writeFileSync(readyPreviewFile, JSON.stringify(readyPreview, null, 2));

const readyAudit = runAudit(readyPreviewFile, path.join(tmpRoot, "ready"));
const intakeAfter = fs.readFileSync(intakeFile, "utf8");

assert(intakeAfter === intakeBefore, "post-copy submission audit test must not change real intake");
assert(readyAudit.summary.previewMergeReady === true, "synthetic post-copy audit must see ready preview");
assert(readyAudit.summary.addedCandidates === 1, "synthetic post-copy audit must simulate one candidate");
assert(readyAudit.summary.targetCandidateStatus === "pending", "simulated candidate must remain pending");
assert(readyAudit.summary.readyForManualReview === true, "simulated candidate should be ready for manual review");
assert(readyAudit.summary.auditAccepted === 0, "pending candidate must not be accepted");
assert(readyAudit.summary.auditPending === 1, "pending candidate should be counted as pending");
assert(readyAudit.blockers.targetCandidateBlockers.includes("manual-review-required"), "pending candidate must require manual review");
assert(readyAudit.summary.acceptedForBridge === false, "post-copy audit must not accept bridge");
assert(readyAudit.summary.canModifyReliableDps === false, "post-copy audit must not modify reliable DPS");
assert(readyAudit.summary.canUseForReliableDps === false, "post-copy audit must not allow reliable DPS");
assert(readyAudit.summary.canUseForRanking === false, "post-copy audit must not allow ranking");
assert(readyAudit.summary.promotionReady === false, "post-copy audit must not promote");

console.log("external-evidence-submission-post-copy-intake-test-ok");
