const fs = require("fs");

function exportTargetDatasetFromOptimizerFile(filePath) {
  const optimizerDataset = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return exportTargetDatasetFromOptimizer(optimizerDataset);
}

function exportTargetDatasetFromOptimizer(optimizerDataset) {
  const entities = emptyEntities();
  const relations = [];

  for (const asset of optimizerDataset.assets ?? []) {
    const entity = entityFromAsset(asset);
    entities[entity.collection].push(entity.value);

    const strictFormula = strictFormulaFromAsset(asset);
    entities.formulas.push(strictFormula);
    relations.push(relation(entity.value.id, strictFormula.id, "modifies", asset, "strict-dps-formula"));

    for (const formula of [...(asset.formulas?.damage ?? []), ...(asset.formulas?.support ?? [])]) {
      const normalized = formulaFromAssetFormula(asset, formula);
      entities.formulas.push(normalized);
      relations.push(relation(entity.value.id, normalized.id, "modifies", asset, "extracted-formula"));
    }

    for (const candidate of asset.candidates ?? []) {
      const condition = conditionFromCandidate(asset, candidate);
      entities.conditions.push(condition);
      relations.push(relation(entity.value.id, condition.id, "requires", asset, "candidate-condition"));
    }
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    source: {
      game: "diablo4",
      build: optimizerDataset.source?.modelBuiltAt ?? "unknown",
      season: null,
      extractor: "diablo4-data-exporter target-dataset-v0",
      notes: [
        "Partial conversion from optimizer-dataset-v0.",
        "Technical labels are not guaranteed localized game names.",
        "Candidate conditions remain blocked until field ownership, trigger state, and uptime are proven."
      ],
    },
    entities,
    relations,
  };
}

function emptyEntities() {
  return {
    skills: [],
    items: [],
    affixes: [],
    aspects: [],
    paragonNodes: [],
    glyphs: [],
    runes: [],
    formulas: [],
    conditions: [],
  };
}

function entityFromAsset(asset) {
  if (asset.tags?.includes("Affix")) {
    return {
      collection: asset.tags.includes("Legendary") || asset.tags.includes("Unique") ? "aspects" : "affixes",
      value: aspectOrAffixFromAsset(asset),
    };
  }

  return {
    collection: "skills",
    value: skillFromAsset(asset),
  };
}

function skillFromAsset(asset) {
  return {
    id: entityId("skill", asset),
    assetId: asset.assetId,
    name: asset.label,
    class: classFromTags(asset.tags),
    kind: skillKindFromLabel(asset.label),
    maxPoints: asset.tags?.includes("PowerTag") ? 1 : 0,
    tags: asset.tags ?? [],
    cost: null,
    cooldownSeconds: null,
    modifiers: [strictDamageModifier(asset), ...candidateModifiers(asset)],
    evidence: evidence(asset, "optimizer-dataset", "assets[]", confidenceForAsset(asset)),
  };
}

function aspectOrAffixFromAsset(asset) {
  const isAspect = asset.tags?.includes("Legendary") || asset.tags?.includes("Unique");
  return {
    id: entityId(isAspect ? "aspect" : "affix", asset),
    assetId: asset.assetId,
    name: asset.label,
    ...(isAspect ? { class: classFromTags(asset.tags), allowedSlots: [] } : { rollRange: null }),
    modifiers: [strictDamageModifier(asset), ...candidateModifiers(asset)],
    evidence: evidence(asset, "optimizer-dataset", "assets[]", confidenceForAsset(asset)),
  };
}

function strictDamageModifier(asset) {
  return {
    id: `modifier:${asset.assetId}:strict-dps`,
    stat: "estimatedDps",
    operation: "add",
    value: asset.strict?.estimatedDps ?? 0,
    formulaId: `formula:${asset.assetId}:strict-dps`,
    conditionIds: [],
    uptime: asset.strict?.components?.uptimeProduct ?? 1,
    bucket: "strict-reviewed-dps",
    evidence: evidence(asset, "optimizer-dataset", "strict.estimatedDps", "high"),
  };
}

function candidateModifiers(asset) {
  return (asset.candidates ?? []).map((candidate) => ({
    id: `modifier:${asset.assetId}:${candidate.canonicalId}`,
    stat: "estimatedDps",
    operation: "unknown",
    value: candidate.scenarioImpact?.estimatedDps ?? null,
    formulaId: null,
    conditionIds: [`condition:${candidate.canonicalId}`],
    uptime: null,
    bucket: "blocked-candidate",
    evidence: candidateEvidence(asset, candidate, "candidate"),
  }));
}

