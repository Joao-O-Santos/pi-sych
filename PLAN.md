# Pi Sych Modular Skills Refactor

## 1. Objective

Refactor Pi Sych into a smaller, clearer system built around six visible umbrella skills:

* `project`
* `write`
* `analyze`
* `code`
* `review`
* `research`

Each umbrella skill will contain its invariant guidance directly in `SKILL.md`. More specialized guidance will live in one-level modules loaded only when relevant.

The refactor will also:

* make substantive review independent by default;
* prefer independent test authorship before substantive code implementation;
* add minimal software-architecture guidance based on Unix-style simplicity and composability;
* make Pi Sych capable of consulting its own installed documentation;
* keep terminal responses concise;
* use `submit_plan` for long or consequential plans;
* provide a file-based `submit_plan` fallback when browser review is unavailable;
* remove a small amount of duplicated TypeScript;
* update documentation, tests, diagrams, and examples for the new architecture.

Because the old visible skill names will be removed, this should be released as Pi Sych `2.0.0`.

---

# 2. Final skill architecture

```text
skills/
├── project/
│   ├── SKILL.md
│   └── modules/
│       ├── bootstrap/
│       │   ├── guidance.md
│       │   └── examples.md
│       ├── artifacts/
│       │   ├── guidance.md
│       │   └── examples.md
│       ├── status/
│       │   ├── guidance.md
│       │   └── examples.md
│       ├── reconcile/
│       │   ├── guidance.md
│       │   └── examples.md
│       ├── plans/
│       │   ├── guidance.md
│       │   └── examples.md
│       ├── pi-sych/
│       │   ├── guidance.md
│       │   └── examples.md
│       └── retrospective/
│           ├── guidance.md
│           └── examples.md
│
├── write/
│   ├── SKILL.md
│   └── modules/
│       ├── academic/
│       ├── empirical/
│       ├── theoretical/
│       ├── theory/
│       ├── sections/
│       ├── style/
│       ├── book/
│       ├── grant/
│       ├── slides/
│       └── web/
│
├── analyze/
│   ├── SKILL.md
│   └── modules/
│       ├── quantitative/
│       ├── qualitative/
│       ├── r-quarto/
│       └── reporting/
│
├── code/
│   ├── SKILL.md
│   └── modules/
│       ├── architecture/
│       ├── testing/
│       ├── git/
│       ├── npm/
│       └── web/
│
├── review/
│   ├── SKILL.md
│   └── modules/
│       ├── structure/
│       ├── evidence/
│       ├── detail/
│       ├── copyedit/
│       ├── code/
│       ├── analysis/
│       ├── response/
│       └── verification/
│
└── research/
    ├── SKILL.md
    └── modules/
        ├── search/
        ├── sources/
        ├── synthesis/
        └── citations/
```

Every module directory contains:

```text
guidance.md
examples.md
```

The omitted module contents in the tree above follow that same structure.

There will be exactly six indexed Pi Sych skills. The existing hidden `workflow-retrospective` skill will become `project/modules/retrospective/`, so it remains absent from the initial skill catalog while still being available through the `project` skill when explicitly relevant.

---

# 3. Module behavior

## 3.1 Invariant guidance

Rules that apply every time a skill is used belong directly in its `SKILL.md`.

For example, `write/SKILL.md` should contain:

* begin from purpose, audience, and intended contribution;
* preserve global coherence;
* distinguish evidence, interpretation, inference, and authorial choice;
* never invent facts, citations, quotations, requirements, or results;
* prefer the smallest complete structure;
* load only the modules relevant to the task.

It should not place those rules in a separate `core.md`, because they are not optional.

## 3.2 Conditional guidance

A module is selected only when its specialization applies.

For example:

```text
Empirical discussion section
→ write/SKILL.md
→ modules/academic/guidance.md
→ modules/academic/examples.md
→ modules/empirical/guidance.md
→ modules/empirical/examples.md
→ modules/sections/guidance.md
→ modules/sections/examples.md
```

The umbrella `SKILL.md` must give exact paths.

Modules do not route to other modules. The worker reads the set selected by the umbrella skill and then begins the task.

## 3.3 Example files

Each module ships with a concise `examples.md`.

These files serve two purposes:

1. provide useful default demonstrations;
2. give users one obvious file to customize without editing the underlying guidance.

