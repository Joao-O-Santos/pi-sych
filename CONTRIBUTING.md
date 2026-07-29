# Contributing

Pi Sych is alpha software. It was developed with substantial AI assistance; review every proposed change rather than assuming generated code or prose is correct.

## Development

- Work directly on `main` unless isolation is genuinely needed.
- Keep each change focused, reviewable, and truthful about what was checked.
- Do not add credentials, personal configuration, generated runtime state, or unverified claims.
- Follow existing repository conventions. Do not push, alter remotes, rewrite shared history, or delete branches without explicit authorization.

Before committing, run:

```sh
npm run typecheck
npm run test:deps
npm test
npm run smoke
npm pack --dry-run
git diff --check
```

Pi extensions and skills run with the local user’s permissions. They are not a sandbox. See Pi’s [security](https://pi.dev/docs/latest/security) and [containerization](https://pi.dev/docs/latest/containerization) documentation when isolation is needed.

## Releases

1. Verify the package version and release notes by hand.
2. Ensure GitLab has a protected `v*` tag rule.
3. For the first publish of an unclaimed package, create a short-lived granular npm publish token and add it as GitLab’s protected, masked `NPM_TOKEN` CI/CD variable. Do not put it in a repository file, shell history, or chat.
4. Create an annotated tag whose name exactly matches `v` plus `package.json`’s version, then push it to GitLab.
5. After the first publish, configure npm’s **Trusted Publisher** for GitLab CI/CD: namespace `Joao-O-Santos`, project `pi-sych`, CI file `.gitlab-ci.yml`; delete `NPM_TOKEN`.

The GitLab tag pipeline reruns the checks and publishes with npm provenance. It uses the temporary GitLab token only when supplied for the first package claim; later tags use GitLab OIDC trusted publishing. Do not create a release tag until its required authentication configuration is complete.
