# Pi Sych 5.0.0 plan

## Recommendation and release boundary

Prepare an unreleased `5.0.0`. Independently selectable extensions, optional
dependency behavior, and the Pages and benchmark capabilities add public
surface. Removing the documented `PI_SYCH_*` configuration overrides and
moving configuration into one visible Pi-native directory require migration
for some supported `4.0.6` workflows, so the release is major.

Do not tag, push, or publish without a separate release instruction. Preserve
the owner's existing uncommitted edits in `docs/attribution.md` and
`docs/development.md`; reconcile them rather than overwriting them. Do not edit
or replace any image.

## 1. Realistic benchmark v1

Keep the current real-Pi smoke test and guidance-level prompt-quality fixtures,
but describe them as diagnostics rather than high-level benchmarks. Add a
separate opt-in benchmark layer that invokes actual public umbrella skills in
disposable synthetic projects.

Start with three cases rather than a generic evaluation platform:

1. `code`: diagnose and repair a small Node defect, add a focused regression
   test, and truthfully report verification;
2. `review` + `write`: review supplied source excerpts and revise an evidence
   memo containing a compound unsupported claim; and
3. `project`: recover direction from accepted, stale, tentative, and unreviewed
   project state without mutating canonical state.

Each case will declare its skills, synthetic fixture, task, expected artifacts,
objective checks, a versioned semantic rubric, and critical failures. The
runner will:

- validate all cases and fixture paths before a paid call;
- launch real Pi with the packaged skills in a fresh temporary project;
- take explicit candidate and capable judge selectors from private
  configuration, record the resolved models, and reject an accidental
  candidate/judge identity unless explicitly overridden;
- retain a local review bundle containing manifest, transcript, artifact diff,
  objective checks, structured 0--4 judge scores with evidence locators,
  critical failures, timings, and limitations; and
- emit a Markdown report that a human can accept, annotate, or reject.

Semantic scores remain advisory and opt-in. They will not become deterministic
keyword assertions or required ordinary CI gates. Ordinary CI will test only
case schema validation, safe disposable paths, command/check execution,
structured judge parsing, timeout/budget handling, and report aggregation with
fake launchers. Raw run bundles will be ignored; only an explicitly reviewed,
sanitary baseline summary may be committed. Run one bounded v1 pilot after the
harness passes and preserve failures rather than tuning directly to them.

## 2. GitLab Pages documentation

Adapt the small Make-based model from `make-it-stop` commit
`4784c8b507c3c8748c97d7d14e25facf6174af85`, rather than copying it unchanged.
Use existing Markdown as canonical content and generate an ignored `public/`
artifact. Add a focused Make/config/template/static site layer that:

- renders `README.md`, selected `docs/*.md`, `ARCHITECTURE.md`, and
  `CONTRIBUTING.md` with Pandoc;
- provides accessible navigation, responsive original CSS, meaningful page
  titles, existing image assets, and repository-correct versus site-correct
  links;
- cleans and rebuilds atomically enough that stale output is not deployed;
- treats renderer, template, missing-input, and link/build failures as fatal;
  and
- never uses `make-it-stop`'s intentionally ignored `grep` failures.

Add a GitLab Pages job for `main` without weakening the existing verify and
trusted tag-publication jobs. Keep generated HTML out of the npm tarball and
Git history. Update the npm homepage and README documentation links only after
the Pages URL is verified.

The adapted Make structure will retain the source BSD-3-Clause notice where
required. CC0-derived configuration/templates will be identified accurately.
Create `COPYING.md` and package the applicable `LICENSES/` notices so copied,
adapted, and influence-only material are distinguishable.

## 3. Pandoc policy

Replace the exact Pandoc pin with a minimum supported version of `3.10.1` for
local formatting. Parse and compare versions numerically; reject missing,
older, or malformed versions with a precise error. CI will resolve and install
the latest stable Pandoc release at run time through a small fail-fast helper,
rather than embedding one release number in `.gitlab-ci.yml`.

Add deterministic tests for version parsing/comparison and latest-release
metadata/asset selection without making network calls. Document that allowing
newer formatters trades byte-for-byte cross-version reproducibility for the
owner-requested current-version policy.

## 4. Modular runtime and optional integrations

