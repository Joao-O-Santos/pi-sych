# Architecture

Pi Sych keeps a small mechanical core for process bounds, files, hashes,
paths, and immutable worker results. Skills and people own
interpretation, writing, research, and consequential judgment.

![](https://unpkg.com/pi-sych@3.0.0/docs/img/architecture.png)

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
immutable result. `project-status.ts` validates `SYNC.json`,
fingerprints tracked files, and traverses declared dependency edges
without deciding semantic drift or authority. `project-files.ts` owns
safe project-local paths and atomic approved writes.

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

## Boundaries

Workers are short-lived calls, not autonomous agents. Tool modes control
visible Pi tools, not host permissions. Independent review is advisory;
human owners retain consequential decisions, publication, deployment,
and irreversible changes. MCPorter remains an explicit remote-research
adapter.
