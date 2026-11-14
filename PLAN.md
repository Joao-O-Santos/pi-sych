# Release 8.2.0 — completed

Pushed the two existing focused implementation commits, then the
verified release-metadata commit. Both main pipelines passed before
signed `v8.2.0`; the tag pipeline passed verification and npm publication.

Minor is justified by material supported-use improvements and optional
backward-compatible memory fields. No configuration/stored-state
migration or canonical-write policy change; soak remains outside CI.

Registry version/latest/gitHead, all 214 file contents, tarball integrity
and provenance source/digest/tag/pipeline metadata match the release.
Tag signature verifies; attestation signatures were not independently
validated. See `EVIDENCE.md` for exact revisions, pipelines and limits.

Coverage dipped slightly in lines/functions while branches improved;
all 271 local tests passed. No inbox review, history rewrite, retagging
or republishing. Existing broader documentation-review flags remain.
