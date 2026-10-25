"use strict";

(function expose(root, build) {
  const api = build();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CPWorkspaceCore = api;
})(typeof globalThis === "undefined" ? this : globalThis, function buildCore() {
  const VERSION = 3;
  const NODE_TYPES = new Set(["problem", "concept", "pattern", "mistake", "recovery", "check"]);
  const EDGE_TYPES = new Set(["requires", "supports", "leads to", "blocks", "is detected by", "recovers from", "implements", "shares a principle", "is a near-miss for"]);
  const VALIDATION_SOURCES = new Set(["Self-assessed", "Online judge accepted", "Counterexample tested", "Coach reviewed proof", "Official analysis checked"]);
  const REVIEW_TYPES = new Set(["basic", "reasoning", "discrimination", "transfer"]);
  const REASONING_LAYERS = new Set(["definition", "mechanics", "derivation", "recognition", "discrimination", "implementation", "transfer"]);
  const REASONING_RESULTS = new Set(["independent", "with-cue", "not-yet", "untested"]);
  const BLOCKERS = new Set(["undetermined", "problem-model", "mechanics", "approach", "proof", "implementation", "complexity", "recurring-mistake", "prerequisite", "independent"]);
  const DIAGNOSIS_RULES = [
    {
      id: "complexity-not-checked",
      label: "Complexity was not checked against the constraints",
      recoveryLabel: "Estimate complexity against the input limits",
      pattern: /\b(time limit|tle|too slow|quadratic|o\s*\(\s*n\s*(?:\*|\^?\s*2)|complexity|too many operations)\b/i,
      recoveryPattern: /\b(?:now|this time|before coding).{0,48}(?:estimate|check|compare).{0,36}(?:complexity|cost|constraints?|operations?)\b/i
    },
    {
      id: "boundary-case-missed",
      label: "A boundary case or index boundary was missed",
      recoveryLabel: "Test boundary cases before accepting the implementation",
      pattern: /\b(off[- ]by[- ]one|boundary bug|missed (?:the )?(?:empty|single|n\s*=\s*1|edge) case|forgot (?:the )?(?:empty|single|n\s*=\s*1|edge) case|overflow)\b/i,
      recoveryPattern: /\b(?:now|this time|before submitting).{0,48}(?:test|check|try).{0,36}(?:boundary|edge|empty|single|n\s*=\s*1|overflow|counterexample)\b/i
    },
    {
      id: "state-or-cache-mismatch",
      label: "The state, cache key, or returned value did not match the needed information",
      recoveryLabel: "Check what each state and cached value represents",
      pattern: /\b(missing state|forgot to (?:track|store|reset)|wrong (?:state|cache|memo|return(?: value)?|variable)|stale cache|wrong memo(?:ization)? key|returned the wrong|return(?:ed)? the wrong value)\b/i,
      recoveryPattern: /\b(?:now|this time|before coding).{0,48}(?:reset|track|store|check|return|cache).{0,36}(?:state|cache|memo|value|index|variable|test case)\b/i
    },
    {
      id: "precondition-unchecked",
      label: "An algorithm precondition was assumed instead of checked",
      recoveryLabel: "Check algorithm preconditions before choosing a pattern",
      pattern: /\b(assum(?:e|ed|ing).{0,48}(?:monoton\w*|greedy)|without (?:proving|checking).{0,32}(?:monoton\w*|invariant|greedy|valid)|did not prove.{0,32}(?:monoton\w*|invariant)|not monotone|not monotonic|greedy (?:fails|is wrong))\b/i,
      recoveryPattern: /\b(?:now|this time|before coding).{0,48}(?:prove|check|verify|test).{0,36}(?:monoton\w*|invariant|precondition|greedy)\b/i
    },
    {
      id: "test-coverage-too-narrow",
      label: "Testing did not cover a case that distinguishes the failure",
      recoveryLabel: "Use a counterexample and edge cases to test the reasoning",
      pattern: /\b(only tested (?:the )?sample|sample only|missed (?:the )?counterexample|did not test.{0,32}(?:edge|boundary|large|duplicate|empty)|forgot to test)\b/i,
      recoveryPattern: /\b(?:now|this time|before submitting).{0,48}(?:test|check|try).{0,36}(?:counterexample|edge|boundary|large|duplicate|empty|sample)\b/i
    }
  ];
  const DIAGNOSIS_TO_BLOCKER = {
    "precondition-unchecked": "approach",
    "complexity-not-checked": "complexity",
    "boundary-case-missed": "implementation",
    "state-or-cache-mismatch": "implementation",
    "test-coverage-too-narrow": "implementation"
  };
  const emptyFields = () => ({
    problemTitle: "", problemUrl: "", problemId: "", platform: "", topicTags: "", difficulty: "",
    problemText: "", attemptNotes: "", goal: "", constraints: "", baseline: "", conceptGraph: "",
    solverRoutes: "", failureMap: "", constructionReason: "", expertChecks: "",
    nearMissProblem: "", nearMissQuestion: "", nearMissReason: "",
    transferNotes: "", hintLadder: ""
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
      reviewType: REVIEW_TYPES.has(card.reviewType) ? card.reviewType : "reasoning",
      patternNodeId: card.patternNodeId || null,
      readyForReview: Boolean(card.readyForReview || card.nextReview || oldSchedule.nextReview),
      archived: Boolean(card.archived),
      schedule
    };
  }

  function problemIdentity(fields = {}) {
    const platform = String(fields.platform || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
    const problemId = String(fields.problemId || "").trim().toLocaleLowerCase().replace(/\s+/g, "");
    if (problemId) return `id:${platform ? `${platform}:` : ""}${problemId}`;
    const url = String(fields.problemUrl || "").trim().toLocaleLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(/[?#]/, 1)[0]
      .replace(/\/+$/, "");
    return url ? `url:${url}` : null;
  }

  function diagnoseAttempt(text) {
    const source = String(text || "").replace(/\s+/g, " ").trim();
    if (!source) return [];
    return DIAGNOSIS_RULES.flatMap((rule) => {
      const match = rule.pattern.exec(source);
      if (!match) return [];
      const start = Math.max(0, match.index - 70);
      const end = Math.min(source.length, match.index + match[0].length + 90);
      return [{
        id: rule.id,
        label: rule.label,
        confidence: "low",
        evidence: source.slice(start, end).trim()
      }];
    });
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

  function createSnapshotQueue(writeSnapshot) {
    if (typeof writeSnapshot !== "function") throw new Error("A snapshot writer is required");
    let queue = Promise.resolve();
    let replacement = null;

    function enqueue(snapshot) {
      if (replacement) return replacement;
      const operation = queue.catch(() => {}).then(() => writeSnapshot(snapshot));
      queue = operation.catch(() => {});
      return operation;
    }

    function replace(snapshot) {
      if (replacement) return replacement.then(() => replace(snapshot));
      const operation = (async () => {
        await queue.catch(() => {});
        await writeSnapshot(snapshot);
      })();
      replacement = operation.finally(() => { replacement = null; });
      return replacement;
    }

    function wait() {
      return replacement || queue;
    }

    return { enqueue, replace, wait, locked: () => Boolean(replacement) };
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

  function migrateV2(raw = {}) {
    const problems = Array.isArray(raw.problems) ? raw.problems.map(normalizeProblem) : [];
    if (!problems.length) return createWorkspace();
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
      migratedFrom: 2
    };
  }

  function normalizeWorkspace(raw) {
    if (!raw || typeof raw !== "object") return createWorkspace();
    if (raw.version === 1 && raw.fields) return migrateLegacy(raw);
    if (raw.version === 2) return migrateV2(raw);
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

  function recommendIntervention(workspace, blocker, problemId = workspace.activeProblemId, diagnosisId = null) {
    const interventions = {
      undetermined: {
        kind: "diagnose",
        title: "Continue or name a blocker",
        prompt: "No targeted cue yet. Keep solving, or choose the closest blocker above to get one focused prompt."
      },
      "problem-model": {
        kind: "restatement",
        title: "Make the problem concrete",
        prompt: "Restate the required output in your own words. Work one tiny input by hand and name what information the answer depends on."
      },
      mechanics: {
        kind: "worked-example",
        title: "Build the mechanism on a small case",
        prompt: "Use a tiny example and write each state change in a table. Then predict the next step before revealing or computing it."
      },
      approach: {
        kind: "derivation",
        title: "Start from a baseline",
        prompt: "Describe the simplest correct approach. Estimate its time cost from the constraints, then identify which repeated work or representation might reduce that cost."
      },
      proof: {
        kind: "proof",
        title: "Find the proof obligation",
        prompt: "State what must remain true after each step. Try to construct the smallest counterexample to your claim, then repair the invariant."
      },
      implementation: {
        kind: "trace",
        title: "Trace the first divergence",
        prompt: "Choose the smallest failing input. Write expected and actual state after each operation; identify the first point where they differ before editing."
      },
      complexity: {
        kind: "complexity",
        title: "Estimate work before optimizing",
        prompt: "Count the dominant operations at the maximum input size. Identify the bottleneck, then compare one alternative representation or data structure."
      },
      "recurring-mistake": {
        kind: "retrieval",
        title: "Retrieve an earlier recovery move",
        prompt: "Before seeing any explanation, recall an earlier problem where this kind of failure appeared. What warning sign and check helped you recover?"
      },
      prerequisite: {
        kind: "worked-example",
        title: "Repair one prerequisite",
        prompt: "Use a short worked example to establish the missing definition or mechanism. Then solve the next tiny case with one step removed from the example."
      },
      independent: {
        kind: "continue",
        title: "Continue independently",
        prompt: "No intervention is needed now. Continue your attempt and record the next decision only if you become blocked."
      }
    };
    const key = BLOCKERS.has(blocker) ? blocker : "undetermined";
    const intervention = { blocker: key, ...interventions[key] };
    if (key === "recurring-mistake") {
      const prior = workspace.problems
        .flatMap((problem) => problem.attempts.map((attempt) => ({ problem, attempt })))
        .filter(({ problem, attempt }) => problem.id !== problemId && (attempt.diagnosisCandidates || []).some((candidate) => !diagnosisId || candidate.id === diagnosisId))
        .sort((a, b) => String(b.attempt.createdAt || "").localeCompare(String(a.attempt.createdAt || "")))[0];
      if (prior) {
        const candidate = prior.attempt.diagnosisCandidates.find((item) => !diagnosisId || item.id === diagnosisId);
        intervention.priorSignal = { problemId: prior.problem.id, attemptId: prior.attempt.id, label: candidate.label };
        intervention.prompt = `Recall the earlier issue tagged “${candidate.label}” from ${prior.problem.fields.problemTitle || "another problem"}. What trigger and recovery check did you use? Try to state it before opening that attempt.`;
      }
    }
    return intervention;
  }

  function classifyDiagnosisCandidates(diagnosisCandidates, priorSignals, identity) {
    const recurringCandidate = diagnosisCandidates.find((candidate) => priorSignals.some((signal) =>
      signal.candidate.id === candidate.id && problemIdentity(signal.problem.fields) !== identity
    ));
    if (recurringCandidate) return { blocker: "recurring-mistake", diagnosisId: recurringCandidate.id };
    const firstCandidate = diagnosisCandidates[0];
    return {
      blocker: firstCandidate ? DIAGNOSIS_TO_BLOCKER[firstCandidate.id] || "undetermined" : "undetermined",
      diagnosisId: firstCandidate?.id || null
    };
  }

  function suggestInterventionFromNotes(workspace, text, problemId = workspace.activeProblemId) {
    const problem = getProblem(workspace, problemId);
    const diagnosisCandidates = diagnoseAttempt(text);
    const identity = problem ? problemIdentity(problem.fields) : null;
    const priorSignals = workspace.problems.flatMap((item) => item.attempts.flatMap((attempt) =>
      (attempt.diagnosisCandidates || []).map((candidate) => ({ candidate, attempt, problem: item }))
    ));
    const { blocker, diagnosisId } = classifyDiagnosisCandidates(diagnosisCandidates, priorSignals, identity);
    const intervention = recommendIntervention(workspace, blocker, problemId, diagnosisId);
    intervention.diagnosisId = diagnosisId;
    return {
      blocker,
      diagnosisId,
      source: blocker === "undetermined" ? "not-classified" : "text-rule-low-confidence",
      confidence: blocker === "undetermined" ? "unknown" : "low",
      diagnosisCandidates,
      intervention
    };
  }

  function recordAttempt(workspace, problemId, attempt, now = new Date()) {
    const problem = getProblem(workspace, problemId);
    if (!problem) throw new Error("Unknown problem ID");
    const createdAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const identity = problemIdentity(problem.fields);
    const firstAttemptForIdentity = Boolean(identity) && !workspace.problems.some((item) =>
      item.attempts.some((previous) => (previous.problemKey || problemIdentity(item.fields)) === identity)
    );
    const assignedHints = new Set(problem.attempts.flatMap((previous) => previous.hintEventIds || []));
    const attemptedAt = new Date(createdAt).getTime();
    const exposedHints = problem.hintEvents.filter((hint) => {
      if (assignedHints.has(hint.id)) return false;
      const shownAt = new Date(hint.createdAt).getTime();
      return !Number.isFinite(attemptedAt) || !Number.isFinite(shownAt) || shownAt <= attemptedAt;
    });
    const hintLevel = exposedHints.reduce((highest, hint) => Math.max(highest, Number(hint.hintLevel || 0)), 0);
    const note = String(attempt.notes || "");
    const previousNotes = String(problem.attempts.at(-1)?.notes || "");
    const newNotes = previousNotes && note.startsWith(previousNotes) ? note.slice(previousNotes.length).trim() : note;
    const nearMissResponse = String(attempt.nearMissResponse || "");
    const diagnosisText = [newNotes, nearMissResponse, ...exposedHints.map((hint) => hint.learnerResponse)].filter(Boolean).join("\n");
    const diagnosisCandidates = diagnoseAttempt(diagnosisText).map((candidate) => ({ ...candidate, createdAt }));
    const currentDiagnosisIds = new Set(diagnosisCandidates.map((candidate) => candidate.id));
    const priorSignals = workspace.problems.flatMap((item) => item.attempts.flatMap((previous) =>
      (previous.diagnosisCandidates || []).map((candidate) => ({ candidate, attempt: previous, problem: item }))
    ));
    const requestedBlocker = BLOCKERS.has(attempt.blocker) ? attempt.blocker : "undetermined";
    const inferredBlocker = classifyDiagnosisCandidates(diagnosisCandidates, priorSignals, identity).blocker;
    const blocker = requestedBlocker === "undetermined" ? inferredBlocker : requestedBlocker;
    const blockerSource = requestedBlocker !== "undetermined"
      ? "learner-selected"
      : blocker !== "undetermined" ? "text-rule-low-confidence" : "not-classified";
    const blockerConfidence = blockerSource === "learner-selected" ? "self-reported" : blockerSource === "text-rule-low-confidence" ? "low" : "unknown";
    // Preserve the prompt the learner actually saw. The text-rule diagnosis is
    // computed from the submitted notes and must not be presented as an earlier intervention.
    const promptBlocker = BLOCKERS.has(attempt.intervention?.blocker)
      ? attempt.intervention.blocker
      : blocker;
    const intervention = recommendIntervention(workspace, promptBlocker, problemId, attempt.intervention?.diagnosisId);
    const confidenceValue = attempt.confidencePercent === "" || attempt.confidencePercent === null || attempt.confidencePercent === undefined
      ? null
      : Number(attempt.confidencePercent);
    const confidencePercent = Number.isFinite(confidenceValue) ? Math.max(0, Math.min(100, confidenceValue)) : null;
    const timeBreakdown = Object.fromEntries(["understanding", "approach", "implementation", "verification"].map((key) => {
      const value = Number(attempt.timeBreakdown?.[key]);
      return [key, Number.isFinite(value) ? Math.max(0, value) : 0];
    }));
    const recoveryCandidates = DIAGNOSIS_RULES.flatMap((rule) => {
      const prior = priorSignals.filter((signal) => signal.candidate.id === rule.id);
      const match = rule.recoveryPattern?.exec(diagnosisText);
      if (!prior.length || !match || currentDiagnosisIds.has(rule.id)) return [];
      const start = Math.max(0, match.index - 60);
      const end = Math.min(diagnosisText.length, match.index + match[0].length + 80);
      return [{
        id: rule.id,
        label: rule.label,
        recoveryLabel: rule.recoveryLabel,
        confidence: "low",
        evidence: diagnosisText.slice(start, end).trim(),
        recoveredFromAttemptIds: [...new Set(prior.map((signal) => signal.attempt.id))],
        recoveredFromProblemIds: [...new Set(prior.map((signal) => signal.problem.id))]
      }];
    });
    const event = {
      id: attempt.id || makeId("attempt"),
      problemId,
      createdAt,
      problemKey: identity,
      firstAttemptForIdentity,
      transferEligible: Boolean(attempt.unseen && firstAttemptForIdentity),
      mode: attempt.mode === "Timed" ? "Timed" : "Untimed",
      learningMode: ["Discovery", "Guided construction", "First principles"].includes(attempt.learningMode) ? attempt.learningMode : "Discovery",
      result: attempt.result || "Unsolved",
      timeMinutes: Math.max(0, Number(attempt.timeMinutes || 0)),
      timeBreakdown,
      blocker,
      blockerSource,
      blockerConfidence,
      intervention,
      interventionResponse: String(attempt.interventionResponse || ""),
      focusLayer: REASONING_LAYERS.has(attempt.focusLayer) ? attempt.focusLayer : null,
      focusResult: REASONING_RESULTS.has(attempt.focusResult) ? attempt.focusResult : "untested",
      confidenceClaim: String(attempt.confidenceClaim || ""),
      confidencePercent,
      confidenceReason: String(attempt.confidenceReason || ""),
      confidenceOutcome: ["supported", "contradicted"].includes(attempt.confidenceOutcome) ? attempt.confidenceOutcome : "unresolved",
      debugCycle: {
        hypothesis: String(attempt.debugCycle?.hypothesis || ""),
        test: String(attempt.debugCycle?.test || ""),
        prediction: String(attempt.debugCycle?.prediction || ""),
        observed: String(attempt.debugCycle?.observed || ""),
        changedBeforeTest: Boolean(attempt.debugCycle?.changedBeforeTest)
      },
      hintLevel,
      hintEventIds: exposedHints.map((hint) => hint.id),
      hintExposureCount: exposedHints.length,
      hintExposureSource: "timestamped-events",
      patternId: attempt.patternId || null,
      unseen: Boolean(attempt.unseen),
      approachUnaided: exposedHints.length === 0,
      justified: Boolean(attempt.justified),
      proofSound: Boolean(attempt.proofSound),
      implementationCorrect: Boolean(attempt.implementationCorrect),
      distinguishedNearMiss: Boolean(attempt.distinguishedNearMiss),
      nearMissResponse,
      validationSource: VALIDATION_SOURCES.has(attempt.validationSource) ? attempt.validationSource : "Self-assessed",
      validationEvidence: String(attempt.validationEvidence || ""),
      notes: note,
      diagnosisCandidates,
      recoveryCandidates
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

  function getRecurringDiagnoses(workspace, minProblems = 2) {
    const groups = new Map();
    for (const problem of workspace.problems) {
      for (const attempt of problem.attempts) {
        for (const candidate of attempt.diagnosisCandidates || []) {
          if (!candidate?.id || !candidate.label) continue;
          let group = groups.get(candidate.id);
          if (!group) {
            group = { id: candidate.id, label: candidate.label, confidence: "low", evidence: [], problemIds: new Set(), problemKeys: new Set() };
            groups.set(candidate.id, group);
          }
          group.problemIds.add(problem.id);
          group.problemKeys.add(problemIdentity(problem.fields) || `record:${problem.id}`);
          group.evidence.push({
            problemId: problem.id,
            problemTitle: problem.fields.problemTitle || "Untitled problem",
            attemptId: attempt.id,
            createdAt: candidate.createdAt || attempt.createdAt,
            excerpt: candidate.evidence || ""
          });
        }
      }
    }
    return [...groups.values()]
      .map((group) => ({ ...group, problemIds: [...group.problemIds], problemKeys: [...group.problemKeys] }))
      .filter((group) => group.problemKeys.length >= minProblems)
      .sort((a, b) => b.problemKeys.length - a.problemKeys.length || a.label.localeCompare(b.label));
  }

  function getRecoveryCandidates(workspace) {
    return workspace.problems.flatMap((problem) => problem.attempts.flatMap((attempt) =>
      (attempt.recoveryCandidates || []).map((candidate) => ({
        ...candidate,
        attemptId: attempt.id,
        problemId: problem.id,
        problemTitle: problem.fields.problemTitle || "Untitled problem"
      }))
    ));
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
      reviewType: match.card.reviewType,
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
    const records = workspace.problems.flatMap((problem, problemOrder) => problem.attempts.map((attempt, attemptOrder) => ({
      problem,
      attempt,
      problemOrder,
      attemptOrder,
      key: attempt.problemKey || problemIdentity(problem.fields)
    }))).sort((a, b) => String(a.attempt.createdAt || "").localeCompare(String(b.attempt.createdAt || "")) || a.problemOrder - b.problemOrder || a.attemptOrder - b.attemptOrder);
    const seen = new Set();
    const attempts = [];
    let unseenClaims = 0;
    let repeatedProblemAttempts = 0;
    let unknownProblemIdentityClaims = 0;
    let legacyUnaidedReports = 0;
    for (const record of records) {
      const { attempt, problem, key } = record;
      if (attempt.unseen) unseenClaims += 1;
      if (!key) {
        if (attempt.unseen) unknownProblemIdentityClaims += 1;
        continue;
      }
      const first = !seen.has(key);
      seen.add(key);
      if (!first) repeatedProblemAttempts += 1;
      if (!first || !attempt.unseen || (patternId && attempt.patternId !== patternId)) continue;
      attempts.push({ ...attempt, problemTitle: problem.fields.problemTitle || "Untitled problem", problemKey: key, firstAttemptForIdentity: true });
      if (attempt.hintExposureSource !== "timestamped-events" && attempt.approachUnaided) legacyUnaidedReports += 1;
    }
    const count = (predicate) => attempts.filter(predicate).length;
    return {
      eligible: attempts.length,
      uniqueFirstSeen: attempts.length,
      unseenClaims,
      repeatedProblemAttempts,
      unknownProblemIdentityClaims,
      legacyUnaidedReports,
      unpromptedRecognition: count((attempt) => attempt.hintExposureSource === "timestamped-events" && attempt.approachUnaided),
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

  function getReasoningLayerProgress(workspace) {
    const attempts = workspace.problems.flatMap((problem) => problem.attempts.map((attempt) => ({
      problem,
      attempt,
      identity: attempt.problemKey || problemIdentity(problem.fields)
    }))).filter(({ identity, attempt }) => identity && REASONING_LAYERS.has(attempt.focusLayer) && REASONING_RESULTS.has(attempt.focusResult) && attempt.focusResult !== "untested")
      .sort((a, b) => String(a.attempt.createdAt || "").localeCompare(String(b.attempt.createdAt || "")));
    return [...REASONING_LAYERS].map((layer) => {
      const latestByProblem = new Map();
      for (const record of attempts) {
        if (record.attempt.focusLayer !== layer) continue;
        latestByProblem.set(record.identity, record);
      }
      const evidence = [...latestByProblem.values()];
      const independent = evidence.filter(({ attempt }) => attempt.focusResult === "independent").length;
      const neededSupport = evidence.filter(({ attempt }) => attempt.focusResult === "with-cue" || attempt.focusResult === "not-yet").length;
      return {
        layer,
        problems: evidence.length,
        independent,
        withCue: evidence.filter(({ attempt }) => attempt.focusResult === "with-cue").length,
        notYet: evidence.filter(({ attempt }) => attempt.focusResult === "not-yet").length,
        gap: evidence.length >= 2 && neededSupport > independent,
        confidence: evidence.length >= 4 && neededSupport >= independent * 2 ? "medium" : "low",
        evidence: evidence.map(({ problem, attempt }) => ({
          problemId: problem.id,
          title: problem.fields.problemTitle || "Untitled problem",
          result: attempt.focusResult,
          createdAt: attempt.createdAt
        }))
      };
    }).sort((a, b) => Number(b.gap) - Number(a.gap) || b.withCue + b.notYet - (a.withCue + a.notYet) || a.layer.localeCompare(b.layer));
  }

  function getLearningGapCandidates(workspace) {
    return getReasoningLayerProgress(workspace).filter((item) => item.gap);
  }

  function getNextPracticeFocus(workspace) {
    const gap = getLearningGapCandidates(workspace)[0];
    if (gap) {
      const names = {
        definition: "define the task precisely and work a tiny example",
        mechanics: "trace the mechanism on a small input",
        derivation: "derive the approach from a baseline and the constraints",
        recognition: "identify the pattern in a new statement before coding",
        discrimination: "compare a problem where the familiar pattern does not apply",
        implementation: "implement the same idea in a different problem",
        transfer: "solve a genuinely new problem without a cue"
      };
      return {
        layer: gap.layer,
        reason: `${gap.withCue + gap.notYet} of ${gap.problems} distinct problems in this layer needed support most recently.`,
        recommendation: `Choose a new problem to ${names[gap.layer]}.`,
        evidence: gap.evidence,
        confidence: gap.confidence
      };
    }
    const observed = getReasoningLayerProgress(workspace).reduce((sum, item) => sum + item.problems, 0);
    return observed
      ? { layer: null, reason: "No repeated support gap is visible in the latest identified-problem evidence.", recommendation: "Mix a new, less-obvious problem with a contrast case and log the reasoning layer.", confidence: "low", evidence: [] }
      : { layer: null, reason: "There is not enough layer-specific evidence yet.", recommendation: "Log which reasoning layer this attempt exercises before assigning a harder problem.", confidence: "low", evidence: [] };
  }

  function getConfidenceCalibration(workspace) {
    const all = workspace.problems.flatMap((problem) => problem.attempts);
    const reported = all.filter((attempt) => attempt.confidencePercent !== null && attempt.confidencePercent !== undefined && Number.isFinite(Number(attempt.confidencePercent)) && attempt.confidenceClaim);
    const checked = reported.filter((attempt) =>
      ["supported", "contradicted"].includes(attempt.confidenceOutcome) && attempt.validationSource && attempt.validationSource !== "Self-assessed"
    );
    const brierScore = checked.length
      ? checked.reduce((sum, attempt) => {
        const predicted = Number(attempt.confidencePercent) / 100;
        const observed = attempt.confidenceOutcome === "supported" ? 1 : 0;
        return sum + (predicted - observed) ** 2;
      }, 0) / checked.length
      : null;
    return {
      reported: reported.length,
      checked: checked.length,
      brierScore,
      highConfidenceContradictions: checked.filter((attempt) => attempt.confidenceOutcome === "contradicted" && Number(attempt.confidencePercent) >= 80).length,
      lowConfidenceSupport: checked.filter((attempt) => attempt.confidenceOutcome === "supported" && Number(attempt.confidencePercent) <= 50).length
    };
  }

  return {
    VERSION,
    NODE_TYPES: [...NODE_TYPES],
    EDGE_TYPES: [...EDGE_TYPES],
    REVIEW_TYPES: [...REVIEW_TYPES],
    REASONING_LAYERS: [...REASONING_LAYERS],
    REASONING_RESULTS: [...REASONING_RESULTS],
    BLOCKERS: [...BLOCKERS],
    VALIDATION_SOURCES: [...VALIDATION_SOURCES],
    emptyFields,
    makeId,
    dateKey,
    emptySchedule,
    createProblem,
    createWorkspace,
    createSnapshotQueue,
    migrateLegacy,
    normalizeWorkspace,
    getProblem,
    setActiveProblem,
    addProblem,
    saveProblem,
    recommendIntervention,
    suggestInterventionFromNotes,
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
    transferMetrics,
    problemIdentity,
    diagnoseAttempt,
    getRecurringDiagnoses,
    getRecoveryCandidates,
    getReasoningLayerProgress,
    getLearningGapCandidates,
    getNextPracticeFocus,
    getConfidenceCalibration
  };
});
