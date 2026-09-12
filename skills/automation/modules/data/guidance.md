# Data and files

For deterministic file and tabular work, keep data local and mechanical when
possible. Read schemas, headers, shapes, metadata, or user-supplied mappings
instead of model-reading every value when the transformation does not require
semantic interpretation. Prefer established libraries and format-native tooling
over round-tripping through prose or lossy intermediate formats.

State the mapping from input to output, preservation requirements, and checks
before writing. Preserve formulas, types, dates, encodings, styles, and metadata
only to the degree the task requires; do not silently invent conversions. For
large or sensitive inputs, verify with row/record counts, column/schema checks,
checksums, spot checks, or deterministic comparisons rather than echoing raw
content into the conversation.

Separate content transformation from presentation formatting when that keeps the
model out of the data path. Report unsupported format features or lossy steps
before relying on the result.
