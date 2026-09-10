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
explicit in `PROJECT.md` and `SYNC.json`; use optional `EVIDENCE.md` as
bounded task evidence rather than an accumulating release log. Give
workers exact resources, retain immutable results, report unexpected
changes, and require human approval for consequential durable changes.

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

{verified} Local version metadata is prepared for 7.0.0. The supported
literature schema replaces scalar `first_author` with nullable
`item_type` and nullable ordered, role-aware `creators_json` metadata.
The read-only search adapter performs shallow structural checks and
returns parsed `itemType` and `creators` without schema adaptation, CSL
semantic validation, citation formatting, or creator inference. Users of
local literature search must rebuild or migrate v6 databases externally
and update result consumers; other users have no literature-data
migration. The approved runtime cap remains 2,500 nonblank lines;
measured source is 2,380 lines, an intentional 30-line increase for
validation and mapping. The final local gate passed 167 tests with
98.22% line, 92.31% branch, and 95.07% function coverage. Package dry
run, Pages build, production audit with no reported vulnerabilities, and
independent read-only implementation review also passed. No v7 tag,
push, or publication has been performed. Use signed Git tags and npm
registry metadata---not this narrative---for release state.

## Previous action

{verified} Implemented and documented the approved v7 structured-creator
contract, deterministic boundary tests, external migration guidance, and
7.0.0 package metadata. Completed full local verification, exact source
counting, site build, production audit, package inspection, and an
independent final review with no findings. The temporary plan and task
ledger are complete and removed.

## Immediate next step

{accepted} None at present. Do not push, tag, publish, or release
without separate owner instruction.
