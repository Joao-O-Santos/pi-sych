---
name: automation
description: Compose practical automations from actual capabilities, deterministic processing, browser interaction, and user stack preferences.
---

# Automation

Start from the user's outcome, inputs, outputs, side effects, and authorization
boundary. Inspect what tools and extensions are actually
available; a preference does not make a capability exist. When
computer-use or local-software knowledge matters, look for an optional
user-maintained STACK.md describing the user's machine; its absence
changes nothing. Tool schemas explain invocation. This skill chooses
the smallest useful composition.

A new send, publish, delete, purchase, remote-state change, privacy
exposure, or other consequential effect outside that boundary requires
owner authorization. Prefer
deterministic local processing for deterministic work; use model judgment only
where semantic interpretation helps, and keep bulk or sensitive data out of the
model path when local tools can transform it. Reuse existing helpers and platform
facilities before adding scripts, wrappers, dependencies, or browser steps.

## Task recipes

| Task | Read in order |
| --- | --- |
| capability and stack selection | [capabilities](modules/capabilities/guidance.md) |
| small or recurring workflow | [capabilities](modules/capabilities/guidance.md) → [workflow](modules/workflow/guidance.md) |
| deterministic file or data transform | [capabilities](modules/capabilities/guidance.md) → [data](modules/data/guidance.md) |
| browser or UI automation | [capabilities](modules/capabilities/guidance.md) → [browser](modules/browser/guidance.md) |
