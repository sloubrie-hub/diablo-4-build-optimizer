const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const inputs = {
  manifest: process.argv[2] ?? "outputs/diablo4-current-install-scan-3.1.1/manifest.json",
  activePayload: process.argv[3] ?? "outputs/diablo4-current-casc-3.1.1/base/meta/Power/Spiritborn_Centipede_Ultimate.pow",
  legacyPayload: process.argv[4] ?? "outputs/diablo4-source-asset-1663210-payload/data.007.8265002.decoded.bin",
  activeParsed: process.argv[5] ?? "outputs/tools/source-cache/DiabloTools-d4data/data-local-3.1.1/base/meta/Power/Spiritborn_Centipede_Ultimate.pow.json",
  referenceParsed: process.argv[6] ?? "outputs/tools/source-cache/DiabloTools-d4data/json/base/meta/Power/Spiritborn_Centipede_Ultimate.pow.json",
  referenceBuildVersion: process.argv[7] ?? "outputs/tools/source-cache/DiabloTools-d4data/buildVersion.txt",
  outDir: process.argv[8] ?? "outputs/diablo4-current-power-source-freshness-audit",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeSemanticValue(value) {
  if (Array.isArray(value)) return value.map(normalizeSemanticValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value)
    .filter((key) => key !== "__fileName__")
    .sort()
    .map((key) => [key, normalizeSemanticValue(value[key])]));
}

function semanticHash(value) {
  return sha256(JSON.stringify(normalizeSemanticValue(value)));
}

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
    return output;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
  return output;
}

function formulaValue(parsed, index) {
  return parsed.ptScriptFormulas?.[index]?.tFormula?.value ?? null;
}

function readRepositoryCommit(filePath) {
  const root = path.dirname(filePath);
  const gitDir = path.join(root, ".git");
  const headFile = path.join(gitDir, "HEAD");
  if (!fs.existsSync(headFile)) return null;
  const head = fs.readFileSync(headFile, "utf8").trim();
  if (!head.startsWith("ref: ")) return head || null;
  const ref = head.slice(5).trim();
  const looseRef = path.join(gitDir, ...ref.split("/"));
  if (fs.existsSync(looseRef)) return fs.readFileSync(looseRef, "utf8").trim() || null;
  const packedRefs = path.join(gitDir, "packed-refs");
  if (!fs.existsSync(packedRefs)) return null;
  const match = fs.readFileSync(packedRefs, "utf8")
    .split(/\r?\n/)
    .find((line) => line.endsWith(` ${ref}`));
  return match?.split(" ")[0] ?? null;
}

function binaryMetadata(buffer) {
  return {
    size: buffer.length,
    sha256: sha256(buffer),
    signature: buffer.length >= 4 ? `0x${buffer.readUInt32LE(0).toString(16).padStart(8, "0")}` : null,
    formatHash: buffer.length >= 8 ? buffer.readUInt32LE(4) : null,
    assetId: buffer.length >= 20 ? buffer.readUInt32LE(16) : null,
  };
}

const manifest = readJson(inputs.manifest);
const activeBuffer = fs.readFileSync(inputs.activePayload);
const legacyBuffer = fs.readFileSync(inputs.legacyPayload);
const activeParsed = readJson(inputs.activeParsed);
const referenceParsed = readJson(inputs.referenceParsed);
const referenceBuild = fs.readFileSync(inputs.referenceBuildVersion, "utf8").trim();

const activeBinary = binaryMetadata(activeBuffer);
const legacyBinary = binaryMetadata(legacyBuffer);
const activeSemanticHash = semanticHash(activeParsed);
const referenceSemanticHash = semanticHash(referenceParsed);
const activeMatchesLegacy = activeBinary.sha256 === legacyBinary.sha256;
const activeMatchesReferenceSnapshot = activeSemanticHash === referenceSemanticHash;
const formulaStrings = collectStrings(activeParsed.ptScriptFormulas ?? []);
const legacyConditionalReferences = formulaStrings.filter((value) => /\bSF_(?:32|33)\b/.test(value));
const assetId = Number(activeParsed.__snoID__ ?? activeBinary.assetId);
const currentBuild = manifest.buildInfo?.find((row) => row.Active === "1")?.Version
  ?? manifest.buildInfo?.[0]?.Version
  ?? null;
const sourceChangedSinceLegacyModel = !activeMatchesLegacy;
const legacyConditionalBranchActive = legacyConditionalReferences.length > 0;
const currentModelReady = false;

