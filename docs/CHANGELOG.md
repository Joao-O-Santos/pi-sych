# Changelog

Notable user-facing changes to Pi Sych, in reverse version order.

## Unreleased

- Writing guidance calls for a structural second pass, clearer links
  between paragraphs, and fewer unnecessary defensive contrasts and
  hedged endings.
- Pi 1.5 and newer can show Pi Sych release notes after an update.

## 8.1.5

- Literature search formats records without abstracts using snippets
  from matching fields. No migration is required.

## 8.1.4

- Worker calls use a shared renderer for consistent, readable details.

## 8.1.3

- Collapsed worker calls show the context mode; expanded calls display
  arguments as readable labeled fields.

## 8.1.2

- `project_status` and `/pi-sych-status` report the supervisor model's
  catalog role on request, when available.
- Worker summaries distinguish mode from tools, and review provenance
  describes the likely bias of the selected lens.

## 8.1.1

- Worker calls show prioritized details when collapsed and labeled
  fields when expanded; activity lines include available tool arguments.
- Document optional delegation and review handoffs.

## 8.1.0

- Add optional `dispatch_worker.workerInstructions` as launch-scoped
  worker guidance. Omitting it preserves the existing worker setup.
- Recover usable compaction summaries despite malformed optional
  entries, invalid promotions, or inbox failures; unusable required
  memory still triggers native fallback.
- Expand skill-routing, code-tour, and review guidance, including how to
  evaluate feedback and disclose LLM review scope.

## 8.0.1

- Report explicit worker aborts as cancellations, including on normal
  process exit, while remaining compatible with older Pi versions.
- Preserve valid reports from failed or interrupted workers as
  provisional, alongside the primary error and independently observed
  changes.

## 8.0.0

- **Breaking:** Replace v7 settings with strict version 2 global/project
  layered configuration. The default proactive compaction threshold is
  150,000 tokens and the worker catalogue is `worker-models.json`.
- **Breaking:** Remove MCPorter, `/pi-sych-mcp`, and PEW-PEW
  inheritance. Remote workers use Pi-native MCP and codemode only when
  requested; configure servers and authentication with native Pi
  commands. See the [v7-to-v8 migration guide](migration-v7-to-v8.md).
- Require Pi 0.99.2 or newer and delegate transport and credentials to
  Pi.
- Add opt-in, one-shot completion reassessment at Pi's safe settle
  boundary; it is off by default.
- Improve bounded task-centred compaction and native fallback, and
  provide validated structured literature results with bounded snippets.
  Add OpenAlex guidance for metadata and graph discovery.
- Improve worker exit diagnostics and process cleanup on timeout or
  cancellation; reject overlapping acknowledgement transactions.

## 7.0.1

- Clarify that reviewer recommendations are proposals to assess, not
  accepted decisions or evidence; preserve supported claims and surface
  genuine conflicts.

## 7.0.0

- **Breaking:** Replace literature `first_author` with `item_type` and
  ordered, role-aware `creators_json`. `literature_search` returns
  nullable `itemType` and nullable or structured `creators` instead of
  `metadata.authors`.
- Local literature users must rebuild or migrate v6 databases and update
  result consumers. There is no automatic conversion from
  `first_author`; reconstruct creators from reliable sources where
  possible and leave them unknown otherwise. See the [migration
  guide](literature-database-v7.md). Users without local literature
  search have no literature-data migration.
- Add the `automation` skill, writing defaults, and stronger routed
  skill and review guidance.
- Add supervisor capability reporting and settled-turn compaction with
  bounded context and native fallback.
- Report worker-claimed files separately from observed project changes,
  including changes after failure or cancellation.
- Distinguish worker tool mode from context mode, require explicit scope
  for `agents` promotion, and make optional Plannotator integration
  degrade gracefully.

## 6.5.0

- Allow explicit `dispatch_worker.contextFiles` to include readable
  absolute paths outside the project. Relative paths and worker-reported
  files remain project-relative; existing requests need no migration.

## 6.4.0

- Add optional `dispatch_worker.contextMode: trajectory` to branch from
  the persisted supervisor context; `clean` remains the default.
  Trajectory dispatch fails if its exact boundary is unavailable.
