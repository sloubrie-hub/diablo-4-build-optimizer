const fs = require("fs");
const path = require("path");

const inputs = {
  deltaPromotionConclusion: process.argv[2] ?? "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json",
  aspectSlotNextSourcePlan: process.argv[3] ?? "outputs/diablo4-aspect-slot-next-source-plan/aspect-slot-next-source-plan.json",
  additiveBucketSourceConclusion: process.argv[4] ?? "outputs/diablo4-additive-bucket-source-conclusion/additive-bucket-source-conclusion.json",
  externalEvidenceIntake: "outputs/diablo4-external-evidence-intake/external-evidence-intake.json",
};
const outDir = process.argv[5] ?? "outputs/diablo4-next-evidence-roadmap";

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function blocked(domain, report, readyField) {
  const summary = report?.summary ?? {};
  return {
    domain,
    assessment: summary.assessment?.kind ?? null,
    confidence: summary.assessment?.confidence ?? null,
    localEvidenceExhausted: summary.localEvidenceExhausted === true || summary.existingEvidenceExhausted === true,
    promotionReady: summary.promotionReady === true || summary[readyField] === true,
    nextAction: summary.assessment?.nextAction ?? null,
  };
}

function action({ id, title, priority, domains, accepts, rejects, unlocks }) {
  return { id, title, priority, domains, accepts, rejects, unlocks };
}

const delta = readOptionalJson(inputs.deltaPromotionConclusion);
const slots = readOptionalJson(inputs.aspectSlotNextSourcePlan);
const additive = readOptionalJson(inputs.additiveBucketSourceConclusion);
const externalEvidence = readOptionalJson(inputs.externalEvidenceIntake);

const domains = [
  blocked("delta-1663210", delta, "canUseForReliableDps"),
  blocked("slots-1461593", slots, "slotConstraintReady"),
  blocked("additive-buckets", additive, "additiveBucketReady"),
];
const blockedDomains = domains.filter((row) => !row.promotionReady);
const exhaustedDomains = blockedDomains.filter((row) => row.localEvidenceExhausted);

const roadmap = [
  action({
    id: "next-evidence-01-external-source",
    title: "Obtenir une source externe fiable",
    priority: "high",
    domains: ["delta-1663210", "slots-1461593", "additive-buckets"],
    accepts: [
      "source qui nomme explicitement les slots autorises d'un aspect",
      "source qui classe les modifiers Bonus_Percent_Per_Power en bucket additif/multiplicatif",
      "source qui relie Mod.SoilRuler_B a une condition de build ou gameplay",
      "source qui donne une uptime explicite ou une hypothese utilisateur separee",
    ],
    rejects: [
      "noms d'affixes contenant Helm/Ring/2H sans champ allowedSlots",
      "Codex/UI/localisation",
      "pairs de layout sans semantique source",
      "valeurs 949/994/12337/10 sans table ou dictionnaire nomme",
    ],
    unlocks: "Peut debloquer slots, buckets fins ou scenario what-if configure sans modifier reliableDps par inference.",
  }),
  action({
    id: "next-evidence-02-new-binary-family",
    title: "Chercher une nouvelle famille de records binaires",
    priority: "high",
    domains: ["delta-1663210", "slots-1461593", "additive-buckets"],
    accepts: [
      "record parent ou consommateur exact autour de Mod.SoilRuler_B",
      "famille aspect-equipement non localisation avec champ slot direct",
      "record qui nomme ou encode clairement additive/multiplicative",
      "decodeur reliant selecteur, champ, metadata et famille de calcul",
    ],
    rejects: [
      "offset stable sans signification nommee",
      "signature de layout commune seule",
      "records Affix_Value sans champ equipement",
      "trailer Mod.* sans consommateur exact",
    ],
    unlocks: "Peut remplacer les pistes locales epuisees par une preuve promouvable dans le dataset cible.",
  }),
  action({
    id: "next-evidence-03-user-hypothesis",
    title: "Ajouter une hypothese utilisateur separee",
    priority: "medium",
    domains: ["delta-1663210"],
    accepts: [
      "toggle utilisateur explicite pour SF_33",
      "uptime utilisateur explicite, numerique et separee du DPS fiable",
      "scenario marque what-if/configure, jamais reliableDps",
    ],
    rejects: [
      "activation automatique de Mod.SoilRuler_B",
      "conversion de SF_28/SF_29 en uptime sans lien a la branche boostee",
      "promotion du delta 48960 dans le ranking fiable",
    ],
    unlocks: "Ameliore la simulation what-if sans pretendre resoudre la preuve jeu.",
  }),
];

const allLocalEvidenceExhausted = blockedDomains.length > 0 && blockedDomains.length === exhaustedDomains.length;
const acceptedExternalEvidence = externalEvidence?.summary?.accepted ?? 0;
const pendingExternalEvidence = externalEvidence?.summary?.pending ?? 0;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "next-evidence-roadmap-v1",
  source: inputs,
  summary: {
    domains: domains.length,
    blockedDomains: blockedDomains.length,
    exhaustedDomains: exhaustedDomains.length,
    allLocalEvidenceExhausted,
    actions: roadmap.length,
    highPriorityActions: roadmap.filter((row) => row.priority === "high").length,
    externalEvidenceCandidates: externalEvidence?.summary?.candidates ?? 0,
    acceptedExternalEvidence,
    pendingExternalEvidence,
    promotionReady: false,
    assessment: {
      kind: allLocalEvidenceExhausted
        ? "next-evidence-roadmap-required"
        : "next-evidence-roadmap-partial",
      confidence: "high",
      promotionReady: false,
      finding: acceptedExternalEvidence > 0
        ? "Des preuves externes sont acceptees pour revue; elles doivent etre reliees explicitement a un parseur avant promotion."
        : allLocalEvidenceExhausted
        ? "Les principaux blocages locaux sont epuisees; la suite doit viser une source externe fiable, une nouvelle famille binaire ou une hypothese utilisateur separee."
        : "Certains domaines ne sont pas encore conclus; poursuivre les preuves restantes avant promotion.",
      nextAction: acceptedExternalEvidence > 0
        ? "Construire le pont parseur vers les preuves externes acceptees; garder reliableDps strict jusqu'a consommation explicite."
        : "Prioriser source externe fiable ou nouvelle famille de records binaires; garder reliableDps strict.",
    },
  },
  domains,
  externalEvidenceIntake: externalEvidence
    ? {
        file: inputs.externalEvidenceIntake,
        summary: externalEvidence.summary,
        requirements: externalEvidence.requirements,
      }
    : null,
  roadmap,
  safeguards: [
    "Ne pas promouvoir une preuve par analogie de layout.",
    "Ne pas modifier reliableDps avec des hypotheses utilisateur.",
    "Ne pas remplir allowedSlots sans champ direct ou source externe fiable.",
    "Ne pas classer un bucket sans source nommee ou decodeur prouve.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "next-evidence-roadmap.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
