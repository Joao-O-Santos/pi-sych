# Pi Sych v7 pre-launch plan

This plan captures the current failure-mode-driven v7 work. The immediate
approach is pragmatic rather than benchmark-led: fix repeatedly observed
failures, use the package, and watch for regressions. More systematic model and
skill evaluation can follow after the release shape is stable.

## Goals

- Preserve human intent and voice instead of normalizing text toward model prose.
- Make new drafting follow the strongest available author/project style evidence.
- Strengthen manuscript structure, clarity, repetition, and contribution review.
- Support distinct collaborative and adversarial review lenses without restoring
  a large reviewer-agent roster.
- Restore automation as a public skill with explicit runtime capability context
  and a user-owned working-stack profile.
- Make automatic compaction occur at a settled turn boundary and preserve
  trajectory while reconciling conversation state with durable project files.

## Text-only changes in this pass

The following changes are safe to make without changing runtime code:

- Strengthen the shared prose method:
  - structure before wording;
  - topic-sentence outlines for unclear new structure;
  - reverse outlining before major revision;
  - minimum-intervention editing of existing human prose;
  - drafting toward established author/project voice;
  - deliberate sentence-length variation;
  - familiar-to-new flow and end-weight;
  - accurate, non-dogmatic passive-voice guidance;
  - restrained em dashes and resistance to recurring model rhetorical templates.
- Strengthen style calibration so examples guide register, rhythm, terminology,
  and sentence distribution without authorizing phrase imitation.
- Keep language-specific defaults out of the package core. Dialect rules belong
  in explicit user/project/private style guidance.
- Strengthen section and structural review around macro-organization,
  contribution visibility, clarity, repetition, proportion, and sequencing.
- Add collaborative/co-author and adversarial/referee review lenses to the
  existing review guidance rather than adding persistent reviewer agents.
- Make material disagreement between a manuscript and accepted project state a
  review finding. Reviewers must not silently choose the draft or `PROJECT.md`.

## Review UX and prompt templates

Pi supports reusable package prompt templates. Add a small `prompts/` surface
after the package metadata/tests are updated to ship it.

Proposed templates:

- `/review-collaborative <artifact>`: demanding co-author review. Prioritize
  structure, clarity, repetition, argument and voice coherence, project-state
  alignment, and the smallest high-value changes.
- `/review-adversarial <artifact>`: skeptical referee review. Stress-test
  contribution, overclaiming, alternative explanations, limitations, structural
  weaknesses, and project-state divergence without manufacturing objections.
- `/review-structure <artifact>`: reverse-outline and structural diagnosis only;
  avoid copyediting while paragraph or section location remains unsettled.
- `/review-multilens <artifact>`: request independent clean-context
  collaborative and adversarial reviews, then synthesize agreements,
  disagreements, and blind spots. Different model roles may be used when useful,
  but model diversity is optional; lens diversity is the invariant.

Templates are entry points, not duplicated policy. They should tell the
supervisor which existing `review` guidance/lens to use and whether independent
clean workers are valuable. The review skill remains the source of truth.

### Package/config work required

Do not implement in this text-only pass:

- add the package `prompts/` directory to npm/package discovery as needed;
- add prompt-template tests and documentation of invocation/arguments;
- verify template discovery against the targeted Pi version.

## Automation skill

Restore `automation` as the seventh public umbrella skill once tests and package
documentation are changed with it.

The skill should reason about automation as composition of available
capabilities around the user's actual working environment, not merely shell
scripting.

### Layer 1: runtime capabilities

Expose a compact mechanically derived capability summary from Pi Sych and
installed h-pi-bakery components. It should answer what is available without
duplicating full tool schemas.

Examples of capability classes:

- bounded workers and clean/trajectory context;
- local literature search;
- MCPorter/remote research;
- PEW-PEW retrieval;
- Plannotator;
- browser interaction;
- document/spreadsheet/presentation transforms;
- deterministic local data/file transforms.

The runtime is authoritative about availability. Do not require users to keep a
second manual capability registry synchronized.

### Layer 2: `STACK.md`

Add an optional user-level `STACK.md`, analogous to `STYLE.md` but for working
preferences and tool relationships. Default location should follow the Pi Sych
user configuration directory unless implementation constraints suggest a better
Pi-native location.

It should record things such as:

- preferred tools for retrieval versus interactive browser work;
- preferred shell/CLI utilities;
- document and conversion workflows;
- Git hosting and CLI preferences;
- R/Quarto or other analysis stack;
- deterministic-processing preferences;
- privacy, approval, and destructive-action boundaries.

`STACK.md` describes preferences, not availability. Runtime capabilities win if
the two disagree. Load it when automation is relevant rather than into every
session.

### Skill shape

