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
users: six umbrella skills with direct one-level modules, bounded
workers, independent substantive review, and no automated workflow
controller.

## Current state

{verified} The current implementation keeps direct `SYNC.json` version 2
resolution, SHA-256 status checks, declared dependency impact, bounded
workers, and explicit acknowledgement. It uses a small working-memory
summary, append-only human-review proposals in `INBOX.md`, direct named
model roles, and narrow MCPorter and Plannotator adapters. Production
TypeScript is about 1,550 lines within the 2,000-line cap.

## Previous action

{verified} Completed the focused v4 correctness pass and documentation
rewrite. The implementation now bounds compaction, preserves explicit
symlink behavior, surfaces project validation errors, rechecks files
before acknowledgement, validates worker-reported paths, loads model
configuration lazily, and keeps bootstrap/MCPorter boundaries explicit.
The deterministic gate passed 27 unit checks and 5 integration checks.

## Immediate next step

{accepted} Release signed patch `v4.0.3` through GitLab CI after the
full release gate passes. Existing public tags remain immutable.
