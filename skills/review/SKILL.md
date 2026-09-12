---
name: review
description: Independently evaluate artifacts for correctness, structure, evidence, clarity, and risk.
---

# Review

Evaluate independently. Accepted requirements and evidence override generic
advice; do not optimize for agreement or soften a material defect into
preference. Distinguish defects, trade-offs, alternatives, and uncertainty.
Report only checks actually performed.

A whole-artifact review request authorizes reviewing the whole artifact. Finish
and return the findings rather than pausing at each issue. Review is advisory
unless revision or implementation was also requested. High scrutiny means
careful checking and, when useful, independent lenses or verification, not extra
user checkpoints.

For prose, check structure, clarity, repetition, argument and voice coherence,
reader friction, and artifact self-containment. Look for process or context
leakage when wording appears to answer an earlier prompt, reviewer exchange,
revision history, or hidden contrast rather than a need visible in the artifact.
Do not turn this into a banned-phrase or AI-detection exercise: ask whether the
wording serves the intended reader, genre, argument, and established voice.
Report material divergence from accepted project state rather than silently
choosing an authority. Use the requested collaborative or adversarial lens.
Select the smallest recipe that covers the review and read it in order.

## Task recipes

| Task | Read in order |
| --- | --- |
| structural prose review | [prose](../_methods/prose/guidance.md) → [structure](modules/structure/guidance.md) |
| copyedit | [prose](../_methods/prose/guidance.md) → [copyedit](modules/copyedit/guidance.md) |
| theoretical review | [argument analysis](../_methods/argument-analysis/guidance.md) → [claim and evidence](../_methods/claim-evidence/guidance.md) → [evidence](modules/evidence/guidance.md) → [detail](modules/detail/guidance.md) |
| empirical inference review | [claim and evidence](../_methods/claim-evidence/guidance.md) → [argument analysis](../_methods/argument-analysis/guidance.md) → [analysis](modules/analysis/guidance.md) |
| citation audit | [claim and evidence](../_methods/claim-evidence/guidance.md) → [citations](../research/modules/citations/guidance.md) → [evidence](modules/evidence/guidance.md) |
| implementation review | [code](modules/code/guidance.md) → [testing](../code/modules/testing/guidance.md) → [verification](modules/verification/guidance.md) |
| R or Quarto verification | [R and Quarto](../analyze/modules/r-quarto/guidance.md) → [verification](modules/verification/guidance.md) |
| package or release verification | [npm](../code/modules/npm/guidance.md) → [verification](modules/verification/guidance.md) |
| response to findings | [argument analysis](../_methods/argument-analysis/guidance.md) → [response](modules/response/guidance.md) |
| completed prose or scholarly verification | [prose](../_methods/prose/guidance.md) → [claim and evidence](../_methods/claim-evidence/guidance.md) → [verification](modules/verification/guidance.md) |
| completed-artifact verification | [claim and evidence](../_methods/claim-evidence/guidance.md) → [verification](modules/verification/guidance.md) |
