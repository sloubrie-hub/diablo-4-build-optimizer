const fs = require("fs");
const path = require("path");

const candidateContextFile = process.argv[2] ?? "outputs/diablo4-conditional-candidate-context/conditional-candidate-context.json";
const definitionSearchFile = process.argv[3] ?? "outputs/diablo4-conditional-definition-search/conditional-definition-search.json";
const sfSourcesFile = process.argv[4] ?? "outputs/diablo4-conditional-sf-source-inspection/conditional-sf-source-inspection.json";
const outDir = process.argv[5] ?? "outputs/diablo4-uptime-proof-audit";

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function findCandidate(report, assetId) {
  return (report?.candidates ?? []).find((candidate) => Number(candidate.assetId) === Number(assetId)) ?? null;
}

function findTarget(report, assetId, role) {
  const asset = (report?.assets ?? []).find((row) => Number(row.assetId) === Number(assetId));
  return (asset?.targets ?? []).find((target) => target.role === role) ?? null;
}

function findSlots(report, assetId) {
  const asset = (report?.assets ?? []).find((row) => Number(row.assetId) === Number(assetId));
  return asset?.slots ?? [];
}

function classifyNeighborFormula(formula) {
  const value = formula.value ?? formula.expression ?? "";
  const isProbability = /POW\(|\/100|\)\s*\*\s*100/i.test(value);
  const hasSf32 = /\bSF_32\b/.test(value);
  const hasSf33 = /\bSF_33\b/.test(value);
  const hasDurationHint = /Duration|Uptime|Chance|Proc|Cooldown/i.test(value);
  return {
    offset: formula.offset ?? null,
    distance: formula.distance ?? null,
    value,
    kind: formula.kind ?? (isProbability ? "probability-or-uptime-formula" : "formula"),
    isProbability,
    hasSf32,
    hasSf33,
    hasDurationHint,
    sfRefs: [...new Set([...value.matchAll(/\bSF_(\d+)\b/g)].map((match) => Number(match[1])))]
      .filter(Number.isFinite)
      .sort((a, b) => a - b),
  };
}

const candidateContext = readJsonIfExists(candidateContextFile);
const definitionSearch = readJsonIfExists(definitionSearchFile);
const sfSources = readJsonIfExists(sfSourcesFile);
const assetId = Number(findCandidate(candidateContext, 1663210)?.assetId ?? 1663210);
const candidate = findCandidate(candidateContext, assetId);
const valueTarget = findTarget(definitionSearch, assetId, "sf32-scaling-source");
const slots = findSlots(sfSources, assetId);
const neighborFormulas = (valueTarget?.sourceCandidate?.valueAssessment?.formulas ?? []).map(classifyNeighborFormula);
const probabilityNeighbors = neighborFormulas.filter((formula) => formula.isProbability || formula.kind === "probability-or-uptime-formula");
const scenario = candidate?.scenarioImpact ?? null;
const slotIds = slots.map((slot) => slot.canonicalId);

const linkedToScenario = probabilityNeighbors.filter((formula) => formula.hasSf32 || formula.hasSf33);
const hasExplicitUptime = linkedToScenario.some((formula) => formula.hasDurationHint);
const hasNumericUptime = Number.isFinite(candidate?.uptime) || Number.isFinite(candidate?.scenarioImpact?.inputs?.uptime);
const promotionReady = hasExplicitUptime && hasNumericUptime;

const assessment = {
  kind: promotionReady
    ? "uptime-proof-ready"
    : probabilityNeighbors.length
      ? "uptime-neighbor-formulas-unlinked"
      : "uptime-proof-missing",
  confidence: probabilityNeighbors.length ? "medium-high" : "medium",
  promotionReady,
  blocker: promotionReady ? null : "uptime-not-proven",
  finding: probabilityNeighbors.length
    ? "Des formules de probabilite voisines existent, mais elles ne referencent pas SF_32/SF_33 et ne prouvent pas l'uptime du scenario booste."
    : "Aucune formule d'uptime candidate n'est isolee dans les artefacts charges.",
  nextAction: probabilityNeighbors.length
    ? "Mapper SF_28/SF_29 et leur role gameplay avant de les utiliser comme uptime; sinon garder le scenario en what-if bloque."
    : "Chercher une source explicite d'uptime ou configurer une hypothese utilisateur separee du DPS fiable.",
  evidence: {
    assetId,
    scenarioId: scenario?.scenarioId ?? null,
    scenarioInputs: scenario?.inputs ?? null,
    scenarioEstimatedDps: scenario?.estimatedDps ?? null,
    scenarioDeltaVsStrictDps: scenario?.deltaVsStrictDps ?? null,
    sfSlots: slotIds,
    probabilityNeighbors,
    linkedToScenario,
    hasExplicitUptime,
    hasNumericUptime,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "uptime-proof-audit-v1",
  source: {
    candidateContext: candidateContextFile,
    definitionSearch: definitionSearchFile,
    sfSources: sfSourcesFile,
  },
  summary: {
    assetId,
    probabilityNeighbors: probabilityNeighbors.length,
    linkedProbabilityNeighbors: linkedToScenario.length,
    hasExplicitUptime,
    hasNumericUptime,
    promotionReady,
    assessment,
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "uptime-proof-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
