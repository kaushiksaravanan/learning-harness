# Review and transfer

### Calibrate difficulty and sequence problems

Use recent attempts and transfer evidence, not a rating number alone. Platform ratings are not directly comparable. State why the next problem is being assigned and what observable behavior would show progress. Select among reconstruction, delayed reasoning recall, a discrimination problem, a timed implementation, or an unfamiliar transfer problem according to the current gap.

- Distinguish the evidence layers: definition, mechanics on a small example, derivation, recognition, discrimination, implementation, and transfer. A learner can be strong in one layer and need help in another.
- If the learner recognizes a pattern but cannot derive or justify it, assign a reconstruction or proof task.
- If the learner can solve the known form but misses the precondition, assign a near-miss that requires rejecting or modifying the pattern.
- If the learner succeeds with support, weaken the cue on a different problem. If they succeed independently more than once, mix the pattern with established neighbors.
- If implementation or debugging is the bottleneck, target tracing, testing, or code repair rather than another recognition drill.
- Treat these as coaching judgments, not mastery cutoffs. Record sample sizes and feedback sources; one attempt should not set the ladder.

Keep a small queue with the target layer, reason for assignment, expected evidence, contrast, difficulty, mode, and effort window. Prefer verified problem IDs and links from the learner's target platforms. Do not claim the repository includes a ready-made rating ladder or a large vetted problem library; grow the library from analyzed problems and track provenance.

### Run the problem attempt

1. Start with a cold attempt and let the learner share their current understanding, proposed approach, or code. Do not interrupt while they are making useful progress. In study mode, set an effort window that fits the problem and learner; in contest mode, keep the timed attempt intact and defer help until the learner ends it.
2. Observe → classify the uncertainty → choose one intervention → ask for a response → update the working diagnosis. Separate missing prerequisite knowledge, retrieval failure, a mistaken assumption, proof gap, complexity error, implementation error, and debugging process. Use only evidence the learner shared. Mark inferred diagnoses provisional; a judge verdict alone does not identify a cause.
3. Choose the smallest intervention that targets the gap: ask for a restatement or tiny example; derive the brute-force baseline and its cost; prompt for a missing invariant or counterexample; trace actual state changes; compare operation counts or representations for TLE; or retrieve a prior failure-recovery move. If the learner is progressing independently, do not add a hint merely because one is available.
4. If the learner lacks a prerequisite, teach that prerequisite directly with a small worked example. Fade support through a partially completed example and an independent reconstruction. Otherwise, reveal one relevant cue at a time and wait for the learner's next attempt before giving another. After a reasonable effort, provide a full worked solution when explicitly requested; include proof, complexity, implementation checks, and why plausible alternatives fail. Then hide it and ask for reconstruction on a changed example.
5. Turn debugging into hypothesis testing. Before each edit, ask the learner to name one suspected cause, construct a test that distinguishes it from alternatives, predict the output, and compare that prediction with actual behavior. Record the hypothesis, evidence, and resulting change so repeated trial-and-error becomes a reviewable reasoning event.
6. Debrief by reconstructing the discovery path: baseline → bottleneck → representation or state choices → correctness argument → complexity check → implementation and verification. Ask which alternative they considered, what ruled it out, and what condition would make it appropriate. Keep observed steps separate from reconstructed or hypothetical ones.
7. When useful, ask for confidence before revealing feedback or submitting: record the claim, percentage, rationale, and prediction timestamp first. Record any checked outcome as a separate later event with its feedback source and evidence. The workspace stores learner-, coach-, or chat-model-entered outcomes; it does not verify them. Use high-confidence errors to investigate a specific misconception; use low-confidence successes to strengthen the explanation and retest later. Never treat confidence alone as skill.
8. Record problem-understanding time, approach-selection time, implementation time, and debugging/verification time separately when available. Use the segments to choose the next task; do not impose fixed personal targets based on a few early estimates.

If the chat client provides an options-only quiz tool, use it for focused, gradable checks such as recognizing a cue or distinguishing two candidate patterns. Otherwise ask directly in chat. Use a normal problem prompt and review his written solution for open-ended, multi-step solving; do not reduce every solution to multiple choice. A correct answer alone does not show that he recognized the pattern or can transfer it.

### Review a contest

Keep hints and pattern names hidden during the timed attempt. After the contest, ask for the result list and the learner's available notes, code, or recollection. For every wrong or unsolved problem, create a post-contest analysis draft and reconstruct the actual route only from what they share; label missing steps as inferred or hypothetical. Also review accepted problems that took unusually long or required substantial hints. A verdict alone is not a diagnosis. For each debugging sequence, capture the hypothesis, discriminating test, prediction, observed result, and edit. Link confirmed gaps to relevant review items, then add a delayed application or contrast problem when it tests a specific question. Do not automatically turn every contest problem or speculative branch into a review card.

### Make pattern cards from the graph

Create a card when a reasoning move or failure-and-recovery move is reusable and can be tested with one focused retrieval prompt. Derive cards from the per-problem dataset, not from a generic list alone. Use cards for problem recognition, algorithm or data-structure templates, common traps, complexity triggers, early warnings, and recovery moves. Card families can include approach failures, implementation traps, edge cases, early-warning checks, and judge-result recovery. Do not make a separate card for every tiny step or hypothetical failure. The graph holds the full relationships; cards provide short retrieval entry points into it.

Use [`templates/cp-pattern-card.md`](templates/cp-pattern-card.md) for learner-specific cards. Add a move to the learner's library only when it is reusable and source-linked; keep candidate cards labeled until unseen problems support transfer. This repository provides the card format and analysis agent, not a pre-vetted rating-band library.

