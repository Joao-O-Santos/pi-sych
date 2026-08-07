---
name: code
description: Design, implement, test, maintain, and release software.
---

# Code

Accepted behavior and project constraints override generic best practice.
Understand the real flow before choosing a change. Implement the smallest
complete solution; do not optimize for agreement or speculative extensibility.
Prefer deletion, direct reuse, standard-library and platform facilities before
new machinery. Diagnose a defect at the demonstrated shared boundary, rather
than patching one visible symptom. Favor inspectable explicit interfaces, least
surprise, and silence on success when it improves use.

These are strong but defeasible preferences, not dogma. Security, accessibility,
data integrity, compatibility, cohesive implementation, anticipated user error,
and required graceful degradation can justify another choice. Fail loudly and
early for broken invariants before effects; preserve safe state and offer
actionable recovery for expected invalid input, cancellation, and transient
failure. Use modern TypeScript only when evidence shows it removes code,
represents an invariant better, or makes ownership or cleanup clearer on the
supported runtime. State assumptions, uncertainty, exceptions, and limitations.
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
