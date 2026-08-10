# Pi Sych maintainer instructions

Pi Sych is a small mechanical substrate for explicit project state,
bounded delegation, and human-owned judgment.

## Before substantial work

1.  Inspect project synchronization.
2.  Read `PROJECT.md` and the relevant architecture documentation.
3.  Read only the additional project files and skills needed for the
    task.
4.  Follow `STYLE.md` when it exists and applies.

## Design boundary

- Keep mechanically decidable behavior in TypeScript: process bounds,
  schemas, safe paths, hashes, dependency traversal, atomic
  acknowledgement, immutable worker results, and review fallback state.
- Keep semantic interpretation in the six umbrella skills and normal
  supervisor/user conversation.
- A hash mismatch proves only that content changed after
  acknowledgement.
- Preserve MCPorter for explicit remote research and Plannotator as a
  narrow review adapter.
- Prefer Pi's built-in tools and project-native formatter, linter, type
  checker, and tests over wrapper infrastructure.
- Do not describe worker tool modes as sandboxes.

## Public runtime target

- Agent tools: `dispatch_worker` and `project_status`.
- Commands: `/pi-sych-status`, `/pi-sych-mcp`,
  `/plannotator-annotate <file>`, `/plannotator-last`,
  `/plannotator-review`. No `/plannotator` plan-mode toggle.
- Worker calls are synchronous and short-lived. The omitted timeout
  defaults to 90 seconds; supervisors set an explicit bounded override
  for longer work.
- Project-level `AGENTS.md`, `STYLE.md`, `EVIDENCE.md`, `DECISIONS.md`,
  and `TODO.md` are optional.

## Changes and review

- Work directly on `main` using small verified commits unless the user
  establishes another convention.
- Do not push, tag, publish, or release without separate instruction. A
  release tag is the final release operation: complete verification and
  remote main-job confirmation before creating or pushing it.
- Consequential architecture and synchronization decisions require an
  approved plan. Long or consequential plans stay in project-local
  Markdown and wait for browser or file review.
- Ask the project owner only when a genuinely consequential decision
  remains; otherwise complete the approved work and report limitations.
- Keep `TODO.md` as task state, not architecture or evidence.
- Update canonical documentation and `SYNC.json` only after the
  implementation and review state they describe is true.

## Verification

For substantive behavior changes, obtain independent test design before
implementation and an independent read-only review afterwards. Run the
repository's formatter, type checker, tests, smoke checks, package
validation, production audit, and source-budget check as applicable.
Report actual outcomes and known upstream limitations.
