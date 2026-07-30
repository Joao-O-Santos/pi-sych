---
name: project-status-review
description: Interpret mechanical project_status results and choose a proportionate review action.
---

# Review project status

1. Call `project_status` with `action: "check"`.
2. Treat changed hashes, missing files, and declared dependents as mechanical facts only.
3. Read the changed files and relevant dependents before describing conceptual drift, authority, or required edits.
4. Ask the project owner when resolution affects central claims, scope, architecture, publication, deployment, or irreversible state.
5. After review and relevant edits or checks, call `project_status` with `action: "acknowledge"`, named reviewed files, and a truthful reason.

Acknowledgement records reviewed state; it does not prove correctness. Acknowledging an input may leave declared dependents marked `needs-review` until they are separately reviewed.

## Optional user examples

If `~/.config/pi/skills/project-status-review/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
