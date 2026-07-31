# Web

Use clear frontend/backend boundaries, accessible browser behavior, and project-native build and deployment conventions. Prefer a small direct implementation over an invented framework layer.
## Practice

State the observable behavior to preserve or change, then inspect the nearest interface and existing tests. Choose the smallest implementation that makes data flow and failure behavior obvious. Add a layer only when it serves a demonstrated boundary or repeated use. Keep tests focused on externally meaningful behavior, run the project checks that fit the change, and report failures or unrun checks plainly.

## Limits

No test suite proves every deployment condition. Security, compatibility, and release decisions need risk-appropriate review rather than generic hardening claims.