Use Pi's public package controls instead of introducing a second configuration
system. Resolve Pi Sych's private configuration directory without supported
`PI_SYCH_*` user overrides: use `<projectRoot>/.pi/pi-sych` when the project
has `.pi`; otherwise use `$PI_CODING_AGENT_DIR/pi-sych` when Pi configured an
agent directory; otherwise `$XDG_CONFIG_HOME/pi/pi-sych`; otherwise
`~/.config/pi/pi-sych` when that Pi directory exists; otherwise `~/.pi/pi-sych`
when it exists. If none exists, fail before side effects with every checked
location and setup guidance. Use `PI_PACKAGE_DIR` only to locate package
resources where Pi's installation environment requires it, not as private
configuration. Honor `PI_OFFLINE` by refusing the latest-Pandoc network lookup
before a request. `PI_CODING_AGENT_SESSION_DIR`, telemetry, and sharing
variables are not Pi Sych configuration.

Use the resulting directory for model catalog, MCPorter configuration, worker
agent runtime, and private benchmark selector configuration. Existing
`PI_SYCH_MODEL_CATALOG`, `PI_SYCH_WORKER_AGENT_DIR`,
`PI_SYCH_MCPORTER_CONFIG`, and `PI_SYCH_PI_BIN` overrides will be removed from
the documented and supported surface. Worker-only result/task environment
values remain an internal process protocol, not user configuration.

Then:

- keep the core workbench extension for supervisor guidance, compaction,
  `dispatch_worker`, `project_status`, `/pi-sych-status`, and `/pi-sych-mcp`;
- move the three Plannotator commands into a separately declared
  `extensions/plannotator/index.ts` entry point;
- move Plannotator and its adapter-only loader to optional dependencies, and
  make `pi-mcporter` optional while retaining `remoteResearch: true` as its only
  activation path;
- keep both extensions enabled in the default package so existing complete
  installs retain their command surface;
- document and test disabling Plannotator through `pi config` or package
  extension filters before installing with optional dependencies omitted;
- document `--tools` and `--exclude-tools` for per-session tool selection;
- document `pi config`, package `extensions: []`, and `--no-extensions` for
  disabling the whole workbench while optionally retaining skills; and
- avoid an internal `enabled` switch or a parallel tool-toggle schema.

An explicitly enabled Plannotator extension with a missing or incompatible
integration must fail during extension startup before registering commands.
An explicitly requested remote-research worker with missing MCPorter must fail
before spawn. A disabled extension or an optional feature that was not
requested is legitimate absence, not an error. Tests will cover default,
Plannotator-disabled, optional-dependencies-omitted, individual-tool-excluded,
all-extensions-disabled, and explicit-missing-integration behavior using packed
installs where applicable.

## 5. Public contract, userland, and SemVer boundary

Add `docs/public-contract.md` as the explicit human-readable authority for what
Pi Sych supports as public userland. Link it from the README, architecture,
configuration, contributing, development, and release documentation where
relevant. Do not infer public API merely because npm ships inspectable source.
Use documented `4.0.6` behavior as the initial compatibility baseline; resolve
ambiguity conservatively rather than retroactively declaring an existing
promised workflow internal. Track the new document in `SYNC.json` as authority
for the public-contract and SemVer boundary.

Classify the supported surface in a reviewable table:

- npm identity, install behavior, supported Node/Pi compatibility policy, and
  declared Pi package resources;
- the six public skill names and their documented invocation/capability scope;
- extension entrypoint paths that users need for `pi config` and package
  filtering;
- agent tool names, input schemas, documented result categories, and material
  side effects;
- human command names, accepted arguments, output files, and material failure
  behavior;
- documented configuration files, environment variables, precedence, defaults,
  and strict-versus-optional absence rules;
- supported on-disk project formats, including `SYNC.json` versions, required
  `PROJECT.md` headings, acknowledgement semantics, proposal-line grammar, and
  stable template paths;
- documented generated files and locations such as `INBOX.md`, feedback files,
  review files, and worker bootstrap settings; and
- public documentation and license/notice files promised in the package.

Create two adjacent non-public categories so maintenance decisions remain
honest:

1. **Compatibility-sensitive internals:** model-facing compaction/worker
   protocols and persisted session behavior. They are not a TypeScript API, but
   changes require migration analysis, regression tests, and explicit release
   notes because existing sessions or model behavior may be affected.
2. **Internal implementation:** TypeScript helpers and named exports not
   explicitly documented as imports, deep `extensions/**/src` paths, local
   modules and hidden shared methods, test fixtures, exact human-readable error
   wording, and generated benchmark internals. Pi Sych exposes no supported
   JavaScript/TypeScript library-import API unless one is deliberately added in
   a future release.

