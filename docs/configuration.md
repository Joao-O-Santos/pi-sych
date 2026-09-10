# Configuration

Pi Sych keeps credentials, provider choices, model identifiers, and
personal examples outside the public package. That separation is a
feature: the package can describe its mechanics without pretending to
know your accounts, costs, or risk tolerance.

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
`~/.pi/pi-sych`. If none applies it fails before worker startup with
setup guidance. Pi Sych has no supported `PI_SYCH_*` configuration
overrides. Migrate the removed `PI_SYCH_MODEL_CATALOG`,
`PI_SYCH_WORKER_AGENT_DIR`, and `PI_SYCH_MCPORTER_CONFIG` settings to
the relative `modelCatalog`, `workerAgentDir`, and `mcporterConfig`
fields in `config.json`; `PI_SYCH_PI_BIN` has no replacement because
Pi's executable resolution is used. On first agent start it creates
`config.json` without overwriting an existing file. Its version-1
defaults include relative paths for the worker agent, model catalog,
MCPorter, and the fallback literature database (`literature.sqlite`):

``` json
"compaction": { "custom": true, "compactAt100k": false },
"review": { "mode": "plannotator" }
```

`custom` enables Pi Sych's custom compaction handler, which calls the
active supervisor model rather than a role from `models.json`. If it is
disabled or cannot produce a valid result, Pi leaves compaction to its
standard handler. `compactAt100k` requests compaction before an agent
turn at 100,000 context tokens. `review.mode` is `plannotator` or
`manual`; manual mode does not import the optional Plannotator runtime
or register its commands. Invalid configuration and unknown keys fail
loudly.

## Initialize the worker runtime

Run the packaged bootstrap script once for that directory's
`worker-agent` subdirectory. If the first dispatch finds an
uninitialized worker directory, `dispatch_worker` reports the exact
bootstrap command with the resolved package and configuration paths. Its
general shape is:

``` sh
node <resolved-package-location>/scripts/bootstrap-worker-agent-dir.mjs \
  --agent-dir <resolved-config-directory>/worker-agent
```

The placeholders show the command's shape, not a command to run
unchanged. The script writes a small `settings.json`, loads only the Pi
Sych worker extension, and symlinks available authentication/model files
from the supervisor directory. It does not copy credentials.

Remote research has a separate per-dispatch opt-in. The worker bootstrap
does not create or guess its integrations. MCPorter uses the configured
path described below. If PEW-PEW is already enabled and its `web` tool
is active in the supervisor, Pi Sych validates its loaded package
provenance and may expose that same extension to the remote-research
worker. It does not discover or override disabled packages.

## Local literature search

`literature_search` is available directly to the supervisor. A
dispatched worker also receives it when its selected skills include the
exact `research` selector; other workers do not. The database is selected
in this order:

1.  `<projectRoot>/LITERATURE.sqlite`, when it exists;
2.  `literatureDatabase` in the resolved `pi-sych/config.json`; or
3.  `<resolved-config-directory>/literature.sqlite`.

Supervisor lookup resolves the current project root before selecting the
database. For isolated workers, the supervisor forwards the resolved Pi
Sych configuration directory while keeping the worker's own Pi agent
directory separate. A configured relative `literatureDatabase` is
relative to that configuration directory; an absolute value is used
directly. It must be non-empty and may not contain parent traversal. An
explicitly configured missing database is an error, not a fallback to
the default.

The supported v7 database is a SQLite index with canonical metadata in
`papers` and an external-content FTS5 table named `papers_fts`:

``` sql
CREATE TABLE papers (
  id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT, filename TEXT,
  year INTEGER, item_type TEXT,
  creators_json TEXT CHECK (
    creators_json IS NULL OR (
      typeof(creators_json) = 'text'
      AND json_valid(creators_json)
      AND json_type(creators_json) = 'object'
    )
  ),
  title TEXT, abstract TEXT, topic_tags TEXT, doi TEXT
);
CREATE VIRTUAL TABLE papers_fts USING fts5(
  filepath, title, abstract, topic_tags, doi,
  content='papers', content_rowid='id'
);
```

`item_type` is a producer-supplied CSL item type, stored as text or SQL
`NULL`. SQL `NULL` means the item type is unestablished and returns
`itemType: null`. Other SQLite value types fail; Pi Sych does not
validate the CSL vocabulary or infer a type.

`creators_json` contains an object keyed by CSL name variables, with an
ordered array of name objects for each role. SQL `NULL` means creator
metadata is unestablished and returns `creators: null`. Within an
object, an omitted role is unrepresented; an empty array means the
producer checked that role and recorded no named creator. `{}` records
no roles, not a conclusion that the item has no creators.

For non-null values Pi Sych requires JSON text containing a non-null,
non-array object, role values that are arrays, and name entries that are
non-null, non-array objects. JSON text `null` is invalid, not a
substitute for SQL `NULL`. These shallow checks apply independently of
the SQL `CHECK`, which only guards the top-level value. Pi Sych does not
inspect DDL for that exact constraint or validate CSL semantics:
producers own valid roles, names, and field values. Role keys, creator
array order, and name-object members pass through without filtering or
normalization.

Search joins `papers_fts` to `papers`, searches the indexed filepath,
title, abstract, tags, and DOI fields, ranks with `bm25`, and snippets
the abstract column. Each result contains `metadata`, `snippet`,
`score`, and `sourcePath`. The database's `filepath` resolves to
`sourcePath`, relative to the database unless already absolute. For
example, the metadata portion is:

``` json
{
  "metadata": {
    "title": "Example article",
    "itemType": "article-journal",
    "creators": {
      "author": [
        {"family": "Smith", "given": "Alex"},
        {"literal": "Open Science Collaboration"}
      ],
      "editor": [{"family": "Jones", "given": "Morgan"}]
    },
    "year": 2024,
    "doi": null
  }
}
```

There is no `metadata.authors` alias. Pi Sych does not format citations
or decide which creator roles a citation style displays. Missing
required columns, malformed JSON, and invalid structural values fail
through the wrapped search-error boundary with the database path. One
invalid matched row fails the whole search; unmatched rows are not
validated. Extra legacy columns may remain but are never consulted. Pi
Sych opens the database read-only and does not create, migrate, infer,
or adapt schemas.

This is a breaking v7 change. Users of local literature search must
rebuild or migrate v6 databases externally and update result consumers
before upgrading. There is no automatic conversion from `first_author`:
existing values may be lossy citation stems rather than structured
names. Users who do not use local literature search have no
literature-data migration.

## Project canonical paths

`SYNC.json` version 2 records tracked artifacts, fingerprints, and
explicit dependency edges. It may relocate the project root and override
canonical paths:

``` json
{
  "version": 2,
  "projectRoot": ".",
  "canonical": {
    "project": "PROJECT.md",
    "agents": "AGENTS.md",
    "style": "STYLE.md",
    "evidence": "EVIDENCE.md",
    "decisions": "DECISIONS.md",
    "todo": "TODO.md",
    "inbox": "INBOX.md"
  },
  "confirmedAt": "2024-01-01T00:00:00.000Z",
  "artifacts": [
    {
      "path": "PROJECT.md",
      "fingerprint": "sha256:...",
      "status": "current",
      "dependsOn": ["STYLE.md"]
    }
  ]
}
```

`projectRoot` is relative to the manifest directory. Artifact paths must
be relative and remain lexically inside the project root. Worker context
files may instead use either a project-relative path or any readable
absolute path. Dispatch normalizes an absolute path inside the project
root to a relative path; an external absolute path remains absolute.
External inputs are explicit supervisor-selected task context, not
project artifacts or a security boundary. Worker-reported files remain
relative-only. Symlinks are ordinary project files and are not treated
as a security boundary. This protects path interpretation without
claiming to sandbox processes.

Configured canonical paths are different: they are explicit project
configuration and may be absolute, outside the project root, or reached
through a symlink. Pi Sych checks that they exist and are readable, then
uses the configured target. Use this deliberately; a canonical
instruction file outside the project is trusted because you declared it.

The resolver walks upward from the working directory to the workspace
root and uses the nearest `SYNC.json`. Without one, it falls back to the
workspace root and default canonical names. `INBOX.md` is review state,
not canonical instruction state.

## Skill customization

Pi Sych exposes six umbrella skills. Their task recipes use relative
links to local modules and shared methods. To customize one durably,
copy its umbrella directory and the `_methods` directory into one of:

``` text
~/.pi/agent/skills/
.pi/skills/
.agents/skills/
```

Preserve the relative layout so recipe links continue to resolve. Copy
only the method directories reached by the selected umbrella if a
smaller override is useful. For named worker selection, `.pi/skills/`
wins over `.agents/skills/`, which wins over user and packaged skills.

Edit local `modules/*/examples.md` or shared `_methods/*/examples.md`
first. Change guidance or task-recipe order only when you intentionally
want different behavior. A project `STYLE.md` should record durable
local deltas---audience, voice, dialect, terminology, citation form,
venue, and artifact conventions---rather than copy package prose
doctrine.

## Pi-native resource controls

Pi's package controls, rather than a Pi Sych-specific toggle schema,
select what loads. Open `pi config` to enable or disable package
resources, or use a package filter in settings. For example, keep only
the core extension:

``` json
{
  "source": "npm:pi-sych",
  "extensions": ["extensions/workbench/index.ts"]
}
```

Use `"extensions": []` to load no Pi Sych extensions while retaining its
skills. For a one-off session, `--no-extensions` disables extensions;
`--tools` allow-lists tools and `--exclude-tools` removes named tools.
These controls change Pi's loaded resources or visible tools, not
process permissions. See the [public contract](public-contract.md) for
the supported paths and behavior.

## Optional integrations

Plannotator is a separate extension loaded lazily through its documented
browser helpers. File annotation accepts only project-local `.md` and
`.mdx` files and writes `<input>.feedback.md`; code-review feedback is
written at the resolved project root as `PLANNOTATOR_REVIEW.md`.
Plannotator remains a human review adapter; Pi Sych does not enable its
plan mode.

Set `remoteResearch: true` when the worker's assignment requires remote
retrieval. This adds MCPorter using the configured `mcporterConfig` path
(default: `mcp/mcporter.json` relative to the resolved configuration
directory); ordinary workers do not receive that integration. If the
supervisor's active `web` tool comes from a loaded, valid `pi-pew-pew`
package, the remote-research worker also receives that extension and
`web`. An absent, disabled, or excluded PEW-PEW tool remains absent.
The supervisor may use an already active read-only `web` tool directly;
Pi Sych does not register or activate one. `/pi-sych-mcp` reports whether
MCPorter and its configuration are available without printing
credentials.

`dispatch_worker.contextMode` is independent of this integration. It
defaults to `clean`, which starts without a conversation session. Set it
to `trajectory` only when the prior supervisor conversation materially
helps the assignment. Trajectory mode requires a persisted exact
tool-call boundary, creates a private native branch immediately before
the assistant entry containing that dispatch, and fails clearly rather
than falling back to clean. Temporary session material is removed after
every outcome and the live supervisor session is not moved or rewritten.
