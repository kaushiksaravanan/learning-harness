# learn

[![video](assets/thumbnail.png)](https://www.youtube.com/watch?v=kzcI5F4tGiU)

My AI learning system from this video: [How I Use AI to Learn Things](https://www.youtube.com/watch?v=kzcI5F4tGiU).

This is a personal learning system, shared as-is. It includes a portable Agent Skill for teaching competitive programming, optional Pi integrations, and a local browser workspace. The teaching method works in ordinary chat; a particular provider, plugin, or workspace is not required.

## What's in it

- `skills/teach/` — portable Agent Skill for CP teaching: discovery and guided construction, adaptive diagnosis, response evaluation, evidence-aware transfer, pattern cards, and SM-2; includes an optional research-learning mode and install notes for other chat apps
- `cp-workspace.html` — optional local CP problem library and learning-evidence recorder; it does not call a model or watch an editor
- `skills/visualize/` — adds a correct, minimal diagram to a lesson when an idea is clearer as a picture
- `extensions/ask-user-question/` — the agent asks you questions through a UI popup
- `extensions/quiz/` — graded questions with instant feedback (✓/✗, correct answer, explanation)
- `extensions/md-log/` — link a markdown file to the session
- `extensions/visual-tools/` — tools for visualization subagents
- `agents/` — `cp-problem-analyst`, `researcher`, `svg-maker`, `mermaid-maker`: the subagents the system delegates to

## Use the teaching skill in another chat app

See [`skills/teach/README.md`](skills/teach/README.md) for app-specific setup. Keep the `skills/teach` folder intact so its references and templates stay linked. Use the app's skill import when available; otherwise add `SKILL.md` to its custom instructions and upload the supporting references you need. ChatGPT, Claude, OpenCode, and Gemini offer different skill, file, and instruction features, so the portable guide links to their current official docs and describes the fallback.

The teaching loop uses ordinary chat. Without the optional browser workspace, keep learner evidence in Markdown or the client’s memory. Across apps, export and bring the relevant Markdown record yourself; the skill does not silently share browser storage between providers.

## Install the optional Pi configuration

From your learning project's root:

```bash
git clone https://github.com/kaushiksaravanan/learning-harness .pi
```

Then open Pi in that directory. (Or copy the pieces you want into your existing project config.)

## Optional Pi integrations

- [Pi](https://github.com/earendil-works/pi) is required only for the `.pi` integrations below, not for the portable skill.
- A subagent implementation, so the system can spawn the researcher and the visual makers. Recommended: [pi-interactive-subagents](https://github.com/amosblomqvist/pi-interactive-subagents) (tmux only). With it, everything works out of the box. Any other implementation works too, but expect to adapt the agent definitions, e.g. `agents/researcher.md` lists `safe_bash` in its tools, which is specific to that extension.
- `ask-user-question` — use the copy bundled here. If your setup already has an `ask-user-question` extension, use **this** one in its place. Popups from different extensions serialize through a shared UI lock, which only works when it's the same implementation.

## Notes

You can run the system without subagents. The main session does the teaching and drafts problem analyses. You just lose the `cp-problem-analyst` and researcher helpers (sourced analysis and truth verification) and the generated visuals.

The teaching skill is written for one learner (me). Edit the skill to fit how you learn best.

## Open the CP workspace

Open [`cp-workspace.html`](cp-workspace.html) in a browser and keep the two JavaScript files beside it. It is one single-page workspace: the left pane holds the problem and learner attempt; the right pane contains coach analysis and can be prepared before practice. The local problem library keeps separate attempt histories, a shared typed knowledge graph, pattern cards, and a due-review queue. It autosaves on this device and supports a full JSON backup/import plus per-problem Markdown export.

The prepared hint ladder releases one cue at a time after the learner records what they tried. The attempt form supports discovery, guided construction, and first-principles practice. It records the help received before approach selection, an intervention's success criterion and entered evaluation, explicit diagnosis status, reconstruction/near/far transfer classification, timestamped confidence predictions and later outcomes, a hypothesis-led debugging cycle, and time spent understanding, choosing an approach, implementing, and verifying. It retains first and latest reasoning checkpoints separately; next-focus suggestions remain low-confidence heuristics, not mastery judgments or assignments from a problem bank.

The workspace preserves the intervention shown before an attempt is saved. Simple phrase rules mark text mentions only; they do not classify a misconception or inspect code. Response evaluations, diagnosis reviews, help level, unseen status, transfer distance, and feedback sources are entered by the learner, coach, or connected chat model and are not independently verified by the page. **Copy analysis prompt** hands the record to an external chat session. Transfer counts require a unique platform/problem ID or URL; reconstruction on a familiar problem stays separate from near and farther transfer on new problems. Confidence outcomes must be recorded after timestamped predictions. Review cards can target basic recall, reasoning, discrimination, or transfer. Browser storage is not a backup; export the JSON library regularly. Imports replace the local library after queued saves finish.

The `cp-problem-analyst` Pi agent can draft sourced, provenance-labeled analyses when the subagent extension is available. Verify its solution claims before using them. The repo does not include a large vetted problem library or live code-editor monitoring. The Markdown dashboard, analysis, and card templates are optional export/reference formats, not another required interface.

## OpenCode commit journal

When OpenCode runs from this repository, it automatically loads `.opencode/plugins/auto-commit-journal.js`. Restart OpenCode after adding the plugin. It creates a Git commit for each reported file edit, each incoming user message, and each completed assistant message (including tool handoffs). Message-only checkpoints create empty commits so they also have a hash. The hook writes the hash, changed paths and Git summary, event, session/message IDs, and available prompt/response context to `.opencode/commit-journal.local.md`; Git ignores that local journal.

The hook requires Git. File-edit events stage only the exact reported path; user and assistant message checkpoints create empty commits and never sweep other changed files. It will not commit a file that was already dirty when the plugin started, and it skips automatic commits while the index contains staged work. Those skips are recorded in the local journal so unrelated work is not silently mixed into a checkpoint. File-edit commits include the latest user prompt when OpenCode exposes it; the hook does not generate an independent semantic code review.

## Run the checks

```bash
node --test tests/*.test.cjs
```

The suite uses Node 22. The browser workflow test runs when Chromium is available; set `CHROME_PATH` to its executable if it is not on a standard path. CI requires Chromium for that test.
