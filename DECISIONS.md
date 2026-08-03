# Decisions

## Pending owner review

### D-001 --- Preserve supplied documentation images

**Status:** proposed for owner confirmation

The current task does not alter image pixels.
`docs/img/review_workflow.png` keeps the filename and bytes supplied by
the owner, and documentation links to that file. Image wording and
legibility issues are recorded in `~/prompts.md` for a later
image-capable workflow. Text documentation and runtime behavior remain
authoritative.

### D-002 --- Retain the OpenCode history sentence

**Status:** proposed for owner confirmation

The README retains "my move from OpenCode to Pi" because that wording
was provided in the approved README plan. Repository history does not
independently establish the personal-history detail. The owner should
confirm or replace the product name during the next prose review.

### D-003 --- Do not add a video link before a recording exists

**Status:** accepted by the current plan

No `VIDEO_DEMO.md` or video link is added. A walkthrough belongs in the
README only after a real recording and destination exist.
