# Full-context compaction verification

## Local checks

- `make verify`: 271/271 tests; 97.89% line, 93.05% branch and 96.71%
  function coverage. Type/style, package dry-run, whitespace and source
  budget passed; runtime source is about 3,250/3,400 nonblank lines.
- `make site` passed; `npm audit --omit=dev` found zero vulnerabilities.
- Independent regression design and read-only correctness review found
  no remaining blocker. An implementation worker timed out with partial
  edits; the supervisor inspected/completed integration and verification.
- The soak skips without its separate gate, including when ordinary
  `PI_SYCH_USAGE_TEST=1` is enabled. No CI configuration changed.

## One short soak

Command: `PI_SYCH_COMPACTION_SOAK=1 node --test tests/usage/compaction-soak.test.mjs`,
with `PI_SYCH_SOAK_REPORT=/tmp/pi-sych-full-context-soak.json` to retain
the local diagnostic report at that path.

On 2026-11-14, the configured workhorse completed six real synthetic-data
batches (18 reads, six note writes) in 105.091 seconds
with a 32,000-token threshold. Three automatic custom compactions
succeeded, with zero observed custom failure notices, native fallbacks,
failed/cancelled/incomplete attempts. Durations: 15.398, 11.247 and 9.329
seconds; mean 11.991, total 35.974 seconds. Settled input was
43,598–44,360 tokens at admission; subsequent batches continued after
previous compactions. Proactive admission uses Pi's manual request path:
`reason: manual` here does not mean a compact command was sent.

All three summaries mentioned both survey labels; the weak literal
`audit` diagnostic matched only the first. Neither lexical diagnostic
proves semantic task retention or loss. Summaries are not retained in
the report. Session stats estimated $0.0333819, not a verified provider
charge. This short model/run checks repeated operation, timing and
continued tool work, not long-duration reliability or lossless memory.
Temporary workspace/credentials were removed. The soak did not change
global settings, repository instructions, the repository inbox or
publication state.
