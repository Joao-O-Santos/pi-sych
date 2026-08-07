# Evidence

## E-031 --- v6.0.2 final review-correction pass

**Status:** verified **Kind:** observed deterministic behavior, type
safety, source budget, and evidence consistency **Source:** current
source and tests, signed commits, signed tag `v6.0.2`, independent
review findings, and local gate **Supports:** v6.0.2 release readiness
after the independent review identified two new code issues and a
release-state/version problem. **Evidence:** fix `PI_SYCH_PACKAGE_ROOT`
off-by-one directory traversal (use `import.meta.dirname` directly); end
`writeAtomicFile()` async disposal scope before `rename()` for correct
cross-platform resource ordering; replace chmod-based observation-error
test with deterministic `EISDIR` fixture (directory at tracked path);
use `mkdtempDisposable()` for worker runtime cleanup; add regression
tests for three-way compaction file filtering and Windows root-relative
config paths; regenerate four architecture PNGs with proper box heights
and line-wrapped text. typecheck, Biome style, Pandoc Markdown check,
source budget (1,975 actual / 2,000 rounded), 56 unit tests, 10
integration tests (66 total), packed install, and Pages build passed.
**Limits:** The acknowledgement read-modify-write race and
async-disposable cleanup remain identified but not addressed (no
concurrent writes in current usage; try/finally is sufficient for temp
directories). **Checked:** 2026-08-07

## E-030 --- v6.0.0 independent review corrective pass

**Status:** verified **Kind:** observed deterministic behavior, type
safety, source budget, and evidence consistency **Source:** current
source and tests, signed commits `0ae415e8` and `7545a407`, signed tag
`v6.0.0`, independent review findings, and local gate **Supports:**
v6.0.0 release readiness after the independent review identified three
P0 blockers and several P1 simplifications. **Evidence:** surface
artifact observation errors in `ProjectStatusCheck.errors` and the
"Unable to observe" formatter section, restore dependency impact for
missing artifacts by passing `[...changed, ...missing]` to `impacts()`,
require active untracked compaction files to exist by using
`resolveExistingProjectPath()` in an inline loop, fix Windows
root-relative config paths using `posix.isAbsolute()` and
`win32.isAbsolute()`, rename the source budget metric to "runtime
source", modernize with `crypto.hash()`, `import.meta.dirname`, and
`Static<typeof schema>` for duplicated request/result types, share the
worker result TypeBox schema, consolidate model-catalog loading, and
inline the compaction file filter. typecheck, Biome style, Pandoc
Markdown check, source budget, 55 unit tests, 10 integration tests (65
total), packed install, and Pages build passed. Source budget is
2000/2000 lines. **Limits:** The acknowledgement read-modify-write race
and async-disposable cleanup remain identified but not addressed (no
concurrent writes in current usage; try/finally is sufficient for temp
directories). **Checked:** 2026-08-07

## E-029 --- v6.0.0 correctness+simplification implementation

**Status:** verified **Kind:** observed deterministic behavior, type
safety, and source budget **Source:** current source and tests,
`package.json` 6.0.0, signed commit `0ae415e8`, and local gate
**Supports:** v6.0.0 implementation readiness for the approved
correctness+simplification pass. **Evidence:** typecheck, Biome style,
Pandoc Markdown check, source budget, 53 unit tests, 10 integration
tests (63 total), packed install, and Pages build passed. Source budget
is exactly 2000/2000 lines including worker bootstrap script. The
changes include Node 26 baseline, centralized Pi config-root and skill
lookup, current/changed/missing/error observation states, worker failure
precedence, JSON extraction from compaction model output, model catalog
consolidation, shared worker result schema, startup fail-fast on
malformed SYNC.json, MCPorter preflight removal, Plannotator projectFile
simplification, and improved Pages styling with responsive CSS and dark
mode. No tag, push, npm publication, or image replacement has occurred.
**Limits:** independent review gate has not been run for this entry. The
acknowledgement read-modify-write race was identified but not addressed
(no concurrent writes in current usage). **Checked:** 2026-08-07

## E-028 --- unreleased v5.0.0 implementation gate and benchmark pilot

