---
name: artifact-to-project
description: Extract a reviewable Pi Sych project-state candidate from an existing manuscript, report, analysis, or repository artifact while separating explicit content from inference.
---

# Artifact to project state

Read repository instructions and the selected artifact before proposing canonical project state.

1. Identify the artifact path, title, headings, references, tables, figures, source code, or outputs that are actually present.
2. Record direct observations as `explicit` and cite their exact artifact path.
3. Mark claims about purpose, contribution, intended audience, or artifact authority as `inferred` unless the artifact states them directly.
4. Mark missing rationale, evidence, scope, and completion criteria `unresolved`.
5. Produce grouped candidate updates for `PROJECT.md`, `EVIDENCE.md`, `DECISIONS.md`, `STYLE.md`, `TODO.md`, or `SYNC.md` only when supported by the artifact. Treat `TODO.md` as explicit local task state, not evidence, project direction, or an inferred replacement for an external issue tracker.
6. Present candidates for review. Never write or turn inference into acceptance without explicit user approval.

Use `/pi-sych-init` for the initial project candidate and `/pi-sych-sync` for a synchronization-manifest candidate.

## Optional user examples

If `~/.config/pi/skills/artifact-to-project/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
