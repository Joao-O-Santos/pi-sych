# Deep code-quality review — Pi Sych v4.0.1

## Verdict

**Keep the v4 architecture. Request a focused correctness pass before considering the simplification finished.**

Pi Sych is no longer overengineered at the architectural level. Its public model-facing surface is now only:

```text
dispatch_worker
project_status
```

The runtime has no workflow controller, worker registry, semantic reconciliation engine, automatic planning phase, model-ranking machinery, or generic agent DAG. Production TypeScript is recorded at approximately 1,550 lines under a 2,000-line limit.

The main problem is different:

> **The v4 subtraction removed too much defensive behavior and too much test coverage in a few places.**

The correct response is not to restore v3’s machinery. It is to repair several narrow invariants while retaining the current two-tool architecture.

### Overall assessment

| Area                     | Assessment                              |
| ------------------------ | --------------------------------------- |
| Public architecture      | Strongly minimal                        |
| Worker boundary          | Conceptually strong                     |
| Project-state model      | Good, with several correctness gaps     |
| Compaction               | Over-broad despite short code           |
| Test suite               | Too shallow for the runtime it protects |
| Optional integrations    | Appropriately isolated                  |
| Documentation            | Generally clear, with some drift        |
| Need for another rewrite | No                                      |

## What v4 gets right

### 1. The public surface is genuinely small

The workbench exposes two agent tools and five human commands. Plannotator remains human-facing; MCPorter is added only to explicitly requested remote-research workers. This is a substantially cleaner boundary than earlier versions.

Do not add back:

* `submit_plan`;
* candidate-application tools;
* semantic-drift tools;
* evidence wrapper tools;
* verification wrapper tools;
* a worker-status API;
* plan-mode state;
* automatic orchestration.

Explicit owner approval in normal conversation or a reviewed Markdown file is sufficient.

### 2. The worker lifecycle is structurally sound

Workers are short-lived Pi processes with:

* an explicit capability mode;
* a selected model role;
* selected context files and skills;
* an optional timeout;
* no supervisor transcript;
* one immutable terminal result;
* acceptance only after a clean process exit.

The temporary result directory is removed after each call, and result submission uses exclusive file creation. These are useful mechanical invariants without creating a persistent execution framework.

### 3. Model selection is refreshingly literal

The catalog maps user-defined role names directly to model identifiers. The runtime performs exact lookup rather than adding scoring, fallback chains, capability taxonomies, or provider-specific policy.

That is the correct level of abstraction.

### 4. Project status remains mechanical

`project_status` correctly separates:

* fingerprint changes;
* missing files;
* declared direct and transitive impact;
* persisted review state;
* conceptual interpretation.

It does not claim that a changed hash establishes drift, authority, or correctness. Acknowledgement atomically replaces the manifest and marks affected dependents for review.

### 5. The optional integrations are narrow

Plannotator is lazy-loaded through one local adapter rather than activated as a complete Pi extension. MCPorter is loaded only for a worker explicitly marked for remote research.

Those boundaries should remain.

---

# High-priority findings

## 1. Compaction is the least minimal part of the runtime

The compactor currently reads:

* every configured canonical path;
* every tracked artifact;
* every file as UTF-8;
* all file contents without a size limit;
* the serialized compacted conversation;
* the previous summary;
* the complete project-status object.

It then serializes the whole packet into one model request.

This creates several problems.

### It treats `INBOX.md` as canonical input

`Object.values(project.canonical)` includes the inbox path. The README explicitly says `INBOX.md` contains unreviewed proposals and is never canonical state. Yet the compactor passes it to the model under the heading “Canonical files.”

That can cause rejected, stale, or speculative proposals to re-enter working memory and be proposed again.

### It loads irrelevant artifacts instead of merely retaining their paths

A tracked PDF, generated HTML document, dataset, image, lockfile, or large source file is read as UTF-8 and inserted into the prompt. Failure to decode meaningfully may not throw; it can instead produce useless text and consume context.

### It has no byte or token boundary

A single large manuscript or data artifact can make custom compaction more expensive and less reliable than the context it is meant to reduce.

### Minimal correction

Do not build a richer snapshot framework. Reduce the inputs:

```text
previous summary
+ compacted conversation
+ PROJECT role, when present
+ TODO role, when present
+ concise project-status projection
+ paths of changed or relevant artifacts
```

Optionally include `DECISIONS` when small and directly relevant. Do not include:

```text
INBOX contents
all tracked artifact contents
binary/generated artifacts
all optional canonical files by default
```

Use one small helper with:

* a text-file allowlist;
* a per-file byte cap;
* a total byte cap;
* truncation reported explicitly.

This should make the compactor both smaller conceptually and cheaper operationally.

## 2. The test suite was simplified more aggressively than the runtime

The current worker-engine tests verify result validation, model lookup, and immutable writing. They no longer exercise the actual dispatcher lifecycle.

Missing deterministic coverage includes:

* timeout;
* cancellation before launch;
* cancellation during execution;
* `SIGTERM` followed by forced `SIGKILL`;
* spawn failure;
* nonzero exit;
* a valid result followed by abnormal exit;
* missing result;
* malformed result;
* exact tool surfaces by mode;
* remote-research tool exposure;
* context resolution;
* temporary-directory cleanup.

