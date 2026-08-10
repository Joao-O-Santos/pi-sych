# Evidence

## E-038 --- v6.1.3 provenance and release hygiene gate

**Status:** verified **Kind:** historical provenance, source metric,
schema contract, release automation, package contents, and independent
test design **Source:** signed v6.0.9/v6.0.10 diffs, current source and
tests, GitLab CI lint, local full gate, Pages build, and package dry run
**Supports:** v6.1.3 patch readiness. **Evidence:** changelog and E-034
now attribute working scalar-array normalization to v6.0.10; the source
budget counts 2,074 nonblank physical runtime lines (2,100 rounded), and
blank declaration spacing was restored without consuming budget;
`literature_search` declares `query` with `minLength: 1`; the npm
release job checks both the exact published version and
`dist-tags.latest` with 12 bounded attempts. Focused metric, schema, and
CI-source contract tests passed. The full gate passed with 127 unit and
12 integration tests, typecheck, style, dependency validation, coverage
of 98.30% lines, 91.55% branches, and 94.44% functions, package dry run,
Pages build, and whitespace checks. GitLab CI lint accepted the pipeline
with no warning. Package and lockfile are 6.1.3. **Limits:** registry
retry behavior is verified structurally rather than against a disposable
npm publication; the actual registry and `latest` checks run only after
trusted publication. The previously reported dependency advisories
remain unremediated, and the blocked node-pty install script remains
unapproved. No v6.1.3 commit, push, tag, or publication has occurred.
**Checked:** 2026-08-10
