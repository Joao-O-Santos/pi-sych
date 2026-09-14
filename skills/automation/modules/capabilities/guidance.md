# Capabilities

Separate two questions before designing an automation.

**Available capability:** Inspect active tools, extensions, package/runtime
information, and the current environment. This is the authority for what can be
used now. Do not claim a browser, remote service, formatter, converter, worker,
or local utility is available without evidence.

**Preferred stack:** When applicable user/project instructions are
available, use them to choose among available capabilities. An
optional user-maintained STACK.md may record durable environment
knowledge: preferred retrieval tools, browser automation, shell
utilities, document workflows, analysis tools, hosting CLIs,
deterministic-processing preferences, and approval/privacy boundaries.
It describes preference, not availability.

Availability constrains the options; current user instructions and
accepted project constraints still govern. If a preferred capability
is unavailable, use another permitted capability or report the gap.
If no applicable preference is recorded, proceed from
actual capabilities when the choice is low consequence; ask only when a missing
preference materially changes cost, privacy, side effects, or the resulting
workflow. Do not duplicate tool schemas into a capability inventory.
