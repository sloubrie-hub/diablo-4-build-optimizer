const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-sf32-owner-parser-bridge-"));
const packetFile = path.join(tempDir, "sf32-owner-source-packet.json");
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

const packet = readJson("outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json");
packet.acceptedEvidence = [
  {
    id: "fixture-sf32-owner-selector-949",
    source: {
      kind: "extracted-game-data",
      title: "Fixture field owner table",
      version: "test-fixture",
    },
    claim: {
      type: "sf32-field-ownership",
      field: "eAttrib:994 + local-role:949",
      value: "SF_32 owner mapping",
      excerpt: "1663210 eAttrib:994 Bonus_Percent_Per_Power local-role:949 SF_32",
      mapping: "1663210 -> eAttrib:994 + local-role:949 -> SF_32",
    },
    reviewer: { status: "approved" },
  },
];
packet.summary.acceptedEvidence = 1;
fs.writeFileSync(packetFile, JSON.stringify(packet, null, 2));

run("build-sf32-owner-parser-bridge.js", [
  packetFile,
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  bridgeOut,
]);

const report = readJson(path.join(bridgeOut, "sf32-owner-parser-bridge.json"));
assertInvariant(report.summary.bridgeReady === true, "synthetic accepted evidence should ready the bridge");
assertInvariant(report.summary.mappings === 1, "bridge should emit one mapping");
assertInvariant(report.summary.canModifyReliableDps === false, "bridge must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "bridge must not mark promotion ready");
assertInvariant(report.summary.reliableDpsStillBlocked === true, "reliable DPS gates should remain blocked");
assertInvariant(report.mappings[0]?.sourceAnchor === "eAttrib:994", "mapping source anchor drifted");
assertInvariant(report.mappings[0]?.localRole === "local-role:949", "mapping local role drifted");
assertInvariant(report.mappings[0]?.ownerField === "SF_32", "mapping owner field drifted");
assertInvariant(report.mappings[0]?.canModifyReliableDps === false, "mapping must not modify reliable DPS");

console.log(JSON.stringify({
  status: "sf32-owner-parser-bridge-test-ok",
  bridgeReady: report.summary.bridgeReady,
  mappings: report.summary.mappings,
  ownerField: report.mappings[0]?.ownerField,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
