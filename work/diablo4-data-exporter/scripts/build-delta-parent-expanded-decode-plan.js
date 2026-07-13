const fs = require("fs");
const path = require("path");

const inputs = {
  corpusScan: process.argv[2] ?? "outputs/diablo4-delta-parent-consumer-corpus-scan/delta-parent-consumer-corpus-scan.json",
  sf33ActivationAudit: process.argv[3] ?? "outputs/diablo4-sf33-activation-source-search-audit/sf33-activation-source-search-audit.json",
  outDir: process.argv[4] ?? "outputs/diablo4-delta-parent-expanded-decode-plan",
  dataDir: process.argv[5] ?? "C:\\Program Files (x86)\\Diablo IV\\Data\\data",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function decodedPayloadGlob(assetId) {
  const dir = path.join("outputs", `diablo4-source-asset-${assetId}-payload`);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".decoded.bin"))
    .map((name) => path.join(dir, name));
}

function uniqueByAsset(rows) {
  const byAsset = new Map();
  for (const row of rows) {
    const previous = byAsset.get(row.assetId);
    if (!previous || Number(row.score ?? 0) > Number(previous.score ?? 0)) byAsset.set(row.assetId, row);
  }
  return Array.from(byAsset.values()).sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));
}

function decodeCommand(row, outDir) {
  const node = process.execPath;
  const script = path.resolve("work", "diablo4-data-exporter", "d4export.js");
  const file = path.join(inputs.dataDir, row.fileName);
  return [
    "&",
    psQuote(node),
    psQuote(script),
    "decode-blte",
    "--file",
    psQuote(file),
    "--offset",
    String(row.blteOffset),
    "--out",
    psQuote(path.resolve(outDir)),
  ].join(" ");
}

const corpusScan = readJson(inputs.corpusScan);
const sf33ActivationAudit = readJson(inputs.sf33ActivationAudit);
const analogyAssets = uniqueByAsset(sf33ActivationAudit.upgradeAnalogyAssets ?? []);

const candidates = analogyAssets.map((row, index) => {
  const decodedPayloads = decodedPayloadGlob(row.assetId);
  const payloadOutDir = path.join("outputs", `diablo4-source-asset-${row.assetId}-payload`);
  const decoded = decodedPayloads.length > 0;
  return {
    rank: index + 1,
    assetId: row.assetId,
    fileName: row.fileName,
    blteOffset: row.blteOffset,
    score: row.score,
    confidence: row.confidence,
    groups: row.groups ?? [],
    sampleValues: row.sampleValues ?? [],
    relevance: row.relevance ?? "generic-build-state-analogy",
    decoded,
    decodedPayloads,
    requiredAction: decoded ? "inspect-structural-parent-pattern" : "decode-before-inspection",
    decodeCommand: decoded ? null : decodeCommand(row, payloadOutDir),
  };
});

const decodedCandidates = candidates.filter((row) => row.decoded);
const missingDecode = candidates.filter((row) => !row.decoded);
const highConfidenceDecoded = decodedCandidates.filter((row) => row.confidence === "high");
const nextInspectionQueue = [
  ...highConfidenceDecoded,
  ...decodedCandidates.filter((row) => row.confidence !== "high"),
].slice(0, 8);

const scriptLines = [
  "$ErrorActionPreference = 'Stop'",
  "",
  ...missingDecode.flatMap((row) => [
    `# Decode asset ${row.assetId} (${row.fileName} @ ${row.blteOffset})`,
    row.decodeCommand,
    "",
  ]),
];

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "delta-parent-expanded-decode-plan-v1",
  source: inputs,
  summary: {
    previousCorpusAssessment: corpusScan.summary?.assessment?.kind ?? null,
    upgradeAnalogyAssets: candidates.length,
    decodedCandidates: decodedCandidates.length,
    missingDecode: missingDecode.length,
    highConfidenceDecoded: highConfidenceDecoded.length,
    nextInspectionAssets: nextInspectionQueue.map((row) => row.assetId),
    canModifyReliableDps: false,
    promotionReady: false,
    assessment: {
      kind: missingDecode.length
        ? "delta-parent-expanded-decode-plan-has-missing-payloads"
        : "delta-parent-expanded-decode-plan-ready-for-structural-inspection",
      confidence: "high",
      promotionReady: false,
      finding: missingDecode.length
        ? "Des analogies UpgradeB/C doivent encore etre decodees avant comparaison structurelle."
        : "Les analogies UpgradeB/C prioritaires sont deja decodees; la suite doit comparer leurs structures parent/consommateur au cas SoilRuler.",
      nextAction: missingDecode.length
        ? "Decoder les payloads manquants, puis relancer le plan."
        : "Auditer les structures Mod.UpgradeB/C pour identifier un patron parent/consommateur reutilisable sans promouvoir SF_33.",
    },
  },
  candidates,
  nextInspectionQueue,
  decodeScript: {
    path: path.join(inputs.outDir, "run-missing-delta-parent-decodes.ps1"),
    commands: missingDecode.map((row) => row.decodeCommand),
  },
  safeguards: [
    "Les assets UpgradeB/C sont des analogies de structure, pas des preuves d'activation de SoilRuler.",
    "Un payload decode ne peut pas modifier reliableDps sans audit structurel puis bridge parseur.",
    "La promotion SF_33 reste bloquee tant qu'aucun parent/consommateur exact de Mod.SoilRuler_B n'est prouve.",
  ],
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "delta-parent-expanded-decode-plan.json");
const scriptFile = path.join(inputs.outDir, "run-missing-delta-parent-decodes.ps1");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
fs.writeFileSync(scriptFile, scriptLines.join("\r\n"));
console.log(JSON.stringify({ outFile, scriptFile, summary: report.summary }, null, 2));
