---
name: project-briefing
description: Create or refresh a reviewed tracked PROJECT.md from a rough idea or project evidence, preserving accepted, provisional, inferred, and unresolved status.
---

# Project briefing

Use `/brief` rather than demanding a formal specification. For a new project, restate the likely work, identify the highest-leverage unknown, and ask one focused question at a time. Explain why a non-obvious question matters and offer options when useful. When relevant, surface practical constraints such as venue or audience, length or format, deadline, and delivery requirements as ordinary brief content rather than new required headings. Stop once there is enough to begin useful work.

Keep facts and decisions explicitly labelled `[accepted]`, `[provisional]`, `[inferred]`, or `[unresolved]`. Do not promote an inference or assumption to accepted state. Present the candidate brief for review and save only after approval.

For refreshes, inspect the current brief, relevant documentation and files, project memory, and Git evidence. Add only evidence-grounded inferences, identify contradictions, and ask only questions evidence cannot answer. The supervisor alone writes the brief; workers may only propose updates.

## Use with

Use `bootstrap-project` or `project-initialization` to establish missing project state. Use `project-status-review` after an approved brief update, and `drift-review` when the brief conflicts with other tracked artifacts.

## Optional user examples

If `~/.config/pi/skills/project-briefing/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
