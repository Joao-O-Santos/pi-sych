# npm

Before a release, check intended `package.json` SemVer and annotated tag exactly `v` plus that version, documented project checks, package availability, and `npm pack --dry-run` (or JSON) contents: only intended runtime files, public documentation, and licenses. Keep tokens, recovery codes, OTPs, and credentials out of files, logs, shell history, and chat. For GitLab trusted publishing, configure the exact namespace, project, and root CI path; protect release tags; require tag/package-version matching, meaningful rerun checks, and OIDC provenance publishing. A started pipeline is not publication.

After publication verify exact `name@version`, tarball contents, provenance when available, and tagged commit. Record failed checks and advisories accurately. Do not republish, retag, or overwrite immutable versions without explicit instruction.
