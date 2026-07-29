---
name: project-initialization
description: Initialize or reconstruct reviewable Pi Sych project state from a focused greenfield interview or existing artifact without accepting inference automatically.
---

# Project initialization

Use this skill when a project lacks `PROJECT.md` or `SYNC.md`, when existing state is materially incomplete, or when the user explicitly requests re-initialization.

## Greenfield

Ask one focused question at a time. Establish only what is useful to begin: objective, audience, contribution, deliverable, constraints, and completion criteria. Stop once a candidate can be reviewed; do not mechanically exhaust a questionnaire.

Create a grouped candidate for `PROJECT.md`, and create `EVIDENCE.md` only when evidence tracking is relevant. Label each candidate statement `explicit`, `inferred`, or `unresolved` as appropriate. Present the candidate before any write. A user response is explicit input, not accepted durable state until the user approves the candidate.

## Existing artifacts

Identify the principal artifact and inspect its headings and directly relevant source. Extract what it says explicitly. Mark interpretations of its role, contribution, or project direction as inferred. Mark absent high-impact information unresolved. Do not invent rationale, claims, evidence, or acceptance.

## Write and synchronization

Use `/pi-sych-sync` to produce a reviewable `SYNC.md` candidate after project files exist. Confirm proposed authority domains and freshness states with the user. Write candidate files only after explicit approval. State which artifacts may need synchronization after the approved write.

## Optional user examples

If `~/.config/pi/skills/project-initialization/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
