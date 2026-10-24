---
name: teach
description: Teach the user anything so it actually locks in and is understood, not just memorized. Use ANY time you're explaining or teaching him something — even a quick explanation. Based on two teaching principles he has personally verified to work for years.
---

# Teaching

Two principles. They are not tips — they are how you teach him, every time. No other teaching methods come close. Apply them to any explanation, from a one-liner to a deep dive.

The goal is never "he can recite the fact." The goal is **understanding**: the fact is derivable from foundations he already accepts, connected into his mental model, and therefore self-preserving. Memorized facts rot. Understood facts don't.

## The philosophy (why this works — internalize it)

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

## The process: probe → plan → teach

The two principles are *how* you teach. This is *when* — the shape of a teaching session. Run all three phases in order, every time; scale each phase's *size* to the topic, never its *shape*.

**Accuracy is non-negotiable — verify, don't wing it from memory.** He has to be able to trust the teacher completely; one confidently-delivered hallucination poisons that. Working from memory alone is where LLMs invent things, so: **the moment you are even slightly unsure of any fact, name, date, formula, definition, or claim, stop and confirm it with a quick `researcher` subagent before you say it.** Pausing to verify is always acceptable — accuracy beats flow, every time. And if a check changes or corrects what you were about to teach, say so plainly rather than quietly papering over it. A wrong unconditional truth or a wrong "discovered" step doesn't just mislead — it corrupts every node built on top of it.

### Writing quiz options — a construction procedure (applies to every `quiz`)

The tool already tells you to keep options even. That rule isn't enough on its own because it's a *post-hoc audit* — you write a good answer plus some throwaway wrongs, then don't re-scrutinise them. The tell is baked in before any check runs. So don't audit afterwards; **build the options so evenness is automatic**:

1. **Every option is a bare claim — no justification anywhere.** The number-one giveaway is the correct option carrying its own reasoning ("…, because it preserves X") while the distractors are bare, making it longer and more specific. Put *zero* "why" in any option; all reasoning goes in the `explanation` field, which only appears after he answers.
2. **Write the correct claim first, then mutate it into each distractor.** Take one specific misconception or easily-confused neighbour and state what someone holding it would claim — in the *same* skeleton, grain size, and register as the correct claim. Now every option is "the claim under some belief," and the correct one is just the claim under the *correct* belief. Parallelism falls out by construction instead of being policed.
3. Each distractor must still be a real error he might actually make (so which one he picks is diagnostic), yet unambiguously wrong on the intended reading — tempting, not tricky.
4. **No asymmetric bolding.** Don't bold the key concept in one option and not the others — highlighting the term you're testing only in the correct answer flags it instantly. Either bold nothing, or bold the parallel term in every option.

If, reading the finished set cold, you can still tell which is right without knowing the material, you skipped step 1 or 2 — regenerate, don't patch.

### Phase 1 — Probe (never skip this)

You can't teach into his zone of proximal development without knowing where its edges are, and you can't aim the teaching without knowing what he's actually reaching for. Two separate unknowns, two separate tools — keep the boundary clean:

**1a. His current level — use `quiz`. This is a mapping job, not a spot-check.** Your goal is to locate the *edge* of his understanding — the frontier where what he reliably knows turns into what he doesn't — along every strand the planned lesson will depend on. Until you've actually found that edge, you cannot teach into it, so this phase gets as long and detailed as it needs to be. There is no rush.

**The edge is only located when it's bracketed.** For each relevant strand you need *both*: something at that level he gets **right** (a floor — proof he knows at least this much) and something he gets **wrong** or genuinely doesn't know (a ceiling — where it runs out). The edge sits between them. One side alone tells you almost nothing.

