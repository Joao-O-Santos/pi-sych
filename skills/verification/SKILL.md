---
name: verification
description: Verify an artifact against its brief, evidence, deterministic checks, global coherence, scope, and approval boundaries.
---

# Verification

Check brief alignment, implementation completeness, deterministic results,
unapproved changes, lost claims/citations/placeholders/interfaces, global
coherence, complexity, scope, maintainability, and whether a clean rewrite
would have been better. Report pass, revise, or reject with concrete required
corrections. Never claim a check was run when it was not.

## Selectable workflow recipes

Choose or combine recipes that match the actual change. None is mandatory.

- **Prose:** reverse outline; claim/support gaps; terminology consistency;
  package or project style defaults; lost placeholders or citations.
- **Scholarly or empirical:** abstract–body agreement; contribution visibility;
  methods/results/discussion compatibility; uncertainty and alternatives;
  confirmatory vs exploratory labelling.
- **Software:** project-native format, lint, type, test, and build commands;
  public interface and error-path checks; scope and unapproved dependency
  review.
- **R/Quarto:** runner or script executes; when installed, run `r-air`/`jarl`
  and apply their formatting or fixes as ordinary work; project tests; Quarto
  or report render; prose matches computed output.
- **Release:** version and changelog agreement; package contents; tag/publish
  only under explicit instruction; provenance or registry checks the project
  actually uses.

## Scholarly and empirical depth

For scholarly artifacts, trace central claims back to identified evidence,
methods, analyses, or explicitly labelled theoretical premises. Check that the
abstract, introduction, methods, results, discussion, tables, figures, and
references make compatible claims. Distinguish a missing source from an
unverified source, a weak inference, and an unresolved alternative explanation.

For empirical or computational work, compare prose against the actual data
pipeline and rendered outputs. Verify the reported sample, measures,
exclusions, model, uncertainty, and result direction; flag where that evidence
is unavailable rather than reconstructing it from narrative. Confirm that
revision did not turn exploratory results into confirmatory claims or erase
meaningful nulls, limitations, or scope conditions.

## Use with

Use `verify-change` for project-native commands and their actual outcomes. Use
`artifact-review` for a bounded diagnostic before a revision, and pair empirical
or computational work with `empirical-paper` or `r-quarto`.

## Optional user examples

If `~/.config/pi/skills/verification/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
