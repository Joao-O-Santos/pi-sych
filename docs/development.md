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

## Where changes belong

Use the [code tour](code-tour.md) for the source map and the [public
contract](public-contract.md) to distinguish stable userland from
internal implementation details.

| Change | Primary location | Related checks |
|------------------------|------------------------|------------------------|
| Supervisor tool or lifecycle behavior | `extensions/workbench/index.ts` and `extensions/workbench/src/` | Unit/integration tests and public contract |
| Worker launch, context, or terminal report | `extensions/workbench/src/worker-engine.ts`, `extensions/worker/index.ts` | Worker and process tests; architecture |
| Fingerprints or dependency acknowledgement | `project-files.ts`, `project-status.ts` | State and acknowledgement tests; `SYNC.json` |
| Local literature discovery | `literature-search.ts` | Database fixtures; configuration |
| Domain-specific review or writing behavior | Public skill, routed module, or shared method | Skill routing and task-level evaluation |
| Optional review interface | `extensions/plannotator/` | Adapter tests and review workflow |
| Optional review lens | `prompts/review-*.md` | Prompt discovery and review skill consistency |

Do not turn a documentation-only clarification into a new runtime
mechanism. Conversely, a behavior change must be documented where users
encounter it, not only in the code tour.

## Documentation and synchronization checks

For a documentation update, inspect the relevant implementation and
tests before asserting runtime behavior. Keep the README as orientation,
architecture as the mechanism-level explanation, public contract as the
compatibility authority, and code tour as a navigable source map. Use
`docs/review-workflow.md` for human/LLM feedback distinctions and
`docs/review-prompts.md` for optional review lenses. Avoid repeating
full skill instructions across these pages.

Review `SYNC.json` after changes to tracked documents. A stored
fingerprint that no longer matches is evidence of a change, not
permission to mark it approved. Update acknowledgement only after
reviewing the new content and declared dependent artifacts. Preserve
unresolved `needs-review` states and do not invent test results or
review timestamps.

`make verify` checks types, style, source budget, coverage, packaging,
and Git whitespace. Run `make site` separately to check the published
documentation build and links. A remote edit without a local checkout
cannot establish that either command passed; report that limitation.

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
acyclic routes, and intended specialist composition. They should not
freeze semantic prose through keyword assertions unless the wording
itself is a public contract.

## Model-facing text

Treat model-facing text as behavior-bearing interface surface. Put only
high-salience cross-domain invariants in always-visible supervisor/tool
text. Put domain posture and routing in umbrella skills. Put detailed
procedure in routed methods/modules. Avoid duplicated instructions whose
copies can drift or compete for attention.

Prefer concrete verbs, explicit authority and scope, short decision
rules, and stated failure modes. Distinguish authorization from task
size, persistence from scrutiny, and context need from delegation
choice.

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
