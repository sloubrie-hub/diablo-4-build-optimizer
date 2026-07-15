const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-sf32-source-hunt-"));
const outDir = path.join(tempDir, "hunt");

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

run("build-sf32-owner-source-hunt-plan.js", [
  "outputs/diablo4-delta-next-action-decision/delta-next-action-decision.json",
  "outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json",
  "outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json",
  "outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json",
  outDir,
]);

const report = readJson(path.join(outDir, "sf32-owner-source-hunt-plan.json"));
assertInvariant(report.summary.assetId === 1663210, "hunt plan must target asset 1663210");
assertInvariant(report.summary.targetField === "Bonus_Percent_Per_Power / SF_32 role unresolved", "hunt plan must target revised SF_32 role");
assertInvariant(report.summary.targetSelector === "eAttrib:994 + local-role:949", "hunt plan must target revised 994 + local 949");
assertInvariant(report.summary.templateNeedsRevision === true, "hunt plan must require template revision");
assertInvariant(report.summary.templateRevisionApplied === true, "hunt plan must confirm the revised template is applied");
assertInvariant(report.summary.priorClaimSuspended === true, "hunt plan must suspend prior selector 949 claim");
assertInvariant(report.summary.recommendedActionId === "collect-source-backed-delta-proof", "hunt plan must follow the source-backed decision");
assertInvariant(report.summary.searches === 4, "hunt plan must expose four searches");
assertInvariant(report.summary.highPrioritySearches === 2, "hunt plan must expose two high priority searches");
assertInvariant(report.mustContain.includes("1663210"), "hunt plan must require asset id");
assertInvariant(report.mustContain.includes("eAttrib:994"), "hunt plan must require 994 anchor");
assertInvariant(report.mustContain.includes("Bonus_Percent_Per_Power"), "hunt plan must require bonus name");
assertInvariant(report.mustContain.includes("local-role:949"), "hunt plan must require local 949 role");
assertInvariant(report.mustContain.includes("SF_32"), "hunt plan must require SF_32");
assertInvariant(report.summary.candidateSnippetReady === true, "hunt plan must carry the pending candidate snippet");
assertInvariant(report.summary.candidateSnippetUsable === true, "revised candidate snippet must be usable for source collection");
assertInvariant(report.supersededSubmission?.obsolete === true, "old submission must be superseded");
assertInvariant(report.supersededSubmission?.claim?.field === "selector:949", "superseded submission must identify the old direct field");
assertInvariant(report.summary.writesIntake === false, "hunt plan must not write intake");
assertInvariant(report.summary.canModifyReliableDps === false, "hunt plan must not modify reliable DPS");
assertInvariant(report.summary.canUseForReliableDps === false, "hunt plan must not allow reliable DPS");
assertInvariant(report.summary.canUseForRanking === false, "hunt plan must not allow ranking");
assertInvariant(report.summary.promotionReady === false, "hunt plan must not mark promotion ready");
assertInvariant(report.safeguards.noAutomaticApproval === true, "hunt plan must forbid automatic approval");

console.log(JSON.stringify({
  status: "sf32-owner-source-hunt-plan-test-ok",
  searches: report.summary.searches,
  candidateSnippetReady: report.summary.candidateSnippetReady,
  candidateSnippetUsable: report.summary.candidateSnippetUsable,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
