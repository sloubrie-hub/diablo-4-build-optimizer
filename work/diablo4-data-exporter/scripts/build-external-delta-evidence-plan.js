const fs = require("fs");
const path = require("path");
const { SF32_OWNER_CLAIM } = require("../src/delta-evidence-contract");

const externalEvidenceIntakeFile = process.argv[2] ?? "outputs/diablo4-external-evidence-intake/external-evidence-intake.json";
const externalEvidenceBridgeFile = process.argv[3] ?? "outputs/diablo4-external-evidence-bridge-plan/external-evidence-bridge-plan.json";
const deltaLocalConclusionFile = process.argv[4] ?? "outputs/diablo4-delta-local-exhaustion-conclusion/delta-local-exhaustion-conclusion.json";
const reliableGatesFile = process.argv[5] ?? "outputs/diablo4-reliable-dps-gates/reliable-dps-gates.json";
const outDir = process.argv[6] ?? "outputs/diablo4-external-delta-evidence-plan";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const intake = readJson(externalEvidenceIntakeFile);
const bridge = readJson(externalEvidenceBridgeFile);
const deltaLocalConclusion = readJson(deltaLocalConclusionFile);
const reliableGates = readJson(reliableGatesFile);

function acceptedEvidenceFor(type, field) {
  return (intake.candidates ?? []).filter((candidate) =>
    candidate.status === "accepted"
    && candidate.domain === "delta-1663210"
    && candidate.claim?.type === type
    && candidate.claim?.field === field);
}

const requiredProofs = [
  {
    id: "delta-proof-sf32-owner",
    gateId: "sf32-field",
    title: "Prouver l'ownership SF_32 / eAttrib 994 + role local 949",
    priority: "high",
    acceptedClaim: { type: SF32_OWNER_CLAIM.type, field: SF32_OWNER_CLAIM.field },
    acceptedSourceKinds: ["official", "extracted-game-data", "tool-output", "documented-dataset"],
    mustContain: [...SF32_OWNER_CLAIM.mustContain],
    rejects: ["selector:949 direct seul", "layout-analogy", "metadata 12337 seule", "scale 10 seul", "label UI"],
    parserBridge: "mapper eAttrib:994 + local-role:949 vers le champ proprietaire SF_32 pour asset 1663210",
  },
  {
    id: "delta-proof-sf33-trigger",
    gateId: "sf33-trigger",
    title: "Prouver le trigger SF_33 / Mod.SoilRuler_B",
    priority: "high",
    acceptedClaim: { type: "sf33-trigger", field: "Mod.SoilRuler_B" },
    acceptedSourceKinds: ["official", "extracted-game-data", "tool-output", "documented-dataset"],
    mustContain: ["1663210", "Mod.SoilRuler_B", "SF_33"],
    rejects: ["chaine locale seule", "voisinage d'offset sans parent", "inference-only"],
    parserBridge: "mapper Mod.SoilRuler_B vers une activation gameplay ou build-state explicite",
  },
  {
    id: "delta-proof-uptime",
    gateId: "uptime",
    title: "Prouver ou separer l'uptime",
    priority: "high",
    acceptedClaim: { type: "uptime", field: "uptime" },
    acceptedSourceKinds: ["official", "extracted-game-data", "tool-output", "documented-dataset"],
    mustContain: ["1663210", "uptime"],
    rejects: ["SF_28/SF_29 sans SF_32/SF_33", "probabilite locale seule", "valeur utilisateur non sourcee"],
    parserBridge: "mapper une uptime numerique source-backed ou confirmer un contrat what-if utilisateur strictement separe",
  },
];

const proofRows = requiredProofs.map((proof) => {
  const acceptedEvidence = acceptedEvidenceFor(proof.acceptedClaim.type, proof.acceptedClaim.field);
  return {
    ...proof,
    status: acceptedEvidence.length > 0 ? "ready-for-parser-bridge" : "missing-accepted-evidence",
    acceptedEvidence: acceptedEvidence.map((candidate) => ({
      id: candidate.id,
      source: candidate.source,
      claim: candidate.claim,
      reviewer: candidate.reviewer,
    })),
  };
});

const readyProofs = proofRows.filter((proof) => proof.status === "ready-for-parser-bridge");
const missingProofs = proofRows.filter((proof) => proof.status !== "ready-for-parser-bridge");
const bridgeDeltaStep = (bridge.steps ?? []).find((step) => step.id === "bridge-delta-1663210") ?? null;

const exampleCandidates = requiredProofs.map((proof) => ({
  id: `template-${proof.id}`,
  domain: "delta-1663210",
  assetId: 1663210,
  entityId: "skill:1663210",
  source: {
    kind: "extracted-game-data",
    title: "A REMPLIR: table, export ou rapport source",
    url: "",
    version: "A REMPLIR: version build/dataset",
    capturedAt: "YYYY-MM-DD",
  },
  claim: {
    type: proof.acceptedClaim.type,
    field: proof.acceptedClaim.field,
    value: "A REMPLIR",
    excerpt: `A REMPLIR: extrait court contenant ${proof.mustContain.join(" + ")}`,
    mapping: `1663210 -> ${proof.acceptedClaim.field} -> A REMPLIR`,
  },
  reviewer: {
    status: "pending",
    notes: [
      "Passer a approved seulement apres verification de la source.",
      `Rejeter: ${proof.rejects.join(", ")}.`,
    ],
  },
}));

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "external-delta-evidence-plan-v1",
  source: {
    externalEvidenceIntakeFile,
    externalEvidenceBridgeFile,
    deltaLocalConclusionFile,
    reliableGatesFile,
    outDir,
  },
  summary: {
    assetId: 1663210,
    entityId: "skill:1663210",
    strictDps: reliableGates.summary?.strictDps ?? 163200,
    blockedDeltaDps: reliableGates.summary?.blockedDeltaDps ?? 48960,
    requiredProofs: proofRows.length,
    readyProofs: readyProofs.length,
    missingProofs: missingProofs.length,
    acceptedExternalEvidence: intake.summary?.accepted ?? 0,
    bridgeDeltaStatus: bridgeDeltaStep?.status ?? null,
    allLocalEvidenceExhausted: deltaLocalConclusion.summary?.allLocalEvidenceExhausted === true,
    promotionReady: false,
    canModifyReliableDps: false,
    recommendedNextFocus: missingProofs[0]?.id ?? "parser-bridge-after-evidence",
    assessment: {
      kind: readyProofs.length === proofRows.length
        ? "external-delta-evidence-ready-for-parser-bridge"
        : "external-delta-evidence-missing-required-proofs",
      confidence: "high",
      promotionReady: false,
      finding: readyProofs.length === proofRows.length
        ? "Les preuves externes delta minimales sont presentes pour un pont parseur, mais aucun score fiable n'est modifie."
        : "Les preuves externes delta requises ne sont pas encore acceptees; aucun pont parseur fiable ne peut etre construit.",
      nextAction: readyProofs.length === proofRows.length
        ? "Construire un parser bridge cible avec invariants de promotion separes."
        : "Ajouter des entrees source-backed dans inputs/external-evidence-candidates.json puis les faire approuver.",
    },
  },
  requiredProofs: proofRows,
  exampleCandidates,
  safeguards: [
    "Ce plan ne modifie aucun DPS.",
    "Une preuve acceptee ne ferme pas automatiquement une gate.",
    "La promotion future exige un parser cible et des invariants de suite.",
    "Les preuves par analogie, UI, localisation ou inference restent rejetees.",
  ],
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "external-delta-evidence-plan.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
