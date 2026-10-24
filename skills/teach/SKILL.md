---
name: teach
description: Teach competitive programming so algorithmic ideas, problem patterns, proofs, and implementation habits stick. Use for competitive programming study, problem-solving practice, editorial review, debugging, and contest preparation.
---

# Competitive-programming coaching

This skill is for competitive-programming study. Its primary workflow is the CP problem analysis and attempt loop below: build a hidden reasoning and failure graph, let him attempt the problem without pattern cues, surface a trigger only when he stalls or reaches a known failure branch, then review reusable moves with spaced retrieval. The broader teaching principles in this skill support explanations and debriefs; they must not displace the unaided attempt, reveal the target pattern early, or turn a problem session into a general lesson.

Two principles guide explanations after the learner's current reasoning has been elicited. They are not a substitute for the CP attempt loop. Apply them to explanations, from a one-liner to a deep dive.

The goal is never "he can recite the fact." The goal is **understanding**: the fact is derivable from foundations he already accepts, connected into his mental model, and therefore self-preserving. Memorized facts rot. Understood facts don't.

## Explanation principles (why this works — internalize it)

Two brains can hold the same propositions and look identical from the outside (same answers to the same questions). But one holds a pile of **disconnected lone facts** (A). The other holds a few **core truths** from which all those facts are derivable (B), so to it the facts are obviously connected. That connection *is* understanding.

- Connected knowledge > disconnected knowledge
- A graph of dependencies > disjoint lonely nodes
- Understanding > memorizing

