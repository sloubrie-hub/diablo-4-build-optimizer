const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-sf33-trigger-parser-bridge-"));
const packetFile = path.join(tempDir, "sf33-trigger-source-packet.json");
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

const packet = readJson("outputs/diablo4-sf33-trigger-source-packet/sf33-trigger-source-packet.json");
packet.acceptedEvidence = [
  {
    id: "fixture-sf33-trigger-soilruler-b",
    source: {
      kind: "extracted-game-data",
      title: "Fixture build-state trigger table",
      version: "test-fixture",
    },
    claim: {
      type: "sf33-trigger",
      field: "Mod.SoilRuler_B",
      value: "SF_33 trigger mapping",
      excerpt: "1663210 Mod.SoilRuler_B SF_33",
      mapping: "1663210 -> Mod.SoilRuler_B -> SF_33",
    },
    reviewer: { status: "approved" },
  },
];
packet.summary.acceptedEvidence = 1;
fs.writeFileSync(packetFile, JSON.stringify(packet, null, 2));

run("build-sf33-trigger-parser-bridge.js", [
  packetFile,
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  bridgeOut,
]);

const report = readJson(path.join(bridgeOut, "sf33-trigger-parser-bridge.json"));
assertInvariant(report.summary.bridgeReady === true, "synthetic accepted evidence should ready the bridge");
assertInvariant(report.summary.mappings === 1, "bridge should emit one mapping");
assertInvariant(report.summary.canModifyReliableDps === false, "bridge must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "bridge must not mark promotion ready");
assertInvariant(report.summary.reliableDpsStillBlocked === true, "reliable DPS gates should remain blocked");
assertInvariant(report.mappings[0]?.trigger === "Mod.SoilRuler_B", "mapping trigger drifted");
assertInvariant(report.mappings[0]?.targetField === "SF_33", "mapping target field drifted");
assertInvariant(report.mappings[0]?.canModifyReliableDps === false, "mapping must not modify reliable DPS");

console.log(JSON.stringify({
  status: "sf33-trigger-parser-bridge-test-ok",
  bridgeReady: report.summary.bridgeReady,
  mappings: report.summary.mappings,
  targetField: report.mappings[0]?.targetField,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
