# Reuse and Code-Reduction Plan

## Objective

Reduce duplicated Pi Sych implementation while preserving its public tools,
human-review boundaries, mechanical validation, and approved working-memory
behavior. Prefer Pi's public APIs and existing local helpers; do not add a
workflow controller, tool, command, or dependency merely to reduce lines.

## Findings

### Reuse now

1. Use Pi's discriminated `getApiKeyAndHeaders()` result directly in
   `compaction.ts`; remove the local auth-shape cast.
2. Share the project-status snapshot/count/format sequence currently
   duplicated by `project_status` and `/pi-sych-status`.
3. Derive `dispatch_worker` TypeBox mode and timeout bounds from exported
   worker-engine constants.
4. Factor project-root containment checking within `project-files.ts` while
   preserving lexical and `realpath` symlink checks.
5. Factor record guards and configurable JSON-fence parsing only where exact
   syntax/error behavior remains covered by tests.

### Investigate with characterization tests first

1. Make the TypeBox `dispatch_worker` schema the shared structural contract,
   retaining explicit normalization, path checks, and accepted diagnostics.
2. Use narrowly scoped TypeBox schemas for compaction model output, retaining
   all semantic limits and canonical/inbox checks.
3. Evaluate the `SYNC.md` parser only after snapshotting its compatibility and
   diagnostics; do not convert it if the net implementation grows or behavior
   becomes less clear.

### Native Pi assessment

Pi's compaction hook, session-context builder, message conversion,
serialization, model registry, auth resolution, cancellation, and usage
accounting are already the correct reuse boundary. Pi's `compact()` and
`generateSummaryWithUsage()` have a fixed summary contract and cannot emit the
approved one-call working-memory plus promotion JSON; retain `complete()`.

## Sequence

1. Add or extend characterization tests for dispatch validation, status output,
   project path boundaries, compaction authentication, fences, and model output.
2. Apply the low-risk local reductions and run unit tests after each group.
3. Convert dispatch and compaction structural schemas only if tests show the
   exact accepted/rejected behavior and normalization are preserved.
4. Measure production TypeScript before and after; retain the owner-authorized
   2,500-line cap and report actual reduction.
5. Update architecture/development documentation only for true runtime or
   validation-contract changes.
6. Run formatter, typecheck, unit/integration/usage tests, source budget,
   smoke/package checks as applicable, and an independent read-only review.

## Non-goals

- No new public tools, commands, extensions, dependencies, or autonomous
  workflow behavior.
- No replacement of semantic/human promotion review with automatic writes.
- No broad rewrite of `SYNC.md` parsing absent demonstrated net simplification.
- No commit, tag, push, publication, or release.

## Acceptance criteria

- Public runtime surface remains `dispatch_worker`, `project_status`, and
  optional `submit_plan`.
- All existing behavior tests pass; new tests cover any extracted contracts.
- Pi APIs replace local duplication only where behavior is unchanged.
- Production TypeScript decreases or a retained custom boundary is explicitly
  justified in the final review.
- Final verification is recorded without claiming unrun checks.
