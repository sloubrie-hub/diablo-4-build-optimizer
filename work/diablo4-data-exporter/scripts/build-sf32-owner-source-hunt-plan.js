const fs = require("fs");
const path = require("path");
const { SF32_OWNER_CLAIM } = require("../src/delta-evidence-contract");

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
  ? [...SF32_OWNER_CLAIM.mustContain]
  : requiredClaim.mustContain ?? [...SF32_OWNER_CLAIM.mustContain];
const rejectedLocalSignals = packet.rejectedLocalSignals ?? [];
const recommendedAction = decision.rankedActions?.find((item) => item.id === decision.summary?.recommendedActionId) ?? null;
const candidateSnippet = submission.candidateSnippet ?? packet.intakeTemplate ?? null;
const candidateSnippetUsable = Boolean(candidateSnippet)
  && candidateSnippet.claim?.type === SF32_OWNER_CLAIM.type
  && candidateSnippet.claim?.field === SF32_OWNER_CLAIM.field;

const searches = [
  action(
    "sf32-source-hunt-01-extracted-game-data",
    "high",
    "extracted-game-data",
    templateNeedsRevision
      ? "\"1663210\" \"eAttrib 994\" \"Bonus_Percent_Per_Power\" \"949\""
      : "\"1663210\" \"eAttrib 994\" \"Bonus_Percent_Per_Power\" \"949\" \"SF_32\"",
    templateNeedsRevision
      ? ["export brut qui relie l'ancre 994 au record 1663210", "structure qui nomme le role local 949"]
      : ["export brut qui relie l'ancre 994 au record 1663210", "structure qui nomme le role local 949"],
    templateNeedsRevision
      ? ["mapping direct 949 -> Bonus_Percent_Per_Power", "metadata 12337 seule", "scale 10 seul"]
      : ["mapping direct 949 -> Bonus_Percent_Per_Power", "metadata 12337 seule", "scale 10 seul"]
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
      : "\"eAttrib 994\" \"Bonus_Percent_Per_Power\" \"local-role:949\" \"SF_32\"",
    templateNeedsRevision
      ? ["dataset documente qui separe attribut 994 et role local 949", "champ proprietaire nomme"]
      : ["dataset documente qui separe attribut 994 et role local 949", "champ proprietaire nomme"],
    templateNeedsRevision
      ? ["ancien template selector:949 -> SF_32", "metadata 12337 seule", "scale 10 seul"]
      : ["mapping direct selector:949 -> SF_32", "metadata 12337 seule", "scale 10 seul"]
  ),
  action(
    "sf32-source-hunt-04-official-or-patch-data",
    "medium",
    "official",
    templateNeedsRevision
      ? "\"1663210\" \"Spiritborn\" \"Bonus_Percent_Per_Power\" \"994\""
      : "\"1663210\" \"Spiritborn\" \"Bonus_Percent_Per_Power\" \"994\" \"SF_32\"",
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
    targetSelector: templateNeedsRevision ? SF32_OWNER_CLAIM.field : packet.summary?.targetSelector ?? SF32_OWNER_CLAIM.field,
    templateNeedsRevision,
    templateRevisionApplied: candidateSnippetUsable,
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
      kind: candidateSnippetUsable ? "sf32-owner-source-hunt-open" : "sf32-owner-source-hunt-template-revision-required",
      confidence: "high",
      promotionReady: false,
      finding: candidateSnippetUsable
        ? "Le brouillon applique le contrat revise et la collecte peut chercher la chaine eAttrib 994 + role local 949 + SF_32."
        : "Le brouillon doit encore etre revise avant toute collecte SF_32.",
      nextAction: candidateSnippetUsable
        ? "Executer les recherches prioritaires, puis coller une source exacte dans le brouillon pending si elle existe."
        : "Regenerer le brouillon avec le contrat eAttrib 994 + role local 949.",
    },
  },
  requiredClaim,
  mustContain,
  searches,
  supersededSubmission: {
    candidateId: null,
    obsolete: true,
    claim: { type: SF32_OWNER_CLAIM.type, field: SF32_OWNER_CLAIM.supersededField },
    reason: "L'ancien brouillon selector:949 -> SF_32 est remplace par le contrat eAttrib 994 + role local 949.",
  },
  rejectedLocalSignals: rejectedLocalSignals.map((signal) => ({
    id: signal.id,
    reasonRejectedForOwnership: signal.reasonRejectedForOwnership,
    finding: signal.finding,
  })),
  candidateSnippet,
  acceptanceChecklist: [
    "La source contient explicitement 1663210.",
    "La source contient explicitement eAttrib 994 / Bonus_Percent_Per_Power.",
    "La source explique le role local 949 sans le confondre avec l'eAttrib bonus.",
    "La source relie ensuite ce role au champ SF_32 ou au record qui l'alimente.",
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
