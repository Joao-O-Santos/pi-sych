# Project

## Objective

[accepted] Maintain Pi Sych as a small, reviewable Pi package for serious writing, research, analysis, and code projects.

## Audience and use

[accepted] Scientific writers, researchers, and maintainers who want explicit project state, bounded delegation, truthful verification, and human-owned consequential decisions.

## Intended contribution

[accepted] Pi Sych keeps project state and evidence visible, reports drift without silently choosing a winner, and supports bounded workers without claiming that generated prose or automated checks replace human judgment.

## Deliverables

[accepted] The public package, its tests, baseline skills, concise human-facing documentation, and private local configuration outside this repository.

## Constraints

[accepted] Do not expose credentials, add a fixed workflow controller, make sandbox or pseudo-security claims, push or publish without instruction, or let model output stand in for evidence, citations, verification, or final review.

## Project rules and preferences

[accepted] Prefer direct and minimal implementations. Keep durable state explicit in `PROJECT.md`, `EVIDENCE.md`, and `SYNC.md`. Give workers exact resources, retain immutable results, report unexpected changes, and require human approval for consequential durable changes.

## Definition of done

[accepted] The package is understandable, tested, and documented; its active behavior matches its documentation; and human users can inspect state, evidence, limits, and verification without relying on hidden agent memory.

## Current direction

[accepted] Keep the package small, explicit, and reviewable for human users rather than expanding historical scaffolding or automated workflow machinery.

## Current state

[verified] The package has a minimal supervisor with `dispatch_worker` and `project_status`, a separately bootstrapped worker extension, graph-aware project state, optional remote research through MCPorter, retained Plannotator annotation/review adapters, semantic workflow skills, and deterministic acceptance checks. The counted production TypeScript is kept to a rough estimate below 2,000 lines.

## Immediate next step

[accepted] Keep the package small. The minimal-architecture refactor is implemented; next maintain the major-release documentation, run opt-in real-Pi usage checks when valuable, and add behavior only when it serves a real user need and can be explained, reviewed, and verified.