# v8 integration — remaining work

The original implementation checklist was applied to the local v8 preparation
(see `docs/migration-v7-to-v8.md`, `docs/ARCHITECTURE.md`, and
`docs/CHANGELOG.md`). This file tracks **remaining verification and decisions**,
not a claim that unrun external checks passed.

## Implemented locally

- Removed PEW-PEW provenance/inheritance, startup capability narration,
  MCPorter client/config/command/dependency, and duplicate worker contract tests.
- Added strict layered version 2 Pi Sych config, conventional worker paths,
  native worker MCP/codemode on explicit `remoteResearch`, and model-only
  dispatch/submission tools. Plannotator selection belongs to Pi resources.
- Retained bounded custom compaction with host model registry, cancellation,
  native fallback and a configurable 150k idle threshold. Native Pi compaction
  remains in control when custom compaction is off or the model context is
  smaller than the threshold.
- Added structured/readable validated local literature results with bounded
  snippets and annotations. A graded fixture compares unweighted and weighted
  FTS5 ranking; the weighted title match beats the unweighted first result.
- Added capability-first document/web guidance, codemode examples, migration
  guide, local two-tool native MCP/codemode partial-failure integration, and
  packed-install tests with and without optional Plannotator.
- Baseline v7.0.1 runtime: 3170 nonblank lines; current v8 preparation: 3041
  (below baseline). Baseline coverage:
  97.48% lines, 90.23% branches, 95.31% functions. The most recent v8 full
  coverage check exceeded all three; recheck after final changes.

## Outstanding gates and limitations

- [ ] Validate **real** Context7, OpenAlex, and Scholar Gateway over Pi native
  MCP, including authentication. The worker-agent currently has no `mcp.json`;
  do not synthesize/copy supervisor MCP configuration or claim connectivity.
  A legacy-SSE-only blocker, if found, needs concrete evidence.
- [x] Run the opt-in real-model Pi workflow (passed on a disposable project).
  Also checked the installed v8 package with a live `project_status` call.
  The deterministic native MCP fixture tests transport/composition without
  a model, not live external access.
- [ ] Decide whether to split custom compaction into its own independently
  loadable Pi resource; the v8 workbench currently owns the hook and policy,
  with `compaction.custom: false` leaving native compaction in control. A split
  is optional, not a prerequisite for the 150k semantics.
- [ ] Confirm remote verify/Pages on the **final** main commit and repeat the
  release/package-content review before any tag. The implementation commit
  `dc32c879` passed both GitLab jobs; a project-state-only follow-up needs
  its own pipeline. The repository's tag pipeline
  automatically publishes to npm; conditional tag consideration does not
  separately authorize that publication. Obtain explicit release/publication
  instruction before pushing a v8.0.0 tag.

## Local deterministic gate

```sh
npm run typecheck
npm run style
npm run source:budget
npm test
npm run test:coverage
make verify
make site
npm pack --dry-run --json
git diff --check
```
