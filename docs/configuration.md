# Configuration

Pi Sych keeps credentials, provider choices, model identifiers, and
personal examples outside the public package. That separation lets the
package describe mechanics without pretending to know your accounts,
costs, or risk tolerance.

## Worker models

Create a private catalog such as `~/.config/pi/pi-sych/models.json`:

``` json
{
  "default": "mid coder",
  "models": {
    "mid coder": {
      "model": "provider/model",
      "cost": "low",
      "notes": "Routine edits and tests."
    }
  }
}
```

`dispatch_worker` looks up the exact requested `modelRole`, or the
catalog's `default` role. Cost and notes are context for the supervisor;
the runtime does not rank models or invent fallbacks.

The model catalog is needed when a worker is dispatched, not merely to
start Pi Sych for direct project work. Pi Sych uses the first applicable
configuration directory: `<projectRoot>/.pi/pi-sych` when project `.pi`
exists; `$PI_CODING_AGENT_DIR/pi-sych`; `$XDG_CONFIG_HOME/pi/pi-sych`;
`~/.config/pi/pi-sych` when that Pi directory exists; then
`~/.pi/pi-sych`.

The workbench creates `<resolved-config-directory>/config.json` with
these defaults:

``` json
{
  "version": 1,
  "workerAgentDir": "worker-agent",
  "modelCatalog": "models.json",
  "mcporterConfig": "mcp/mcporter.json",
  "compaction": { "custom": true, "compactAt100k": false },
  "review": { "mode": "plannotator" }
}
```

Edit this file to configure behavior. Set `compaction.compactAt100k` to
`true` and reload the workbench to enable optional settled-turn
admission at the `agent_settled` boundary. `compaction.custom` controls
custom handling of manual and native compaction requests.

## Initialize the worker runtime

Run the packaged bootstrap script once for that directory's
`worker-agent` subdirectory. If the first dispatch finds an
uninitialized worker directory, `dispatch_worker` reports the exact
bootstrap command with the resolved package and configuration paths.

Remote research has a separate per-dispatch opt-in. The worker bootstrap
does not create or guess integrations.

## Worker context choice

`dispatch_worker.contextMode` defaults to `clean`. Use `clean` when the
explicit assignment, files, and selected skills provide enough context.
Use `trajectory` when prior supervisor conversation materially improves
the bounded assignment.

Context need does not determine who must execute the task. The
supervisor can explore or plan first, write the relevant state into a
plan, TODO, brief, or context file, and then delegate a clean task to a
worker. Conversely, a simple direct request may be faster and clearer to
complete in the supervisor without delegation.

Trajectory mode requires a persisted exact tool-call boundary, creates a
private native branch immediately before the assistant entry containing
that dispatch, and fails clearly rather than falling back to clean.
Context mode does not alter worker tools, permissions, model, skills,
files, or research access.

## Local literature search

`literature_search` is available directly to the supervisor. A
dispatched worker also receives it when its selected skills include the
exact `research` selector. Capability inspection can report whether the
resolved database is absent, present with an unverified search schema,
or degraded; it does not verify access to the underlying sources. The
database is selected in this order:

1.  `<projectRoot>/LITERATURE.sqlite`, when it exists;
2.  `literatureDatabase` in resolved `pi-sych/config.json`; or
3.  `<resolved-config-directory>/literature.sqlite`.

The tool opens the database read-only. Search results contain discovery
metadata, snippets, scores, and source paths. They do not establish that
the underlying source supports a claim and do not establish collection
completeness. Inspect the source when exact wording, method, result,
quotation, correction status, or precise metadata matters.

The supported v7 schema stores canonical metadata in `papers` and uses
an external-content FTS5 table named `papers_fts`:

``` sql
CREATE TABLE papers (
  id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT,
  filename TEXT, year INTEGER, item_type TEXT,
  creators_json TEXT, title TEXT, abstract TEXT,
  topic_tags TEXT, doi TEXT
);
CREATE VIRTUAL TABLE papers_fts USING fts5(
  filepath, title, abstract, topic_tags, doi,
  content='papers', content_rowid='id'
);
```

Maintain the external-content index outside Pi Sych; rebuild it after
population with
`INSERT INTO papers_fts(papers_fts) VALUES ('rebuild');`. Relative
source paths resolve against the database directory. Creator-shape and
SQL-null rules are specified in the public contract; a malformed
returned row fails the query rather than returning partial results. Pi
Sych performs shallow structural validation but does not infer creators,
validate CSL semantics, format citations, or migrate older schemas.

## Project canonical paths

`SYNC.json` version 2 records tracked artifacts, fingerprints, and
explicit dependency edges. It may relocate the project root and override
canonical paths for `project`, `agents`, `style`, `evidence`,
`decisions`, `todo`, and `inbox`.

Artifact paths remain project-local. Worker context files may use a
project-relative path or an explicitly selected readable absolute path.
Worker-reported files remain relative-only. Configured canonical paths
are trusted project configuration and may be external; path handling is
not a sandbox boundary.

## Skill customization

Pi Sych exposes seven umbrella skills: `project`, `write`, `analyze`,
`code`, `review`, `research`, and `automation`. Their task recipes use
relative links to local modules and shared methods.

To customize one durably, copy its umbrella directory, its routed shared
methods, and every routed module under other umbrellas, preserving their
relative paths, into one of:

``` text
<resolved Pi root>/skills/
.pi/skills/
.agents/skills/
```

Preserve the relative layout so recipe links continue to resolve. Named
workers search `.pi/skills/`, then `.agents/skills/`, then the resolved
Pi root's `skills/`, then packaged skills; selecting a project `.pi`
root does not add a separate global-root fallback.

Edit local `modules/*/examples.md` or shared `_methods/*/examples.md`
first. Change guidance or task-recipe order only when you intentionally
want different behavior. A project `STYLE.md` should record durable
local deltas rather than copy package prose doctrine.

## Pi-native resource controls

Pi's package controls, rather than a Pi Sych-specific toggle schema,
select what loads. Use `pi config`, package filters, `--no-extensions`,
`--tools`, or `--exclude-tools` as appropriate. These controls change
loaded resources or visible tools, not host permissions.

## Optional integrations

Plannotator is a separate human-review adapter. MCPorter is enabled only
for explicitly requested remote research. Startup inspection may report
its installation and configured servers, but does not verify
credentials, reachability, or access. If the supervisor already has an
active `web` tool from a valid loaded `pi-pew-pew` package, a
remote-research worker may reuse it. Pi Sych does not discover or enable
a disabled package.
