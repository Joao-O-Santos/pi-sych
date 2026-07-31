# Evidence

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
compaction model path and prompts. **Checked:** 2026-08-01

## E-013 --- v3.0.0 refactor and release gate passed

**Status:** verified **Kind:** observed behaviour and independent
reviews **Source:** `PLAN.md`, package scripts, unit/integration/usage
checks, package dry run, and independent read-only reviews **Supports:**
`SYNC.json` v2 resolution, canonical-role promotion routing, compaction
status/error isolation, skill restoration, and v3.0.0 release readiness
**Evidence:** Typecheck, Biome and Pandoc Markdown style, 62 unit
checks, 4 integration checks, opt-in real-Pi usage
(`PI_SYCH_USAGE_TEST=1`), live LLM-judged prompt-quality usage, source
budget (2,650/3,000), package dry run, and whitespace checks passed.
Independent reviews identified and the implementation addressed
non-atomic acknowledgement, malformed-manifest diagnostics, single
resolved-project threading, single-read canonical fingerprinting,
tracked-artifact preservation in working memory, v1.2.0 procedure
restoration, and regex-behavior test honesty. **Limits:** The npm
release has not been published; inherited advisory retention was not
rechecked for this entry. **Checked:** 2026-08-01

## E-012 --- v2.1.1 compaction and release gate passed

**Status:** verified **Kind:** observed behaviour and independent review
**Source:** `FOLLOW_UP.md`, `REUSE_REDUCTION_PLAN.md`, package scripts,
unit/integration/smoke checks, package dry run, and dependency audit
**Supports:** working-memory compaction, human-review `INBOX.md`
promotions, status visibility, and v2.1.1 release readiness
**Evidence:** Typecheck, Biome/Markdown style checks, clean
`npm ci --ignore-scripts`, MCPorter dependency validation, 49 unit
checks, 4 integration checks, 3 smoke checks, package dry run (114
files), whitespace check, and the 2,300/2,500 production TypeScript
budget passed. The reuse audit retained Pi's compaction lifecycle,
message conversion/serialization, model registry, authentication,
cancellation, and usage accounting; Pi's fixed summary helpers cannot
implement the one-call working-memory plus promotion contract.
**Limits:** Opt-in real-Pi usage was not rerun for v2.1.1.
`npm audit --omit=dev` retains one inherited high-severity
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

## E-002 --- Six-skill corpus has direct module structure

**Status:** verified **Kind:** observed behaviour **Source:** `skills/`,
`tests/unit/skills.test.mjs`, and
`tests/integration/package-load.test.mjs` **Supports:** the public
six-skill catalog, one-level guidance/example modules, and Pi discovery
claims **Evidence:** Unit tests verify exactly six accepted names and
descriptions, direct module routes, and non-skill module files. The RPC
integration test loaded the corpus through Pi and found only `project`,
`write`, `analyze`, `code`, `review`, and `research`. **Limits:**
Structural tests and successful discovery do not establish model
adherence or the quality of every future skill revision. **Checked:**
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

## E-007 --- Corrective package and diagram review passed

**Status:** verified **Kind:** observed behaviour **Source:**
`docs/img/architecture.png`, `docs/img/supervisors_context.png`,
`README.md`, `ARCHITECTURE.md`, `package.json`, and package dry-run
output **Supports:** current visual architecture, Pi gallery preview,
and packaged-documentation claims **Evidence:** Both regenerated
diagrams were visually checked against the implemented tool names,
timeout and dependency semantics, worker context, optional project
files, MCPorter boundary, and human ownership. The package manifest
includes the diagrams and versioned image URLs used by the README and
gallery metadata. **Limits:** Visual summaries omit implementation
detail and do not supersede the text documentation or code. Rendering on
Pi.dev remains dependent on publication and the gallery renderer
fetching the declared URL. **Checked:** 2026-07-30

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
