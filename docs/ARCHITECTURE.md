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

At turn start Pi Sych adds concise supervisor guidance plus configured
project `agents` instructions when present. The supervisor guidance uses
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
`agents` and `style` files are automatically included when present.
Worker modes control visible Pi tools; they are not sandboxes.

## Worker lifecycle

A worker is a separate short-lived Pi process with one immutable
terminal result. It reads its explicit assignment, every context file
and selected skill, then the routed methods/modules. Trajectory history
is background, not a source of additional assignments or approval.

The worker should complete the assigned scope without inventing
checkpoints. It reports `complete`, `partial`, or `failed`, a non-empty
summary, existing project-relative output files, and limitations. A
worker's `complete` status is not human approval.

Cancellation, timeout, spawn failure, a signal exit, or non-zero exit
takes precedence over a result file. Temporary runtime/session state is
removed after every outcome.

## Project state

`SYNC.json` version 2 records tracked file hashes and dependency paths.
`project_status` reports missing files, changed hashes, persisted
status, project-brief problems, and dependency impact. A changed hash
proves only changed content. Acknowledgement records reviewed state, not
correctness or semantic authority.

## Compaction

Current custom compaction remains the pre-v7-revision implementation. It
uses the active supervisor model and a bounded six-field continuation
shape, with bounded snapshots of configured project/todo/decision state
and optional proposal lines in `INBOX.md`. The richer settled-turn
trajectory design remains planned in `PLAN.md`, not current runtime
behavior.

## Local literature

`literature_search` queries the configured read-only SQLite FTS5 index.
Its model-facing guidance explicitly frames results as discovery and
provenance evidence rather than source verification. Exact claims still
require inspection of the underlying source when material. Search access
does not establish completeness.

## Skills and supporting guidance

Seven umbrella skills are public: `project`, `write`, `analyze`, `code`,
`review`, `research`, and `automation`. Each uses bounded ordered task
recipes. Shared methods under `skills/_methods` provide reusable
procedures; local modules adapt them to a genre, artifact, or task.

The prompt hierarchy is intentionally layered:

1.  always-visible supervisor/tool text carries only high-salience task
    posture, authority, and capability boundaries;
2.  umbrella skills establish domain posture and route the task; and
3.  routed methods/modules carry detailed procedure.

This avoids duplicating detailed doctrine into the system prompt while
keeping consequential invariants salient. Routes are ordinary Markdown
links, not a workflow engine or prompt inheritance mechanism.

`automation` is semantic guidance, not a new orchestration runtime. The
planned derived capability summary and optional user-level `STACK.md`
remain unimplemented.

## Optional integrations

MCPorter remains an explicit remote-research integration. A separately
active validated PEW-PEW `web` tool may be reused for remote-research
workers. Plannotator remains a narrow human-review adapter. None of
these mechanisms silently promotes model output into accepted project
state.
