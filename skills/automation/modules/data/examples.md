# Data and files examples

## Deterministic document handling

Task: inspect a PDF and fill an existing spreadsheet template from CSV; no
formula generation is required.

If a deterministic document capability is active and supports these formats,
prefer it for bounded PDF inspection and spreadsheet transformation over
extracting whole files into model-visible text or writing ad-hoc parsing code.
Inspect only the template structure and mapping needed for the operation, apply
the transformation deterministically, and verify output paths and counts. Keep
bulk or sensitive cell contents out of the model context when the tool can
process them locally. Use the available tool's own schema and supported
operations; do not assume a capability is installed merely because this example
names its role.

## Retrieval composition

For multiple independent read-only lookups, codemode can reduce round trips and
model-context pollution. Use `Promise.allSettled()` to preserve successful
results alongside failures, retain stable identifiers and provenance, then
filter, deduplicate, and emit only evidence needed for the decision. If only one
simple call is needed, call it directly rather than wrapping it in codemode.
