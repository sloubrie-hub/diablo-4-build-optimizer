const fs = require("fs");
const path = require("path");

const patternAuditFile = process.argv[2] ?? "outputs/diablo4-sf33-upgrade-analogy-patterns/sf33-upgrade-analogy-patterns.json";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-build-state-neighborhood";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readU32LeFromHex(hex, byteOffset) {
  const buffer = Buffer.from(hex, "hex");
  if (byteOffset + 4 > buffer.length) return null;
  return buffer.readUInt32LE(byteOffset);
}

function parseDirectRef(ref, targetOffset) {
  const words = [];
  const buffer = Buffer.from(ref.nearbyHex ?? "", "hex");
  for (let byteOffset = 0; byteOffset + 4 <= buffer.length; byteOffset += 4) {
    words.push({
      index: byteOffset / 4,
      byteOffset,
      u32: readU32LeFromHex(ref.nearbyHex, byteOffset),
    });
  }
  const targetIndex = words.findIndex((word) => word.u32 === targetOffset);
  const triplet = targetIndex >= 4 && targetIndex + 4 < words.length
    ? {
        previousOffset: words[targetIndex - 4].u32,
        previousTypeOrSize: words[targetIndex - 3].u32,
        targetOffset: words[targetIndex].u32,
        targetTypeOrSize: words[targetIndex + 1].u32,
        nextOffset: words[targetIndex + 4].u32,
      }
    : null;
  return {
    refOffset: ref.offset,
    targetOffset,
    targetIndex,
    words,
    triplet,
    normalizedTriplet: triplet
      ? {
          previousDelta: triplet.previousOffset - targetOffset,
          previousTypeOrSize: triplet.previousTypeOrSize,
          targetTypeOrSize: triplet.targetTypeOrSize,
          nextDelta: triplet.nextOffset - targetOffset,
        }
      : null,
  };
}

function rowsFromItems(items, role) {
  return items.flatMap((item) =>
    (item.directOffsetReferences ?? []).map((ref) => ({
      role,
      assetId: item.assetId ?? null,
      value: item.value,
      offset: item.offset,
      kind: item.kind ?? null,
      score: item.score ?? null,
      ...parseDirectRef(ref, item.offset),
    }))
  );
}

function signature(row) {
  const t = row.normalizedTriplet;
  if (!t) return "no-triplet";
  return `${t.previousDelta}:${t.previousTypeOrSize}:${t.targetTypeOrSize}:${t.nextDelta}`;
}

const patternAudit = readJson(patternAuditFile);
const triggerRows = rowsFromItems(patternAudit.triggerPattern ?? [], "target-trigger");
const standaloneRows = rowsFromItems(
  (patternAudit.topPatterns ?? []).filter((row) => row.kind === "standalone-mod-flag"),
  "upgrade-standalone-flag"
);
const allRows = [...triggerRows, ...standaloneRows];
const signatures = {};
for (const row of allRows) {
  const key = signature(row);
  signatures[key] ??= [];
  signatures[key].push({
    role: row.role,
    assetId: row.assetId,
    value: row.value,
    offset: row.offset,
    refOffset: row.refOffset,
    normalizedTriplet: row.normalizedTriplet,
  });
}

const triggerSignature = triggerRows[0] ? signature(triggerRows[0]) : null;
const comparableRows = standaloneRows.filter((row) => row.normalizedTriplet?.targetTypeOrSize === triggerRows[0]?.normalizedTriplet?.targetTypeOrSize);
const exactSignatureRows = standaloneRows.filter((row) => signature(row) === triggerSignature);
const hasSharedTargetType = comparableRows.length > 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-build-state-neighborhood-v1",
  source: {
    patternAuditFile,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    triggerDirectRefs: triggerRows.length,
    standaloneUpgradeDirectRefs: standaloneRows.length,
    triggerSignature,
    exactSignatureMatches: exactSignatureRows.length,
    sharedTargetTypeMatches: comparableRows.length,
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: hasSharedTargetType
        ? "build-state-flag-offset-triplet-pattern-found"
        : "build-state-flag-offset-triplet-pattern-not-matched",
      confidence: hasSharedTargetType ? "medium-high" : "medium",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: hasSharedTargetType
        ? "Mod.SoilRuler_B partage le motif de table d'offsets avec des flags Mod.Upgrade* autonomes: offset precedent, offset du flag, offset suivant, avec type/taille cible 24."
        : "Les flags Mod.Upgrade* autonomes ne partagent pas encore de motif de table d'offsets utilisable avec Mod.SoilRuler_B.",
      nextAction: hasSharedTargetType
        ? "Parser les entrees de table d'offsets autour des refs directes pour nommer le champ build-state et verifier si SoilRuler_B est un flag declaratif ou seulement une reference locale."
        : "Elargir l'echantillon de flags Mod.* autonomes avant de parser la table d'offsets.",
    },
  },
  triggerRows,
  standaloneRows,
  comparableRows,
  exactSignatureRows,
  signatures,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-build-state-neighborhood.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
