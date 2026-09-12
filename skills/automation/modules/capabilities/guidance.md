# Capabilities

Separate two questions before designing an automation.

**Available capability:** Inspect active tools, extensions, package/runtime
information, and the current environment. This is the authority for what can be
used now. Do not claim a browser, remote service, formatter, converter, worker,
or local utility is available without evidence.

**Preferred stack:** When an applicable `STACK.md` or equivalent user/project
instruction is available, use it to choose among available capabilities. It may
record preferred retrieval tools, browser automation, shell utilities, document
workflows, analysis tools, hosting CLIs, deterministic-processing preferences,
and approval/privacy boundaries. It describes preference, not availability.

Availability wins when the two disagree. If no stack file exists, proceed from
actual capabilities when the choice is low consequence; ask only when a missing
preference materially changes cost, privacy, side effects, or the resulting
workflow. Do not duplicate tool schemas into a capability inventory.
