const fs = require("fs");
const path = require("path");
const { analyzeIdxCandidates } = require("./index-analyzer");

function hex(buffer) {
  return buffer.toString("hex");
}

function asciiPreview(buffer) {
  return Array.from(buffer)
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
    .join("");
}

function entropy(buffer) {
  if (!buffer.length) return 0;
  const counts = new Array(256).fill(0);
  for (const byte of buffer) counts[byte] += 1;
  let value = 0;
  for (const count of counts) {
    if (!count) continue;
    const p = count / buffer.length;
    value -= p * Math.log2(p);
  }
  return Number(value.toFixed(4));
}

function classifyMagic(buffer) {
  if (buffer.length >= 4) {
    const four = buffer.subarray(0, 4).toString("ascii");
    if (four === "BLTE") return "BLTE";
    if (four === "TVFS") return "TVFS";
    if (four === "MD21") return "MD21";
    if (four === "OggS") return "Ogg";
    if (four === "\x89PNG") return "PNG";
  }

  if (buffer.length >= 2) {
    const two = buffer.subarray(0, 2).toString("hex");
    if (two === "1f8b") return "gzip";
    if (two === "7801" || two === "789c" || two === "78da") return "zlib";
    if (two === "ffd8") return "jpeg";
  }

  const printable = Array.from(buffer).filter((byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)).length;
  if (buffer.length && printable / buffer.length > 0.85) return "mostly-text";

  return "unknown-binary";
}

function readSlice(filePath, offset, length) {
  const stat = fs.statSync(filePath);
  if (offset < 0 || offset >= stat.size) return null;
  const safeLength = Math.min(length, stat.size - offset);
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(safeLength);
  fs.readSync(fd, buffer, 0, safeLength, offset);
  fs.closeSync(fd);
  return buffer;
}

function getDataFileIndexFromIdxName(idxFile) {
  const base = path.basename(idxFile, path.extname(idxFile));
  const firstByte = base.slice(0, 2);
  const parsed = Number.parseInt(firstByte, 16);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decodeMappings(record, idxFile) {
  const idxNameArchive = getDataFileIndexFromIdxName(idxFile);
  const offset40le = record.archiveByte * 0x100000000 + record.le.dataOffset;
  const offset40be = record.archiveByte * 0x100000000 + record.be.dataOffset;

  return [
    {
      name: "archiveByte-data-file_offsetLE32_sizeBE32",
      archiveIndex: record.archiveByte,
      dataOffset: record.le.dataOffset,
      payloadSize: record.be.size,
    },
    {
      name: "idx-name-data-file_offset40LE_sizeBE32",
      archiveIndex: idxNameArchive,
      dataOffset: offset40le,
      payloadSize: record.be.size,
    },
    {
      name: "idx-name-data-file_offsetLE32_sizeBE32",
      archiveIndex: idxNameArchive,
      dataOffset: record.le.dataOffset,
      payloadSize: record.be.size,
    },
    {
      name: "archiveByte-data-file_offsetBE32_sizeBE32",
      archiveIndex: record.archiveByte,
      dataOffset: record.be.dataOffset,
      payloadSize: record.be.size,
    },
    {
      name: "idx-name-data-file_offset40BE_sizeBE32",
      archiveIndex: idxNameArchive,
      dataOffset: offset40be,
      payloadSize: record.be.size,
    },
  ];
}

function probeMapping(dataDir, record, mapping, readBytes) {
  const archiveIndex = mapping.archiveIndex;
  const dataOffset = mapping.dataOffset;
  const payloadSize = mapping.payloadSize;
  const dataFile = path.join(dataDir, `data.${String(archiveIndex).padStart(3, "0")}`);

  const result = {
    indexOffset: record.offset,
    keyPrefix: record.key,
    rawRecord: record.raw,
    mappingHypothesis: mapping.name,
    archiveIndex,
    dataFile,
    dataOffset,
    payloadSize,
    exists: fs.existsSync(dataFile),
    validRange: false,
  };

  if (!result.exists) return result;

  const stat = fs.statSync(dataFile);
  result.dataFileSize = stat.size;
  result.validRange = dataOffset >= 0 && payloadSize > 0 && dataOffset + Math.min(payloadSize, readBytes) <= stat.size;
  if (!result.validRange) return result;

  const sample = readSlice(dataFile, dataOffset, Math.min(payloadSize, readBytes));
  result.sample = {
    bytesRead: sample.length,
    magic: classifyMagic(sample),
    entropy: entropy(sample),
    first32Hex: hex(sample.subarray(0, Math.min(32, sample.length))),
    asciiPreview: asciiPreview(sample.subarray(0, Math.min(96, sample.length))),
  };

  return result;
}

function probeRecord(dataDir, idxFile, record, readBytes) {
  const probes = decodeMappings(record, idxFile).map((mapping) =>
    probeMapping(dataDir, record, mapping, readBytes)
  );

  probes.sort((a, b) => scoreProbe(b) - scoreProbe(a));
  return {
    indexOffset: record.offset,
    keyPrefix: record.key,
    rawRecord: record.raw,
    probes,
    bestProbe: probes[0],
  };
}

function scoreProbe(probe) {
  if (!probe.exists || !probe.validRange || !probe.sample) return 0;
  let score = 1;
  if (probe.sample.magic !== "unknown-binary") score += 5;
  if (probe.sample.entropy < 7.5) score += 1;
  if (probe.payloadSize > 0 && probe.payloadSize < 64 * 1024 * 1024) score += 1;
  return score;
}

function probeIdxPayloads(idxFile, dataDir, options = {}) {
  const maxRecords = options.maxRecords ?? 200;
  const readBytes = options.readBytes ?? 256;
  const idxBuffer = fs.readFileSync(idxFile);
  const candidates = analyzeIdxCandidates(idxBuffer, maxRecords).slice(0, options.maxCandidates ?? 5);

  return {
    idxFile,
    dataDir,
    probedAt: new Date().toISOString(),
    readBytes,
    candidates: candidates.map((candidate) => {
      const probedRecords = candidate.sampleRecords.map((record) =>
        probeRecord(dataDir, idxFile, record, readBytes)
      );
      const hitsByMagic = probedRecords.reduce((acc, record) => {
        const best = record.bestProbe;
        const magic = best?.sample?.magic ?? (best?.exists ? "no-sample" : "missing-data-file");
        acc[magic] = (acc[magic] ?? 0) + 1;
        return acc;
      }, {});
      const hitsByMapping = probedRecords.reduce((acc, record) => {
        const mapping = record.bestProbe?.mappingHypothesis ?? "none";
        acc[mapping] = (acc[mapping] ?? 0) + 1;
        return acc;
      }, {});

      return {
        startOffset: candidate.startOffset,
        recordSize: candidate.recordSize,
        plausibilityScore: candidate.plausibilityScore,
        recordsProbed: probedRecords.length,
        hitsByMagic,
        hitsByMapping,
        probedRecords,
      };
    }),
    notes: [
      "This command validates index-to-data mapping hypotheses by reading tiny samples only.",
      "The probe tests several index-to-data mapping hypotheses and reports the best-scoring one per record.",
      "Unknown high-entropy payloads may still be valid CASC payloads that need BLTE/encoding handling.",
    ],
  };
}

module.exports = {
  probeIdxPayloads,
};