Clarify edge cases. The six public skills are API; hidden methods and local
module layout are architecture, not independently invokable userland. A copied
skill override becomes user-owned and version-decoupled. Exact model prose is
not deterministic API, but documented capability scope, human ownership,
non-invention boundaries, and material side effects are contract. Error
categories and fail/omit behavior are contract; punctuation and incidental
wording are not unless declared machine-readable.

Define the release rule around user migration rather than implementation size:

- **major:** remove/rename a public resource; narrow previously supported input;
  change a file/config/tool schema incompatibly; change defaults or side effects
  so an existing supported workflow behaves materially differently; remove a
  promised template/path; require users to migrate stored state; or raise a
  supported runtime/integration requirement outside the published compatibility
  policy;
- **minor:** add an optional/backward-compatible public capability, field,
  command, tool, skill, extension, or configuration option; deprecate while
  preserving behavior; or materially improve behavior without invalidating a
  supported existing use; and
- **patch:** correct behavior within the documented contract, refine defeasible
  skill guidance without changing its supported scope, update documentation or
  tests, or refactor internals with no required user migration.

A security or correctness reason may justify an incompatible change but does
not make it non-breaking: release it as major or document an exceptional
supported migration. Deprecations land in a minor release and removals wait for
an authorized major release. Default-on to default-off is breaking when users
materially lose behavior; adding an independently disableable resource while
preserving the default is minor.

Add a concise release checklist requiring maintainers to name the touched
contract row, state whether an existing documented use needs migration, check
stored-state/default-side-effect changes, and justify major/minor/patch in the
changelog. Extend mechanical tests around public names, schemas, package
resources, templates, and file behavior, but do not create a second registry
that can drift from implementation or freeze prose with keyword assertions.

Under this policy, independently selectable Plannotator, optional dependencies,
Pages, and benchmark commands would be backward-compatible additions. This
release is nevertheless `5.0.0` because it intentionally removes documented
`PI_SYCH_*` overrides and relocates configuration, requiring affected users to
migrate. Plannotator remains default-on and tool schemas and command names stay
compatible.

## 6. Coding philosophy and project application

Update the `code` umbrella and its architecture/testing/web guidance with
strong but defeasible preferences derived from:

- Dietrich Gebert's Ponytail: understand the real flow first; question
  speculative need; prefer deletion, direct reuse, standard-library/native
  mechanisms, and the smallest complete checked change;
- Eric S. Raymond's Unix philosophy: simple parts and explicit interfaces,
  policy/mechanism separation, inspectability, representation over procedural
  complexity, least surprise, silence on success where appropriate, and early
  loud failure; and
- cautiously scoped human-factors literature: visible state and feedback,
  recognition over recall, user control, error prevention/recovery, and
  progressive disclosure where it reduces rather than hides complexity.

Do not copy Ponytail's persona, exact ladder, slogans, intensity system, output
caps, or comment convention. Do not treat Unix text streams, minimal line
count, fail-fast behavior, or any UX heuristic as universal. State explicit
defeaters: security, accessibility, data integrity, compatibility, cohesive
implementation, anticipated user error, and systems where graceful degradation
is required.

Apply the philosophy to Pi Sych with a targeted error audit, not mass deletion
of catches. Distinguish expected optional absence and safe cancellation from
invalid explicit configuration, corrupt invariants, malformed installed
integrations, and programmer errors. At minimum, stop hiding malformed
MCPorter diagnostics and installed-but-broken Plannotator APIs; ensure site and
benchmark configuration fails before side effects; and inspect broad catches
for precise classification. Preserve safe state and actionable diagnostics.

Update `docs/attribution.md` with narrow influence statements and exact source
links. `COPYING.md` will record Ponytail's MIT terms as influence-only unless
substantial text/code is actually copied; Raymond's online book is CC BY-ND
1.0, so Pi Sych will paraphrase and cite rather than adapt its prose.
Psychology-to-developer-tool implications will be labeled design inferences,
not direct empirical validation.

## 7. Modern TypeScript only where it pays

