const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-selector-asset-record-contract-"));
const outDir = path.join(tempDir, "contract");

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

run("build-selector-asset-record-parser-contract.js", [
  "outputs/diablo4-local-949-role-decode-audit/local-949-role-decode-audit.json",
  "outputs/diablo4-selector-asset-layout-parser/selector-asset-layout-parser.json",
  outDir,
]);

const contract = readJson(path.join(outDir, "selector-asset-record-parser-contract.json"));
assertInvariant(contract.summary.parserRoot === "selector-asset-record", "contract must target selector-asset-record parser");
assertInvariant(contract.summary.contractReady === true, "contract should be structurally ready");
assertInvariant(contract.summary.parserLayouts === 3, "contract must expose three parser layouts");
assertInvariant(contract.summary.failedInvariants === 0, "contract invariants must pass");
assertInvariant(contract.summary.bonusAnchorSelector === 994, "contract must keep 994 as bonus anchor");
assertInvariant(contract.summary.localPayloadSelector === 949, "contract must keep 949 as local payload selector");
assertInvariant(contract.summary.semanticBridgeReady === false, "contract must not open semantic bridge");
assertInvariant(contract.summary.canModifyReliableDps === false, "contract must not modify reliable DPS");
assertInvariant(contract.summary.canUseForReliableDps === false, "contract must not allow reliable DPS");
assertInvariant(contract.summary.canUseForRanking === false, "contract must not allow ranking");
assertInvariant(contract.summary.promotionReady === false, "contract must not mark promotion ready");
assertInvariant(contract.parserLayouts.some((layout) => layout.id === "bonus-anchor-994" && layout.semanticStatus === "source-backed-bonus-anchor"), "contract must include 994 source-backed layout");
assertInvariant(contract.parserLayouts.some((layout) => layout.id === "local-compact-949" && layout.semanticStatus === "payload-unresolved"), "contract must include unresolved compact 949 layout");
assertInvariant(contract.outputContract.forbiddenOutputFields.includes("reliableDps"), "contract must forbid reliableDps output");
assertInvariant(contract.safeguards.readOnlyParser === true, "contract must require read-only parser");

console.log(JSON.stringify({
  status: "selector-asset-record-parser-contract-test-ok",
  parserRoot: contract.summary.parserRoot,
  contractReady: contract.summary.contractReady,
  canModifyReliableDps: contract.summary.canModifyReliableDps,
  promotionReady: contract.summary.promotionReady,
}, null, 2));
