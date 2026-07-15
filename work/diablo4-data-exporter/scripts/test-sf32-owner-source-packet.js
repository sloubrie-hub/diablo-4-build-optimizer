const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-sf32-owner-source-packet-"));
const outDir = path.join(tempDir, "packet");

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

run("build-sf32-owner-source-packet.js", [
  "outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json",
  "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json",
  "outputs/diablo4-external-evidence-intake/external-evidence-intake.json",
  outDir,
]);

const packet = readJson(path.join(outDir, "sf32-owner-source-packet.json"));
assertInvariant(packet.summary.assetId === 1663210, "packet must target asset 1663210");
assertInvariant(packet.summary.targetField === "SF_32", "packet must target SF_32");
assertInvariant(packet.summary.targetSelector === "eAttrib:994 + local-role:949", "packet must target revised 994 + local 949");
assertInvariant(packet.summary.priorSelector949DirectClaimSuspended === true, "direct selector:949 claim must be suspended");
assertInvariant(packet.summary.templateNeedsRevision === true, "packet must require revised template");
assertInvariant(packet.summary.nextAcceptedClaimField === "eAttrib:994 + local-role:949", "next claim field must be revised");
assertInvariant(packet.requiredClaim.field === "eAttrib:994 + local-role:949", "required claim field must be revised");
assertInvariant(packet.requiredClaim.mustContain.includes("1663210"), "claim must require asset id");
assertInvariant(packet.requiredClaim.mustContain.includes("eAttrib:994"), "claim must require eAttrib:994");
assertInvariant(packet.requiredClaim.mustContain.includes("Bonus_Percent_Per_Power"), "claim must require bonus name");
assertInvariant(packet.requiredClaim.mustContain.includes("local-role:949"), "claim must require local role");
assertInvariant(packet.requiredClaim.mustContain.includes("SF_32"), "claim must require SF_32");
assertInvariant(packet.requiredClaim.rejects.includes("selector:949 direct seul"), "claim must reject direct selector:949-only proof");
assertInvariant(packet.supersededClaim?.obsolete === true, "packet must mark selector:949-only claim obsolete");
assertInvariant(packet.parserBridgeContract.requiredInvariants.some((item) => item.includes("eAttrib:994")), "bridge invariant must require eAttrib:994");
assertInvariant(packet.summary.canModifyReliableDps === false, "packet must not modify reliable DPS");
assertInvariant(packet.summary.promotionReady === false, "packet must not mark promotion ready");

console.log(JSON.stringify({
  status: "sf32-owner-source-packet-test-ok",
  targetSelector: packet.summary.targetSelector,
  requiredField: packet.requiredClaim.field,
  mustContain: packet.requiredClaim.mustContain,
  canModifyReliableDps: packet.summary.canModifyReliableDps,
  promotionReady: packet.summary.promotionReady,
}, null, 2));
