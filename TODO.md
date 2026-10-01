# Pi Sych v8 native MCP and codemode migration

This checklist defines the migration from Pi Sych 7.x's MCPorter-based remote
research integration to Pi 0.99.2+ native MCP and selective codemode use.

The implementation should remain subtractive. Pi Sych owns project state,
bounded worker dispatch, context selection, skills, local literature lookup,
and human-owned review. Pi should own MCP transport, authentication, server
lifecycle, tool discovery, and generic tool composition.

## Release Decision

- [x] Treat this work as **v8.0.0**, not a 7.x patch or minor release.
- [x] Reason: the current public contract documents `mcporterConfig`,
  `/pi-sych-mcp`, and `remoteResearch` as MCPorter-backed userland. Removing
  the MCPorter configuration/dependency and changing remote-research setup
  requires user migration.
- [x] Keep the public `dispatch_worker.remoteResearch` field if practical. Its
  meaning remains "this worker needs remote retrieval"; only the implementation
  and configuration backend change.
- [x] Preserve `/pi-sych-mcp` if a thin native-Pi diagnostic can retain a useful
  user-facing command. Do not remove a public command merely because the
  implementation underneath it changed.
- [ ] Record the affected public-contract rows and the migration requirement in
  the v8 changelog before release.
- [ ] Do not tag or publish v8 as part of implementation unless separately
  authorized.

## Runtime Baseline

- [ ] Set the documented Pi runtime baseline to **Pi 0.99.2 or newer** for v8.
  Use 0.99.2 rather than 0.99.0 because the 0.99.2 MCP behavior is the target:
  MCP servers with default codemode exposure stay out of the codemode
  declaration, are represented by short server summaries, connect lazily, and
  expose namespace/tool discovery through codemode.
- [ ] Decide whether the npm peer dependency ranges should encode the minimum
  Pi version or whether compatibility should remain documented/runtime-checked.
  Do not leave a misleading `*` compatibility promise if v8 actually requires
  APIs introduced in 0.99.
- [ ] Add one early, actionable compatibility failure for a Pi runtime that
  lacks the required native extension/tool APIs. Avoid a parallel version
  registry when capability detection is sufficient.
- [ ] Verify the exact built-in extension names and CLI loading behavior against
  the installed Pi version during implementation, especially because
  `--no-extensions` also disables built-in extensions in Pi 0.99.

## Target Architecture

Remote research should become:

```text
dispatch_worker(remoteResearch: false)
  -> Pi Sych worker extension only
  -> ordinary worker tool mode
  -> no native MCP
  -> no codemode added by Pi Sych

dispatch_worker(remoteResearch: true)
  -> Pi Sych worker extension
  -> builtin:mcp
  -> builtin:codemode
  -> ordinary worker tool mode + codemode
  -> native Pi mcp.json under the worker agent directory
  -> MCP tools remain default codemode exposure unless explicitly configured
```

- [ ] Keep MCP and codemode **per-dispatch opt-in**. Do not make either a normal
  dependency of ordinary editing, coding, analysis, or review workers.
- [ ] Keep `remoteResearch` independent of worker mode and context mode.
  `read-only | edit | full-host` still controls ordinary visible Pi tools;
  `clean | trajectory` still controls conversation context.
- [ ] Do not interpret codemode as an operating-system permission boundary.
  A full-host worker already has Bash and host access. Codemode is being added
  for tool orchestration and context efficiency, not additional authority.
- [ ] Preserve the current rule that selected research skill adds local
  `literature_search`; remote research separately enables external retrieval.
- [ ] Preserve optional reuse of an already active, provenance-validated
  PEW-PEW `web` tool unless native MCP makes a specific use redundant. Do not
  silently discover or activate disabled packages.

## Remove MCPorter

- [ ] Remove `pi-mcporter` from `optionalDependencies`.
- [ ] Remove `scripts/check-mcporter-dependencies.mjs`.
- [ ] Remove the `test:deps` script and rewrite/remove `deps:latest` so it no
  longer updates MCPorter.
- [ ] Remove `remoteResearchExtensionPaths()` and all
  `pi-mcporter/dist/index.js` resolution.
