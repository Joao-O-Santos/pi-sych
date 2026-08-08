# Changelog

All notable changes to Pi Sych are documented here. Versions are
immutable npm publications unless explicitly marked otherwise.

## Unreleased

### Added

- Add worker-only `literature_search` for dispatches that select the
  `research` skill, with documented local SQLite FTS5 schema, database
  resolution, and `literatureDatabase` configuration.
- Document the worker request/result protocol, lifecycle precedence,
  custom compaction model seam, deterministic test posture, code tour,
  and live generated code reference.

### Changed

- Simplify diagnostic coverage to the Node built-in coverage command; it
  is not a verification or CI gate. Add meaningful path, status,
  acknowledgement, worker-process, compaction, and literature-tool
  boundary coverage, with systematic temporary-fixture cleanup.
- Clip compaction snapshots only at valid UTF-8 boundaries and require
  promotion proposals to remain single-line inbox entries.
- Keep worker package-load registration deterministic: the worker
  surface is exactly `submit_artifact` and `literature_search`.
- Release version 6.1.0.

## v6.0.9 - 2026-08-08

### Fixed

- Restore strict `nonEmptyString` / `stringArray` validation in shared
  helpers; add compaction-specific `scalarStringArray` that wraps scalar
  strings as one-element arrays at the LLM output boundary.

## v6.0.8 - 2026-08-08

### Fixed

- Version housekeeping.

## v6.0.7 - 2026-08-08

### Fixed

- Lenient `stringArray` coercion (string-to-array, non-string item
  coercion) and lenient `nonEmptyString` coercion.

## v6.0.6 - 2026-08-08

### Fixed

- Worker lifecycle: `mkdtempDisposable()` now properly uses
  `await using` so temporary directories are cleaned up on all code
  paths (timeout, cancellation, spawn failure, signal termination,
  non-zero exit).
- Restore "first stop wins" semantics in `launchPiWorker()`:
  cancellation or timeout classification no longer overwrites an earlier
  decision.
- Retain and clear forced SIGKILL timer on normal exit; remove abort
  listener when process completes.
- Preserve actual spawn error message instead of generic "spawn error".
- Add four lifecycle regression cases: cancellation before timeout,
  timeout before abort, SIGTERM-resistant process reaching SIGKILL,
  failed dispatch leaving no temporary runtime directory.
- Extract compaction file filtering into exported
  `filterWorkingMemoryFiles()` and exercise production code in
  `compact()` regression path (no algorithm duplication).
- Remove hardcoded version from integration test. timeout before abort,
  SIGTERM-resistant process reaching SIGKILL, failed dispatch leaving no
  temporary runtime directory.
- Extract compaction file filtering into exported
  `filterWorkingMemoryFiles()` and exercise production code in
  `compact()` regression path (no algorithm duplication).

## v6.0.5 - 2026-08-08

### Fixed

- Simplify config test back to `assert.throws()` pattern.
- Remove architecture-image generator script
  (`scripts/generate-architecture-images.mjs`) and `PLAN.md` (completed
  transient state).
- Source budget: 1,975 actual lines (2,000 rounded).

## v6.0.4 - 2026-08-07

### Fixed

- Fix Biome lint errors preventing CI verification:
  - Use template literal for stderr concatenation in `launchPiWorker`
  - Remove unused `rm` import from `worker-engine.ts`
  - Remove unused `midX` variable from
    `generate-architecture-images.mjs`
  - Rename `escape` function to `escapeHtml` to avoid shadowing global
    property

## v6.0.3 - 2026-08-07

### Fixed

- Update integration test version expectation from 6.0.2 to 6.0.3

## v6.0.2 - 2026-08-07

### Fixed

- Regenerate the four architecture PNGs with proper box widths and
  line-wrapped text; the v6.0.0 and v6.0.1 renderings had boxes too
  narrow for Mermaid to lay out, so each character appeared on its own
  line.

### Independent review corrections