- **Front:** a short statement fragment, operation pattern, code fragment, failed approach, judge verdict, or decision point, paired with relevant constraints but without the answer. Ask for the likely failure or pattern and the next check/recovery move.
- **Back:** the algorithm or data structure; its core invariant, recurrence, or proof idea; applicability conditions; time and memory complexity; the failure's cause and earliest warning; the prevention, test, or recovery move; one linked pattern that may follow; and 1–3 linked problems with their platform IDs or links and the shared structural clue, including a near-miss or counterexample.

Use several fronts for a pattern only when they test meaningfully different cues. For example, a front can ask for an algorithm from a partial statement and constraints, identify a likely binary-search bug from a failed check, or retrieve a previous problem from its key invariant. Keep cue strength separate from the SM-2 interval: after successful retrievals, gradually make the front less explicit; after a failed retrieval, use a clearer cue sooner on the next similar problem, while still asking him to retrieve before showing the back.

### Persist and space pattern reviews

Keep the pattern graph and review state in the optional workspace's browser storage while using the page; use Markdown export for a durable copy. Do not store learner-specific patterns in this shared skill bundle. Browser storage is local to that browser/profile and can be cleared, so do not describe it as a synced or backed-up record. If the page is unavailable, keep a Markdown note or use the chat client's supported memory.

Schedule distinct kinds of retrieval rather than treating an algorithm name as the entire skill:

- **Basic recall:** retrieve a definition, operation, or invariant from a short cue.
- **Reasoning recall:** derive why the operation or invariant supports the solution.
- **Discrimination:** compare neighboring methods (for example, BFS, 0–1 BFS, and Dijkstra) and identify the condition that selects or rules out each one.
- **Transfer:** recognize and apply the reasoning in a new statement or representation, with the algorithm name hidden.

Keep each item and rating distinct. Begin with focused practice until the learner can use the prerequisite in a simple context; then interleave similar techniques so the learner has to select between them. Use changed surface forms and contrast cases instead of repeating only the worked example. A due review is practice, not a reason to derail the learner's current goal.

Use SM-2 as a review scheduler, not as a measure of expertise. Track `repetitions`, `interval_days`, `ease_factor` (start at 2.5), `next_review`, and review mode (`timed` or `untimed`) for each review item. After a problem, review a failure the learner actually encountered or a move they were explicitly asked to retrieve. Ask for cause, early warning, and recovery before showing the answer. Rate retrieval separately from the final problem result and from whether the mistake occurred: catching a trap can show successful retrieval; falling into it but independently recovering may show partial retrieval; needing the card's answer is a failed retrieval. Record timed and untimed performance separately. Rate only observed events or explicitly tested hypotheses, not untouched hypothetical branches.

After each card retrieval, rate quality from 0–5: 5 = correct with a clear reason and little effort; 4 = correct with some hesitation; 3 = correct with substantial effort; 0–2 = incorrect, needed a hint, or could not retrieve. Then update the ease factor with `EF' = max(1.3, EF + 0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))`, where `q` is the quality rating. For `q < 3`, reset repetitions to 0 and schedule 1 day later. For `q ≥ 3`, increment repetitions and schedule 1 day after the first success, 6 days after the second, then `round(previous interval × EF')` days after later successes. Record the resulting date in the learner's local calendar. Keep importance or priority as a separate field; do not alter ease factor to protect a high-value card.

When a failed card is relevant to a later problem, surface its cue immediately after the learner's first attempt on the next similar problem, then fade it again after successful retrieval. When the graph shows a reliable sequence such as pattern A leading to pattern B, review them as a short linked pair, but keep each retrieval and rating separate. Maintain both directions of the index: each pattern links to its source and twist problems, and each problem lists its tested patterns. At a natural checkpoint after roughly 5–10 problems, run a brief mixed review of due or high-priority cards, including statement-to-algorithm, proof, complexity, and bug-finding prompts, then return to full problem application. Tag evidence by competitive-programming topic; call a pattern broadly reusable only after it succeeds on unfamiliar problems across multiple topic families.

SM-2 helps space retrieval; it does not prove transfer. For each evaluation, classify it as same-problem reconstruction, near transfer to a new problem with similar structure, or farther transfer to a new context. Record a unique problem ID, target or contrast, topic mix, difficulty, previous attempts, time since exposure, time since pattern review, help received before approach selection, timed/untimed mode, recognition, applicability explanation, proof, implementation, acceptance, and time segments when available. Keep the learner's “unseen” claim separate from verified problem identity and judging evidence. Count eligible attempts as well as outcomes; retain sample sizes and do not collapse recognition, proof, implementation, and speed into one mastery score.

Evaluate delayed, unfamiliar problems as the primary evidence of independent transfer; use card accuracy as supporting evidence. Compare reasonably matched blocks for difficulty, topic mix, hint exposure, and feedback source. Report observed denominators (such as `2 of 3 first-seen problems`) and distinguish near transfer from far transfer. Treat small samples as guidance for the next assignment, not proof of general expertise. Compare confidence with correctness and reasoning quality over multiple problems; confidence alone is not a performance measure.

## Portable formatting

Use standard Markdown and LaTeX math when the chat client renders it. If it does not, write equations in readable plain text and keep symbols consistent:

- Inline math: `$f(x)$`
- Centered display math: `$$` fenced on its own lines, e.g. `$$\n f(x) \n$$`

When the client supports LaTeX, write $f(x) = x^2$ instead of plain-text approximations. Use diagrams only in formats the client can render; otherwise describe the structure in text.
