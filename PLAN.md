# Pi Sych v7 execution record

This plan records the implemented v7 runtime and documentation reconciliation.
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

The current custom compaction implementation is the settled-turn v7 design:
optional 100k admission is guarded by idle, pending-message, and reentrancy
checks, and custom output retains bounded observable trajectory with native
fallback on omission or failure.

## 1. Capability awareness without a registry (implemented)

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

## 2. Optional durable stack preferences (rejected)

`STACK.md` was deliberately rejected after inspecting Pi's existing
user-level instruction/configuration mechanisms. Global/project `AGENTS.md`
provides the durable instruction boundary and established precedence; a second
preference file or loader would add machinery without a distinct contract.
The rejected design remains documented in [STACK design](docs/stack.md).

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

## 5. Thin review prompt entry points (implemented)

Five thin prompt templates are packaged: collaborative, adversarial,
reader-friction, structural, and verification. They select a lens and defer
substantive procedure to the `review` skill without creating orchestration or
approval.

## 6. Settled-turn compaction (implemented)

The settled lifecycle admits optional 100k compaction only when idle, with no
pending messages and no in-flight pass. It preserves bounded observable
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

## 7. Documentation and images (reconciled)

README, architecture, configuration, public contract, code tour, review prompt
documentation, changelog, project state, and image status now describe actual
behavior. Images remain unchanged and their stale-diagram limitations remain
explicitly documented.

## 8. Verification record

Completed for this reconciliation:

- Markdown formatting, documentation-link, style, dependency, audit, and
diff checks pass.
- Typecheck and the source-budget check pass at 2,800/3,000 rounded lines.
- Full deterministic suite passes: 161 unit and 17 integration tests;
  `make verify` (including coverage thresholds) exits 0.
- Custom compaction carries instruction/data isolation, aggregate input
bounds, line-break rejection in model-derived memory values, and
notification-safe proposal persistence, with focused regressions.
- Capability claims are ownership-aware; empty worker assignments are
rejected at the request boundary.
- Final-review documentation corrections are applied: configuration
defaults and literature schema, skill-copy precedence, rejected-STACK
marking, compaction lifecycle and field names, and consistent 3,000-line
budget statements.

Live prompt-quality fixtures, remote CI/Pages confirmation, and an independent
external diff review are not claimed here. No tag, publication, deployment, or
release action is authorized or performed.

## Definition of done

The authorized v7 implementation and documentation scope is complete when
capability awareness is truthful and derived, delegation remains bounded and
non-pipelined, review prompts defer to the skill, compaction preserves
observable continuity at a safe lifecycle boundary, documentation matches
implementation, and repository checks pass with the 3,000-line runtime source
budget. This record makes no release claim; version, `SYNC.json`, and images
remain unchanged.
