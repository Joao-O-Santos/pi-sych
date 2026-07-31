# Git

Inspect working tree, branch, and relevant history before changing refs. Work on `main` unless the user requests isolation or concurrent work needs it. Do not push, publish, open a pull request, alter remotes, rewrite shared history, delete branches, or tag without explicit instruction. Make coherent verified commits only when authorized by project convention.

Use a short imperative commit subject of at most 50 characters unless repository convention differs; use conventional prefixes only when established, and wrap a useful body at 72 characters. Before merging confirm intended commits and target; prefer a true merge unless squash is requested. A private unpushed branch behind `main` may be rebased only with explicit authorization; delete it only after integration and explicit request.

For rewrites confirm targets, relationships, working tree, and remote implications. When installed, prefer atomic `git history fixup`, `git history reword`, or `git history split` for the matching simple rewrite; reserve interactive rebase for complex reorganization. Never rewrite shared or pushed history automatically. Prefer the simplest supported operation; do not create branch policy or process theatre for a small change.
