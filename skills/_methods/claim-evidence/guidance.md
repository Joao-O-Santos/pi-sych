# Claim and evidence

Use this method to connect each consequential claim to the artifact that can
support it. Citation appearance, source prestige, repetition, and successful
execution do not establish claim support.

## Build a claim map

**Default:** For each material claim:

1. identify its type and scope;
2. identify the supporting artifact actually inspected;
3. separate observation, statistical result, inference, and speculation;
4. record qualifications, contradictions, and missing support; and
5. state what would discriminate competing explanations when relevant.

Typical support includes:

| Claim | Supporting artifact |
| --- | --- |
| numerical result | versioned output, table, figure, or executed analysis |
| methodological action | protocol, materials, code, log, or accepted decision |
| bibliographic claim | inspected source and verified metadata |
| quotation | inspected cited version and locator |
| conceptual inference | stated premises plus an explicit inferential link |
| project-status claim | current file, command output, or recorded decision |

**Reason:** Claim-level mapping exposes unsupported clauses hidden inside
well-cited sentences and prevents an output or citation from bearing more
weight than it can.

**Exceptions:** Routine background statements may be grouped when they share
the same support and scope. Split them whenever support or qualification
differs.

**Review test:** Could another reviewer locate the supporting artifact and tell
which part of the claim it supports?

**Failure mode:** Citation dumping, tracing only whole paragraphs, or treating a
correctly formatted reference as evidence for every clause beside it.

## Scope in-text citations

Read a citation in context: what term, clause, or claim will a reader take it
to refer to, and what job does the inspected source actually do?

- **Claim support:** Place the citation with the claim or clause it supports.
  The source can warrant an inference without stating it in those words.
- **Method or concept:** Attach the citation to the method, term, or definition
  it documents. If placement alone is ambiguous, say what the reference is
  for (for example, “for an introduction to the method, see …”).
- **Related work:** Use “see,” “see also,” or a more specific cue to point to
  context, adjacent cases, or further reading. Name the connection when it
  would otherwise be unclear: “see” can still read as a pointer to evidence
  for the claim.
- **Contrast:** Use “but see” or “for a contrasting account, see …” when the
  source materially disagrees. Explain what is disputed when it affects the
  reader's interpretation; adjacent citations alone can imply agreement.

Follow project or venue conventions for signals and punctuation. If a source
is relevant but sits where readers will take it as evidence for a claim it does
not support, tell the author what it does support and offer a precise
repositioning or rephrasing. Then assess the substantive claim separately:
moving a citation or adding “see” does not supply missing evidence. If the
claim already has independent support, preserve it.

## Preserve source and inference limits

**Default:** Trace numbers to outputs; methods to protocols, materials, code, or
decisions; and bibliographic claims to inspected sources. Preserve source
qualifications and distinguish illustrative citations from evidential or
contextual citations. Verify quotation wording, version, locator, correction
or retraction status, and retrieval limits when material. Mark contradictory or
missing evidence instead of manufacturing consensus.

Assess support by reasoning from the source's design, measures, results and
scope to the specific inference, including relevant limitations and competing
accounts. Matching words or topics is neither necessary nor sufficient: a
study can support an inference without using the claim's wording, or use the
same terms while measuring something else.

Calibrate in both directions. Do not inflate a claim beyond its support, but do
not replace an accepted, supported claim with a weaker formulation merely
because the weaker one is less contestable. A necessary caveat should bound the
positive inference, not consume or substitute for it. When inspected evidence
cannot support an accepted project claim or argument invariant, expose that
conflict for resolution rather than silently retreating to a different thesis.

A conceivable alternative explanation is not automatically a substantive
counterargument. Judge whether it is plausible, supported by available
observations, and capable of materially changing the inference. Reserve
"unsupported" for claims whose relevant support is absent or inadequate,
not claims that merely remain open to revision. "Well supported" need not
mean conclusively established.

A lack of certainty is not itself a lack of support. Assess the degree and
type of support relative to the claim: well-supported but defeasible,
partially supported, genuinely contested, or contradicted. For consequential
ambiguity, especially when it bears on a paper's central thesis, tell the
author what the inspected evidence does and does not warrant and ask for a
decision if the position is unresolved. Keep this consultation in the user
conversation rather than embedding the assistant's objections as unexplained
caveats in the artifact. If the author knowingly chooses a defensible
interpretation, preserve that conclusion while fairly representing material
counterevidence and uncertainty. A user decision cannot make a false factual
statement or invented source acceptable.

**Reason:** Provenance and version determine what was actually inspected, while
explicit epistemic labels prevent both tentative evidence from becoming a
stronger claim and supported argumentative commitments from eroding through
defensive calibration.

**Exceptions:** If the source or output is unavailable, report the unavailable
provenance and limit the claim rather than reconstructing verification from
memory.

**Review test:** Does the prose say neither more nor materially less than the
inspected support warrants, while preserving accepted scope and argumentative
force?

**Failure mode:** Inflating tentative findings, weakening a supported accepted
claim into a safer substitute, allowing caveats to displace the positive
argument, quoting an uninspected version, inventing metadata or execution,
hiding disagreement in a source cluster, or using an illustration as evidence.

## Supporting files

Consult [examples](examples.md) and the optional
[claim-map template](templates/claim-map.md) when they help the task.
