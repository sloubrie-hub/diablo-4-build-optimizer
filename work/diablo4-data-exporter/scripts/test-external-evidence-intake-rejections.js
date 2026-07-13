const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-external-evidence-rejections-"));
const intakeInput = path.join(tempDir, "external-evidence-candidates.json");
const intakeOut = path.join(tempDir, "intake");

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

function candidateById(report, id) {
  return (report.candidates ?? []).find((candidate) => candidate.id === id);
}

const fixture = {
  schemaVersion: 1,
  candidates: [
    {
      id: "reject-ui-source",
      domain: "delta-1663210",
      assetId: 1663210,
      source: { kind: "ui-label", title: "UI label", version: "fixture" },
      claim: {
        type: "sf33-trigger",
        field: "SF_33",
        value: "active",
        excerpt: "1663210 SF_33",
        mapping: "1663210 -> SF_33",
      },
      reviewer: { status: "approved" },
    },
    {
      id: "pending-wrong-asset",
      domain: "delta-1663210",
      assetId: 1461593,
      source: { kind: "extracted-game-data", title: "Wrong asset", version: "fixture" },
      claim: {
        type: "sf33-trigger",
        field: "SF_33",
        value: "active",
        excerpt: "1461593 SF_33",
        mapping: "1461593 -> SF_33",
      },
      reviewer: { status: "approved" },
    },
    {
      id: "pending-wrong-claim",
      domain: "slots-1461593",
      assetId: 1461593,
      source: { kind: "documented-dataset", title: "Wrong claim", version: "fixture" },
      claim: {
        type: "sf33-trigger",
        field: "SF_33",
        value: "active",
        excerpt: "1461593 SF_33",
        mapping: "1461593 -> SF_33",
      },
      reviewer: { status: "approved" },
    },
    {
      id: "pending-missing-anchor",
      domain: "additive-buckets",
      assetId: 1663210,
      source: { kind: "official", title: "Missing anchor", url: "https://example.invalid/fixture" },
      claim: {
        type: "bucket-family",
        field: "additive",
        value: "additive",
        excerpt: "some percent bonus",
        mapping: "percent bonus -> additive",
      },
      reviewer: { status: "approved" },
    },
    {
      id: "pending-manual-review",
      domain: "delta-1663210",
      assetId: 1663210,
      source: { kind: "extracted-game-data", title: "Pending review", version: "fixture" },
      claim: {
        type: "sf33-trigger",
        field: "SF_33",
        value: "active",
        excerpt: "1663210 SF_33 Mod.SoilRuler_B",
        mapping: "1663210 -> SF_33",
      },
      reviewer: { status: "pending" },
    },
  ],
};

fs.writeFileSync(intakeInput, JSON.stringify(fixture, null, 2));
run("audit-external-evidence-intake.js", [intakeInput, intakeOut]);

const report = readJson(path.join(intakeOut, "external-evidence-intake.json"));
assertInvariant(report.summary.accepted === 0, "no rejection fixture should be accepted");
assertInvariant(report.summary.rejected === 1, "exactly one fixture should be rejected by source kind");
assertInvariant(report.summary.pending === 4, "four fixtures should remain pending with blockers");
assertInvariant(report.summary.canModifyReliableDps === false, "intake must not modify reliable DPS");

assertInvariant(candidateById(report, "reject-ui-source")?.status === "rejected", "UI source should be rejected");
assertInvariant(candidateById(report, "reject-ui-source")?.blockers.includes("source-kind-rejected"), "UI source should carry source-kind-rejected");
assertInvariant(candidateById(report, "pending-wrong-asset")?.blockers.includes("domain-asset-mismatch"), "wrong asset should be blocked");
assertInvariant(candidateById(report, "pending-wrong-claim")?.blockers.includes("claim-type-not-valid-for-domain"), "wrong claim type should be blocked");
assertInvariant(candidateById(report, "pending-wrong-claim")?.blockers.includes("claim-field-not-valid-for-domain"), "wrong claim field should be blocked");
assertInvariant(candidateById(report, "pending-missing-anchor")?.blockers.includes("claim-mapping-missing-domain-anchor"), "missing anchor should be blocked");
assertInvariant(candidateById(report, "pending-manual-review")?.blockers.includes("manual-review-required"), "pending review should be blocked");

console.log(JSON.stringify({
  status: "external-evidence-intake-rejections-test-ok",
  accepted: report.summary.accepted,
  pending: report.summary.pending,
  rejected: report.summary.rejected,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
