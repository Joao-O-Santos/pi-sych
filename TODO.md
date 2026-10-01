# Pi Sych simplification and Pi 0.99 integration

This is a **pre-release implementation checklist**, not a commitment to a version
number. Do the compatibility-neutral cleanup first. Decide the release number
from the final public delta, not from the size of the refactor.

If the final change removes the documented MCPorter configuration/command,
removes Pi Sych `config.json`, or raises the required Pi baseline to 0.99.2,
the result is a v8 release under Pi Sych's own public-contract rules. If those
public surfaces are preserved, reassess SemVer from the actual result.

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
- ordinary compaction triggering and context-window thresholds;
- provider/model authentication.

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

### Reconsider Pi Sych configuration as a layer

The current `config.json` mostly selects paths or toggles behavior that can now
be conventional or Pi-native:

```text
workerAgentDir
modelCatalog
mcporterConfig
literatureDatabase
compaction.custom
compaction.compactAt100k
review.mode
```

Audit each field with deletion as the default:

- [ ] `mcporterConfig`: remove with MCPorter.
- [ ] `review.mode`: remove. Plannotator is already a separate Pi extension;
  use `pi config`/package resource filtering to disable it.
- [ ] `compaction.compactAt100k`: remove unless a held-out workflow shows that
  the extra absolute threshold is materially better than Pi's native
  context-aware compaction settings.
- [ ] `compaction.custom`: avoid a bespoke boolean if custom compaction can be
  a separately selectable package extension.
- [ ] `workerAgentDir`: prefer one conventional
  `<pi-sych-dir>/worker-agent` path.
- [ ] `modelCatalog`: prefer one conventional role-catalog path.
- [ ] Rename the Pi Sych role catalog to something unambiguous such as
  `worker-models.json` if doing so prevents confusion with Pi's native
  `<agent-dir>/models.json`.
- [ ] `literatureDatabase`: prefer
  `<projectRoot>/LITERATURE.sqlite` then
  `<pi-sych-dir>/literature.sqlite`. Document a filesystem symlink as the
  escape hatch for an external database rather than retaining a general path
  configuration solely for this case.
- [ ] If all fields disappear, delete `config.json`,
  `templates/config.json`, `ensurePiSychConfig()`, the config parser, and
  their schema tests instead of replacing them with config v2.
- [ ] Keep only the small path-resolution helper still needed to locate the Pi
  Sych directory and user skill directory.
- [ ] Do not add production migration code merely to rewrite old config files.

### Use Pi-native resource selection

- [ ] Consider making custom compaction a third explicit package extension:
  `workbench`, `compaction`, `plannotator`.
- [ ] If split, the compaction extension should only register the
  `session_before_compact` behavior and reuse existing helpers; do not create
  a second orchestration layer.
- [ ] Let `pi config` disable Plannotator or custom compaction instead of
  maintaining Pi Sych-specific enable/disable flags.
- [ ] Remove the `agent_settled` 100k trigger and its in-flight state if native
  Pi triggering is sufficient.
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
- [ ] Remove tests for the deleted 100k settled trigger.
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
- [ ] Delete config-schema tests if `config.json` is removed.
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
- [ ] Remove compaction-threshold behavior when the custom 100k trigger is
  deleted.
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
- [ ] Tell users which obsolete Pi Sych files/keys can simply be deleted.
- [ ] Tell users where the conventional worker model catalogue and literature
  database now live if those paths change.
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
4. [ ] Replace Pi Sych-specific toggles with Pi-native resource controls where
   the behavior remains clear.
5. [ ] Collapse or delete `config.json` if the field-by-field audit confirms
   the conventional-path design.
6. [ ] Simplify custom compaction against the current Pi host APIs.
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
- [ ] Configuration surface is smaller than v7, ideally convention-only.
- [ ] Runtime source is smaller than v7.0.1.
- [ ] The test suite has less duplication while preserving process, state,
  failure and public-contract coverage.
- [ ] Migration is documented rather than implemented as permanent production
  compatibility machinery.
- [ ] The public contract and release notes match what actually shipped.
