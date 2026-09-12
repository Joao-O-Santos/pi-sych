# Development

Pi Sych favors the smallest implementation that keeps state, delegation,
review, and verification inspectable.

## Before changing code

Read `AGENTS.md`, `PROJECT.md`, `docs/ARCHITECTURE.md`, and relevant
tests. A clear owner instruction to implement a defined change, or an
explicitly approved `PLAN.md`, establishes the accepted task boundary.
File existence alone does not establish approval. Do not manufacture a
new checkpoint merely because authorized work is large; ask when a new
consequential choice falls outside the accepted boundary.

Keep semantic interpretation in skills and normal supervisor
conversation; keep path, process, schema, hash, and persistence
invariants mechanical in TypeScript.

For substantive behavior changes, use independent test design and
read-only review when proportionate. Do not turn a narrow correction
into a workflow controller, repository abstraction, or new policy layer.

## Checks

Run the repository gate before treating substantive work as complete:

``` sh
make verify
```

Use focused Make/npm targets while iterating. `npm run test:usage` is an
opt-in live-model evaluation and is evidence rather than a deterministic
contract.

Skill-architecture tests verify the seven public `SKILL.md` files,
hidden shared methods, required guidance/examples, resolvable recipes,
acyclic routes, and prompt budgets. They should not freeze semantic
prose through keyword assertions unless the wording itself is a public
contract.

## Model-facing text

Treat model-facing text as behavior-bearing interface surface. Put only
high-salience cross-domain invariants in always-visible supervisor/tool
text. Put domain posture and routing in umbrella skills. Put detailed
procedure in routed methods/modules. Avoid duplicated instructions whose
copies can drift or compete for attention.

Prefer concrete verbs, explicit authority and scope, short decision
rules, and stated failure modes. Distinguish authorization from task
size, persistence from scrutiny, and context need from delegation choice.

## Design constraints

- No generic workflow DAG, fixed agent pipeline, or duplicate MCP/review
  implementation.
- No command/path pseudo-security or sandbox claims.
- No credentials, provider choices, model ranking, or personal examples
  in the public package.
- Workers receive one smallest-complete assignment; clean mode receives
  no supervisor transcript, while trajectory mode receives only the
  persisted branch before its exact dispatch entry.
- Clear user authorization covers the named scope; new consequential
  choices outside that scope remain human-owned.
- Never claim execution, retrieval, rendering, review, or verification
  that did not occur.
