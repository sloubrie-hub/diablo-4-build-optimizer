const fs = require("fs");
const path = require("path");

const deltaConclusionFile = process.argv[2] ?? "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json";
const outDir = process.argv[3] ?? "outputs/diablo4-user-whatif-scenarios";

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

const deltaConclusion = readOptionalJson(deltaConclusionFile);
const summary = deltaConclusion?.summary ?? {};

const scenario = {
  id: "user-scenario-1663210-sf33-uptime",
  assetId: summary.assetId ?? 1663210,
  entityId: summary.entityId ?? "skill:1663210",
  class: summary.class ?? "spiritborn",
  label: "SF_33 actif avec uptime utilisateur",
  defaultEnabled: false,
  defaultSf33Active: false,
  defaultUptime: 1,
  strictDps: summary.strictDps ?? 163200,
  blockedCandidateDps: summary.candidateDps ?? 212160,
  blockedDeltaDps: summary.candidateDeltaDps ?? 48960,
  formula: "configuredWhatIfDps = strictDps + (blockedDeltaDps * uptime) when sf33Active is true",
  reliability: {
    canUseForReliableDps: false,
    canUseForRanking: false,
    canExposeAsWhatIf: true,
    sourceAssessment: summary.assessment?.kind ?? null,
    localEvidenceExhausted: summary.localEvidenceExhausted === true,
  },
  controls: [
    {
      id: "sf33Active",
      type: "boolean",
      label: "Activer SF_33 comme hypothese utilisateur",
      defaultValue: false,
    },
    {
      id: "uptime",
      type: "number",
      label: "Uptime utilisateur",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 1,
    },
  ],
  safeguards: [
    "Cette hypothese ne ferme pas les preuves SF_32, SF_33 ou uptime.",
    "Le resultat configure reste un what-if utilisateur.",
    "reliableDps reste strict-only.",
  ],
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "user-whatif-scenarios-v1",
  source: {
    deltaConclusionFile,
  },
  summary: {
    scenarios: 1,
    configurableScenarios: 1,
    reliablePromotionReady: false,
    defaultEnabled: false,
    assessment: {
      kind: "user-whatif-scenario-ready",
      confidence: "high",
      promotionReady: false,
      finding: "Le delta 48960 peut etre expose comme hypothese utilisateur separee sans modifier reliableDps.",
      nextAction: "Laisser l'utilisateur activer SF_33 et regler l'uptime dans le site; garder le classement fiable en strict.",
    },
  },
  scenarios: [scenario],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "user-whatif-scenarios.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