Keep the public automation skill small. Suggested recipes can cover:

- inspect available capability + stack context;
- design a minimal automation;
- deterministic file/data transformation;
- browser/UI automation;
- recurring or batch workflows;
- verification and human-approval boundaries.

Do not restore the old OpenCode automation-agent architecture.

### Required code/test/documentation changes

- update skill-discovery tests from six to seven public skills;
- add automation modules/examples and route-budget checks;
- update README, architecture/configuration docs, diagrams where they state six
  skills or four methods;
- decide how the runtime exposes capability summaries and how the automation
  skill obtains them;
- decide and document user-level `STACK.md` resolution/override rules.

## Compaction

Keep one automatic continuity-preserving compaction behavior. Do not add a
separate deliberate "clean compaction" mode; a new session already provides the
user-visible reset boundary.

### Trigger boundary

Current automatic compaction is checked before the next agent start. Replace
that eager behavior with a settled-turn design:

1. finish the current assistant run;
2. wait for the Pi lifecycle boundary that guarantees the agent is settled;
3. inspect context use;
4. compact only when the soft threshold is exceeded;
5. let the next user message enter the compacted context.

Verify the exact targeted Pi lifecycle API before implementation. Prefer the
settled/idle boundary over `turn_end` if the latter can race with queued
follow-ups or steering. Retain Pi/native overflow handling as an emergency
fallback for unusually large single runs.

### Trajectory-preserving continuation memory

The current six-field memory is too lossy. Replace it with a richer but bounded
continuation representation that preserves observable trajectory rather than
inventing hidden chain-of-thought.

Candidate fields:

- objective/task;
- user intent or consequential wording;
- constraints;
- recent progress and material tool outcomes;
- decisions and visible rationale;
- rejected/failed approaches that constrain future work;
- unresolved alternatives/questions;
- current work;
- next action;
- relevant files/artifacts;
- project-state gaps.

Do not claim to recover provider-hidden reasoning. Any inferred rationale must be
labelled as reconstructed from the visible conversation.

### Reconcile conversation with durable project state

Compaction should first ask what the project files already remember, then retain
only the conversation state still needed for intelligent continuation.

Suggested order:

1. inspect bounded canonical project snapshots and mechanical project status;
2. inspect the trajectory being compacted;
3. identify durable state already represented in files;
4. avoid duplicating that state unnecessarily in working memory;
5. identify important accepted conversation state missing from or conflicting
   with canonical files;
6. append bounded proposal lines to `INBOX.md` for human review;
7. preserve remaining trajectory in continuation memory.

A state-gap proposal should distinguish, where possible:

- aligned;
- missing from files;
- possibly obsolete in file;
- conflict/ambiguous direction.

It should also distinguish an explicit user decision, an observed work result,
and a model inference.

### Mutation boundary

Compaction must not silently edit canonical semantic files such as
`PROJECT.md`, `DECISIONS.md`, `STYLE.md`, `EVIDENCE.md`, `AGENTS.md`, or
`TODO.md`.

Normal supervised work writes accepted durable state. Compaction detects state
that normal work failed to record and may append clearly marked proposals to
`INBOX.md`. If the user explicitly instructed a normal-turn update and the
supervisor failed to make it, compaction should expose that omission rather than
quietly repairing project truth.

### Required code/test changes

- move automatic threshold handling out of `before_agent_start` to the verified
  settled-turn lifecycle;
- prevent duplicate/re-entrant compaction around the same settled boundary;
- redesign compaction schema, validation, rendering, and prompt;
- preserve bounded canonical snapshots and current project-status evidence;
- test project-state gap classification and `INBOX.md` proposals;
- test explicit-decision versus inferred-rationale labeling;
- test that canonical files are never mutated by compaction;
- test large-turn/emergency fallback behavior and queued follow-up interactions.

## Skill quality across model strengths

Do not add large weak-model/strong-model copies of every skill. Keep the core
guidance concise and put procedural scaffolding in examples/templates when a
weaker model benefits from it. Model-specific instruction profiles remain a
possible later optimization, but only after repeated use shows a concrete
failure that the common skill cannot address cheaply.

For now, judge skill changes by repeated observed failures:

- does the instruction prevent the known problem?
- did it introduce a new recurring failure?
- is the guidance doing work above what the model already does reliably?
- can the same behavior be obtained with less prompt surface?

## Release boundary

Before tagging v7:

- implement and verify the runtime/test work above;
- update canonical documentation only when it describes actual behavior;
- update `PROJECT.md` current direction/state after the implemented runtime and
  seventh skill are true;
- run the normal formatter, typecheck, unit/integration tests, package dry run,
  source-budget check, site build, audit, and independent read-only review;
- do not tag or publish until the owner separately approves release.
