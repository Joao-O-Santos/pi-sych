# Pi Sych: Major Simplification Refactor Plan

**Recommended approach:** Major subtractive refactor with selective rewrites.
**Not recommended:** Discarding the repository and rebuilding every subsystem from zero.

## 1. Objective

Refactor the current Pi Sych package into the minimal architecture defined in `pi-sych-redefined-architecture.md`:

- two essential agent-facing tools, `dispatch_worker` and `project_status`;
- one optional plan-review tool, `submit_plan`;
- short-lived synchronous workers with a bounded 90-second default timeout and an optional explicit override;
- independent mechanical project-status inspection and acknowledgement;
- a flexible directed dependency graph that reports direct and transitive review impact without requiring an acyclic graph or inferring conceptual drift;
- optional, progressively loaded project files, including project-level `AGENTS.md`;
- semantic workflows and user-feedback questions implemented through skills and normal conversation;
- a narrow Plannotator adapter;
- MCPorter support retained for explicit remote research;
- no persistent worker-management or TypeScript semantic-workflow machinery;
- a readable production TypeScript target below 2,000 physical lines, excluding tests, MCPorter code, and the Plannotator/`submit_plan` adapter.

## 2. Refactor strategy

Preserve the package substrate that already solves real mechanical problems. Replace the oversized supervisor registration layer and simplify the worker public contract. Move interpretive behaviour into skills, then delete the superseded TypeScript modules and commands.

```mermaid
flowchart LR
    A[Current package] --> B[Protect proven substrate]
    B --> C[Collapse active tool surface]
    C --> D[Simplify project state]
    D --> E[Simplify bounded dispatch]
    E --> F[Move semantic workflows into skills]
    F --> G[Delete obsolete machinery]
    G --> H[Rewrite docs and verify package]
```

## 3. Preserve, rewrite, move, and remove

### Preserve

Retain unless tests reveal a defect:

- package metadata and Pi discovery;
- TypeScript and Biome configuration;
- unit, integration, smoke, packaging, and dependency tests;
- SHA-256 fingerprint helpers;
- safe project-local path resolution;
- atomic file-writing helpers where still required;
- model-catalog loading;
- worker-profile bootstrap;
- MCPorter integration and explicit remote-research exposure;
- the local lazy Plannotator compatibility boundary;
- immutable worker-result submission as a concept;
- truthful warnings that worker modes are not sandboxes.

### Selectively rewrite

- `extensions/workbench/index.ts` — rebuild around the minimal public surface rather than deleting registrations incrementally;
- the public dispatch contract in `worker-engine.ts` — preserve useful launch and validation helpers, but simplify the exposed semantics;
- project status — combine inspection and explicit acknowledgement in one narrow tool.

### Move into skills

- project bootstrap and reconstruction;
- interpretation of project-status output;
- conceptual drift review;
- reconciliation planning and execution procedure;
- evidence proposal and challenge workflows;
- verification procedure;
- retrospection;
- artifact generation and review;
- architecture and code review.

### Remove after migration

- dedicated reconciliation-application tool;
- dedicated candidate-application tool;
- retrospective tool and command;
- evidence proposal and challenge tools;
- dedicated verification tool;
- programmatic semantic drift taxonomy and resolution generation;
- worker-status command;
- no Plannotator command: retain `/plannotator-last` as an explicitly supported annotation workflow;
- `/pi-sych-init`, `/pi-sych-drift`, and `/pi-sych-sync` as programmatic workflows;
- persistent project-local run history unless needed solely for debugging;
- mutation locking if synchronous dispatch and Pi's single tool-call flow make it redundant;
- public `maxTurns` unless evidence shows it is independently valuable alongside the bounded timeout.

## 4. Target active surface

### Agent tools

```text
dispatch_worker
project_status
submit_plan              optional
```

The shorter semantic names avoid the package prefix while remaining less collision-prone than generic `dispatch` or `status` names.

### Commands

```text
/pi-sych-status
/plannotator-annotate <file>
/pi-sych-mcp             optional diagnostic
```

### Existing Pi tools

```text
read
edit
write
bash
```

## 5. Phased implementation

## Phase 0 — Establish a protected baseline

### Work

1. Work directly on `main` under the repository's established atomic-commit convention; do not push, tag, publish, or release without separate instruction.
2. Create `TODO.md` as an optional project task ledger for this refactor, with stable task IDs and Active, Blocked, and Done sections. Keep it updated throughout implementation without treating it as authority for architecture or evidence.
3. Run and record the existing checks:
   - type checking;
   - Biome formatting and linting;
   - unit tests;
   - integration tests;
   - dependency checks;
   - smoke tests;
   - package dry run;
   - Git diff checks.
