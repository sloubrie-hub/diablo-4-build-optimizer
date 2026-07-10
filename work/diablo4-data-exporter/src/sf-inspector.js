const fs = require("fs");
const { decodeBlteAt } = require("./blte-reader");

function inspectSfDefinitionsFromGraphsFile(graphsFile, options = {}) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  return inspectSfDefinitions(graphExport, options);
}

function exportSfCandidateDefinitionsFromGraphsFile(graphsFile, options = {}) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  return exportSfCandidateDefinitions(graphExport, options);
}

function analyzeSfUsageFromFiles(graphsFile, candidatesFile) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  const candidateExport = JSON.parse(fs.readFileSync(candidatesFile, "utf8"));
  return analyzeSfUsage(graphExport, candidateExport);
}

function resolveMissingSfReferencesFromFiles(usageFile, candidatesFile) {
  const usageExport = JSON.parse(fs.readFileSync(usageFile, "utf8"));
  const candidateExport = JSON.parse(fs.readFileSync(candidatesFile, "utf8"));
  return resolveMissingSfReferences(usageExport, candidateExport);
}

function inspectPriorityAssetsFromFiles(graphsFile, candidatesFile, missingFile, options = {}) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  const candidateExport = JSON.parse(fs.readFileSync(candidatesFile, "utf8"));
  const missingExport = JSON.parse(fs.readFileSync(missingFile, "utf8"));
  return inspectPriorityAssets(graphExport, candidateExport, missingExport, options);
}

function analyzeSfUsage(graphExport, candidateExport) {
  const candidatesByAsset = new Map(candidateExport.graphs.map((graph) => [String(graph.assetId), graph]));
  const graphs = [];

  for (const graph of graphExport.graphs) {
    const candidateGraph = candidatesByAsset.get(String(graph.assetId));
    const sfSymbolMap = candidateGraph?.sfSymbolMap ?? {};
    const usedIndexes = new Set();
    const usedSf = [];
    const missingLocalSymbols = [];

    for (const node of graph.nodes) {
      for (const sfIndex of node.dependsOn.sfRefs ?? []) {
        usedIndexes.add(sfIndex);
        const symbol = sfSymbolMap[String(sfIndex)] ?? null;
        const usageRoles = classifySfUsage(node.expression, sfIndex, node.dependsOn);
        const metadataProfiles = symbol?.metadataProfiles ?? {};
        const score = scoreSfUsage(usageRoles, metadataProfiles, node.dependsOn);
        const item = {
          assetId: graph.assetId,
          sfIndex,
          symbol: `SF_${sfIndex}`,
          nodeId: node.id,
          expression: node.expression,
          usageRoles,
          interestScore: score.value,
          interestLevel: score.level,
          interestReasons: score.reasons,
          metadataProfiles,
          symbolOffsets: symbol?.offsets ?? [],
          constantsAfterSamples: symbol?.constantsAfterSamples ?? [],
        };
        usedSf.push(item);
        if (!symbol) {
          missingLocalSymbols.push({
            sfIndex,
            symbol: `SF_${sfIndex}`,
            nodeId: node.id,
            expression: node.expression,
          });
        }
      }
    }

    const unusedLocalSymbols = Object.values(sfSymbolMap)
      .filter((symbol) => !usedIndexes.has(symbol.sfIndex))
      .map((symbol) => ({
        sfIndex: symbol.sfIndex,
        symbol: symbol.symbol,
        metadataProfiles: symbol.metadataProfiles,
        offsets: symbol.offsets,
      }));

    graphs.push({
      assetId: graph.assetId,
      source: graph.source,
      tags: graph.tags,
      formulas: graph.nodes.length,
      localSfSymbols: Object.keys(sfSymbolMap).length,
      usedSf,
      unusedLocalSymbols,
      missingLocalSymbols,
      summary: summarizeGraphSfUsage(usedSf, unusedLocalSymbols, missingLocalSymbols),
    });
  }

  return {
    analyzedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      candidateExportedAt: candidateExport.exportedAt,
      graphSummary: graphExport.summary,
      candidateSummary: candidateExport.summary,
    },
    summary: summarizeSfUsageGraphs(graphs),
    graphs,
  };
}

function inspectPriorityAssets(graphExport, candidateExport, missingExport, options = {}) {
  const candidateByAsset = new Map(candidateExport.graphs.map((graph) => [String(graph.assetId), graph]));
  const missingByAsset = new Map();
  for (const item of missingExport.missing ?? []) {
    const key = String(item.assetId);
    if (!missingByAsset.has(key)) missingByAsset.set(key, []);
    missingByAsset.get(key).push(item);
  }

  const requestedAssetIds = options.assetIds?.length
    ? new Set(options.assetIds.map(String))
    : new Set(missingExport.summary?.topPriority?.slice(0, 8).map((item) => String(item.assetId)) ?? []);
  const graphs = graphExport.graphs.filter((graph) => requestedAssetIds.has(String(graph.assetId)));
  const assets = graphs.map((graph) =>
    inspectPriorityAsset(graph, candidateByAsset.get(String(graph.assetId)), missingByAsset.get(String(graph.assetId)) ?? [], options)
  );

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      candidateExportedAt: candidateExport.exportedAt,
      missingResolvedAt: missingExport.resolvedAt,
    },
    summary: summarizePriorityAssetInspection(assets),
    assets,
  };
}

function inspectPriorityAsset(graph, candidateGraph, missingRefs, options = {}) {
  const decoded = decodeBlteAt(graph.source.filePath, graph.source.blteOffset).decoded;
  const targetSfIndexes = Array.from(new Set(missingRefs.map((item) => item.sfIndex))).sort((a, b) => a - b);
  const formulasWithMissingRefs = graph.nodes
    .filter((node) => targetSfIndexes.some((sfIndex) => (node.dependsOn.sfRefs ?? []).includes(sfIndex)))
    .map((node) => inspectFormulaContext(decoded, node, targetSfIndexes));
  const sfOccurrences = targetSfIndexes.map((sfIndex) => inspectSfOccurrences(decoded, sfIndex));
  const structuralWindows = buildStructuralWindows(decoded, formulasWithMissingRefs, sfOccurrences, options);

  return {
    assetId: graph.assetId,
    source: graph.source,
    tags: graph.tags,
    decodedBytes: decoded.length,
    missingRefs: dedupeBy(
      missingRefs.map((item) => ({
        sfIndex: item.sfIndex,
        symbol: item.symbol,
        expression: item.expression,
        classification: item.classification,
        usageRoles: item.usageRoles,
        interestScore: item.interestScore,
        interestLevel: item.interestLevel,
      })),
      (item) => `${item.sfIndex}:${item.expression}`
    ),
    localSfSymbolMap: candidateGraph?.sfSymbolMap ?? {},
    formulasWithMissingRefs,
    sfOccurrences,
    structuralWindows,
    summary: summarizePriorityAsset(graph, targetSfIndexes, formulasWithMissingRefs, sfOccurrences, structuralWindows),
  };
}

