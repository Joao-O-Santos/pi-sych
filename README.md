# Pi Sych

Pi Sych is a Pi package for visible project state, bounded delegation,
and human-owned judgment in writing, research, analysis, and software
work. It keeps mechanical facts mechanical: a changed hash is not a
verdict about meaning, quality, or authority.

![](https://unpkg.com/pi-sych@4.0.2/docs/img/architecture.png)

## Install

``` sh
pi install npm:pi-sych
```

Configure a private named worker model catalog as described in
[configuration](docs/CONFIGURATION.md). Pi Sych does not contain your
credentials or provider choices.

## Six skills, selected detail

Pi initially exposes six distinct skills:

- `project` --- state, artifacts, dependencies, decisions, and plans;
- `write` --- scholarly, professional, instructional, slide, and web
  content;
- `analyze` --- quantitative, qualitative, R/Quarto, and reporting work;
- `code` --- architecture, testing, Git, npm, and web implementation;
- `review` --- independent structure, evidence, detail, copyedit, code,
  analysis, response, and verification review; and
- `research` --- search, source assessment, synthesis, and citations.

Each umbrella skill contains its always-applicable guidance and points
directly to one-level `modules/*/guidance.md` and editable `examples.md`
files. Copy an umbrella skill to `~/.pi/agent/skills/`, `.pi/skills/`,
or `.agents/skills/`, then edit only its relevant examples. Named worker
selection checks `.pi/skills/`, then `.agents/skills/`, then user
skills, then the packaged skill; the first matching copy wins.

## Project state and review

Keep `PROJECT.md` and `SYNC.json` close to work that benefits from
visible state. `PROJECT.md` records purpose, direction, completion
criteria, previous action, and immediate next step. `SYNC.json` records
acknowledged fingerprints and declared dependencies. Optional
`AGENTS.md`, `STYLE.md`, `EVIDENCE.md`, `DECISIONS.md`, `TODO.md`, and
`INBOX.md` serve distinct purposes; `TODO.md` is task state, while
`INBOX.md` holds unreviewed promotion proposals and is never canonical
state.

Use `project_status` or `/pi-sych-status` to inspect mechanical state
and pending `INBOX.md` proposals. `/compact` and automatic compaction
preserve a task-centred working-memory summary plus Pi's recent context;
review proposals with `/plannotator-annotate INBOX.md` before promoting
them into canonical files. Acknowledge only files you actually reviewed.
For substantive work made in the current session, prefer an independent
read-only reviewer with an unprimed verdict. For substantive
behavior-changing code, prefer independently authored failing tests
before implementation.

Workers are short-lived Pi sessions for one bounded task. They receive
only selected context, never the supervisor transcript. Tool modes limit
visible Pi tools, not host permissions.

## Plannotator

`/plannotator-last` returns feedback to the conversation.
`/plannotator-annotate <file>` writes `<file>.feedback.md`, and
`/plannotator-review` writes `PLANNOTATOR_REVIEW.md`. These remain human
commands; Pi Sych does not register Plannotator plan mode or a plan
submission tool.

## For maintainers

Read [architecture](ARCHITECTURE.md),
[development](docs/DEVELOPMENT.md),
[configuration](docs/CONFIGURATION.md), and
[contributing](CONTRIBUTING.md). Pi Sych is alpha software: inspect
code, dependencies, and outputs before using it for consequential work.
