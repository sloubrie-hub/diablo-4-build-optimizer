const fs = require("fs");
const path = require("path");

const parentSemanticsFile = process.argv[2] ?? "outputs/diablo4-sf33-parent-run-semantics/sf33-parent-run-semantics.json";
const namedSourceFile = process.argv[3] ?? "outputs/diablo4-sf33-named-build-state-source/sf33-named-build-state-source.json";
const activationSearchFile = process.argv[4] ?? "outputs/diablo4-sf33-activation-source-search-audit/sf33-activation-source-search-audit.json";
const powerTagHashFile = process.argv[5] ?? "outputs/diablo4-sf33-power-tag-hash-corpus/sf33-power-tag-hash-corpus.json";
const outDir = process.argv[6] ?? "outputs/diablo4-sf33-binary-parent-source";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function compactRun(row) {
  return {
    assetId: row.assetId ?? null,
    anchor: row.anchor?.value ?? null,
    decodedFile: row.decodedFile ?? null,
    previousSignature: row.previous?.signature ?? null,
    modTrailerSignature: row.mod?.trailerSignature ?? null,
    nextKind: row.next?.kind ?? null,
    nextFirstAscii: row.next?.firstAscii ?? null,
    nextPrefixSignature: row.next?.prefixSignature ?? null,
  };
}

const parentSemantics = readJson(parentSemanticsFile);
const namedSource = readJsonIfExists(namedSourceFile);
const activationSearch = readJsonIfExists(activationSearchFile);
const powerTagHash = readJsonIfExists(powerTagHashFile);

const summary = parentSemantics.summary ?? {};
const namedSummary = namedSource?.summary ?? {};
const activationSummary = activationSearch?.summary ?? {};
const powerTagSummary = powerTagHash?.summary ?? {};
const target = compactRun(parentSemantics.target ?? {});
const upgrades = (parentSemantics.upgrades ?? []).map(compactRun);

const comparedUpgradeRuns = summary.comparedUpgradeRuns ?? upgrades.length;
const modTrailerMatchesAll = comparedUpgradeRuns > 0 && summary.upgradeModTrailerMatches === comparedUpgradeRuns;
const hasExactNeighborConsumerMatch =
  (summary.upgradeNextPrefixExactMatches ?? 0) > 0 ||
  (summary.previousSignatureMatches ?? 0) > 0;
const hasNamedExternalSource = (namedSummary.externalNameHits ?? 0) > 0;
const hasExternalTriggerSource = (activationSummary.externalTriggerHits ?? 0) > 0;
const hasExternalPowerTagHash = (powerTagSummary.externalTargetPowerTagContexts ?? 0) > 0;
const buildStateReady = false;
const promotionReady = false;

const assessmentKind = hasNamedExternalSource || hasExternalTriggerSource || hasExternalPowerTagHash
  ? "sf33-binary-parent-source-has-external-candidate"
  : modTrailerMatchesAll && !hasExactNeighborConsumerMatch
    ? "sf33-binary-parent-source-not-proven-local-context-only"
    : "sf33-binary-parent-source-inconclusive";

const assessment = {
  kind: assessmentKind,
  confidence: modTrailerMatchesAll && !hasExactNeighborConsumerMatch && !hasNamedExternalSource && !hasExternalPowerTagHash ? "high" : "medium",
  blocker: "sf33-trigger-build-state-unmapped",
  promotionReady,
  buildStateReady,
  finding: assessmentKind === "sf33-binary-parent-source-not-proven-local-context-only"
    ? "Le motif binaire local confirme un contexte de lecture/declaration de flag Mod.*, mais aucun record parent ou consommateur externe ne prouve l'activation de Mod.SoilRuler_B."
    : assessmentKind === "sf33-binary-parent-source-has-external-candidate"
      ? "Une piste externe existe encore pour le parent binaire ou nomme; elle doit etre decodee avant toute promotion."
      : "La piste binaire parent reste partielle et ne permet pas de mapper l'activation SF_33.",
  nextAction: assessmentKind === "sf33-binary-parent-source-not-proven-local-context-only"
    ? "Elargir a une recherche binaire hors texte sur le corpus complet, ou garder SF_33 bloque et avancer un autre blocage sans activer la branche."
    : "Decoder les candidats externes ou etendre la recherche binaire avant toute activation SF_33.",
  evidence: {
    target,
    upgrades,
    comparedUpgradeRuns,
    targetModTrailerSignature: summary.targetModTrailerSignature ?? null,
    upgradeModTrailerMatches: summary.upgradeModTrailerMatches ?? 0,
    targetNextPrefixSignature: summary.targetNextPrefixSignature ?? null,
    upgradeNextPrefixExactMatches: summary.upgradeNextPrefixExactMatches ?? 0,
    previousSignatureMatches: summary.previousSignatureMatches ?? 0,
    powerTagNeighbors: summary.powerTagNeighbors ?? 0,
    globalTuningNeighbors: summary.globalTuningNeighbors ?? 0,
    externalNameHits: namedSummary.externalNameHits ?? 0,
    externalTriggerHits: activationSummary.externalTriggerHits ?? 0,
    targetPowerTagHash: powerTagSummary.targetHash ?? null,
    targetPowerTagContexts: powerTagSummary.targetPowerTagContexts ?? null,
    externalTargetPowerTagContexts: powerTagSummary.externalTargetPowerTagContexts ?? null,
    directTargetHashHits: powerTagSummary.directTargetHashHits ?? null,
    externalDirectTargetHashHits: powerTagSummary.externalDirectTargetHashHits ?? null,
    powerTagHashAssessment: powerTagSummary.assessment?.kind ?? null,
    modTrailerMatchesAll,
    hasExactNeighborConsumerMatch,
    hasNamedExternalSource,
    hasExternalTriggerSource,
    hasExternalPowerTagHash,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-binary-parent-source-audit-v1",
  source: {
    parentSemanticsFile,
    namedSourceFile,
    activationSearchFile,
    powerTagHashFile: powerTagHash ? powerTagHashFile : null,
  },
  summary: {
    targetTrigger: "Mod.SoilRuler_B",
    comparedUpgradeRuns,
    modTrailerMatchesAll,
    hasExactNeighborConsumerMatch,
    externalNameHits: namedSummary.externalNameHits ?? 0,
    externalTriggerHits: activationSummary.externalTriggerHits ?? 0,
    promotionReady,
    buildStateReady,
    assessment,
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-binary-parent-source.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
