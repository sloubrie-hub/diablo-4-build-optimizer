const fs = require("fs");
const path = require("path");
const { catalogBlteFile, decodeBlteAt } = require("./blte-reader");
const { decodeFormulaBytecode } = require("./sf-inspector");

function exportExternalReferencesFromFiles(graphsFile, priorityInspectionFile = null) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  const priorityInspection = priorityInspectionFile
    ? JSON.parse(fs.readFileSync(priorityInspectionFile, "utf8"))
    : null;
  return exportExternalReferences(graphExport, priorityInspection);
}

function searchExternalTargetsFromFiles(dataDir, externalRefsFile, options = {}) {
  const externalRefs = JSON.parse(fs.readFileSync(externalRefsFile, "utf8"));
  return searchExternalTargets(dataDir, externalRefs, options);
}

function mergeExternalTargetSearchesFromFiles(files) {
  const reports = files.map((filePath) => JSON.parse(fs.readFileSync(filePath, "utf8")));
  return mergeExternalTargetSearches(reports, files);
}

function inspectExternalValuesFromFiles(graphsFile, options = {}) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  return inspectExternalValues(graphExport, options);
}

function exportCanonicalExternalVariablesFromFiles(graphsFile, externalValueInspectionFile = null) {
  const graphExport = JSON.parse(fs.readFileSync(graphsFile, "utf8"));
  const externalValueInspection = externalValueInspectionFile
    ? JSON.parse(fs.readFileSync(externalValueInspectionFile, "utf8"))
    : null;
  return exportCanonicalExternalVariables(graphExport, externalValueInspection);
}

function exportExternalReferences(graphExport, priorityInspection = null) {
  const priorityByAsset = new Map((priorityInspection?.assets ?? []).map((asset) => [String(asset.assetId), asset]));
  const assets = graphExport.graphs.map((graph) => buildAssetExternalReferenceView(graph, priorityByAsset.get(String(graph.assetId))));
  const groups = buildExternalReferenceGroups(assets);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      graphSummary: graphExport.summary,
      priorityInspectedAt: priorityInspection?.inspectedAt ?? null,
      prioritySummary: priorityInspection?.summary ?? null,
    },
    summary: summarizeExternalReferences(assets, groups),
    groups,
    assets,
  };
}

function searchExternalTargets(dataDir, externalRefs, options = {}) {
  const fileLimit = options.fileLimit ?? 80;
  const fileOffset = options.fileOffset ?? 0;
  const requestedFileNames = normalizeRequestedDataFileNames(options.fileNames);
  const maxHits = options.maxHits ?? 300;
  const maxDecodeCompressedBytes = options.maxDecodeCompressedBytes ?? 8 * 1024 * 1024;
  const decodedTypes = normalizeRequestedDecodedTypes(options.decodedTypes);
  const targets = buildSearchTargets(externalRefs, options.targets);
  const availableFiles = fs
    .readdirSync(dataDir)
    .filter((name) => /^data\.\d{3}$/.test(name))
    .sort();
  const selectedFileNames = requestedFileNames?.length
    ? availableFiles.filter((name) => requestedFileNames.includes(name))
    : availableFiles.slice(fileOffset, fileOffset + fileLimit);
  const files = selectedFileNames
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
      if (!decodedTypes.has(entry.decoded?.type)) continue;
      if (entry.blte.totalCompressedBytes > maxDecodeCompressedBytes) continue;
      decodedDeadbeefEntries += 1;
      const decoded = decodeBlteAt(filePath, entry.offset, {
        maxReadBytes: entry.blte.totalCompressedBytes,
      }).decoded;
      const strings = extractAsciiStrings(decoded, {
        minLength: 4,
        maxStrings: options.maxStringsPerEntry ?? 12000,
      });
      const targetHits = findTargetHits(strings, targets);
      if (!targetHits.length) continue;

      matches.push({
        score: scoreTargetHits(targetHits),
        assetId: decoded.length >= 20 ? decoded.readUInt32LE(16) : null,
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
        targetHits,
        nearbyStrings: collectNearbyTargetStrings(strings, targetHits),
      });
    }
  }

  matches.sort((a, b) => b.score - a.score || a.source.fileName.localeCompare(b.source.fileName));
  const groups = groupTargetMatches(matches);

  return {
    searchedAt: new Date().toISOString(),
    schemaVersion: 1,
    dataDir,
    source: {
      externalRefsExportedAt: externalRefs.exportedAt,
      externalRefsSummary: externalRefs.summary,
    },
    options: {
      fileLimit,
      fileOffset,
      fileNames: requestedFileNames ?? null,
      selectedFiles: selectedFileNames,
      maxHits,
      maxDecodeCompressedBytes,
      decodedTypes: Array.from(decodedTypes).sort(),
      targets: targets.map((target) => target.term),
    },
    summary: summarizeTargetSearch(files, decodedDeadbeefEntries, targets, matches, groups),
    groups,
    matches,
  };
}

function normalizeRequestedDataFileNames(fileNames) {
  if (!fileNames?.length) return null;
  return Array.from(new Set(fileNames.map((name) => {
    const trimmed = String(name).trim();
    if (/^data\.\d{3}$/.test(trimmed)) return trimmed;
    if (/^\d{1,3}$/.test(trimmed)) return `data.${trimmed.padStart(3, "0")}`;
    return trimmed;
  }))).sort();
}