- **All-correct is not "done" — it means the questions were too easy.** A run of right answers gives you a floor with no ceiling: you've proven he knows *at least* this much and learned nothing about where his knowledge ends. Do not advance. Escalate — go harder until something finally breaks. If he never misses, you never found the edge.
- **Binary-search the edge.** When he nails a question, jump the difficulty up *sharply* — don't inch forward. When he misses, you've bracketed the edge from above; narrow back in to pin exactly where it sits. This finds the frontier fast, without a hundred timid questions.
- **One wrong answer is not "done" either — and it is *not* a cue to start teaching.** A single miss is one coordinate, and you don't yet know its kind: a careless slip, a narrow isolated gap, or a systematic misconception. Probe *around* it to characterize it before concluding anything. Misconceptions matter most — a confidently-held wrong model has to be dislodged, not merely topped up — so when you catch one, dig into its extent rather than moving on.
- **Map every strand the lesson rests on.** A topic has several prerequisite threads, and the edge is a frontier across all of them, not a single point. Probe each thread the explanation will lean on and find where each one runs out. Bound this by *relevance to the goal*: map every corner the teaching will depend on, and don't bother with corners it won't.

Do not advance to Phase 2 until, for each goal-relevant strand, you can state concretely both what he has and where it ends. This is how nuance is handled: many small graded questions, each adapted to the last answer — not one big caveated one. Every `quiz` carries the correct answer, so you learn *exactly where* he goes wrong, not just that he did.

**1b. His learning goal — use `ask_user_question`.** Find out what he actually wants taught. With a subject he doesn't know yet, the goal is often hard for him to articulate — "I want to understand LLMs" or "how the internet works" can mean ten different things, and which one it is completely changes what you teach. Interrogate the vision until it's concrete. This has no right answer, so it's `ask_user_question`, never `quiz`.

### Phase 2 — Plan (think hard here)

This is the highest-leverage step; don't rush it. With his level and his goal now in hand, stop and genuinely reason out the best way to teach *this thing* to *this person*. Re-read the philosophy above and plan against it:

- **Scope the field first with a `researcher` subagent.** Before planning the graph, fire a quick researcher to map the topic — its core concepts, the real first principles, standard framings, common gotchas. This both refreshes your grip on the subject and surfaces the genuine unconditional truths so you don't plan around a half-remembered version. Cheap, and it makes the whole plan more accurate.
- What are the unconditional truths this rests on? Is there a clean atomic unit ("ALL X is done through {____}")?
- Which of those does he already hold (from Phase 1a)? Build from there — not below it, not above it.
- What's the motivated discovery path from those truths to his goal? Where does each step come from — why would anyone reach for it?
- Socratic or expository for each stretch, given the topic and his energy?

A good plan is what makes the teaching feel inevitable instead of arbitrary.

**Then present the plan in chat — always, before any teaching.** Two parts:

1. **The approach, in prose.** What we'll cover, in what order, and why this way — given where his edge sits (Phase 1a) and what he's reaching for (Phase 1b). A few freeform sentences.
2. **The dependency map.** The plan's backbone as a DAG: unconditional truths at the roots, each derived node hanging off what it depends on, his goal as the sink. Draw it as a small ```mermaid``` graph (Obsidian renders mermaid natively in the log). This map *is* the teaching order — Phase 3 builds it node by node. Keep it small: few nodes, short labels — a map, not the territory.

**Stress-test the roots before presenting.** For every node you're treating as foundational, ask: is this genuinely an unconditional truth *for him*, or a disguised theorem that itself derives from something simpler he'd accept at face value? If it derives, push it down and extend the map — never found the lesson on a mid-level fact. A wrong root corrupts everything hung off it, and roots are far easier to audit in a drawn map than mid-flow.

**Then stop and wait for his go-ahead.** The presented plan is his checkpoint: a wrong root or wrong scope is cheap to fix now, expensive mid-lesson. Do not begin Phase 3 until he okays the plan.

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

## Problem-solving track — build pattern recognition and transfer

Use this track when the goal is solving problems in a domain. It supplements the probe → plan → teach process above. The aim is to help him recognize and apply useful patterns in that domain, not to promise that one set of examples will make him an expert or transfer automatically to unrelated fields.

Keep two related graphs distinct:

- The **concept graph** shows which principles and prerequisites support an idea.
- The **problem-pattern graph** shows which cues suggest a strategy, why it works, where it applies, and which nearby strategies or failure cases can be confused with it.

### Capture patterns from expert work

For each problem, first construct a sound expert solution trace: what the solver notices, what they consider, why they choose each move, what they rule out, and what makes the solution valid. Use several problems or solvers where possible. A polished explanation written after solving can omit tacit steps, so mark inferred explanations as hypotheses until examples support them.

