# Project

## Objective

{accepted} Maintain Pi Sych as a small, reviewable Pi package for
serious writing, research, analysis, automation, and code projects.

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
users: seven public umbrella skills (`project`, `write`, `analyze`,
`code`, `review`, `research`, and `automation`), bounded ordered task
recipes, four reusable shared methods, focused local modules, bounded
workers, independent substantive review, and no automated workflow
controller. Writing defaults should preserve acceptable human prose and
follow established author/project style when drafting. Review should
prioritize structure, clarity, repetition, argument and voice coherence,
and divergence from accepted project state. Automation should compose
actual available capabilities; a richer runtime capability summary and
user-level `STACK.md` remain planned rather than implemented.

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
measured source is about 2,450/2,500 lines after the malformed
`SYNC.json` startup repair. The supervisor now discovers seven public
skills because package discovery already targets the whole `skills/`
directory; adding `automation` required only Markdown plus catalogue-test
updates, not runtime changes. The writing and review guidance has also
been strengthened around conservative revision, author-style drafting,
structure-first editing, collaborative/adversarial review lenses, and
project-state divergence. Runtime capability summaries, `STACK.md`,
prompt-template packaging, and compaction changes remain unimplemented.
No v7 tag or publication has been performed. Use signed Git tags and npm
registry metadata, not this narrative, for release state.

## Previous action

{verified} Added the public `automation` umbrella skill and updated the
skill-catalogue tests and current public-contract/maintainer
documentation. Strengthened writing and review skill guidance and added a
v7 implementation plan for remaining runtime work.

## Immediate next step

{accepted} Finish the planned runtime and documentation work before a
v7 release: capability/`STACK.md` support if retained, prompt-template
packaging if retained, compaction redesign, remaining present-tense
seven-skill documentation/diagram updates, full verification, and an
independent read-only review. Do not tag, publish, or release v7.0.0
without separate owner instruction.
