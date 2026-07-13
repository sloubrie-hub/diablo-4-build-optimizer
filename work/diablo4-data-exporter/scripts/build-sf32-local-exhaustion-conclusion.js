const fs = require("fs");
const path = require("path");

const sf32DecisionFile = process.argv[2] ?? "outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json";
const externalEvidenceIntakeFile = process.argv[3] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const externalEvidenceBridgeFile = process.argv[4] ?? "outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json";
const reliableGatesFile = process.argv[5] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[6] ?? "outputs/diablo4-sf32-local-exhaustion-conclusion";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function gateById(gates, id) {
  return gates.find((gate) => gate.id === id) ?? null;
}

const sf32Decision = readJson(sf32DecisionFile);
const externalEvidenceIntake = readJson(externalEvidenceIntakeFile);
const externalEvidenceBridge = readJson(externalEvidenceBridgeFile);
const reliableGates = readJson(reliableGatesFile);

const decision = sf32Decision.summary ?? {};
const assessment = decision.assessment ?? {};
const evidence = assessment.evidence ?? {};
const promotionGates = decision.promotionGates ?? [];
const failedGates = promotionGates.filter((gate) => gate.status !== "passed");
const sourceAssessments = evidence.sourceAssessments ?? {};

const localEvidenceChecks = [
  {
    id: "selector-owner-fields",
    status: gateById(promotionGates, "single-selector-layout")?.status ?? "unknown",
    finding: "selector 949 reste en layouts mixtes.",
    metric: {
      selector949Layouts: evidence.selector949Layouts ?? null,
      layoutIds: evidence.selector949LayoutIds ?? [],
    },
    sourceAssessment: sourceAssessments.ownerFields ?? null,
  },
  {
    id: "second-compact-selector-949",
    status: gateById(promotionGates, "second-compact-proof")?.status ?? "unknown",
    finding: "aucun second compact selector 949 hors cible n'est disponible.",
    metric: {
      selector949Assets: evidence.selector949Assets ?? null,
      secondCompact949Assets: evidence.secondCompact949Assets ?? null,
    },
    sourceAssessment: sourceAssessments.bonusCoverage ?? null,
  },
  {
    id: "metadata-12337-scale-10",
    status: gateById(promotionGates, "metadata-selector-specificity")?.status ?? "unknown",
    finding: "metadata 12337 / scale 10 est transverse et ne prouve pas selector 949.",
    metric: {
      metadata12337Hits: evidence.metadata12337Hits ?? null,
      selectorCounts: evidence.metadata12337SelectorCounts ?? {},
    },
    sourceAssessment: sourceAssessments.metadataCorpus ?? null,
  },
  {
    id: "named-local-source-table",
    status: gateById(promotionGates, "named-source-table")?.status ?? "unknown",
    finding: "aucune table locale nommee ne mappe selector 949 ou metadata 12337.",
    metric: {
      independentTableCandidates: evidence.independentTableCandidates ?? null,
      usefulTableCandidateContexts: evidence.usefulTableCandidateContexts ?? null,
      tableNumericUsefulContexts: evidence.tableNumericUsefulContexts ?? null,
    },
    sourceAssessment: sourceAssessments.localTable ?? null,
  },
  {
    id: "fresh-record-source-links",
    status: gateById(promotionGates, "fresh-record-source-links")?.status ?? "unknown",
    finding: "les anciens liens record/header ne sont pas frais pour l'installation actuelle.",
    metric: {
      staleOffsets: evidence.staleOffsets ?? null,
      freshMatches: evidence.freshMatches ?? null,
    },
    sourceAssessment: sourceAssessments.freshness ?? null,
  },
  {
    id: "compact-cross-selector-analogy",
    status: evidence.compactAnalogyCrossSelector ? "failed" : "unknown",
    finding: "l'analogie compacte existe sur plusieurs selecteurs et ne prouve pas l'ownership.",
    metric: {
      compactAnalogySelectors: evidence.compactAnalogySelectors ?? [],
      compactAnalogyAssets: evidence.compactAnalogyAssets ?? [],
    },
    sourceAssessment: sourceAssessments.compactAnalogy ?? null,
  },
  {
    id: "numeric-table-contexts",
    status: (evidence.tableNumericUsefulContexts ?? 0) > 0 ? "review" : "failed",
    finding: "les contextes numeriques locaux ne constituent pas une source nommee.",
    metric: {
      exactIntegerHits: evidence.tableNumericExactIntegerHits ?? null,
      exactStringHits: evidence.tableNumericExactStringHits ?? null,
      usefulContexts: evidence.tableNumericUsefulContexts ?? null,
      potentialSourceContexts: evidence.tableNumericPotentialSourceContexts ?? null,
    },
    sourceAssessment: sourceAssessments.tableNumericContexts ?? null,
  },
];

