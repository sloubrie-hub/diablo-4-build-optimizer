const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-uptime-parser-bridge-"));
const packetFile = path.join(tempDir, "uptime-source-packet.json");
const bridgeOut = path.join(tempDir, "bridge");
const invalidPacketFile = path.join(tempDir, "uptime-source-packet-invalid.json");
const invalidBridgeOut = path.join(tempDir, "invalid-bridge");

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

const packet = readJson("outputs/diablo4-uptime-source-packet/uptime-source-packet.json");
packet.acceptedEvidence = [
  {
    id: "fixture-uptime-1663210-50pct",
    source: {
      kind: "extracted-game-data",
      title: "Fixture uptime table",
      version: "test-fixture",
    },
    claim: {
      type: "uptime",
      field: "uptime",
      value: "0.5",
      numericValue: 0.5,
      excerpt: "1663210 uptime 0.5 source-backed",
      mapping: "1663210 -> uptime -> 0.5",
    },
    reviewer: { status: "approved" },
  },
];
packet.summary.acceptedEvidence = 1;
fs.writeFileSync(packetFile, JSON.stringify(packet, null, 2));

run("build-uptime-parser-bridge.js", [
  packetFile,
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  bridgeOut,
]);

const report = readJson(path.join(bridgeOut, "uptime-parser-bridge.json"));
assertInvariant(report.summary.bridgeReady === true, "synthetic accepted evidence should ready the bridge");
assertInvariant(report.summary.mappings === 1, "bridge should emit one mapping");
assertInvariant(report.summary.canModifyReliableDps === false, "bridge must not modify reliable DPS");
assertInvariant(report.summary.canUseForUserWhatIf === true, "bridge should allow controlled user what-if");
assertInvariant(report.summary.promotionReady === false, "bridge must not mark promotion ready");
assertInvariant(report.summary.reliableDpsStillBlocked === true, "reliable DPS gates should remain blocked");
assertInvariant(report.mappings[0]?.targetField === "uptime", "mapping target field drifted");
assertInvariant(report.mappings[0]?.uptime === 0.5, "mapping uptime drifted");
assertInvariant(report.mappings[0]?.canModifyReliableDps === false, "mapping must not modify reliable DPS");

const invalidPacket = { ...packet, acceptedEvidence: [{
  ...packet.acceptedEvidence[0],
  id: "fixture-uptime-1663210-invalid",
  claim: {
    ...packet.acceptedEvidence[0].claim,
    value: "1.75",
    numericValue: 1.75,
    excerpt: "1663210 uptime 1.75 invalid",
    mapping: "1663210 -> uptime -> 1.75",
  },
}] };
fs.writeFileSync(invalidPacketFile, JSON.stringify(invalidPacket, null, 2));
run("build-uptime-parser-bridge.js", [
  invalidPacketFile,
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  invalidBridgeOut,
]);
const invalidReport = readJson(path.join(invalidBridgeOut, "uptime-parser-bridge.json"));
assertInvariant(invalidReport.summary.bridgeReady === false, "out-of-bound uptime should not ready the bridge");
assertInvariant(invalidReport.summary.mappings === 0, "out-of-bound uptime should emit no mapping");

console.log(JSON.stringify({
  status: "uptime-parser-bridge-test-ok",
  bridgeReady: report.summary.bridgeReady,
  mappings: report.summary.mappings,
  uptime: report.mappings[0]?.uptime,
  invalidMappings: invalidReport.summary.mappings,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
