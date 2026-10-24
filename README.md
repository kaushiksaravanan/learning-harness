# learn

[![video](assets/thumbnail.png)](https://www.youtube.com/watch?v=kzcI5F4tGiU)

My AI learning system from this video: [How I Use AI to Learn Things](https://www.youtube.com/watch?v=kzcI5F4tGiU).

This is a personal system I built for myself, shared as-is. Built as a pi configuration: the teaching philosophy encoded in a skill, a few small extensions, and agent definitions.

## What's in it

- `skills/teach/` — competitive-programming coaching with a six-stage per-problem reasoning dataset, multi-path solver simulations, failure-and-recovery graphs, second-nature checks, pattern cards, transfer tracking, contest reviews, adaptive problem queues, pacing, and teacher-guided SM-2 reviews; includes problem-analysis, dashboard, and card templates
- `skills/visualize/` — adds a correct, minimal diagram to a lesson when an idea is clearer as a picture
- `extensions/ask-user-question/` — the agent asks you questions through a UI popup
- `extensions/quiz/` — graded questions with instant feedback (✓/✗, correct answer, explanation)
- `extensions/md-log/` — link a markdown file to the session
- `extensions/visual-tools/` — tools for visualization subagents
- `agents/` — `cp-problem-analyst`, `researcher`, `svg-maker`, `mermaid-maker`: the subagents the system delegates to

## Install

This repo **is** a `.pi` directory. From your learning project's root:

```bash
git clone https://github.com/kaushiksaravanan/learning-harness .pi
```

Then open pi in that directory. (Or copy the pieces you want into your existing project config.)

## Requirements

- [pi](https://github.com/earendil-works/pi)
- A subagent implementation, so the system can spawn the researcher and the visual makers. Recommended: [pi-interactive-subagents](https://github.com/amosblomqvist/pi-interactive-subagents) (tmux only). With it, everything works out of the box. Any other implementation works too, but expect to adapt the agent definitions, e.g. `agents/researcher.md` lists `safe_bash` in its tools, which is specific to that extension.
- `ask-user-question` — use the copy bundled here. If your setup already has an `ask-user-question` extension, use **this** one in its place. Popups from different extensions serialize through a shared UI lock, which only works when it's the same implementation.

## Notes

You can run the system without subagents. The main session does the teaching and drafts problem analyses. You just lose the `cp-problem-analyst` and researcher helpers (sourced analysis and truth verification) and the generated visuals.

The teaching skill is written for one learner (me). Edit the skill to fit how you learn best.

## Open the CP workspace

Open [`cp-workspace.html`](cp-workspace.html) in a browser and keep the two JavaScript files beside it. It is one single-page workspace: the left pane holds the problem and learner attempt; the right pane contains the coach analysis, shown after an attempt is recorded. The local problem library keeps separate attempt histories, a shared typed knowledge graph, pattern cards, and a due-review queue. It autosaves on this device and supports a full JSON backup/import plus per-problem Markdown export.

The prepared hint ladder releases one cue at a time after the learner records what they tried. It does not classify free-text attempts or connect to an AI model; **Copy analysis prompt** is the handoff to an external session. Reasoning dimensions and feedback sources are recorded as user-entered evidence, so self-ratings are not treated as verified proof. Browser storage is not a backup; export the JSON library regularly.

The `cp-problem-analyst` Pi agent can draft sourced, provenance-labeled analyses when the subagent extension is available. Verify its solution claims before using them. The repo still does not include a large vetted problem library or live code-editor monitoring. The Markdown dashboard, analysis, and card templates are optional export/reference formats, not another required interface.

## Run the checks

```bash
node --test tests/*.test.cjs
```

The suite uses Node 22. The browser workflow test runs when Chromium is available; set `CHROME_PATH` to its executable if it is not on a standard path. CI requires Chromium for that test.