Examples may include:

* representative inputs and outputs;
* accepted and rejected structures;
* characteristic writing samples;
* preferred coding patterns;
* review findings and prioritization;
* analysis interpretations;
* project-state examples.

Default examples should be curated from:

* useful examples already present in the current skills;
* suitable material from the user’s dotfiles;
* small new examples needed to cover gaps.

The dotfiles are an implementation source, not a runtime dependency.

Documentation should explain that users can customize examples by copying an umbrella skill into either:

```text
~/.pi/agent/skills/
```

or:

```text
.pi/skills/
```

and editing only the relevant `modules/*/examples.md` files.

No examples database, synchronization process, installer hook, or preference-management code is required.

## 3.4 Suggested size budgets

These are design targets rather than rigid limits:

| Content                      |           Target |
| ---------------------------- | ---------------: |
| All six visible descriptions | ≤100 words total |
| Pi Sych supervisor guidance  |       ≤140 words |
| Umbrella `SKILL.md`          |    250–500 words |
| Module `guidance.md`         |    250–800 words |
| Module `examples.md`         |    100–500 words |

Longer files are acceptable when the content genuinely requires them, but duplication should be moved upward or removed.

---

# 4. Visible skill catalog

The supervisor should initially see approximately:

```yaml
project: Use and maintain Pi Sych projects, state, artifacts, dependencies, and decisions.

write: Draft and revise scholarly, professional, instructional, presentation, and web content.

analyze: Conduct reproducible quantitative, qualitative, statistical, and data-centred analysis.

code: Design, implement, test, maintain, and release software.

review: Independently evaluate artifacts for correctness, structure, evidence, clarity, and risk.

research: Retrieve, assess, and synthesize sources with explicit limitations.
```

These descriptions are short, but each identifies a distinct operation.

---

# 5. Existing skill migration

## `project`

| Existing skill           | New location                     |
| ------------------------ | -------------------------------- |
| `bootstrap-project`      | `project/modules/bootstrap/`     |
| `project-briefing`       | `project/modules/bootstrap/`     |
| `project-initialization` | `project/modules/bootstrap/`     |
| `artifact-workflow`      | `project/modules/artifacts/`     |
| `artifact-to-project`    | `project/modules/artifacts/`     |
| `canonical-to-artifact`  | `project/modules/artifacts/`     |
| `project-status-review`  | `project/modules/status/`        |
| `drift-review`           | `project/modules/reconcile/`     |
| `reconcile-project`      | `project/modules/reconcile/`     |
| `workflow-retrospective` | `project/modules/retrospective/` |

### `project/SKILL.md`

Its invariant guidance should establish that:

* project state remains explicit and inspectable;
* accepted, provisional, inferred, and unresolved content remain distinguishable;
* mechanical state is not semantic judgment;
* project files are created only when they serve a real purpose;
* consequential decisions remain human-owned;
* project artifacts should remain synchronized through review rather than automatic authority.

### Project modules

**`bootstrap`**

Create or reconstruct explicit project state from user input or existing artifacts.

**`artifacts`**

Move between canonical project state and manuscripts, reports, presentations, repositories, or other deliverables.

**`status`**

Interpret `project_status`, fingerprints, declared dependencies, changed files, and review implications.

**`reconcile`**

Diagnose and resolve meaningful disagreement among project files and artifacts.

**`plans`**

Create concise, reviewable implementation or project plans and submit them for human review.

**`pi-sych`**

Consult the installed Pi Sych documentation when answering questions about installation, configuration, behavior, architecture, extension, or maintenance.

**`retrospective`**

Review a completed workflow for reusable lessons without automatically modifying project rules or instructions.

---

# 6. Pi Sych self-documentation

The extension should add one runtime-resolved documentation pointer to the supervisor guidance:

```text
For Pi Sych questions, read <PACKAGE_ROOT>/README.md and its linked documentation before answering.
```

`<PACKAGE_ROOT>` should be replaced with the actual installed package path.

The project module should contain:

```text
project/modules/pi-sych/guidance.md
project/modules/pi-sych/examples.md
```

`guidance.md` should direct the model to:

* `README.md` for normal use and project concepts;
* `docs/CONFIGURATION.md` for configuration and model profiles;
* `ARCHITECTURE.md` for runtime and design;
* `docs/DEVELOPMENT.md` for implementation;
* `AGENTS.md` for maintainer conventions.

