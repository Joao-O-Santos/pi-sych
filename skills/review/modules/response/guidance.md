# Response

Turn findings into one coherent response or revision strategy. Accept, adapt,
defer, or reject each finding for stated reasons; do not accept every suggestion
mechanically. Group interacting findings, identify the controlling requirement
or evidence, state the implementation order and changes deliberately excluded,
and name any owner decision still required. A response records reasoning, not
approval; do not imply that a reviewer or author accepted an unresolved change.

Response letters and revision memos may explicitly refer to reviewers, earlier
versions, previous wording, and what changed; those references often carry the
argument of the response. When implementing accepted changes in the underlying
manuscript or standalone artifact, do not copy that process language across
unless the artifact itself needs it. The revised artifact should normally make
its claims directly for a reader who never saw the review exchange.

## Selecting review findings

Classify comments by their actual author, not their delivery mechanism. Author
annotations in Plannotator are author feedback, not independent LLM review.
Normally integrate co-author feedback, resolving major objections together.
Treat human peer-review requests seriously, either integrating them or preparing
a reasoned response. LLM reviewer suggestions have less default authority;
assess their specific evidence and consequences rather than their volume.

For clean-context or adversarial LLM reviews, compare findings with current
`PROJECT.md`, accepted decisions, the intended contribution, and the manuscript
itself before revising. Escalate consequential errors or threats to the author.
Accept, adapt, defer, or reject other findings selectively. Consider cumulative
costs: serial revisions can bury the thesis under qualifications or distort the
structure to answer objections no reader would otherwise raise. Stop when
material problems are corrected or surfaced, not when adversarial models run
out of objections. Preserve the short review-mode provenance line when passing
LLM findings between workers or saving them to files.