function normalizeRequestedDecodedTypes(decodedTypes) {
  const values = decodedTypes?.length ? decodedTypes : ["deadbeef-binary"];
  return new Set(values.map((value) => String(value).trim()).filter(Boolean));
}

function mergeExternalTargetSearches(reports, files = []) {
  const matches = uniqueBy(
    reports.flatMap((report) => report.matches ?? []),
    (match) => `${match.assetId}:${match.source?.fileName}:${match.source?.blteOffset}`
  ).sort((a, b) => b.score - a.score || String(a.assetId).localeCompare(String(b.assetId)));
  const groups = groupTargetMatches(matches);
  const selectedFiles = uniqueSorted(reports.flatMap((report) => report.options?.selectedFiles ?? []));
  const targets = uniqueSorted(reports.flatMap((report) => report.options?.targets ?? [])).map((term) => ({
    term,
    kind: "merged",
    sourceKey: term,
  }));
  const decodedDeadbeefEntries = reports.reduce((sum, report) => sum + Number(report.summary?.decodedDeadbeefEntries ?? 0), 0);
  const scannedFiles = reports.reduce((sum, report) => sum + Number(report.summary?.files ?? 0), 0);
  const summaryFiles = selectedFiles.length
    ? selectedFiles
    : Array.from({ length: scannedFiles }, (_, index) => `merged-file-${index}`);

  return {
    mergedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      files,
      reports: reports.map((report, index) => ({
        file: files[index] ?? null,
        searchedAt: report.searchedAt ?? null,
        dataDir: report.dataDir ?? null,
        files: report.summary?.files ?? 0,
        decodedDeadbeefEntries: report.summary?.decodedDeadbeefEntries ?? 0,
        matchingEntries: report.summary?.matchingEntries ?? 0,
        targetGroupsMatched: report.summary?.targetGroupsMatched ?? 0,
        selectedFiles: report.options?.selectedFiles ?? [],
      })),
    },
    options: {
      selectedFiles,
      targets: targets.map((target) => target.term),
    },
    summary: summarizeTargetSearch(summaryFiles, decodedDeadbeefEntries, targets, matches, groups),
    groups,
    matches,
  };
}

function inspectExternalValues(graphExport, options = {}) {
  const requestedAssetIds = options.assetIds?.length ? new Set(options.assetIds.map(String)) : null;
  const graphs = graphExport.graphs.filter((graph) => {
    if (requestedAssetIds) return requestedAssetIds.has(String(graph.assetId));
    return graph.required.affixProperties.length || graph.required.hashRefs.length;
  });
  const assets = graphs.map((graph) => inspectExternalValueAsset(graph));

  return {
    inspectedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      graphSummary: graphExport.summary,
    },
    summary: summarizeExternalValueInspection(assets),
    assets,
  };
}

function exportCanonicalExternalVariables(graphExport, externalValueInspection = null) {
  const provenEquivalences = buildProvenEquivalenceMap(externalValueInspection);
  const assets = graphExport.graphs.map((graph) => canonicalizeGraphExternalVariables(graph, provenEquivalences));
  const variables = buildCanonicalVariableIndex(assets);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      graphExportedAt: graphExport.exportedAt,
      graphSummary: graphExport.summary,
      externalValuesInspectedAt: externalValueInspection?.inspectedAt ?? null,
      externalValueSummary: externalValueInspection?.summary ?? null,
    },
    summary: summarizeCanonicalVariables(assets, variables),
    variables,
    assets,
  };
}

function canonicalizeGraphExternalVariables(graph, provenEquivalences) {
  const formulas = graph.nodes.map((node) => {
    const canonicalRefs = canonicalizeReferenceSet(node.dependsOn, provenEquivalences, graph.assetId);
    return {
      nodeId: node.id,
      offset: node.offset,
      expression: node.expression,
      canonicalExpression: rewriteExpressionWithCanonicalVariables(node.expression, provenEquivalences, graph.assetId),
      canonicalRefs,
    };
  });
  const standaloneRefs = (graph.references ?? []).map((reference) => {
    const canonicalRefs = canonicalizeReferenceSet(reference.references, provenEquivalences, graph.assetId);
    return {
      offset: reference.offset,
      value: reference.value,
      canonicalValue: rewriteExpressionWithCanonicalVariables(reference.value, provenEquivalences, graph.assetId),
      canonicalRefs,
    };
  });

  return {
    assetId: graph.assetId,
    source: graph.source,
    tags: graph.tags,
    formulas,
    standaloneRefs: standaloneRefs.filter((item) => item.canonicalRefs.length),
    summary: {
      formulas: formulas.length,
      formulasWithCanonicalRefs: formulas.filter((item) => item.canonicalRefs.length).length,
      standaloneRefs: standaloneRefs.filter((item) => item.canonicalRefs.length).length,
      canonicalRefs:
        formulas.reduce((sum, item) => sum + item.canonicalRefs.length, 0) +
        standaloneRefs.reduce((sum, item) => sum + item.canonicalRefs.length, 0),
    },
  };
}

