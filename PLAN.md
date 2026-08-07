Yes. I compared the current `main` against the v5.0.4 baseline we reviewed. Current head is `7545a407…`; the substantive v6 implementation is `0ae415e8…`, followed by the project-state/evidence update.

The broad direction is good, and several important fixes landed correctly. I would **not tag v6.0.0 yet**, though. I found three real correctness issues plus a handful of incomplete simplifications.

### The important fixes that are correct

The shared Pi-root work is basically the right architecture now. `piConfigRoot()` owns project `.pi` → `PI_CODING_AGENT_DIR` → XDG → `~/.config/pi` → `~/.pi`, and both Pi Sych config and skill locations derive from it. That is much better than duplicating environment/home logic in the worker.

The acknowledgement bug is also fixed correctly. `actuallyChanged` is now derived from the observation state, so acknowledging an unchanged A does not invalidate B, while changed A still does. There is an explicit regression test for both cases.

Worker failure precedence is fixed in the right direction: abnormal launch results return before `result.json` is read. So a timeout no longer gets masked by an `ENOENT`. The redundant process-warning presentation was removed too.

Project discovery now reads `SYNC.json` directly and walks upward only on `ENOENT`/`ENOTDIR`, while malformed state fails. Startup also no longer swallows project-resolution errors. Good fail-fast behavior.

The model-catalog consolidation, MCPorter preflight deletion, Plannotator helper cleanup, Node 26 floor, `latest` tooling and `ESNext` target are all sensible.

## 1. Blocker: observation errors are still effectively hidden

The new state model itself is good:

```ts
current | changed | missing | error
```

But `ProjectStatusCheck` only exposes top-level `changed` and `missing`. An artifact whose observation is `"error"` stays buried inside `artifacts`. More seriously, `formatProjectStatusCheck()` doesn't print observation errors at all.

That means this situation:

```text
tracked A.md
permission/I/O failure reading A.md
```

can produce:

```text
All tracked files match their recorded hashes.
```

because the success condition only checks:

```text
changed
missing
missingCore
projectErrors
```

and none of those contains artifact observation failures.

That contradicts the point of introducing the fourth state.

I would make this extremely small. Add something like:

```ts
errors: Array<{ path: string; message: string }>
```

derived from `"error"` observations, print an `Errors:`/`Unable to observe:` section, and include `!state.errors.length` in the all-clear condition.

The current tests cover missing-vs-changed but not an artifact observation error, which is probably why this escaped.

**Priority: P0.**

## 2. Blocker: missing artifacts stopped propagating dependency impact

This looks accidental.

Before v6, dependency impact was calculated from:

```ts
[...changed, ...missing]
```

The new implementation does:

```ts
impacted: impacts(manifest.artifacts, changed)
```

So if:

```text
B depends on A
A is deleted
```

Pi Sych now reports A as missing but no longer reports B as impacted.

Deletion/absence is exactly the sort of mechanical change dependency propagation should detect. No semantic judgment is involved.

The fix is probably literally:

```ts
impacted: impacts(manifest.artifacts, [...changed, ...missing])
```

I would **not** automatically propagate observation errors as impact, because an observation error does not establish changed content. Report the error loudly instead.

The missing-artifact test doesn't give the missing artifact a dependent, so it doesn't catch this regression.

**Priority: P0.**

## 3. Blocker-ish: compaction does not actually require an untracked file to exist

The intended fix was:

> preserve an active untracked file if it is an existing project-local file.

The implementation currently does:

```ts
try {
    resolveProjectPath(project.projectRoot, file);
    return true;
} catch {
    return false;
}
```

That proves only that the string is lexically project-local.

So these both survive:

```text
src/real-new-file.ts
src/completely-invented-file-that-does-not-exist.ts
```

That is contrary to both the plan and the commit message, which says “active existing untracked files.”

Use `resolveExistingProjectPath()`, not `resolveProjectPath()`.

Because existence checking is asynchronous, don't force it into `.filter()`. A boring loop is clearer:

```ts
const files: string[] = [];

for (const file of output.workingMemory.files) {
    if (allowed.has(file)) {
        files.push(file);
        continue;
    }

    try {
        await resolveExistingProjectPath(project.projectRoot, file);
        files.push(file);
    } catch {
        // not an existing project-local file
    }
}
```

No additional abstraction needed.

And add exactly the tests from the plan:

```text
existing untracked → retained
nonexistent local → removed
outside project → removed
```

The current compaction tests don't test this behavior.

**Priority: P0/P1.**

## 4. The modern-Node simplification pass was largely not implemented

This surprised me.

The project now requires Node >=26 and targets ESNext, which is good.

