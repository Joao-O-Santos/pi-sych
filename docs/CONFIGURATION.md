# Configuration

Pi Sych keeps credentials, providers, model choices, and personal skill
customization outside the public package.

## Worker models

Create `~/.config/pi/pi-sych/models.json` with user-defined roles:

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

`dispatch_worker` uses an exact requested `modelRole`, or `default`, and
defaults to 90 seconds. Cost and notes are free-form context for the
supervisor; the runtime does not rank or interpret them.
`PI_SYCH_MODEL_CATALOG` selects another catalog and
`PI_SYCH_WORKER_AGENT_DIR` selects the worker runtime directory.

## Project canonical paths

`SYNC.json` (version 2) defines tracked artifacts and their
dependencies. It may relocate the project root and override the default
canonical paths for each role:

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

`projectRoot` is relative to the manifest directory. Each `canonical`
path is relative to the project root, or absolute to point outside it.
The defaults are the names above. Override canonical paths when a
project uses a non-standard layout (for example, a monorepo that keeps
state in a `state/` subdirectory) or when several workspaces share one
`INBOX.md`. Promotion proposals route to the configured target for each
role. The `inbox` path is where compaction appends promotion proposals.

Each artifact in `artifacts` declares its `path`, `fingerprint`,
`status` (one of `current`, `needs-review`), and optional `dependsOn`
edges. The resolver walks from the working directory to the workspace
root for the nearest `SYNC.json`; if none is found it falls back to the
workspace root with default canonical paths.

## Skill customization

Pi Sych exposes six umbrella skills. To customize examples durably, copy
one umbrella directory into either:

``` text
~/.pi/agent/skills/
.pi/skills/
.agents/skills/
```

For named worker selection, `.pi/skills/` wins over `.agents/skills/`,
which wins over user and packaged skills. Edit its
`modules/*/examples.md` files. Leave `guidance.md` intact unless you
intentionally want to change behavioral guidance. User or project skills
can add language- and framework-specific specialization without
modifying Pi Sych.

## Optional integrations

Plannotator is a runtime dependency but Pi Sych loads only its
documented lazy browser helpers. File annotation writes
`<input>.feedback.md` and code review writes `PLANNOTATOR_REVIEW.md`. Do
not separately enable Plannotator's extension or plan mode for Pi Sych.

Set `remoteResearch: true` only for an assigned worker call. It receives
MCPorter and explicit private configuration; ordinary workers do not.
`PI_SYCH_MCPORTER_CONFIG` otherwise defaults to
`~/.config/pi-sych/mcp/mcporter.json`. `/pi-sych-mcp` reports diagnostic
status without printing credentials.
