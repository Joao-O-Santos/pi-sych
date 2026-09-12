# Search

Decompose the question into answerable subquestions, inspect supplied and local
material, choose proportionate queries and source types, iterate deliberately,
and state a stopping rule. Record query terms, databases or collections, date
boundaries, and retrieval failures when they affect coverage. Search results are
discovery, not proof; compare sources rather than treating the first plausible
result as decisive.

Before retrieval, inspect the available tool surface and select capabilities by
their native job. Examples include:

- a local literature index such as `literature_search` for discovery and
  provenance within an existing corpus;
- a scholarly metadata/graph service such as OpenAlex or an equivalent for
  candidate works, DOI and bibliographic identity, authorship, references,
  citation relationships, and related-work expansion;
- a peer-reviewed scholarly gateway such as Scholar Gateway or an equivalent
  for focused literature retrieval;
- a PDF/full-text reader for inspecting methods, results, tables, quotations,
  and surrounding context in the source itself;
- broad web/search discovery when the relevant page or source is not yet known;
  and
- a targeted fetch/browser capability when a DOI landing page, publisher page,
  correction notice, repository record, documentation page, or other URL is
  already known.

These are capability examples, not a mandatory sequence or provider list. Use a
purpose-built request for the selected tool rather than sending every service
the same generic prompt. Let each answer change the next question: identifiers
can seed full-text retrieval, references can expand candidate sets, missing
coverage can trigger another database, and a known URL can replace broad search
with targeted fetch. Stop using a capability when it is no longer adding
material information.

Retrieval access does not establish completeness. Report material time-window,
terminology, database, indexing, access, or coverage gaps rather than implying
that the available tools searched the literature exhaustively.