Keep the current latest TypeScript and ES2024 target. Enable
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`: a dry run exposed
one unchecked-index issue and several objects that explicitly pass `undefined`
instead of omitting optional properties. Correct those sites directly and add
focused tests where behavior changes. Also enable the currently clean
`noImplicitReturns`, `noFallthroughCasesInSwitch`, and `noImplicitOverride`
checks as low-cost guards.

Do not introduce newer syntax, decorators, explicit resource management,
advanced generics, or helper abstractions merely because TypeScript supports
them. Adopt a language feature only when it removes code, represents an
invariant more accurately, or makes ownership/cleanup easier to read on the
supported Node runtime.

## 8. Medium- and long-term test assurance

Adopt SQLite's testing discipline as an aspiration, not an equivalence claim.
SQLite documents 100% MC/DC for its core and execution in both directions of
every compiler-generated machine-code branch, backed by fault simulation,
fuzzing, and mutation testing. Pi Sych runs as TypeScript under Node/V8, whose
JIT-generated native instructions change with runtime, platform, optimization,
and execution history. Stable exhaustive native-opcode or machine-branch
coverage is therefore neither a truthful nor useful package-level target.

Use the following explicit coverage taxonomy:

- line/function coverage asks whether source or compiled JavaScript locations
  executed;
- branch coverage asks whether every decision edge executed;
- condition coverage asks whether each atomic condition was true and false;
- MC/DC additionally demonstrates that each condition can independently change
  the enclosing decision; and
- multiple-condition coverage executes every feasible truth combination. For
  `a === 1 && b === 2`, the requested matrix is `TT`, `TF`, `FT`, and `FF`, not
  merely the true and false outcomes of the complete `if`.

For `5.0.0`, add a diagnostic `test:coverage` command using Node's built-in V8
coverage on the compiled deterministic runtime, record the observed baseline,
and do not hide weak areas behind an arbitrary initial threshold. New or
changed high-consequence compound decisions must include a reviewed decision
table. Exercise every feasible combination for small predicates (normally up
to three Boolean conditions); when the cross-product is materially larger,
require at least MC/DC plus boundary and interaction cases, and document
infeasible combinations.

The medium-term target is ratcheted 100% reachable source branch coverage for
the mechanically decidable TypeScript core, with every unreachable or excluded
branch carrying a reviewable rationale. Coverage must include normal,
short-circuit, malformed-input, cancellation, timeout, partial-I/O, and
explicit optional-integration paths. It does not apply deterministic prose
assertions to semantic skills or convert live-model judgments into branch
coverage.

Add fault injection at filesystem, process, clock, loader, and persistence
boundaries; property/fuzz tests for parsers, manifests, paths, and schemas; and
scoped mutation testing for the mechanical core. The long-term standard is to
kill every non-equivalent mutant in consequential modules or retain an explicit
reviewed survivor rationale. Preserve minimized regressions. Coverage,
condition matrices, MC/DC, mutation scores, and fuzzing are complementary
evidence and never proof of correctness, security, or model behavior.

Record this aspiration in project/development documentation as staged work, not
as a completed `5.0.0` guarantee. Future releases should raise thresholds only
after actual baselines and independent review, without deleting meaningful
error paths or tests to improve a percentage.

## 9. Image-generation prompts

After the implementation architecture and Pages navigation are final, write
`~/prompts.md` with standalone image-model prompts for:

- the skills architecture diagram;
- the overall package/runtime architecture;
- supervisor context and compaction flow; and
- the human review/optional Plannotator workflow if its current image is stale.

Each prompt will specify exact nodes, arrows, labels, exclusions, visual
hierarchy, accessibility, aspect ratio, and consistency with the existing Pi
Sych visual identity. The prompts will explicitly forbid depicting hidden
methods as public skills, workers as sandboxes or persistent agents,
Plannotator/MCPorter as mandatory, automatic semantic reconciliation, schema
expansion, or autonomous promotion. No image file will be opened for editing,
regenerated, or replaced.

## Verification and review

Before implementation, obtain independent test design for modular installation,
Pages failure behavior, benchmark harness mechanics, and the stricter compiler
flags. During implementation, use small coherent changes and preserve the
owner's two existing documentation edits. Before declaring completion:

- run formatter, stricter typecheck, Biome, dependency checks, source budget,
  unit/integration tests, the diagnostic coverage baseline, package dry run,
  whitespace checks, and production audit;
- build and inspect the Pages artifact and test its internal links;
- test packed default and optional-dependencies-omitted installations;
- run the bounded benchmark pilot with separate candidate/judge models and
  report actual cost/time/model limitations;
- obtain independent read-only code, public-contract/SemVer, documentation,
  attribution/licensing, benchmark-methodology, and release-readiness review;
  and
- update `PROJECT.md`, `EVIDENCE.md`, `ARCHITECTURE.md`, `README.md`,
  `CHANGELOG.md`, and `SYNC.json` only when their claims are true.

No tag, push, npm publication, or image replacement is included in this plan.
