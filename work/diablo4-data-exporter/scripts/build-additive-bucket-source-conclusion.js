const fs = require("fs");
const path = require("path");

const inputs = {
  additiveBucketSource: process.argv[2] ?? "outputs/diablo4-additive-bucket-source-audit/additive-bucket-source-audit.json",
  selectorSourceProof: process.argv[3] ?? "outputs/diablo4-bonus-selector-source-proof/bonus-selector-source-proof.json",
  structuralFamily: process.argv[4] ?? "outputs/diablo4-bonus-selector-structural-family/bonus-selector-structural-family.json",
  structuralCorpus: process.argv[5] ?? "outputs/diablo4-bonus-selector-structural-corpus/bonus-selector-structural-corpus.json",
  bucketSourceTerms: process.argv[6] ?? "outputs/diablo4-bucket-source-term-corpus/bucket-source-term-corpus.json",
  binaryTableSource: process.argv[7] ?? "outputs/diablo4-bucket-binary-table-source/bucket-binary-table-source.json",
};
const outDir = process.argv[8] ?? "outputs/diablo4-additive-bucket-source-conclusion";

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function assessmentKind(report) {
  return report?.summary?.assessment?.kind ?? null;
}

function probe(id, title, report, status, evidence, decision) {
  return {
    id,
    title,
    status,
    assessment: assessmentKind(report),
    promotionReady: report?.summary?.promotionReady === true || report?.summary?.assessment?.promotionReady === true,
    evidence,
    decision,
  };
}

const additiveBucketSource = readOptionalJson(inputs.additiveBucketSource);
const selectorSourceProof = readOptionalJson(inputs.selectorSourceProof);
const structuralFamily = readOptionalJson(inputs.structuralFamily);
const structuralCorpus = readOptionalJson(inputs.structuralCorpus);
const bucketSourceTerms = readOptionalJson(inputs.bucketSourceTerms);
const binaryTableSource = readOptionalJson(inputs.binaryTableSource);

const probes = [
  probe(
    "selector-source-proof",
    "Prouver une source nommee pour les selecteurs 949/994",
    selectorSourceProof,
    selectorSourceProof?.summary?.promotionReady === true ? "ready" : "blocked",
    {
      sourceNamed: selectorSourceProof?.summary?.sourceNamed ?? null,
      selectorFamiliesClassified: selectorSourceProof?.summary?.selectorFamiliesClassified ?? null,
      blockedFamilies: selectorSourceProof?.summary?.blockedFamilies ?? null,
    },
    "Aucun selecteur observe ne classe une famille additive/multiplicative sans source nommee."
  ),
  probe(
    "structural-family",
    "Verifier les offsets structurels 949/994",
    structuralFamily,
    structuralFamily?.summary?.promotionReady === true ? "ready" : "blocked",
    {
      strongStructuralCandidates: structuralFamily?.summary?.strongStructuralCandidates ?? null,
      selectorSpecificWindowSignatures: structuralFamily?.summary?.selectorSpecificWindowSignatures ?? null,
    },
    "Les offsets distinguent des layouts, pas une semantique de bucket."
  ),
  probe(
    "structural-corpus",
    "Elargir les empreintes au corpus decode",
    structuralCorpus,
    structuralCorpus?.summary?.promotionReady === true ? "ready" : "blocked",
    {
      matches: structuralCorpus?.summary?.matches ?? null,
      exactMatches: structuralCorpus?.summary?.exactMatches ?? null,
      newExactAssets: structuralCorpus?.summary?.newExactAssets ?? [],
      newExactAssetsWithSelectorAnchors: structuralCorpus?.summary?.newExactAssetsWithSelectorAnchors ?? [],
      sourceNamedMatches: structuralCorpus?.summary?.sourceNamedMatches ?? null,
    },
    "Les nouveaux peers sont des peers de layout seulement; aucun nouveau peer ancre ne prouve 949/994."
  ),
  probe(
    "bucket-source-terms",
    "Chercher les termes texte additif/multiplicatif/bucket",
    bucketSourceTerms,
    bucketSourceTerms?.summary?.sourceProofReady === true ? "ready" : "blocked",
    {
      hits: bucketSourceTerms?.summary?.hits ?? null,
      bucketTermHits: bucketSourceTerms?.summary?.bucketTermHits ?? null,
      candidateSourceHits: bucketSourceTerms?.summary?.candidateSourceHits ?? null,
      nearWatchedHits: bucketSourceTerms?.summary?.nearWatchedHits ?? null,
      bonusPercentHits: bucketSourceTerms?.summary?.bonusPercentHits ?? null,
    },
    "Le corpus texte ne nomme aucune famille de bucket exploitable."
  ),
  probe(
    "binary-table-source",
    "Auditer les tables binaires candidates",
    binaryTableSource,
    binaryTableSource?.summary?.sourceProofReady === true ? "ready" : "blocked",
    {
      filesScanned: binaryTableSource?.summary?.filesScanned ?? null,
      exactHits: binaryTableSource?.summary?.exactHits ?? null,
      usefulHits: binaryTableSource?.summary?.usefulHits ?? null,
      sourceCandidates: binaryTableSource?.summary?.sourceCandidates ?? null,
    },
    "Les valeurs surveillees dans les tables candidates sont des references/bruits sans contexte source."
  ),
  probe(
    "additive-candidate-rows",
    "Verifier les lignes candidates additives",
    additiveBucketSource,
    additiveBucketSource?.summary?.additiveBucketReady === true ? "ready" : "blocked",
    {
      candidateRows: additiveBucketSource?.summary?.candidateRows ?? null,
      blockedCandidates: additiveBucketSource?.summary?.blockedCandidates ?? null,
      readyRows: additiveBucketSource?.summary?.readyRows ?? null,
      selectorGroups: additiveBucketSource?.summary?.selectorGroups ?? null,
    },
    "Tous les candidats Bonus_Percent_Per_Power restent bloques par preuve source et ownership."
  ),
];

