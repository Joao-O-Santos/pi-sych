# Architecture

Pi Sych keeps a small mechanical core for process bounds, files, hashes,
paths, and immutable worker results. Skills and people own
interpretation, writing, research, and consequential judgment.

![](https://unpkg.com/pi-sych@3.0.4/docs/img/architecture.png)

## Runtime

The supervisor extension registers three agent tools:

- `dispatch_worker` --- one bounded clean-context worker call;
- `project_status` --- mechanical check or explicit acknowledgement; and
- `submit_plan` --- human browser review with a pending file-review
  fallback.

It also registers `/pi-sych-status`, `/pi-sych-mcp`,
`/plannotator-annotate`, `/plannotator-last`, and `/plannotator-review`.
It never loads Plannotator's extension entrypoint, registers
`/plannotator`, or enables plan-mode obligations.

`worker-engine.ts` validates a compact request, injects applicable
project conventions, launches a clean Pi worker, applies a 90-second
default or bounded override, forwards cancellation, and reads one
immutable result. `project-files.ts` owns safe project-local paths,
atomic approved writes, and the shared `resolveProject` manifest
resolver used by status, acknowledgement, and compaction.
`project-status.ts` validates `SYNC.json`, fingerprints tracked files,
and traverses declared dependency edges without deciding semantic drift
or authority.

`submit_plan` reads an existing project-local Markdown file. It waits
for Plannotator browser feedback when the optional adapter starts;
otherwise it returns file-review pending state and does not implement
the plan.

## Skills

``` text
six visible umbrella skills
        ↓
invariant SKILL.md
        ↓
selected module guidance + editable examples
        ↓
bounded worker with explicit project context
```

Only `project`, `write`, `analyze`, `code`, `review`, and `research` are
indexed skills. Each points directly to one-level modules. Modules are
plain guidance and example files, so they do not enlarge the initial
catalog. The `project` Pi Sych module directs answers to documentation
at the installed package root.

## Project state

`PROJECT.md` describes purpose, scope, direction, completion, and next
work. `SYNC.json` holds acknowledged fingerprints and declared
relationships. Optional `AGENTS.md`, `STYLE.md`, `EVIDENCE.md`,
`DECISIONS.md`, `TODO.md`, and `INBOX.md` serve specific human purposes.
Compaction creates task-centred working memory and may append
deduplicated semantic promotion proposals to `INBOX.md`; proposals
remain human-review state until a reviewed edit promotes them. A hash
mismatch records changed content after acknowledgement; it does not
resolve disagreement or replace review.

## Manifest resolution

`SYNC.json` is a version-2 JSON manifest. `resolveProject` walks from
the working directory to the workspace root for the nearest `SYNC.json`;
if none is found it falls back to the workspace root with default
canonical paths. An optional `projectRoot` relocates the tracked
artifacts, and an optional `canonical` object overrides the default path
for each role --- `project`, `agents`, `style`, `evidence`, `decisions`,
`todo`, `inbox`. Absolute configured paths are used as-is; relative
paths resolve against the project root. One resolved project is threaded
through status, acknowledgement, and compaction so the manifest is read
once per operation.

## Compaction

Pi registers a `session_before_compact` handler that builds task-centred
working memory instead of relying only on Pi's native compactor. On each
compaction (triggered by manual `/compact`, context threshold, or
overflow recovery) it resolves the project, checks status, reads the
canonical files once to derive both content and fingerprints, inspects
`INBOX.md`, and asks the supervisor's active model (not a worker profile
from `models.json`) for a JSON `workingMemory` plus at most five
promotion proposals. The model is told task-relevant changed artifacts,
impacted dependents, cycles, errors, and the current inbox.

Working memory is validated to named fields; `relevantFiles` is filtered
to declared canonical and artifact paths. Promotions are validated
against canonical contents (exact `existingText` for updates, no
already-present adds) and routed by role --- `project`, `agents`,
`style`, `evidence`, `decisions`, `todo` --- to their configured target
paths. `agents` proposals also carry a `recommendedScope` of `project`,
`personal`, or `ask-user`. Accepted proposals are deduplicated against
the existing inbox and written atomically only when canonical
fingerprints are unchanged.

A malformed `INBOX.md` is isolated: compaction continues, the inbox
error is surfaced in the result and in `/pi-sych-status`, and no
proposals are persisted. If any step throws, the failure is classified
(`unavailable`, `authentication`, `project`, `model-output`, `provider`)
and reported, and the handler returns nothing so Pi falls back to its
native compactor. Proposals stay human-review state in `INBOX.md` until
a reviewed edit promotes them; `/plannotator-annotate INBOX.md` supports
that review.

## Boundaries

Workers are short-lived calls, not autonomous agents. Tool modes control
visible Pi tools, not host permissions. Independent review is advisory;
human owners retain consequential decisions, publication, deployment,
and irreversible changes. MCPorter remains an explicit remote-research
adapter.