**Status:** verified for the local pre-tag release gate **Kind:**
observed deterministic behavior, package contents, packed install, Pages
build, dependency audit, independent coverage views, and bounded
live-model benchmarks **Source:** current source and tests,
`package.json` 5.0.0, Git-tracked public-contract documentation, local
package dry run, packed optional-dependency install, diagnostic coverage
runs, Pages build, production audit, benchmark bundles under
`/tmp/pi-sych-benchmark-results*`, and independent read-only review
findings that were addressed or recorded **Supports:** local release
readiness for the approved `5.0.0` boundary, including the unified
visible configuration migration, optional integrations, stricter
configuration paths, benchmark preflight and timeout hardening, Make
workflow ordering, and independent coverage metrics. **Evidence:**
formatting, strict typecheck, Biome and Pandoc checks, optional
dependency validation, source budget, 52 unit tests, 10 integration
tests, package dry run, and whitespace checks passed. The packed `5.0.0`
install with `--omit=optional` retained the core package and omitted
direct optional Plannotator and MCPorter packages. Pages generation and
production audit passed with zero vulnerabilities after compatible
`latest` dependency updates. The combined 62-test Node coverage report
observed 88.85% lines, 80.28% branches, and 83.43% functions; the
independent dev-only c8 report observed 88.84% lines, 80.65% branches,
and 92.7% functions. Production TypeScript was about 1,900/2,000 lines.
The first bounded pilot with distinct candidate and judge models
completed 3/3 cases, passed 8/9 objective checks, had mean judge score
3.89/4, and recorded no judge critical failures; the failed check was a
case-sensitive `verification` expectation against `Verification:`. A
second three-case pilot under timeout-escalation preserved a code-case
timeout while the other two cases passed 6/6 objective checks with mean
judge score 4/4; a bounded one-case code rerun completed and passed 2/3
objective checks with mean judge score 3.67/4 and no critical failures.
Independent review found release blockers; strict nested/path
configuration validation, bootstrap migration guidance, benchmark
preflight/output safety/timeout evidence fields, packed-install
coverage, and test isolation were corrected or explicitly recorded.
**Limits:** The benchmark results are observations from these configured
models and disposable cases, not proof of general skill adherence.
Benchmark bundles retain result and manifest records, timings, artifact
and post-judge diffs, and limitations, but not raw complete transcripts.
The local release gate does not establish GitLab pipeline, signed-tag,
npm-provenance, or post-push verification state. Image files were not
replaced. **Checked:** 2026-08-06

## E-027 --- v4.0.6 release and live-evaluation verification

**Status:** verified **Kind:** observed live-model behavior, signed Git
state, GitLab CI, npm registry metadata, provenance, and published
package contents **Source:** opt-in usage runs, remote `main`, signed
annotated `v4.0.6`, GitLab pipelines #69 and #70, npm registry and
attestation metadata, and published package dry run **Supports:** the
`pi-sych@4.0.6` scientific- continuity release. **Evidence:** the real
disposable-project usage workflow passed. Prompt-quality evaluation
first exposed a missing presentation-versus- evidence safeguard, then an
underspecified retrospective fixture; both were corrected, the final
prompt-quality evaluation passed, and independent review confirmed that
the corrections remained substantive. Signed tag `v4.0.6` resolves to
release commit `1ca2723fb76cb7f85a94a1687d0af3c3f0116e7a`. GitLab main
pipeline #69 (`2738777057`) and tag pipeline #70 (`2738777535`) passed;
tag jobs `verify` (`15758469506`) and `publish-npm` (`15758469507`) both
succeeded. npm reports `pi-sych@4.0.6`, publication time
`2026-08-06T22:19:27.849Z`, SLSA provenance attestation metadata,
integrity
`sha512-EMoVOfy2tR2BeLpBrJu6K8ER/oGtRPg6efZ/zetfLT2/rsffPPL8N4yzISKShLmF8iVMXgPzx5/v/r6khiJNFQ==`,
and the reviewed 130-file published tarball. **Limits:** Live results
are specific to the configured models and runs, not proof of general
adherence. The five previously reported upstream or transitive
production advisories were not changed by this release. **Checked:**
2026-08-06

## E-026 --- Scientific grounding and continuity gate

**Status:** verified **Kind:** observed guidance, deterministic prompt
and schema behavior, package contents, source inspection, and
independent review **Source:** hypothesis and retrospective guidance,
compaction source and unit tests, opt-in live usage evaluation, Zahavy
(2026), current documentation, package dry run, and read-only review
**Supports:** inspected motivation for hypothesis generation, bounded
model contribution, regression-aware retrospective proposals, and
scientific continuity through compaction without schema expansion.
**Evidence:** hypothesis guidance rejects invented observations,
anomalies, field experience, participant accounts, results, and
literature conflicts while retaining model-assisted diversification,
formalization, comparison, scope analysis, and discriminating tests.
Retrospective proposals now identify the targeted component, predicted
effect, regression risks, motivating cases, held-out cases, and human
decision. The compaction prompt retains unresolved alternatives,
consequential negative results, constraining failed approaches, and
not-yet-canonical decisions or commitments in the existing `task`,
`constraints`, `active`, `blockers`, `next`, and `files` fields.
Typecheck, Biome and Pandoc checks, dependency validation, source
budget, 32 unit checks, 6 integration checks, a 130-file package dry
run, and whitespace checks passed. The maximum route remains 1,730/1,736
words. Independent review approved all requirements. The live
disposable- project workflow passed. Initial prompt-quality runs exposed
one missing presentation-versus-evidence safeguard and an underspecified
retrospective fixture; both were corrected, and the final prompt-quality
evaluation passed. **Limits:** Live results are evidence from the
configured models and these runs, not proof of general adherence. The
Zahavy citation supports a narrow grounding caution; Pi Sych does not
adopt the paper's strongest conclusion as established fact. At this
checked gate, `4.0.6` had not yet been tagged, published, or released.
`npm audit --omit=dev` retained five upstream or transitive advisories
(two moderate and three high); no dependency change was made.
**Checked:** 2026-08-06

