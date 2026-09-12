---
name: automation
description: Design and compose practical automations from available tools, deterministic processing, browser interaction, and user stack preferences.
---

# Automation

Start from the user's outcome, inputs, outputs, side effects, and approval
boundary. Explicit user/project instructions and an applicable `STACK.md`
override package preferences. Inspect what tools and extensions are actually
available before choosing an implementation; never infer availability from a
preferred stack entry. Tool schemas explain invocation. This skill chooses the
smallest useful composition.

Prefer deterministic local processing for deterministic work. Use model
judgment only where semantic interpretation is useful, and avoid exposing bulk
or sensitive data to the model when local tools can transform it without model
inspection. Reuse existing helpers and platform facilities before adding
scripts, wrappers, dependencies, or browser steps.

## Task recipes

| Task | Read in order |
| --- | --- |
| capability and stack selection | [capabilities](modules/capabilities/guidance.md) |
| small or recurring workflow | [capabilities](modules/capabilities/guidance.md) → [workflow](modules/workflow/guidance.md) |
| deterministic file or data transform | [capabilities](modules/capabilities/guidance.md) → [data](modules/data/guidance.md) |
| browser or UI automation | [capabilities](modules/capabilities/guidance.md) → [browser](modules/browser/guidance.md) |