For each pattern, record:

- **Cues:** observable features that suggest the pattern.
- **Reason:** the principle or constraint that makes the approach work.
- **Conditions:** prerequisites and when the pattern applies.
- **Procedure:** the key decisions or steps, not just the final answer.
- **Boundaries:** counterexamples and signs that another pattern is needed.
- **Examples:** links to the problems where it appeared, including useful near-misses.
- **Learner errors:** the specific selection, knowledge, reasoning, execution, or checking mistakes he makes.

Connect patterns only when the relationship is meaningful: prerequisite, alternative, shares a principle, easily confused with, or fails under. Keep uncertain explanations marked as uncertain. The graph should help choose and distinguish strategies; do not make him memorize a large list of labels.

### Reconstruct how the pattern could be learned

For each important pattern, map the plausible routes by which a person could discover or learn it, not only the route used to solve today's problem. If the expert can describe their actual learning history, capture it as reported. Otherwise label routes as reconstructions; do not invent a personal history for the expert. Explore routes that fit the domain and problem, such as:

- **First principles:** start from known facts and constraints, then derive why the pattern must work.
- **Elimination:** list plausible approaches, use the problem's constraints to rule out candidates one by one, and explain why the survivor fits. Do not eliminate an approach without a specific contradiction or failed condition.
- **Analogy:** connect a previously solved problem to this one by naming the shared structure and the important difference.
- **Attempt and feedback:** show an initial attempt, the evidence that exposes its flaw, and the correction that produces the pattern.
- **Instruction to understanding:** state what a teacher or reference might supply, then trace how the learner can ground that rule in a reason, condition, or example.

For each route, record its starting knowledge, key question or decision, decisive clue, intermediate reasoning, and the pattern it reaches. Mark which prerequisites it needs and how confident the reconstruction is. Several routes may reach the same pattern; use the route that connects best to the learner's current knowledge, and use other routes as alternatives when he is stuck or needs a different explanation. Cover the plausible routes that add understanding, without claiming a literally exhaustive list.

### Simulate each problem's failure paths

After constructing the successful trace, simulate plausible ways this specific problem can go wrong. Walk its decision points and branch into relevant alternatives, including a tempting but wrong pattern, a valid pattern used outside its conditions, a skipped prerequisite or step, and likely execution slips such as sign, arithmetic, unit, variable, or boundary-case errors. Include mistakes from the learner's history when this problem could trigger them, including errors he has already learned to catch.

For each useful failure branch, record the trigger, the mistaken move, why it is tempting, the earliest clue that exposes it, and a prevention or recovery check. Link a known learner mistake to the earlier problem where it was observed and record what correction the learner has since learned. Label branches as learner-observed, commonly plausible, or hypothetical; never present a simulated mistake as something he actually made. Aim to cover every plausible, instructionally relevant branch you can identify, while being honest that no list can guarantee every imaginable failure. Omit arbitrary edge cases that do not teach a useful distinction.

Do not show the full failure tree before the attempt. Use it to select a small starting retrieval cue, offer a targeted hint when needed, and compare the learner's actual path with the simulated branches afterward. If a known mistake is now well learned, test whether he catches it when relevant instead of teaching it from scratch again.

### Run the problem attempt

1. Choose a problem that uses one or two patterns he is ready to practice. Present the problem by itself and let him make a genuine first attempt before surfacing a pattern card or naming a solution. If he gets stuck, show only the front of the most relevant card and ask him to retrieve the pattern and explain why it fits; keep the answer side hidden until he has tried.
2. Keep the struggle useful and bounded. If he is stuck, give one progressively stronger hint at a time: point to a relevant cue → name a candidate pattern → suggest the next decision → show a worked step or solution. Do not keep withholding help. If frustration is rising, reduce the difficulty, take a break, or return to a related example.
3. Compare his actual solution path with the simulated success and failure branches. Identify whether an error came from choosing the wrong pattern, missing a prerequisite, applying a valid idea incorrectly, making an execution slip, or failing to check the result. Ask what clue or condition would change his choice next time.
4. Update the pattern graph with evidence from this attempt. Connect the problem to the relevant pattern and record a learner error only when it is actually observed; keep hypothetical branches labeled as such. After feedback, have him explain why the approach fit, which failure clue mattered, and when the pattern would not fit.
5. Fade support across examples: a worked example, then a partially completed example, then an independent problem. Mix related patterns and include near-misses that look similar but require a different choice.