But much of the reason we agreed to raise the baseline was to delete lifecycle machinery. The current code still has:

* `mkdtemp()` + `try/finally` + recursive `rm()` for workers;
* manual `FileHandle | undefined` cleanup in atomic writes;
* manual `try/finally` handle closing for immutable worker results;
* `fileURLToPath(import.meta.url)` boilerplate;
* `createHash().update().digest()`;
* a hand-written recursive source-tree walker;
* manual `DispatchRequest` and `WorkerResult` interfaces alongside TypeBox schemas;
* the redundant `access()` immediately after `resolveExistingProjectPath()`;
* an unnecessary `const files = [...request.contextFiles]`.

Node 26 definitely provides `fsPromises.mkdtempDisposable()` and stable `FileHandle[Symbol.asyncDispose]`, so the `await using` simplifications we discussed are available under the project's new minimum. ([Node.js][1])

Current TypeBox also directly supports deriving static types with `Type.Static<typeof schema>`, so the duplicated request/result type declarations can genuinely disappear. ([GitHub][2])

I would therefore do this **after the three correctness fixes**, because it should give you source-budget headroom instead of consuming it.

## 5. Cross-platform config validation has one Windows hole

The new checks correctly catch:

```text
/absolute
C:\absolute
\\server\share
..\escape
foo\..\escape
```

and there are tests for most of these.

But a Windows root-relative path can be:

```text
\foo
```

A single leading backslash is rooted on the current Windows drive. The current code only rejects two leading backslashes (`\\`) for UNC.

So `\foo` can pass `configString()`.

Rather than expand the regex collection, this is a good place to simplify:

```ts
import { posix, win32 } from "node:path";

if (
    ...
    posix.isAbsolute(value) ||
    win32.isAbsolute(value) ||
    value.split(/[\\/]/).includes("..")
)
```

Still purely lexical. Still no `realpath()`. Still no symlink restriction.

**Priority: P1.**

## 6. The source budget is at the ceiling, but the intended slimming didn't really happen

The checker now correctly includes the worker bootstrap, which I agree with. But it still contains its custom recursive walker, and it still prints:

> `Estimated production TypeScript`

even though it now counts an `.mjs` file.

More importantly, the project records **exactly 2000/2000**.

That's not much headroom, and some prompt strings have been compressed fairly aggressively while most of the actual modern-runtime deletion opportunities remain untouched.

I would rename the metric to something like:

```text
runtime source
```

and use the modern Node simplifications above to get comfortably below the cap—ideally 1850–1950 rather than exactly 2000.

The budget should constrain architecture, not force sentence packing.

## 7. Durable project state has already gone stale again

This one is particularly ironic given Pi Sych's philosophy.

The latest `PROJECT.md` says:

> “Evidence and synchronization need updating.”

But the latest commit is specifically the commit that updated `EVIDENCE.md` and `SYNC.json`.

It also says:

> “No … image replacement has occurred”

and E-029 repeats that claim.

But the implementation commit explicitly says it replaced the architecture/workflow diagrams, and the diff includes the PNG replacements.

So those claims are false.

There is also a terminology mismatch: `PROJECT.md` says “Production TypeScript is exactly 2,000 lines,” whereas the budget now includes the JavaScript worker bootstrap.

These are easy edits, but I would fix them before release because authoritative state being demonstrably wrong is worse for Pi Sych than it would be for an ordinary package.

---

### What I would do next

I think this needs **one small corrective pass, not another refactor**:

1. Surface artifact observation errors and prevent false all-clear status.
2. Restore dependency impact for missing artifacts.
3. Require active untracked compaction files actually to exist.
4. Fix Windows `\root-relative` config paths.
5. Add the four focused regression tests.
6. Then use Node 26/TypeBox features to delete the still-manual lifecycle/type duplication until there's meaningful budget headroom.
7. Finally correct `PROJECT.md`, E-029 and `SYNC.json` after the independent review.

I would leave the graph code, MCPorter, Plannotator argument behavior, model-catalog fail-fast semantics, two-tool architecture, symlink behavior, and overall v6 design alone.

So the result is **quite close**, and the two concerns you originally cared most about—worker failure masking and unchanged acknowledgements—were addressed well. But the status error presentation and missing-dependency regression are release blockers in my view, and the simplification portion of the plan is only partially complete.

[1]: https://nodejs.org/api/fs.html?utm_source=chatgpt.com "File system | Node.js v26.5.1 Documentation"
[2]: https://github.com/sinclairzx81/typebox?utm_source=chatgpt.com "GitHub - sinclairzx81/typebox: JSON Schema Type Builder with Static Type Resolution for TypeScript · GitHub"

