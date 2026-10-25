# CP problem analysis

### Capture patterns from expert work

For each problem, first construct a sound competitive-programming solution trace: how the solver interprets the statement and constraints, estimates the needed complexity, chooses an algorithm or data structure, proves it correct, and turns it into code. Capture alternatives they consider and reject, implementation decisions, and tests that would expose a bug. Use several problems or solvers where possible. A polished editorial written after solving can omit tacit steps, so mark inferred explanations as hypotheses until examples support them.

For every problem studied, build a per-problem reasoning record using [`templates/cp-problem-analysis.md`](templates/cp-problem-analysis.md) and enter it in the workspace's analysis fields. The record is the source dataset for later teaching and card creation. Populate it before teaching when sources permit; update it after seeing the learner's actual work. Export Markdown when a durable copy is wanted. Never put learner-specific records into this shared skill directory.

Use [`../../cp-workspace.html`](../../cp-workspace.html) as the single-page workspace: the learner keeps the problem and attempt on the left, while the coach-side analysis, failure map, pattern cards, and transfer evidence live in the independently scrollable right pane. The page autosaves in the current browser and exports Markdown. Its “Copy analysis prompt” action prepares a prompt for an external AI session; it does not call a model or claim to generate an analysis itself. The dashboard and card templates remain available as export formats and reference schemas, not as a second required UI.

If an analysis agent or subagent is available, it may draft a problem analysis from the public statement and source material; otherwise follow the same pipeline in the current chat. A draft does not certify correctness: verify constraints, solution claims, and sources before entering the analysis. Keep actual learner errors separate from simulated branches. Do not put learner-specific records in this shared repository; use the optional page's local browser storage and export a Markdown copy for durable backup.

Use the template as a six-stage pipeline for each problem:

1. **Concept and structure:** list the mathematical, algorithmic, data-structure, and implementation prerequisites; connect their dependencies; mark which moves are expected to be second-nature at the target rating and which require conscious reasoning. If the learner's rating or background is unknown, mark this assessment unknown rather than guessing.
2. **Multi-path solving:** simulate the strong clean route, the obvious but suboptimal route, a plausible wrong route, and—when they expose distinct decisions—an over-engineered route and a fast-but-careless implementation route. Treat these as hypothetical solver lenses, not real people. For each route, record its initial hypothesis, attempted move, point of progress or failure, wrong conclusion if any, missing knowledge, and recovery or outcome. Mark irrelevant lenses as not applicable; do not pad the record with duplicate paths.
3. **Failure catalog:** connect each important decision to realistic failure branches, early detection, prevention, and recovery, using evidence from the problem and learner history.
4. **Why this construction:** explain the bottleneck and which constraints force the accepted approach; distinguish required design choices from optional ones; compare alternatives and state whether each fails correctness, complexity, or only efficiency.
5. **Second-nature layer:** extract the checks and routines a strong solver may perform automatically, when they apply, and the cue that should prompt the learner to use them.
6. **Learning graph:** create typed nodes for concepts, hypotheses/decisions, intermediate states, solution components, failure modes, checks, and recovery moves. Add explicit edges such as `requires`, `leads to`, `blocks`, `is detected by`, `recovers from`, `implements`, and `was learned from`. Keep edges grounded in the trace or mark them as hypotheses.

For every route, show how the solver could reach the next decision, what makes the route viable or where it breaks, and the constraint, invariant, counterexample, or complexity argument that decides it. Mark reported expert actions separately from reconstructed or hypothetical reasoning. The result is a high-coverage, auditable learning graph—not a claim to enumerate every possible human thought.

Trace the successful route at decision points, not merely at algorithm-name level. Include how values and state flow through the solution: what each variable/data structure represents, when it changes, what is returned, and what must be cached or invalidated. Include routine moves that may have become second nature, such as maintaining an invariant, preserving original indices, resetting per-test-case state, checking a predicate's monotonicity, or selecting a wider integer type. State why each move is safe and what symptom appears if it is missed.

For each pattern, record:

- **Cues:** statement structure, operations, constraints, and limits that suggest the pattern; separate meaningful cues from distracting story details.
- **Reason:** the invariant, recurrence, exchange argument, monotonicity, graph property, or other idea that makes the approach work.
- **Conditions:** prerequisites, assumptions, and input sizes under which it applies.
- **Procedure:** the key decisions, proof outline, complexity analysis, and implementation choices.
- **Boundaries:** counterexamples and signs that another algorithm or data structure is needed.
- **Examples:** links to the source problems, including near-misses and alternative valid solutions.
- **Learner errors:** the specific modeling, algorithm-choice, proof, complexity, implementation, or verification mistakes he makes.

