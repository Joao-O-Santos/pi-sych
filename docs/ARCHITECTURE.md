# Architecture

Pi Sych is deliberately a small mechanical layer: it tracks paths and
hashes, launches bounded workers, exposes read-only literature lookup,
and preserves explicit human review. Skills and humans own semantic
judgment.

## Supervisor contract

The supervisor sees three Pi Sych tools:

- `project_status` checks or acknowledges mechanical project state;
- `dispatch_worker` runs one short-lived worker with clean or trajectory
  context; and
- `literature_search` performs read-only lookup in the configured local
  literature index.

At supervisor start Pi Sych adds concise supervisor guidance and, when
present, configured project `agents` instructions and the worker model
catalog. Pi itself describes active tools and native MCP servers; Pi
Sych does not reproduce those inventories. The supervisor guidance uses
two independent task-posture dimensions:

- **persistence** --- once the requested outcome and authorization
  boundary are clear, continue until completion or a genuine blocker
  rather than stopping merely to ask whether to continue; and
- **scrutiny** --- increase checking for authored prose, consequential
  project-state decisions, release/publication work, external side
  effects, and ambiguous intent.

High scrutiny does not itself require another user checkpoint. A clear
request to review, rewrite, implement, or complete a defined scope is
authorization for that scope. A new checkpoint is needed when the work
would cross into a new consequential choice, side effect, or material
ambiguity not already covered by the user's instruction or accepted
project state.

## Direct work and delegation

There is no universal direct-work or worker default. The supervisor
chooses by task and context.

Direct work is efficient for simple or tightly connected work. Dispatch
is useful for independent context, breadth, specialization, cheaper
execution, independent review, or substantial bounded work. Context need
is separate from delegation choice:

- a clean worker receives no supervisor transcript and should be used
  when the explicit packet is sufficient;
- a trajectory worker receives Pi's persisted supervisor branch ending
  immediately before the dispatching assistant entry and should be used
  when prior conversation materially helps; and
- supervisor pre-work can convert conversational context into explicit
  state such as a plan, TODO, brief, or context file, allowing later
  clean delegation.

Needing prior context therefore does not imply that the supervisor must
execute the task itself. The project skill's [delegation
module](../skills/project/modules/delegation/guidance.md) teaches
optional pre-walk, planner/builder, orchestrator, exploration, and
independent-review patterns using these dispatch choices. These are
semantic working possibilities, not runtime workflows or automatic model
swaps. Explorer summaries remain interpretations; decisive source
material should remain available to the model making the decision.

Before dispatch, the supervisor inspects the available skill catalogue,
selects only useful skills, and supplies one explicit assignment,
expected output, capability mode, context files, context mode, model
role, thinking level when useful, and bounded timeout. Configured
`agents` files are automatically included when present. Optional
`workerInstructions` supplies worker-specific guidance through Pi's
native AGENTS context-file discovery, not the assignment prompt. For
that dispatch only, Pi Sych creates a private temporary worker agent
directory containing the configured agent files and a launch-scoped
`AGENTS.override.md` that preserves existing worker instructions before
the supplied guidance. Pi then loads project/ancestor AGENTS files by
its normal discovery and precedence. Omission uses the configured worker
agent directory unchanged, injects no instructions, and disables
context-file discovery for that worker. For a writing worker, the
package `skills/write/DEFAULT_STYLE.md` is included as a baseline and a
project `STYLE.md`, when present, is included as a local override. These
style files are not loaded for unrelated work. Worker modes control
visible Pi tools; they are not sandboxes.

## Worker lifecycle

A worker is a separate short-lived Pi process with one immutable
terminal result. It reads its explicit assignment, every context file
and selected skill, then the routed methods/modules. Trajectory history
is background, not a source of additional assignments or approval. The
`dispatch_worker` call renderer shows a prioritized human-readable
summary when collapsed and labeled assignment, execution, and context
details when expanded; live activity lines include available tool
argument details in bounded readable form.

Ordinary workers do not receive MCP or codemode. `remoteResearch: true`
explicitly loads Pi's `builtin:mcp` and `builtin:codemode` extensions;
the worker reads its own `mcp.json` from its agent directory. Users
configure and authenticate that file with native Pi MCP commands. The
supervisor's MCP configuration and companion extensions are not copied
to workers. Pi's CLI `--tools` allowlist filters dynamically discovered
MCP tools out of codemode's nested tool set, so the worker extension
applies the task's selected Pi tool set at session start instead. Pi's
per-server and per-tool MCP exposure still follows the worker's native
`mcp.json` (codemode is the default). Tool availability does not
guarantee credentials or access.