- [ ] Remove `MCPORTER_CONFIG` environment-variable plumbing.
- [ ] Remove MCPorter-specific configuration parsing, availability inspection,
  server counting, and error messages.
- [ ] Remove the `mcporterConfig` field from newly generated Pi Sych
  `config.json`.
- [ ] Detect an existing v7 `mcporterConfig` field and return one concise
  migration message rather than silently pretending that it still controls
  remote research.
- [ ] Remove tests and fixtures whose only purpose is MCPorter dependency-tree
  validation.
- [ ] Search the entire package, site, tests, diagrams, prompts, and docs for
  `MCPorter`, `mcporter`, and `MCPORTER_CONFIG`; retain the term only in
  migration/history material where it describes v7 or earlier behavior.
- [ ] Confirm `npm pack --dry-run` contains no MCPorter package, helper, or
  stale setup documentation.

## Native MCP Configuration

- [ ] Use Pi's native `mcp.json` as the only MCP server configuration for
  remote-research workers.
- [ ] Resolve native MCP configuration through the worker's existing
  `PI_CODING_AGENT_DIR`. The intended location is therefore the Pi Sych
  worker agent directory, not a separate Pi Sych MCP configuration tree.
- [ ] Keep worker MCP configuration deliberately separate from the supervisor's
  general MCP configuration. Do not automatically expose every supervisor MCP
  server to a research worker.
- [ ] Do not copy usernames, passwords, cookies, OAuth tokens, or MCP auth state
  into project files.
- [ ] Allow native Pi authentication to own its normal state. The worker
  directory may contain Pi's native MCP auth state where Pi requires it.
- [ ] Preserve the existing symlink behavior for ordinary Pi provider/model
  authentication only where it remains valid; do not invent a second auth
  mechanism for MCP.
- [ ] Document the native setup using Pi's own MCP CLI under the worker agent
  directory. Prefer native `pi mcp add|list|login|logout` workflows over a
  Pi Sych wrapper.
- [ ] Document that native Pi supports stdio and Streamable HTTP MCP transports
  but not legacy SSE. Treat an SSE-only server as a real compatibility blocker,
  not something Pi Sych should reimplement.
- [ ] Configure concise MCP server descriptions. Pi 0.99.2 uses those summaries
  for model-facing server context and tool discovery, so descriptions should
  identify capability rather than repeat server marketing text.

## Preserve And Repurpose `/pi-sych-mcp`

- [ ] Keep `/pi-sych-mcp` as a small human diagnostic if this can be done
  without reimplementing Pi's MCP registry.
- [ ] Change its meaning from "inspect MCPorter configuration" to "inspect the
  worker's native Pi MCP setup".
- [ ] Prefer delegating diagnostics to Pi's native MCP CLI/state rather than
  parsing and interpreting the full `mcp.json` schema inside Pi Sych.
- [ ] Report only actionable non-secret information: resolved worker agent
  directory, presence of native MCP configuration, configured server names or
  native list output, and native-command failures.
- [ ] Never print OAuth tokens, provider tokens, headers, environment secrets,
  command-line secrets, or raw auth state.
- [ ] If retaining the command would require substantial duplicate MCP logic,
  remove it in v8 and document the exact native `pi mcp list` replacement.
  Prefer deletion over a second MCP client.

## Worker Launcher

- [ ] Keep `--no-extensions` so workers remain explicit and isolated.
- [ ] For ordinary workers, continue loading only the Pi Sych worker extension
  plus explicitly selected optional extensions such as an already-approved web
  extension.
- [ ] For `remoteResearch: true`, explicitly load Pi's native MCP and codemode
  built-ins because `--no-extensions` disables built-ins in Pi 0.99.
- [ ] Prefer explicit launcher arguments such as
  `-e builtin:mcp -e builtin:codemode` over depending on ambient user settings.
- [ ] Add `codemode` to the worker's allowed tool set only for remote-research
  dispatches.
- [ ] Do **not** add individual MCP tool names to `--tools`. Native MCP default
  codemode exposure should keep their schemas out of the worker's ordinary
  model-facing tool declaration.
- [ ] Verify that native MCP can discover and call configured server tools from
  codemode when the worker is launched with Pi Sych's current
  `--no-context-files`, `--no-skills`, and explicit-resource model.
