# Pi Sych simplification and Pi 0.99 integration

This is a **pre-release implementation checklist**, not a commitment to a version
number. Do the compatibility-neutral cleanup first. Decide the release number
from the final public delta, not from the size of the refactor.

The native-MCP transition is expected to be a **v8** release. Use that breaking
release to simplify aggressively, but do not delete user-facing configuration
that expresses Pi-Sych-specific semantics. In particular, v8 must retain a
small layered Pi Sych `config.json` for custom compaction policy and local
literature paths; native Pi configuration should own only settings that Pi
itself understands.

The goal is not to add a Pi 0.99 abstraction layer. The goal is to delete code
that Pi now owns, strengthen the few Pi Sych-specific capabilities that remain,
and make the Bakery packages compose naturally without runtime coupling.

## Architectural target

Keep Pi Sych responsible for:

- project resolution and explicit durable state;
- mechanical project status and acknowledgement;
- short-lived clean/trajectory worker dispatch;
- the small worker result protocol;
- local literature discovery;
- Pi Sych skills and writing/research/analysis guidance;
- task-centred custom compaction if it still adds enough value over native Pi;
- optional human review through the separate Plannotator extension.

Let Pi own:

- MCP transport, connection lifecycle, OAuth and provider-token auth;
- MCP server discovery, status and `/mcp`;
- codemode execution and nested tool composition;
- ordinary package/resource enable/disable controls;
- its native context-window compaction machinery and fallback behavior; and
- provider/model authentication.

Pi Sych must continue to own its **absolute proactive compaction threshold** and
its custom compaction semantics. Native Pi settings are not a substitute unless
they can express those semantics directly without abusing unrelated settings.

Let companion Bakery packages own their own tools. Pi Sych should reason about
capabilities such as document handling, known-URL retrieval, or browser
interaction, not import or identify package implementations.

## Phase 1 — simplify before adding anything

### Remove package-specific capability machinery

- [ ] Delete `extensions/workbench/src/pew-pew.ts`.
- [ ] Delete the automatic PEW-PEW extension-path inheritance from
  `dispatch_worker`.
- [ ] Delete `tests/unit/pew-pew.test.mjs`.
- [ ] Do not replace it with a generic package registry or source-provenance
  scanner.
- [ ] Treat an active `web` tool in the supervisor as an ordinary capability.
  Its own schema/guidance explains how to use it.
- [ ] Do not automatically copy supervisor companion extensions into workers.
  A separate worker process should continue to have an explicit, inspectable
  tool surface.

### Remove redundant capability narration

- [ ] Reassess `capabilitySummary()` from first principles.
- [ ] Remove the generic list of active tools from the injected system prompt:
  Pi already declares active tools and their guidance to the model.
- [ ] Do not reproduce native MCP server summaries: Pi 0.99.2 now supplies a
  short `mcp_servers` section itself.
- [ ] Do not reproduce companion-package descriptions in Pi Sych.
- [ ] Retain only Pi-Sych-specific hidden state if the model genuinely cannot
  learn it from the tool surface when needed.
- [ ] Prefer no startup capability summary over a new replacement abstraction.
- [ ] Delete exact-string tests for capability-summary prose when the summary is
  removed.

### Keep a small layered Pi Sych configuration

**v8 requirement: do not delete `config.json`.** Reduce it to settings Pi Sych
genuinely owns and make global/project configuration layer predictably.

Native `pi config` should control whether separately packaged Pi resources are
loaded. Pi Sych `config.json` should control Pi-Sych-specific behavior and
paths that native Pi does not model.

Required v8 behavior:

- [ ] Load a global Pi Sych config from the normal Pi user configuration root,
  e.g. `<pi-config-root>/pi-sych/config.json`.
- [ ] Independently look for a project override at
  `<projectRoot>/.pi/pi-sych/config.json`.
- [ ] Merge **global first, project second**. The project file overrides only
  the keys it supplies; its existence must not suppress unrelated global
  settings.
- [ ] Merge nested objects by field where appropriate. A project that overrides
  only `literatureDatabase` must inherit the global compaction settings.
- [ ] Keep configuration parsing strict enough to catch misspelled/unknown keys
  rather than silently ignoring them.
- [ ] Keep configuration files free of credentials and provider tokens.

