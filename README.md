# Pi Sych

Pi Sych is a Pi package for people who want their writing, research, analysis, or software projects to stay understandable as they evolve. It helps you keep visible project state, delegate a bounded task to a clean-context worker, and request human review of consequential plans. It does not decide what is true, important, or approved for you.

![](https://unpkg.com/pi-sych@1.1.0/docs/img/architecture.png)

## Install

```sh
pi install npm:pi-sych
```

Pi Sych includes its Plannotator integration. Do not install Plannotator as a separate Pi extension for this package. To use workers, configure your private model profiles as described in the [configuration guide](docs/CONFIGURATION.md).

## What it helps with

- Keep a short `PROJECT.md` and a machine-checkable `SYNC.md` beside your work.
- See which tracked files changed and which declared dependents may need review.
- Ask a short-lived worker to research, review, or implement one bounded task with only the context you select.
- Open a plan or document in Plannotator for your review and send feedback back to Pi.

## Start a project

1. Use the `bootstrap-project` skill to create `PROJECT.md`, `SYNC.md`, and only the optional files that help your project.
2. Use `project_status` to see missing files, changed tracked files, declared dependencies, and cycles.
3. Read the relevant work, use an appropriate skill, and make ordinary changes directly.
4. Use `dispatch_worker` for an independent, bounded task when a separate context is genuinely useful.
5. Use `submit_plan` before an irreversible or otherwise consequential change.
6. After you have actually reviewed a change, acknowledge the files you reviewed with `project_status`.

A changed hash tells you that a file differs from its last acknowledgement. It is a prompt to inspect the work, not a verdict about quality, authority, or conceptual disagreement.

## Project files

`PROJECT.md` records your purpose, current direction, completion criteria, previous action, and immediate next step. Use `None at present.` when there is no accepted next action. `SYNC.md` records SHA-256 fingerprints and declared file dependencies.

Optional files are useful only when they serve a purpose:

- `AGENTS.md` — project conventions and collaboration instructions.
- `STYLE.md` — writing, presentation, code, or testing conventions.
- `EVIDENCE.md` — inspectable sources, results, claims, and limits.
- `DECISIONS.md` — consequential decisions and their rationale.
- `TODO.md` — a task ledger, not a source of authority or evidence. If GitLab issues are the operative task tracker, record that choice instead of maintaining competing lists.

## Workers and review

![](https://unpkg.com/pi-sych@1.1.0/docs/img/supervisors_context.png)

A worker receives no transcript of your main Pi conversation. You choose its task, expected output, context files, skills, model profile, and—only for assigned research—remote access. It has a 90-second default timeout; choose a bounded longer timeout only when the task warrants it.

- `read-only` workers can inspect files.
- `edit` workers can inspect and edit files.
- `full-host` workers can inspect, edit, and run Bash commands.

Every worker returns a visible structured result with its summary, artifacts, changed files, limitations, result package, and any abnormal process outcome. Tool visibility is not containment: a full-host worker has the Pi process's host permissions.

For a consequential plan, `submit_plan` opens a browser review. Approval does not automatically begin implementation. Feedback and approval notes are returned to Pi so the next step remains yours to choose.

Commands: `/pi-sych-status`, `/pi-sych-mcp`, `/plannotator-annotate <file>`, and `/plannotator-last`.

## Working principles

1. Humans remain responsible for consequential decisions and final outputs.
2. The main Pi session coordinates the work; workers handle bounded tasks.
3. Important project state belongs in files, not only in conversation memory.
4. Give every worker the smallest complete context.
5. Choose a model that fits the task.
6. Use mechanical tools for mechanical questions and judgment for semantic ones.
7. Prefer existing Pi tools and skills to new infrastructure.
8. Keep the implementation small enough to inspect.
9. Treat generated prose, remote results, and passing checks as inputs to review, not substitutes for it.

## For maintainers

See [architecture](ARCHITECTURE.md), [development](docs/DEVELOPMENT.md), [configuration](docs/CONFIGURATION.md), [contributing](CONTRIBUTING.md), and [maintainer instructions](AGENTS.md).

Pi Sych is alpha software. Review code and dependencies before relying on it for consequential work. For hostile inputs or stronger isolation requirements, use external containment rather than assuming a Pi tool mode is a security boundary.
