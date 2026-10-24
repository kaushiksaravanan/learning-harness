# CP Problem Analysis — [platform / contest / problem ID]

> Working record for teaching. Keep the full analysis hidden during the learner's attempt. Copy and fill this template in the learner's study note; do not put learner-specific records in the shared skill repository.

## Source and attempt context

- Problem link / platform ID:
- Contest, rating, or estimated difficulty:
- Topic tags:
- Target learner rating / assessed background:
- Language, if implementation is included:
- Mode: timed / untimed
- Attempt time and judge result, if known:

## Problem model

- Goal, in one sentence:
- Input and output semantics:
- Explicit constraints:
- Aggregate or implicit limits (for example, sum of `n`, stack, or memory):
- Straightforward baseline and its time/memory cost:
- Required or plausible complexity range:

## Concept and dependency graph

| Node | Concept / invariant / data structure | Why this problem needs it | Prerequisites | Target-level status: second-nature / conscious / unknown |
|---|---|---|---|---|
| C1 | | | | |

| From | Relation (`requires`, `supports`, `alternative`, `conflicts`, `fails when`) | To | Evidence / reason |
|---|---|---|---|
| | | | |

## Multi-path solver simulations

Treat these as simulated perspectives, not real people or observed expert memories. Fill routes that reveal distinct reasoning; mark the others not applicable rather than inventing a path.

| Solver lens | Initial hypothesis | Attempts, checks, and decisions | Where stuck / wrong conclusion / missing knowledge | Recovery or outcome | Status / evidence |
|---|---|---|---|---|---|
| Strong, clean route | | | | | |
| Intermediate, obvious baseline | | | | | |
| Plausible wrong approach | | | | | |
| Careful but over-engineering | | | | | |
| Fast but implementation-careless | | | | | |

Add any materially different valid route or first-principles derivation:

| Route | Starting observation and reasoning | Where it works or fails, and why | Complexity / trade-off | Status and evidence |
|---|---|---|---|---|
| | | | | |

## Successful solver trace

Record decision points, including routine moves an experienced solver may do automatically. Separate what was observed from what is reconstructed.

| Step | Cue / current state | Question or candidate | Decision and reason | Invariant / state change / value flow | Cost and tacit check | Evidence: observed / derived / hypothesized |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

## Failure and recovery graph

Use one row per realistic branch. Record when it appears in the solve, why it is tempting, how a strong solver would detect it, and how they would recover. Link to prior problems. Mark learner errors as actual, near-miss, or hypothetical.

| ID | Solve phase | Trigger / decision point | Mistake and why plausible | Symptom / verdict | Expert's early detection or check | Prevention / recovery | Prior problem/card | Provenance and confidence |
|---|---|---|---|---|---|---|---|---|
| F1 | | | | | | | | |

Check relevant categories:

- Problem statement, variable meaning, input/output, and aggregate constraints
- Wrong algorithm family, invalid proof, missing state or update, or correct but unoptimized approach
- Time, memory, stack, and time-versus-memory trade-offs
- Wrong variable/data source, missing assignment/update, wrong returned value or object, stale or incorrect cached data
- Overflow, modulo arithmetic, indices, duplicates, edge cases, per-test-case state, sorting with original indices, and language/runtime behavior
- Weak verification: samples only, missing worst-case or adversarial tests, or no counterexample search after a wrong answer

## Expert early-warning checklist

- Before choosing an approach: What is the simplest baseline? Which constraint rules it out?
- Before coding: What does each variable/state represent? What invariant or proof makes updates safe?
- Before submission: Which boundary, aggregate, and worst-case tests remain unchecked?
- After a verdict: What smallest counterexample or resource bottleneck distinguishes the likely causes?

Add problem-specific checks and the quick paper test an experienced solver might use automatically.

## Why this construction?

- Core bottleneck / key observation:
- Which constraints force the chosen algorithm or data structure:
- Which design choices are optional:
- Why each accepted-solution component is present:
- Plausible alternative constructions and exactly where they fail (correctness, limits, or only efficiency):
- Time/memory trade-offs and accepted alternatives:

## Second-nature layer

| Cue | Automatic expert check or routine | Why it is safe/useful | How to prompt the learner to retrieve it | Evidence / target level |
|---|---|---|---|---|
| | | | | |

## Complete learning graph

Nodes can represent concepts, hypotheses/decisions, intermediate states, solution components, failure modes, checks, and recovery moves.

| Node ID | Type | Short description | Evidence / confidence |
|---|---|---|---|
| | concept / decision / state / solution / failure / check / recovery | | |

| From | Edge (`requires`, `leads to`, `blocks`, `is detected by`, `recovers from`, `implements`, `was learned from`) | To | Evidence / explanation |
|---|---|---|---|
| | | | |

## Learner attempt and teaching use

- Actual path / attempted approaches:
- Failure branches entered:
- Near-misses caught independently:
- Pattern card(s) surfaced and hint level:
- Learner's explanation of the trigger, cause, and recovery:
- Correction or next independent retry:
- What to fade or test on the next similar problem:

## Pattern card and review state

Create cards only for reusable, testable moves or failure/recovery pairs. Do not turn every hypothetical branch into a card.

- Card ID / pattern:
- Front: trigger only, with no answer:
- Back: reasoning move, applicability, early warning, and recovery:
- Linked problem IDs:
- Review mode: timed / untimed
- SM-2: repetitions / interval days / ease factor / next review:
- Last retrieval quality and evidence:
