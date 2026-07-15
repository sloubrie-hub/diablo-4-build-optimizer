const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-next-action-decision-"));
const outDir = path.join(tempDir, "decision");

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

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

run("build-delta-next-action-decision.js", [
  "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json",
  "outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json",
  "outputs/diablo4-external-evidence-submission-apply-plan/external-evidence-submission-apply-plan.json",
  "outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json",
  "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json",
  "outputs/diablo4-user-whatif-contract/user-whatif-contract.json",
  outDir,
]);

const report = readJson(path.join(outDir, "delta-next-action-decision.json"));
assertInvariant(report.summary.assetId === 1663210, "decision must target asset 1663210");
assertInvariant(report.summary.entityId === "skill:1663210", "decision must target skill:1663210");
assertInvariant(report.summary.localEvidenceExhausted === true, "local evidence should be exhausted");
assertInvariant(report.summary.externalProofMissing === true, "external proof should still be missing");
assertInvariant(report.summary.recommendedActionId === "collect-source-backed-delta-proof", "external proof should remain the first action");
assertInvariant(report.summary.canModifyReliableDps === false, "decision must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "decision must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "decision must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "decision must not mark promotion ready");
assertInvariant(report.rankedActions.length === 3, "decision must expose three ranked actions");
assertInvariant(report.rankedActions[0].rank === 1, "first action should be rank 1");
assertInvariant(report.rankedActions[1].id === "probe-new-binary-family", "second action should be the binary family probe");
assertInvariant(report.rankedActions[2].id === "maintain-user-whatif-only", "third action should keep what-if separated");
assertInvariant(report.safeguards.writesTargetDataset === false, "decision must not write target dataset");
assertInvariant(report.safeguards.reliableDpsStrictOnly === true, "decision must keep reliable DPS strict-only");

console.log(JSON.stringify({
  status: "delta-next-action-decision-test-ok",
  recommendedActionId: report.summary.recommendedActionId,
  actions: report.summary.actions,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
