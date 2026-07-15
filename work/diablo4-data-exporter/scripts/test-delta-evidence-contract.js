const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { SF32_OWNER_CLAIM } = require("../src/delta-evidence-contract");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-contract-"));
const inputFile = path.join(tempDir, "external-evidence-candidates.json");
const outDir = path.join(tempDir, "intake");

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function candidate(id, field, mapping) {
  return {
    id,
    domain: "delta-1663210",
    assetId: 1663210,
    entityId: "skill:1663210",
    source: {
      kind: "extracted-game-data",
      title: "Synthetic SF_32 contract fixture",
      version: "test-fixture",
      capturedAt: "2026-07-15",
    },
    claim: {
      type: SF32_OWNER_CLAIM.type,
      field,
      value: "SF_32",
      excerpt: mapping,
      mapping,
    },
    reviewer: { status: "approved" },
  };
}

assertInvariant(SF32_OWNER_CLAIM.type === "sf32-field-ownership", "SF_32 claim type drifted");
assertInvariant(SF32_OWNER_CLAIM.field === "eAttrib:994 + local-role:949", "SF_32 claim field drifted");
assertInvariant(SF32_OWNER_CLAIM.mustContain.length === 5, "SF_32 required terms drifted");
assertInvariant(SF32_OWNER_CLAIM.supersededField === "selector:949", "SF_32 superseded field drifted");

const canonicalMapping = "1663210 -> eAttrib:994 / Bonus_Percent_Per_Power -> local-role:949 -> SF_32";
const fixture = {
  schemaVersion: 1,
  candidates: [
    candidate("canonical-sf32-owner", SF32_OWNER_CLAIM.field, canonicalMapping),
    candidate("obsolete-direct-selector", SF32_OWNER_CLAIM.supersededField, "1663210 -> selector:949 -> SF_32"),
    candidate("wrong-field-for-sf32-type", "SF_32", "1663210 -> SF_32"),
  ],
};
fs.writeFileSync(inputFile, JSON.stringify(fixture, null, 2));

const result = spawnSync(process.execPath, [path.join(scriptDir, "audit-external-evidence-intake.js"), inputFile, outDir], {
  cwd: rootDir,
  encoding: "utf8",
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) throw new Error(`intake audit failed with exit code ${result.status}`);

const report = JSON.parse(fs.readFileSync(path.join(outDir, "external-evidence-intake.json"), "utf8"));
const canonical = report.candidates.find((item) => item.id === "canonical-sf32-owner");
const obsolete = report.candidates.find((item) => item.id === "obsolete-direct-selector");
const wrongField = report.candidates.find((item) => item.id === "wrong-field-for-sf32-type");

assertInvariant(canonical?.status === "accepted", "canonical SF_32 claim should be accepted after review");
assertInvariant(obsolete?.status === "pending", "obsolete direct selector claim must not be accepted");
assertInvariant(obsolete?.blockers.includes("claim-field-not-valid-for-domain"), "obsolete direct selector claim must fail field validation");
assertInvariant(wrongField?.status === "pending", "SF_32 shorthand field must not bypass the canonical claim field");
assertInvariant(wrongField?.blockers.includes("claim-field-not-valid-for-claim-type"), "SF_32 shorthand must fail claim-type field validation");
assertInvariant(report.summary.canModifyReliableDps === false, "contract audit must not modify reliable DPS");

console.log(JSON.stringify({
  status: "delta-evidence-contract-test-ok",
  canonicalStatus: canonical.status,
  obsoleteStatus: obsolete.status,
  wrongFieldStatus: wrongField.status,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