The intended minimal v8 surface is approximately:

```json
{
  "version": 2,
  "compaction": {
    "custom": true,
    "thresholdTokens": 150000
  },
  "literatureDatabase": "/path/to/library.sqlite"
}
```

Exact naming may be refined during implementation, but the semantics are
requirements:

- [ ] `compaction.custom` remains user-configurable. When true, Pi Sych supplies
  its custom task-centred compaction, including working-memory structure,
  project-state reconciliation and visibly unreviewed memory-promotion
  proposals. When false, do not replace native Pi compaction.
- [ ] The default proactive Pi Sych threshold is **150,000 context tokens**.
- [ ] `thresholdTokens` is a Pi Sych threshold, not an alias for Pi
  `reserveTokens`. Do not emulate it by changing reserve/output-budget
  settings.
- [ ] Trigger proactive compaction only at a safe settled/idle boundary and
  preserve cancellation/reentrancy protection.
- [ ] Native Pi may still compact earlier when its own context-window safety
  rules require it; when custom compaction is enabled, the Pi Sych
  `session_before_compact` hook should provide the custom summary for those
  compactions too.
- [ ] If the active model cannot meaningfully reach 150k context, do not create
  an impossible trigger or interfere with native safety compaction.
- [ ] Keep `literatureDatabase` user-configurable.
- [ ] Allow `literatureDatabase` to be either absolute or relative.
- [ ] Resolve a relative global value relative to the global Pi Sych config
  location; resolve a relative project override relative to the project root.
- [ ] A project-specific `literatureDatabase` must cleanly override the global
  library for that project.
- [ ] If `literatureDatabase` is absent at both levels, retain a sensible
  conventional default such as the existing Pi Sych local database path.
- [ ] Preserve read-only database access regardless of where the configured
  database lives.

Settings to remove because another component owns them:

- [ ] Remove `mcporterConfig` with MCPorter; native Pi owns `mcp.json`.
- [ ] Remove `review.mode` if Plannotator enable/disable can be expressed by
  native Pi package/resource selection.
- [ ] Prefer a conventional worker-agent path instead of keeping
  `workerAgentDir` configurable unless a concrete use case requires it.
- [ ] Prefer a conventional Pi Sych worker-role catalogue path; rename it to
  `worker-models.json` if that avoids confusion with Pi's native
  `models.json`.

Implementation constraints:

- [ ] Refactor the current `piConfigRoot()` behavior: a project `.pi`
  directory must no longer replace the global Pi Sych config root wholesale.
  Global and project Pi Sych configs are separate inputs that are explicitly
  layered.
- [ ] Give config merging one implementation owner and test it directly.
- [ ] Do not create a generic settings framework; this remains a very small
  typed configuration object.
- [ ] Do not add runtime migration machinery for v7 configuration. Document the
  v7 -> v8 key changes instead.

### Use Pi-native resource selection

- [ ] Consider making custom compaction a third explicit package extension:
  `workbench`, `compaction`, `plannotator`.
- [ ] If split, the compaction extension should only register the
  `session_before_compact` behavior and reuse existing helpers; do not create
  a second orchestration layer.
- [ ] Let `pi config` disable Plannotator (and other independently loadable
  Pi Sych resources) instead of maintaining duplicate Pi Sych enable/disable
  flags.
- [ ] Do **not** delegate the 150k proactive compaction policy to `pi config`:
  it is Pi-Sych-specific behavior and stays in the layered Pi Sych config.
- [ ] Keep the settled/idle proactive trigger, updating its default from 100k to
  150k and simplifying its implementation where Pi 0.99 lifecycle APIs permit.
- [ ] Preserve native Pi fallback whenever custom compaction returns no result.

## Phase 2 — make custom compaction smaller and more host-native

Custom compaction is worth retaining only for the behavior Pi Sych actually
adds: task-centred continuation, canonical project context, explicit provenance,
project-state gaps, and unreviewed promotion proposals.

- [ ] Keep those Pi-Sych-specific semantics; delete lifecycle/auth/transport
  code now supplied by Pi.
- [ ] Replace manual `getApiKeyAndHeaders()` +
  `@earendil-works/pi-ai/compat complete()` plumbing with the host-owned
  `ctx.modelRegistry.complete()`/current public equivalent when the installed
  0.99.2 API can preserve the required cancellation, output budget and usage
  accounting.
