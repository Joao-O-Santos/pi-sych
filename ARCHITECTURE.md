# Architecture

Pi Sych is a Pi package with a supervisor extension, a separately bootstrapped worker extension, project-local state, deterministic synchronization helpers, and review-gated durable changes. It does not impose a fixed multi-agent pipeline.

## Runtime

**Supervisor:** `extensions/workbench/index.ts` adds operating guidance and registers project status, initialization, synchronization, drift, evidence, retrospective, dispatch, verification, and review surfaces. Focused modules implement the behavior.

**Project state:** `project-files.ts` discovers `PROJECT.md`, `EVIDENCE.md`, `SYNC.md`, and optional `DECISIONS.md`/`STYLE.md`/`TODO.md`. `TODO.md` is a local task-state ledger, not authority for project direction or evidence. `sync.ts` compares declared SHA-256 fingerprints and reports changed, missing, stale, or conflicted files without choosing an authority. `candidates.ts`, `drift.ts`, and `evidence.ts` produce reviewable proposals rather than silent writes.

**Workers:** `worker-engine.ts` validates one dispatch schema and nested result envelope, resolves exact selected skills, launches an ephemeral Pi process with an exact tool surface, keeps one immutable result, limits retries to transient failures before mutation, and reports dirty or committed changes. Project-local `.pi-sych/` runtime state is excluded through Git’s local exclude file when necessary. `extensions/worker/index.ts` exposes only result submission and worker status. `model-catalog.ts` reads the private user-ranked model catalog.

**Verification and review:** `verification.ts` executes optional explicit executable/argument arrays in the supervisor after worker submission and records actual exit codes, bounded output, timestamps, and changed files. Non-executable scientific review remains a human task. `plannotator.ts` lazily imports documented browser helpers without loading Plannotator’s extension entrypoint. `submit_plan` records plan-level approval before candidate or reconciliation application; annotation commands return human feedback to the supervisor.

**Skills and tests:** `skills/` contains reusable guidance with YAML identity metadata. `fixtures/` provides test inputs. Unit tests cover helpers; integration tests exercise Pi RPC loading and visible commands.

## Data flow

1. Pi loads the package, supervisor extension, and relevant skills.
2. The supervisor locates project files and compares `SYNC.md` fingerprints.
3. It works directly or dispatches one bounded worker with exact inputs, skills, output expectations, intended writes, and verification commands.
4. Workers submit one immutable result; the supervisor records process outcomes and project changes.
5. Verification and human review remain separate from model claims.
6. Only explicitly approved durable changes update project files and synchronization state.

## Boundaries

`SYNC.md` has domain-specific authority, not a global source-of-truth flag. A changed fingerprint invalidates confirmation but does not decide what is correct.

Worker modes choose visible Pi tools; they are not security boundaries. Use external containment where host security matters.

## Entry points

- `package.json` — package and Pi discovery metadata
- `extensions/workbench/index.ts` — supervisor runtime
- `extensions/worker/index.ts` — worker runtime
- `scripts/bootstrap-worker-agent-dir.mjs` — worker profile bootstrap
- `skills/*/SKILL.md` — reusable guidance
- `README.md` — human-facing use and trust limits
- `docs/CONFIGURATION.md`, `docs/DEVELOPMENT.md` — advanced configuration and maintenance
