const fs = require("fs");
const path = require("path");

const stringStructureFile = process.argv[2] ?? "outputs/diablo4-source-asset-1663210-string-structure/decoded-string-structure.json";
const recordSegmentsFile = process.argv[3] ?? "outputs/diablo4-source-asset-1663210-record-segments/record-segment-inspection.json";
const uptimeProofFile = process.argv[4] ?? "outputs/diablo4-uptime-proof-audit/uptime-proof-audit.json";
const sf28Sf29RoleFile = process.argv[5] ?? "outputs/diablo4-sf28-sf29-role-audit/sf28-sf29-role-audit.json";
const probabilityChainFile = "outputs/diablo4-uptime-probability-chain/uptime-probability-chain.json";
const outDir = process.argv[6] ?? "outputs/diablo4-uptime-neighbor-dependency";

const assetId = 1663210;
const branchPattern = /\bSF_33\b|\bSF_32\b/;
const probabilityPattern = /\bSF_28\b|\bSF_29\b|POW\(/i;
const bonusTarget = "Bonus_Percent_Per_Power#Spiritborn_Centipede_Ultimate";

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function compactStringRow(row, index) {
  return {
    index,
    offset: row.offset ?? null,
    endOffset: row.endOffset ?? null,
    kind: row.kind ?? null,
    value: row.value ?? null,
  };
}

function compactSegment(segment) {
  return {
    index: segment.index ?? null,
    start: segment.start ?? null,
    end: segment.end ?? null,
    byteLength: segment.byteLength ?? null,
    from: segment.from
      ? {
          offset: segment.from.offset ?? null,
          kind: segment.from.kind ?? null,
          value: segment.from.value ?? null,
        }
      : null,
    to: segment.to
      ? {
          offset: segment.to.offset ?? null,
          kind: segment.to.kind ?? null,
          value: segment.to.value ?? null,
        }
      : null,
    signature: segment.signature ?? null,
    roles: segment.roles ?? [],
    tokenSummary: (segment.tokens ?? []).map((token) => ({
      offset: token.offset ?? null,
      kind: token.kind ?? null,
      value: token.value ?? token.name ?? token.u32 ?? null,
    })),
  };
}

function sfRefs(value) {
  return [...new Set([...asString(value).matchAll(/\bSF_(\d+)\b/g)].map((match) => Number(match[1])))]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

const stringStructure = readJsonIfExists(stringStructureFile);
const recordSegments = readJsonIfExists(recordSegmentsFile);
const uptimeProof = readJsonIfExists(uptimeProofFile);
const sf28Sf29Role = readJsonIfExists(sf28Sf29RoleFile);
const probabilityChain = readJsonIfExists(probabilityChainFile);

const strings = stringStructure?.strings ?? [];
const interestingSegments = recordSegments?.interestingSegments ?? [];
const branchRows = strings
  .map(compactStringRow)
  .filter((row) => branchPattern.test(asString(row.value)));
const bonusRows = strings
  .map(compactStringRow)
  .filter((row) => asString(row.value).includes(bonusTarget));
const probabilityRows = strings
  .map(compactStringRow)
  .filter((row) => probabilityPattern.test(asString(row.value)) && !branchPattern.test(asString(row.value)));

const targetBonusRow = bonusRows.at(-1) ?? null;
const localProbabilityRows = targetBonusRow
  ? probabilityRows
      .filter((row) => Number(row.offset) > Number(targetBonusRow.offset))
      .sort((a, b) => Number(a.offset) - Number(b.offset))
      .slice(0, 2)
  : [];
const nearestBranchRow = targetBonusRow
  ? branchRows
      .filter((row) => Number(row.offset) < Number(targetBonusRow.offset))
      .sort((a, b) => Number(b.offset) - Number(a.offset))[0] ?? null
  : null;

const relevantSegments = interestingSegments
  .filter((segment) => {
    const text = `${segment.from?.value ?? ""}\n${segment.to?.value ?? ""}`;
    return text.includes(bonusTarget) || branchPattern.test(text) || probabilityPattern.test(text);
  })
  .map(compactSegment);

const probabilityDependencyRows = localProbabilityRows.map((row) => ({
  ...row,
  sfRefs: sfRefs(row.value),
  hasSf32: /\bSF_32\b/.test(asString(row.value)),
  hasSf33: /\bSF_33\b/.test(asString(row.value)),
  distanceFromBonus: targetBonusRow ? Number(row.offset) - Number(targetBonusRow.offset) : null,
  distanceFromNearestBranch: nearestBranchRow ? Number(row.offset) - Number(nearestBranchRow.offset) : null,
}));

const probabilityRowsLinkedToBranch = probabilityDependencyRows.filter((row) => row.hasSf32 || row.hasSf33);
const branchToBonusDistance = targetBonusRow && nearestBranchRow ? Number(targetBonusRow.offset) - Number(nearestBranchRow.offset) : null;
const hasExplicitUptime =
  uptimeProof?.summary?.hasExplicitUptime === true ||
  sf28Sf29Role?.summary?.hasUptimeRole === true ||
  probabilityChain?.summary?.chainsWithDurationHint > 0 ||
  probabilityDependencyRows.some((row) => /uptime|duration|chance|proc/i.test(asString(row.value)));
const hasNumericUptime = uptimeProof?.summary?.hasNumericUptime === true;
const promotionReady = probabilityRowsLinkedToBranch.length > 0 && hasExplicitUptime && hasNumericUptime;

const assessment = {
  kind: promotionReady
    ? "uptime-neighbor-dependency-ready"
    : probabilityDependencyRows.length
      ? "uptime-probability-neighbors-not-linked-to-boost-branch"
      : "uptime-neighbor-dependency-missing",
  confidence: probabilityDependencyRows.length && targetBonusRow && nearestBranchRow ? "high" : "medium",
  promotionReady,
  blocker: promotionReady ? null : "uptime-not-proven",
  finding: probabilityDependencyRows.length
    ? "Les formules SF_28/SF_29 suivent le hash bonus cible, mais ne referencent ni SF_32 ni SF_33 et restent separees de la branche boostee."
    : "Aucune dependance locale SF_28/SF_29 exploitable n'a ete isolee autour du bonus cible.",
  nextAction: promotionReady
    ? "Autoriser l'uptime seulement avec un champ numerique et un lien explicite au scenario."
    : "Ne pas utiliser SF_28/SF_29 comme uptime fiable; chercher une source gameplay externe ou garder une hypothese utilisateur separee du DPS strict.",
  evidence: {
    assetId,
    nearestBranchRow,
    targetBonusRow,
    branchToBonusDistance,
    probabilityDependencyRows,
    probabilityRowsLinkedToBranch: probabilityRowsLinkedToBranch.length,
    hasExplicitUptime,
    hasNumericUptime,
    probabilityChainAssessment: probabilityChain?.summary?.assessment?.kind ?? null,
    probabilityChains: probabilityChain?.summary?.probabilityChains ?? null,
    probabilityChainsLinkedToBoost: probabilityChain?.summary?.chainsLinkedToBoost ?? null,
    probabilityChainsWithAttackSpeedSource: probabilityChain?.summary?.chainsWithAttackSpeedSource ?? null,
    relevantSegments,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "uptime-neighbor-dependency-audit-v1",
  source: {
    stringStructure: stringStructureFile,
    recordSegments: recordSegmentsFile,
    uptimeProof: uptimeProofFile,
    sf28Sf29Role: sf28Sf29RoleFile,
    probabilityChain: probabilityChain ? probabilityChainFile : null,
  },
  summary: {
    assetId,
    branchRows: branchRows.length,
    bonusRows: bonusRows.length,
    probabilityRows: probabilityRows.length,
    localProbabilityRows: localProbabilityRows.length,
    probabilityRowsLinkedToBranch: probabilityRowsLinkedToBranch.length,
    hasExplicitUptime,
    hasNumericUptime,
    promotionReady,
    assessment,
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "uptime-neighbor-dependency.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
