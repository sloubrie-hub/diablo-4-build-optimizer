const fs = require("fs");
const path = require("path");
const { evaluateFormula } = require("../src/formula-evaluator");

const inputs = {
  activeParsed: process.argv[2] ?? "outputs/tools/source-cache/DiabloTools-d4data/data-local-3.1.1/base/meta/Power/Spiritborn_Centipede_Ultimate.pow.json",
  sourceFreshnessAudit: process.argv[3] ?? "outputs/diablo4-current-power-source-freshness-audit/current-power-source-freshness-audit.json",
  outDir: process.argv[4] ?? "outputs/diablo4-current-power-formula-graph",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function unique(values) {
  return [...new Set(values)];
}

function formulaDependencies(expression) {
  return unique([...String(expression ?? "").matchAll(/\bSF_([0-9]+)\b/g)]
    .map((match) => Number(match[1])));
}

function externalSymbols(expression) {
  const known = new Set(["table", "slevel", "pow", "min", "max", "floor", "ceil", "abs"]);
  return unique((String(expression ?? "").match(/[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_"]+)*(?:#[A-Za-z0-9_]+)?/g) ?? [])
    .filter((token) => !/^SF_[0-9]+$/.test(token))
    .filter((token) => !known.has(token.toLowerCase())));
}

function scalarExpression(hitpointSpecifier) {
  return hitpointSpecifier?.tHitpointScalar?.value ?? null;
}

function isDamageExpression(expression) {
  const value = String(expression ?? "").trim();
  return value !== "" && value !== "0";
}

const active = readJson(inputs.activeParsed);
const freshness = readJson(inputs.sourceFreshnessAudit);
const formulas = (active.ptScriptFormulas ?? []).map((formula, index) => ({
  slot: index,
  id: `SF_${index}`,
  expression: formula?.tFormula?.value ?? null,
  compiled: formula?.tFormula?.compiled ?? null,
  dependencies: formulaDependencies(formula?.tFormula?.value),
  directExternalSymbols: externalSymbols(formula?.tFormula?.value),
}));
const formulaBySlot = new Map(formulas.map((formula) => [formula.slot, formula]));
const evaluationCache = new Map();

function evaluateSlot(slot, stack = new Set()) {
  if (evaluationCache.has(slot)) return evaluationCache.get(slot);
  const formula = formulaBySlot.get(slot);
  if (!formula || formula.expression == null || formula.expression.trim() === "") {
    const result = { status: "unresolved", value: null, blockers: ["empty-or-missing-formula"] };
    evaluationCache.set(slot, result);
    return result;
  }
  if (stack.has(slot)) {
    const result = { status: "unresolved", value: null, blockers: ["formula-cycle"] };
    evaluationCache.set(slot, result);
    return result;
  }

  const nextStack = new Set(stack).add(slot);
  const dependencyResults = formula.dependencies.map((dependency) => [dependency, evaluateSlot(dependency, nextStack)]);
  const blockers = [
    ...formula.directExternalSymbols.map((symbol) => `external-symbol:${symbol}`),
    ...dependencyResults.flatMap(([dependency, result]) => result.status === "resolved"
      ? []
      : result.blockers.map((blocker) => `SF_${dependency}:${blocker}`)),
  ];
  if (blockers.length) {
    const result = { status: "unresolved", value: null, blockers: unique(blockers) };
    evaluationCache.set(slot, result);
    return result;
  }

  const sf = Object.fromEntries(dependencyResults.map(([dependency, result]) => [dependency, result.value]));
  let value = null;
  try {
    value = evaluateFormula(formula.expression, {
      variables: { sLevel: 1 },
      sf,
      mods: {},
      tables: { 34: { 1: 1 }, 35: { 1: 1 } },
      refs: {},
      missingValue: Number.NaN,
    });
  } catch (error) {
    const result = { status: "unresolved", value: null, blockers: [`parse-error:${error.message}`] };
    evaluationCache.set(slot, result);
    return result;
  }

  const result = Number.isFinite(value)
    ? { status: "resolved", value, blockers: [] }
    : { status: "unresolved", value: null, blockers: ["non-finite-normalized-value"] };
  evaluationCache.set(slot, result);
  return result;
}

function dependencyClosure(expression) {
  const visited = new Set();
  const pending = [...formulaDependencies(expression)];
  while (pending.length) {
    const slot = pending.shift();
    if (visited.has(slot)) continue;
    visited.add(slot);
    const formula = formulaBySlot.get(slot);
    for (const dependency of formula?.dependencies ?? []) pending.push(dependency);
  }
  return [...visited].sort((a, b) => a - b);
}

function expressionExternalSymbols(expression) {
  return unique([
    ...externalSymbols(expression),
    ...dependencyClosure(expression).flatMap((slot) => formulaBySlot.get(slot)?.directExternalSymbols ?? []),
  ]);
}

function evaluateConsumerExpression(expression) {
  const dependencies = formulaDependencies(expression);
  const dependencyResults = dependencies.map((dependency) => [dependency, evaluateSlot(dependency)]);
  const blockers = [
    ...externalSymbols(expression).map((symbol) => `external-symbol:${symbol}`),
    ...dependencyResults.flatMap(([dependency, result]) => result.status === "resolved"
      ? []
      : result.blockers.map((blocker) => `SF_${dependency}:${blocker}`)),
  ];
  if (blockers.length) return { status: "unresolved", value: null, blockers: unique(blockers) };

  const sf = Object.fromEntries(dependencyResults.map(([dependency, result]) => [dependency, result.value]));
  try {
    const value = evaluateFormula(expression, {
      variables: { sLevel: 1 },
      sf,
      mods: {},
      tables: { 34: { 1: 1 }, 35: { 1: 1 } },
      refs: {},
      missingValue: Number.NaN,
    });
    return Number.isFinite(value)
      ? { status: "resolved", value, blockers: [] }
      : { status: "unresolved", value: null, blockers: ["non-finite-normalized-value"] };
  } catch (error) {
    return { status: "unresolved", value: null, blockers: [`parse-error:${error.message}`] };
  }
}

const payloadConsumers = (active.arPayloads ?? [])
  .map((payload, index) => ({ payload, index, expression: scalarExpression(payload.tDamage) }))
  .filter((row) => isDamageExpression(row.expression))
  .map(({ payload, index, expression }) => ({
    id: `payload:${index}`,
    kind: "payload-damage",
    sourcePath: `arPayloads.${index}.tDamage.tHitpointScalar`,
    index,
    payloadId: payload.dwPayloadId ?? 0,
    payloadHash: payload.dwID ?? null,
    damageType: payload.eForcedDamageType ?? -1,
    classBaseDamageScalar: payload.eClassBaseDamageScalar ?? -1,
    expression,
    dependencySlots: dependencyClosure(expression).map((slot) => `SF_${slot}`),
    externalSymbols: expressionExternalSymbols(expression),
    normalizedRankOne: evaluateConsumerExpression(expression),
    activationStatus: "unmapped",
    strictEligibility: "blocked-until-activation-and-cadence-proven",
  }));

const dotConsumers = (active.arBuffs ?? [])
  .map((buff, index) => ({ buff, index, expression: scalarExpression(buff.tDOT?.tDamage) }))
  .filter((row) => isDamageExpression(row.expression))
  .map(({ buff, index, expression }) => ({
    id: `buff-dot:${index}`,
    kind: "buff-dot-damage",
    sourcePath: `arBuffs.${index}.tDOT.tDamage.tHitpointScalar`,
    index,
    damageType: buff.tDOT?.eDamageType ?? -1,
    classBaseDamageScalar: buff.tDOT?.eClassBaseDamageScalar ?? -1,
    expression,
    durationExpression: buff.tDuration?.value ?? null,
    dependencySlots: dependencyClosure(expression).map((slot) => `SF_${slot}`),
    externalSymbols: expressionExternalSymbols(expression),
    normalizedRankOne: evaluateConsumerExpression(expression),
    activationStatus: "unmapped",
    strictEligibility: "blocked-until-tick-rate-duration-and-activation-proven",
  }));

const consumers = [...payloadConsumers, ...dotConsumers];
const buildStateSlots = formulas
  .filter((formula) => /^Mod\./.test(String(formula.expression ?? "")))
  .map((formula) => ({
    slot: formula.id,
    expression: formula.expression,
    referencedByFormulaSlots: formulas
      .filter((candidate) => candidate.dependencies.includes(formula.slot))
      .map((candidate) => candidate.id),
    referencedByDamageConsumers: consumers
      .filter((consumer) => consumer.dependencySlots.includes(formula.id))
      .map((consumer) => consumer.id),
  }));
const normalizedConsumers = consumers.filter((consumer) => consumer.normalizedRankOne.status === "resolved");
const unresolvedConsumers = consumers.filter((consumer) => consumer.normalizedRankOne.status !== "resolved");
const legacySlotConsumers = consumers.filter((consumer) => consumer.dependencySlots.includes("SF_32") || consumer.dependencySlots.includes("SF_33"));
const blockers = [
  "payload-dispatch-activation-unmapped",
  "hit-count-and-cadence-unmapped",
  "dot-tick-rate-and-duration-unmapped",
  "table-34-source-values-unproven",
  "class-base-damage-scalar-semantics-unmapped",
  "build-state-to-payload-bridge-unmapped",
];

const graphReady = formulas.length > 0 && consumers.length > 0;
const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "current-power-formula-graph-v1",
  source: {
    activeParsed: inputs.activeParsed,
    sourceFreshnessAudit: inputs.sourceFreshnessAudit,
    currentBuild: freshness.summary?.currentBuild ?? null,
    activePayloadSha256: freshness.activeBinary?.sha256 ?? null,
  },
  summary: {
    assetId: Number(active.__snoID__ ?? freshness.summary?.assetId),
    entityId: `skill:${Number(active.__snoID__ ?? freshness.summary?.assetId)}`,
    currentBuild: freshness.summary?.currentBuild ?? null,
    formulaNodes: formulas.length,
    formulaEdges: formulas.reduce((sum, formula) => sum + formula.dependencies.length, 0),
    payloadDamageConsumers: payloadConsumers.length,
    dotDamageConsumers: dotConsumers.length,
    damageConsumers: consumers.length,
    normalizedRankOneConsumers: normalizedConsumers.length,
    unresolvedConsumers: unresolvedConsumers.length,
    buildStateSlots: buildStateSlots.length,
    connectedBuildStateSlots: buildStateSlots.filter((slot) => slot.referencedByDamageConsumers.length > 0).length,
    legacySf32Sf33DamageConsumers: legacySlotConsumers.length,
    graphReady,
    activationGraphReady: false,
    currentStrictDpsKnown: false,
    currentModelReady: false,
    canUseForCurrentBuild: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    canModifyReliableDps: false,
    blockers,
    assessment: {
      kind: graphReady
        ? "active-formula-consumers-extracted-dps-schedule-blocked"
        : "active-formula-graph-incomplete",
      confidence: graphReady ? "high" : "medium",
      finding: graphReady
        ? "Les consommateurs de degats actifs sont relies aux formules, mais leur activation, cadence et composition DPS ne sont pas encore prouvees."
        : "Le graphe actif ne contient pas assez de formules ou de consommateurs de degats.",
      nextAction: "Relier les payloadId et buffs aux evenements d'activation, aux nombres de touches et aux ticks avant de sommer un DPS strict.",
    },
  },
  formulas,
  buildStateSlots,
  damageConsumers: consumers,
  normalizedRankOneConsumers: normalizedConsumers.map((consumer) => ({
    id: consumer.id,
    expression: consumer.expression,
    normalizedValue: consumer.normalizedRankOne.value,
    note: "Valeur structurelle avec Table(34/35, rang 1)=1; ce n'est pas un DPS.",
  })),
  unresolvedConsumers: unresolvedConsumers.map((consumer) => ({
    id: consumer.id,
    expression: consumer.expression,
    blockers: consumer.normalizedRankOne.blockers,
  })),
  blockers,
  safeguards: {
    normalizedValuesAreNotDps: true,
    noConsumerSummationWithoutActivationProof: true,
    noHistoricalSf32Sf33CarryOver: true,
    currentUnknownsRemainNull: true,
    noTargetDatasetWrite: true,
    canModifyReliableDps: false,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "current-power-formula-graph.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
