---
name: verify-change
description: Select and run truthful project-native verification after a change.
---

# Verify a change

Use existing project tooling before adding wrappers. Inspect package scripts, formatter, linter, type checker, tests, build, smoke checks, and task-specific commands.

1. Choose checks that can falsify the changed behavior.
2. Run them with Pi's built-in Bash using exact commands and arguments.
3. Report actual exit status, relevant output, and limitations; do not treat an unrun or failed command as passing.
4. Inspect changed files and relevant outputs after checks.
5. Record durable verification support in `EVIDENCE.md`, a decision, or the `project_status` acknowledgement reason only when useful.

Mechanical checks do not settle semantic quality, source validity, or human approval.

## Optional user examples

If `~/.config/pi/skills/verify-change/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
