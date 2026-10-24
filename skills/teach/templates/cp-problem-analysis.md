# CP Problem Analysis — [platform / contest / problem ID]

> Working record for teaching. Keep the full analysis hidden during the learner's attempt. Copy and fill this template in the learner's study note; do not put learner-specific records in the shared skill repository.

## Source and attempt context

- Problem link / platform ID:
- Contest, rating, or estimated difficulty:
- Topic tags:
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

| Node | Concept / invariant / data structure | Why this problem needs it | Prerequisites |
|---|---|---|---|
| C1 | | | |

| From | Relation (`requires`, `supports`, `alternative`, `conflicts`, `fails when`) | To | Evidence / reason |
|---|---|---|---|
| | | | |

## Candidate solution routes

Include a baseline, a tempting alternative, and the successful route when these are meaningfully distinct. Record other valid solutions when they teach a useful trade-off.

| Route | Starting observation and reasoning | Where it works or fails, and why | Complexity / trade-off | Status and evidence |
|---|---|---|---|---|
| Baseline / brute force | | | | |
| Tempting alternative | | | | |
| Successful route | | | | |

## Successful solver trace

Record decision points, including routine moves an experienced solver may do automatically. Separate what was observed from what is reconstructed.

| Step | Cue / current state | Question or candidate | Decision and reason | Invariant / state change / value flow | Cost and tacit check | Evidence: observed / derived / hypothesized |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

## Failure and recovery graph

Use one row per realistic branch. Link the branch to its trigger, cause, earliest warning, test or prevention, recovery, and related prior problems. Mark learner errors as actual, near-miss, or hypothetical.

| ID | Trigger / decision point | Mistaken assumption or action | Why plausible; likely symptom or verdict | Earliest warning / discriminating test | Recovery move | Prior problem/card | Provenance and confidence |
|---|---|---|---|---|---|---|---|
| F1 | | | | | | | |

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
