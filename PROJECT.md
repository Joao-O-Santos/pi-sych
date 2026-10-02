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

{accepted} For argumentative prose, treat accepted central claims and
their intended force as durable project state when the owner records
them. Evidence calibration is bidirectional: prevent unsupported
strengthening, but also prevent a supported accepted thesis from being
silently weakened into a safer or less contestable substitute. If new
evidence conflicts with an accepted argument invariant, surface the
conflict rather than resolving it by semantic drift.

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

{accepted} Thin packaged review prompts and settled-turn compaction are
implemented. Pi's active tool and MCP declarations supersede Pi Sych's
startup capability summary. An optional user-maintained `STACK.md` may
describe durable computer/environment facts. Project software
requirements and workflows remain in `AGENTS.md` and/or `PROJECT.md`.

## Current state

{verified} v8.0.0 is tagged and published. It uses strict layered
version 2 configuration, Pi-native worker MCP/codemode, a 150k task-
centred compaction threshold, and structured read-only literature
discovery. MCPorter and the special-case companion web inheritance were
removed; companion packages remain separately installed.

{verified} Against the v7.0.1 deterministic coverage baseline (97.48%
lines, 90.23% branches, 95.31% functions), the current v8 preparation
coverage measures 97.85% lines, 92.27% branches, and 96.80% functions.
Runtime nonblank source is about 3,200 lines, within the 3,200-line
budget. The local native MCP fixture and live read-only Context7 worker
call passed. The opt-in real-model workflow and an installed-package
`project_status` dogfood call passed after private local v8
configuration migration.

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
checks required v7 columns before searching and provides validated
structured and bounded readable results. Worker result fields expose
semantic limits in schema descriptions. Pi declares active tools and
native MCP servers; Pi Sych does not duplicate those summaries.

{verified} Writing and review guidance includes artifact
self-containment and reader-friction/context-leakage checks. Review
lenses now explicitly trace prose flow in reading order and diagnose
cumulative patterns such as semicolon/em-dash repetition, unmotivated
"not X but Y" contrasts, stacked hedges, and thesis drift without
turning them into quotas or bans. They distinguish calibrated
uncertainty from defensive hedging, require findings to explain reader
effect, and treat evidence calibration as bidirectional: supported
accepted argumentative force should not be lost merely because a weaker
formulation is safer. Standalone manuscripts should not retain
revision-history, reviewer-response, prompt, or version language without
an independent scholarly purpose; response-to-reviewers artifacts remain
free to use it when genre requires it.

{verified} Research guidance now instructs models to inspect available
capability classes and use them for their native purpose. Local
literature search, OpenAlex-like metadata, Scholar Gateway-like
scholarly retrieval, full-text/PDF readers, broad discovery search, and
targeted webpage fetch are examples rather than mandatory providers.
Metadata and snippets remain discovery evidence until the underlying
source is inspected when exact claims, methods, results, quotations, or
correction status matter.

{verified} The completed v7 plan and v8 release checklist were removed
after release completion. Historical changes remain in Git and the
changelog. Five packaged review prompts remain thin and defer to the
`review` skill. Custom compaction retains bounded observable trajectory
at the settled boundary, preserves recorded decision labels without
verification, appends only bounded unreviewed inbox proposals, never
mutates canonical semantic files, and falls back to the native compactor
on omission or failure. Worker dispatch now reports claimed, observed,
and unreported project changes even after failure; observation does not
roll back changes. Plannotator absence does not prevent core startup.

{verified} Present-tense
README/configuration/architecture/public-contract text describes seven
skills, Pi-native MCP worker selection, layered configuration,
persistence/scrutiny and clean/trajectory semantics. The nonblank
runtime source-code budget remains 3,200 lines.

{verified} Repository-native formatting, documentation, type, budget,
and test checks remain the acceptance boundary. The published package
version is 8.0.0.

{verified} After revising reviewer-response guidance and repairing the
benchmark fixtures, the five-case opt-in evaluation completed with
OpenAI Codex Terra as candidate and Sol as judge: 5/5 cases complete,
16/16 objective checks passed, mean judge score 4.0/4, and no critical
failures. This is model- and run-specific evidence, not a deterministic
guarantee or human review.

{verified} At `53251ee7502760cfde8bdaa1bbda3294e3667452`, local
`make verify` passed 216 tests and package dry-run; `make site` passed;
`npm audit --omit=dev` reported zero vulnerabilities. GitLab pipeline
`2904692244` passed both `verify` and `pages` on that exact revision
(coverage 97.85%). The installed Pi Sych package was previously checked
with a live `project_status` call, and a read-only Context7 worker
dispatch passed from both source and installed-package entry points. In
a later session, direct supervisor and workhorse-worker calls succeeded
for all four configured MCPs: Context7, OpenAlex, Parallel, and Scholar
Gateway. Scholar Gateway's read-only usage endpoint reported access;
this does not prove persistent credentials or general retrieval. Exa was
not configured as an MCP in either agent directory; Exa's cache was used
for a documentation fetch, not a worker MCP call.

## Previous action

{verified} Released v8.0.0 at signed commit
`8b2234a628ff5acdfe407e9000486a23760cdc46` with a verified signed tag.
The corrected architecture image and package inventory passed
independent review. Local `make verify` passed 216 tests, including
packed installs with and without optional dependencies; coverage was
97.85/92.27/96.80% for lines/branches/functions. Site and production
audit passed (zero vulnerabilities). Exact-revision main pipeline
`2904866909` and tag publication pipeline `2904875553` passed. npm
reports `pi-sych@8.0.0` and `latest` at 8.0.0 with the matching gitHead;
the downloaded tarball checksum and all 212 files match the release
checkout. npm's provenance record identifies the same commit and
publication job; its signature was not independently cryptographically
validated.

## Immediate next step

{verified} The authorized v8.0.0 release is complete. No release task
remains; retain this project brief for ongoing accepted constraints.
Future tags and publications require their own authorization.

{unresolved} Model recognition of unfinished authorized work remains
semantic, not mechanically guaranteed. Exa was not configured as a
worker MCP; its cache documentation fetch was a separate capability.
