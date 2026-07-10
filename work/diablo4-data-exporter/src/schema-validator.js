const fs = require("fs");
const path = require("path");

const REQUIRED_ENTITY_COLLECTIONS = [
  "skills",
  "items",
  "affixes",
  "aspects",
  "paragonNodes",
  "glyphs",
  "runes",
  "formulas",
  "conditions",
];

const ALLOWED_CONFIDENCE = new Set(["low", "medium", "medium-high", "high", "confirmed"]);
const ALLOWED_CLASSES = new Set(["barbarian", "druid", "necromancer", "rogue", "sorcerer", "spiritborn", "generic", "unknown"]);

function validateTargetDatasetFile(filePath) {
  const dataset = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return validateTargetDataset(dataset, { filePath });
}

function validateTargetDataset(dataset, options = {}) {
  const issues = [];
  const warnings = [];
  const ids = new Set();

  requireObject(dataset, "dataset", issues);
  requireEqual(dataset.schemaVersion, 1, "schemaVersion", issues);
  requireString(dataset.exportedAt, "exportedAt", issues);
  validateSource(dataset.source, issues);
  validateEntities(dataset.entities, issues, warnings, ids);
  validateRelations(dataset.relations, issues, warnings, ids);

  return {
    ok: issues.length === 0,
    schemaVersion: dataset.schemaVersion,
    filePath: options.filePath ? path.resolve(options.filePath) : null,
    summary: {
      issues: issues.length,
      warnings: warnings.length,
      ids: ids.size,
      collections: summarizeCollections(dataset.entities),
      relations: Array.isArray(dataset.relations) ? dataset.relations.length : 0,
    },
    issues,
    warnings,
  };
}

function validateSource(source, issues) {
  requireObject(source, "source", issues);
  if (!source || typeof source !== "object") return;
  requireEqual(source.game, "diablo4", "source.game", issues);
  requireString(source.build, "source.build", issues);
  requireString(source.extractor, "source.extractor", issues);
}

function validateEntities(entities, issues, warnings, ids) {
  requireObject(entities, "entities", issues);
  if (!entities || typeof entities !== "object") return;

  for (const collection of REQUIRED_ENTITY_COLLECTIONS) {
    if (!Array.isArray(entities[collection])) {
      issues.push(`${collection}: collection array is required`);
      continue;
    }
    entities[collection].forEach((entity, index) => validateEntity(collection, entity, index, issues, warnings, ids));
  }
}

function validateEntity(collection, entity, index, issues, warnings, ids) {
  const basePath = `entities.${collection}[${index}]`;
  requireObject(entity, basePath, issues);
  if (!entity || typeof entity !== "object") return;

  requireString(entity.id, `${basePath}.id`, issues);
  if (entity.id) {
    if (ids.has(entity.id)) issues.push(`${basePath}.id: duplicate id "${entity.id}"`);
    ids.add(entity.id);
  }

  if (["skills", "items", "aspects", "paragonNodes", "glyphs"].includes(collection)) {
    validateClass(entity.class, `${basePath}.class`, issues);
  }

  validateEvidence(entity.evidence, `${basePath}.evidence`, issues);

  if (Array.isArray(entity.modifiers)) {
    entity.modifiers.forEach((modifier, modifierIndex) => {
      validateModifier(modifier, `${basePath}.modifiers[${modifierIndex}]`, issues, warnings);
    });
  }

  if (collection === "formulas") {
    requireString(entity.expression, `${basePath}.expression`, issues);
    if (!Array.isArray(entity.inputs)) issues.push(`${basePath}.inputs: array is required`);
  }

  if (collection === "conditions") {
    requireString(entity.name, `${basePath}.name`, issues);
    requireString(entity.kind, `${basePath}.kind`, issues);
  }
}

function validateModifier(modifier, basePath, issues, warnings) {
  requireObject(modifier, basePath, issues);
  if (!modifier || typeof modifier !== "object") return;
  requireString(modifier.id, `${basePath}.id`, issues);
  requireString(modifier.stat, `${basePath}.stat`, issues);
  requireString(modifier.operation, `${basePath}.operation`, issues);
  validateEvidence(modifier.evidence, `${basePath}.evidence`, issues);
  if (modifier.operation === "unknown") warnings.push(`${basePath}.operation: unknown operation must be resolved before DPS promotion`);
  if (modifier.uptime != null && (typeof modifier.uptime !== "number" || modifier.uptime < 0 || modifier.uptime > 1)) {
    issues.push(`${basePath}.uptime: must be a number between 0 and 1`);
  }
}

function validateRelations(relations, issues, warnings, ids) {
  if (!Array.isArray(relations)) {
    issues.push("relations: array is required");
    return;
  }

  relations.forEach((relation, index) => {
    const basePath = `relations[${index}]`;
    requireObject(relation, basePath, issues);
    if (!relation || typeof relation !== "object") return;
    requireString(relation.from, `${basePath}.from`, issues);
    requireString(relation.to, `${basePath}.to`, issues);
    requireString(relation.kind, `${basePath}.kind`, issues);
    validateEvidence(relation.evidence, `${basePath}.evidence`, issues);
    if (relation.from && !ids.has(relation.from)) warnings.push(`${basePath}.from: unknown id "${relation.from}"`);
    if (relation.to && !ids.has(relation.to)) warnings.push(`${basePath}.to: unknown id "${relation.to}"`);
  });
}

function validateEvidence(evidence, basePath, issues) {
  requireObject(evidence, basePath, issues);
  if (!evidence || typeof evidence !== "object") return;
  requireString(evidence.source, `${basePath}.source`, issues);
  if (!ALLOWED_CONFIDENCE.has(evidence.confidence)) {
    issues.push(`${basePath}.confidence: invalid confidence "${evidence.confidence}"`);
  }
}

function validateClass(value, pathName, issues) {
  if (!ALLOWED_CLASSES.has(value)) issues.push(`${pathName}: invalid class "${value}"`);
}

function summarizeCollections(entities) {
  const summary = {};
  if (!entities || typeof entities !== "object") return summary;
  for (const collection of REQUIRED_ENTITY_COLLECTIONS) {
    summary[collection] = Array.isArray(entities[collection]) ? entities[collection].length : null;
  }
  return summary;
}

function requireObject(value, pathName, issues) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    issues.push(`${pathName}: object is required`);
  }
}

function requireString(value, pathName, issues) {
  if (typeof value !== "string" || !value.trim()) {
    issues.push(`${pathName}: non-empty string is required`);
  }
}

function requireEqual(value, expected, pathName, issues) {
  if (value !== expected) {
    issues.push(`${pathName}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
  }
}

module.exports = {
  validateTargetDataset,
  validateTargetDatasetFile,
};