It should instruct the model to:

* answer from the installed version;
* distinguish current behavior from proposals;
* prefer user-facing explanations unless internals are requested;
* provide the smallest useful example;
* avoid reproducing documentation from memory when the installed files are available.

`examples.md` can contain representative help questions and appropriately concise answers.

---

# 7. Writing architecture

## `write/SKILL.md`

The invariant writing guidance lives directly here.

It should route tasks as follows:

| Task                                     | Modules                                                              |
| ---------------------------------------- | -------------------------------------------------------------------- |
| General scholarly paper                  | `academic`                                                           |
| Empirical paper                          | `academic`, `empirical`                                              |
| Theoretical paper                        | `academic`, `theoretical`                                            |
| Theory development                       | `theory`                                                             |
| Specific manuscript section              | `academic`, `sections`, plus applicable empirical/theoretical module |
| Style application or calibration         | `style`                                                              |
| Book or tutorial                         | `book`                                                               |
| Grant                                    | `grant`                                                              |
| Presentation                             | `slides`                                                             |
| Website copy or information architecture | `web`                                                                |

## Module contents

**`academic`**

Contribution visibility, scholarly argument, evidence discipline, manuscript-level coherence, and appropriate section functions.

**`empirical`**

Design-to-claim alignment, methods, results, uncertainty, alternative explanations, limitations, and discussion.

**`theoretical`**

Construct clarity, mechanisms, assumptions, scope conditions, competing explanations, implications, and contribution.

**`theory`**

Generation and refinement of theory, mechanisms, conceptual distinctions, hypotheses, and explanatory alternatives.

**`sections`**

Guidance for abstracts, introductions, literature reviews, methods, results, discussions, conclusions, and transitions.

**`style`**

Style calibration, precedence among user/project/genre conventions, sentence-level application, and preservation of voice.

**`book`**

Reader progression, prerequisites, chapter architecture, examples, exercises, and durable navigation.

**`grant`**

Call compliance, reviewer navigation, intellectual contribution, feasibility, work plan, and risk mitigation.

**`slides`**

Narrative sequence, slide density, presentation structure, Reveal.js conventions, and render checking.

**`web`**

Audience, page purpose, hierarchy, navigation, web prose, calls to action, and information architecture.

Website implementation remains a coding concern; website content and structure remain a writing concern.

---

# 8. Analysis architecture

## `analyze/SKILL.md`

Invariant guidance should require:

* traceability from inputs through transformations to conclusions;
* distinction between exploratory and confirmatory work;
* explicit assumptions and uncertainty;
* alignment among code, prose, tables, figures, and reported numbers;
* interpretation rather than uncritical repetition of software output;
* reproducibility proportionate to the task.

## Modules

**`quantitative`**

Estimands, statistical assumptions, diagnostics, uncertainty, robustness, effect interpretation, and claim calibration.

**`qualitative`**

Research question, sampling, coding, reflexivity, negative cases, auditability, interpretation, and scope.

**`r-quarto`**

R project workflow, project-native checks, package conventions where relevant, Quarto rendering, and prose-code-output alignment.

**`reporting`**

Tables, figures, numerical reporting, result summaries, uncertainty language, and movement from analysis to defensible claims.

R used to analyze data belongs under `analyze`. R package or software development belongs under `code`.

---

# 9. Coding architecture

## `code/SKILL.md`

The invariant coding guidance should require:

* recover or define the accepted behavior before implementation;
* inspect existing interfaces and project conventions;
* prefer the smallest coherent change;
* preserve working interfaces unless change is intentional;
* verify through project-native checks;
* report only checks actually run;
* use independent test authorship for substantive behavior changes;
* use independent review for consequential code changes.

## `architecture` module

This module should counter the tendency of frontier models to over-engineer.

Its defaults should draw from Unix philosophy and practical minimalism:

* simple components with clear purposes;
* composable interfaces;
* explicit data flow;
* separation of mechanism from policy;
* plain files and existing operating-system facilities where sufficient;
* reuse of existing Pi capabilities before adding infrastructure;
* minimal dependencies and hidden state;
* no speculative abstraction without a demonstrated second use;
* defensive behavior proportional to plausible risk;
* maintainability and inspectability over architectural novelty;
* deletion or simplification before expansion.

