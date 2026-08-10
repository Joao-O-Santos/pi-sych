# Opt-in usage evaluations

These tests exercise real Pi and model behavior. They are not part of
`npm test`, may use configured credentials, may incur provider cost, and
can vary by model or run.

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

A passing evaluation is evidence from that model and run. It is not a
deterministic contract, proof of general adherence, or substitute for
human review of skill guidance.

## Benchmark pilot

The separate synthetic benchmark cases live under `tests/benchmarks/`.
Live execution requires an explicit private selector configuration path:
`node scripts/benchmark.mjs /absolute/path/to/benchmark.json`. Candidate
and judge models are recorded in local result bundles and must differ
unless explicitly overridden. `benchmark-results/` and `coverage-v8/`
are ignored. Run deterministic harness checks with `npm run test:unit`
and collect the threshold-free V8 diagnostic baseline with
`npm run test:coverage`.
