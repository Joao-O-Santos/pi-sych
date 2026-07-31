# Testing

Before selecting checks, inspect the repository's available scripts, formatter, linter, type checker, build, smoke, and task-specific commands. Choose existing project-native checks that can falsify the changed behavior before adding tests or wrappers. For substantive behavior changes, obtain independently authored test design when available; test normal, error, and boundary paths proportionately. Run exact commands and inspect changed files and outputs afterwards.

Run selected commands with Pi’s built-in Bash using exact commands and arguments; inspect changed files and relevant outputs afterwards. Report only checks actually run, their exit status, relevant failures, and limitations. Record durable verification support in `EVIDENCE.md`, a decision, or a `project_status` acknowledgement reason only when useful. Passing checks do not prove semantic correctness, approval, or untested behavior. Do not claim verification from inspection alone.