- Surface artifact observation errors in `ProjectStatusCheck.errors` and
  add an "Unable to observe" formatter section; include
  `!state.errors.length` in the all-clear condition.
- Restore dependency impact for missing artifacts by passing
  `[...changed, ...missing]` to `impacts()`.
- Require active untracked compaction files to exist by using
  `resolveExistingProjectPath()` in an inline loop, not just lexical
  validation.
- Fix Windows root-relative config paths using `posix.isAbsolute()` and
  `win32.isAbsolute()`.
- Rename the source budget metric from "Estimated production TypeScript"
  to "runtime source".
- Modernize with `crypto.hash()`, `import.meta.dirname`, and
  `Static<typeof schema>` for duplicated request/result types.
- Fix `PI_SYCH_PACKAGE_ROOT` off-by-one directory traversal (use
  `import.meta.dirname` directly).
- End `writeAtomicFile()` async disposal scope before `rename()` for
  correct cross-platform resource ordering.
- Replace chmod-based observation-error test with deterministic `EISDIR`
  fixture (directory at tracked path).
- Use `mkdtempDisposable()` for worker runtime cleanup.
- Add regression tests for three-way compaction file filtering and
  Windows root-relative config paths.
- Source budget: 1,975 actual lines (2000/2000 rounded).

## v6.0.0 - Unreleased

### Breaking baseline

- Require Node 26 or newer and use the Node 26 CI baseline.
- Centralize Pi configuration-root and named-skill lookup, including
  cross-platform lexical path validation.

### Correctness and simplification

- Distinguish current, changed, missing, and observation-error project
  states; unchanged acknowledgements no longer invalidate dependants.
- Report worker process failures before attempting to read a missing
  result.
- Extract valid JSON from compaction model output that includes prose or
  fences; strengthen the prompt to request JSON-only responses.
- Preserve active existing untracked files during compaction and
  simplify bounded filesystem handling.
- Consolidate model-catalog loading into one internal reader.
- Fail fast on malformed SYNC.json at startup instead of silently
  falling back.
- Share the worker result TypeBox schema between the workbench and
  worker extensions.
- Remove the MCPorter config existence preflight; read directly and
  distinguish ENOENT.
- Make the Plannotator `projectFile` helper return the resolved path
  directly.
- Refresh the runtime source budget to include worker bootstrap code.
- Replace the architecture and workflow diagrams with current simplified
  PNG summaries and improve the accessible GitLab Pages presentation.

## v5.0.0 - 2026-08-07

### Breaking configuration changes

- Replace the documented `PI_SYCH_MODEL_CATALOG`,
  `PI_SYCH_WORKER_AGENT_DIR`, and `PI_SYCH_MCPORTER_CONFIG` overrides
  with one visible, versioned `config.json` under Pi-native project,
  agent, XDG, or home configuration directories.
- Relocate the default worker runtime, model catalogue, and MCPorter
  paths under that resolved directory. Existing users of the removed
  overrides or former paths must migrate their configuration.

### Added

- Make Plannotator and MCPorter optional integrations, with a separate
  Plannotator extension entrypoint and early failures only when an
  absent integration is explicitly enabled or requested.
- Add configurable custom compaction, optional automatic compaction at
  100,000 context tokens, and manual or Plannotator review modes.
- Add three opt-in, real-Pi skill benchmark cases with objective checks,
  separate candidate and judge roles, immutable result bundles, and
  deterministic harness tests.
- Add a Pandoc-based GitLab Pages site, internal-link validation,
  accessible templates and styling, and packaged licensing notices.
- Add an explicit public-contract and SemVer policy.
- Add diagnostic V8 coverage reporting and stricter TypeScript checks.

### Changed

- Add thin Make targets for formatting, verification, coverage,
  packaging, benchmarking, and Pages generation.
- Require Pandoc 3.10.1 or newer locally and resolve the latest stable
  release in online CI.
- Strengthen coding guidance around direct native mechanisms, explicit
  interfaces, human-visible state, early actionable failure, and
  defeaters such as security, accessibility, compatibility, and data
  integrity.

