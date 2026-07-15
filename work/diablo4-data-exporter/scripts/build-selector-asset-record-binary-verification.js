const fs = require("fs");
const path = require("path");

const inputs = {
  selectorAssetRecordParser: process.argv[2] ?? "outputs/diablo4-selector-asset-record-parser/selector-asset-record-parser.json",
  outDir: process.argv[3] ?? "outputs/diablo4-selector-asset-record-binary-verification",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readField(buffer, absoluteOffset, role) {
  if (absoluteOffset + 4 > buffer.length) {
    return {
      readable: false,
      rawBytes: [],
      u32: null,
      i32: null,
      f32: null,
    };
  }

  const rawBytes = Array.from(buffer.subarray(absoluteOffset, absoluteOffset + 4));
  const f32 = buffer.readFloatLE(absoluteOffset);
  return {
    readable: true,
    rawBytes,
    u32: buffer.readUInt32LE(absoluteOffset),
    i32: buffer.readInt32LE(absoluteOffset),
    f32: Number.isFinite(f32) ? f32 : null,
    preferredValueKind: role === "scale" ? "f32" : "u32",
  };
}

function valuesMatch(field, read) {
  if (field.value === null || field.value === undefined) return "not-applicable";
  if (!read.readable) return false;
  if (field.role === "scale") return Math.abs(Number(read.f32) - Number(field.value)) < 0.000001;
  return Number(read.u32) === Number(field.value);
}

function verifyRecord(record) {
  const filePath = record.sourceFile;
  const fileExists = fs.existsSync(filePath);
  const buffer = fileExists ? fs.readFileSync(filePath) : null;
  const fields = [];

  for (const field of record.fields ?? []) {
    const absoluteOffset = Number(record.sourceOffset) + Number(field.offset);
    const read = buffer ? readField(buffer, absoluteOffset, field.role) : {
      readable: false,
      rawBytes: [],
      u32: null,
      i32: null,
      f32: null,
      preferredValueKind: field.role === "scale" ? "f32" : "u32",
    };
    fields.push({
      offset: field.offset,
      absoluteOffset,
      role: field.role,
      expectedValue: field.value ?? null,
      expectedStatus: field.status,
      read,
      match: valuesMatch(field, read),
    });
  }

  const comparable = fields.filter((field) => field.match !== "not-applicable");
  const failedMatches = comparable.filter((field) => field.match !== true);

  return {
    recordId: record.id,
    assetRef: record.assetRef,
    selector: record.selector,
    layoutId: record.layoutId,
    sourceFile: filePath,
    sourceOffset: record.sourceOffset,
    fileExists,
    fileLength: buffer?.length ?? null,
    comparableFields: comparable.length,
    failedMatches: failedMatches.length,
    binaryVerified: fileExists && failedMatches.length === 0,
    payloadStatus: record.payloadStatus,
    fields,
    safeguards: {
      writesTargetDataset: false,
      writesRealIntake: false,
      canModifyReliableDps: false,
      canUseForReliableDps: false,
      canUseForRanking: false,
      acceptedForBridge: false,
      promotionReady: false,
    },
  };
}

const parser = readJson(inputs.selectorAssetRecordParser);
const records = parser.records ?? [];
const verifications = records.map(verifyRecord);
const targetVerification = verifications.find((record) =>
  Number(record.assetRef) === 1663210 &&
  Number(record.selector) === 949 &&
  record.layoutId === "compact-metadata-scale-layout"
);

const failedInvariants = [];
if (parser.summary?.readOnlyParserReady !== true) failedInvariants.push("parser-not-ready");
if (verifications.some((record) => !record.binaryVerified)) failedInvariants.push("binary-record-verification-failed");
if (!targetVerification) failedInvariants.push("target-verification-missing");
if (targetVerification && !targetVerification.binaryVerified) failedInvariants.push("target-verification-failed");
if (verifications.some((record) => record.safeguards.canModifyReliableDps !== false)) failedInvariants.push("record-can-modify-reliable-dps");
if (verifications.some((record) => record.safeguards.acceptedForBridge !== false)) failedInvariants.push("record-opens-bridge");

const targetField = (role) => targetVerification?.fields?.find((field) => field.role === role);

const report = {
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  mode: "selector-asset-record-binary-verification-v1",
  source: inputs,
  summary: {
    parserRoot: "selector-asset-record",
    assetId: 1663210,
    entityId: "skill:1663210",
    records: records.length,
    binaryVerifiedRecords: verifications.filter((record) => record.binaryVerified).length,
    failedRecordVerifications: verifications.filter((record) => !record.binaryVerified).length,
    targetBinaryVerified: targetVerification?.binaryVerified === true,
    targetSelectorU32: targetField("selector")?.read?.u32 ?? null,
    targetAssetRefU32: targetField("assetRef")?.read?.u32 ?? null,
    targetMetadataIdU32: targetField("metadataId")?.read?.u32 ?? null,
    targetOpcodeU32: targetField("opcode")?.read?.u32 ?? null,
    targetScaleF32: targetField("scale")?.read?.f32 ?? null,
    failedInvariants: failedInvariants.length,
    binaryVerificationReady: failedInvariants.length === 0,
    semanticBridgeReady: false,
    acceptedForBridge: false,
    writesTargetDataset: false,
    writesRealIntake: false,
    canModifyReliableDps: false,
    canUseForReliableDps: false,
    canUseForRanking: false,
    promotionReady: false,
    assessment: {
      kind: failedInvariants.length === 0
        ? "selector-asset-record-binary-verification-ready"
        : "selector-asset-record-binary-verification-failed",
      confidence: failedInvariants.length === 0 ? "high" : "medium",
      promotionReady: false,
      finding: failedInvariants.length === 0
        ? "Les records selector-asset sont confirmes par lecture binaire aux offsets connus."
        : "Une ou plusieurs lectures binaires ne correspondent pas aux records attendus.",
      nextAction: failedInvariants.length === 0
        ? "Utiliser cette verification comme preuve structurelle, puis chercher une preuve semantique SF_32/SF_33/uptime avant bridge."
        : "Corriger les offsets ou les layouts avant de poursuivre.",
    },
  },
  verifications,
  failedInvariants,
  safeguards: {
    readOnlyVerification: true,
    noTargetDatasetWrite: true,
    noIntakeWrite: true,
    noBridgeOpen: true,
    reliableDpsStrictOnly: true,
  },
};

fs.mkdirSync(inputs.outDir, { recursive: true });
const outFile = path.join(inputs.outDir, "selector-asset-record-binary-verification.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
