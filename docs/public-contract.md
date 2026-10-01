# Public contract and compatibility

This document is the authority for Pi Sych's supported userland. Shipped
source is not automatically public API. The initial compatibility
baseline is the documented `4.0.6` behavior; where that baseline is
ambiguous, preserve an existing documented workflow rather than
retroactively calling it internal. The v8 package targets Pi 0.99.2 or
newer; repository checks pass against Pi 0.99.2 and 1.0.0.

## Surface classification

| Class | Supported surface | Compatibility promise |
|------------------------|------------------------|------------------------|
| Public userland | The `pi-sych` npm identity, MIT `docs/LICENSE.md`, declared package resources, and the Node/Pi compatibility policy published with the package. The package declares Pi interfaces as peer dependencies with `*`, following Pi's package convention, and requires Node 26 or newer. Its dev dependency range starts at Pi 0.99.2; use a release that can install and run the declared resources. | Installation and documented use remain compatible within the release rules below. |
| Public userland | Seven skills: `project`, `write`, `analyze`, `code`, `review`, `research`, and `automation`; their documented capability scope and ordinary `/skill:<name>` invocation. A copied override is user-owned and version-decoupled. | Skill names and documented scope are stable. Hidden methods and local module layout are not separately invokable userland. |
| Public userland | Package extension paths `extensions/workbench/index.ts` and `extensions/plannotator/index.ts`, for Pi package filtering and `pi config`. | Paths and declared default resources remain usable as documented. |
| Public userland | Tools: `project_status` (`check` or `acknowledge`, optional `files` and `reason`) and `dispatch_worker` (task, tool mode, expected output, context files, and documented optional context mode, model, skill, remote-research, thinking level, and timeout fields). A context-file path is project-relative or an explicitly supplied readable absolute path; `contextMode` is `clean` or `trajectory` and defaults to `clean`; optional `thinkingLevel` is one of `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` and omission delegates to the selected model's default. | Input schema, result categories, and material effects are stable: status mechanically checks/acknowledges; dispatch creates one bounded worker, exposes a bounded live projection of its tool starts, and returns the validated terminal result plus `reportedFiles`, `observedChangedFiles`, `unexpectedChanges`, and optional `observationError`. Changed paths are observed after every worker termination; observation does not roll changes back. In Git projects the snapshot reports changed tracked/untracked paths; non-Git project roots use a filesystem snapshot. Trajectory mode branches from persisted supervisor context immediately before the dispatching assistant entry, without mutating the live session, and fails if that boundary is unavailable. Thinking level is passed to Pi via `--thinking` and model capability may clamp or interpret it; Pi Sych validates only the documented global enum. |
| Public userland | Commands: `/pi-sych-status`, `/mcp`, `pi mcp list`, `pi mcp login`, `pi mcp logout`, `/plannotator-last`, `/plannotator-annotate <project-local-markdown-file>` (accepting `.md` and `.mdx`), and `/plannotator-review [--git|--gitbutler] [--no-local] [PR-URL]`. | Native MCP commands/status belong to Pi; no Pi Sych MCP status wrapper is provided. Plannotator commands are available when its optional dependencies and compatible adapter are present; otherwise core startup continues. Plannotator remains a review adapter, not plan control or automatic promotion. |
| Public userland | `literature_search`, available directly to the supervisor and to a dispatched worker whose selected skills include the exact `research` selector. It accepts a non-empty FTS query and optional limit from 1 to 50, defaulting to 10. | Read-only results provide compact readable content and structured data: nullable `title`, `itemType`, `creators`, `year`, and `doi`, plus `snippet`, `score`, and resolved `sourcePath`. Results are discovery/provenance, not source verification. Workers without `research` do not receive it. |
| Public userland | Pi Sych v2 configuration: global `<pi-config-root>/pi-sych/config.json`, layered with optional project `.pi/pi-sych/config.json`; supported keys are `version`, `compaction.custom`, `compaction.thresholdTokens`, `completionReassessment`, and `literatureDatabase`. | Global settings load first and project keys override only matching keys, including nested compaction fields. Unknown keys are rejected. Custom compaction defaults on; the proactive threshold defaults to 150,000 context tokens and is not Pi `reserveTokens`. Completion reassessment defaults off; when enabled, one hidden prompt may request a single continuation at a safe Pi `agent_before_settle` boundary, without broadening authorization. The literature path may be absolute or relative: global-relative paths use the global Pi Sych config directory, project-relative overrides use the project root. If absent, the conventional config-directory `literature.sqlite` fallback applies (with existing project `LITERATURE.sqlite` discovery). No credentials belong in these files. |
| Public userland | The v7 SQLite `papers` plus external-content FTS5 `papers_fts` schema, including `item_type`, `creators_json`, and the `literature_search` metadata result. | Pi Sych opens the database read-only and does not migrate it. `item_type` is text or SQL `NULL`; `creators_json` is SQL `NULL` or JSON text containing a non-null, non-array object of role arrays of non-null, non-array name objects. JSON text `null` is rejected. Pi Sych checks this structure, not CSL semantics or citation formatting; see [configuration](configuration.md#local-literature-search) for null and failure semantics. v6 databases and consumers require external migration; see the v7 literature migration guide. |
| Public userland | `remoteResearch` worker intent flag. | When true, the worker explicitly loads native Pi MCP and codemode and reads MCP configuration from its worker agent directory. Configure/authenticate it with native Pi MCP commands. Supervisor MCP configuration and tools are not copied; ordinary workers receive neither MCP nor codemode. Exposure does not guarantee working credentials or retrieval. |
| Public userland | Project formats: `SYNC.json` v2; required headings in the configured project brief (default `PROJECT.md`); acknowledgement meaning; proposal-line grammar; and stable paths in `templates/`. Generated locations include the configured inbox path (default `INBOX.md`), `<input>.feedback.md`, `<projectRoot>/PLANNOTATOR_REVIEW.md`, and worker bootstrap settings. | Schemas, grammar, templates, configured canonical paths, and documented file behavior are stable. Malformed or unreadable `SYNC.json` state is reported as unavailable and cannot be acknowledged; extension startup remains available so that state can be inspected. |
| Public userland | Five thin packaged review prompts (`review-collaborative`, `review-adversarial`, `review-reader-friction`, `review-structural`, and `review-verification`). | Each selects a review lens and defers substantive procedure to the `review` skill; prompts return findings and do not silently edit, orchestrate agents, or imply approval. |
| Public userland | Packaged public documentation, including the v7 literature migration guide, [v7 to v8 migration guide](migration-v7-to-v8.md), this contract, `COPYING.md`, `docs/LICENSE.md`, and notices in `docs/LICENSES/`. | These documents and notices remain available in the package. |
| Compatibility-sensitive internal | Model-facing supervisor, worker, compaction, completion-reassessment, and persisted-session protocols. | Not a TypeScript API. Changes still need migration analysis, regression tests, and release notes when sessions or model behavior may be affected. Custom compaction uses bounded observable messages, retained tail, and canonical snapshots, preserves recorded label attributions without verification, appends only bounded unreviewed inbox proposals, never mutates canonical semantic files, and returns native fallback on omission/failure. |
| Internal implementation | Undocumented TypeScript exports; deep `extensions/**/src` paths; local modules and hidden methods; fixtures; exact incidental error wording; and benchmark internals. | No library-import API is supported unless deliberately documented later. Error category and fail/omit behavior are public; punctuation and incidental wording are not unless machine-readable. |

Model prose is not deterministic API. Documented capability scope, human
ownership, non-invention boundaries, and material side effects are.

## Releases and migration

A release level follows required user migration, not implementation
size.

- **Major:** remove or rename public userland; narrow supported input;
  make a schema, file, configuration, template, default, or side effect
  incompatible; require stored-state migration; or raise a supported
  runtime/integration requirement outside the published policy.
- **Minor:** add an optional backward-compatible public capability,
  field, command, tool, skill, extension, or configuration; deprecate
  while preserving behavior; or materially improve a supported use
  without invalidating it.
- **Patch:** correct behavior within this contract, refine defeasible
  guidance without changing its supported scope, update docs/tests, or
  refactor an internal without user migration.

Security or correctness can justify an incompatible change, but not
calling it non-breaking: make a major release or publish an exceptional
supported migration. Deprecate in a minor and remove only in an
authorized major. Changing a default from on to off is breaking when
users materially lose behavior. Adding an independently disableable
resource while retaining the default is minor. Version 5.0.0 is major
because it removes documented `PI_SYCH_*` configuration overrides and
relocates configuration into the unified visible directory. The v8
native-MCP transition removes MCPorter and `/pi-sych-mcp`; use the
worker's own native Pi MCP configuration and `/mcp` instead. The v7 to
v8 guide documents obsolete config-key removal and new layered behavior.

Before release, name the affected row above, say whether a documented
use needs migration, check stored state and default-side-effect changes,
and justify the major/minor/patch choice in the changelog. Test public
names, schemas, declared resources, templates, and file behavior without
creating a second registry or freezing semantic prose into keyword
checks.
