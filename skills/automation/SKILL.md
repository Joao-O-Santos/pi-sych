---
name: automation
description: Compose practical automations from actual capabilities, deterministic processing, browser interaction, and user stack preferences.
---

# Automation

Start from the user's outcome, inputs, outputs, side effects, and authorization
boundary. Explicit user/project instructions and an applicable `STACK.md`
override package preferences. Inspect what tools and extensions are actually
available; a preferred stack entry does not make a capability exist. Tool
schemas explain invocation. This skill chooses the smallest useful composition.

Once the outcome and side-effect boundary are clear, complete the authorized
internal workflow rather than asking whether to continue after each step. A new
send, publish, delete, purchase, remote-state change, privacy exposure, or other
consequential effect outside that boundary requires fresh judgment. Prefer
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
