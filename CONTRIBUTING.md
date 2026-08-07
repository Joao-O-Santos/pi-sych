# Contributing

Pi Sych is alpha software and was developed with substantial AI
assistance. That makes review more important, not less: inspect the
source, tests, package contents, and claims in every proposed change.

## Issues

A useful issue answers four questions:

1.  What were you trying to do?
2.  What did you expect?
3.  What happened instead, including the command or human command used?
4.  What environment, package version, and reproducible evidence can you
    share?

For a status or synchronization problem, include the relevant sanitized
`PROJECT.md`/`SYNC.json` shape and distinguish changed content from your
interpretation of that change. Never attach credentials, provider
tokens, private model catalogs, or sensitive project material.

## Pull requests

Work directly on `main` only when that is the established local
convention; otherwise use a focused branch. Keep each PR reviewable and
truthful about what was checked. Explain the user-facing behavior, the
mechanical invariant, the regression test, and any known limitations.

Before requesting review, identify the affected row in the [public
contract](docs/public-contract.md), whether an existing documented use
needs migration, and the justified SemVer level. Then run:

``` sh
make verify
```

Use deterministic temporary fixtures for process and filesystem tests.
Use live model tests only when they add evidence that deterministic
tests cannot provide, and report their cost and limitations. Do not
alter remotes, rewrite shared history, delete branches, or publish from
a contributor change without explicit authorization.

## Documentation contributions

Write general documentation for users: begin with the task they want to
complete, state prerequisites, and show a small working example. Write
supervisor-facing sections for model-visible contracts, boundaries, and
failure handling. Write developer documentation for contributors other
than the owner: explain the reasoning needed to file issues, make PRs,
run checks, and understand limits.

Prefer accessible headings, meaningful link text, short paragraphs,
concrete commands, and plain language. Be engaging enough to make the
risk boundary memorable, but never use confidence or drama to conceal an
unverified claim.

## Releases

Most contributions do not need release work. When a maintainer requests
one, apply the [public-contract release
rules](docs/public-contract.md#releases-and-migration), prepare a
focused changelog entry, verify the next patch version from Git tags and
package metadata rather than trusting a stale document, and run the
complete documented gate. Inspect `npm pack --dry-run` so the package
contains only intended public files.

Maintainers create the signed release commit and annotated `v<version>`
tag after explicit authorization. The GitLab tag pipeline reruns checks
and publishes the matching npm version with provenance through the
project's configured credentials. Contributors do not need an npm token
or publish directly.
