# Development

Pi Sych favors the smallest implementation that makes project state, delegation, review, and verification truthful. Add a focused function or tool only when existing Pi, Plannotator, or MCPorter interfaces cannot provide the behavior.

## Checks

```sh
npm run typecheck
npm run test:deps
npm test
npm run smoke
npm pack --dry-run
git diff --check
```

`npm test` compiles TypeScript into ignored `.test-build/`, runs deterministic unit tests, and exercises Pi package loading through RPC integration tests. Live MCP checks are opt-in and must report actual server, selector, time, identifiers, and limitations.

## Design constraints

- No generic workflow DAG, fixed agent pipeline, compatibility matrix, or duplicate MCP/review implementation.
- No command/path pseudo-security or sandbox claims.
- Keep provider choices, credentials, model ranking, and personal examples in private configuration.
- Workers receive a smallest-complete explicit packet and no supervisor transcript.
- Use current public Pi and Plannotator interfaces rather than importing undocumented internals.
- Durable consequential changes remain approval-gated.
- For Git work, default to `main`, atomic verified commits, and explicit approval for remote, shared-history, or branch-deletion operations; respect an established repository commit convention. Prefer true merges over squash merges, and rebase only a private unpushed branch after explicit authorization.
- Never claim execution, retrieval, rendering, review, or verification that did not occur.

For a clean package-load test, use an empty temporary `PI_CODING_AGENT_DIR` and explicit `--no-*` resource flags. For worker tests, use a temporary agent directory and the bootstrap helper. Never use real credentials in fixtures or deterministic tests.
