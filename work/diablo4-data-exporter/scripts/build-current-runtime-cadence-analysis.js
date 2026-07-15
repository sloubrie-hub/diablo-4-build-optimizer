const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { analyzeRuntimeCadence } = require("../src/runtime-cadence-analyzer");

const inputs = {
  observationInput: process.argv[2] ?? "inputs/current-runtime-cadence-observations.json",
  boundaryAudit: process.argv[3] ?? "outputs/diablo4-current-ai-schedule-boundary-audit/current-ai-schedule-boundary-audit.json",
  schema: process.argv[4] ?? "work/diablo4-data-exporter/schema/runtime-cadence-observations.schema.json",
  outDir: process.argv[5] ?? "outputs/diablo4-current-runtime-cadence-analysis",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const observationBuffer = fs.readFileSync(inputs.observationInput);
const observations = JSON.parse(observationBuffer.toString("utf8"));
const boundaryAudit = readJson(inputs.boundaryAudit);
const schema = readJson(inputs.schema);
const report = analyzeRuntimeCadence({
  observations,
  boundaryAudit,
  schema,
  source: {
    observationInput: inputs.observationInput,
    observationInputSha256: crypto.createHash("sha256").update(observationBuffer).digest("hex"),
    boundaryAudit: inputs.boundaryAudit,
    schema: inputs.schema,
  },
});

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "current-runtime-cadence-analysis.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
