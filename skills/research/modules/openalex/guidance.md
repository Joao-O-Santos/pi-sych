# OpenAlex

Use the OpenAlex MCP as a first-choice scholarly metadata and graph capability
when bibliographic discovery, identity resolution, references, citations, or
research landscape exploration would materially help. It is not a full-text
source reader and need not be called for every research task. Search results,
metadata, citation counts, and graph links discover or describe records; they do
not establish that a work supports a claim. Inspect the underlying source when
its methods, results, wording, limitations, or correction status matter.

## Choose the operation

Use the available OpenAlex tools by their descriptions; common MCP operations
include:

- `openalex_resolve_name` to disambiguate a name, or resolve a DOI, ORCID, ROR,
  PMID, or OpenAlex ID. Resolve names before using them as entity filters.
- `openalex_search_entities` to search/filter/sort records across works,
  authors, sources, institutions, topics, keywords, publishers, and funders. An
  `id` lookup retrieves one record; search and filters do not narrow that lookup.
- `openalex_describe_fields` to check valid filter, group-by, or select fields
  before constructing a query, especially for nested fields.
- `openalex_get_citation_graph` to retrieve works citing a seed, works cited by
  it, or algorithmically related works. Its direction labels are easy to
  misread: `cites` returns works that cite the seed; `cited_by` returns works
  the seed cites.
- `openalex_analyze_trends` to count records grouped by one supported field.
  Describe group-by fields first; use separate calls for separate dimensions.

Use the actual exposed tool schema. MCP wrappers may not accept every REST API
parameter or use the same argument names and limits.

## Compose focused searches

1. Select an entity type and search with a specific phrase, name, DOI, or other
   identifier. Use `openalex_resolve_name` when an entity's identity is
   ambiguous.
2. Refine with known constraints: year range, work type, access status, or
   resolved entity IDs. Call `openalex_describe_fields` rather than guessing a
   filter or aggregation field.
3. Keep relevance ordering for topic discovery. An explicit citation-count or
   date sort answers a different question and can move tangential records above
   relevant ones. Use citation counts as contextual metadata, not a quality or
   claim-support score.
4. Project only fields needed for the next decision. Preserve stable IDs, DOI,
   title, year, authorship, source, and the provenance needed to resolve or
   inspect a candidate.
5. Follow promising records by ID or DOI; use citation/reference links to expand
   the candidate set only when this can change the answer. Deduplicate by stable
   identifiers and stop when further retrieval is unlikely to affect the
   conclusion.

## MCP query syntax

The OpenAlex MCP search interface uses structured arguments rather than raw URL
parameters. In the current interface:

- `query` performs text search. The default keyword mode supports Boolean
  operators, quoted phrases, wildcards, fuzzy matching, and proximity. Choose
  `search_mode: "exact"` for unstemmed word matching or `"semantic"` for
  embedding-based similarity; semantic search is a different retrieval mode,
  not a more authoritative result.
- `filters` is a map of field names to values. Different fields are ANDed;
  pipe-separated values (`"article|review"`) are ORed within a field;
  prefix `!` to exclude a value; use `>` / `<` for comparisons, `2020-2024` for
  ranges, and `+` between values when AND within the same field is supported.
  Resolve names to OpenAlex IDs before filtering on authors, institutions,
  sources, or other entities.
- `sort` accepts field names with `-` for descending order in the MCP interface
  (for example, `-publication_year`). With a text query, an explicit sort
  overrides relevance; `-relevance_score` requires an active search.
- `select` requests top-level fields; nested data is selected through its
  parent object. `id` and `display_name` are always returned. A curated field
  set is returned when `select` is omitted.
- For keyword/exact searches, continue with the returned cursor. Semantic
  searches use page numbers instead of cursors and allow at most 50 results per
  page; the MCP documents an upstream rate limit of about one semantic request
  per second. Do not reuse a cursor for semantic search.
- `sample` is for exploratory random sampling, not exhaustive retrieval. It
  cannot be combined with sorting or pagination; use `seed` when reproducibility
  matters. Report the sampling boundary.

The MCP limits and syntax above are wrapper-specific and can change; inspect
Pi's current tool descriptions when uncertain. The REST API has its own
parameters and conventions. For example, REST uses `search`, a comma-separated
`filter`, `per-page`, and sort directions such as
`sort=publication_year:desc`; do not copy MCP argument objects into a REST URL
or assume REST limits apply to the MCP.

## REST API cross-reference

When a task specifically needs the REST API rather than the MCP, its query
language is expressed in URL parameters, for example:

```text
https://api.openalex.org/works?search=urban%20heat%20health&filter=publication_year:2020-2025,is_oa:true&per-page=10&select=id,doi,publication_year
```

In REST filters, comma-separated distinct filters combine with AND, pipe values
within a filter express OR, `!` negates, and `>` / `<` or a hyphenated range
express comparisons. URL-encode reserved characters as needed. Use cursor
pagination for long result lists; ordinary page-number paging has a 10,000
result ceiling. Check current official documentation for field support and
limits before large or consequential retrievals.

## Interpretation and limits

OpenAlex is a broad scholarly index, not a complete census of publications.
Coverage, metadata quality, entity matching, abstracts, access links, and
citation relationships vary. A resolved identity is a candidate match to
inspect, not a guarantee that similarly named people or organizations have been
fully disambiguated. Citation counts depend on coverage and time; they are not
measures of study quality, validity, or relevance. State material date,
coverage, sampling, or access limits, and verify consequential bibliographic
fields against the work or publisher record when they conflict.

## References

- [OpenAlex API Guide for LLM Agents](https://raw.githubusercontent.com/ourresearch/openalex-docs/main/api-guide-for-llms.md)
- [OpenAlex search and filters](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/search-entities)
- [OpenAlex filter syntax](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists)
- [OpenAlex paging](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/paging)
- [OpenAlex field selection](https://docs.openalex.org/how-to-use-the-api/get-single-entities/select-fields)
