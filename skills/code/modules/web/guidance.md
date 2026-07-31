# Web

State the browser-visible behavior, supported inputs, loading and failure states, and server boundary
before changing code. Inspect the nearest route, component, form, API contract, and tests. Preserve
semantic HTML, keyboard operation, focus handling, labels, error announcements, and useful empty
states; do not substitute visual success for accessible behavior.

Use the existing build, routing, data-fetching, and deployment conventions. Prefer the smallest direct
change that makes request data, validation, authorization, and error handling visible. Add a client or
server layer only for a demonstrated boundary or repeated use. Test meaningful browser and endpoint
outcomes, including failure where changed; run fitting project checks and report unrun checks plainly.
Security, compatibility, and release decisions need risk-appropriate review, not generic hardening
claims.
