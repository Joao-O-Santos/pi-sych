# Sources

Ask whether the inspected source can bear the exact intended inference. Check
design or basis, population, measures, comparison, uncertainty, stated limits,
and relevance to the claim. Distinguish primary evidence from secondary
reporting; verify the version, corrections, and time sensitivity when they
matter.

Discovery metadata is not source inspection. Local indexes, OpenAlex-like
metadata services, scholarly gateways, search results, and snippets can identify
or prioritize sources, but inspect the underlying article, chapter, report,
dataset documentation, or authoritative page when exact wording, methods,
results, quotations, limitations, or correction status matter. If a PDF or
other full-text file is available, use an available document-reading capability
rather than inferring its contents from metadata. A PyPDF/PyMuPDF-style reader
is one possible implementation; any tool that reliably exposes the relevant
full text or structure can serve the same role.

For known web sources, prefer a targeted fetch or browser read of the specific
page over relying on a search snippet. For bibliographic identity or citation
relationships, use an appropriate metadata service and cross-check consequential
fields when conflicts appear. Record what was actually inspected.

Reconcile conflicts by locating differences in design, scope, measurement, or
timing rather than averaging them into consensus. State when access is partial,
only secondary reporting is available, or the source cannot support the needed
claim.
