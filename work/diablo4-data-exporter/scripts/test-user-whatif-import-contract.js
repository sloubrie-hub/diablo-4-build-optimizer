const fs = require("fs");

const contractFile = process.argv[2] ?? "outputs/diablo4-user-whatif-contract/user-whatif-contract.json";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeUptimeValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function assertInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sanitizeImportedUserScenario(userScenario, forbiddenFields) {
  if (!userScenario || typeof userScenario !== "object") {
    return {
      value: { sf33Active: false, uptime: 1 },
      ignoredForbiddenFields: [],
    };
  }
  return {
    value: {
      sf33Active: Boolean(userScenario.sf33Active),
      uptime: normalizeUptimeValue(userScenario.uptime ?? 1),
    },
    ignoredForbiddenFields: forbiddenFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(userScenario, field)),
  };
}

const contract = readJson(contractFile);
const forbiddenFields = contract.exportPolicy?.forbiddenFields ?? [];
assertInvariant(forbiddenFields.includes("reliableDpsOverride"), "contract must forbid reliableDpsOverride");
assertInvariant(forbiddenFields.includes("promotionReady"), "contract must forbid promotionReady");
assertInvariant(forbiddenFields.includes("canUseForReliableDps"), "contract must forbid canUseForReliableDps");

const maliciousPayload = {
  scenarioId: contract.summary?.scenarioId,
  sf33Active: true,
  uptime: 1.75,
  reliableDpsOverride: 999999,
  promotionReady: true,
  canUseForReliableDps: true,
};

const sanitized = sanitizeImportedUserScenario(maliciousPayload, forbiddenFields);
assertInvariant(sanitized.value.sf33Active === true, "sf33Active should remain importable");
assertInvariant(sanitized.value.uptime === 1, "uptime should be clamped to 1");
assertInvariant(sanitized.ignoredForbiddenFields.length === 3, "all forbidden fields should be ignored");
assertInvariant(!Object.prototype.hasOwnProperty.call(sanitized.value, "reliableDpsOverride"), "sanitized scenario must not carry reliableDpsOverride");
assertInvariant(!Object.prototype.hasOwnProperty.call(sanitized.value, "promotionReady"), "sanitized scenario must not carry promotionReady");
assertInvariant(!Object.prototype.hasOwnProperty.call(sanitized.value, "canUseForReliableDps"), "sanitized scenario must not carry canUseForReliableDps");

console.log(JSON.stringify({
  status: "user-whatif-import-contract-test-ok",
  ignoredForbiddenFields: sanitized.ignoredForbiddenFields,
  sanitized: sanitized.value,
}, null, 2));
