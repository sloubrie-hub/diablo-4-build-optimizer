const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const node = process.execPath;
const cli = path.join("work", "diablo4-data-exporter", "d4export.js");
const gameDataDir = "C:/Program Files (x86)/Diablo IV/Data/data";

const targets = [
  {
    assetId: 1461593,
    file: "data.045",
    offset: 43688625,
    terms: [
      "Necromancer_Talent_Caster_T3_N1",
      "Helm_Unique_Necro_100",
      "legendary_necro_012",
      "0.1 * Table(34, sLevel)",
    ],
  },
  {
    assetId: 2474146,
    file: "data.043",
    offset: 10279789,
    terms: [
      "legendary_necro_012",
      "1HShield_Unique_Paladin_005",
      "Affix_Value_2#1HShield_Unique_Paladin_005",
    ],
  },
  {
    assetId: 1408295,
    file: "data.042",
    offset: 19293246,
    terms: [
      "NPC_Mercenary_BerserkerCrone_passiveA6",
      "Weapon_Damage_Min > 0",
      "Script Formula 2",
    ],
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function decodeIfNeeded(file, offset, outDir) {
  const decodedPath = path.join(outDir, `${file}.${offset}.decoded.bin`);
  if (fs.existsSync(decodedPath)) return { ok: true, decodedPath, reused: true };

  const result = cp.spawnSync(
    node,
    [
      cli,
      "decode-blte",
      "--file",
      path.join(gameDataDir, file),
      "--offset",
      String(offset),
      "--out",
      outDir,
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || "").split(/\r?\n/).find(Boolean) || "decode failed",
    };
  }
  return { ok: true, decodedPath, reused: false };
}

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    assets: targets.length,
    decodedAttempts: 0,
    hits: 0,
  },
  assets: [],
};

for (const target of targets) {
  const catalogPath = path.join(
    "outputs",
    "diablo4-blte-catalog-target-files",
    `${target.file}.blte-catalog.json`
  );
  const catalog = readJson(catalogPath);
  const nearestOffsets = (catalog.interestingEntries || catalog.entries || [])
    .map((entry) => entry.offset)
    .filter(Number.isFinite)
    .sort((left, right) => Math.abs(left - target.offset) - Math.abs(right - target.offset))
    .slice(0, 20);

  const outDir = path.join(
    "outputs",
    `diablo4-source-asset-${target.assetId}-payload-neighbor-scan`
  );
  ensureDir(outDir);

  const rows = [];
  for (const offset of nearestOffsets) {
    const decoded = decodeIfNeeded(target.file, offset, outDir);
    if (!decoded.ok) {
      rows.push({
        offset,
        delta: offset - target.offset,
        decoded: false,
        error: decoded.error,
      });
      continue;
    }

    report.summary.decodedAttempts += 1;
    const buffer = fs.readFileSync(decoded.decodedPath);
    const text = buffer.toString("latin1");
    const found = target.terms.filter((term) => text.includes(term));
    if (found.length > 0) report.summary.hits += 1;
    rows.push({
      offset,
      delta: offset - target.offset,
      decoded: true,
      reused: decoded.reused,
      bytes: buffer.length,
      found,
    });
  }

  report.assets.push({
    assetId: target.assetId,
    file: target.file,
    targetOffset: target.offset,
    terms: target.terms,
    nearestScanned: nearestOffsets.length,
    hits: rows.filter((row) => row.found && row.found.length > 0).length,
    rows,
  });
}

const outDir = path.join("outputs", "diablo4-record-header-neighbor-scan");
ensureDir(outDir);
const outFile = path.join(outDir, "record-header-neighbor-scan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(
  JSON.stringify(
    {
      outFile,
      summary: report.summary,
      assets: report.assets.map((asset) => ({
        assetId: asset.assetId,
        nearestScanned: asset.nearestScanned,
        hits: asset.hits,
        hitRows: asset.rows.filter((row) => row.found && row.found.length > 0),
      })),
    },
    null,
    2
  )
);
