# Pi Sych v7 remaining work

This plan is the durable handoff for the remaining v7 program. It describes the
full target, including runtime work that requires a capable coding-agent harness.
Keep the package small: solve repeated observed failures with the least prompt
and runtime surface that works, then verify behavior rather than adding process.

## North star

Pi Sych should help a person carry substantial project work from request to
completion while preserving four boundaries:

1. **Human authority.** Clear instructions authorize their stated scope. New
   consequential choices outside that scope remain human-owned.
2. **Visible continuity.** Goals, decisions, constraints, failures, unresolved
   alternatives, and project state survive long sessions without relying on
   hidden model memory.
3. **Bounded delegation.** The supervisor may work directly or delegate to a
   short-lived worker according to task, context, cost, specialization, and
   scrutiny. Context need does not force supervisor execution.
4. **Truthful capability and evidence claims.** Runtime state determines what
   tools are actually available. Search, checks, workers, and generated prose
   never become evidence or approval merely because they exist or completed.

The desired result is a supervisor that feels persistent without becoming
self-authorizing, capable without becoming monolithic, and helpful without
hiding important state transitions from the user.

## Verified baseline

The current branch already has seven umbrella skills (`project`, `write`,
`analyze`, `code`, `review`, `research`, and `automation`), routed shared
methods, bounded workers, clean and trajectory context modes, worker capability
modes, structured terminal results, local literature discovery, explicit
persistence versus scrutiny, and deterministic verification. Prompt word-count
accounting has been removed; the nonblank runtime source-code budget remains the
repository size budget.

The current custom compaction implementation is still the earlier pre-v7 design.
The settled-turn redesign below is planned, not implemented.

## 1. Capability awareness without a registry

Expose a compact mechanically derived view of relevant active capabilities to
the supervisor. It should be enough to choose among direct work, delegation,
local literature lookup, remote scholarly search, browser/fetch work, or other
available mechanisms without duplicating tool schemas or maintaining a second
capability registry.

Runtime state remains authoritative. Capability visibility does not grant
permission, guarantee credentials, or create a sandbox boundary.

Implementation acceptance criteria:

- derive the summary from real active session/package/tool state;
- do not advertise absent or disabled integrations;
- do not duplicate credentials or full schemas into prose;
- degrade truthfully when an integration is partial or unavailable; and
- keep direct work versus delegation a supervisor judgment rather than a fixed
  pipeline.

See [capability model](docs/capability-model.md).

## 2. Optional durable stack preferences

Decide whether an optional user-level `STACK.md` earns runtime surface after
inspecting Pi's existing user-level instruction/configuration mechanisms. Its
purpose would be durable preferences about how available tools and services are
normally combined. It must describe preference, not capability availability.

If existing Pi mechanisms already express this cleanly, do not add another file
or loader.

See [STACK design](docs/stack.md).

## 3. Writing and review quality

Keep writing guidance reader-centered and artifact-centered. A finished
manuscript, report, chapter, or other standalone artifact should make sense to a
reader who never saw the prompt, earlier drafts, reviewer discussion, or agent
conversation.

The writing/review system should explicitly catch:

- revision-history or prompt residue such as "in this version", "we now", "as
  requested", or references to an earlier draft when the artifact should stand
  alone;
- unnecessary negations or contrasts that answer a question only the prior
  conversation asked, such as denying a claim no ordinary reader would infer;
- reviewer-response language leaking into the manuscript;
- generic model polish, over-signposting, ceremonial transitions, repeated
  symmetry, generic importance claims, and other rhetoric that is locally
  jarring or unmotivated; and
- loss of an author's useful idiosyncrasy under broad rewriting.

Do not turn this into AI-detector folklore or a banned-phrase list. The test is
whether the wording serves the reader, genre, argument, and established voice.
Revision letters and reviewer responses are different genres: explicit version,
change, reviewer, and prior-draft references may be necessary there.

Thin review entry points may expose collaborative, adversarial, structural,
reader-friction/context-leakage, and verification lenses, but substantive policy
must remain owned by the `review` skill rather than duplicated across prompt
templates.

See [review prompt design](docs/review-prompts.md).

## 4. Research capability use

Research guidance should actively inspect and use suitable available
capabilities rather than relying on a generic search instruction. Tools should
be selected by function, with concrete examples but no hard-coded provider
dependency.

Relevant capability classes include:

- supplied project files and a local literature index such as
  `literature_search` for discovery within the user's corpus;
- scholarly metadata and graph services such as OpenAlex or an equivalent for
  candidate works, identifiers, authorship, dates, references, and citation
  relationships;
- peer-reviewed literature gateways such as Scholar Gateway or an equivalent
  for focused scholarly retrieval;
- PDF/full-text readers, including available PyPDF/PyMuPDF-style tools or other
  document readers, for inspecting the source itself;
- broad search tools for discovery when the location of the evidence is not yet
  known; and
- targeted fetch/browser tools for a specific DOI landing page, publisher page,
  correction/retraction notice, repository record, documentation page, or other
  known URL.

Use each tool for its native strength. Form purpose-built requests, learn from
returned identifiers, provenance, gaps, and failures, and use those results to
refine the next retrieval step. Do not mechanically call every tool. Metadata,
search snippets, and gateway summaries remain discovery evidence until the
underlying source is inspected when the exact claim, method, result, quotation,
or correction status matters.

## 5. Thin review prompt entry points

Verify Pi's actual prompt discovery, substitution, invocation, and package
rules. If thin prompts compose naturally with the `review` skill, package only
small entry points that improve discoverability. If packaging would duplicate
policy or create orchestration, leave the documented prompts as examples.

## 6. Settled-turn compaction

Replace the current pre-turn threshold handling with a verified settled-turn
lifecycle and a richer bounded continuation representation. Preserve observable
trajectory rather than claiming hidden chain-of-thought recovery.

The continuation should retain, when materially relevant:

- objective and authorization boundary;
- constraints;
- recent progress and material tool outcomes;
- accepted decisions and visible rationale;
- rejected or failed approaches that constrain future work;
- unresolved alternatives and questions;
- current work and next action;
- relevant files or artifacts; and
- project-state gaps or conflicts.

Reconcile conversation with bounded canonical project state. Missing durable
state is a finding, not automatic permission to edit semantic files. If inbox
proposals remain part of compaction, they must stay bounded and visibly
unreviewed.

Required tests include settled-boundary and reentrancy behavior, queued
follow-ups, explicit-decision versus inferred-rationale labeling, project-state
gap classification, canonical non-mutation, and deterministic fallback.

See [compaction design](docs/compaction-design.md).

## 7. Documentation and images

After runtime behavior settles, reconcile README, architecture, configuration,
development, public contract, review workflow, generated site, and diagrams
against actual behavior. Present-tense material must not imply autonomous goal
selection, a fixed workflow, guaranteed accuracy, or automatic approval.

## 8. Final v7 gate

Before owner release consideration:

- run the full deterministic repository verification, packaging, site, and audit
  gates;
- run live prompt-quality fixtures when useful and report them separately from
  deterministic CI;
- obtain an independent final diff review;
- reconcile durable project state after runtime work is stable;
- confirm main CI and Pages are green; and
- do not tag, publish, or release without separate owner instruction.

## Definition of done

v7 is ready for owner release consideration when capability awareness is
truthful and derived, delegation remains bounded and non-pipelined, writing and
research guidance produce self-contained evidence-aware artifacts, any stack or
prompt-template surface has justified its cost, compaction preserves observable
continuity at a safe lifecycle boundary, documentation matches implementation,
and the full repository gate is green with the runtime source budget intact.
