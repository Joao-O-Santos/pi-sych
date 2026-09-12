# Pi Sych v7 pre-launch plan

This plan captures the current failure-mode-driven v7 work. The immediate
approach is pragmatic rather than benchmark-led: fix repeatedly observed
failures, use the package, and watch for regressions. More systematic model and
skill evaluation can follow after the release shape is stable.

## Implemented in this pass

### Writing and style

- Strengthened the shared prose method around structure before wording.
- New drafting follows the strongest available author/project style evidence.
- Revision now defaults to preserving clear, accurate, audience-appropriate
  human prose unless a concrete defect, structural need, venue requirement, or
  explicit request justifies changing it.
- Added deliberate sentence-length variation, familiar-to-new flow, end-weight,
  restrained em dashes, and non-dogmatic passive-voice guidance.
- Kept language-specific defaults out of the public package. Dialect rules belong
  in explicit user/project/private style guidance.

### Structure and review

- Strengthened section and structural review around macro-organization,
  contribution visibility, clarity, repetition, proportion, sequencing, and
  voice coherence.
- Added collaborative/co-author and adversarial/referee review lenses without
  restoring a reviewer-agent roster.
- Material disagreement between an artifact and accepted project state is now a
  review finding. Reviewers must not silently choose the artifact or
  `PROJECT.md`.

### Automation skill

- Added `automation` as the seventh public umbrella skill.
- Supervisor discovery required no runtime change because the package already
  exposes the whole `skills/` directory.
- Worker selection also required no runtime change because named skills are
  resolved dynamically from `skills/<selector>/SKILL.md`.
- Added modules for capability/stack selection, minimal workflow composition,
  deterministic data/file transforms, and browser/UI automation.
- Updated the catalogue tests that intentionally asserted exactly six skills.

The current automation skill can already guide direct supervisor work and clean
or trajectory workers. The richer capability and stack context below remains
planned.

## Remaining automation context

### Runtime capability summary

Expose a compact mechanically derived summary of relevant active capabilities
from Pi Sych and installed extensions, including h-pi-bakery components when
present. Do not create a second manually maintained registry and do not duplicate
full tool schemas.

Useful capability classes include:

- bounded workers and clean/trajectory context;
- local literature search;
- MCPorter/remote research;
- PEW-PEW retrieval;
- Plannotator;
- interactive browser work;
- document/spreadsheet/presentation transforms; and
- deterministic local data/file transforms.

Runtime state is authoritative about availability.

### User-level `STACK.md`

Add an optional user-level `STACK.md`, analogous to `STYLE.md` but for working
preferences and tool relationships. It should record durable preferences such as
retrieval versus interactive-browser choices, shell/CLI utilities, document and
analysis workflows, Git hosting/CLI preferences, deterministic-processing
preferences, and approval/privacy boundaries.

`STACK.md` describes preferences, not availability. Runtime capabilities win if
the two disagree. Load it only when automation is relevant rather than into
every session.

Before implementation, decide the smallest Pi-native resolution mechanism and
whether capability context can be derived from already available runtime/tool
metadata without adding much TypeScript.

## Review prompt templates

Prompt templates are a useful user-facing entry layer because they can request a
review lens or a set of independent reviews without duplicating the model-facing
review policy.

Proposed templates:

- `/review-collaborative <artifact>`: demanding co-author review focused on
  structure, clarity, repetition, argument/voice coherence, project-state
  alignment, and the smallest high-value changes.
- `/review-adversarial <artifact>`: skeptical referee review focused on
  contribution, overclaiming, alternatives, limitations, structural weakness,
  and project-state divergence without manufactured objections.
- `/review-structure <artifact>`: reverse-outline and structural diagnosis only;
  avoid copyediting while paragraph or section location remains unsettled.
- `/review-multilens <artifact>`: request independent clean-context collaborative
  and adversarial reviews, then synthesize agreements, disagreements, and blind
  spots. Different model roles may help, but lens diversity is the invariant.

Templates should remain thin entry points. The `review` skill and modules stay
the source of truth.

Before adding them, verify Pi's current package prompt-template discovery,
argument substitution, and npm packaging behavior. Then add only the minimal
metadata/tests/docs required to ship them.

