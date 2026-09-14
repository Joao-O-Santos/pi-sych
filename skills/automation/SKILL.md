---
name: automation
description: Compose practical automations from actual capabilities, deterministic processing, browser interaction, and user machine context.
---

# Automation

Start from the user's outcome, inputs, outputs, side effects, and authorization
boundary. Inspect what tools and extensions are actually
available; a preference does not make a capability exist. When
computer-use or local-software knowledge matters, look for the optional
user-maintained `~/.pi/agent/STACK.md` describing the user's machine;
its absence changes nothing. It contains machine context, not project
software requirements. Tool schemas explain invocation. This skill
chooses the smallest useful composition.

A new send, publish, delete, purchase, remote-state change, privacy
exposure, or other consequential effect outside that boundary requires
owner authorization. Prefer
deterministic local processing for deterministic work; use model judgment only
where semantic interpretation helps, and keep bulk or sensitive data out of the
model path when local tools can transform it. Reuse existing helpers and platform
facilities before adding scripts, wrappers, dependencies, or browser steps.

## Task routes

Use the primary module for the task. Add the capabilities module when
available tools, machine context, or stack preferences affect the
choice; add workflow or data guidance when the task combines those
concerns.

| Task | Route |
| --- | --- |
| capability and stack selection | [capabilities](modules/capabilities/guidance.md) |
| small or recurring workflow | [workflow](modules/workflow/guidance.md) |
| deterministic file or data transform | [data](modules/data/guidance.md) |
| browser or UI automation | [browser](modules/browser/guidance.md) |
| external-effect workflow | [workflow](modules/workflow/guidance.md) → [capabilities](modules/capabilities/guidance.md) |
