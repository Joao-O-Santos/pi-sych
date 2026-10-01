# Capability model

Pi declares active tools and their guidance; Pi Sych does not inject a duplicate
active-capability inventory. The supervisor sees `project_status`,
`dispatch_worker`, and `literature_search` when the workbench is active. Other
packages own their own tools, including document and known-URL retrieval.
Choose tools by the capability actually exposed, not by package identity.

Workers are separate Pi processes with explicit tools. `read-only`, `edit`, and
`full-host` describe visible Pi tools, not operating-system isolation.
`clean` workers receive explicit files and assignment only; `trajectory`
workers additionally receive the persisted supervisor branch at the dispatch
boundary. Neither inherits companion extensions from the supervisor.

`remoteResearch: true` loads Pi's native MCP and codemode extensions in the
worker; its `PI_CODING_AGENT_DIR` selects that worker's own `mcp.json`.
Pi's `--tools` CLI allowlist suppresses dynamically discovered MCP tools
from codemode, so Pi Sych applies the task's selected Pi tool set at worker
session start instead; per-server and per-tool MCP exposure still follows
native Pi configuration. Configuration does not prove access or source validity. MCP server status is
Pi's concern (`/mcp`, `pi mcp list`), while local literature discovery is a
read-only Pi Sych tool. Search hits and snippets are discovery, not verification
of an underlying source. Tool availability is never authorization for a new
consequential action.
