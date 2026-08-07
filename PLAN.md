The latest is substantially better. I reviewed current `main` at `b847c4c586192dcb963e48f65bfb5f9369df0c9a`, including the corrective commits after my last review.

The **three previous blockers are genuinely fixed**. I would not call the current head release-clean yet, though: I found **two code issues, one likely CI failure, and a release-state/version problem**.

## What is now fixed correctly

The status model now does what we intended. Artifact observation failures are collected in `errors`, displayed under `Unable to observe:`, and prevent the false “All tracked files match” message. Missing artifacts again participate in dependency impact.

The corresponding tests were added for both observation errors and missing→dependent propagation.

The compaction issue is also fixed correctly: an untracked file now has to pass `resolveExistingProjectPath()` rather than merely being lexically project-local.

Windows path checking is cleaner and correct in principle now:

```ts
posix.isAbsolute(value) ||
win32.isAbsolute(value) ||
value.split(/[\\/]/).includes("..")
```

That is exactly the sort of small cross-platform lexical check I wanted.

The modernization also actually started happening: `crypto.hash()`, `import.meta.dirname`, `Static<typeof schema>`, `await using` for result files, removal of redundant context access/copying, and shared worker-result schema.

So the corrective pass was worthwhile.

---

# Findings

## 1. P0 — the new observation-error test is environment-dependent and likely breaks GitLab CI

The new test makes a file unreadable with:

```js
await chmod(join(root, "A.md"), 0);
```

and then requires the observation to be `"error"` with a permission/EACCES message.

That isn't portable across privilege levels. Your GitLab job uses:

```yaml
image: node:26-bookworm
```

and does not select a non-root user.

The official Node Docker guidance explicitly notes that Docker commands run as root by default unless the image is run using the provided `node` user. ([GitHub][1]) Root can read a mode-000 file, so the expected EACCES is not a reliable fixture.

I would make the test deterministic instead. For example, create a **directory** at the tracked artifact path. `access()` succeeds, then `readFile()` fails with `EISDIR`, which exercises exactly the `observation: "error"` branch without relying on permissions.

This isn't a production-code flaw; it is a release-gate flaw.

**Fix before relying on the 65-test claim in CI.**

---

## 2. P0/P1 — `PI_SYCH_PACKAGE_ROOT` modernization introduced an off-by-one directory bug

This is currently:

```ts
export const PI_SYCH_PACKAGE_ROOT = resolve(
    process.env.PI_PACKAGE_DIR ?? resolve(dirname(import.meta.dirname), "../../.."),
);
```

For:

```text
/package/extensions/workbench/src/worker-engine.ts
```

`import.meta.dirname` is:

```text
/package/extensions/workbench/src
```

The old code effectively started there and climbed three levels:

```text
src
→ workbench
→ extensions
→ package
```

Correct.

The new code first does `dirname(import.meta.dirname)`:

```text
/package/extensions/workbench
```

and **then** climbs three:

```text
workbench
→ extensions
→ package
→ parent-of-package
```

So the fallback should simply be:

```ts
resolve(import.meta.dirname, "../../..")
```

not:

```ts
resolve(dirname(import.meta.dirname), "../../..")
```

Normal supervisor use may mask this because `dispatchWorker()` is ordinarily given an explicit `packageRoot`, but the exported/default fallback is now wrong.

This is exactly the sort of tiny modernization regression worth adding a one-line path assertion for.

---

## 3. P1 — `writeAtomicFile()` disposes the handle after the rename, not before it

Current code:

```ts
try {
    await using handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(content);
    await handle.sync();
    await rename(temporary, path);
} catch ...
```

`await using` disposes at the **end of its scope**. Node's async disposal calls `FileHandle.close()`. ([Node.js][2])

Therefore the actual sequence is:

```text
open
write
sync
rename
close
```

whereas the intended atomic-writer sequence was:

```text
open
write
sync
close
rename
```

On Unix, renaming an open file is normal. I would not call this a demonstrated runtime failure. But since we're explicitly aiming for clean cross-platform semantics, there's no reason to depend on open-handle rename behavior.

Use a nested scope:

```ts
try {
    {
        await using handle = await open(temporary, "wx", 0o600);
        await handle.writeFile(content);
        await handle.sync();
    }

    await rename(temporary, path);
} catch ...
```

That's still concise and gives the intended resource ordering.

`writeImmutableResult()` does not have this issue because nothing needs to happen after the result handle closes.

---

## 4. P0 release-state issue — current `main` is no longer the tagged `v6.0.1`

This now needs sorting out before publication.

The package says:

```json
"version": "6.0.1"
```

And a signed `v6.0.1` tag already exists, pointing to commit:

```text
16aaa5a...
```

But current `main` is:

```text
b847c4c...
```

which came **after** that tag and replaces the four packaged documentation PNGs.

Since `docs` is included in the npm package, current `main` and the immutable `v6.0.1` release tree no longer describe the same `6.0.1` package.

I would **not move the signed tag**.

Given that the corrected images should presumably stay, the clean solution is now:

```text
6.0.2
```

for the tiny final corrective release containing:

* the diagram fixes;
* package-root fallback correction;
* atomic-writer scope correction;
* deterministic status-error test;
* any remaining tiny review fixes.

Then tag `v6.0.2` only after the gate.

---

## 5. The durable state is consequently stale again

`PROJECT.md` currently calls the work “unreleased `6.0.0`”, says `v6.0.0` was tagged, and says the next step is:

> “tag and publish `v6.0.0`”

But:

* `package.json` is 6.0.1;
* a signed `v6.0.1` tag already exists;
* current main is newer still.

The changelog likewise says both:

