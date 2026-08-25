# Pi Sych

[![pipeline
status](https://gitlab.com/Joao-O-Santos/pi-sych/badges/main/pipeline.svg)](https://gitlab.com/Joao-O-Santos/pi-sych/-/commits/main)
[![coverage](https://gitlab.com/Joao-O-Santos/pi-sych/badges/main/coverage.svg?job=verify)](https://gitlab.com/Joao-O-Santos/pi-sych/-/pipelines)
[![npm
version](https://img.shields.io/npm/v/pi-sych.svg)](https://www.npmjs.com/package/pi-sych)
[![npm
downloads](https://img.shields.io/npm/dt/pi-sych.svg)](https://www.npmjs.com/package/pi-sych)
[![license](https://img.shields.io/npm/l/pi-sych.svg)](https://gitlab.com/Joao-O-Santos/pi-sych/-/blob/main/docs/LICENSE.md)

Pi Sych is a small Pi package for research, writing, analysis, and code
projects that need to remain understandable beyond a single LLM
conversation.

Long conversations accumulate abandoned ideas, reviewer arguments, stale
assumptions, and decisions that may never leave the chat. Memory systems
can help, but they can also become large, opaque, or another source of
irrelevant context. Pi Sych explores a file-first alternative: keep
durable project knowledge in ordinary documents, give short-lived
workers only the context needed for one task, and leave consequential
decisions with the user.

It is not an autonomous project manager or a hierarchy of persistent
agents. It provides a small set of mechanisms for keeping project state
visible, separating tasks when fresh context helps, reviewing changes
independently, and handing work between people or models without relying
on hidden conversational memory.

Pi Sych requires Node 26 or newer and is installed as a package for
[Pi](https://pi.dev/). In this README, the **supervisor** is the model
in your main Pi session. A **worker** is a separate, short-lived model
process created for one bounded task. A **skill** is reusable model
guidance, not a persistent agent. `project_status` is the mechanical
tool that checks or acknowledges project state.

## A typical research workflow

Pi Sych does not impose a fixed workflow. One useful pattern is to
separate independent review, revision, and verification into fresh
contexts.

1.  You write or update a manuscript.
2.  The supervisor checks project state and launches an independent
    reviewer with the manuscript, relevant evidence, and a focused
    brief.
3.  You read the findings and decide which to accept, reject,
    prioritize, or clarify.
4.  The supervisor launches a fresh edit worker with the accepted
    corrections and only the source context needed to implement them.
5.  Another fresh worker verifies the revised manuscript against the
    original evidence and requirements.
6.  After you approve the result, Pi Sych can acknowledge the reviewed
    files and identify any dependent files that now require attention.

[![Pi Sych review and edit workflow: independent review, human decision,
clean-context editing, fresh verification, and
acknowledgement](docs/img/review_workflow.png)](docs/review-workflow.md)

The separation between review and editing is deliberate. Rejected
alternatives and the arguments used to evaluate them do not normally
belong in the writer's context.

Suppose an earlier draft said X. A reviewer recommends Y, and you agree.
A writer exposed to the entire debate may produce "Not X, but Y."

A fresh edit worker given the accepted correction can instead produce
the clean statement "Y."

See the [review and revision workflow](docs/review-workflow.md) for the
complete example and its limits.

## Quick start

Install Pi Sych:

``` sh
pi install npm:pi-sych
```

Open a project in Pi and inspect its state:

``` text
/pi-sych-status
```

The status command reports tracked files, missing files, declared
dependency impact, project-file problems, and pending review proposals.
It does not decide whether a change is scientifically, conceptually, or
editorially correct.

You can use Pi Sych's project files and skills directly. Separate worker
configuration is required only when you want the supervisor to launch
fresh model processes for bounded tasks.

## Project files as shared memory

Pi Sych does not treat the conversation transcript as the authoritative
record of a project. Durable information belongs in ordinary files that
a collaborator, another model, or a future session can inspect.

A project can begin with `PROJECT.md` and add other files only when they
become useful. `EVIDENCE.md` is optional task evidence, not a required
repository file.

| File | Typical purpose |
|------------------------------------|------------------------------------|
| `PROJECT.md` | The objective, accepted direction, definition of done, previous action, and immediate next step. |
| `EVIDENCE.md` | Important claims, sources, quotations, outputs, caveats, and material that may support the artifact. |
| `DECISIONS.md` | Accepted methodological, conceptual, editorial, or architectural decisions and their reasons. |
| `TODO.md` | Open work that has not yet been completed. |
| `STYLE.md` | Stable terminology, spelling, venue conventions, and writing preferences. |
| `SYNC.json` | Mechanical fingerprints, statuses, and declared relationships between files. |
| `INBOX.md` | Unreviewed proposals that have not become authoritative project state. |

These files are not an invitation to document everything. They preserve
the information that another person or model would need to continue the
work without reconstructing it from chat history.

For example, a small manuscript project might contain:

``` text
my-paper/
├── PROJECT.md
├── manuscript.qmd
├── DECISIONS.md
├── TODO.md
├── STYLE.md
└── SYNC.json
```

## Why separate contexts?

A model can be influenced by everything in its current context window,
including ideas that were considered and rejected. That can be useful
during discussion, but it is not always useful during implementation.

Reviewing and revising a manuscript in one long conversation can cause
the final prose to retain traces of the debate. Rejected alternatives
may reappear as unnecessary qualifications, contrasts, defensive
language, or explanations that the reader never needed.

Pi Sych can instead launch a fresh worker with a deliberately selected
packet:

- the task;
- the expected result;
- the files required for that task;
- the relevant skills and guidance;
- the selected model and tool mode;
- optional integrations; and
- a bounded timeout.

The worker does not receive the supervisor transcript. Its result
returns to the supervisor, where the user decides what should happen
next.

This is context isolation, not an operating-system sandbox. The
supervisor still chooses what the worker receives. Depending on the
task, that may include editing tools, Bash, or remote-research tools.

## What Pi Sych can help with

Skills are reusable guidance for a model, not persistent agents. Pi Sych
initially exposes six broad skills and loads more specific guidance only
when it is relevant.

- `project` --- project state, artifacts, dependencies, decisions, and
  plans;
- `write` --- scholarly, professional, instructional, slide, and web
  content;
- `analyze` --- quantitative, qualitative, R/Quarto, and reporting work;
- `code` --- architecture, testing, Git, npm, and web implementation;
- `review` --- structure, evidence, detail, copyediting, code, analysis,
  response, and verification; and
- `research` --- search, source assessment, synthesis, and citations.

Each umbrella skill contains small ordered task recipes. A recipe
selects only the shared methods and local modules needed for that task:

- shared methods define reusable procedures for prose, hypothesis
  generation, argument analysis, and claim-to-evidence mapping; and
- local modules adapt those procedures to a genre, artifact, or review
  mode.

Shared methods have no `SKILL.md`, so Pi still discovers exactly six
public skills. The recipes are plain Markdown links, not a loader,
inheritance system, or workflow controller. Project, user, and packaged
versions can override one another without enlarging the public
catalogue. See [skill
customization](docs/configuration.md#skill-customization) for the lookup
order and customization paths.

## Commands you can use

Human-facing commands:

- `/pi-sych-status` --- show mechanical project state;
- `/pi-sych-mcp` --- inspect optional MCPorter configuration without
  printing credentials;
- `/plannotator-annotate <project-local-file>` --- annotate a file and
  save feedback beside it;
- `/plannotator-last` --- annotate the last assistant response and
  return the feedback to the conversation; and
- `/plannotator-review` --- open Plannotator code review for current
  changes or a pull request.

Plannotator is a separately selectable human review adapter. It does not
add a plan controller, automatically accept feedback, or promote
generated output into project state.

### Enable, disable, and narrow runtime resources

Pi Sych's package enables its workbench and Plannotator extensions by
default. Use `pi config` to disable either extension or use a package
filter such as `"extensions": ["extensions/workbench/index.ts"]` to keep
the core while omitting Plannotator; use `"extensions": []` to load no
package extensions while retaining package skills. Use `--no-extensions`
for a session with no extensions. For a selected session, `--tools`
allow-lists tools and `--exclude-tools` removes named tools; these
control visible Pi tools, not host permissions. See
[configuration](docs/configuration.md#pi-native-resource-controls) and
the [public contract](docs/public-contract.md).

### Tools available to the supervising model

Pi Sych gives the supervisor two mechanical tools:

- `project_status` checks or acknowledges project state; and
- `dispatch_worker` starts one bounded, short-lived worker.

In Pi's terminal interface, expand a `dispatch_worker` tool call with
the configured tool-expansion shortcut (`Ctrl+O` by default) to inspect
its complete submitted request.

These tools support a workflow; they do not decide what the workflow
must be.

### Research workers and local literature

A worker selected with the `research` skill also receives
`literature_search`; it is not a supervisor tool and is not added for
other skills. The tool searches a local, read-only SQLite FTS5 database.
Its supported schema stores canonical metadata in `papers` and uses an
external-content FTS5 table named `papers_fts`. It searches filepath,
title, abstract, tags, and DOI; returns ranked metadata (`title`,
`first_author`, `year`, and `doi`), a marked snippet from `abstract`, a
score, and each source path resolved relative to the database. See
[configuration](docs/configuration.md#local-literature-search) for
database resolution and `literatureDatabase`.

## Optional: enable workers

Direct work does not require a worker model catalogue. To let the
supervisor launch separate workers, create a private catalogue and
initialize the worker runtime once:

``` sh
mkdir -p ~/.config/pi/pi-sych
$EDITOR ~/.config/pi/pi-sych/models.json
node /path/to/pi-sych/scripts/bootstrap-worker-agent-dir.mjs \
  --agent-dir ~/.config/pi/pi-sych/worker-agent
```

Replace `/path/to/pi-sych` with the package location used by your Pi
installation.

The catalogue contains provider model identifiers and remains outside
the package. Pi Sych does not ship credentials, rank providers, or
choose models for you. The bootstrap operation is explicit and does not
silently modify your home directory during ordinary use.

See [configuration](docs/configuration.md) for model roles, worker
directories, canonical paths, skill overrides, and optional remote
research.

## How it works

Pi Sych supplies a few mechanical pieces rather than a general
orchestration system:

- **Explicit project state:** `PROJECT.md` records the accepted
  direction and `SYNC.json` records fingerprints and declared
  dependencies.
- **Mechanical status:** `project_status` reports changed or missing
  files and affected dependants. Human review supplies the meaning.
- **Bounded delegation:** `dispatch_worker` starts one fresh worker with
  an explicit task, context packet, skills, model role, mode, and
  timeout. A worker submits one immutable `status`, `summary`, `files`,
  and `limitations` result; Pi Sych accepts it only after normal process
  exit and validates reported project files.
- **Small working memory:** configured custom compaction uses the active
  supervisor model to produce bounded structured continuation memory,
  with Pi's standard compactor remaining available when it is disabled
  or custom compaction fails. It retains a bounded continuation summary,
  including consequential unresolved alternatives, negative results, and
  failed approaches, and may place plainly marked proposals in
  `INBOX.md`.
- **Human review:** Plannotator provides annotation and code-review
  interfaces without becoming a workflow controller.

This is intentionally not an autonomous project manager. It does not
silently turn model output into evidence, citations, release state,
approval, or project truth.

## Limits and responsibilities

Pi Sych provides context and process boundaries, not proof that an
artifact is correct.

- A changed hash establishes that content changed; it does not establish
  conceptual drift, improvement, or error.
- A successful test establishes only what that test examined.
- A worker result is model-generated output and still requires
  appropriate review.
- Worker modes control which Pi tools are visible. They do not remove
  the worker process's underlying host permissions.
- Remote research and external tools may return incomplete, outdated, or
  incorrect information.
- Human users remain responsible for consequential decisions,
  publication, release, and final approval.

Inspect sources, generated outputs, external results, and package
behaviour before relying on them for consequential work.

## Why I built this

Pi Sych grew out of my move from OpenCode to Pi. I was attracted to Pi
because its core is small and its extension model leaves room for users
to build the workflow they need.

I did not want to reproduce a large orchestration framework or maintain
a roster of persistent specialist agents. Other extensions already
explore those approaches, and they may be a better fit for people who
want them. I wanted to see how far a smaller set of mechanisms could go:
explicit project files, normal Pi skills, short-lived workers, and human
review.

The project was also shaped by experience with memory systems. Many of
those tools are useful, and Pi Sych is not an argument that they should
not exist. My difficulty was that memories could become large, opaque,
or closely tied to one model and one conversation. Important findings
were not always easy for another researcher, collaborator, or model to
inspect.

Pi Sych therefore treats ordinary files as the durable record. The
conversation remains useful working space, but accepted evidence,
decisions, and project direction should be written somewhere that can be
reviewed and handed over.

This is an experiment in keeping that approach useful without adding
more machinery than the problem appears to require.

## For supervising models

When working in a Pi Sych project:

- inspect project state before substantial work;
- read `PROJECT.md` and only the additional files needed for the task;
- treat accepted project files, rather than conversational recollection,
  as the durable project record;
- work directly unless an independent context would materially improve
  the result;
- give workers the smallest complete packet and no supervisor
  transcript;
- treat changed hashes as evidence of changed content, not semantic
  drift;
- do not treat proposals, generated text, successful checks, or reviewer
  output as human approval; and
- report only retrieval, execution, review, and verification that
  actually occurred.

See [architecture](docs/ARCHITECTURE.md) for the complete runtime
contract.

## Status and contributions

Pi Sych is alpha software. Its current design reflects one approach to
organizing long-running LLM-assisted work, and it will not suit every
project.

Issues and contributions are welcome, especially from researchers,
writers, analysts, and maintainers using it outside conventional
software-development workflows.

Useful contributions include:

- clearer documentation and examples;
- improvements to the public skills;
- small reproducible bug reports;
- project templates;
- accessibility improvements; and
- reports of where the file-first approach does or does not work well.

See [contributing](docs/CONTRIBUTING.md) before proposing code or
release changes.

## Detailed documentation

- [Review and revision workflow](docs/review-workflow.md) --- a
  user-guided pattern for independent review, clean-context editing, and
  fresh verification;
- [Configuration](docs/configuration.md) --- private models, worker
  setup, project roots, canonical paths, skill customization, Pi-native
  resource controls, and optional integrations;
- [Public contract](docs/public-contract.md) --- supported userland,
  compatibility-sensitive internals, and SemVer/migration rules;
- [Architecture](docs/ARCHITECTURE.md) --- supervisor-facing runtime
  boundaries and mechanical invariants;
- [Development](docs/development.md) --- checks, deterministic test
  posture, style, and design constraints for contributors;
- [Code tour](docs/code-tour.md) --- a guided map of the current runtime
  and its [live generated code reference](code-reference.html); and
- [Contributing](docs/CONTRIBUTING.md) --- issues, pull requests, and
  release ownership; and
- [Attribution](docs/attribution.md) --- cited influences behind the
  skills and package design, plus platform and integration
  acknowledgements.
