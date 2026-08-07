# Testing

Trace the changed behavior through its real flow and choose the project-native
check most likely to falsify it. Inspect existing scripts and tests before
adding a case, wrapper, or new tool. Test a demonstrated shared boundary rather
than only the report's visible path. For substantive behavior changes, obtain
independently authored test design when available; cover meaningful normal,
error, cancellation, recovery, and boundary behavior in proportion to risk.

Broken invariants should fail loudly and before irreversible effects. Expected
invalid input, user cancellation, optional absence, and transient failures need
safe state, visible classification, and actionable recovery instead of a
blanket fail-fast rule. Do not hide a programmer error or corrupt state as a
routine fallback. These are defeasible preferences: data preservation,
compatibility, accessibility, security, and graceful degradation can require a
different recovery path.

Run exact commands with Pi's built-in Bash, inspect changed files and relevant
outputs afterwards, and report only actual exit status, failures, and limits.
Record durable verification in `EVIDENCE.md`, a decision, or a
`project_status` acknowledgement only when useful. Passing checks do not prove
semantic correctness, approval, or untested behavior.
