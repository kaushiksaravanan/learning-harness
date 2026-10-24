"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../cp-workspace-core.js");

function savedProblem(workspace, title, now = new Date("2026-01-01T12:00:00")) {
  const { workspace: withProblem, problem } = core.addProblem(workspace, { problemTitle: title }, now);
  return { workspace: withProblem, problem };
}

test("migrates the former single-problem browser record", () => {
  const migrated = core.normalizeWorkspace({
    version: 1,
    fields: { problemTitle: "Old draft", problemText: "statement" },
    patterns: [{ name: "Monotonicity", trigger: "Check the predicate", recovery: "Prove it", repetitions: 2, interval: 6, ease: 2.4, nextReview: "2026-01-07" }]
  });

  assert.equal(migrated.version, 2);
  assert.equal(migrated.problems.length, 1);
  assert.equal(migrated.problems[0].fields.problemTitle, "Old draft");
  assert.equal(migrated.problems[0].cards[0].schedule.repetitions, 2);
  assert.equal(migrated.problems[0].cards[0].schedule.nextReview, "2026-01-07");
});

test("keeps multiple problems under distinct stable IDs", () => {
  const first = core.createWorkspace(new Date("2026-01-01T12:00:00"));
  const one = core.saveProblem(first, first.activeProblemId, { problemTitle: "A" });
  const { workspace: two, problem } = savedProblem(one, "B");

  assert.equal(two.problems.length, 2);
  assert.notEqual(two.problems[0].id, problem.id);
  assert.equal(two.activeProblemId, problem.id);
  assert.equal(core.getProblem(two, two.problems[0].id).fields.problemTitle, "A");
});

test("appends attempt history and keeps independent reasoning dimensions", () => {
  let workspace = core.createWorkspace();
  workspace = core.saveProblem(workspace, workspace.activeProblemId, { problemTitle: "Transfer test" });
  const first = core.recordAttempt(workspace, workspace.activeProblemId, { result: "Unsolved", hintLevel: 2, approachUnaided: false });
  const second = core.recordAttempt(first.workspace, workspace.activeProblemId, {
    result: "Solved", unseen: true, approachUnaided: true, justified: true, proofSound: false,
    implementationCorrect: true, timeMinutes: 24, mode: "Timed"
  });

  assert.equal(core.getProblem(second.workspace).attempts.length, 2);
  assert.equal(second.event.approachUnaided, true);
  assert.equal(second.event.proofSound, false);
  assert.equal(second.event.implementationCorrect, true);
});

test("records contrastive reasoning and keeps feedback provenance explicit", () => {
  const workspace = core.createWorkspace();
  const recorded = core.recordAttempt(workspace, workspace.activeProblemId, {
    unseen: true,
    distinguishedNearMiss: true,
    nearMissResponse: "The predicate is not monotone, so binary search is invalid.",
    validationSource: "Coach reviewed proof",
    validationEvidence: "Coach note: checked endpoint transitions and counterexample."
  });
  assert.equal(recorded.event.nearMissResponse.includes("not monotone"), true);
  assert.equal(recorded.event.validationSource, "Coach reviewed proof");
  assert.match(recorded.event.validationEvidence, /counterexample/);
  assert.equal(core.transferMetrics(recorded.workspace).coachReviewed, 1);
});

test("merges the same typed mistake across problems and finds recurrence", () => {
  let workspace = core.createWorkspace();
  const firstId = workspace.activeProblemId;
  let first = core.addGraphNode(workspace, { type: "mistake", label: "Assumes feasibility is monotone", problemId: firstId });
  workspace = first.workspace;
  const second = savedProblem(workspace, "Second problem");
  workspace = second.workspace;
  const merged = core.addGraphNode(workspace, { type: "mistake", label: "assumes feasibility is monotone", problemId: second.problem.id });

  assert.equal(merged.merged, true);
  assert.equal(merged.workspace.graph.nodes.length, 1);
  assert.deepEqual(new Set(core.getRecurringMistakes(merged.workspace)[0].problemIds), new Set([firstId, second.problem.id]));
});

test("links per-problem review cards to one shared pattern graph node", () => {
  let workspace = core.createWorkspace();
  const firstProblemId = workspace.activeProblemId;
  const firstNode = core.addGraphNode(workspace, { type: "pattern", label: "Check the invariant", problemId: firstProblemId });
  workspace = firstNode.workspace;
  const firstCard = core.addCard(workspace, firstProblemId, { name: "Check the invariant", patternNodeId: firstNode.node.id });
  workspace = firstCard.workspace;
  const secondProblem = savedProblem(workspace, "A different statement");
  const linkedNode = core.addGraphNode(secondProblem.workspace, { type: "pattern", label: "check the invariant", problemId: secondProblem.problem.id });
  const secondCard = core.addCard(linkedNode.workspace, secondProblem.problem.id, { name: "Check the invariant", patternNodeId: linkedNode.node.id });
  const cards = core.getAllCards(secondCard.workspace);

  assert.equal(linkedNode.merged, true);
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map((card) => card.patternNodeId), [firstNode.node.id, firstNode.node.id]);
  assert.equal(core.getRecurringMistakes(secondCard.workspace).length, 0);
  assert.equal(secondCard.workspace.graph.nodes[0].problemIds.length, 2);
});