The module should not mechanically force every program into pipes or tiny executables. It should use Unix principles as a bias toward simplicity, not as a substitute for judgment.

Its `examples.md` should contrast:

* a small direct solution;
* an unnecessarily layered alternative;
* the conditions under which the extra layer would become justified.

## `testing` module

For substantive behavior-changing code:

1. establish the accepted external behavior;
2. dispatch an independent worker to write tests first;
3. confirm that the tests fail for the expected reason;
4. review the tests before implementation;
5. implement the minimum coherent change;
6. do not weaken accepted tests merely to obtain a pass;
7. run project-native formatting, linting, type checking, tests, and relevant integration checks;
8. dispatch an independent reviewer for the resulting code and tests.

A separate test-writing worker is usually unnecessary for:

* documentation-only work;
* formatting-only changes;
* exploratory spikes;
* tiny refactors already covered by adequate tests;
* changes that cannot meaningfully be expressed through automated tests.

Test-writing and implementation workers should not edit the same checkout concurrently.

Independent read-only test design and architecture analysis may run in parallel before edits begin.

## Other code modules

**`git`**

Atomic changes, reviewable history, branch use when justified, safe shared-history behavior, and truthful verification before commit.

**`npm`**

Package metadata, tarball inspection, versioning, provenance, publication, and post-publish checks.

**`web`**

Web application architecture, frontend/backend boundaries, accessibility, browser behavior, build systems, and deployment-related implementation.

Users may add language- or framework-specific skills at user or project scope without changing Pi Sych.

---

# 10. Review architecture

## Independent review policy

Substantive review of work created or materially revised in the current session should default to an independent read-only worker using a strong suitable model.

The reviewer should receive:

* the artifact;
* accepted requirements;
* relevant project state;
* relevant domain skill;
* the `review` skill;
* only necessary contextual material.

The reviewer should not be primed with the expected verdict or the supervisor’s preferred solution.

The supervisor may perform:

* mechanical checks;
* trivial local inspection;
* integration of independent findings;
* final communication with the user.

Independent review remains advisory. Consequential decisions remain human-owned.

## `review/SKILL.md`

Invariant guidance should require the reviewer to:

* diagnose before proposing;
* distinguish defects from preferences;
* prioritize findings by consequence;
* identify uncertainty and missing evidence;
* avoid redesigning the artifact unless architecture is the review target;
* recommend the smallest credible response;
* keep copyediting subordinate to substantive correctness and structure.

## Modules

**`structure`**

Organization, argument sequence, contribution visibility, navigation, interfaces, and component boundaries.

**`evidence`**

Claims, sources, assumptions, evidence quality, alternatives, unsupported inference, and traceability.

**`detail`**

Internal consistency, edge cases, conceptual precision, statistical or logical red flags, and local defects.

**`copyedit`**

Grammar, terminology, sentence clarity, consistency, and minimum local correction.

**`code`**

Correctness, maintainability, failure handling, interfaces, tests, security implications, and unnecessary complexity.

**`analysis`**

Quantitative and qualitative methods, assumptions, interpretation, reporting, and claim alignment.

**`response`**

Turn accepted findings into one coherent revision or implementation strategy without accepting every suggestion automatically.

**`verification`**

Check the finished artifact against accepted requirements, deterministic checks, scope, coherence, and approval boundaries.

---

# 11. Research architecture

## `research/SKILL.md`

Invariant guidance should include:

* inspect local material first;
* retrieve external material only when needed;
* distinguish search results from evidence;
* assess source quality and relevance;
* record important limitations;
* cite claims truthfully;
* avoid overstating coverage or consensus.

## Modules

**`search`**

Question decomposition, search strategy, query iteration, local-versus-remote retrieval, and stopping criteria.

**`sources`**

Authority, methodological quality, recency, primary versus secondary evidence, conflicts, and retraction or correction status.

**`synthesis`**

Comparison, uncertainty, disagreement, calibrated conclusions, and separation of evidence from interpretation.

**`citations`**

Citation checking, provenance, claim-to-source alignment, quotation accuracy, and reporting retrieval limitations.

---

# 12. Revised supervisor guidance

The always-visible Pi Sych addition should remain short:

```text
Pi Sych is a small mechanical substrate; skills and humans own semantic judgment.

Keep replies concise. Put consequential or lengthy plans in a project-local Markdown file and call submit_plan.

Work directly unless an independent context would materially improve the result. Substantive review of work produced in this session defaults to an independent read-only worker using a strong suitable model; do not prime its verdict.

Parallel workers must have independent tasks. Workers sharing a checkout do not edit concurrently.

Use project_status for mechanical state; changed content is not conceptual drift.

Read applicable project conventions before editing.

For Pi Sych questions, read <PACKAGE_ROOT>/README.md and its linked documentation.

dispatch_worker defaults to 90 seconds; choose context, skills, model, and timeout deliberately.

Worker modes are not sandboxes. Report only work actually performed.
```

The exact wording may be tightened during implementation, but the final version should remain within the agreed prompt budget.

The detailed test-first workflow belongs in `code/SKILL.md`, not in the always-visible system guidance.

---

# 13. `submit_plan` and Plannotator fallback

## 13.1 Stable tool contract

`submit_plan` remains a core Pi Sych tool.

The supervisor:

1. writes a project-local Markdown plan;
2. calls `submit_plan` with that file;
3. waits for human feedback;
4. does not begin implementation merely because the plan was submitted.

## 13.2 Browser review

When Plannotator is available:

* open the Markdown plan in the browser;
* wait for approval or requested revisions;
* return feedback to the supervisor;
* keep the terminal response brief.

This preserves the current browser-review experience.

## 13.3 File-review fallback

When Plannotator is unavailable or cannot start:

* keep the plan file in the project;
* return a structured pending result;
* give the user one concise instruction:

```text
Plan ready at PLAN.md. Review or edit it, then reply with your comments and @PLAN.md.
```

The supervisor then stops. It does not implement while file review is pending.

A later user message referencing the plan file resumes the workflow.

Suggested result details:

```ts
type PlanSubmissionResult =
  | {
      mode: "browser";
      approved: boolean;
      feedback?: string;
      savedPath: string;
    }
  | {
      mode: "file";
      pending: true;
      savedPath: string;
    };
```

Plannotator can be moved to an optional package dependency if this remains clean with the package manager. Regardless of dependency classification, `submit_plan` must function correctly when the Plannotator module cannot be loaded.

Plannotator-specific commands should return a short, accurate unavailable message when the optional integration is absent.

## 13.4 Long-output behavior

The supervisor guidance and `project/modules/plans/` should establish:

* brief explanations and small plans may remain inline;
* long, consequential, or highly structured plans should be written to Markdown;
* the terminal should contain only a short summary and the review action;
* browser review is preferred when available;
* file review is the automatic fallback.

---

# 14. Targeted TypeScript cleanup

The code cleanup should remain narrower than the skill refactor.

## Shared validation

Extract the small validation operations currently repeated across runtime modules:

```ts
nonEmptyString(value, label)
stringArray(value, label)
```

Domain-specific validation remains in its domain module.

## Project-local paths

Use one canonical implementation for:

* resolving project-relative files;
* rejecting paths outside the project;
* optionally requiring that the file exists;
* returning either an absolute or project-relative form as needed.

Use it for Plannotator files, plan files, worker context files, and similar project-local operations.

## Bounded output

Use one small shared function for truncating tool-visible output while keeping each tool’s formatting local.

## Result formatting

Consolidate the repeated “label plus values or none” pattern where it already has identical semantics.

These changes should reduce duplication without introducing a broad utility framework or changing runtime behavior.

---

# 15. Test-first implementation of the refactor

## Independent characterization worker

Before moving skill files, dispatch an independent test worker with the target architecture and current repository.

That worker writes tests for:

* exactly six visible Pi Sych skills;
* accepted names and descriptions;
* existence of each routed module;
* existence of `guidance.md` and `examples.md` in every module;
* absence of skill frontmatter in module files;
* absence of module-to-module routing;
* presence of invariant guidance in each umbrella skill;
* runtime-resolved Pi Sych documentation pointer;
* supervisor prompt budget;
* independent review policy;
* concise-plan policy;
* file-based `submit_plan` fallback.

The tests should fail against the current architecture for expected reasons.

## Implementation

The implementation worker then performs the migration against those accepted tests.