```text
v6.0.1 - Unreleased
v6.0.0 - Unreleased
```

despite both tags existing.

E-030 is still titled a **v6.0.0** corrective pass even though the corrections were ultimately versioned as 6.0.1.

And `SYNC.json`'s PROJECT/EVIDENCE acknowledgements say 6.0.1, while some other tracked acknowledgements/fingerprints remain older.

For this project specifically, I consider that release-significant because these files are supposed to be the antidote to conversational/version-state ambiguity.

Fix them **after** settling on 6.0.2, not before.

---

## 6. P1 — the new diagram generator has two problems

The latest commit adds:

```text
scripts/generate-architecture-images.mjs
```

which imports:

```js
import { Resvg } from "@resvg/resvg-js";
```

But `@resvg/resvg-js` is in neither `package.json` nor the root lockfile dependencies.

So a clean:

```bash
npm ci
node scripts/generate-architecture-images.mjs
```

cannot reproduce the checked-in diagrams.

Given the minimalism goal, I actually prefer **deleting this generator** after producing the final PNGs rather than adding a permanent graphics dependency, unless reproducible diagram generation is something you genuinely want to maintain.

There is also a direct geometry bug in the generator.

Three diagrams have:

```text
viewBox height = 600
lower box y = 440
box height = 180 or 200
```

meaning their lower bounds are:

```text
620
640
620
```

outside the 600px canvas.

So the new “fix broken architecture diagrams” script itself generates lower boxes that extend beyond the SVG viewport.

Either move `y2` upward or increase the height. If this script is just a one-off, fix the images and delete the script.

---

## 7. The corrective behavior still lacks two of the targeted regression tests

The implementation of compaction is now correct, but the test suite still does not appear to assert the exact three-way behavior:

```text
existing untracked project file → retain
nonexistent project-local file  → discard
outside-project file            → discard
```

The code should pass those now because it uses `resolveExistingProjectPath()`.  But this was one of the specific regressions we wanted captured.

Similarly, Windows validation now uses `win32.isAbsolute()` correctly, but the config test still tests UNC and drive paths without the exact case that originally exposed the hole:

```text
\worker
```

These are cheap tests and worth adding.

---

## 8. Coverage should be run as part of this review gate

The current `make verify` runs:

```text
typecheck
style
dependencies
budget
test
pack
git diff --check
```

but not coverage.

E-030 records 65 passing tests and the other gates, but not a fresh coverage result.

Given that this pass specifically changed branches in status, compaction, path validation, resource disposal and worker paths, I would run:

```bash
npm run test:coverage
```

before declaring the corrective release reviewed.

I wouldn't necessarily put coverage into every `make verify` if you deliberately want the normal gate faster, but I would include it in this release gate.

---

## 9. There is still easy runtime-code headroom available

The runtime budget remains:

```text
2000 / 2000
```

Yet `dispatchWorker()` still has:

```ts
const runtime = await mkdtemp(...);

try {
    ...
} finally {
    await rm(runtime, { recursive: true, force: true });
}
```

Node 26 has stable `mkdtempDisposable()`, designed specifically for:

```ts
await using runtime = await mkdtempDisposable(...);
```

([Node.js][2])

That should delete the outer worker `try/finally` and give genuine source-budget headroom.

Unlike the atomic-file case, this one is very straightforward.

The budget checker also still has its handwritten recursive filesystem walker.  That's development code rather than runtime budget itself, so lower priority, but modern Node can simplify it too.

I would like to see the final runtime come in somewhere below 2,000 rather than exactly landing on the ceiling.

---

## 10. `PLAN.md` should probably disappear when this is done

Current `PLAN.md` is essentially my entire previous review pasted verbatim into the repository, including statements such as:

> “Current head is `7545a407…`”

which is already stale.

It served its purpose as an implementation artifact.

Once the final corrective pass is complete, I would remove it rather than make a transient code-review transcript part of the long-term repository. That matches the earlier cleanup principle of retaining durable project truth rather than completed plans and conversational history.

---

# Overall assessment

This revision is **meaningfully better than the one I reviewed before**. The actual architecture is still sound, and the important v6 behavioral corrections are now implemented properly:

* four-state artifact observation: good;
* missing dependency impact: restored;
* unchanged acknowledgement behavior: good;
* worker failure precedence: good;
* active untracked compaction path: good;
* shared Pi config/skill root: good;
* Windows lexical validation: good;
* schema-derived worker types: good;
* `crypto.hash()` and resource disposal: moving in the right direction.

I would do **one very small 6.0.2 pass**, with no architecture changes:

1. Fix `PI_SYCH_PACKAGE_ROOT` to use `resolve(import.meta.dirname, "../../..")`.
2. End the atomic-file `await using` scope before `rename()`.
3. Replace the chmod-based observation-error test with a deterministic filesystem-error fixture.
4. Add the missing compaction and `\root-relative` regression cases.
5. Use `mkdtempDisposable()` for worker runtime cleanup.
6. Fix the diagram dimensions; then preferably delete the one-off generator, or formally declare its dependency if you want to keep it.
7. Run full tests **and coverage**.
8. Bump to 6.0.2 and update CHANGELOG/PROJECT/EVIDENCE/SYNC coherently.
9. Delete stale `PLAN.md`.
10. Tag `v6.0.2`; do not move either existing signed tag.

After that, I think you're at the point where further production-code refactoring is much more likely to be churn than useful simplification.

[1]: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md?utm_source=chatgpt.com "docker-node/docs/BestPractices.md at main · nodejs/docker-node · GitHub"
[2]: https://nodejs.org/api/all.html?utm_source=chatgpt.com "All | Node.js v26.5.0 Documentation"

