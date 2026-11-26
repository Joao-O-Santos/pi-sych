# Default writing style

Use these as package-level defaults when no more specific instruction is
available. Explicit user requests, author voice, project `STYLE.md`, venue or
publisher requirements, renderer constraints, accessibility needs, and
source/evidence limits override these defaults. Do not invent personal
experience, facts, citations, quotations, results, or requirements.

These defaults govern produced writing artifacts, not the wording of every
agent-to-user message. Keep user-facing process communication concise; assess
scientific prose in the manuscript itself.

## General

- Identify the audience, purpose, and primary reader action before drafting.
- Lead with the answer, claim, or action when the genre permits it.
- Put the main point early. Give each paragraph a job, then develop it with
  evidence, an example, or a consequence. Let the ideas carry the transition.
- Use concrete subjects, ordinary verbs, and technical terms where they earn
  their place. Keep the author's rhythm and purposeful asides.
- State the positive claim in the strongest form the evidence supports. One
  precise qualification is enough when it carries the uncertainty. Use contrast
  for a real alternative the reader has reason to consider.
- Ask for missing source material or personal experience when the requested
  artifact genuinely depends on it; otherwise make a clearly labeled,
  bounded assumption rather than blocking routine drafting.

## Blog and essay posts

- If the requested post is personal or first-person, ask for specific stories,
  details, and the relevant chronology when those materials are missing.
- Use chronology or a narrative arc when sequence helps the reader understand
  the experience. Do not force a personal story onto an explainer, institutional
  post, or other non-personal brief.
- Never manufacture anecdotes, memories, opinions, or biographical details.

## Site content

- Write for scanning: put the visitor's answer or next action first, use
  descriptive headings, short sections, lists where useful, and specific link
  labels.
- Prefer an approachable, informal register when it fits the audience and
  brand, while remaining clear, professional, and precise. Do not make
  informality a substitute for missing policy, product, or evidence decisions.
- Preserve qualifications that affect what a visitor should decide or do.

## Papers and scholarly manuscripts

- Preserve an existing venue, publisher, journal, disciplinary, or project
  convention. If none is supplied, treat APA 7 as a provisional default only
  for APA-aligned social- or behavioral-science manuscripts; do not impose it
  across disciplines.
- Treat evidential support as graded rather than requiring certainty. A
  credible rival explanation does not automatically make a preferred
  interpretation unsupported; assess its actual force against the evidence.
- Keep the manuscript self-contained and organize it around the scholarly
  problem, claims, tensions, and contribution rather than drafting history.

## Teaching

Start with a question, case, or action the learner can recognize. Explain why
it matters before naming the machinery. Give the shortest complete example
that teaches the idea; move optional internals to a second reading or link.
A tutorial, a reference page, and a slide serve different purposes.

## Statistical prose and Markdown

- Lead with the substantive result and follow with the estimate, uncertainty,
  and relevant test. Use past tense for what was observed and present tense
  for a supported population or process inference. Where significance language
  is useful, qualify the evidence rather than the size of the difference.
  See the [reporting examples](../analyze/modules/reporting/examples.md).
- For statistical reports written in Markdown, use Pandoc-flavored Markdown
  when no project or renderer requirement says otherwise. Confirm the target
  renderer before relying on extensions.
- For an HTML-targeted Pandoc workflow that uses entity-safe notation, write
  `&eta;^2^~p~` rather than a literal Unicode eta. For math-capable LaTeX or
  renderer-specific output, use that renderer's tested math syntax instead,
  such as `$\eta_p^2$`.
- Test representative output when notation, superscripts, subscripts, HTML
  entities, or conversion to PDF, HTML, or DOCX materially matters.
