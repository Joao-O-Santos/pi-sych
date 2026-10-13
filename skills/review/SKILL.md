---
name: review
description: Independently evaluate artifacts for correctness, structure, evidence, clarity, and risk.
---

# Review

Evaluate independently. Accepted requirements and evidence override generic
advice; do not optimize for agreement or soften a material defect into
preference. Distinguish defects, trade-offs, alternatives, and uncertainty.
Report only checks actually performed.

Do not use certainty as the threshold for calling a scientific claim
supported. Distinguish support strength from conclusiveness and test whether
rival accounts actually undermine the inference, rather than merely imagining
an alternative. Review may challenge a defensible authorial position in the
conversation, but must not silently neutralize it in a revised artifact.

Judge the artifact's scientific prose independently of the assistant's chat
style. Conversational explanations to the user may be informal; the manuscript
must satisfy authorial voice, disciplinary genre, and artifact-level prose
quality. Flag model-default phrasing when it accumulates in the deliverable,
not merely because the agent used similar language in a status message.

Review findings carry different authority. Direct author feedback, including
Plannotator annotations authored by the user, expresses authorial intent.
Co-author feedback has a strong presumption of integration; discuss substantial
objections rather than silently reject it. Human peer-review feedback warrants
a serious response and normally integration unless a reasoned rebuttal is
justified. Independent LLM reviews, especially adversarial ones, are diagnostic
and have low default authority, although a verifiable material error matters
regardless of its source. Identify the actual origin of comments, not just the
tool or file that contains them.

Clean-context reviews can expose blind spots but do not supersede current
`PROJECT.md` or accepted authorial decisions. Triage findings against project
purpose, evidence, and thesis; bring genuinely consequential threats to the
author. Do not revise to eliminate every adversarial LLM objection or allow
successive caveats to obscure the contribution. A review cycle can end with
reasonable objections unresolved.

End LLM-generated reviews with a brief, truthful, mode-specific line identifying
the review as LLM-produced and the instruction that shaped its scope. For
example: "LLM review · Adversarial: I was asked to find problems; some may be
minor or speculative." Collaborative, copyedit, structural, and verification
reviews should state their own actual focus instead. This is provenance, not a
generic AI limitations disclaimer; do not append it to human-authored feedback.

Review is advisory unless revision or implementation was also requested.
Reviewer comments are proposals to assess, not evidence or accepted project
decisions by themselves. Compare them with explicit project state and supplied
evidence; distinguish a limitation that narrows scope from evidence that
contradicts an accepted claim.

For prose, route structure, voice, information flow, reader friction, and
self-containment through the [prose method](../_methods/prose/guidance.md).
Review the artifact as a whole before polishing sentences: identify its reader,
purpose, argument path, and paragraph jobs. Then test whether each sentence
advances that path or supplies context, evidence, a necessary transition, or a
material qualification. Explicitly test for a **possible invisible
interlocutor**. The reviewer cannot know hidden drafting context; do not claim
that a sentence came from it. Instead ask whether the artifact itself motivates
its denials, contrasts, caveats, rebuttals, reassurances, and corrections. Would
a reader ask "why am I being told this?" or "what objection is this
answering?" If so, identify the missing premise or propose the smallest direct
positive formulation.

Inspect style patterns across the artifact, not just isolated sentences:
repeated semicolons or em dashes, serial "not X but Y" constructions, stacked
hedges, formulaic symmetry, and signposting may cumulatively flatten voice or
interrupt flow. These are diagnostic prompts, never count-based violations.
For each instance, ask what rhetorical or evidential work it does. Keep
punctuation that expresses a real relation, contrasts that distinguish live
alternatives, and hedges that accurately calibrate uncertainty. Challenge
hedging when several weak qualifiers obscure who knows what, how strongly, or
why; do not convert genuine uncertainty into unwarranted certainty.

Trace flow at both scales: does each paragraph follow from the previous one,
and does each sentence connect known information to what it newly contributes?
Notice abrupt topic shifts, delayed main clauses, overloaded sentences, and
transitions that announce rather than establish a relationship. Read passages
in sequence, not as a collection of quotable defects. Ground material findings
in location and reader effect, and offer a minimal repair or a short example
when useful. Use the requested collaborative or adversarial lens. Report
material divergence from accepted project state rather than silently choosing
an authority. Select the smallest route that covers the review.

## Task routes

Use the smallest lens that covers the review. Add a shared method when its
distinction materially affects the review; lenses are not a fixed multi-pass
workflow.

| Task | Route |
| --- | --- |
| structural prose review | [structure](modules/structure/guidance.md) |
| copyedit | [copyedit](modules/copyedit/guidance.md) |
| theoretical review | [detail](modules/detail/guidance.md) |
| empirical inference review | [analysis](modules/analysis/guidance.md) |
| citation audit | [evidence](modules/evidence/guidance.md) |
| implementation review | [code](modules/code/guidance.md) |
| R or Quarto verification | [verification](modules/verification/guidance.md) |
| package or release verification | [verification](modules/verification/guidance.md) |
| response to findings | [response](modules/response/guidance.md) |
| completed-artifact verification | [verification](modules/verification/guidance.md) |

### Optional overlays

- Add [prose](../_methods/prose/guidance.md) for generic prose quality,
  reader friction, or context leakage.
- Add [claim and evidence](../_methods/claim-evidence/guidance.md) when
  support, provenance, or claim calibration is under review.
- Add [argument analysis](../_methods/argument-analysis/guidance.md) when
  premises, inference, or rival accounts matter.
- Add [citations](../research/modules/citations/guidance.md) for bibliographic
  identity and version checks.
- Add [testing](../code/modules/testing/guidance.md) for implementation
  failure-path or contract checks.
- Add [R and Quarto](../analyze/modules/r-quarto/guidance.md) for
  domain-specific computational verification.
- Add [npm](../code/modules/npm/guidance.md) for package checks.
