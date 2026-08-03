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


# README implementation plan

This should be a **moderate restructuring, not a wholesale rewrite**. Preserve the accurate installation commands, six-skill catalogue, command reference, and links. Change the order and framing so a researcher first understands:

1. what problem Pi Sych addresses;
2. what using it looks like;
3. why files and fresh contexts matter;
4. how to try it;
5. how the underlying machinery works.

The current README introduces the architecture image and worker configuration before giving the reader a concrete workflow. Its technical content is useful, but it should move later in the document.

## 1. Scope

### Files to change

```text
README.md
docs/REVIEW_WORKFLOW.md
docs/img/review-edit-workflow.png
```

Optional, only when the demonstration has been recorded:

```text
docs/VIDEO_DEMO.md
```

### Do not change

* Runtime code.
* Tool names or schemas.
* The six public skill names.
* Existing architecture documentation.
* Configuration behaviour.
* The principle that Pi Sych supplies mechanisms rather than enforcing a fixed pipeline.

The package already publishes the `docs` directory, so the new document and image can ship without changing the package file list.

---

# 2. Target README structure

Use this final order:

```markdown
# Pi Sych

Opening pitch

Brief definitions of Pi, supervisor, and worker

## A typical research workflow

## Quick start

## Project files as shared memory

## Why separate contexts?

## What Pi Sych can help with

## Commands you can use

### Tools available to the supervising model

## Optional: enable workers

## How it works

## Limits and responsibilities

## Why I built this

## For supervising models

## Status and contributions

## Detailed documentation
```

This introduces the user experience first and progressively exposes the more technical material.

---

# 3. Replace the opening

Replace the current opening paragraphs and move the architecture image out of the introduction.

## Proposed opening

```markdown
# Pi Sych

Pi Sych is a small Pi package for research, writing, analysis, and code
projects that need to remain understandable beyond a single LLM
conversation.

Long conversations accumulate abandoned ideas, reviewer arguments,
stale assumptions, and decisions that may never leave the chat. Memory
systems can help, but they can also become large, opaque, or another
source of irrelevant context. Pi Sych explores a file-first alternative:
keep durable project knowledge in ordinary documents, give short-lived
workers only the context needed for one task, and leave consequential
decisions with the user.

It is not an autonomous project manager or a hierarchy of persistent
agents. It provides a small set of mechanisms for keeping project state
visible, separating tasks when fresh context helps, reviewing changes
independently, and handing work between people or models without relying
on hidden conversational memory.

Pi Sych is installed as a package for
[Pi](https://pi.dev/). In this README, the **supervisor** is the model in
your main Pi session. A **worker** is a separate, short-lived model
process created for one bounded task.
```

### Why this change

The first three paragraphs should answer:

* What is this?
* Why might a researcher care?
* What does it deliberately not try to become?

Avoid terms such as “agentic operating system,” “revolutionary,”
“production-grade intelligence,” or other marketing language.

---

# 4. Add the user-centred workflow

Insert this immediately after the opening.

```markdown
## A typical research workflow

Pi Sych does not impose a fixed workflow. One useful pattern is to
separate independent review, revision, and verification into fresh
contexts.

1. You write or update a manuscript.
2. The supervisor checks project state and launches an independent
   reviewer with the manuscript, relevant evidence, and a focused brief.
3. You read the findings and decide which to accept, reject, prioritize,
   or clarify.
4. The supervisor launches a fresh edit worker with the accepted
   corrections and only the source context needed to implement them.
5. Another fresh worker verifies the revised manuscript against the
   original evidence and requirements.
6. After you approve the result, Pi Sych can acknowledge the reviewed
   files and identify any dependent files that now require attention.

[![Pi Sych review and edit workflow](docs/img/review-edit-workflow.png)](docs/REVIEW_WORKFLOW.md)

The separation between review and editing is deliberate. Rejected
alternatives and the arguments used to evaluate them do not normally
belong in the writer's context.

Suppose an earlier draft said X. A reviewer recommends Y, and you agree.
A writer exposed to the entire debate may produce:

> Not X, but Y.

A fresh edit worker given the accepted correction can instead produce
the clean statement:

> Y.

See the
[review and revision workflow](docs/REVIEW_WORKFLOW.md)
for the complete example and its limits.
```

