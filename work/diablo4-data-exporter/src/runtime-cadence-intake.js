const { analyzeRuntimeCadence } = require("./runtime-cadence-analyzer");

const SYNTHETIC_MARKER = /(?:^|[^a-z])(synthetic|fixture)(?:[^a-z]|$)/i;

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function rejected(code, message, details = []) {
  return {
    accepted: false,
    status: code === "session-id-duplicate" ? "conflict" : "rejected",
    code,
    message,
    details,
    candidateInput: null,
    analysis: null,
    sessionAnalysis: null,
    safeguards: {
      writesObservationInput: false,
      canModifyReliableDps: false,
    },
  };
}

function syntheticMarkers(session) {
  const candidates = [
    session?.id,
    session?.sourceFile,
    ...(session?.attackSpeedState?.modifiers ?? []),
    ...(session?.buildState?.otherSkillModifiers ?? []),
    ...(session?.events ?? []).map((event) => event?.notes),
  ];
  return candidates
    .filter((value) => typeof value === "string" && SYNTHETIC_MARKER.test(value))
    .map((value) => value.trim());
}

function createRuntimeCadenceCandidate({ currentInput, session, boundaryAudit, schema, source = {} }) {
  if (!currentInput || typeof currentInput !== "object" || !Array.isArray(currentInput.sessions)) {
    return rejected("current-input-invalid", "L'entree runtime actuelle est invalide.");
  }
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return rejected("session-invalid", "La session doit etre un objet JSON.");
  }
  if (typeof session.id !== "string" || !session.id.trim()) {
    return rejected("session-id-invalid", "Un identifiant de session est requis.");
  }
  if (typeof session.sourceFile !== "string" || !session.sourceFile.trim()) {
    return rejected("source-file-required", "Un fichier source reel est requis.");
  }
  const markers = syntheticMarkers(session);
  if (markers.length) {
    return rejected("synthetic-source-rejected", "Les donnees synthetiques ou fixtures sont interdites dans l'entree reelle.", markers);
  }
  if (currentInput.sessions.some((existing) => existing?.id === session.id.trim())) {
    return rejected("session-id-duplicate", "Cet identifiant de session existe deja.", [session.id.trim()]);
  }

  const cleanSession = cloneJson(session);
  cleanSession.id = cleanSession.id.trim();
  cleanSession.sourceFile = cleanSession.sourceFile.trim();
  const candidateInput = cloneJson(currentInput);
  candidateInput.sessions.push(cleanSession);
  const analysis = analyzeRuntimeCadence({
    observations: candidateInput,
    boundaryAudit,
    schema,
    source,
  });
  const sessionAnalysis = analysis.sessionAnalysis.find((row) => row.id === cleanSession.id) ?? null;
  const issues = analysis.validation?.issues ?? [];
  if (issues.length || sessionAnalysis?.complete !== true) {
    return {
      ...rejected("session-contract-rejected", "La session ne satisfait pas encore le contrat runtime.", issues),
      analysis,
      sessionAnalysis,
    };
  }

  return {
    accepted: true,
    status: "accepted",
    code: "runtime-session-accepted",
    message: "La session est valide et peut etre enregistree.",
    details: [],
    candidateInput,
    analysis,
    sessionAnalysis,
    safeguards: {
      sourceFileRequired: true,
      syntheticMarkersRejected: true,
      currentStrictDpsKnown: analysis.summary.currentStrictDpsKnown,
      writesObservationInput: false,
      canModifyReliableDps: false,
    },
  };
}

module.exports = {
  createRuntimeCadenceCandidate,
};