## Compaction

Keep one automatic continuity-preserving compaction behavior. Do not add a
separate deliberate clean-compaction mode; a new session already provides the
user-visible reset boundary.

### Trigger at a settled turn boundary

Current automatic threshold handling occurs before the next agent start. Replace
that eager behavior with a settled-turn design:

1. finish the current assistant run;
2. wait for the Pi lifecycle boundary that guarantees the agent is settled;
3. inspect context usage;
4. compact only when the soft threshold is exceeded; and
5. let the next user message enter the compacted context.

Verify the exact Pi lifecycle API before implementation. Prefer a true
settled/idle boundary over `turn_end` if queued follow-ups or steering can race
with compaction. Keep Pi/native overflow handling as an emergency fallback for
an unusually large single run.

### Preserve trajectory, not hidden chain-of-thought

Replace the current six-field memory with a richer but bounded continuation
representation. Candidate content:

- objective/task;
- consequential user intent or wording;
- constraints;
- recent progress and material tool outcomes;
- decisions and visible rationale;
- rejected/failed approaches that constrain future work;
- unresolved alternatives/questions;
- current work;
- next action;
- relevant files/artifacts; and
- project-state gaps.

Do not claim to recover provider-hidden reasoning. Any rationale reconstructed
from observable conversation should be labelled as such.

### Reconcile conversation with durable project state

Compaction should ask what the project files already remember before deciding
what continuation memory still needs to carry.

Suggested order:

1. inspect bounded canonical project snapshots and mechanical project status;
2. inspect the trajectory being compacted;
3. identify durable state already represented in files;
4. avoid duplicating that state unnecessarily in working memory;
5. identify important accepted conversation state missing from or conflicting
   with canonical files;
6. append bounded, clearly marked proposals to `INBOX.md`; and
7. preserve the remaining trajectory needed for intelligent continuation.

State-gap proposals should distinguish, where possible:

- aligned;
- missing from files;
- possibly obsolete in file; and
- conflict/ambiguous direction.

They should also distinguish an explicit user decision, an observed work result,
and a model inference.

### Mutation boundary

Compaction must not silently edit canonical semantic files such as
`PROJECT.md`, `DECISIONS.md`, `STYLE.md`, `EVIDENCE.md`, `AGENTS.md`, or
`TODO.md`.

Normal supervised work writes accepted durable state. Compaction detects state
that normal work failed to record and may append proposals to `INBOX.md`. If the
user explicitly instructed a normal-turn update and the supervisor failed to do
it, compaction should expose that omission rather than silently repairing project
truth.

### Required code/tests

- move automatic threshold handling from `before_agent_start` to the verified
  settled-turn lifecycle;
- prevent duplicate/re-entrant compaction around the same settled boundary;
- redesign compaction schema, validation, rendering, and prompt;
- preserve bounded canonical snapshots and current project-status evidence;
- test project-state gap classification and `INBOX.md` proposals;
- test explicit-decision versus inferred-rationale labeling;
- test that canonical files are never mutated by compaction; and
- test large-turn/emergency fallback behavior and queued follow-up interaction.

## Skill quality across model strengths

Do not create large weak-model/strong-model copies of every skill. Keep common
invariants concise and put extra procedural scaffolding in examples/templates
only where repeated use shows it is needed.

For now, judge changes by observed failures:

- does the instruction prevent the known problem?
- did it introduce a new recurring failure?
- is the guidance doing work above what the model already does reliably?
- can the same behavior be obtained with less prompt surface?

## Documentation still to reconcile

Before release, update all present-tense documentation and diagrams that still
show the older six-skill catalogue or old compaction shape. Historical changelog
entries should remain historical rather than being rewritten.

In particular, reconcile README, architecture/configuration documentation, the
skills architecture image, and any generated site text after the remaining
runtime decisions are implemented.

## Release boundary

Before tagging v7:

- implement and verify the retained runtime work above;
- ensure current documentation describes actual behavior;
- run formatter, typecheck, unit/integration tests, package dry run,
  source-budget check, site build, production audit, and independent read-only
  review;
- confirm the main pipeline is green; and
- do not tag, publish, or release v7.0.0 without separate owner instruction.
