const fs = require("fs");
const path = require("path");

const inputs = {
  nextEvidenceRoadmap: process.argv[2] ?? "outputs/diablo4-next-evidence-roadmap/next-evidence-roadmap.json",
  deltaPromotionConclusion: process.argv[3] ?? "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json",
  aspectSlotNextSourcePlan: process.argv[4] ?? "outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json",
  additiveBucketSourceConclusion: process.argv[5] ?? "outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json",
  externalEvidenceBridgePlan: process.argv[6] ?? "outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json",
};
const outDir = process.argv[7] ?? "outputs/diablo4-new-binary-family-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function localEvidenceExhausted(value) {
  return value?.summary?.localEvidenceExhausted === true
    || value?.summary?.existingEvidenceExhausted === true
    || value?.summary?.allLocalEvidenceExhausted === true;
}

function makeProbe({
  id,
  domain,
  target,
  priority,
  title,
  upstreamAssessment,
  desiredEvidence,
  accepts,
  rejects,
  acceptanceGates,
  unlocks,
}) {
  const passedGates = acceptanceGates.filter((gate) => gate.status === "passed");
  const ready = passedGates.length === acceptanceGates.length;
  return {
    id,
    domain,
    target,
    priority,
    title,
    status: ready ? "ready-for-parser-proof" : "blocked-waiting-for-new-binary-family",
    upstreamAssessment,
    desiredEvidence,
    accepts,
    rejects,
    acceptanceGates,
    missingGates: acceptanceGates.filter((gate) => gate.status !== "passed").map((gate) => gate.id),
    unlocks,
    canModifyReliableDps: false,
    guard: "probe plan only; decoded records must be reviewed and bridged before any scoring change",
  };
}

const nextEvidenceRoadmap = readJson(inputs.nextEvidenceRoadmap);
const deltaPromotionConclusion = readJson(inputs.deltaPromotionConclusion);
const aspectSlotNextSourcePlan = readJson(inputs.aspectSlotNextSourcePlan);
const additiveBucketSourceConclusion = readJson(inputs.additiveBucketSourceConclusion);
const externalEvidenceBridgePlan = readJson(inputs.externalEvidenceBridgePlan);