function inspectFormulaContext(buffer, node, targetSfIndexes) {
  const bytecodeOffset = findBytecodeOffset(buffer, node.offset, node.expression);
  const bytecode = decodeFormulaBytecode(buffer, bytecodeOffset, {
    maxTokens: 96,
    stopAtOffset: findNextAsciiFormulaBoundary(buffer, bytecodeOffset),
  });
  const matchingSfRefs = targetSfIndexes.filter((sfIndex) => (node.dependsOn.sfRefs ?? []).includes(sfIndex));
  return {
    nodeId: node.id,
    stringOffset: node.offset,
    bytecodeOffset,
    expression: node.expression,
    matchingSfRefs,
    dependsOn: node.dependsOn,
    nearbyStrings: extractStringsNear(buffer, node.offset, 768),
    wordsBeforeString: readWords(buffer, Math.max(0, node.offset - 96), node.offset),
    wordsAfterBytecode: readWords(buffer, bytecodeOffset, Math.min(buffer.length, bytecodeOffset + 128)),
    bytecode,
  };
}

function inspectSfOccurrences(buffer, sfIndex) {
  const symbol = `SF_${sfIndex}`;
  const raw = sfIndex + 6;
  const asciiOffsets = findAsciiOccurrences(buffer, symbol);
  const bytecodeOffsets = findOpcodeRawOccurrences(buffer, 5, raw);
  return {
    sfIndex,
    symbol,
    expectedRaw: raw,
    asciiOccurrences: asciiOffsets.map((offset) => {
      const run = findContainingAsciiRun(buffer, offset);
      return {
        offset,
        run,
        occurrenceKind: run.value === symbol ? "standalone-symbol" : "formula-or-text",
        context: extractAsciiWindow(buffer, offset, 80),
        nearbyHeader: readNearbyHeader(buffer, offset),
        wordsAfter: readWords(buffer, offset, Math.min(buffer.length, offset + 96)),
      };
    }),
    bytecodeOccurrences: bytecodeOffsets.map((offset) => ({
      offset,
      contextBefore: extractAsciiWindow(buffer, Math.max(0, offset - 80), 80),
      wordsBefore: readWords(buffer, Math.max(0, offset - 64), offset),
      wordsAfter: readWords(buffer, offset, Math.min(buffer.length, offset + 96)),
      decodedFromHere: decodeFormulaBytecode(buffer, offset, {
        maxTokens: 32,
        stopAtOffset: Math.min(buffer.length, offset + 192),
      }),
    })),
  };
}

function findContainingAsciiRun(buffer, offset) {
  let start = offset;
  while (start > 0 && buffer[start - 1] >= 32 && buffer[start - 1] <= 126) start -= 1;
  let end = offset;
  while (end < buffer.length && buffer[end] >= 32 && buffer[end] <= 126) end += 1;
  return {
    start,
    end,
    value: buffer.subarray(start, end).toString("ascii"),
  };
}

function buildStructuralWindows(buffer, formulasWithMissingRefs, sfOccurrences, options = {}) {
  const radius = options.windowRadius ?? 160;
  const anchors = [];
  for (const formula of formulasWithMissingRefs) {
    anchors.push({ kind: "formula-string", offset: formula.stringOffset, label: formula.nodeId });
    anchors.push({ kind: "formula-bytecode", offset: formula.bytecodeOffset, label: formula.nodeId });
  }
  for (const occurrence of sfOccurrences) {
    for (const ascii of occurrence.asciiOccurrences.slice(0, 6)) {
      anchors.push({ kind: "sf-ascii", offset: ascii.offset, label: occurrence.symbol });
    }
    for (const bytecode of occurrence.bytecodeOccurrences.slice(0, 6)) {
      anchors.push({ kind: "sf-bytecode", offset: bytecode.offset, label: occurrence.symbol });
    }
  }

  return dedupeBy(anchors, (anchor) => `${anchor.kind}:${anchor.offset}`)
    .sort((a, b) => a.offset - b.offset)
    .slice(0, options.maxWindowsPerAsset ?? 80)
    .map((anchor) => {
      const start = Math.max(0, anchor.offset - radius);
      const end = Math.min(buffer.length, anchor.offset + radius);
      return {
        ...anchor,
        start,
        end,
        asciiPreview: extractAsciiWindow(buffer, start, end - start),
        words: readWords(buffer, start, end),
      };
    });
}

function findAsciiOccurrences(buffer, text) {
  const needle = Buffer.from(text, "ascii");
  const offsets = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const found = buffer.indexOf(needle, cursor);
    if (found === -1) break;
    offsets.push(found);
    cursor = found + Math.max(1, needle.length);
  }
  return offsets;
}

function findOpcodeRawOccurrences(buffer, opcode, raw) {
  const needle = Buffer.alloc(8);
  needle.writeUInt32LE(opcode, 0);
  needle.writeUInt32LE(raw, 4);
  const offsets = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const found = buffer.indexOf(needle, cursor);
    if (found === -1) break;
    offsets.push(found);
    cursor = found + 8;
  }
  return offsets;
}

function extractStringsNear(buffer, offset, radius) {
  const start = Math.max(0, offset - radius);
  const strings = extractAsciiStrings(buffer.subarray(start, Math.min(buffer.length, offset + radius)), {
    minLength: 2,
    maxStrings: 80,
  });
  return strings.map((item) => ({
    offset: start + item.offset,
    value: item.value,
    kind: classifyCandidateString(item.value),
  }));
}

function extractAsciiWindow(buffer, offset, length) {
  return Array.from(buffer.subarray(offset, Math.min(buffer.length, offset + length)))
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
    .join("");
}

