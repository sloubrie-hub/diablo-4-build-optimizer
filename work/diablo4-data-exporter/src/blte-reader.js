const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function findMagic(buffer, magic) {
  return buffer.indexOf(Buffer.from(magic, "ascii"));
}

function readFileSlice(filePath, offset, length) {
  const stat = fs.statSync(filePath);
  if (offset < 0 || offset >= stat.size) return Buffer.alloc(0);
  const safeLength = Math.min(length, stat.size - offset);
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(safeLength);
  fs.readSync(fd, buffer, 0, safeLength, offset);
  fs.closeSync(fd);
  return buffer;
}

function parseBlteHeader(buffer, absoluteOffset = 0) {
  if (buffer.length < 8 || buffer.subarray(0, 4).toString("ascii") !== "BLTE") {
    throw new Error("Not a BLTE payload");
  }

  const headerSize = buffer.readUInt32BE(4);
  const result = {
    absoluteOffset,
    headerSize,
    chunks: [],
  };

  if (headerSize === 0) {
    result.dataOffset = 8;
    result.chunks.push({
      compressedSize: buffer.length - 8,
      decompressedSize: null,
      checksum: null,
      dataOffset: 8,
    });
    return result;
  }

  if (buffer.length < headerSize) {
    throw new Error(`BLTE header incomplete: need ${headerSize} bytes, have ${buffer.length}`);
  }

  result.flags = buffer[8];
  result.chunkCount = buffer.readUIntBE(9, 3);

  let cursor = 12;
  for (let i = 0; i < result.chunkCount; i += 1) {
    const compressedSize = buffer.readUInt32BE(cursor);
    const decompressedSize = buffer.readUInt32BE(cursor + 4);
    const checksum = buffer.subarray(cursor + 8, cursor + 24).toString("hex");
    result.chunks.push({
      compressedSize,
      decompressedSize,
      checksum,
      dataOffset: headerSize + result.chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0),
    });
    cursor += 24;
  }

  result.dataOffset = headerSize;
  return result;
}

function decodeBlteChunk(chunkBuffer) {
  if (!chunkBuffer.length) {
    return { mode: "empty", decoded: Buffer.alloc(0), note: "empty chunk" };
  }

  const mode = String.fromCharCode(chunkBuffer[0]);
  const payload = chunkBuffer.subarray(1);

  if (mode === "N") {
    return { mode, decoded: payload };
  }

  if (mode === "Z") {
    return { mode, decoded: zlib.inflateSync(payload) };
  }

  if (mode === "E") {
    return {
      mode,
      decoded: Buffer.alloc(0),
      note: "encrypted chunk; skipped",
    };
  }

  return {
    mode,
    decoded: Buffer.alloc(0),
    note: `unsupported BLTE chunk mode: ${mode}`,
  };
}

function decodeBlteAt(filePath, offset, options = {}) {
  const maxReadBytes = options.maxReadBytes ?? 64 * 1024 * 1024;
  const initial = readFileSlice(filePath, offset, Math.min(maxReadBytes, 1024 * 1024));
  const header = parseBlteHeader(initial, offset);
  const totalNeeded =
    header.headerSize +
    header.chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0);
  const full = totalNeeded <= initial.length ? initial : readFileSlice(filePath, offset, Math.min(maxReadBytes, totalNeeded));

  const decodedChunks = [];
  for (const chunk of header.chunks) {
    const chunkBuffer = full.subarray(chunk.dataOffset, chunk.dataOffset + chunk.compressedSize);
    const decoded = decodeBlteChunk(chunkBuffer);
    decodedChunks.push({
      ...chunk,
      mode: decoded.mode,
      decodedSize: decoded.decoded.length,
      note: decoded.note,
      decoded: decoded.decoded,
    });
  }

  return {
    filePath,
    fileName: path.basename(filePath),
    offset,
    totalCompressedBytes: totalNeeded,
    header,
    chunks: decodedChunks,
    decoded: Buffer.concat(decodedChunks.map((chunk) => chunk.decoded)),
  };
}

function scanForMagic(filePath, options = {}) {
  const magic = options.magic ?? "BLTE";
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  const maxHits = options.maxHits ?? 50;
  const stat = fs.statSync(filePath);
  const buffer = readFileSlice(filePath, 0, Math.min(stat.size, maxBytes));
  const hits = [];
  let cursor = 0;
  while (hits.length < maxHits) {
    const relative = findMagic(buffer.subarray(cursor), magic);
    if (relative === -1) break;
    const offset = cursor + relative;
    hits.push(offset);
    cursor = offset + magic.length;
  }
  return {
    filePath,
    fileSize: stat.size,
    magic,
    bytesScanned: buffer.length,
    hits,
  };
}

