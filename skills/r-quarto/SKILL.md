---
name: r-quarto
description: Develop R and Quarto work with traceable analysis, rendered-output checks, and prose-code-data alignment.
---

# R and Quarto

Use the host R and Quarto installations; do not fabricate execution, output, or
package availability. Preserve the project's existing directory layout,
object names, and conventions unless a bounded change is approved. Keep
project-specific templates and analysis decisions in project guidance rather
than this public skill.

## Analysis-to-prose traceability

Treat scripts, data transformations, fitted objects, figures, tables, and the
rendered document as one evidence chain. Before changing a claim, identify the
script and named output that supports it. Before changing code, identify which
methods text, results paragraph, table, or figure must be revisited. Do not
silently alter an analysis while revising prose.

For data work, distinguish raw input, cleaning, confirmatory analysis,
exploratory or robustness analysis, and presentation. Record exclusions,
transformations, model choices, and uncertainty where a reader can assess them.
Use project tests, host R checks, and Quarto rendering when available; compare
the rendered artifact with source data and computed output rather than trusting
source text alone.

When a tool or dependency is unavailable, report that limitation and preserve
the last verified state. Never write results from expected output, partial
console text, or a model's statistical intuition. Check that variable names,
conditions, sample sizes, estimates, and interpretations agree across code,
tables, figures, and prose.

## Optional user examples

If `~/.config/pi/skills/r-quarto/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