function summarizePriorityAssetInspection(assets) {
  return {
    assets: assets.length,
    missingRefs: assets.reduce((sum, asset) => sum + asset.missingRefs.length, 0),
    formulasWithMissingRefs: assets.reduce((sum, asset) => sum + asset.formulasWithMissingRefs.length, 0),
    asciiSfOccurrences: assets.reduce(
      (sum, asset) => sum + asset.sfOccurrences.reduce((inner, item) => inner + item.asciiOccurrences.length, 0),
      0
    ),
    standaloneAsciiSfOccurrences: assets.reduce(
      (sum, asset) =>
        sum +
        asset.sfOccurrences.reduce(
          (inner, item) => inner + item.asciiOccurrences.filter((occurrence) => occurrence.occurrenceKind === "standalone-symbol").length,
          0
        ),
      0
    ),
    bytecodeSfOccurrences: assets.reduce(
      (sum, asset) => sum + asset.sfOccurrences.reduce((inner, item) => inner + item.bytecodeOccurrences.length, 0),
      0
    ),
    assetsByMissingRefCount: assets
      .map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        missingRefs: asset.missingRefs.length,
        formulasWithMissingRefs: asset.formulasWithMissingRefs.length,
        asciiSfOccurrences: asset.summary.asciiSfOccurrences,
        standaloneAsciiSfOccurrences: asset.summary.standaloneAsciiSfOccurrences,
        bytecodeSfOccurrences: asset.summary.bytecodeSfOccurrences,
      }))
      .sort((a, b) => b.missingRefs - a.missingRefs),
  };
}

function summarizePriorityAsset(graph, targetSfIndexes, formulasWithMissingRefs, sfOccurrences, structuralWindows) {
  return {
    targetSfIndexes,
    formulasWithMissingRefs: formulasWithMissingRefs.length,
    asciiSfOccurrences: sfOccurrences.reduce((sum, item) => sum + item.asciiOccurrences.length, 0),
    standaloneAsciiSfOccurrences: sfOccurrences.reduce(
      (sum, item) => sum + item.asciiOccurrences.filter((occurrence) => occurrence.occurrenceKind === "standalone-symbol").length,
      0
    ),
    bytecodeSfOccurrences: sfOccurrences.reduce((sum, item) => sum + item.bytecodeOccurrences.length, 0),
    structuralWindows: structuralWindows.length,
    formulaOffsets: formulasWithMissingRefs.map((item) => ({
      nodeId: item.nodeId,
      stringOffset: item.stringOffset,
      bytecodeOffset: item.bytecodeOffset,
      matchingSfRefs: item.matchingSfRefs,
    })),
    missingSymbolsWithoutAsciiDefinition: sfOccurrences
      .filter((item) => item.asciiOccurrences.length === 0)
      .map((item) => item.symbol),
  };
}

function resolveMissingSfReferences(usageExport, candidateExport) {
  const candidateByAsset = new Map(candidateExport.graphs.map((graph) => [String(graph.assetId), graph]));
  const globalSymbols = buildGlobalSfSymbolIndex(candidateExport);
  const missing = [];

  for (const graph of usageExport.graphs) {
    const candidateGraph = candidateByAsset.get(String(graph.assetId));
    for (const ref of graph.missingLocalSymbols) {
      const usage = graph.usedSf.find((item) => item.nodeId === ref.nodeId && item.sfIndex === ref.sfIndex);
      const crossAssetMatches = (globalSymbols.get(String(ref.sfIndex)) ?? [])
        .filter((symbol) => symbol.assetId !== graph.assetId)
        .map((symbol) => scoreCrossAssetSfMatch(graph, usage, symbol))
        .sort((a, b) => b.matchScore - a.matchScore || String(a.assetId).localeCompare(String(b.assetId)))
        .slice(0, 8);
      const sameAssetMentions = findSameAssetSfMentions(candidateGraph, ref.sfIndex, ref.expression, ref.nodeId);
      const classification = classifyMissingSfReference(ref, usage, crossAssetMatches, sameAssetMentions);

      missing.push({
        assetId: graph.assetId,
        tags: graph.tags,
        sfIndex: ref.sfIndex,
        symbol: ref.symbol,
        nodeId: ref.nodeId,
        expression: ref.expression,
        usageRoles: usage?.usageRoles ?? classifySfUsage(ref.expression, ref.sfIndex),
        interestScore: usage?.interestScore ?? 0,
        interestLevel: usage?.interestLevel ?? "unknown",
        classification,
        sameAssetMentions,
        crossAssetMatches,
      });
    }
  }

  return {
    resolvedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      usageAnalyzedAt: usageExport.analyzedAt,
      candidateExportedAt: candidateExport.exportedAt,
      usageSummary: usageExport.summary,
      candidateSummary: candidateExport.summary,
    },
    summary: summarizeMissingSfResolution(missing, globalSymbols),
    missing,
  };
}

function buildGlobalSfSymbolIndex(candidateExport) {
  const index = new Map();
  for (const graph of candidateExport.graphs) {
    for (const symbol of Object.values(graph.sfSymbolMap ?? {})) {
      const key = String(symbol.sfIndex);
      if (!index.has(key)) index.set(key, []);
      index.get(key).push({
        assetId: graph.assetId,
        tags: graph.tags ?? [],
        source: graph.source,
        sfIndex: symbol.sfIndex,
        symbol: symbol.symbol,
        occurrences: symbol.occurrences,
        offsets: symbol.offsets,
        encodedRaws: symbol.encodedRaws,
        metadataProfiles: symbol.metadataProfiles,
        constantsAfterSamples: symbol.constantsAfterSamples,
      });
    }
  }
  return index;
}