function asciiRatio(buffer) {
  if (!buffer.length) return 0;
  const printable = Array.from(buffer).filter(
    (byte) => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)
  ).length;
  return Number((printable / buffer.length).toFixed(4));
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

function localHeaderBeforeBlte(filePath, blteOffset) {
  const localHeaderSize = 30;
  if (blteOffset < localHeaderSize) {
    return null;
  }

  const headerOffset = blteOffset - localHeaderSize;
  const header = readFileSlice(filePath, headerOffset, localHeaderSize);
  return {
    offset: headerOffset,
    size: localHeaderSize,
    rawHex: header.toString("hex"),
    key16Hex: header.subarray(0, 16).toString("hex"),
    spanBytesLE: header.readUInt32LE(16),
    unknownU16LE: header.readUInt16LE(20),
    tail8Hex: header.subarray(22, 30).toString("hex"),
    allZero: header.every((byte) => byte === 0),
  };
}

function classifyDecodedPayload(buffer) {
  const first4 = buffer.subarray(0, 4).toString("ascii");
  const first4Hex = buffer.subarray(0, 4).toString("hex");

  if (first4.startsWith("KB2")) return "bink-video";
  if (first4 === "DDS ") return "dds-texture";
  if (first4 === "TVFS") return "TVFS";
  if (first4 === "SNO_") return "SNO";
  if (first4 === "MODC") return "MODC";
  if (first4Hex === "efbeadde") return "deadbeef-binary";
  if (first4Hex === "deadbeef") return "beefdead-binary";
  if (buffer.length >= 2) {
    const first2 = buffer.subarray(0, 2).toString("hex");
    if (first2 === "1f8b") return "gzip";
    if (first2 === "7801" || first2 === "789c" || first2 === "78da") return "zlib";
  }
  if (asciiRatio(buffer.subarray(0, Math.min(buffer.length, 4096))) > 0.85) return "mostly-text";
  return "unknown-binary";
}

function decodedMarkers(buffer) {
  const markers = [
    "SNO",
    "Skill",
    "Power",
    "Paragon",
    "Item",
    "Actor",
    "Texture",
    "Locale",
    "String",
    "TVFS",
    "MOD",
  ];
  return markers.filter((marker) => buffer.indexOf(Buffer.from(marker, "ascii")) !== -1);
}

function catalogBlteFile(filePath, options = {}) {
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  const maxHits = options.maxHits ?? 200;
  const decode = options.decode ?? true;
  const scan = scanForMagic(filePath, { magic: "BLTE", maxBytes, maxHits });

  const entries = [];
  for (const offset of scan.hits) {
    const entry = {
      offset,
      localHeader: localHeaderBeforeBlte(filePath, offset),
    };

    try {
      const initial = readFileSlice(filePath, offset, 1024 * 1024);
      const header = parseBlteHeader(initial, offset);
      const totalCompressedBytes =
        header.headerSize +
        header.chunks.reduce((sum, chunk) => sum + chunk.compressedSize, 0);
      entry.blte = {
        headerSize: header.headerSize,
        flags: header.flags,
        chunkCount: header.chunkCount ?? header.chunks.length,
        totalCompressedBytes,
        endOffset: offset + totalCompressedBytes,
        modes: [],
        chunks: header.chunks.map((chunk) => ({
          compressedSize: chunk.compressedSize,
          decompressedSize: chunk.decompressedSize,
          checksum: chunk.checksum,
          dataOffset: chunk.dataOffset,
        })),
      };
      if (entry.localHeader) {
        entry.localHeader.spanMatchesBlte =
          entry.localHeader.spanBytesLE === totalCompressedBytes + entry.localHeader.size;
      }

      if (decode) {
        const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 128 * 1024 * 1024;
        if (totalCompressedBytes > maxDecodeCompressedBytes) {
          entry.decoded = {
            skipped: true,
            reason: `compressed payload exceeds maxDecodeCompressedBytes (${maxDecodeCompressedBytes})`,
          };
        } else {
          const decoded = decodeBlteAt(filePath, offset, {
            maxReadBytes: Math.min(options.maxReadBytes ?? 64 * 1024 * 1024, totalCompressedBytes),
          });
          entry.blte.modes = decoded.chunks.map((chunk) => chunk.mode);
          entry.decoded = {
            size: decoded.decoded.length,
            type: classifyDecodedPayload(decoded.decoded),
            asciiRatio: asciiRatio(decoded.decoded.subarray(0, Math.min(decoded.decoded.length, 4096))),
            entropy: shannonEntropy(decoded.decoded.subarray(0, Math.min(decoded.decoded.length, 4096))),
            first32Hex: decoded.decoded.subarray(0, Math.min(decoded.decoded.length, 32)).toString("hex"),
            markers: decodedMarkers(decoded.decoded),
          };
        }
      }
    } catch (error) {
      entry.error = error.message;
    }

    entries.push(entry);
  }

  const decodedTypeCounts = {};
  const modeCounts = {};
  for (const entry of entries) {
    const decodedType = entry.decoded?.type ?? (entry.error ? "error" : "not-decoded");
    decodedTypeCounts[decodedType] = (decodedTypeCounts[decodedType] ?? 0) + 1;
    for (const mode of entry.blte?.modes ?? []) {
      modeCounts[mode] = (modeCounts[mode] ?? 0) + 1;
    }
  }

  return {
    filePath,
    fileName: path.basename(filePath),
    catalogedAt: new Date().toISOString(),
    scan,
    summary: {
      entries: entries.length,
      decodedTypeCounts,
      modeCounts,
    },
    entries,
  };
}

