# Search examples

## Known scholarly topic, mixed capabilities

Input: "Find recent evidence on X and tell me whether it supports claim Y."

Output pattern:

1. inspect supplied files and any local literature index for already available
   candidate sources;
2. use an available scholarly metadata/graph capability when useful to recover
   DOI, authorship, dates, related works, references, or citation relationships;
3. use an available scholarly gateway for focused retrieval where it adds
   coverage;
4. use returned identifiers to obtain and inspect relevant full text with an
   available PDF/document reader when exact results or methods matter;
5. use targeted fetch/browser retrieval for a known publisher, DOI, repository,
   correction, or retraction page; and
6. broaden search only when the evidence gap still requires it.

Do not call every capability mechanically. Each result should alter the next
retrieval decision. If local literature search returns a `sourcePath`, hand that
path to an available PDF or document tool to inspect the relevant material; do
not dump a whole source into context when focused inspection is enough. Discovery
metadata and snippets are leads, not source verification.

## Compose independent remote retrieval

When codemode is available for remote research and several independent
read-only retrievals are useful, compose them to reduce round trips. Preserve
source identifiers and distinguish partial failures:

```js
const outcomes = await Promise.allSettled([
  scholarlySearch({ query: "topic X evidence" }),
  metadataLookup({ doi: "10.example/example" }),
]);
const evidence = outcomes.flatMap((outcome, index) =>
  outcome.status === "fulfilled"
    ? outcome.value.map(item => ({ retrieval: index, ...item }))
    : [{ retrieval: index, error: String(outcome.reason) }]
);
nodeRepl.write(JSON.stringify(evidence));
```

Use the actual exposed tool names and argument schemas. Keep returned DOI,
record, and source identifiers attached to each item. A failed retrieval does
not invalidate successful independent results; report the gap. Search records
and snippets remain discovery evidence.

If the exact remote tool is unknown, first inspect the codemode catalogue and
namespace, then make one focused call:

```js
const matches = await searchTools("search scholarly works by DOI");
nodeRepl.write(JSON.stringify(matches));
// After identifying the precise tool and schema:
const description = await describeNamespace("scholar");
nodeRepl.write(JSON.stringify(description));
const result = await scholar.search({ doi: "10.example/example" });
nodeRepl.write(JSON.stringify(result));
```

Do not guess the final tool name or arguments: use the returned descriptions.
For large structured results, filter irrelevant records, deduplicate by stable
identifier, and emit only fields needed for the next decision while retaining
provenance:

```js
const unique = new Map();
for (const item of records) {
  const key = item.doi ?? item.id ?? item.sourcePath;
  if (key && !unique.has(key)) unique.set(key, item);
}
nodeRepl.write(JSON.stringify([...unique.values()].map(({ title, doi, id, sourcePath }) =>
  ({ title, doi, id, sourcePath }))));
```

Do not wrap one simple retrieval call in codemode merely because codemode exists;
call it directly when composition or output reduction provides no benefit.

## Known webpage

Input: "Check whether this documentation page still says Z."

Output: fetch or open the known page directly when possible. Use broad search
only if the page cannot be reached or another authoritative version must be
found.

## Current standard

Input: "Find the current standard for X."

Output: decompose the question, prefer authoritative current sources, record the
relevant date boundary and stopping rule, verify the specific standard text or
official page rather than relying on search snippets, then pass selected
material to source assessment.
