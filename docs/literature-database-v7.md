# Literature database migration for v7

Pi Sych v7 changes the supported local literature index and the results
returned by `literature_search`. A v6 index is not compatible with v7.
Rebuild the index with a producer that supplies the v7 fields, or migrate it
from source records before using the search tool. Pi Sych detects missing
required columns and reports them before attempting a search.

## Database fields

The `papers` table must include:

- `item_type TEXT`, containing the producer-supplied item type or `NULL`;
- `creators_json TEXT`, containing JSON or `NULL`.

`creators_json` represents creators by role, with each role mapped to an
ordered array of name objects. For example:

```json
{"author":[{"family":"Lovelace","given":"Ada"}],"editor":[]}
```

The `papers_fts` full-text index and its relationship to `papers` must also
match the index producer's v7 schema. Use the project's index-generation
tool to rebuild the database when available; this page does not prescribe an
indexing command because Pi Sych does not own the producer or source corpus.

## Search result changes

The result metadata now exposes `itemType` and `creators`. Both may be `null`.
`creators` is the parsed role-keyed object described above. The old
`metadata.authors` field is removed. Update consumers to handle nullable values
and creator roles instead of assuming a flat author string.

## Migrating v6 data

The v6 `first_author` value may be a lossy citation stem, not a structured
creator record. Do not mechanically copy it into `creators_json`. Reconstruct
creator names and roles from source documents or trustworthy structured
records where possible. If the original information is unavailable, leave
creators unknown (`NULL`) rather than inventing a record. Populate `item_type`
from a reliable source as well; do not infer it from a title or citation stem.

After rebuilding or migration, run a search and inspect representative records
against their source documents. The local index is for discovery: successful
search and valid schema do not verify the accuracy or completeness of its
metadata.
