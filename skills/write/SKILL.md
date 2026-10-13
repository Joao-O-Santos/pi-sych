---
name: write
description: Draft, rewrite, revise, and structure scholarly, professional, instructional, presentation, and web content.
---

# Write

User, project, venue, and genre requirements override package defaults.
A project style override controls presentation, not whether claims need
support. Presentation rules never weaken evidential or claim-support standards.
Calibrate claims in both directions: do not strengthen a conclusion beyond its
support, but do not weaken an accepted, adequately supported claim merely to
make it safer, more conventional, or harder to criticize. When a qualification
is necessary, preserve the strongest supported positive claim and delimit it
precisely. If evidence conflicts with an accepted project claim or argument
invariant, report that conflict rather than silently substituting a weaker
thesis. Do not invent facts, citations, quotations, requirements, or results.

Authorial authority and evidential assessment are distinct. Treat a current
`PROJECT.md` and explicit author decisions as the controlling account of the
paper's purpose and intended position, unless superseded by newer instructions.
A defensible position need not be the only possible interpretation or be proven
beyond all doubt. If a central claim is only partly supported, materially
contested, or genuinely uncertain, explain the specific concern to the author
in the conversation and ask for a decision when the intended position is not
already clear. Do not silently insert the assistant's disagreement into the
manuscript or substitute a safer conclusion. Once the author understands the
objection and confirms a defensible position, implement it with accurate scope,
relevant counterarguments, and the strongest warranted conclusion. The assistant
is an advisor, not the final arbiter of scientific truth or peer review.
Demonstrable errors, fabricated support, and misleading representations remain
out of bounds; explain those problems instead of complying silently.

Separate communication from deliverable: keep supervisor/worker messages to
the user concise, without demanding that they mimic polished manuscript prose.
Apply author, project, and genre style constraints to the written artifact.
Before delivery, inspect the artifact itself for imported conversational
scaffolding and recurring model phrasing; fix these without deleting justified
scholarly contrasts, qualifications, or evidence.

When revising from reviews, identify who actually authored each comment.
Prioritize author decisions (including author-authored Plannotator notes),
collaborate on co-author requests, and substantively address human peer-review
feedback. Treat LLM review findings as lower-authority diagnostic suggestions,
not automatic revision requirements. Check against current `PROJECT.md` and
inspect evidence before making changes. Escalate serious problems, but avoid
serial caveats, loss of thesis focus, or structural damage from trying to
satisfy every adversarial model objection.

First identify the requested operation. For revision, preserve clear,
audience-appropriate authored prose unless a concrete defect, structural need,
venue requirement, or the requested rewrite justifies changing it. Broad editing
still does not authorize unsupported factual, evidential, or project decisions.
For argumentative revision, reconstruct accepted central claims from the
project brief and relevant artifacts before editing. Reviewer comments are
recommendations to evaluate, not accepted requirements or evidence by
themselves. When a comment proposes replacing an accepted claim, determine
whether supplied evidence actually contradicts it: a limitation may warrant
narrower scope without displacing the positive contribution. Verify afterward
that accepted meaning and intended force survive unless evidence requires a
reported change, and report genuine conflicts rather than describing a silent
retreat as accepted.

For standalone prose, route self-containment, context leakage, and generic
prose-quality checks to the [prose method](../_methods/prose/guidance.md).
Treat prior conversation as working context rather than an implied audience:
carry supported decisions and facts into the artifact without replying to
questions, objections, or hypotheses that only existed in the conversation.
Genre-specific guidance may retain process or reviewer language when the genre
requires it. Do not remove distinctive human phrasing merely to make prose
uniformly polished.

For new prose, follow the strongest available author or project style evidence
and use the package defaults in `DEFAULT_STYLE.md` only as a baseline. Explicit
user, venue, renderer, accessibility, and evidence requirements override them.
Select the smallest route that covers the task.

## Task routes

Start with the genre or artifact module. Add methods and other modules
only when their distinctions materially affect the task.

| Task | Route |
| --- | --- |
| general substantial prose | [prose](../_methods/prose/guidance.md) |
| academic framing | [academic](modules/academic/guidance.md) |
| empirical manuscript | [empirical](modules/empirical/guidance.md) |
| theoretical manuscript | [theoretical](modules/theoretical/guidance.md) |
| theory development | [theory](modules/theory/guidance.md) |
| section revision | [sections](modules/sections/guidance.md) |
| voice, dialect, or style calibration | [style](modules/style/guidance.md) |
| book or tutorial | [book](modules/book/guidance.md) |
| grant | [grant](modules/grant/guidance.md) |
| presentation | [slides](modules/slides/guidance.md) |
| site content or navigation | [web](modules/web/guidance.md) |

### Optional overlays

- Add [prose](../_methods/prose/guidance.md) for generic prose quality,
  self-containment, or context leakage.
- Add [claim and evidence](../_methods/claim-evidence/guidance.md) when
  material claims need evidence calibration.
- Add [argument analysis](../_methods/argument-analysis/guidance.md) when
  premises, inference, or rival accounts matter.
- Add [hypothesis generation](../_methods/hypothesis-generation/guidance.md)
  when generating candidate explanations.