The worker reports `complete`, `partial`, or `failed`, a non-empty
summary, existing project-relative output files, and limitations. A
worker's `complete` status is not human approval. Cancellation, timeout,
spawn failure, a signal exit, or non-zero exit takes precedence over a
result file. On Pi versions that expose `agent_settled.aborted` in JSON
output, an explicit `true` also classifies an otherwise normally exited
worker as cancelled rather than accepting its submitted result as
success. A structurally valid report recovered after interruption or
process failure is retained separately as `interruptedReport`, with an
explicit warning that work may be incomplete or inaccurate. Its claimed
status, summary, limitations, and reported paths are provisional; paths
may no longer exist. The primary error remains, and `result` is absent.
Missing or invalid reports do not mask the interruption. Missing or
false settlement flags do not establish success; process checks and
result validation remain required. Before launch and after termination,
Pi Sych snapshots project files and reports reported, observed, and
unexpected changed paths independently of worker success. Observation
does not undo changes. Temporary runtime/session state is removed after
every outcome. Signal exits retain their terminating signal in the
failure diagnostic. Git snapshot fallback covers file enumeration, not
file-hashing errors; observation failures remain explicit instead of
switching snapshot scope. On POSIX, workers have their own process
group. Timeout or cancellation starts graceful group termination, with
ten seconds before forced cleanup. A normally exited worker also gets
ten seconds to drain inherited output pipes, without being reclassified
as timed out. Windows signals the direct child; pipe cleanup still
prevents descendants from holding dispatch open.

## Project state

`SYNC.json` version 2 records tracked file hashes and dependency paths.
`project_status` reports missing files, changed hashes, persisted
status, project-brief problems, and dependency impact. A changed hash
proves only changed content. Acknowledgement records reviewed state, not
correctness or semantic authority. Acknowledgement holds an exclusive
`SYNC.json.lock` across its read--modify--write transaction. Concurrent
calls fail explicitly and can be retried; a lock left by a crash must be
removed only after confirming no acknowledgement is running. This
coordinates Pi Sych acknowledgements, not arbitrary external editors.

## Configuration and compaction

Pi Sych configuration layers the global
`<pi-config-root>/pi-sych/config.json` with the project
`.pi/pi-sych/config.json`; project keys override matching global keys,
including individual nested compaction fields. Unknown keys are
rejected. The small v2 configuration owns custom compaction policy, an
optional completion reassessment, and the local literature database
path, not native Pi settings.

Custom compaction uses the active supervisor model and runs for
configured manual/native compaction requests when enabled. Proactive
admission occurs at `agent_settled` when context usage reaches the
configured threshold (default 150,000 tokens), the context window can
reach that threshold, the agent is idle, no messages are pending, and no
compaction is already in flight. The threshold is independent of Pi's
reserve-token settings.

Optional completion reassessment defaults off. When enabled, the
workbench uses Pi's final actionable `agent_before_settle` event after
ordinary post-run handling. It injects one hidden message and requests
one continuation only for a completed outcome, with no queued messages
and `context.canContinue` true. A per-user-message guard prevents
recursive reassessment; a new user message resets it. The instruction
keeps work within existing authorization and directs the supervisor to
stop when complete or genuinely blocked. This trigger is separate from
compaction.

The continuation is a bounded observable trajectory: objective,
authorization, constraints, progress, decisions, inferences, failed or
rejected paths, unresolved issues, active work, next action, files, and
project-state gaps. It uses bounded observable messages, bounded
retained tail, and bounded canonical snapshots. Recorded `user-explicit`
and `accepted-project` decision attributions are preserved without
verification; inferences are kept separate. Malformed optional
collections and invalid individual members are skipped independently so
usable siblings survive. Invalid promotion candidates are likewise
skipped rather than invalidating the memory summary. The required
objective and next action must remain usable; malformed JSON or missing
or unusable required fields leave native fallback in control.

