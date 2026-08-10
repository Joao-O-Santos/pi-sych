# Project

## Objective

{accepted} Maintain Pi Sych as a small, reviewable Pi package for
serious writing, research, analysis, and code projects.

## Audience and use

{accepted} Scientific writers, researchers, and maintainers who want
explicit project state, bounded delegation, truthful verification, and
human-owned consequential decisions.

## Intended contribution

{accepted} Pi Sych keeps project state and evidence visible, reports
changed hashes and declared dependency impact without silently making
semantic judgments, and supports bounded workers without claiming that
generated prose or automated checks replace human judgment.

## Deliverables

{accepted} The public package, its tests, baseline skills, concise
human-facing documentation, and private local configuration outside this
repository.

## Constraints

{accepted} Do not expose credentials, add a fixed workflow controller,
make sandbox or pseudo-security claims, push or publish without
instruction, or let model output stand in for evidence, citations,
verification, or final review.

## Project rules and preferences

{accepted} Prefer direct and minimal implementations. Keep durable state
explicit in `PROJECT.md`, `EVIDENCE.md`, and `SYNC.json`. Give workers
exact resources, retain immutable results, report unexpected changes,
and require human approval for consequential durable changes.

## Definition of done

{accepted} The package is understandable, tested, and documented; its
active behavior matches its documentation; and human users can inspect
state, evidence, limits, and verification without relying on hidden
agent memory.

## Current direction

{accepted} Keep the package small, explicit, and reviewable for human
users: six public umbrella skills with bounded ordered task recipes,
four reusable shared methods, focused local modules, bounded workers,
independent substantive review, and no automated workflow controller.

## Current state

{verified} Released v6.1.0 adds worker-only local literature search,
custom-compaction seams, expanded deterministic coverage, and generated
code documentation. The v6.1.1 patch candidate forwards the resolved
supervisor Pi Sych configuration directory to isolated workers without
replacing their Pi agent directory, so configured external literature
databases work in normal research dispatches. It also clears termination
timers when a worker errors without closing, declares the literature
surface in the public contract, makes native Node coverage a 90% gate,
and cleans deterministic temporary fixtures. Runtime source is 2,080
actual lines (2,100 rounded); package and lockfile are version 6.1.1.

## Previous action

{verified} Completed the v6.1.1 corrective pass after independent test
design and review. The full local gate passed with 125 unit and 12
integration tests, typecheck, style, dependency validation, 2,080/2,100
actual/rounded runtime lines, package dry run, Pages build, whitespace
checks, and thresholded coverage of 98.30% lines, 91.55% branches, and
94.44% functions.

## Immediate next step

{accepted} Commit and push v6.1.1 to main, confirm the remote
verification and coverage extraction succeed, then create and push the
final `v6.1.1` release tag. Do not approve node-pty scripts or run npm
audit remediation.
