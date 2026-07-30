---
name: r-quarto
description: Develop R and Quarto work with a default analysis pipeline, preferred host checks, rendered-output verification, and prose-code-data alignment.
---

# R and Quarto

Use the host R and Quarto installations; do not fabricate execution, output, or
package availability. Preserve the project's existing directory layout, object
names, and conventions unless a bounded change is approved. Keep
project-specific templates and analysis decisions in project guidance rather
than this public skill. Do not assume a particular operating system or shell
setup, and do not install tools unless the user explicitly asks.

## Default pipeline

When the project has no established pipeline, prefer this overridable sequence:

1. Document inputs and, when required, anonymization or access constraints.
2. Wrangle from raw input into analysis-ready tables with recorded exclusions
   and transformations.
3. Run confirmatory analysis according to the pre-stated plan or design.
4. Keep exploratory and robustness work clearly separated from confirmatory
   claims.
5. Provide a reproducible runner or entry script the host can execute.
6. Render a Quarto report or manuscript from the same evidence chain.

If the project already has a different sound pipeline, preserve it and record
only deliberate departures.

## Preferred checks and formatting

When installed and relevant:

- Run `r-air` and apply its formatting or fixes as part of ordinary R work.
- Run `jarl` when it applies to the repository.
- Run the project's own tests, `R CMD` checks, and Quarto render commands.

Do not ask for separate approval merely to format or lint with those installed
tools. Still report what ran and what changed. If a preferred tool is absent,
report that limitation and use the next best project-native check. Never pretend
a missing tool ran, and never install tools unless the user explicitly asks.

## Analysis-to-prose traceability

Treat scripts, data transformations, fitted objects, figures, tables, and the
rendered document as one evidence chain. Before changing a claim, identify the
script and named output that supports it. Before changing code, identify which
methods text, results paragraph, table, or figure must be revisited. Do not
silently alter an analysis while revising prose.

Record exclusions, transformations, model choices, and uncertainty where a
reader can assess them. Compare the rendered artifact with source data and
computed output rather than trusting source text alone. When a tool or
dependency is unavailable, report that limitation and preserve the last verified
state. Never write results from expected output, partial console text, or a
model's statistical intuition. Check that variable names, conditions, sample
sizes, estimates, and interpretations agree across code, tables, figures, and
prose.

## Use with

Use `empirical-paper` for manuscript claims supported by the analysis,
`verify-change` for actual R or Quarto commands, and `verification` to inspect
the rendered artifact and its evidence chain. Use `revealjs-slides` when the
same analysis feeds a talk.

## Optional user examples

If `~/.config/pi/skills/r-quarto/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
