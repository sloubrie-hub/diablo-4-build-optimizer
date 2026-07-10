const fs = require("fs");
const path = require("path");

const assetId = Number(process.argv[2] ?? 1461593);
const externalRefsFile = process.argv[3] ?? "outputs/diablo4-external-references/external-references.json";
const externalTargetSearchFile = process.argv[4] ?? "outputs/diablo4-external-target-search/external-target-search.json";
const outDir = process.argv[5] ?? "outputs/diablo4-aspect-slot-external-bridge";

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function slotFromName(value) {
  const text = String(value ?? "");
  const checks = [
    ["helm", /\bhelm[_-]/i],
    ["chest", /\bchest[_-]/i],
    ["gloves", /\bgloves[_-]/i],
    ["pants", /\bpants[_-]/i],
    ["boots", /\bboots[_-]/i],
    ["amulet", /\bamulet[_-]/i],
    ["ring", /\bring[_-]/i],
    ["shield", /\b(?:1h)?shield[_-]/i],
    ["weapon", /\b(?:1h|2h|weapon|sword|axe|mace|bow|staff|wand|dagger|polearm|scythe)[_-]/i],
  ];
  return checks.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

function collectAssetCandidates(externalRefs, wantedAssetId) {
  const rows = [];
  const assets = externalRefs?.assets ?? [];
  for (const asset of assets) {
    if (Number(asset.assetId) !== wantedAssetId) continue;
    const identity = asset.externalIdentity ?? asset.identity ?? {};
    for (const candidate of identity.candidates ?? []) {
      const slot = slotFromName(candidate);
      rows.push({
        source: "external-references",
        assetId: Number(asset.assetId),
        candidate,
        slot,
        kind: candidate.split(":")[0] ?? "unknown",
        directSlotProof: false,
      });
    }
  }
  for (const row of externalRefs?.summary?.topAssetsByExternalScore ?? []) {
    if (Number(row.assetId) !== wantedAssetId) continue;
    for (const candidate of row.identity?.candidates ?? []) {
      const slot = slotFromName(candidate);
      rows.push({
        source: "external-references-summary",
        assetId: Number(row.assetId),
        candidate,
        slot,
        kind: candidate.split(":")[0] ?? "unknown",
        directSlotProof: false,
      });
    }
  }
  return rows;
}

function collectSearchMatches(externalTargetSearch, wantedAssetId) {
  const rows = [];
  const topMatches = externalTargetSearch?.summary?.topMatches ?? [];
  for (const match of topMatches) {
    if (Number(match.assetId) !== wantedAssetId) continue;
    for (const target of match.targets ?? []) {
      const slot = slotFromName(target);
      rows.push({
        source: "external-target-search",
        assetId: Number(match.assetId),
        fileName: match.fileName,
        blteOffset: match.blteOffset,
        score: match.score,
        candidate: target,
        slot,
        kind: target.includes("#") ? "hash-target" : "text-target",
        directSlotProof: false,
      });
    }
  }
  return rows;
}

function classifyCandidate(row) {
  if (!row.slot) {
    return {
      ...row,
      assessment: "no-slot-name",
      usableForAllowedSlots: false,
      reason: "la reference ne contient pas de nom d'emplacement equipement",
    };
  }
  if (/^NameCandidate:Affix_|^HashTarget:|Affix_.*#/i.test(row.candidate)) {
    return {
      ...row,
      assessment: "slot-name-in-affix-value-reference-not-proof",
      usableForAllowedSlots: false,
      reason: "le nom contient un slot, mais la reference pointe une valeur d'affixe/hash target, pas un champ allowedSlots",
    };
  }
  return {
    ...row,
    assessment: "slot-name-needs-source-field-proof",
    usableForAllowedSlots: false,
    reason: "le nom suggere un slot, mais aucun champ source de slot n'est decode",
  };
}

const externalRefs = readJsonIfExists(externalRefsFile);
const externalTargetSearch = readJsonIfExists(externalTargetSearchFile);
const candidates = [
  ...collectAssetCandidates(externalRefs, assetId),
  ...collectSearchMatches(externalTargetSearch, assetId),
].map(classifyCandidate);

const slotNameCandidates = candidates.filter((row) => row.slot);
const usableCandidates = candidates.filter((row) => row.usableForAllowedSlots);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-slot-external-bridge-v1",
  input: {
    assetId,
    externalRefsFile,
    externalTargetSearchFile,
  },
  summary: {
    candidates: candidates.length,
    slotNameCandidates: slotNameCandidates.length,
    usableAllowedSlotProofs: usableCandidates.length,
    inferredSlots: Array.from(new Set(slotNameCandidates.map((row) => row.slot))).sort(),
    promotionReady: false,
    assessment: {
      kind: usableCandidates.length > 0
        ? "external-slot-proof-needs-review"
        : slotNameCandidates.length > 0
          ? "external-slot-name-only-not-proof"
          : "external-slot-bridge-not-found",
      confidence: slotNameCandidates.length > 0 ? "medium-high" : "medium",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: slotNameCandidates.length > 0
        ? "Des noms externes contiennent un slot, mais ils decrivent des cibles de valeur d'affixe/hash et ne prouvent pas allowedSlots."
        : "Aucun nom externe exploitable ne relie l'aspect a un slot.",
      nextAction: "Chercher un champ ou une table allowedSlots/aspect-equipment au lieu de promouvoir les noms de valeurs d'affixe.",
    },
  },
  candidates,
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-slot-external-bridge.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
