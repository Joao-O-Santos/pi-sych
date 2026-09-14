---
name: code
description: Design, implement, test, automate, integrate, maintain, and release software, including CLI and developer tooling.
---

# Code

Accepted behavior and project constraints override generic best practice.
Understand the real flow before choosing a change. Implement the smallest
complete solution; prefer deletion, direct reuse, standard-library, platform,
and established project mechanisms before new machinery. Diagnose defects at
the demonstrated shared boundary rather than patching one visible symptom.

A new public API, dependency, migration, release, security boundary,
irreversible effect, or other consequential choice not implied by the
task scope still requires owner judgment.

These are strong but defeasible preferences. Security, accessibility, data
integrity, compatibility, cohesive implementation, anticipated user error, and
graceful degradation can justify another choice. State assumptions and limits.
Run and report only checks actually performed; passing checks do not equal
approval or semantic correctness. Read the selected recipe in order.

## Task recipes

| Task | Read in order |
| --- | --- |
| design or simplify components | [architecture](modules/architecture/guidance.md) |
| behavior-changing implementation | [testing](modules/testing/guidance.md) |
| history or collaboration | [Git](modules/git/guidance.md) |
| package or release work | [npm](modules/npm/guidance.md) |
| web application implementation | [web](modules/web/guidance.md) |