function buildProvenEquivalenceMap(externalValueInspection) {
  const map = new Map();
  for (const asset of externalValueInspection?.assets ?? []) {
    for (const equivalence of asset.equivalences ?? []) {
      if (equivalence.confidence !== "high" || !equivalence.sameSlot) continue;
      const affix = equivalence.affixProperty.affix;
      const staticIndex = extractStaticValueIndex(equivalence.affixProperty.field);
      const hashIndex = extractAffixValueIndex(equivalence.hashRef.key);
      if (staticIndex === null || hashIndex === null) continue;
      const canonicalId = canonicalAffixValueId(affix, staticIndex);
      const value = {
        canonicalId,
        kind: "affix-value",
        target: affix,
        valueIndex: staticIndex,
        confidence: "proven",
        evidenceAssetId: asset.assetId,
      };
      map.set(`affix-property:${affix}:Static Value ${staticIndex}`, value);
      map.set(`hash-ref:${equivalence.hashRef.key}#${affix}`, value);
    }
  }
  return map;
}

function canonicalizeReferenceSet(refs, provenEquivalences, assetId = null) {
  const canonicalRefs = [];
  for (const affix of refs.affixProperties ?? []) canonicalRefs.push(canonicalizeAffixProperty(affix, provenEquivalences));
  for (const hash of refs.hashRefs ?? []) canonicalRefs.push(canonicalizeHashRef(hash, provenEquivalences));
  for (const powerTag of refs.powerTags ?? []) canonicalRefs.push(canonicalizePowerTag(powerTag));
  for (const sfIndex of refs.sfRefs ?? []) canonicalRefs.push(canonicalizeSfRef(assetId, sfIndex));
  for (const table of refs.tables ?? []) {
    canonicalRefs.push({
      canonicalId: `table:${table.tableId}:${table.argument}`,
      kind: "table",
      confidence: "parsed",
      sourceSyntax: `Table(${table.tableId},${table.argument})`,
      source: table,
    });
  }
  return uniqueBy(canonicalRefs.filter(Boolean), (item) => item.canonicalId);
}

function canonicalizeAffixProperty(affix, provenEquivalences) {
  const proven = provenEquivalences.get(`affix-property:${affix.affix}:${affix.field}`);
  if (proven) return { ...proven, sourceSyntax: `Affix.${affix.affix}."${affix.field}"`, source: affix };

  const staticIndex = extractStaticValueIndex(affix.field);
  if (staticIndex !== null) {
    return {
      canonicalId: canonicalAffixValueId(affix.affix, staticIndex),
      kind: "affix-value",
      target: affix.affix,
      valueIndex: staticIndex,
      confidence: "inferred-static-value-index",
      sourceSyntax: `Affix.${affix.affix}."${affix.field}"`,
      source: affix,
    };
  }

  return {
    canonicalId: `affix:${affix.affix}:field:${affix.field}`,
    kind: "affix-field",
    target: affix.affix,
    field: affix.field,
    confidence: "parsed",
    sourceSyntax: `Affix.${affix.affix}."${affix.field}"`,
    source: affix,
  };
}

function canonicalizeHashRef(hash, provenEquivalences) {
  const proven = provenEquivalences.get(`hash-ref:${hash.key}#${hash.target}`);
  if (proven) return { ...proven, sourceSyntax: `${hash.key}#${hash.target}`, source: hash };

  const affixIndex = extractAffixValueIndex(hash.key);
  if (affixIndex !== null) {
    return {
      canonicalId: canonicalAffixValueId(hash.target, affixIndex - 1),
      kind: "affix-value",
      target: hash.target,
      valueIndex: affixIndex - 1,
      confidence: "inferred-affix-value-index",
      sourceSyntax: `${hash.key}#${hash.target}`,
      source: hash,
    };
  }

  return {
    canonicalId: `external:${hash.target}:${hash.key}`,
    kind: "hash-ref",
    target: hash.target,
    key: hash.key,
    confidence: "parsed",
    sourceSyntax: `${hash.key}#${hash.target}`,
    source: hash,
  };
}

function canonicalizePowerTag(powerTag) {
  const scriptIndex = extractScriptFormulaIndex(powerTag.field ?? "");
  return {
    canonicalId:
      scriptIndex === null
        ? `power:${powerTag.power}:field:${powerTag.field ?? "*"}`
        : `power:${powerTag.power}:scriptFormula[${scriptIndex}]`,
    kind: scriptIndex === null ? "power-field" : "power-script-formula",
    target: powerTag.power,
    field: powerTag.field ?? null,
    scriptFormulaIndex: scriptIndex,
    confidence: "parsed",
    sourceSyntax: `PowerTag.${powerTag.power}${powerTag.field ? `."${powerTag.field}"` : ""}`,
    source: powerTag,
  };
}

function canonicalizeSfRef(assetId, sfIndex) {
  return {
    canonicalId: `sf:${assetId ?? "unknown"}:${sfIndex}`,
    kind: "script-formula-local",
    target: assetId ?? null,
    sfIndex,
    confidence: "parsed",
    sourceSyntax: `SF_${sfIndex}`,
    source: {
      assetId: assetId ?? null,
      sfIndex,
    },
  };
}

function rewriteExpressionWithCanonicalVariables(expression, provenEquivalences, assetId = null) {
  let result = expression;
  result = result.replace(/Affix\.([A-Za-z0-9_]+)\."([^"]+)"/g, (match, affix, field) =>
    canonicalizeAffixProperty({ affix, field }, provenEquivalences).canonicalId
  );
  result = result.replace(/([A-Za-z0-9_]+)#([A-Za-z0-9_]+)/g, (match, key, target) =>
    canonicalizeHashRef({ key, target }, provenEquivalences).canonicalId
  );
  result = result.replace(/PowerTag\.([A-Za-z0-9_]+)\."([^"]+)"/g, (match, power, field) =>
    canonicalizePowerTag({ power, field }).canonicalId
  );
  result = result.replace(/\bSF_([0-9]+)\b/g, (match, sfIndex) => canonicalizeSfRef(assetId, Number(sfIndex)).canonicalId);
  return result;
}

