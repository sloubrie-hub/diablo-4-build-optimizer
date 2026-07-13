const fs = require("fs");
const path = require("path");

const inputs = {
  reliableGates: process.argv[2] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json",
  deltaParentAudit: process.argv[3] ?? "outputs/diablo4-new-binary-family-delta-parent-audit/delta-parent-audit.json",
  corpusScan: process.argv[4] ?? "outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json",
  systemsTuning: process.argv[5] ?? "outputs/diablo4-delta-parent-systems-tuning-contexts/delta-parent-systems-tuning-contexts.json",
  nontextSignals: process.argv[6] ?? "outputs/diablo4-delta-parent-nontext-table-signals/delta-parent-nontext-table-signals.json",
  undecodedPlan: process.argv[7] ?? "outputs/diablo4-delta-parent-undecoded-source-plan/delta-parent-undecoded-source-plan.json",
  sf32Conclusion: process.argv[8] ?? "outputs/diablo4-sf32-local-exhaustion-conclusion/sf32-local-exhaustion-conclusion.json",
  uptimeConclusion: process.argv[9] ?? "outputs/diablo4-uptime-local-exhaustion-conclusion/uptime-local-exhaustion-conclusion.json",
  outDir: process.argv[10] ?? "outputs/diablo4-delta-local-exhaustion-conclusion",
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
const sf32Conclusion = readJson(inputs.sf32Conclusion);
const uptimeConclusion = readJson(inputs.uptimeConclusion);

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
const sf32LocalExhausted = sf32Conclusion.summary?.sf32LocalExhausted === true;
const uptimeLocalReliableEvidenceExhausted = uptimeConclusion.summary?.localReliableEvidenceExhausted === true;
const userScenarioSeparated = uptimeConclusion.summary?.userScenarioSeparated === true;
const allLocalEvidenceExhausted = sf32LocalExhausted && sf33LocalExhausted && uptimeLocalReliableEvidenceExhausted;
const canModifyReliableDps = false;
const promotionReady = false;

const localConclusions = [
  {
    id: "sf32-field-ownership",
    status: sf32LocalExhausted ? "local-exhausted" : "open",
    blocker: sf32Gate?.blocker ?? "field-level-parser-required",
    assessment: sf32Conclusion.summary?.assessment?.kind ?? sf32Gate?.assessment ?? null,
    readySignals: sf32Conclusion.summary?.readySignals ?? null,
    localEvidenceChecks: sf32Conclusion.summary?.localEvidenceChecks ?? null,
    canModifyReliableDps: sf32Conclusion.summary?.canModifyReliableDps === true,
    finding: sf32Conclusion.summary?.assessment?.finding ?? sf32Gate?.reason ?? null,
    nextAction: sf32Conclusion.summary?.assessment?.nextAction ?? null,
  },
  {
    id: "sf33-trigger",
    status: sf33LocalExhausted ? "local-exhausted" : "open",
    blocker: sf33Gate?.blocker ?? "sf33-trigger-build-state-unmapped",
    assessment: sf33LocalExhausted ? "delta-local-sf33-evidence-exhausted" : "delta-local-sf33-review-still-open",
    readySignals: sf33ReadySignals.length,
    localEvidenceChecks: sf33Evidence.length,
    canModifyReliableDps: false,
    finding: sf33LocalExhausted
      ? "Les pistes locales SF_33 inspectees ne prouvent ni parent/consommateur, ni contexte externe, ni decode cible manquant."
      : "Certaines pistes SF_33 restent a examiner avant de clore le blocage local.",
    nextAction: sf33LocalExhausted
      ? "Ne plus prioriser SF_33 en local sans nouvelle source."
      : "Examiner les candidats SF_33 restants sans modifier reliableDps.",
  },
  {
    id: "uptime",
    status: uptimeLocalReliableEvidenceExhausted ? "local-reliable-evidence-exhausted" : "open",
    blocker: uptimeGate?.blocker ?? "uptime-not-proven",
    assessment: uptimeConclusion.summary?.assessment?.kind ?? uptimeGate?.assessment ?? null,
    readySignals: uptimeConclusion.summary?.reliableReadySignals ?? null,
    localEvidenceChecks: uptimeConclusion.summary?.localEvidenceChecks ?? null,
    canModifyReliableDps: uptimeConclusion.summary?.canModifyReliableDps === true,
    finding: uptimeConclusion.summary?.assessment?.finding ?? uptimeGate?.reason ?? null,
    nextAction: uptimeConclusion.summary?.assessment?.nextAction ?? null,
  },
];

const nextFocus = allLocalEvidenceExhausted
  ? [
      {
        id: "external-delta-evidence",
        priority: "high",
        reason: "Les preuves locales SF_32, SF_33 et uptime sont epuisees pour le DPS fiable.",
        nextAction: "Ajouter une preuve externe acceptee dans inputs/external-evidence-candidates.json ou identifier une nouvelle famille binaire source-backed.",
      },
      {
        id: "user-uptime-scenario-contract",
        priority: "medium",
        reason: userScenarioSeparated
          ? "Le scenario utilisateur est separe du reliableDps."
          : "Le scenario utilisateur doit rester separe du reliableDps.",
        nextAction: "Conserver SF_33/uptime comme what-if utilisateur, desactive par defaut, sans classement fiable.",
      },
    ]
  : [
      {
        id: "local-delta-review",
        priority: "high",
        reason: "Une des conclusions locales du delta reste ouverte.",
        nextAction: "Fermer les conclusions locales restantes sans modifier reliableDps.",
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
    sf32LocalExhausted,
    uptimeLocalReliableEvidenceExhausted,
    userScenarioSeparated,
    allLocalEvidenceExhausted,
    recommendedNextFocus: nextFocus[0]?.id ?? null,
    exactParentConsumerProven: false,
    promotionReady,
    canModifyReliableDps,
    assessment: {
      kind: allLocalEvidenceExhausted
        ? "delta-local-all-evidence-exhausted"
        : sf33LocalExhausted
          ? "delta-local-sf33-evidence-exhausted"
          : "delta-local-review-still-open",
      confidence: allLocalEvidenceExhausted || sf33LocalExhausted ? "high" : "medium",
      blocker: "blocked-delta-cleared",
      promotionReady,
      finding: allLocalEvidenceExhausted
        ? "Les preuves locales SF_32, SF_33 et uptime sont epuisees pour le DPS fiable; le delta reste un what-if bloque."
        : "Certaines pistes locales du delta restent a examiner avant de clore le blocage local complet.",
      nextAction: allLocalEvidenceExhausted
        ? "Basculer vers preuve externe acceptee, nouvelle famille binaire source-backed, ou contrat what-if utilisateur separe; ne pas modifier reliableDps."
        : "Fermer les pistes locales restantes sans modifier reliableDps.",
    },
  },
  gates: {
    sf32: sf32Gate,
    sf33: sf33Gate,
    uptime: uptimeGate,
  },
  localConclusions,
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