- [ ] Preserve timeout, cancellation, process-exit, immutable-result, change
  observation, and temporary-session behavior unchanged.
- [ ] Preserve the current worker result protocol. Native MCP/codemode results
  are retrieval internals, not new terminal result fields.
- [ ] Keep remote-research failure truthful: configured servers do not prove
  credentials, reachability, source access, or successful retrieval.

## Codemode Scope

Codemode is not being adopted because a full-host worker needs more host
capability. Bash already supplies that. The intended benefits are:

- parallel calls to independent tools/MCP servers;
- filtering, joining, and reducing structured tool results before they enter
  model context;
- using large tool outputs inside one script without injecting every
  intermediate result into the worker conversation; and
- programmatic MCP tool discovery without permanently declaring every remote
  tool schema to the model.

Implementation rules:

- [ ] Enable codemode only for `remoteResearch: true` workers initially.
- [ ] Do not enable codemode for ordinary full-host/edit/read-only workers just
  because it exists.
- [ ] Keep `codemode.mode` at Pi's normal mixed/direct behavior unless testing
  demonstrates a concrete reason to use `only`.
- [ ] Do not add Pi's separate model-facing `tool_search` to Pi Sych at this
  stage. The expected MCP server set is small, server descriptions are
  deliberate, and codemode already has `searchTools()` and
  `describeNamespace()`.
- [ ] Add worker guidance explaining the useful pattern: discover the required
  MCP tools, call independent retrievals concurrently when appropriate,
  normalize/filter results inside codemode, and return only material evidence
  to the model.
- [ ] Also tell the worker not to use codemode ceremonially. A single simple
  retrieval should remain a single simple tool call.
- [ ] Preserve source-verification discipline. Filtering results before context
  does not turn snippets, metadata, or search hits into verified evidence.

## Tool Exposure

- [ ] Set supervisor `dispatch_worker` to `exposure: "model-only"`.
  The model may call it directly, but codemode/other nested tools must not
  launch hidden worker fan-out through `ctx.executeTool()`.
- [ ] Set worker `submit_artifact` to `exposure: "model-only"`.
  Submission remains the worker model's explicit, visible, terminal act and
  must not be buried inside a codemode script.
- [ ] Keep `literature_search` directly model-callable. It is ordinary
  retrieval, not an orchestration or approval boundary.
- [ ] Add regression tests proving `dispatch_worker` and `submit_artifact`
  remain model-visible while unavailable to codemode/nested tool execution.
- [ ] Do not change the user-visible meaning, parameter schemas, or terminal
  semantics of those two tools merely to adopt the new exposure API.

## Structured `literature_search`

- [ ] Add an `outputSchema` matching the existing documented public result:
  an array of records containing `metadata`, `snippet`, `score`, and
  `sourcePath`.
- [ ] Preserve the current nullable/unknown realities of SQLite metadata rather
  than tightening the schema beyond the v7 public contract accidentally.
- [ ] Return the same useful model-facing `content` as today.
- [ ] Also return the results as `structuredContent` so codemode can receive
  actual objects/arrays without reparsing JSON text.
- [ ] Keep `details.results` only if it still serves Pi UI/tests; avoid
  maintaining three divergent representations of the same data.
- [ ] Add truthful annotations:
  - `readOnlyHint: true`;
  - `destructiveHint: false`;
  - `idempotentHint: true`; and
  - `openWorldHint: false`.
- [ ] Treat annotations as metadata, not policy or a security boundary.
- [ ] Add tests that direct model calls retain readable output and codemode/nested
  calls receive schema-valid structured data.
- [ ] Add a regression case for nullable `itemType`, nullable creators, and
  non-string SQLite-derived fields already permitted by the public result.

## Capability Summary And Guidance

- [ ] Replace "remote MCPorter" capability language with native Pi MCP language.
- [ ] Distinguish:
  - native MCP extension available;
  - worker-native MCP configuration present;
  - configured server names/descriptions;
  - actual authenticated/reachable retrieval, which remains unverified until a
    call succeeds.
- [ ] Do not advertise codemode as additional host access.
- [ ] Describe codemode's role briefly as remote-tool composition and
  pre-context filtering.
