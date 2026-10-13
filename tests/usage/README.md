# Opt-in usage evaluations

These tests exercise real Pi and model behavior. They are not part of
`npm test`, may use configured credentials, may incur provider cost, and
can vary by model or run. The real-Pi fixture isolates its temporary
agent directory and copies only the configured OpenAI Codex auth entry
when present; the directory is removed after the run.

`prompt-quality.test.mjs` reads the scenarios in
`tests/fixtures/prompt-quality-fixtures.json`. Each fixture identifies a
packaged guidance file, a decision rule, and required and prohibited
response properties. The evaluator:

1.  validates the fixture only after the opt-in test is enabled;
2.  injects the target guidance and scenario into a real model prompt;
3.  collects the response; and
4.  asks a second model pass to judge the response against the stated
    properties.

Run explicitly with:

``` sh
PI_SYCH_USAGE_TEST=1 npm run test:usage
```

`worker-instructions.test.mjs` starts a disposable Pi project,
supervisor session, and isolated agent directory. A real supervisor must
call `dispatch_worker` exactly once with the launch guidance in the
inline `workerInstructions` argument; the live worker must return both
the marker required by that launch-scoped override and the separate
marker required by the project's `AGENTS.md`. The test checks the
persisted tool-call arguments, verifies project `AGENTS.md` remains
byte-for-byte unchanged, and compares all shared worker-agent files
before and after dispatch. It uses a 90-second worker deadline and
150-second supervisor bound, reports stdout/stderr and credential/model
recovery guidance on failure, and removes the disposable
project/session/agent directories. As with the other live tests, it
copies only the configured OpenAI Codex auth entry when available.

`custom-compaction.test.mjs` starts a disposable Pi project and isolated
agent directory, sets the proactive threshold to one token, and lowers
Pi's `compaction.keepRecentTokens` to one in that isolated agent
settings file. This is necessary because Pi otherwise retains 20,000
tokens and rejects a tiny fixture as
`Nothing to compact (session too small)` before the custom hook runs. It
uses RPC mode and waits for the compaction outcome before stopping Pi,
so the process does not shut down while the settled-boundary compaction
is still running. Within a three-minute bound, the test distinguishes
the proactive attempt, too-small rejection, completion event, persisted
extension (`fromHook`) summary, and proposal inbox output. It also
checks canonical project state was not changed. The test copies the
configured OpenAI Codex auth entry when available; it may incur model
cost. Diagnostics include Pi stdout/stderr and the disposable session is
removed after the run.

A passing evaluation is evidence from that model and run. It is not a
deterministic contract, proof of general adherence, or substitute for
human review of skill guidance or compaction quality.

## Benchmark pilot

The separate synthetic benchmark cases live under `tests/benchmarks/`.
Live execution requires an explicit private selector configuration path:
`node scripts/benchmark.mjs /absolute/path/to/benchmark.json`. Candidate
and judge models are recorded in local result bundles and must differ
unless explicitly overridden. `benchmark-results/` and `coverage-v8/`
are ignored. Run deterministic harness checks with `npm run test:unit`
and collect the threshold-free V8 diagnostic baseline with
`npm run test:coverage`.
