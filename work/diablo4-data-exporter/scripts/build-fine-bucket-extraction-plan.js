const fs = require("fs");
const path = require("path");

const targetBucketEngineFile = process.argv[2] ?? "outputs/diablo4-target-bucket-engine/target-bucket-engine.json";
const sf32DecisionFile = process.argv[3] ?? "outputs/diablo4-sf32-field-promotion-decision/sf32-field-promotion-decision.json";
const sf33DecisionFile = process.argv[4] ?? "outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json";
const uptimeChainFile = process.argv[5] ?? "outputs/diablo4-uptime-probability-chain/uptime-probability-chain.json";
const aspectSlotConclusionFile = process.argv[6] ?? "outputs/diablo4-aspect-slot-blocker-conclusion/aspect-slot-blocker-conclusion.json";
const additiveBucketSourceFile = process.argv[7] ?? "outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json";
const outDir = process.argv[8] ?? "outputs/diablo4-fine-bucket-extraction-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function step(id, family, priority, status, title, blocker, evidence, nextAction) {
  return {
    id,
    family,
    priority,
    status,
    title,
    blocker,
    evidence,
    nextAction,
    promotionPolicy: status === "ready"
      ? "peut alimenter le moteur apres validation de parite"
      : "ne pas alimenter reliableDps avant preuve source et bucket",
  };
}

const targetBucketEngine = readJson(targetBucketEngineFile);
const sf32Decision = readOptionalJson(sf32DecisionFile);
const sf33Decision = readOptionalJson(sf33DecisionFile);
const uptimeChain = readOptionalJson(uptimeChainFile);
const aspectSlotConclusion = readOptionalJson(aspectSlotConclusionFile);
const additiveBucketSource = readOptionalJson(additiveBucketSourceFile);

const bucketSummary = targetBucketEngine.summary ?? {};
const buckets = targetBucketEngine.buckets ?? {};
const rows = targetBucketEngine.bucketRows ?? [];
const blockedRows = rows.filter((row) => Number(row.blockedCandidateDelta || 0) > 0);

const steps = [
  step(
    "fine-bucket-step-01-additive-source",
    "additive",
    "high",
    additiveBucketSource?.summary?.additiveBucketReady === true ? "ready" : "blocked",
    "Extraire les bonus additifs fins",
    "additive-bucket-source-missing",
    {
      currentContribution: buckets.additivePct ?? 0,
      strictAggregatedDps: bucketSummary.strictBaseDps ?? null,
      candidateSource: "estimatedDps agrege seulement",
      sf32FieldOwnership: sf32Decision?.summary?.assessment?.fieldOwnership ?? null,
      additiveSourceAssessment: additiveBucketSource?.summary?.assessment?.kind ?? null,
      additiveCandidates: additiveBucketSource?.summary?.candidateRows ?? null,
      blockedAdditiveCandidates: additiveBucketSource?.summary?.blockedCandidates ?? null,
      readyAdditiveRows: additiveBucketSource?.summary?.readyRows ?? null,
      selectorGroups: additiveBucketSource?.summary?.selectorGroups ?? null,
      selectorSourceProofAssessment: additiveBucketSource?.summary?.assessment?.evidence?.selectorSourceProofAssessment ?? null,
      selectorStructuralAssessment: additiveBucketSource?.summary?.selectorStructuralAssessment ?? null,
      strongSelectorStructuralCandidates: additiveBucketSource?.summary?.strongSelectorStructuralCandidates ?? null,
      selectorSpecificWindowSignatures: additiveBucketSource?.summary?.selectorSpecificWindowSignatures ?? null,
      selectorStructuralCorpusAssessment: additiveBucketSource?.summary?.selectorStructuralCorpusAssessment ?? null,
      selectorStructuralCorpusExactMatches: additiveBucketSource?.summary?.selectorStructuralCorpusExactMatches ?? null,
      selectorStructuralCorpusNewExactAssets: additiveBucketSource?.summary?.selectorStructuralCorpusNewExactAssets ?? [],
      selectorStructuralCorpusExactMatchesWithSelectorAnchors: additiveBucketSource?.summary?.selectorStructuralCorpusExactMatchesWithSelectorAnchors ?? null,
      selectorStructuralCorpusNewExactAssetsWithSelectorAnchors: additiveBucketSource?.summary?.selectorStructuralCorpusNewExactAssetsWithSelectorAnchors ?? [],
      selectorStructuralCorpusSourceNamedMatches: additiveBucketSource?.summary?.selectorStructuralCorpusSourceNamedMatches ?? null,
      selectorSourceNamed: additiveBucketSource?.summary?.selectorSourceNamed ?? null,
      selectorFamiliesClassified: additiveBucketSource?.summary?.selectorFamiliesClassified ?? null,
    },
    additiveBucketSource?.summary?.assessment?.nextAction ?? "Parser les modifiers de type bonus % prouve et les classer additifs seulement si la table/champ source est nommee."
  ),
  step(
    "fine-bucket-step-02-multiplicative-source",
    "multiplicative",
    "high",
    Number(buckets.multiplicativeProduct || 1) !== 1 ? "ready" : "blocked",
    "Extraire les multiplicateurs fins",
    "multiplicative-bucket-source-missing",
    {
      currentContribution: buckets.multiplicativeProduct ?? 1,
      blockedCandidateDelta: bucketSummary.blockedCandidateDelta ?? 0,
      sf32PromotionReady: sf32Decision?.summary?.promotionReady === true,
      sf33PromotionReady: sf33Decision?.summary?.promotionReady === true,
    },
    "Ne classer aucun multiplicateur conditionnel tant que la source SF_32/SF_33 n'est pas prouvee."
  ),
  step(
    "fine-bucket-step-03-uptime-source",
    "uptime",
    "high",
    Number(buckets.uptimeProduct || 1) !== 1 ? "ready" : "blocked",
    "Prouver les uptimes exploitables",
    "uptime-bucket-source-missing",
    {
      currentContribution: buckets.uptimeProduct ?? 1,
      probabilityChainAssessment: uptimeChain?.summary?.assessment?.kind ?? null,
      probabilityChains: uptimeChain?.summary?.probabilityChains ?? null,
      chainsLinkedToBoost: uptimeChain?.summary?.chainsLinkedToBoost ?? null,
      chainsWithDurationHint: uptimeChain?.summary?.chainsWithDurationHint ?? null,
    },
    "Garder les probabilites/procs hors reliableDps tant qu'elles ne reference pas explicitement la branche boostee avec une duree ou une hypothese utilisateur separee."
  ),
  step(
    "fine-bucket-step-04-caps-source",
    "caps",
    "medium",
    Number(buckets.caps || 0) !== 0 ? "ready" : "blocked",
    "Mapper les caps et limites",
    "cap-source-missing",
    {
      currentContribution: buckets.caps ?? 0,
      knownCaps: 0,
      strictFormula: targetBucketEngine.formula?.strict ?? null,
    },
    "Chercher les fonctions min/max/cap dans les formules source et les garder descriptives avant semantique prouvee."
  ),
  step(
    "fine-bucket-step-05-slot-constraints",
    "constraints",
    "high",
    aspectSlotConclusion?.summary?.slotConstraintReady === true ? "ready" : "blocked",
    "Prouver les contraintes de slots",
    "slot-constraints-source-missing",
    {
      assessment: aspectSlotConclusion?.summary?.assessment?.kind ?? null,
      existingEvidenceExhausted: aspectSlotConclusion?.summary?.existingEvidenceExhausted === true,
      usableProofSignals: aspectSlotConclusion?.summary?.usableProofSignals ?? null,
    },
    "Passer a un parseur binaire/champ source aspect-equipement ou une source externe fiable de slots."
  ),
  step(
    "fine-bucket-step-06-blocked-candidates",
    "blocked-candidates",
    "high",
    blockedRows.length === 0 ? "ready" : "blocked",
    "Isoler les candidats conditionnels",
    "blocked-candidate-proof-gates-open",
    {
      blockedRows: blockedRows.length,
      blockedCandidateDelta: bucketSummary.blockedCandidateDelta ?? 0,
      blockedAssets: blockedRows.map((row) => row.assetId),
      sf32Blockers: sf32Decision?.summary?.blockers ?? [],
      sf33Assessment: sf33Decision?.summary?.assessment?.kind ?? null,
    },
    "Continuer a exposer le what-if sans modifier reliableDps tant que les preuves SF_32, SF_33 et uptime restent bloquees."
  ),
];

