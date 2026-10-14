# Delegation possibilities

Choose a working pattern by where understanding, execution, and verification
are needed. These are composable possibilities, not required stages, fixed
agent roles, or a workflow controller. Direct work remains useful for small or
tightly coupled tasks. Do not add workers merely to enact a diagram.

## Patterns and trade-offs

- **Supervisor pre-walk → builder:** the supervisor explores the actual
  material, resolves the approach, and may make and check a representative
  first change before delegating the remaining bounded work. This is especially
  useful when interpretation is the hard part and execution becomes routine
  afterward. Prefer this direction over cheap exploration followed only by a
  summary when the stronger model needs firsthand understanding. A checked
  example can anchor execution, but neither a first edit nor a fixed turn count
  proves readiness. Delegate when the remaining scope and checks are clear.
- **Planner → builder:** prepare an explicit brief or plan and delegate
  implementation without a first change. Useful when requirements, interfaces,
  examples, and verification are already sufficiently concrete. This does not
  imply a clean handoff: `dispatch_worker` can pass the planner's trajectory
  as well as the plan and source files, combining planner/builder separation
  with pre-walk-like context continuity even without a first edit. Use clean
  context when the packet is sufficient; use trajectory when the plan omits
  useful exploration, reasoning, or rejected approaches. Neither is universally
  preferred. In either case, the builder can inspect current source material.
- **Orchestrator → builders:** divide substantial work as its shape becomes
  clear, assigning bounded outcomes and integrating the results. Useful for
  separable areas or specialties, not as an excuse to fragment tightly coupled
  reasoning. Parallelize independent reads or genuinely disjoint edits only
  when their dependencies permit it; workers share project files, not isolated
  worktrees. Otherwise sequence changes and verify the integrated artifact.
- **Explorer → supervisor:** delegate bounded reconnaissance, source discovery,
  inventories, or independent hypotheses when breadth or context isolation
  helps. Ask for paths, symbols, source URLs, relevant excerpts, uncertainty,
  and unresolved alternatives, not just a confident synthesis. A summary is
  the explorer's interpretation, not a substitute for the underlying material.
  The supervisor should inspect decisive sources before choosing an approach;
  do not make the cheaper model's omissions invisible to the stronger one.
- **Builder → independent reviewer/test designer:** use a fresh perspective
  for targeted scrutiny or independently designed checks when warranted.
  Clean context can reduce anchoring on the builder's rationale; include the
  actual artifact, requirements, and relevant evidence. Findings are proposals
  to assess, not automatic revision orders or approval. A different model can
  add diversity, but model count alone does not establish correctness.

Combine or skip these patterns as needed. A builder can return a blocker that
requires supervisor exploration; a reconnaissance result can enable direct
work rather than another dispatch. Avoid automatic retry/review loops and
repeated user checkpoints within already authorized work.

## Compose a dispatch from independent choices

Use the active `dispatch_worker` declaration as the executable contract:

| Choice | What it enables |
| --- | --- |
| `task` + `expectedOutput` | One bounded outcome, authorization/non-goals, and a concrete report or deliverable; include verification and escalation conditions. |
| `contextFiles` | A smallest complete packet with a purpose for each file; source material, accepted constraints, plan, examples, and checks rather than summaries alone. Project-relative and explicitly readable absolute paths are supported. |
| `contextMode: clean` | Fresh work from the explicit packet; suitable for self-contained implementation, independent review, or exploration without transcript anchoring. This is the default. |
| `contextMode: trajectory` | A branch of persisted supervisor history immediately before the dispatching assistant entry; useful when exploration, rejected approaches, or reasoning materially help. Not live shared memory or another worker's transcript. |
| `mode` | Required tool selection: `read-only` for inspection/review, `edit` for changes without Bash, `full-host` when Bash or wider host access is needed. Not a sandbox or permission boundary; keep authorized effects explicit. |
| `modelRole` + `thinkingLevel` | Match the configured model and effort to interpretation, routine execution, specialization, or independent review; avoid invented role names. Omitted effort uses the model default; supported effort is model-dependent. |
| `skills` | Exact selectors chosen after inspecting the catalogue, only for methods useful to this assignment. They do not create new authorization or automatically enable tools. |
| `workerInstructions` | Optional launch-specific, durable-agent-style guidance loaded through native AGENTS discovery. Use when role-wide conventions matter; keep the concrete task in `task`, not hidden in agent instructions. |
| `remoteResearch` | Explicitly enable worker Pi-native MCP/codemode for remote retrieval; selecting `research` alone gives only local literature lookup. Worker configuration/authentication is its own, not copied from the supervisor; access is not guaranteed. |
| `timeoutMs` | Bound one launch, proportionate to the assignment (default 90 seconds, maximum 30 minutes). Prefer coherent bounded work to an unbounded worker mandate. |

For a pre-walk-like handoff, `trajectory` preserves more exploration than a
plan-only packet, while current files remain the source of truth. Pi Sych
branches a short-lived worker; it does **not** swap the supervisor's model,
remove earlier planning instructions, or guarantee a complete uncompressed
history. Put continuation scope in the explicit assignment so old planning
instructions do not masquerade as the current task. If history is unavailable
or unnecessary, use a complete clean packet instead. Workers still read their
specified context files; trajectory does not promise zero repeated reads.

## Integrate evidence, not claimed success

Inspect terminal status and limitations alongside the actual outputs and
appropriate checks. Results distinguish reported paths, observed changes, and
unexpected changes; concurrent activity can complicate attribution. A failed
or interrupted launch can still have changed files. An `interruptedReport` is
provisional evidence, not successful completion, and observation does not roll
back edits. Reconcile actual state before retrying; do not replay completed work
blindly. Mechanical validation and immutable reports do not settle meaning,
correctness, or approval.

See [examples](examples.md) for alternative handoffs, and
[plans](../plans/guidance.md) for proportionate durable coordination.

## Background, not performance promises

These primary accounts describe possibilities, not Pi Sych requirements:

- Can Bölük, [prewalk](https://stencil.so/blog/prewalk): frontier exploration,
  a bounded todo list, first edit, then a cheaper model on the same trajectory.
  Its reported cost/speed/pass-rate results are author-reported and specific to
  its harness and model runs, not verified guarantees for Pi Sych.
- Anthropic, [orchestrator-workers](https://www.anthropic.com/engineering/building-effective-agents):
  dynamic decomposition and synthesis, with simplicity preferred to machinery.
- Cursor, [planners and workers](https://cursor.com/blog/scaling-agents):
  role separation in large long-running experiments. Its recursive planners,
  shared-branch concurrency, and publication behavior are not dispatch features
  or authorization to reproduce that system here.