## E-025 --- v4.0.5 release verification

**Status:** verified **Kind:** observed signed Git state, GitLab CI, npm
registry metadata, provenance, and published package contents
**Source:** remote `main`, signed annotated `v4.0.5`, GitLab pipelines
#66 and #67, npm registry metadata, attestation metadata, and published
package dry run **Supports:** the `pi-sych@4.0.5` release and reviewed
skill, attribution, and repository-cleanup changes. **Evidence:** signed
tag `v4.0.5` resolves to release commit
`267992641ed3c5a450ce1eb2c55a8a3222fc1871`. GitLab main pipeline #66
(`2737876506`) and tag pipeline #67 (`2737876595`) passed; tag jobs
`verify` (`15751889780`) and `publish-npm` (`15751889781`) both
succeeded. npm reports `pi-sych@4.0.5`, publication time
`2026-08-06T15:39:04.448Z`, SLSA provenance attestation metadata,
integrity
`sha512-Gt8IvDUu/DKnvOxlIPCdX1qFLjEUhk04SQ19gelUyhupIHYvrixQyk4IxDpCOhZ2dUcYZJgALQhNVyPJO7RipA==`,
and a 130-file published tarball. The tarball contains lowercase
`docs/attribution.md`, `docs/configuration.md`, `docs/development.md`,
`docs/review-workflow.md`, and `docs/img/readme.md`, with none of the
superseded paths. **Limits:** The opt-in live-model behavioral
evaluation remained skipped, so the release makes no new model-adherence
claim. The five previously reported upstream or transitive production
advisories were not changed by this release. **Checked:** 2026-08-06

## E-024 --- Repository cleanup and lowercase documentation gate

**Status:** verified **Kind:** observed repository layout, deterministic
checks, package contents, and independent review **Source:** root and
docs inventories, package metadata, Markdown links, current source and
tests, package dry run, and read-only cleanup reviews **Supports:**
removal of completed plans and empty historical ledgers, lowercase
documentation paths, packaged `docs/attribution.md`, and retention of
discoverable root canonical state without an unnecessary `project/`
directory. **Evidence:** completed project-only plans, the resolved
decision ledger, and the completed-only task ledger were removed.
`PROJECT.md`, `EVIDENCE.md`, `SYNC.json`, and `AGENTS.md` remain at root
because native instruction and manifest discovery use that location;
moving only two files would split rather than simplify canonical state.
Typecheck, Biome and Pandoc checks, dependency validation, source
budget, 31 unit checks, 6 integration checks, a 130-file package dry
run, relative Markdown-link validation, stale-path search, and
whitespace checks passed. The tarball contains lowercase
`docs/attribution.md`, `docs/configuration.md`, `docs/development.md`,
`docs/review-workflow.md`, and `docs/img/readme.md`, and none of their
obsolete paths. Independent review approved after three historical
deleted-file references were generalized. **Limits:** The live-model
behavioral evaluation remained skipped. At this checked gate, `4.0.5`
had not yet been tagged, published, or released. `npm audit --omit=dev`
retained five upstream or transitive advisories (two moderate and three
high) in `brace-expansion`, `fast-uri`, `hono`, and `undici`; no
dependency change was made. **Checked:** 2026-08-06

## E-023 --- Skill density, routing, attribution, and v4.0.5 preparation

**Status:** verified **Kind:** observed deterministic behavior, package
contents, source inspection, and independent review **Source:** current
skill routes and guidance, `docs/attribution.md`, package metadata,
tests, package dry run, owner-supplied source inventory, targeted
metadata retrieval, and read-only reviews **Supports:** task-specific
route composition, dense defeasible prose guidance, removal of generic
prompt repetition, complete known influence mapping, mechanical prompt
budgets, and consistent `4.0.5` package preparation. **Evidence:**
typecheck, Biome and Pandoc checks, dependency validation, source
budget, 31 unit checks, 6 integration checks, package dry run (130
files), and whitespace checks passed. Pi discovered exactly six public
skills. Every complete route is mechanically limited to the historical
1,736-word ceiling; the largest current route is 1,730 words.
Deterministic tests assert route composition, resolution, order,
acyclicity, package attribution, and exact version consistency without
freezing semantic prose. Three new behavioral scenarios remain opt-in.
Independent review approved the substantive routing, prose,
deduplication, and attribution changes after aggregate route-size and
exact-version guards were added. **Limits:** The live-model behavioral
evaluation was syntax checked but skipped, so no model-adherence claim
is made. At this checked gate, `4.0.5` had not yet been tagged,
published, or released. The attribution maps known direct influences
identified in project history and the owner's source inventory; it does
not imply copied code or universal authority. `npm audit --omit=dev`
reported five upstream or transitive advisories (two moderate and three
high) in `brace-expansion`, `fast-uri`, `hono`, and `undici`; no
dependency change was made. **Checked:** 2026-08-06