### Image prerequisite

Before committing the current diagram, make two wording-only corrections:

* Replace absolute claims such as **“No context leakage”** with:
  **“Review debate and rejected alternatives stay out of the edit
  packet.”**
* Retain the warning:
  **“Context isolation, not a host sandbox.”**

A worker receives no supervisor transcript, but the supervisor still
chooses which files, instructions, tools, skills, and integrations enter
the packet. The documentation should not imply a stronger security
guarantee than the implementation provides.

---

# 5. Simplify the quick start

Rename `## Start here` to `## Quick start`.

Do not ask the user to configure workers immediately. Direct project work
does not require worker setup.

````markdown
## Quick start

Install Pi Sych:

```sh
pi install npm:pi-sych
````

Open a project in Pi and inspect its state:

```text
/pi-sych-status
```

The status command reports tracked files, missing files, declared
dependency impact, project-file problems, and pending review proposals.
It does not decide whether a change is scientifically, conceptually, or
editorially correct.

You can use Pi Sych's project files and skills directly. Separate worker
configuration is required only when you want the supervisor to launch
fresh model processes for bounded tasks.

````

Move the model catalogue and bootstrap instructions into the later
`Optional: enable workers` section.

---

# 6. Add “Project files as shared memory”

Place this after the quick start.

```markdown
## Project files as shared memory

Pi Sych does not treat the conversation transcript as the authoritative
record of a project. Durable information belongs in ordinary files that
a collaborator, another model, or a future session can inspect.

A project can begin with `PROJECT.md` and add other files only when they
become useful.

| File | Typical purpose |
| --- | --- |
| `PROJECT.md` | The objective, accepted direction, definition of done, previous action, and immediate next step. |
| `EVIDENCE.md` | Important claims, sources, quotations, outputs, caveats, and material that may support the artifact. |
| `DECISIONS.md` | Accepted methodological, conceptual, editorial, or architectural decisions and their reasons. |
| `TODO.md` | Open work that has not yet been completed. |
| `STYLE.md` | Stable terminology, spelling, venue conventions, and writing preferences. |
| `SYNC.json` | Mechanical fingerprints, statuses, and declared relationships between files. |
| `INBOX.md` | Unreviewed proposals that have not become authoritative project state. |

These files are not an invitation to document everything. They preserve
the information that another person or model would need to continue the
work without reconstructing it from chat history.

For example, a small manuscript project might contain:

```text
my-paper/
├── PROJECT.md
├── manuscript.qmd
├── EVIDENCE.md
├── DECISIONS.md
├── TODO.md
├── STYLE.md
└── SYNC.json
````

````

The current project objective already describes the intended audience as
scientific writers, researchers, and maintainers who want explicit state,
bounded delegation, truthful verification, and human-owned decisions.
This section makes that design legible to those readers.

---

# 7. Add a plain-language context section

```markdown
## Why separate contexts?

A model can be influenced by everything in its current context window,
including ideas that were considered and rejected. That can be useful
during discussion, but it is not always useful during implementation.

Reviewing and revising a manuscript in one long conversation can cause
the final prose to retain traces of the debate. Rejected alternatives
may reappear as unnecessary qualifications, contrasts, defensive
language, or explanations that the reader never needed.

Pi Sych can instead launch a fresh worker with a deliberately selected
packet:

- the task;
- the expected result;
- the files required for that task;
- the relevant skills and guidance;
- the selected model and tool mode;
- optional integrations;
- a bounded timeout.

The worker does not receive the supervisor transcript. Its result
returns to the supervisor, where the user decides what should happen
next.

This is context isolation, not an operating-system sandbox. The
supervisor still chooses what the worker receives. Depending on the
task, that may include editing tools, Bash, or remote-research tools.
````

Do not over-explain token windows, embeddings, retrieval systems, or
provider-specific implementation details here. Those can be discussed
in detailed documentation if needed.

---

# 8. Reframe the skills section