function scoreCrossAssetSfMatch(sourceGraph, usage, symbol) {
  const sourceTags = new Set(sourceGraph.tags ?? []);
  const sharedTags = (symbol.tags ?? []).filter((tag) => sourceTags.has(tag));
  const profiles = Object.keys(symbol.metadataProfiles ?? {});
  let matchScore = sharedTags.length * 3;
  if (profiles.some((profile) => profile !== "no-constant-window")) matchScore += 2;
  if (usage?.usageRoles?.some((role) => ["multiplier", "divisor", "numerator", "table-scaling"].includes(role))) {
    matchScore += 1;
  }
  if ((symbol.source?.fileName ?? "") === (sourceGraph.source?.fileName ?? "")) matchScore += 1;

  return {
    assetId: symbol.assetId,
    tags: symbol.tags,
    sharedTags,
    matchScore,
    source: symbol.source,
    occurrences: symbol.occurrences,
    offsets: symbol.offsets,
    encodedRaws: symbol.encodedRaws,
    metadataProfiles: symbol.metadataProfiles,
    constantsAfterSamples: symbol.constantsAfterSamples.slice(0, 3),
  };
}

function findSameAssetSfMentions(candidateGraph, sfIndex, sourceExpression, sourceNodeId) {
  if (!candidateGraph) return [];
  const symbol = `SF_${sfIndex}`;
  const mentions = [];
  for (const item of candidateGraph.formulaCandidates ?? []) {
    if (!item.value.includes(symbol) || item.value === sourceExpression) continue;
    mentions.push({
      kind: item.kind,
      offset: item.offset,
      value: item.value,
      bytecodeOffset: item.bytecodeOffset,
    });
  }
  for (const item of candidateGraph.externalRefs ?? []) {
    if (!item.value.includes(symbol)) continue;
    mentions.push({
      kind: item.kind,
      offset: item.offset,
      value: item.value,
      bytecodeOffset: item.bytecodeOffset,
    });
  }
  return mentions
    .filter((item, index, list) => list.findIndex((other) => other.offset === item.offset && other.value === item.value) === index)
    .slice(0, 8)
    .map((item) => ({ ...item, sourceNodeId }));
}

function classifyMissingSfReference(ref, usage, crossAssetMatches, sameAssetMentions) {
  const roles = usage?.usageRoles ?? [];
  const expression = ref.expression;
  const hasExternal = /(PowerTag\.|Affix\.|[A-Za-z0-9_]+#[A-Za-z0-9_]+)/.test(expression);
  const hasTable = /Table\s*\(/i.test(expression);
  const hasGoodCrossAssetMatch = crossAssetMatches.some((match) => match.matchScore >= 3);
  const hasSameAssetMention = sameAssetMentions.length > 0;

  if (hasExternal) {
    return {
      kind: "external-dependency",
      confidence: "medium",
      nextAction: "resoudre la reference PowerTag/Affix/cle#cible avant de donner une valeur au slot",
    };
  }
  if (hasTable && roles.some((role) => role === "table-scaling" || role === "conditional-branch")) {
    return {
      kind: "table-linked-missing-slot",
      confidence: "medium",
      nextAction: "prioriser avec les tables Table(...) car le slot module directement le scaling",
    };
  }
  if (hasGoodCrossAssetMatch) {
    return {
      kind: "same-index-defined-in-related-assets",
      confidence: "low",
      nextAction: "utiliser comme piste de recherche, pas comme valeur finale, car les SF_N sont probablement locaux par asset",
    };
  }
  if (hasSameAssetMention) {
    return {
      kind: "embedded-formula-reference",
      confidence: "low",
      nextAction: "inspecter la structure binaire autour des autres mentions du meme asset",
    };
  }
  return {
    kind: "definition-outside-current-window",
    confidence: "low",
    nextAction: "elargir l'extraction des symboles ou trouver la table de metadata qui precede le bytecode",
  };
}

function summarizeMissingSfResolution(missing, globalSymbols) {
  const uniqueAssetSymbols = new Set(missing.map((item) => `${item.assetId}:${item.sfIndex}`));
  const globallyKnownMissing = missing.filter((item) => (globalSymbols.get(String(item.sfIndex)) ?? []).length > 0);
  const uniqueMissing = dedupeBy(
    missing,
    (item) => `${item.assetId}:${item.sfIndex}:${item.expression}`
  );
  return {
    missingReferences: missing.length,
    uniqueMissingAssetSymbols: uniqueAssetSymbols.size,
    globallyKnownBySameIndex: globallyKnownMissing.length,
    highInterestMissing: missing.filter((item) => item.interestLevel === "high").length,
    mediumInterestMissing: missing.filter((item) => item.interestLevel === "medium").length,
    classificationCounts: sortCounts(
      missing.reduce((counts, item) => {
        counts[item.classification.kind] = (counts[item.classification.kind] ?? 0) + 1;
        return counts;
      }, {})
    ),
    roleCounts: sortCounts(
      missing.reduce((counts, item) => {
        for (const role of item.usageRoles) counts[role] = (counts[role] ?? 0) + 1;
        return counts;
      }, {})
    ),
    topPriority: uniqueMissing
      .slice()
      .sort((a, b) => b.interestScore - a.interestScore || b.crossAssetMatches.length - a.crossAssetMatches.length)
      .slice(0, 20)
      .map((item) => ({
        assetId: item.assetId,
        sfIndex: item.sfIndex,
        symbol: item.symbol,
        interestScore: item.interestScore,
        interestLevel: item.interestLevel,
        usageRoles: item.usageRoles,
        classification: item.classification.kind,
        expression: item.expression,
        bestCrossAssetMatch: item.crossAssetMatches[0]
          ? {
              assetId: item.crossAssetMatches[0].assetId,
              matchScore: item.crossAssetMatches[0].matchScore,
              sharedTags: item.crossAssetMatches[0].sharedTags,
              metadataProfiles: item.crossAssetMatches[0].metadataProfiles,
            }
          : null,
      })),
  };
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function exportSfCandidateDefinitions(graphExport, options = {}) {
  const graphs = [];

  for (const graph of graphExport.graphs) {
    if (!graph.nodes.length) continue;
    const decoded = decodeBlteAt(graph.source.filePath, graph.source.blteOffset).decoded;
    const strings = extractAsciiStrings(decoded, {
      minLength: options.minLength ?? 1,
      maxStrings: options.maxStringsPerGraph ?? 5000,
    }).map((item) => enrichStringCandidate(decoded, item));
    const interesting = strings.filter((item) => item.kind !== "noise");

    graphs.push({
      assetId: graph.assetId,
      source: graph.source,
      tags: graph.tags,
      knownFormulaOffsets: graph.nodes.map((node) => node.offset),
      strings: interesting,
      sfSymbols: interesting.filter((item) => item.kind === "sf-symbol").map((item) => enrichSfSymbolEntry(decoded, item)),
      formulaCandidates: interesting.filter((item) => item.kind === "formula"),
      numericConstants: interesting.filter((item) => item.kind === "numeric-constant"),
      externalRefs: interesting.filter((item) => item.kind === "external-ref"),
    });
    graphs[graphs.length - 1].sfSymbolMap = buildSfSymbolMap(graphs[graphs.length - 1].sfSymbols);
  }

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      exportedAt: graphExport.exportedAt,
      summary: graphExport.summary,
    },
    summary: summarizeCandidateDefinitions(graphs),
    graphs,
  };
}

function inspectSfDefinitions(graphExport, options = {}) {
  const graphs = [];
  const maxGraphs = options.maxGraphs ?? graphExport.graphs.length;

  for (const graph of graphExport.graphs.slice(0, maxGraphs)) {
    if (!graph.nodes.length) continue;
    const decoded = decodeBlteAt(graph.source.filePath, graph.source.blteOffset).decoded;
    const nodes = graph.nodes.map((node) => inspectFormulaNode(decoded, node));
    graphs.push({
      assetId: graph.assetId,
      source: graph.source,
      tags: graph.tags,
      nodes,
      inferredSfRefs: summarizeInferredSfRefs(nodes),
    });
  }

  const allNodes = graphs.flatMap((graph) => graph.nodes);
  const allTokens = allNodes.flatMap((node) => node.bytecode.tokens);

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      exportedAt: graphExport.exportedAt,
      summary: graphExport.summary,
    },
    summary: {
      graphs: graphs.length,
      nodes: allNodes.length,
      nodesWithBytecode: allNodes.filter((node) => node.bytecode.tokens.length).length,
      inferredSfRefs: allTokens.filter((token) => token.kind === "sf-ref").length,
      constants: allTokens.filter((token) => token.kind === "number").length,
      operators: sortCounts(
        allTokens.reduce((counts, token) => {
          if (token.kind === "opcode") counts[token.opcode] = (counts[token.opcode] ?? 0) + 1;
          if (token.kind === "operator") counts[token.operator] = (counts[token.operator] ?? 0) + 1;
          return counts;
        }, {})
      ),
    },
    graphs,
  };
}