## E-022 --- Shared-method skills architecture gate

**Status:** verified **Kind:** observed deterministic behavior, package
contents, and independent review **Source:** current skills, worker
prompt, templates, documentation, tests, package dry run, and a
read-only architecture review **Supports:** six public umbrella skills,
non-public shared methods, ordered task recipes, local-module
adaptation, override precedence, project-delta style, and truthful
behavioral-test boundaries. **Evidence:** typecheck, Biome and Pandoc
checks, dependency validation, source budget, 30 unit checks, 5
integration checks, package dry run (130 files), and whitespace checks
passed. Pi RPC discovered only the accepted six skills. Independent
reviews identified and confirmed corrections for the live evaluator,
canonical state, override coverage, gallery artwork, brittle semantic
phrase tests, and attribution inside routed method context. The owner's
Plannotator feedback is now reflected by mechanical-only deterministic
skill tests, opt-in behavioral fixtures, and packaged
`docs/attribution.md`; the review file was deleted as requested.
**Limits:** The opt-in live-model behavioral evaluation was syntax
checked but skipped, so no model-adherence claim is made. Superseded
v4.0.4 diagrams remain packaged as historical files; stale gallery image
metadata was removed pending separately reviewed replacement artwork.
`npm audit --omit=dev` reported five upstream or transitive advisories
(two moderate and three high) in `brace-expansion`, `fast-uri`, `hono`,
and `undici`; no dependency change was made in this refactor.
**Checked:** 2026-08-06

## E-021 --- v4.0.4 release verification

**Status:** verified **Kind:** observed behavior, deterministic tests,
GitLab CI, signed tag, and npm publication **Source:** current source,
package scripts, v4.0.4 release metadata, and package registry
**Supports:** shared primitive validation, user-centred review workflow
documentation, the architecture diagrams published with v4.0.4, and the
v4.0.4 release. **Evidence:** typecheck, Biome and Pandoc checks, 32
unit checks, 5 integration checks, dependency validation, source budget,
package dry run, and whitespace checks passed. GitLab pipelines #60 and
#61 for `main` and #62 for tag `v4.0.4` passed; the signed tag points to
`b60aae52`, and npm reports `4.0.4` as the current package version.
**Limits:** The diagrams remain evidence of the v4.0.4 release state but
their one-level skill wording is superseded by E-022. Real-model usage
and browser-mediated Plannotator behavior were not required for these
deterministic changes. **Checked:** 2026-08-03

## E-020 --- v4.0.3 correctness and documentation pass

**Status:** verified **Kind:** observed behavior, deterministic tests,
GitLab CI, and release verification **Source:** current source, focused
unit and integration tests, package scripts, and package dry run
**Supports:** bounded compaction, inbox exclusion, visible project
validation errors, acknowledgement rechecks, worker-reported path
validation, lazy model configuration, explicit worker bootstrap,
project-local symlink behavior, fixture-based migration validation, and
audience-specific documentation. **Evidence:** typecheck, Biome and
Pandoc checks, 29 unit checks, 5 integration checks, dependency
validation, source budget, package dry run, and whitespace checks passed
for the final release candidate. GitLab pipelines #56 (`main`) and #57
(`v4.0.3`) passed; the signed tag was verified, npm reports `4.0.3` as
latest, and the published manifest image returns HTTP 200 from unpkg.
**Limits:** Real-model usage and browser-mediated Plannotator behavior
were not required for these deterministic changes. **Checked:**
2026-08-01

## E-016 --- v3.0.3 documentation corrections

**Status:** verified **Kind:** observed behaviour **Source:**
ARCHITECTURE.md, `docs/configuration.md`, package scripts **Supports:**
v3.0.3 release readiness **Evidence:** Corrected default `inbox` path in
the configuration example (`.pi-sych/INBOX.md` → `INBOX.md`) to match
source defaults. Added motivation for canonical path overrides.
Clarified ARCHITECTURE.md compaction triggers (manual `/compact`,
context threshold, overflow recovery) and noted compaction uses
supervisor's active model, not worker profiles. Typecheck, Biome and
Pandoc style, 61 unit checks, 5 integration checks, smoke, source budget
(2,650/3,000), and whitespace checks passed. **Limits:**
Documentation-only; no behavioral changes. **Checked:** 2026-07-31

