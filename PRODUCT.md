# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single-file HTML/CSS/JavaScript, matching the requested HTML page. No framework or service was requested.

## Users

One learner studying competitive programming.

## Product Purpose

Provide one workspace where the learner can keep a problem and their attempt on the left while building a coach-side reasoning and failure analysis on the right.

## Operating Context

The learner uses the page during competitive-programming study. The analysis includes concept dependencies, solver routes, realistic failure/recovery branches, design rationale, second-nature checks, reusable pattern cards, and transfer notes.

## Capabilities and Constraints

- The current page autosaves in browser-local storage, exports Markdown, and copies a structured analysis prompt for use with an external AI session.
- It does not call an AI model, sync with a notes app, or watch code in an editor.
- Generated reasoning remains subject to source checking and provenance labels; the page does not claim an exhaustive failure graph.
- The autosave behavior is an implementation choice, not a guarantee of backup or cross-device sync.

## Evidence on Hand

The user requested a single HTML interface with problem text on the left and scrollable analysis on the right. No vetted problem library, external AI credentials, or editor integration was supplied. Do not fabricate these.

## Product Principles

- Keep problem input and reasoning analysis in one page.
- Preserve the learner's first attempt before revealing pattern cues.
- Track retrieval and unseen-problem transfer as separate evidence.
- Keep simulated routes distinct from observed learner behavior.

## Accessibility & Inclusion

Use semantic headings and labels, keyboard-visible focus, readable contrast, and a stacked small-screen layout.