- [ ] Remove direct API-key/header/env handling from Pi Sych compaction.
- [ ] Keep the custom observable-message serialization only where it has a
  semantic reason. In particular, do not switch blindly to Pi's stock
  `serializeConversation()` if that would reintroduce assistant thinking into
  the summarization input.
- [ ] Compare Pi's current bounded tool-result/file-operation helpers with the
  Pi Sych equivalents and reuse exported host helpers only when doing so
  actually removes code without weakening the no-hidden-reasoning or
  instruction/data boundaries.
- [ ] Move compaction-specific tests out of worker-engine test files.
- [ ] Replace 100k trigger tests with focused tests for the configurable 150k
  default, project override, below/at/above threshold, pending-message guard,
  reentrancy guard and native fallback.
- [ ] Preserve failure-to-native fallback, bounded inputs, canonical-file
  rechecks before proposal persistence, and no mutation of accepted semantic
  files.

## Phase 3 — native MCP, no Pi Sych MCP client

### Delete MCPorter

- [ ] Validate the required real services first: Context7, OpenAlex and
  Wiley/Scholar Gateway.
- [ ] Confirm each required service works through Pi 0.99.2 native stdio or
  Streamable HTTP, including its real authentication path.
- [ ] If a required service is legacy-SSE-only, record that concrete blocker
  before retaining any fallback.
- [ ] Once the real services pass, remove `pi-mcporter` from
  `optionalDependencies`.
- [ ] Delete `extensions/workbench/src/mcporter.ts`.
- [ ] Delete `scripts/check-mcporter-dependencies.mjs`.
- [ ] Delete `tests/unit/mcporter.test.mjs`.
- [ ] Remove `MCPORTER_CONFIG`, `mcporter` from worker tools, dependency
  checks, fixtures, setup prose and generated docs.

### Do not replace `/pi-sych-mcp`

- [ ] Remove `/pi-sych-mcp`.
- [ ] Do not implement a Pi Sych wrapper around native MCP status/configuration.
- [ ] Document Pi's own `/mcp`, `pi mcp list`, `pi mcp login`, and
  `pi mcp logout` instead.
- [ ] Do not parse native `mcp.json` in Pi Sych merely to reproduce information
  Pi already reports.

### Worker-native MCP

- [ ] Keep `remoteResearch` as the simple public worker intent flag if it
  remains useful: it means the assigned worker needs external retrieval, not
  "use a particular MCP adapter".
- [ ] Keep ordinary workers free of MCP/codemode.
- [ ] For `remoteResearch: true`, explicitly load `builtin:mcp` and
  `builtin:codemode` because workers launch with explicit extension control.
- [ ] Use the worker's existing `PI_CODING_AGENT_DIR`; native Pi will then read
  `<worker-agent>/mcp.json`.
- [ ] Let the user configure/authenticate that file with native Pi commands.
- [ ] Do not synthesize, copy or merge the supervisor's MCP configuration.
- [ ] Keep MCP default exposure as `codemode` unless a concrete server needs a
  different exposure.
- [ ] Do not add `tool_search` to Pi Sych at this stage.
- [ ] Keep `codemode.mode: "on"`; direct worker tools remain directly usable.

## Phase 4 — use codemode for composition, not power

A full-host worker already has Bash. Codemode should earn its place by reducing
round trips and model-context pollution.

- [ ] Enable codemode initially only for remote-research workers.
- [ ] Teach three patterns in Markdown examples rather than production wrappers:
  1. parallel independent retrieval with `Promise.allSettled()`;
  2. `searchTools()` / `describeNamespace()` followed by one targeted MCP
     call when the exact remote tool is not known;
  3. filter/join/deduplicate large structured results and emit only the evidence
     needed by the model.
- [ ] Include one explicit anti-pattern: do not wrap a single simple call in
  codemode merely because codemode exists.
- [ ] Make examples show partial-failure handling and retain source/provenance
  identifiers.
- [ ] Keep snippets/search hits classified as discovery, not source
  verification.
- [ ] Put the examples under the existing research/automation guidance tree;
  do not register another skill, command or tool for them.