## E-015 --- v3.0.2 documentation update

**Status:** verified **Kind:** observed behaviour **Source:**
ARCHITECTURE.md, `docs/configuration.md`, package scripts **Supports:**
v3.0.2 release readiness **Evidence:** Added detailed compaction
pipeline description to ARCHITECTURE.md: working-memory construction,
status projection, canonical snapshot, promotion routing by role,
malformed inbox isolation, failure classification, and native compactor
fallback. Added manifest resolution section to ARCHITECTURE.md covering
workspace walk, nearest SYNC.json selection, projectRoot relocation, and
canonical path overrides for seven roles. Added the project canonical
paths section to `docs/configuration.md`, documenting the SYNC.json v2
schema, projectRoot and canonical object structure, role-to-path
mapping, and artifact declaration format. Typecheck, Biome and Pandoc
style, 61 unit checks, 5 integration checks, MCPorter dependency check,
smoke, source budget (2,650/3,000), and whitespace checks passed.
**Limits:** Documentation-only; no behavioral changes. **Checked:**
2026-07-31

## E-014 --- v3.0.1 code-quality audit and malformed-manifest fix

**Status:** verified **Kind:** observed behaviour and independent
read-only review **Source:** `SYNC.json`, package scripts, unit and
integration checks, and an independent read-only code audit
**Supports:** v3.0.1 release readiness **Evidence:** An independent
read-only audit found and this patch removed dead production exports
(`countPromotionCandidates`, `parseEvidenceEntries`, `EvidenceEntry`),
collapsed duplicated `MODE_TOOLS` lookups into `toolsForMode`, removed a
redundant `--local` no-op, and fixed a regression where
`projectStatusView` resolved the manifest before `checkProjectStatus`
could yield its graceful unavailable state, crashing `/pi-sych-status`
on malformed `SYNC.json`. A new integration test reproduces the
malformed-manifest path. Typecheck, Biome and Pandoc style, 61 unit
checks, 5 integration checks, MCPorter dependency check, smoke, source
budget (2,650/3,000), and whitespace checks passed. **Limits:** Opt-in
real-model usage was not rerun; the changes are orthogonal to the
compaction model path and prompts. **Checked:** 2026-07-31

## E-013 --- v3.0.0 refactor and release gate passed

**Status:** verified **Kind:** observed behaviour and independent
reviews **Source:** approved implementation plan (removed after
completion), package scripts, unit/integration/usage checks, package dry
run, and independent read-only reviews **Supports:** `SYNC.json` v2
resolution, canonical-role promotion routing, compaction status/error
isolation, skill restoration, and v3.0.0 release readiness **Evidence:**
Typecheck, Biome and Pandoc Markdown style, 62 unit checks, 4
integration checks, opt-in real-Pi usage (`PI_SYCH_USAGE_TEST=1`), live
LLM-judged prompt-quality usage, source budget (2,650/3,000), package
dry run, and whitespace checks passed. Independent reviews identified
and the implementation addressed non-atomic acknowledgement,
malformed-manifest diagnostics, single resolved-project threading,
single-read canonical fingerprinting, tracked-artifact preservation in
working memory, v1.2.0 procedure restoration, and regex-behavior test
honesty. **Limits:** The npm release has not been published; inherited
advisory retention was not rechecked for this entry. **Checked:**
2026-07-31

## E-012 --- v2.1.1 compaction and release gate passed

**Status:** verified **Kind:** observed behaviour and independent review
**Source:** approved v2.1.1 follow-up and reduction work (planning files
removed after completion), package scripts, unit/integration/smoke
checks, package dry run, and dependency audit **Supports:**
working-memory compaction, human-review `INBOX.md` promotions, status
visibility, and v2.1.1 release readiness **Evidence:** Typecheck,
Biome/Markdown style checks, clean `npm ci --ignore-scripts`, MCPorter
dependency validation, 49 unit checks, 4 integration checks, 3 smoke
checks, package dry run (114 files), whitespace check, and the
2,300/2,500 production TypeScript budget passed. The reuse audit
retained Pi's compaction lifecycle, message conversion/serialization,
model registry, authentication, cancellation, and usage accounting; Pi's
fixed summary helpers cannot implement the one-call working-memory plus
promotion contract. **Limits:** Opt-in real-Pi usage was not rerun for
v2.1.1. `npm audit --omit=dev` retains one inherited high-severity
`brace-expansion` advisory below `@earendil-works/pi-coding-agent`;
npm's dry-run offered no dependency upgrade. **Checked:** 2026-07-31

