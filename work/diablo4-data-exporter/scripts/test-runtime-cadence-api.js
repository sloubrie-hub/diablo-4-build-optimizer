const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { PassThrough } = require("stream");
const { createServer } = require("../../../site/server");
const { createRuntimeCadenceApi } = require("../../../site/runtime-cadence-api");

const rootDir = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "d4-runtime-api-"));
const observationInput = path.join(tempDir, "current-runtime-cadence-observations.json");
const analysisOutput = path.join(tempDir, "current-runtime-cadence-analysis.json");
const optimizerPlanScript = path.join(tempDir, "refresh-target-optimizer-plan.js");
const optimizerPlanOutput = path.join(tempDir, "target-optimizer-plan.json");
fs.copyFileSync(path.join(rootDir, "inputs", "current-runtime-cadence-observations.json"), observationInput);
fs.writeFileSync(optimizerPlanScript, [
  'const fs = require("fs");',
  `fs.writeFileSync(${JSON.stringify(optimizerPlanOutput)}, JSON.stringify({ summary: { temporaryPlanRefreshed: true } }));`,
].join("\n"));

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function event(observedAtSeconds, eventKind, attackKind = "none", damageInstanceCount = null) {
  return {
    observedAtSeconds,
    eventKind,
    attackKind,
    damageInstanceCount,
    notes: null,
  };
}

function validSession(id = "capture-api-baseline-001") {
  return {
    id,
    scenarioId: "baseline-sequence",
    sourceFile: "captures/centipede-api-baseline-001.mp4",
    captureFps: 60,
    attackSpeedState: { label: "baseline", attacksPerSecond: null, modifiers: [] },
    buildState: { blastOfBile: false, attackSpeedStableWithinCast: true, otherSkillModifiers: [] },
    events: [
      event(0, "cast-start"),
      event(1, "attack-contact", "projectile"),
      event(1.01, "damage-instance", "projectile", 1),
      event(3, "despawn"),
    ],
  };
}

function requestJson(port, method, requestPath, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body === null ? null : Buffer.from(JSON.stringify(body));
    const request = http.request({
      host: "127.0.0.1",
      port,
      method,
      path: requestPath,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
      } : {},
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolve({
            statusCode: response.statusCode,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

function captureResponse() {
  const state = { statusCode: null, body: null };
  state.response = {
    writeHead(statusCode) {
      state.statusCode = statusCode;
    },
    end(payload) {
      state.body = JSON.parse(String(payload));
    },
  };
  return state;
}

async function assertConcurrentSaveRejected() {
  const api = createRuntimeCadenceApi({
    rootDir,
    paths: { observationInput, analysisOutput },
    refreshOptimizerPlan: false,
  });
  const pendingRequest = new PassThrough();
  pendingRequest.method = "POST";
  pendingRequest.headers = { "content-type": "application/json" };
  const pendingResponse = captureResponse();
  const pendingResult = api(pendingRequest, pendingResponse.response, "/api/runtime-cadence/sessions");

  const competingRequest = new PassThrough();
  competingRequest.method = "POST";
  competingRequest.headers = { "content-type": "application/json" };
  competingRequest.end(JSON.stringify({ session: validSession("capture-api-competing-001") }));
  const competingResponse = captureResponse();
  await api(competingRequest, competingResponse.response, "/api/runtime-cadence/sessions");
  assertInvariant(competingResponse.statusCode === 409, "concurrent API save should return a conflict");
  assertInvariant(competingResponse.body.code === "runtime-write-in-progress", "concurrent API save should expose the write lock");

  pendingRequest.end("{");
  await pendingResult;
  assertInvariant(pendingResponse.statusCode === 400, "pending malformed save should release the write lock");
}

async function main() {
  await assertConcurrentSaveRejected();
  const server = createServer({
    rootDir,
    runtimeApiOptions: {
      paths: { observationInput, analysisOutput, optimizerPlanScript, optimizerPlanOutput },
    },
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  try {
    const initial = await requestJson(port, "GET", "/api/runtime-cadence");
    assertInvariant(initial.statusCode === 200, "runtime API GET should succeed");
    assertInvariant(initial.body.summary.totalSessions === 0, "runtime API should expose the empty real-input copy");

    const preview = await requestJson(port, "POST", "/api/runtime-cadence/sessions/preview", { session: validSession() });
    assertInvariant(preview.statusCode === 200 && preview.body.accepted === true, "valid preview should be accepted");
    assertInvariant(preview.body.saved === false, "preview should not save the session");
    assertInvariant(JSON.parse(fs.readFileSync(observationInput, "utf8")).sessions.length === 0, "preview must not modify the temporary input");

    const syntheticSession = validSession("fixture-api-001");
    syntheticSession.sourceFile = "synthetic-fixture://api-001";
    const synthetic = await requestJson(port, "POST", "/api/runtime-cadence/sessions", { session: syntheticSession });
    assertInvariant(synthetic.statusCode === 422, "synthetic API save should be rejected");
    assertInvariant(synthetic.body.code === "synthetic-source-rejected", "synthetic API rejection should expose its reason");

    const saved = await requestJson(port, "POST", "/api/runtime-cadence/sessions", { session: validSession() });
    assertInvariant(saved.statusCode === 201 && saved.body.saved === true, "valid API save should persist the session");
    assertInvariant(saved.body.summary.totalSessions === 1, "saved API response should expose one session");
    assertInvariant(saved.body.summary.currentStrictDpsKnown === false, "saved API session must not invent strict DPS");
    assertInvariant(saved.body.planRefresh.status === "completed", "valid API save should refresh the optimizer plan");
    assertInvariant(saved.body.planRefresh.summary.temporaryPlanRefreshed === true, "API response should expose the refreshed temporary plan");
    assertInvariant(JSON.parse(fs.readFileSync(observationInput, "utf8")).sessions.length === 1, "temporary input should contain the saved session");
    assertInvariant(JSON.parse(fs.readFileSync(analysisOutput, "utf8")).summary.currentStrictDpsKnown === false, "temporary analysis should keep strict DPS unknown");

    const duplicate = await requestJson(port, "POST", "/api/runtime-cadence/sessions", { session: validSession() });
    assertInvariant(duplicate.statusCode === 409, "duplicate API save should return a conflict");

    const finalSnapshot = await requestJson(port, "GET", "/api/runtime-cadence");
    assertInvariant(finalSnapshot.body.summary.totalSessions === 1, "runtime API should expose the persisted temporary session");
    assertInvariant(finalSnapshot.body.sessions.length === 1, "runtime API session list should match the temporary input");

    console.log(JSON.stringify({
      status: "runtime-cadence-api-test-ok",
      previewSaved: preview.body.saved,
      syntheticStatus: synthetic.statusCode,
      savedSessions: finalSnapshot.body.summary.totalSessions,
      duplicateStatus: duplicate.statusCode,
      concurrentStatus: 409,
      planRefreshStatus: saved.body.planRefresh.status,
      currentStrictDpsKnown: finalSnapshot.body.summary.currentStrictDpsKnown,
      realInputSessions: JSON.parse(fs.readFileSync(path.join(rootDir, "inputs", "current-runtime-cadence-observations.json"), "utf8")).sessions.length,
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