At most bounded one-line proposals are appended to the configured inbox
as visibly unreviewed state. Canonical semantic files are never mutated.
Inbox safety or append failures skip proposals without discarding
otherwise usable memory; an unreadable existing inbox count is reported
as unavailable, not zero. Cancellation during inbox safety or directory
operations is checked before append, preventing late proposal writes. If
custom compaction is disabled, omitted, fails, is cancelled, or lacks
usable required summary fields, Pi's native compactor remains in
control.

## Local literature

`literature_search` queries the configured read-only SQLite FTS5 index.
It returns compact readable results and matching structured data for
nested callers, including nullable metadata, snippets, scores and source
paths. Results support discovery and provenance, not source verification
or completeness. Exact claims still require inspection of the underlying
source when material. The configured database may be absolute or
relative; relative global paths resolve from the global Pi Sych config
directory, and relative project overrides from the project root.

The `research` skill is capability-aware at the guidance layer. It tells
the model to inspect what is actually available and choose by function:
local corpus discovery, scholarly metadata/graph lookup, focused
scholarly retrieval, PDF/full-text inspection, broad discovery search,
or targeted fetch/browser verification. Tool outputs should refine later
retrieval rather than be called mechanically.

## Skills and supporting guidance

Seven umbrella skills are public: `project`, `write`, `analyze`, `code`,
`review`, `research`, and `automation`. Each uses bounded task routes
with primary guidance and optional overlays. Shared methods under
`skills/_methods` provide reusable procedures; local modules adapt them
to a genre, artifact, or task.

Writing and review guidance treats standalone artifact self-containment
as a quality criterion. Process residue, unexplained version/revision
language, reviewer-response wording, and unmotivated denials or
contrasts are potential context leakage when they have no reader-visible
job. Review lenses trace paragraph and sentence flow in reading order,
and examine cumulative habits such as semicolon/em-dash repetition,
serial "not X but Y" turns, and stacked hedges. These are diagnostic
prompts, not counts or bans: preserve useful idiosyncrasy, purposeful
constructions, and calibrated uncertainty, while explaining concrete
reader effects and offering minimal repairs. Response letters and
revision memos may appropriately discuss reviewers, versions, and
changes because the revision process is part of their subject.

The prompt hierarchy is intentionally layered: always-visible
tool/supervisor text carries salient posture and boundaries, umbrella
skills route the task, and routed methods/modules carry detail. Routes
are ordinary Markdown links, not a workflow engine or prompt inheritance
mechanism.

`automation` is semantic guidance, not a new orchestration runtime. Five
thin packaged review prompts select a lens and defer substantive
procedure to the `review` skill. An optional user-maintained `STACK.md`
may describe durable computer/environment facts for computer-use work;
automation guidance consults it when available, while runtime state
remains the authority for what can be used now.

## Guidance growth and review provenance

The runtime intentionally stays narrower than the guidance catalogue.
Seven public `SKILL.md` entry points route task-specific work to
specialist `modules/` and reusable `skills/_methods/`. Adding a
specialist recipe or example does not add a new public skill, persistent
agent, runtime tool, or mandatory workflow stage. Load only the guidance
needed for the task; avoid copying shared policy into every prompt,
module, or repository instruction file.

Review is a useful example of this separation. Packaged
`prompts/review-*.md` choose optional lenses, but the
`skills/review/SKILL.md` contract also applies when a user requests a
review without a preset prompt. Every LLM review should end in a
distinct, brief **Review scope** footer stating the actual instruction
and focus; this is not an execution `limitations` field or a bullet in a
limitations section. Adversarial fault-finding, collaborative
improvement, structural inspection, copyediting, and verification
produce differently selected observations.

The supervisor evaluates those observations against accepted project
state and evidence. Author-authored Plannotator notes express author
intent; co-author and human peer-review comments warrant serious
collaborative treatment. Independent LLM reports remain advisory even
when generated by a clean-context worker. Material errors require
attention regardless of who noticed them, but iterative LLM objections
are not a mandate to endlessly weaken a defensible manuscript. Neither
review provenance nor editorial authority is assigned by the TypeScript
worker-result schema.

## Optional integrations

Pi owns MCP transport, server discovery, authentication and `/mcp`; use
`/mcp` or `pi mcp list`, `pi mcp login`, and `pi mcp logout` rather than
a Pi Sych MCP wrapper. Plannotator remains a separately loadable narrow
human-review adapter. Independently installed document, web and browser
tools can satisfy capability needs without runtime coupling to Pi Sych.
None of these mechanisms silently promotes model output into accepted
project state.