## E-001 --- Deterministic package checks pass

**Status:** verified **Kind:** observed behaviour **Source:**
`package.json`, `tests/unit`, and `tests/integration` **Supports:**
package readiness and deterministic-check claims **Evidence:** The
package scripts define typecheck, style, source-budget, unit,
integration, and smoke checks; the current deterministic suites pass
with 40 unit tests, 3 integration tests, and 2 smoke checks. **Limits:**
A passing local check does not establish host-wide security, real-model
usage, or prove all scientific workflows. **Checked:** 2026-07-29

## E-011 --- v2.0.0 refactor verification passed

**Status:** verified **Kind:** observed behaviour and independent review
**Source:** package scripts, unit/integration/smoke/usage tests, package
dry run, CI YAML parse, `MIGRATION_LEDGER.md`, and three independent
read-only reviews **Supports:** v2.0.0 implementation readiness
**Evidence:** Typecheck, Biome lint/format, Pandoc Markdown check,
MCPorter dependency check, 40 unit tests, 4 integration tests, 3 smoke
checks, opt-in real-Pi usage, source budget (\~1850/2000), package dry
run (113 files), CI YAML parsing, and whitespace checks passed. Reviews
identified and the implementation addressed skeletal module routing and
examples, canonical existing-file symlink escape, documented skill
precedence, plan fallback coverage, concise unavailable errors, section
routing, stale documentation, and diagram layout. **Limits:** The npm
release has not been created or published; the production audit retains
the inherited high-severity `brace-expansion` advisory through Pi.
**Checked:** 2026-07-31

## E-010 --- v1.2.0 Markdown, dependency, and release gate passed

**Status:** verified **Kind:** observed behaviour and renderer
compatibility **Source:** `scripts/format-markdown.mjs`, package
scripts, Discount `markdown`, Pandoc, npm lockfile, deterministic
checks, package dry run, and opt-in real-Pi usage acceptance
**Supports:** reproducible user-facing Markdown formatting,
brace-delimited project-state labels, latest dependency policy, Pi 0.83
compatibility, and v1.2.0 release readiness **Evidence:** Discount and
Pandoc both rendered `{accepted} Example.` literally as paragraph text.
`markdown:check` verified 18 named human-facing documents/templates
after `markdown:fix` applied Pandoc Markdown 3.10.1 at 72 columns. A
clean `npm ci` resolved Pi 0.83.0, Plannotator 0.25.1, TypeBox 1.3.8,
Node types 26.1.2, and the other manifest `latest` dependencies recorded
in the lockfile. Biome/style, Markdown check, typecheck, MCPorter
dependency check, 40 unit tests, 3 integration tests, 2 smoke checks,
source budget (\~1800/2000), package dry run (63 files), CI YAML
parsing, whitespace check, and one opt-in real-Pi workflow passed. The
code review wrapper was self-reviewed for lazy loading, feedback-error
propagation, and absence of plan-mode registration. Project-status
parsing accepts Pandoc's standard spaced JSON fence (```` ``` json ````)
as well as the compact form. The first v1.2.0 tag pipeline stopped
before tests or publication because Debian Pandoc 2.17 formatted
differently; CI and the formatter now require 3.10.1, and the complete
local gate was rerun successfully after that correction. **Limits:**
Literal `latest` ranges make future clean lockfile refreshes
intentionally non-reproducible until the refreshed lockfile is reviewed.
The committed lockfile fixes this release's actual graph. Production
audit still reports the inherited high-severity `brace-expansion`
advisory through Pi. Renderer checks establish literal brace handling,
not identical styling in every Markdown host. **Checked:** 2026-07-30

## E-002 --- Historical direct-module six-skill corpus (superseded)

**Status:** superseded **Kind:** historical observed behaviour
**Source:** `skills/`, `tests/unit/skills.test.mjs`, and
`tests/integration/package-load.test.mjs` **Supports:** the former
direct one-level module architecture only **Evidence:** The v2--v4.0.4
tests verified exactly six accepted names and descriptions, direct
module routes, non-skill module files, and Pi discovery of only
`project`, `write`, `analyze`, `code`, `review`, and `research`. E-022
replaces the structural claim with the current shared-method
architecture while preserving the six-skill public surface. **Limits:**
Historical structural tests and successful discovery did not establish
model adherence or the quality of every skill revision. **Checked:**
2026-07-30

## E-003 --- Configured remote-research transports passed bounded live checks

