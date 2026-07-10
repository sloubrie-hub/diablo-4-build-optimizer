const fs = require("fs");
const path = require("path");
const { catalogBlteFile } = require("./blte-reader");
const { decodeBlteAt } = require("./blte-reader");

function readU32Words(buffer, count = 32) {
  const words = [];
  const limit = Math.min(buffer.length, count * 4);
  for (let offset = 0; offset + 4 <= limit; offset += 4) {
    words.push({
      offset,
      hex: buffer.subarray(offset, offset + 4).toString("hex"),
      le: buffer.readUInt32LE(offset),
      be: buffer.readUInt32BE(offset),
    });
  }
  return words;
}

function extractAsciiStrings(buffer, options = {}) {
  const minLength = options.minLength ?? 4;
  const maxStrings = options.maxStrings ?? 50;
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

function searchAsciiStrings(buffer, terms, options = {}) {
  const strings = extractAsciiStrings(buffer, {
    minLength: options.minLength ?? 4,
    maxStrings: options.maxStrings ?? 2000,
  });
  const loweredTerms = terms.map((term) => term.toLowerCase());
  return strings.filter((item) => {
    const lowered = item.value.toLowerCase();
    return loweredTerms.some((term) => lowered.includes(term));
  });
}

function countNonZeroBytes(buffer) {
  let count = 0;
  for (const byte of buffer) {
    if (byte !== 0) count += 1;
  }
  return count;
}

function analyzeDeadbeefBuffer(buffer) {
  const words = readU32Words(buffer, 48);
  const nonZeroWords = words.filter((word) => word.le !== 0);
  const likelyAssetId = words[4]?.le ?? null;
  const word20Hex = words[5]?.hex ?? null;
  const word24 = words[6]?.le ?? null;
  const word32 = words[8]?.le ?? null;
  const word36 = words[9]?.le ?? null;
  const word40 = words[10]?.le ?? null;
  const layoutSignature = [
    `w20:${word20Hex}`,
    `w24:${word24}`,
    `w32:${word32}`,
    `w36:${word36}`,
    `w40:${word40}`,
  ].join("|");
  const headerBytes = buffer.subarray(0, Math.min(buffer.length, 192));

  return {
    size: buffer.length,
    magicHex: buffer.subarray(0, 4).toString("hex"),
    likelyAssetId,
    word20Hex,
    word24,
    word32,
    word36,
    word40,
    layoutSignature,
    firstNonZeroWords: nonZeroWords.slice(0, 20),
    words: words.slice(0, 24),
    headerNonZeroBytes: countNonZeroBytes(headerBytes),
    asciiStrings: extractAsciiStrings(buffer, { minLength: 6, maxStrings: 25 }),
  };
}

function summarizeDeadbeefEntry(filePath, entry) {
  const decoded = decodeBlteAt(filePath, entry.offset, {
    maxReadBytes: entry.blte.totalCompressedBytes,
  }).decoded;
  const analysis = analyzeDeadbeefBuffer(decoded);

  return {
    fileName: path.basename(filePath),
    filePath,
    offset: entry.offset,
    localHeader: {
      key16Hex: entry.localHeader?.key16Hex,
      spanBytesLE: entry.localHeader?.spanBytesLE,
      unknownU16LE: entry.localHeader?.unknownU16LE,
      tail8Hex: entry.localHeader?.tail8Hex,
    },
    compressedBytes: entry.blte.totalCompressedBytes,
    decodedBytes: decoded.length,
    assetId: analysis.likelyAssetId,
    word20Hex: analysis.word20Hex,
    word24: analysis.word24,
    word32: analysis.word32,
    word36: analysis.word36,
    word40: analysis.word40,
    layoutSignature: analysis.layoutSignature,
    firstNonZeroWords: analysis.firstNonZeroWords,
    asciiStrings: analysis.asciiStrings,
  };
}

function analyzeDeadbeefFile(filePath, options = {}) {
  const maxHits = options.maxHits ?? 200;
  const maxEntries = options.maxEntries ?? 200;
  const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 16 * 1024 * 1024;
  const catalog = catalogBlteFile(filePath, {
    maxHits,
    maxDecodeCompressedBytes,
    decode: true,
  });
  const entries = [];

  for (const entry of catalog.entries) {
    if (entries.length >= maxEntries) break;
    if (entry.decoded?.type !== "deadbeef-binary") continue;
    if (entry.blte.totalCompressedBytes > maxDecodeCompressedBytes) continue;
    entries.push(summarizeDeadbeefEntry(filePath, entry));
  }

  return summarizeEntries({
    analyzedAt: new Date().toISOString(),
    filePath,
    fileName: path.basename(filePath),
    entries,
  });
}

function analyzeDeadbeefDirectory(dataDir, options = {}) {
  const fileLimit = options.fileLimit ?? 20;
  const maxHits = options.maxHits ?? 100;
  const maxEntriesPerFile = options.maxEntriesPerFile ?? 100;
  const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 16 * 1024 * 1024;
  const files = fs
    .readdirSync(dataDir)
    .filter((name) => /^data\.\d{3}$/.test(name))
    .sort()
    .slice(0, fileLimit)
    .map((name) => path.join(dataDir, name));

  const fileReports = files.map((filePath) =>
    analyzeDeadbeefFile(filePath, {
      maxHits,
      maxEntries: maxEntriesPerFile,
      maxDecodeCompressedBytes,
    })
  );

  const entries = fileReports.flatMap((report) => report.entries);
  const summary = summarizeEntries({
    analyzedAt: new Date().toISOString(),
    dataDir,
    entries,
  });

  return {
    ...summary,
    options: {
      fileLimit,
      maxHits,
      maxEntriesPerFile,
      maxDecodeCompressedBytes,
    },
    files: fileReports.map((report) => ({
      fileName: report.fileName,
      filePath: report.filePath,
      summary: report.summary,
      entries: report.entries.slice(0, 25),
    })),
  };
}

function searchDeadbeefStringsDirectory(dataDir, options = {}) {
  const fileLimit = options.fileLimit ?? 64;
  const maxHits = options.maxHits ?? 250;
  const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 8 * 1024 * 1024;
  const terms = options.terms ?? [
    "Table(",
    "PowerTag",
    "Damage",
    "Skill",
    "Affix",
    "Paragon",
    "Legendary",
    "Unique",
    "Barbarian",
    "Sorcerer",
    "Rogue",
    "Druid",
    "Necromancer",
    "Paladin",
    "Spirit",
    "Rune",
    "Glyph",
  ];

  const files = fs
    .readdirSync(dataDir)
    .filter((name) => /^data\.\d{3}$/.test(name))
    .sort()
    .slice(0, fileLimit)
    .map((name) => path.join(dataDir, name));

  const matches = [];
  let decodedDeadbeefEntries = 0;

  for (const filePath of files) {
    const catalog = catalogBlteFile(filePath, {
      maxHits,
      maxDecodeCompressedBytes,
      decode: true,
    });

    for (const entry of catalog.entries) {
      if (entry.decoded?.type !== "deadbeef-binary") continue;
      if (entry.blte.totalCompressedBytes > maxDecodeCompressedBytes) continue;
      decodedDeadbeefEntries += 1;
      const decoded = decodeBlteAt(filePath, entry.offset, {
        maxReadBytes: entry.blte.totalCompressedBytes,
      }).decoded;
      const matchedStrings = searchAsciiStrings(decoded, terms, {
        minLength: 4,
        maxStrings: 4000,
      });

      if (!matchedStrings.length) continue;
      matches.push({
        fileName: path.basename(filePath),
        filePath,
        offset: entry.offset,
        assetId: decoded.readUInt32LE(16),
        layoutSignature: analyzeDeadbeefBuffer(decoded).layoutSignature,
        decodedBytes: decoded.length,
        compressedBytes: entry.blte.totalCompressedBytes,
        localHeaderKey16Hex: entry.localHeader?.key16Hex,
        matchedStrings: matchedStrings.slice(0, options.maxStringsPerEntry ?? 100),
      });
    }
  }

  const termCounts = {};
  for (const match of matches) {
    for (const item of match.matchedStrings) {
      for (const term of terms) {
        if (item.value.toLowerCase().includes(term.toLowerCase())) {
          termCounts[term] = (termCounts[term] ?? 0) + 1;
        }
      }
    }
  }

  return {
    searchedAt: new Date().toISOString(),
    dataDir,
    options: {
      fileLimit,
      maxHits,
      maxDecodeCompressedBytes,
      terms,
    },
    summary: {
      files: files.length,
      decodedDeadbeefEntries,
      matchingEntries: matches.length,
      termCounts: sortCounts(termCounts),
    },
    matches,
  };
}

function exportFormulaDirectory(dataDir, options = {}) {
  const fileLimit = options.fileLimit ?? 80;
  const maxHits = options.maxHits ?? 300;
  const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 8 * 1024 * 1024;
  const files = fs
    .readdirSync(dataDir)
    .filter((name) => /^data\.\d{3}$/.test(name))
    .sort()
    .slice(0, fileLimit)
    .map((name) => path.join(dataDir, name));

  const records = [];
  let decodedDeadbeefEntries = 0;

  for (const filePath of files) {
    const catalog = catalogBlteFile(filePath, {
      maxHits,
      maxDecodeCompressedBytes,
      decode: true,
    });

    for (const entry of catalog.entries) {
      if (entry.decoded?.type !== "deadbeef-binary") continue;
      if (entry.blte.totalCompressedBytes > maxDecodeCompressedBytes) continue;
      decodedDeadbeefEntries += 1;

      const decoded = decodeBlteAt(filePath, entry.offset, {
        maxReadBytes: entry.blte.totalCompressedBytes,
      }).decoded;
      const analysis = analyzeDeadbeefBuffer(decoded);
      const strings = extractAsciiStrings(decoded, {
        minLength: 3,
        maxStrings: 8000,
      });
      const formulaStrings = strings
        .map((item) => ({
          offset: item.offset,
          value: item.value,
          kind: classifyFormulaString(item.value),
          references: extractFormulaReferences(item.value),
        }))
        .filter((item) => item.kind !== "ignore");

      if (!formulaStrings.length) continue;

      records.push({
        assetId: analysis.likelyAssetId,
        source: {
          fileName: path.basename(filePath),
          filePath,
          blteOffset: entry.offset,
          localHeaderKey16Hex: entry.localHeader?.key16Hex,
        },
        sizes: {
          compressedBytes: entry.blte.totalCompressedBytes,
          decodedBytes: decoded.length,
        },
        layout: {
          signature: analysis.layoutSignature,
          word20Hex: analysis.word20Hex,
          word24: analysis.word24,
          word32: analysis.word32,
          word36: analysis.word36,
          word40: analysis.word40,
        },
        tags: collectFormulaTags(formulaStrings),
        formulas: formulaStrings,
      });
    }
  }

  const kindCounts = {};
  const tagCounts = {};
  for (const record of records) {
    for (const formula of record.formulas) {
      kindCounts[formula.kind] = (kindCounts[formula.kind] ?? 0) + 1;
    }
    for (const tag of record.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    dataDir,
    options: {
      fileLimit,
      maxHits,
      maxDecodeCompressedBytes,
    },
    summary: {
      files: files.length,
      decodedDeadbeefEntries,
      formulaRecords: records.length,
      formulaStrings: records.reduce((sum, record) => sum + record.formulas.length, 0),
      kindCounts: sortCounts(kindCounts),
      tagCounts: sortCounts(tagCounts),
    },
    records,
  };
}

function buildFormulaGraphs(formulaExport) {
  const graphs = formulaExport.records.map((record) => buildFormulaGraph(record));
  const aggregate = {
    records: graphs.length,
    formulaNodes: graphs.reduce((sum, graph) => sum + graph.nodes.length, 0),
    sfRefs: uniqueSortedNumbers(graphs.flatMap((graph) => graph.required.sfRefs)),
    tables: uniqueSorted(
      graphs.flatMap((graph) => graph.required.tables.map((table) => `${table.tableId}:${table.argument}`))
    ),
    powerTags: uniqueSorted(
      graphs.flatMap((graph) => graph.required.powerTags.map((tag) => `${tag.power}.${tag.field ?? "*"}`))
    ),
    affixProperties: uniqueSorted(
      graphs.flatMap((graph) => graph.required.affixProperties.map((affix) => `${affix.affix}.${affix.field}`))
    ),
    hashRefs: uniqueSorted(graphs.flatMap((graph) => graph.required.hashRefs.map((ref) => `${ref.key}#${ref.target}`))),
  };

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      exportedAt: formulaExport.exportedAt,
      dataDir: formulaExport.dataDir,
      options: formulaExport.options,
      summary: formulaExport.summary,
    },
    summary: aggregate,
    graphs,
  };
}

