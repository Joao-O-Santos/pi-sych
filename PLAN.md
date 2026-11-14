# Richer compaction continuity — completed

## Scope and execution

The supervisor pre-walked lifecycle, serialization, model limits, native
Pi docs, canonical roles and tests; added optional memory fields and
independent regression fixtures; then delegated implementation to a
workhorse/high-thinking worker with trajectory context. Supervisor
integration and independent read-only reviews corrected small-model
allocation, prior-summary clipping and protected error retention.

## Implemented

- Optional single-line `userPreferences` and `toolLessons` arrays;
  explicit/inferred/prior attribution, evidence, scope, supersession,
  scoped praise, observed repair and applicability limits.
- 192 KiB conversation and 64 KiB prior-memory ceilings; up to 16,384
  output tokens, reduced by active-model output/context limits. Shared
  input allocation reserves instructions and framing before data.
- Earliest request plus chronological per-turn prefixes/sampling,
  protected errors before adjacent context, and priority-aware previous
  summary excerpts. No hidden thinking, unseen chat retrieval, direct
  instruction edits, or changes to settled/native lifecycle.
- Existing unreviewed project/agents/personal-agents proposals; ambiguous
  durable scope remains unresolved. Source budget explicitly increased
  by 100 lines to 3,400 for bounded selection and allocation mechanics.

## Evidence and limits

`make verify`: 265 tests, 98.01/92.91/97.08% line/branch/function coverage,
packaging and source budget passed. Site and production audit passed.
Final opt-in live-model acceptance passed; failure/remedy history is
seeded, so this checks extraction, not actual tool execution. Independent
review found no remaining blocker. Bounded clipping/sampling and semantic
retention remain limitations. No push, release or inbox review performed.