const readyProbes = probes.filter((row) => row.status === "ready");
const blockedProbes = probes.filter((row) => row.status !== "ready");
const localEvidenceExhausted = blockedProbes.length === probes.length
  && (selectorSourceProof?.summary?.sourceNamed === false)
  && Number(additiveBucketSource?.summary?.readyRows ?? 0) === 0
  && Number(bucketSourceTerms?.summary?.candidateSourceHits ?? 0) === 0
  && Number(binaryTableSource?.summary?.sourceCandidates ?? 0) === 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "additive-bucket-source-conclusion-v1",
  source: inputs,
  summary: {
    probes: probes.length,
    readyProbes: readyProbes.length,
    blockedProbes: blockedProbes.length,
    localEvidenceExhausted,
    sourceNamed: selectorSourceProof?.summary?.sourceNamed === true,
    additiveBucketReady: additiveBucketSource?.summary?.additiveBucketReady === true,
    promotionReady: false,
    nextRequiredEvidence: [
      "source externe fiable qui classe les modifiers Bonus_Percent_Per_Power",
      "nouvelle famille de records binaires nommant ou encodant clairement additive/multiplicative",
      "decodeur proprietaire reliant selecteur, champ et famille bucket",
    ],
    assessment: {
      kind: localEvidenceExhausted
        ? "additive-bucket-local-source-evidence-exhausted"
        : readyProbes.length
          ? "additive-bucket-source-has-unvalidated-ready-probes"
          : "additive-bucket-source-still-open",
      confidence: localEvidenceExhausted ? "high" : "medium",
      blocker: localEvidenceExhausted ? "external-or-new-record-source-required" : "source-proof-incomplete",
      promotionReady: false,
      finding: localEvidenceExhausted
        ? "Toutes les pistes locales actuelles pour classer Bonus_Percent_Per_Power en bucket additif sont bloquees ou non promouvables."
        : "Certaines pistes locales restent a inspecter avant de conclure l'epuisement.",
      nextAction: localEvidenceExhausted
        ? "Basculer vers une source externe fiable ou une nouvelle famille de records binaires; garder les candidats hors reliableDps."
        : "Inspecter les probes pretes/non fermees avant toute promotion.",
    },
  },
  probes,
  safeguards: [
    "Ne pas transformer une conclusion d'epuisement local en classification additive.",
    "Ne pas utiliser les pairs de layout comme preuve de bucket.",
    "Garder reliableDps strict tant qu'aucune source externe ou binaire nouvelle ne classe la famille.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "additive-bucket-source-conclusion.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
