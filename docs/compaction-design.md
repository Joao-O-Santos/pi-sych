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

- active task objective, requested outcome, and completion conditions;
- authorization boundary and constraints;
- material progress and tool outcomes;
- accepted decisions and visible rationale when stated;
- failed or rejected approaches that constrain future work;
- unresolved alternatives, ambiguities, and questions;
- current work and next action;
- relevant files, artifacts, branches, or external resources; and
- important project-state gaps or conflicts.

The continuation is short-term working memory for the active user task,
not a summary of the project's overall objective. Preserve the unfinished
task across compaction, while using later visible user direction or
completion evidence to update it. A recent subtask or tool check does not
replace the goal. Retain the resume point, remaining steps, blockers, and
a concrete next action; a settled turn or compaction does not by itself
mean the task is complete.

Keep facts, user decisions, model inference, unresolved possibilities,
and failed attempts distinguishable. `inferences` may hold concise
working assumptions, the current approach, and high-level rationale
grounded in visible evidence. These remain tentative, not user decisions
or recovered private reasoning. Do not turn inferred rationale into a
user statement.

The compactor receives the complete available active visible text:
all user messages, assistant replies and tool calls/arguments, in order,
including the split-turn prefix and retained recent tail. Previous
summary and manual focus text are supplied in full. There is no fixed
conversation, prior-summary, message or content-part byte/count ceiling,
no request sampling, and no duplicated protected excerpts. The retained
tail uses Pi's native projection, including context-edit replacements,
omissions, custom messages and branch summaries; raw omitted attempts
must not reappear. Older compacted-away text is available only through
its previous summary, not recovered verbatim. Thinking is excluded;
images are explicitly marked as omitted from text serialization.

Input fitting uses Pi's exported `estimateTokens` on the actual serialized
prompt, plus 1,024 tokens of framing headroom. This is a chars/4
heuristic, not provider tokenizer accounting or a universal conservative
bound, especially for multilingual/code-heavy content. Provider overflow
or other model failure leaves native fallback in control.

Full fitting tool output is retained. Optional canonical snapshot
contents yield first, then the largest tool/shell output payloads are
reduced only as required. Reduction retains prefix/tail excerpts and an
explicit middle-omission marker; call identities, arguments, result
error flags, shell commands and narrative are not clipped. Reduced
output can lose useful evidence, so a marked excerpt is not evidence
that the missing middle was unimportant. If the complete backbone still
cannot fit, custom compaction explicitly falls back rather than silently
sampling conversation turns or making additional model calls.

Output reservation targets the smaller of the model's output capacity
and one quarter of its context window, but yields to the capacity left
after the complete minimal backbone and framing. This reservation is
not an output cap. The actual output allowance is the smaller of the
model's output capacity and the context remaining after estimated final
input plus framing. There is no fixed 16,384-token ceiling, output byte
ceiling, or working-memory item/text-length quota. Limits are ceilings,
not requested summary lengths. Unknown/unusable model limits or a missing native projection API take
native fallback; an incomplete/non-stop response is never persisted as a
successful custom continuation.

These policies apply to manual, native automatic and proactive requests.
Proactive admission uses Pi's manual request path, so an event reason of
`manual` alone does not establish that the user requested compaction.
On custom failure Pi uses its own serializer and summarizer: the
custom request's no-turn-sampling policy does not constrain that native
fallback.

Working memory includes `userPreferences` and `toolLessons`. Preferences
capture repeated user corrections, frustrations, and positive feedback
with their evidence and explicit/inferred status; repeated summary copies
are not independent evidence, later corrections supersede earlier ones,
and praise is scoped to what was praised. Project/personal scope remains
unknown unless visible evidence establishes it. Tool lessons retain
failure, observed repair/outcome, and applicability limits; an untested
suggestion is not a demonstrated fix. Both are arrays of single-line strings carrying evidence, scope and
uncertainty, not objects or private reasoning. Prior summaries are
records, not fresh user feedback; compaction cannot retrieve unseen
interactions. Earlier requests may be completed or superseded;
the model must interpret them rather than automatically revive them.

The continuation output is not a transcript replay. Do not preserve
private chain-of-thought, hidden scratch reasoning, low-value narration,
repeated confirmations, or superseded wording once its material outcome
is captured. Full visible input lets the model judge relevance; it does
not require copying everything into the summary.

## Project-state reconciliation

Inspectable canonical files retain long-term project knowledge; the
session's persisted continuation retains short-term task state. Prefer
references to durable knowledge over copying it into the continuation,
but keep enough task-specific context to resume. Temporary task state is
not automatically a new accepted project objective.

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
those waits cannot write a proposal. An append already submitted to the
filesystem is not transactional with session persistence and cannot be
undone by cancellation. If the existing inbox cannot be
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

The implemented serialization contains the following schema-controlled
fields (the preference and tool-lesson arrays are optional additions;
old output remains usable):

```text
objective:
authorization:
constraints:
userPreferences:
progress:
decisions:
inferences:
failedOrRejected:
toolLessons:
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
reclassified. Working-memory strings and arrays have no arbitrary length/count caps;
model input/output capacity bounds normal compaction. Inbox proposals
remain at most five one-line entries of at most 1,000 characters each.
External canonical reads remain at most 16 KiB per file and 48 KiB total;
status/path metadata has separate bounds. UTF-8 snapshots are decoded
and then byte-bounded, including malformed source text. These I/O and
proposal safeguards do not select conversation turns. The nonblank
runtime source budget remains 3,400 lines; the checker reports a
50-line-rounded estimate. Recorded labels are carried forward without
verification; inferences remain distinct.

## Required regressions

Test task versus project-goal separation, tool-heavy request retention,
chronological user corrections, two-pass working-memory continuity,
complete chronological visible input, Unicode-safe necessary output
reduction, thinking exclusion, settled-boundary execution, duplicate/reentrant triggers, queued
follow-up preservation, explicit decisions versus inference, visible
rationale without invented hidden reasoning, rejected-path continuity,
project-state gap classification, canonical non-mutation, bounded
unreviewed proposals if retained, malformed output/failure fallback, model-derived input/output admission, complete large prior-summary and
call-argument retention, native retained projection, large-output-only
reduction, oversized-backbone fallback, middle feedback/error-repair
coverage, and successful resumption of the actual next action.

Live-model fixtures can then evaluate decision loss, reintroduction of
rejected ideas, unsupported claims, failure to continue authorized work,
and treatment of unresolved alternatives. Those results are behavioral
evidence, not deterministic CI contracts.