function buildCanonicalVariableIndex(assets) {
  const variables = {};
  for (const asset of assets) {
    const refs = [
      ...asset.formulas.flatMap((formula) =>
        formula.canonicalRefs.map((ref) => ({ ...ref, expression: formula.expression, nodeId: formula.nodeId }))
      ),
      ...asset.standaloneRefs.flatMap((reference) =>
        reference.canonicalRefs.map((ref) => ({ ...ref, expression: reference.value, nodeId: null }))
      ),
    ];
    for (const ref of refs) {
      variables[ref.canonicalId] = variables[ref.canonicalId] ?? {
        canonicalId: ref.canonicalId,
        kind: ref.kind,
        target: ref.target ?? null,
        field: ref.field ?? null,
        key: ref.key ?? null,
        valueIndex: ref.valueIndex ?? null,
        scriptFormulaIndex: ref.scriptFormulaIndex ?? null,
        sfIndex: ref.sfIndex ?? null,
        confidenceCounts: {},
        occurrences: [],
      };
      variables[ref.canonicalId].confidenceCounts[ref.confidence] =
        (variables[ref.canonicalId].confidenceCounts[ref.confidence] ?? 0) + 1;
      variables[ref.canonicalId].occurrences.push({
        assetId: asset.assetId,
        nodeId: ref.nodeId,
        sourceSyntax: ref.sourceSyntax,
        expression: ref.expression,
      });
    }
  }
  return Object.fromEntries(Object.entries(variables).sort((a, b) => a[0].localeCompare(b[0])));
}

function inspectExternalValueAsset(graph) {
  const decoded = decodeBlteAt(graph.source.filePath, graph.source.blteOffset).decoded;
  const strings = extractAsciiStrings(decoded, {
    minLength: 3,
    maxStrings: 12000,
  });
  const relevantStrings = strings
    .map((item) => ({
      ...item,
      refs: extractExternalValueRefs(item.value),
    }))
    .filter((item) => item.refs.affixProperties.length || item.refs.hashRefs.length || item.refs.staticValueFields.length);
  const formulas = graph.nodes
    .filter(
      (node) =>
        (node.dependsOn.affixProperties?.length ?? 0) ||
        (node.dependsOn.hashRefs?.length ?? 0) ||
        /Affix(?:\.|_Value|_Flat_Value)|Static Value/i.test(node.expression)
    )
    .map((node) => inspectExternalFormula(decoded, node, strings));
  const equivalences = inferExternalValueEquivalences(formulas, relevantStrings);

  return {
    assetId: graph.assetId,
    source: graph.source,
    tags: graph.tags,
    decodedBytes: decoded.length,
    formulas,
    relevantStrings,
    equivalences,
    summary: {
      formulas: formulas.length,
      relevantStrings: relevantStrings.length,
      affixProperties: uniqueBy(
        relevantStrings.flatMap((item) => item.refs.affixProperties),
        (item) => `${item.affix}.${item.field}`
      ).length,
      hashRefs: uniqueBy(
        relevantStrings.flatMap((item) => item.refs.hashRefs),
        (item) => `${item.key}#${item.target}`
      ).length,
      equivalences: equivalences.length,
    },
  };
}

function inspectExternalFormula(buffer, node, strings) {
  const bytecodeOffset = findFormulaBytecodeOffset(buffer, node.offset, node.expression);
  const bytecode = decodeFormulaBytecode(buffer, bytecodeOffset, {
    maxTokens: 96,
    stopAtOffset: findNextStringOffset(strings, node.offset, bytecodeOffset, buffer.length),
  });
  const nearbyStrings = strings
    .filter((item) => Math.abs(item.offset - node.offset) <= 768)
    .map((item) => ({
      offset: item.offset,
      value: item.value,
      refs: extractExternalValueRefs(item.value),
    }));

  return {
    nodeId: node.id,
    stringOffset: node.offset,
    bytecodeOffset,
    expression: node.expression,
    refs: extractExternalValueRefs(node.expression),
    dependsOn: node.dependsOn,
    bytecode,
    numericConstants: bytecode.tokens.filter((token) => token.kind === "number"),
    nearbyStrings,
    wordsBefore: readWords(buffer, Math.max(0, node.offset - 96), node.offset),
    wordsAfterBytecode: readWords(buffer, bytecodeOffset, Math.min(buffer.length, bytecodeOffset + 160)),
  };
}

