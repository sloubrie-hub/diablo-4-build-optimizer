const fs = require("fs");
const path = require("path");
const { decodeBlteAt } = require("./blte-reader");

function inspectTableCandidate(filePath, blteOffset, options = {}) {
  const decoded = decodeBlteAt(filePath, blteOffset, {
    maxReadBytes: options.maxReadBytes ?? 64 * 1024 * 1024,
  }).decoded;
  const tableIds = options.tableIds ?? [34, 35];
  const floats = readFloatSeries(decoded);
  const runs = findFloatRuns(floats, {
    minRunLength: options.minRunLength ?? 8,
    maxGapBytes: options.maxGapBytes ?? 4,
  });
  const rankedRuns = runs
    .map((run) => ({
      ...run,
      rowGuesses: guessRowWidths(run.values),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.maxRuns ?? 12);

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      filePath,
      fileName: path.basename(filePath),
      blteOffset,
    },
    decoded: {
      bytes: decoded.length,
      first64Hex: decoded.subarray(0, 64).toString("hex"),
    },
    tableIds,
    idHits: findIdHits(decoded, tableIds),
    stringSummary: extractAsciiStrings(decoded, { minLength: 4, maxStrings: 80 }),
    summary: {
      floatValues: floats.length,
      runs: rankedRuns.length,
      strongestRun: rankedRuns[0]
        ? {
            offset: rankedRuns[0].offset,
            length: rankedRuns[0].length,
            min: rankedRuns[0].min,
            max: rankedRuns[0].max,
            score: rankedRuns[0].score,
            bestWidth: rankedRuns[0].rowGuesses[0]?.width ?? null,
          }
        : null,
    },
    runs: rankedRuns,
  };
}

function inspectTableCandidatesFromFile(candidatesFile, options = {}) {
  const candidates = JSON.parse(fs.readFileSync(candidatesFile, "utf8")).candidates ?? [];
  const assetIds = new Set(options.assetIds ?? []);
  const selected = candidates.filter((candidate) => !assetIds.size || assetIds.has(candidate.assetId));
  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    candidatesFile,
    selected: selected.map((candidate) => ({
      assetId: candidate.assetId,
      priorScore: candidate.score,
      inspection: inspectTableCandidate(candidate.source.filePath, candidate.source.blteOffset, options),
    })),
  };
}

function readFloatSeries(buffer) {
  const values = [];
  for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
    const value = buffer.readFloatLE(offset);
    if (!Number.isFinite(value)) continue;
    if (Math.abs(value) > 1000000) continue;
    values.push({
      offset,
      value: round(value),
    });
  }
  return values;
}

function findFloatRuns(values, options = {}) {
  const minRunLength = options.minRunLength ?? 8;
  const maxGapBytes = options.maxGapBytes ?? 4;
  const runs = [];
  let current = [];

  for (const item of values) {
    const previous = current[current.length - 1];
    const adjacent = !previous || item.offset - previous.offset <= maxGapBytes;
    if (isUsefulFloat(item.value) && adjacent) {
      current.push(item);
    } else {
      flushRun();
      if (isUsefulFloat(item.value)) current.push(item);
    }
  }
  flushRun();
  return runs;

  function flushRun() {
    if (current.length >= minRunLength) {
      const valuesOnly = current.map((item) => item.value);
      const nonZero = valuesOnly.filter((value) => Math.abs(value) >= 0.000001).length;
      const monotonicPairs = valuesOnly.slice(1).filter((value, index) => value >= valuesOnly[index]).length;
      const distinct = new Set(valuesOnly.map((value) => value.toFixed(4))).size;
      const score = current.length + monotonicPairs + Math.min(distinct, 40) + nonZero;
      runs.push({
        offset: current[0].offset,
        endOffset: current[current.length - 1].offset + 4,
        length: current.length,
        score,
        nonZeroRatio: round(nonZero / current.length),
        monotonicPairs,
        min: round(Math.min(...valuesOnly)),
        max: round(Math.max(...valuesOnly)),
        sample: valuesOnly.slice(0, 40),
        values: valuesOnly,
      });
    }
    current = [];
  }
}

function isUsefulFloat(value) {
  if (!Number.isFinite(value)) return false;
  if (Math.abs(value) < 0.000001) return false;
  if (Math.abs(value) > 1000000) return false;
  return true;
}

function guessRowWidths(values) {
  const widths = [2, 3, 4, 5, 6, 8, 10, 12];
  return widths
    .filter((width) => values.length >= width * 3)
    .map((width) => {
      const rows = [];
      for (let index = 0; index + width <= values.length && rows.length < 24; index += width) {
        rows.push(values.slice(index, index + width));
      }
      return {
        width,
        rows: Math.floor(values.length / width),
        score: scoreRows(rows),
        sampleRows: rows.slice(0, 12),
      };
    })
    .sort((a, b) => b.score - a.score || a.width - b.width)
    .slice(0, 4);
}

function scoreRows(rows) {
  if (rows.length < 2) return 0;
  const width = rows[0].length;
  let score = 0;

  for (let col = 0; col < width; col += 1) {
    const column = rows.map((row) => row[col]);
    const monotonic = column.slice(1).filter((value, index) => value >= column[index]).length;
    const repeated = column.slice(1).filter((value, index) => value === column[index]).length;
    const quarterSteps = column.filter((value) => Math.abs(value * 4 - Math.round(value * 4)) < 0.0001).length;
    score += monotonic + repeated + quarterSteps * 0.25;
  }

  return round(score);
}

function findIdHits(buffer, tableIds) {
  const hits = [];
  for (const tableId of tableIds) {
    const floatBits = Buffer.alloc(4);
    floatBits.writeFloatLE(tableId, 0);
    const floatHex = floatBits.toString("hex");
    const u32Offsets = [];
    const floatOffsets = [];

    for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
      if (buffer.readUInt32LE(offset) === tableId) u32Offsets.push(offset);
      if (buffer.subarray(offset, offset + 4).toString("hex") === floatHex) floatOffsets.push(offset);
    }

    hits.push({
      tableId,
      u32Offsets,
      floatOffsets,
    });
  }
  return hits;
}

function extractAsciiStrings(buffer, options = {}) {
  const minLength = options.minLength ?? 4;
  const maxStrings = options.maxStrings ?? 80;
  const strings = [];
  let start = null;

  for (let i = 0; i <= buffer.length; i += 1) {
    const byte = i < buffer.length ? buffer[i] : 0;
    const printable = byte >= 32 && byte <= 126;
    if (printable && start === null) {
      start = i;
    } else if (!printable && start !== null) {
      const length = i - start;
      if (length >= minLength) {
        strings.push({
          offset: start,
          value: buffer.subarray(start, i).toString("ascii"),
        });
        if (strings.length >= maxStrings) break;
      }
      start = null;
    }
  }

  return strings;
}

function round(value) {
  return Number(value.toFixed(6));
}

module.exports = {
  inspectTableCandidate,
  inspectTableCandidatesFromFile,
};
