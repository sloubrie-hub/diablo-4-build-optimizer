const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function listFilesRecursive(root) {
  const files = [];
  if (!dirExists(root)) return files;

  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        files.push({
          path: fullPath,
          relativePath: path.relative(root, fullPath),
          name: entry.name,
          extension: path.extname(entry.name).toLowerCase(),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        });
      }
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function groupByExtension(files) {
  const counts = new Map();
  for (const file of files) {
    const key = file.extension || "(none)";
    const current = counts.get(key) ?? { extension: key, count: 0, totalSize: 0 };
    current.count += 1;
    current.totalSize += file.size;
    counts.set(key, current);
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

function sha256SmallFile(filePath, maxBytes = 25 * 1024 * 1024) {
  const stat = fs.statSync(filePath);
  if (stat.size > maxBytes) return null;
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

module.exports = {
  dirExists,
  ensureDir,
  fileExists,
  groupByExtension,
  listFilesRecursive,
  sha256SmallFile,
  writeJson,
};
