# R and Quarto

## Evidence chain and reproducibility

- Preserve established project layout, object names, and conventions unless an
  approved change requires otherwise.
- Document inputs and access constraints; record transformations and exclusions;
  separate confirmatory from exploratory and robustness work; provide an
  executable runner; and render from the same evidence chain.
- Do not install tools or invent package availability.

## R coding defaults

These defaults are defeasible:

- Preserve established project conventions first.
- For new code, prefer base `|>` over `%>%`; use another pipe only when
  compatibility or an established project convention requires it.
- Prefer clear pipelines and small functions that transform inputs and return
  values when that makes the data flow easier to inspect.
- Minimize mutation, hidden global state, and side effects when a direct
  functional flow is simpler.
- Use tidyverse consistently for tidyverse-shaped data manipulation rather than
  switching gratuitously between dialects. Prefer base R where it is clearer or
  avoids a needless dependency.
- Prefer tidyselect helpers for coherent sets of columns when they avoid
  parallel manually maintained name vectors.
- Use `snake_case` unless project conventions say otherwise.
- Keep comments sparse. Explain reasons, non-obvious constraints, analytical
  decisions, or gotchas rather than narrating obvious code.
- Let project-native formatters and linters own mechanical formatting.

## Checks and rendering

- Inspect project-native and available formatting, linting, testing, package and
  check, and render capabilities, and use them proportionately. Actual
  user-machine tool preferences can live in `STACK.md`; project-specific
  requirements can live in `AGENTS.md`.
- If a preferred tool is absent, report it and use the next best available
  check; never install tools unless explicitly asked.
- Compare rendered output with source data and computed objects.
- Before changing prose or code, identify affected tables, figures, methods, and
  results. Check variable names, conditions, samples, estimates, and
  interpretations agree everywhere.
- When a tool or dependency is unavailable, preserve the last verified state and
  never write results from expected output, partial console text, or statistical
  intuition.
