const fs = require("fs");
const path = require("path");

const inputs = {
  reliableGates: process.argv[2] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  deltaParentAudit: process.argv[3] ?? "outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json",
  corpusScan: process.argv[4] ?? "outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json",
  systemsTuning: process.argv[5] ?? "outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json",
  nontextSignals: process.argv[6] ?? "outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json",
  undecodedPlan: process.argv[7] ?? "outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json",
  outDir: process.argv[8] ?? "outputs/diablo4-delta-local-exhaustion-conclusion",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const reliableGates = readJson(inputs.reliableGates);
const deltaParentAudit = readJson(inputs.deltaParentAudit);
const corpusScan = readJson(inputs.corpusScan);
const systemsTuning = readJson(inputs.systemsTuning);
const nontextSignals = readJson(inputs.nontextSignals);
const undecodedPlan = readJson(inputs.undecodedPlan);

const gates = reliableGates.gates ?? [];
const sf32Gate = gates.find((gate) => gate.id === "sf32-field") ?? null;
const sf33Gate = gates.find((gate) => gate.id === "sf33-trigger") ?? null;
const uptimeGate = gates.find((gate) => gate.id === "uptime") ?? null;

const sf33Evidence = [
  {
    id: "delta-parent-audit",
    status: deltaParentAudit.summary?.exactParentConsumerProven ? "ready" : "blocked",
    finding: deltaParentAudit.summary?.assessment?.finding ?? null,
    metric: {
      localContextEvidence: deltaParentAudit.summary?.localContextEvidence,
      exactParentConsumerProven: deltaParentAudit.summary?.exactParentConsumerProven,
    },
  },
  {
    id: "decoded-corpus-scan",
    status: corpusScan.summary?.parentConsumerCandidates > 0 ? "review" : "blocked",
    finding: corpusScan.summary?.assessment?.finding ?? null,
    metric: {
      filesScanned: corpusScan.summary?.filesScanned,
      parentConsumerCandidates: corpusScan.summary?.parentConsumerCandidates,
    },
  },
  {
    id: "systems-tuning-contexts",
    status: systemsTuning.summary?.externalTargetSystemsTuningContexts > 0 ? "review" : "blocked",
    finding: systemsTuning.summary?.assessment?.finding ?? null,
    metric: {
      targetContexts: systemsTuning.summary?.targetContexts,
      externalTargetContexts: systemsTuning.summary?.externalTargetContexts,
      externalTargetSystemsTuningContexts: systemsTuning.summary?.externalTargetSystemsTuningContexts,
    },
  },
  {
    id: "nontext-table-signals",
    status: nontextSignals.summary?.linkedTargetHashSignals > 0 ? "review" : "blocked",
    finding: nontextSignals.summary?.assessment?.finding ?? null,
    metric: {
      targetHashNontextSignals: nontextSignals.summary?.targetHashNontextSignals,
      linkedTargetHashSignals: nontextSignals.summary?.linkedTargetHashSignals,
    },
  },
  {
    id: "undecoded-source-plan",
    status: undecodedPlan.summary?.missingDecodeHighPriority > 0 ? "decode-required" : "blocked",
    finding: undecodedPlan.summary?.assessment?.finding ?? null,
    metric: {
      highPriorityAssets: undecodedPlan.summary?.highPriorityAssets,
      missingDecodeHighPriority: undecodedPlan.summary?.missingDecodeHighPriority,
    },
  },
];

const sf33ReadySignals = sf33Evidence.filter((row) => row.status === "ready" || row.status === "review" || row.status === "decode-required");
const sf33LocalExhausted = sf33ReadySignals.length === 0;
const canModifyReliableDps = false;
const promotionReady = false;

const nextFocus = sf33LocalExhausted
  ? [
      {
        id: "sf32-field-ownership",
        priority: "high",
        reason: sf32Gate?.reason ?? "SF_32 field ownership remains blocked.",
        nextAction: "Chercher une preuve source-backed du champ selector 949 / SF_32 ou une source externe acceptee.",
      },
      {
        id: "uptime-user-hypothesis",
        priority: "medium",
        reason: uptimeGate?.reason ?? "Uptime remains unproven.",
        nextAction: "Ameliorer le scenario what-if utilisateur sans le promouvoir en reliableDps, ou trouver une source d'uptime externe.",
      },
    ]
  : [
      {
        id: "sf33-review-candidates",
        priority: "high",
        reason: "Some SF_33 evidence still has review candidates.",
        nextAction: "Inspecter les candidats SF_33 avant de changer de blocage.",
      },
    ];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-local-exhaustion-conclusion-v1",
  source: inputs,
  summary: {
    assetId: reliableGates.summary?.assetId ?? 1663210,
    entityId: reliableGates.summary?.entityId ?? "skill:1663210",
    strictDps: reliableGates.summary?.strictDps ?? 0,
    blockedDeltaDps: reliableGates.summary?.blockedDeltaDps ?? 0,
    failedGateIds: reliableGates.summary?.failedGateIds ?? [],
    sf33LocalEvidenceChecks: sf33Evidence.length,
    sf33ReadySignals: sf33ReadySignals.length,
    sf33LocalExhausted,
    recommendedNextFocus: nextFocus[0]?.id ?? null,
    exactParentConsumerProven: false,
    promotionReady,
    canModifyReliableDps,
    assessment: {
      kind: sf33LocalExhausted
        ? "delta-local-sf33-evidence-exhausted"
        : "delta-local-sf33-review-still-open",
      confidence: sf33LocalExhausted ? "high" : "medium",
      blocker: "blocked-delta-cleared",
      promotionReady,
      finding: sf33LocalExhausted
        ? "Les pistes locales SF_33 inspectees ne prouvent ni parent/consommateur, ni contexte externe, ni decode cible manquant."
        : "Certaines pistes SF_33 restent a examiner avant de clore le blocage local.",
      nextAction: sf33LocalExhausted
        ? "Ne plus prioriser SF_33 en local; basculer vers SF_32 ownership, uptime utilisateur separee, ou preuve externe source-backed."
        : "Examiner les candidats SF_33 restants sans modifier reliableDps.",
    },
  },
  gates: {
    sf32: sf32Gate,
    sf33: sf33Gate,
    uptime: uptimeGate,
  },
  sf33Evidence,
  nextFocus,
  safeguards: {
    reliableDpsStrictOnly: true,
    blockedDeltaRemainsExcluded: true,
    reason: "Aucun blocage SF_32/SF_33/uptime n'est ferme par cette conclusion.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "delta-local-exhaustion-conclusion.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