**Status:** verified **Kind:** observed behaviour **Source:** MCPorter
CLI checks against the user-held explicit configuration; Context7,
OpenAlex, and Scholar Gateway responses **Supports:** remote-research
integration and configuration-readiness claims **Evidence:** Schema
discovery connected to Context7, the configured OpenAlex stdio server,
and OAuth-authenticated Scholar Gateway. One bounded retrieval call to
each server returned a JSON response. **Limits:** These checks establish
only observed connectivity and bounded retrieval at that time. Remote
content remains external and non-authoritative until reviewed; OpenAlex
uses a third-party rolling `npx` server and full-host execution.
**Checked:** 2026-07-28

## E-009 --- Historical v1.2 skill-layering evidence (superseded)

**Status:** superseded **Kind:** historical observed behaviour and
package contents **Source:** `skills/`, `templates/STYLE.md`,
`templates/revealjs-baseline.css`, `README.md`,
`tests/unit/skills.test.mjs`, formatter evaluation notes **Supports:**
historical v1.2 review composition and package-default claims only
**Evidence:** This entry records the v1.2 corpus that was replaced by
the v2.0 six-skill architecture. See E-002 for the current skill
surface. The former writing, style, scholarly, theory, R/Quarto, slides,
verification, strategy, reconcile, retrospective, and project
briefing/initialization guidance was consolidated during that migration.
Formatter evaluation: preferred host command is Pandoc Markdown with
pipe tables retained and grid/simple/multiline tables disabled
(`-f markdown -t markdown+pipe_tables-simple_tables-multiline_tables-grid_tables --wrap=auto --columns=72`);
bare `-t markdown` rewrote tables to grids; GFM mode was evaluated but
not preferred; Prettier rewrote fences/tables; dprint wrapped prose and
realigned tables. No Markdown formatter dependency was added. Reveal
baseline is adapted from the package author's own talk CSS (not
third-party), documents `h1` titles and title-block `date` as
conference/meta, and requires a project-local copy path. README
inspirations are links only; no third-party code or protected prose was
copied into the package (external tools were inspected only for
independently restated ideas). This package remains MIT. Skill guidance
is not frozen by prose-presence tests beyond existing
front-matter/identity checks. **Limits:** Corpus guidance does not prove
real-model adherence. The private `~/.config/pi/skills/git-signing`
skill is user-owned and not packaged. **Checked:** 2026-07-30

## E-008 --- v1.2.0 interface, documentation, and skill review passed

**Status:** verified **Kind:** observed behaviour and reviewed
documentation **Source:** `extensions/workbench/index.ts`,
`extensions/workbench/src/project-status.ts`,
`extensions/workbench/src/worker-engine.ts`, `templates/PROJECT.md`,
public documentation, affected skills, deterministic checks, one opt-in
usage run, and interactive Plannotator review **Supports:**
model-visible worker and plan-review results, provider-compatible
schemas, mechanical project-state checks, project-state template,
human-facing documentation, and companion-skill guidance **Evidence:** A
live pre-change worker dispatch exposed only its summary to the
supervisor, and interactive Plannotator review decisions exposed only
approval/revision text; the v1.2.0 implementation formats the validated
result and review feedback into tool content, with unit coverage. The
public documentation and archived-skill comparison were reviewed through
Plannotator. Biome, typecheck, dependency check, 40 unit tests, 3
integration tests, 2 smoke checks, package dry-run, CI YAML parsing,
whitespace check, and the explicit real-Pi usage acceptance passed.
**Limits:** The interactive observations used the pre-release installed
extension; model-visible formatting is verified deterministically from
the v1.2.0 source and by the real-Pi session acceptance, but awaits a
published-package interactive session. Passing checks and reviewed skill
guidance do not establish universal provider, browser, or workflow
behavior. **Checked:** 2026-07-30

## E-007 --- Historical package and diagram review (superseded)

**Status:** superseded **Kind:** historical observed behaviour
**Source:** `docs/img/architecture.png`,
`docs/img/supervisors_context.png`, `README.md`, `ARCHITECTURE.md`,
`package.json`, and package dry-run output **Supports:** the visual
architecture and Pi gallery preview at the recorded release state only
**Evidence:** Both regenerated diagrams were visually checked against
the then-implemented tool names, timeout and dependency semantics,
worker context, optional project files, MCPorter boundary, and human
ownership. The package manifest included the diagrams and versioned
image URLs then used by the README and gallery metadata. **Limits:**
E-022 supersedes the diagrams' one-level skill wording. The files remain
packaged as historical images, but current documentation does not
present them as the architecture contract and current package metadata
omits a gallery image pending reviewed replacement artwork. **Checked:**
2026-07-30

## E-006 --- Opt-in local Pi usage acceptance passed