function inferExternalValueEquivalences(formulas, relevantStrings) {
  const equivalences = [];
  const affixProperties = [];
  const hashRefs = [];
  for (const item of relevantStrings) {
    for (const ref of item.refs.affixProperties) affixProperties.push({ ...ref, offset: item.offset, expression: item.value });
    for (const ref of item.refs.hashRefs) hashRefs.push({ ...ref, offset: item.offset, expression: item.value });
  }

  for (const affix of affixProperties) {
    for (const hash of hashRefs) {
      if (affix.affix !== hash.target) continue;
      const fieldIndex = extractStaticValueIndex(affix.field);
      const hashIndex = extractAffixValueIndex(hash.key);
      const sameSlot = fieldIndex !== null && hashIndex !== null && fieldIndex + 1 === hashIndex;
      equivalences.push({
        affixProperty: {
          affix: affix.affix,
          field: affix.field,
          offset: affix.offset,
          expression: affix.expression,
        },
        hashRef: {
          key: hash.key,
          target: hash.target,
          offset: hash.offset,
          expression: hash.expression,
        },
        sameSlot,
        confidence: sameSlot ? "high" : "medium",
        note: sameSlot
          ? "Static Value N appears to map to Affix_Value_(N+1)#target."
          : "Same affix target, but field/index mapping is not proven.",
      });
    }
  }

  return uniqueBy(equivalences, (item) => `${item.affixProperty.field}:${item.hashRef.key}:${item.hashRef.target}`);
}

function extractExternalValueRefs(value) {
  return {
    affixProperties: extractMatches(value, /Affix\.([A-Za-z0-9_]+)\."([^"]+)"/g, (match) => ({
      affix: match[1],
      field: match[2],
    })),
    hashRefs: extractMatches(value, /([A-Za-z0-9_]+)#([A-Za-z0-9_]+)/g, (match) => ({
      key: match[1],
      target: match[2],
    })),
    staticValueFields: extractMatches(value, /Static Value ([0-9]+)/g, (match) => Number(match[1])),
  };
}

function extractMatches(value, regex, mapFn) {
  const results = [];
  for (const match of value.matchAll(regex)) results.push(mapFn(match));
  return results;
}

function extractStaticValueIndex(field) {
  const match = /^Static Value ([0-9]+)$/.exec(field);
  return match ? Number(match[1]) : null;
}

function extractAffixValueIndex(key) {
  const match = /^Affix_(?:Flat_)?Value_([0-9]+)$/.exec(key);
  return match ? Number(match[1]) : null;
}

function findFormulaBytecodeOffset(buffer, stringOffset, expression) {
  const expressionEnd = stringOffset + Buffer.byteLength(expression, "ascii");
  let offset = expressionEnd;
  while (offset < buffer.length && buffer[offset] === 0) offset += 1;
  return offset;
}

function findNextStringOffset(strings, stringOffset, bytecodeOffset, fallbackEnd) {
  const next = strings.find((item) => item.offset > stringOffset && item.offset > bytecodeOffset);
  return next?.offset ?? Math.min(fallbackEnd, bytecodeOffset + 512);
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

function wordAscii(buffer, offset) {
  return Array.from(buffer.subarray(offset, offset + 4))
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."))
    .join("");
}

function round(value) {
  return Number(value.toFixed(6));
}

function summarizeExternalValueInspection(assets) {
  return {
    assets: assets.length,
    formulas: assets.reduce((sum, asset) => sum + asset.formulas.length, 0),
    relevantStrings: assets.reduce((sum, asset) => sum + asset.relevantStrings.length, 0),
    equivalences: assets.reduce((sum, asset) => sum + asset.equivalences.length, 0),
    highConfidenceEquivalences: assets.reduce(
      (sum, asset) => sum + asset.equivalences.filter((item) => item.confidence === "high").length,
      0
    ),
    assetsWithEquivalences: assets
      .filter((asset) => asset.equivalences.length)
      .map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        equivalences: asset.equivalences.length,
        highConfidenceEquivalences: asset.equivalences.filter((item) => item.confidence === "high").length,
      })),
  };
}

function buildSearchTargets(externalRefs, explicitTargets = null) {
  if (explicitTargets?.length) {
    return explicitTargets.map((term) => ({ term, kind: "explicit", sourceKey: term }));
  }

  const targets = [];
  for (const key of Object.keys(externalRefs.groups?.powerTags ?? {})) {
    const [power, field = null] = key.split(".");
    targets.push({ term: key, kind: "powerTag-full", sourceKey: key });
    targets.push({ term: power, kind: "powerTag-power", sourceKey: key });
    if (field) targets.push({ term: field, kind: "powerTag-field", sourceKey: key });
  }
  for (const key of Object.keys(externalRefs.groups?.affixes ?? {})) {
    const [affix, field = null] = key.split(".");
    targets.push({ term: key, kind: "affix-full", sourceKey: key });
    targets.push({ term: affix, kind: "affix-name", sourceKey: key });
    if (field) targets.push({ term: field, kind: "affix-field", sourceKey: key });
  }
  for (const key of Object.keys(externalRefs.groups?.hashTargets ?? {})) {
    const [hashKey, target] = key.split("#");
    targets.push({ term: key, kind: "hash-full", sourceKey: key });
    if (hashKey) targets.push({ term: hashKey, kind: "hash-key", sourceKey: key });
    if (target) targets.push({ term: target, kind: "hash-target", sourceKey: key });
  }

  return uniqueBy(
    targets.filter((target) => target.term && target.term.length >= 4),
    (target) => `${target.kind}:${target.term}`
  );
}

function findTargetHits(strings, targets) {
  const hits = [];
  for (const item of strings) {
    const lowered = item.value.toLowerCase();
    for (const target of targets) {
      if (!lowered.includes(target.term.toLowerCase())) continue;
      hits.push({
        offset: item.offset,
        value: item.value,
        target: target.term,
        kind: target.kind,
        sourceKey: target.sourceKey,
        exact: item.value === target.term,
      });
    }
  }
  return hits;
}