- [ ] Do not add tool-count-heavy or server-schema-heavy supervisor text. Pi
  0.99.2 already keeps default MCP servers out of the codemode declaration and
  supplies short server summaries.
- [ ] Keep the supervisor's normal startup context free of remote MCP tool
  schemas when no remote-research worker is being dispatched.

## Authentication

- [ ] Do not add a Pi Sych-specific ChatGPT/OpenAI authentication feature.
  Subscription-backed OpenAI access already existed through Pi's OAuth/Codex
  path before this migration; Pi 0.99's OpenAI-provider login is a Pi concern.
- [ ] Do not change the worker model catalogue solely because Pi 0.99 added
  provider login changes.
- [ ] Verify that the existing worker `auth.json` symlink strategy still works
  for the configured worker model providers under Pi 0.99.2.
- [ ] For MCP-specific OAuth, rely on native Pi MCP authentication and document
  where the worker-scoped auth state lives.
- [ ] Where native MCP can authenticate from an existing provider login, use the
  native Pi mechanism rather than copying tokens into MCP configuration.

## Explicit Non-Goals

- [ ] Do not add `tool_search` unless future MCP/tool scale makes direct
  descriptions plus codemode discovery materially inadequate.
- [ ] Do not adopt virtual models in the v8 core.
- [ ] Do not adopt classifier models in the v8 core.
- [ ] Do not replace explicit `modelRole` worker selection with hidden
  per-request routing.
- [ ] Do not change clean/trajectory worker semantics.
- [ ] Do not replace separate worker processes with codemode or
  `ctx.executeTool()`; those mechanisms do not provide clean model context.
- [ ] Do not build a Pi Sych MCP transport, OAuth client, server registry, or
  tool-search subsystem.
- [ ] Do not turn tool annotations into an authorization engine.
- [ ] Do not expose all supervisor MCP servers automatically to workers.
- [ ] Do not broaden the worker tool surface for tasks that did not request
  remote research.

## Deterministic Tests

- [ ] Update exact worker-launch argument tests for Pi 0.99 built-ins.
- [ ] Assert ordinary workers do not load native MCP or codemode.
- [ ] Assert `remoteResearch: true` workers explicitly load native MCP and
  codemode and receive `codemode` in the allowed tool surface.
- [ ] Assert no `mcporter` tool or `MCPORTER_CONFIG` environment variable is
  present.
- [ ] Assert `dispatch_worker` and `submit_artifact` register as
  `model-only`.
- [ ] Assert `literature_search` publishes the intended output schema,
  structured content, and annotations.
- [ ] Add a local deterministic MCP fixture server. Prefer stdio for the basic
  suite; add Streamable HTTP coverage if it remains small and stable.
- [ ] Give the fixture at least two independent read-only tools so an integration
  test can demonstrate parallel codemode calls without external network access.
- [ ] Include one large fixture result and assert codemode can reduce it before
  returning model-facing text.
- [ ] Include one MCP failure result and ensure it remains a retrieval failure,
  not a successful evidence claim.
- [ ] Test absent `mcp.json`, malformed native MCP configuration, unavailable
  server, and successful server cases with actionable failure boundaries.
- [ ] If `/pi-sych-mcp` remains, test that it does not expose secrets.
- [ ] Add migration coverage for a v7 config containing `mcporterConfig`.
- [ ] Update packed-install tests to verify v8 works without `pi-mcporter`.

## Real Acceptance Checks

These checks are opt-in and should not enter ordinary cloud CI when they require
credentials or network services.

- [ ] Run a real Pi 0.99.2+ worker with `remoteResearch: true`.
- [ ] Confirm native MCP starts from the worker agent directory rather than the
  supervisor's general MCP configuration.
- [ ] Confirm codemode can discover configured MCP namespaces without all tool
  schemas appearing permanently in the worker prompt.
- [ ] Confirm one worker can query at least two independent MCP tools in
  parallel and emit a reduced synthesis.
- [ ] Validate the current Context7 setup through native MCP.
- [ ] Validate the current OpenAlex setup through native MCP.
- [ ] Validate Wiley/Scholar Gateway through native MCP, including its actual
  authentication path.
- [ ] If any required service is legacy-SSE-only, record that exact blocker
  before deleting the last fallback. Do not retain MCPorter speculatively.
