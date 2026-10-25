# CP discovery training

Use this reference after a problem's analysis is grounded and before its reusable ideas become review cards. The learner must reconstruct the choices that make the solution work; reading a simulated solver trace is not enough.

The objective is to develop a repeatable process:

> Understand the representation → find the bottleneck → propose a transformation → prove and test it → judge the trade-off → reconstruct it without the example.

Do not pretend to know an expert's private thoughts. Present sourced facts as facts, the learner's actions as observed, and a plausible route as a reconstruction or hypothesis.

## Choose the teaching route

Start from the learner's attempt and the evidence they have shared.

- If the learner has the prerequisites, use **discovery training**. Ask for one decision at a time, beginning with the statement and a small example. Do not name the target algorithm or representation before the learner has tried.
- If a prerequisite is missing, use **guided construction**. Demonstrate the smallest relevant example, explain one step, then remove part of the support and ask the learner to continue. Do not keep asking them to guess a fact they have not learned.
- If the learner is progressing independently, do not interrupt. Ask for a checkpoint at a natural pause.
- If the learner asks for a full explanation or has made a reasonable attempt, disclose the worked reasoning in stages. Finish with reconstruction and an unfamiliar application.

Use the smallest intervention that addresses the current gap:

| Evidence from the learner | Next move |
| --- | --- |
| Cannot explain the output or rules | Ask for a restatement and a tiny hand-worked example. |
| Understands the task but has no approach | Derive a direct baseline, then compare its cost with the constraints. |
| Has a candidate approach but no reason it works | Ask for the invariant, precondition, recurrence meaning, or counterexample. |
| Can prove it but code is wrong | Trace concrete state changes and locate the first divergence before editing. |
| Correct approach but TLE or MLE | Estimate the actual operations or memory, identify the bottleneck, and compare representations. |
| Repeats a previously observed mistake | Offer the old trigger and ask for retrieval before explaining it again. |
| States a likely missing prerequisite | Teach that prerequisite with a worked example, then fade the example. |

Treat inferred gaps as provisional. A diagnosis should point to the shared evidence that caused it and should be corrected when new evidence disagrees.

## Discovery sequence

Run this sequence only as far as the current problem needs. It is a reasoning scaffold, not a checklist that must be recited before every solve.

### 1. Model the task

Ask the learner to state:

- What must be returned or decided?
- What are the input objects and legal operations?
- What would a tiny example produce, and why?
- What details of the statement are constraints rather than story?

If these are unclear, clarify the model before asking for an algorithm.

### 2. Build a baseline

Ask for the simplest correct method, even if it is too slow. Define what it enumerates, what state it keeps, and why it is correct on a small case.

Estimate its time and memory using the stated limits. Write the dominant term and, when useful, a concrete upper-bound operation count. Do not discard a method merely because a faster algorithm is familiar; show which constraint rules it out.

### 3. Find the bottleneck and a useful structure

Ask which repeated work or stored information dominates the baseline. Then ask what property would let the solver avoid that work:

- Is there order, monotonicity, overlap, a local transition, connectivity, or an invariant?
- Can work be reused, grouped, skipped, or represented more compactly?
- What information must remain available to return the requested result?

Generate only a few plausible alternatives. Compare each against the task's required output and constraints.

### 4. Derive a candidate and its proof obligations

Do not stop at an algorithm name. Ask the learner to define each state or data structure in plain language, then derive:

- the exact update or transition;
- the precondition for using the method;
- the invariant that remains true;
- how the result is reconstructed or returned;
- which counterexample would expose a missing condition.

For graph search, distinguish discovery from processing. For DP, distinguish a state definition from a recurrence and its proof. For binary search, prove the check is monotone. For greedy methods, establish the exchange or invariant argument rather than appealing to local plausibility.

### 5. Transform the representation

When code or constraints motivate a different representation, derive it from the original:

1. State what the old representation makes simple and what it costs.
2. State the new representation and show how to encode and decode values.
3. Derive operations, neighbors, or transitions in the new representation.
4. Identify boundary conditions and information that must not be lost.
5. Prove the transformation preserves the behavior the solution needs.

Keep correctness and optimization separate. First establish equivalence; then compare time, memory, implementation risk, and readability. The compact version is not automatically better.

### 6. Implement and verify through hypotheses

Before changing code after WA, TLE, MLE, or RE, ask the learner to record:

`Observation → suspected cause → discriminating test → predicted result → actual result → next action`

The judge verdict is evidence, not a diagnosis. Trace the smallest useful input and predict each state update before running it. Change one thing at a time when that makes the hypothesis testable.

### 7. Reconstruct and fade

After the learner understands a worked route:

1. Hide the optimized code and ask them to derive the representation from the original.
2. Remove one more cue: first the worked step, then the named concept, then the familiar problem context.
3. Ask them to prove the key property and state when the method would fail.
4. Give a different problem that needs the same reasoning move, plus a near-miss where the precondition fails.

Success means independent reconstruction and discrimination on a new problem, not recognition of the old solution.

## Worked discovery example: flattening a grid BFS

Use a standard labyrinth/pathfinding task. Assume the learner already has a correct tuple-based BFS with coordinates `(row, col)`. The purpose is to derive and judge a possible representation change, not to teach BFS from scratch or claim that every solver would make these exact decisions.

Label the route **reconstructed** unless a solver reports that they actually used it. Verify the problem statement, language behavior, and any performance claim before presenting them as fact.

### Starting representation and bottleneck