const checks = [
  {
    id: "active-payload-signature",
    status: activeBinary.signature === "0xdeadbeef" ? "passed" : "failed",
    evidence: activeBinary.signature,
  },
  {
    id: "active-asset-id",
    status: assetId === 1663210 && activeBinary.assetId === 1663210 ? "passed" : "failed",
    evidence: { parsedAssetId: assetId, binaryAssetId: activeBinary.assetId },
  },
  {
    id: "active-payload-compared-to-legacy",
    status: sourceChangedSinceLegacyModel ? "passed" : "failed",
    evidence: { active: activeBinary.sha256, legacy: legacyBinary.sha256 },
  },
  {
    id: "active-semantics-match-d4data-reference",
    status: activeMatchesReferenceSnapshot ? "passed" : "failed",
    evidence: { active: activeSemanticHash, reference: referenceSemanticHash },
  },
  {
    id: "legacy-sf32-sf33-branch-absent",
    status: legacyConditionalBranchActive ? "failed" : "passed",
    evidence: legacyConditionalReferences,
  },
  {
    id: "current-model-kept-closed",
    status: currentModelReady === false ? "passed" : "failed",
    evidence: "strict DPS must be rebuilt from the active source",
  },
];

const failedChecks = checks.filter((check) => check.status !== "passed");
const sourceEvidenceReady =
  activeBinary.signature === "0xdeadbeef" &&
  assetId === 1663210 &&
  activeBinary.assetId === 1663210 &&
  sourceChangedSinceLegacyModel &&
  activeMatchesReferenceSnapshot &&
  !legacyConditionalBranchActive;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "current-power-source-freshness-audit-v1",
  source: {
    manifest: inputs.manifest,
    activePayload: inputs.activePayload,
    legacyPayload: inputs.legacyPayload,
    activeParsed: inputs.activeParsed,
    referenceParsed: inputs.referenceParsed,
    referenceBuildVersion: inputs.referenceBuildVersion,
    referenceRepository: "https://github.com/DiabloTools/d4data",
    referenceCommit: readRepositoryCommit(inputs.referenceBuildVersion),
  },
  summary: {
    assetId,
    entityId: `skill:${assetId}`,
    currentBuild,
    detectedBuildName: manifest.detectedBuild?.name ?? null,
    referenceBuild,
    sourceEvidenceReady,
    sourceChangedSinceLegacyModel,
    activeMatchesLegacy,
    activeMatchesReferenceSnapshot,
    legacyConditionalBranchActive,
    legacyConditionalReferenceCount: legacyConditionalReferences.length,
    currentStrictDpsKnown: false,
    currentWhatIfDpsKnown: false,
    currentCandidateDeltaKnown: false,
    currentModelReady,
    legacyDpsHistorical: true,
    modelRefreshRequired: true,
    canUseForCurrentBuild: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    canLoadAsWorkingBase: false,
    canModifyReliableDps: false,
    assessment: {
      kind: sourceEvidenceReady
        ? "current-source-changed-model-refresh-required"
        : "current-source-audit-incomplete",
      confidence: sourceEvidenceReady ? "high" : "medium",
      finding: sourceEvidenceReady
        ? "Le payload actif a change et ne contient plus la branche historique qui consommait SF_32/SF_33."
        : "La comparaison de la source active reste incomplete ou contradictoire.",
      nextAction: "Reconstruire le graphe de formules et recalculer le DPS strict depuis la source active avant tout classement courant.",
    },
  },
  activeBinary,
  legacyBinary,
  semanticComparison: {
    activeSemanticHash,
    referenceSemanticHash,
    activeMatchesReferenceSnapshot,
    ignoredVolatileFields: ["__fileName__"],
  },
  formulaSlots: {
    SF_27: formulaValue(activeParsed, 27),
    SF_32: formulaValue(activeParsed, 32),
    SF_33: formulaValue(activeParsed, 33),
  },
  formulaUsage: {
    legacyConditionalReferences,
    legacyConditionalBranchActive,
    finding: legacyConditionalBranchActive
      ? "Une formule active reference encore SF_32 ou SF_33."
      : "Aucune formule active ne reference SF_32 ou SF_33.",
  },
  parserCompatibility: {
    activeFormatHash: activeBinary.formatHash,
    injectedFormatHashForReadOnlyParse: 2860142965,
    parsedType: activeParsed.__type__ ?? null,
    parsedTypeHash: activeParsed.__typeHash__ ?? null,
    gameplayBytesModified: false,
    note: "Le hash de definition est injecte uniquement dans une copie de travail pour permettre le parsing read-only.",
  },
  legacyModelSnapshot: {
    buildScope: "historical-pre-3.1.1",
    strictDps: 163200,
    whatIfDps: 212160,
    candidateDelta: 48960,
    status: "historical-reference-not-current",
  },
  currentModelValues: {
    strictDps: null,
    whatIfDps: null,
    candidateDelta: null,
    status: "unknown-until-active-model-rebuild",
  },
  checks,
  failedChecks,
  safeguards: {
    legacyValuesRemainHistorical: true,
    currentUnknownsRemainNull: true,
    noAutomaticPromotion: true,
    noTargetDatasetWrite: true,
    reliableDpsStrictOnly: true,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "current-power-source-freshness-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
