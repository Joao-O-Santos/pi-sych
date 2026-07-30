# Development

This guide is for package contributors. Pi Sych favors the smallest
implementation that makes project state, delegation, review, and
verification inspectable. Add a focused function or tool only when
existing Pi, Plannotator, or MCPorter interfaces cannot provide the
behavior.

## Checks

``` sh
npm run typecheck
npm run style
npm run test:deps
npm run source:budget
npm test
npm run smoke
npm pack --dry-run
git diff --check
```

`npm test` compiles TypeScript into ignored `.test-build/`, runs
deterministic unit tests, and exercises Pi package loading through RPC
integration tests. Live MCP checks are opt-in and must report actual
server, selector, time, identifiers, and limitations.

## Opt-in local usage acceptance

`npm run test:usage` is intentionally excluded from `npm test` and CI.
It is gated by `PI_SYCH_USAGE_TEST=1`, uses real Pi/model calls against
a disposable dummy project, exercises `project_status` and one
clean-context `dispatch_worker` call, and inspects the resulting
artifact and session JSON. Run it only when real-model behavior adds
value beyond deterministic tests; it requires configured local model
credentials and can incur provider cost.

## Code style

Biome formats and lints the TypeScript, JavaScript, and test sources.
Pandoc 3.10.1 formats the listed human-facing Markdown and templates at
72 columns. The fixed formatter version prevents source churn across
Pandoc releases; CI installs that release explicitly. Structural code
indentation uses tabs; Biome owns code wrapping and other layout rather
than preserving manual column alignment.

``` sh
npm run lint            # code lint only
npm run format:check    # code formatting only, without writes
npm run markdown:check  # check human-facing Markdown with Pandoc
npm run markdown:fix    # apply Pandoc 72-column Markdown formatting
npm run style           # CI-equivalent code and Markdown checks
npm run format:fix      # apply code formatting and safe lint fixes
```

This is a project-local style, not a claim of full Google TypeScript
Style compliance. For background on tab indentation, see [Why tabs are
clearly
superior](https://lea.verou.me/blog/2012/01/why-tabs-are-clearly-superior/).
[XO configuration](https://github.com/xojs/xo#config) is a useful
reference for a more opinionated ESLint-based alternative; Pi Sych uses
Biome, not XO.

## Design constraints

- No generic workflow DAG, fixed agent pipeline, compatibility matrix,
  or duplicate MCP/review implementation. Project-declared dependency
  edges are a flexible mechanical graph, not a workflow engine.
- No command/path pseudo-security or sandbox claims.
- Keep provider choices, credentials, model ranking, and personal
  examples in private configuration.
- Workers receive a smallest-complete explicit packet and no supervisor
  transcript.
- Use current public Pi and Plannotator interfaces rather than importing
  undocumented internals.
- Durable consequential changes remain approval-gated.
- For Git work, default to `main`, atomic verified commits, and explicit
  approval for remote, shared-history, or branch-deletion operations;
  respect an established repository commit convention. Prefer true
  merges over squash merges, and rebase only a private unpushed branch
  after explicit authorization.
- Never claim execution, retrieval, rendering, review, or verification
  that did not occur.

For a clean package-load test, use an empty temporary
`PI_CODING_AGENT_DIR` and explicit `--no-*` resource flags. For worker
tests, use a temporary agent directory and the bootstrap helper. Never
use real credentials in fixtures or deterministic tests.
