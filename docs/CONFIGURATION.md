# Configuration

## Public package

The public package contains neutral defaults. `package.json` loads the supervisor extension; workers and MCPorter load only for explicitly dispatched work. Provider choices, model ranking, credentials, and personal examples stay outside the repository.

Pi Sych declares `@plannotator/pi-extension` as a runtime dependency but never loads its extension entrypoint. The workbench imports documented lazy browser helpers for `submit_plan`, `/plannotator-annotate`, and `/plannotator-last`. Do not separately install or configure Plannotator as a Pi extension for this package.

## Models and worker runtime

Create `~/.config/pi/pi-sych/models.json` with model metadata and user-ranked profiles:

```json
{
  "models": {
    "strong-reviewer": {
      "ref": "provider/model",
      "strength": "deep",
      "suitableFor": ["methods review", "architecture review"]
    }
  },
  "profiles": {
    "default": ["strong-reviewer"],
    "review": ["strong-reviewer"]
  }
}
```

`dispatch_worker` selects the first model in the requested profile. `PI_SYCH_MODEL_CATALOG` selects another catalog; `PI_SYCH_MODEL_PROFILES` is a direct JSON override for automation. Workers default to 90 seconds; set a deliberate bounded `timeoutMs` override for longer work.

`PI_SYCH_WORKER_AGENT_DIR` chooses the worker runtime directory. `PI_SYCH_PI_BIN` selects the Pi executable for development tests. The bootstrap helper writes worker-only settings and an MCPorter exposure policy, and symlinks available auth/model files rather than copying them:

```sh
node scripts/bootstrap-worker-agent-dir.mjs \
  --agent-dir ~/.cache/pi/pi-sych/worker-agent \
  --package-root /path/to/pi-sych \
  --supervisor-agent-dir ~/.config/pi
```

## Private skill examples

A user-owned example overlay for a package skill belongs at:

```text
~/.config/pi/skills/<skill-name>/examples.md
```

The matching package skill reads it when present. Examples express preference; they are not evidence or project requirements.

## Remote research

Set `remoteResearch: true` only for an assigned `dispatch_worker` call. It receives the `pi-mcporter` proxy and the explicit `MCPORTER_CONFIG`; ordinary workers receive neither. The generated worker policy exposes Context7, OpenAlex, and Scholar Gateway. `PI_SYCH_MCPORTER_CONFIG` selects the private transport configuration and otherwise defaults to `~/.config/pi-sych/mcp/mcporter.json`.

Configure only intended MCP servers and use `"imports": []` when the installed MCPorter supports it. `/pi-sych-mcp` reports bridge/runtime versions and configuration presence without printing credentials. `node scripts/pi-sych-mcp-auth.mjs [--no-browser]` starts Scholar Gateway OAuth. MCPorter owns credential storage; never put credentials in this package, worker artifacts, or logs.