## v4.0.6 - 2026-08-06

### Scientific continuity

- Require inspected motivating material for hypothesis generation and
  bound model assistance to diversification, formalization, comparison,
  scope analysis, and discriminating tests.
- Make retrospective proposals name predicted effects, regression risks,
  and held-in and held-out evaluations without enabling automatic
  mutation.
- Preserve continuity-critical alternatives, negative results, failed
  approaches, and not-yet-canonical commitments during compaction
  without expanding the working-memory schema.

## v4.0.5 - 2026-08-06

### Skills architecture

- Keep the six public umbrella skills while adding four shared methods
  for prose, hypothesis generation, argument analysis, and
  claim-to-evidence mapping.

- Replace module lists with bounded ordered task recipes and retain
  genre-specific local modules.

- Make project `STYLE.md` a local-delta template and instruct workers to
  read routed methods and modules.

- Keep deterministic skill tests mechanical: public discovery, file
  structure, routes, prompt budgets, and override precedence. Evaluate
  semantic behavior only through the opt-in live-model fixtures.

- Refine analysis, research, review, and manuscript routes so specialist
  methods load only when the task needs them.

- Add defeasible prose guidance for natural professional register,
  restrained em dashes, genuine uncertainty, and common model-writing
  defaults while preserving precise passive-voice guidance.

- Complete packaged `docs/attribution.md` with cited skill-method,
  package-design, retrospective-workflow, platform, and integration
  influences outside routed method context.

- Preserve superseded diagrams as historical files but omit stale
  gallery image metadata until replacement artwork is reviewed.

- Normalize documentation paths to lowercase, move attribution under
  `docs/`, and remove completed project-only plans and ledgers.

## v4.0.4 - 2026-08-03

### Documentation and maintenance

- Add the user-centred review and revision workflow guide and diagrams.
- Consolidate shared primitive validation across worker, compaction, and
  project-status paths.
- Simplify optional model-catalog loading and dependency validation.

## v4.0.3 - 2026-08-01

### Correctness and documentation

- Bound compaction snapshots, exclude unreviewed inbox contents, and
  count actual proposal lines.
- Make project validation errors visible, recheck files before
  acknowledgement, and validate worker-reported paths.
- Load supervisor instructions and worker model roles at the right time;
  keep worker bootstrap and MCPorter configuration explicit.
- Remove the duplicate smoke command and replace Git-history-dependent
  migration discovery with a checked-in fixture.
- Clarify user, supervisor, and contributor documentation, including the
  deliberate limits of path handling and worker modes.

## v4.0.2 - 2026-08-01

### Packaging

- Point the Pi package manifest and README image at the published patch
  release rather than the unpublished `4.0.0` package.

## v4.0.1 - 2026-08-01

### CI

- Fetch full Git history and tags in GitLab CI so the skill-migration
  ledger test can inspect its tagged source corpus.

## v4.0.0 - 2026-08-01

### Simplification

- Reduced the complete extension TypeScript surface below the 2,000-line
  cap.
- Removed plan submission, structured promotion storage, rigid model
  profiles, and redundant worker-result metadata.
- Kept project hashes, dependency impact, bounded workers, atomic
  manifest replacement, and explicit human acknowledgement.

## v3.0.4 - 2026-07-31

### Correctness and release completion

- Completed configured project-root and canonical-path handling across
  workers, status, compaction, and human review paths.
- Added strict `SYNC.json` metadata validation, external canonical-path
  rechecks, symlink coverage, and explicit promotion persistence
  results.
- Refined skill contracts, qualitative guidance, and live acceptance
  tests.

## v3.0.3 - 2026-08-01

### Documentation

- Corrected the default `inbox` path in the configuration example from
  `.pi-sych/INBOX.md` to `INBOX.md` to match actual source defaults.
- Added motivation for canonical path overrides (monorepo layouts,
  shared INBOX across workspaces).
