---
name: git-workflow
description: Apply Pi Sych's safe, simple Git default for small teams: work on main unless a branch is needed, make atomic verified commits, and protect remote and shared history.
---

# Git workflow

## Default

- Work directly on `main` unless the user requests a branch or concurrent work genuinely needs isolation.
- Before changing Git history or refs, inspect the working tree, current branch, and relevant recent history.
- Do not push, publish, open a pull request, alter remotes, rewrite shared history, or delete a branch without explicit user instruction.

## Commits

- Make an atomic commit after a coherent, verified change.
- Prefer a short imperative subject of at most 50 characters unless the repository already uses another convention.
- Follow the repository’s established convention for conventional prefixes such as `feat:` or `fix:`; do not prescribe or ban them globally.
- Add a body only when useful; wrap it at 72 characters.

## Rare branches and merges

- If a branch is needed, give it a descriptive name without assuming a particular prefix.
- Before merging, confirm the intended commits and target branch. Prefer a true merge over a squash merge unless the user requests squash.
- A private, unpushed branch behind `main` may be rebased onto current `main` before merging, but only after explicit authorization. Never automatically rebase shared or pushed history.
- Do not delete a local branch until its intended commits are integrated and deletion is explicitly requested.

## History rewriting

- Treat rewrites as consequential: confirm the target commits, branch relationships, working tree, and remote implications first.
- When the installed Git supports them, prefer atomic `git history fixup`, `git history reword`, or `git history split` for the matching simple rewrite.
- Use interactive rebase only for complex reorganizations.
- Never rewrite shared or pushed history without explicit user instruction.

## Private examples

If `~/.config/pi/skills/git-workflow/examples.md` exists, read it before applying this skill. Use it as illustrative preference, not as evidence or project requirements.
