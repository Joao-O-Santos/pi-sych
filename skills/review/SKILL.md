---
name: review
description: Independently evaluate artifacts for correctness, structure, evidence, clarity, and risk.
---

# Review

Start with the requested lens, audience, and accepted requirements. Lead with
findings that could change the result. For each, give the location, why it
matters, and a repair when useful. Separate material defects from preferences
and trade-offs. Report a limit on the review only if it changes what the user
can rely on.

For an evidence finding, show the link between the claim and the inspected
source or output. Judge support by design, scope and inference, not exact word
matches or certainty. Test credible rivals against the evidence. A rival can
narrow a claim without displacing the contribution. Surface a material conflict
with the accepted thesis instead of silently weakening it.

For prose, read the piece in order. Identify the reader, the central claim and
what each paragraph does. Flag broken transitions, missing steps and repeated
habits that make the piece harder to read. Ask whether a caveat changes the
inference, whether a contrast distinguishes live alternatives, and whether a
denial answers a question the reader has any reason to ask. Explain the
reader-visible problem and preserve purposeful voice. Use the
[prose method](../_methods/prose/guidance.md) for details.

Review is advisory unless the user also requests edits. Identify who made each
comment: user or author direction carries authority, co-author feedback merits
collaboration, and human peer review deserves a substantive response. LLM
findings are diagnostics; verify them against the work and evidence. A fresh
review can find a blind spot without overruling the project's accepted aims.
Finish when the important issues are addressed, even if further objections are
possible.

Label worker reviews and packaged-prompt reports **LLM review** and name the
lens. Preserve the attribution of human-authored comments.

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