function strictFormulaFromAsset(asset) {
  const components = asset.strict?.components ?? {};
  return {
    id: `formula:${asset.assetId}:strict-dps`,
    assetId: asset.assetId,
    expression: [
      Number(components.weaponDamage ?? 0),
      Number(components.attackSpeed ?? 0),
      Number(components.primaryDamageCoefficient ?? 0),
      Number(components.multiplierProduct ?? 1),
      Number(components.uptimeProduct ?? 1),
    ].join(" * "),
    role: "damage",
    inputs: ["weaponDamage", "attackSpeed", "primaryDamageCoefficient", "multiplierProduct", "uptimeProduct"],
    conditionIds: [],
    evidence: evidence(asset, "optimizer-dataset", "strict.components", "high"),
  };
}

function formulaFromAssetFormula(asset, formula) {
  return {
    id: `formula:${asset.assetId}:${formula.nodeId}`,
    assetId: asset.assetId,
    expression: formula.canonicalExpression || formula.expression || "unknown",
    role: formulaRole(formula),
    inputs: formulaInputs(formula.canonicalExpression || formula.expression || ""),
    conditionIds: [],
    evidence: evidence(asset, "optimizer-dataset", `formulas.${formula.nodeId}`, formula.role?.confidence ?? "medium"),
  };
}

function conditionFromCandidate(asset, candidate) {
  return {
    id: `condition:${candidate.canonicalId}`,
    name: candidate.triggerCandidate?.label || candidate.target || candidate.canonicalId,
    kind: "toggle",
    defaultState: false,
    evidence: candidateEvidence(asset, candidate, "triggerCandidate"),
  };
}

function relation(from, to, kind, asset, field) {
  return {
    from,
    to,
    kind,
    evidence: evidence(asset, "optimizer-dataset", field, "medium"),
  };
}

function evidence(asset, source, field, confidence) {
  return {
    source,
    assetId: asset.assetId ?? null,
    file: asset.source?.fileName ?? null,
    offset: asset.source?.blteOffset ?? null,
    field,
    confidence: normalizeConfidence(confidence),
    notes: [],
  };
}

function candidateEvidence(asset, candidate, field) {
  return {
    source: "conditional-candidate-context",
    assetId: asset.assetId ?? null,
    file: asset.source?.fileName ?? null,
    offset: candidate.evidence?.[0]?.offset ?? null,
    field,
    confidence: normalizeConfidence(candidate.confidence || candidate.promotionStatus?.confidence || "medium-high"),
    notes: [
      candidate.promotionStatus?.note,
      ...(candidate.promotionStatus?.blockers ?? []).map((blocker) => `blocked: ${blocker}`),
    ].filter(Boolean),
  };
}

function entityId(prefix, asset) {
  return `${prefix}:${asset.assetId}`;
}

function classFromTags(tags = []) {
  const lowered = tags.map((tag) => String(tag).toLowerCase());
  for (const className of ["barbarian", "druid", "necromancer", "rogue", "sorcerer", "spiritborn"]) {
    if (lowered.includes(className)) return className;
  }
  return lowered.some((tag) => tag === "paladin") ? "unknown" : "generic";
}

function skillKindFromLabel(label = "") {
  const lower = label.toLowerCase();
  if (lower.includes("ultimate")) return "ultimate";
  if (lower.includes("passive")) return "passive";
  return "unknown";
}

function formulaRole(formula) {
  const role = formula.role?.role ?? "";
  if (role.includes("damage")) return "damage";
  if (role.includes("multiplier")) return "multiplier";
  if (role.includes("uptime")) return "uptime";
  if (role.includes("display")) return "display";
  return "unknown";
}

function formulaInputs(expression) {
  return [...new Set(String(expression).match(/\b[A-Za-z_][A-Za-z0-9_:]*\b/g) ?? [])]
    .filter((token) => !["Table", "sLevel"].includes(token));
}

function confidenceForAsset(asset) {
  return asset.strict?.estimatedDps > 0 ? "medium-high" : "medium";
}

function normalizeConfidence(value) {
  if (value === "confirmed" || value === "high" || value === "medium-high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

module.exports = {
  exportTargetDatasetFromOptimizer,
  exportTargetDatasetFromOptimizerFile,
};