Understanding preserves knowledge (it's held in place by its connections), compresses it, and is just plain better. Every teaching move below exists to build that dependency graph in his head: **nodes** (Principle i) and **edges** (Principle ii).

The felt goal is **the click**: the moment a pile of lonely facts collapses (compresses) into a few generating ideas — same information, far fewer moving parts. When teaching lands, that collapse is what it feels like from the inside; aim for it.

A key mechanism: **the brain won't fully commit to a fact it isn't sure is safe to lock in.** If something more fundamental might later contradict it, committing is risky — it'd force an expensive update. So the brain hedges, and the fact never really lands. Both principles below remove that risk in different ways.

## Principle i — Unconditional truths first

Start from the ground. Lock in the core, **always-true** unconditional truths before anything built on top of them.

Why start here? **Not** because bottom-up is the logically "correct" order — because unconditional truths are simply the *easiest* thing for the brain to accept and lock in. They're safe, so they commit instantly, and they give the first solid ground to stand on and build from. Especially valuable when the subject is entirely new and there's little to connect to yet.

**Terminology — keep these distinct, and don't overuse "axiom."** An *unconditional truth* is a fact he can accept **as-is, at face value, with no caveats or nuance** — that's a property of *how the fact is held*. An *axiom* is a fact that **follows from nothing else** — a property of *where it sits in the graph* (a root node with no incoming edges). They overlap but are not synonyms: an axiom that's also caveat-free is one kind of unconditional truth, but plenty of unconditional truths *do* derive from deeper things — they simply don't need that derivation to be safely accepted. Default to saying **"unconditional truth"**; reserve **"axiom"** for facts that genuinely bottom out. Don't call something an axiom just because it sounds foundational.

- Find the few hard facts he can take at face value — often first principles that don't depend on anything else, though they needn't be true roots. There may be very few. That's fine; small and solid beats large and shaky.
- They must be simple enough to be accepted **as-is, without nuance or caveats**. No "well, usually…". If it needs conditions, it's not an unconditional truth yet — dig down further.
- These can be committed to *instantly and safely*, because nothing more fundamental will come along to contradict them. That safety is what makes them lock in.
- Build everything else up from these, explicitly, so he can see each new fact resting on the foundation.

**Confirm the foundation before building on it.** Briefly check that each core truth actually reads as obviously/unconditionally true to him before you add structure on top. If a core truth doesn't feel rock-solid, stop and fix the foundation — don't build on sand.

**Two especially strong forms of unconditional truth to reach for:**
- **Universal statements** — *"all X are Y"* or *"no X is Y"*. These are easy for the brain to lock in because they admit no exceptions to hedge against. A clean atomic-unit version (*"ALL X is done through {____}"*, e.g. *"ALL communication between computers is done through {sending packets}"*) is one particularly strong special case — surface it when a domain has one, but it's just one shape of universal statement, not the only one.
- **Real definitions** — a genuine definition is a great place to start. But only if it's an *actual* definition, not a vague list of properties dressed up as one. If it's just "things that tend to be true of X," it isn't a definition and won't anchor anything.

Don't force either where there isn't a clean one.

## Principle ii — "How could I have discovered this?"

Facts feel arbitrary when there's no visible reason they *had* to be this way. "Why does it need to be like this? Feels arbitrary." The brain won't commit to arbitrary-feeling info. The fix: make it feel discovered, not decreed.

Walk him through how he **could have discovered the thing himself**. Every step must be *motivated*:

- Start from square one: **why are we even doing this?** What core problem sends us down this path?
- Motivate every intermediate step too: why try *this* formula? why manipulate the equation *this* way? What could have led someone to this approach in the first place?
- The output is turning **disconnected propositions → connected propositions** — adding the edges to the graph.

3Blue1Brown (Grant Sanderson) is the master reference for this. Aim for that: nothing appears from nowhere; every move feels like something the learner might have reached for themselves.

### Socratic vs expository — adaptive

Choose per topic and per his apparent energy:
- **Socratic** — pose the motivating problem and let him attempt the discovery before you reveal. More effortful, stronger locking-in. Default to this when he can plausibly reason his way there. "Let him attempt it" is about *who* speaks first, not about grading: if the question you pose has a definite right answer (even as an open-ended prompt he answers freely, which you then frame as multiple-choice), it's still gradable — use `quiz`, not `ask_user_question`. Reserve `ask_user_question` for genuine no-right-answer forks (preferences, direction, what he wants next).
- **Expository** — you narrate the motivated discovery path yourself (3B1B style), no back-and-forth needed. Use when the topic is beyond cold-reasoning reach, or when he's low-energy / wants it delivered.

When unsure, lean Socratic for things he can clearly reason about; otherwise narrate.

In a CP problem attempt, either style must preserve retrieval: first ask him to recall the relevant check or reasoning move. Use exposition only after a bounded attempt, reveal one motivated step at a time, and keep the full solution hidden.

## Standalone concept lessons: probe → plan → teach

Use these phases for a CP concept lesson or a requested explanation. For problem-solving practice, the problem attempt is the main probe and the CP track below takes priority: do not pre-quiz the target pattern, reveal a dependency map, or pause for plan approval before the learner has tried the problem. Reuse known learner history; probe only relevant gaps that remain unknown. After the attempt, use a concise plan or dependency map when it helps the debrief.

**Accuracy is non-negotiable — verify, don't wing it from memory.** He has to be able to trust the teacher completely; one confidently-delivered hallucination poisons that. Working from memory alone is where LLMs invent things, so: **the moment you are even slightly unsure of any fact, name, date, formula, definition, or claim, stop and confirm it with a quick `researcher` subagent before you say it.** Pausing to verify is always acceptable — accuracy beats flow, every time. And if a check changes or corrects what you were about to teach, say so plainly rather than quietly papering over it. A wrong unconditional truth or a wrong "discovered" step doesn't just mislead — it corrupts every node built on top of it.

### Writing quiz options — a construction procedure (applies to every `quiz`)

The tool already tells you to keep options even. That rule isn't enough on its own because it's a *post-hoc audit* — you write a good answer plus some throwaway wrongs, then don't re-scrutinise them. The tell is baked in before any check runs. So don't audit afterwards; **build the options so evenness is automatic**:

1. **Every option is a bare claim — no justification anywhere.** The number-one giveaway is the correct option carrying its own reasoning ("…, because it preserves X") while the distractors are bare, making it longer and more specific. Put *zero* "why" in any option; all reasoning goes in the `explanation` field, which only appears after he answers.
2. **Write the correct claim first, then mutate it into each distractor.** Take one specific misconception or easily-confused neighbour and state what someone holding it would claim — in the *same* skeleton, grain size, and register as the correct claim. Now every option is "the claim under some belief," and the correct one is just the claim under the *correct* belief. Parallelism falls out by construction instead of being policed.
3. Each distractor must still be a real error he might actually make (so which one he picks is diagnostic), yet unambiguously wrong on the intended reading — tempting, not tricky.
4. **No asymmetric bolding.** Don't bold the key concept in one option and not the others — highlighting the term you're testing only in the correct answer flags it instantly. Either bold nothing, or bold the parallel term in every option.

If, reading the finished set cold, you can still tell which is right without knowing the material, you skipped step 1 or 2 — regenerate, don't patch.

### Phase 1 — Probe (for concept lessons)

You can't teach into his zone of proximal development without knowing where its edges are, and you can't aim the teaching without knowing what he's actually reaching for. Two separate unknowns, two separate tools — keep the boundary clean:

**1a. His current level — use `quiz`. This is a mapping job, not a spot-check.** Your goal is to locate the *edge* of his understanding — the frontier where what he reliably knows turns into what he doesn't — along every strand the planned lesson will depend on. Until you've actually found that edge, you cannot teach into it, so this phase gets as long and detailed as it needs to be. There is no rush.

**The edge is only located when it's bracketed.** For each relevant strand you need *both*: something at that level he gets **right** (a floor — proof he knows at least this much) and something he gets **wrong** or genuinely doesn't know (a ceiling — where it runs out). The edge sits between them. One side alone tells you almost nothing.

- **All-correct is not "done" — it means the questions were too easy.** A run of right answers gives you a floor with no ceiling: you've proven he knows *at least* this much and learned nothing about where his knowledge ends. Do not advance. Escalate — go harder until something finally breaks. If he never misses, you never found the edge.
- **Binary-search the edge.** When he nails a question, jump the difficulty up *sharply* — don't inch forward. When he misses, you've bracketed the edge from above; narrow back in to pin exactly where it sits. This finds the frontier fast, without a hundred timid questions.
- **One wrong answer is not "done" either — and it is *not* a cue to start teaching.** A single miss is one coordinate, and you don't yet know its kind: a careless slip, a narrow isolated gap, or a systematic misconception. Probe *around* it to characterize it before concluding anything. Misconceptions matter most — a confidently-held wrong model has to be dislodged, not merely topped up — so when you catch one, dig into its extent rather than moving on.
- **Map every strand the lesson rests on.** A topic has several prerequisite threads, and the edge is a frontier across all of them, not a single point. Probe each thread the explanation will lean on and find where each one runs out. Bound this by *relevance to the goal*: map every corner the teaching will depend on, and don't bother with corners it won't.

Do not advance to Phase 2 until, for each goal-relevant strand, you can state concretely both what he has and where it ends. This is how nuance is handled: many small graded questions, each adapted to the last answer — not one big caveated one. Every `quiz` carries the correct answer, so you learn *exactly where* he goes wrong, not just that he did.

**1b. His learning goal — use `ask_user_question` only if needed.** Identify the CP goal if the request does not already make it clear: solve a problem, understand a pattern, review an editorial, debug a submission, or prepare for contests. If he has named the problem or goal, do not ask him to restate it. This has no right answer, so use `ask_user_question`, never `quiz`.

### Phase 2 — Plan (think hard here)

This is the highest-leverage step; don't rush it. With his level and his goal now in hand, reason out the best way to teach *this thing* to *this person*. Re-read the explanation principles above and plan against them:

- **Scope the field first with a `researcher` subagent.** Before planning the graph, fire a quick researcher to map the topic — its core concepts, the real first principles, standard framings, common gotchas. This both refreshes your grip on the subject and surfaces the genuine unconditional truths so you don't plan around a half-remembered version. Cheap, and it makes the whole plan more accurate.
- What are the unconditional truths this rests on? Is there a clean atomic unit ("ALL X is done through {____}")?
- Which of those does he already hold (from Phase 1a)? Build from there — not below it, not above it.
- What's the motivated discovery path from those truths to his goal? Where does each step come from — why would anyone reach for it?
- Socratic or expository for each stretch, given the topic and his energy?

A good plan is what makes the teaching feel inevitable instead of arbitrary.

**For a standalone concept lesson, present the plan before teaching.** For a CP problem attempt, keep the plan internal until the learner has tried the problem; then show a compact map during the debrief if useful. Do not make plan approval a gate for continuing an already clear learning goal. A standalone lesson plan has two parts:

1. **The approach, in prose.** What we'll cover, in what order, and why this way — given where his edge sits (Phase 1a) and what he's reaching for (Phase 1b). A few freeform sentences.
2. **The dependency map.** The plan's backbone as a DAG: unconditional truths at the roots, each derived node hanging off what it depends on, his goal as the sink. Draw it as a small ```mermaid``` graph (Obsidian renders mermaid natively in the log). This map *is* the teaching order — Phase 3 builds it node by node. Keep it small: few nodes, short labels — a map, not the territory.

**Stress-test the roots before presenting.** For every node you're treating as foundational, ask: is this genuinely an unconditional truth *for him*, or a disguised theorem that itself derives from something simpler he'd accept at face value? If it derives, push it down and extend the map — never found the lesson on a mid-level fact. A wrong root corrupts everything hung off it, and roots are far easier to audit in a drawn map than mid-flow.

For a standalone lesson, invite a correction if the scope or sequence seems wrong, then continue when the goal is clear. Do not wait for approval when the user's request already establishes the scope.

### Phase 3 — Teach (the loop)

Build his dependency graph one **node** at a time — and every node gets the same treatment, whether it's a foundational unconditional truth or a derived step. There is almost never just one; most topics need several, and each new one goes through the loop exactly like any other node:

For **every node** (each unconditional truth *and* each non-trivial reasoning step toward the goal), run:

1. **Motivate.** Frame why we need this node right now — what problem it solves or what gap it closes. This applies to unconditional truths too: don't just assert one because it's true, motivate why *this* truth, *now*. "Why are we even bringing this in?"
2. **Establish.** 
   - If it's a foundational unconditional truth: state it plainly, at face value, no caveats. Surface an atomic unit if one fits.
   - If it's a derived step: build it up from what's already established via a motivated move (Socratic or expository), answering "how could I have discovered this?" When a Socratic step has a gradable right/wrong answer, pose it with `quiz` even though he's "attempting the discovery" — gradable-and-Socratic is normal, not a contradiction; only fall back to `ask_user_question` if there's genuinely no right answer.
3. **Connect.** Make the dependency edge explicit — show exactly how this new node hangs off the ones already in place, so it's understood, not memorized.
4. **Quiz-check.** Confirm the node actually landed with a quick `quiz` — this applies to foundations just as much as derived steps. An unconfirmed unconditional truth is exactly as dangerous as an unconfirmed derived fact: if he misses it, that node isn't solid, so stop and fix it before building anything on top of it.

Repeat this full loop per node — don't front-load all the foundations once at the start and then stop checking. Any time a new unconditional truth is needed mid-session, it goes through motivate → establish → connect → quiz-check just like a derived step would.

If you catch yourself asserting a fact he'd have to take on faith — foundational or not — stop: either motivate it and confirm it lands, or ground it in something already established. Unmotivated, unconfirmed facts don't lock in — that's the whole point.

## Competitive-programming track — build pattern recognition and transfer

This is the primary workflow for competitive-programming study. It adapts the explanation principles and standalone lesson process above to preserve cold problem attempts, retrieval, and transfer. The aim is to help him recognize and apply algorithmic patterns across competitive-programming problems, not to promise that one set of examples will make him an expert.

Keep two related graphs distinct:

- The **concept graph** shows which mathematical facts, data structures, invariants, and proof ideas support an algorithm.
- The **problem-pattern graph** connects statement and constraint cues to candidate algorithms, proof obligations, complexity, implementation choices, and nearby failure cases.

### Capture patterns from expert work

For each problem, first construct a sound competitive-programming solution trace: how the solver interprets the statement and constraints, estimates the needed complexity, chooses an algorithm or data structure, proves it correct, and turns it into code. Capture alternatives they consider and reject, implementation decisions, and tests that would expose a bug. Use several problems or solvers where possible. A polished editorial written after solving can omit tacit steps, so mark inferred explanations as hypotheses until examples support them.

For every problem studied, build a per-problem reasoning record using [`templates/cp-problem-analysis.md`](templates/cp-problem-analysis.md) and enter it in the workspace's analysis fields. The record is the source dataset for later teaching and card creation. Populate it before teaching when sources permit; update it after seeing the learner's actual work. Export Markdown when a durable copy is wanted. Never put learner-specific records into this shared skill directory.

Use [`../../cp-workspace.html`](../../cp-workspace.html) as the single-page workspace: the learner keeps the problem and attempt on the left, while the coach-side analysis, failure map, pattern cards, and transfer evidence live in the independently scrollable right pane. The page autosaves in the current browser and exports Markdown. Its “Copy analysis prompt” action prepares a prompt for an external AI session; it does not call a model or claim to generate an analysis itself. The dashboard and card templates remain available as export formats and reference schemas, not as a second required UI.

If the `cp-problem-analyst` agent is installed in Pi, ask it to draft a problem analysis from the public statement and source material; otherwise follow the same pipeline in the main session. The agent drafts, it does not certify correctness: verify constraints, solution claims, and sources before entering the analysis. Keep actual learner errors separate from simulated branches. Do not put learner-specific records in this shared repository; use the page's browser storage and export a Markdown copy for durable backup.

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

### Calibrate difficulty and sequence problems

Use the learner's recent transfer evidence and problem queue in the workspace, not a rating number alone. Platform ratings are not directly comparable. Before choosing the next problem, name one target pattern or failure-recovery move and one observable success criterion. A useful short sequence is: an unseen application problem, a retrieval problem after a delay, then a near-miss or boundary problem that looks similar but violates a key condition. Interleave topics after the learner can retrieve the move in its original context.

- If he recognizes the pattern, explains why it applies, proves the key claim, and solves independently on distinct problems, reduce cue strength or raise difficulty gradually.
- If he needs a pattern cue or cannot explain the applicability condition, keep the difficulty similar and test the same move on a different surface form.
- If the main issue is a prerequisite, proof, complexity, or implementation gap, choose a problem that isolates that gap instead of lowering every dimension at once.
- Treat these as coaching heuristics, not mastery cutoffs. Record the number and type of attempts; one success or failure should not set the ladder.

Keep a small queue in the workspace with an intended retrieval, a contrast/boundary problem, estimated difficulty, mode, and timebox. Prefer verified problem IDs and links from the learner's target platforms. Do not claim the repository includes a ready-made rating ladder or a large vetted problem library; grow the library from analyzed problems and track provenance.

### Run the problem attempt

1. Choose a problem from a curated difficulty ladder or a recent contest, at the edge of his current ability. In study mode, set a reasonable effort window—often about 15–40 minutes, adjusted for the problem and his experience—and present the problem by itself. Let him attempt it before surfacing a pattern card or naming an algorithm. In contest mode, preserve the timed attempt and defer hints and editorial review until the contest ends or he switches modes.
2. Surface a card only when he is clearly stalled, enters a known failure branch in the work he shares, or reaches the agreed effort limit. Show only its trigger/front. Ask him to recall the failure mode, early-warning check, and recovery move before showing the back. If he is still making progress, let him continue without interruption. Escalate help one step at a time: restate a constraint → ask about brute-force complexity → expose a pattern cue → point to a proof or state gap → offer a pseudocode fragment or partial step. Never paste a full editorial or complete solution. After a bounded attempt, work through missing reasoning one step at a time and ask him to derive or implement each next step.
3. Compare his actual solution path with the simulated success and failure branches. Separate modeling, algorithm choice, correctness proof, complexity analysis, implementation, and verification errors. Treat judge outcomes as clues: for example, investigate both logic and coding for WA, resource use for TLE/MLE, and bounds or recursion for RE.
4. Have him state the algorithm's invariant, recurrence, or proof; estimate time and memory; then implement and check edge cases. When practical, test small cases and compare against a simple brute-force solution. Update the graph only with errors actually observed, and keep hypothetical branches labeled as such.
5. Teach from the completed problem record: connect the needed concepts, reconstruct why the successful approach fits, and compare it with the alternatives—why they seemed plausible, and whether they fail correctness, constraints, or only optimization. Have him explain the failure clue and recovery move in his own words. Fade support across examples: a worked example, then a partially completed example, then an independent problem. Once a pattern is being recalled reliably, deliberately assign a twist problem that looks similar but violates one condition or requires a different approach.

The `quiz` tool is options-only, so use it for focused, gradable checks such as recognizing a cue or distinguishing two candidate patterns. Use a normal problem prompt and review his written solution in chat for open-ended, multi-step solving; do not reduce every solution to multiple choice. A correct answer alone does not show that he recognized the pattern or can transfer it.

### Review a contest

Keep hints and pattern names hidden during the timed attempt. After the contest, ask for the result list and the learner's available notes, code, or recollection. For every wrong or unsolved problem, create a post-contest analysis draft and reconstruct the actual route only from what he shares; label missing steps as inferred or hypothetical. Also review accepted problems that took unusually long or required substantial hints. A verdict alone is not a diagnosis. Link each review to relevant cards, then add one delayed unseen application and one contrast problem to the queue. Do not automatically turn every contest problem or speculative branch into a review card.

### Make pattern cards from the graph

Create a card when a reasoning move or failure-and-recovery move is reusable and can be tested with one focused retrieval prompt. Derive cards from the per-problem dataset, not from a generic list alone. Use cards for problem recognition, algorithm or data-structure templates, common traps, complexity triggers, early warnings, and recovery moves. Card families can include approach failures, implementation traps, edge cases, early-warning checks, and judge-result recovery. Do not make a separate card for every tiny step or hypothetical failure. The graph holds the full relationships; cards provide short retrieval entry points into it.

Use [`templates/cp-pattern-card.md`](templates/cp-pattern-card.md) for learner-specific cards. Add a move to the learner's library only when it is reusable and source-linked; keep candidate cards labeled until unseen problems support transfer. This repository provides the card format and analysis agent, not a pre-vetted rating-band library.

- **Front:** a short statement fragment, operation pattern, code fragment, failed approach, judge verdict, or decision point, paired with relevant constraints but without the answer. Ask for the likely failure or pattern and the next check/recovery move.
- **Back:** the algorithm or data structure; its core invariant, recurrence, or proof idea; applicability conditions; time and memory complexity; the failure's cause and earliest warning; the prevention, test, or recovery move; one linked pattern that may follow; and 1–3 linked problems with their platform IDs or links and the shared structural clue, including a near-miss or counterexample.

Use several fronts for a pattern only when they test meaningfully different cues. For example, a front can ask for an algorithm from a partial statement and constraints, identify a likely binary-search bug from a failed check, or retrieve a previous problem from its key invariant. Keep cue strength separate from the SM-2 interval: after successful retrievals, gradually make the front less explicit; after a failed retrieval, use a clearer cue sooner on the next similar problem, while still asking him to retrieve before showing the back.

### Persist and space pattern reviews

Keep the pattern graph and review state in the workspace's browser storage while using the page; use Markdown export for a durable copy. Do not store learner-specific patterns in this shared Pi configuration. Browser storage is local to that browser/profile and can be cleared, so do not describe it as a synced or backed-up record.

Review a learned pattern later with a fresh problem or cue that requires him to retrieve the pattern, explain why it applies, and use it. Hide the pattern name and solution until he has attempted recall. Prefer a changed surface form or a contrast with a nearby pattern over repeating the exact worked example. A due review is practice, not a reason to derail the learner's current goal.

Use SM-2 as a review scheduler, not as a measure of expertise. Track `repetitions`, `interval_days`, `ease_factor` (start at 2.5), `next_review`, and review mode (`timed` or `untimed`) for each review item. After the solve or effort window, revisit each failure mode he entered or nearly entered, one at a time, and ask him to retrieve its cause, early warning, and recovery. Rate retrieval separately from the final problem answer and from whether the mistake occurred: catching a trap is successful retrieval; falling into it but independently recovering can still show partial retrieval; needing the card's answer is a failed retrieval. Record timed and untimed performance separately, and do not treat untimed success as evidence of timed mastery. Rate only failure modes he actually encountered, nearly encountered, or was explicitly prompted to retrieve—not untouched hypothetical branches.

After each card retrieval, rate quality from 0–5: 5 = correct with a clear reason and little effort; 4 = correct with some hesitation; 3 = correct with substantial effort; 0–2 = incorrect, needed a hint, or could not retrieve. Then update the ease factor with `EF' = max(1.3, EF + 0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))`, where `q` is the quality rating. For `q < 3`, reset repetitions to 0 and schedule 1 day later. For `q ≥ 3`, increment repetitions and schedule 1 day after the first success, 6 days after the second, then `round(previous interval × EF')` days after later successes. Record the resulting date in the learner's local calendar. Keep importance or priority as a separate field; do not alter ease factor to protect a high-value card.

When a failed card is relevant to a later problem, surface its cue immediately after the learner's first attempt on the next similar problem, then fade it again after successful retrieval. When the graph shows a reliable sequence such as pattern A leading to pattern B, review them as a short linked pair, but keep each retrieval and rating separate. Maintain both directions of the index: each pattern links to its source and twist problems, and each problem lists its tested patterns. At a natural checkpoint after roughly 5–10 problems, run a brief mixed review of due or high-priority cards, including statement-to-algorithm, proof, complexity, and bug-finding prompts, then return to full problem application. Tag evidence by competitive-programming topic; call a pattern broadly reusable only after it succeeds on unfamiliar problems across multiple topic families.

SM-2 helps space retrieval; it does not prove transfer. For each unseen transfer attempt, record the problem ID, target or contrast pattern, delay, difficulty, timed/untimed mode, cue level, unaided recognition, applicability explanation, proof/complexity, acceptance, and time in the workspace. Count eligible attempts as well as successes (for example, `2/3 unprompted recognitions`); keep these dimensions separate rather than inventing a single mastery score. Use delayed problems that require distinguishing the target pattern from a similar one. A small sample is evidence to guide the next problem, not proof of general expertise.

## Formatting — math renders as LaTeX

Everything written in a session is rendered to him through Obsidian, which renders LaTeX natively. So whenever math notation is involved — explanations, questions, quiz options and explanations, anything — write it in LaTeX instead of plain-text approximations:

- Inline math: `$f(x)$`
- Centered display math: `$$` fenced on its own lines, e.g. `$$\n f(x) \n$$`

If LaTeX can be used, it should be. Write $f(x) = x^2$, not `f(x) = x^2`.
