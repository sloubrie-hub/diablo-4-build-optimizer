const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-review-decision-"));
const blockedOutDir = path.join(tempDir, "blocked");
const readyOutDir = path.join(tempDir, "ready");
const readyGateFile = path.join(tempDir, "ready-review-gate.json");

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

run("build-delta-evidence-review-decision-package.js", [
  "outputs/diablo4-delta-evidence-manual-review-gate/delta-evidence-manual-review-gate.json",
  blockedOutDir,
]);

const blocked = readJson(path.join(blockedOutDir, "delta-evidence-review-decision-package.json"));
const blockedMarkdown = fs.readFileSync(path.join(blockedOutDir, "delta-evidence-review-decision-package.md"), "utf8");
assertInvariant(blocked.summary.readyForDecisionInput === false, "real decision package should remain blocked");
assertInvariant(blocked.summary.failedChecks > 0, "blocked package should expose failed checks");
assertInvariant(blocked.summary.canModifyReliableDps === false, "blocked package must not modify reliable DPS");
assertInvariant(blocked.summary.promotionReady === false, "blocked package must not auto-promote");
assertInvariant(blockedMarkdown.includes("Decision reviewer delta 1663210"), "blocked package should emit markdown");

const readyGate = readJson("outputs/diablo4-delta-evidence-manual-review-gate/delta-evidence-manual-review-gate.json");
readyGate.summary.readyForReviewerDecision = true;
readyGate.summary.targetCandidateStatus = "pending";
readyGate.summary.reviewBlockerPresent = true;
readyGate.summary.canModifyReliableDps = false;
readyGate.summary.promotionReady = false;
readyGate.targetCandidate = {
  id: "draft-delta-proof-sf32-owner",
  domain: "delta-1663210",
  assetId: 1663210,
  entityId: "skill:1663210",
  reviewer: {
    status: "pending",
    notes: ["Synthetic pending candidate for reviewer decision package test."],
  },
  status: "pending",
  blockers: ["manual-review-required"],
};
writeJson(readyGateFile, readyGate);

run("build-delta-evidence-review-decision-package.js", [
  readyGateFile,
  readyOutDir,
]);

const ready = readJson(path.join(readyOutDir, "delta-evidence-review-decision-package.json"));
const readyMarkdown = fs.readFileSync(path.join(readyOutDir, "delta-evidence-review-decision-package.md"), "utf8");
assertInvariant(ready.summary.readyForDecisionInput === true, "synthetic ready package should allow decision input");
assertInvariant(ready.summary.targetCandidateStatus === "pending", "ready decision package target should remain pending");
assertInvariant(ready.summary.reviewBlockerPresent === true, "ready decision package should keep manual review blocker");
assertInvariant(ready.summary.acceptedForBridge === false, "ready decision package must not accept bridge");
assertInvariant(ready.summary.canModifyReliableDps === false, "ready decision package must not modify reliable DPS");
assertInvariant(ready.summary.canUseForReliableDps === false, "ready decision package must not allow reliable DPS");
assertInvariant(ready.summary.canUseForRanking === false, "ready decision package must not allow ranking");
assertInvariant(ready.summary.promotionReady === false, "ready decision package must not auto-promote");
assertInvariant(ready.readinessChecks.every((check) => check.status === "passed"), "ready fixture should pass package checks");
assertInvariant(ready.decisionInputTemplate.requiredStatusValues.includes("approved"), "template should allow approved");
assertInvariant(ready.decisionInputTemplate.requiredStatusValues.includes("rejected"), "template should allow rejected");
assertInvariant(ready.decisionInputTemplate.forbiddenActions.includes("changer reliableDps"), "template should forbid reliableDps changes");
assertInvariant(readyMarkdown.includes("reviewer.status: A REMPLIR"), "ready markdown should expose reviewer.status field");

console.log(JSON.stringify({
  status: "delta-evidence-review-decision-package-test-ok",
  realReadyForDecisionInput: blocked.summary.readyForDecisionInput,
  syntheticReadyForDecisionInput: ready.summary.readyForDecisionInput,
  targetCandidateStatus: ready.summary.targetCandidateStatus,
  canModifyReliableDps: ready.summary.canModifyReliableDps,
  promotionReady: ready.summary.promotionReady,
}, null, 2));
