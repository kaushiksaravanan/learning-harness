(() => {
  "use strict";

  const Core = window.CPWorkspaceCore;
  if (!Core) throw new Error("CP workspace core did not load.");

  const STORAGE_KEY = "cp-reasoning-workspace-v2";
  const LEGACY_KEY = "cp-reasoning-workspace-v1";
  const DB_NAME = "cp-reasoning-workspace";
  const DB_VERSION = 1;
  const DB_STORE = "workspaces";
  const WORKSPACE_ID = "main";
  const $ = (id) => document.getElementById(id);
  const fieldNodes = [...document.querySelectorAll("[data-field]")];
  const patternList = $("patternList");
  const patternTemplate = $("patternTemplate");
  let workspace = Core.createWorkspace();
  let activeProblemId = workspace.activeProblemId;
  let database = null;
  let storageMode = "browser storage";
  let saveTimer = null;
  const persistence = Core.createSnapshotQueue(storeSnapshot);
  let importControlStates = null;
  let currentReview = null;
  let reviewQueue = [];
  let reviewIndex = 0;
  let reviewSavePending = false;
  let viewMode = "learner";

  function setStatus(message, state = "saved") {
    $("saveStatus").textContent = message;
    $("saveDot").style.background = state === "error" ? "#b56d31" : state === "saving" ? "#c18a36" : "#4d9a7e";
  }

  function openDatabase() {
    if (!window.indexedDB) return Promise.resolve(null);
    return new Promise((resolve) => {
      let request;
      try { request = window.indexedDB.open(DB_NAME, DB_VERSION); }
      catch { resolve(null); return; }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }

  function readDatabase(db) {
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(WORKSPACE_ID);
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error || new Error("Could not read local database."));
      } catch (error) { reject(error); }
    });
  }

  function writeDatabase(db, data) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(DB_STORE, "readwrite");
        transaction.objectStore(DB_STORE).put({ id: WORKSPACE_ID, data });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("Could not write local database."));
        transaction.onabort = () => reject(transaction.error || new Error("Local database write was aborted."));
      } catch (error) { reject(error); }
    });
  }

  async function loadWorkspace() {
    database = await openDatabase();
    if (database) {
      try {
        const stored = await readDatabase(database);
        if (stored) {
          storageMode = "device database";
          return Core.normalizeWorkspace(stored);
        }
      } catch {
        database.close();
        database = null;
      }
    }

    try {
      const current = window.localStorage.getItem(STORAGE_KEY);
      if (current) {
        storageMode = "browser storage";
        return Core.normalizeWorkspace(JSON.parse(current));
      }
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        storageMode = "browser storage";
        return Core.normalizeWorkspace(JSON.parse(legacy));
      }
    } catch {
      storageMode = "temporary session";
    }
    return Core.createWorkspace();
  }

  async function storeSnapshot(snapshot) {
    if (database) {
      try {
        await writeDatabase(database, snapshot);
        storageMode = "device database";
        return;
      } catch {
        database.close();
        database = null;
      }
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      storageMode = "browser storage";
    } catch {
      storageMode = "temporary session";
      throw new Error("Local storage is full or unavailable. Export a JSON backup before continuing.");
    }
  }

  function collectFields() {
    return Object.fromEntries(fieldNodes.map((node) => [node.dataset.field, node.value]));
  }

  function activeProblem() {
    return Core.getProblem(workspace, activeProblemId);
  }

  function loadFields(fields = {}) {
    for (const node of fieldNodes) node.value = fields[node.dataset.field] ?? "";
  }

  function cloneSnapshot(snapshot) {
    return JSON.parse(JSON.stringify(snapshot));
  }

  function persistSnapshot(snapshot, { replace = false, propagate = false } = {}) {
    setStatus("Saving…", "saving");
    const operation = replace ? persistence.replace(snapshot) : persistence.enqueue(snapshot);
    return operation.then(() => {
      setStatus(`Saved on this device · ${storageMode}`);
      refreshHeader();
    }).catch((error) => {
      setStatus(error.message || "Could not save locally", "error");
      if (propagate) throw error;
    });
  }

  function queuePersist() {
    if (persistence.locked()) return persistence.wait();
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!activeProblem()) return Promise.resolve();
    workspace = Core.saveProblem(workspace, activeProblemId, collectFields());
    return persistSnapshot(cloneSnapshot(workspace));
  }

  function scheduleSave() {
    if (persistence.locked()) return;
    clearTimeout(saveTimer);
    setStatus("Saving…", "saving");
    saveTimer = setTimeout(() => { void queuePersist(); }, 280);
  }

  function formatDate(value) {
    if (!value) return "not scheduled";
    const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function formatDateTime(value) {
    if (!value) return "Unknown date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function shortId(value) { return String(value || "").slice(-8); }

  function refreshHeader() {
    const problem = activeProblem();
    $("libraryCount").textContent = String(workspace.problems.length);
    $("dueCount").textContent = String(Core.getDueCards(workspace).length);
    const title = problem?.fields.problemTitle?.trim();
    $("activeProblemTag").textContent = title || `Draft · ${shortId(activeProblemId)}`;
    $("saveStatus").setAttribute("title", `Saved using ${storageMode}. Export a backup for durable storage.`);
    $("modeToggle").title = viewMode === "coach" ? "Return to learner view" : "Open coach view to prepare the analysis before practice";
    if (viewMode === "learner") {
      $("coachGateStatus").textContent = "Coach view can prepare the problem and hint ladder before you start. Switch to learner view for a cold attempt.";
    }
  }

  function setViewMode(mode) {
    viewMode = mode === "coach" ? "coach" : "learner";
    const learner = viewMode === "learner";
    $("learnerPanel").hidden = !learner;
    $("coachPanel").hidden = learner;
    $("sectionNav").hidden = learner;
    $("copyPromptButton").hidden = learner;
    $("exportButton").hidden = learner;
    $("backupButton").hidden = false;
    $("importButton").hidden = false;
    $("modeToggle").textContent = learner ? "Switch to coach view" : "Switch to learner view";
    $("modeToggle").setAttribute("aria-pressed", String(!learner));
    document.body.dataset.view = viewMode;
    renderLearnerPanel();
  }

  function renderAttemptRows(container, attempts, compact = false) {
    container.replaceChildren();
    const rows = [...attempts].reverse().slice(0, compact ? 4 : 8);
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "No attempt records yet.";
      container.append(empty);
      return;
    }
    for (const attempt of rows) {
      const row = document.createElement("article");
      row.className = "attempt-row";
      const heading = document.createElement("strong");
      heading.textContent = `${attempt.result} · ${attempt.mode} · ${formatDateTime(attempt.createdAt)}`;
      const details = document.createElement("p");
      const hintEvidence = attempt.hintExposureSource === "timestamped-events"
        ? attempt.approachUnaided
          ? "no cue events before attempt"
          : `${attempt.hintExposureCount} cue${attempt.hintExposureCount === 1 ? "" : "s"} recorded (highest ${attempt.hintLevel})`
        : `legacy hint report ${attempt.hintLevel ?? "unknown"}`;
      const evidence = [
        attempt.unseen ? attempt.firstAttemptForIdentity === false ? "unseen claim · repeat" : "claimed unseen" : "seen/unknown",
        hintEvidence,
        attempt.justified ? "applicability explained" : "no applicability evidence",
        attempt.proofSound ? "proof sound" : "proof unverified",
        attempt.implementationCorrect ? "implementation correct" : "implementation unverified",
        attempt.distinguishedNearMiss ? "rejected near-miss" : ""
      ].filter(Boolean);
      details.textContent = `${attempt.timeMinutes ? `${attempt.timeMinutes} min · ` : ""}${evidence.join(" · ")} · feedback: ${attempt.validationSource || "Self-assessed"}`;
      row.append(heading, details);
      if (!compact && attempt.notes) {
        const note = document.createElement("p");
        note.textContent = attempt.notes.slice(0, 240);
        row.append(note);
      }
      if (!compact && attempt.nearMissResponse) {
        const nearMiss = document.createElement("p");
        nearMiss.textContent = `Near-miss reasoning: ${attempt.nearMissResponse.slice(0, 240)}`;
        row.append(nearMiss);
      }
      if (!compact && attempt.validationEvidence) {
        const evidenceNote = document.createElement("p");
        evidenceNote.textContent = `Feedback reference: ${attempt.validationEvidence.slice(0, 240)}`;
        row.append(evidenceNote);
      }
      if (!compact && attempt.diagnosisCandidates?.length) {
        const diagnoses = document.createElement("p");
        diagnoses.textContent = `Possible issue signals (low-confidence text match): ${attempt.diagnosisCandidates.map((item) => item.label).join(" · ")}`;
        row.append(diagnoses);
      }
      if (!compact && attempt.recoveryCandidates?.length) {
        const recoveries = document.createElement("p");
        recoveries.textContent = `Possible recovery signals (coach review): ${attempt.recoveryCandidates.map((item) => item.recoveryLabel).join(" · ")}`;
        row.append(recoveries);
      }
      container.append(row);
    }
  }

  function renderTransferSummary() {
    const patternId = $("attemptPattern").value || undefined;
    const metrics = Core.transferMetrics(workspace, patternId);
    const denominator = metrics.eligible;
    $("transferSummary").textContent = denominator
      ? `${denominator} unique first-seen unseen problem${denominator === 1 ? "" : "s"}: event-derived unaided recognition ${metrics.unpromptedRecognition}/${denominator} · applicability explained ${metrics.applicabilityJustified}/${denominator} · self-rated proof sound ${metrics.proofSound}/${denominator} · implementation marked correct ${metrics.implementationCorrect}/${denominator} · solved ${metrics.solved}/${denominator} · judge accepted ${metrics.judgeAccepted}/${denominator} · coach-reviewed proof ${metrics.coachReviewed}/${denominator} · near-miss distinction ${metrics.distinguishedNearMiss}/${denominator}. ${metrics.repeatedProblemAttempts} repeated attempt(s) excluded; ${metrics.unknownProblemIdentityClaims} unseen claim(s) need a problem ID or URL.`
      : `No uniquely identified first-seen transfer attempts yet. Mark a problem unseen and provide its platform/problem ID or URL. ${metrics.unseenClaims} unseen claim(s), ${metrics.unknownProblemIdentityClaims} without an identity, and ${metrics.repeatedProblemAttempts} repeated attempt(s) excluded.`;
  }

  function renderAttempts() {
    const attempts = activeProblem()?.attempts || [];
    renderAttemptRows($("attemptHistory"), attempts);
    renderAttemptRows($("learnerAttemptSummary"), attempts, true);
    renderTransferSummary();
  }

  function optionsFor(select, items, placeholder, selectedValue = "") {
    const current = selectedValue || select.value;
    select.replaceChildren();
    if (placeholder) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = placeholder;
      select.append(option);
    }
    for (const item of items) {
      const option = document.createElement("option");
      option.value = item.value ?? item.id;
      option.textContent = item.label ?? item.value ?? item.id;
      select.append(option);
    }
    if ([...select.options].some((option) => option.value === current)) select.value = current;
    else if (placeholder) select.value = "";
  }

  function renderGraph() {
    const nodes = workspace.graph.nodes;
    const edges = workspace.graph.edges;
    const typeItems = Core.NODE_TYPES.map((type) => ({ value: type, label: type }));
    optionsFor($("graphNodeType"), typeItems, "Choose type", $("graphNodeType").value || "concept");
    if (!$("graphNodeType").value) $("graphNodeType").value = "concept";
    const nodeItems = nodes.map((node) => ({ value: node.id, label: `${node.type} · ${node.label}` }));
    const previousFrom = $("graphEdgeFrom").value;
    const previousTo = $("graphEdgeTo").value;
    optionsFor($("graphEdgeFrom"), nodeItems, "Select source", previousFrom);
    optionsFor($("graphEdgeTo"), nodeItems, "Select destination", previousTo);
    const relationItems = Core.EDGE_TYPES.map((relation) => ({ value: relation, label: relation }));
    optionsFor($("graphEdgeRelation"), relationItems, "Choose relationship", $("graphEdgeRelation").value || "supports");
    if (!$("graphEdgeRelation").value) $("graphEdgeRelation").value = "supports";

    const nodeList = $("graphNodeList");
    nodeList.replaceChildren();
    if (!nodes.length) {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "No graph nodes yet. Add concepts, mistakes, recovery moves, checks, and patterns as you analyze this problem.";
      nodeList.append(empty);
    } else {
      for (const node of nodes) {
        const row = document.createElement("div");
        row.className = "graph-row";
        const type = document.createElement("span");
        type.className = "tag tag-neutral";
        type.textContent = node.type;
        const label = document.createElement("strong");
        label.textContent = node.label;
        const linkedTitles = (node.problemIds || []).map((id) => Core.getProblem(workspace, id)?.fields.problemTitle || `Problem ${shortId(id)}`);
        const count = document.createElement("small");
        count.textContent = `${new Set(node.problemIds || []).size} problem${new Set(node.problemIds || []).size === 1 ? "" : "s"}${linkedTitles.length ? ` · ${linkedTitles.join(", ")}` : ""}`;
        row.append(type, label, count);
        nodeList.append(row);
      }
    }

    const edgeList = $("graphEdgeList");
    edgeList.replaceChildren();
    if (!edges.length) {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "No relationships yet.";
      edgeList.append(empty);
    } else {
      for (const edge of edges) {
        const from = nodes.find((node) => node.id === edge.from);
        const to = nodes.find((node) => node.id === edge.to);
        if (!from || !to) continue;
        const row = document.createElement("div");
        row.className = "graph-edge-row";
        row.textContent = `${from.label} — ${edge.relation} → ${to.label}${edge.evidence ? ` · ${edge.evidence}` : ""}`;
        edgeList.append(row);
      }
    }

    const recurring = Core.getRecurringMistakes(workspace);
    const insight = $("graphInsights");
    insight.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = "Recurring mistakes across problems";
    insight.append(title);
    const summary = document.createElement("p");
    summary.textContent = recurring.length
      ? recurring.map((node) => `${node.label} (${node.problems.length} linked problems)`).join(" · ")
      : "No mistake node is linked to multiple problems yet. Reuse the same node label when the same misconception appears again.";
    insight.append(summary);

    const diagnosisTitle = document.createElement("strong");
    diagnosisTitle.className = "diagnosis-title";
    diagnosisTitle.textContent = "Possible recurring issues from attempt language";
    insight.append(diagnosisTitle);
    const diagnoses = Core.getRecurringDiagnoses(workspace);
    if (!diagnoses.length) {
      const emptyDiagnosis = document.createElement("p");
      emptyDiagnosis.textContent = "No repeated text signals yet. Suggestions require the same signal in attempts on two identified problems.";
      insight.append(emptyDiagnosis);
    }
    for (const diagnosis of diagnoses) {
      const row = document.createElement("div");
      row.className = "diagnosis-suggestion";
      const label = document.createElement("strong");
      label.textContent = `${diagnosis.label} · low confidence`;
      const sources = document.createElement("p");
      sources.textContent = diagnosis.problemIds.map((problemId) => {
        const problem = Core.getProblem(workspace, problemId);
        return problem?.fields.problemTitle || `Problem ${shortId(problemId)}`;
      }).join(" · ");
      const quote = document.createElement("p");
      quote.textContent = diagnosis.evidence.slice(-2).map((item) => `“${item.excerpt}”`).join(" · ");
      const confirm = document.createElement("button");
      confirm.className = "button button-small";
      confirm.type = "button";
      confirm.textContent = "Confirm & link as mistake";
      confirm.addEventListener("click", () => {
        try {
          let nextWorkspace = workspace;
          for (const problemId of diagnosis.problemIds) {
            const evidence = diagnosis.evidence.filter((item) => item.problemId === problemId).map((item) => item.excerpt).join(" | ");
            nextWorkspace = Core.addGraphNode(nextWorkspace, {
              type: "mistake",
              label: diagnosis.label,
              description: `Low-confidence phrase match. Review learner evidence before treating this as established. ${evidence}`,
              provenance: "derived",
              confidence: "low",
              problemId
            }).workspace;
          }
          workspace = nextWorkspace;
          void persistWithoutFieldUpdate();
          renderGraph();
        } catch (error) {
          const status = document.createElement("p");
          status.textContent = error.message;
          row.append(status);
        }
      });
      row.append(label, sources, quote, confirm);
      insight.append(row);
    }

    const recoveryTitle = document.createElement("strong");
    recoveryTitle.className = "diagnosis-title";
    recoveryTitle.textContent = "Possible later recovery signals";
    insight.append(recoveryTitle);
    const recoveries = Core.getRecoveryCandidates(workspace);
    if (!recoveries.length) {
      const emptyRecovery = document.createElement("p");
      emptyRecovery.textContent = "No explicit recovery statements linked to an earlier mistake yet. These phrases are also low-confidence and need coach review.";
      insight.append(emptyRecovery);
    }
    for (const recovery of recoveries) {
      const row = document.createElement("div");
      row.className = "diagnosis-suggestion";
      const label = document.createElement("strong");
      label.textContent = `${recovery.recoveryLabel} · possible recovery`;
      const sources = document.createElement("p");
      sources.textContent = `Current attempt: ${recovery.problemTitle} · prior signal: ${recovery.recoveredFromProblemIds.map((id) => Core.getProblem(workspace, id)?.fields.problemTitle || `Problem ${shortId(id)}`).join(", ")}`;
      const quote = document.createElement("p");
      quote.textContent = `“${recovery.evidence}”`;
      const confirm = document.createElement("button");
      confirm.className = "button button-small";
      confirm.type = "button";
      confirm.textContent = "Confirm recovery link";
      const mistakeLabel = recovery.label;
      const alreadyLinked = workspace.graph.edges.some((edge) => {
        if (edge.relation !== "recovers from") return false;
        const from = workspace.graph.nodes.find((node) => node.id === edge.from);
        const to = workspace.graph.nodes.find((node) => node.id === edge.to);
        return from?.type === "recovery" && from.label === recovery.recoveryLabel && to?.type === "mistake" && to.label === mistakeLabel;
      });
      if (alreadyLinked) {
        confirm.disabled = true;
        confirm.textContent = "Recovery link confirmed";
      }
      confirm.addEventListener("click", () => {
        try {
          let nextWorkspace = workspace;
          for (const problemId of recovery.recoveredFromProblemIds) {
            nextWorkspace = Core.addGraphNode(nextWorkspace, {
              type: "mistake",
              label: mistakeLabel,
              description: `Earlier low-confidence mistake signal. ${recovery.recoveredFromAttemptIds.join(", ")}`,
              provenance: "derived",
              confidence: "low",
              problemId
            }).workspace;
          }
          const mistake = nextWorkspace.graph.nodes.find((node) => node.type === "mistake" && node.label === mistakeLabel);
          const addedRecovery = Core.addGraphNode(nextWorkspace, {
            type: "recovery",
            label: recovery.recoveryLabel,
            description: `Possible recovery, confirmed by coach from attempt ${recovery.attemptId}: ${recovery.evidence}`,
            provenance: "derived",
            confidence: "low",
            problemId: recovery.problemId
          });
          nextWorkspace = Core.addGraphEdge(addedRecovery.workspace, {
            from: addedRecovery.node.id,
            to: mistake.id,
            relation: "recovers from",
            evidence: `Attempt ${recovery.attemptId}: ${recovery.evidence}`,
            problemId: recovery.problemId
          }).workspace;
          workspace = nextWorkspace;
          void persistWithoutFieldUpdate();
          renderGraph();
        } catch (error) {
          const status = document.createElement("p");
          status.textContent = error.message;
          row.append(status);
        }
      });
      row.append(label, sources, quote, confirm);
      insight.append(row);
    }
  }

  function readPatternEntry(entry) {
    const value = (name) => entry.querySelector(`[data-card-field="${name}"]`).value;
    return { name: value("name"), trigger: value("trigger"), recovery: value("recovery") };
  }

  function updatePatternMeta(entry, card) {
    const schedule = card.schedule;
    const count = workspace.reviewEvents.filter((event) => event.cardId === card.id).length;
    const sharedPattern = workspace.graph.nodes.find((node) => node.id === card.patternNodeId);
    const queued = card.readyForReview && !card.archived;
    entry.querySelector("[data-review-mode]").textContent = card.archived ? "Archived" : queued ? "Queued" : "Not queued";
    entry.querySelector("[data-schedule-meta]").textContent = card.archived
      ? `Archived · ${count} recorded review${count === 1 ? "" : "s"}`
      : `${schedule.lastReviewedAt ? `Next ${formatDate(schedule.nextReview)}` : queued ? `Due ${formatDate(schedule.nextReview)}` : "Not scheduled"} · ${count} recorded review${count === 1 ? "" : "s"} · EF ${Number(schedule.easeFactor).toFixed(2)}${sharedPattern ? ` · Shared pattern: ${sharedPattern.label}` : ""}`;
  }

  function renderPatterns() {
    patternList.replaceChildren();
    const cards = activeProblem()?.cards || [];
    const visible = cards.filter((card) => !card.archived);
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "No pattern cards yet. Add a reusable retrieval cue after the analysis is grounded in a problem.";
      patternList.append(empty);
      return;
    }
    for (const card of visible) {
      const fragment = patternTemplate.content.cloneNode(true);
      const entry = fragment.querySelector("[data-pattern-entry]");
      entry.dataset.cardId = card.id;
      const index = patternList.children.length + 1;
      for (const name of ["name", "trigger", "recovery"]) {
        const label = entry.querySelector(`[data-label="${name}"]`);
        const field = entry.querySelector(`[data-card-field="${name}"]`);
        label.htmlFor = `pattern-${name}-${index}`;
        field.id = label.htmlFor;
        field.value = card[name] || "";
      }
      const archive = entry.querySelector("[data-remove-card]");
      archive.setAttribute("aria-label", "Archive pattern card");
      archive.title = "Archive this card without deleting its review history";
      archive.addEventListener("click", async () => {
        if (!window.confirm("Archive this card? Its review history will be kept.")) return;
        workspace = Core.archiveCard(workspace, card.id);
        await persistWithoutFieldUpdate();
        renderPatterns();
        refreshHeader();
      });
      entry.querySelector("[data-queue-card]").addEventListener("click", async () => {
        const values = readPatternEntry(entry);
        if (!values.name.trim() || !values.trigger.trim() || !values.recovery.trim()) {
          entry.querySelector("[data-schedule-meta]").textContent = "Add the name, trigger, and recovery before queuing.";
          return;
        }
        let patternNode = workspace.graph.nodes.find((node) => node.type === "pattern" && node.label.toLocaleLowerCase() === values.name.trim().toLocaleLowerCase());
        if (!patternNode) {
          const added = Core.addGraphNode(workspace, {
            type: "pattern",
            label: values.name,
            description: values.recovery,
            provenance: "reconstructed",
            confidence: "medium",
            problemId: card.problemId
          });
          workspace = added.workspace;
          patternNode = added.node;
        }
        workspace = Core.updateCard(workspace, card.id, { ...values, patternNodeId: patternNode.id, readyForReview: true, schedule: { nextReview: Core.dateKey(new Date()) } });
        await persistWithoutFieldUpdate();
        refreshGraphControls();
        $("attemptPattern").value = patternNode.id;
        renderGraph();
        renderPatterns();
        refreshHeader();
      });
      entry.addEventListener("input", async () => {
        const updates = readPatternEntry(entry);
        if (updates.name.trim().toLocaleLowerCase() !== card.name.trim().toLocaleLowerCase()) updates.patternNodeId = null;
        workspace = Core.updateCard(workspace, card.id, updates);
        scheduleSave();
      });
      updatePatternMeta(entry, card);
      patternList.append(fragment);
    }
  }

  function renderLibrary() {
    const query = $("librarySearch").value.trim().toLocaleLowerCase();
    const list = $("libraryList");
    list.replaceChildren();
    const problems = [...workspace.problems]
      .filter((problem) => {
        const search = [problem.fields.problemTitle, problem.fields.platform, problem.fields.problemId, problem.fields.topicTags].join(" ").toLocaleLowerCase();
        return !query || search.includes(query);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!problems.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No matching problems. Create a new problem to start another record.";
      list.append(empty);
      return;
    }
    for (const problem of problems) {
      const row = document.createElement("article");
      row.className = "library-row";
      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = problem.fields.problemTitle || `Untitled draft · ${shortId(problem.id)}`;
      const meta = document.createElement("p");
      const source = [problem.fields.platform, problem.fields.problemId, problem.fields.difficulty ? `rating ${problem.fields.difficulty}` : ""].filter(Boolean).join(" · ");
      meta.textContent = `${source || `ID ${shortId(problem.id)}`} · ${problem.attempts.length} attempt${problem.attempts.length === 1 ? "" : "s"} · ${problem.cards.filter((card) => !card.archived).length} active card${problem.cards.filter((card) => !card.archived).length === 1 ? "" : "s"} · updated ${formatDateTime(problem.updatedAt)}`;
      details.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "library-row-actions";
      if (problem.id === activeProblemId) {
        const active = document.createElement("span");
        active.className = "tag";
        active.textContent = "Current";
        actions.append(active);
      }
      const open = document.createElement("button");
      open.className = "button button-small";
      open.type = "button";
      open.textContent = "Open";
      open.addEventListener("click", () => { void selectProblem(problem.id); });
      actions.append(open);
      row.append(details, actions);
      list.append(row);
    }
  }

  function renderLearnerPanel() {
    const problem = activeProblem();
    if (!problem) return;
    const hints = (problem.fields.hintLadder || "").split(/\r?\n/).map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
    const events = problem.hintEvents || [];
    const lastHint = events.at(-1);
    $("visibleHint").hidden = !lastHint;
    if (lastHint) $("visibleHint").textContent = `Cue ${lastHint.hintLevel}\n${lastHint.hint}`;
    $("hintProgress").textContent = events.length
      ? `${events.length} cue${events.length === 1 ? "" : "s"} used · ${Math.max(0, hints.length - events.length)} remaining`
      : hints.length ? `${hints.length} prepared cue${hints.length === 1 ? "" : "s"} available` : "No prepared cues yet";
    $("requestHintButton").textContent = events.length ? "Record next move & show one cue" : "Show one cue";
    $("requestHintButton").disabled = hints.length === 0 || events.length >= hints.length;
    $("requestHintButton").title = hints.length ? "Release only the next prepared cue" : "Switch to coach view and prepare a hint ladder first";
    const hasNearMiss = Boolean(problem.fields.nearMissProblem.trim());
    $("nearMissPractice").hidden = !hasNearMiss || problem.attempts.length === 0;
    $("nearMissStatement").textContent = problem.fields.nearMissProblem;
    $("nearMissQuestion").textContent = problem.fields.nearMissQuestion || "Why does the familiar pattern fail here? Which required property should you test?";
    const latestNearMiss = [...problem.attempts].reverse().find((attempt) => attempt.nearMissResponse?.trim());
    const expected = problem.fields.nearMissReason.trim();
    $("nearMissFeedback").hidden = !latestNearMiss || !expected;
    $("nearMissFeedback").textContent = latestNearMiss && expected
      ? `Your recorded distinction: ${latestNearMiss.nearMissResponse}\n\nExpected distinction: ${expected}`
      : "";
    renderAttempts();
  }

  function renderEverything() {
    const problem = activeProblem();
    if (!problem) return;
    loadFields(problem.fields);
    $("attemptMode").value = "Untimed";
    $("attemptResult").value = "Unsolved";
    $("attemptMinutes").value = "";
    $("attemptPattern").value = "";
    $("validationSource").value = "Self-assessed";
    $("validationEvidence").value = "";
    for (const id of ["attemptUnseen", "approachJustified", "proofSound", "implementationCorrect", "distinguishedNearMiss"]) $(id).checked = false;
    $("nextMove").value = "";
    renderPatterns();
    refreshGraphControls();
    renderGraph();
    $("nearMissResponse").value = "";
    renderAttempts();
    renderHintExposureStatus();
    renderLearnerPanel();
    refreshHeader();
  }

  async function persistWithoutFieldUpdate() {
    if (persistence.locked()) return persistence.wait();
    return persistSnapshot(cloneSnapshot(workspace));
  }

  function setImportLock(locked) {
    if (locked) {
      if (importControlStates) return;
      importControlStates = [...document.querySelectorAll("button, input, select, textarea")]
        .map((control) => ({ control, disabled: control.disabled }));
      for (const { control } of importControlStates) control.disabled = true;
      return;
    }
    if (!importControlStates) return;
    for (const { control, disabled } of importControlStates) control.disabled = disabled;
    importControlStates = null;
  }

  async function selectProblem(problemId) {
    await queuePersist();
    workspace = Core.setActiveProblem(workspace, problemId);
    activeProblemId = problemId;
    viewMode = "learner";
    await persistWithoutFieldUpdate();
    renderEverything();
    setViewMode("learner");
    $("libraryDialog").close();
  }

  async function createNewProblem() {
    await queuePersist();
    const created = Core.addProblem(workspace);
    workspace = created.workspace;
    activeProblemId = created.problem.id;
    viewMode = "learner";
    await persistWithoutFieldUpdate();
    renderEverything();
    setViewMode("learner");
    if ($("libraryDialog").open) renderLibrary();
  }

  function renderAttemptHistoryAndSave() {
    const problem = activeProblem();
    if (!problem) return;
    renderAttemptRows($("attemptHistory"), problem.attempts);
    renderAttemptRows($("learnerAttemptSummary"), problem.attempts, true);
    renderTransferSummary();
  }

  function renderHintExposureStatus() {
    const problem = activeProblem();
    if (!problem) return;
    const assigned = new Set(problem.attempts.flatMap((attempt) => attempt.hintEventIds || []));
    const pending = problem.hintEvents.filter((event) => !assigned.has(event.id));
    const highest = pending.reduce((level, event) => Math.max(level, Number(event.hintLevel || 0)), 0);
    $("hintExposureStatus").textContent = pending.length
      ? `${pending.length} timestamped cue event${pending.length === 1 ? "" : "s"} will attach to the next saved attempt (highest cue ${highest}).`
      : "No cue events since the previous attempt. Unaided recognition is derived from this event history.";
  }

  async function recordAttempt() {
    await queuePersist();
    const problem = activeProblem();
    if (!problem.fields.attemptNotes.trim()) {
      $("attemptLogStatus").textContent = "Write at least one concrete step or hypothesis before saving an attempt.";
      $("attemptNotes").focus();
      return;
    }
    if ($("distinguishedNearMiss").checked && !$("nearMissResponse").value.trim()) {
      $("attemptLogStatus").textContent = "Record your near-miss reasoning before marking the distinction.";
      $("nearMissResponse").focus();
      return;
    }
    const result = Core.recordAttempt(workspace, problem.id, {
      mode: $("attemptMode").value,
      result: $("attemptResult").value,
      timeMinutes: $("attemptMinutes").value,
      patternId: $("attemptPattern").value,
      unseen: $("attemptUnseen").checked,
      justified: $("approachJustified").checked,
      proofSound: $("proofSound").checked,
      implementationCorrect: $("implementationCorrect").checked,
      distinguishedNearMiss: $("distinguishedNearMiss").checked,
      nearMissResponse: $("nearMissResponse").value,
      validationSource: $("validationSource").value,
      validationEvidence: $("validationEvidence").value,
      notes: problem.fields.attemptNotes
    });
    workspace = result.workspace;
    await persistWithoutFieldUpdate();
    $("attemptLogStatus").textContent = `Attempt saved · ${formatDateTime(result.event.createdAt)}`;
    $("attemptMinutes").value = "";
    $("attemptPattern").value = "";
    $("nearMissResponse").value = "";
    $("validationSource").value = "Self-assessed";
    $("validationEvidence").value = "";
    for (const id of ["attemptUnseen", "approachJustified", "proofSound", "implementationCorrect", "distinguishedNearMiss"]) $(id).checked = false;
    $("attemptResult").value = "Unsolved";
    renderAttemptHistoryAndSave();
    renderHintExposureStatus();
    renderLearnerPanel();
    renderGraph();
    refreshHeader();
  }

  function setFieldOptions(select, values, placeholder) {
    const previous = select.value;
    select.replaceChildren();
    if (placeholder) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = placeholder;
      select.append(option);
    }
    for (const item of values) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.append(option);
    }
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  }

  function refreshGraphControls() {
    const patterns = workspace.graph.nodes.filter((node) => node.type === "pattern");
    setFieldOptions($("attemptPattern"), patterns.map((node) => ({ value: node.id, label: node.label })), "No pattern selected");
  }

  function addGraphNodeFromForm() {
    try {
      const result = Core.addGraphNode(workspace, {
        type: $("graphNodeType").value,
        label: $("graphNodeLabel").value,
        description: $("graphNodeDescription").value,
        provenance: $("graphNodeProvenance").value,
        confidence: $("graphNodeConfidence").value,
        problemId: activeProblemId
      });
      workspace = result.workspace;
      $("graphNodeLabel").value = "";
      $("graphNodeDescription").value = "";
      $("graphStatus").textContent = result.merged ? "Linked this problem to an existing node." : "Added node to the shared graph.";
      void persistWithoutFieldUpdate();
      refreshGraphControls();
      renderGraph();
      renderTransferSummary();
    } catch (error) {
      $("graphStatus").textContent = error.message;
    }
  }

  function addGraphEdgeFromForm() {
    try {
      const result = Core.addGraphEdge(workspace, {
        from: $("graphEdgeFrom").value,
        to: $("graphEdgeTo").value,
        relation: $("graphEdgeRelation").value,
        evidence: $("graphEdgeEvidence").value,
        problemId: activeProblemId
      });
      workspace = result.workspace;
      $("graphEdgeEvidence").value = "";
      $("graphStatus").textContent = result.merged ? "Linked the relationship to this problem." : "Added relationship to the shared graph.";
      void persistWithoutFieldUpdate();
      renderGraph();
    } catch (error) {
      $("graphStatus").textContent = error.message;
    }
  }

  async function addPatternCard() {
    const result = Core.addCard(workspace, activeProblemId);
    workspace = result.workspace;
    await persistWithoutFieldUpdate();
    renderPatterns();
    const input = patternList.querySelector(`[data-card-id="${result.card.id}"] [data-card-field="name"]`);
    input?.focus();
  }

  function openDialog(id) {
    const dialog = $(id);
    if (dialog && !dialog.open) dialog.showModal();
  }

  function openLibrary() {
    renderLibrary();
    openDialog("libraryDialog");
  }

  function renderReviewCard() {
    const card = reviewQueue[reviewIndex];
    const empty = !card;
    $("reviewCard").hidden = empty;
    $("reviewEmpty").hidden = !empty;
    if (empty) {
      $("reviewProgress").textContent = reviewQueue.length ? `Completed ${reviewQueue.length} due review${reviewQueue.length === 1 ? "" : "s"}.` : "No cards are due today.";
      $("reviewEmpty").textContent = reviewQueue.length ? "All due cards are reviewed. New ratings were saved as separate review events." : "No cards are due. Queue a card from coach view or come back on its review date.";
      return;
    }
    const problemLabel = [card.problem.title, card.problem.problemId].filter(Boolean).join(" · ");
    $("reviewProblemName").textContent = `${problemLabel || `Problem ${shortId(card.problemId)}`} · ${reviewIndex + 1} of ${reviewQueue.length}`;
    $("reviewFront").textContent = card.trigger || "Recall the cue or reasoning move from this problem.";
    $("reviewRecall").value = "";
    $("reviewBack").textContent = "";
    $("reviewBack").hidden = true;
    $("reviewRatingControls").hidden = true;
    $("reviewQuality").value = "";
    $("revealRecoveryButton").disabled = false;
    $("saveReviewButton").disabled = true;
    $("reviewProgress").textContent = `Due ${formatDate(card.schedule.nextReview)} · ${reviewQueue.length} card${reviewQueue.length === 1 ? "" : "s"} in this session.`;
    currentReview = { cardId: card.id, problemId: card.problemId, eventId: Core.makeId("review"), attempted: false, revealed: false, completed: false };
  }

  function startReviewSession() {
    reviewQueue = Core.getDueCards(workspace);
    reviewIndex = 0;
    currentReview = null;
    renderReviewCard();
    openDialog("reviewDialog");
  }

  function revealReviewRecovery() {
    if (!currentReview || currentReview.completed) return;
    const recallAttempt = $("reviewRecall").value.trim();
    if (!recallAttempt) {
      $("reviewProgress").textContent = "Write what you recall—or explicitly write ‘I do not remember’—before revealing the recovery.";
      $("reviewRecall").focus();
      return;
    }
    const card = Core.getAllCards(workspace).find((item) => item.id === currentReview.cardId);
    if (!card) return;
    currentReview.attempted = true;
    currentReview.revealed = true;
    $("reviewBack").textContent = `${card.name}\n\n${card.recovery}`;
    $("reviewBack").hidden = false;
    $("reviewRatingControls").hidden = false;
    $("revealRecoveryButton").disabled = true;
    $("saveReviewButton").disabled = false;
    $("reviewQuality").focus();
  }

  async function saveReview() {
    if (!currentReview || currentReview.completed || reviewSavePending) return;
    const quality = $("reviewQuality").value;
    if (quality === "") {
      $("reviewProgress").textContent = "Choose a recall rating before saving.";
      $("reviewQuality").focus();
      return;
    }
    reviewSavePending = true;
    $("saveReviewButton").disabled = true;
    try {
      const result = Core.applyReview(workspace, {
        ...currentReview,
        quality: Number(quality),
        recallAttempt: $("reviewRecall").value,
        mode: $("reviewMode").value
      });
      if (!result.duplicate) workspace = result.workspace;
      currentReview.completed = true;
      await persistWithoutFieldUpdate();
      reviewIndex += 1;
      currentReview = null;
      renderReviewCard();
      renderPatterns();
      refreshHeader();
    } catch (error) {
      $("reviewProgress").textContent = error.message;
      $("saveReviewButton").disabled = false;
    } finally {
      reviewSavePending = false;
    }
  }

  async function requestNextHint() {
    await queuePersist();
    const problem = activeProblem();
    const hints = (problem.fields.hintLadder || "").split(/\r?\n/).map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
    const index = problem.hintEvents.length;
    if (!hints.length || index >= hints.length) {
      $("hintProgress").textContent = "No more prepared cues. Return to the problem or review the analysis with the coach.";
      return;
    }
    const response = index === 0 ? problem.fields.attemptNotes.trim() : $("nextMove").value.trim();
    if (!response) {
      $("hintProgress").textContent = index === 0
        ? "Write what you tried in the left pane before asking for the first cue."
        : "Record what you tried after the last cue before requesting another.";
      (index === 0 ? $("attemptNotes") : $("nextMove")).focus();
      return;
    }
    const result = Core.recordHint(workspace, activeProblemId, { level: index + 1, text: hints[index] }, response);
    workspace = result.workspace;
    $("nextMove").value = "";
    await persistWithoutFieldUpdate();
    renderLearnerPanel();
    renderHintExposureStatus();
  }

  function makeMarkdown() {
    const problem = activeProblem();
    const fields = problem.fields;
    const linkedNodes = workspace.graph.nodes.filter((node) => (node.problemIds || []).includes(problem.id));
    const linkedEdges = workspace.graph.edges.filter((edge) => (edge.problemIds || []).includes(problem.id));
    const recoveryRecords = problem.attempts.flatMap((attempt) => (attempt.recoveryCandidates || []).map((candidate) => ({ attempt, candidate })));
    const lines = [
      `# ${fields.problemTitle || "Untitled problem"}`,
      [fields.platform, fields.problemId, fields.difficulty ? `rating ${fields.difficulty}` : "", fields.topicTags].filter(Boolean).join(" · "),
      fields.problemUrl ? `Source: ${fields.problemUrl}` : "",
      `Workspace record: ${problem.id}`,
      "## Problem statement", fields.problemText || "",
      "## Learner attempt", fields.attemptNotes || "",
      "## Problem model",
      `**Goal:** ${fields.goal || "—"}`,
      `**Constraints:** ${fields.constraints || "—"}`,
      `**Baseline:** ${fields.baseline || "—"}`,
      "## Concepts and dependencies", fields.conceptGraph || "",
      "## Solver routes", fields.solverRoutes || "",
      "## Failure and recovery map", fields.failureMap || "",
      "## Why this construction", fields.constructionReason || "",
      "## Second-nature checks", fields.expertChecks || "",
      "## Counterfactual / near-miss",
      `**Similar case:** ${fields.nearMissProblem || "Not prepared"}`,
      `**Learner question:** ${fields.nearMissQuestion || "Not prepared"}`,
      `**Expected distinction:** ${fields.nearMissReason || "Not prepared"}`,
      "## Prepared hint ladder", fields.hintLadder || "",
      "## Typed graph nodes",
      ...(linkedNodes.length ? linkedNodes.map((node) => `- **${node.type}: ${node.label}** — ${node.description || ""} _(provenance: ${node.provenance}; confidence: ${node.confidence})_`) : ["No typed nodes." ]),
      "## Typed graph edges",
      ...(linkedEdges.length ? linkedEdges.map((edge) => {
        const from = workspace.graph.nodes.find((node) => node.id === edge.from)?.label || edge.from;
        const to = workspace.graph.nodes.find((node) => node.id === edge.to)?.label || edge.to;
        return `- ${from} — **${edge.relation}** → ${to}${edge.evidence ? `: ${edge.evidence}` : ""}`;
      }) : ["No typed edges." ]),
      "## Pattern cards",
      ...(problem.cards.filter((card) => !card.archived).length ? problem.cards.filter((card) => !card.archived).flatMap((card) => [
        `### ${card.name || "Untitled pattern"}`,
        `**Front / trigger:** ${card.trigger || "—"}`,
        `**Back / recovery:** ${card.recovery || "—"}`,
        `**Shared graph node:** ${card.patternNodeId || "not linked"}`,
        `**Review schedule:** repetitions ${card.schedule.repetitions}, interval ${card.schedule.intervalDays} days, ease ${Number(card.schedule.easeFactor).toFixed(2)}, next ${card.schedule.nextReview || "not scheduled"}`
      ]) : ["No cards yet."]),
      "## Attempts",
      ...(problem.attempts.length ? problem.attempts.map((attempt) => `- ${formatDateTime(attempt.createdAt)} · ${attempt.mode} · ${attempt.result} · ${attempt.timeMinutes || "?"} min · ${attempt.hintExposureCount ?? "legacy"} timestamped cue events (highest ${attempt.hintLevel ?? "unknown"}) · approach unaided ${attempt.hintExposureSource === "timestamped-events" ? attempt.approachUnaided : "unknown (legacy report)"} · applicability ${attempt.justified} · proof ${attempt.proofSound} · implementation ${attempt.implementationCorrect} · unseen ${attempt.unseen} · near-miss distinction ${attempt.distinguishedNearMiss} · feedback basis ${attempt.validationSource || "Self-assessed"}${attempt.diagnosisCandidates?.length ? ` · low-confidence diagnosis candidates: ${attempt.diagnosisCandidates.map((candidate) => candidate.label).join(", ")}` : ""}${attempt.validationEvidence ? ` · feedback evidence: ${attempt.validationEvidence}` : ""}${attempt.nearMissResponse ? ` · near-miss response: ${attempt.nearMissResponse}` : ""}`) : ["No attempts logged." ]),
      "## Hint events",
      ...(problem.hintEvents.length ? problem.hintEvents.map((event) => `- Cue ${event.hintLevel} on ${formatDateTime(event.createdAt)}: ${event.learnerResponse}`) : ["No hints shown." ]),
      "## Possible recovery signals",
      ...(recoveryRecords.length ? recoveryRecords.map(({ attempt, candidate }) => "- " + formatDateTime(attempt.createdAt) + " · " + candidate.recoveryLabel + " · low confidence; from earlier attempt(s): " + candidate.recoveredFromAttemptIds.join(", ") + " · evidence: " + candidate.evidence) : ["No explicit recovery signals recorded." ]),
      "## Review events",
      ...(workspace.reviewEvents.filter((event) => event.problemId === problem.id).length
        ? workspace.reviewEvents.filter((event) => event.problemId === problem.id).map((event) => `- ${formatDateTime(event.reviewedAt)} · quality ${event.quality} · ${event.mode} · recall: ${event.recallAttempt}`)
        : ["No review events." ]),
      "",
      `---\nExported from CP Reasoning Workspace on ${new Date().toLocaleDateString()}.`
    ];
    return lines.join("\n\n");
  }

  function slug(value) {
    return String(value || "cp-problem").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "cp-problem";
  }

  function download(filename, contents, type) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    void queuePersist().then(() => {
      download(`cp-learning-library-${Core.dateKey(new Date())}.json`, JSON.stringify(workspace, null, 2), "application/json;charset=utf-8");
    });
  }

  async function importBackup(file) {
    let controlsLocked = false;
    try {
      const raw = JSON.parse(await file.text());
      if (![1, 2, 3].includes(raw?.version)) throw new Error("This file is not a supported CP workspace backup.");
      if (!window.confirm("Replace this browser's current problem library with the selected backup? Export the current library first if you may need it.")) return;
      const restored = Core.normalizeWorkspace(raw);
      clearTimeout(saveTimer);
      saveTimer = null;
      setImportLock(true);
      controlsLocked = true;
      await persistSnapshot(cloneSnapshot(restored), { replace: true, propagate: true });
      workspace = restored;
      activeProblemId = restored.activeProblemId;
      viewMode = "learner";
      setImportLock(false);
      controlsLocked = false;
      renderEverything();
      setViewMode("learner");
      $("libraryStatus").textContent = "Backup restored.";
      renderLibrary();
    } catch (error) {
      $("libraryStatus").textContent = `Import failed: ${error.message}`;
    } finally {
      if (controlsLocked) setImportLock(false);
      $("importFile").value = "";
    }
  }

  function makeAnalysisPrompt() {
    const problem = activeProblem();
    const f = problem.fields;
    const recurring = Core.getRecurringMistakes(workspace).map((node) => ({ label: node.label, problems: node.problems.map((item) => item.problem.fields.problemTitle) }));
    const suspectedRecurring = Core.getRecurringDiagnoses(workspace);
    const recentAttempts = workspace.problems.flatMap((item) => item.attempts.map((attempt) => ({
      problemTitle: item.fields.problemTitle || "Untitled problem",
      problemId: item.fields.problemId || item.id,
      createdAt: attempt.createdAt,
      result: attempt.result,
      mode: attempt.mode,
      patternId: attempt.patternId,
      unseen: attempt.unseen,
      problemKey: attempt.problemKey,
      firstAttemptForIdentity: attempt.firstAttemptForIdentity,
      transferEligible: attempt.transferEligible,
      hintLevel: attempt.hintLevel,
      hintExposureCount: attempt.hintExposureCount,
      hintExposureSource: attempt.hintExposureSource,
      hintEventIds: attempt.hintEventIds,
      approachUnaided: attempt.approachUnaided,
      applicabilityExplained: attempt.justified,
      proofSelfRatedSound: attempt.proofSound,
      implementationMarkedCorrect: attempt.implementationCorrect,
      distinguishedNearMiss: attempt.distinguishedNearMiss,
      diagnosisCandidates: attempt.diagnosisCandidates,
      recoveryCandidates: attempt.recoveryCandidates,
      validationSource: attempt.validationSource
    }))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
    const transfer = Core.transferMetrics(workspace);
    return `Analyze this competitive-programming problem for a coach-side reasoning dataset. The learner should get a cold attempt after the coach prepares the cues. Do not claim to know an expert's private thoughts or enumerate every possible failure. Separate observed learner behavior from derived, reconstructed, and hypothetical branches. Use sources and verify constraints and complexity. Include typed graph candidates with problem links, counterfactual/near-miss checks, a progressive hint ladder, attempt success dimensions, and only reusable pattern cards. Treat automatic mistake matches as low-confidence prompts for review, never as confirmed diagnoses. Treat unseen status and self-entered ratings as learner reports, not verified proof.\n\n## Problem\nTitle: ${f.problemTitle || "Unknown"}\nPlatform/ID: ${[f.platform, f.problemId].filter(Boolean).join(" / ") || "Unknown"}\nDifficulty: ${f.difficulty || "Unknown"}\nTags: ${f.topicTags || "Unknown"}\nURL: ${f.problemUrl || "Not supplied"}\n\n## Statement\n${f.problemText || "Not supplied"}\n\n## Attempt shared so far\n${f.attemptNotes || "No attempt notes supplied"}\n\n## Cross-problem memory\n${JSON.stringify({ recurringMistakes: recurring, lowConfidenceRecurringDiagnosisCandidates: suspectedRecurring, currentGraph: workspace.graph.nodes.map(({ id, type, label, problemIds }) => ({ id, type, label, problemIds })), recentAttempts, transferEvidence: { uniqueFirstSeenUnseenAttempts: transfer.eligible, unseenClaims: transfer.unseenClaims, repeatedProblemAttemptsExcluded: transfer.repeatedProblemAttempts, unknownProblemIdentityClaimsExcluded: transfer.unknownProblemIdentityClaims, eventDerivedIndependentApproach: transfer.unpromptedRecognition, applicabilityExplained: transfer.applicabilityJustified, proofSelfRatedSound: transfer.proofSound, implementationMarkedCorrect: transfer.implementationCorrect, accepted: transfer.solved, judgeAccepted: transfer.judgeAccepted, coachReviewedProof: transfer.coachReviewed } }, null, 2)}\n\n## Current model\nGoal: ${f.goal || "Not supplied"}\nConstraints: ${f.constraints || "Not supplied"}\nBaseline: ${f.baseline || "Not supplied"}\n\n## Counterfactual design\nCurrent near-miss: ${f.nearMissProblem || "Not prepared"}\nLearner question: ${f.nearMissQuestion || "Not prepared"}\nExpected distinction: ${f.nearMissReason || "Not prepared"}\n\nReturn structured Markdown for the coach. Mark unknowns instead of inventing them. Include a concise source list.`;
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(makeAnalysisPrompt());
      setStatus("Analysis prompt copied · saved on this device");
    } catch {
      const helper = document.createElement("textarea");
      helper.value = makeAnalysisPrompt();
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      const copied = document.execCommand("copy");
      helper.remove();
      setStatus(copied ? "Analysis prompt copied" : "Clipboard unavailable", copied ? "saved" : "error");
    }
  }

  async function initialize() {
    setStatus("Loading local library…", "saving");
    workspace = await loadWorkspace();
    activeProblemId = workspace.activeProblemId;
    renderEverything();
    setViewMode("learner");
    if (storageMode === "browser storage" && database) await persistWithoutFieldUpdate();
    else if (database) {
      storageMode = "device database";
      await persistWithoutFieldUpdate();
    } else setStatus(`Ready · ${storageMode}`);

    fieldNodes.forEach((node) => {
      node.addEventListener("input", () => {
        scheduleSave();
        if (node.dataset.field === "problemTitle") refreshHeader();
      });
      node.addEventListener("change", scheduleSave);
    });
    $("libraryButton").addEventListener("click", openLibrary);
    $("reviewButton").addEventListener("click", startReviewSession);
    $("newProblemButton").addEventListener("click", () => { void createNewProblem(); });
    $("libraryNewProblemButton").addEventListener("click", () => { void createNewProblem(); });
    $("librarySearch").addEventListener("input", renderLibrary);
    $("recordAttemptButton").addEventListener("click", () => { void recordAttempt(); });
    $("attemptPattern").addEventListener("change", renderTransferSummary);
    $("modeToggle").addEventListener("click", () => {
      const nextMode = viewMode === "learner" ? "coach" : "learner";
      void queuePersist().then(() => setViewMode(nextMode));
    });
    $("addGraphNodeButton").addEventListener("click", addGraphNodeFromForm);
    $("addGraphEdgeButton").addEventListener("click", addGraphEdgeFromForm);
    $("addPatternButton").addEventListener("click", () => { void addPatternCard(); });
    $("requestHintButton").addEventListener("click", () => { void requestNextHint(); });
    $("revealRecoveryButton").addEventListener("click", revealReviewRecovery);
    $("saveReviewButton").addEventListener("click", () => { void saveReview(); });
    $("copyPromptButton").addEventListener("click", () => { void copyPrompt(); });
    $("exportButton").addEventListener("click", () => {
      void queuePersist().then(() => download(`${slug(activeProblem()?.fields.problemTitle)}.md`, makeMarkdown(), "text/markdown;charset=utf-8"));
    });
    $("backupButton").addEventListener("click", exportBackup);
    $("importButton").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) void importBackup(file);
    });
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => $(button.dataset.closeDialog).close());
    });
    $("libraryDialog").addEventListener("close", () => { $("librarySearch").value = ""; });
    $("reviewDialog").addEventListener("close", () => { currentReview = null; reviewSavePending = false; });
    window.addEventListener("pagehide", () => { void queuePersist(); });
  }

  initialize().catch((error) => setStatus(`Workspace could not load: ${error.message}`, "error"));
})();
