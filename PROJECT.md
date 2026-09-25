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

{accepted} Finished standalone prose should be intelligible without the
prompt, earlier drafts, reviewer exchange, or agent conversation. Treat
unmotivated version/revision language, defensive negation,
reviewer-response residue, and other process-dependent rhetoric as
possible context leakage, while allowing such language when the genre
itself is a response letter, revision memo, or change record. Preserve
useful authorial idiosyncrasy rather than replacing it with generic
model polish.

{accepted} Research should choose available capabilities by function
rather than provider name. Local literature indexes, scholarly
metadata/graph services, peer-reviewed gateways, full-text/PDF readers,
broad search, and targeted fetch/browser tools have different jobs.
Named services are examples, not requirements; tool outputs should
inform subsequent retrieval rather than be called mechanically or
treated as source verification.

## Definition of done

{accepted} The package is understandable, tested, and documented; its
active behavior matches its documentation; model-facing text has a clear
instruction hierarchy; and human users can inspect state, evidence,
limits, and verification without relying on hidden agent memory.

## Current direction

{accepted} Keep seven public umbrella skills (`project`, `write`,
`analyze`, `code`, `review`, `research`, and `automation`) with small
task routes, optional method overlays, four shared methods, focused
local modules, bounded workers, independent substantive review, and no
workflow controller. Keep always-visible supervisor/tool text short and
high-salience; put domain posture/routing in umbrella skills and
detailed procedure in routed methods/modules. Preserve acceptable human
prose, while allowing explicitly requested whole-artifact
drafting/rewrite or review to run to completion without repeated
permission prompts.

{accepted} Runtime capability summaries, thin packaged review prompts,
and settled-turn compaction are implemented. An optional user-maintained
`STACK.md` may describe the user's durable computer/environment facts
for computer-use work. Project software requirements and workflows
remain in `AGENTS.md` and/or `PROJECT.md`.

## Current state

{verified} The supervisor prompt, dispatch tool guidance, worker schema
and assignment prompt, local literature tool guidance, seven umbrella
skills, selected project/review/prose modules, and current public and
maintainer documentation have been audited from a prompt/context
engineering perspective. The implemented task posture distinguishes
persistence from scrutiny, narrows approval checkpoints to genuinely new
consequential choices or side effects outside an authorized scope, and
makes clean-versus-trajectory delegation depend on actual context need.

{verified} `literature_search` frames results as discovery metadata and
snippets rather than source verification or completeness evidence. It
checks for required v7 columns before search and reports incompatible
schemas with migration guidance. Worker terminal-result fields expose
their semantic limits in schema descriptions. The supervisor-start
capability summary is derived from active tools and local inspection and
remains non-authorizing. Local literature and remote MCPorter state do
not verify source access.

{verified} Writing and review guidance includes artifact
self-containment and reader-friction/context-leakage checks. Review
lenses now explicitly trace prose flow in reading order and diagnose
cumulative patterns such as semicolon/em-dash repetition, unmotivated
"not X but Y" contrasts, and stacked hedges without turning them into
punctuation quotas or bans. They distinguish calibrated uncertainty from
defensive hedging and require findings to explain reader effect.
Standalone manuscripts should not retain revision-history,
reviewer-response, prompt, or version language without an independent
scholarly purpose; response-to-reviewers artifacts remain free to use it
when genre requires it.

{verified} Research guidance now instructs models to inspect available
capability classes and use them for their native purpose. Local
literature search, OpenAlex-like metadata, Scholar Gateway-like
scholarly retrieval, full-text/PDF readers, broad discovery search, and
targeted webpage fetch are examples rather than mandatory providers.
Metadata and snippets remain discovery evidence until the underlying
source is inspected when exact claims, methods, results, quotations, or
correction status matter.

{verified} `PLAN.md` and `TODO.md` record v7 implementation and release
hardening. Five packaged review prompts remain thin and defer to the
`review` skill. Custom compaction retains bounded observable trajectory
at the settled boundary, preserves recorded decision labels without
verification, appends only bounded unreviewed inbox proposals, never
mutates canonical semantic files, and falls back to the native compactor
on omission or failure. Worker dispatch now reports claimed, observed,
and unreported project changes even after failure; observation does not
roll back changes. Plannotator absence does not prevent core startup.

{verified} Present-tense
README/configuration/architecture/public-contract text describes seven
skills, derived non-authorizing capability state, the
persistence/scrutiny and clean/trajectory semantics, and implemented
settled compaction. Prompt word-count accounting has been removed; the
nonblank runtime source-code budget is 3,200 lines, providing headroom
for the current approximately 3,000-line runtime.

{verified} Repository-native formatting, documentation, type, budget,
and test checks are part of the maintained acceptance boundary. The
working package version is 7.0.0. Check current publication status from
the release commit, annotated tag, and npm registry metadata rather than
this project brief.

## Previous action

{verified} Regenerated and visually reviewed the workflow, architecture,
supervisor-context, and skills-architecture diagrams. Updated their
textual descriptions; the local image-updated candidate is now
undergoing release verification.

## Immediate next step

{user-explicit} The owner authorized doing what is needed to ship
v7.0.0. Rerun repository gates and inspect final package contents, then
create and push the signed release commit. Confirm main verify and Pages
pass on that commit; push the signed annotated v7.0.0 tag to trigger CI
publication with npm provenance. Verify the exact published version and
`latest` dist-tag; do not publish from the local machine.
