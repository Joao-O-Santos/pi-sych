# Pi Sych v7 pre-launch plan

This plan tracks the remaining failure-mode-driven v7 work. The package
should stay small: solve repeated observed failures with the least prompt
and runtime surface that works, then watch for regressions.

## Completed: model-facing text audit

The current pass reviewed every model-facing text class: supervisor
injection, tool descriptions/snippets/guidelines, worker request/result
schemas, worker assignment prompt, compaction prompt, seven umbrella
skills, routed shared methods/modules, examples/templates, and current
model-facing documentation.

Implemented changes:

- separate **persistence** from **scrutiny**: clear authorized work should
  continue until complete or genuinely blocked; higher scrutiny means
  more checking, not more permission prompts;
- treat a clear request to review, rewrite, implement, or complete a
  named scope as authorization for that scope;
- request another checkpoint only for a new consequential choice, side
  effect, or material ambiguity outside the accepted boundary;
- choose supervisor execution versus worker delegation by task and
  context rather than a fixed default;
- make explicit that context need does not force supervisor execution;
  use trajectory when prior conversation matters, or convert pre-work to
  an explicit plan/TODO/brief and delegate cleanly afterward;
- allow whole-artifact prose drafting/rewrite/review to complete when
  explicitly requested while retaining high internal scrutiny around
  meaning, evidence, structure, and voice;
- make local literature search clearly a discovery/provenance surface,
  not source verification or completeness evidence;
- tighten worker schema/result descriptions and the terminal assignment
  contract; and
- establish the prompt hierarchy: always-visible text for cross-domain
  invariants, umbrella skills for domain posture/routing, routed files
  for detailed procedure.

The current compaction prompt was audited and intentionally not rewritten:
it already has one narrow structured-output job, and the planned richer
compaction redesign will supersede it.

## Remaining automation context

### Runtime capability summary

Expose a compact mechanically derived summary of relevant active
capabilities without creating a manually maintained registry or
duplicating tool schemas. Runtime state remains authoritative.

### User-level `STACK.md`

If retained, add an optional user-level `STACK.md` for durable working
preferences and tool relationships. It describes preference, not
availability, and should load only when automation decisions need it.

## Review prompt templates

Thin templates may provide user-facing entry points for collaborative,
adversarial, structural, and multi-lens review. They must reuse the
`review` skill rather than duplicate model-facing policy. Verify Pi's
current prompt-template discovery/substitution/packaging before adding
any runtime or package surface.

## Compaction

Keep one continuity-preserving compaction behavior. Replace the current
pre-turn threshold handling with a verified settled-turn lifecycle and a
richer bounded continuation representation. Preserve observable
trajectory rather than claiming hidden chain-of-thought recovery.

Candidate memory content:

- objective/task and consequential user intent;
- constraints;
- recent progress and material tool outcomes;
- decisions and visible rationale;
- rejected/failed approaches that constrain future work;
- unresolved alternatives/questions;
- current work and next action;
- relevant files/artifacts; and
- project-state gaps.

Reconcile conversation with bounded canonical project state, classify
missing/stale/conflicting durable state, and append only bounded marked
proposals to `INBOX.md`. Never silently mutate canonical semantic files
from compaction.

Required tests include settled-boundary/reentrancy behavior, queued
follow-ups, explicit-decision versus inferred-rationale labeling,
project-state gap classification, canonical non-mutation, and fallback
behavior.

## Skill quality across model strengths

Do not create weak/strong copies of every skill. Keep invariants concise
and add scaffolding only where repeated use shows it is needed. Evaluate
prompt changes by known failure prevention, regression risk, marginal
behavioral value, and whether less text can achieve the same result.

## Documentation and release boundary

Keep all present-tense documentation synchronized with implemented
behavior. Historical changelog entries remain historical. Before tagging
v7, run the full repository verification/packaging/site/audit gates,
review the final diff independently, confirm main CI is green, and do not
tag, publish, or release without separate owner instruction.
