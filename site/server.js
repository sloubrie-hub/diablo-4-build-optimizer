const http = require("http");
const fs = require("fs");
const path = require("path");
const { createRuntimeCadenceApi } = require("./runtime-cadence-api");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function isInsideRoot(rootDir, filePath) {
  const relative = path.relative(rootDir, filePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function createServer(options = {}) {
  const root = path.resolve(options.rootDir ?? path.resolve(__dirname, ".."));
  const runtimeApi = createRuntimeCadenceApi({
    rootDir: root,
    ...(options.runtimeApiOptions ?? {}),
  });
  return http.createServer(async (request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);
  if (await runtimeApi(request, response, urlPath)) return;
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405);
    response.end("method not allowed");
    return;
  }
  const relativePath = urlPath === "/" ? "site/index.html" : urlPath.replace(/^\/+/, "");
  let filePath = path.join(root, relativePath);

  if (!isInsideRoot(root, filePath)) {
    response.writeHead(403);
    response.end("forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, {
      "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : data);
  });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  const host = "127.0.0.1";
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`Diablo IV Build Optimizer: http://${host}:${port}/site/`);
  });
}

module.exports = {
  createServer,
};
