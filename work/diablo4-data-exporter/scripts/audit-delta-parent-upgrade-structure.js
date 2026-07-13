const fs = require("fs");
const path = require("path");

const expandedDecodePlanFile = process.argv[2] ?? "outputs/diablo4-delta-parent-expanded-decode-plan/delta-parent-expanded-decode-plan.json";
const parentSemanticsFile = process.argv[3] ?? "outputs/diablo4-sf33-parent-run-semantics/sf33-parent-run-semantics.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-parent-upgrade-structure-audit";

const TARGET_ASSET_ID = 1663210;
const TARGET_TRIGGER = "Mod.SoilRuler_B";
const UPGRADE_TERMS = ["Mod.UpgradeB", "Mod.UpgradeC"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readU32(buffer, offset) {
  if (offset < 0 || offset + 4 > buffer.length) return null;
  return buffer.readUInt32LE(offset);
}

function align4(value) {
  return value + ((4 - (value % 4)) % 4);
}

function isPrintable(byte) {
  return byte >= 32 && byte <= 126;
}

function extractStrings(buffer, minLength = 4) {
  const rows = [];
  let start = null;
  for (let i = 0; i <= buffer.length; i += 1) {
    const printable = i < buffer.length && isPrintable(buffer[i]);
    if (printable && start == null) start = i;
    if ((!printable || i === buffer.length) && start != null) {
      const end = i;
      if (end - start >= minLength) {
        rows.push({
          offset: start,
          endOffset: end,
          value: buffer.toString("ascii", start, end),
        });
      }
      start = null;
    }
  }
  return rows;
}

function findAsciiOccurrences(buffer, term) {
  const needle = Buffer.from(term, "ascii");
  const rows = [];
  let cursor = 0;
  while (cursor <= buffer.length - needle.length) {
    const index = buffer.indexOf(needle, cursor);
    if (index < 0) break;
    rows.push(index);
    cursor = index + 1;
  }
  return rows;
}

function countDirectOffsetReferences(buffer, offset) {
  const needle = Buffer.alloc(4);
  needle.writeUInt32LE(offset, 0);
  let count = 0;
  let cursor = 0;
  const sampleOffsets = [];
  while (cursor <= buffer.length - 4) {
    const index = buffer.indexOf(needle, cursor);
    if (index < 0) break;
    count += 1;
    if (sampleOffsets.length < 8) sampleOffsets.push(index);
    cursor = index + 1;
  }
  return { count, sampleOffsets };
}

function classifyOccurrence(buffer, offset, term, stringRows) {
  const exactEnd = offset + term.length;
  const row = stringRows.find((item) => item.offset <= offset && item.endOffset >= exactEnd);
  if (row?.value === term) return "standalone-mod-flag";
  if (/Mod\.Upgrade[BC].*\?/.test(row?.value ?? "")) return "conditional-formula-flag";
  if ((row?.value ?? "").includes(term)) return "embedded-reference";
  const next = buffer[exactEnd];
  if (next === 0) return "standalone-mod-flag";
  return "embedded-reference";
}

function nearestStrings(stringRows, offset, endOffset) {
  const previous = [...stringRows].reverse().find((item) => item.endOffset <= offset && offset - item.endOffset <= 96);
  const next = stringRows.find((item) => item.offset >= endOffset && item.offset - endOffset <= 128);
  return { previous, next };
}

function signatureAfter(buffer, start, words = 4) {
  const values = [];
  for (let i = 0; i < words; i += 1) {
    const value = readU32(buffer, start + i * 4);
    if (value == null) break;
    values.push(value);
  }
  return values;
}

function inspectTermInFile({ assetId, decodedFile, terms }) {
  const buffer = fs.readFileSync(decodedFile);
  const strings = extractStrings(buffer);
  const hits = [];
  for (const term of terms) {
    for (const offset of findAsciiOccurrences(buffer, term)) {
      const row = strings.find((item) => item.offset <= offset && item.endOffset >= offset + term.length);
      const kind = classifyOccurrence(buffer, offset, term, strings);
      const alignedEnd = align4((row?.endOffset ?? offset + term.length) + 1);
      const suffixWords = signatureAfter(buffer, alignedEnd, 4);
      const trailerSignature = suffixWords.slice(0, 2).join(":");
      const directRefs = countDirectOffsetReferences(buffer, offset);
      const nearby = nearestStrings(strings, offset, row?.endOffset ?? offset + term.length);
      hits.push({
        assetId,
        decodedFile,
        term,
        offset,
        stringOffset: row?.offset ?? offset,
        stringValue: row?.value ?? term,
        kind,
        directOffsetReferenceCount: directRefs.count,
        directOffsetReferenceSamples: directRefs.sampleOffsets,
        suffixWords,
        trailerSignature,
        previousString: nearby.previous ? { offset: nearby.previous.offset, value: nearby.previous.value } : null,
        nextString: nearby.next ? { offset: nearby.next.offset, value: nearby.next.value } : null,
        hasPowerTagNeighbor: /PowerTag\./.test(nearby.previous?.value ?? "") || /PowerTag\./.test(nearby.next?.value ?? ""),
      });
    }
  }
  return hits;
}

function unique(values) {
  return [...new Set(values.filter((value) => value != null))];
}

const expandedDecodePlan = readJson(expandedDecodePlanFile);
const parentSemantics = fs.existsSync(parentSemanticsFile) ? readJson(parentSemanticsFile) : null;
const targetDecodedFile = parentSemantics?.target?.decodedFile ?? "outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin";
const targetHits = inspectTermInFile({
  assetId: TARGET_ASSET_ID,
  decodedFile: targetDecodedFile,
  terms: [TARGET_TRIGGER],
});

const candidates = expandedDecodePlan.candidates ?? [];
const assetReports = candidates.map((candidate) => {
  const decodedPayloads = candidate.decodedPayloads ?? [];
  const hits = decodedPayloads.flatMap((decodedFile) => inspectTermInFile({
    assetId: candidate.assetId,
    decodedFile,
    terms: UPGRADE_TERMS,
  }));
  const standalone = hits.filter((hit) => hit.kind === "standalone-mod-flag");
  const conditional = hits.filter((hit) => hit.kind === "conditional-formula-flag");
  return {
    assetId: candidate.assetId,
    rank: candidate.rank,
    confidence: candidate.confidence,
    decodedPayloads,
    summary: {
      hits: hits.length,
      standaloneFlags: standalone.length,
      conditionalFormulaFlags: conditional.length,
      directOffsetReferenceHits: hits.filter((hit) => hit.directOffsetReferenceCount > 0).length,
      trailerMatchesTarget: hits.filter((hit) => hit.trailerSignature === "5:90").length,
      powerTagNeighbors: hits.filter((hit) => hit.hasPowerTagNeighbor).length,
    },
    hits,
  };
});

const allUpgradeHits = assetReports.flatMap((asset) => asset.hits);
const standaloneHits = allUpgradeHits.filter((hit) => hit.kind === "standalone-mod-flag");
const targetTrailerSignature = parentSemantics?.summary?.targetModTrailerSignature ?? targetHits[0]?.trailerSignature ?? null;
const trailerMatches = allUpgradeHits.filter((hit) => hit.trailerSignature === targetTrailerSignature);
const exactParentConsumerProven = false;
const reusablePatternCandidate = standaloneHits.length >= 2 && trailerMatches.length >= 2;
const promotionReady = false;
const canModifyReliableDps = false;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-upgrade-structure-audit-v1",
  source: {
    expandedDecodePlanFile,
    parentSemanticsFile: parentSemantics ? parentSemanticsFile : null,
  },
  summary: {
    targetAssetId: TARGET_ASSET_ID,
    targetTrigger: TARGET_TRIGGER,
    targetTrailerSignature,
    upgradeAnalogyAssets: assetReports.length,
    upgradeHits: allUpgradeHits.length,
    standaloneFlags: standaloneHits.length,
    conditionalFormulaFlags: allUpgradeHits.filter((hit) => hit.kind === "conditional-formula-flag").length,
    directOffsetReferenceHits: allUpgradeHits.filter((hit) => hit.directOffsetReferenceCount > 0).length,
    trailerMatchesTarget: trailerMatches.length,
    trailerMatchAssets: unique(trailerMatches.map((hit) => hit.assetId)),
    reusablePatternCandidate,
    exactParentConsumerProven,
    promotionReady,
    canModifyReliableDps,
    assessment: {
      kind: reusablePatternCandidate
        ? "delta-parent-upgrade-structure-pattern-only"
        : "delta-parent-upgrade-structure-insufficient-pattern",
      confidence: reusablePatternCandidate ? "medium-high" : "medium",
      promotionReady,
      blocker: "sf33-trigger-build-state-unmapped",
      finding: reusablePatternCandidate
        ? "Les analogies UpgradeB/C confirment un motif structurel de flag Mod.* comparable a SoilRuler, mais aucun parent/consommateur exact ne prouve l'activation SF_33."
        : "Les analogies UpgradeB/C ne suffisent pas encore a isoler un motif parent/consommateur reutilisable pour SoilRuler.",
      nextAction: reusablePatternCandidate
        ? "Chercher maintenant la table ou le record parent qui reference ces flags Mod.*; garder le delta SoilRuler en candidat bloque."
        : "Elargir les analogies Mod.* autonomes avant toute tentative de mapping SF_33.",
    },
  },
  target: {
    decodedFile: targetDecodedFile,
    hits: targetHits,
  },
  assets: assetReports,
  topHits: allUpgradeHits
    .sort((a, b) => {
      const kindDelta = Number(b.kind === "standalone-mod-flag") - Number(a.kind === "standalone-mod-flag");
      if (kindDelta) return kindDelta;
      return b.directOffsetReferenceCount - a.directOffsetReferenceCount || a.assetId - b.assetId;
    })
    .slice(0, 20),
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Le motif structurel n'est pas une preuve de trigger ni d'uptime.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-upgrade-structure-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
