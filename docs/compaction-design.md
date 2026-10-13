# Settled-turn compaction design

This document records the implemented v8 continuity behavior. Custom
compaction is supplied for configured manual/native compaction requests
when enabled. Proactive admission occurs at `agent_settled` when context
usage reaches the configured threshold (150,000 tokens by default), the
context window can reach it, the agent is idle, no messages are pending,
and no compaction is already in flight.

Compaction is continuity maintenance, not project governance. It may
summarize observable conversation, material tool outcomes, and bounded
canonical project state. It must not claim hidden chain-of-thought
recovery or silently promote model inference into accepted project
state.

## Lifecycle first

The settled-turn boundary prevents omission of an in-flight tool result,
racing a queued user follow-up, or concurrent compaction. Reentrancy is
blocked until completion or error resets the in-flight guard. Native Pi
may compact earlier under its own context safety rules; when custom
compaction is enabled, the `session_before_compact` hook supplies Pi Sych's
summary for those requests too. If custom compaction is disabled or
returns no usable result, native behavior remains in control.

The proactive threshold is a Pi Sych context-token threshold, independent
of Pi reserve-token settings. If the model context window is below it,
Pi Sych does not create an impossible trigger or interfere with native
safety compaction.

The implementation must inspect Pi's actual lifecycle and answer:

1. What event proves assistant/tool activity for the turn is settled?
2. Can a user message arrive while compaction is starting or running?
3. What state must be captured atomically to preserve queued follow-ups?
4. How is reentrancy prevented?
5. What deterministic fallback is used if custom compaction fails?

## Observable trajectory

Preserve only information that materially constrains continuation:

- objective and requested outcome;
- authorization boundary and constraints;
- material progress and tool outcomes;
- accepted decisions and visible rationale when stated;
- failed or rejected approaches that constrain future work;
- unresolved alternatives, ambiguities, and questions;
- current work and next action;
- relevant files, artifacts, branches, or external resources; and
- important project-state gaps or conflicts.

Keep facts, user decisions, model inference, unresolved possibilities,
and failed attempts distinguishable. Do not turn inferred rationale into
a user statement.

Do not preserve private chain-of-thought, hidden scratch reasoning,
complete conversation replay, low-value narration, repeated
confirmations, or superseded wording once its material outcome is
captured.

## Project-state reconciliation

Compaction may inspect a bounded set of relevant canonical files.
Distinguish conversation state already represented durably, durable
state that changed, conversation decisions missing from durable state,
conflicts with accepted state, and proposals not yet accepted.

Missing durable state is a finding, not automatic permission to edit
canonical semantic files. The implementation never mutates canonical
semantic files. Status input is capped at 8 KiB and retains bounded
diagnostics for missing core files and dependency cycles even when other
status fields must be omitted. It may append only bounded, one-line,
visibly unreviewed proposals to the configured inbox. The inbox is
created only when a valid compaction result contains one or more
proposals; successful compaction without proposals does not create an
empty `INBOX.md`. Model output may encode `promotions` as an array of at
most five `{target, proposal}` objects, with an allowed canonical role
target and one-line proposal text. A malformed promotions container is
treated as no proposals; invalid items are skipped independently, and
only the first five candidates are considered. Proposal writes remain
confined to the configured inbox after alias checks; an unsafe destination
or inbox write failure skips proposals without discarding otherwise usable
memory. Cancellation is checked after asynchronous inbox safety and
directory operations and immediately before append, so an abort during
those waits cannot write a proposal. If the existing inbox cannot be
counted, the completion notice reports the count as unavailable rather
than zero. Omitted or malformed
optional memory arrays become empty; invalid members are skipped
independently so valid siblings survive. Promotion targets and gap kinds
require exact allow-list membership; partial labels are rejected. Decision
provenance and gap kinds remain allow-listed; provenance is never inferred
or repaired. The required objective and next action must still be
usable. A JSON object may be extracted from surrounding prose or Markdown
fences, but malformed JSON or a missing/unusable
required summary falls back to Pi's native summary. Cancellation and
model failures also leave native fallback in control. Manual failure
notifications are best-effort and do not prevent native fallback if the
UI itself fails.

## Suggested continuation shape

The implemented serialization contains the following bounded fields:

```text
objective:
authorization:
constraints:
progress:
decisions:
inferences:
failedOrRejected:
unresolved:
activeWork:
nextAction:
files:
projectStateGaps:
```

`objective` and `nextAction` must be non-empty strings; omitted or
malformed optional array fields normalize to empty arrays, and invalid
members are skipped independently. Decision records retain only explicitly
allow-listed provenance labels; invalid entries are omitted, never
reclassified. Boundedness comes from bounded source reads, item, message,
status, retained-tail, snapshot, and proposal limits
rather than prompt word-count budgets. The nonblank runtime source budget
is 3,250 lines; the checker reports a 50-line-rounded estimate. UTF-8
snapshots are decoded and
then byte-bounded, including malformed source text; serialized snapshots
and optional focus instructions also have explicit prompt-byte limits.
Observable messages and the retained tail exclude hidden thinking. Recorded label attributions are
carried forward without verification; inferences remain distinct.

## Required regressions

Test settled-boundary execution, duplicate/reentrant triggers, queued
follow-up preservation, explicit decisions versus inference, visible
rationale without invented hidden reasoning, rejected-path continuity,
project-state gap classification, canonical non-mutation, bounded
unreviewed proposals if retained, malformed output/failure fallback, and
successful resumption of the actual next action.

Live-model fixtures can then evaluate decision loss, reintroduction of
rejected ideas, unsupported claims, failure to continue authorized work,
and treatment of unresolved alternatives. Those results are behavioral
evidence, not deterministic CI contracts.
