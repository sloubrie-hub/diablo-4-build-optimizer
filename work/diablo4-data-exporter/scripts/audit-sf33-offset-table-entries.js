const fs = require("fs");
const path = require("path");

const neighborhoodFile = process.argv[2] ?? "outputs/diablo4-sf33-build-state-neighborhood/sf33-build-state-neighborhood.json";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-offset-table-entries";

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

function extractStrings(buffer) {
  const strings = [];
  let start = null;
  for (let index = 0; index <= buffer.length; index += 1) {
    const byte = index < buffer.length ? buffer[index] : 0;
    const printable = byte >= 0x20 && byte <= 0x7e;
    if (printable && start === null) start = index;
    if ((!printable || index === buffer.length) && start !== null) {
      const length = index - start;
      if (length >= 4) {
        strings.push({
          offset: start,
          endOffset: index - 1,
          length,
          value: buffer.subarray(start, index).toString("ascii"),
        });
      }
      start = null;
    }
  }
  return strings;
}

function stringAt(strings, offset) {
  return strings.find((item) => item.offset === offset) ?? null;
}

function readEntry(buffer, entryOffset, strings) {
  if (entryOffset < 0 || entryOffset + 16 > buffer.length) return null;
  const stringOffset = buffer.readUInt32LE(entryOffset);
  const typeOrSize = buffer.readUInt32LE(entryOffset + 4);
  const zeroA = buffer.readUInt32LE(entryOffset + 8);
  const zeroB = buffer.readUInt32LE(entryOffset + 12);
  const targetString = stringAt(strings, stringOffset);
  return {
    entryOffset,
    stringOffset,
    typeOrSize,
    zeroA,
    zeroB,
    isCleanOffsetEntry: Boolean(targetString && zeroA === 0 && zeroB === 0),
    string: targetString
      ? {
          offset: targetString.offset,
          endOffset: targetString.endOffset,
          length: targetString.length,
          value: targetString.value,
        }
      : null,
  };
}

function classifyEntry(entry) {
  const value = entry.string?.value ?? "";
  if (!entry.isCleanOffsetEntry) return "not-clean-offset-entry";
  if (/^Mod\./.test(value)) return "mod-flag";
  if (/PowerTag\./.test(value)) return "power-tag";
  if (/SF_\d+/.test(value)) return "script-formula";
  if (/Bonus_|_Bonus_|Affix\.|#/.test(value)) return "bonus-or-affix";
  if (/Table\(|Min\(|Max\(|\?/.test(value)) return "formula-expression";
  return "other-string";
}

function parseWindow(row, assetId) {
  const decodedFile = findDecodedPayload(assetId);
  if (!decodedFile) {
    return {
      assetId,
      value: row.value,
      error: "decoded-payload-not-found",
    };
  }
  const buffer = fs.readFileSync(decodedFile);
  const strings = extractStrings(buffer);
  const anchorEntryOffset = row.refOffset;
  const entries = [];
  for (let delta = -6; delta <= 6; delta += 1) {
    const entry = readEntry(buffer, anchorEntryOffset + delta * 16, strings);
    if (entry) entries.push({ delta, ...entry, role: delta === 0 ? "anchor" : delta < 0 ? "before" : "after", kind: classifyEntry(entry) });
  }
  const cleanEntries = entries.filter((entry) => entry.isCleanOffsetEntry);
  return {
    assetId,
    decodedFile,
    anchor: {
      value: row.value,
      stringOffset: row.offset,
      entryOffset: row.refOffset,
      typeOrSize: row.normalizedTriplet?.targetTypeOrSize ?? null,
    },
    summary: {
      entries: entries.length,
      cleanEntries: cleanEntries.length,
      modFlags: cleanEntries.filter((entry) => entry.kind === "mod-flag").length,
      powerTags: cleanEntries.filter((entry) => entry.kind === "power-tag").length,
      formulaExpressions: cleanEntries.filter((entry) => entry.kind === "formula-expression").length,
      scriptFormulas: cleanEntries.filter((entry) => entry.kind === "script-formula").length,
      entryTypes: [...new Set(cleanEntries.map((entry) => entry.typeOrSize))],
    },
    entries,
  };
}

const neighborhood = readJson(neighborhoodFile);
const targetRows = (neighborhood.triggerRows ?? []).map((row) => ({ ...row, assetId: 1663210, role: "target-trigger" }));
const upgradeRows = neighborhood.standaloneRows ?? [];
const windows = [...targetRows, ...upgradeRows].map((row) => parseWindow(row, row.assetId));

const targetWindow = windows.find((window) => window.assetId === 1663210);
const upgradeWindows = windows.filter((window) => window.assetId !== 1663210);
const targetAnchor = targetWindow?.entries?.find((entry) => entry.role === "anchor") ?? null;
const upgradeAnchors = upgradeWindows.map((window) => window.entries?.find((entry) => entry.role === "anchor")).filter(Boolean);
const allAnchorsClean = Boolean(targetAnchor?.isCleanOffsetEntry) && upgradeAnchors.every((entry) => entry.isCleanOffsetEntry);
const targetAnchorIsModFlag = targetAnchor?.kind === "mod-flag";
const upgradeAnchorsAreModFlags = upgradeAnchors.every((entry) => entry.kind === "mod-flag");
const neighborPowerTagAfterTarget = targetWindow?.entries?.some((entry) => entry.delta > 0 && entry.kind === "power-tag") ?? false;
const neighborPowerTagAfterUpgrade = upgradeWindows.some((window) => window.entries?.some((entry) => entry.delta > 0 && entry.kind === "power-tag"));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-offset-table-entries-v1",
  source: {
    neighborhoodFile,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    windows: windows.length,
    cleanAnchorEntries: [targetAnchor, ...upgradeAnchors].filter((entry) => entry?.isCleanOffsetEntry).length,
    targetAnchorIsModFlag,
    upgradeAnchorsAreModFlags,
    targetAnchorTypeOrSize: targetAnchor?.typeOrSize ?? null,
    upgradeAnchorTypesOrSizes: [...new Set(upgradeAnchors.map((entry) => entry.typeOrSize))],
    neighborPowerTagAfterTarget,
    neighborPowerTagAfterUpgrade,
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: allAnchorsClean && targetAnchorIsModFlag && upgradeAnchorsAreModFlags
        ? "offset-table-confirms-mod-flag-entry-shape"
        : "offset-table-entry-shape-incomplete",
      confidence: allAnchorsClean && targetAnchorIsModFlag ? "high" : "medium",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: allAnchorsClean && targetAnchorIsModFlag && upgradeAnchorsAreModFlags
        ? "La table d'offsets confirme que Mod.SoilRuler_B occupe une entree Mod.* propre, de meme forme que les flags Mod.Upgrade* autonomes."
        : "La table d'offsets ne suffit pas encore a confirmer une forme de flag Mod.* comparable.",
      nextAction: allAnchorsClean && targetAnchorIsModFlag
        ? "Chercher la table ou le record parent qui consomme cette entree Mod.SoilRuler_B pour relier le flag a une option de build-state."
        : "Elargir la fenetre ou ajouter d'autres flags Mod.* avant de conclure sur la forme d'entree.",
    },
  },
  targetWindow,
  upgradeWindows,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-offset-table-entries.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
