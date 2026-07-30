---
name: drift-review
description: Review substantive disagreement among project files and artifacts without confusing it with hash changes.
---

# Review conceptual drift

Use this only after inspecting relevant files. A `project_status` hash mismatch is a reason to inspect, not evidence of conceptual drift.

Compare the relevant purpose, scope, claims, evidence, methods, terminology, architecture, decisions, and artifact content. Report:

- exact files and passages reviewed;
- explicit agreement and disagreement;
- what remains uncertain;
- possible consequences for dependent artifacts; and
- the specific project-owner decision required, if consequential.

Do not choose an authority automatically, update `SYNC.md`, or write reconciliation edits without the appropriate review and authorization.

## Optional user examples

If `~/.config/pi/skills/drift-review/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
