# Alternative handoffs

These illustrate choices, not a sequence every task must follow. Substitute
actual configured model roles, exact skill selectors, and existing paths.

## Pre-walk when repository understanding dominates

The supervisor reads the implementation and tests, rejects an incompatible
approach, and checks a representative change. The remaining implementation is
bounded but the exploratory reasoning matters.

Dispatch a builder with `contextMode: trajectory`, the actual source/test files
in `contextFiles`, a suitable cheaper `modelRole`, and `mode: full-host` if
repository checks require Bash. State what is already done, what remains,
interfaces that must not change, required verification, and when to return a
blocker. The worker continues the defined scope; it does not repeat the first
change or obey an obsolete instruction to stop after planning.

## A clean plan is enough

The accepted migration is fully specified in a brief with target interfaces,
examples, affected paths, and checks. Dispatch a clean builder from those files.
No first edit or trajectory is necessary; let the builder inspect current code.

## Planner/builder with pre-walk-like continuity

The supervisor has explored and planned but has not edited. The plan captures
work items, while useful reasoning and rejected approaches remain in history.
Dispatch the builder with `contextMode: trajectory` plus the plan and current
source files. This hybrid preserves exploratory context without requiring a
first edit or forcing a clean restart; specify the remaining scope explicitly.

## Exploration for breadth, not outsourced understanding

Ask a read-only explorer to locate every caller of an interface and report
paths/symbols, relevant snippets, ambiguities, and suspected hidden dependencies.
The supervisor then reads decisive callers before designing the migration.
A cheap summary saying “all callers are compatible” is not the evidence.

## Independent scrutiny without shared-file races

After implementation, dispatch a clean read-only reviewer with requirements,
changed artifacts, and tests, optionally using another model family and the
review skill. Ask for concrete findings and missing checks, not approval.
Review findings can inform direct fixes or a bounded follow-up builder.
Do not concurrently let multiple builders edit the same implementation/test
files; integration and observed-change reports do not isolate their writes.
