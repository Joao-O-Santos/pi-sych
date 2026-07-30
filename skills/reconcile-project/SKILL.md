---
name: reconcile-project
description: Coordinate human-owned resolution of confirmed project disagreements and record only reviewed state.
---

# Reconcile a project

1. Use `drift-review` findings or direct file inspection to state the disagreement precisely.
2. Present viable options in normal conversation; ask the project owner where direction, claims, architecture, publication, deployment, or irreversible state is affected.
3. For consequential multi-file changes, write a concise plan and use `submit_plan` when explicit review is useful.
4. Apply only the approved or explicitly authorized edits using normal Pi tools.
5. Run relevant checks with Bash and the applicable project skill.
6. Call `project_status` to acknowledge only files actually reviewed, using a truthful reason.

Never treat a clean status, a passing command, or an approved plan as proof of substantive correctness.

## Optional decision memo

When options are non-obvious, summarize them as: options, evidence, trade-offs,
unresolved questions, and the owner decision. Keep the memo short. Do not write
durable project state from an unapproved recommendation.

## Use with

Use after `drift-review` or conflicting `project_status` facts. Pair with
`strategy` when several accepted findings must become one response, and with
`project-status-review` after acknowledged writes.

## Optional user examples

If `~/.config/pi/skills/reconcile-project/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