const blockedSteps = steps.filter((row) => row.status !== "ready");
const readySteps = steps.filter((row) => row.status === "ready");
const familyStatus = Object.fromEntries(steps.map((row) => [row.family, row.status]));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "fine-bucket-extraction-plan-v1",
  source: {
    targetBucketEngineFile,
    sf32DecisionFile: sf32Decision ? sf32DecisionFile : null,
    sf33DecisionFile: sf33Decision ? sf33DecisionFile : null,
    uptimeChainFile: uptimeChain ? uptimeChainFile : null,
    aspectSlotConclusionFile: aspectSlotConclusion ? aspectSlotConclusionFile : null,
    additiveBucketSourceFile: additiveBucketSource ? additiveBucketSourceFile : null,
  },
  summary: {
    steps: steps.length,
    readySteps: readySteps.length,
    blockedSteps: blockedSteps.length,
    fineBucketsReady: blockedSteps.length === 0,
    nextStepId: blockedSteps[0]?.id ?? null,
    nextStepTitle: blockedSteps[0]?.title ?? null,
    familyStatus,
    assessment: {
      kind: blockedSteps.length ? "fine-bucket-extraction-blocked-by-source-proofs" : "fine-bucket-extraction-ready",
      confidence: "high",
      promotionReady: blockedSteps.length === 0,
      finding: blockedSteps.length
        ? "Les buckets fins sont structures, mais aucune famille additive/multiplicative/uptime/cap n'a encore de source promouvable."
        : "Toutes les familles fines disposent d'une source exploitable.",
      nextAction: blockedSteps[0]?.nextAction ?? "Regenerer le moteur buckets avec les modifiers fins.",
    },
  },
  steps,
  safeguards: [
    "Ne jamais transformer estimatedDps agrege en bucket fin sans preuve de champ source.",
    "Ne jamais utiliser un candidat bloque pour reliableDps.",
    "Garder uptime et procs separes tant que le lien gameplay n'est pas prouve.",
    "Les caps restent descriptifs avant semantique prouvee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "fine-bucket-extraction-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
