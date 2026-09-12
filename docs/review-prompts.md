# Thin review lenses

Pi Sych already has one `review` umbrella skill. Review prompts, if packaged at
all, should expose useful postures rather than duplicate procedure or create
persistent reviewer agents. The examples below are design references, not
installed prompt templates.

## Collaborative

``` text
Use the review skill collaboratively. Recover the intended contribution first,
then identify the few changes that would most improve structure, clarity,
coherence, economy, and evidential fit. Preserve sound choices rather than
redesigning them merely because alternatives exist. Return findings; do not
silently rewrite unless revision was requested.
```

## Adversarial

``` text
Use the review skill adversarially. Require the artifact to earn its main
claims. Test serious alternatives, missing reasoning, unsupported inference,
limitations, overclaiming, and structural weaknesses. Do not invent problems
for the sake of negativity. Separate blocking issues from optional improvements.
```

## Structural

``` text
Use the review skill for structural review. Reverse-outline the artifact and
check whether each section and paragraph has a necessary job, whether important
moves are missing or duplicated, and whether the sequence supports the intended
argument. Prioritize structural findings over wording edits.
```

## Reader friction and context leakage

``` text
Review the prose as a reader who has not seen any prompt, earlier draft,
reviewer exchange, or agent conversation. Flag process residue, revision-history
language, unexplained version references, unnecessary denials or contrasts,
reviewer-response wording inside the artifact, over-signposting, generic model
polish, and other phrasing that feels motivated by prior context rather than the
reader's needs. Distinguish genuinely useful qualification from leaked context.
Preserve purposeful authorial idiosyncrasy.
```

## Standalone manuscript

``` text
Review whether the manuscript stands on its own for a new reader. References to
"this version", what "we now" do, reviewer requests, earlier drafts, prior
prompts, or changes from previous wording require a substantive manuscript-level
reason; otherwise recommend removing or rewriting them. Do not apply this rule
to a response-to-reviewers letter, where change and version references may be
the point of the genre.
```

## Verification

``` text
Use the review skill for verification. Check the artifact against the stated
criteria and work actually performed. Report satisfied, failed, and unverified
criteria separately. Passing mechanical checks is not human approval or general
semantic correctness.
```

## Packaging rule

Before converting any example into a public prompt template, verify Pi's current
prompt discovery, substitution, invocation, and package behavior. A packaged
entry point should contain little more than posture and output intent, then rely
on the `review` skill for substantive procedure.

Do not package a prompt if it repeats skill policy, implies a fixed sequence of
agents, silently authorizes revision, treats independent review as approval, or
requires new orchestration merely to save a few words.
