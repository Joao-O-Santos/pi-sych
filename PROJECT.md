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

{verified} v6.1.1 is the current signed, tagged, and published release.
It forwards the resolved supervisor Pi Sych configuration directory to
isolated workers without replacing their Pi agent directory, so
configured external literature databases work in normal research
dispatches. It also clears termination timers when a worker errors
without closing, declares the literature surface in the public contract,
makes native Node coverage a 90% gate, and cleans deterministic
temporary fixtures. Runtime source is 2,080 actual lines (2,100
rounded); package, lockfile, Git tag, and npm `latest` are version
6.1.1.

## Previous action

{verified} Released v6.1.1 from signed commit `cd96e5ba` through signed
tag `v6.1.1`. The main pipeline and tag pipeline passed; GitLab
extracted 98.3% line coverage, Pages succeeded, trusted npm publication
succeeded, and npm `latest` resolves to 6.1.1.

## Immediate next step

{accepted} Keep main at the released v6.1.1 state until the owner
selects further work. Do not approve node-pty scripts, run npm audit
remediation, or perform another release without explicit instruction.
