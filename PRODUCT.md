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
- Timestamped hint events determine whether an attempt was unaided. Transfer counts use only the first attempt for each identified platform/problem ID or URL; unseen status and reasoning dimensions remain self-reported.
- Transparent phrase rules can suggest a low-confidence targeted prompt as the learner enters attempt notes, and identify recurring mistakes or explicit later recovery statements from notes and hint responses. A coach must confirm suggestions before they become linked graph nodes. This is not source-code analysis, a proof checker, or an AI diagnosis.
- Attempts can record Discovery, Guided construction, or First principles mode; a learner-selected or low-confidence suggested blocker; one of seven reasoning layers (definition, mechanics, derivation, recognition, discrimination, implementation, or transfer); confidence and rationale for a claim; a hypothesis-led debugging cycle; and time split across understanding, approach selection, implementation, and verification.
- Reasoning-layer progress keeps the latest recorded result per identified problem. A possible gap requires repeated evidence and remains a heuristic. The next-practice suggestion names a reasoning goal; there is no curated problem bank or automatic problem assignment.
- The attempt history preserves the prompt actually shown before saving, including a low-confidence prompt suggested while the learner enters notes. Later diagnosis updates cannot overwrite that event history.
- The confidence summary computes a descriptive Brier score only for resolved claims marked with a non-self feedback source. The learner enters both the outcome and source; neither is independently verified, and judge acceptance does not prove a general claim.
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