The tests should not be weakened during implementation unless they are shown to contradict an accepted architectural decision.

## Independent final review

After implementation, dispatch independent reviewers for:

1. skill content and migration completeness;
2. TypeScript and runtime behavior;
3. documentation and user experience;
4. prompt length and routing ambiguity.

These review tasks can run concurrently because they are read-only and independent.

---

# 16. Migration ledger

Create a temporary migration ledger during implementation.

It must account for every current skill:

| Current skill            | Destination                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `artifact-review`        | `review/SKILL.md`, `review/modules/structure`, `evidence`, and `detail` |
| `artifact-to-project`    | `project/modules/artifacts`                                             |
| `artifact-workflow`      | `project/modules/artifacts`                                             |
| `book-and-tutorial`      | `write/modules/book`                                                    |
| `bootstrap-project`      | `project/modules/bootstrap`                                             |
| `canonical-to-artifact`  | `project/modules/artifacts`                                             |
| `drift-review`           | `project/modules/reconcile`                                             |
| `empirical-paper`        | `write/modules/empirical`                                               |
| `git-workflow`           | `code/modules/git`                                                      |
| `grant-writing`          | `write/modules/grant`                                                   |
| `npm-release`            | `code/modules/npm`                                                      |
| `project-briefing`       | `project/modules/bootstrap`                                             |
| `project-initialization` | `project/modules/bootstrap`                                             |
| `project-status-review`  | `project/modules/status`                                                |
| `r-quarto`               | `analyze/modules/r-quarto`                                              |
| `reconcile-project`      | `project/modules/reconcile`                                             |
| `research`               | `research/SKILL.md` and modules                                         |
| `revealjs-slides`        | `write/modules/slides`                                                  |
| `review-copyedit`        | `review/modules/copyedit`                                               |
| `review-detail`          | `review/modules/evidence` and `detail`                                  |
| `review-structure`       | `review/modules/structure`                                              |
| `scholarly-manuscript`   | `write/modules/academic`                                                |
| `software-project`       | `code/SKILL.md` and `architecture`                                      |
| `strategy`               | `review/modules/response` and relevant umbrella guidance                |
| `style-application`      | `write/modules/style`                                                   |
| `style-calibration`      | `write/modules/style`                                                   |
| `theoretical-paper`      | `write/modules/theoretical`                                             |
| `theory-development`     | `write/modules/theory`                                                  |
| `verification`           | `review/modules/verification`                                           |
| `verify-change`          | `code/modules/testing` and `review/modules/verification`                |
| `workflow-retrospective` | `project/modules/retrospective`                                         |
| `writing-core`           | `write/SKILL.md`                                                        |

The ledger should distinguish:

* retained unique guidance;
* merged repetition;
* obsolete wording removed during consolidation.

It can be removed after the migration is reviewed or retained under development documentation if useful.

---

# 17. Documentation changes

Update:

* `README.md`
* `ARCHITECTURE.md`
* `AGENTS.md`
* `CONTRIBUTING.md`
* `docs/CONFIGURATION.md`
* `docs/DEVELOPMENT.md`
* diagrams and screenshots;
* `CHANGELOG.md`.

## README

The README should explain:

* the six umbrella skills;
* one-level modules;
* editable examples;
* independent review;
* test-first coding;
* concise terminal behavior;
* browser and file plan review;
* user and project skill customization.

Example workflows:

```text
Start or reconstruct a project
→ project

Write an empirical discussion section
→ write with academic, empirical, and sections modules

Analyze data in R
→ analyze with quantitative and r-quarto modules

Implement a TypeScript change
→ code with architecture or testing modules as needed

Review a manuscript
→ independent worker with review and write

Review statistical claims
→ independent worker with review and analyze

Research alternative implementations
→ research and code
```

## Architecture documentation

Show:

```text
six visible umbrella skills
        ↓
invariant SKILL.md
        ↓
selected module guidance + editable examples
        ↓
bounded worker with explicit project context
```

## Custom examples

Document the durable customization process:

1. copy the umbrella skill into user or project skill scope;
2. edit the appropriate `modules/*/examples.md`;
3. leave `guidance.md` unchanged unless the user intentionally wants to change behavior.

---

# 18. Implementation sequence

## Commit 1 — Target tests and migration ledger

