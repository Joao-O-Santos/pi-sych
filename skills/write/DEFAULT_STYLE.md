# Default writing style

Use these as package-level defaults when no more specific instruction is
available. Explicit user requests, author voice, project `STYLE.md`, venue or
publisher requirements, renderer constraints, accessibility needs, and
source/evidence limits override these defaults. Do not invent personal
experience, facts, citations, quotations, results, or requirements.

## General

- Identify the audience, purpose, and primary reader action before drafting.
- Lead with the answer, claim, or action when the genre permits it.
- Prefer direct, concrete, economical prose. Preserve qualifications that
  affect interpretation or decisions.
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
- Keep the manuscript self-contained and organize it around the scholarly
  problem, claims, tensions, and contribution rather than drafting history.

## Statistical prose and Markdown

- For statistical reports written in Markdown, use Pandoc-flavored Markdown
  when no project or renderer requirement says otherwise. Confirm the target
  renderer before relying on extensions.
- For an HTML-targeted Pandoc workflow that uses entity-safe notation, write
  `&eta;^2^~p~` rather than a literal Unicode eta. For math-capable LaTeX or
  renderer-specific output, use that renderer's tested math syntax instead,
  such as `$\eta_p^2$`.
- Test representative output when notation, superscripts, subscripts, HTML
  entities, or conversion to PDF, HTML, or DOCX materially matters.