4. Add characterization tests for behaviour that must survive:
   - package loads only the supervisor extension by default;
   - a worker can be launched from a project outside the Pi Sych repository;
   - Plannotator's official extension surfaces do not appear;
   - MCPorter appears only for explicitly remote-research workers;
   - hashes are stable and invalid manifests fail clearly;
   - worker results are immutable and validated.
5. Capture the current public tools and commands in a test so deliberate removals are explicit.
6. Measure the counted production TypeScript baseline and add an auditable line-budget check with explicit exclusions for tests, MCPorter, and the Plannotator/`submit_plan` adapter.

### Exit criteria

- The branch starts green.
- Every retained behaviour has at least one characterization test.
- The target removals are documented rather than disappearing accidentally.

## Phase 1 — Define the target contract before changing implementation

### Work

1. Add the proposed `ARCHITECTURE.md`.
2. Add or revise a package-level `AGENTS.md` for maintainers.
3. Define the two core tool schemas in tests:
   - `dispatch_worker` with optional `timeoutMs`, a 90-second internal default, a positive bounded override, cancellation, `SIGTERM`, and `SIGKILL` after a short grace period;
   - `project_status` with `check` and `acknowledge`.
4. Define the optional `submit_plan` contract.
5. Define the intended startup supervisor policy and assert that it remains short.
6. Define the intended public command list.

### Exit criteria

- Tests describe the new public surface.
- No implementation has to guess the intended contract.

## Phase 2 — Rewrite the supervisor entry point

### Work

Replace the current large registration function with a thin composition root that registers only:

- `dispatch_worker`;
- `project_status`;
- optional `submit_plan`;
- `/pi-sych-status`;
- `/plannotator-annotate`;
- optional `/pi-sych-mcp`.

Append a concise supervisor policy through `before_agent_start`. The policy should state:

- work directly by default;
- use skills for semantic workflows;
- a hash mismatch is not conceptual drift;
- follow project `AGENTS.md` if it exists;
- read applicable conventions before creating artifacts;
- use the short default only for small bounded worker tasks, choose an explicit timeout for longer work, and always provide the smallest-complete packet;
- consequential ambiguities remain human-owned.

Do not retain compatibility aliases for removed tools unless there is a real installed-user migration need.

### Exit criteria

- A clean Pi session exposes only the intended tools and commands.
- The supervisor policy contains no obsolete workflow instructions.
- The entry point is small enough to understand without reading semantic modules.

## Phase 3 — Simplify the project file model

### Work

1. Treat `PROJECT.md` and `SYNC.md` as the core managed state.
2. Discover, but do not require:
   - `AGENTS.md`;
   - `STYLE.md`;
   - `EVIDENCE.md`;
   - `DECISIONS.md`;
   - `TODO.md`.
3. Make project-root discovery prefer `SYNC.md`, then `PROJECT.md`, while avoiding false roots.
4. Keep structural validation narrow:
   - valid project title and minimal required project headings;
   - valid synchronization schema;
   - project-local relative tracked paths;
   - valid SHA-256 values;
   - no duplicate artifact records.
5. Do not mechanically validate semantic claims or project quality.
6. Update templates to explain each file's authority and optionality.

### Exit criteria

- A coding-only project can operate without `EVIDENCE.md` or `STYLE.md`.
- A project-local `AGENTS.md` is discovered and described as optional.
- Missing optional files do not produce failure states.

## Phase 4 — Rebuild project status as one mechanical tool

### Work

Implement:

```ts
project_status({ action: "check" })
project_status({
  action: "acknowledge",
  files: ["..."],
  reason: "..."
})
```

#### Check path

- read and validate `SYNC.md`;
- fingerprint tracked files;
- report changed and missing files;
- traverse optional declared `dependsOn`/`updateFrom` relationships and report direct and transitive dependents of changed inputs;
- tolerate cycles with a visited set and report them for orientation rather than rejecting the manifest;
- keep dependency declarations project-defined and optionally reason-annotated rather than enforcing role-specific edges;
- optionally compute modification times and bounded diff statistics;
- never emit semantic drift findings, authority decisions, or rigid resolution menus.

#### Acknowledge path

