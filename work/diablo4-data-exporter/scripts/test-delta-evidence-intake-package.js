const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const scriptDir = path.join(rootDir, "work", "diablo4-data-exporter", "scripts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-delta-evidence-intake-package-"));
const outDir = path.join(tempDir, "package");

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

run("build-delta-evidence-intake-package.js", [
  "outputs/diablo4-external-delta-evidence-workorder/external-delta-evidence-workorder.json",
  "outputs/diablo4-delta-bridge-readiness/delta-bridge-readiness.json",
  "outputs/diablo4-delta-promotion-review/delta-promotion-review.json",
  outDir,
]);

const report = readJson(path.join(outDir, "delta-evidence-intake-package.json"));
assertInvariant(report.summary.templates === 3, "package should include three delta templates");
assertInvariant(report.summary.tasks === 3, "package should track three delta tasks");
assertInvariant(report.summary.packageReady === true, "package should be ready for intake collection");
assertInvariant(report.summary.canModifyReliableDps === false, "package must not modify reliable DPS");
assertInvariant(report.summary.promotionReady === false, "package must not mark promotion ready");
assertInvariant(report.templates.every((template) => template.reviewer?.status === "pending"), "templates must stay pending");
assertInvariant(report.templates.some((template) => template.claim?.type === "sf32-field-ownership"), "SF_32 template missing");
assertInvariant(report.templates.some((template) => template.claim?.type === "sf33-trigger"), "SF_33 template missing");
assertInvariant(report.templates.some((template) => template.claim?.type === "uptime"), "uptime template missing");
assertInvariant(report.safeguards.some((item) => item.includes("templates ne sont pas des preuves")), "template proof safeguard missing");

console.log(JSON.stringify({
  status: "delta-evidence-intake-package-test-ok",
  templates: report.summary.templates,
  packageReady: report.summary.packageReady,
  canModifyReliableDps: report.summary.canModifyReliableDps,
  promotionReady: report.summary.promotionReady,
}, null, 2));
