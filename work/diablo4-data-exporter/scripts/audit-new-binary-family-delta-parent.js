const fs = require("fs");
const path = require("path");

const inputs = {
  newBinaryFamilyPlan: process.argv[2] ?? "outputs/diablo4-new-binary-family-plan/new-binary-family-plan.json",
  recordHeaders: process.argv[3] ?? "outputs/diablo4-source-asset-1663210-record-headers/record-header-inspection.json",
  fieldRecords: process.argv[4] ?? "outputs/diablo4-source-asset-1663210-field-records/field-record-inspection.json",
  structuralRelations: process.argv[5] ?? "outputs/diablo4-source-asset-1663210-structural-relations/structural-relations.json",
  sf33BinaryParentSource: process.argv[6] ?? "outputs/diablo4-sf33-binary-parent-source/sf33-binary-parent-source.json",
  deltaPromotionConclusion: process.argv[7] ?? "outputs/diablo4-delta-promotion-conclusion/delta-promotion-conclusion.json",
};
const outDir = process.argv[8] ?? "outputs/diablo4-new-binary-family-delta-parent-audit";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function summarizeGate({ id, status, finding, evidence, nextSearch }) {
  return {
    id,
    status,
    finding,
    evidence,
    nextSearch,
  };
}

const newBinaryFamilyPlan = readJson(inputs.newBinaryFamilyPlan);
const recordHeaders = readJson(inputs.recordHeaders);
const fieldRecords = readJson(inputs.fieldRecords);
const structuralRelations = readJson(inputs.structuralRelations);
const sf33BinaryParentSource = readJson(inputs.sf33BinaryParentSource);
const deltaPromotionConclusion = readJson(inputs.deltaPromotionConclusion);

const deltaProbe = (newBinaryFamilyPlan.probes ?? [])
  .find((probe) => probe.id === "binary-family-delta-parent-1663210");
const bonusHeader = (recordHeaders.candidateFields ?? [])
  .find((field) => field.interpretation?.role === "bonus-hash-to-asset-header");
const formulaTail = (recordHeaders.candidateFields ?? [])
  .find((field) => field.interpretation?.role === "formula-bytecode-tail");
const sf33Record = (fieldRecords.records ?? [])
  .find((record) => record.value === "Mod.SoilRuler_B");
const structuralSf32 = (structuralRelations.relations ?? [])
  .find((relation) => relation.kind === "sf32-scaling-candidate");
const structuralSf33 = (structuralRelations.relations ?? [])
  .find((relation) => relation.kind === "sf33-trigger-candidate");

const gates = [
  summarizeGate({
    id: "sf32-field-ownership",
    status: recordHeaders.summary?.assessment?.fieldOwnership === "proven" ? "passed" : "failed",
    finding: recordHeaders.summary?.assessment?.finding
      ?? "Le header bonus n'est pas encore promouvable comme champ SF_32.",
    evidence: {
      source: inputs.recordHeaders,
      fieldOwnership: recordHeaders.summary?.assessment?.fieldOwnership ?? recordHeaders.summary?.fieldOwnership ?? null,
      headerRole: bonusHeader?.interpretation?.role ?? null,
      headerSignature: bonusHeader?.signature ?? null,
      formulaTailSignature: formulaTail?.signature ?? null,
      assetIdAfterHash: bonusHeader?.tokens?.some((token) => token.u32 === 1663210) === true,
      selector949AfterHash: bonusHeader?.tokens?.some((token) => token.u32 === 949) === true,
      structuralRelation: structuralSf32
        ? {
            kind: structuralSf32.kind,
            from: structuralSf32.from,
            to: structuralSf32.to,
            evidenceCount: structuralSf32.evidence?.length ?? 0,
          }
        : null,
    },
    nextSearch: "Comparer le header bonus-hash-to-asset-header avec plusieurs autres Bonus_Percent_Per_Power pour isoler un champ proprietaire nomme ou decode.",
  }),
  summarizeGate({
    id: "sf33-trigger",
    status: sf33BinaryParentSource.summary?.buildStateReady === true ? "passed" : "failed",
    finding: sf33BinaryParentSource.summary?.assessment?.finding
      ?? "Le trigger SF_33 n'a pas de consommateur parent prouve.",
    evidence: {
      source: inputs.sf33BinaryParentSource,
      targetTrigger: sf33BinaryParentSource.summary?.targetTrigger ?? null,
      modTrailerMatchesAll: sf33BinaryParentSource.summary?.modTrailerMatchesAll === true,
      hasExactNeighborConsumerMatch: sf33BinaryParentSource.summary?.hasExactNeighborConsumerMatch === true,
      externalNameHits: sf33BinaryParentSource.summary?.externalNameHits ?? 0,
      externalTriggerHits: sf33BinaryParentSource.summary?.externalTriggerHits ?? 0,
      localRecord: sf33Record
        ? {
            offset: sf33Record.offset,
            previousString: sf33Record.previousString?.value ?? null,
            nextString: sf33Record.nextString?.value ?? null,
            directOffsetReferences: sf33Record.directOffsetReferences?.length ?? 0,
          }
        : null,
      structuralRelation: structuralSf33
        ? {
            kind: structuralSf33.kind,
            from: structuralSf33.from,
            to: structuralSf33.to,
            evidenceCount: structuralSf33.evidence?.length ?? 0,
          }
        : null,
    },
    nextSearch: "Scanner le corpus binaire hors texte pour un consommateur ou parent qui reference le hash PowerTag de Mod.SoilRuler_B avec une semantique de build-state.",
  }),
  summarizeGate({
    id: "uptime-proven-or-separated",
    status: deltaPromotionConclusion.summary?.blockedProofIds?.includes("uptime") ? "failed" : "passed",
    finding: "Aucune uptime source-backed n'est prouvee pour convertir le scenario SF_33 en DPS fiable.",
    evidence: {
      source: inputs.deltaPromotionConclusion,
      blockedProofIds: deltaPromotionConclusion.summary?.blockedProofIds ?? [],
      canExposeAsWhatIf: deltaPromotionConclusion.summary?.canExposeAsWhatIf === true,
      canUseForReliableDps: deltaPromotionConclusion.summary?.canUseForReliableDps === true,
    },
    nextSearch: "Conserver l'uptime en hypothese utilisateur ou trouver une source qui quantifie explicitement la condition d'activation.",
  }),
];

