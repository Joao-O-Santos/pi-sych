# Evidence

## E-001 — Deterministic package checks pass

**Status:** verified
**Kind:** observed behaviour
**Source:** `package.json`, `tests/unit`, and `tests/integration`
**Supports:** package readiness and deterministic-check claims
**Evidence:** The package scripts define typecheck, style, source-budget, unit, integration, and smoke checks; the refactored deterministic suites pass with 27 unit tests, 3 integration tests, and 2 smoke checks.
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

## E-006 — Opt-in local Pi usage acceptance passed

**Status:** verified
**Kind:** observed behaviour
**Source:** `tests/usage/minimal-workflow.test.mjs`; one explicit local `PI_SYCH_USAGE_TEST=1 npm run test:usage` run
**Supports:** real-Pi usage path and session/artifact inspection
**Evidence:** A disposable dummy project was given a real Pi prompt; the run created `REPORT.md` and the test inspected the saved session JSON for the `project_status` call and artifact path.
**Limits:** This is one local model run, not a CI guarantee or a broad quality assessment. It used the locally configured model and credentials.
**Checked:** 2026-07-30

## E-005 — Minimal architecture refactor passes deterministic acceptance

**Status:** verified
**Kind:** observed behaviour
**Source:** `package.json`, `tests/unit`, `tests/integration`, `scripts/check-source-budget.mjs`
**Supports:** minimal runtime surface, graph-aware project status, bounded dispatch, retained MCP/Plannotator adapters, and production-code budget claims
**Evidence:** The supervisor exposes `dispatch_worker`, `project_status`, and `submit_plan`; the worker exposes immutable result submission; semantic workflows are packaged as skills; the rough production TypeScript estimate is about 1,600 lines against a 2,000-line limit; deterministic tests and smoke checks pass.
**Limits:** This does not establish real-model usage, remote retrieval at the current time, or substantive correctness of project artifacts.
**Checked:** 2026-07-29

## E-004 — Direct Plannotator adapter returned an explicit approved review

**Status:** verified
**Kind:** observed behaviour
**Source:** Interactive `submit_plan` call for `.pi/plannotator-adapter-test.md`; `tests/unit/package-status.test.mjs`; `tests/integration/package-load.test.mjs`
**Supports:** direct plan-review adapter and unactivated-extension claims
**Evidence:** The supervisor's `submit_plan` opened a Plannotator browser review, returned an explicit approval with annotated feedback, and did not begin implementation. Package-load tests confirm Pi Sych registers `/plannotator-annotate` and `/plannotator-last` while official Plannotator commands are absent.
**Limits:** This is one interactive approval observation. It does not establish behavior for every browser, operating system, future Plannotator release, or annotation workflow.
**Checked:** 2026-07-28
