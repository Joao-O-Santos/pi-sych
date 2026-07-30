---
name: review-copyedit
description: Perform sentence-level clarity, grammar, terminology, consistency, and minimum local-fix review as an optional lens after structure is sound.
---

# Copyedit review

Use this lens with `artifact-review` when structure and argument are stable and
the remaining work is local prose quality. Prefer the smallest local fix. Do not
use copyediting to redesign organization or intellectual contribution.

## Check

- Grammar, agreement, punctuation, and readable sentence length.
- Consistent terminology, spelling, capitalization, and citation or interface
  labels.
- Ambiguous pronouns, stacked modifiers, empty nominalizations, and filler that
  hide the claim.
- Parallelism in lists and headings; figure/table callouts that match captions.
- Voice chosen for information focus rather than blanket active-voice rules.
- When a project style applies, report only concrete local drift from it.

## Findings

For each material finding, state the location, concern, why it matters, and the
minimum response as a local wording or consistency fix. Preserve intentional fragments,
dialect, emphasis, and authorial variation unless they obstruct the purpose.

## Use with

Load with `artifact-review` as the core, usually after `review-structure` and
any needed `review-detail` pass. Pair with `style-application` and
`writing-core` when project defaults or voice judgments matter.

## Optional user examples

If `~/.config/pi/skills/review-copyedit/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
