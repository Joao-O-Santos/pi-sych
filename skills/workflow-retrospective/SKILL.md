---
name: workflow-retrospective
description: Review a completed or troubled workflow and propose scoped improvements.
disable-model-invocation: true
---

# Workflow retrospective

Invoke deliberately after a completed or troubled workflow. This skill is
non-mutating: it may propose, never apply.

1. Separate observed events and actual verification from interpretations.
2. Identify project-local lessons before proposing reusable skill or package changes.
3. Require repeated evidence or an obvious structural defect before proposing a general rule.
4. State limitations and alternative explanations.
5. Propose changes for human review; never edit package code, skills, or project state automatically.

## Optional proposal format

For each candidate improvement:

- **Observed evidence** — what happened, including commands or artifacts checked.
- **Basis** — repetition across episodes, or a single structural defect.
- **Candidate lesson** — the smallest useful rule or habit.
- **Alternative explanation** — error, one-off context, or operator preference.
- **Proposed local target** — for example project `AGENTS.md`, `STYLE.md`, a
  checklist, or no change.
- **Human decision** — accept, accept modified, defer, or reject.

Do not derive durable state from unattended transcript mining, capture plugins,
scheduled jobs, or global memory stores. Do not create Git commits from this
skill. Durable edits happen only through ordinary reviewed work after an
explicit owner decision.

## Optional user examples

If `~/.config/pi/skills/workflow-retrospective/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
