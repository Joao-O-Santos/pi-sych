# Release 8.2.0

## Scope

Publish the verified compaction improvements as a backward-compatible
minor release. Optional memory fields and material improvements to
supported compaction justify minor under the public contract; no
configuration/stored-state migration or canonical-write policy change.
The opt-in soak remains excluded from CI.

## Sequence

1. Push the two existing focused implementation commits; wait for main CI.
2. Prepare one release-metadata commit: version/lock, image references,
   changelog rationale and truthful project/evidence state.
3. Run repository checks, push and wait for that exact commit's CI.
4. Push signed `v8.2.0` only after success; inspect tag publication CI.
5. Verify registry version/latest/gitHead, tarball contents/integrity and
   provenance metadata; record the observed result.

Do not rewrite published history or include the unreviewed `INBOX.md`.
Coverage dipped slightly in lines/functions despite all tests passing;
retain actual measurements rather than claiming no regression.
