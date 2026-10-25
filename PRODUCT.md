# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JavaScript assets in one single-page interface. No framework or service was requested.

## Users

One learner studying competitive programming.

## Product Purpose

Provide one workspace where the learner can keep a problem and their attempt on the left while building a coach-side reasoning and failure analysis on the right.

## Operating Context

The learner uses the page during competitive-programming study. The analysis includes concept dependencies, solver routes, realistic failure/recovery branches, design rationale, second-nature checks, reusable pattern cards, and transfer notes.

## Capabilities and Constraints

- The page maintains multiple problem records, attempt events, a shared typed graph, pattern cards, a due review queue, transfer measures, counterfactual prompts, and JSON backup/import.
- Autosave uses IndexedDB when available and falls back to browser-local storage. The page also exports per-problem Markdown and copies a structured analysis prompt for use with an external AI session.
- Coach view can prepare a problem and hint ladder before the learner attempt. This is a display gate, not security: the data remains in the browser profile and is not encrypted.
- Attempts record help received before approach selection (none, general question, strategic cue, partial solution, or unknown). An absent hint event is not treated as proof of unaided work. New-problem evidence is split into near and farther transfer; same-problem reconstruction is reported separately. Identity and unseen status still rely on the learner-provided problem ID and self-report.
- Each adaptive intervention includes a success criterion. The learner, coach, or external chat model can record a response evaluation and evidence, and the workspace recommends a next move from the evaluation. The browser does not semantically evaluate free text or call a model.
- Transparent phrase rules mark possible text mentions only. A mention is not a suspected misconception or confirmed reasoning error. The learner can record a suspicion, ruled-out signal, or independent correction with evidence; confirmed errors require coach or chat-model review plus evidence. This is not source-code analysis or a proof checker.
- Attempts can record Discovery, Guided construction, or First principles mode; a learner-selected blocker; one of seven reasoning layers (definition, mechanics, derivation, recognition, discrimination, implementation, or transfer); a hypothesis-led debugging cycle; and time split across understanding, approach selection, implementation, and verification.
- Reasoning-layer progress retains both the first and latest checkpoint per identified problem. Possible gaps remain heuristics. The next-practice suggestion names a reasoning goal; there is no curated problem bank or automatic problem assignment.
- The attempt history preserves the prompt actually shown before saving, its success criterion, the entered evaluation, and evidence. Later diagnosis updates cannot overwrite that event history.
- Confidence predictions and outcomes are separate timestamped events. The descriptive Brier score includes only later outcomes marked with a non-self feedback source. The learner enters the source and outcome; neither is independently verified, and judge acceptance does not prove a general claim.
- Review cards can be typed as basic recall, reasoning recall, discrimination, or transfer. These schedules remain distinct per card; the harness does not establish that transfer occurred just because a transfer card was reviewed.
- JSON import waits for pending writes and replaces the saved library as one serialized transaction.
- It does not call an AI model, sync with a notes app, or watch code in an editor.
- Generated reasoning remains subject to source checking and provenance labels; the page does not claim an exhaustive failure graph.
- The autosave behavior is an implementation choice, not a guarantee of backup or cross-device sync.

## Evidence on Hand

The user requested a single HTML interface with problem text on the left and scrollable analysis on the right. No vetted problem library, external AI credentials, or editor integration was supplied. Do not fabricate these.

## Product Principles

- Keep problem input and reasoning analysis in one page.
- Allow a coach to prepare the hint ladder before practice, while keeping the learner view clear for a cold attempt.
- Track retrieval and unseen-problem transfer as separate evidence.
- Keep simulated routes distinct from observed learner behavior.

## Accessibility & Inclusion

Use semantic headings and labels, keyboard-visible focus, readable contrast, and a stacked small-screen layout.
