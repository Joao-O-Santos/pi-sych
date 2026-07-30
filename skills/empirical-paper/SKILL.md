---
name: empirical-paper
description: Develop empirical manuscripts with traceable design, analysis-to-claim alignment, uncertainty, and useful alternatives.
---

# Empirical paper

Let the data-generating design and actual analysis constrain every claim. A
useful drafting order is methods, results, discussion, introduction, abstract,
and title: figures, tables, and estimates often reveal the story before prose
does. Adapt that order when the project has a genuine reason to differ.

## Methods checklist

- Participants, materials, and procedures from the participant's or system's
  point of view, in chronological order where useful.
- Actual randomization, counterbalancing, exclusions, stopping rule, measures,
  transformations, and analysis decisions—not an idealized plan.
- Whether key decisions were preregistered, exploratory, or changed, without
  dressing exploratory work as confirmatory.
- Sample-size justification: a priori calculation, simulation, resource limit,
  or other honest rationale.
- Between-/within-unit trade-offs, carryover control, and full factorial
  structure when applicable.

## Results checklist

- Lead with the substantive pattern, then give the estimate, uncertainty, and
  statistical evidence the reader needs.
- Do not report unqualified main effects when an interaction changes their
  meaning; qualify interactions and simple effects honestly.
- Report effect sizes and uncertainty where they help interpretation; do not
  treat a threshold statistic as practical or theoretical importance.
- Trace prose, tables, and figures back to concrete outputs; never invent a
  number, model, exclusion, or robustness result.
- Keep confirmatory and exploratory/robustness findings visibly distinct.

## Interpretation checklist

- Separate observed results from their interpretation.
- Ask whether reverse causality, a common cause, selection, measurement
  choices, moderators, or countervailing processes could explain the pattern.
- A non-significant result is not proof of no effect.
- State concrete limitations and discriminating next tests rather than only
  generic future-work boilerplate.
- Cross-check that abstract, methods, results, discussion, tables, and figures
  make compatible claims.

## Use with

Use `scholarly-manuscript` for the paper-wide argument, `r-quarto` for
traceability to analysis and rendering, `theory-development` when alternative
accounts need generative expansion, and `verification` to compare the final
manuscript with its evidence chain.

## Optional user examples

If `~/.config/pi/skills/empirical-paper/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
