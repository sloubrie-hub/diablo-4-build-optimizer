const path = require("path");
const {
  dirExists,
  groupByExtension,
  listFilesRecursive,
  writeJson,
} = require("./fs-utils");
const {
  detectConfigs,
  readBuildInfo,
  readConfigFiles,
} = require("./config-parser");
const { analyzeIndexFile } = require("./index-analyzer");

function scanInstall(gamePath, outDir) {
  const resolvedGamePath = path.resolve(gamePath);
  const dataPath = path.join(resolvedGamePath, "Data");
  const configPath = path.join(dataPath, "config");

  if (!dirExists(resolvedGamePath)) {
    throw new Error(`Game path not found: ${resolvedGamePath}`);
  }
  if (!dirExists(dataPath)) {
    throw new Error(`Data path not found: ${dataPath}`);
  }

  const buildInfo = readBuildInfo(resolvedGamePath);
  const configFiles = readConfigFiles(configPath);
  const allFiles = listFilesRecursive(resolvedGamePath);
  const dataFiles = listFilesRecursive(path.join(dataPath, "data"));
  const cdnIndexFiles = listFilesRecursive(path.join(dataPath, "indices"));
  const fenrisFiles = listFilesRecursive(path.join(dataPath, "fenris"));
  const activeBuildInfo = Array.isArray(buildInfo) ? buildInfo.find((row) => row.Active === "1") : null;
  const { buildConfig, cdnConfig, archiveSummary } = detectConfigs(configFiles, activeBuildInfo);

  const localIdxFiles = dataFiles.filter((file) => file.extension === ".idx");
  const cdnIndexSample = cdnIndexFiles.filter((file) => file.extension === ".index").slice(0, 5);
  const localIdxSample = localIdxFiles.slice(0, 5);

  const indexAnalysis = {
    localIdxSamples: localIdxSample.map((file) =>
      analyzeIndexFile(file.path, { maxRecords: 50, maxBytes: 2 * 1024 * 1024 })
    ),
    cdnIndexSamples: cdnIndexSample.map((file) =>
      analyzeIndexFile(file.path, { maxRecords: 50, maxBytes: 2 * 1024 * 1024 })
    ),
  };

  const manifest = {
    exportedAt: new Date().toISOString(),
    exporter: {
      name: "diablo4-local-install-exporter",
      stage: "metadata-and-index-analysis",
      note:
        "This exporter inventories local Battle.net/CASC metadata and analyzes index layouts. It does not decrypt, unpack protected assets, or parse gameplay tables yet.",
    },
    gamePath: resolvedGamePath,
    buildInfo,
    detectedBuild: buildConfig
      ? {
          product: buildConfig.values["build-product"],
          name: buildConfig.values["build-name"],
          branch: buildConfig.values["build-branch"],
          timestamp: buildConfig.values["build-timestamp"],
          clientVersion: buildConfig.values["client-version"],
        }
      : null,
    casc: {
      buildKey: activeBuildInfo?.["Build Key"] ?? null,
      cdnKey: activeBuildInfo?.["CDN Key"] ?? null,
      cdnPath: activeBuildInfo?.["CDN Path"] ?? null,
      cdnHosts: activeBuildInfo?.["CDN Hosts"] ?? null,
      encoding: buildConfig?.values.encoding ?? null,
      vfsRoot: buildConfig?.values["vfs-root"] ?? null,
      fileIndex: cdnConfig?.values["file-index"] ?? null,
      patchFileIndex: cdnConfig?.values["patch-file-index"] ?? null,
    },
    counts: {
      files: allFiles.length,
      dataFiles: dataFiles.length,
      localIdxFiles: localIdxFiles.length,
      cdnIndexFiles: cdnIndexFiles.length,
      fenrisFiles: fenrisFiles.length,
      configFiles: configFiles.length,
      cdnArchives: archiveSummary?.archives.length ?? 0,
      patchArchives: archiveSummary?.patchArchives.length ?? 0,
    },
    totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
    extensions: groupByExtension(allFiles),
  };

  writeJson(path.join(outDir, "manifest.json"), manifest);
  writeJson(path.join(outDir, "config-files.json"), configFiles);
  writeJson(path.join(outDir, "archives.json"), archiveSummary ?? {});
  writeJson(path.join(outDir, "file-inventory.json"), allFiles);
  writeJson(path.join(outDir, "index-analysis.json"), indexAnalysis);

  return manifest;
}

module.exports = {
  scanInstall,
};
