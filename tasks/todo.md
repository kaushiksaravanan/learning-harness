# Implementation plan

- [x] Add a learner dashboard template for transfer evidence, review state, contest retrospectives, and the next-problem queue.
- [x] Build a single-page HTML workspace with problem/attempt text on the left and scrollable analysis on the right.
- [x] Add a CP problem analyst agent that drafts a sourced, provenance-labeled analysis from a problem statement.
- [x] Update the teaching skill with adaptive difficulty, transfer measurement, contest review, pacing, the single-page workspace, and honest limits around automation/live observation.
- [x] Update the README with the single-page workspace setup.
- [x] Review the diff and confirm no learner-specific data was added to the shared repository.

Risks: generated branches can be plausible but false; keep them labeled and sourced. The page has no model backend; prompt generation is copy/paste. Local browser storage is not a backup, so export Markdown for durable records.

## Learning mechanism update

- [x] Add a CP discovery-training reference that guides baseline → bottleneck → representation → proof/trade-off → reconstruction.
- [x] Adapt the teaching skill to choose a targeted intervention and switch between discovery, guided construction, and first-principles explanation.
- [x] Revise the teaching foundations and review policy for prerequisite-targeted instruction, worked-example fading, hypothesis-led debugging, and reasoning-transfer reviews.
- [x] Add attempt evidence for blockers, reasoning layers, confidence claims, debugging hypotheses, and four time phases.
- [x] Add provisional layer-gap and next-practice-focus summaries, card review types, and a descriptive confidence comparison.
- [x] Preserve the prompt actually shown separately from low-confidence diagnoses inferred after attempt notes are submitted.
- [x] Document evidence limits and CP-only scope in the app and repo docs.

Verification: no software tests or infrastructure checks run, per the requested scope. Risks: learner-entered labels and outcomes are not independently validated; phrase rules can miss or misclassify reasoning; no problem bank exists for automatic assignment.

## Response evaluation, transfer evidence, and portable skill

- [x] Add intervention success criteria, response evaluation states, and a rule-based follow-up recommendation; teach chat models to evaluate the shared response against the criterion before choosing the next move.
- [x] Replace hint-count-based unaided recognition with explicit, graded assistance exposure before approach selection.
- [x] Separate text mentions, suspected reasoning errors, coach/model-reviewed outcomes, and learner self-correction; prevent mention-only regex matches from becoming blocker diagnoses.
- [x] Preserve first and latest reasoning evidence, and separate same-problem reconstruction, near transfer, and far transfer with prior exposure and review timing.
- [x] Split confidence prediction and outcome into timestamped actions so only later outcomes with a non-self feedback source enter calibration.
- [x] Add an optional research-learning mode and make the canonical Agent Skill folder independent of Pi-only tools, with setup guidance for other chat clients.
- [x] Update the workspace, skill references, product docs, portable skill package guide, and local commit journal.

Risks: the browser has no model backend; semantic response evaluation must come from the installed skill/client or an explicitly selected coach judgment. Self-reported assistance and transfer distance remain self-reports. The existing workspace remains competitive-programming-specific.

Verification: `node --check cp-workspace-core.js`, `node --check cp-workspace.js`, and `git diff --check` passed. The test suite was not run.

## Reliability and adaptive-learning update

- [x] Restrict OpenCode commits to the exact file path reported by an edit event; make message checkpoints empty commits.
- [x] Let the coach prepare analyses and hint ladders before the learner records an attempt.
- [x] Derive attempt hint exposure from timestamped hint events and deduplicate transfer metrics by first-seen problem identity.
- [x] Serialize backup replacement against pending autosaves and add an import-race regression test.
- [x] Add explainable, low-confidence recurring-mistake and later-recovery candidates; connect attempts to hint events and graph links.
- [x] Install Chrome in CI and extend the browser flow for coach preparation, hints, transfer evidence, and import.
- [x] Update product documentation and verify the full test suite.