function scoreTargetHits(hits) {
  return hits.reduce((sum, hit) => {
    const kindScore = {
      "powerTag-full": 12,
      "affix-full": 12,
      "hash-full": 12,
      "powerTag-power": 8,
      "affix-name": 8,
      "hash-target": 8,
      "hash-key": 5,
      "powerTag-field": 2,
      "affix-field": 2,
      explicit: 10,
    }[hit.kind] ?? 1;
    return sum + kindScore + (hit.exact ? 4 : 0);
  }, 0);
}

function collectNearbyTargetStrings(strings, hits) {
  const offsets = hits.map((hit) => hit.offset);
  return strings
    .filter((item) => offsets.some((offset) => Math.abs(item.offset - offset) <= 512))
    .slice(0, 80)
    .map((item) => ({
      offset: item.offset,
      value: item.value,
    }));
}

function groupTargetMatches(matches) {
  const groups = {};
  for (const match of matches) {
    const seenInAsset = new Set();
    for (const hit of match.targetHits) {
      const key = hit.sourceKey;
      groups[key] = groups[key] ?? {
        key,
        hits: 0,
        assets: [],
      };
      groups[key].hits += 1;
      const assetKey = `${match.assetId}:${match.source.fileName}:${match.source.blteOffset}`;
      if (seenInAsset.has(`${key}:${assetKey}`)) continue;
      seenInAsset.add(`${key}:${assetKey}`);
      groups[key].assets.push({
        assetId: match.assetId,
        score: match.score,
        confidence: classifyTargetMatchConfidence(match.targetHits.filter((item) => item.sourceKey === key)),
        source: match.source,
        hitKinds: uniqueSorted(match.targetHits.filter((item) => item.sourceKey === key).map((item) => item.kind)),
        sampleValues: uniqueSorted(match.targetHits.filter((item) => item.sourceKey === key).map((item) => item.value)).slice(0, 8),
      });
    }
  }

  for (const group of Object.values(groups)) {
    group.assets.sort((a, b) => b.score - a.score || String(a.assetId).localeCompare(String(b.assetId)));
    group.assets = group.assets.slice(0, 20);
  }

  return Object.fromEntries(
    Object.entries(groups).sort((a, b) => b[1].hits - a[1].hits || a[0].localeCompare(b[0]))
  );
}

function classifyTargetMatchConfidence(hits) {
  const kinds = new Set(hits.map((hit) => hit.kind));
  if ([...kinds].some((kind) => kind.endsWith("-full")) || hits.some((hit) => hit.exact)) return "high";
  if (
    (kinds.has("powerTag-power") && kinds.has("powerTag-field")) ||
    (kinds.has("affix-name") && kinds.has("affix-field")) ||
    (kinds.has("hash-key") && kinds.has("hash-target"))
  ) {
    return "medium";
  }
  return "low";
}

function summarizeTargetSearch(files, decodedDeadbeefEntries, targets, matches, groups) {
  return {
    files: files.length,
    decodedDeadbeefEntries,
    targets: targets.length,
    matchingEntries: matches.length,
    targetGroupsMatched: Object.keys(groups).length,
    topMatches: matches.slice(0, 20).map((match) => ({
      score: match.score,
      assetId: match.assetId,
      fileName: match.source.fileName,
      blteOffset: match.source.blteOffset,
      targets: uniqueSorted(match.targetHits.map((hit) => hit.sourceKey)).slice(0, 12),
    })),
    topGroups: Object.values(groups)
      .slice(0, 20)
      .map((group) => ({
        key: group.key,
        hits: group.hits,
        assets: group.assets.slice(0, 8).map((asset) => ({
          assetId: asset.assetId,
          score: asset.score,
          confidence: asset.confidence,
          fileName: asset.source.fileName,
          blteOffset: asset.source.blteOffset,
          hitKinds: asset.hitKinds,
        })),
      })),
    highConfidenceGroups: Object.values(groups)
      .filter((group) => group.assets.some((asset) => asset.confidence === "high"))
      .slice(0, 20)
      .map((group) => ({
        key: group.key,
        assets: group.assets
          .filter((asset) => asset.confidence === "high")
          .slice(0, 8)
          .map((asset) => ({
            assetId: asset.assetId,
            score: asset.score,
            fileName: asset.source.fileName,
            blteOffset: asset.source.blteOffset,
            hitKinds: asset.hitKinds,
          })),
      })),
  };
}

function buildAssetExternalReferenceView(graph, priorityAsset = null) {
  const formulaRefs = graph.nodes.map((node) => ({
    nodeId: node.id,
    offset: node.offset,
    expression: node.expression,
    references: normalizeReferenceSets(node.dependsOn),
    externalScore: scoreExternalReferenceSet(node.dependsOn),
  }));
  const standaloneRefs = (graph.references ?? []).map((reference) => ({
    offset: reference.offset,
    value: reference.value,
    references: normalizeReferenceSets(reference.references),
    externalScore: scoreExternalReferenceSet(reference.references),
  }));
  const priorityLinks = buildPriorityLinks(priorityAsset, formulaRefs, standaloneRefs);
  const allRefs = [
    ...formulaRefs.map((item) => item.references),
    ...standaloneRefs.map((item) => item.references),
  ];
  const merged = mergeReferenceSets(allRefs);

  return {
    assetId: graph.assetId,
    source: graph.source,
    tags: graph.tags,
    externalIdentity: inferExternalIdentity(graph, merged, standaloneRefs),
    required: normalizeReferenceSets(graph.required ?? {}),
    mergedReferences: merged,
    formulaRefs,
    standaloneRefs: standaloneRefs.filter((item) => item.externalScore > 0 || item.references.sfRefs.length),
    priorityLinks,
    summary: summarizeAssetRefs(merged, formulaRefs, standaloneRefs, priorityLinks),
  };
}

