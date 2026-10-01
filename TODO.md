# v8.0.0 release readiness

The v8 implementation is on `main`; this file tracks the remaining release
preparation, exact-revision checks, and limitations. The migration, public
contract, architecture, and changelog documents describe the implemented
behavior. This is not authorization to tag or publish.

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
  packed-install tests with and without optional Plannotator. Fixed the worker
  `--tools` allowlist interaction that hid native MCP tools from codemode; a
  live Pi Sych dispatches from both the worktree and installed `2afd06d`
  package successfully resolved React through Context7. Added opt-in,
  one-shot completion reassessment at Pi's `agent_before_settle` boundary;
  it defaults off and is separate from compaction.
- Fixed inherited worker pipes with a ten-second cleanup grace and POSIX
  group termination, added exclusive acknowledgement transaction locks,
  and enforced the Pi 0.99.2 coding-agent peer minimum. Hardlink inbox
  handling remains unchanged by owner choice.
- Baseline v7.0.1 runtime: 3170 nonblank lines; current v8 preparation: about
  3200 (within budget). Current coverage: 97.85% lines, 92.27% branches,
  96.80% functions, all above the baseline of 97.48/90.23/95.31.

## Release gates

- [ ] Apply the documented image-edit prompt in `docs/img/readme.md` to
  `docs/img/architecture.png`; inspect the rendered labels and commit the
  reviewed asset. The other explanatory images were checked and have no
  known v8-specific correction pending.
- [ ] On the final documentation/image revision, rerun `make verify` and
  `make site`, confirm the exact-HEAD GitLab pipeline passes, and inspect
  `npm pack --dry-run --json` contents plus a packed-install check.
- [ ] After those gates, obtain explicit authorization for a signed release
  commit/tag. The matching GitLab tag pipeline publishes `v8.0.0` to npm;
  tag creation therefore has that external publication effect.

## Verified on current main

- [x] At `53251ee7502760cfde8bdaa1bbda3294e3667452`, local `make verify`
  passed 216 tests and package dry-run; `make site` passed; production audit
  reported zero vulnerabilities. GitLab pipeline `2904692244` passed both
  `verify` and `pages` for that exact revision (coverage 97.85%).
- [x] Directly exercise, then independently repeat through a workhorse
  worker, each MCP configured in both agent directories: Context7, OpenAlex,
  Parallel, and Scholar Gateway. All calls succeeded in the tested sessions;
  Scholar Gateway's usage endpoint reported access. This does not establish
  persistent credentials or general query access. Exa was not configured as
  an MCP; its cache was used separately for one documentation fetch.
- [x] Run the opt-in real-model Pi workflow on a disposable project and check
  the installed v8 package with a live `project_status` call. The deterministic
  MCP fixture tests transport/composition without a model.

## Nonblocking limitations and design options

- Model recognition of every unfinished authorized task is semantic behavior;
  neither the prompt test nor the opt-in model run guarantees it.
- Exa worker-MCP behavior was not tested because Exa is not configured as a
  worker MCP; this is not a configured-service failure.
- Custom compaction remains in the workbench. Splitting it into a separately
  loadable resource is an optional architectural change, not a v8 release gate.

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
