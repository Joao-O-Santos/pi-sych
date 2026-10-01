# Configuration

Pi Sych keeps credentials, provider choices, model identifiers, and
personal examples outside the public package. Native Pi configuration
owns provider authentication and MCP transport; Pi Sych configuration
owns only its custom compaction policy and local literature path.

## Layered Pi Sych settings

Pi Sych reads the global configuration from
`<Pi configuration root>/pi-sych/config.json` and independently reads an
optional project override from `<projectRoot>/.pi/pi-sych/config.json`.
Global settings are applied first and project values override only keys
they provide; `compaction` fields merge independently. Unknown keys are
rejected.

The version 2 shape is:

``` json
{
  "version": 2,
  "compaction": {
    "custom": true,
    "thresholdTokens": 150000
  },
  "literatureDatabase": "library.sqlite"
}
```

`compaction.custom` controls whether the Pi Sych workbench supplies its
task-centred summary. When enabled, the proactive threshold defaults to
150,000 context tokens and triggers only at a safe settled/idle
boundary. Pi may compact earlier when its own context-window safety
rules require it; when the Pi Sych resource is loaded, it supplies the
custom summary for those requests as well. `thresholdTokens` is not an
alias for Pi's `reserveTokens`. Set custom to `false` to leave
compaction to Pi's native behavior.

`literatureDatabase` may be an absolute path or relative path. A
relative global value is resolved from the global Pi Sych config
directory; a relative project value is resolved from the project root
and overrides the global library only for that project. If neither
configuration supplies a value, Pi Sych uses
`<global Pi Sych config directory>/literature.sqlite`. An existing
project-local `LITERATURE.sqlite` takes precedence. The database is
always opened read-only.

See [v7 to v8 migration](migration-v7-to-v8.md) for obsolete v7 keys and
native Pi replacements.

## Worker model catalogue and setup

Workers use the conventional private catalogue
`<global Pi Sych config directory>/worker-models.json`. Its role names,
model identifiers, optional cost, and notes are user-maintained. For
example:

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
catalogue's `default` role. Cost and notes are context for the
supervisor; the runtime does not rank models or invent fallbacks. The
model catalogue is needed to dispatch a worker, not merely to start Pi
Sych for direct project work.

Initialize the conventional
`<global Pi Sych config directory>/worker-agent` directory once with the
packaged bootstrap script. If a dispatch finds it uninitialized,
`dispatch_worker` reports the bootstrap command. Ordinary workers have
only their explicit tools. Remote retrieval is an explicit per-dispatch
request and uses native Pi MCP/codemode configuration in that worker
agent directory; Pi Sych does not copy or merge the supervisor's
configuration.

## Worker context choice

`dispatch_worker.contextMode` defaults to `clean`. Use `clean` when the
explicit assignment, files, and selected skills provide enough context.
Use `trajectory` when prior supervisor conversation materially improves
the bounded assignment.

Context need does not determine who must execute the task. The
supervisor can explore or plan first, write relevant state into a plan,
TODO, brief, or context file, and then delegate a clean task.
Conversely, a simple direct request may be faster and clearer to
complete in the supervisor without delegation.

Trajectory mode requires a persisted exact tool-call boundary, creates a
private native branch immediately before the assistant entry containing
that dispatch, and fails clearly rather than falling back to clean.
Context mode does not alter worker tools, permissions, model, skills,
files, or research access.

## Local literature search

`literature_search` is available directly to the supervisor. A
dispatched worker also receives it when its selected skills include the
exact `research` selector. Capability inspection checks whether the
resolved database is absent, compatible with required v7 columns, or
degraded; it does not verify access to underlying sources. Incompatible
schemas report missing columns and the rebuild/migration requirement.
See the [v7 literature database migration
guide](literature-database-v7.md).

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
SQL-null rules are specified in the public contract; malformed returned
rows fail the query rather than returning partial results. Pi Sych
performs shallow structural validation but does not infer creators,
validate CSL semantics, format citations, or migrate older schemas.

Search syntax is native FTS5. Useful query forms include quoted phrases,
`AND`/`OR`, and column filters such as `title:`, `doi:`, and
`topic_tags:`. Search results are discovery metadata and source-path
handoffs, not source verification or evidence of collection
completeness. Inspect the underlying source when exact wording, method,
result, quotation, correction status, or precise metadata matters. A
local source path can be inspected with an available PDF/document tool
without loading an entire document into model context.

## Project canonical paths

`SYNC.json` version 2 records tracked artifacts, fingerprints, and
explicit dependency edges. It may relocate the project root and override
canonical paths for `project`, `agents`, `style`, `evidence`,
`decisions`, `todo`, and `inbox`.

Artifact paths remain project-local. Worker context files may use a
project-relative path or an explicitly selected readable absolute path.
Worker-reported files and observed project changes are reported as
project-relative paths. Configured canonical paths are trusted project
configuration and may be external; path handling is not a sandbox
boundary.

## Skill customization

Pi Sych exposes seven umbrella skills: `project`, `write`, `analyze`,
`code`, `review`, `research`, and `automation`. Their task recipes use
relative links to local modules and shared methods.

To customize one durably, copy its umbrella directory, its routed shared
methods, and every routed module under other umbrellas, preserving their
relative paths, into one of:

``` text
<Pi configuration root>/skills/
.pi/skills/
.agents/skills/
```

Preserve the relative layout so recipe links continue to resolve. Named
workers search `.pi/skills/`, then `.agents/skills/`, then the global Pi
root's `skills/`, then packaged skills. Edit local
`modules/*/examples.md` or shared `_methods/*/examples.md` first. Change
guidance or task-recipe order only when you intentionally want different
behavior. A project `STYLE.md` should record durable local deltas rather
than copy package prose doctrine. Writing workers load
`skills/write/DEFAULT_STYLE.md` as a package baseline and `STYLE.md`,
when present, as a project override; explicit user, venue, renderer,
accessibility, and evidence requirements remain higher precedence. These
style resources are loaded only for workers selected with the `write`
skill.

## Native Pi resource and MCP controls

Use native Pi configuration and `pi config` to select independently
loadable extensions and other Pi resources. Plannotator remains a
separately selectable human-review adapter. Native Pi owns MCP transport
and authentication: configure MCP in the worker agent directory, setting
`PI_CODING_AGENT_DIR=<global Pi Sych config directory>/worker-agent`
when running `pi mcp add`, `pi mcp list`, `pi mcp login`, or
`pi mcp logout`. Use `/mcp` in a worker session to inspect its servers.
Pi Sych does not maintain an MCP client or status/configuration wrapper.
Remote research is explicit per worker dispatch; ordinary workers do not
receive MCP or codemode. See the [migration
guide](migration-v7-to-v8.md).

An optional user-maintained `STACK.md` at `~/.pi/agent/STACK.md` may
record durable computer/environment facts for computer-use work. It is
machine context, not project software-stack state or capability
availability; runtime state still determines what can be used now.
