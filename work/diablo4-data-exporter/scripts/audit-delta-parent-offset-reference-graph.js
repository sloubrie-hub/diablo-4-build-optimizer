const fs = require("fs");
const path = require("path");

const structureAuditFile = process.argv[2] ?? "outputs/diablo4-delta-parent-upgrade-structure-audit/delta-parent-upgrade-structure-audit.json";
const outDir = process.argv[3] ?? "outputs/diablo4-delta-parent-offset-reference-graph";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function extractStrings(buffer) {
  const rows = [];
  let start = null;
  for (let index = 0; index <= buffer.length; index += 1) {
    const byte = index < buffer.length ? buffer[index] : 0;
    const printable = byte >= 0x20 && byte <= 0x7e;
    if (printable && start === null) start = index;
    if ((!printable || index === buffer.length) && start !== null) {
      const length = index - start;
      if (length >= 4) {
        rows.push({
          offset: start,
          endOffset: index,
          length,
          value: buffer.toString("ascii", start, index),
        });
      }
      start = null;
    }
  }
  return rows;
}

function findU32Refs(buffer, value, ignoredOffsets = new Set()) {
  const needle = Buffer.alloc(4);
  needle.writeUInt32LE(value >>> 0, 0);
  const refs = [];
  let cursor = 0;
  while (cursor <= buffer.length - 4) {
    const offset = buffer.indexOf(needle, cursor);
    if (offset < 0) break;
    if (!ignoredOffsets.has(offset)) refs.push(offset);
    cursor = offset + 1;
  }
  return refs;
}

function stringAt(strings, offset) {
  return strings.find((item) => item.offset === offset) ?? null;
}

function readEntry(buffer, strings, entryOffset) {
  if (entryOffset < 0 || entryOffset + 16 > buffer.length) return null;
  const stringOffset = buffer.readUInt32LE(entryOffset);
  const typeOrSize = buffer.readUInt32LE(entryOffset + 4);
  const zeroA = buffer.readUInt32LE(entryOffset + 8);
  const zeroB = buffer.readUInt32LE(entryOffset + 12);
  const string = stringAt(strings, stringOffset);
  if (!string || zeroA !== 0 || zeroB !== 0) return null;
  return {
    entryOffset,
    stringOffset,
    typeOrSize,
    zeroA,
    zeroB,
    string: {
      offset: string.offset,
      endOffset: string.endOffset,
      length: string.length,
      value: string.value,
    },
  };
}

