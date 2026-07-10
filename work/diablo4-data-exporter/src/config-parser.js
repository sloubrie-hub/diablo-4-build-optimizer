const fs = require("fs");
const path = require("path");
const { listFilesRecursive, sha256SmallFile } = require("./fs-utils");

function parseKeyValueConfig(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    result[key] = value;
  }
  return result;
}

function parseBuildInfo(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { raw: content };

  const headers = lines[0].split("|").map((header) => header.split("!")[0]);
  return lines.slice(1).map((line) => {
    const values = line.split("|");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function readConfigFiles(configDir) {
  const configFiles = listFilesRecursive(configDir);
  return configFiles.map((file) => {
    const content = fs.readFileSync(file.path, "utf8");
    return {
      ...file,
      sha256: sha256SmallFile(file.path),
      values: parseKeyValueConfig(content),
    };
  });
}

function summarizeArchives(cdnConfig) {
  const archives = (cdnConfig.archives || "").split(/\s+/).filter(Boolean);
  const archiveSizes = (cdnConfig["archives-index-size"] || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
  const patchArchives = (cdnConfig["patch-archives"] || "").split(/\s+/).filter(Boolean);
  const patchArchiveSizes = (cdnConfig["patch-archives-index-size"] || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);

  return {
    archives: archives.map((key, index) => ({
      key,
      indexFile: `${key}.index`,
      indexSize: archiveSizes[index] ?? null,
    })),
    patchArchives: patchArchives.map((key, index) => ({
      key,
      indexFile: `${key}.index`,
      indexSize: patchArchiveSizes[index] ?? null,
    })),
  };
}

function detectConfigs(configFiles, activeBuildInfo = null) {
  const activeBuildKey = activeBuildInfo?.["Build Key"];
  const activeCdnKey = activeBuildInfo?.["CDN Key"];

  const buildConfig =
    configFiles.find((file) => activeBuildKey && file.name === activeBuildKey) ??
    configFiles.find((file) => file.values["build-product"] === "Fenris");
  const cdnConfig =
    configFiles.find((file) => activeCdnKey && file.name === activeCdnKey) ??
    configFiles.find((file) => file.values.archives);

  return {
    buildConfig,
    cdnConfig,
    archiveSummary: cdnConfig ? summarizeArchives(cdnConfig.values) : null,
  };
}

function readBuildInfo(gamePath) {
  const buildInfoPath = path.join(gamePath, ".build.info");
  if (!fs.existsSync(buildInfoPath)) return [];
  return parseBuildInfo(fs.readFileSync(buildInfoPath, "utf8"));
}

module.exports = {
  detectConfigs,
  parseBuildInfo,
  parseKeyValueConfig,
  readBuildInfo,
  readConfigFiles,
  summarizeArchives,
};