First ask what the existing BFS stores and guarantees. A queue of `(row, col)` pairs, a visited set, and parent coordinates may be clear and correct. Ask which costs or repeated state are worth investigating. Do not assume tuple BFS is too slow: compare it with the actual limits and runtime.

### Representation challenge

Ask: “Can a cell be represented by one integer without losing its row and column?”

For a grid with `m` columns, try:

```text
pos = row * m + col
row = pos // m
col = pos % m
```

Have the learner test this on corners and a middle cell. The encoding is bijective for valid cells because integer division and remainder recover the quotient and remainder. State the required range: `0 <= row < n` and `0 <= col < m`.

### Derive neighbor offsets and prevent row wrapping

For the flattened index, derive each neighbor from the coordinate equation:

- Up: `pos - m`, if `row > 0`.
- Down: `pos + m`, if `row + 1 < n`.
- Left: `pos - 1`, if `col > 0`.
- Right: `pos + 1`, if `col + 1 < m`.

The column checks are essential. Without them, the final cell in one row can appear adjacent to the first cell in the next row. Ask the learner to produce the smallest grid/index example that demonstrates this wraparound.

### Can parent data also mean “visited”?

In a parent array initialized to an undiscovered sentinel, set `parent[start] = start`. When discovering a neighbor, set its parent before enqueueing it. A later visit can test whether its parent is still the sentinel.

Ask the learner to explain why this is safe:

- Each cell is enqueued at most once because it receives a parent at first discovery.
- The parent records the predecessor needed to reconstruct the path.
- The start's self-parent marks it discovered and terminates path reconstruction.

This can remove a separate visited structure, but only if the sentinel cannot be a valid parent and the start is handled explicitly. Let the learner state and test both conditions.

### Test the queue mechanism in the chosen language

In Python, ask the learner to predict and then run this small experiment:

```python
items = [0]
for item in items:
    print(item)
    if item < 4:
        items.append(item + 1)
```

Observe whether the iteration processes values appended before it reaches the end. Explain the behavior from the language's sequence-iterator rules, and verify it against the supported Python version when that behavior matters.

Then compare two explicit FIFO choices:

- A `collections.deque`, using `popleft()`.
- A list with an integer head index, processing `queue[head]` and incrementing `head` while `head < len(queue)`.

Both make FIFO order visible. Avoid `list.pop(0)` for a large BFS because removing the first element shifts the remaining list. A `for item in items` loop with appends can be compact, but its queue behavior is less obvious to readers. Choose based on clarity and measured constraints; do not claim it is universally preferable to a deque.

### Prove equivalence and compare the trade-off

Have the learner explain:

- Why FIFO processing still visits cells in nondecreasing distance from the source.
- Why first discovery gives a shortest path in an unweighted graph.
- Why the stored parent chain reaches the start and returns a shortest path.
- What changes if edges have different costs.

Then compare tuple coordinates, flattened indices, a separate `visited` set, and a parent array. Count asymptotic operations and stored entries; for Python, measure representative memory if memory is part of the decision. A flattened index may simplify storage and indexing, but can make boundary checks less readable. Keep the simpler representation when it meets the limits.

### Reconstruction task

Hide the flattened implementation. Ask the learner to transform their tuple BFS in this order:

1. Add encode/decode helpers and test round trips.
2. Replace coordinate queue entries with integer positions.
3. Derive and test the four neighbor conditions, including row boundaries.
4. Replace separate visited state with the parent sentinel, if the invariant is clear.
5. Select a FIFO implementation and justify it.
6. Reconstruct the path and compare outputs against the original on tiny cases.

Later, remove the helper names and give a different grid problem. The learner should choose whether flattening is useful, derive it, and reject it if the trade-offs do not help.

## Reusable per-problem discovery exercise

Copy this into a coach-side analysis or learner debrief. Fill it with evidence from this problem; skip irrelevant prompts rather than manufacturing branches.

```markdown
### Discovery exercise: [problem / target reasoning move]

**Learner's starting point**
- What did the learner explain or try without help?
- What is observed, and what is still unknown?

**Task model**
- Required output:
- Tiny example and hand-worked result:
- Important constraints:

**Baseline**
- Simplest correct approach:
- State/data it needs:
- Time and memory:
- Constraint that accepts or rules it out:

**Bottleneck and candidate idea**
- Repeated work or limiting resource:
- Structural property that may help:
- Candidate transformation:
- One plausible alternative:

**Derive the representation / algorithm**
- Old representation and its invariant:
- New representation and encode/decode rule:
- Operations or transitions:
- Boundary cases and lost-information risks:

**Correctness obligations**
- Preconditions:
- Invariant or proof:
- Small counterexample that would falsify the current claim:
- Reconstruction/return step:

**Implementation hypothesis**
- Suspected bug or performance issue:
- Discriminating input:
- Predicted state/output:
- Actual state/output:
- Change justified by that evidence:

**Trade-off**
- Correctness equivalence:
- Time and memory comparison:
- Readability or implementation risk:
- Evidence for choosing the transformed version:

**Reconstruction and fade**
- First reconstruction with a worked example:
- Next cue to remove:
- Unfamiliar problem for transfer:
- Near-miss that tests the boundary:

**Evidence**
- Time to understand / choose / implement / debug-verify:
- Cue exposure:
- Confidence before checking:
- Outcome and feedback source:
- Next retrieval date or problem:

**Provenance**
- Learner-observed:
- Sourced:
- Reconstructed:
- Hypothetical:
```

Build spaced-repetition cards from the small number of reasoning moves that recur and matter. Keep a card's front as a trigger to derive or discriminate; its back should contain the invariant, recovery, and boundaries. Do not turn every line of the exercise into a card.
