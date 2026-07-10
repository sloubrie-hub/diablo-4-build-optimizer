const fs = require("fs");
const path = require("path");

const searchFile = process.argv[2] ?? "outputs/diablo4-aspect-equipment-source-candidate-search/external-target-search.json";
const outDir = process.argv[3] ?? "outputs/diablo4-aspect-equipment-source-candidate-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function unique(values) {
  return Array.from(new Set(values.filter((value) => value != null)));
}

function textOfMatch(match) {
  return [
    ...(match.targetHits ?? []).map((hit) => hit.value ?? hit.target),
    ...(match.nearbyStrings ?? []).map((item) => item.value),
  ].filter(Boolean).join(" ");
}

function uiScore(text) {
  const patterns = [
    /(^|\W)Tab_/i,
    /Tooltip/i,
    /ProgressText/i,
    /ClassFilter_/i,
    /\{icon:/i,
    /\{c_/i,
    /Gegenstandstypen|Aspekt|Waffe|Kodex|Vielseitigkeit|Defensiv|Offensiv/i,
    /Filter|Button|Label|Description|Name$/i,
  ];
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function sourceScore(text) {
  const patterns = [
    /Allowed.*(Slot|Item|Type|Equip)/i,
    /(Slot|Equip|Equipment|ItemType).*Mask/i,
    /(Aspect|Power|Legendary|Codex).*(Table|Record|Definition|Data)/i,
    /(Imprint|Extract).*(Power|Aspect|Item|Slot|Type)/i,
    /(Can|Is).*(Imprint|Extract|Apply)/i,
    /SNO\.(ItemType|Power|Affix)/i,
  ];
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function directSlotTerms(match) {
  return unique((match.targetHits ?? [])
    .map((hit) => hit.target ?? hit.value)
    .filter((value) => /allowed|slot|equip.*type|item.*type|imprint|extract/i.test(String(value))));
}

function classifyMatch(match) {
  const text = textOfMatch(match);
  const ui = uiScore(text);
  const source = sourceScore(text);
  const directTerms = directSlotTerms(match);
  const nearby = (match.nearbyStrings ?? []).map((item) => item.value).filter(Boolean);
  const targetTerms = unique((match.targetHits ?? []).map((hit) => hit.target ?? hit.value));
  const hasDirectSlotTerm = directTerms.some((term) => /allowed.*slot|slotmask|equip.*slot|equipment.*slot/i.test(String(term)));
  const kind = hasDirectSlotTerm && source > ui
    ? "direct-slot-source-candidate"
    : source > ui
      ? "aspect-equipment-source-candidate"
      : ui > 0
        ? "ui-or-localization-candidate"
        : "name-only-or-weak-candidate";
  return {
    assetId: match.assetId,
    fileName: match.source?.fileName ?? null,
    blteOffset: match.source?.blteOffset ?? null,
    score: match.score ?? 0,
    kind,
    uiScore: ui,
    sourceScore: source,
    targetTerms,
    directTerms,
    nearbyStrings: nearby.slice(0, 24),
    promotionReady: false,
  };
}

const search = readJson(searchFile);
const rows = (search.matches ?? []).map(classifyMatch)
  .sort((a, b) => b.sourceScore - a.sourceScore || a.uiScore - b.uiScore || b.score - a.score);

const sourceCandidates = rows.filter((row) => row.kind === "aspect-equipment-source-candidate" || row.kind === "direct-slot-source-candidate");
const directSlotCandidates = rows.filter((row) => row.kind === "direct-slot-source-candidate");
const uiCandidates = rows.filter((row) => row.kind === "ui-or-localization-candidate");
const weakCandidates = rows.filter((row) => row.kind === "name-only-or-weak-candidate");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "aspect-equipment-source-candidate-audit-v1",
  source: {
    searchFile,
    searchedAt: search.searchedAt ?? null,
  },
  summary: {
    searchedFiles: search.summary?.files ?? 0,
    decodedDeadbeefEntries: search.summary?.decodedDeadbeefEntries ?? 0,
    targetTerms: search.summary?.targets ?? 0,
    matchingEntries: search.summary?.matchingEntries ?? 0,
    targetGroupsMatched: search.summary?.targetGroupsMatched ?? 0,
    sourceCandidates: sourceCandidates.length,
    directSlotCandidates: directSlotCandidates.length,
    uiCandidates: uiCandidates.length,
    weakCandidates: weakCandidates.length,
    sourceProofReady: false,
    promotionReady: false,
    assessment: {
      kind: directSlotCandidates.length > 0
        ? "aspect-equipment-direct-slot-candidate-needs-decode"
        : sourceCandidates.length > 0
          ? "aspect-equipment-source-candidate-needs-decode"
          : uiCandidates.length > 0
            ? "aspect-equipment-search-ui-or-localization-only"
            : "aspect-equipment-source-candidates-not-found",
      confidence: sourceCandidates.length > 0 ? "medium" : "high",
      slotConstraintReady: false,
      blocker: "slot-data-not-normalized",
      finding: sourceCandidates.length > 0
        ? "Le scan a trouve des candidats source potentiels, mais aucun n'est promouvable sans inspection du payload et champ direct."
        : "Le scan ne trouve aucune table source aspect-equipement promouvable; les hits sont UI/localisation ou faibles.",
      nextAction: sourceCandidates.length > 0
        ? "Decoder/inspecter les meilleurs candidats source avant de modifier allowedSlots."
        : "Chercher une autre famille de records ou une source externe fiable de slots.",
    },
  },
  topSourceCandidates: sourceCandidates.slice(0, 30),
  directSlotCandidates: directSlotCandidates.slice(0, 30),
  uiCandidates: uiCandidates.slice(0, 30),
  weakCandidates: weakCandidates.slice(0, 30),
  safeguards: [
    "Ne pas promouvoir un hit UI/localisation en allowedSlots.",
    "Ne pas promouvoir CanBeImbued, AspectPowerName ou les libelles Codex sans champ source.",
    "Ne pas remplir allowedSlots sans lien explicite entre aspect power et type/slot d'equipement.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aspect-equipment-source-candidate-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
