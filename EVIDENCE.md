# Evidence

## E-001 — Deterministic package checks pass

**Status:** verified
**Kind:** observed behaviour
**Source:** `package.json`, `tests/unit`, and `tests/integration`
**Supports:** package readiness and deterministic-check claims
**Evidence:** The package scripts define typecheck, style, source-budget, unit, integration, and smoke checks; the current deterministic suites pass with 36 unit tests, 3 integration tests, and 2 smoke checks.
**Limits:** A passing local check does not establish host-wide security, real-model usage, or prove all scientific workflows.
**Checked:** 2026-07-29

## E-002 — Public skill corpus is separated from private overlay

**Status:** verified
**Kind:** observed behaviour
**Source:** `tests/unit/skills.test.mjs`
**Supports:** public/private separation and skill-corpus claims
**Evidence:** The skill tests check front matter and reject superseded integration, provider, and personal-overlay language.
**Limits:** Static corpus checks do not assess the quality of every future skill revision.
**Checked:** 2026-07-28

## E-003 — Configured remote-research transports passed bounded live checks

**Status:** verified
**Kind:** observed behaviour
**Source:** MCPorter CLI checks against the user-held explicit configuration; Context7, OpenAlex, and Scholar Gateway responses
**Supports:** remote-research integration and configuration-readiness claims
**Evidence:** Schema discovery connected to Context7, the configured OpenAlex stdio server, and OAuth-authenticated Scholar Gateway. One bounded retrieval call to each server returned a JSON response.
**Limits:** These checks establish only observed connectivity and bounded retrieval at that time. Remote content remains external and non-authoritative until reviewed; OpenAlex uses a third-party rolling `npx` server and full-host execution.
**Checked:** 2026-07-28

## E-008 — v1.1.0 interface, documentation, and skill review passed

**Status:** verified
**Kind:** observed behaviour and reviewed documentation
**Source:** `extensions/workbench/index.ts`, `extensions/workbench/src/project-status.ts`, `extensions/workbench/src/worker-engine.ts`, `templates/PROJECT.md`, public documentation, affected skills, deterministic checks, one opt-in usage run, and interactive Plannotator review
**Supports:** model-visible worker and plan-review results, provider-compatible schemas, mechanical project-state checks, project-state template, human-facing documentation, and companion-skill guidance
**Evidence:** A live pre-change worker dispatch exposed only its summary to the supervisor, and interactive Plannotator review decisions exposed only approval/revision text; the v1.1.0 implementation formats the validated result and review feedback into tool content, with unit coverage. The public documentation and archived-skill comparison were reviewed through Plannotator. Biome, typecheck, dependency check, 36 unit tests, 3 integration tests, 2 smoke checks, package dry-run, CI YAML parsing, whitespace check, and the explicit real-Pi usage acceptance passed.
**Limits:** The interactive observations used the pre-release installed extension; model-visible formatting is verified deterministically from the v1.1.0 source and by the real-Pi session acceptance, but awaits a published-package interactive session. Passing checks and reviewed skill guidance do not establish universal provider, browser, or workflow behavior.
**Checked:** 2026-07-30

## E-007 — Corrective package and diagram review passed

**Status:** verified
**Kind:** observed behaviour
**Source:** `docs/img/architecture.png`, `docs/img/supervisors_context.png`, `README.md`, `ARCHITECTURE.md`, `package.json`, and package dry-run output
**Supports:** current visual architecture, Pi gallery preview, and packaged-documentation claims
**Evidence:** Both regenerated diagrams were visually checked against the implemented tool names, timeout and dependency semantics, worker context, optional project files, MCPorter boundary, and human ownership. The package manifest includes the diagrams and versioned image URLs used by the README and gallery metadata.
**Limits:** Visual summaries omit implementation detail and do not supersede the text documentation or code. Rendering on Pi.dev remains dependent on publication and the gallery renderer fetching the declared URL.
**Checked:** 2026-07-30

## E-006 — Opt-in local Pi usage acceptance passed

**Status:** verified
**Kind:** observed behaviour
**Source:** `tests/usage/minimal-workflow.test.mjs`; one explicit local `PI_SYCH_USAGE_TEST=1 npm run test:usage` run
**Supports:** real-Pi usage path and session/artifact inspection
**Evidence:** A disposable dummy project was given a real Pi prompt; the supervisor called `project_status`, launched one clean-context read-only worker through `dispatch_worker`, created `REPORT.md`, and the test inspected the saved session JSON for both tool calls, the completed worker result, and the artifact path.
**Limits:** This is one local supervisor/worker model run, not a CI guarantee or a broad quality assessment. It used locally configured models and credentials.
**Checked:** 2026-07-30

## E-005 — Minimal architecture refactor passes deterministic acceptance

**Status:** verified
**Kind:** observed behaviour
**Source:** `package.json`, `tests/unit`, `tests/integration`, `scripts/check-source-budget.mjs`
**Supports:** minimal runtime surface, graph-aware project status, bounded dispatch, retained MCP/Plannotator adapters, and production-code budget claims
**Evidence:** The supervisor exposes `dispatch_worker`, `project_status`, and `submit_plan`; the worker exposes immutable result submission; semantic workflows are packaged as skills; the rough production TypeScript estimate remains below the 2,000-line limit; deterministic tests include actual worker cancellation, graceful termination, forced-kill behavior, and rejection of non-durable result-package paths.
**Limits:** This does not establish real-model usage, remote retrieval at the current time, or substantive correctness of project artifacts.
**Checked:** 2026-07-29

## E-004 — Direct Plannotator adapter returned an explicit approved review

**Status:** verified
**Kind:** observed behaviour
**Source:** Interactive `submit_plan` call for `.pi/plannotator-adapter-test.md`; `tests/unit/package-status.test.mjs`; `tests/integration/package-load.test.mjs`
**Supports:** direct plan-review adapter and unactivated-extension claims
**Evidence:** The supervisor's `submit_plan` opened a Plannotator browser review and did not begin implementation. Package-load tests confirm Pi Sych registers `/plannotator-annotate` and `/plannotator-last` while official Plannotator commands are absent. The v1.0.3 wrapper exposed only approval/revision text; v1.1.0 adds model-visible feedback formatting, documented in E-008.
**Limits:** This is one interactive approval observation. It does not establish behavior for every browser, operating system, future Plannotator release, or annotation workflow.
**Checked:** 2026-07-28
