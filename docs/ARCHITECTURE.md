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
execute the task itself.

Before dispatch, the supervisor inspects the available skill catalogue,
selects only useful skills, and supplies one explicit assignment,
expected output, capability mode, context files, context mode, model
role, thinking level when useful, and bounded timeout. Configured
`agents` files are automatically included when present. For a writing
worker, the package `skills/write/DEFAULT_STYLE.md` is included as a
baseline and a project `STYLE.md`, when present, is included as a local
override. These style files are not loaded for unrelated work. Worker
modes control visible Pi tools; they are not sandboxes.

## Worker lifecycle

A worker is a separate short-lived Pi process with one immutable
terminal result. It reads its explicit assignment, every context file
and selected skill, then the routed methods/modules. Trajectory history
is background, not a source of additional assignments or approval.

Ordinary workers do not receive MCP or codemode. `remoteResearch: true`
explicitly loads Pi's `builtin:mcp` and `builtin:codemode` extensions;
the worker reads its own `mcp.json` from its agent directory. Users
configure and authenticate that file with native Pi MCP commands. The
supervisor's MCP configuration and companion extensions are not copied
to workers. Tool availability does not guarantee credentials or access.

The worker reports `complete`, `partial`, or `failed`, a non-empty
summary, existing project-relative output files, and limitations. A
worker's `complete` status is not human approval. Cancellation, timeout,
spawn failure, a signal exit, or non-zero exit takes precedence over a
result file. Before launch and after termination, Pi Sych snapshots
project files and reports reported, observed, and unexpected changed
paths independently of worker success. Observation does not undo
changes. Temporary runtime/session state is removed after every outcome.

## Project state

`SYNC.json` version 2 records tracked file hashes and dependency paths.
`project_status` reports missing files, changed hashes, persisted
status, project-brief problems, and dependency impact. A changed hash
proves only changed content. Acknowledgement records reviewed state, not
correctness or semantic authority.

## Configuration and compaction

Pi Sych configuration layers the global
`<pi-config-root>/pi-sych/config.json` with the project
`.pi/pi-sych/config.json`; project keys override matching global keys,
including individual nested compaction fields. Unknown keys are
rejected. The small v2 configuration owns custom compaction policy and
the local literature database path, not native Pi settings.

Custom compaction uses the active supervisor model and runs for
configured manual/native compaction requests when enabled. Proactive
admission occurs at `agent_settled` when context usage reaches the
configured threshold (default 150,000 tokens), the context window can
reach that threshold, the agent is idle, no messages are pending, and no
compaction is already in flight. The threshold is independent of Pi's
reserve-token settings.

The continuation is a bounded observable trajectory: objective,
authorization, constraints, progress, decisions, inferences, failed or
rejected paths, unresolved issues, active work, next action, files, and
project-state gaps. It uses bounded observable messages, bounded
retained tail, and bounded canonical snapshots. Recorded `user-explicit`
and `accepted-project` decision attributions are preserved without
verification; inferences are kept separate. At most bounded one-line
proposals are appended to the configured inbox as visibly unreviewed
state. Canonical semantic files are never mutated. If custom compaction
is disabled, omitted, fails, is cancelled, or produces invalid output,
Pi's native compactor remains in control.

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

## Optional integrations

Pi owns MCP transport, server discovery, authentication and `/mcp`; use
`/mcp` or `pi mcp list`, `pi mcp login`, and `pi mcp logout` rather than
a Pi Sych MCP wrapper. Plannotator remains a separately loadable narrow
human-review adapter. Independently installed document, web and browser
tools can satisfy capability needs without runtime coupling to Pi Sych.
None of these mechanisms silently promotes model output into accepted
project state.
