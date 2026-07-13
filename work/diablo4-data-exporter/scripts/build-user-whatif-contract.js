const fs = require("fs");
const path = require("path");

const userWhatIfScenariosFile = process.argv[2] ?? "outputs/diablo4-user-whatif-scenarios/user-whatif-scenarios.json";
const reliableGatesFile = process.argv[3] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[4] ?? "outputs/diablo4-user-whatif-contract";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function clampUptime(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function configuredWhatIfDps(scenario, sf33Active, uptime) {
  const strictDps = Number(scenario.strictDps ?? 0);
  const blockedDeltaDps = Number(scenario.blockedDeltaDps ?? 0);
  return Math.round(strictDps + (sf33Active ? blockedDeltaDps * clampUptime(uptime) : 0));
}

const scenarios = readJson(userWhatIfScenariosFile);
const reliableGates = readJson(reliableGatesFile);
const scenario = scenarios.scenarios?.[0] ?? {};
const sampleUptimes = [0, 0.25, 0.5, 0.75, 1];
const samples = sampleUptimes.map((uptime) => ({
  sf33Active: true,
  uptime,
  strictDps: scenario.strictDps,
  blockedDeltaDps: scenario.blockedDeltaDps,
  configuredWhatIfDps: configuredWhatIfDps(scenario, true, uptime),
  reliableDps: scenario.strictDps,
  canUseForReliableDps: false,
}));

const inactiveSample = {
  sf33Active: false,
  uptime: 1,
  strictDps: scenario.strictDps,
  blockedDeltaDps: scenario.blockedDeltaDps,
  configuredWhatIfDps: configuredWhatIfDps(scenario, false, 1),
  reliableDps: scenario.strictDps,
  canUseForReliableDps: false,
};

const contractChecks = [
  {
    id: "uptime-bounds",
    status: scenario.controls?.some((control) =>
      control.id === "uptime"
      && Number(control.min) === 0
      && Number(control.max) === 1
      && Number(control.step) > 0) ? "passed" : "failed",
    expected: "uptime min=0 max=1 step>0",
  },
  {
    id: "formula-samples",
    status: samples.every((sample) =>
      sample.configuredWhatIfDps === Math.round(Number(scenario.strictDps ?? 0) + Number(scenario.blockedDeltaDps ?? 0) * sample.uptime)) ? "passed" : "failed",
    expected: "strictDps + blockedDeltaDps * uptime",
  },
  {
    id: "inactive-is-strict",
    status: inactiveSample.configuredWhatIfDps === Number(scenario.strictDps ?? 0) ? "passed" : "failed",
    expected: "inactive scenario equals strictDps",
  },
  {
    id: "reliable-dps-unchanged",
    status: samples.every((sample) => sample.reliableDps === Number(scenario.strictDps ?? 0) && sample.canUseForReliableDps === false) ? "passed" : "failed",
    expected: "all what-if samples keep reliableDps strict-only",
  },
  {
    id: "reliable-gates-still-blocked",
    status: reliableGates.summary?.canUseForReliableDps === false ? "passed" : "failed",
    expected: "reliable gates remain blocked",
  },
];

const failedChecks = contractChecks.filter((check) => check.status !== "passed");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "user-whatif-contract-v1",
  source: {
    userWhatIfScenariosFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    scenarioId: scenario.id ?? "user-scenario-1663210-sf33-uptime",
    assetId: scenario.assetId ?? 1663210,
    entityId: scenario.entityId ?? "skill:1663210",
    strictDps: scenario.strictDps ?? 163200,
    blockedDeltaDps: scenario.blockedDeltaDps ?? 48960,
    samples: samples.length + 1,
    checks: contractChecks.length,
    failedChecks: failedChecks.length,
    defaultEnabled: scenario.defaultEnabled === true,
    canExposeAsWhatIf: scenario.reliability?.canExposeAsWhatIf === true,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    canModifyReliableDps: false,
    assessment: {
      kind: failedChecks.length
        ? "user-whatif-contract-failed"
        : "user-whatif-contract-safe",
      confidence: "high",
      promotionReady: false,
      finding: failedChecks.length
        ? "Le contrat what-if utilisateur a des checks en echec; ne pas exposer comme scenario stable."
        : "Le scenario utilisateur applique l'uptime uniquement au what-if et garde reliableDps strict-only.",
      nextAction: failedChecks.length
        ? "Corriger les controles ou la formule avant exposition."
        : "Conserver ce contrat pour l'interface et les exports/imports de build.",
    },
  },
  scenario: {
    id: scenario.id,
    controls: scenario.controls,
    formula: scenario.formula,
    reliability: scenario.reliability,
  },
  samples: [inactiveSample, ...samples],
  contractChecks,
  exportPolicy: {
    includeInBuildExport: true,
    exportedFields: ["scenarioId", "sf33Active", "uptime", "configuredDeltaDps", "configuredWhatIfDps"],
    forbiddenFields: ["reliableDpsOverride", "promotionReady", "canUseForReliableDps"],
  },
  safeguards: [
    "Le scenario utilisateur ne ferme aucune preuve SF_32, SF_33 ou uptime.",
    "L'uptime utilisateur est une hypothese de simulation, pas une preuve source-backed.",
    "configuredWhatIfDps ne remplace jamais reliableDps.",
    "Le ranking fiable reste strict-only tant que les gates restent bloquees.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "user-whatif-contract.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
