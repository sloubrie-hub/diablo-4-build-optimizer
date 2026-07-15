(() => {
  const API_URL = "../api/runtime-cadence";
  const root = document.getElementById("runtimeCaptureWorkspace");
  const statusPill = document.getElementById("runtimeCaptureStatus");
  if (!root || !statusPill) return;

  const eventKinds = [
    ["cast-start", "Debut du lancer"],
    ["spawn-contact", "Apparition / contact"],
    ["attack-start", "Debut d'attaque"],
    ["attack-contact", "Contact d'attaque"],
    ["damage-instance", "Instance de degats"],
    ["despawn", "Disparition"],
  ];
  const attackKinds = [
    ["none", "Aucune"],
    ["projectile", "Projectile"],
    ["breath", "Souffle"],
    ["unknown", "Inconnue"],
  ];
  const issueLabels = {
    "events-empty": "Ajoutez les evenements de la session.",
    "cast-start-count-invalid": "La session doit contenir un seul debut de lancer.",
    "despawn-count-invalid": "La session doit contenir une seule disparition.",
    "attack-contacts-empty": "Ajoutez au moins un contact d'attaque.",
    "damage-events-empty": "Ajoutez au moins une instance de degats.",
    "events-not-chronological": "Les evenements doivent suivre l'ordre de la capture.",
    "contact-attack-kind-required": "Chaque contact doit identifier projectile ou souffle.",
    "damage-instance-count-required": "Chaque evenement de degats doit indiquer au moins une instance.",
    "speed-value-required": "Indiquez la vitesse d'attaque pour ce scenario.",
    "additional-property": "Le brouillon contient un champ non reconnu.",
  };

  const state = {
    snapshot: null,
    draft: newDraft(),
    previewSignature: null,
    preview: null,
    busy: false,
    message: "",
    tone: "neutral",
  };

  function newDraft() {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");
    return {
      id: `capture-${stamp}`,
      scenarioId: "baseline-sequence",
      sourceFile: "",
      captureFps: 60,
      speedLabel: "baseline",
      attacksPerSecond: null,
      speedModifiers: "",
      otherSkillModifiers: "",
      events: [],
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function splitList(value) {
    return String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function optionList(options, selectedValue) {
    return options.map(([value, label]) => `
      <option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>
    `).join("");
  }

  function currentScenario() {
    return (state.snapshot?.scenarios ?? []).find((scenario) => scenario.id === state.draft.scenarioId) ?? null;
  }

  function buildSession() {
    const speedScenario = state.draft.scenarioId === "attack-speed-scaling";
    return {
      id: state.draft.id.trim(),
      scenarioId: state.draft.scenarioId,
      sourceFile: state.draft.sourceFile.trim(),
      captureFps: Number(state.draft.captureFps),
      attackSpeedState: {
        label: state.draft.speedLabel.trim(),
        attacksPerSecond: speedScenario && Number.isFinite(Number(state.draft.attacksPerSecond))
          ? Number(state.draft.attacksPerSecond)
          : null,
        modifiers: splitList(state.draft.speedModifiers),
      },
      buildState: {
        blastOfBile: state.draft.scenarioId === "blast-of-bile-single-breath",
        attackSpeedStableWithinCast: true,
        otherSkillModifiers: splitList(state.draft.otherSkillModifiers),
      },
      events: state.draft.events
        .map((event) => ({
          observedAtSeconds: Number(event.observedAtSeconds),
          sourceFrame: Number.isInteger(Number(event.sourceFrame)) && event.sourceFrame !== ""
            ? Number(event.sourceFrame)
            : null,
          eventKind: event.eventKind,
          attackKind: event.attackKind,
          damageInstanceCount: Number.isInteger(Number(event.damageInstanceCount)) && event.damageInstanceCount !== ""
            ? Number(event.damageInstanceCount)
            : null,
          notes: event.notes?.trim() || null,
        }))
        .sort((left, right) => left.observedAtSeconds - right.observedAtSeconds),
    };
  }

  function signature() {
    return JSON.stringify(buildSession());
  }

  function invalidatePreview() {
    state.previewSignature = null;
    state.preview = null;
    if (state.message) {
      state.message = "Brouillon modifie: un nouvel apercu est requis.";
      state.tone = "neutral";
    }
    updateActionState();
  }

  function metric(label, value) {
    return `<div class="runtime-capture-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  function scenarioOptions() {
    const scenarios = state.snapshot?.scenarios ?? [];
    return scenarios.map((scenario) => `
      <option value="${escapeHtml(scenario.id)}" ${scenario.id === state.draft.scenarioId ? "selected" : ""}>${escapeHtml(scenario.label)}</option>
    `).join("");
  }

  function eventRows() {
    if (!state.draft.events.length) return `<tr><td colspan="7" class="runtime-event-empty">Aucun evenement</td></tr>`;
    return state.draft.events.map((event, index) => `
      <tr>
        <td><input type="number" min="0" step="0.001" value="${escapeHtml(event.observedAtSeconds)}" data-event-index="${index}" data-event-field="observedAtSeconds" aria-label="Seconde evenement ${index + 1}"></td>
        <td><input type="number" min="0" step="1" value="${escapeHtml(event.sourceFrame ?? "")}" data-event-index="${index}" data-event-field="sourceFrame" aria-label="Frame evenement ${index + 1}"></td>
        <td><select data-event-index="${index}" data-event-field="eventKind" aria-label="Type evenement ${index + 1}">${optionList(eventKinds, event.eventKind)}</select></td>
        <td><select data-event-index="${index}" data-event-field="attackKind" aria-label="Attaque evenement ${index + 1}">${optionList(attackKinds, event.attackKind)}</select></td>
        <td><input type="number" min="0" step="1" value="${escapeHtml(event.damageInstanceCount ?? "")}" data-event-index="${index}" data-event-field="damageInstanceCount" aria-label="Instances evenement ${index + 1}"></td>
        <td><input type="text" value="${escapeHtml(event.notes ?? "")}" data-event-index="${index}" data-event-field="notes" aria-label="Note evenement ${index + 1}"></td>
        <td><button class="runtime-event-remove" type="button" data-remove-event="${index}" title="Supprimer l'evenement" aria-label="Supprimer l'evenement ${index + 1}">&times;</button></td>
      </tr>
    `).join("");
  }

  function renderMessage() {
    const issues = state.preview?.validation?.issues ?? state.preview?.details ?? [];
    const issueItems = issues.slice(0, 6).map((issue) => {
      const code = typeof issue === "string" ? issue : issue.code;
      const fallback = typeof issue === "string" ? issue : issue.message;
      return `<li>${escapeHtml(issueLabels[code] ?? fallback ?? code)}</li>`;
    }).join("");
    return `
      <div class="runtime-capture-message ${state.tone === "positive" ? "positive" : state.tone === "blocked" ? "blocked" : ""}" aria-live="polite">
        <span>${escapeHtml(state.message)}</span>
        ${issueItems ? `<ul>${issueItems}</ul>` : ""}
      </div>
    `;
  }

  function render() {
    const summary = state.snapshot?.summary ?? {};
    const complete = Number(summary.completeSessions ?? 0);
    const minimum = Number(summary.minimumTotalCasts ?? 20);
    const gates = Number(summary.gates ?? 7);
    const passed = Number(summary.passedGates ?? 0);
    const speedScenario = state.draft.scenarioId === "attack-speed-scaling";
    const scenario = currentScenario();
    statusPill.textContent = state.snapshot ? `${complete}/${minimum} sessions` : "API indisponible";
    root.innerHTML = `
      <div class="runtime-capture-metrics">
        ${metric("Sessions", `${complete}/${minimum}`)}
        ${metric("Portes", `${passed}/${gates}`)}
        ${metric("Couverture", `${Number(summary.collectionCoveragePct ?? 0)} %`)}
        ${metric("Erreurs", Number(summary.validationIssues ?? 0))}
        ${metric("DPS courant", summary.currentStrictDpsKnown ? "connu" : "inconnu")}
      </div>
      <div class="runtime-capture-form">
        <div class="runtime-capture-fields">
          <label class="runtime-field">
            <span>Identifiant</span>
            <input type="text" value="${escapeHtml(state.draft.id)}" data-draft-field="id">
          </label>
          <label class="runtime-field runtime-field-wide">
            <span>Fichier source</span>
            <input type="text" value="${escapeHtml(state.draft.sourceFile)}" placeholder="capture-baseline-001.mp4" data-draft-field="sourceFile">
          </label>
          <label class="runtime-field">
            <span>Scenario</span>
            <select data-draft-field="scenarioId">${scenarioOptions()}</select>
          </label>
          <label class="runtime-field">
            <span>Capture FPS</span>
            <input type="number" min="60" step="1" value="${escapeHtml(state.draft.captureFps)}" data-draft-field="captureFps">
          </label>
          <label class="runtime-field">
            <span>Etat de vitesse</span>
            <input type="text" value="${escapeHtml(state.draft.speedLabel)}" data-draft-field="speedLabel">
          </label>
          <label class="runtime-field">
            <span>Attaques / seconde</span>
            <input type="number" min="0.001" step="0.001" value="${escapeHtml(state.draft.attacksPerSecond ?? "")}" data-draft-field="attacksPerSecond" ${speedScenario ? "" : "disabled"}>
          </label>
          <label class="runtime-field runtime-field-wide">
            <span>Modificateurs vitesse</span>
            <input type="text" value="${escapeHtml(state.draft.speedModifiers)}" data-draft-field="speedModifiers">
          </label>
          <label class="runtime-field runtime-field-wide">
            <span>Autres modificateurs</span>
            <input type="text" value="${escapeHtml(state.draft.otherSkillModifiers)}" data-draft-field="otherSkillModifiers">
          </label>
        </div>
        <div class="runtime-capture-scenario-state">
          <span>${escapeHtml(scenario?.label ?? state.draft.scenarioId)}</span>
          <strong>${state.draft.scenarioId === "blast-of-bile-single-breath" ? "Blast of Bile actif" : "Blast of Bile inactif"}</strong>
        </div>
        <div class="runtime-event-editor">
          <div class="runtime-event-add-grid">
            <label class="runtime-field"><span>Seconde</span><input id="runtimeNewEventTime" type="number" min="0" step="0.001" value="0"></label>
            <label class="runtime-field"><span>Frame</span><input id="runtimeNewEventFrame" type="number" min="0" step="1"></label>
            <label class="runtime-field"><span>Evenement</span><select id="runtimeNewEventKind">${optionList(eventKinds, "cast-start")}</select></label>
            <label class="runtime-field"><span>Attaque</span><select id="runtimeNewAttackKind">${optionList(attackKinds, "none")}</select></label>
            <label class="runtime-field"><span>Instances</span><input id="runtimeNewDamageCount" type="number" min="0" step="1"></label>
            <label class="runtime-field"><span>Note</span><input id="runtimeNewEventNotes" type="text"></label>
            <button class="ghost-button runtime-add-event" id="runtimeAddEvent" type="button">Ajouter</button>
          </div>
          <div class="runtime-event-table-wrap">
            <table class="runtime-event-table">
              <thead><tr><th>Seconde</th><th>Frame</th><th>Evenement</th><th>Attaque</th><th>Instances</th><th>Note</th><th></th></tr></thead>
              <tbody>${eventRows()}</tbody>
            </table>
          </div>
        </div>
        <div class="runtime-capture-actions">
          <button class="ghost-button" id="runtimeNewSession" type="button">Nouvelle session</button>
          <button class="ghost-button" id="runtimePreviewSession" type="button">Valider</button>
          <button class="action-button runtime-save-session" id="runtimeSaveSession" type="button">Enregistrer</button>
        </div>
        ${renderMessage()}
      </div>
    `;
    updateActionState();
  }

  function updateActionState() {
    const previewButton = document.getElementById("runtimePreviewSession");
    const saveButton = document.getElementById("runtimeSaveSession");
    const newButton = document.getElementById("runtimeNewSession");
    if (previewButton) previewButton.disabled = state.busy || !state.snapshot;
    if (saveButton) saveButton.disabled = state.busy || state.previewSignature !== signature();
    if (newButton) newButton.disabled = state.busy;
  }

  function setMessage(message, tone, preview = null) {
    state.message = message;
    state.tone = tone;
    state.preview = preview;
  }

  async function apiRequest(requestPath, options = {}) {
    const response = await fetch(requestPath, options);
    const data = await response.json().catch(() => ({ code: "invalid-api-response", message: "Reponse serveur invalide." }));
    return { response, data };
  }

  async function loadSnapshot() {
    const { response, data } = await apiRequest(API_URL);
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    state.snapshot = data;
  }

  async function previewSession() {
    state.busy = true;
    setMessage("Validation en cours", "neutral");
    render();
    try {
      const session = buildSession();
      const { response, data } = await apiRequest(`${API_URL}/sessions/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session }),
      });
      if (!response.ok || data.accepted !== true) {
        state.previewSignature = null;
        setMessage(data.message || "Session refusee.", "blocked", data);
      } else {
        state.previewSignature = JSON.stringify(session);
        setMessage("Session valide. L'enregistrement est disponible.", "positive", data);
      }
    } catch (error) {
      state.previewSignature = null;
      setMessage(error.message || "Validation impossible.", "blocked");
    } finally {
      state.busy = false;
      render();
    }
  }

  async function saveSession() {
    if (state.previewSignature !== signature()) return;
    state.busy = true;
    setMessage("Enregistrement en cours", "neutral");
    render();
    try {
      const { response, data } = await apiRequest(`${API_URL}/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: buildSession() }),
      });
      if (!response.ok || data.saved !== true) {
        setMessage(data.message || "Enregistrement refuse.", "blocked", data);
      } else {
        state.snapshot = data.snapshot;
        state.draft = newDraft();
        state.previewSignature = null;
        setMessage("Session enregistree.", "positive", data);
        window.dispatchEvent(new CustomEvent("runtime-cadence-saved", { detail: data }));
      }
    } catch (error) {
      setMessage(error.message || "Enregistrement impossible.", "blocked");
    } finally {
      state.busy = false;
      render();
    }
  }

  function addEvent() {
    const timeInput = document.getElementById("runtimeNewEventTime");
    const frameInput = document.getElementById("runtimeNewEventFrame");
    const eventKindInput = document.getElementById("runtimeNewEventKind");
    const attackKindInput = document.getElementById("runtimeNewAttackKind");
    const damageInput = document.getElementById("runtimeNewDamageCount");
    const notesInput = document.getElementById("runtimeNewEventNotes");
    const frame = frameInput.value === "" ? null : Number(frameInput.value);
    const explicitTime = timeInput.value === "" ? null : Number(timeInput.value);
    const observedAtSeconds = Number.isFinite(explicitTime)
      ? explicitTime
      : Number.isFinite(frame) && Number(state.draft.captureFps) > 0
        ? frame / Number(state.draft.captureFps)
        : null;
    if (!Number.isFinite(observedAtSeconds) || observedAtSeconds < 0) {
      setMessage("La seconde ou la frame de l'evenement est requise.", "blocked");
      render();
      return;
    }
    const eventKind = eventKindInput.value;
    let attackKind = attackKindInput.value;
    if (["attack-contact", "damage-instance"].includes(eventKind) && attackKind === "none") attackKind = "unknown";
    if (!["attack-start", "attack-contact", "damage-instance"].includes(eventKind)) attackKind = "none";
    state.draft.events.push({
      observedAtSeconds: Math.round(observedAtSeconds * 1_000_000) / 1_000_000,
      sourceFrame: Number.isInteger(frame) ? frame : null,
      eventKind,
      attackKind,
      damageInstanceCount: damageInput.value === "" ? null : Number(damageInput.value),
      notes: notesInput.value.trim(),
    });
    state.draft.events.sort((left, right) => left.observedAtSeconds - right.observedAtSeconds);
    invalidatePreview();
    setMessage("Evenement ajoute.", "neutral");
    render();
  }

  root.addEventListener("input", (event) => {
    const draftField = event.target.dataset.draftField;
    const eventIndex = event.target.dataset.eventIndex;
    const eventField = event.target.dataset.eventField;
    if (draftField) {
      state.draft[draftField] = ["captureFps", "attacksPerSecond"].includes(draftField)
        ? event.target.value === "" ? null : Number(event.target.value)
        : event.target.value;
      invalidatePreview();
    }
    if (eventIndex !== undefined && eventField) {
      state.draft.events[Number(eventIndex)][eventField] = event.target.value;
      invalidatePreview();
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.dataset.draftField === "scenarioId") {
      state.draft.scenarioId = event.target.value;
      state.draft.speedLabel = event.target.value === "attack-speed-scaling" ? "vitesse-1" : "baseline";
      state.draft.attacksPerSecond = null;
      invalidatePreview();
      render();
      return;
    }
    const eventIndex = event.target.dataset.eventIndex;
    const eventField = event.target.dataset.eventField;
    if (eventIndex !== undefined && eventField) {
      const row = state.draft.events[Number(eventIndex)];
      if (["observedAtSeconds", "sourceFrame", "damageInstanceCount"].includes(eventField)) {
        row[eventField] = event.target.value === "" ? null : Number(event.target.value);
      } else {
        row[eventField] = event.target.value;
      }
      if (eventField === "eventKind" && !["attack-start", "attack-contact", "damage-instance"].includes(row.eventKind)) row.attackKind = "none";
      state.draft.events.sort((left, right) => Number(left.observedAtSeconds) - Number(right.observedAtSeconds));
      invalidatePreview();
      render();
    }
  });

  root.addEventListener("click", (event) => {
    const removeIndex = event.target.dataset.removeEvent;
    if (removeIndex !== undefined) {
      state.draft.events.splice(Number(removeIndex), 1);
      invalidatePreview();
      render();
      return;
    }
    if (event.target.id === "runtimeAddEvent") addEvent();
    if (event.target.id === "runtimePreviewSession") previewSession();
    if (event.target.id === "runtimeSaveSession") saveSession();
    if (event.target.id === "runtimeNewSession") {
      state.draft = newDraft();
      state.previewSignature = null;
      setMessage("Nouveau brouillon.", "neutral");
      render();
    }
  });

  async function boot() {
    try {
      await loadSnapshot();
      setMessage("Aucune session reelle enregistree.", "neutral");
    } catch (error) {
      state.snapshot = null;
      setMessage(error.message || "API runtime indisponible.", "blocked");
    }
    render();
  }

  boot();
})();
