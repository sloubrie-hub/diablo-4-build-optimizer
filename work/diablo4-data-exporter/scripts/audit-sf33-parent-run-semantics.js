const fs = require("fs");
const path = require("path");

const parentRunFile = process.argv[2] ?? "outputs/diablo4-sf33-offset-table-parent-run/sf33-offset-table-parent-run.json";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-parent-run-semantics";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findDecodedPayload(assetId) {
  const dir = path.join("outputs", `diablo4-source-asset-${assetId}-payload`);
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".decoded.bin"))
    .map((name) => path.join(dir, name))
    .sort()[0] ?? null;
}

function readWords(buffer, offset, length) {
  const words = [];
  for (let cursor = offset; cursor + 4 <= offset + length && cursor + 4 <= buffer.length; cursor += 4) {
    words.push({
      offset: cursor,
      relativeOffset: cursor - offset,
      uint32: buffer.readUInt32LE(cursor),
      int32: buffer.readInt32LE(cursor),
      float32: Number(buffer.readFloatLE(cursor).toPrecision(7)),
      hex: buffer.subarray(cursor, cursor + 4).toString("hex"),
      ascii: buffer.subarray(cursor, cursor + 4).toString("ascii").replace(/[^\x20-\x7e]+/g, "."),
    });
  }
  return words;
}

function blockBytes(buffer, block) {
  return buffer.subarray(block.blockOffset, Math.min(buffer.length, block.blockOffset + block.alignedLength));
}

function analyzeModBlock(buffer, block) {
  const bytes = blockBytes(buffer, block);
  const nul = bytes.indexOf(0);
  const trailerStart = nul >= 0 ? Math.ceil((nul + 1) / 4) * 4 : bytes.length;
  const trailerWords = readWords(buffer, block.blockOffset + trailerStart, Math.max(0, block.alignedLength - trailerStart));
  return {
    value: block.asciiRuns?.[0]?.value ?? null,
    length: block.length,
    alignedLength: block.alignedLength,
    trailerStart,
    trailerWords,
    trailerSignature: trailerWords.map((word) => word.uint32).join(":"),
  };
}

function analyzeNeighborBlock(buffer, block) {
  const firstAscii = block.asciiRuns?.[0] ?? null;
  const prefixLength = firstAscii ? firstAscii.relativeOffset : Math.min(16, block.alignedLength);
  const prefixWords = readWords(buffer, block.blockOffset, prefixLength);
  return {
    kind: block.kind,
    length: block.length,
    alignedLength: block.alignedLength,
    firstAscii: firstAscii?.value ?? null,
    prefixWords,
    prefixSignature: prefixWords.map((word) => word.uint32).join(":"),
  };
}

function analyzePreviousBlock(buffer, block) {
  const words = readWords(buffer, block.blockOffset, block.alignedLength);
  return {
    kind: block.kind,
    length: block.length,
    alignedLength: block.alignedLength,
    words,
    signature: words.map((word) => word.uint32).join(":"),
  };
}

function analyzeWindow(window) {
  const decodedFile = findDecodedPayload(window.assetId);
  if (!decodedFile) return { assetId: window.assetId, error: "decoded-payload-not-found" };
  const buffer = fs.readFileSync(decodedFile);
  return {
    assetId: window.assetId,
    decodedFile,
    anchor: window.anchor,
    previous: analyzePreviousBlock(buffer, window.previous),
    mod: analyzeModBlock(buffer, window.anchorBlock),
    next: analyzeNeighborBlock(buffer, window.next),
  };
}

const parentRun = readJson(parentRunFile);
const target = analyzeWindow(parentRun.target);
const upgrades = (parentRun.upgrades ?? []).map(analyzeWindow);
const targetModTrailerMatches = upgrades.filter((row) => row.mod?.trailerSignature === target.mod?.trailerSignature).length;
const targetNextPrefixMatches = upgrades.filter((row) => row.next?.prefixSignature === target.next?.prefixSignature).length;
const powerTagNeighbors = [target, ...upgrades].filter((row) => row.next?.kind === "power-tag-block").length;
const globalTuningNeighbors = [target, ...upgrades].filter((row) => /SystemsTuningGlobals/i.test(row.next?.firstAscii ?? "")).length;
const previousSignatureMatches = upgrades.filter((row) => row.previous?.signature === target.previous?.signature).length;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-parent-run-semantics-v1",
  source: {
    parentRunFile,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    comparedUpgradeRuns: upgrades.length,
    targetModTrailerSignature: target.mod?.trailerSignature ?? null,
    upgradeModTrailerMatches: targetModTrailerMatches,
    targetNextPrefixSignature: target.next?.prefixSignature ?? null,
    upgradeNextPrefixExactMatches: targetNextPrefixMatches,
    previousSignatureMatches,
    powerTagNeighbors,
    globalTuningNeighbors,
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: targetModTrailerMatches === upgrades.length && powerTagNeighbors > 0
        ? "parent-run-semantics-confirm-mod-flag-read-context"
        : "parent-run-semantics-partial",
      confidence: targetModTrailerMatches === upgrades.length ? "high" : "medium",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: targetModTrailerMatches === upgrades.length
        ? "Le run confirme une forme commune de lecture/contexte de flag Mod.*: le trailer du bloc Mod.SoilRuler_B correspond aux trailers Mod.Upgrade*, avec un voisin PowerTag global pour certains runs."
        : "Le run local confirme le flag, mais la semantique des blocs voisins reste partielle.",
      nextAction: "Chercher une occurrence ou un record parent qui relie Mod.SoilRuler_B a une option de build-state nommee; ne pas assimiler le voisin SystemsTuningGlobals a une activation gameplay.",
    },
  },
  target,
  upgrades,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-parent-run-semantics.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
