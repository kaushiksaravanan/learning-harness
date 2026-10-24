"use strict";

(function expose(root, build) {
  const api = build();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CPWorkspaceCore = api;
})(typeof globalThis === "undefined" ? this : globalThis, function buildCore() {
  const VERSION = 2;
  const NODE_TYPES = new Set(["problem", "concept", "pattern", "mistake", "recovery", "check"]);
  const EDGE_TYPES = new Set(["requires", "supports", "leads to", "blocks", "is detected by", "recovers from", "implements", "shares a principle", "is a near-miss for"]);
  const VALIDATION_SOURCES = new Set(["Self-assessed", "Online judge accepted", "Counterexample tested", "Coach reviewed proof", "Official analysis checked"]);
  const emptyFields = () => ({
    problemTitle: "", problemUrl: "", problemId: "", platform: "", topicTags: "", difficulty: "",
    problemText: "", attemptNotes: "", goal: "", constraints: "", baseline: "", conceptGraph: "",
    solverRoutes: "", failureMap: "", constructionReason: "", expertChecks: "", transferProblem: "",
    nearMissProblem: "", nearMissQuestion: "", nearMissReason: "",
    transferMode: "Untimed", hintLevel: "0", transferNotes: "", hintLadder: ""
  });

  function makeId(prefix = "id") {
    const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${uuid}`;
  }

  function dateKey(dateLike = new Date()) {
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(dateLike, days) {
    const date = dateLike instanceof Date ? new Date(dateLike.getTime()) : new Date(dateLike);
    date.setDate(date.getDate() + Number(days));
    return date;
  }

  function emptySchedule() {
    return { repetitions: 0, intervalDays: 0, easeFactor: 2.5, nextReview: null, lastReviewedAt: null, lastQuality: null };
  }

  function normalizeCard(card = {}, problemId) {
    const oldSchedule = card.schedule || {};
    const schedule = card.schedule ? {
      repetitions: Number(oldSchedule.repetitions || 0),
      intervalDays: Number(oldSchedule.intervalDays || 0),
      easeFactor: Math.max(1.3, Number(oldSchedule.easeFactor || 2.5)),
      nextReview: oldSchedule.nextReview || null,
      lastReviewedAt: oldSchedule.lastReviewedAt || null,
      lastQuality: oldSchedule.lastQuality ?? null
    } : {
      repetitions: Number(card.repetitions || 0),
      intervalDays: Number(card.interval || 0),
      easeFactor: Math.max(1.3, Number(card.ease || 2.5)),
      nextReview: card.nextReview || null,
      lastReviewedAt: card.lastReviewedAt || null,
      lastQuality: card.lastQuality ?? null
    };
    return {
      id: card.id || makeId("card"),
      problemId: card.problemId || problemId,
      name: String(card.name || ""),
      trigger: String(card.trigger || ""),
      recovery: String(card.recovery || ""),
      patternNodeId: card.patternNodeId || null,
      readyForReview: Boolean(card.readyForReview || card.nextReview || oldSchedule.nextReview),
      archived: Boolean(card.archived),
      schedule
    };
  }

  function normalizeProblem(problem = {}) {
    const id = problem.id || makeId("problem");
    return {
      id,
      createdAt: problem.createdAt || new Date().toISOString(),
      updatedAt: problem.updatedAt || new Date().toISOString(),
      fields: { ...emptyFields(), ...(problem.fields || {}) },
      attempts: Array.isArray(problem.attempts) ? problem.attempts : [],
      cards: Array.isArray(problem.cards) ? problem.cards.map((card) => normalizeCard(card, id)) : [],
      hintEvents: Array.isArray(problem.hintEvents) ? problem.hintEvents : []
    };
  }

  function createProblem(fields = {}, now = new Date()) {
    const iso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    return normalizeProblem({ id: makeId("problem"), createdAt: iso, updatedAt: iso, fields, attempts: [], cards: [], hintEvents: [] });
  }

  function createWorkspace(now = new Date()) {
    const problem = createProblem({}, now);
    return {
      version: VERSION,
      activeProblemId: problem.id,
      problems: [problem],
      graph: { nodes: [], edges: [] },
      reviewEvents: []
    };
  }

  function migrateLegacy(legacy = {}) {
    const problem = createProblem(legacy.fields || {});
    problem.updatedAt = legacy.updatedAt || problem.updatedAt;
    problem.cards = (legacy.patterns || []).map((card) => normalizeCard(card, problem.id));
    return {
      version: VERSION,
      activeProblemId: problem.id,
      problems: [problem],
      graph: { nodes: [], edges: [] },
      reviewEvents: [],
      migratedFrom: 1
    };
  }

  function normalizeWorkspace(raw) {
    if (!raw || typeof raw !== "object") return createWorkspace();
    if (raw.version === 1 && raw.fields) return migrateLegacy(raw);
    if (raw.version !== VERSION) return createWorkspace();
    const problems = Array.isArray(raw.problems) ? raw.problems.map(normalizeProblem) : [];
    if (problems.length === 0) return createWorkspace();
    const activeProblemId = problems.some((problem) => problem.id === raw.activeProblemId)
      ? raw.activeProblemId
      : problems[0].id;
    const graph = raw.graph || {};
    return {
      version: VERSION,
      activeProblemId,
      problems,
      graph: {
        nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
        edges: Array.isArray(graph.edges) ? graph.edges : []
      },
      reviewEvents: Array.isArray(raw.reviewEvents) ? raw.reviewEvents : [],
      migratedFrom: raw.migratedFrom || null
    };
  }

  function getProblem(workspace, problemId = workspace.activeProblemId) {
    return workspace.problems.find((problem) => problem.id === problemId) || null;
  }

  function setActiveProblem(workspace, problemId) {
    if (!workspace.problems.some((problem) => problem.id === problemId)) throw new Error("Unknown problem ID");
    return { ...workspace, activeProblemId: problemId };
  }

  function addProblem(workspace, fields = {}, now = new Date()) {
    const problem = createProblem(fields, now);
    return { workspace: { ...workspace, activeProblemId: problem.id, problems: [...workspace.problems, problem] }, problem };
  }

  function saveProblem(workspace, problemId, fields, now = new Date()) {
    const iso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const found = workspace.problems.some((problem) => problem.id === problemId);
    if (!found) {
      const problem = normalizeProblem({ id: problemId || makeId("problem"), fields, createdAt: iso, updatedAt: iso });
      return { ...workspace, activeProblemId: problem.id, problems: [...workspace.problems, problem] };
    }
    return {
      ...workspace,
      activeProblemId: problemId,
      problems: workspace.problems.map((problem) => problem.id === problemId
        ? { ...problem, fields: { ...emptyFields(), ...fields }, updatedAt: iso }
        : problem)
    };
  }

  function recordAttempt(workspace, problemId, attempt, now = new Date()) {
    const problem = getProblem(workspace, problemId);
    if (!problem) throw new Error("Unknown problem ID");
    const createdAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const event = {
      id: attempt.id || makeId("attempt"),
      problemId,
      createdAt,
      mode: attempt.mode === "Timed" ? "Timed" : "Untimed",
      result: attempt.result || "Unsolved",
      timeMinutes: Math.max(0, Number(attempt.timeMinutes || 0)),
      hintLevel: Math.min(5, Math.max(0, Number(attempt.hintLevel || 0))),
      patternId: attempt.patternId || null,
      unseen: Boolean(attempt.unseen),
      approachUnaided: Boolean(attempt.approachUnaided),
      justified: Boolean(attempt.justified),
      proofSound: Boolean(attempt.proofSound),
      implementationCorrect: Boolean(attempt.implementationCorrect),
      distinguishedNearMiss: Boolean(attempt.distinguishedNearMiss),
      nearMissResponse: String(attempt.nearMissResponse || ""),
      validationSource: VALIDATION_SOURCES.has(attempt.validationSource) ? attempt.validationSource : "Self-assessed",
      validationEvidence: String(attempt.validationEvidence || ""),
      notes: String(attempt.notes || "")
    };
    return {
      workspace: {
        ...workspace,
        problems: workspace.problems.map((item) => item.id === problemId
          ? { ...item, attempts: [...item.attempts, event], updatedAt: createdAt }
          : item)
      },
      event
    };
  }

  function addCard(workspace, problemId, input = {}) {
    const problem = getProblem(workspace, problemId);
    if (!problem) throw new Error("Unknown problem ID");
    const card = normalizeCard({ ...input, id: input.id || makeId("card"), problemId, schedule: emptySchedule() }, problemId);
    return {
      workspace: {
        ...workspace,
        problems: workspace.problems.map((item) => item.id === problemId
          ? { ...item, cards: [...item.cards, card], updatedAt: new Date().toISOString() }
          : item)
      },
      card
    };
  }

  function updateCard(workspace, cardId, updates) {
    let found = false;
    const updatedAt = new Date().toISOString();
    const problems = workspace.problems.map((problem) => {
      const cards = problem.cards.map((card) => {
        if (card.id !== cardId) return card;
        found = true;
        return { ...card, ...updates, schedule: { ...card.schedule, ...(updates.schedule || {}) } };
      });
      return cards.some((card, index) => card !== problem.cards[index]) ? { ...problem, cards, updatedAt } : problem;
    });
    if (!found) throw new Error("Unknown card ID");
    return { ...workspace, problems };
  }

  function archiveCard(workspace, cardId) {
    return updateCard(workspace, cardId, { archived: true, readyForReview: false });
  }

  function addGraphNode(workspace, input, now = new Date()) {
    const type = String(input.type || "").trim();
    const label = String(input.label || "").trim();
    if (!NODE_TYPES.has(type)) throw new Error("Invalid graph node type");
    if (!label) throw new Error("Graph nodes need a label");
    const problemId = input.problemId || workspace.activeProblemId;
    const key = `${type}:${label.toLocaleLowerCase()}`;
    const existing = workspace.graph.nodes.find((node) => `${node.type}:${node.label.toLocaleLowerCase()}` === key);
    if (existing) {
      const problemIds = [...new Set([...(existing.problemIds || []), problemId].filter(Boolean))];
      const evidenceItems = [...(existing.evidenceItems || [])];
      if (problemId && !evidenceItems.some((item) => item.problemId === problemId)) {
        evidenceItems.push({
          problemId,
          description: String(input.description || ""),
          provenance: input.provenance || "reconstructed",
          confidence: input.confidence || "medium",
          createdAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString()
        });
      }
      const nodes = workspace.graph.nodes.map((node) => node.id === existing.id
        ? { ...node, problemIds, evidenceItems, description: input.description || node.description || "" }
        : node);
      return { workspace: { ...workspace, graph: { ...workspace.graph, nodes } }, node: { ...existing, problemIds, evidenceItems }, merged: true };
    }
    const timestamp = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const node = {
      id: input.id || makeId("node"),
      type,
      label,
      description: String(input.description || ""),
      problemIds: problemId ? [problemId] : [],
      provenance: input.provenance || "reconstructed",
      confidence: input.confidence || "medium",
      evidenceItems: problemId ? [{
        problemId,
        description: String(input.description || ""),
        provenance: input.provenance || "reconstructed",
        confidence: input.confidence || "medium",
        createdAt: timestamp
      }] : [],
      createdAt: timestamp
    };
    return { workspace: { ...workspace, graph: { ...workspace.graph, nodes: [...workspace.graph.nodes, node] } }, node, merged: false };
  }

  function addGraphEdge(workspace, input) {
    const from = workspace.graph.nodes.find((node) => node.id === input.from);
    const to = workspace.graph.nodes.find((node) => node.id === input.to);
    const relation = String(input.relation || "").trim();
    if (!from || !to) throw new Error("Graph edges must point to existing nodes");
    if (from.id === to.id) throw new Error("A graph edge cannot point to itself");
    if (!EDGE_TYPES.has(relation)) throw new Error("Invalid graph relation");
    const duplicate = workspace.graph.edges.find((edge) => edge.from === from.id && edge.to === to.id && edge.relation === relation);
    if (duplicate) {
      const problemId = input.problemId || workspace.activeProblemId;
      const problemIds = [...new Set([...(duplicate.problemIds || []), problemId].filter(Boolean))];
      const evidenceItems = [...(duplicate.evidenceItems || [])];
      if (problemId && !evidenceItems.some((item) => item.problemId === problemId)) {
        evidenceItems.push({ problemId, evidence: String(input.evidence || ""), createdAt: new Date().toISOString() });
      }
      const edge = { ...duplicate, problemIds, evidenceItems };
      const edges = workspace.graph.edges.map((item) => item.id === edge.id ? edge : item);
      return { workspace: { ...workspace, graph: { ...workspace.graph, edges } }, edge, merged: true };
    }
    const problemId = input.problemId || workspace.activeProblemId;
    const edge = {
      id: input.id || makeId("edge"),
      from: from.id,
      to: to.id,
      relation,
      evidence: String(input.evidence || ""),
      problemIds: [problemId].filter(Boolean),
      evidenceItems: problemId ? [{ problemId, evidence: String(input.evidence || ""), createdAt: new Date().toISOString() }] : [],
      createdAt: new Date().toISOString()
    };
    return { workspace: { ...workspace, graph: { ...workspace.graph, edges: [...workspace.graph.edges, edge] } }, edge, merged: false };
  }

  function getGraphNeighbors(workspace, nodeId, direction = "both") {
    const neighbors = [];
    for (const edge of workspace.graph.edges) {
      if ((direction === "both" || direction === "out") && edge.from === nodeId) {
        const node = workspace.graph.nodes.find((item) => item.id === edge.to);
        if (node) neighbors.push({ node, edge, direction: "out" });
      }
      if ((direction === "both" || direction === "in") && edge.to === nodeId) {
        const node = workspace.graph.nodes.find((item) => item.id === edge.from);
        if (node) neighbors.push({ node, edge, direction: "in" });
      }
    }
    return neighbors;
  }

  function getRecurringMistakes(workspace, minProblems = 2) {
    return workspace.graph.nodes
      .filter((node) => node.type === "mistake" && new Set(node.problemIds || []).size >= minProblems)
      .map((node) => ({
        ...node,
        problems: (node.problemIds || []).map((id) => ({ id, problem: getProblem(workspace, id) })).filter((item) => item.problem)
      }))
      .sort((a, b) => b.problemIds.length - a.problemIds.length || a.label.localeCompare(b.label));
  }

  function getAllCards(workspace) {
    return workspace.problems.flatMap((problem) => problem.cards.map((card) => ({
      ...card,
      problem: { id: problem.id, title: problem.fields.problemTitle || "Untitled problem", problemId: problem.fields.problemId || "" }
    })));
  }

  function getDueCards(workspace, today = new Date()) {
    const key = typeof today === "string" ? today : dateKey(today);
    return getAllCards(workspace)
      .filter((card) => !card.archived && card.readyForReview && (!card.schedule.nextReview || card.schedule.nextReview <= key))
      .sort((a, b) => (a.schedule.nextReview || "").localeCompare(b.schedule.nextReview || "") || a.name.localeCompare(b.name));
  }

  function calculateSM2(schedule, quality, now = new Date()) {
    const q = Number(quality);
    if (!Number.isInteger(q) || q < 0 || q > 5) throw new Error("Quality must be an integer from 0 to 5");
    const old = { ...emptySchedule(), ...(schedule || {}) };
    const miss = 5 - q;
    const easeFactor = Math.max(1.3, old.easeFactor + 0.1 - miss * (0.08 + miss * 0.02));
    let repetitions;
    let intervalDays;
    if (q < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      repetitions = old.repetitions + 1;
      intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(old.intervalDays * easeFactor);
    }
    const date = now instanceof Date ? now : new Date(now);
    return {
      repetitions,
      intervalDays,
      easeFactor,
      nextReview: dateKey(addDays(date, intervalDays)),
      lastReviewedAt: date.toISOString(),
      lastQuality: q
    };
  }

  function applyReview(workspace, input, now = new Date()) {
    const eventId = String(input.eventId || "").trim();
    if (!eventId) throw new Error("A stable review event ID is required");
    const previousEvent = workspace.reviewEvents.find((event) => event.id === eventId);
    if (previousEvent) return { workspace, event: previousEvent, duplicate: true };
    const recallAttempt = String(input.recallAttempt || "").trim();
    if (!input.attempted || !recallAttempt) throw new Error("Record a retrieval attempt before rating");
    if (!input.revealed) throw new Error("Reveal the recovery before rating retrieval");
    const match = workspace.problems.flatMap((problem) => problem.cards.map((card) => ({ problem, card })))
      .find((item) => item.card.id === input.cardId);
    if (!match) throw new Error("Unknown card ID");
    const previousSchedule = { ...match.card.schedule };
    const schedule = calculateSM2(previousSchedule, input.quality, now);
    const event = {
      id: eventId,
      cardId: match.card.id,
      problemId: match.problem.id,
      reviewedAt: schedule.lastReviewedAt,
      quality: schedule.lastQuality,
      recallAttempt,
      mode: input.mode === "Timed" ? "Timed" : "Untimed",
      previousSchedule,
      resultingSchedule: { ...schedule }
    };
    const updated = {
      ...workspace,
      problems: workspace.problems.map((problem) => problem.id === match.problem.id
        ? { ...problem, cards: problem.cards.map((card) => card.id === match.card.id ? { ...card, schedule } : card), updatedAt: schedule.lastReviewedAt }
        : problem),
      reviewEvents: [...workspace.reviewEvents, event]
    };
    return { workspace: updated, event, duplicate: false };
  }

  function recordHint(workspace, problemId, hint, learnerResponse, now = new Date()) {
    const problem = getProblem(workspace, problemId);
    if (!problem) throw new Error("Unknown problem ID");
    const text = String(learnerResponse || "").trim();
    if (!text) throw new Error("Record the learner's next reasoning step before another hint");
    const event = {
      id: makeId("hint"),
      problemId,
      hintLevel: Number(hint.level || 0),
      hint: String(hint.text || ""),
      learnerResponse: text,
      createdAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString()
    };
    return {
      workspace: {
        ...workspace,
        problems: workspace.problems.map((item) => item.id === problemId
          ? { ...item, hintEvents: [...item.hintEvents, event], updatedAt: event.createdAt }
          : item)
      },
      event
    };
  }

  function transferMetrics(workspace, patternId) {
    const attempts = workspace.problems.flatMap((problem) => problem.attempts)
      .filter((attempt) => attempt.unseen && (!patternId || attempt.patternId === patternId));
    const count = (predicate) => attempts.filter(predicate).length;
    return {
      eligible: attempts.length,
      unpromptedRecognition: count((attempt) => attempt.approachUnaided && attempt.hintLevel === 0),
      applicabilityJustified: count((attempt) => attempt.justified),
      proofSound: count((attempt) => attempt.proofSound),
      implementationCorrect: count((attempt) => attempt.implementationCorrect),
      distinguishedNearMiss: count((attempt) => attempt.distinguishedNearMiss),
      judgeAccepted: count((attempt) => attempt.result === "Solved" && attempt.validationSource === "Online judge accepted"),
      coachReviewed: count((attempt) => attempt.validationSource === "Coach reviewed proof"),
      solved: count((attempt) => attempt.result === "Solved"),
      attempts
    };
  }

  return {
    VERSION,
    NODE_TYPES: [...NODE_TYPES],
    EDGE_TYPES: [...EDGE_TYPES],
    VALIDATION_SOURCES: [...VALIDATION_SOURCES],
    emptyFields,
    makeId,
    dateKey,
    emptySchedule,
    createProblem,
    createWorkspace,
    migrateLegacy,
    normalizeWorkspace,
    getProblem,
    setActiveProblem,
    addProblem,
    saveProblem,
    recordAttempt,
    addCard,
    updateCard,
    archiveCard,
    addGraphNode,
    addGraphEdge,
    getGraphNeighbors,
    getRecurringMistakes,
    getAllCards,
    getDueCards,
    calculateSM2,
    applyReview,
    recordHint,
    transferMetrics
  };
});
