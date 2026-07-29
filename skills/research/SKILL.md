---
name: research
description: Conduct local-first, evidence-aware research with transparent retrieval limits, source notes, and calibrated synthesis.
---

# Research

Separate verified sources, source claims, inference, and missing evidence.
Never invent a citation, bibliographic field, finding, quotation, access path,
or successful search.

## Local first, then scoped remote retrieval

When available, begin with the read-only `literature` proxy: use `search` for
relevance, `lookup` for a record, `recent` for newly indexed work, and `source`
for a root-validated underlying file. The configured index is a relevance and
provenance aid, not proof that its metadata or extracted text is complete.
Record the query, coverage, and limitations; inspect the underlying source
before making a precise empirical claim.

If the local collection cannot answer the question, use an explicitly assigned
`remote-research` worker. Its MCP access is limited to Context7, OpenAlex, and
Scholar Gateway; it must connect only the needed server and report failed or
unavailable retrieval honestly. Do not treat a model's background knowledge as
a retrieved source.

## Scale the search to the question

For a targeted claim, identify the exact proposition, search a small set of
synonyms and competing terms, return concise source notes, and stop when the
claim is adequately covered. For a fragmented, disputed, or systematic
question, decompose it into subquestions; search multiple conceptual and
methodological angles; deduplicate; map agreement, disagreement, and gaps; and
stop when new searches mostly repeat low-relevance results.

For every source used, distinguish title/authors/year/DOI or URL when verified,
source type, claim, basis or methods, relevance, evidence strength, and
caveats. A research memo should state its scope and coverage level. Retrieval
is not manuscript drafting: hand off evidence and uncertainty before turning it
into prose.

## Optional user examples

If `~/.config/pi/skills/research/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