- require named files and a non-empty reason;
- confirm that each file exists and is tracked, or deliberately support an explicit add operation if needed;
- write only the selected current hashes and acknowledgement metadata;
- preserve authority and dependency declarations;
- mark unacknowledged direct and transitive dependents as `needs-review` when an input is acknowledged;
- permit a reviewed unchanged dependent to be acknowledged with a reason and returned to `current`;
- perform one atomic `SYNC.md` update through Pi's file-mutation queue where applicable;
- return exact fingerprints, reasons, timestamps, and dependent status changes;
- rely on the supervisor and skills to obtain user feedback in normal conversation before consequential acknowledgement; do not claim that the tool can mechanically prove review or correctness.

### Tests

- `check` never changes files;
- changed hashes remain changed across repeated checks;
- `acknowledge` updates only named files;
- acknowledgement without a reason fails;
- acknowledgement of missing files fails;
- changed dependent reporting follows only declared dependencies;
- a hash mismatch is never labelled conceptual drift.

### Exit criteria

- The former sync, drift-detection, candidate-application, and reconciliation-application tools are unnecessary for mechanical state management.

## Phase 5 — Simplify bounded worker dispatch

### Public request

Use a compact schema:

```ts
{
  task: string;
  mode: "read-only" | "edit" | "full-host";
  expectedOutput: string;
  contextFiles: Array<{ path: string; purpose: string }>;
  skills?: string[];
  modelProfile?: string;
  remoteResearch?: boolean;
  timeoutMs?: number; // 90-second default; explicit bounded override
}
```

### Work

1. Keep `timeoutMs` optional in the public schema, validate any override, and enforce a 90-second default internally.
2. State in the tool guidance that the default is for small bounded tasks and longer research, implementation, or review work should set an explicit estimate.
3. Forward Pi cancellation, terminate with `SIGTERM`, and force-kill with `SIGKILL` after a short grace period.
4. Keep the call synchronous from the supervisor's perspective.
5. Remove the worker-status command and any user-facing worker lifecycle model.
6. Construct a smallest-complete worker packet:
   - exact task;
   - exact expected output;
   - selected context files;
   - project `AGENTS.md` if present;
   - relevant `STYLE.md` when artifact creation or revision is requested;
   - selected skills;
   - result contract.
7. Continue to use `--no-context-files` so no unrelated global or project context leaks into the worker.
8. Keep `read-only`, `edit`, and `full-host` as visible-tool profiles, with explicit non-sandbox language. In addition to required `submit_artifact`, use the Pi harness tools exactly as follows: `read-only` gets `read`, `grep`, `find`, and `ls`; `edit` adds `edit`; `full-host` gets only `read`, `edit`, and `bash`, because Bash subsumes searching and listing.
9. Keep MCPorter absent unless `remoteResearch: true`, while preserving its current supported integration when enabled.
10. Require one structured immutable result.
11. Prefer a temporary result directory or a disposable `.pi-sych` runtime path excluded from Git. Do not return paths that have already been deleted; return useful result content and durable project artifact paths.
12. Return observed project changes when reliably available, but avoid turning Git inspection into an orchestration framework.
13. Retain model fallback only for clearly classified transient launch failures and only if it remains small and well tested.
14. Remove public verification contracts and `pi_sych_verify`; the supervisor or a relevant skill runs actual executable checks through Pi's built-in Bash after inspecting the result. Record durable verification support in project evidence only when useful.
15. Remove `maxTurns` unless a concrete failure mode justifies it alongside timeout enforcement.

### Result contract

Simplify to the minimum required for truthful handoff:

```ts
{
  status: "complete" | "partial" | "failed";
  summary: string;
  artifacts: Array<{ path: string; kind: string }>;
  changedFiles: string[];
  limitations: string[];
  resultPackage: string;
}
```

Internally retain task/run identity only where needed to bind one result to one process.

### Tests

- omitted timeout uses the documented 90-second default;
- invalid overrides are rejected;
- timeout terminates and then force-kills a non-responsive child;
- external-project dispatch resolves the installed worker extension correctly;
- project `AGENTS.md` is included only when present;
- relevant `STYLE.md` reaches an artifact-producing worker;
- unrelated context files are absent;
- selected skills resolve from project, package, and user roots;
- only remote-research workers receive MCPorter;
- a second result submission fails;
- malformed results fail validation;
- no persistent worker polling surface exists.

### Exit criteria

- Dispatch is a bounded function call rather than an agent-management subsystem.