## Phase 5 — strengthen `literature_search`

Keep it a small local discovery tool, but make the interface excellent.

### Structured and readable results

- [ ] Add a truthful `outputSchema`.
- [ ] Return matching `structuredContent` for codemode and nested callers.
- [ ] Keep concise model-facing `content`, but replace raw pretty-printed JSON
  with a compact readable result list.
- [ ] Include only fields that help discovery/provenance in the visible form:
  title, creators when available, year, item type, DOI, source path and a
  bounded snippet.
- [ ] Keep ranking score in structured/details output unless showing it to the
  model demonstrably improves retrieval decisions.
- [ ] Avoid maintaining three independently constructed result
  representations; derive readable content from the validated result object.
- [ ] Add tool annotations reflecting reality:
  `readOnlyHint: true`, `destructiveHint: false`,
  `idempotentHint: true`, `openWorldHint: false`.

### Result validation

- [ ] Define the actual result contract before adding `outputSchema`.
- [ ] Validate every selected SQLite field needed by that contract rather than
  leaving most metadata typed as `unknown`.
- [ ] Preserve legitimate SQL nulls explicitly.
- [ ] Keep malformed matched rows fail-closed rather than fabricating metadata.
- [ ] Preserve read-only database access.

### Search quality

- [ ] Build a small deterministic graded fixture with title, abstract,
  topic-tag, DOI and path matches.
- [ ] Test current unweighted BM25 against sensible explicit FTS5 weights.
- [ ] Change weights only if the fixture shows materially better ranking; do not
  add ranking machinery for aesthetics.
- [ ] Return `topicTags` only if it helps explain/use tag-only matches and the
  added public field earns its cost.
- [ ] Prefer documenting useful FTS5 examples (phrases, AND/OR, `title:`,
  `doi:`, etc.) over adding many filter parameters.
- [ ] Consider one simple literal-query option only if malformed/raw FTS syntax
  is a recurring user/model failure; otherwise keep the current native FTS
  query surface.
- [ ] Do not add provider-specific remote search behavior to
  `literature_search`.
- [ ] Do not make it a source-verification tool. The returned `sourcePath`
  remains the handoff to whatever file/PDF/document capability is available.

## Phase 6 — make Bakery composition natural without dependencies

Pi Sych should know **capability roles**, not Bakery package identities.

### `pi-filler`

- [ ] Add a compact automation/data example showing that when a deterministic
  document tool such as `filler` is active, it is preferable for supported
  DOCX/PDF/PPTX/XLSX inspection or transformation to ad-hoc model-visible data
  handling.
- [ ] In research source-inspection guidance, note that a returned local
  `sourcePath` can be inspected with an available PDF/document tool rather
  than dumping the complete source into the model.
- [ ] Do not import `pi-filler`, inspect its package name, duplicate its
  operation matrix, or add it to Pi Sych dependencies.

### `pi-pew-pew`

- [ ] Treat `web` as a known-URL retrieval capability when active.
- [ ] Keep research guidance provider-agnostic: known URL -> targeted fetch or
  browser tool; unknown source -> discovery/search capability.
- [ ] Delete Pi Sych's current special-case PEW-PEW provenance code instead of
  generalizing it.
- [ ] Do not promise that a supervisor `web` tool is inherited by workers.

### Interactive browser and other Bakery packages

- [ ] Keep browser/UI automation in the automation skill as a capability class;
  Pi-lease/pi-chrome-use can satisfy it when the user has chosen that stack.
- [ ] Do not integrate pi-auch at runtime; quota display is orthogonal.
- [ ] Do not integrate pi-tin at runtime; it remains a repository scaffold.
- [ ] Add one short "works well with" section to documentation only if it helps
  discovery. Make clear that each package is separately installed and usable
  without Pi Sych.
- [ ] Keep the same capability-first wording in J's Pi Bakery documentation so
  the packages look composable without implying hidden coupling.

## Phase 7 — tool-surface cleanup for Pi 0.99

- [ ] Set `dispatch_worker` to `exposure: "model-only"`.
- [ ] Set `submit_artifact` to `exposure: "model-only"`.
- [ ] Keep `literature_search` direct/callable so codemode can use its
  structured output.
- [ ] Verify model-only tools are still normal visible model calls; the purpose
  is only to prevent nested/codemode invocation.