function buildPriorityLinks(priorityAsset, formulaRefs, standaloneRefs) {
  if (!priorityAsset) return [];
  const links = [];
  for (const formula of priorityAsset.formulasWithMissingRefs ?? []) {
    const graphFormula = formulaRefs.find((item) => item.nodeId === formula.nodeId || item.offset === formula.stringOffset);
    const nearbyStandalone = standaloneRefs
      .map((ref) => ({
        distance: Math.abs(ref.offset - formula.stringOffset),
        offset: ref.offset,
        value: ref.value,
        references: ref.references,
      }))
      .filter((ref) => ref.distance <= 2500 && (hasExternalRefs(ref.references) || ref.references.sfRefs.length))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 12);

    links.push({
      nodeId: formula.nodeId,
      expression: formula.expression,
      stringOffset: formula.stringOffset,
      bytecodeOffset: formula.bytecodeOffset,
      missingSfRefs: formula.matchingSfRefs,
      formulaReferences: graphFormula?.references ?? emptyRefs(),
      nearestReferences: nearbyStandalone,
    });
  }
  return links;
}

function inferExternalIdentity(graph, merged, standaloneRefs) {
  const names = new Set();
  for (const tag of merged.powerTags) names.add(`PowerTag:${tag.power}`);
  for (const affix of merged.affixProperties) names.add(`Affix:${affix.affix}`);
  for (const ref of merged.hashRefs) names.add(`HashTarget:${ref.target}`);

  for (const item of standaloneRefs) {
    if (/(Legendary|Unique|Skill|Talent|Power|Affix|Paragon|Glyph|Rune)/i.test(item.value)) {
      names.add(`NameCandidate:${item.value}`);
    }
  }

  const classTags = (graph.tags ?? []).filter((tag) =>
    /Barbarian|Sorcerer|Rogue|Druid|Necromancer|Paladin|Spiritborn/i.test(tag)
  );
  return {
    candidates: Array.from(names).sort().slice(0, 40),
    classTags,
    hasTableScaling: merged.tables.length > 0 || (graph.tags ?? []).includes("Table"),
    hasPowerTag: merged.powerTags.length > 0 || (graph.tags ?? []).includes("PowerTag"),
    hasAffix: merged.affixProperties.length > 0 || (graph.tags ?? []).includes("Affix"),
  };
}

function buildExternalReferenceGroups(assets) {
  const groups = {
    powerTags: {},
    affixes: {},
    hashTargets: {},
    scriptFormulaRefs: {},
    tables: {},
  };

  for (const asset of assets) {
    addGroupedRefs(groups.powerTags, asset.mergedReferences.powerTags, (tag) => `${tag.power}.${tag.field ?? "*"}`, asset);
    addGroupedRefs(groups.affixes, asset.mergedReferences.affixProperties, (affix) => `${affix.affix}.${affix.field}`, asset);
    addGroupedRefs(groups.hashTargets, asset.mergedReferences.hashRefs, (ref) => `${ref.key}#${ref.target}`, asset);
    addGroupedRefs(groups.tables, asset.mergedReferences.tables, (table) => `Table(${table.tableId},${table.argument})`, asset);
    for (const ref of asset.mergedReferences.scriptFormulaRefs) {
      addGroup(groups.scriptFormulaRefs, `Script Formula ${ref}`, asset);
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([kind, value]) => [
      kind,
      Object.fromEntries(
        Object.entries(value).sort((a, b) => b[1].assets.length - a[1].assets.length || a[0].localeCompare(b[0]))
      ),
    ])
  );
}

function addGroupedRefs(group, refs, keyFn, asset) {
  for (const ref of refs) addGroup(group, keyFn(ref), asset);
}

function addGroup(group, key, asset) {
  group[key] = group[key] ?? {
    key,
    assets: [],
    classTags: {},
  };
  if (!group[key].assets.some((item) => item.assetId === asset.assetId)) {
    group[key].assets.push({
      assetId: asset.assetId,
      tags: asset.tags,
      source: asset.source,
      externalIdentity: asset.externalIdentity,
    });
  }
  for (const classTag of asset.externalIdentity.classTags) {
    group[key].classTags[classTag] = (group[key].classTags[classTag] ?? 0) + 1;
  }
}

function normalizeReferenceSets(refs) {
  return {
    tables: refs.tables ?? [],
    powerTags: refs.powerTags ?? [],
    affixProperties: refs.affixProperties ?? [],
    hashRefs: refs.hashRefs ?? [],
    scriptFormulaRefs: refs.scriptFormulaRefs ?? [],
    sfRefs: refs.sfRefs ?? [],
  };
}