## Phase 6 — Move semantic workflows into skills

Create or revise the following skills.

### `bootstrap-project`

- interview the user or inspect an existing artifact;
- propose `PROJECT.md`, `SYNC.md`, and useful optional files;
- label explicit, inferred, unresolved, contradicted, and unsupported statements in the proposal;
- use normal Pi writes only after approval.

### `project-status-review`

- interpret the mechanical result from `project_status`;
- decide which files need inspection;
- distinguish harmless change, expected change, and possible drift;
- recommend the next skill or user decision.

### `drift-review`

- compare relevant files semantically;
- examine objectives, scope, claims, evidence, methods, terminology, architecture, and conclusions;
- produce structured findings;
- never update hashes.

### `reconcile-project`

- present the disagreement and possible authorities;
- ask the project owner when consequential;
- propose exact edits;
- apply approved edits through normal Pi tools;
- run relevant review or verification;
- call project-status acknowledgement only at the end.

### `workflow-retrospective`

- inspect current session history and available task evidence;
- separate project-local lessons from reusable skill or package proposals;
- require repeated evidence or an obvious structural defect before proposing universal rules;
- never edit itself or package skills automatically;
- use `disable-model-invocation: true` for explicit invocation only.

### Evidence, verification, writing, review, and coding skills

Move procedural guidance from TypeScript into the appropriate skills. Skills may call existing Pi tools and external research integrations; they should not require dedicated wrapper tools without a mechanical invariant.

### Exit criteria

- Removing semantic TypeScript modules does not remove user-visible capabilities; the equivalent workflows are available through skills.

## Phase 7 — Reduce the Plannotator surface

### Work

1. Keep `@plannotator/pi-extension` as a dependency used only as a library.
2. Keep all imports in one local compatibility module.
3. Expose only:
   - `submit_plan` to the supervisor;
   - `/plannotator-annotate <file>` to the user.
4. Retain `/plannotator-last` as an explicitly supported last-assistant-message annotation command.
5. Ensure approval does not:
   - start implementation;
   - change the model;
   - change thinking level;
   - change active tools;
   - append Plannotator workflow state.
6. Test that the official extension entry point and commands remain absent.

### Exit criteria

- Plannotator is a narrow review UI, not an orchestration framework.

## Phase 8 — Delete superseded code and collapse module boundaries

Only after the replacement skills and tests are in place:

1. Delete the programmatic semantic drift module or reduce it to purely mechanical helpers.
2. Delete candidate-generation code that hard-codes intellectual workflows.
3. Delete retrospective and evidence tool modules.
4. Delete the dedicated verification tool module if no internal process helper still needs it.
5. Remove unused schemas, result types, imports, commands, and tests.
6. Collapse tiny modules that no longer justify separate files.
7. Run dependency analysis and remove packages no longer used.

Avoid preserving dead abstractions for hypothetical future compatibility.

### Exit criteria

- Every surviving module has an active runtime or testing purpose.
- The workbench source tree is materially smaller and easier to explain.

## Phase 9 — Rewrite documentation and templates

### Work

1. Rewrite `README.md` around the actual minimal workflow and incorporate the substance of `principles.md` as a concise, prominent design-principles section without duplicating contradictory prose.
2. Publish the redefined `ARCHITECTURE.md` and align `supervisor_desired_context.md` with the shorter tool names, optional timeout override, and optional project-level `AGENTS.md`.
3. Update configuration documentation for:
   - model profiles;
   - worker runtime;
   - MCPorter;
   - Plannotator;
   - optional project files.
4. Add concise templates for:
   - `PROJECT.md`;
   - `SYNC.md`;
   - `AGENTS.md`;
   - `STYLE.md`;
   - `EVIDENCE.md`;
   - `DECISIONS.md`.
5. Clearly distinguish:
   - mechanical status;
   - semantic review;
   - approval;
   - acknowledgement.
6. Keep the generated diagrams in `docs/img/` with descriptive alt text; do not rename the directory merely for convention.
7. Regenerate or manually correct `docs/img/architecture.png` using the approved edit prompt so it uses `dispatch_worker`, `project_status`, the authoritative narrow `submit_plan` wording, optional `TODO.md`, acknowledged-hash/dependency semantics, and the bounded default-timeout wording.
8. Regenerate or manually correct `docs/img/supervisors_context.png` using the approved edit prompt so it includes optional `TODO.md`, the bounded default-timeout wording, automatic optional `AGENTS.md` and applicable `STYLE.md` context, one validated immutable result, and MCP only for explicit remote research.
9. If no suitable image-editing capability is available during implementation, retain the source images without presenting them as current architecture, record regeneration in `TODO.md`, and do not block the verified code refactor on an unverified visual edit.
10. Do not restore the deleted root `refactor_plan.png`.