const probes = [
  makeProbe({
    id: "binary-family-delta-parent-1663210",
    domain: "delta-1663210",
    target: {
      assetId: 1663210,
      entityId: "skill:1663210",
      anchorTerms: ["1663210", "Mod.SoilRuler_B", "SF_32", "SF_33", "selector:949"],
    },
    priority: "high",
    title: "Trouver le record parent ou consommateur exact du delta 1663210",
    upstreamAssessment: {
      source: inputs.deltaPromotionConclusion,
      kind: deltaPromotionConclusion.summary?.assessment?.kind ?? null,
      localEvidenceExhausted: localEvidenceExhausted(deltaPromotionConclusion),
      nextAction: deltaPromotionConclusion.summary?.assessment?.nextAction ?? null,
    },
    desiredEvidence: [
      "record parent ou consommateur exact autour de Mod.SoilRuler_B",
      "champ proprietaire prouvant SF_32 sur l'asset ou le mod concerne",
      "trigger SF_33 mappe a une condition de build ou gameplay",
      "uptime explicite ou source permettant de la separer en hypothese utilisateur",
    ],
    accepts: [
      "mapping binaire nomme ou stable reliant 1663210, Mod.SoilRuler_B, SF_32 et SF_33",
      "decodeur qui relie selecteur, champ, metadata et famille de calcul",
      "preuve qui ferme ensemble proprietaire, trigger et uptime",
    ],
    rejects: [
      "presence isolee de 949, 994, 12337 ou 10 sans dictionnaire",
      "trailer Mod.* sans consommateur exact",
      "analogie de layout ou offsets seuls",
    ],
    acceptanceGates: [
      { id: "sf32-field-ownership", status: "failed", required: "SF_32 doit etre rattache au bon record source." },
      { id: "sf33-trigger", status: "failed", required: "SF_33 doit etre mappe a une condition interpretable." },
      { id: "uptime-proven-or-separated", status: "failed", required: "L'uptime doit etre prouvee ou rester en hypothese utilisateur." },
    ],
    unlocks: "Peut fermer blocked-delta-cleared seulement si les trois portes sont prouvees.",
  }),
  makeProbe({
    id: "binary-family-slots-1461593",
    domain: "slots-1461593",
    target: {
      assetId: 1461593,
      anchorTerms: ["1461593", "allowedSlots", "equipmentSlots", "aspectSlots", "itemTypes"],
    },
    priority: "high",
    title: "Trouver une famille aspect-equipement non localisation pour 1461593",
    upstreamAssessment: {
      source: inputs.aspectSlotNextSourcePlan,
      kind: aspectSlotNextSourcePlan.summary?.assessment?.kind ?? null,
      localEvidenceExhausted: localEvidenceExhausted(aspectSlotNextSourcePlan),
      nextAction: aspectSlotNextSourcePlan.summary?.assessment?.nextAction ?? null,
    },
    desiredEvidence: [
      "champ direct allowedSlots, equipmentSlots, aspectSlots ou itemTypes",
      "record structurel non UI reliant l'aspect 1461593 a des slots equipement",
      "preuve source qui distingue slot reel et libelle localise",
    ],
    accepts: [
      "table aspect-equipement non localisation avec champ slot direct",
      "decodeur qui mappe le champ au schema allowedSlots",
      "source externe approuvee par l'intake pour slots-1461593",
    ],
    rejects: [
      "prefixes Helm/Ring/2H sans champ equipement",
      "noms d'affixes ou texte UI",
      "famille Affix_Value sans semantique slot",
    ],
    acceptanceGates: [
      { id: "slot-field-direct", status: "failed", required: "Le champ slot doit etre direct et non infere du texte." },
      { id: "asset-mapping-1461593", status: "failed", required: "La preuve doit pointer explicitement vers 1461593." },
    ],
    unlocks: "Peut alimenter allowedSlots et reduire les blocages de contraintes de build.",
  }),
  makeProbe({
    id: "binary-family-bucket-source",
    domain: "additive-buckets",
    target: {
      family: "Bonus_Percent_Per_Power",
      anchorTerms: ["Bonus_Percent_Per_Power", "additive", "multiplicative", "bucket", "modifierFamily"],
    },
    priority: "medium",
    title: "Trouver une famille qui classe les buckets de calcul",
    upstreamAssessment: {
      source: inputs.additiveBucketSourceConclusion,
      kind: additiveBucketSourceConclusion.summary?.assessment?.kind ?? null,
      localEvidenceExhausted: localEvidenceExhausted(additiveBucketSourceConclusion),
      nextAction: additiveBucketSourceConclusion.summary?.assessment?.nextAction ?? null,
    },
    desiredEvidence: [
      "record ou table classant Bonus_Percent_Per_Power en additif ou multiplicatif",
      "metadata separant additive, multiplicative, uptime et cap",
      "mapping reutilisable pour le futur moteur Diablo IV par buckets",
    ],
    accepts: [
      "champ nomme bucket ou modifierFamily",
      "decodeur prouve par plusieurs records de meme famille",
      "source externe approuvee par l'intake pour additive-buckets",
    ],
    rejects: [
      "analogie de layout seule",
      "valeur numerique sans table de classification",
      "classification deduite du DPS final uniquement",
    ],
    acceptanceGates: [
      { id: "bucket-family-named", status: "failed", required: "La famille additive/multiplicative doit etre nommee ou decodee." },
      { id: "bonus-percent-anchor", status: "failed", required: "La preuve doit couvrir Bonus_Percent_Per_Power." },
    ],
    unlocks: "Peut remplacer le prototype strict agrege par des buckets fins source-backed.",
  }),
];

const readyProbes = probes.filter((probe) => probe.status === "ready-for-parser-proof");
const blockedProbes = probes.filter((probe) => probe.status !== "ready-for-parser-proof");
const highPriorityProbes = probes.filter((probe) => probe.priority === "high");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "new-binary-family-plan-v1",
  source: inputs,
  summary: {
    status: "new-binary-family-search-required",
    probes: probes.length,
    readyProbes: readyProbes.length,
    blockedProbes: blockedProbes.length,
    highPriorityProbes: highPriorityProbes.length,
    localEvidenceExhausted: nextEvidenceRoadmap.summary?.allLocalEvidenceExhausted === true,
    externalBridgeReadySteps: externalEvidenceBridgePlan.summary?.readySteps ?? 0,
    canModifyReliableDps: false,
    promotionReady: false,
    nextProbeId: blockedProbes[0]?.id ?? null,
    assessment: {
      kind: readyProbes.length ? "new-binary-family-plan-ready" : "new-binary-family-plan-blocked-waiting-for-scan",
      confidence: "high",
      promotionReady: false,
      finding: readyProbes.length
        ? "Une sonde binaire est prete a etre reliee a un parseur, mais aucune promotion fiable n'est autorisee par ce plan."
        : "Les pistes locales existantes sont epuisees; la prochaine avance exige une nouvelle famille binaire source-backed.",
      nextAction: blockedProbes[0]
        ? `Prioriser ${blockedProbes[0].id} et rejeter toute preuve sans champ source explicite.`
        : "Relier la preuve au parseur cible, puis ajouter un invariant avant toute promotion.",
    },
  },
  probes,
  safeguards: [
    "Ce plan ne modifie aucun score.",
    "Aucune preuve par layout seul ne peut debloquer reliableDps.",
    "allowedSlots reste vide sans champ direct ou source externe approuvee.",
    "Le delta 48960 reste bloque tant que SF_32, SF_33 et uptime ne sont pas tous prouves.",
    "Les buckets fins doivent rester separes du DPS strict tant que leur famille source n'est pas prouvee.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "new-binary-family-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
