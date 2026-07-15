const fs = require("fs");
const path = require("path");

const inputs = {
  nextActionDecision: process.argv[2] ?? "outputs/diablo4-delta-next-action-decision/delta-next-action-decision.json",
  sf32SourcePacket: process.argv[3] ?? "outputs/diablo4-sf32-owner-source-packet/sf32-owner-source-packet.json",
  submissionPack: process.argv[4] ?? "outputs/diablo4-external-evidence-submission-pack/external-evidence-submission-pack.json",
  selector949WindowReparseAudit: process.argv[5] ?? "outputs/diablo4-selector-949-window-reparse-audit/selector-949-window-reparse-audit.json",
  outDir: process.argv[6] ?? "outputs/diablo4-sf32-owner-source-hunt-plan",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function action(id, priority, sourceKind, query, accepts, rejects) {
  return { id, priority, sourceKind, query, accepts, rejects, status: "open" };
}

const decision = readJson(inputs.nextActionDecision);
const packet = readJson(inputs.sf32SourcePacket);
const submission = readJson(inputs.submissionPack);
const selector949WindowReparseAudit = readJson(inputs.selector949WindowReparseAudit);

const requiredClaim = packet.requiredClaim ?? {};
const templateNeedsRevision = selector949WindowReparseAudit.summary?.sf32TemplateNeedsRevision === true;
const mustContain = templateNeedsRevision
  ? ["1663210", "eAttrib:994", "Bonus_Percent_Per_Power", "local-role:949", "SF_32"]
  : requiredClaim.mustContain ?? ["1663210", "selector:949", "SF_32"];
const rejectedLocalSignals = packet.rejectedLocalSignals ?? [];
const recommendedAction = decision.rankedActions?.find((item) => item.id === decision.summary?.recommendedActionId) ?? null;
const candidateSnippet = submission.candidateSnippet ?? packet.intakeTemplate ?? null;
const candidateSnippetUsable = Boolean(candidateSnippet) && !templateNeedsRevision;

const searches = [
  action(
    "sf32-source-hunt-01-extracted-game-data",
    "high",
    "extracted-game-data",
    templateNeedsRevision
      ? "\"1663210\" \"eAttrib 994\" \"Bonus_Percent_Per_Power\" \"949\""
      : "\"1663210\" \"selector:949\" \"SF_32\"",
    templateNeedsRevision
      ? ["export brut qui relie l'ancre 994 au record 1663210", "structure qui nomme le role local 949"]
      : ["export brut ou table qui contient les trois termes requis", "mapping explicite asset -> selector -> SF_32"],
    templateNeedsRevision
      ? ["mapping direct 949 -> Bonus_Percent_Per_Power", "metadata 12337 seule", "scale 10 seul"]
      : ["resultat qui contient seulement l'asset", "resultat qui contient seulement SF_32"]
  ),
  action(
    "sf32-source-hunt-02-tool-output",
    "high",
    "tool-output",
    templateNeedsRevision
      ? "\"Bonus_Percent_Per_Power\" \"eAttrib 994\" \"Spiritborn_Centipede_Ultimate\""
      : "\"Bonus_Percent_Per_Power\" \"Spiritborn_Centipede_Ultimate\" \"SF_32\"",
    templateNeedsRevision
      ? ["sortie outil qui expose eAttrib 994 et la structure du record cible", "version/build de la source"]
      : ["sortie outil qui nomme la formule et le champ SF_32", "version/build de la source"],
    templateNeedsRevision
      ? ["sortie qui reutilise 949 comme attribut bonus sans dictionnaire", "guide de build sans mapping donnees"]
      : ["sortie UI ou localisation", "analogie avec un autre selector"]
  ),
  action(
    "sf32-source-hunt-03-documented-dataset",
    "medium",
    "documented-dataset",
    templateNeedsRevision
      ? "\"eAttrib 994\" \"Bonus_Percent_Per_Power\" \"SF_32\""
      : "\"selector:949\" \"Bonus_Percent_Per_Power\"",
    templateNeedsRevision
      ? ["dataset documente qui separe attribut 994 et role local 949", "champ proprietaire nomme"]
      : ["dataset documente avec dictionnaire de selectors", "champ proprietaire nomme"],
    templateNeedsRevision
      ? ["ancien template selector:949 -> SF_32", "metadata 12337 seule", "scale 10 seul"]
      : ["metadata 12337 seule", "scale 10 seul"]
  ),
  action(
    "sf32-source-hunt-04-official-or-patch-data",
    "medium",
    "official",
    templateNeedsRevision
      ? "\"1663210\" \"Spiritborn\" \"Bonus_Percent_Per_Power\" \"994\""
      : "\"1663210\" \"Spiritborn\" \"SF_32\"",
    ["source officielle ou patch data qui relie l'asset au champ", "preuve citee avec version"],
    ["texte descriptif sans champ source", "guide de build sans mapping donnees"]
  ),
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf32-owner-source-hunt-plan-v1",
  source: inputs,
  summary: {
    assetId: packet.summary?.assetId ?? 1663210,
    entityId: packet.summary?.entityId ?? "skill:1663210",
    targetField: templateNeedsRevision ? "Bonus_Percent_Per_Power / SF_32 role unresolved" : packet.summary?.targetField ?? "SF_32",
    targetSelector: templateNeedsRevision ? "eAttrib:994 + local-role:949" : packet.summary?.targetSelector ?? "selector:949",
    templateNeedsRevision,
    priorClaimSuspended: templateNeedsRevision,
    recommendedActionId: recommendedAction?.id ?? decision.summary?.recommendedActionId ?? null,
    searches: searches.length,
    highPrioritySearches: searches.filter((item) => item.priority === "high").length,
    requiredTerms: mustContain.length,
    rejectedLocalSignals: rejectedLocalSignals.length,
    candidateSnippetReady: Boolean(candidateSnippet),
    candidateSnippetUsable,
    acceptedEvidence: packet.summary?.acceptedEvidence ?? 0,
    writesIntake: false,
    writesTargetDataset: false,
    acceptedForBridge: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: templateNeedsRevision ? "sf32-owner-source-hunt-template-revision-required" : "sf32-owner-source-hunt-open",
      confidence: "high",
      promotionReady: false,
      finding: templateNeedsRevision
        ? "La collecte SF_32 ne doit plus demander selector:949 comme preuve directe; elle doit partir de l'ancre 994 et decoder le role local 949."
        : "La collecte SF_32 doit chercher une source contenant explicitement 1663210, selector:949 et SF_32.",
      nextAction: templateNeedsRevision
        ? "Remplacer le brouillon de preuve par une recherche eAttrib 994 + structure locale 949 avant toute soumission."
        : "Executer les recherches prioritaires, puis coller une source exacte dans le brouillon pending si elle existe.",
    },
  },
  requiredClaim,
  mustContain,
  searches,
  supersededSubmission: {
    candidateId: candidateSnippet?.id ?? null,
    obsolete: templateNeedsRevision,
    reason: templateNeedsRevision
      ? "Le brouillon demande selector:949 -> SF_32, mais l'audit DiabloTools/Reparse impose 994 comme ancre bonus et 949 comme role local non decode."
      : null,
  },
  rejectedLocalSignals: rejectedLocalSignals.map((signal) => ({
    id: signal.id,
    reasonRejectedForOwnership: signal.reasonRejectedForOwnership,
    finding: signal.finding,
  })),
  candidateSnippet,
  acceptanceChecklist: [
    "La source contient explicitement 1663210.",
    ...(templateNeedsRevision
      ? [
          "La source contient explicitement eAttrib 994 / Bonus_Percent_Per_Power.",
          "La source explique le role local 949 sans le confondre avec l'eAttrib bonus.",
          "La source relie ensuite ce role au champ SF_32 ou au record qui l'alimente.",
        ]
      : [
          "La source contient explicitement selector:949.",
          "La source nomme SF_32 comme champ proprietaire ou mapping equivalent.",
        ]),
    "La source porte une version, un export, ou une date exploitable.",
    "La preuve reste reviewer.status=pending tant qu'elle n'est pas relue.",
  ],
  rejectionChecklist: [
    "Rejeter les analogies de layout.",
    "Rejeter le mapping direct selector:949 -> Bonus_Percent_Per_Power.",
    "Rejeter metadata 12337 seule.",
    "Rejeter scale 10 seul.",
    "Rejeter les labels UI ou guides sans champ source.",
  ],
  safeguards: {
    noAutomaticIntakeWrite: true,
    noAutomaticApproval: true,
    reliableDpsStrictOnly: true,
    reason: "Le plan de collecte guide la recherche; il ne cree pas de preuve et ne modifie aucun score.",
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "sf32-owner-source-hunt-plan.json");
const markdownFile = path.join(inputs.outDir, "sf32-owner-source-hunt-plan.md");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(markdownFile, [
  "# Plan collecte source SF_32",
  "",
  `- Cible: \`${report.summary.assetId}\` / \`${report.summary.entityId}\``,
  `- Champ attendu: \`${report.summary.targetSelector} -> ${report.summary.targetField}\``,
  `- Ancien claim suspendu: \`${report.summary.priorClaimSuspended}\``,
  `- Reliable DPS modifiable: \`${report.summary.canModifyReliableDps}\``,
  "",
  "## Recherches prioritaires",
  "",
  ...searches.map((item) => `- ${item.priority} / ${item.sourceKind}: \`${item.query}\``),
  "",
  "## Must contain",
  "",
  ...mustContain.map((item) => `- \`${item}\``),
  "",
  "## Rejeter",
  "",
  ...report.rejectionChecklist.map((item) => `- ${item}`),
  "",
].join("\n"));

console.log(JSON.stringify({ outFile, markdownFile, summary: report.summary }, null, 2));
