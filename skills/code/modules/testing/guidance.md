# Testing

Identify the changed behavior and the project-native check most likely to
falsify it. Inspect existing scripts and tests before adding a case, wrapper, or
new tool. For substantive behavior changes, obtain independently authored test
design when available; cover meaningful normal, error, and boundary behavior in
proportion to risk.

Run exact commands with Pi's built-in Bash, inspect changed files and relevant
outputs afterwards, and report only actual exit status, failures, and limits.
Record durable verification in `EVIDENCE.md`, a decision, or a
`project_status` acknowledgement only when useful. Passing checks do not prove
semantic correctness, approval, or untested behavior.
