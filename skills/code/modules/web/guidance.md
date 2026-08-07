# Web

Understand the visitor's real path first. State browser-visible behavior,
supported inputs, loading and failure states, feedback, user control, and the
server boundary before changing code. Inspect the nearest route, component,
form, API contract, and tests. Preserve semantic HTML, keyboard operation,
focus handling, labels, error announcements, useful empty states, recognition
over recall, and progressive disclosure only when it reduces rather than hides
complexity; do not substitute visual success for accessible behavior.

Use the existing build, routing, data-fetching, and deployment conventions.
Prefer direct reuse, browser/platform features, and the smallest inspectable
change that makes request data, validation, authorization, state, and error
handling visible. Add a client or server layer only for a demonstrated boundary
or repeated use. Broken invariants should fail before effects; expected input,
cancellation, and transient failures should preserve safe state and present
recoverable next steps.

These are strong but defeasible preferences, not UX or fail-fast dogma.
Accessibility, security, data integrity, compatibility, anticipated user error,
graceful degradation, and cohesive implementation may require another design.
Test meaningful browser and endpoint outcomes, including failure where changed;
run fitting project checks and report unrun checks plainly. Security,
compatibility, and release decisions need risk-appropriate review, not generic
hardening claims.
