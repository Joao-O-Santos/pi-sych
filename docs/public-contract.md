# Public contract and compatibility

This document is the authority for Pi Sych's supported userland. Shipped
source is not automatically public API. The initial compatibility baseline is
the documented `4.0.6` behavior; where that baseline is ambiguous, preserve an
existing documented workflow rather than retroactively calling it internal.

## Surface classification

| Class | Supported surface | Compatibility promise |
| --- | --- | --- |
| Public userland | The `pi-sych` npm identity, MIT `LICENSE`, declared package resources, and the Node/Pi compatibility policy published with the package. The `6.0.0` baseline declares Pi interfaces as peer dependencies with `*` and requires Node 26 or newer, so use a Pi release that can install and run those declared resources. | Installation and documented use remain compatible within the release rules below. |
| Public userland | Six skills: `project`, `write`, `analyze`, `code`, `review`, and `research`; their documented capability scope and ordinary `/skill:<name>` invocation. A copied override is user-owned and version-decoupled. | Skill names and documented scope are stable. Hidden methods and local module layout are not separately invokable userland. |
| Public userland | Package extension paths `extensions/workbench/index.ts` and `extensions/plannotator/index.ts`, for Pi package filtering and `pi config`. | Paths and declared default resources remain usable as documented. |
| Public userland | Tools: `project_status` (`check` or `acknowledge`, optional `files` and `reason`) and `dispatch_worker` (task, mode, expected output, context files, and documented optional model, skill, remote-research, and timeout fields). | Input schema, result categories, and material effects are stable: status mechanically checks/acknowledges; dispatch creates one bounded worker and returns a validated terminal result. |
| Public userland | Commands: `/pi-sych-status`, `/pi-sych-mcp`, `/plannotator-last`, `/plannotator-annotate <project-local-file>`, and `/plannotator-review [--git|--gitbutler] [--no-local] [PR-URL]`. | Names, accepted arguments, documented output files, and material failure behavior are stable. Plannotator remains a review adapter, not plan control or automatic promotion. |
| Public userland | Worker-only `literature_search`, available when a dispatched worker selects the exact `research` skill. It accepts a non-empty FTS query and optional limit from 1 to 50, defaulting to 10. | Results are ranked local metadata/snippets with resolved source paths; the tool is absent for supervisors and workers without `research`. It reads the configured database only. |
| Public userland | Optional `literatureDatabase` configuration and the supported SQLite `papers` plus external-content FTS5 `papers_fts` schema. | Database precedence is project `LITERATURE.sqlite`, configured path, then the resolved config directory's `literature.sqlite`; relative configured paths use that directory, absolute paths are allowed, and missing explicit paths fail. Pi Sych reads without migration or schema inference. |
| Public userland | Documented configuration directory resolution, worker catalogue and bootstrap, `remoteResearch`, package filters, and tool-selection flags. Pi Sych has no supported `PI_SYCH_*` configuration overrides. | A disabled optional integration is absent without error; an explicitly requested but missing or invalid integration fails with actionable diagnostics. |
| Public userland | Project formats: `SYNC.json` v2; required `PROJECT.md` headings; acknowledgement meaning; proposal-line grammar; and stable paths in `templates/`. Generated locations include `INBOX.md`, `<input>.feedback.md`, `PLANNOTATOR_REVIEW.md`, and worker bootstrap settings. | Schemas, grammar, templates, paths, and documented file behavior are stable. |
| Public userland | Packaged public documentation, this contract, `COPYING.md`, `LICENSE`, and notices in `LICENSES/`. | These documents and notices remain available in the package. |
| Compatibility-sensitive internal | Model-facing supervisor, worker, compaction, and persisted-session protocols. | Not a TypeScript API. Changes still need migration analysis, regression tests, and release notes when sessions or model behavior may be affected. |
| Internal implementation | Undocumented TypeScript exports; deep `extensions/**/src` paths; local modules and hidden methods; fixtures; exact incidental error wording; and benchmark internals. | No library-import API is supported unless deliberately documented later. Error category and fail/omit behavior are public; punctuation and incidental wording are not unless machine-readable. |

Model prose is not deterministic API. Documented capability scope, human
ownership, non-invention boundaries, and material side effects are.

## Releases and migration

A release level follows required user migration, not implementation size.

- **Major:** remove or rename public userland; narrow supported input; make a
  schema, file, configuration, template, default, or side effect incompatible;
  require stored-state migration; or raise a supported runtime/integration
  requirement outside the published policy.
- **Minor:** add an optional backward-compatible public capability, field,
  command, tool, skill, extension, or configuration; deprecate while preserving
  behavior; or materially improve a supported use without invalidating it.
- **Patch:** correct behavior within this contract, refine defeasible guidance
  without changing its supported scope, update docs/tests, or refactor an
  internal without user migration.

Security or correctness can justify an incompatible change, but not calling it
non-breaking: make a major release or publish an exceptional supported
migration. Deprecate in a minor and remove only in an authorized major.
Changing a default from on to off is breaking when users materially lose
behavior. Adding an independently disableable resource while retaining the
default is minor. Version 5.0.0 is major because it removes documented
`PI_SYCH_*` configuration overrides and relocates configuration into the
unified visible directory. Its independently disableable Plannotator resource,
Pages, and benchmarks are otherwise additive; Plannotator remains default-on
and tool schemas and command names remain compatible.

Before release, name the affected row above, say whether a documented use needs
migration, check stored state and default-side-effect changes, and justify the
major/minor/patch choice in the changelog. Test public names, schemas, declared
resources, templates, and file behavior without creating a second registry or
freezing semantic prose into keyword checks.
