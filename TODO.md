# Pi Sych v7 execution checklist

`PLAN.md` is the authority for goals, boundaries, and acceptance criteria. This
file records the implementation sequence and current verification state.

## Verified baseline

- [x] Complete the v7 guidance/design pass and record the runtime acceptance
  criteria.
- [x] Strengthen writing, review, and research guidance for self-contained,
  evidence-aware artifacts.
- [x] Verify the guidance/design baseline through the repository's
  deterministic acceptance checks.

## Runtime decisions

- [x] Inspect current Pi extension, compaction, package, prompt-template, and
  user-instruction APIs.
- [x] Use Pi's active tool projection and source metadata rather than creating a
  capability registry.
- [x] Define `STACK.md` as an optional user-maintained computer-environment
  profile at `~/.pi/agent/STACK.md`; it is not project software-stack state,
  capability truth, or an authorization policy.
- [x] Package only prefixed, thin review templates that select a lens and defer
  substantive procedure to the existing `review` skill.

## Implementation complete

- [x] Inject a compact capability summary derived from active tools and local
  integration inspection at supervisor start; keep it non-authorizing.
- [x] Represent local-literature and remote MCPorter state as inspected/configured
  only, without claiming credentials, reachability, or verified access.
- [x] Admit optional 100k compaction at `agent_settled` with idle, pending-message,
  and reentrancy guards.
- [x] Retain bounded observable trajectory: objective, authorization,
  constraints, progress, provenance-labelled decisions and inferences,
  failed/rejected paths, unresolved issues, active work, next action, files,
  and classified project-state gaps.
- [x] Preserve native fallback and bounded visibly unreviewed inbox proposals;
  canonical semantic files are never mutated by compaction.
- [x] Cover capability projection, settled lifecycle, reentrancy, queued
  follow-ups, bounded validation, provenance, gap classification,
  non-mutation, and failure fallback in focused tests.
- [x] Package five thin review prompts that defer substantive procedure to the
  `review` skill.
- [x] Keep malformed empty optional compaction gap details from discarding an
  otherwise usable continuation.

## Markdown architecture pass

- [x] Define `STACK.md` as optional user machine context, separate from
  project software requirements, capability truth, and authorization.
- [x] Route roots through a primary module with explicit optional overlays;
  preserve shared-method and genre-specific scaffolding.
- [x] Remove duplicated portable provider, workflow, and authorization prose
  while retaining domain-specific safeguards.
- [x] Align pi-tin's model-facing tool convention without adding a runtime
  dependency.

## Reconciliation and verification

- [x] Reconcile canonical documentation and project state with v7 runtime.
- [x] Raise the nonblank runtime source-budget script limit to 3,000.
- [x] Preserve the optional machine-context `STACK.md` boundary, unchanged
  images, and human-ownership/non-sandbox boundaries.
- [x] Harden custom compaction: instruction/data isolation, aggregate input
  bounds, line-break rejection in model-derived memory values, and
  notification-safe proposal persistence.
- [x] Make capability claims ownership-aware and reject empty worker
  assignments at the request boundary.
- [x] Apply material findings from final documentation review; keep image
  files unchanged.
- [x] Finalize `PROJECT.md` and `TODO.md` after accepted corrections.
- [ ] Run opt-in live prompt-quality fixtures if the configured models and cost
  make them useful; report separately from deterministic verification.
- [ ] Confirm main CI and Pages after commits are available remotely.

Constraints for this work: no release, tag, publication, or package-version
change; do not push, tag, publish, deploy, or release without separate
owner instruction.