- Explicit remote-research workers can reuse an active,
  provenance-validated PEW-PEW `web` tool; invalid or ambiguous
  provenance can fail dispatch.
- Show context mode in worker calls and broaden the `code` skill
  description. Context mode does not change research access or host
  permissions.

## 6.3.2

- Add the Pi Sych logo to packaged documentation and the package
  gallery.

## 6.3.1

- Improve the README and workflow overview, clarify worker bootstrap and
  Plannotator's `.md`/`.mdx` annotation boundary, and fix documentation
  links.

## 6.3.0

- Show bounded live worker tool activity and a compact task, model role,
  and timeout summary in `dispatch_worker` calls.
- Reject whitespace-only configured paths.
- Prereleases `6.3.0-rc.0` and `6.3.0-rc.1` introduced live activity and
  the collapsed call summary respectively. `6.3.0-rc.0` also accepted
  two-part Pandoc versions such as `3.11`.

## 6.2.0

- Show complete `dispatch_worker` arguments when a tool call is
  expanded.

## 6.1.4

- Organize public documentation and licenses under `docs/`, benchmarks
  under `tests/`, site sources under `site/`, and visible defaults under
  `templates/`.

## 6.1.3

- Declare the literature query's non-empty constraint in its tool
  schema.

## 6.1.2

- Maintenance-only release.

## 6.1.1

- Forward the resolved Pi Sych configuration directory to isolated
  workers, enabling research workers to use configured external
  literature databases.
- Clear worker timeout and forced-kill timers after child process
  errors.

## 6.1.0

- Add worker-only `literature_search` for the `research` skill, with
  local SQLite FTS5 schema and `literatureDatabase` configuration.
- Clip compaction snapshots at valid UTF-8 boundaries and require
  promotion proposals to be single-line inbox entries.
- Document worker requests and results, lifecycle precedence, and the
  custom compaction model seam.

## 6.0.10

- Accept scalar strings as one-element arrays at the compaction
  model-output boundary.

## 6.0.9

- Restore strict shared string and string-array validation.

## 6.0.8

- Maintenance-only release.

## 6.0.7

- Allow lenient string and string-array coercion in shared helpers.

## 6.0.6

- Clean up worker temporary directories across failure and termination
  paths, preserve the first timeout or cancellation decision, and report
  spawn errors.

## 6.0.5

- Maintenance-only release.

## 6.0.4

- Maintenance-only release.

## 6.0.3

- Maintenance-only release.

## 6.0.2

- Fix architecture diagram rendering and project-status reporting of
  observation errors and missing-artifact dependency impact.
- Fix active untracked compaction file validation, Windows root-relative
  configuration paths, package-root resolution, and atomic write
  ordering.

## 6.0.0

- **Breaking:** Require Node 26 or newer.
- Distinguish current, changed, missing, and unobservable project
  states; unchanged acknowledgements no longer invalidate dependants.
- Improve compaction JSON extraction and preserve active existing
  untracked files. Fail fast on malformed `SYNC.json` at startup.
- Centralize Pi configuration-root and named-skill lookup with
  cross-platform path validation, and report worker process failures
  before missing results.

## 5.0.0

- **Breaking:** Replace `PI_SYCH_MODEL_CATALOG`,
  `PI_SYCH_WORKER_AGENT_DIR`, and `PI_SYCH_MCPORTER_CONFIG` with a
  versioned `config.json` in Pi-native project, agent, XDG, or home
  configuration directories. Migrate settings from the removed overrides
  and former default paths.
- Make Plannotator and MCPorter optional, with a separate Plannotator
  entrypoint and early failure when an absent integration is requested.
- Add configurable custom compaction, optional automatic compaction at
  100,000 context tokens, and manual or Plannotator review modes.
- Add a public-contract and SemVer policy, and strengthen coding
  guidance.

## 4.0.6

- Require inspected motivating material for hypothesis generation and
  bound model assistance to specified scientific reasoning tasks.
- Make retrospective proposals identify predicted effects, regression
  risks, and held-in and held-out evaluations without automatic
  mutation.
- Preserve continuity-critical alternatives, negative results, failed
  approaches, and uncanonical commitments during compaction.

## 4.0.5