Connect patterns only when the relationship is meaningful: prerequisite, alternative, shares a principle, easily confused with, or fails under. Keep uncertain explanations marked as uncertain. The graph should help choose and distinguish strategies; do not make him memorize a large list of labels.

### Reconstruct how the pattern could be learned

For each important pattern, map plausible routes by which a solver could discover or learn it, not only the route used to solve today's problem. If the expert can describe their actual learning history, capture it as reported. Otherwise label routes as reconstructions; do not invent a personal history for the expert. Explore routes that fit the problem, such as:

- **First principles:** start from the statement, definitions, and constraints; derive a simple model, invariant, recurrence, or proof obligation.
- **Constraint-based elimination:** compare brute force and candidate approaches against time and memory limits. Rule out an approach only when its complexity or assumptions demonstrably fail.
- **Analogy:** connect a previously solved problem through its shared invariant, state transition, or data structure, then state the important difference.
- **Attempt and judge feedback:** use WA, TLE, MLE, or RE as evidence to investigate, not as a diagnosis by itself; identify the counterexample or resource bottleneck and derive a correction.
- **Editorial or instruction to understanding:** take a known algorithmic idea and ground it in a proof, condition, or small example rather than asking him to memorize the label.

For each route, record its starting knowledge, key question or decision, decisive clue, intermediate reasoning, and the pattern it reaches. Mark which prerequisites it needs and how confident the reconstruction is. Several routes may reach the same pattern; use the route that connects best to the learner's current knowledge, and use other routes as alternatives when he is stuck or needs a different explanation. Cover the plausible routes that add understanding, without claiming a literally exhaustive list.

### Build the failure and recovery graph

After constructing the successful trace, walk every important decision and simulate realistic ways this specific problem can fail. Cover the relevant layers: statement interpretation and aggregate constraints; concept or state modeling; algorithm choice, proof, and optimization; time, memory, and stack limits; edge cases; implementation; and verification. Follow data from input through intermediate state to output. Check for using the wrong variable or source data, omitting an update, returning the wrong value or object, caching stale/wrong data, and choosing a correct but too-slow or memory-heavy approach. Also consider an unsupported greedy choice, a non-monotone binary-search check, a missing DP state or transition, incorrect graph visitation state, overflow (for example, `n * (n + 1) / 2` in a narrow integer type), modulo errors, index bounds, sorting without preserving original indices, duplicates, singleton inputs, stale adjacency state across test cases, and mistaking sample success for proof. Include time-versus-memory trade-offs and constraints that are easy to overlook, such as sums across test cases.

Represent each useful branch in the dataset as:

`trigger → mistaken assumption or action → why it seems plausible → earliest warning → prevention or test → recovery → linked prior problems`

The expert's checklist should have checks before choosing an algorithm (What does brute force cost? Which constraint rules it out?), before coding (What invariant or state makes this correct?), before submitting (Which boundary and worst-case tests are still untested?), and after a judge result (What smallest counterexample or resource bottleneck distinguishes likely causes?). Include the exact thought or quick paper test that catches each failure early.

Do not treat every simulated route as an actual expert memory. The dataset can contain a reported expert move, a reconstruction consistent with the solution, or a hypothetical failure branch; label which one it is and how strongly the problem/editorial/code supports it. The point is to produce useful, auditable teaching material, not to claim access to private thoughts.

Link observed learner mistakes to the earlier problem and the correction they learned. Label every branch as learner-observed, commonly plausible, or hypothetical; never present a simulated mistake as something he actually did. Cover realistic, high-value branches without claiming a literally exhaustive failure tree. Omit arbitrary edge cases that teach no useful distinction.

The tutor can react only to reasoning, code, or judge feedback the learner shares or an available tool exposes. Ask for checkpoints when he is solving offline; never claim to watch unseen work. Keep the full graph hidden during the attempt. Use it to recognize a branch as soon as it appears in shared work, then surface only that branch's trigger. If a known mistake is now well learned, test whether he catches it instead of teaching it again.

Agree on a reasonable effort window and check-in before a long attempt. If the learner is offline, ask for a compact checkpoint at a natural pause: current hypothesis, why it seems plausible, simplest baseline and cost, invariant or state, and the smallest test tried. Do not interrupt steady progress. If he is frustrated or asks to stop, offer a smaller hint, a short break, or pausing and recording the next step. Encourage persistence without coercion; acknowledge specific useful actions such as finding a counterexample or catching a bug, and focus on one high-value branch at a time.

