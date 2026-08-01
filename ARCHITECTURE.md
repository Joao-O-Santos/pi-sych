# Architecture

Pi Sych is a small mechanical layer for project paths, hashes, bounded
workers, and explicit human review.

![](https://unpkg.com/pi-sych@4.0.0/docs/img/architecture.png)

## Runtime

The workbench provides `dispatch_worker` and `project_status`, plus
`/pi-sych-status`, `/pi-sych-mcp`, `/plannotator-last`,
`/plannotator-annotate`, and `/plannotator-review`. It does not register
plan-review tooling.

Workers receive a resolved project, an explicit model role, selected
context and skills, and a bounded timeout. They may submit exactly one
immutable result with status, summary, files, and limitations. Tool
modes control visible Pi tools, not host permissions.

`SYNC.json` version 2 records tracked file hashes and dependency paths.
`project_status` reports missing or changed hashes and declared
dependency impact without deciding semantic drift. Acknowledgement
updates named reviewed files atomically and marks affected dependents
for review.

## Compaction

Compaction reads the prior summary, compacted conversation, canonical
project files, and project status. The active supervisor model returns a
small working memory: task, constraints, active work, blockers, next
step, and relevant files. It may append up to five unreviewed proposals
as plain lines in `INBOX.md`, for example
`- {todo} Update the architecture diagram.` Pending proposals are
counted from the file and remain human-review state.

## Models and skills

Private `models.json` is a user-defined catalog. Each named role maps
directly to one model and may include free-form cost and notes. The
supervisor selects a role; the runtime performs only exact lookup.

Only six umbrella skills are public: `project`, `write`, `analyze`,
`code`, `review`, and `research`. Their one-level modules provide
selected guidance and examples without enlarging the initial skill
catalog.

## MCPorter and Plannotator

MCPorter is enabled only for explicitly requested remote research.
Diagnostics report extension availability, configuration
location/presence, and configured server names.

Plannotator remains a narrow human review adapter. Last-message feedback
enters the conversation. File annotation writes `<input>.feedback.md`;
code-review feedback writes `PLANNOTATOR_REVIEW.md`.
