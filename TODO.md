# Tasks

This optional ledger tracks the minimal-architecture refactor. It is not authority for project direction, evidence, or accepted architecture.

## Active

- [ ] R-003 — Replace the supervisor surface with `dispatch_worker`, `project_status`, and optional `submit_plan`.
- [ ] R-005 — Simplify bounded dispatch with a 90-second default and explicit override.
- [ ] R-006 — Inject optional project `AGENTS.md` and applicable `STYLE.md` into worker packets; use the approved mode-specific Pi harness tool lists.
- [ ] R-007 — Move bootstrap, status review, drift, reconciliation, verification, and retrospective procedures into skills.
- [ ] R-008 — Reduce Plannotator to `submit_plan`, `/plannotator-annotate`, and retained `/plannotator-last`.
- [ ] R-009 — Remove superseded TypeScript machinery and obsolete commands.
- [ ] R-010 — Rewrite documentation, templates, and diagrams around the active architecture.
- [ ] R-011 — Enforce the production TypeScript budget, complete end-to-end acceptance, and add opt-in local real-Pi usage tests that inspect artifacts and session JSON.

## Blocked

- [ ] R-012 — Regenerate architecture diagrams from the approved edit prompts if suitable image-editing capability becomes available; do not present stale diagrams as current architecture.

## Done

- [x] R-004 — Implemented graph-aware mechanical checking and acknowledgement with cycle-tolerant direct/transitive impact reporting.
- [x] R-002 — Added the approved target architecture, design principles, refactor plan, and package maintainer conventions.
- [x] R-001 — Recorded the protected baseline: 4,072 counted production TypeScript lines, 58 unit tests, 4 integration tests, smoke and package checks passing; isolated fixture commits from user GPG configuration.
- [x] R-000 — Approve `pi-sych-refactor-plan.md` with top-to-bottom implementation authorization.
