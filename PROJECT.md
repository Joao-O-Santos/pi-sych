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
changes, and keep new consequential choices human-owned.

{accepted} Treat persistence and scrutiny as independent task-posture
dimensions. Once a requested outcome and authorization boundary are
clear, continue until completion or a genuine blocker. Increase internal
checking for authored prose, consequential state, release/publication,
external effects, and ambiguous intent without manufacturing user
checkpoints. A clear request to review, rewrite, implement, or complete
a defined scope authorizes that scope.

{accepted} Choose direct work or delegation by task and context rather
than a universal default. Clean workers are appropriate when an explicit
packet is sufficient; trajectory workers are appropriate when prior
conversation materially helps. Supervisor pre-work recorded in a plan,
TODO, brief, or context file can enable later clean delegation.

## Definition of done

{accepted} The package is understandable, tested, and documented; its
active behavior matches its documentation; model-facing text has a clear
instruction hierarchy; and human users can inspect state, evidence,
limits, and verification without relying on hidden agent memory.

## Current direction

{accepted} Keep seven public umbrella skills (`project`, `write`,
`analyze`, `code`, `review`, `research`, and `automation`) with bounded
ordered task recipes, four shared methods, focused local modules,
bounded workers, independent substantive review, and no workflow
controller. Keep always-visible supervisor/tool text short and
high-salience; put domain posture/routing in umbrella skills and
detailed procedure in routed methods/modules. Preserve acceptable human
prose, while allowing explicitly requested whole-artifact
drafting/rewrite or review to run to completion without repeated
permission prompts.

{accepted} Runtime capability summaries, optional user-level `STACK.md`,
prompt-template packaging, and the richer settled-turn compaction
redesign remain planned rather than implemented.

## Current state

{verified} The supervisor prompt, dispatch tool guidance, worker schema
and assignment prompt, local literature tool guidance, seven umbrella
skills, selected project/review/prose modules, and current public and
maintainer documentation have been audited from a prompt/context
engineering perspective. The implemented task posture distinguishes
persistence from scrutiny, narrows approval checkpoints to genuinely new
consequential choices or side effects outside an authorized scope, and
makes clean-versus-trajectory delegation depend on actual context need.

{verified} `literature_search` now states that index results are
discovery metadata/snippets rather than source verification or
completeness evidence. Worker terminal-result fields now expose their
semantic limits in schema descriptions. Current compaction prompt
wording was audited but left unchanged because it already has a narrow
constrained role and the planned compaction redesign will replace its
present shape.

{verified} Present-tense README/configuration/architecture/development
text now describes seven skills and the persistence/scrutiny plus
clean/trajectory delegation semantics. Deterministic `make verify` is
green for this prompt/model-facing audit. Prompt word-count accounting
has been removed; the nonblank runtime source-code budget remains the
only repository size budget.

{verified} Three opt-in live prompt-quality fixtures cover authorized
persistence, whole-artifact high-scrutiny review, and context-aware
delegation. `npm run test:usage` has not been run as part of this pass.
No release/tag/publication action has been performed.

## Previous action

{verified} Completed the model-facing prompt/context-engineering audit,
removed prompt word-count budgets, aligned deterministic tests and
maintainer documentation, and passed the full deterministic repository
gate.

## Immediate next step

{accepted} Continue the remaining v7 runtime work: derived runtime
capability summary, optional `STACK.md`, thin review prompt templates if
retained, settled-turn compaction redesign, and documentation/image
reconciliation. Do not tag, publish, or release v7.0.0 without separate
owner instruction.