function inspectFormulaNode(buffer, node) {
  const bytecodeOffset = findBytecodeOffset(buffer, node.offset, node.expression);
  const bytecode = decodeFormulaBytecode(buffer, bytecodeOffset, {
    maxTokens: 80,
    stopAtOffset: findNextAsciiFormulaBoundary(buffer, bytecodeOffset),
  });

  return {
    id: node.id,
    stringOffset: node.offset,
    expression: node.expression,
    stringLength: Buffer.byteLength(node.expression, "ascii"),
    bytecodeOffset,
    sourceRefs: node.dependsOn,
    bytecode,
    comparison: compareSourceAndBytecodeRefs(node.dependsOn, bytecode.tokens),
  };
}

function extractAsciiStrings(buffer, options = {}) {
  const minLength = options.minLength ?? 1;
  const maxStrings = options.maxStrings ?? 5000;
  const strings = [];
  let start = null;

  for (let i = 0; i <= buffer.length; i += 1) {
    const byte = i < buffer.length ? buffer[i] : 0;
    const printable = byte >= 32 && byte <= 126;
    if (printable && start === null) {
      start = i;
    } else if (!printable && start !== null) {
      const value = buffer.subarray(start, i).toString("ascii");
      if (value.length >= minLength) {
        strings.push({ offset: start, value });
        if (strings.length >= maxStrings) break;
      }
      start = null;
    }
  }

  return strings;
}

function enrichStringCandidate(buffer, item) {
  const kind = classifyCandidateString(item.value);
  const bytecodeOffset = findBytecodeOffset(buffer, item.offset, item.value);
  const bytecode = kind === "noise" ? null : decodeFormulaBytecode(buffer, bytecodeOffset, {
    maxTokens: 48,
    stopAtOffset: findNextAsciiFormulaBoundary(buffer, bytecodeOffset),
  });

  return {
    ...item,
    kind,
    bytecodeOffset,
    nearbyHeader: readNearbyHeader(buffer, item.offset),
    bytecode,
  };
}

