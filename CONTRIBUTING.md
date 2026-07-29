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
3. For the first publish of an unclaimed package, manually publish the verified package from an authenticated local checkout. Do not use a release tag until that publish succeeds.
4. Configure npm’s **Trusted Publisher** for GitLab CI/CD: namespace `Joao-O-Santos`, project `pi-sych`, CI file `.gitlab-ci.yml`.
5. Create an annotated tag whose name exactly matches `v` plus `package.json`’s version, then push it to GitLab.

The GitLab tag pipeline reruns the checks and publishes new matching versions with npm provenance through GitLab OIDC. For the first manually published version, it recognizes the existing exact version and succeeds without republishing it. No npm token is stored in this repository or required as a GitLab CI/CD variable.
