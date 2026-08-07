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

{verified} The current unreleased `5.0.0` implementation keeps direct
`SYNC.json` version 2 resolution, SHA-256 status checks, declared
dependency impact, bounded workers, explicit acknowledgement, the
unchanged six-field working-memory schema, and append-only human-review
proposals in `INBOX.md`. It adds one visible strict `config.json`,
configurable custom and 100,000-token compaction, independently
selectable Plannotator, optional MCPorter and Plannotator dependencies,
a strict relative-path configuration contract, Pi-native
`PI_PACKAGE_DIR` support, three held-in real-Pi benchmarks, Make/Pandoc
Pages generation, and an explicit public-contract and SemVer boundary.
Production TypeScript remains about 1,900 lines within the 2,000-line
cap. No tag, push, npm publication, or image replacement has occurred
for this work.

## Previous action

{verified} Released `pi-sych@5.0.4`. Signed commit
`198df03911fe9cd5bf91dec09dc08df73a46c0bc` and tag `v5.0.4` passed
GitLab verify and publish-npm; npm reports `5.0.4` with provenance
metadata. The release included realistic benchmarks, optional
integrations, Pages foundations, visible configuration, and independent
coverage tooling. The next unreleased correctness pass is being prepared
as `6.0.0` because it raises the Node baseline to 26 and changes runtime
observation and failure semantics.

## Immediate next step

{accepted} Implement and verify the approved correctness+simplification
pass for unreleased `6.0.0`: finish the shared Pi-root and worker/status
refactors, reduce runtime source below the strict budget, complete
focused coverage and integration tests, review the replacement diagrams
and Pages rendering, then update evidence and synchronization. Do not
tag or publish until those gates and independent review are complete.