function mergeReferenceSets(referenceSets) {
  return {
    tables: uniqueObjects(referenceSets.flatMap((refs) => refs.tables), (table) => `${table.tableId}:${table.argument}`),
    powerTags: uniqueObjects(referenceSets.flatMap((refs) => refs.powerTags), (tag) => `${tag.power}.${tag.field ?? "*"}`),
    affixProperties: uniqueObjects(referenceSets.flatMap((refs) => refs.affixProperties), (affix) => `${affix.affix}.${affix.field}`),
    hashRefs: uniqueObjects(referenceSets.flatMap((refs) => refs.hashRefs), (ref) => `${ref.key}#${ref.target}`),
    scriptFormulaRefs: uniqueSortedNumbers(referenceSets.flatMap((refs) => refs.scriptFormulaRefs)),
    sfRefs: uniqueSortedNumbers(referenceSets.flatMap((refs) => refs.sfRefs)),
  };
}

function scoreExternalReferenceSet(refs) {
  return (
    (refs.powerTags?.length ?? 0) * 5 +
    (refs.affixProperties?.length ?? 0) * 5 +
    (refs.hashRefs?.length ?? 0) * 4 +
    (refs.scriptFormulaRefs?.length ?? 0) * 2 +
    (refs.tables?.length ?? 0) * 2
  );
}

function hasExternalRefs(refs) {
  return scoreExternalReferenceSet(refs) > 0;
}

function summarizeExternalReferences(assets, groups) {
  const assetsWithExternalRefs = assets.filter((asset) => hasExternalRefs(asset.mergedReferences)).length;
  return {
    assets: assets.length,
    assetsWithExternalRefs,
    powerTagGroups: Object.keys(groups.powerTags).length,
    affixGroups: Object.keys(groups.affixes).length,
    hashTargetGroups: Object.keys(groups.hashTargets).length,
    tableGroups: Object.keys(groups.tables).length,
    scriptFormulaGroups: Object.keys(groups.scriptFormulaRefs).length,
    priorityLinks: assets.reduce((sum, asset) => sum + asset.priorityLinks.length, 0),
    topAssetsByExternalScore: assets
      .map((asset) => ({
        assetId: asset.assetId,
        tags: asset.tags,
        externalScore:
          asset.formulaRefs.reduce((sum, item) => sum + item.externalScore, 0) +
          asset.standaloneRefs.reduce((sum, item) => sum + item.externalScore, 0),
        identity: asset.externalIdentity,
      }))
      .filter((item) => item.externalScore > 0)
      .sort((a, b) => b.externalScore - a.externalScore)
      .slice(0, 20),
  };
}

function summarizeAssetRefs(merged, formulaRefs, standaloneRefs, priorityLinks) {
  return {
    formulaRefs: formulaRefs.length,
    standaloneRefs: standaloneRefs.length,
    externalFormulaRefs: formulaRefs.filter((item) => item.externalScore > 0).length,
    externalStandaloneRefs: standaloneRefs.filter((item) => item.externalScore > 0).length,
    priorityLinks: priorityLinks.length,
    tables: merged.tables.length,
    powerTags: merged.powerTags.length,
    affixes: merged.affixProperties.length,
    hashRefs: merged.hashRefs.length,
    scriptFormulaRefs: merged.scriptFormulaRefs.length,
    sfRefs: merged.sfRefs.length,
  };
}

function summarizeCanonicalVariables(assets, variables) {
  const variableList = Object.values(variables);
  return {
    assets: assets.length,
    variables: variableList.length,
    affixValueVariables: variableList.filter((item) => item.kind === "affix-value").length,
    powerVariables: variableList.filter((item) => item.kind.startsWith("power")).length,
    hashRefVariables: variableList.filter((item) => item.kind === "hash-ref").length,
    tableVariables: variableList.filter((item) => item.kind === "table").length,
    localScriptFormulaVariables: variableList.filter((item) => item.kind === "script-formula-local").length,
    provenVariables: variableList.filter((item) => item.confidenceCounts.proven).length,
    formulasWithCanonicalRefs: assets.reduce((sum, asset) => sum + asset.summary.formulasWithCanonicalRefs, 0),
    topVariables: variableList
      .slice()
      .sort((a, b) => b.occurrences.length - a.occurrences.length || a.canonicalId.localeCompare(b.canonicalId))
      .slice(0, 30)
      .map((item) => ({
        canonicalId: item.canonicalId,
        kind: item.kind,
        occurrences: item.occurrences.length,
        confidenceCounts: item.confidenceCounts,
      })),
  };
}

function canonicalAffixValueId(affix, index) {
  return `affix:${affix}:value[${index}]`;
}

function extractScriptFormulaIndex(field) {
  const match = /^Script Formula ([0-9]+)$/.exec(field);
  return match ? Number(match[1]) : null;
}

function uniqueObjects(items, keyFn) {
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

function uniqueSortedNumbers(values) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));
}

function uniqueBy(items, keyFn) {
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

function extractAsciiStrings(buffer, options = {}) {
  const minLength = options.minLength ?? 4;
  const maxStrings = options.maxStrings ?? 8000;
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

function emptyRefs() {
  return {
    tables: [],
    powerTags: [],
    affixProperties: [],
    hashRefs: [],
    scriptFormulaRefs: [],
    sfRefs: [],
  };
}

module.exports = {
  exportCanonicalExternalVariables,
  exportCanonicalExternalVariablesFromFiles,
  exportExternalReferences,
  exportExternalReferencesFromFiles,
  inspectExternalValues,
  inspectExternalValuesFromFiles,
  mergeExternalTargetSearches,
  mergeExternalTargetSearchesFromFiles,
  searchExternalTargets,
  searchExternalTargetsFromFiles,
};
