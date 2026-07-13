const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-bridge-"));
const intakeInput = path.join(tempDir, "external-evidence-candidates.json");
const intakeOut = path.join(tempDir, "intake");
const bridgeOut = path.join(tempDir, "bridge");

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

const fixture = {
  schemaVersion: 1,
  candidates: [
    {
      id: "fixture-delta-1663210-sf33-trigger",
      domain: "delta-1663210",
      assetId: 1663210,
      entityId: "skill:1663210",
      source: {
        kind: "extracted-game-data",
        title: "Fixture extracted trigger table",
        version: "test-fixture",
        capturedAt: "2026-07-13",
      },
      claim: {
        type: "sf33-trigger",
        field: "SF_33",
        value: "Mod.SoilRuler_B active",
        excerpt: "1663210 SF_33 Mod.SoilRuler_B",
        mapping: "1663210 -> SF_33 -> Mod.SoilRuler_B",
      },
      reviewer: {
        status: "approved",
        notes: ["Synthetic fixture for bridge readiness only."],
      },
    },
  ],
};

fs.writeFileSync(intakeInput, JSON.stringify(fixture, null, 2));

run("audit-external-evidence-intake.js", [intakeInput, intakeOut]);
const intakeReport = readJson(path.join(intakeOut, "external-evidence-intake.json"));
assertInvariant(intakeReport.summary.accepted === 1, "fixture evidence should be accepted");
assertInvariant(intakeReport.summary.canModifyReliableDps === false, "intake must not modify reliable DPS");

run("build-external-evidence-bridge-plan.js", [
  path.join(intakeOut, "external-evidence-intake.json"),
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  "outputs/diablo4-bucket-engine-contract/bucket-engine-contract.json",
  bridgeOut,
]);
const bridgeReport = readJson(path.join(bridgeOut, "external-evidence-bridge-plan.json"));
assertInvariant(bridgeReport.summary.readySteps === 1, "exactly one bridge step should be ready");
assertInvariant(bridgeReport.summary.blockedSteps === 2, "two bridge steps should remain blocked");
assertInvariant(bridgeReport.summary.canModifyReliableDps === false, "bridge must not modify reliable DPS");
assertInvariant(bridgeReport.steps.find((step) => step.id === "bridge-delta-1663210")?.status === "ready-for-parser-bridge", "delta bridge should be ready");
assertInvariant(bridgeReport.steps.find((step) => step.id === "bridge-slots-1461593")?.status === "blocked-waiting-for-accepted-evidence", "slots bridge should remain blocked");
assertInvariant(bridgeReport.steps.find((step) => step.id === "bridge-additive-buckets")?.status === "blocked-waiting-for-accepted-evidence", "bucket bridge should remain blocked");

console.log(JSON.stringify({
  status: "external-evidence-bridge-test-ok",
  intakeAccepted: intakeReport.summary.accepted,
  bridgeReadySteps: bridgeReport.summary.readySteps,
  bridgeBlockedSteps: bridgeReport.summary.blockedSteps,
  canModifyReliableDps: bridgeReport.summary.canModifyReliableDps,
}, null, 2));
