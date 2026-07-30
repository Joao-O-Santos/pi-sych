# Architecture

This guide is for maintainers and technically curious users. Pi Sych keeps a small mechanical core for process bounds, files, hashes, paths, and immutable worker results; skills and people handle interpretation, writing, research, and consequential judgment.

![](https://unpkg.com/pi-sych@1.1.0/docs/img/architecture.png)

## Runtime

The supervisor extension (`extensions/workbench/index.ts`) registers three agent tools:

- `dispatch_worker` — one bounded clean-context worker call;
- `project_status` — mechanical check or explicit acknowledgement; and
- `submit_plan` — narrow optional Plannotator review.

It also registers `/pi-sych-status`, `/pi-sych-mcp`, `/plannotator-annotate`, and `/plannotator-last`.

`project-status.ts` parses version-1 `SYNC.md`, validates safe relative paths and SHA-256 fingerprints, checks tracked files, and traverses declared `updateFrom` or `dependsOn` edges. Edges may be strings or `{ path, reason }` records. Cycles are reported safely; no role taxonomy, conceptual-drift judgment, or authority selection exists in TypeScript. Acknowledgement updates only named existing tracked files and marks unacknowledged dependents `needs-review`.

`worker-engine.ts` validates one compact dispatch request, injects optional project `AGENTS.md` and applicable `STYLE.md`, launches a clean Pi worker, applies a 90-second default timeout or validated override, forwards cancellation, uses `SIGTERM` then `SIGKILL`, and reads one immutable result from a temporary directory. It has no worker registry, polling surface, verification contract, run archive, mutation lock, or semantic workflow engine.

`extensions/worker/index.ts` exposes only `submit_artifact`. The worker result is bound to an internal task/run identity and is written once. Its `resultPackage` is either `inline` or an existing durable project-relative path; temporary runtime paths are not returned.

`model-catalog.ts` reads private ranked model profiles. `mcporter.ts` remains an explicit remote-research adapter for Context7, OpenAlex, and Scholar Gateway. `plannotator.ts` remains a lazy compatibility boundary; Pi Sych never loads Plannotator's extension entrypoint.

## Project state

After initialization, the core files are:

- `PROJECT.md` — accepted purpose, scope, constraints, current direction, definition of done, previous action, and immediate next step.
- `SYNC.md` — acknowledged fingerprints, declared dependencies, statuses, and acknowledgement metadata.

Optional files are `AGENTS.md`, `STYLE.md`, `EVIDENCE.md`, `DECISIONS.md`, and `TODO.md`. `TODO.md` is task state only.

A hash mismatch records changed content after acknowledgement. It does not decide correctness, authority, or conceptual disagreement; those remain matters for the project owner and relevant skills.

## Skills and verification

Skills contain semantic workflow: bootstrap, status interpretation, conceptual drift review, reconciliation, writing, research, coding, verification, and retrospection. Pi's normal read/edit/write/Bash tools and project-native checks remain the default implementation and verification mechanisms.

## Boundaries

Workers are short-lived calls, not autonomous agents. Tool modes control visible Pi tools, not host permissions. Human review remains necessary for consequential decisions, claims, publication, deployment, and irreversible changes.