const readySignals = localEvidenceChecks.filter((check) => ["passed", "ready", "review"].includes(check.status));
const acceptedExternalEvidence = externalEvidenceIntake.summary?.accepted ?? 0;
const bridgeReadySteps = externalEvidenceBridge.summary?.readySteps ?? 0;
const localExhausted = failedGates.length === promotionGates.length
  && readySignals.length === 0
  && acceptedExternalEvidence === 0
  && bridgeReadySteps === 0;

const requiredProofs = [
  {
    id: "external-source-mapping-selector-949",
    priority: "high",
    acceptedClaimType: "sf32-field-ownership",
    requiredEvidence: "source officielle, extracted-game-data ou documented-dataset reliant selector:949 a Bonus_Percent_Per_Power pour asset 1663210.",
    rejects: ["layout-analogy", "ui-label", "localization", "inference-only"],
  },
  {
    id: "second-compact-selector-949-proof",
    priority: "high",
    acceptedClaimType: "source-mapping",
    requiredEvidence: "second asset hors 1663210 avec layout compact selector 949 -> asset -> metadata 12337 / scale 10 et lien source nomme.",
    rejects: ["metadata 12337 seule", "scale 10 seul", "selector 949 sans asset cible"],
  },
  {
    id: "field-level-binary-parser",
    priority: "medium",
    acceptedClaimType: "source-mapping",
    requiredEvidence: "parseur bas niveau capable de nommer le champ proprietaire du record et de distinguer selector, asset, metadata, scale.",
    rejects: ["scan de nombres isole", "contexte non relie", "offset stale"],
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-local-exhaustion-conclusion-v1",
  source: {
    sf32DecisionFile,
    externalEvidenceIntakeFile,
    externalEvidenceBridgeFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    targetField: "SF_32",
    targetSelector: 949,
    metadataId: 12337,
    scale: 10,
    strictDps: 163200,
    blockedDeltaDps: 48960,
    promotionGates: promotionGates.length,
    failedPromotionGates: failedGates.length,
    blockers: decision.blockers ?? [],
    localEvidenceChecks: localEvidenceChecks.length,
    readySignals: readySignals.length,
    acceptedExternalEvidence,
    bridgeReadySteps,
    sf32LocalExhausted: localExhausted,
    recommendedNextFocus: "external-source-mapping-selector-949",
    fieldOwnershipProven: false,
    promotionReady: false,
    canModifyReliableDps: false,
    reliableDpsStillBlocked: reliableGates.summary?.canUseForReliableDps !== true,
    assessment: {
      kind: localExhausted ? "sf32-local-evidence-exhausted" : "sf32-local-evidence-open",
      confidence: "high",
      blocker: "field-level-parser-required",
      promotionReady: false,
      finding: "Les preuves locales SF_32 ne ferment aucune porte de promotion: selector 949 reste mixte, aucun second compact 949 n'existe, metadata 12337/10 est transverse, et aucune table source nommee n'est disponible.",
      nextAction: "Ne plus relancer d'audit local SF_32 sans nouvelle source; ajouter une preuve externe acceptee ou un parseur binaire de champ avant toute promotion.",
    },
  },
  localEvidenceChecks,
  requiredProofs,
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Le champ SF_32 n'est pas prouve et aucune preuve externe acceptee n'est disponible.",
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf32-local-exhaustion-conclusion.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
