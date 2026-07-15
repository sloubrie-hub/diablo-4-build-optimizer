const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { analyzeRuntimeCadence } = require("../work/diablo4-data-exporter/src/runtime-cadence-analyzer");
const { createRuntimeCadenceCandidate } = require("../work/diablo4-data-exporter/src/runtime-cadence-intake");

function defaultPaths(rootDir) {
  return {
    observationInput: path.join(rootDir, "inputs", "current-runtime-cadence-observations.json"),
    boundaryAudit: path.join(rootDir, "outputs", "diablo4-current-ai-schedule-boundary-audit", "current-ai-schedule-boundary-audit.json"),
    schema: path.join(rootDir, "work", "diablo4-data-exporter", "schema", "runtime-cadence-observations.schema.json"),
    analysisOutput: path.join(rootDir, "outputs", "diablo4-current-runtime-cadence-analysis", "current-runtime-cadence-analysis.json"),
    optimizerPlanScript: path.join(rootDir, "work", "diablo4-data-exporter", "scripts", "build-target-optimizer-plan.js"),
    optimizerPlanOutput: path.join(rootDir, "outputs", "diablo4-target-optimizer-plan", "target-optimizer-plan.json"),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function projectPath(rootDir, filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function analysisSource(rootDir, paths, observationBuffer) {
  return {
    observationInput: projectPath(rootDir, paths.observationInput),
    observationInputSha256: sha256(observationBuffer),
    boundaryAudit: projectPath(rootDir, paths.boundaryAudit),
    schema: projectPath(rootDir, paths.schema),
  };
}

function analyzeCurrent(rootDir, paths) {
  const observationBuffer = fs.readFileSync(paths.observationInput);
  const observations = JSON.parse(observationBuffer.toString("utf8"));
  const boundaryAudit = readJson(paths.boundaryAudit);
  const schema = readJson(paths.schema);
  const analysis = analyzeRuntimeCadence({
    observations,
    boundaryAudit,
    schema,
    source: analysisSource(rootDir, paths, observationBuffer),
  });
  return { observations, boundaryAudit, schema, analysis };
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tempFile, `${JSON.stringify(value, null, 2)}\n`);
    fs.renameSync(tempFile, filePath);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
}

function readJsonBody(request, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(Object.assign(new Error("request-too-large"), { statusCode: 413 }));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("invalid-json"), { statusCode: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function publicIntakeResult(result, saved = false) {
  return {
    accepted: result.accepted,
    saved,
    status: result.status,
    code: result.code,
    message: result.message,
    details: result.details,
    summary: result.analysis?.summary ?? null,
    validation: result.analysis?.validation ?? null,
    session: result.sessionAnalysis ?? null,
    safeguards: {
      ...(result.safeguards ?? {}),
      writesObservationInput: saved,
      canModifyReliableDps: false,
    },
  };
}

function snapshot(rootDir, paths) {
  const current = analyzeCurrent(rootDir, paths);
  return {
    summary: current.analysis.summary,
    validation: current.analysis.validation,
    scenarios: current.boundaryAudit.runtimeObservationPlan?.scenarios ?? [],
    sessions: current.observations.sessions,
    safeguards: current.analysis.safeguards,
  };
}

function refreshOptimizerPlan(rootDir, paths) {
  const result = spawnSync(process.execPath, [paths.optimizerPlanScript], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return {
      status: "failed",
      message: (result.stderr || result.stdout || `exit ${result.status}`).trim(),
      summary: null,
    };
  }
  return {
    status: "completed",
    message: null,
    summary: fs.existsSync(paths.optimizerPlanOutput) ? readJson(paths.optimizerPlanOutput).summary : null,
  };
}

function createRuntimeCadenceApi(options = {}) {
  const rootDir = path.resolve(options.rootDir ?? path.resolve(__dirname, ".."));
  const paths = { ...defaultPaths(rootDir), ...(options.paths ?? {}) };
  const shouldRefreshOptimizerPlan = options.refreshOptimizerPlan !== false;
  let writeInProgress = false;

  return async function handleRuntimeCadenceApi(request, response, urlPath) {
    if (!urlPath.startsWith("/api/runtime-cadence")) return false;

    if (request.method === "GET" && urlPath === "/api/runtime-cadence") {
      sendJson(response, 200, snapshot(rootDir, paths));
      return true;
    }

    const isPreview = request.method === "POST" && urlPath === "/api/runtime-cadence/sessions/preview";
    const isSave = request.method === "POST" && urlPath === "/api/runtime-cadence/sessions";
    if (!isPreview && !isSave) {
      sendJson(response, 405, { code: "method-not-allowed", message: "Methode non autorisee." });
      return true;
    }
    if (!String(request.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
      sendJson(response, 415, { code: "json-content-type-required", message: "Le contenu doit etre du JSON." });
      return true;
    }
    if (isSave && writeInProgress) {
      sendJson(response, 409, { code: "runtime-write-in-progress", message: "Une session est deja en cours d'enregistrement." });
      return true;
    }
    if (isSave) writeInProgress = true;

    try {
      const body = await readJsonBody(request);
      const current = analyzeCurrent(rootDir, paths);
      const intake = createRuntimeCadenceCandidate({
        currentInput: current.observations,
        session: body?.session,
        boundaryAudit: current.boundaryAudit,
        schema: current.schema,
        source: analysisSource(rootDir, paths, fs.readFileSync(paths.observationInput)),
      });
      if (!intake.accepted) {
        sendJson(response, intake.status === "conflict" ? 409 : 422, publicIntakeResult(intake));
        return true;
      }
      if (isPreview) {
        sendJson(response, 200, publicIntakeResult(intake));
        return true;
      }

      const candidateBuffer = Buffer.from(`${JSON.stringify(intake.candidateInput, null, 2)}\n`);
      const finalAnalysis = analyzeRuntimeCadence({
        observations: intake.candidateInput,
        boundaryAudit: current.boundaryAudit,
        schema: current.schema,
        source: analysisSource(rootDir, paths, candidateBuffer),
      });
      writeJsonAtomic(paths.analysisOutput, finalAnalysis);
      writeJsonAtomic(paths.observationInput, intake.candidateInput);
      const planRefresh = shouldRefreshOptimizerPlan
        ? refreshOptimizerPlan(rootDir, paths)
        : { status: "skipped", message: null, summary: null };
      sendJson(response, 201, {
        ...publicIntakeResult({ ...intake, analysis: finalAnalysis }, true),
        planRefresh,
        snapshot: snapshot(rootDir, paths),
      });
      return true;
    } catch (error) {
      const statusCode = Number(error.statusCode) || 500;
      sendJson(response, statusCode, {
        code: error.message === "invalid-json" ? "invalid-json" : error.message === "request-too-large" ? "request-too-large" : "runtime-api-error",
        message: statusCode === 500 ? "L'operation runtime a echoue." : "La requete runtime est invalide.",
      });
      return true;
    } finally {
      if (isSave) writeInProgress = false;
    }
  };
}

module.exports = {
  createRuntimeCadenceApi,
};