- Clarified ARCHITECTURE.md compaction section: added explicit triggers
  (manual `/compact`, context threshold, overflow recovery) and noted
  compaction uses supervisor's active model, not worker profiles from
  `models.json`.

## v3.0.2 - 2026-08-01

### Documentation

- Added detailed compaction pipeline description to ARCHITECTURE.md:
  working-memory construction, status projection, canonical snapshot,
  promotion routing by role, malformed inbox isolation, failure
  classification, and native compactor fallback.
- Added manifest resolution section to ARCHITECTURE.md: workspace walk,
  nearest SYNC.json selection, projectRoot relocation, canonical path
  overrides for seven roles.
- Added project canonical paths section to `docs/configuration.md`:
  SYNC.json v2 schema, projectRoot and canonical object documentation,
  role-to-path mapping, artifact declaration structure.

## v3.0.1 - 2026-08-01

### Fixed

- Restored graceful `/pi-sych-status` handling of a malformed
  `SYNC.json` (resolving the manifest before checking status had crashed
  the tool instead of reporting the unavailable state).

### Removed

- Removed unused production exports (`countPromotionCandidates`,
  `parseEvidenceEntries`, `EvidenceEntry`) exercised only by tests.
- Collapsed duplicated worker tool-mode lookup into a single
  `toolsForMode` source.
- Removed the redundant `--local` no-op in `/plannotator-review` args.

## v3.0.0 - 2026-08-01

### Added

- Added direct `SYNC.json` manifest version 2 with workspace,
  nearest-manifest, and configured canonical-path resolution.
- Added configured canonical-path promotion routing by role (`project`,
  `agents`, `style`, `evidence`, `decisions`, `todo`) under custom
  paths.
- Added bounded project-status projection into working-memory
  compaction, preserving task-relevant changed artifacts, impacted
  dependents, and actionable findings.
- Isolated malformed `INBOX.md` parsing so working-memory generation
  continues and reports the inbox error without losing project state.
- Added custom-compaction failure classification and concise
  diagnostics, returning control to Pi's standard compactor on failure.
- Added real-model, LLM-judged prompt-quality usage acceptance.
- Restored all v1.2.0 substantive skill guidance under the six umbrella
  skills with a migration ledger and tag-derived regression test.

### Changed

- Replaced the v1 `SYNC.md` Markdown fence with direct deterministic
  `SYNC.json`.
- Consolidated manifest loading, canonical-path resolution, and project
  discovery into one resolver passed through status and compaction.
- Raised the production TypeScript budget cap to 3,000 lines for the
  approved compaction and promotion-routing surface.

### Removed

- Removed legacy fixed-file project discovery and duplicated
  canonical-path handling.

## v2.1.1 - 2026-07-31

### Fixed

- Kept `SYNC.md` JSON fences stable under the pinned Pandoc formatter.

## v2.1.0 - 2026-07-31

### Added

- Added task-centred custom compaction with standard-compactor fallback.
- Added human-review `INBOX.md` promotion proposals and pending-count
  project-status visibility.

## v2.0.0 - 2026-07-30

### Added

- Replaced the visible skill catalog with six umbrella skills and direct
  one-level guidance and editable example modules.
- Added installed-documentation routing, independent substantive review,
  independent test-first coding guidance, and Unix-oriented minimal
  architecture defaults.
- Added `submit_plan` file-review fallback when Plannotator cannot
  start.

### Changed

- Simplified the always-visible supervisor guidance and consolidated
  duplicated runtime string validation and project-local path handling.

### Removed

- Removed superseded indexed skill names; their unique guidance is
  consolidated under the six umbrella skills.

## v1.2.0 - 2026-07-30

### Added

- Added model-visible worker result details, Plannotator plan feedback,
  Google-compatible enum schemas, core project-file checks, and shallow
  `PROJECT.md` validation.
- Added `Previous action` and an explicit `None at present.` option for
  a project's immediate next step.
- Added companion-skill guidance and selected review/reporting practices
  informed by an archived skill comparison.
