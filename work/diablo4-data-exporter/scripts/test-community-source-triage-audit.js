const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-community-source-triage-"));
const outDir = path.join(tempDir, "out");

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

run("build-community-source-triage-audit.js", [outDir]);

const report = readJson(path.join(outDir, "community-source-triage-audit.json"));
const sourceIds = new Set((report.sources ?? []).map((source) => source.id));

assertInvariant(report.summary.sourceTriageReady === true, "source triage should be ready");
assertInvariant(report.summary.bestNextSourceId === "diablotools-d4data", "DiabloTools/d4data should be the best next source");
assertInvariant(report.summary.canModifyReliableDps === false, "source triage must not modify reliable DPS");
assertInvariant(report.summary.acceptedForBridge === false, "source triage must not open bridge");
assertInvariant(report.summary.promotionReady === false, "source triage must not be promotion ready");
assertInvariant(sourceIds.has("diablotools-d4data"), "DiabloTools/d4data source missing");
assertInvariant(sourceIds.has("blizzhackers-d4data"), "blizzhackers/d4data source missing");
assertInvariant(sourceIds.has("mfloob-diablo4-data-harvest"), "mfloob source missing");
assertInvariant((report.blockers ?? []).length === 3, "three proof blockers should remain");

console.log(JSON.stringify({
  status: "community-source-triage-audit-test-ok",
  bestNextSourceId: report.summary.bestNextSourceId,
  sourcesReviewed: report.summary.sourcesReviewed,
  canModifyReliableDps: report.summary.canModifyReliableDps,
}, null, 2));
