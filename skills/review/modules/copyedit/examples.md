# Copyedit examples

## Preserve voice while fixing local drift

Input: a paragraph has inconsistent terminology but a deliberate informal voice.

Output: normalize the term with minimum local edits while preserving the voice.

## Context leakage

Input: a standalone manuscript says "as requested, we now clarify that this is
not a claim about all populations."

Output: flag the process residue. If the scope qualification is needed, state the
population limit directly. Do not preserve "as requested" or "we now" merely
because they accurately describe the revision history.

## Not every model-like form is a defect

Input: an author repeatedly uses a short `not X but Y` contrast effectively and
it matches surrounding authored prose.

Output: retain it unless the particular contrast is unnecessary, repetitive, or
answers a hidden concern. Do not replace it simply because the construction is
common in generated prose.
