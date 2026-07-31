# Contributing

Pi Sych is alpha software. It was developed with substantial AI
assistance; review every proposed change rather than assuming generated
code or prose is correct.

## Development

- Work directly on `main` unless isolation is genuinely needed.
- Keep each change focused, reviewable, and truthful about what was
  checked. For substantive behavior changes, obtain independent test
  design before implementation and independent read-only review after
  it.
- Do not add credentials, personal configuration, generated runtime
  state, or unverified claims.
- Follow existing repository conventions. Do not push, alter remotes,
  rewrite shared history, or delete branches without explicit
  authorization.

Before committing, run:

``` sh
npm run typecheck
npm run style
npm run test:deps
npm test
npm run smoke
npm pack --dry-run
git diff --check
```

Pi extensions and skills run with the local user's permissions. They are
not a sandbox. Keep long or consequential plans in project-local
Markdown and wait for browser or file review before implementation. See
Pi's [security](https://pi.dev/docs/latest/security) and
[containerization](https://pi.dev/docs/latest/containerization)
documentation when isolation is needed.

## Releases

Most contributions do not need release work. When a maintainer requests
a release, prepare a focused changelog entry, confirm the intended
version, run the documented checks, and inspect `npm pack --dry-run` so
the package contains only intended public files.

Maintainers create the signed release commit and annotated `v<version>`
tag after explicit authorization. The configured GitLab tag pipeline
reruns the release checks and publishes a new matching npm version with
provenance. Contributors do not need an npm token or access to
publishing credentials.
