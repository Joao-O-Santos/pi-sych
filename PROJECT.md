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

{verified} The unreleased `6.0.0` implementation builds on `5.0.4` with
a correctness+simplification pass. It raises the Node baseline to 26,
centralizes Pi configuration-root and named-skill lookup with
cross-platform validation, distinguishes current/changed/missing/error
observation states, extracts valid JSON from compaction model output,
consolidates the model-catalog loader, shares the worker result TypeBox
schema, removes the MCPorter config existence preflight, and fails fast
on malformed SYNC.json at startup. Production TypeScript is exactly
2,000 lines within the strict budget. No tag, push, npm publication, or
image replacement has occurred for this work.

## Previous action

{verified} Committed the v6.0.0 implementation as `0ae415e8`. Signed
commit passed local typecheck, style, 63/63 tests, source budget
(2000/2000), and site build. Evidence and synchronization need updating.
The next step is to update SYNC.json and EVIDENCE.md, then run an
independent review gate before tagging.

## Immediate next step

{accepted} Update EVIDENCE.md and SYNC.json to reflect the verified
v6.0.0 implementation, run an independent review gate, then tag and
publish if the review passes.
