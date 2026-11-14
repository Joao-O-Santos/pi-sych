# Full-visible-context compaction — completed

## Delivered

- Complete available chronological user/assistant text, tool calls and
  arguments, prior summary, split prefix and native projected retained
  tail. No transcript/prior-summary/message byte caps or turn sampling.
- Native token estimates and active context/output capacity govern
  fitting. Optional snapshots yield first, then necessary bulky tool
  outputs receive explicit prefix/tail excerpts. Narrative/arguments
  never silently clip; oversized backbones take native fallback.
- Working-memory length/count quotas removed, with schema/provenance,
  bounded external reads, inbox-only proposal safety and native
  lifecycle preserved. Output reservation yields to fitting backbone;
  actual output uses model capacity and remaining context.
- Separately gated workhorse short soak: real settled read/write batches,
  <=50k trigger, bounded runtime/work and persistent local diagnostics.
  No CI execution or global settings changes.

## Verification

Independent test design and read-only review; 271 passing repository
tests, packaging, source budget, site and production audit. One requested
soak completed six batches and three custom automatic compactions with
zero observed failures/fallbacks. See `EVIDENCE.md` for exact outcomes,
report path and limits.

Native token estimates are not provider counts; necessary payload
reduction can lose evidence. The short soak measures repeated operation,
not general semantic retention or long-duration reliability. Native
fallback uses Pi's own policy. No inbox review, push or release.