- Retain six umbrella skills while adding shared prose, hypothesis,
  argument, and claim-to-evidence methods and more focused task routes.
- Make project `STYLE.md` a local-delta template and refine prose
  guidance.
- Add packaged attribution and normalize documentation paths.

## 4.0.4

- Add a user-centred review and revision workflow guide and diagrams.

## 4.0.3

- Bound compaction snapshots and exclude unreviewed inbox contents.
- Expose project validation errors, recheck files before
  acknowledgement, and validate worker-reported paths.
- Correct the timing of supervisor instruction and worker model-role
  loading.

## 4.0.2

- Correct package manifest and README image references to the patch
  release.

## 4.0.1

- Maintenance-only release.

## 4.0.0

- Remove plan submission, structured promotion storage, rigid model
  profiles, and redundant worker-result metadata.
- Retain project hashes, dependency impact, bounded workers, atomic
  manifest replacement, and explicit human acknowledgement.

## 3.0.4

- Complete configured project-root and canonical-path handling across
  workers, status, compaction, and human review.
- Validate `SYNC.json` metadata, recheck external canonical paths, and
  report promotion persistence results.

## 3.0.3

- Correct the documented default inbox path to `INBOX.md` and clarify
  canonical path overrides and compaction triggers and model selection.

## 3.0.2

- Document the compaction pipeline, manifest resolution, and `SYNC.json`
  v2 project canonical paths.

## 3.0.1

- Restore graceful `/pi-sych-status` reporting for malformed
  `SYNC.json`.
- Remove the redundant `/plannotator-review --local` no-op.

## 3.0.0

- **Breaking:** Replace the `SYNC.md` JSON fence with direct `SYNC.json`
  version 2, including workspace, nearest-manifest, and configured
  canonical path resolution.
- Route promotion by role to configured canonical paths and include
  bounded project status in working-memory compaction.
- Isolate malformed inbox parsing and fall back to Pi's standard
  compactor on custom-compaction failure.
- Restore substantive v1.2.0 guidance under the six umbrella skills.

## 2.1.1

- Keep `SYNC.md` JSON fences stable under the pinned Pandoc formatter.

## 2.1.0

- Add task-centred custom compaction with standard-compactor fallback
  and human-review `INBOX.md` promotion proposals visible in project
  status.

## 2.0.0

- **Breaking:** Replace the indexed skill catalog with six umbrella
  skills; consolidate the removed skills' guidance under them.
- Add installed-documentation routing, independent review and test-first
  coding guidance, and `submit_plan` file-review fallback when
  Plannotator cannot start.

## 1.2.0

- Add model-visible worker result details, Plannotator plan feedback,
  core project-file checks, and shallow `PROJECT.md` validation.
- Add `Previous action` and an explicit `None at present.` next-step
  option.
- Add optional layered review skills, expanded writing and research
  guidance, prose and Reveal.js defaults, and a Reveal.js baseline
  stylesheet.
- Add `/plannotator-review` for current changes or a PR URL, and
  Pandoc-based `markdown:check` and `markdown:fix` commands.
- Improve project-status, MCPorter fallback, and package-load
  diagnostics; change project-state labels from brackets to braces.

## 1.0.3

- Correct the diagram embedded in the architecture documentation.

## 1.0.2

- List the nine design principles in the README and update diagram
  links.

## 1.0.1

- Report persisted `needs-review` state even when tracked file hashes
  match.
- Add packaged architecture documentation and corrected diagrams.

## 1.0.0

- **Breaking:** Replace workflow tools with `dispatch_worker`,
  `project_status`, and optional `submit_plan`; move other workflow
  procedures into skills and remove their wrapper tools and commands.
- Add graph-aware `SYNC.md` dependency checking and explicit
  acknowledgement.
- Retain optional MCPorter remote research and both Plannotator
  annotation commands.

## 0.1.2

- Add Biome formatting and linting and developer scripts.

## 0.1.1

- Include the public changelog in the npm package.

## 0.1.0

- Add optional `TODO.md` task ledger discovery and synchronization
  metadata for task state, priorities, and blockers.

## 0.0.2

- Maintenance-only release.

## 0.0.0

- Initial public alpha release of Pi Sych.

`0.0.1` was a Git tag only, not an npm release.