function searchTableCandidatesDirectory(dataDir, options = {}) {
  const fileLimit = options.fileLimit ?? 80;
  const maxHits = options.maxHits ?? 300;
  const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 8 * 1024 * 1024;
  const tableIds = options.tableIds ?? [34, 35];
  const files = fs
    .readdirSync(dataDir)
    .filter((name) => /^data\.\d{3}$/.test(name))
    .sort()
    .slice(0, fileLimit)
    .map((name) => path.join(dataDir, name));

  const candidates = [];
  let decodedDeadbeefEntries = 0;

  for (const filePath of files) {
    const catalog = catalogBlteFile(filePath, {
      maxHits,
      maxDecodeCompressedBytes,
      decode: true,
    });

    for (const entry of catalog.entries) {
      if (entry.decoded?.type !== "deadbeef-binary") continue;
      if (entry.blte.totalCompressedBytes > maxDecodeCompressedBytes) continue;
      decodedDeadbeefEntries += 1;

      const decoded = decodeBlteAt(filePath, entry.offset, {
        maxReadBytes: entry.blte.totalCompressedBytes,
      }).decoded;
      const analysis = analyzeDeadbeefBuffer(decoded);
      const strings = extractAsciiStrings(decoded, {
        minLength: 3,
        maxStrings: 8000,
      });
      const stringHits = strings.filter((item) => isTableRelatedString(item.value, tableIds));
      const tableIdHits = countTableIdHits(decoded, tableIds);
      const tableIdHitCount = tableIdHits.reduce((sum, hit) => sum + hit.u32Count + hit.floatCount, 0);
      const numericRuns = findNumericRuns(decoded, {
        minRunLength: options.minRunLength ?? 8,
        maxRuns: options.maxRunsPerEntry ?? 8,
      });
      const strongNumericRuns = numericRuns.filter((run) => run.score >= 10);
      const score =
        stringHits.length * 100 +
        tableIdHitCount * 5 +
        Math.round(strongNumericRuns.reduce((sum, run) => sum + run.score, 0) / 2) +
        (tableIds.includes(analysis.likelyAssetId) ? 100 : 0);

      if (
        !stringHits.length &&
        !tableIds.includes(analysis.likelyAssetId) &&
        tableIdHitCount < 4 &&
        !strongNumericRuns.some((run) => run.length >= 32 && run.nonZeroRatio >= 0.85)
      ) {
        continue;
      }

      candidates.push({
        score,
        assetId: analysis.likelyAssetId,
        source: {
          fileName: path.basename(filePath),
          filePath,
          blteOffset: entry.offset,
          localHeaderKey16Hex: entry.localHeader?.key16Hex,
        },
        sizes: {
          compressedBytes: entry.blte.totalCompressedBytes,
          decodedBytes: decoded.length,
        },
        layout: {
          signature: analysis.layoutSignature,
          word20Hex: analysis.word20Hex,
          word24: analysis.word24,
          word32: analysis.word32,
          word36: analysis.word36,
          word40: analysis.word40,
        },
        tableIdHits,
        stringHits: stringHits.slice(0, options.maxStringHitsPerEntry ?? 20),
        numericRuns: strongNumericRuns,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.source.fileName.localeCompare(b.source.fileName));

  return {
    searchedAt: new Date().toISOString(),
    schemaVersion: 1,
    dataDir,
    options: {
      fileLimit,
      maxHits,
      maxDecodeCompressedBytes,
      tableIds,
    },
    summary: {
      files: files.length,
      decodedDeadbeefEntries,
      candidates: candidates.length,
      topScores: candidates.slice(0, 20).map((candidate) => ({
        score: candidate.score,
        assetId: candidate.assetId,
        fileName: candidate.source.fileName,
        blteOffset: candidate.source.blteOffset,
        stringHits: candidate.stringHits.length,
        numericRuns: candidate.numericRuns.length,
      })),
    },
    candidates,
  };
}

function buildFormulaGraph(record) {
  const nodes = record.formulas
    .filter((formula) => formula.kind === "formula")
    .map((formula, index) => ({
      id: `formula:${index}`,
      offset: formula.offset,
      expression: formula.value,
      dependsOn: {
        sfRefs: formula.references.sfRefs,
        tables: formula.references.tables,
        powerTags: formula.references.powerTags,
        affixProperties: formula.references.affixProperties,
        hashRefs: formula.references.hashRefs,
      },
    }));

  const required = mergeReferenceSets(record.formulas.map((formula) => formula.references));

  return {
    assetId: record.assetId,
    source: record.source,
    tags: record.tags,
    layout: record.layout,
    nodes,
    references: record.formulas
      .filter((formula) => formula.kind === "reference")
      .map((formula) => ({
        offset: formula.offset,
        value: formula.value,
        references: formula.references,
      })),
    required,
  };
}

function mergeReferenceSets(referenceSets) {
  return {
    tables: uniqueObjects(referenceSets.flatMap((refs) => refs.tables), (table) => `${table.tableId}:${table.argument}`),
    powerTags: uniqueObjects(
      referenceSets.flatMap((refs) => refs.powerTags),
      (tag) => `${tag.power}.${tag.field ?? "*"}`
    ),
    affixProperties: uniqueObjects(
      referenceSets.flatMap((refs) => refs.affixProperties),
      (affix) => `${affix.affix}.${affix.field}`
    ),
    hashRefs: uniqueObjects(referenceSets.flatMap((refs) => refs.hashRefs), (ref) => `${ref.key}#${ref.target}`),
    scriptFormulaRefs: uniqueSortedNumbers(referenceSets.flatMap((refs) => refs.scriptFormulaRefs)),
    sfRefs: uniqueSortedNumbers(referenceSets.flatMap((refs) => refs.sfRefs)),
  };
}

function classifyFormulaString(value) {
  const text = value.trim();
  if (!text) return "ignore";
  const lowered = text.toLowerCase();

  if (isLikelyNoise(text)) return "ignore";

  if (hasFormulaToken(text)) {
    if (/(table\(|\b(floor|min|max|if)\(|\+|\-|\*|\/|\(|\))/i.test(text)) {
      return "formula";
    }
    return "reference";
  }

  if (/(legendary|unique|paragon|glyph|rune|skill|damage|necromancer|barbarian|sorcerer|rogue|druid|spiritborn|paladin)/i.test(text)) {
    if (/^[A-Za-z0-9_#.\-"]{4,120}$/.test(text) && /[_#.]/.test(text)) return "tag-or-name";
  }

  if (lowered.startsWith("sf_")) return "formula-symbol";
  return "ignore";
}

function hasFormulaToken(text) {
  if (
    /(table\(|powertag\.|affix\.|affix_value|affix_flat_value|script formula|sf_\d+|weapon_damage|attacks_per_second)/i.test(
      text
    )
  ) {
    return true;
  }

  return extractHashReferences(text).length > 0;
}

function isLikelyNoise(text) {
  if (text.length < 4 || text.length > 240) return true;

  const alnum = (text.match(/[A-Za-z0-9]/g) ?? []).length;
  if (alnum < 3) return true;
  if (alnum / text.length < 0.35) return true;

  if (/^[^A-Za-z0-9]+$/.test(text)) return true;
  if (!/[A-Za-z]/.test(text)) return true;

  return false;
}

function extractHashReferences(value) {
  return extractMatches(
    value,
    /\b([A-Za-z][A-Za-z0-9_]{2,48})#([A-Za-z][A-Za-z0-9_]{2,80})\b/g,
    (match) => ({
      key: match[1],
      target: match[2],
    })
  );
}

function extractFormulaReferences(value) {
  return {
    tables: extractMatches(value, /Table\(\s*(\d+)\s*,\s*([^)]+?)\s*\)/g, (match) => ({
      tableId: Number(match[1]),
      argument: match[2],
    })),
    powerTags: extractMatches(value, /PowerTag\.([A-Za-z0-9_]+)(?:\."([^"]+)")?/g, (match) => ({
      power: match[1],
      field: match[2] ?? null,
    })),
    affixProperties: extractMatches(value, /Affix\.([A-Za-z0-9_]+)\."([^"]+)"/g, (match) => ({
      affix: match[1],
      field: match[2],
    })),
    hashRefs: extractHashReferences(value),
    scriptFormulaRefs: extractMatches(value, /"Script Formula ([0-9]+)"/g, (match) => Number(match[1])),
    sfRefs: Array.from(new Set(extractMatches(value, /\bSF_([0-9]+)\b/g, (match) => Number(match[1])))).sort(
      (a, b) => a - b
    ),
  };
}

