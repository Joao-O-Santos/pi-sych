# Code tour

Pi Sych starts in `extensions/workbench/index.ts`. The workbench adds
guidance at the beginning of a supervisor turn, loads project-scoped
configuration, and registers the tools and commands that connect Pi to
the focused runtime modules.

## Dispatch and worker lifecycle

`dispatch_worker` is a request/result protocol rather than a task queue.
A supervisor supplies a bounded task packet: the requested capability
mode, expected result, relevant files, selected skills, model role, and
timeout. The workbench passes that packet to the worker engine, which
resolves the files, requires a bootstrapped worker directory, creates a
temporary result location, and starts a clean Pi worker process. The
worker can submit exactly one immutable validated result: `status`,
`summary`, `files`, and `limitations`. Dispatch accepts it only after a
normal exit and verifies that reported project files still exist.
Cancellation, timeout, spawn failure, a signal exit, and a non-zero exit
take precedence over a result file; none is a successful result.

## Project state and SYNC

`project_status` is the mechanical view of project state. It reads
`SYNC.json`, reports changed or missing tracked files and dependency
impact, and can atomically acknowledge files that a human has reviewed.
A hash change says only that content changed; the tool deliberately does
not decide whether that change is correct or conceptually important.

## Compaction and configuration

The workbench can invoke custom compaction when configuration enables
it. The compaction module builds a bounded snapshot of selected project
state and the conversation, asks the active supervisor model for
structured working memory, filters its file references, and appends a
small number of unreviewed proposals to the inbox. Returning no custom
result leaves Pi's standard compactor in control. Configuration is
resolved through the config-directory module so the workbench, worker
setup, model catalog, and optional local resources agree on where
private settings live.

## Optional integrations

MCPorter is an explicit remote-research adapter. It is only added to a
worker that requested remote research, and its diagnostics describe
configuration without exposing credentials. Plannotator is separate from
the workbench: it is a narrow human-review adapter that brings feedback
from a message or file back into the review flow rather than controlling
plans or project state.

Literature search is a worker tool. The worker extension always
registers it, but the worker engine exposes it only when the selected
skills include exact `research`. A query flows to the resolved local
SQLite FTS5 database and comes back as metadata, snippets, scores, and
source paths. The supported `papers` plus external-content `papers_fts`
schema stores canonical metadata separately and indexes filepath, title,
abstract, tags, and DOI; its full FTS5 contract and database-resolution
order are in [configuration](configuration.md#local-literature-search).
This keeps local research lookup available to a selected research worker
without making it a supervisor-wide service.

For declarations and source links generated from the current runtime
source, see the [live generated code
reference](https://joao-o-santos.gitlab.io/pi-sych/code-reference.html).
