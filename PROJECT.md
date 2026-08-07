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

{verified} The unreleased `6.0.2` implementation builds on `5.0.4` with
a correctness+simplification pass, an independent review corrective
pass, and a final review-correction pass. It raises the Node baseline to
26, centralizes Pi configuration-root and named-skill lookup with
cross-platform validation, distinguishes current/changed/missing/error
observation states, surfaces artifact observation errors, restores
dependency impact for missing artifacts, requires active untracked
compaction files to exist, extracts valid JSON from compaction model
output, consolidates the model-catalog loader, shares the worker result
TypeBox schema, removes the MCPorter config existence preflight, fails
fast on malformed SYNC.json at startup, fixes `PI_SYCH_PACKAGE_ROOT`
off-by-one, ends atomic-file disposal before rename, uses
`mkdtempDisposable()` for worker cleanup, and adds deterministic tests
and regression coverage. Runtime source is 1,975 actual lines (2000/2000
rounded). v6.0.0 was tagged; v6.0.1 corrective tag exists; v6.0.2 is the
current head.

## Previous action

{verified} Committed the v6.0.0 implementation, updated evidence, and
tagged `v6.0.0`. A corrective `v6.0.1` tag addressed review findings. A
final `v6.0.2` pass fixed architecture diagram rendering, package-root
traversal, atomic-file scope, observation-error test determinism, worker
cleanup, and added regression tests. Local gate passed: 66 tests, source
budget 1975/2000, typecheck+style clean. An independent review confirmed
the three previous blockers are genuinely fixed and the two new code
issues are resolved.

## Immediate next step

{accepted} Run an independent review gate on the `v6.0.2` head, then tag
and publish `v6.0.2` if the review passes.
