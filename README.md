# Pi Sych

Pi Sych is a small Pi package for serious writing, research, analysis, and software work. It provides explicit project state, bounded clean-context workers, and optional human plan review. It does not automate authority, conceptual judgment, or final responsibility.

## Principles

Pi Sych follows the [design principles](principles.md): humans own consequential decisions and final outputs; supervisors own coordination; important knowledge belongs in visible files; workers are short-lived and receive the smallest complete context; mechanical tools handle mechanical facts; skills and people handle meaning; existing Pi, MCPorter, Plannotator, and project tooling come before new infrastructure; and permanent code should stay small.

## Start

```sh
pi install npm:pi-sych
```

For local development, load the package path in Pi settings. Pi Sych already declares Plannotator; do not load Plannotator's extension separately.

To prepare a separate worker profile:

```sh
node scripts/bootstrap-worker-agent-dir.mjs \
  --agent-dir ~/.cache/pi/pi-sych/worker-agent \
  --package-root /path/to/pi-sych \
  --supervisor-agent-dir ~/.config/pi
```

Configure private model profiles at `~/.config/pi/pi-sych/models.json`. See [configuration](docs/CONFIGURATION.md).

## Core workflow

1. Use the `bootstrap-project` skill to establish `PROJECT.md`, `SYNC.md`, and only useful optional files.
2. Use `project_status` with `action: "check"` to inspect hashes, missing files, declared dependents, and cycles.
3. Read relevant files and use skills for planning, writing, review, conceptual drift, reconciliation, coding, or verification.
4. Work directly when practical. Use `dispatch_worker` only for a bounded independent review, research task, or implementation task.
5. For consequential plans, use `submit_plan` for explicit human review.
6. After actual review, use `project_status` with `action: "acknowledge"`, named files, and a truthful reason.

A changed hash means content changed after acknowledgement. It does **not** establish conceptual drift, authority, correctness, or approval.

## Tools

| Tool | Purpose |
|---|---|
| `dispatch_worker` | Runs one short-lived worker with exact context, selected skills, optional remote research, and a 90-second default timeout. Set a deliberate bounded override for longer work. |
| `project_status` | Checks mechanical project state or acknowledges named reviewed files. It reports declared dependency impact but never resolves semantic disagreement. |
| `submit_plan` | Opens an existing project-local Markdown plan for explicit human review. Approval does not start implementation. |

Commands: `/pi-sych-status`, `/pi-sych-mcp`, `/plannotator-annotate <file>`, and `/plannotator-last`.

## Project files

`PROJECT.md` and `SYNC.md` are the core state after initialization. The following files are optional:

- `AGENTS.md` — project conventions and collaboration instructions.
- `STYLE.md` — prose, documentation, presentation, code, or testing conventions.
- `EVIDENCE.md` — inspectable sources, results, claims, and limits.
- `DECISIONS.md` — consequential accepted decisions and rationale.
- `TODO.md` — a task ledger; never authority for direction or evidence. If GitLab issues are the operative task tracker, record that choice rather than maintaining competing task lists.

`SYNC.md` stores acknowledged SHA-256 fingerprints and flexible declared dependencies. Dependencies may contain cycles; Pi Sych reports them safely for orientation. A changed input marks its direct and transitive dependents for review, not automatic edits.

## Workers and remote research

Workers receive no supervisor transcript. They receive selected context files, selected skills, project `AGENTS.md` when present, and `STYLE.md` for edit work when present.

- `read-only`: `read`, `grep`, `find`, and `ls`.
- `edit`: read-only tools plus `edit`.
- `full-host`: `read`, `edit`, and `bash`.

Every worker also has `submit_artifact`. Tool visibility is not sandboxing. `full-host` workers have the Pi process's host permissions.

Set `remoteResearch: true` only for assigned remote research. It exposes MCPorter with the configured Context7, OpenAlex, and Scholar Gateway bridge; ordinary workers do not receive it. MCPorter credentials remain private. See [configuration](docs/CONFIGURATION.md).

## Verification and review

Use project-native formatter, linter, type checker, tests, build, and smoke commands through Pi's built-in Bash. The `verify-change` skill helps choose and report meaningful checks. Passing commands do not prove source validity, semantic quality, or human approval.

Use `submit_plan` for consequential plans. Use `/plannotator-annotate` for a file and `/plannotator-last` for the last assistant response. A human must review consequential claims, citations, data, code paths, deployment, publication, and final artifacts.

## Security and limits

Pi Sych is alpha software. Read the code and dependencies before relying on it. It is not a sandbox; external containment is required when host permissions or hostile inputs matter. Remote results, model output, browser opening, passing checks, and acknowledgement are not evidence or approval.

Pi `0.82.1` currently carries the upstream `brace-expansion@5.0.7` high-severity denial-of-service advisory through nested `minimatch`. Pi Sych does not introduce or directly expose it; treat untrusted glob or brace-pattern input cautiously until Pi updates its nested resolution.

## Maintainers

- [Architecture](ARCHITECTURE.md)
- [Target architecture](pi-sych-redefined-architecture.md)
- [Development](docs/DEVELOPMENT.md)
- [Configuration](docs/CONFIGURATION.md)
- [Maintainer instructions](AGENTS.md)