Rename:

```markdown
## Six public skills
```

to:

```markdown
## What Pi Sych can help with
```

Use this introduction:

```markdown
## What Pi Sych can help with

Skills are reusable guidance for a model, not persistent agents. Pi Sych
initially exposes six broad skills and loads more specific guidance only
when it is relevant.
```

Retain the existing six entries with slightly more accessible wording:

```markdown
- `project` — project state, artifacts, dependencies, decisions, and
  plans;
- `write` — scholarly, professional, instructional, slide, and web
  content;
- `analyze` — quantitative, qualitative, R/Quarto, and reporting work;
- `code` — architecture, testing, Git, npm, and web implementation;
- `review` — structure, evidence, detail, copyediting, code, analysis,
  response, and verification;
- `research` — search, source assessment, synthesis, and citations.
```

Move the precedence and customization details into a short closing
paragraph:

```markdown
Each skill has one level of focused modules containing guidance and
editable examples. Project, user, and packaged versions can override one
another without enlarging the initial public skill catalogue. See
[configuration](docs/CONFIGURATION.md#skill-customization) for the
lookup order and customization paths.
```

---

# 9. Put human commands first

Replace `## Commands and tools` with:

```markdown
## Commands you can use

Human-facing commands:

- `/pi-sych-status` — show mechanical project state;
- `/pi-sych-mcp` — inspect optional MCPorter configuration without
  printing credentials;
- `/plannotator-annotate <project-local-file>` — annotate a file and
  save feedback beside it;
- `/plannotator-last` — annotate the last assistant response and return
  the feedback to the conversation;
- `/plannotator-review` — open Plannotator code review for current
  changes or a pull request.

Plannotator is a human review adapter. It does not add a plan controller,
automatically accept feedback, or promote generated output into project
state.

### Tools available to the supervising model

Pi Sych gives the supervisor two mechanical tools:

- `project_status` checks or acknowledges project state;
- `dispatch_worker` starts one bounded, short-lived worker.

These tools support a workflow; they do not decide what the workflow
must be.
```

---

# 10. Move worker setup into an optional section

````markdown
## Optional: enable workers

Direct work does not require a worker model catalogue. To let the
supervisor launch separate workers, create a private catalogue and
initialize the worker runtime once:

```sh
mkdir -p ~/.config/pi/pi-sych
$EDITOR ~/.config/pi/pi-sych/models.json
node /path/to/pi-sych/scripts/bootstrap-worker-agent-dir.mjs
````

Replace `/path/to/pi-sych` with the package location used by your Pi
installation.

The catalogue contains provider model identifiers and remains outside
the package. Pi Sych does not ship credentials, rank providers, or choose
models for you. The bootstrap operation is explicit and does not
silently modify your home directory during ordinary use.

See [configuration](docs/CONFIGURATION.md) for model roles, worker
directories, canonical paths, skill overrides, and optional remote
research.

````

Keep this section concise. Do not duplicate the complete JSON catalogue
example from `CONFIGURATION.md`.

---

# 11. Move and rewrite the mental model

Move the existing architecture image here.

```markdown
## How it works