Suggested placements:

- README overview: `docs/img/architecture.png`;
- architecture documentation: `docs/img/supervisors_context.png`.

### Exit criteria

- Documentation describes only behaviour that exists.
- A new user can understand the package without reading TypeScript.

## Phase 10 — Final acceptance

Run all deterministic checks and complete manual acceptance scenarios.

### Tool-surface acceptance

Available:

```text
dispatch_worker
project_status
submit_plan              when Plannotator is enabled
```

Absent:

```text
pi_sych_apply_reconciliation
pi_sych_apply_candidate
pi_sych_retrospective
pi_sych_propose_evidence
pi_sych_challenge_evidence
pi_sych_verify
worker-status tools
```

### Command-surface acceptance

Available:

```text
/pi-sych-status
/plannotator-annotate
/pi-sych-mcp             if retained
```

Absent:

```text
/pi-sych-retro
/pi-sych-init
/pi-sych-drift
/pi-sych-sync
```

Retained:

```text
/plannotator-last
```

### End-to-end scenarios

1. **Uninitialized project**
   - supervisor loads without failure;
   - bootstrap skill proposes files;
   - approved files are written;
   - status reports current acknowledged state.

2. **Changed manuscript**
   - status reports a hash mismatch and dependents;
   - no conceptual drift claim is made;
   - drift-review skill examines relevant files;
   - user chooses the authority where needed;
   - approved edits are made;
   - only reviewed files are acknowledged.

3. **Writing dispatch**
   - worker receives exact task, selected artifact, project `AGENTS.md` if present, `STYLE.md`, and the selected writing skill;
   - unrelated project files and the supervisor transcript are absent;
   - timeout is enforced;
   - result returns to the same supervisor call.

4. **Coding dispatch**
   - worker receives architecture and coding conventions;
   - formatter, linter, type checker, and tests are run by the worker or supervisor as instructed by the skill;
   - tool visibility is not described as sandboxing.

5. **Remote research**
   - ordinary workers have no MCPorter tool;
   - remote-research workers receive only the configured MCPorter bridge;
   - credentials never appear in prompts, artifacts, or logs.

6. **Plan review**
   - `submit_plan` waits for an explicit decision;
   - rejection returns feedback;
   - approval does not start implementation automatically.

7. **Retrospective**
   - invoked explicitly;
   - produces scoped proposals;
   - changes no package or skill file automatically.

8. **Opt-in local usage acceptance**
   - run real Pi calls against disposable dummy projects only when an explicit local environment flag is set;
   - inspect project artifacts and resulting session JSON after the run;
   - require no API keys or network credentials in CI and exclude this suite from default tests;
   - use it when a real-model validation adds value beyond deterministic tests.

### Completion definition

The refactor is complete when:

- the package exposes the minimal active surface;
- all semantic workflows live in skills;
- dispatch is bounded by a 90-second default or an explicit validated override;
- project status is independent of workers;
- project conventions reach every artifact-producing agent;
- documentation matches implementation;
- deterministic tests cover the retained trust boundaries and opt-in local usage tests are available for real Pi/model acceptance;
- the package is smaller, easier to inspect, and no less useful for real workflows.

## 6. Recommended commit sequence

Keep commits reviewable and reversible:

1. `chore: add refactor task ledger`
2. `test: characterize retained pi-sych boundaries`
3. `docs: define minimal target architecture and principles`
4. `refactor: replace supervisor surface with minimal tools`
5. `refactor: add graph-aware project status acknowledgement`
6. `refactor: enforce bounded worker timeouts`
7. `refactor: inject project conventions into worker packets`
8. `skills: migrate bootstrap drift and reconciliation workflows`
9. `skills: add explicit workflow retrospective`
10. `refactor: reduce plannotator to review adapter`
11. `refactor: remove superseded workflow machinery`
12. `docs: align package documentation templates and diagrams`
13. `test: add end-to-end minimal architecture acceptance`
14. `test: add opt-in local Pi usage acceptance`

Do not combine the removal of old behaviour with the creation of its skill replacement in one opaque commit unless the diff remains easily reviewable.
