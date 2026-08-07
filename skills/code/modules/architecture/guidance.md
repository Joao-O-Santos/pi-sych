# Architecture

Recover accepted behavior, constraints, change budget, verification contract,
and the real end-to-end flow before changing design. Locate a reported defect at
a demonstrated shared boundary; do not distribute symptom patches among callers
without evidence that the shared boundary is correct. Prefer deletion, direct
reuse, existing patterns, standard-library facilities, and platform mechanisms
before new machinery.

Favor small inspectable parts, explicit representations and interfaces,
policy/mechanism separation when it clarifies ownership, least surprise, and
silence on success when it is useful. Add an abstraction, dependency,
configuration layer, workflow, public API, migration, deployment mechanism, or
security requirement only when the task demonstrates the boundary and the new
machinery removes more complexity than it introduces.

These preferences are defeasible, not a line-count contest or universal Unix
rule. Security, accessibility, data integrity, compatibility, anticipated user
error, graceful degradation, or a more cohesive implementation can require a
larger or less direct design. Preserve interfaces unless change is intentional.
Consequential architecture, public APIs, dependencies, migrations, deployment,
and security-sensitive behavior remain human-owned unless explicitly delegated.
State assumptions, exceptions, and unresolved trade-offs instead of presenting
generic best practice as authority.
