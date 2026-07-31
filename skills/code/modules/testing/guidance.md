# Testing

For substantive behavior changes, establish accepted behavior, obtain independent test design or authorship first, confirm expected failure, review tests, implement minimally, and do not weaken accepted tests merely to pass. Small covered refactors need not stage this workflow.
## Practice

State the observable behavior to preserve or change, then inspect the nearest interface and existing tests. Choose the smallest implementation that makes data flow and failure behavior obvious. Add a layer only when it serves a demonstrated boundary or repeated use. Keep tests focused on externally meaningful behavior, run the project checks that fit the change, and report failures or unrun checks plainly.

## Limits

No test suite proves every deployment condition. Security, compatibility, and release decisions need risk-appropriate review rather than generic hardening claims.