The `quiz` tool is options-only, so use it for focused, gradable checks such as recognizing a cue or distinguishing two candidate patterns. Use a normal problem prompt and review his written solution in chat for open-ended, multi-step solving; do not reduce every solution to multiple choice. A correct answer alone does not show that he recognized the pattern or can transfer it.

### Make pattern cards from the graph

Create a card when a reasoning move is reusable and can be tested with one focused retrieval prompt. Do not make a separate card for every tiny step or hypothetical failure. The graph holds the full relationships; cards provide short retrieval entry points into it.

- **Front:** a short scenario, decision point, or fragment that cues the pattern without naming it. Ask what move fits and why. Use a known learner error as the trigger when relevant.
- **Back:** the pattern name; its reason and conditions; the failure mode it helps avoid; one early warning or checking move; one linked pattern that may follow; and a concrete prior problem plus a near-miss or counterexample.

Use several fronts for a pattern only when they test meaningfully different cues. Keep cue strength separate from the SM-2 interval: after successful retrievals, gradually make the front less explicit; after a failed retrieval, use a clearer cue sooner on the next similar problem, while still asking him to retrieve before showing the back.

### Persist and space pattern reviews

Keep the pattern graph and review state in the learner's existing linked Markdown note when one is available. Do not store learner-specific patterns in this shared Pi configuration. If no persistent note is available, keep the graph in the current lesson and ask where to save it before promising cross-session reviews.

Review a learned pattern later with a fresh problem or cue that requires him to retrieve the pattern, explain why it applies, and use it. Hide the pattern name and solution until he has attempted recall. Prefer a changed surface form or a contrast with a nearby pattern over repeating the exact worked example. A due review is practice, not a reason to derail the learner's current goal.

Use SM-2 as a review scheduler, not as a measure of expertise. Track `repetitions`, `interval_days`, `ease_factor` (start at 2.5), and `next_review` for each review item. Rate retrieval of the thinking move separately from the final problem answer: a correct answer reached by the wrong reasoning is a failed pattern retrieval; a sound pattern choice followed by an arithmetic slip can be a successful pattern retrieval plus a separate execution error. Rate only patterns he actually attempted to retrieve, not hidden hypothetical branches.

After each card retrieval, rate quality from 0–5: 5 = correct with a clear reason and little effort; 4 = correct with some hesitation; 3 = correct with substantial effort; 0–2 = incorrect, needed a hint, or could not retrieve. Then update the ease factor with `EF' = max(1.3, EF + 0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))`, where `q` is the quality rating. For `q < 3`, reset repetitions to 0 and schedule 1 day later. For `q ≥ 3`, increment repetitions and schedule 1 day after the first success, 6 days after the second, then `round(previous interval × EF')` days after later successes. Record the resulting date in the learner's local calendar. Keep importance or priority as a separate field; do not alter ease factor to protect a high-value card.

When a failed card is relevant to a later problem, surface its cue immediately after the learner's first attempt on the next similar problem, then fade it again after successful retrieval. When the graph shows a reliable sequence such as pattern A leading to pattern B, review them as a short linked pair, but keep each retrieval and rating separate. At a natural checkpoint after roughly 5–10 problems, run a brief mixed review of due or high-priority cards, including some context-free prompts, then return to problem application. Tag evidence by domain; call a pattern cross-domain only after it succeeds on unfamiliar problems in more than one domain.

SM-2 helps space retrieval; it does not prove transfer. Check transfer with delayed, unhinted problems he has not seen before, including problems that require distinguishing the target pattern from a similar one.

## Formatting — math renders as LaTeX

Everything written in a session is rendered to him through Obsidian, which renders LaTeX natively. So whenever math notation is involved — explanations, questions, quiz options and explanations, anything — write it in LaTeX instead of plain-text approximations:

- Inline math: `$f(x)$`
- Centered display math: `$$` fenced on its own lines, e.g. `$$\n f(x) \n$$`

If LaTeX can be used, it should be. Write $f(x) = x^2$, not `f(x) = x^2`.