**Status:** verified **Kind:** observed behaviour **Source:**
`tests/usage/minimal-workflow.test.mjs`; one explicit local
`PI_SYCH_USAGE_TEST=1 npm run test:usage` run **Supports:** real-Pi
usage path and session/artifact inspection **Evidence:** A disposable
dummy project was given a real Pi prompt; the supervisor called
`project_status`, launched one clean-context read-only worker through
`dispatch_worker`, created `REPORT.md`, and the test inspected the saved
session JSON for both tool calls, the completed worker result, and the
artifact path. **Limits:** This is one local supervisor/worker model
run, not a CI guarantee or a broad quality assessment. It used locally
configured models and credentials. **Checked:** 2026-07-30

## E-005 --- Minimal architecture refactor passes deterministic acceptance

**Status:** verified **Kind:** observed behaviour **Source:**
`package.json`, `tests/unit`, `tests/integration`,
`scripts/check-source-budget.mjs` **Supports:** minimal runtime surface,
graph-aware project status, bounded dispatch, retained MCP/Plannotator
adapters, and production-code budget claims **Evidence:** The supervisor
exposes `dispatch_worker`, `project_status`, and `submit_plan`; the
worker exposes immutable result submission; semantic workflows are
packaged as skills; the rough production TypeScript estimate remains
below the 2,000-line limit; deterministic tests include actual worker
cancellation, graceful termination, forced-kill behavior, and rejection
of non-durable result-package paths. **Limits:** This does not establish
real-model usage, remote retrieval at the current time, or substantive
correctness of project artifacts. **Checked:** 2026-07-29

## E-004 --- Direct Plannotator adapter returned an explicit approved review

**Status:** verified **Kind:** observed behaviour **Source:**
Interactive `submit_plan` call for `.pi/plannotator-adapter-test.md`;
`tests/unit/package-status.test.mjs`;
`tests/integration/package-load.test.mjs` **Supports:** direct
plan-review adapter and unactivated-extension claims **Evidence:** The
supervisor's `submit_plan` opened a Plannotator browser review and did
not begin implementation. Package-load tests confirm Pi Sych registers
`/plannotator-annotate` and `/plannotator-last` while official
Plannotator commands are absent. The v1.0.3 wrapper exposed only
approval/revision text; v1.2.0 adds model-visible feedback formatting,
documented in E-008. **Limits:** This is one interactive approval
observation. It does not establish behavior for every browser, operating
system, future Plannotator release, or annotation workflow. **Checked:**
2026-07-28

## E-017 --- v3.0.4 audit completion pass

**Status:** verified **Kind:** observed behaviour and independent review
**Source:** current source, skills, deterministic tests, live usage
tests, package scripts, and current diagrams **Supports:** configured
project-root resolution, strict SYNC.json metadata policy,
canonical-path compaction rechecks, skill-contract safeguards, and
v3.0.4 release readiness **Evidence:** Biome at 100 columns, Markdown
formatting, typecheck, 67 unit checks, 5 integration checks, MCPorter
dependency validation, smoke checks, source budget (2,550/3,000),
package dry run, and whitespace checks passed. The live usage acceptance
passed for a nested Git workspace with `projectRoot` and configured
canonical paths; the live prompt-quality behavioral smoke test also
passed. `npm audit --omit=dev` reports the inherited upstream
`brace-expansion` advisory. **Limits:** Browser-specific review and
publication remain external operations; the accepted advisory is not a
Pi Sych dependency change. **Checked:** 2026-07-31

## E-019 --- v4.0.1 CI repair release

**Status:** verified **Kind:** observed CI behavior and release
verification **Source:** GitLab pipelines #52 (`main`) and #51
(`v4.0.1`), current source, and deterministic checks **Supports:** the
full-history checkout makes the tagged skill-migration corpus available
to the ledger test, and the signed patch release passes GitLab CI.
**Evidence:** both pipelines succeeded after setting `GIT_DEPTH: "0"`;
local style and Markdown checks, typecheck, 21 unit checks, 5
integration checks, dependency and smoke checks, source budget, package
dry run, and whitespace check passed. **Limits:** external publication
was not performed here. **Checked:** 2026-08-01

## E-018 --- v4.0.0 simplification release gate

**Status:** verified **Kind:** observed behavior and release
verification **Source:** current source, deterministic tests, live Pi
usage, package scripts, and package dry run **Supports:** the
sub-2,000-line simplification release, reduced worker result and
model-role catalog, append-only promotion inbox, retained
path/hash/dependency/acknowledgement invariants, and current package
readiness **Evidence:** style and Markdown checks, typecheck, 21 unit
checks, 5 integration checks, two opt-in live usage checks, MCPorter
dependency check, smoke check, source budget (1,550/2,000), package dry
run, and whitespace check passed. **Limits:** `npm audit --omit=dev`
reports one inherited high-severity `brace-expansion` advisory below
Pi's dependency tree; it is not a Pi Sych dependency change. The signed
commit and signed `v4.0.0` tag were pushed to `origin`. Browser-mediated
Plannotator behavior and npm publication remain external. **Checked:**
2026-08-01
