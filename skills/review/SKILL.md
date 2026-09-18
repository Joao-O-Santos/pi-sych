---
name: review
description: Independently evaluate artifacts for correctness, structure, evidence, clarity, and risk.
---

# Review

Evaluate independently. Accepted requirements and evidence override generic
advice; do not optimize for agreement or soften a material defect into
preference. Distinguish defects, trade-offs, alternatives, and uncertainty.
Report only checks actually performed.

Review is advisory unless revision or implementation was also requested.

For prose, route generic structure, voice, reader-friction, and
self-containment checks to the [prose method](../_methods/prose/guidance.md).
When reviewing a standalone artifact, explicitly test for an **invisible
interlocutor**: would any sentence make sense only to someone who saw the
prompt, chat, reviewer exchange, or drafting history? Flag rebuttals,
qualifications, reassurances, or corrections that answer hidden context instead
of serving the artifact's own readers. Use the requested collaborative or
adversarial lens. Report material divergence from accepted project state rather
than silently choosing an authority. Select the smallest route that covers the
review.

## Task routes

Use the smallest lens that covers the review. Add a shared method when
its distinction materially affects the review; lenses are not a fixed
multi-pass workflow.

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
- Add [citations](../research/modules/citations/guidance.md) for
  bibliographic identity and version checks.
- Add [testing](../code/modules/testing/guidance.md) for implementation
  failure-path or contract checks.
- Add [R and Quarto](../analyze/modules/r-quarto/guidance.md) for
  domain-specific computational verification.
- Add [npm](../code/modules/npm/guidance.md) for package checks.
