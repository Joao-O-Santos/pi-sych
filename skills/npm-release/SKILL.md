---
name: npm-release
description: Prepare and verify a public npm package release with explicit version, tarball, provenance, and post-publish checks.
---

# npm release

## Before the tag

- Confirm that `package.json` has the intended SemVer version and that the proposed annotated tag is exactly `v` plus that version.
- Run the repository’s documented checks. Inspect `npm pack --dry-run` or its JSON output; publish only intended runtime files, public documentation, and licenses.
- Check npm package availability or the published version directly. Do not assume an npm name is reserved because it appears in a local manifest.
- Keep tokens, recovery codes, OTPs, and credentials out of repository files, shell history, logs, and chat.

## GitLab trusted publishing

- Configure npm Trusted Publisher with the exact GitLab namespace, project name, and root CI file path before relying on a tag pipeline.
- Protect release tags in GitLab. The release job must check that the tag and package version match, rerun meaningful checks, and use OIDC provenance publishing.
- A pipeline starting is not evidence of publication. Inspect its actual terminal result and npm’s public package metadata.

## After publication

- Verify the exact published `name@version`, tarball contents, provenance information when available, and the tagged commit.
- Record failed checks and unresolved upstream advisories accurately. Do not silently republish, retag, or overwrite a version; npm versions are immutable.

## Use with

Use `git-workflow` for signed commits and tags, `verify-change` for the release gate, and `software-project` for the implementation boundary before publication.

## Private examples

If `~/.config/pi/skills/npm-release/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
