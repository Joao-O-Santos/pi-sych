# Code tour

Pi Sych starts in `extensions/workbench/index.ts`. The workbench adds
concise supervisor guidance and configured project instructions, loads
layered Pi Sych configuration, and registers the tools and commands that
connect Pi to focused runtime modules. Pi itself describes active tools
and native MCP servers; Pi Sych adds no capability-startup inventory.

## Repository map and guidance boundaries

The package separates **runtime mechanisms** from **model guidance**.
The public Pi entry points are `extensions/workbench/index.ts` and
`extensions/plannotator/index.ts`; `extensions/worker/index.ts` is
loaded by dispatched workers rather than installed as a supervisor entry
point. The workbench delegates to small files in
`extensions/workbench/src/`:

| Source | Responsibility |
| --- | --- |
| `worker-engine.ts`, `model-catalog.ts` | Dispatch schema, context modes, model selection, process lifecycle, and immutable results. |
| `project-files.ts`, `project-status.ts` | Project paths, `SYNC.json` parsing, fingerprints, declared dependency impact, and acknowledgement. |
| `compaction.ts` | Bounded context snapshot and unreviewed proposals, without changing canonical semantic decisions. |
| `config-directory.ts`, `validation.ts` | Configuration resolution and mechanical validation. |
| `literature-search.ts` | Read-only local SQLite discovery. |
| `plannotator.ts` | Optional review integration support. |

The **seven public skills** are `project`, `write`, `analyze`,
`code`, `review`, `research`, and `automation`. Each
`skills/<name>/SKILL.md` is the entry point for its task guidance.
Specialist `skills/<name>/modules/<topic>/guidance.md` files are
selected for particular tasks, not automatically loaded in full.
Reusable cross-skill methods live under `skills/_methods/`, with
their own guidance, examples, and optional templates. The internal
module/method paths are guidance organization, not additional public
skills or mandatory steps for every task.

The `prompts/review-*.md` files are thin optional entry points for
review lenses. A request in ordinary language can invoke the same
`review` skill without those prompts. `templates/` contains starter
project state; `tests/unit/`, `tests/integration/`,
`tests/usage/`, and `tests/benchmarks/` separate deterministic
checks, opt-in model evaluations, and benchmark fixtures.
`scripts/generate-code-reference.mjs` derives the published runtime
reference from TypeScript declarations. The code tour explains
relationships; the generated reference tracks declarations.

### Review provenance versus runtime limitations

The review skill, not the dispatch engine, instructs **every
LLM-produced review** to end with a short, visually distinct
**Review scope** footer identifying the task's actual focus, even when
the user did not invoke a packaged prompt. An adversarial review must
make clear that the model was asked to find problems. This footer is
separate from genuine findings or limitations; it is not an item in a
limitations list. A worker's terminal `limitations` field, by
contrast, records execution/report limitations and is not a substitute
for the review footer in its written report.

Review guidance also distinguishes provenance and authority. Author
comments recorded through Plannotator remain author feedback;
co-author and human peer-review feedback warrant different handling
from advisory independent LLM criticism. The supervisor compares
review findings with project decisions and evidence before revision;
no mechanical status or worker result confers editorial approval.

## Dispatch and worker lifecycle

`dispatch_worker` is a request/result protocol rather than a task queue.
A supervisor supplies a bounded task packet: the requested capability
mode, expected result, relevant files, selected skills, model role,
context mode, and timeout. The workbench passes that packet to the
worker engine, which resolves the files, requires a bootstrapped worker
directory, creates a temporary runtime location, and starts a separate
Pi worker process. Clean context is the default. Trajectory context uses
Pi's session manager on a private snapshot to create a temporary branch
immediately before the exact dispatching assistant entry. The worker can
submit exactly one immutable validated result: `status`, `summary`,
`files`, and `limitations`. Dispatch accepts it only after a normal exit
and verifies that reported project files still exist. Cancellation,
timeout, spawn failure, a signal exit, and a non-zero exit take
precedence over a result file; none is a successful result.

Ordinary workers do not load MCP or codemode. `remoteResearch: true`
adds Pi's `builtin:mcp` and `builtin:codemode` extensions explicitly.
Native Pi reads `mcp.json` from that worker's `PI_CODING_AGENT_DIR`; the
supervisor's MCP configuration and tools are not inherited. Configure
worker servers and authentication using native Pi MCP commands. Tool
availability does not guarantee working credentials or successful
retrieval.

## Project state and SYNC

`project_status` is the mechanical view of project state. It reads
`SYNC.json`, reports changed or missing tracked files and dependency
impact, and can atomically acknowledge files that a human has reviewed.
A hash change says only that content changed; the tool deliberately does
not decide whether that change is correct or conceptually important.

## Compaction and configuration

The workbench invokes custom compaction when `compaction.custom` is
true. Pi Sych's proactive trigger runs at `agent_settled` at the
configured context-token threshold, 150,000 by default, only when the
model context can reach it, the agent is idle, no messages are pending,
and no compaction is in flight. This is separate from native Pi
reserve-token settings. Independently, opt-in completion reassessment
uses `agent_before_settle` to inject one hidden,
authorization-preserving prompt when there are no pending messages and
Pi can continue. The per-user-message re-entry guard prevents repeated
continuation. The compaction module builds a bounded snapshot of
selected project state and observable conversation, asks the active
supervisor model for structured working memory, filters its file
references, and appends a small number of visibly unreviewed proposals
to the inbox. Returning no custom result leaves Pi's native compactor in
control. Canonical semantic files are never mutated; recorded label
attributions are preserved without verification, and omission or failure
returns native fallback.

`config-directory.ts` owns strict parsing and layering: global
`<pi-config-root>/pi-sych/config.json`, then project
`.pi/pi-sych/config.json`, with field-level overrides. It also resolves
relative literature paths against the config directory globally or the
project root for a project override. The small config retains custom
compaction policy, optional completion reassessment, and the
configurable local literature database.

## Literature search and integrations

Literature search is a direct supervisor tool and a gated worker tool.
The workbench registers `literature_search` for supervisor lookup. The
worker extension also registers it, while the worker engine exposes it
only when selected skills include exact `research`. A query flows to the
resolved local SQLite FTS5 database and returns compact readable text,
structured result data, metadata, snippets, scores, and source paths.
Results are discovery and provenance, not source verification; the
source path is the handoff to an available document/PDF capability.

Pi owns MCP transport, server discovery, authentication and `/mcp`. Use
native `/mcp` or `pi mcp` commands rather than a Pi Sych wrapper.
Plannotator is separate from the workbench: it is a narrow human-review
adapter that brings feedback from a message or file back into the review
flow rather than controlling plans or project state. Independently
installed document, web and browser tools can satisfy capability needs
without package-specific runtime coupling.

For declarations and source links generated from the current runtime
source, see the [live generated code
reference](https://joao-o-santos.gitlab.io/pi-sych/code-reference.html).