![Pi Sych architecture: project state, bounded workers, and human
review](https://unpkg.com/pi-sych@<next-version>/docs/img/architecture.png)

Pi Sych supplies a few mechanical pieces rather than a general
orchestration system:

- **Explicit project state:** `PROJECT.md` records the accepted direction
  and `SYNC.json` records fingerprints and declared dependencies.
- **Mechanical status:** `project_status` reports changed or missing
  files and affected dependants. Human review supplies the meaning.
- **Bounded delegation:** `dispatch_worker` starts one fresh worker with
  an explicit task, context packet, skills, model role, mode, and
  timeout.
- **Small working memory:** compaction retains a bounded summary and may
  place plainly marked proposals in `INBOX.md`.
- **Human review:** Plannotator provides annotation and code-review
  interfaces without becoming a workflow controller.

This is intentionally not an autonomous project manager. It does not
silently turn model output into evidence, citations, release state,
approval, or project truth.
````

Use the actual release number instead of `<next-version>` in the release
commit.

---

# 12. Add limits and responsibilities

```markdown
## Limits and responsibilities

Pi Sych provides context and process boundaries, not proof that an
artifact is correct.

- A changed hash establishes that content changed; it does not establish
  conceptual drift, improvement, or error.
- A successful test establishes only what that test examined.
- A worker result is model-generated output and still requires
  appropriate review.
- Worker modes control which Pi tools are visible. They do not remove
  the worker process's underlying host permissions.
- Remote research and external tools may return incomplete, outdated, or
  incorrect information.
- Human users remain responsible for consequential decisions,
  publication, release, and final approval.

Inspect sources, generated outputs, external results, and package
behaviour before relying on them for consequential work.
```

---

# 13. Add the short history

Place this late in the README, not in the opening.

```markdown
## Why I built this

Pi Sych grew out of my move from OpenCode to Pi. I was attracted to Pi
because its core is small and its extension model leaves room for users
to build the workflow they need.

I did not want to reproduce a large orchestration framework or maintain
a roster of persistent specialist agents. Other extensions already
explore those approaches, and they may be a better fit for people who
want them. I wanted to see how far a smaller set of mechanisms could go:
explicit project files, normal Pi skills, short-lived workers, and human
review.

The project was also shaped by experience with memory systems. Many of
those tools are useful, and Pi Sych is not an argument that they should
not exist. My difficulty was that memories could become large, opaque,
or closely tied to one model and one conversation. Important findings
were not always easy for another researcher, collaborator, or model to
inspect.

Pi Sych therefore treats ordinary files as the durable record. The
conversation remains useful working space, but accepted evidence,
decisions, and project direction should be written somewhere that can be
reviewed and handed over.

This is an experiment in keeping that approach useful without adding
more machinery than the problem appears to require.
```

Check the project name `OpenCode` before committing in case a different
historical reference was intended.

---

# 14. Add a supervisor-facing section

```markdown
## For supervising models

When working in a Pi Sych project:

- inspect project state before substantial work;
- read `PROJECT.md` and only the additional files needed for the task;
- treat accepted project files, rather than conversational recollection,
  as the durable project record;
- work directly unless an independent context would materially improve
  the result;
- give workers the smallest complete packet and no supervisor
  transcript;
- treat changed hashes as evidence of changed content, not semantic
  drift;
- do not treat proposals, generated text, successful checks, or reviewer
  output as human approval;
- report only retrieval, execution, review, and verification that
  actually occurred.

See [architecture](ARCHITECTURE.md) for the complete runtime contract.
```

This gives LLM readers a compact behavioural entry point without turning
the human-facing introduction into a system prompt.

---

# 15. Add a welcoming final section

```markdown
## Status and contributions

Pi Sych is alpha software. Its current design reflects one approach to
organizing long-running LLM-assisted work, and it will not suit every
project.

Issues and contributions are welcome, especially from researchers,
writers, analysts, and maintainers using it outside conventional
software-development workflows.

Useful contributions include:

- clearer documentation and examples;
- improvements to the public skills;
- small reproducible bug reports;
- project templates;
- accessibility improvements;
- reports of where the file-first approach does or does not work well.

See [contributing](CONTRIBUTING.md) before proposing code or release
changes.
```

---

# 16. Replace “Read next” with detailed documentation

```markdown
## Detailed documentation

- [Review and revision workflow](docs/REVIEW_WORKFLOW.md) — a
  user-guided pattern for independent review, clean-context editing, and
  fresh verification;
- [Configuration](docs/CONFIGURATION.md) — private models, worker setup,
  project roots, canonical paths, skill customization, and optional
  integrations;
- [Architecture](ARCHITECTURE.md) — supervisor-facing runtime boundaries
  and mechanical invariants;
- [Development](docs/DEVELOPMENT.md) — checks, tests, style, and design
  constraints for contributors;
- [Contributing](CONTRIBUTING.md) — issues, pull requests, and release
  ownership.
```

Add the video only once it exists:

```markdown
- [Video walkthrough](docs/VIDEO_DEMO.md) — a recorded manuscript review,
  revision, verification, and acknowledgement cycle;
```

Do not commit a dead video link.

---

# 17. Create the detailed workflow document

`docs/REVIEW_WORKFLOW.md` should hold the material that would make the
README too long:

```markdown
# Review and revision workflow

Pi Sych can separate independent review, accepted revisions, and final
verification into fresh worker processes. This is a recommended pattern,
not a runtime-enforced pipeline.

![Pi Sych review and edit workflow](img/review-edit-workflow.png)

## What problem this addresses

Explain context contamination and the X/Y example.

## A typical manuscript cycle

### 1. Write or update the manuscript
### 2. Request an independent review
### 3. Decide what to do with the findings
### 4. Launch a fresh edit worker
### 5. Verify in another fresh context
### 6. Accept and acknowledge

## Selecting tools

Explain read-only, edit, full-host, and optional remote research without
calling them sandboxes.

## Human review tools

Explain the three Plannotator commands and their output paths.

## What isolation does and does not guarantee

Explain fresh processes, explicit packets, no supervisor transcript, and
the remaining responsibility of the supervisor and user.
```

The video runbook can later become either an appendix to this document or
a separate demo document.

---

# 18. Verification plan

After editing:

```sh
npm run markdown:fix
npm run markdown:check
npm run style
git diff --check
```

The package already provides these documentation and style commands.

Then manually check:

* All README links resolve.
* The workflow image renders on GitHub.
* The image is included in `npm pack --dry-run`.
* No future video link is present unless the video exists.
* The README does not imply a mandatory workflow.
* The README defines `Pi`, `supervisor`, `worker`, `skill`, and
  `project_status` before relying heavily on them.
* Worker setup is clearly optional for direct use.
* No section calls tool modes sandboxes.
* No section claims semantic comparison from hashes.
* No section implies automatic approval or promotion.
* The X/Y example appears once in the README; the detailed explanation
  belongs in `docs/REVIEW_WORKFLOW.md`.
* Markdown remains wrapped according to the repository convention.

## Suggested commit sequence

```text
docs: add user-centred review workflow guide
docs: restructure README for research users
docs: add review workflow diagram
docs: format and verify documentation
```

These may be collapsed into one focused documentation commit, but the
agent should not update `SYNC.json`, version numbers, changelog entries,
or published image URLs until the documentation and image are final and
the corresponding release work has been explicitly authorized.


# README plan completion record

Implemented the user-centred documentation structure:

- the opening now defines Pi, supervisor, worker, skill, and
  `project_status` before relying on them;
- the optional research workflow appears before setup and architecture;
- direct-use quick start no longer requires worker configuration;
- project files are explained as selective shared memory;
- context separation, six public skills, human commands, supervisor tools,
  optional workers, mechanics, limits, project history, model guidance,
  contribution paths, and detailed links appear in the planned order;
- `docs/REVIEW_WORKFLOW.md` contains the detailed review, decision, edit,
  verification, acknowledgement, tool-mode, Plannotator, and isolation
  guidance; and
- no video link is present because no recording exists.

Owner instruction supersedes the image-edit prerequisite: no image pixels
are changed. The supplied `docs/img/review_workflow.png` filename is
preserved, documentation links to it, and image issues are recorded in
`~/prompts.md` for later use with an image-capable interface. Pending
confirmation of that filename choice and the owner-history reference to
OpenCode are recorded in `DECISIONS.md`.

## README verification record

Verified after implementation:

- Pandoc formatting, Markdown checks, Biome style, and whitespace checks
  pass;
- all local README/workflow links and fragments resolve;
- Pi and unpkg README targets respond;
- Pandoc renders both documents to HTML;
- the npm dry run contains `docs/REVIEW_WORKFLOW.md` and the supplied
  `docs/img/review_workflow.png`, with no video placeholder;
- worker setup remains optional, the workflow remains explicitly
  non-mandatory, and the README makes no sandbox, semantic-hash, or
  automatic-approval claim; and
- the unchanged runtime passes typecheck, 29 unit tests, 5 integration
  tests, dependency validation, and the 1,650/2,000 source budget.
