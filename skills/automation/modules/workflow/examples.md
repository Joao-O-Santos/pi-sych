# Workflow examples

Bad:

> Build a new orchestration service to rename files, extract two fields, and
> upload the result.

Better:

> Reuse the existing local parser for extraction, perform the rename and table
> transform deterministically, verify counts and output paths, then keep the
> remote upload as the one separately approved side effect.

Why: composition is smaller, easier to inspect, and exposes less data to model
judgment.