function classifyString(value) {
  if (/^Mod\./.test(value)) return "mod-flag";
  if (/PowerTag\./.test(value)) return "power-tag";
  if (/^SF_\d+$/.test(value)) return "script-formula-symbol";
  if (/Table\(|\?|Min\(|Max\(/.test(value)) return "formula-expression";
  if (/Bonus_|#|Affix\./.test(value)) return "bonus-or-affix";
  return "other-string";
}

function readCleanRun(buffer, strings, anchorEntryOffset) {
  const entries = [];
  for (let delta = -10; delta <= 10; delta += 1) {
    const entry = readEntry(buffer, strings, anchorEntryOffset + delta * 16);
    if (entry) {
      entries.push({
        delta,
        kind: classifyString(entry.string.value),
        ...entry,
      });
    }
  }
  const anchorIndex = entries.findIndex((entry) => entry.delta === 0);
  let contiguousStartIndex = anchorIndex;
  let contiguousEndIndex = anchorIndex;
  while (contiguousStartIndex > 0 && entries[contiguousStartIndex - 1].delta === entries[contiguousStartIndex].delta - 1) contiguousStartIndex -= 1;
  while (contiguousEndIndex >= 0 && contiguousEndIndex + 1 < entries.length && entries[contiguousEndIndex + 1].delta === entries[contiguousEndIndex].delta + 1) contiguousEndIndex += 1;
  const contiguousEntries = anchorIndex >= 0 ? entries.slice(contiguousStartIndex, contiguousEndIndex + 1) : [];
  return {
    entries,
    contiguousEntries,
    contiguousSpan: contiguousEntries.length,
    contiguousStartOffset: contiguousEntries[0]?.entryOffset ?? null,
    contiguousEndOffset: contiguousEntries.at(-1)?.entryOffset ?? null,
    signature: contiguousEntries.map((entry) => `${entry.delta}:${entry.kind}:${entry.typeOrSize}`).join("|"),
  };
}

function inspectHit(hit) {
  const buffer = fs.readFileSync(hit.decodedFile);
  const strings = extractStrings(buffer);
  const anchors = (hit.directOffsetReferenceSamples ?? []).map((entryOffset) => {
    const entry = readEntry(buffer, strings, entryOffset);
    const entryRefs = findU32Refs(buffer, entryOffset, new Set([entryOffset]));
    const stringRefs = findU32Refs(buffer, hit.stringOffset ?? hit.offset, new Set([entryOffset]));
    const run = readCleanRun(buffer, strings, entryOffset);
    return {
      entryOffset,
      entry,
      entryRefs,
      stringRefs,
      parentEntryRefs: entryRefs.length,
      stringOffsetRefs: stringRefs.length,
      run,
    };
  });
  return {
    assetId: hit.assetId,
    term: hit.term,
    kind: hit.kind,
    decodedFile: hit.decodedFile,
    stringOffset: hit.stringOffset ?? hit.offset,
    trailerSignature: hit.trailerSignature,
    anchors,
  };
}

const structureAudit = readJson(structureAuditFile);
const targetHits = (structureAudit.target?.hits ?? []).filter((hit) => (hit.directOffsetReferenceSamples ?? []).length > 0);
const upgradeHits = (structureAudit.topHits ?? []).filter((hit) => (hit.directOffsetReferenceSamples ?? []).length > 0);
const inspected = [...targetHits, ...upgradeHits].map(inspectHit);
const target = inspected.find((row) => row.assetId === 1663210) ?? null;
const upgrades = inspected.filter((row) => row.assetId !== 1663210);

const allAnchors = inspected.flatMap((row) => row.anchors.map((anchor) => ({ assetId: row.assetId, term: row.term, ...anchor })));
const anchorsWithParentRefs = allAnchors.filter((anchor) => anchor.parentEntryRefs > 0);
const anchorsWithOnlyStringRefs = allAnchors.filter((anchor) => anchor.parentEntryRefs === 0 && anchor.stringOffsetRefs > 0);
const targetParentRefs = target?.anchors?.reduce((sum, anchor) => sum + anchor.parentEntryRefs, 0) ?? 0;
const upgradeParentRefs = upgrades.flatMap((row) => row.anchors).reduce((sum, anchor) => sum + anchor.parentEntryRefs, 0);
const promotionReady = false;
const canModifyReliableDps = false;
const exactParentConsumerProven = false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-offset-reference-graph-v1",
  source: {
    structureAuditFile,
  },
  summary: {
    targetAssetId: 1663210,
    targetTrigger: "Mod.SoilRuler_B",
    inspectedAnchors: allAnchors.length,
    targetAnchors: target?.anchors?.length ?? 0,
    upgradeAnchors: upgrades.flatMap((row) => row.anchors).length,
    anchorsWithParentRefs: anchorsWithParentRefs.length,
    anchorsWithOnlyStringRefs: anchorsWithOnlyStringRefs.length,
    targetParentRefs,
    upgradeParentRefs,
    exactParentConsumerProven,
    promotionReady,
    canModifyReliableDps,
    assessment: {
      kind: anchorsWithParentRefs.length > 0
        ? "delta-parent-offset-reference-parent-candidate-found"
        : "delta-parent-offset-reference-terminal-table-only",
      confidence: anchorsWithParentRefs.length > 0 ? "medium" : "high",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady,
      finding: anchorsWithParentRefs.length > 0
        ? "Certaines entrees de table Mod.* ont des references parentes candidates, a decoder avant toute promotion."
        : "Les offsets directs pointent des chaines Mod.* vers leurs entrees de table, mais ces entrees ne sont pas referencees a leur tour dans les payloads inspectes.",
      nextAction: anchorsWithParentRefs.length > 0
        ? "Decoder les references parentes candidates et verifier leur lien avec une option de build-state."
        : "Chercher le consommateur dans une table superieure hors payload local ou dans les records binaires non textuels; garder SF_33 bloque.",
    },
  },
  target,
  upgrades,
  anchorsWithParentRefs,
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Absence de reference parente exacte vers l'entree Mod.SoilRuler_B.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-offset-reference-graph.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
