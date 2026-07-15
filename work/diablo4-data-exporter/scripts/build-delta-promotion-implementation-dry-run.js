const fs = require("fs");
const path = require("path");

const promotionAuditFile = process.argv[2] ?? "outputs/diablo4-delta-evidence-promotion-audit/delta-evidence-promotion-audit.json";
const targetDatasetFile = process.argv[3] ?? "outputs/diablo4-target-dataset/target-dataset.json";
const outDir = process.argv[4] ?? "outputs/diablo4-delta-promotion-implementation-dry-run";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findTargetEntity(targetDataset, entityId) {
  const groups = targetDataset.entities ?? {};
  for (const records of Object.values(groups)) {
    const found = (records ?? []).find((record) => record.id === entityId);
    if (found) return found;
  }
  return null;
}

const promotionAudit = readJson(promotionAuditFile);
const targetDataset = readJson(targetDatasetFile);
const summary = promotionAudit.summary ?? {};
const targetEntity = findTargetEntity(targetDataset, summary.entityId ?? "skill:1663210");
const currentStrictDps = targetEntity?.dps?.strict ?? summary.strictDps ?? 163200;
const proposedReliableDps = summary.proposedReliableDps ?? currentStrictDps + (summary.blockedDeltaDps ?? 48960);

const dryRunChecks = [
  {
    id: "promotion-audit-ready",
    status: summary.readyForPromotionImplementation === true ? "passed" : "failed",
    finding: summary.readyForPromotionImplementation === true
      ? "L'audit de promotion autorise un dry-run d'implementation."
      : "L'audit de promotion reste bloque.",
  },
  {
    id: "target-entity-found",
    status: targetEntity ? "passed" : "failed",
    finding: targetEntity
      ? "L'entite cible est presente dans le target dataset."
      : "L'entite cible est absente du target dataset.",
  },
  {
    id: "proposed-dps-matches-reference",
    status: proposedReliableDps === 212160 ? "passed" : "failed",
    finding: proposedReliableDps === 212160
      ? "Le DPS propose correspond a la reference strict + delta."
      : `Le DPS propose ${proposedReliableDps} ne correspond pas a la reference 212160.`,
  },
  {
    id: "dry-run-only",
    status: "passed",
    finding: "Cette etape ne modifie aucun fichier source.",
  },
];

const failedChecks = dryRunChecks.filter((check) => check.status !== "passed");
const patchPreviewReady = failedChecks.length === 0;

const patchPreview = targetEntity
  ? {
      op: "replace",
      targetFile: targetDatasetFile,
      entityId: targetEntity.id,
      path: "entities.*[].dps.reliable",
      before: targetEntity.dps?.reliable ?? currentStrictDps,
      after: proposedReliableDps,
      requiredEvidence: [
        "decision reviewer approved auditee",
        "reliable gates recalculees toutes passees",
        "audit promotion pret",
        "regression asset 1663210 et build 1461593+1663210",
      ],
    }
  : null;

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-promotion-implementation-dry-run-v1",
  source: {
    promotionAuditFile,
    targetDatasetFile,
    outDir,
  },
  summary: {
    assetId: summary.assetId ?? 1663210,
    entityId: summary.entityId ?? "skill:1663210",
    strictDps: currentStrictDps,
    blockedDeltaDps: summary.blockedDeltaDps ?? 48960,
    proposedReliableDps,
    checks: dryRunChecks.length,
    failedChecks: failedChecks.length,
    patchPreviewReady,
    writesTargetDataset: false,
    writesRealIntake: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: patchPreviewReady
        ? "delta-promotion-implementation-dry-run-ready"
        : "delta-promotion-implementation-dry-run-blocked",
      confidence: "high",
      promotionReady: false,
      finding: patchPreviewReady
        ? "Le dry-run de patch est pret, mais aucune ecriture n'est effectuee."
        : "Le dry-run d'implementation reste bloque.",
      nextAction: patchPreviewReady
        ? "Creer une etape d'application separee avec validation de regression complete."
        : `Resoudre les checks echoues: ${failedChecks.map((check) => check.id).join(", ")}.`,
    },
  },
  dryRunChecks,
  patchPreview,
  regressionTargets: [
    {
      id: "asset-1663210",
      expectedStrictDps: 163200,
      expectedPromotedReliableDps: 212160,
    },
    {
      id: "build-1461593-plus-1663210",
      expectedStrictBeforePromotion: 1276410,
      expectedWhatIfBeforePromotion: 1325370,
      expectedCandidateDelta: 48960,
    },
  ],
  safeguards: [
    "Ce dry-run ne modifie pas target-dataset.json.",
    "patchPreviewReady ne vaut pas promotionReady.",
    "Aucune sortie ne peut activer le ranking fiable.",
    "Toute application future doit etre separee, testee et revue.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-promotion-implementation-dry-run.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