function isTableRelatedString(value, tableIds) {
  const lowered = value.toLowerCase();
  if (lowered.includes("slevel") || lowered.includes("table(")) return true;
  return tableIds.some((id) => lowered.includes(`table(${id}`) || lowered.includes(`table ${id}`));
}

function countTableIdHits(buffer, tableIds) {
  return tableIds.map((tableId) => {
    let u32Count = 0;
    let floatCount = 0;
    const floatBits = Buffer.alloc(4);
    floatBits.writeFloatLE(tableId, 0);
    const floatHex = floatBits.toString("hex");

    for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
      if (buffer.readUInt32LE(offset) === tableId) u32Count += 1;
      if (buffer.subarray(offset, offset + 4).toString("hex") === floatHex) floatCount += 1;
    }

    return { tableId, u32Count, floatCount };
  });
}

function findNumericRuns(buffer, options = {}) {
  const minRunLength = options.minRunLength ?? 8;
  const maxRuns = options.maxRuns ?? 8;
  const runs = [];
  let current = [];

  for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
    const value = buffer.readFloatLE(offset);
    if (isPlausibleTableNumber(value)) {
      current.push({ offset, value });
    } else {
      flushRun();
    }
  }
  flushRun();

  return runs.sort((a, b) => b.score - a.score).slice(0, maxRuns);

  function flushRun() {
    if (current.length >= minRunLength) {
      const values = current.map((item) => item.value);
      const monotonicPairs = values.slice(1).filter((value, index) => value >= values[index]).length;
      const distinct = new Set(values.map((value) => value.toFixed(6))).size;
      const nonZeroValues = values.filter((value) => Math.abs(value) >= 0.000001);
      const nonZeroRatio = nonZeroValues.length / values.length;
      const score = Math.round((current.length + monotonicPairs + Math.min(distinct, 20)) * nonZeroRatio);
      runs.push({
        offset: current[0].offset,
        length: current.length,
        score,
        nonZeroRatio: roundFloat(nonZeroRatio),
        min: roundFloat(Math.min(...values)),
        max: roundFloat(Math.max(...values)),
        monotonicPairs,
        sample: values.slice(0, 20).map(roundFloat),
      });
    }
    current = [];
  }
}