The current project-status suite has one combined happy-path test.

The project-files suite has four small tests, and the public-surface suite largely checks source strings.

This is not useful minimalism. Test code does not enlarge the runtime, tool surface, package mental model, or model context.

### Minimal correction

Restore tests, not abstractions.

A focused suite should cover:

1. Worker process outcomes.
2. Compaction bounds and fallback.
3. Nested/custom project roots.
4. Configured canonical paths.
5. Acknowledgement races.
6. Malformed manifests and inboxes.
7. Integration startup with and without private configuration.

Mocks and tiny fake launchers are sufficient. Do not rebuild old test utilities or elaborate fixture frameworks.

## 3. Configured canonical instruction files are not supervisor instructions

Workers automatically receive the configured `agents` and `style` paths. The supervisor does not.

The `before_agent_start` handler only injects static Pi Sych guidance and the model catalog. It no longer loads configured canonical `AGENTS.md` or `STYLE.md` paths.

Pi itself conventionally discovers `AGENTS.md` in its normal context-file locations, but it cannot infer that a manifest entry such as:

```json
{
  "canonical": {
    "agents": "state/PROJECT-AGENTS.md"
  }
}
```

is an instruction file. Pi’s conventional agent directory also defaults to `~/.pi/agent`; custom Pi Sych canonical paths are a separate concept.

The result is an inconsistent architecture:

```text
worker sees configured project instructions
supervisor may not see them
```

### Minimal correction

Add one helper during `before_agent_start`:

1. Resolve the project.
2. Read configured `agents` if it exists and is not already loaded.
3. Inject it with a clear label.
4. Do not automatically inject every canonical file.
5. Add style only when there is a defensible always-on policy—or leave it on demand.

This is a small, direct bridge between the manifest role and Pi’s system context.

## 4. Documented external canonical paths conflict with path enforcement

Configuration documentation says canonical paths may be absolute and point outside the project root.

However, `resolveExistingProjectPath()` resolves the real filesystem target and rejects anything outside the project root. This also rejects a project-local symlink to an external file.

The unit test explicitly protects that rejection.

This is internally inconsistent and works against the project’s stated rejection of path-based pseudo-security.

### Minimal correction

Use two distinct rules:

* **User-supplied relative artifact paths:** lexically require them to remain inside the project root.
* **Explicit configured canonical paths:** trust the manifest’s resolved absolute path and require only existence/readability.

Do not attempt to turn path containment into a sandbox. Worker modes already state that they are not sandboxes.

---

# Medium-priority findings

## 5. Status calculates errors that its human output hides

`checkProjectStatus()` records:

* `missingCore`;
* `projectErrors`.

The formatter does not display either. A malformed or structurally incomplete project brief can therefore be present in tool details but absent from the text the model and user primarily see.

### Minimal correction

Add two conditional sections:

```text
Missing project files:
- ...

Project-file problems:
- ...
```

No new status type or diagnostics system is needed.

## 6. Acknowledgement can record an obsolete fingerprint

Acknowledgement first performs a status check, stores current fingerprints in memory, and later writes those fingerprints to `SYNC.json`. A selected file can change between those operations. Atomic manifest replacement prevents a partially written JSON file, but it does not prevent acknowledging a stale observation.

### Minimal correction

Immediately before writing:

1. Re-fingerprint each selected file.
2. Compare it with the fingerprint observed during the check.
3. Abort when it changed.

A second manifest-read check against `confirmedAt` would also prevent overwriting a concurrent acknowledgement, but the file recheck is the essential fix.

## 7. Worker-reported files are trusted without validation

A worker result’s `files` field is validated only as an array of strings. Paths are not required to:

* be relative;
* remain within the project;
* exist;
* correspond to actual changes.

The project brief says workers should report unexpected changes, but v4 removed the before/after change inspection that could establish them.

### Minimal correction

Choose an honest narrow contract.

At minimum:

* rename the semantic concept to “worker-reported files” in documentation;
* reject absolute and escaping paths;
* verify that each reported file exists.

When unexpected-change detection is important, use one Git status snapshot before and after an `edit` or `full-host` worker and report the delta. Do not restore persistent run records, file manifests, or mutation locks.

## 8. The model catalog is required too early

`loadModelCatalog()` throws when its private file is missing or invalid. The workbench calls it during every `before_agent_start`, even when the user intends to work directly or call only `project_status`.

The integration test called “loads without private configuration” only retrieves commands. It does not start an agent turn and therefore does not exercise this failure path.

### Minimal correction

Make catalog loading lazy:

```text
before_agent_start:
  inject model roles only when catalog exists

dispatch_worker:
  require and validate catalog
```

This preserves a useful setup error at the point where workers are requested without making the whole workbench dependent on worker configuration.

## 9. Worker bootstrap is implicit and contains apparently dead configuration

The bootstrap script creates the isolated worker agent directory and links supervisor authentication and model files. The live usage test calls this helper explicitly.

