# Optional STACK.md design

`STACK.md` is a proposed user-level preference file for relationships among
available tools and services. It is not implemented in the current runtime and
should be added only if existing Pi user-level instructions or configuration
cannot express the same information cleanly.

Capability discovery answers "what can this session use?" A stack preference
answers "when several available mechanisms could do this job, how does this
user normally prefer them to fit together?"

Examples include preferring deterministic local transforms when a model need
not inspect raw data, preferring a particular browser mechanism for interactive
work, or using a local literature corpus before broader remote retrieval.

## Boundary

`STACK.md` must never create a capability the runtime does not expose, assert
that credentials or network access work, override a current explicit user
instruction, serve as a security policy, contain secrets, or duplicate tool
schemas/package state. Runtime capability state wins whenever preference and
availability differ.

## Possible content

If retained, keep the file ordinary Markdown rather than defining another
configuration language:

``` md
# Stack

## Research

Prefer local literature discovery for indexed material. Use broader scholarly
retrieval when the question needs sources outside the local corpus.

## Data handling

Prefer deterministic local transforms when the model does not need to inspect
raw data.
```

## Loading and precedence

No path or parser precedence is accepted yet. Inspect Pi's current user-level
instruction/config discovery first. Do not inject stack preferences into every
turn merely because the file exists; expose them only when tool choice or
service composition makes them relevant.

Conceptually, current explicit user instructions outrank accepted project
requirements, which outrank durable preferences. Capability availability is an
independent factual constraint: a preference cannot make a missing tool exist.

## Acceptance criteria if implemented

Absence changes nothing; malformed state fails visibly without disabling Pi
Sych generally; preferences cannot advertise inactive tools; explicit current
instructions win; no secrets are encouraged; unrelated turns do not pay the
context cost; and documentation clearly distinguishes preference, capability,
and authority.

If those properties require substantial machinery, do not add `STACK.md`.
