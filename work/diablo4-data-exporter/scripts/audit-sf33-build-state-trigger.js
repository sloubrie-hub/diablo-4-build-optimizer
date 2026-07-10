const fs = require("fs");
const path = require("path");

const sfSourcesFile = process.argv[2] ?? "outputs/diablo4-conditional-sf-source-inspection/conditional-sf-source-inspection.json";
const definitionSearchFile = process.argv[3] ?? "outputs/diablo4-conditional-definition-search/conditional-definition-search.json";
const structuralRelationsFile = process.argv[4] ?? "outputs/diablo4-source-asset-1663210-structural-relations/structural-relations.json";
const buildStateTemplateFile = process.argv[5] ?? "outputs/diablo4-build-state-template/build-state-template.json";
const outDir = process.argv[6] ?? "outputs/diablo4-sf33-build-state-trigger-audit";

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function findSlot(report, canonicalId) {
  for (const asset of report?.assets ?? []) {
    const slot = (asset.slots ?? []).find((candidate) => candidate.canonicalId === canonicalId);
    if (slot) return { asset, slot };
  }
  return null;
}

function findDefinitionTarget(report, target, role) {
  for (const asset of report?.assets ?? []) {
    const match = (asset.targets ?? []).find((candidate) => candidate.target === target && (!role || candidate.role === role));
    if (match) return { asset, target: match };
  }
  return null;
}

function findRelation(report, kind, from) {
  return (report?.relations ?? []).find((relation) => relation.kind === kind && relation.from === from) ?? null;
}

function collectTemplateFlags(report) {
  return (report?.state?.flags ?? []).map((flag) => ({
    id: flag.id,
    kind: flag.kind,
    defaultValue: flag.defaultValue ?? null,
    sources: flag.sources ?? [],
  }));
}

const trigger = "Mod.SoilRuler_B";
const sfSlotId = "sf:1663210:33";
const sfSources = readJsonIfExists(sfSourcesFile);
const definitionSearch = readJsonIfExists(definitionSearchFile);
const structuralRelations = readJsonIfExists(structuralRelationsFile);
const buildStateTemplate = readJsonIfExists(buildStateTemplateFile);

const slotMatch = findSlot(sfSources, sfSlotId);
const definitionMatch = findDefinitionTarget(definitionSearch, trigger, "sf33-trigger-source");
const structuralRelation = findRelation(structuralRelations, "sf33-trigger-candidate", trigger);
const templateFlags = collectTemplateFlags(buildStateTemplate);
const existingFlag = templateFlags.find((flag) => flag.id === trigger) ?? null;

const hasBranchSlot = slotMatch?.slot?.role === "branch-condition";
const hasStructuralRelation = Boolean(structuralRelation);
const hasExactDefinitionOutsideCurrentAsset = (definitionMatch?.target?.definitionAssessment?.kind ?? "") !== "exact-target-only-current-asset";
const hasBuildStateEntry = Boolean(existingFlag);
const promotionReady = hasBranchSlot && hasStructuralRelation && hasBuildStateEntry && hasExactDefinitionOutsideCurrentAsset;

