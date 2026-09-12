# Search examples

## Known scholarly topic, mixed capabilities

Input: "Find recent evidence on X and tell me whether it supports claim Y."

Output pattern:

1. inspect supplied files and any local literature index for already available
   candidate sources;
2. use an OpenAlex-like metadata/graph capability when useful to recover DOI,
   authorship, dates, related works, references, or citation relationships;
3. use a scholarly gateway such as Scholar Gateway or an equivalent for focused
   retrieval where it adds coverage;
4. use returned identifiers to obtain and inspect the relevant full text with an
   available PDF/document reader when the exact result or method matters;
5. use targeted fetch/browser retrieval for a known publisher, DOI, repository,
   correction, or retraction page; and
6. broaden search only when the evidence gap still requires it.

Do not call every capability mechanically. Each result should alter the next
retrieval decision.

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
