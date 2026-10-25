"use strict";

(function expose(root, build) {
  const api = build();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CPWorkspaceCore = api;
})(typeof globalThis === "undefined" ? this : globalThis, function buildCore() {
  const VERSION = 4;
  const NODE_TYPES = new Set(["problem", "concept", "pattern", "mistake", "recovery", "check"]);
  const EDGE_TYPES = new Set(["requires", "supports", "leads to", "blocks", "is detected by", "recovers from", "implements", "shares a principle", "is a near-miss for"]);
  const VALIDATION_SOURCES = new Set(["Self-assessed", "Online judge accepted", "Counterexample tested", "Coach reviewed proof", "Official analysis checked"]);
  const REVIEW_TYPES = new Set(["basic", "reasoning", "discrimination", "transfer"]);
  const REASONING_LAYERS = new Set(["definition", "mechanics", "derivation", "recognition", "discrimination", "implementation", "transfer"]);
  const REASONING_RESULTS = new Set(["independent", "with-cue", "not-yet", "untested"]);
  const HELP_BEFORE_APPROACH = new Set(["none", "general-question", "strategic-cue", "partial-solution", "unknown"]);
  const INTERVENTION_EVALUATIONS = new Set(["pending", "met", "partial", "not-met", "unclear"]);
  const DIAGNOSIS_STATES = new Set(["unreviewed", "mention-only", "suspected", "confirmed", "ruled-out", "self-corrected"]);
  const DIAGNOSIS_SOURCES = new Set(["learner", "coach", "chat-model", "other"]);
  const TRANSFER_DISTANCES = new Set(["practice", "reconstruction", "near", "far", "unknown"]);
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
      pattern: /\b(assum(?:e|ed|ing).{0,48}(?:monoton\w*|greedy)|without (?:proving|checking).{0,32}(?:monoton\w*|invariant|greedy|valid)|did not prove.{0,32}(?:monoton\w*|invariant))\b/i,
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
        state: "mention",
        source: "text-rule",
        evidence: source.slice(start, end).trim()
      }];
    });
  }

  function normalizeAttempt(attempt = {}) {
    const helpBeforeApproach = HELP_BEFORE_APPROACH.has(attempt.helpBeforeApproach) ? attempt.helpBeforeApproach : "unknown";
    const diagnosisReview = attempt.diagnosisReview && typeof attempt.diagnosisReview === "object" ? attempt.diagnosisReview : {};
    const status = DIAGNOSIS_STATES.has(diagnosisReview.status) ? diagnosisReview.status : "unreviewed";
    return {
      ...attempt,
      helpBeforeApproach,
      approachUnaided: helpBeforeApproach === "none" ? true : helpBeforeApproach === "unknown" ? null : false,
      interventionEvaluation: INTERVENTION_EVALUATIONS.has(attempt.interventionEvaluation) ? attempt.interventionEvaluation : "pending",
      interventionEvaluationSource: DIAGNOSIS_SOURCES.has(attempt.interventionEvaluationSource) ? attempt.interventionEvaluationSource : "other",
      interventionEvidence: String(attempt.interventionEvidence || ""),
      interventionNextAction: attempt.interventionNextAction || null,
      diagnosisReview: {
        status,
        source: DIAGNOSIS_SOURCES.has(diagnosisReview.source) ? diagnosisReview.source : "other",
        evidence: String(diagnosisReview.evidence || ""),
        candidateIds: Array.isArray(diagnosisReview.candidateIds) ? diagnosisReview.candidateIds : [],
        reviewedAt: diagnosisReview.reviewedAt || null
      },
      diagnosisCandidates: Array.isArray(attempt.diagnosisCandidates) ? attempt.diagnosisCandidates.map((candidate) => ({
        ...candidate,
        state: DIAGNOSIS_STATES.has(candidate.state) ? candidate.state : "mention",
        source: candidate.source || "text-rule"
      })) : [],
      transferDistance: TRANSFER_DISTANCES.has(attempt.transferDistance) ? attempt.transferDistance : "unknown",
      priorExposureAt: attempt.priorExposureAt || null
    };
  }

  function normalizeProblem(problem = {}) {
    const id = problem.id || makeId("problem");
    return {
      id,
      createdAt: problem.createdAt || new Date().toISOString(),
      updatedAt: problem.updatedAt || new Date().toISOString(),
      fields: { ...emptyFields(), ...(problem.fields || {}) },
      attempts: Array.isArray(problem.attempts) ? problem.attempts.map(normalizeAttempt) : [],
      cards: Array.isArray(problem.cards) ? problem.cards.map((card) => normalizeCard(card, id)) : [],
      hintEvents: Array.isArray(problem.hintEvents) ? problem.hintEvents : [],
      confidencePredictions: Array.isArray(problem.confidencePredictions) ? problem.confidencePredictions : []
    };
  }

  function createProblem(fields = {}, now = new Date()) {
    const iso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    return normalizeProblem({ id: makeId("problem"), createdAt: iso, updatedAt: iso, fields, attempts: [], cards: [], hintEvents: [], confidencePredictions: [] });
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

  function migrateV3(raw = {}) {
    const migrated = migrateV2(raw);
    return { ...migrated, migratedFrom: 3 };
  }

  function normalizeWorkspace(raw) {
    if (!raw || typeof raw !== "object") return createWorkspace();
    if (raw.version === 1 && raw.fields) return migrateLegacy(raw);
    if (raw.version === 2) return migrateV2(raw);
    if (raw.version === 3) return migrateV3(raw);
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
        prompt: "No targeted cue yet. Keep solving, or choose the closest blocker above to get one focused prompt.",
        successCriterion: "The learner names a specific uncertainty or continues with a testable next step.",
        supportLevel: "general-question"
      },
      "problem-model": {
        kind: "restatement",
        title: "Make the problem concrete",
        prompt: "Restate the required output in your own words. Work one tiny input by hand and name what information the answer depends on.",
        successCriterion: "The learner states the output precisely and traces a small example without changing the task.",
        supportLevel: "general-question"
      },
      mechanics: {
        kind: "worked-example",
        title: "Build the mechanism on a small case",
        prompt: "Use a tiny example and write each state change in a table. Then predict the next step before revealing or computing it.",
        successCriterion: "The learner predicts and explains the next state transition on a new small case.",
        supportLevel: "strategic-cue"
      },
      approach: {
        kind: "derivation",
        title: "Start from a baseline",
        prompt: "Describe the simplest correct approach. Estimate its time cost from the constraints, then identify which repeated work or representation might reduce that cost.",
        successCriterion: "The learner gives a correct baseline, estimates its cost, and proposes a change tied to a specific bottleneck.",
        supportLevel: "general-question"
      },
      proof: {
        kind: "proof",
        title: "Find the proof obligation",
        prompt: "State what must remain true after each step. Try to construct the smallest counterexample to your claim, then repair the invariant.",
        successCriterion: "The learner states a relevant invariant or precondition and explains why it is preserved or supplies a valid counterexample.",
        supportLevel: "strategic-cue"
      },
      implementation: {
        kind: "trace",
        title: "Trace the first divergence",
        prompt: "Choose the smallest failing input. Write expected and actual state after each operation; identify the first point where they differ before editing.",
        successCriterion: "The learner predicts state changes, locates the first divergence, and names a test before editing.",
        supportLevel: "strategic-cue"
      },
      complexity: {
        kind: "complexity",
        title: "Estimate work before optimizing",
        prompt: "Count the dominant operations at the maximum input size. Identify the bottleneck, then compare one alternative representation or data structure.",
        successCriterion: "The learner estimates the dominant work at maximum constraints and links a proposed change to that bottleneck.",
        supportLevel: "strategic-cue"
      },
      "recurring-mistake": {
        kind: "retrieval",
        title: "Retrieve an earlier recovery move",
        prompt: "Before seeing any explanation, recall an earlier problem where this kind of failure appeared. What warning sign and check helped you recover?",
        successCriterion: "The learner recalls the previous warning sign and recovery check, then applies the check here.",
        supportLevel: "strategic-cue"
      },
      prerequisite: {
        kind: "worked-example",
        title: "Repair one prerequisite",
        prompt: "Use a short worked example to establish the missing definition or mechanism. Then solve the next tiny case with one step removed from the example.",
        successCriterion: "After the example, the learner correctly solves a changed small case with one step of support removed.",
        supportLevel: "partial-solution"
      },
      independent: {
        kind: "continue",
        title: "Continue independently",
        prompt: "No intervention is needed now. Continue your attempt and record the next decision only if you become blocked.",
        successCriterion: "The learner continues without a cue and records a new checkpoint only if progress stops.",
        supportLevel: "none"
      }
    };
    const key = BLOCKERS.has(blocker) ? blocker : "undetermined";
    const intervention = { blocker: key, ...interventions[key] };
    if (key === "recurring-mistake") {
      const prior = workspace.problems
        .flatMap((problem) => problem.attempts.map((attempt) => ({ problem, attempt })))
        .filter(({ problem, attempt }) => problem.id !== problemId && attempt.diagnosisReview?.status === "confirmed" && (attempt.diagnosisCandidates || []).some((candidate) => candidate.state === "confirmed" && (!diagnosisId || candidate.id === diagnosisId)))
        .sort((a, b) => String(b.attempt.createdAt || "").localeCompare(String(a.attempt.createdAt || "")))[0];
      if (prior) {
        const candidate = prior.attempt.diagnosisCandidates.find((item) => !diagnosisId || item.id === diagnosisId);
        intervention.priorSignal = { problemId: prior.problem.id, attemptId: prior.attempt.id, label: candidate.label };
        intervention.prompt = `Recall the earlier issue tagged “${candidate.label}” from ${prior.problem.fields.problemTitle || "another problem"}. What trigger and recovery check did you use? Try to state it before opening that attempt.`;
      }
    }
    return intervention;
  }

  function recommendFollowup(evaluation, response) {
    const result = INTERVENTION_EVALUATIONS.has(evaluation) ? evaluation : "pending";
    const hasResponse = Boolean(String(response || "").trim());
    const actions = {
      met: { action: "fade", prompt: "The success criterion appears met from the recorded evaluation. Fade support: ask the learner to reconstruct the reasoning on a changed example without repeating this cue." },
      partial: { action: "isolate-next-step", prompt: "Keep the demonstrated step and isolate the next missing step. Ask one targeted question about that step, then evaluate the new response against a narrower success criterion." },
      "not-met": { action: "teach-prerequisite", prompt: "Switch to a small worked example for the missing prerequisite. Explain one step, then ask the learner to complete a changed example with that step removed." },
      unclear: { action: "request-evidence", prompt: "The response does not yet show whether the criterion was met. Ask for a concrete example, derivation, trace, or test that distinguishes the likely gaps." },
      pending: { action: "await-response", prompt: "Wait for a learner response and compare it with the stated success criterion before choosing the next intervention." }
    };
    if (!hasResponse && result !== "pending") return { ...actions.unclear, evaluation: "unclear" };
    return { ...actions[result], evaluation: result };
  }

  function classifyDiagnosisCandidates(diagnosisCandidates, priorSignals, identity) {
    const reviewed = diagnosisCandidates.filter((candidate) => ["suspected", "confirmed"].includes(candidate.state));
    const recurringCandidate = reviewed.find((candidate) => candidate.state === "confirmed" && priorSignals.some((signal) =>
      signal.candidate.id === candidate.id && signal.candidate.state === "confirmed" && signal.attempt.diagnosisReview?.status === "confirmed" && problemIdentity(signal.problem.fields) !== identity
    ));
    if (recurringCandidate) return { blocker: "recurring-mistake", diagnosisId: recurringCandidate.id };
    const firstCandidate = reviewed[0];
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
      source: blocker === "undetermined" ? diagnosisCandidates.length ? "text-mention-only" : "not-classified" : "reviewed-provisional",
      confidence: blocker === "undetermined" ? "unknown" : "provisional",
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
    let diagnosisReviewStatus = DIAGNOSIS_STATES.has(attempt.diagnosisReviewStatus) ? attempt.diagnosisReviewStatus : "unreviewed";
    const diagnosisReviewSource = DIAGNOSIS_SOURCES.has(attempt.diagnosisReviewSource) ? attempt.diagnosisReviewSource : "other";
    const diagnosisReviewId = String(attempt.diagnosisReviewId || "");
    const diagnosisReviewEvidence = String(attempt.diagnosisReviewEvidence || "");
    if (["suspected", "confirmed", "ruled-out", "self-corrected"].includes(diagnosisReviewStatus) && !diagnosisReviewId) diagnosisReviewStatus = "mention-only";
    if (["suspected", "confirmed", "ruled-out", "self-corrected"].includes(diagnosisReviewStatus) && !diagnosisReviewEvidence.trim()) diagnosisReviewStatus = "mention-only";
    if (diagnosisReviewStatus === "confirmed" && (!diagnosisReviewEvidence.trim() || !["coach", "chat-model"].includes(diagnosisReviewSource))) diagnosisReviewStatus = "suspected";
    const diagnosisCandidates = diagnoseAttempt(diagnosisText).map((candidate) => ({
      ...candidate,
      state: candidate.id === diagnosisReviewId && diagnosisReviewStatus !== "unreviewed" ? diagnosisReviewStatus : "mention",
      reviewSource: candidate.id === diagnosisReviewId ? diagnosisReviewSource : null,
      createdAt
    }));
    const currentDiagnosisIds = new Set(diagnosisCandidates.filter((candidate) => ["suspected", "confirmed"].includes(candidate.state)).map((candidate) => candidate.id));
    const priorSignals = workspace.problems.flatMap((item) => item.attempts.flatMap((previous) =>
      (previous.diagnosisCandidates || []).map((candidate) => ({ candidate, attempt: previous, problem: item }))
    ));
    const requestedBlocker = BLOCKERS.has(attempt.blocker) ? attempt.blocker : "undetermined";
    const inferredBlocker = classifyDiagnosisCandidates(diagnosisCandidates, priorSignals, identity).blocker;
    const blocker = requestedBlocker === "undetermined" ? inferredBlocker : requestedBlocker;
    const blockerSource = requestedBlocker !== "undetermined"
      ? "learner-selected"
      : blocker !== "undetermined" ? "reviewed-provisional" : diagnosisCandidates.length ? "text-mention-only" : "not-classified";
    const blockerConfidence = blockerSource === "learner-selected" ? "self-reported" : blockerSource === "reviewed-provisional" ? "provisional" : "unknown";
    // Preserve the prompt the learner actually saw. Phrase mentions are
    // computed from submitted notes and must not be presented as diagnoses.
    const promptBlocker = BLOCKERS.has(attempt.intervention?.blocker)
      ? attempt.intervention.blocker
      : blocker;
    const intervention = attempt.intervention && typeof attempt.intervention === "object"
      ? { ...attempt.intervention }
      : recommendIntervention(workspace, promptBlocker, problemId, attempt.intervention?.diagnosisId);
    const interventionEvaluation = INTERVENTION_EVALUATIONS.has(attempt.interventionEvaluation)
      ? attempt.interventionEvaluation
      : "pending";
    const interventionResponse = String(attempt.interventionResponse || "");
    const interventionNextAction = recommendFollowup(interventionEvaluation, interventionResponse);
    const helpBeforeApproach = HELP_BEFORE_APPROACH.has(attempt.helpBeforeApproach) ? attempt.helpBeforeApproach : "unknown";
    const transferDistance = TRANSFER_DISTANCES.has(attempt.transferDistance) ? attempt.transferDistance : "unknown";
    const priorAttempts = identity
      ? workspace.problems.flatMap((item) => item.attempts.filter((previous) => (previous.problemKey || problemIdentity(item.fields)) === identity))
      : [];
    const priorExposureAt = String(attempt.priorExposureAt || priorAttempts.at(-1)?.createdAt || "") || null;
    const confidenceValue = attempt.confidencePercent === "" || attempt.confidencePercent === null || attempt.confidencePercent === undefined
      ? null
      : Number(attempt.confidencePercent);
    const confidencePercent = Number.isFinite(confidenceValue) ? Math.max(0, Math.min(100, confidenceValue)) : null;
    const timeBreakdown = Object.fromEntries(["understanding", "approach", "implementation", "verification"].map((key) => {
      const value = Number(attempt.timeBreakdown?.[key]);
      return [key, Number.isFinite(value) ? Math.max(0, value) : 0];
    }));
    const recoveryCandidates = DIAGNOSIS_RULES.flatMap((rule) => {
      const prior = priorSignals.filter((signal) => signal.candidate.id === rule.id && signal.candidate.state === "confirmed" && signal.attempt.diagnosisReview?.status === "confirmed");
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
      interventionResponse,
      interventionEvaluation,
      interventionEvaluationSource: DIAGNOSIS_SOURCES.has(attempt.interventionEvaluationSource) ? attempt.interventionEvaluationSource : "other",
      interventionEvidence: String(attempt.interventionEvidence || ""),
      interventionNextAction,
      diagnosisReview: {
        status: diagnosisReviewStatus,
        source: diagnosisReviewSource,
        evidence: diagnosisReviewEvidence,
        candidateIds: diagnosisReviewId ? [diagnosisReviewId] : []
      },
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
      helpBeforeApproach,
      approachUnaided: helpBeforeApproach === "none" ? true : helpBeforeApproach === "unknown" ? null : false,
      approachSupportSource: "explicit-learner-report",
      transferDistance,
      attemptsBefore: priorAttempts.length,
      priorExposureAt,
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
          if (!candidate?.id || !candidate.label || !["suspected", "confirmed"].includes(candidate.state)) continue;
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
            excerpt: candidate.evidence || "",
            state: candidate.state,
            reviewSource: candidate.reviewSource || attempt.diagnosisReview?.source || "other"
          });
        }
      }
    }
    return [...groups.values()]
      .map((group) => ({ ...group, problemIds: [...group.problemIds], problemKeys: [...group.problemKeys] }))
      .filter((group) => group.problemKeys.length >= minProblems)
      .sort((a, b) => b.problemKeys.length - a.problemKeys.length || a.label.localeCompare(b.label));
  }

  function confirmDiagnosisGroup(workspace, diagnosisId, problemIds, evidence, now = new Date()) {
    const ids = new Set(Array.isArray(problemIds) ? problemIds : []);
    const evidenceByProblem = evidence && typeof evidence === "object" && !Array.isArray(evidence) ? evidence : {};
    const fallbackEvidence = typeof evidence === "string" ? evidence.trim() : "";
    if (!diagnosisId || !ids.size) throw new Error("Choose a diagnosis and its linked problem records");
    if ([...ids].some((problemId) => !String(evidenceByProblem[problemId] || fallbackEvidence).trim())) throw new Error("Record the evidence used to confirm this diagnosis for each linked problem");
    const reviewedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const updated = {
      ...workspace,
      problems: workspace.problems.map((problem) => ids.has(problem.id)
        ? {
          ...problem,
          attempts: problem.attempts.map((attempt) => {
            const hasCandidate = (attempt.diagnosisCandidates || []).some((candidate) => candidate.id === diagnosisId && ["suspected", "confirmed"].includes(candidate.state));
            if (!hasCandidate) return attempt;
            const existingIds = attempt.diagnosisReview?.candidateIds || [];
            const candidateEvidence = String(evidenceByProblem[problem.id] || fallbackEvidence).trim();
            return {
              ...attempt,
              diagnosisReview: {
                ...(attempt.diagnosisReview || {}),
                status: "confirmed",
                source: "coach",
                evidence: candidateEvidence,
                candidateIds: [...new Set([...existingIds, diagnosisId])],
                reviewedAt
              },
              diagnosisCandidates: attempt.diagnosisCandidates.map((candidate) => candidate.id === diagnosisId
                ? { ...candidate, state: "confirmed", reviewSource: "coach", reviewedAt }
                : candidate)
            };
          }),
          updatedAt: reviewedAt
        }
        : problem)
    };
    return { workspace: updated, reviewedAt };
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
    const allAttempts = [];
    const practiceAttempts = [];
    const reconstructionAttempts = [];
    const seenReconstructions = new Set();
    let unseenClaims = 0;
    let repeatedProblemAttempts = 0;
    let unknownProblemIdentityClaims = 0;
    let legacyUnaidedReports = 0;
    const lastExposureByIdentity = new Map();
    const exposureCountByIdentity = new Map();
    const cardIndex = workspace.problems.flatMap((problem) => problem.cards.map((card) => ({ ...card, ownerProblemId: problem.id })));
    const assistanceCounts = { none: 0, "general-question": 0, "strategic-cue": 0, "partial-solution": 0, unknown: 0 };
    const elapsedDays = (later, earlier) => {
      const diff = new Date(later).getTime() - new Date(earlier).getTime();
      return Number.isFinite(diff) && diff >= 0 ? Math.floor(diff / 86400000) : null;
    };
    for (const record of records) {
      const { attempt, problem, key } = record;
      if (attempt.unseen) unseenClaims += 1;
      const historyKey = key || `record:${problem.id}`;
      const attemptsBefore = exposureCountByIdentity.get(historyKey) || 0;
      const priorExposureAt = attempt.priorExposureAt || lastExposureByIdentity.get(historyKey) || null;
      const first = key ? !seen.has(key) : record.attemptOrder === 0;
      if (key) {
        seen.add(key);
        if (!first) repeatedProblemAttempts += 1;
      } else if (attempt.unseen) {
        unknownProblemIdentityClaims += 1;
      }
      lastExposureByIdentity.set(historyKey, attempt.createdAt || lastExposureByIdentity.get(historyKey));
      exposureCountByIdentity.set(historyKey, attemptsBefore + 1);
      const matchedPattern = !patternId || attempt.patternId === patternId || cardIndex.some((card) => card.patternNodeId === patternId && card.id === attempt.patternId);
      const linkedCard = cardIndex.find((card) => card.id === attempt.patternId || card.patternNodeId === attempt.patternId);
      const matchingReviews = workspace.reviewEvents.filter((event) => {
        const card = cardIndex.find((candidate) => candidate.id === event.cardId);
        const samePattern = attempt.patternId
          ? event.cardId === attempt.patternId || Boolean(card?.patternNodeId && card.patternNodeId === attempt.patternId)
          : event.problemId === problem.id;
        return samePattern && new Date(event.reviewedAt).getTime() <= new Date(attempt.createdAt).getTime();
      }).sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt)));
      const lastPatternReviewAt = matchingReviews[0]?.reviewedAt || null;
      const enriched = {
        ...attempt,
        problemTitle: problem.fields.problemTitle || "Untitled problem",
        problemKey: key || null,
        historyKey,
        attemptsBefore,
        firstAttemptForIdentity: first,
        priorExposureAt,
        daysSinceExposure: priorExposureAt ? elapsedDays(attempt.createdAt, priorExposureAt) : null,
        lastPatternReviewAt,
        daysSinceReview: lastPatternReviewAt ? elapsedDays(attempt.createdAt, lastPatternReviewAt) : null,
        reviewedCardId: linkedCard?.id || null
      };
      if (!patternId || matchedPattern) allAttempts.push(enriched);
      if (attempt.transferDistance === "practice" && (!patternId || matchedPattern)) practiceAttempts.push(enriched);
      if (attempt.transferDistance === "reconstruction" && attemptsBefore > 0 && !attempt.unseen && (!patternId || matchedPattern) && !seenReconstructions.has(historyKey)) {
        reconstructionAttempts.push(enriched);
        seenReconstructions.add(historyKey);
      }
      if (!key) continue;
      if (!first || !attempt.unseen || !matchedPattern) continue;
      attempts.push(enriched);
      if (attempt.helpBeforeApproach) assistanceCounts[attempt.helpBeforeApproach] += 1;
      if (attempt.hintExposureSource !== "timestamped-events" && attempt.approachUnaided === true) legacyUnaidedReports += 1;
    }
    const count = (predicate) => attempts.filter(predicate).length;
    return {
      eligible: attempts.length,
      uniqueFirstSeen: attempts.length,
      allAttempts,
      practiceAttempts,
      reconstruction: reconstructionAttempts.length,
      reconstructionAttempts,
      nearTransfer: count((attempt) => attempt.transferDistance === "near"),
      farTransfer: count((attempt) => attempt.transferDistance === "far"),
      practice: practiceAttempts.length,
      unclassifiedDistance: count((attempt) => attempt.transferDistance === "unknown"),
      unseenClaims,
      repeatedProblemAttempts,
      unknownProblemIdentityClaims,
      legacyUnaidedReports,
      unpromptedRecognition: count((attempt) => attempt.helpBeforeApproach === "none"),
      independentlyCorrected: count((attempt) => attempt.diagnosisReview?.status === "self-corrected"),
      assistanceBeforeApproach: assistanceCounts,
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
      const byProblem = new Map();
      for (const record of attempts) {
        if (record.attempt.focusLayer !== layer) continue;
        const item = byProblem.get(record.identity) || { first: record, latest: record };
        item.latest = record;
        byProblem.set(record.identity, item);
      }
      const recordsByProblem = [...byProblem.values()];
      const firstEvidence = recordsByProblem.map(({ first }) => first);
      const latestEvidence = recordsByProblem.map(({ latest }) => latest);
      const independent = latestEvidence.filter(({ attempt }) => attempt.focusResult === "independent").length;
      const neededSupport = latestEvidence.filter(({ attempt }) => attempt.focusResult === "with-cue" || attempt.focusResult === "not-yet").length;
      const firstIndependent = firstEvidence.filter(({ attempt }) => attempt.focusResult === "independent").length;
      const firstNeededSupport = firstEvidence.filter(({ attempt }) => attempt.focusResult === "with-cue" || attempt.focusResult === "not-yet").length;
      return {
        layer,
        problems: latestEvidence.length,
        independent,
        withCue: latestEvidence.filter(({ attempt }) => attempt.focusResult === "with-cue").length,
        notYet: latestEvidence.filter(({ attempt }) => attempt.focusResult === "not-yet").length,
        firstProblems: firstEvidence.length,
        firstIndependent,
        firstWithCue: firstEvidence.filter(({ attempt }) => attempt.focusResult === "with-cue").length,
        firstNotYet: firstEvidence.filter(({ attempt }) => attempt.focusResult === "not-yet").length,
        firstSupport: firstNeededSupport,
        latestSupport: neededSupport,
        firstEvidence: firstEvidence.map(({ problem, attempt }) => ({ problemId: problem.id, title: problem.fields.problemTitle || "Untitled problem", result: attempt.focusResult, createdAt: attempt.createdAt })),
        latestEvidence: latestEvidence.map(({ problem, attempt }) => ({ problemId: problem.id, title: problem.fields.problemTitle || "Untitled problem", result: attempt.focusResult, createdAt: attempt.createdAt })),
        gap: latestEvidence.length >= 2 && neededSupport > independent,
        confidence: latestEvidence.length >= 4 && neededSupport >= independent * 2 ? "medium" : "low",
        evidence: latestEvidence.map(({ problem, attempt }) => ({
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
        reason: `First checkpoint: ${gap.firstSupport} of ${gap.firstProblems} identified problems needed support; latest checkpoint: ${gap.latestSupport} of ${gap.problems} still need support.`,
        recommendation: `Choose a new problem to ${names[gap.layer]}.`,
        evidence: gap.evidence,
        confidence: gap.confidence
      };
    }
    const observed = getReasoningLayerProgress(workspace).reduce((sum, item) => sum + item.problems, 0);
    return observed
      ? { layer: null, reason: "No repeated support gap is visible in the latest identified-problem evidence. First and latest checkpoints remain available for comparison.", recommendation: "Mix a new, less-obvious problem with a contrast case and log the reasoning layer.", confidence: "low", evidence: [] }
      : { layer: null, reason: "There is not enough layer-specific evidence yet.", recommendation: "Log which reasoning layer this attempt exercises before assigning a harder problem.", confidence: "low", evidence: [] };
  }

  function recordConfidencePrediction(workspace, problemId, input = {}, now = new Date()) {
    const problem = getProblem(workspace, problemId);
    if (!problem) throw new Error("Unknown problem ID");
    const claim = String(input.claim || "").trim();
    if (input.confidencePercent === "" || input.confidencePercent === null || input.confidencePercent === undefined) throw new Error("Record a confidence percentage before saving a prediction");
    const confidencePercent = Number(input.confidencePercent);
    if (!claim) throw new Error("Record a claim before saving a confidence prediction");
    if (!Number.isFinite(confidencePercent) || confidencePercent < 0 || confidencePercent > 100) throw new Error("Confidence must be between 0 and 100");
    const predictedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const prediction = {
      id: input.id || makeId("confidence"),
      claim,
      confidencePercent,
      rationale: String(input.rationale || ""),
      predictedAt,
      attemptId: input.attemptId || null,
      outcomes: []
    };
    return {
      workspace: {
        ...workspace,
        problems: workspace.problems.map((item) => item.id === problemId
          ? { ...item, confidencePredictions: [...(item.confidencePredictions || []), prediction], updatedAt: predictedAt }
          : item)
      },
      prediction
    };
  }

  function recordConfidenceOutcome(workspace, problemId, predictionId, input = {}, now = new Date()) {
    const problem = getProblem(workspace, problemId);
    if (!problem) throw new Error("Unknown problem ID");
    const prediction = (problem.confidencePredictions || []).find((item) => item.id === predictionId);
    if (!prediction) throw new Error("Choose a saved confidence prediction");
    if (prediction.outcomes?.length) throw new Error("This prediction already has an outcome; save a new prediction before recording another");
    const outcome = ["supported", "contradicted"].includes(input.outcome) ? input.outcome : null;
    if (!outcome) throw new Error("Choose whether the claim was supported or contradicted");
    const feedbackSource = VALIDATION_SOURCES.has(input.feedbackSource) ? input.feedbackSource : "Self-assessed";
    if (feedbackSource !== "Self-assessed" && !String(input.evidence || "").trim()) throw new Error("Record the evidence or reference for this non-self feedback source");
    const requestedAt = now instanceof Date ? now.getTime() : new Date(now).getTime();
    const predictedAt = new Date(prediction.predictedAt).getTime();
    const evaluatedAt = new Date(Math.max(requestedAt, predictedAt + 1)).toISOString();
    const event = {
      id: makeId("confidence-outcome"),
      outcome,
      feedbackSource,
      evidence: String(input.evidence || ""),
      evaluatedAt
    };
    return {
      workspace: {
        ...workspace,
        problems: workspace.problems.map((item) => item.id === problemId
          ? {
            ...item,
            confidencePredictions: item.confidencePredictions.map((saved) => saved.id === predictionId
              ? { ...saved, outcomes: [...(saved.outcomes || []), event] }
              : saved),
            updatedAt: evaluatedAt
          }
          : item)
      },
      prediction: { ...prediction, outcomes: [...(prediction.outcomes || []), event] },
      event
    };
  }

  function getConfidenceCalibration(workspace) {
    const reported = workspace.problems.flatMap((problem) => (problem.confidencePredictions || []).map((prediction) => ({ ...prediction, problemId: problem.id })));
    const checked = reported.flatMap((prediction) => (prediction.outcomes || [])
      .filter((outcome) => new Date(outcome.evaluatedAt).getTime() > new Date(prediction.predictedAt).getTime())
      .map((outcome) => ({ ...prediction, outcome }))
    ).filter(({ outcome }) => ["supported", "contradicted"].includes(outcome.outcome) && outcome.feedbackSource && outcome.feedbackSource !== "Self-assessed");
    const brierScore = checked.length
      ? checked.reduce((sum, item) => {
        const predicted = Number(item.confidencePercent) / 100;
        const observed = item.outcome.outcome === "supported" ? 1 : 0;
        return sum + (predicted - observed) ** 2;
      }, 0) / checked.length
      : null;
    return {
      reported: reported.length,
      checked: checked.length,
      brierScore,
      highConfidenceContradictions: checked.filter((item) => item.outcome.outcome === "contradicted" && Number(item.confidencePercent) >= 80).length,
      lowConfidenceSupport: checked.filter((item) => item.outcome.outcome === "supported" && Number(item.confidencePercent) <= 50).length,
      predictions: reported
    };
  }

  return {
    VERSION,
    NODE_TYPES: [...NODE_TYPES],
    EDGE_TYPES: [...EDGE_TYPES],
    REVIEW_TYPES: [...REVIEW_TYPES],
    REASONING_LAYERS: [...REASONING_LAYERS],
    REASONING_RESULTS: [...REASONING_RESULTS],
    HELP_BEFORE_APPROACH: [...HELP_BEFORE_APPROACH],
    INTERVENTION_EVALUATIONS: [...INTERVENTION_EVALUATIONS],
    DIAGNOSIS_STATES: [...DIAGNOSIS_STATES],
    DIAGNOSIS_SOURCES: [...DIAGNOSIS_SOURCES],
    TRANSFER_DISTANCES: [...TRANSFER_DISTANCES],
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
    recommendFollowup,
    suggestInterventionFromNotes,
    recordAttempt,
    recordConfidencePrediction,
    recordConfidenceOutcome,
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
    confirmDiagnosisGroup,
    getRecoveryCandidates,
    getReasoningLayerProgress,
    getLearningGapCandidates,
    getNextPracticeFocus,
    getConfidenceCalibration
  };
});
