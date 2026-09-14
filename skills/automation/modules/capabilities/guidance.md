# Capabilities

Separate two questions before designing an automation.

**Available capability:** Inspect active tools, extensions, package/runtime
information, and the current environment. This is the authority for what can be
used now. Do not claim a browser, remote service, formatter, converter, worker,
or local utility is available without evidence.

**Machine context:** When computer-use or local-software knowledge
matters, inspect the optional user-maintained `~/.pi/agent/STACK.md`
when it exists. It records durable facts about the user's computer,
not project software requirements, capability truth, or governing
approval, privacy, and security rules. Its absence changes nothing.

Use project `AGENTS.md` and `PROJECT.md` for project-specific
requirements and workflow conventions.

Availability constrains the options; current user instructions and
accepted project constraints still govern. If a preferred capability
is unavailable, use another permitted capability or report the gap.
If no applicable preference is recorded, proceed from
actual capabilities when the choice is low consequence; ask only when a missing
preference materially changes cost, privacy, side effects, or the resulting
workflow. Do not duplicate tool schemas into a capability inventory.
