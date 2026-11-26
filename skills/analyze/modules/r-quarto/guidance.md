# R and Quarto

## Start with the data and the question

Read comparable scripts and the project's style guide. Follow their analysis
layout, naming, and package choices. For new work without a house style,
use the defaults below.

Before fitting, find out what one row represents, which rows share a unit,
and where the predictors vary. Inspect the few columns and counts that bear
on the question. Use `head()`, `summary()`, `count()`, or `table()` directly
when they answer it. For example, `count(ds, tank, treatment)` shows both
how many observations came from each tank and whether treatment varied
within tanks. Keep checks that let someone understand or rerun a decision;
use assertions when an unattended run needs to stop on invalid input.

## Default script style

- Load the packages used throughout the script once at the start with
  `library()`. Call functions directly in analysis and teaching code; use
  `pkg::fun()` for collisions or when a deliberate local dependency is clearer.
  Install packages separately from analysis and render paths.
- Use `ds` for the main analysis data, `snake_case` for object names, and
  descriptive names for derived data and models. Prepare columns explicitly,
  then write `lm(mass_g ~ length_mm, data = ds)`, with column names in the
  formula. Preserve external names that belong to an input schema.
- Use the native pipe `|>` for a readable sequence of transformations. Use
  `dplyr` and `tidyr` where they simplify the work (for example,
  `drop_na(ds, mass_g, length_mm)` for complete cases on those two columns).
  Use base R for a simple operation when it reads better. Prefer a few direct
  steps to wrappers, nested selection machinery, or duplicated versions of
  the same workflow. Factor out actual repetition or a useful abstraction.
- Set contrast coding deliberately before fitting categorical models where
  coding affects the target tests. Use sum contrasts for a Type III workflow
  that calls for them, not as a session-wide reflex in unrelated code. Use
  `lm()` for ordinary linear models, `afex` for repeated-measures or mixed
  workflows where appropriate, `emmeans` for estimated means and contrasts,
  and `ggplot2` for plots. Choose the model and tools for the question.
- Use comments to explain analytical choices, units, or pitfalls. In
  teaching, explain the question and what to notice before moving on; put
  optional machinery after the runnable main path.

## Keep analysis and report aligned

Trace the reported comparison to the data preparation, model, contrast and
output that produce it. Use the same sample when comparing nested models.
Keep planned and exploratory work identifiable. Update captions, tables,
figures, and prose from the same analysis; check signs, scales, units,
denominators, and uncertainty against the output.

Run the relevant project checks and render the affected Quarto target. Inspect
the finished output as well as the source. If execution is blocked, preserve
verified results and say which result or render remains unverified.

See the [worked example](examples.md) and the
[reporting route](../reporting/guidance.md).
