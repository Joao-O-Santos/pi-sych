# Pi Sych maintainer instructions

Pi Sych is a small mechanical substrate for explicit project state,
bounded delegation, and human-owned judgment.

## Before substantial work

1.  Inspect project synchronization.
2.  Read `PROJECT.md` and relevant architecture documentation.
3.  Read only the additional project files and skills needed for the
    task.
4.  Follow `STYLE.md` when it exists and applies.

## Design boundary

- Keep mechanically decidable behavior in TypeScript: process bounds,
  schemas, paths, hashes, dependency traversal, atomic acknowledgement,
  immutable worker results, and review fallback state.
- Keep semantic interpretation in the seven umbrella skills and normal
  supervisor/user conversation.
- A hash mismatch proves only that content changed after
  acknowledgement.
- Preserve MCPorter for explicit remote research and Plannotator as a
  narrow review adapter.
- Prefer Pi's built-in tools and project-native checks over wrapper
  infrastructure.
- Do not describe worker tool modes as sandboxes.

## Task posture

Package-wide supervisor guidance owns the universal invariants:
authorized scope, persistence versus scrutiny, verification without
invented checkpoints, and direct-work versus delegation judgment. This
file states only what is repository-specific about them.

## Changes and review

- Work directly on `main` using small verified commits unless the user
  establishes another convention.
- Do not push, tag, publish, or release without separate instruction.
- Do not require a new plan approval for work already covered by a clear
  implementation instruction or approved plan.
- Keep `TODO.md`, `PLAN.md`, and task-local `EVIDENCE.md` concise and
  current rather than accumulating them as changelogs.
- Update canonical documentation and `SYNC.json` with every accepted
  behavior/documentation change once they describe true state.
- Do not copy package-wide supervisor, skill, method, or tool guidance
  into this file. Keep it repository-specific.

## Verification

For substantive behavior changes, use independent test design and
read-only review when proportionate. Run repository-native formatter,
type checker, tests, packaging, production audit, source-budget, and
site checks as applicable. Report actual outcomes and limitations.
