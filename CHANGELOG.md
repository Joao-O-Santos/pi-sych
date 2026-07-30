# Changelog

All notable changes to Pi Sych are documented here. Versions are immutable npm publications unless explicitly marked otherwise.

## [1.0.1] - 2026-07-30

### Added

- Added behavioral tests for worker cancellation, `SIGTERM`, the termination grace period, and forced `SIGKILL`.
- Expanded opt-in real-Pi acceptance to exercise a clean-context `dispatch_worker` call.
- Added Pi package-gallery image metadata, packaged architecture documentation, and corrected architecture diagrams rendered from versioned README URLs.

### Fixed

- Report persisted `needs-review` state even when every tracked file still matches its recorded hash.

## [1.0.0] - 2026-07-30

### Changed

- Replaced the public workflow-tool surface with `dispatch_worker`, `project_status`, and optional `submit_plan`.
- Moved bootstrap, conceptual drift, reconciliation, evidence, verification, and retrospective procedures into skills.
- Added flexible graph-aware `SYNC.md` dependency checking and explicit acknowledgement.
- Simplified worker dispatch, retained optional MCPorter remote research, and retained both Plannotator annotation commands.

### Removed

- Candidate, reconciliation, semantic-drift, evidence, retrospective, and verification wrapper tools and commands.

## [0.1.2] - 2026-07-29

### Changed

- Upgraded development TypeScript to 7.0.2 and added TypeScript 6+ test-build configuration.
- Added Biome formatting and linting with tab indentation, developer scripts, and GitLab CI enforcement.

## [0.1.1] - 2026-07-29

### Added

- Public changelog included in the npm package.

## [0.1.0] - 2026-07-29

### Added

- Optional canonical `TODO.md` task ledger discovery and synchronization metadata for task state, priorities, and blockers.
- Documentation and bounded artifact guidance that keep task state distinct from project direction, evidence, decisions, and external issue trackers.
- A GitLab release job npm CLI requirement check for OIDC trusted publishing.

## [0.0.2] - 2026-07-29

### Fixed

- GitLab release tag/version shell check quoting.

## [0.0.0] - 2026-07-29

### Added

- Initial public alpha release of Pi Sych.

## Historical note

`v0.0.1` is a Git tag only. Its release pipeline failed before npm publication because of a shell quoting error; npm has no `pi-sych@0.0.1` version.