function catalogBlteDirectory(dataDir, options = {}) {
  const fileLimit = options.fileLimit ?? 5;
  const maxHits = options.maxHits ?? 80;
  const files = fs
    .readdirSync(dataDir)
    .filter((name) => /^data\.\d{3}$/.test(name))
    .sort()
    .slice(0, fileLimit)
    .map((name) => path.join(dataDir, name));

  const filesCataloged = files.map((filePath) => {
    const catalog = catalogBlteFile(filePath, {
      maxHits,
      decode: true,
      maxBytes: options.maxBytes,
      maxDecodeCompressedBytes: options.maxDecodeCompressedBytes,
    });
    const interestingEntries = catalog.entries
      .filter((entry) => {
        if (entry.error) return true;
        if (!entry.localHeader?.spanMatchesBlte) return true;
        if ((entry.decoded?.markers ?? []).length) return true;
        return entry.decoded?.type && entry.decoded.type !== "deadbeef-binary";
      })
      .slice(0, 25)
      .map((entry) => ({
        offset: entry.offset,
        endOffset: entry.blte?.endOffset,
        headerSpanMatches: entry.localHeader?.spanMatchesBlte,
        headerKey16Hex: entry.localHeader?.key16Hex,
        headerSpanBytesLE: entry.localHeader?.spanBytesLE,
        totalCompressedBytes: entry.blte?.totalCompressedBytes,
        decodedSize: entry.decoded?.size,
        decodedType: entry.decoded?.type,
        decodedSkipped: entry.decoded?.skipped,
        decodedSkipReason: entry.decoded?.reason,
        markers: entry.decoded?.markers,
        first32Hex: entry.decoded?.first32Hex,
        error: entry.error,
      }));

    return {
      filePath: catalog.filePath,
      fileName: catalog.fileName,
      summary: {
        ...catalog.summary,
        spanMatches: catalog.entries.filter((entry) => entry.localHeader?.spanMatchesBlte).length,
        spanMismatches: catalog.entries.filter(
          (entry) => entry.localHeader && entry.localHeader.spanMatchesBlte === false
        ).length,
      },
      interestingEntries,
    };
  });

  const aggregate = {
    files: filesCataloged.length,
    entries: 0,
    decodedTypeCounts: {},
    modeCounts: {},
    spanMatches: 0,
    spanMismatches: 0,
  };

  for (const file of filesCataloged) {
    aggregate.entries += file.summary.entries;
    aggregate.spanMatches += file.summary.spanMatches;
    aggregate.spanMismatches += file.summary.spanMismatches;
    for (const [type, count] of Object.entries(file.summary.decodedTypeCounts)) {
      aggregate.decodedTypeCounts[type] = (aggregate.decodedTypeCounts[type] ?? 0) + count;
    }
    for (const [mode, count] of Object.entries(file.summary.modeCounts)) {
      aggregate.modeCounts[mode] = (aggregate.modeCounts[mode] ?? 0) + count;
    }
  }

  return {
    dataDir,
    catalogedAt: new Date().toISOString(),
    options: {
      fileLimit,
      maxHits,
    },
    aggregate,
    files: filesCataloged,
  };
}

module.exports = {
  catalogBlteDirectory,
  catalogBlteFile,
  decodeBlteAt,
  parseBlteHeader,
  scanForMagic,
};