- [ ] Verify PEW-PEW reuse still behaves as documented when active.
- [ ] Verify a normal non-research worker starts and completes with no MCP or
  codemode dependency.
- [ ] Verify a full-host remote-research worker still has the same Bash/file
  capability as before; codemode should add composition efficiency, not change
  its authorization boundary.

## Documentation And Migration

- [ ] Update `README.md` remote-research sections to describe native Pi MCP.
- [ ] Update `docs/configuration.md` with worker-scoped `mcp.json` setup and
  native Pi MCP commands.
- [ ] Update `docs/ARCHITECTURE.md` so Pi owns MCP transport/auth/discovery and
  Pi Sych owns only when a worker receives that capability.
- [ ] Update `docs/public-contract.md`:
  - remove MCPorter as a v8 runtime requirement;
  - remove `mcporterConfig` from supported configuration;
  - retain or explicitly migrate `/pi-sych-mcp`;
  - preserve `remoteResearch` as the public opt-in field;
  - state the Pi 0.99.2+ baseline.
- [ ] Add a concise v7 -> v8 migration section or dedicated migration document:
  remove `mcporterConfig`, configure worker-native `mcp.json`, authenticate
  native servers, and rerun remote-research acceptance.
- [ ] Update `docs/CHANGELOG.md` with an explicit **Breaking** section and
  SemVer justification.
- [ ] Update development/code-tour documentation for built-in MCP/codemode
  loading and structured tool output.
- [ ] Update diagrams only where they currently name MCPorter or imply a
  separate MCP adapter. Do not redraw unaffected diagrams.
- [ ] Update generated Pages/site material and verify internal links.
- [ ] Preserve historical changelog references to MCPorter for old releases.

## Cleanup And Source Budget

- [ ] Delete dead MCPorter adapter code before adding replacement helpers.
- [ ] Prefer one small native-MCP helper, if any, over multiple wrappers.
- [ ] Reuse the existing worker agent directory and launcher abstractions.
- [ ] Do not add a new configuration registry merely to point at Pi's
  `mcp.json`.
- [ ] Recalculate the runtime source budget after the migration. The net runtime
  should ideally shrink: MCP transport/configuration belongs to Pi now.
- [ ] Review whether `capabilitySummary` can become simpler once MCPorter
  inspection disappears.
- [ ] Run a duplication pass for MCP/native-extension path handling after tests
  pass.

## Verification Gate

Run the complete repository gate on the final implementation:

```sh
npm run typecheck
npm run style
npm run source:budget
npm test
npm run test:usage
npm run benchmark
make verify
make site
npm pack --dry-run --json
git diff --check
```

- [ ] Keep network/model-backed usage and MCP service checks opt-in.
- [ ] Run packed-install tests with optional Plannotator dependencies present
  and absent.
- [ ] Verify the packed package starts without MCP configuration.
- [ ] Verify ordinary Pi Sych work remains usable when native MCP servers are
  absent.
- [ ] Verify v8 migration errors are specific and actionable rather than generic
  extension-load failures.
- [ ] Inspect the final package contents for stale MCPorter files/references.
- [ ] Review `docs/public-contract.md`, changelog, README, configuration, and
  architecture together before release.

## Release Acceptance

v8 is ready for release only when all of the following are true:

- [ ] No production/runtime dependency on MCPorter remains.
- [ ] `remoteResearch: true` uses Pi's native MCP and codemode deliberately.
- [ ] Ordinary workers remain free of MCP/codemode unless requested.
- [ ] `dispatch_worker` and `submit_artifact` cannot be nested through
  codemode.
- [ ] `literature_search` has schema-valid structured output without breaking
  its documented direct result.
- [ ] The worker-native MCP configuration and authentication path is documented
  and tested.
- [ ] Context7, OpenAlex, and Scholar Gateway have been checked against the
  native path, or any unsupported service is explicitly documented.
- [ ] The public contract describes the new behavior exactly.
- [ ] The v7 -> v8 migration is short, deterministic, and requires no hidden
  state conversion.
- [ ] Full deterministic verification passes.
- [ ] Real Pi remote-research acceptance passes on the release candidate.
- [ ] The owner separately authorizes tagging/publication.