I found no installation hook or clear user-facing setup step that guarantees the default worker directory has been bootstrapped.

The script also writes a hardcoded `mcporter.json` naming Context7, OpenAlex, and Scholar Gateway. Worker launch instead sets `MCPORTER_CONFIG` to the separate Pi Sych MCP config path, making the generated file appear unused.

### Minimal correction

* Remove the generated worker `mcporter.json`.
* Document one explicit bootstrap command.
* On dispatch, detect an uninitialized worker directory and return that exact command.
* Do not add a post-install mutation or background setup process.

## 10. Plannotator code-review feedback uses the launch directory

File annotation resolves against the declared project root. Code-review feedback is written to:

```ts
resolve(ctx.cwd, "PLANNOTATOR_REVIEW.md")
```

When Pi is launched from a nested source directory, review feedback lands there rather than at the resolved project root.

### Minimal correction

Resolve the project once and write:

```text
<projectRoot>/PLANNOTATOR_REVIEW.md
```

---

# Smaller simplification opportunities

## 11. Inbox counting is format-fragile

`pendingPromotions()` counts newline characters rather than proposal entries. Blank lines, headings, commentary, or a missing final newline distort the count.

Count lines matching the actual proposal prefix instead:

```regex
^- \{(?:project|agents|personal-agents|style|evidence|decisions|todo)\}\s+
```

Also create the inbox parent directory before appending and ensure separation from pre-existing content.

## 12. The smoke test duplicates an integration test

The smoke script simply runs `tests/integration/package-load.test.mjs` again.

Either:

* delete the separate smoke command; or
* make it test an installed package tarball rather than the source checkout.

The first option is more consistent with the project’s current minimalism.

## 13. The migration-ledger test forces full Git history into CI

The skills test reads the complete file list from the historical `v1.2.0` tag. CI consequently requires `GIT_DEPTH: "0"`.

This makes a unit test depend on repository history and enlarges every CI checkout.

### Minimal correction

Check in the expected historical skill-name list as a small fixture beside the ledger. The important invariant is that every accepted source skill has a destination—not that each CI run re-derives history from Git.

Then remove the full-history requirement.

## 14. Release metadata needs a small cleanup

The v4.0.1 changelog section is labelled `v4.0.0`, producing two consecutive v4.0.0 headings. The 4.0.1 package metadata also still references the 4.0.0 image URL.

Neither affects runtime correctness, but fixing them would keep release state literal and inspectable.

---

# Recommended v4.0.2 scope

## Production changes

1. Bound compaction inputs and exclude the inbox.
2. Load configured project-agent instructions for the supervisor.
3. Reconcile canonical absolute/symlink path behavior with the documentation.
4. Display project validation and missing-core findings.
5. Re-fingerprint files during acknowledgement.
6. Validate worker-reported paths.
7. Load the model catalog lazily.
8. Resolve Plannotator review output from the project root.
9. Harden simple inbox append/count behavior.
10. Remove the unused generated MCPorter configuration.

This should remain comfortably under the existing 2,000-line cap. A modest net increase is acceptable when it restores correctness. Avoid compressing code into dense one-line expressions merely to protect a round-number budget.

## Test changes

Add deterministic tests for:

* worker termination and failure outcomes;
* bounded compaction;
* inbox exclusion;
* nested inbox creation;
* configured agent injection;
* external canonical files and symlinks;
* acknowledgement races;
* missing model catalog during direct work;
* nested-root Plannotator output;
* worker-reported path validation.

Test growth is not architectural growth.

## Explicit non-goals

Do not introduce:

* another major version;
* a workflow controller;
* planning state;
* persistent worker records;
* a generic event bus;
* a configuration abstraction over `SYNC.json`;
* a repository class;
* dependency injection throughout the package;
* a validation library;
* an internal logging framework;
* automatic semantic reconciliation.

# Final assessment

Pi Sych v4 has reached the right architectural shape:

```text
small supervisor surface
+ explicit project state
+ bounded clean workers
+ skills for semantic procedure
+ optional narrow integrations
+ human-owned decisions
```

The package is **not broadly overengineered anymore**.

Its main weakness is that the drive to minimize line count also minimized safeguards and tests that did not contribute to conceptual complexity. The next pass should therefore follow this rule:

> **Delete concepts, not evidence. Keep the runtime small, but test every process, path, and persistence boundary it still owns.**

The appropriate next release is this focused correctness and deletion pass—not another redesign.

# Completion record

Implemented for the `v4.0.3` release candidate:

- bounded compaction snapshots and explicit inbox exclusion;
- supervisor injection of configured project instructions;
- lazy model-catalog loading and explicit worker bootstrap diagnostics;
- lexical project-local paths with ordinary symlink behavior;
- visible project validation errors and acknowledgement rechecks;
- worker-reported path validation and lifecycle tests;
- project-root Plannotator review output;
- robust inbox creation/counting;
- removal of duplicate smoke execution and Git-history-dependent ledger
  discovery; and
- rewritten user, supervisor, and contributor documentation.

Existing release tags remain immutable. The final gate passed, signed
`v4.0.3` was pushed, GitLab published the matching npm version, and the
published package image now resolves.
