# Follow-up implementation note

`FOLLOW_UP.md` targets roughly 205--295 new production TypeScript lines
while the completed v2.0.0 core is already about 1,850/2,000 lines. A
working compaction boundary therefore cannot both meet that stated target
and the inherited 2,000-line estimate. I will keep the implementation
small and reviewable, retain the existing source-budget check, and record
any necessary limit adjustment for owner review rather than silently
claiming the old threshold still fits.
