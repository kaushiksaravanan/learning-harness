# Teach skill

`SKILL.md`, its references, and its templates form a portable teaching skill for competitive programming. The policy works in ordinary chat: it does not require Pi, a plugin, a particular model provider, or the bundled browser workspace. The optional Research mode is documented for cases where the learner asks to reason about papers or experiments.

## Install in another chat app

Keep the `teach` directory intact so relative links from `SKILL.md` to `references/` and `templates/` continue to work. Use the app's native skill import when available. Otherwise, place the body of `SKILL.md` in the app's custom instructions and attach the reference files that apply to the session.

- **Agent Skills compatible clients:** upload or install this directory (or a ZIP containing the `teach/` directory) as a skill. The format follows the open [Agent Skills specification](https://agentskills.io/specification).
- **Claude:** use Claude's supported Agent Skills upload or installation flow; see [Claude Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).
- **ChatGPT:** when Skills are available for your account or workspace, upload the folder or ZIP through the Skills interface; see [Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt). The [OpenAI API Skills guide](https://developers.openai.com/api/docs/guides/tools-skills) describes the API workflow.
- **OpenCode:** place the folder in a location recognized by its skill loader; see [OpenCode skills](https://docs.opencode.ai/docs/skills/).
- **Gemini Gems or other instruction-based apps:** paste the skill's core instructions into the app's instruction field and upload relevant references as knowledge files. These apps may not import the Agent Skills folder format directly; check the app's current import and file limits.

Tool calls are optional. If the app has no quiz tool, ask and assess the question in chat. If it has no browser or research tool, ask for a source or label the claim unverified. If it has no persistent memory, ask the learner to bring a Markdown record into the next session. Do not claim to inspect code, browser storage, or activity the learner has not shared.

## Optional CP workspace

The repository's [`../../cp-workspace.html`](../../cp-workspace.html) is a separate local browser companion. It can store attempts and evidence, but it has no model connection and does not provide the teaching skill by itself. Export Markdown or JSON when moving records between devices or chat clients. Do not upload private learner records unless the learner intends to share them with that service.

## Portability notes

The shared teaching rules are provider-neutral. A client may differ in context length, memory, browsing, file upload, and tool availability, so adapt the interaction while preserving the evidence distinctions and success criteria. Optional Pi agents and extensions in the repository are integrations, not requirements of this skill.
