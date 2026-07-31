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

{verified} The v3.0.0 implementation migrates synchronization to direct
`SYNC.json` version 2 with workspace, nearest-manifest, and configured
canonical-path resolution used throughout status and compaction. It adds
canonical-role promotion routing, bounded project-status projection into
working-memory compaction, malformed `INBOX.md` isolation,
custom-compaction failure classification, and restored v1.2.0
substantive skill guidance with a migration ledger and real-model
LLM-judged prompt-quality usage. The rough production TypeScript
estimate is about 2,650 lines within the owner-authorized 3,000-line
cap.

## Previous action

{verified} Completed the v3.0.0 deterministic release gate: 62 unit
checks, 4 integration checks, opt-in real-Pi usage, live LLM-judged
prompt-quality usage, style/Markdown/type checks, source budget, package
dry run, and whitespace check. The inherited Pi `brace-expansion` audit
advisory remains a recorded limitation.

## Immediate next step

{accepted} Approve the reviewed v3.0.0 working tree, then create its
signed tag and npm release.
