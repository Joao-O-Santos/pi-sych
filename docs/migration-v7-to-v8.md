# Migrating Pi Sych configuration from v7 to v8

This is a manual configuration change, not a runtime migration. Keep the
configuration file, remove settings Pi or separately loaded resources now own,
and retain only Pi Sych behavior and paths.

## Configuration files and precedence

Pi Sych reads global settings from `<Pi configuration root>/pi-sych/config.json`
and an optional project override from `<projectRoot>/.pi/pi-sych/config.json`.
The project file overrides only fields it supplies; compaction fields merge
individually. A project can therefore select another literature database
without losing the global compaction policy. Unknown keys are errors.

The v8 configuration shape is:

```json
{
  "version": 2,
  "compaction": {
    "custom": true,
    "thresholdTokens": 150000
  },
  "completionReassessment": false,
  "literatureDatabase": "library.sqlite"
}
```

`compaction.custom` controls whether Pi Sych supplies its task-centred custom
summary for compaction requests. Set it to `false` to leave compaction to Pi.
When enabled, Pi Sych's proactive trigger defaults to 150,000 context tokens
and runs only at a safe settled/idle boundary. Pi may still compact earlier
under its own context-window safety rules. The threshold is not Pi's
`reserveTokens` setting.

`completionReassessment` defaults to `false`. When enabled, after a
completed run Pi Sych may add one hidden reassessment at Pi's final actionable
`agent_before_settle` boundary, provided there are no pending messages and Pi
can continue. The model is asked to continue only with unfinished work already
authorized by the current request, and otherwise to stop or report a genuine
blocker. A guard prevents repeating the reassessment for the same user message.
It does not create new authorization and is independent of the compaction
threshold. This is a prompt-level aid, not a deterministic guarantee that the
model will recognize every incomplete task.

`literatureDatabase` may be an absolute or relative path. A relative global
value is resolved from the global Pi Sych config directory; a relative project
value is resolved from the project root and replaces the global library only
for that project. If neither file sets it, Pi Sych uses its conventional
local literature database default.

## Remove obsolete v7 keys

Delete these v7 keys rather than translating them:

- `workerAgentDir` — initialize the conventional `<Pi Sych config
directory>/worker-agent` directory.
- `modelCatalog` — the conventional catalogue is
  `<Pi Sych config directory>/worker-models.json` (renamed to distinguish it
  from Pi's own `models.json`).
- `mcporterConfig` — Pi reads native MCP configuration from the worker agent
  directory; configure it there instead.
- `compaction.compactAt100k` — the Pi Sych proactive threshold is now
  `compaction.thresholdTokens`, defaulting to 150000.
- `review.mode` — use Pi's resource selection to load or disable the separate
  Plannotator extension.

Do not put provider credentials or tokens in Pi Sych config. Use native Pi
configuration and authentication for providers and MCP servers.

## Native MCP and optional resources

Remote-research worker setup is in the worker agent directory's `mcp.json`.
Set `PI_CODING_AGENT_DIR=<global Pi Sych config directory>/worker-agent`
when running native `pi mcp add`, `pi mcp list`, `pi mcp login`, and
`pi mcp logout`, so the commands target the worker's agent directory.
Inspect server status in a worker session with `/mcp`. Pi Sych does not copy or merge the supervisor's MCP file
into a worker. Only dispatches explicitly marked for remote research load MCP
and codemode; ordinary workers do not.

Use `pi config` and Pi's package/resource controls to select independently
loadable resources such as Plannotator. Custom compaction remains in the
workbench extension; its `compaction.custom` setting controls whether Pi Sych
supplies its task-centred summary or proactive trigger. Use `/mcp` or
`pi mcp list` in place of the removed `/pi-sych-mcp` command.
