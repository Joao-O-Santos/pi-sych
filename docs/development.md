# Development

This guide is for contributors and maintainers: people filing useful
issues, proposing pull requests, or trying to understand why a small
change belongs in Pi Sych. The project favors the smallest
implementation that makes state, delegation, review, and verification
inspectable.

## Before changing code

Read `AGENTS.md`, `PROJECT.md`, `ARCHITECTURE.md`, and the relevant
tests. Treat `PLAN.md` as the accepted task boundary when one is
present. Keep semantic interpretation in skills and normal supervisor
conversation; keep path, process, schema, hash, and persistence
invariants mechanical in TypeScript.

For a substantive behavior change, first write or obtain an independent
test design. Implement the smallest focused correction, then obtain an
independent read-only review. Do not turn a narrow bug fix into a
workflow controller, repository abstraction, or new policy layer.

## Checks

Run the repository gate before opening a pull request:

``` sh
make verify
```

The Makefile remains a thin entry point over the project-native npm
scripts. Use `make typecheck`, `make style`, `make dependencies`,
`make budget`, `make test`, `make coverage`, or `make pack` for a
focused check; `make clean` removes generated site, test-build, and
coverage output. `npm test` compiles TypeScript into ignored
`.test-build/`, runs unit tests, and exercises package loading and
project status through RPC integration tests. The package's GitLab
pipeline runs the verification and Pages-site setup, and retains the
tag-based publication gate. Development and CI use Node 26 or newer;
TypeScript follows the current `latest` dev-tool policy. `make coverage`
runs the single Node built-in coverage command over the compiled unit
and integration tests. Coverage enforces at least 90% lines, branches,
and functions. `make verify` includes this gate, and GitLab records its
line percentage. The runtime source budget counts nonblank physical
lines, including comments, so readability spacing is free while
executable and explanatory source remains bounded. Contributors do not
publish directly.

`npm run test:usage` is opt-in. It uses real Pi/model calls against a
disposable project, requires local credentials, and may incur provider
cost. Report the actual model, selector, time, identifiers, and
limitations when using live checks.

## Tests are evidence, not decoration

Test process outcomes, path boundaries, malformed state, atomic writes,
worker result validation, and integration startup. Do not delete tests
to protect a line budget. A smaller runtime with untested termination or
persistence boundaries is not simpler for its users.

Use temporary directories and fake launchers in deterministic tests.
Never place credentials in fixtures. For package-load tests, use an
empty `PI_CODING_AGENT_DIR`, explicit `--no-*` resource flags, and exact
registered surface assertions. Keep deterministic tests local:
`npm run test:usage` is the separate opt-in live-model evidence path.

Skill-architecture tests mechanically verify the six public `SKILL.md`
files, hidden shared methods, required guidance and examples, resolvable
ordered recipes, acyclic routes, and prompt budgets. They do not freeze
semantic guidance through keyword or prose-presence assertions.

The prompt-quality fixtures run only through the opt-in live model
evaluation. That test validates each scenario, injects its target
guidance into a real model prompt, and asks a second model pass to judge
the stated required and prohibited properties. It requires
`PI_SYCH_USAGE_TEST=1`, configured credentials, and may incur cost or
vary by model and run. Its result is evaluation evidence, not a
deterministic contract or proof of adherence. See
`tests/usage/README.md`.

## Code and documentation style

Biome formats and lints TypeScript, JavaScript, and tests. Pandoc 3.10.1
(or greater) formats human-facing Markdown at 72 columns. Run
`npm run markdown:fix` when editing prose, then `npm run style`.

``` sh
npm run lint
npm run format:check
npm run markdown:check
npm run markdown:fix
npm run style
```

Use accessible headings, concrete verbs, short paragraphs, meaningful
link text, and alt text when an image carries information. Run the
Markdown formatter after prose changes. `make site` generates the live
code reference from current runtime source; do not hand-edit its staged
output. Write general usage documentation for users. Put runtime
contracts and model-facing instructions in supervisor-facing sections.
Write contributor material for developers other than the owner: explain
setup, checks, limits, issue reports, and pull requests without assuming
private context.

## Design constraints

- No generic workflow DAG, fixed agent pipeline, or duplicate MCP/review
  implementation.
- No command/path pseudo-security or sandbox claims.
- No credentials, provider choices, model ranking, or personal examples
  in the public package.
- Workers receive a smallest-complete explicit packet and no supervisor
  transcript.
- Durable consequential changes remain approval-gated.
- Use current public Pi and Plannotator interfaces rather than importing
  undocumented internals.
- Never claim execution, retrieval, rendering, review, or verification
  that did not occur.

## Pull requests

A useful PR states the user problem, the narrow behavior change, the
files that define the contract, and the checks that actually passed. Add
regression tests for process, path, parsing, and persistence boundaries.
Call out known upstream limitations instead of hiding them behind a
successful local run.
