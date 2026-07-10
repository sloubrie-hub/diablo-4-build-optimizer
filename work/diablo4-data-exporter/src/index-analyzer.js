const fs = require("fs");
const path = require("path");

function hex(buffer) {
  return buffer.toString("hex");
}

function readUInt40BE(buffer, offset) {
  return (
    buffer[offset] * 0x100000000 +
    buffer.readUInt32BE(offset + 1)
  );
}

function readUInt40LE(buffer, offset) {
  return (
    buffer.readUInt32LE(offset) +
    buffer[offset + 4] * 0x100000000
  );
}

function shannonEntropy(buffer) {
  if (!buffer.length) return 0;
  const counts = new Array(256).fill(0);
  for (const byte of buffer) counts[byte] += 1;
  let entropy = 0;
  for (const count of counts) {
    if (!count) continue;
    const p = count / buffer.length;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(4));
}

function countZeroBytes(buffer) {
  let count = 0;
  for (const byte of buffer) {
    if (byte === 0) count += 1;
  }
  return count;
}

function parseIdxRecords(buffer, options = {}) {
  const recordSize = 18;
  const maxRecords = options.maxRecords ?? 10000;
  const startOffset = options.startOffset ?? 0;
  const records = [];

  for (let offset = startOffset; offset + recordSize <= buffer.length; offset += recordSize) {
    const record = buffer.subarray(offset, offset + recordSize);
    if (record.every((byte) => byte === 0)) continue;

    const key = hex(record.subarray(0, 9));
    records.push({
      offset,
      key,
      archiveByte: record[9],
      be: {
        dataOffset: readUInt32Safe(record, 10, "BE"),
        size: readUInt32Safe(record, 14, "BE"),
      },
      le: {
        dataOffset: readUInt32Safe(record, 10, "LE"),
        size: readUInt32Safe(record, 14, "LE"),
      },
      raw: hex(record),
    });

    if (records.length >= maxRecords) break;
  }

  return records;
}

function scoreIdxRecords(records) {
  if (!records.length) return 0;
  let plausible = 0;

  for (const record of records) {
    const sizes = [record.be.size, record.le.size];
    const offsets = [record.be.dataOffset, record.le.dataOffset];
    const sizeLooksUseful = sizes.some((value) => value > 0 && value < 256 * 1024 * 1024);
    const offsetLooksUseful = offsets.some((value) => value >= 0 && value < 1024 * 1024 * 1024);
    const keyNotTiny = !record.key.startsWith("000000000000000000");
    if (sizeLooksUseful && offsetLooksUseful && keyNotTiny) plausible += 1;
  }

  return Number((plausible / records.length).toFixed(4));
}

function analyzeIdxCandidates(buffer, maxRecords) {
  const starts = [0, 4, 8, 12, 16, 24, 32, 64, 128, 256, 512, 1024, 2048, 4096];
  return starts
    .filter((startOffset) => startOffset < buffer.length)
    .map((startOffset) => {
      const records = parseIdxRecords(buffer, { startOffset, maxRecords });
      return {
        startOffset,
        recordSize: 18,
        parsedRecords: records.length,
        plausibilityScore: scoreIdxRecords(records),
        sampleRecords: records.slice(0, 10),
      };
    })
    .sort((a, b) => b.plausibilityScore - a.plausibilityScore);
}

function readUInt32Safe(buffer, offset, endian) {
  if (offset + 4 > buffer.length) return null;
  return endian === "BE" ? buffer.readUInt32BE(offset) : buffer.readUInt32LE(offset);
}

function parseArchiveIndexRecords(buffer, options = {}) {
  const maxRecords = options.maxRecords ?? 2000;
  const candidates = [];

  for (const headerSize of [0, 16, 24, 32, 4096]) {
    for (const recordSize of [18, 24, 28, 30, 32]) {
      const records = [];
      for (
        let offset = headerSize;
        offset + recordSize <= buffer.length && records.length < maxRecords;
        offset += recordSize
      ) {
        const record = buffer.subarray(offset, offset + recordSize);
        if (record.every((byte) => byte === 0)) continue;
        records.push({
          offset,
          raw: hex(record),
          key9: hex(record.subarray(0, Math.min(9, record.length))),
          key16: hex(record.subarray(0, Math.min(16, record.length))),
          u32beTail: readUInt32Safe(record, Math.max(0, record.length - 4), "BE"),
          u32leTail: readUInt32Safe(record, Math.max(0, record.length - 4), "LE"),
        });
      }

      candidates.push({
        headerSize,
        recordSize,
        parsedRecords: records.length,
        sample: records.slice(0, 10),
      });
    }
  }

  return candidates.sort((a, b) => b.parsedRecords - a.parsedRecords);
}

function analyzeIndexFile(filePath, options = {}) {
  const maxBytes = options.maxBytes ?? 16 * 1024 * 1024;
  const stat = fs.statSync(filePath);
  const readSize = Math.min(stat.size, maxBytes);
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(readSize);
  fs.readSync(fd, buffer, 0, readSize, 0);
  fs.closeSync(fd);

  const extension = path.extname(filePath).toLowerCase();
  const firstBytes = buffer.subarray(0, Math.min(128, buffer.length));
  const lastBytes = buffer.subarray(Math.max(0, buffer.length - 128));
  const common = {
    path: filePath,
    name: path.basename(filePath),
    extension,
    fileSize: stat.size,
    bytesAnalyzed: readSize,
    entropy: shannonEntropy(buffer),
    zeroBytes: countZeroBytes(buffer),
    zeroRatio: Number((countZeroBytes(buffer) / buffer.length).toFixed(6)),
    firstBytes: hex(firstBytes),
    lastBytes: hex(lastBytes),
  };

  if (extension === ".idx") {
    const candidates = analyzeIdxCandidates(buffer, options.maxRecords ?? 2000);
    return {
      ...common,
      formatHypothesis: "local-casc-data-index-candidates",
      candidates: candidates.slice(0, 10),
      notes: [
        "This parser is intentionally conservative.",
        "Local .idx files appear to contain headers before fixed-width records.",
        "Record fields are exposed in big-endian and little-endian forms until validated against data blocks.",
      ],
    };
  }

  if (extension === ".index") {
    return {
      ...common,
      formatHypothesis: "cdn-archive-index-candidates",
      candidates: parseArchiveIndexRecords(buffer, options).slice(0, 10),
      notes: [
        "CDN .index layouts vary by product/build.",
        "The tool reports candidate record layouts before attempting extraction.",
      ],
    };
  }

  return {
    ...common,
    formatHypothesis: "unknown-index-like-file",
  };
}

module.exports = {
  analyzeIndexFile,
  analyzeIdxCandidates,
  parseArchiveIndexRecords,
  parseIdxRecords,
};
