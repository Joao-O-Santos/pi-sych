---
name: artifact-review
description: Diagnose bounded artifact issues through a selected review lens without independently redesigning the artifact.
---

# Artifact review

This is the stable review core. Select a lens appropriate to the artifact:
argumentative coherence, evidence, prose, skeptical review, pedagogy, audience
load, grant compliance, architecture, maintainability, requirements, or
security. Optional companion skills refine the pass without replacing this core:

- `review-structure` for organization, contribution visibility, and navigation;
- `review-detail` for claims, evidence, alternatives, fallacies, and statistics;
- `review-copyedit` for sentence-level clarity and consistency after structure
  is sound.

A worker may receive this skill alone or together with one or more companions.
Composition is optional and supervisor-chosen; this package does not run a
multi-agent review controller. Useful patterns are: one worker with core plus
selected lenses, or separate bounded reviews whose visible results a human
combines.

## Finding form

For each material finding, state:

1. **Location** — section, heading, paragraph, figure, table, file, or interface.
2. **Concern** — the concrete problem in plain language.
3. **Why it matters** — effect on reader understanding, validity, safety, or use.
4. **Minimum response** — the smallest credible fix or decision, not a redesign.
5. **Kind** — defect, tradeoff, robustness issue, preference, or unresolved
   alternative, when that distinction helps.
6. **Confidence or limitation** — only when uncertainty affects the finding.

When useful, order findings by location. End with one explicit blind-spot
question when the selected lens could miss a material alternative. Do not
redesign the artifact or apply findings independently.

## Scholarly skeptical review

When reviewing a claim or interpretation, generate alternatives as questions,
not accusations. Ask whether the contrary could be partly true; the direction
could be reversed; a common cause, selection process, measurement choice, or
moderator could account for the pattern; opposing processes could mask one
another; deviant cases matter; or conflicting studies reveal a boundary
condition. Deliberately produce several plausible accounts before preferring
one.

Name a fallacy or statistical concern specifically when present, explain why it
weakens the inference, and do not imply that it proves the conclusion false.
Frame bias checks as "check whether" questions: whether hypotheses, exclusions,
analyses, or reporting changed after results were known; whether null or
contrary evidence is omitted; and whether practical importance is being
confused with a threshold statistic. Preserve the distinction between a missing
citation, a weak inference, an unresolved alternative, and an authorial choice.

## Use with

Use `strategy` to choose among accepted findings, `verify-change` after an
implemented response, and `verification` for a whole-artifact judgment. Use
`drift-review` before `reconcile-project` when findings reveal cross-file
disagreement. Pair optional `review-structure`, `review-detail`, or
`review-copyedit` when those lenses match the task.

## Optional user examples

If `~/.config/pi/skills/artifact-review/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
