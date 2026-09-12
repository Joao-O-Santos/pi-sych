# Pi Sych

![Pi Sych logo: inspectable files, bounded tasks, durable state, and
human decisions](docs/img/logo.png)

[![pipeline
status](https://gitlab.com/Joao-O-Santos/pi-sych/badges/main/pipeline.svg)](https://gitlab.com/Joao-O-Santos/pi-sych/-/commits/main)
[![coverage](https://gitlab.com/Joao-O-Santos/pi-sych/badges/main/coverage.svg?job=verify)](https://gitlab.com/Joao-O-Santos/pi-sych/-/pipelines)
[![npm
version](https://img.shields.io/npm/v/pi-sych.svg)](https://www.npmjs.com/package/pi-sych)
[![npm
downloads](https://img.shields.io/npm/dt/pi-sych.svg)](https://www.npmjs.com/package/pi-sych)
[![license](https://img.shields.io/npm/l/pi-sych.svg)](https://gitlab.com/Joao-O-Santos/pi-sych/-/blob/main/docs/LICENSE.md)

Pi Sych helps serious LLM-assisted projects remain understandable beyond
one conversation. It is a small Pi package that keeps durable state in
ordinary files, gives bounded tasks to short-lived model contexts, and
keeps consequential decisions with the user.

Long chats mix accepted decisions with stale assumptions, rejected
ideas, and review debate. Pi Sych takes a file-first approach: ordinary
project files form the durable record, mechanical status reports changed
content and dependency impact, and short-lived workers make
clean-context delegation and independent review possible.

It is deliberately not an autonomous project manager or a hierarchy of
persistent agents. It does not silently decide what a project means or
promote model output into project truth.

At a glance, you describe the work in ordinary language; Pi Sych makes
project files and task-specific guidance available and, when useful,
helps the supervisor give one bounded task to a short-lived worker. The
supervisor should keep working through an already-authorized task until
completion or a genuine blocker, while increasing scrutiny for authored
prose, consequential decisions, and external side effects without
inventing extra approval checkpoints.

![Pi Sych overview: a request can use task-specific skills and project
files, optionally involve a focused worker, and return for human review
and decision](docs/img/workflow.png)

This is an orientation, not a required sequence or a complete runtime
contract. Direct work need not use a worker, skills guide rather than
decide, and important decisions remain yours.

Pi Sych requires Node 26 or newer and is installed as a package for
[Pi](https://pi.dev/). In this README, the **supervisor** is the model
in your main Pi session. A **worker** is a separate, short-lived model
process created for one bounded task. A **skill** is reusable model
guidance, not a persistent agent. `project_status` is the mechanical
tool that checks or acknowledges project state.

## Quick start

Install Pi Sych:

``` sh
pi install npm:pi-sych
```

A project can begin with the starter
[`PROJECT.md`](https://gitlab.com/Joao-O-Santos/pi-sych/-/blob/main/templates/PROJECT.md).
Add the starter
[`SYNC.json`](https://gitlab.com/Joao-O-Santos/pi-sych/-/blob/main/templates/SYNC.json)
when you want mechanical fingerprint and dependency tracking for project
files.

Open the project in Pi and inspect its state:

``` text
/pi-sych-status
```

The status command reports tracked files, missing files, declared
dependency impact, project-file problems, and pending review proposals.
It does not decide whether a change is scientifically, conceptually, or
editorially correct.

Worker setup is optional. Direct work with project files, local
literature lookup, and skills does not require it. To dispatch bounded
workers, configure a private model catalogue and initialize a worker
directory. See [configuration](docs/configuration.md) for worker setup.

## A typical research workflow

Pi Sych does not impose a fixed workflow. One useful worked pattern is
to separate independent review, revision, and verification into fresh
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

[![Detailed review and edit workflow: independent review, human
decision, clean-context editing, fresh verification, and
acknowledgement](docs/img/review_workflow.png)](docs/review-workflow.md)

The separation between review and editing is deliberate. Rejected
alternatives and the arguments used to evaluate them do not normally
belong in the writer's context.

A broad request can still authorize broad work. "Review the whole
manuscript", "rewrite the whole section", or "implement this plan"
should normally be completed across the named scope. High scrutiny means
more careful checking, not repeated prompts asking whether to continue.

## Project files as shared memory

Pi Sych does not treat the conversation transcript as the authoritative
record of a project. Durable information belongs in ordinary files that
a collaborator, another model, or a future session can inspect.

A project can begin with `PROJECT.md` and add other files only when they
become useful. `EVIDENCE.md` is optional task evidence, not a required
repository file.

| File           | Typical purpose                                                                              |
|------------------------------------|------------------------------------|
| `PROJECT.md`   | Objective, accepted direction, definition of done, previous action, and immediate next step. |
| `EVIDENCE.md`  | Important claims, sources, outputs, caveats, and task evidence.                              |
| `DECISIONS.md` | Accepted consequential decisions and their reasons.                                          |
| `TODO.md`      | Open work that has not yet been completed.                                                   |
| `STYLE.md`     | Stable terminology, spelling, venue conventions, and writing preferences.                    |
| `SYNC.json`    | Mechanical fingerprints, statuses, and declared relationships between files.                 |
| `INBOX.md`     | Unreviewed proposals that have not become authoritative project state.                       |

These files are not an invitation to document everything. They preserve
the information another person or model would need to continue without
reconstructing the project from chat history.

## Why separate contexts?

A model can be influenced by everything in its current context window,
including ideas that were considered and rejected. That can be useful
during discussion, but it is not always useful during implementation.

Pi Sych therefore supports two worker context modes. `clean` receives no
supervisor transcript and is best when an explicit task packet is
enough. `trajectory` receives the persisted supervisor branch
immediately before the dispatch and is useful when prior exploration
materially helps the assignment. A plan, TODO, or task brief produced
during supervisor pre-work can make a later clean worker sufficient.
Needing context does not imply that the supervisor must perform the task
itself.

Context mode is independent of files, skills, model, tool mode, and
research access. In either mode the result returns to the supervisor.
Context selection is not an operating-system sandbox.

## What Pi Sych can help with

Skills are reusable guidance for a model, not persistent agents. Pi Sych
exposes seven broad skills and loads more specific guidance only when it
is relevant.

-   `project` --- project state, artifacts, dependencies, decisions, and
    plans;
-   `write` --- scholarly, professional, instructional, slide, and web
    content;
-   `analyze` --- quantitative, qualitative, R/Quarto, and reporting
    work;
-   `code` --- software design, implementation, testing, automation, CLI
    and developer tooling, integration, Git, npm, and web work;
-   `review` --- structure, evidence, detail, copyediting, code,
    analysis, response, and verification;
-   `research` --- search, source assessment, synthesis, and citations;
    and
-   `automation` --- capability selection, deterministic data/file work,
    workflow composition, and browser/UI automation.

Each umbrella skill contains small ordered task recipes. A recipe
selects only the shared methods and local modules needed for that task.
Shared methods have no `SKILL.md`, so Pi discovers exactly seven public
skills. The recipes are plain Markdown links, not a loader, inheritance
system, or workflow controller.

## Commands you can use

Human-facing commands:

-   `/pi-sych-status` --- show mechanical project state;
-   `/pi-sych-mcp` --- inspect optional MCPorter configuration without
    printing credentials;
-   `/plannotator-annotate <project-local-markdown-file>` --- annotate a
    project-local `.md` or `.mdx` file and save feedback beside it;
-   `/plannotator-last` --- annotate the last assistant response and
    return the feedback to the conversation; and
-   `/plannotator-review` --- open Plannotator code review for current
    changes or a pull request.

Plannotator is a separately selectable human review adapter. It does not
add a plan controller, automatically accept feedback, or promote
generated output into project state.

### Tools available to the supervising model

Pi Sych gives the supervisor three tools:

-   `project_status` checks or acknowledges project state;
-   `dispatch_worker` starts one bounded, short-lived worker; and
-   `literature_search` performs direct read-only lookup in the
    configured local literature index.

A separately installed and active read-only `web` tool can also remain
available to the supervisor. Pi Sych does not register one.

Choosing direct work versus delegation is contextual rather than a fixed
default. Direct work is efficient for simple or tightly connected work.
Dispatch helps when independent context, breadth, specialization, a
cheaper model, or substantial execution is useful. Clean workers are
appropriate when an explicit packet contains what they need; trajectory
workers are appropriate when conversation history itself materially
helps.

### Research workers and local literature

The supervisor can call `literature_search` directly. A worker selected
with the exact `research` skill also receives the same read-only tool.
The index is a discovery surface: returned metadata and snippets do not
verify the underlying source or prove collection completeness. Inspect
the source when wording, methods, results, quotations, correction
status, or precise metadata matters.

## How it works

Pi Sych supplies a few mechanical pieces rather than a general
orchestration system:

-   **Explicit project state:** ordinary files record accepted
    direction, decisions, evidence, style, and work state when useful.
-   **Mechanical status:** `project_status` reports changed or missing
    files and affected dependants. Human review supplies the meaning.
-   **Direct retrieval:** local literature and an independently active
    read-only web tool can support small exploration without another
    model context.
-   **Bounded delegation:** `dispatch_worker` starts one short-lived
    worker with an explicit assignment, clean or trajectory context,
    files, skills, model role, tool mode, and timeout.
-   **Small working memory:** custom compaction can retain bounded
    continuation state and place clearly marked proposals in `INBOX.md`.
-   **Human review:** Plannotator provides annotation and code-review
    interfaces without becoming a workflow controller.

This is intentionally not an autonomous project manager. It does not
silently turn model output into evidence, citations, release state,
approval, or project truth.

## For supervising models

When working in a Pi Sych project:

-   infer authorization from the actual request: a clear request to
    review, rewrite, implement, or complete a named scope normally
    authorizes that scope;
-   separate persistence from scrutiny: continue authorized work until
    complete or genuinely blocked, while checking consequential and
    authored work more carefully;
-   inspect project state before substantial work and read only relevant
    canonical files;
-   choose direct work or delegation by task and context, not a
    universal default;
-   use clean workers when an explicit task packet is sufficient and
    trajectory workers when prior conversation materially helps;
-   remember that supervisor pre-work captured in a plan, TODO, or brief
    can enable later clean delegation;
-   inspect the available skill catalogue before dispatch and select
    only valuable skills;
-   treat changed hashes as evidence of changed content, not semantic
    drift;
-   do not treat proposals, generated text, successful checks, or
    reviewer output as human approval; and
-   report only retrieval, execution, review, and verification that
    actually occurred.

See [architecture](docs/ARCHITECTURE.md) for the complete runtime
contract and [configuration](docs/configuration.md) for setup and skill
customization.

## Detailed documentation

-   [Review and revision workflow](docs/review-workflow.md)
-   [Configuration](docs/configuration.md)
-   [Public contract](docs/public-contract.md)
-   [Architecture](docs/ARCHITECTURE.md)
-   [Development](docs/development.md)
-   [Code tour](docs/code-tour.md)
-   [Contributing](docs/CONTRIBUTING.md)
-   [Attribution](docs/attribution.md)
