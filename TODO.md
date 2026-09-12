# Pi Sych v7 execution checklist

`PLAN.md` is the authority for goals, boundaries, and acceptance criteria. This
file tracks implementation status and handoff work.

## Guidance and design preparation

- [x] Reframe `PLAN.md` around the complete remaining v7 program.
- [x] Replace the stale worker-thinking checklist with current execution state.
- [x] Document the target runtime capability model.
- [x] Document the optional `STACK.md` hypothesis and its boundaries.
- [x] Document thin review lenses and prompt-entry-point constraints.
- [x] Document the settled-turn compaction target and required regressions.
- [x] Strengthen prose guidance for artifact self-containment, context leakage,
  reader-jarring model-like rhetoric, and preservation of human voice.
- [x] Clarify that reviewer/version language can belong in response letters but
  should not leak into a standalone manuscript without a substantive reason.
- [x] Strengthen research guidance to discover and use available capability
  classes, with local literature, OpenAlex-like metadata, Scholar Gateway-like
  scholarly retrieval, PDF readers, search, and targeted fetch tools as
  examples rather than mandatory providers.
- [x] Confirm Markdown formatting, links, deterministic CI, and Pages are green
  for the guidance/design changes. Commit `2fd793ee` passed verify with 97.86%
  coverage and deployed Pages in pipeline `2843301780`.

## Runtime capability summary

- [ ] Inspect current Pi extension/session APIs for authoritative active-tool and
  package state.
- [ ] Decide the smallest useful capability projection; avoid a central
  registry.
- [ ] Implement the derived supervisor-facing summary.
- [ ] Test absent, present, partial, and degraded integration states.
- [ ] Update present-tense architecture/configuration documentation after the
  runtime contract is implemented.

## Optional `STACK.md`

- [ ] Check whether existing Pi user-level instructions/configuration already
  satisfy the need.
- [ ] Decide whether a distinct `STACK.md` earns runtime surface.
- [ ] If retained, define discovery and precedence and implement optional
  loading.
- [ ] Test that preferences cannot create or imply unavailable capabilities.
- [ ] Add a template only after the runtime contract is settled.

## Review prompt entry points

- [ ] Verify current Pi prompt discovery, substitution, invocation, and package
  behavior.
- [ ] Decide whether packaged thin templates improve discoverability enough to
  justify public surface.
- [ ] If retained, package only entry points that defer substantive procedure to
  the `review` skill.
- [ ] Verify prompts do not create fixed review pipelines, revision authority,
  or approval semantics.

## Settled-turn compaction redesign

- [ ] Identify the exact settled-turn lifecycle boundary and reentrancy rules.
- [ ] Implement bounded observable trajectory memory.
- [ ] Reconcile bounded canonical project state without silent semantic
  mutation.
- [ ] Preserve explicit decisions, visible rationale, failed/rejected paths,
  unresolved alternatives, current work, and next action.
- [ ] Handle queued follow-ups and compaction failure deterministically.
- [ ] Add focused lifecycle, labeling, non-mutation, and fallback regressions.
- [ ] Obtain independent review before accepting the redesign.

## Documentation and images

- [ ] Audit present-tense README and docs against final implemented behavior.
- [ ] Reconcile workflow/capability images with non-autonomous semantics.
- [ ] Verify generated site links and accessibility.

## Final v7 gate

- [ ] Run full deterministic verification and packaging/site/audit gates.
- [ ] Run live prompt-quality fixtures if useful; report separately from CI.
- [ ] Independently review the final diff.
- [ ] Reconcile final durable project state after runtime work is stable.
- [ ] Confirm main CI and Pages are green.
- [ ] Do not tag, publish, or release without separate owner instruction.
