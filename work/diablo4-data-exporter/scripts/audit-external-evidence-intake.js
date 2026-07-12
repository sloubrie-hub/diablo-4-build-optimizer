const fs = require("fs");
const path = require("path");

const inputFile = process.argv[2] ?? "inputs/external-evidence-candidates.json";
const outDir = process.argv[3] ?? "outputs/diablo4-external-evidence-intake";

const acceptedDomains = new Set(["delta-1663210", "slots-1461593", "additive-buckets"]);
const acceptedSourceKinds = new Set(["official", "extracted-game-data", "tool-output", "documented-dataset"]);
const rejectedSourceKinds = new Set(["ui-label", "codex-ui", "localization", "inference-only", "layout-analogy"]);

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { schemaVersion: 1, candidates: [] };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function hasText(value) {
  return normalizeString(value).length > 0;
}

function normalizeCandidate(candidate, index) {
  const source = candidate.source ?? {};
  const claim = candidate.claim ?? {};
  return {
    id: normalizeString(candidate.id) || `external-evidence-${String(index + 1).padStart(3, "0")}`,
    domain: normalizeString(candidate.domain),
    assetId: normalizeNumber(candidate.assetId),
    entityId: normalizeString(candidate.entityId),
    source: {
      kind: normalizeString(source.kind),
      title: normalizeString(source.title),
      url: normalizeString(source.url),
      capturedAt: normalizeString(source.capturedAt),
      version: normalizeString(source.version),
    },
    claim: {
      type: normalizeString(claim.type),
      field: normalizeString(claim.field),
      value: claim.value ?? null,
      excerpt: normalizeString(claim.excerpt),
      mapping: normalizeString(claim.mapping),
    },
    reviewer: {
      status: normalizeString(candidate.reviewer?.status) || "pending",
      notes: Array.isArray(candidate.reviewer?.notes) ? candidate.reviewer.notes.map(String) : [],
    },
  };
}

function evaluateCandidate(candidate) {
  const blockers = [];
  const warnings = [];

  if (!acceptedDomains.has(candidate.domain)) blockers.push("domain-not-supported");
  if (candidate.assetId == null) blockers.push("asset-id-required");
  if (!hasText(candidate.source.kind)) blockers.push("source-kind-required");
  if (rejectedSourceKinds.has(candidate.source.kind)) blockers.push("source-kind-rejected");
  if (!acceptedSourceKinds.has(candidate.source.kind)) warnings.push("source-kind-not-promotable-by-default");
  if (!hasText(candidate.source.title)) blockers.push("source-title-required");
  if (!hasText(candidate.source.url) && !hasText(candidate.source.version)) blockers.push("source-reference-required");
  if (!hasText(candidate.claim.type)) blockers.push("claim-type-required");
  if (!hasText(candidate.claim.field)) blockers.push("claim-field-required");
  if (candidate.claim.value == null || candidate.claim.value === "") blockers.push("claim-value-required");
  if (!hasText(candidate.claim.excerpt) && !hasText(candidate.claim.mapping)) blockers.push("claim-evidence-required");
  if (candidate.reviewer.status !== "approved") blockers.push("manual-review-required");

  const accepted = blockers.length === 0;
  return {
    ...candidate,
    status: accepted ? "accepted" : blockers.includes("source-kind-rejected") ? "rejected" : "pending",
    blockers,
    warnings,
    usableForPromotion: false,
    promotionGuard: "accepted evidence is intake-only; target scripts must consume it explicitly before any reliableDps change",
  };
}

const input = readOptionalJson(inputFile);
const candidates = (input.candidates ?? []).map(normalizeCandidate).map(evaluateCandidate);
const accepted = candidates.filter((candidate) => candidate.status === "accepted");
const rejected = candidates.filter((candidate) => candidate.status === "rejected");
const pending = candidates.filter((candidate) => candidate.status === "pending");
const domainsCovered = Array.from(new Set(candidates.map((candidate) => candidate.domain).filter(Boolean))).sort();
const acceptedDomainsCovered = Array.from(new Set(accepted.map((candidate) => candidate.domain))).sort();

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-evidence-intake-v1",
  source: {
    inputFile,
  },
  summary: {
    candidates: candidates.length,
    accepted: accepted.length,
    pending: pending.length,
    rejected: rejected.length,
    domainsCovered,
    acceptedDomainsCovered,
    promotionReady: false,
    canModifyReliableDps: false,
    assessment: {
      kind: accepted.length ? "external-evidence-accepted-for-review" : "external-evidence-required",
      confidence: "high",
      promotionReady: false,
      finding: accepted.length
        ? "Des preuves externes sont acceptees pour revue, mais aucun score fiable n'est modifie automatiquement."
        : "Aucune preuve externe promouvable n'est encore disponible dans l'intake.",
      nextAction: accepted.length
        ? "Relier explicitement les preuves acceptees au parseur cible avant toute promotion."
        : "Ajouter une preuve source officielle, extraite ou documentee dans inputs/external-evidence-candidates.json.",
    },
  },
  candidates,
  requirements: {
    acceptedDomains: Array.from(acceptedDomains).sort(),
    acceptedSourceKinds: Array.from(acceptedSourceKinds).sort(),
    rejectedSourceKinds: Array.from(rejectedSourceKinds).sort(),
    requiredFields: [
      "domain",
      "assetId",
      "source.kind",
      "source.title",
      "source.url ou source.version",
      "claim.type",
      "claim.field",
      "claim.value",
      "claim.excerpt ou claim.mapping",
      "reviewer.status = approved",
    ],
  },
  safeguards: [
    "Ne jamais modifier reliableDps depuis l'intake seul.",
    "Rejeter les labels UI, localisation, analogies de layout et interpretations non sourcees.",
    "Exiger une revue explicite avant qu'une preuve puisse etre consommee par un parseur cible.",
    "Conserver la separation strict, what-if, candidat bloque et inconnu.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-evidence-intake.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
