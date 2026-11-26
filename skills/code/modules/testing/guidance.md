# Testing

Trace the changed behavior through its real flow and choose the project-native
check most likely to falsify it. Inspect existing scripts and tests before
adding a case, wrapper, or new tool. Test a demonstrated shared boundary rather
than only the report's visible path. For substantive behavior changes, seek
independent test design when risk or usefulness justifies it; cover meaningful
normal, error, cancellation, recovery, and boundary behavior in proportion to
risk.

Broken invariants should fail loudly and before irreversible effects. Expected
invalid input, user cancellation, optional absence, and transient failures need
safe state, visible classification, and actionable recovery instead of a
blanket fail-fast rule. Do not hide a programmer error or corrupt state as a
routine fallback. These are defeasible preferences: data preservation,
compatibility, accessibility, security, and graceful degradation can require a
different recovery path.

Run checks with project-native or available tooling, inspect changed files and
relevant outputs afterwards, and report only actual exit status, failures, and
limits.
Summarize key checks for active or recently completed work in the optional
[project evidence digest](../../../project/modules/artifacts/guidance.md#keep-the-evidence-digest-current)
when useful. Replace superseded results and link to raw logs if they matter.
Passing checks do not prove semantic correctness, approval, or untested
behavior.
