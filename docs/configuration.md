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
`worker-agent` subdirectory:

``` sh
node /path/to/pi-sych/scripts/bootstrap-worker-agent-dir.mjs --agent-dir /path/to/pi-sych-config/worker-agent
```

The script writes a small `settings.json`, loads only the Pi Sych worker
extension, and symlinks available authentication/model files from the
supervisor directory. It does not copy credentials. If the directory is
missing, `dispatch_worker` reports the exact bootstrap command it needs.

Remote research has a separate opt-in configuration. The worker
bootstrap does not create or guess that configuration.

## Local literature search

`literature_search` is available only to a dispatched worker whose
selected skills include the exact `research` selector. It is a local
lookup tool, not a supervisor service. The database is selected in this
order:

1.  `<projectRoot>/LITERATURE.sqlite`, when it exists;
2.  `literatureDatabase` in the resolved `pi-sych/config.json`; or
3.  `<resolved-config-directory>/literature.sqlite`.

The supervisor forwards the resolved Pi Sych configuration directory to
the isolated worker process while keeping the worker's own Pi agent
directory separate. A configured relative `literatureDatabase` is
relative to that configuration directory; an absolute value is used
directly. It must be non-empty and may not contain parent traversal. An
explicitly configured missing database is an error, not a fallback to
the default.

The supported database is a SQLite index with canonical metadata in
`papers` and an external-content FTS5 table named `papers_fts`:

``` sql
CREATE TABLE papers (
  id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT, filename TEXT,
  year INTEGER, first_author TEXT, title TEXT, abstract TEXT,
  topic_tags TEXT, doi TEXT
);
CREATE VIRTUAL TABLE papers_fts USING fts5(
  filepath, title, abstract, topic_tags, doi,
  content='papers', content_rowid='id'
);
```

Search joins `papers_fts` to `papers`, searches the indexed filepath,
title, abstract, tags, and DOI fields, ranks with `bm25`, and snippets
the abstract column. Results map `filepath`, `title`, `first_author`,
`year`, and `doi` to the returned source path and metadata. Paths may be
absolute or relative to the database. Pi Sych opens the database
read-only and does not create, migrate, infer, or adapt schemas.

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
be relative and remain lexically inside the project root. Symlinks are
ordinary project files and are not treated as a security boundary. This
protects path interpretation without claiming to sandbox processes.

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
browser helpers. File annotation writes `<input>.feedback.md`;
code-review feedback is written at the resolved project root as
`PLANNOTATOR_REVIEW.md`. Plannotator remains a human review adapter; Pi
Sych does not enable its plan mode.

Set `remoteResearch: true` only for an assigned worker call. That worker
receives MCPorter and the configuration directory's `mcp/mcporter.json`;
ordinary workers do not. `/pi-sych-mcp` reports whether the extension
and configuration are available without printing credentials.
