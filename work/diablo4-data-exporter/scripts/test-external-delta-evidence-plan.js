const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-delta-evidence-plan-"));
const intakeInput = path.join(tempDir, "external-evidence-candidates.json");
const partialInput = path.join(tempDir, "external-evidence-candidates-partial.json");
const intakeOut = path.join(tempDir, "intake");
const partialIntakeOut = path.join(tempDir, "partial-intake");
const bridgeOut = path.join(tempDir, "bridge");
const partialBridgeOut = path.join(tempDir, "partial-bridge");
const planOut = path.join(tempDir, "plan");
const partialPlanOut = path.join(tempDir, "partial-plan");

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

function approvedDeltaCandidate(id, claim) {
  return {
    id,
    domain: "delta-1663210",
    assetId: 1663210,
    entityId: "skill:1663210",
    source: {
      kind: "extracted-game-data",
      title: "Fixture extracted delta evidence",
      version: "test-fixture",
      capturedAt: "2026-07-13",
    },
    claim,
    reviewer: {
      status: "approved",
      notes: ["Synthetic fixture for delta evidence plan readiness only."],
    },
  };
}

const fullFixture = {
  schemaVersion: 1,
  candidates: [
    approvedDeltaCandidate("fixture-delta-1663210-sf32-owner", {
      type: "sf32-field-ownership",
      field: "eAttrib:994 + local-role:949",
      value: "SF_32 owner mapping",
      excerpt: "1663210 eAttrib:994 Bonus_Percent_Per_Power local-role:949 SF_32 owner mapping",
      mapping: "1663210 -> eAttrib:994 / Bonus_Percent_Per_Power -> local-role:949 -> SF_32",
    }),
    approvedDeltaCandidate("fixture-delta-1663210-sf33-trigger", {
      type: "sf33-trigger",
      field: "Mod.SoilRuler_B",
      value: "condition",
      excerpt: "1663210 Mod.SoilRuler_B SF_33 trigger mapping",
      mapping: "1663210 -> Mod.SoilRuler_B -> SF_33",
    }),
    approvedDeltaCandidate("fixture-delta-1663210-uptime", {
      type: "uptime",
      field: "uptime",
      value: 0.5,
      excerpt: "1663210 uptime 0.5 source-backed",
      mapping: "1663210 -> uptime -> 0.5",
    }),
  ],
};

const partialFixture = {
  schemaVersion: 1,
  candidates: [fullFixture.candidates[0]],
};

fs.writeFileSync(intakeInput, JSON.stringify(fullFixture, null, 2));
fs.writeFileSync(partialInput, JSON.stringify(partialFixture, null, 2));

run("audit-external-evidence-intake.js", [intakeInput, intakeOut]);
const intakeReport = readJson(path.join(intakeOut, "external-evidence-intake.json"));
assertInvariant(intakeReport.summary.accepted === 3, "three delta fixture proofs should be accepted");
assertInvariant(intakeReport.summary.canModifyReliableDps === false, "intake must not modify reliable DPS");

run("build-external-evidence-bridge-plan.js", [
  path.join(intakeOut, "external-evidence-intake.json"),
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json",
  bridgeOut,
]);
const bridgeReport = readJson(path.join(bridgeOut, "external-evidence-bridge-plan.json"));
assertInvariant(bridgeReport.summary.readySteps === 1, "only the delta bridge should be ready");
assertInvariant(bridgeReport.summary.canModifyReliableDps === false, "bridge must not modify reliable DPS");
assertInvariant(bridgeReport.steps.find((step) => step.id === "bridge-delta-1663210")?.status === "ready-for-parser-bridge", "delta bridge should be ready");

run("build-external-delta-evidence-plan.js", [
  path.join(intakeOut, "external-evidence-intake.json"),
  path.join(bridgeOut, "external-evidence-bridge-plan.json"),
  "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json",
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  planOut,
]);
const planReport = readJson(path.join(planOut, "external-delta-evidence-plan.json"));
assertInvariant(planReport.summary.requiredProofs === 3, "delta plan must require three proofs");
assertInvariant(planReport.summary.readyProofs === 3, "all three fixture proofs should be ready");
assertInvariant(planReport.summary.missingProofs === 0, "no fixture proof should be missing");
assertInvariant(planReport.summary.canModifyReliableDps === false, "delta plan must not modify reliable DPS");
assertInvariant(planReport.summary.promotionReady === false, "delta plan must not mark promotion ready");
assertInvariant(planReport.summary.assessment.kind === "external-delta-evidence-ready-for-parser-bridge", "delta plan should only become ready for parser bridge");
assertInvariant(planReport.requiredProofs[0].acceptedClaim.field === "eAttrib:994 + local-role:949", "SF_32 proof must use revised claim field");
assertInvariant(planReport.requiredProofs[0].mustContain.includes("eAttrib:994"), "SF_32 proof must require eAttrib:994");
assertInvariant(planReport.requiredProofs[0].mustContain.includes("local-role:949"), "SF_32 proof must require local-role:949");

run("audit-external-evidence-intake.js", [partialInput, partialIntakeOut]);
run("build-external-evidence-bridge-plan.js", [
  path.join(partialIntakeOut, "external-evidence-intake.json"),
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json",
  partialBridgeOut,
]);
run("build-external-delta-evidence-plan.js", [
  path.join(partialIntakeOut, "external-evidence-intake.json"),
  path.join(partialBridgeOut, "external-evidence-bridge-plan.json"),
  "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json",
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  partialPlanOut,
]);
const partialPlanReport = readJson(path.join(partialPlanOut, "external-delta-evidence-plan.json"));
assertInvariant(partialPlanReport.summary.readyProofs === 1, "partial fixture should ready exactly one proof");
assertInvariant(partialPlanReport.summary.missingProofs === 2, "partial fixture should keep two proofs missing");
assertInvariant(partialPlanReport.summary.recommendedNextFocus === "delta-proof-sf33-trigger", "partial fixture should next request SF_33 trigger proof");
assertInvariant(partialPlanReport.summary.canModifyReliableDps === false, "partial delta plan must not modify reliable DPS");

console.log(JSON.stringify({
  status: "external-delta-evidence-plan-test-ok",
  accepted: intakeReport.summary.accepted,
  readyProofs: planReport.summary.readyProofs,
  missingProofs: planReport.summary.missingProofs,
  partialReadyProofs: partialPlanReport.summary.readyProofs,
  partialMissingProofs: partialPlanReport.summary.missingProofs,
  canModifyReliableDps: planReport.summary.canModifyReliableDps,
}, null, 2));