const assessment = {
  kind: promotionReady
    ? "sf33-trigger-build-state-ready"
    : hasBranchSlot && hasStructuralRelation
      ? "sf33-trigger-candidate-flag-unmapped"
      : "sf33-trigger-evidence-incomplete",
  confidence: hasBranchSlot && hasStructuralRelation ? "medium-high" : "medium",
  fieldOwnership: "not-applicable",
  blocker: promotionReady ? null : "sf33-trigger-build-state-unmapped",
  promotionReady,
  finding: hasBranchSlot && hasStructuralRelation
    ? "Mod.SoilRuler_B est relie a la branche conditionnelle SF_33, mais aucune source d'activation exploitable n'est encore mappee."
    : "Le lien Mod.SoilRuler_B vers SF_33 reste incomplet dans les artefacts charges.",
  nextAction: promotionReady
    ? "Activer le flag build-state seulement dans un scenario explicite, puis traiter l'uptime separement."
    : "Ajouter Mod.SoilRuler_B comme flag build-state bloque, puis isoler l'upgrade/toggle/aspect qui l'active avant toute promotion DPS.",
  evidence: {
    trigger,
    sfSlotId,
    slotRole: slotMatch?.slot?.role ?? null,
    localSymbolStatus: slotMatch?.slot?.localSymbolStatus ?? null,
    sourceAssessment: slotMatch?.slot?.sourceAssessment ?? null,
    structuralRelationFound: hasStructuralRelation,
    structuralRelation: structuralRelation
      ? {
          kind: structuralRelation.kind,
          to: structuralRelation.to,
          evidence: structuralRelation.evidence ?? [],
        }
      : null,
    definitionAssessment: definitionMatch?.target?.definitionAssessment ?? null,
    exactMatches: definitionMatch?.target?.exactMatches?.length ?? 0,
    sameKeyAnalogies: definitionMatch?.target?.sameKeyAnalogies?.length ?? 0,
    sourceCandidate: definitionMatch?.target?.sourceCandidate ?? null,
    buildStateFlags: templateFlags.map((flag) => flag.id),
    hasBuildStateEntry,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf33-build-state-trigger-audit-v1",
  source: {
    sfSources: sfSourcesFile,
    definitionSearch: definitionSearchFile,
    structuralRelations: structuralRelationsFile,
    buildStateTemplate: buildStateTemplateFile,
  },
  summary: {
    trigger,
    sfSlotId,
    hasBranchSlot,
    hasStructuralRelation,
    hasBuildStateEntry,
    hasExactDefinitionOutsideCurrentAsset,
    promotionReady,
    assessment,
  },
  blockedBuildStateTemplate: {
    flags: [
      {
        id: trigger,
        kind: "boolean-flag",
        defaultValue: null,
        status: promotionReady ? "mapped" : "blocked-unmapped",
        controls: [sfSlotId],
        activationSource: null,
        promotionReady,
        note: "Ne pas forcer SF_33 != 0 tant que la source d'activation et l'uptime ne sont pas prouvees.",
        sources: structuralRelation
          ? [
              {
                assetId: structuralRelations?.source?.assetId ?? 1663210,
                relationKind: structuralRelation.kind,
                to: structuralRelation.to,
              },
            ]
          : [],
      },
    ],
  },
};

const blockedBuildStateTemplate = buildStateTemplate
  ? {
      ...buildStateTemplate,
      generatedAt: new Date().toISOString(),
      source: {
        ...(buildStateTemplate.source ?? {}),
        sf33BuildStateTriggerAudit: outDir,
      },
      assumptions: {
        ...(buildStateTemplate.assumptions ?? {}),
        sf33BlockedFlag:
          "Mod.SoilRuler_B is carried as a blocked flag only. Keep defaultValue null and do not force SF_33 active until activation source and uptime are proven.",
      },
      summary: {
        ...(buildStateTemplate.summary ?? {}),
        flags: (buildStateTemplate.state?.flags ?? []).some((flag) => flag.id === trigger)
          ? buildStateTemplate.summary?.flags ?? buildStateTemplate.state.flags.length
          : (buildStateTemplate.summary?.flags ?? buildStateTemplate.state?.flags?.length ?? 0) + 1,
        blockedFlags: [
          ...new Set([
            ...((buildStateTemplate.summary?.blockedFlags ?? []).map(String)),
            trigger,
          ]),
        ],
      },
      state: {
        ...(buildStateTemplate.state ?? {}),
        flags: [
          ...(buildStateTemplate.state?.flags ?? []).filter((flag) => flag.id !== trigger),
          {
            id: trigger,
            kind: "boolean-flag",
            defaultValue: null,
            status: promotionReady ? "mapped" : "blocked-unmapped",
            label: "SoilRuler B",
            note: "Blocked SF_33 trigger candidate. Set only when the exact build option, trigger and uptime are proven.",
            controls: [sfSlotId],
            activationSource: null,
            promotionReady,
            sources: structuralRelation
              ? [
                  {
                    assetId: structuralRelations?.source?.assetId ?? 1663210,
                    relationKind: structuralRelation.kind,
                    to: structuralRelation.to,
                  },
                ]
              : [],
          },
        ],
      },
    }
  : null;

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf33-build-state-trigger-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
const templateOutFile = path.join(outDir, "blocked-build-state-template.json");
if (blockedBuildStateTemplate) {
  fs.writeFileSync(templateOutFile, JSON.stringify(blockedBuildStateTemplate, null, 2));
}
console.log(JSON.stringify({ outFile, templateOutFile: blockedBuildStateTemplate ? templateOutFile : null, summary: report.summary }, null, 2));