* record the current skill catalog baseline;
* add failing tests for the six-skill surface;
* add module-layout tests;
* add prompt-size tests;
* add `submit_plan` fallback tests;
* create the migration ledger.

## Commit 2 — Umbrella skill scaffolding

* create the six `SKILL.md` files;
* add concise descriptions;
* add invariant guidance;
* add exact module routing.

The old skills remain temporarily while content migration is underway.

## Commit 3 — Project, writing, and examples

* migrate project workflow guidance;
* add Pi Sych documentation module;
* fold retrospective into project;
* migrate writing and genre guidance;
* create default example files;
* inspect the dotfiles for useful example material.

## Commit 4 — Analysis, coding, review, and research

* migrate R/Quarto;
* add quantitative and qualitative modules;
* add Unix-oriented architecture guidance;
* add independent test-first guidance;
* consolidate review lenses;
* restructure research.

## Commit 5 — Remove old indexed skills

* confirm every skill is accounted for in the migration ledger;
* delete superseded skill directories;
* verify that only the six umbrella skills remain indexed.

## Commit 6 — Supervisor and `submit_plan`

* shorten the supervisor guidance;
* add the installed documentation pointer;
* add independent review policy;
* add concise terminal and long-plan behavior;
* implement browser/file `submit_plan` modes;
* handle unavailable Plannotator cleanly.

## Commit 7 — Targeted TypeScript cleanup

* shared validation;
* shared project-local path handling;
* shared bounded output;
* focused unit tests.

## Commit 8 — Documentation and diagrams

* update all public and maintainer documentation;
* replace stale skill names;
* document example customization;
* update architecture illustrations;
* add the `2.0.0` changelog entry.

## Commit 9 — Full verification and independent review

* run automated checks;
* perform clean-install smoke tests;
* test both plan-review modes;
* run independent skill, runtime, documentation, and prompt reviews;
* address accepted findings;
* inspect the npm tarball.

---

# 19. Verification

Run the complete existing project verification suite, including:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run markdown:check
npm run source:budget
npm run test:unit
npm run test:integration
npm run test:usage
npm run test:deps
npm run smoke
npm pack --dry-run
```

Add focused checks for the refactor:

1. Pi exposes exactly six Pi Sych skills.
2. Every skill description matches the accepted catalog.
3. Every module has `guidance.md` and `examples.md`.
4. All module paths referenced by `SKILL.md` exist.
5. Module files do not appear as independent skills.
6. Module files do not route recursively.
7. The visible catalog is at least 70% smaller than the 1.2.0 baseline.
8. Supervisor guidance remains within its budget.
9. Pi can locate its installed README.
10. Pi answers Pi Sych questions from installed documentation.
11. Self-review triggers an independent worker in substantive cases.
12. Substantive coding tasks prefer independent test authorship.
13. Parallel read-only reviews work.
14. Concurrent editing is not instructed.
15. `submit_plan` works through Plannotator.
16. `submit_plan` falls back to project-file review when Plannotator is unavailable.
17. The fallback stops before implementation.
18. Worker dispatch, project status, MCPorter, and Plannotator commands retain their intended behavior.
19. The packed npm release contains all skill modules and examples.

Test representative workflows with both:

* a medium supervisor model;
* a large or frontier supervisor model.

Record:

* selected umbrella skills;
* modules opened;
* unnecessary module reads;
* unnecessary dispatches;
* review independence;
* prompt and token use;
* routing failures.

---

# 20. Completion criteria

The refactor is complete when:

* only six Pi Sych skills are visible;
* every skill has a concise, distinct description;
* invariant guidance lives directly in each `SKILL.md`;
* specialized guidance is organized into one-level modules;
* every module contains guidance and editable examples;
* retrospective guidance is available under `project` without appearing in the initial catalog;
* Pi can consult its own installed documentation;
* substantive self-review defaults to an independent worker;
* substantive code work prefers independently authored failing tests;
* coding architecture defaults toward simple, composable, inspectable designs;
* long or consequential plans are written to Markdown and submitted for review;
* `submit_plan` supports browser and file review;
* terminal replies remain concise;
* duplicated runtime helpers are consolidated;
* current worker, status, research, and annotation behavior remains functional;
* documentation and diagrams describe the new system accurately;
* all automated and manual checks pass;
* the package is ready to publish as `2.0.0`.