function classifyCandidateString(value) {
  const text = value.trim();
  if (!text) return "noise";
  if (/^SF_\d+$/.test(text)) return "sf-symbol";
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return "numeric-constant";
  if (/(PowerTag\.|Affix\.|[A-Za-z0-9_]+#[A-Za-z0-9_]+)/.test(text)) return "external-ref";
  if (
    text.length >= 4 &&
    /(SF_\d+|Table\(|Mod\.|min\(|max\(|floor\(|pow\(|==|[A-Za-z0-9_)]\s*[\+\-\*\/\?:]\s*[A-Za-z0-9_(])/i.test(text)
  ) {
    return "formula";
  }
  if (/^[A-Za-z0-9_."#:-]{4,160}$/.test(text) && /(?:Script Formula|Affix|Power|Bonus|Damage|Duration|Percent)/i.test(text)) {
    return "named-ref";
  }
  return "noise";
}

function enrichSfSymbolEntry(buffer, item) {
  const sfIndex = Number(item.value.slice(3));
  const firstSfToken = item.bytecode?.tokens.find((token) => token.kind === "sf-ref");
  const symbolRecord = readSfSymbolRecord(buffer, item.offset, item.value);
  return {
    ...item,
    sfIndex,
    encodedRaw: firstSfToken?.raw ?? null,
    encodedIndexGuess: firstSfToken?.sfIndexGuess ?? null,
    encodingMatches: firstSfToken?.sfIndexGuess === sfIndex,
    symbolRecord,
    metadataProfile: classifySfMetadata(symbolRecord.constantsAfter.map((constant) => constant.value)),
  };
}

function readSfSymbolRecord(buffer, offset, value) {
  const stringEnd = offset + Buffer.byteLength(value, "ascii");
  const words = readWords(buffer, offset, Math.min(buffer.length, offset + 96));
  const prefixWords = readWords(buffer, Math.max(0, offset - 48), offset);
  const constantsAfter = [];

  for (let cursor = stringEnd; cursor + 8 <= Math.min(buffer.length, offset + 192); cursor += 4) {
    const opcode = buffer.readUInt32LE(cursor);
    if (opcode === 6 && cursor + 8 <= buffer.length) {
      constantsAfter.push({
        offset: cursor,
        value: round(buffer.readFloatLE(cursor + 4)),
      });
      cursor += 4;
      continue;
    }
    if (isLikelyAsciiStart(buffer, cursor) && cursor > stringEnd + 4) break;
  }

  return {
    stringEnd,
    prefixWords,
    words,
    constantsAfter: constantsAfter.slice(0, 16),
  };
}

function readWords(buffer, start, end) {
  const rows = [];
  for (let cursor = start; cursor + 4 <= end; cursor += 4) {
    rows.push({
      offset: cursor,
      u32: buffer.readUInt32LE(cursor),
      i32: buffer.readInt32LE(cursor),
      f32: round(buffer.readFloatLE(cursor)),
      ascii: wordAscii(buffer, cursor),
      hex: buffer.subarray(cursor, cursor + 4).toString("hex"),
    });
  }
  return rows;
}

function isLikelyAsciiStart(buffer, offset) {
  const text = buffer.subarray(offset, Math.min(buffer.length, offset + 8)).toString("ascii");
  return /^(?:SF_\d|[A-Za-z]{3,}|[0-9]+(?:\.[0-9]+)?\s*[*+/?:-])/.test(text);
}

function wordAscii(buffer, offset) {
  return Array.from(buffer.subarray(offset, offset + 4))
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
    .join("");
}

function buildSfSymbolMap(symbols) {
  const map = {};
  for (const symbol of symbols) {
    const key = String(symbol.sfIndex);
    map[key] = map[key] ?? {
      sfIndex: symbol.sfIndex,
      symbol: symbol.value,
      occurrences: 0,
      offsets: [],
      encodedRaws: [],
      constantsAfterSamples: [],
      metadataProfiles: {},
    };
    map[key].occurrences += 1;
    map[key].offsets.push(symbol.offset);
    if (symbol.encodedRaw !== null && !map[key].encodedRaws.includes(symbol.encodedRaw)) {
      map[key].encodedRaws.push(symbol.encodedRaw);
    }
    map[key].metadataProfiles[symbol.metadataProfile.kind] =
      (map[key].metadataProfiles[symbol.metadataProfile.kind] ?? 0) + 1;
    if (symbol.symbolRecord.constantsAfter.length) {
      map[key].constantsAfterSamples.push({
        offset: symbol.offset,
        values: symbol.symbolRecord.constantsAfter.map((constant) => constant.value),
        profile: symbol.metadataProfile,
      });
    }
  }

  return Object.fromEntries(Object.entries(map).sort((a, b) => Number(a[0]) - Number(b[0])));
}

function classifySfMetadata(values) {
  if (!values.length) {
    return {
      kind: "no-constant-window",
      confidence: "medium",
      note: "No immediate opcode-6 numeric window after the SF symbol.",
    };
  }

  const nonZero = values.filter((value) => value !== 0);
  const unique = Array.from(new Set(values));
  const has100 = values.includes(100);
  const has1 = values.includes(1);
  const hasOnlyFlags = values.every((value) => value === 0 || value === 1);

  if (!nonZero.length) {
    return {
      kind: "zero-window",
      confidence: "medium",
      note: "Only zero constants were found immediately after the SF symbol.",
    };
  }

  if (hasOnlyFlags && values.length <= 3) {
    return {
      kind: "short-flag-window",
      confidence: "medium",
      note: "Very short 0/1 window; likely flags or a compact default marker.",
    };
  }

  if (hasOnlyFlags) {
    return {
      kind: "flag-window",
      confidence: "low",
      note: "Only 0/1 constants; likely flags, booleans, or compact metadata.",
    };
  }

  if (has100 && has1 && values.filter((value) => value === 0).length >= 4) {
    return {
      kind: "range-like-window",
      confidence: "medium",
      note: "Contains 0/1/100 pattern; likely bounds, defaults, or UI/calculation range metadata.",
    };
  }

  if (has100) {
    return {
      kind: "scale-100-window",
      confidence: "low",
      note: "Contains 100; may be percentage, max, scale, or range metadata.",
    };
  }

  if (unique.length <= 3 && values.length >= 4) {
    return {
      kind: "repeated-small-window",
      confidence: "low",
      note: "Few repeated values; likely compact metadata rather than a final gameplay value.",
    };
  }

  return {
    kind: "mixed-constant-window",
    confidence: "low",
    note: "Mixed constants; semantic role is not known yet.",
  };
}

function classifySfUsage(expression, sfIndex, dependsOn = {}) {
  const escaped = `SF_${sfIndex}`;
  const sf = escaped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const roles = new Set();

  if (new RegExp(`${sf}\\s*[*]`).test(expression) || new RegExp(`[*]\\s*${sf}`).test(expression)) {
    roles.add("multiplier");
  }
  if (new RegExp(`${sf}\\s*/`).test(expression)) roles.add("numerator");
  if (new RegExp(`/\\s*${sf}`).test(expression)) roles.add("divisor");
  if (new RegExp(`${sf}\\s*[+]`).test(expression) || new RegExp(`[+]\\s*${sf}`).test(expression)) {
    roles.add("additive");
  }
  if (new RegExp(`${sf}\\s*-`).test(expression) || new RegExp(`-\\s*${sf}`).test(expression)) {
    roles.add("subtractive");
  }
  if (new RegExp(`${sf}\\s*(?:==|!=|>=|<=|>|<)`).test(expression) || new RegExp(`(?:==|!=|>=|<=|>|<)\\s*${sf}`).test(expression)) {
    roles.add("condition");
  }
  if (expression.includes("?") && new RegExp(sf).test(expression)) roles.add("conditional-branch");
  if (new RegExp(`(?:min|max)\\([^)]*${sf}`, "i").test(expression)) roles.add("minmax-bound");
  if (/Table\s*\(/i.test(expression) && new RegExp(sf).test(expression)) roles.add("table-scaling");
  if (
    (dependsOn.powerTags?.length ?? 0) ||
    (dependsOn.affixProperties?.length ?? 0) ||
    (dependsOn.hashRefs?.length ?? 0) ||
    /(PowerTag\.|Affix\.|[A-Za-z0-9_]+#[A-Za-z0-9_]+)/.test(expression)
  ) {
    roles.add("external-combo");
  }
  if (!roles.size) roles.add("plain-reference");

  return Array.from(roles).sort();
}

function scoreSfUsage(usageRoles, metadataProfiles, dependsOn = {}) {
  let value = 0;
  const reasons = [];
  const profileNames = Object.keys(metadataProfiles);
  const roleScore = {
    multiplier: 4,
    divisor: 4,
    numerator: 3,
    "minmax-bound": 3,
    "table-scaling": 3,
    additive: 2,
    subtractive: 2,
    "external-combo": 2,
    condition: 1,
    "conditional-branch": 1,
    "plain-reference": 1,
  };
  for (const role of usageRoles) {
    value += roleScore[role] ?? 0;
  }
  if (usageRoles.includes("multiplier") || usageRoles.includes("divisor") || usageRoles.includes("numerator")) {
    reasons.push("participe a un ratio ou multiplicateur direct");
  }
  if (usageRoles.includes("external-combo")) {
    reasons.push("combine une reference externe de type PowerTag/Affix/cle#cible");
  }
  if ((dependsOn.tables?.length ?? 0) > 0 || usageRoles.includes("table-scaling")) {
    value += 2;
    reasons.push("proche d'un appel Table(...)");
  }
  if (profileNames.some((name) => name !== "no-constant-window")) {
    value += 2;
    reasons.push("definition locale avec fenetre numerique observee");
  }
  if (profileNames.includes("range-like-window") || profileNames.includes("scale-100-window")) {
    value += 1;
    reasons.push("profil compatible avec borne/echelle/pourcentage");
  }
  if (profileNames.includes("no-constant-window") && profileNames.length === 1) {
    value -= 1;
    reasons.push("pas encore de fenetre numerique locale claire");
  }

  return {
    value,
    level: value >= 7 ? "high" : value >= 4 ? "medium" : "low",
    reasons,
  };
}

function summarizeGraphSfUsage(usedSf, unusedLocalSymbols, missingLocalSymbols) {
  return {
    usedReferences: usedSf.length,
    uniqueUsedSymbols: new Set(usedSf.map((item) => item.sfIndex)).size,
    unusedLocalSymbols: unusedLocalSymbols.length,
    missingLocalSymbols: missingLocalSymbols.length,
    roles: sortCounts(
      usedSf.reduce((counts, item) => {
        for (const role of item.usageRoles) counts[role] = (counts[role] ?? 0) + 1;
        return counts;
      }, {})
    ),
    metadataProfilesOnUsedRefs: summarizeProfilesOnUsedRefs(usedSf),
    interestLevels: sortCounts(
      usedSf.reduce((counts, item) => {
        counts[item.interestLevel] = (counts[item.interestLevel] ?? 0) + 1;
        return counts;
      }, {})
    ),
  };
}

function summarizeSfUsageGraphs(graphs) {
  const usedSf = graphs.flatMap((graph) => graph.usedSf);
  const roleCounts = {};
  const profileRoleCounts = {};

  for (const item of usedSf) {
    const profiles = Object.keys(item.metadataProfiles);
    const effectiveProfiles = profiles.length ? profiles : ["missing-local-symbol"];
    for (const role of item.usageRoles) {
      roleCounts[role] = (roleCounts[role] ?? 0) + 1;
      for (const profile of effectiveProfiles) {
        const key = `${profile} + ${role}`;
        profileRoleCounts[key] = (profileRoleCounts[key] ?? 0) + 1;
      }
    }
  }

  const topInteresting = usedSf
    .slice()
    .sort((a, b) => b.interestScore - a.interestScore || a.expression.localeCompare(b.expression))
    .slice(0, 25)
      .map((item) => ({
      assetId: item.assetId,
      sfIndex: item.sfIndex,
      symbol: item.symbol,
      interestScore: item.interestScore,
      interestLevel: item.interestLevel,
      usageRoles: item.usageRoles,
      metadataProfiles: item.metadataProfiles,
      expression: item.expression,
    }));

  return {
    graphs: graphs.length,
    formulas: graphs.reduce((sum, graph) => sum + graph.formulas, 0),
    usedReferences: usedSf.length,
    uniqueUsedSymbolKeys: new Set(graphs.flatMap((graph) => graph.usedSf.map((item) => `${graph.assetId}:${item.sfIndex}`))).size,
    unusedLocalSymbols: graphs.reduce((sum, graph) => sum + graph.unusedLocalSymbols.length, 0),
    missingLocalSymbols: graphs.reduce((sum, graph) => sum + graph.missingLocalSymbols.length, 0),
    roles: sortCounts(roleCounts),
    metadataProfilesOnUsedRefs: summarizeProfilesOnUsedRefs(usedSf),
    profileRoleCounts: sortCounts(profileRoleCounts),
    interestLevels: sortCounts(
      usedSf.reduce((counts, item) => {
        counts[item.interestLevel] = (counts[item.interestLevel] ?? 0) + 1;
        return counts;
      }, {})
    ),
    topInteresting,
  };
}

function summarizeProfilesOnUsedRefs(usedSf) {
  const counts = {};
  for (const item of usedSf) {
    const profiles = Object.keys(item.metadataProfiles);
    if (!profiles.length) {
      counts["missing-local-symbol"] = (counts["missing-local-symbol"] ?? 0) + 1;
      continue;
    }
    for (const profile of profiles) {
      counts[profile] = (counts[profile] ?? 0) + 1;
    }
  }
  return sortCounts(counts);
}

function readNearbyHeader(buffer, offset) {
  const rows = [];
  for (let cursor = Math.max(0, offset - 32); cursor + 4 <= offset; cursor += 4) {
    rows.push({
      offset: cursor,
      u32: buffer.readUInt32LE(cursor),
      i32: buffer.readInt32LE(cursor),
      f32: round(buffer.readFloatLE(cursor)),
      hex: buffer.subarray(cursor, cursor + 4).toString("hex"),
    });
  }
  return rows;
}

function findBytecodeOffset(buffer, stringOffset, expression) {
  const expressionEnd = stringOffset + Buffer.byteLength(expression, "ascii");
  let offset = expressionEnd;
  while (offset < buffer.length && buffer[offset] === 0) offset += 1;
  return offset;
}

function findNextAsciiFormulaBoundary(buffer, offset) {
  const max = Math.min(buffer.length, offset + 512);
  for (let cursor = offset + 4; cursor < max; cursor += 1) {
    const slice = buffer.subarray(cursor, Math.min(buffer.length, cursor + 80)).toString("ascii");
    if (/^(?:SF_\d+|Mod\.|Table\(|\(?SF_|\d+(?:\.\d+)?\s*[*+/?:-])/.test(slice)) {
      return cursor;
    }
  }
  return max;
}

function decodeFormulaBytecode(buffer, offset, options = {}) {
  const tokens = [];
  let cursor = offset;
  const maxTokens = options.maxTokens ?? 80;
  const stopAtOffset = options.stopAtOffset ?? Math.min(buffer.length, offset + 512);

  while (cursor + 4 <= buffer.length && cursor < stopAtOffset && tokens.length < maxTokens) {
    const opcode = buffer.readUInt32LE(cursor);

    if (opcode === 0) {
      tokens.push({ offset: cursor, kind: "padding", opcode });
      cursor += 4;
      continue;
    }

    if (opcode === 5 && cursor + 8 <= buffer.length) {
      const raw = buffer.readUInt32LE(cursor + 4);
      tokens.push({
        offset: cursor,
        kind: "sf-ref",
        opcode,
        raw,
        sfIndexGuess: raw >= 6 ? raw - 6 : null,
      });
      cursor += 8;
      continue;
    }

    if (opcode === 6 && cursor + 8 <= buffer.length) {
      tokens.push({
        offset: cursor,
        kind: "number",
        opcode,
        value: round(buffer.readFloatLE(cursor + 4)),
      });
      cursor += 8;
      continue;
    }

    if (OPERATOR_NAMES[opcode]) {
      tokens.push({
        offset: cursor,
        kind: "operator",
        opcode,
        operator: OPERATOR_NAMES[opcode],
      });
      cursor += 4;
      continue;
    }

    if (opcode > 0 && opcode < 256) {
      tokens.push({
        offset: cursor,
        kind: "opcode",
        opcode,
      });
      cursor += 4;
      continue;
    }

    tokens.push({
      offset: cursor,
      kind: "unknown",
      opcode,
      hex: buffer.subarray(cursor, cursor + 4).toString("hex"),
    });
    break;
  }

  return {
    tokens,
    expressionGuess: tokensToExpression(tokens),
  };
}

const OPERATOR_NAMES = {
  7: "unknown-7",
  9: "equals",
  10: "unknown-10",
  11: "add",
  12: "subtract",
  13: "multiply",
  14: "divide",
  15: "unknown-15",
  16: "conditional-or-ref",
  17: "table-or-function",
  18: "external-ref",
  39: "equals-or-test",
};

function tokensToExpression(tokens) {
  return tokens
    .filter((token) => token.kind !== "padding")
    .map((token) => {
      if (token.kind === "sf-ref") return `SF_${token.sfIndexGuess}`;
      if (token.kind === "number") return String(token.value);
      if (token.kind === "operator") return `[${token.operator}:${token.opcode}]`;
      if (token.kind === "opcode") return `[op:${token.opcode}]`;
      return `[?:${token.hex ?? token.opcode}]`;
    })
    .join(" ");
}

function compareSourceAndBytecodeRefs(sourceRefs, tokens) {
  const sourceSfRefs = sourceRefs.sfRefs ?? [];
  const bytecodeSfRefs = Array.from(
    new Set(tokens.filter((token) => token.kind === "sf-ref" && token.sfIndexGuess !== null).map((token) => token.sfIndexGuess))
  ).sort((a, b) => a - b);

  return {
    sourceSfRefs,
    bytecodeSfRefs,
    sfRefsMatch:
      sourceSfRefs.length === bytecodeSfRefs.length &&
      sourceSfRefs.every((value, index) => value === bytecodeSfRefs[index]),
  };
}

function summarizeInferredSfRefs(nodes) {
  const refs = {};
  for (const node of nodes) {
    for (const token of node.bytecode.tokens) {
      if (token.kind !== "sf-ref" || token.sfIndexGuess === null) continue;
      refs[token.sfIndexGuess] = refs[token.sfIndexGuess] ?? [];
      refs[token.sfIndexGuess].push({
        nodeId: node.id,
        expression: node.expression,
        bytecodeOffset: token.offset,
        raw: token.raw,
      });
    }
  }
  return Object.fromEntries(Object.entries(refs).sort((a, b) => Number(a[0]) - Number(b[0])));
}

function summarizeCandidateDefinitions(graphs) {
  const kindCounts = {};
  const metadataProfileCounts = {};
  let strings = 0;
  for (const graph of graphs) {
    for (const item of graph.strings) {
      strings += 1;
      kindCounts[item.kind] = (kindCounts[item.kind] ?? 0) + 1;
    }
    for (const symbol of graph.sfSymbols) {
      metadataProfileCounts[symbol.metadataProfile.kind] =
        (metadataProfileCounts[symbol.metadataProfile.kind] ?? 0) + 1;
    }
  }

  return {
    graphs: graphs.length,
    strings,
    kindCounts: sortCounts(kindCounts),
    sfSymbols: graphs.reduce((sum, graph) => sum + graph.sfSymbols.length, 0),
    formulaCandidates: graphs.reduce((sum, graph) => sum + graph.formulaCandidates.length, 0),
    numericConstants: graphs.reduce((sum, graph) => sum + graph.numericConstants.length, 0),
    externalRefs: graphs.reduce((sum, graph) => sum + graph.externalRefs.length, 0),
    metadataProfileCounts: sortCounts(metadataProfileCounts),
  };
}

function sortCounts(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  );
}

function round(value) {
  return Number(value.toFixed(6));
}

module.exports = {
  analyzeSfUsage,
  analyzeSfUsageFromFiles,
  decodeFormulaBytecode,
  exportSfCandidateDefinitions,
  exportSfCandidateDefinitionsFromGraphsFile,
  inspectSfDefinitions,
  inspectSfDefinitionsFromGraphsFile,
  inspectPriorityAssets,
  inspectPriorityAssetsFromFiles,
  resolveMissingSfReferences,
  resolveMissingSfReferencesFromFiles,
};
