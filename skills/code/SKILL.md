---
name: code
description: Design, implement, test, maintain, and release software.
---

# Code

Recover or define accepted behavior before implementation. Inspect existing interfaces, constraints, and conventions; then make the smallest coherent change. Preserve working interfaces unless change is intentional. Prefer clear data flow, ordinary files, and existing Pi or platform capabilities over infrastructure. Verify with project-native checks and report only checks actually run. For substantive behavior changes, seek independently authored tests before implementation and independent review afterwards. Read only the relevant module guidance and examples; do not turn a small task into a workflow controller.

## Modules

- `architecture`: `modules/architecture/guidance.md` and `modules/architecture/examples.md`.
- `testing`: `modules/testing/guidance.md` and `modules/testing/examples.md`.
- `git`: `modules/git/guidance.md` and `modules/git/examples.md`.
- `npm`: `modules/npm/guidance.md` and `modules/npm/examples.md`.
- `web`: `modules/web/guidance.md` and `modules/web/examples.md`.

## Choose modules

| If the task is… | Read… |
| --- | --- |
| design or simplify components | `architecture` |
| behavior-changing implementation | `testing` |
| history or collaboration | `git` |
| package/release work | `npm` |
| web application implementation | `web` |