test("typed graph edges are traversable and reject invalid endpoints", () => {
  let workspace = core.createWorkspace();
  const p = workspace.activeProblemId;
  const concept = core.addGraphNode(workspace, { type: "concept", label: "Monotone predicate", problemId: p });
  const recovery = core.addGraphNode(concept.workspace, { type: "recovery", label: "Prove both directions", problemId: p });
  const linked = core.addGraphEdge(recovery.workspace, { from: concept.node.id, to: recovery.node.id, relation: "supports", problemId: p });

  assert.equal(core.getGraphNeighbors(linked.workspace, concept.node.id, "out")[0].node.id, recovery.node.id);
  assert.throws(() => core.addGraphEdge(linked.workspace, { from: "missing", to: recovery.node.id, relation: "supports" }), /existing nodes/);
});

test("review queue collects due cards across all problems", () => {
  let workspace = core.createWorkspace();
  const firstId = workspace.activeProblemId;
  const firstCard = core.addCard(workspace, firstId, { name: "First card", trigger: "cue", recovery: "answer" });
  workspace = core.updateCard(firstCard.workspace, firstCard.card.id, { readyForReview: true, schedule: { nextReview: "2026-02-01" } });
  const second = savedProblem(workspace, "Second problem");
  const secondCard = core.addCard(second.workspace, second.problem.id, { name: "Second card", readyForReview: true });
  workspace = secondCard.workspace;

  const due = core.getDueCards(workspace, "2026-02-01");
  assert.deepEqual(due.map((card) => card.name).sort(), ["First card", "Second card"]);
});

test("archived cards leave the due queue without erasing review events", () => {
  let workspace = core.createWorkspace();
  const problemId = workspace.activeProblemId;
  const created = core.addCard(workspace, problemId, { name: "Keep history", trigger: "cue", recovery: "answer" });
  workspace = core.updateCard(created.workspace, created.card.id, { readyForReview: true });
  const rated = core.applyReview(workspace, {
    eventId: "archive-review",
    cardId: created.card.id,
    attempted: true,
    revealed: true,
    recallAttempt: "I recalled it",
    quality: 4
  }, new Date("2026-01-01T12:00:00"));
  const archived = core.archiveCard(rated.workspace, created.card.id);

  assert.equal(core.getDueCards(archived, "2026-01-02").length, 0);
  assert.equal(archived.reviewEvents.length, 1);
  assert.equal(core.getAllCards(archived)[0].archived, true);
});

test("SM-2 schedules success intervals and resets a failed retrieval", () => {
  const now = new Date(2026, 0, 1, 12);
  const first = core.calculateSM2(core.emptySchedule(), 5, now);
  const second = core.calculateSM2(first, 4, new Date(2026, 0, 2, 12));
  const third = core.calculateSM2(second, 4, new Date(2026, 0, 8, 12));
  const fail = core.calculateSM2(third, 2, new Date(2026, 0, 9, 12));

  assert.equal(first.intervalDays, 1);
  assert.equal(second.intervalDays, 6);
  assert.ok(third.intervalDays > second.intervalDays);
  assert.equal(fail.repetitions, 0);
  assert.equal(fail.intervalDays, 1);
  assert.ok(fail.easeFactor >= 1.3);
});

test("review ratings require retrieval and reveal, and repeated event IDs do not reschedule", () => {
  let workspace = core.createWorkspace();
  const problemId = workspace.activeProblemId;
  const created = core.addCard(workspace, problemId, { name: "Check monotonicity", trigger: "Before binary search", recovery: "Prove the predicate" });
  workspace = core.updateCard(created.workspace, created.card.id, { readyForReview: true });
  const base = { eventId: "review-once", cardId: created.card.id, attempted: true, revealed: true, recallAttempt: "I checked the predicate", quality: 5, mode: "Untimed" };

  assert.throws(() => core.applyReview(workspace, { ...base, attempted: false }), /retrieval attempt/);
  assert.throws(() => core.applyReview(workspace, { ...base, revealed: false }), /Reveal the recovery/);
  const first = core.applyReview(workspace, base, new Date(2026, 0, 1, 12));
  const duplicate = core.applyReview(first.workspace, base, new Date(2026, 0, 2, 12));

  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.workspace.reviewEvents.length, 1);
  assert.equal(core.getAllCards(duplicate.workspace)[0].schedule.repetitions, 1);
});

test("transfer metrics count each skill dimension separately", () => {
  let workspace = core.createWorkspace();
  const problemId = workspace.activeProblemId;
  workspace = core.recordAttempt(workspace, problemId, { unseen: true, patternId: "binary-search", approachUnaided: true, hintLevel: 0, justified: true, proofSound: true, implementationCorrect: true, result: "Solved" }).workspace;
  workspace = core.recordAttempt(workspace, problemId, { unseen: true, patternId: "binary-search", approachUnaided: false, hintLevel: 3, justified: true, proofSound: false, implementationCorrect: true, result: "Solved" }).workspace;
  workspace = core.recordAttempt(workspace, problemId, { unseen: false, patternId: "binary-search", approachUnaided: true, hintLevel: 0, result: "Solved" }).workspace;
  const metrics = core.transferMetrics(workspace, "binary-search");

  assert.equal(metrics.eligible, 2);
  assert.equal(metrics.unpromptedRecognition, 1);
  assert.equal(metrics.applicabilityJustified, 2);
  assert.equal(metrics.proofSound, 1);
  assert.equal(metrics.solved, 2);
});

test("another hint requires a learner response and appends a hint event", () => {
  const workspace = core.createWorkspace();
  const problemId = workspace.activeProblemId;
  assert.throws(() => core.recordHint(workspace, problemId, { level: 1, text: "Check the bounds" }, "   "), /next reasoning step/);
  const logged = core.recordHint(workspace, problemId, { level: 1, text: "Check the bounds" }, "I tested n = 1");
  assert.equal(core.getProblem(logged.workspace).hintEvents.length, 1);
  assert.equal(logged.event.learnerResponse, "I tested n = 1");
});
