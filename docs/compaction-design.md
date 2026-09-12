# Settled-turn compaction design

This document specifies the target v7 continuity behavior. The current runtime
still uses the earlier pre-turn threshold compaction implementation.

Compaction is continuity maintenance, not project governance. It may summarize
observable conversation, material tool outcomes, and bounded canonical project
state. It must not claim hidden chain-of-thought recovery or silently promote
model inference into accepted project state.

## Lifecycle first

Establish a reliable settled-turn boundary before changing the memory schema.
Compaction should not omit an in-flight tool result, race a queued user
follow-up, or run concurrently with another compaction pass.

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

Keep facts, user decisions, model inference, unresolved possibilities, and failed
attempts distinguishable. Do not turn inferred rationale into a user statement.

Do not preserve private chain-of-thought, hidden scratch reasoning, complete
conversation replay, low-value narration, repeated confirmations, or superseded
wording once its material outcome is captured.

## Project-state reconciliation

Compaction may inspect a bounded set of relevant canonical files. Distinguish
conversation state already represented durably, durable state that changed,
conversation decisions missing from durable state, conflicts with accepted
state, and proposals not yet accepted.

Missing durable state is a finding, not automatic permission to edit canonical
semantic files. If bounded proposal persistence to `INBOX.md` is retained,
proposals must remain visibly unreviewed and must not accumulate into a shadow
project history.

## Suggested continuation shape

The serialization can change, but a compact representation may contain:

``` text
objective:
authorization:
constraints:
progress:
decisions:
failed_or_rejected:
unresolved:
active_work:
next_action:
files:
project_state_gaps:
```

Fields may be omitted when empty. Boundedness should come from useful selection
rules rather than prompt word-count budgets.

## Required regressions

Test settled-boundary execution, duplicate/reentrant triggers, queued follow-up
preservation, explicit decisions versus inference, visible rationale without
invented hidden reasoning, rejected-path continuity, project-state gap
classification, canonical non-mutation, bounded unreviewed proposals if
retained, malformed output/failure fallback, and successful resumption of the
actual next action.

Live-model fixtures can then evaluate decision loss, reintroduction of rejected
ideas, unsupported claims, failure to continue authorized work, and treatment of
unresolved alternatives. Those results are behavioral evidence, not
deterministic CI contracts.
