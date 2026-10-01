# OpenAlex examples

## Search a topic with scope limits

Use a focused text query and combine it with filters that narrow the requested
population. Preserve the returned record IDs and relevant bibliographic fields
for later lookup or source inspection:

```js
await tools.mcp__openalex__openalex_search_entities({
  entity_type: "works",
  query: '"urban heat" AND health',
  filters: { publication_year: "2020-2025", is_oa: "true" },
  per_page: 10,
  select: ["doi", "publication_year", "authorships", "primary_location"],
})
```

This is a bounded discovery query, not an exhaustive search or evidence that
any returned work supports a particular claim. Use the returned cursor to
continue if another page could change the candidate set.

## Find works by a resolved author

Resolve a name before filtering because names are ambiguous. Substitute the
OpenAlex author ID returned by the first call into the second:

```js
const resolved = await tools.mcp__openalex__openalex_resolve_name({
  entity_type: "authors",
  query: "Ada Lovelace",
})
// Read the selected author's OpenAlex ID from `resolved`.
await tools.mcp__openalex__openalex_search_entities({
  entity_type: "works",
  filters: { "authorships.author.id": "A_RECORDED_OPENALEX_ID" },
  per_page: 10,
})
```

Do not use a guessed name as an entity filter. If the resolver returns multiple
plausible matches, disambiguate the person before proceeding.

## Switch to semantic search deliberately

When keyword wording is not finding conceptually relevant candidates, try
semantic retrieval as a distinct search strategy. It uses page-based
pagination, has a maximum of 50 records per page, and is rate-limited upstream;
it is not evidence of a stronger match than keyword search. Compare the
candidates and inspect the work itself when exact claims matter:

```js
await tools.mcp__openalex__openalex_search_entities({
  entity_type: "works",
  query: "How urban heat affects health outcomes",
  search_mode: "semantic",
  page: 1,
  per_page: 10,
})
```
