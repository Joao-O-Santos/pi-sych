# Pi Sych

Pi Sych is a small Pi package for projects where "looks finished" is not
proof that something is finished.

It keeps project state visible, delegates bounded tasks to short-lived
workers, and leaves consequential decisions with humans. A changed hash
is evidence that content changed---not a verdict about drift, quality,
or authority.

![Pi Sych architecture: project state, bounded workers, and human
review](https://unpkg.com/pi-sych@4.0.3/docs/img/architecture.png)

## Start here

Install the package from npm:

``` sh
pi install npm:pi-sych
```

Open a project and try:

``` text
/pi-sych-status
```

The status command reports tracked files, missing files, declared review
impact, project-file problems, and pending review proposals. It does not
decide whether a change is good or bad.

For worker delegation, create a private model catalog and initialize the
worker runtime once:

``` sh
mkdir -p ~/.config/pi/pi-sych
$EDITOR ~/.config/pi/pi-sych/models.json
node /path/to/pi-sych/scripts/bootstrap-worker-agent-dir.mjs
```

Replace `/path/to/pi-sych` with the package location used by your Pi
installation. The bootstrap script is intentionally explicit: nothing
silently mutates your home directory in the background.

The catalog contains provider model identifiers and stays outside the
package. Pi Sych does not ship credentials or choose providers for you.
See [configuration](docs/CONFIGURATION.md) for the complete setup.

## The useful mental model

Pi Sych gives you a few sturdy pieces rather than a grand workflow:

- **Project state:** `PROJECT.md` explains purpose, direction,
  completion, and the next step. `SYNC.json` records fingerprints and
  explicit dependency edges.
- **Mechanical status:** `project_status` reports what changed and what
  depends on it. Human review supplies the meaning.
- **Bounded delegation:** `dispatch_worker` starts one clean,
  short-lived worker with an explicit task, model role, context packet,
  skills, mode, and timeout.
- **Working memory:** compaction keeps a small summary and may append
  plainly marked proposals to `INBOX.md`. Proposals are review material,
  never canonical state.
- **Human review:** Plannotator commands support file annotation, last
  message annotation, and code review without adding a plan controller.

This is intentionally not an autonomous project manager. It does not
silently promote model output into evidence, citations, release state,
or final approval.

## Six public skills

Pi initially exposes six umbrella skills:

- `project` --- state, artifacts, dependencies, decisions, and plans;
- `write` --- scholarly, professional, instructional, slide, and web
  content;
- `analyze` --- quantitative, qualitative, R/Quarto, and reporting work;
- `code` --- architecture, testing, Git, npm, and web implementation;
- `review` --- independent structure, evidence, detail, copyedit, code,
  analysis, response, and verification review; and
- `research` --- search, source assessment, synthesis, and citations.

Each skill keeps its always-applicable guidance close to one-level
`modules/*/guidance.md` and editable `examples.md` files. Customize
examples in `.pi/skills/`, `.agents/skills/`, or `~/.pi/agent/skills/`;
the first matching named skill wins.

## Commands and tools

Agent tools:

- `project_status` --- check or acknowledge mechanical project state;
- `dispatch_worker` --- run one bounded worker after private model
  setup.

Human commands:

- `/pi-sych-status`
- `/pi-sych-mcp`
- `/plannotator-annotate <project-local-file>`
- `/plannotator-last`
- `/plannotator-review`

The worker modes control which Pi tools are visible. They are not
sandboxes and do not remove host permissions. Review the source and Pi's
security guidance before using a worker on consequential material.

## Read next

- [Configuration](docs/CONFIGURATION.md) --- private models, worker
  setup, project roots, canonical paths, and optional integrations;
- [Architecture](ARCHITECTURE.md) --- supervisor-facing runtime
  boundaries and mechanical invariants;
- [Development](docs/DEVELOPMENT.md) --- checks, tests, style, and
  design constraints for contributors; and
- [Contributing](CONTRIBUTING.md) --- issues, pull requests, and release
  ownership.

Pi Sych is alpha software. Inspect source, dependencies, generated
outputs, and external results before relying on it for consequential
work.
