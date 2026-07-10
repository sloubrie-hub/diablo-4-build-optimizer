const fs = require("fs");
const path = require("path");

const entriesAuditFile = process.argv[2] ?? "outputs/diablo4-sf33-offset-table-entries/sf33-offset-table-entries.json";
const outDir = process.argv[3] ?? "outputs/diablo4-sf33-offset-table-parent-run";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function align4(value) {
  return Math.ceil(Number(value || 0) / 4) * 4;
}

function printablePreview(buffer, offset, length) {
  return buffer
    .subarray(offset, Math.min(buffer.length, offset + length))
    .toString("ascii")
    .replace(/[^\x20-\x7e]+/g, ".")
    .trim();
}

function asciiInside(buffer, offset, length) {
  const raw = buffer.subarray(offset, Math.min(buffer.length, offset + length));
  const runs = [];
  let start = null;
  for (let index = 0; index <= raw.length; index += 1) {
    const byte = index < raw.length ? raw[index] : 0;
    const printable = byte >= 0x20 && byte <= 0x7e;
    if (printable && start === null) start = index;
    if ((!printable || index === raw.length) && start !== null) {
      const len = index - start;
      if (len >= 4) {
        runs.push({
          relativeOffset: start,
          offset: offset + start,
          length: len,
          value: raw.subarray(start, index).toString("ascii"),
        });
      }
      start = null;
    }
  }
  return runs;
}

function classifyBlock(block) {
  const text = block.asciiRuns.map((run) => run.value).join(" ");
  if (/^Mod\./.test(text)) return "mod-flag-block";
  if (/PowerTag\./.test(text)) return "power-tag-block";
  if (/SF_\d+/.test(text)) return "sf-expression-block";
  if (/Table\(|Min\(|Max\(|\?/.test(text)) return "formula-expression-block";
  if (/Bonus_|_Bonus_|#|Affix\./.test(text)) return "bonus-or-affix-block";
  if (block.asciiRuns.length > 0) return "text-block";
  return "binary-block";
}

function parseEntryBlock(buffer, entry) {
  const length = entry.typeOrSize;
  const alignedLength = align4(length);
  const asciiRuns = asciiInside(buffer, entry.stringOffset, alignedLength);
  const block = {
    delta: entry.delta,
    entryOffset: entry.entryOffset,
    blockOffset: entry.stringOffset,
    length,
    alignedLength,
    nextExpectedOffset: entry.stringOffset + alignedLength,
    zeroA: entry.zeroA,
    zeroB: entry.zeroB,
    preview: printablePreview(buffer, entry.stringOffset, alignedLength),
    asciiRuns,
  };
  return {
    ...block,
    kind: classifyBlock(block),
  };
}

function parseWindow(window) {
  const buffer = fs.readFileSync(window.decodedFile);
  const blocks = window.entries
    .filter((entry) => entry.zeroA === 0 && entry.zeroB === 0 && entry.typeOrSize > 0)
    .map((entry) => parseEntryBlock(buffer, entry));

  const contiguousLinks = [];
  for (let index = 0; index < blocks.length - 1; index += 1) {
    const from = blocks[index];
    const to = blocks[index + 1];
    contiguousLinks.push({
      fromDelta: from.delta,
      toDelta: to.delta,
      expectedNextOffset: from.nextExpectedOffset,
      actualNextOffset: to.blockOffset,
      matches: from.nextExpectedOffset === to.blockOffset,
      fromKind: from.kind,
      toKind: to.kind,
    });
  }

  const anchor = blocks.find((block) => block.delta === 0) ?? null;
  const previous = blocks.find((block) => block.delta === -1) ?? null;
  const next = blocks.find((block) => block.delta === 1) ?? null;
  const localRun = blocks.filter((block) => block.delta >= -1 && block.delta <= 1);
  return {
    assetId: window.assetId,
    anchor: window.anchor,
    summary: {
      blocks: blocks.length,
      contiguousLinks: contiguousLinks.filter((link) => link.matches).length,
      checkedLinks: contiguousLinks.length,
      localRunContiguous: localRun.length === 3
        && previous?.nextExpectedOffset === anchor?.blockOffset
        && anchor?.nextExpectedOffset === next?.blockOffset,
      anchorKind: anchor?.kind ?? null,
      previousKind: previous?.kind ?? null,
      nextKind: next?.kind ?? null,
      nextAscii: next?.asciiRuns?.map((run) => run.value) ?? [],
    },
    previous,
    anchorBlock: anchor,
    next,
    localRun,
    contiguousLinks,
    blocks,
  };
}

const entriesAudit = readJson(entriesAuditFile);
const windows = [entriesAudit.targetWindow, ...(entriesAudit.upgradeWindows ?? [])].filter(Boolean).map(parseWindow);
const target = windows.find((window) => window.assetId === 1663210);
const upgrades = windows.filter((window) => window.assetId !== 1663210);
const targetLocalRunContiguous = target?.summary?.localRunContiguous ?? false;
const upgradeLocalRunsContiguous = upgrades.filter((window) => window.summary.localRunContiguous).length;
const targetNextPowerTag = target?.summary?.nextKind === "power-tag-block";
const upgradeNextPowerTag = upgrades.filter((window) => window.summary.nextKind === "power-tag-block").length;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-offset-table-parent-run-v1",
  source: {
    entriesAuditFile,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    windows: windows.length,
    targetLocalRunContiguous,
    upgradeLocalRunsContiguous,
    targetAnchorKind: target?.summary?.anchorKind ?? null,
    targetPreviousKind: target?.summary?.previousKind ?? null,
    targetNextKind: target?.summary?.nextKind ?? null,
    targetNextAscii: target?.summary?.nextAscii ?? [],
    upgradeNextPowerTag,
    promotionReady: false,
    buildStateReady: false,
    assessment: {
      kind: targetLocalRunContiguous && target?.summary?.anchorKind === "mod-flag-block"
        ? "offset-table-parent-run-confirms-local-mod-flag-record"
        : "offset-table-parent-run-incomplete",
      confidence: targetLocalRunContiguous ? "high" : "medium",
      blocker: "sf33-trigger-build-state-unmapped",
      promotionReady: false,
      finding: targetLocalRunContiguous
        ? "La table d'offsets de Mod.SoilRuler_B pointe vers un run local contigu: bloc precedent, bloc Mod.SoilRuler_B, puis bloc PowerTag SystemsTuningGlobals."
        : "Le run parent autour de Mod.SoilRuler_B n'est pas encore assez contigu pour nommer le record consommateur.",
      nextAction: targetLocalRunContiguous
        ? "Identifier le sens du bloc precedent et du PowerTag SystemsTuningGlobals voisin pour savoir si ce run declare, lit ou active le flag SoilRuler_B."
        : "Elargir la fenetre de table d'offsets avant de chercher le record consommateur.",
    },
  },
  target,
  upgrades,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-offset-table-parent-run.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
