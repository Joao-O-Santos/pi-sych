# Project

## Objective

{accepted} Maintain Pi Sych as a small, reviewable Pi package for
serious writing, research, analysis, and code projects.

## Audience and use

{accepted} Scientific writers, researchers, and maintainers who want
explicit project state, bounded delegation, truthful verification, and
human-owned consequential decisions.

## Intended contribution

{accepted} Pi Sych keeps project state and evidence visible, reports
changed hashes and declared dependency impact without silently making
semantic judgments, and supports bounded workers without claiming that
generated prose or automated checks replace human judgment.

## Deliverables

{accepted} The public package, its tests, baseline skills, concise
human-facing documentation, and private local configuration outside this
repository.

## Constraints

{accepted} Do not expose credentials, add a fixed workflow controller,
make sandbox or pseudo-security claims, push or publish without
instruction, or let model output stand in for evidence, citations,
verification, or final review.

## Project rules and preferences

{accepted} Prefer direct and minimal implementations. Keep durable state
explicit in `PROJECT.md`, `EVIDENCE.md`, and `SYNC.json`. Give workers
exact resources, retain immutable results, report unexpected changes,
and require human approval for consequential durable changes.

## Definition of done

{accepted} The package is understandable, tested, and documented; its
active behavior matches its documentation; and human users can inspect
state, evidence, limits, and verification without relying on hidden
agent memory.

## Current direction

{accepted} Keep the package small, explicit, and reviewable for human
users: six public umbrella skills with bounded ordered task recipes,
four reusable shared methods, focused local modules, bounded workers,
independent substantive review, and no automated workflow controller.

## Current state

{verified} The unreleased `6.1.0` implementation extends v6.0.9 with
worker-only local literature search over a canonical `papers` plus
external-content `papers_fts` SQLite schema, custom-compaction seams,
expanded worker lifecycle/result-protocol coverage, live generated code
reference and code-tour documentation, simplified Node coverage
reporting, and the complete deterministic package/site gate. It uses
Node 26 `node:sqlite`, keeps the supplied index schema as the sole
literature contract, and maps `filepath`, `title`, `first_author`,
`year`, and `doi` while searching filepath, title, abstract, tags, and
DOI. Compaction clipping preserves valid UTF-8 boundaries and promotion
proposals are constrained to single-line inbox entries. Source budget is
2,099 actual lines (2,100 rounded). Version is 6.1.0; the release tag
and package publication have not occurred.

## Previous action

{verified} Implemented the v6.1.0 plan: added worker-only literature
search, expanded deterministic lifecycle/protocol and workbench tests,
introduced the custom-compaction seam, simplified diagnostic coverage,
added live code-reference generation and a code tour, aligned package
load and documentation, and standardized literature search on the
supplied `papers`/`papers_fts` schema. Meaningful boundary coverage also
identified and corrected UTF-8 clipping, multiline promotion, and test
fixture-cleanup defects. The full local gate passed: 121 unit tests, 12
integration tests, typecheck, style, dependency check, source budget
(2,099/2,100 actual/rounded), package dry run, Pages build, coverage,
and whitespace checks.

## Immediate next step

{accepted} Push the verified v6.1.0 commit to main, confirm the remote
verification job succeeds, then create and push tag `v6.1.0`. Do not
publish the package or perform other release actions.
