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
start Pi Sych for direct project work. Set `PI_SYCH_MODEL_CATALOG` to
use a different file. `PI_SYCH_WORKER_AGENT_DIR` selects the isolated
worker runtime directory.

## Initialize the worker runtime

Run the packaged bootstrap script once for the directory selected by
`PI_SYCH_WORKER_AGENT_DIR` (or the default directory):

``` sh
node /path/to/pi-sych/scripts/bootstrap-worker-agent-dir.mjs
```

The script writes a small `settings.json`, loads only the Pi Sych worker
extension, and symlinks available authentication/model files from the
supervisor directory. It does not copy credentials. If the directory is
missing, `dispatch_worker` reports the exact bootstrap command it needs.

Remote research has a separate opt-in configuration. The worker
bootstrap does not create or guess that configuration.

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

## Optional integrations

Plannotator is loaded lazily through its documented browser helpers.
File annotation writes `<input>.feedback.md`; code-review feedback is
written at the resolved project root as `PLANNOTATOR_REVIEW.md`.
Plannotator remains a human review adapter; Pi Sych does not enable its
plan mode.

Set `remoteResearch: true` only for an assigned worker call. That worker
receives MCPorter and the explicit configuration below; ordinary workers
do not. `PI_SYCH_MCPORTER_CONFIG` defaults to
`~/.config/pi-sych/mcp/mcporter.json`. `/pi-sych-mcp` reports whether
the extension and configuration are available without printing
credentials.
