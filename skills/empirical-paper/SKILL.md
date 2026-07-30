---
name: empirical-paper
description: Develop empirical manuscripts with traceable design, analysis-to-claim alignment, uncertainty, and useful alternatives.
---

# Empirical paper

Let the data-generating design and actual analysis constrain every claim. A
useful drafting order is methods, results, discussion, introduction, abstract,
and title: figures, tables, and estimates often reveal the story before prose
does. Adapt that order when the project has a genuine reason to differ.

## Methods

Describe what participants, materials, and procedures made possible from the
participant's or system's point of view, in chronological order where useful.
Report the actual randomization, counterbalancing, exclusions, stopping rule,
measures, transformations, and analysis decisions—not an idealized plan. State
whether key decisions were preregistered, exploratory, or changed, without
pretending that exploratory work is confirmatory.

Justify sample size with an a priori calculation, simulation, resource limit,
or other honest rationale. Treat randomization, replication, and blocking as
design choices to explain. State between-/within-unit trade-offs, carryover
control, and the full factorial structure when applicable.

## Results and interpretation

Lead results paragraphs with the substantive pattern, then give the estimate,
uncertainty, and statistical evidence needed for the reader to assess it. Do
not report unqualified main effects when an interaction changes their meaning.
Trace prose, tables, and figures back to concrete outputs; never invent a
number, model, exclusion, or robustness result.

Separate observed results from their interpretation. Ask whether reverse
causality, a common cause, selection, measurement choices, moderators, or
countervailing processes could explain the pattern. A non-significant result is
not proof of no effect, and statistical significance is not practical or
theoretical importance.

## Use with

Use `scholarly-manuscript` for the paper-wide argument, `r-quarto` for traceability to analysis and rendering, and `verification` to compare the final manuscript with its evidence chain.

## Optional user examples

If `~/.config/pi/skills/empirical-paper/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
