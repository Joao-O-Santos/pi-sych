# Opt-in usage evaluations

These tests exercise real Pi and model behavior. They are not part of
`npm test`, may use configured credentials, may incur provider cost, and
can vary by model or run. The short acceptance fixtures isolate their
temporary agent directories and copy only the configured OpenAI Codex
auth entry when present. The separately gated workhorse soak copies
native auth/model configuration privately, as described below.

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

## Separately opted-in automatic-compaction soak

Explicitly run the paid short soak from the repository root:

``` sh
PI_SYCH_COMPACTION_SOAK=1 node --test tests/usage/compaction-soak.test.mjs
```

It is skipped by default, including ordinary `PI_SYCH_USAGE_TEST=1`
runs. It reads the private `workhorse` role from the configured Pi Sych
`worker-models.json`, copies Pi auth and model configuration into a
private temporary agent directory, and launches an isolated Pi with the
workbench and an observer extension. User settings are not modified. The
model must be available to native Pi; environment-based provider
credentials are inherited. This is not a sandbox. Only read/write tool
calls within the temporary workspace are permitted by the test observer;
no remote research or subdelegation is requested.

The workload reads generated corpus files and writes batch notes over
separate settled turns; it does not inject transcripts or call compact
manually. The separate gate can incur substantial provider cost.
Defaults are threshold 32,000 tokens, target three custom successes, at
most eight batches and 480 seconds. Optional bounded integer environment
variables are `PI_SYCH_SOAK_THRESHOLD` (1,000--50,000),
`PI_SYCH_SOAK_TARGET` (2--3), `PI_SYCH_SOAK_BATCHES` (2--8), and
`PI_SYCH_SOAK_SECONDS` (30--480). The test requires at least two custom
successes and observed read/write work after one; it can finish below
the target when the batch limit is reached.

A private JSON report survives cleanup at the printed
`/tmp/pi-sych-compaction-soak-*.json` path, or at a new path supplied by
`PI_SYCH_SOAK_REPORT` (existing files are not overwritten). It records
per-attempt native hook timing and outcome, settled usage, batch
progress and observable session usage/cost. A native fallback is not a
custom success: swallowed custom failures cannot always be separated
from other fallbacks, and Pi may omit custom-call usage. Cost fields are
pricing estimates when not provider-reported charges. The report also
includes summary-length and lexical anchor diagnostics, which are not
semantic-retention judgments. Proactive admission uses Pi's manual
request path, so attempt reason may be `manual` even though the test
sends no compact commands. Provider errors and prompts are deliberately
not captured. Timeout kills the child process group; temporary
credentials and workspace are removed. Forced termination of the test
runner itself cannot guarantee cleanup.

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
