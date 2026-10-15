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
TODO, brief, or context file can enable later clean delegation. Document
optional dispatch patterns rather than fixed workflows. Lean toward
supervisor pre-walk when firsthand interpretation matters; bounded
explorers remain useful for breadth, but their summaries should not
replace decisive source inspection by the model choosing the approach.

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

{verified} v8.0.1 is tagged and published. It uses strict layered
version 2 configuration, Pi-native worker MCP/codemode, a 150k task-
centred compaction threshold, and structured read-only literature
discovery. MCPorter and the special-case companion web inheritance were
removed; companion packages remain separately installed.

{verified} Against the v7.0.1 deterministic coverage baseline (97.48%
lines, 90.23% branches, 95.31% functions), v8.0.1 coverage measures
97.86% lines, 92.50% branches, and 96.80% functions. Runtime nonblank
source is about 3,300 lines, within the 3,300-line budget. The local
native MCP fixture and live read-only Context7 worker call passed. The
opt-in real-model workflow and an installed-package `project_status`
dogfood call passed after private local v8 configuration migration.

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
runtime source-code budget is 3,300 lines.

{verified} Repository-native formatting, documentation, type, budget,
and test checks remain the acceptance boundary. v8.1.3 is tagged and
published at commit `1b227fb809c54f0d27393cf46e1d5dbf997a4d06`. Tag
pipeline `2952106494` passed `verify` and `publish-npm`; npm reports
`pi-sych@8.1.3`, `latest` 8.1.3, and matching gitHead. The v8.1.3 tag
points to that commit. The published patch improves readable
`dispatch_worker` call rendering. The shared ordered-renderer follow-up
and nonblank runtime source-budget increase to 3,300 lines are prepared
for v8.1.4 and are not part of published v8.1.3.

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

{verified} Released v8.1.3 at tag `v8.1.3`, pointing to
`1b227fb809c54f0d27393cf46e1d5dbf997a4d06`. Tag pipeline `2952106494`
passed verify and npm publication; npm reports version and latest 8.1.3
with matching gitHead. The shared-renderer follow-up in Unreleased is a
post-tag source change and is not in the published package.

{verified} Released v8.1.2 at signed tag `v8.1.2`, pointing to
`40cd3f0ea67257c90fb10bc40670076e39c29537`. Main pipeline `2947839453`
passed before tagging; tag pipeline `2947850894` passed verification and
npm publication. npm reports version/latest 8.1.2 and matching gitHead;
the downloaded registry tarball's 214-file list matches the local
package dry-run. The npm package metadata exposes a SLSA provenance
attestation. The tag signature verifies locally; GPG reports the key as
not certified with a trusted signature.

{verified} Released v8.1.1 at signed tag `v8.1.1`, pointing to
`973b6fa9982888cdbb4403d97c4f9f34b768e51e`. Main push and pipeline
`2946786917` succeeded before tagging; tag pipeline `2946801296` passed
verification and npm publication. npm reports version/latest 8.1.1 and
gitHead matching the tag commit. The tag signature verifies locally; GPG
reports the key as not certified with a trusted signature.

{verified} Released v8.0.1 at signed commit
`89dc912367559e8a8a01fcfa15050d6e94dde708` with a verified signed tag.
Main pipelines `2930169788` (worker fixes) and `2930185890` (version
bump) passed verify/pages; tag pipeline `2930208540` passed verify and
npm publication. npm reports version/latest 8.0.1 with the matching
gitHead. The downloaded tarball checksum and all 212 files match the
release checkout; npm's provenance record identifies the same commit and
tarball digest. Its signature was not independently cryptographically
validated.

{verified} v8.0.1 recognizes explicit JSON `agent_settled.aborted: true`
on normal exit. Interruption and process failure remain primary errors,
but structurally valid submitted reports are preserved separately with
an explicit warning that work and claimed status/files may be incomplete
or inaccurate. Successful `result` stays absent for failures;
independently observed changes remain visible. Older Pi events remain
compatible. Regression tests cover cancellation, report recovery and
invalid reports, missing claimed files, provisional rendering, and
process-failure precedence. Independent read-only review found no
material blockers. `make verify` passed 239 tests at 97.86/92.50/96.80%
line/branch/function coverage; `make site` passed, runtime source
remained within budget, and production audit found zero vulnerabilities.

## Immediate next step

{verified} npm reports current version/latest `8.1.3`, and no local or
remote `v8.1.4` tag exists. Prepared package metadata and README image
URLs for `8.1.4`; its changelog entry records the shared ordered worker-
call renderer follow-up and source-budget increase. This patch improves
a documented presentation without changing the public interface or
requiring migration. It is prepared, not published; publication awaits a
passing regular commit pipeline and an authorized annotated tag. Retain
this project brief for ongoing accepted constraints; later release
actions require their own authorization.

{unresolved} Model recognition of unfinished authorized work remains
semantic, not mechanically guaranteed. Exa was not configured as a
worker MCP; its cache documentation fetch was a separate capability.