- Added optional layered review skills `review-structure`,
  `review-detail`, and `review-copyedit` that compose with
  `artifact-review` through ordinary multi-skill worker selection.
- Added package prose and Reveal.js defaults, a portable
  `templates/revealjs-baseline.css`, selectable verification recipes,
  decision-memo options, and a README inspirations section for external
  retrospective tools.
- Added the human `/plannotator-review` command for Plannotator code
  review of current changes or a PR URL, without enabling Plannotator
  plan-mode.
- Added reproducible `markdown:check` and `markdown:fix` commands using
  Pandoc Markdown 3.10.1 at 72 columns.

### Changed

- Rewrote public documentation around people installing and using Pi
  Sych, while keeping maintainer detail in the architecture and
  development guides.
- Made project-status cycle, legacy-status, MCPorter fallback,
  package-load diagnostics, and opt-in usage-test handling more
  reliable.
- Removed stale public references to the intentionally deleted
  target-architecture and principles documents.
- Expanded writing, scholarly, R/Quarto, theory, strategy,
  retrospective, and project-briefing skills with overridable
  opinionated defaults and non-mutating proposal formats.
- Changed project-state labels from bracket-delimited to brace-delimited
  terms so Discount and Pandoc render them literally without escaping.
- Changed installable and development dependency ranges to `latest`;
  peer dependencies remain `*` for host compatibility. The release gate
  resolves Pi 0.83.x from that policy.

## v1.0.3 - 2026-07-30

### Fixed

- Corrected the architecture document to embed the architecture diagram
  rather than the supervisor-context diagram.

## v1.0.2 - 2026-07-30

### Changed

- Listed the nine design principles verbatim in the README.
- Updated versioned diagram URLs and removed inline image alt text for
  broader Markdown-renderer compatibility.

## v1.0.1 - 2026-07-30

### Added

- Added behavioral tests for worker cancellation, `SIGTERM`, the
  termination grace period, and forced `SIGKILL`.
- Expanded opt-in real-Pi acceptance to exercise a clean-context
  `dispatch_worker` call.
- Added Pi package-gallery image metadata, packaged architecture
  documentation, and corrected architecture diagrams rendered from
  versioned README URLs.

### Fixed

- Report persisted `needs-review` state even when every tracked file
  still matches its recorded hash.

## v1.0.0 - 2026-07-30

### Changed

- Replaced the public workflow-tool surface with `dispatch_worker`,
  `project_status`, and optional `submit_plan`.
- Moved bootstrap, conceptual drift, reconciliation, evidence,
  verification, and retrospective procedures into skills.
- Added flexible graph-aware `SYNC.md` dependency checking and explicit
  acknowledgement.
- Simplified worker dispatch, retained optional MCPorter remote
  research, and retained both Plannotator annotation commands.

### Removed

- Candidate, reconciliation, semantic-drift, evidence, retrospective,
  and verification wrapper tools and commands.

## v0.1.2 - 2026-07-29

### Changed

- Upgraded development TypeScript to 7.0.2 and added TypeScript 6+
  test-build configuration.
- Added Biome formatting and linting with tab indentation, developer
  scripts, and GitLab CI enforcement.

## v0.1.1 - 2026-07-29

### Added

- Public changelog included in the npm package.

## v0.1.0 - 2026-07-29

### Added

- Optional canonical `TODO.md` task ledger discovery and synchronization
  metadata for task state, priorities, and blockers.
- Documentation and bounded artifact guidance that keep task state
  distinct from project direction, evidence, decisions, and external
  issue trackers.
- A GitLab release job npm CLI requirement check for OIDC trusted
  publishing.

## v0.0.2 - 2026-07-29

### Fixed

- GitLab release tag/version shell check quoting.

## v0.0.0 - 2026-07-29

### Added

- Initial public alpha release of Pi Sych.

## Historical note

`v0.0.1` is a Git tag only. Its release pipeline failed before npm
publication because of a shell quoting error; npm has no `pi-sych@0.0.1`
version.
