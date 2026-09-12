# Changelog

All notable changes to Pi Sych are documented here. Signed Git tags and
npm registry metadata establish publication status and dates; headings
below record versioned changes without duplicating that live release
state.

## Unreleased

### Changed

- Rework model-facing instruction hierarchy around concise always-visible
  invariants, domain posture/routing in umbrella skills, and detailed
  procedure in routed methods/modules.
- Separate persistence from scrutiny: an already-authorized task should
  continue to completion or a genuine blocker, while consequential or
  authored work receives stronger internal checking without automatic
  user checkpoints.
- Treat a clear request to review, rewrite, implement, or complete a
  defined scope as authorization for that scope; reserve new approval
  checkpoints for consequential choices, side effects, or material
  ambiguity outside it.
- Make direct-versus-worker choice contextual rather than a fixed
  default, and clarify that trajectory context or explicit supervisor
  pre-work can support delegation when conversation history matters.
- Strengthen whole-artifact writing/review guidance so high scrutiny does
  not prevent completion of explicitly requested broad work.
- Clarify `literature_search` as a discovery/provenance surface rather
  than source verification or completeness evidence.
- Tighten worker request/result schema descriptions, assignment prompt,
  terminal submission guidance, and remote-research limitations.
- Reconcile present-tense README, configuration, architecture,
  development, maintainer, project, and planning documentation with the
  seven-skill catalogue and new task-posture semantics.

### Compatibility

These changes refine model-facing guidance and documentation. They do
not add a workflow controller, change worker process isolation, alter the
clean/trajectory runtime mechanics, or grant new authority over release,
publication, external side effects, or durable project truth.

## v7.0.0

### Breaking

- Replace scalar `first_author` metadata with producer-supplied
  `item_type` and ordered, role-aware `creators_json` metadata in the
  supported local literature schema.
- Return nullable `itemType` and nullable or structured `creators` from
  `literature_search`; remove `metadata.authors`.

### Compatibility

This major release changes both the supported literature database schema
and the public search result. Users of local literature search must
externally rebuild or migrate v6 databases and update result consumers.
There is no automatic conversion from `first_author`, which may contain
lossy citation stems. Pi Sych performs shallow JSON shape checks only;
it does not infer creators, validate the CSL vocabulary, format
citations, or choose roles for a citation style. Users who do not use
local literature search have no literature-data migration.

## v6.5.0

### Added

- Permit explicit `dispatch_worker.contextFiles` entries to name any
  readable absolute path. Relative context paths remain
  project-relative; paths inside the project normalize to relative form,
  while external paths remain absolute.

### Compatibility

This minor release adds external absolute files as optional explicit
worker context without changing existing project-relative context paths,
worker result-file validation, stored state, defaults, or tool modes.
Worker-reported files remain project-relative.

## v6.4.0 (2026-09-15)

### Added

- Add optional `dispatch_worker.contextMode`: `clean` remains the
  default, while `trajectory` gives a worker a temporary native branch
  of the persisted supervisor context ending immediately before the
  exact dispatching assistant entry.
- Reuse an already active, provenance-validated PEW-PEW `web` tool for
  explicitly requested remote-research workers without discovering or
  overriding disabled packages.

### Changed

- Show effective context mode in collapsed worker calls and broaden the
  `code` skill description to cover automation, CLI and developer
  tooling, and integration work.
- Retain worker-process termination ownership across repeated child
  errors until process close is observed.
- Raise the nonblank runtime source cap to 2,500 for the approved native
  trajectory and active PEW-PEW integration boundaries.

### Compatibility

This minor release adds optional trajectory context while preserving the
clean default, result protocol, stored project state, model selection,
and worker tool-mode definitions. Trajectory mode fails rather than
falling back when its exact persisted boundary is unavailable. Existing
requests require no schema migration. Existing `remoteResearch: true`
calls may now also expose an active, provenance-validated PEW-PEW `web`
tool; invalid or ambiguous active-tool provenance can fail dispatch.
Context mode itself does not change research access or host permissions.

## Historical releases

Earlier release history remains in Git tags and prior package
changelogs. This file intentionally keeps the current unreleased and
recent compatibility-relevant entries concise rather than duplicating a
full release ledger.
