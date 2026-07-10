const fs = require("fs");
const path = require("path");

const canonicalVariablesFile = process.argv[2] ?? "outputs/diablo4-canonical-external-variables/canonical-external-variables.json";
const dpsRoleAuditFile = process.argv[3] ?? "outputs/diablo4-dps-role-audit/dps-role-audit.json";
const sfInspectionFile = process.argv[4] ?? "outputs/diablo4-sf-inspection/sf-inspection-summary.json";
const uptimeProofFile = process.argv[5] ?? "outputs/diablo4-uptime-proof-audit/uptime-proof-audit.json";
const outDir = process.argv[6] ?? "outputs/diablo4-sf28-sf29-role-audit";

const assetId = 1663210;
const canonicalIds = ["sf:1663210:28", "sf:1663210:29"];

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
}

function collectCanonicalRows(report) {
  const variables = report?.variables ?? report?.canonicalVariables ?? report?.byCanonicalId ?? {};
  return canonicalIds.map((canonicalId) => {
    const row = variables[canonicalId] ?? null;
    return {
      canonicalId,
      kind: row?.kind ?? null,
      sfIndex: row?.sfIndex ?? Number(canonicalId.split(":").at(-1)),
      confidenceCounts: row?.confidenceCounts ?? {},
      occurrences: (row?.occurrences ?? []).map((occurrence) => ({
        assetId: occurrence.assetId ?? null,
        nodeId: occurrence.nodeId ?? null,
        sourceSyntax: occurrence.sourceSyntax ?? null,
        expression: occurrence.expression ?? occurrence.value ?? null,
      })),
    };
  });
}

function collectRoleRows(report) {
  const text = JSON.stringify(report ?? {});
  return canonicalIds.map((canonicalId) => {
    const sfIndex = canonicalId.split(":").at(-1);
    const pattern = new RegExp(`sf:${assetId}:${sfIndex}|SF_${sfIndex}`, "g");
    return {
      canonicalId,
      textMentions: [...text.matchAll(pattern)].length,
      roleMentions: collectObjects(report, (value) => {
        const expression = value?.expression ?? value?.canonicalExpression ?? "";
        return expression.includes(`SF_${sfIndex}`) || expression.includes(`sf:${assetId}:${sfIndex}`);
      }).map((value) => ({
        expression: value.expression ?? null,
        canonicalExpression: value.canonicalExpression ?? null,
        role: value.currentRole?.role ?? value.dpsRole?.role ?? value.role ?? null,
        confidence: value.currentRole?.confidence ?? value.dpsRole?.confidence ?? value.confidence ?? null,
        reason: value.currentRole?.reason ?? value.dpsRole?.reason ?? value.reason ?? null,
      })),
    };
  });
}

function collectSfInspectionRows(report) {
  const rows = collectObjects(report, (value) => Number(value?.assetId) === assetId && /SF_28|SF_29/.test(value?.expression ?? ""));
  return rows.map((row) => ({
    assetId: row.assetId,
    expression: row.expression,
    guess: row.guess,
    match: row.match,
  }));
}

function collectObjects(value, predicate, rows = []) {
  if (!value || typeof value !== "object") return rows;
  if (!Array.isArray(value) && predicate(value)) rows.push(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    collectObjects(child, predicate, rows);
  }
  return rows;
}

const canonicalVariables = readJsonIfExists(canonicalVariablesFile);
const dpsRoleAudit = readJsonIfExists(dpsRoleAuditFile);
const sfInspection = readJsonIfExists(sfInspectionFile);
const uptimeProof = readJsonIfExists(uptimeProofFile);

const canonicalRows = collectCanonicalRows(canonicalVariables);
const roleRows = collectRoleRows(dpsRoleAudit);
const inspectionRows = collectSfInspectionRows(sfInspection);
const probabilityNeighbors = uptimeProof?.summary?.assessment?.evidence?.probabilityNeighbors ?? [];
const linkedProbabilityNeighbors = uptimeProof?.summary?.linkedProbabilityNeighbors ?? 0;
const roleValues = roleRows.flatMap((row) => row.roleMentions.map((mention) => mention.role).filter(Boolean));
const hasUptimeRole = roleValues.includes("uptime") || roleValues.includes("uptime-or-chance");
const allLocalScriptFormula = canonicalRows.every((row) => row.kind === "script-formula-local");
const hasCompiledProbabilityMatches = inspectionRows.some((row) => /POW\(/i.test(row.expression ?? "") && row.match === true);
const promotionReady = hasUptimeRole && linkedProbabilityNeighbors > 0;

const assessment = {
  kind: promotionReady
    ? "sf28-sf29-uptime-role-ready"
    : hasCompiledProbabilityMatches
      ? "sf28-sf29-probability-local-not-uptime-proof"
      : "sf28-sf29-role-unresolved",
  confidence: allLocalScriptFormula && hasCompiledProbabilityMatches ? "medium-high" : "medium",
  promotionReady,
  blocker: promotionReady ? null : "uptime-not-proven",
  finding: hasCompiledProbabilityMatches
    ? "SF_28/SF_29 alimentent des formules de probabilite compilees, mais leur role reste local/utility et n'est pas relie au scenario SF_32/SF_33."
    : "SF_28/SF_29 ne sont pas encore relies a une preuve d'uptime exploitable.",
  nextAction: "Chercher la source gameplay de SF_28/SF_29 ou une condition utilisateur explicite avant toute utilisation comme uptime fiable.",
  evidence: {
    canonicalRows,
    roleRows,
    inspectionRows,
    probabilityNeighbors,
    linkedProbabilityNeighbors,
    roleValues,
    allLocalScriptFormula,
    hasCompiledProbabilityMatches,
    hasUptimeRole,
  },
};

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "sf28-sf29-role-audit-v1",
  source: {
    canonicalVariables: canonicalVariablesFile,
    dpsRoleAudit: dpsRoleAuditFile,
    sfInspection: sfInspectionFile,
    uptimeProof: uptimeProofFile,
  },
  summary: {
    assetId,
    canonicalIds,
    probabilityNeighbors: probabilityNeighbors.length,
    linkedProbabilityNeighbors,
    compiledProbabilityMatches: inspectionRows.filter((row) => /POW\(/i.test(row.expression ?? "") && row.match === true).length,
    hasUptimeRole,
    promotionReady,
    assessment,
  },
};

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "sf28-sf29-role-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