function isPlausibleTableNumber(value) {
  if (!Number.isFinite(value)) return false;
  if (Math.abs(value) < 0.000001) return false;
  if (Math.abs(value) > 1000000) return false;
  return true;
}

function roundFloat(value) {
  return Number(value.toFixed(6));
}

function extractMatches(value, regex, mapper) {
  const matches = [];
  let match;
  while ((match = regex.exec(value)) !== null) {
    matches.push(mapper(match));
  }
  return matches;
}

function collectFormulaTags(formulas) {
  const tags = new Set();
  const tagPatterns = [
    "Barbarian",
    "Druid",
    "Necromancer",
    "Rogue",
    "Sorcerer",
    "Spiritborn",
    "Paladin",
    "Affix",
    "Legendary",
    "Unique",
    "Paragon",
    "Glyph",
    "Rune",
    "Damage",
    "PowerTag",
    "Table",
  ];

  for (const formula of formulas) {
    for (const tag of tagPatterns) {
      if (formula.value.toLowerCase().includes(tag.toLowerCase())) {
        tags.add(tag);
      }
    }
  }

  return Array.from(tags).sort();
}

function uniqueObjects(items, keyFn) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));
}

function uniqueSortedNumbers(values) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function summarizeEntries(report) {
  const subtypeCounts = {};
  const layoutCounts = {};
  const word20Counts = {};
  const word24Counts = {};
  const stringHits = [];

  for (const entry of report.entries) {
    subtypeCounts[entry.assetId] = (subtypeCounts[entry.assetId] ?? 0) + 1;
    layoutCounts[entry.layoutSignature] = (layoutCounts[entry.layoutSignature] ?? 0) + 1;
    word20Counts[entry.word20Hex] = (word20Counts[entry.word20Hex] ?? 0) + 1;
    word24Counts[entry.word24] = (word24Counts[entry.word24] ?? 0) + 1;
    for (const string of entry.asciiStrings) {
      stringHits.push({
        fileName: entry.fileName,
        offset: entry.offset,
        stringOffset: string.offset,
        value: string.value,
      });
    }
  }

  return {
    ...report,
    summary: {
      entries: report.entries.length,
      assetIdCounts: sortCounts(subtypeCounts),
      layoutCounts: sortCounts(layoutCounts),
      word20Counts: sortCounts(word20Counts),
      word24Counts: sortCounts(word24Counts),
      entriesWithAsciiStrings: report.entries.filter((entry) => entry.asciiStrings.length).length,
      stringHitSample: stringHits.slice(0, 50),
    },
  };
}

function sortCounts(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  );
}

module.exports = {
  analyzeDeadbeefBuffer,
  analyzeDeadbeefDirectory,
  analyzeDeadbeefFile,
  buildFormulaGraphs,
  exportFormulaDirectory,
  searchTableCandidatesDirectory,
  searchDeadbeefStringsDirectory,
};