const passedGates = gates.filter((gate) => gate.status === "passed");
const failedGates = gates.filter((gate) => gate.status !== "passed");

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "new-binary-family-delta-parent-audit-v1",
  source: inputs,
  summary: {
    probeId: "binary-family-delta-parent-1663210",
    assetId: 1663210,
    entityId: "skill:1663210",
    gates: gates.length,
    passedGates: passedGates.length,
    failedGates: failedGates.length,
    failedGateIds: failedGates.map((gate) => gate.id),
    localContextEvidence: true,
    exactParentConsumerProven: sf33BinaryParentSource.summary?.hasExactNeighborConsumerMatch === true,
    sf32OwnershipProven: gates.find((gate) => gate.id === "sf32-field-ownership")?.status === "passed",
    uptimeProvenOrSeparated: gates.find((gate) => gate.id === "uptime-proven-or-separated")?.status === "passed",
    canModifyReliableDps: false,
    promotionReady: false,
    nextSearchKind: "corpus-binary-parent-consumer-scan",
    assessment: {
      kind: "delta-parent-probe-local-context-not-promovable",
      confidence: "high",
      promotionReady: false,
      finding: "Les artefacts locaux prouvent un contexte structurel autour de Mod.SoilRuler_B et du hash Bonus_Percent_Per_Power, mais pas encore un parent/consommateur promouvable.",
      nextAction: "Lancer une recherche binaire corpus-wide des parents/consommateurs avant de modifier un parseur ou reliableDps.",
    },
  },
  probe: deltaProbe
    ? {
        id: deltaProbe.id,
        domain: deltaProbe.domain,
        target: deltaProbe.target,
        priority: deltaProbe.priority,
        desiredEvidence: deltaProbe.desiredEvidence,
      }
    : null,
  gates,
  nextSearchPlan: {
    id: "corpus-binary-parent-consumer-scan-1663210",
    priority: "high",
    targetAnchors: ["Mod.SoilRuler_B", "SF_33", "SF_32", "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate", "1663210"],
    accepts: [
      "record parent ou consommateur qui reference directement Mod.SoilRuler_B et une condition de build-state",
      "layout reidentifie sur plusieurs assets qui rattache selector 949/SF_32 a un champ source",
      "source d'uptime explicite ou extraction permettant de la separer proprement en scenario utilisateur",
    ],
    rejects: [
      "header bonus local sans comparaison corpus",
      "trailer Mod.* commun sans consommateur exact",
      "presence de 949, 12337 ou 10 sans dictionnaire de champ",
    ],
  },
  safeguards: [
    "Cet audit ne modifie aucun score.",
    "Le contexte local ne suffit pas a promouvoir le delta 48960.",
    "Le DPS fiable reste strict-only tant que les trois gates ne passent pas.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "delta-parent-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