- [ ] Keep the public model-facing workbench surface at three tools:
  `dispatch_worker`, `project_status`, `literature_search`.
- [ ] After removing `/pi-sych-mcp`, keep `/pi-sych-status` as the only
  workbench command. Plannotator commands remain owned by its separate
  extension.

## Phase 8 — DRY the implementation

Do not introduce abstractions merely to reduce line count. Consolidate only
repeated concepts with one clear owner.

- [ ] After removing config/MCP/PEW-PEW code, re-read every workbench module
  before creating new helpers; many apparent abstractions may disappear on
  their own.
- [ ] Keep project resolution in `project-files` and pass `ResolvedProject`
  where already available instead of rediscovering roots unnecessarily.
- [ ] Review the two-stage SYNC parsing
  (`parseSyncManifest` then `parseProjectStatusManifest`). Keep two stages
  only if the shallow manifest is genuinely needed independently; otherwise
  give artifact validation one owner.
- [ ] Keep one atomic-write helper and one project-path vocabulary.
- [ ] Keep one worker tool-mode mapping.
- [ ] Keep one worker result schema shared by supervisor and worker extension.
- [ ] Keep model-role parsing/loading in one module.
- [ ] Do not split `worker-engine.ts` simply because it is large. Split only
  if process launch and request/result semantics can become independently
  clearer with fewer cross-imports.
- [ ] Remove exports that exist only to let tests reach implementation details;
  test public/pure boundaries instead where possible.
- [ ] Require the final runtime to be smaller than v7.0.1 unless every net new
  line has a concrete capability or robustness justification. Record the
  before/after nonblank runtime count rather than raising the source cap.

## Phase 9 — test-suite cleanup

### Delete duplication first

- [ ] Compare `tests/unit/worker-engine.test.mjs` with
  `worker-engine-contract.test.mjs`; they currently duplicate almost the same
  five contract/skill/prompt/submission/immutability tests.
- [ ] Delete one and move only genuinely unique assertions into the survivor.
- [ ] Delete `mcporter.test.mjs` with MCPorter.
- [ ] Delete `pew-pew.test.mjs` with the special-case pass-through.
- [ ] Replace broad v7 config tests with focused v8 tests for strict parsing,
  global/project layering, nested partial overrides, 150k compaction defaults,
  and literature-path resolution.
- [ ] Move the compaction-failure test currently living in
  `worker-engine-coverage.test.mjs` to the compaction suite.

### Make test files describe behavior

- [ ] Replace vague `*-additional.test.mjs` / `*-coverage.test.mjs` names
  where practical with the behavior they own; do not create extra files only
  for naming purity.
- [ ] Share a small resolved-project/worker fixture helper if at least three
  worker suites continue to construct the same object after cleanup.
- [ ] Keep lifecycle/process tests separate from worker contract tests.
- [ ] Keep result-protocol precedence tests table-driven.
- [ ] Keep package-load/packed-install tests: they verify real resource
  discovery rather than implementation details.

### Thin the oversized wiring test

- [ ] Reduce `workbench-registration.test.mjs` to wiring:
  registered public tools/commands/events plus one representative call through
  each important boundary.
- [ ] Remove literature-search behavior already covered by the literature
  suite.
- [ ] Keep only one representative registration-level compaction check; put
  threshold semantics in the dedicated configuration/compaction suites.
- [ ] Remove exact giant regex assertions for injected prose.
- [ ] Remove fake-MCPorter and fake-PEW-PEW branches.
- [ ] Keep the opt-in real-Pi workflow test as the end-to-end proof that the
  assembled package still works.

### Add only high-value new tests

- [ ] Native remote-research worker: no MCP/codemode when false; explicit native
  MCP/codemode when true.
- [ ] One local deterministic MCP fixture with two read-only tools to prove
  codemode parallel composition and partial-failure behavior.
- [ ] `model-only` exposure for dispatch/submission.
- [ ] `literature_search` output schema, structured content, readable content
  and annotations.
- [ ] Literature relevance fixture if BM25 weighting changes.
- [ ] Packed install contains no MCPorter remnants and still starts with no MCP
  configuration.
- [ ] Keep real external MCP service checks opt-in and out of ordinary CI.

