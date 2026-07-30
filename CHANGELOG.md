# Changelog

All notable changes to Pi Sych are documented here. Versions are
immutable npm publications unless explicitly marked otherwise.

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
  Pandoc Markdown at 72 columns.

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
