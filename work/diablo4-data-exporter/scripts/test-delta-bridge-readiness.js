const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-bridge-readiness-"));
const sf32File = path.join(tempDir, "sf32.json");
const sf33File = path.join(tempDir, "sf33.json");
const uptimeFile = path.join(tempDir, "uptime.json");
const outDir = path.join(tempDir, "readiness");

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

const sf32 = readJson("outputs/diablo4-sf32-owner-parser-bridge/sf32-owner-parser-bridge.json");
sf32.summary.acceptedEvidence = 1;
sf32.summary.mappings = 1;
sf32.summary.bridgeReady = true;
sf32.mappings = [{
  id: "sf32-owner-selector-949",
  selector: "selector:949",
  ownerField: "SF_32",
  canModifyReliableDps: false,
}];
fs.writeFileSync(sf32File, JSON.stringify(sf32, null, 2));

const sf33 = readJson("outputs/diablo4-sf33-trigger-parser-bridge/sf33-trigger-parser-bridge.json");
sf33.summary.acceptedEvidence = 1;
sf33.summary.mappings = 1;
sf33.summary.bridgeReady = true;
sf33.mappings = [{
  id: "sf33-trigger-soilruler-b",
  trigger: "Mod.SoilRuler_B",
  targetField: "SF_33",
  canModifyReliableDps: false,
}];
fs.writeFileSync(sf33File, JSON.stringify(sf33, null, 2));

const uptime = readJson("outputs/diablo4-uptime-parser-bridge/uptime-parser-bridge.json");
uptime.summary.acceptedEvidence = 1;
uptime.summary.mappings = 1;
uptime.summary.bridgeReady = true;
uptime.summary.canUseForUserWhatIf = true;
uptime.mappings = [{
  id: "uptime-1663210",
  targetField: "uptime",
  uptime: 0.5,
  canModifyReliableDps: false,
}];
fs.writeFileSync(uptimeFile, JSON.stringify(uptime, null, 2));

run("build-delta-bridge-readiness.js", [
  sf32File,
  sf33File,
  uptimeFile,
  "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  outDir,
]);

const report = readJson(path.join(outDir, "delta-bridge-readiness.json"));
assertInvariant(report.summary.allBridgeReady === true, "synthetic bridges should make combined bridge ready");
assertInvariant(report.summary.readyGates === 3, "all three gates should be ready");
assertInvariant(report.summary.blockedGates === 0, "no synthetic gate should be blocked");
assertInvariant(report.summary.canUseForUserWhatIf === true, "combined bridge can feed controlled what-if");
assertInvariant(report.summary.canModifyReliableDps === false, "combined bridge must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "combined bridge must not auto-promote");
assertInvariant(report.summary.reliableDpsStillBlocked === true, "reliable DPS gates should remain blocked before separate promotion review");
assertInvariant(report.blockedGateIds.length === 0, "synthetic blocked gate list should be empty");

console.log(JSON.stringify({
  status: "delta-bridge-readiness-test-ok",
  allBridgeReady: report.summary.allBridgeReady,
  readyGates: report.summary.readyGates,
  canUseForUserWhatIf: report.summary.canUseForUserWhatIf,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