## Migration should be documentation, not runtime

If the final public simplification is breaking:

- [ ] Write one concise v7 -> v8 migration document.
- [ ] Tell users which obsolete Pi Sych keys can simply be deleted while
  retaining `config.json`.
- [ ] Document the v8 global + project config layering rules and the 150k custom
  compaction default.
- [ ] Document `literatureDatabase` absolute/relative path semantics and how a
  project override replaces the global library only for that project.
- [ ] Tell users where the conventional worker model catalogue lives if that
  path changes.
- [ ] Tell users to configure remote research in the worker agent directory
  with native `pi mcp` commands.
- [ ] Tell users to use `/mcp` or `pi mcp list` instead of
  `/pi-sych-mcp`.
- [ ] Tell users how to disable optional Pi Sych resources with `pi config`
  rather than Pi Sych flags if the compaction/Plannotator toggles disappear.
- [ ] Do not add runtime migration detection, compatibility shims, hidden
  rewrites, or an automatic config migrator unless a real stored-state problem
  turns out to require one.
- [ ] A standalone migration/helper script is acceptable only if it deletes more
  manual complexity than it adds and is not imported by production runtime.

## Recommended implementation order

1. [ ] Record the v7.0.1 runtime/test baseline and current source count.
2. [ ] Remove duplicate tests and isolate the behaviors that must survive.
3. [ ] Remove PEW-PEW special-case inheritance/capability narration.
4. [ ] Replace only Pi-owned feature toggles with native Pi resource controls.
5. [ ] Implement and test the reduced layered v8 `config.json`: global +
   project override, 150k custom-compaction policy, and configurable literature
   database.
6. [ ] Simplify custom compaction against the current Pi host APIs without
   losing its 150k proactive trigger or memory-promotion semantics.
7. [ ] Improve `literature_search` structured/readable output and evaluate
   ranking.
8. [ ] Add capability-level Bakery examples/guidance; no runtime dependencies.
9. [ ] Validate Context7, OpenAlex and Scholar Gateway on native MCP.
10. [ ] Remove MCPorter and wire native MCP/codemode for remote workers.
11. [ ] Apply the Pi 0.99 tool-exposure changes.
12. [ ] Re-run the deletion/DRY pass after the architecture has settled.
13. [ ] Update public contract, README, architecture, configuration/migration
    docs, code tour, generated Pages and only the diagrams actually affected.
14. [ ] Decide the final SemVer level from the completed public delta.
15. [ ] Do not tag or publish without separate owner authorization.

## Verification gate

Run the ordinary deterministic gate on the final tree:

```sh
npm run typecheck
npm run style
npm run source:budget
npm test
make verify
make site
npm pack --dry-run --json
git diff --check
```

Then run separately:

- [ ] opt-in real Pi workflow;
- [ ] local deterministic MCP/codemode integration;
- [ ] real Context7 native-MCP check;
- [ ] real OpenAlex native-MCP check;
- [ ] real Scholar Gateway native-MCP/authentication check;
- [ ] packed install with optional Plannotator present;
- [ ] packed install without optional Plannotator;
- [ ] manual review of the final package contents for obsolete config,
  MCPorter, PEW-PEW-pass-through, duplicate docs and stale tests.

## Definition of done

The refactor is complete when:

- [ ] Pi Sych contains no MCP client or MCP status/configuration wrapper.
- [ ] Remote-research workers use native Pi MCP/codemode only when requested.
- [ ] Companion Bakery tools remain independently installed and self-owned.
- [ ] Pi Sych guidance composes naturally with available document, web and
  browser capabilities without package-name coupling in runtime code.
- [ ] `literature_search` is readable to models and structured for codemode.
- [ ] The custom compactor contains only Pi-Sych-specific semantics plus the
  minimum host glue.
- [ ] Configuration surface is smaller than v7 but retains the layered settings
  Pi Sych genuinely owns: custom compaction + 150k threshold and configurable,
  project-overridable literature database.
- [ ] Runtime source is smaller than v7.0.1.
- [ ] The test suite has less duplication while preserving process, state,
  failure and public-contract coverage.
- [ ] Migration is documented rather than implemented as permanent production
  compatibility machinery.
- [ ] The public contract and release notes match what actually shipped.
