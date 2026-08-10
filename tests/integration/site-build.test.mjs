import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);

async function make(args, env = {}) {
	return run("make", args, { cwd: process.cwd(), env: { ...process.env, ...env } });
}

test("Make stages a complete site, removes stale output, and fails before deployment", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-pandoc-"));
	const renderer = join(root, "pandoc");
	await writeFile(
		renderer,
		`#!/bin/sh
if [ "${"$"}{FAKE_PANDOC_FAIL:-}" = 1 ]; then exit 9; fi
while [ "$#" -gt 0 ]; do
  if [ "$1" = --output ]; then output="$2"; shift 2; continue; fi
  if [ "$1" = --template ]; then test -f "$2" || exit 8; shift 2; continue; fi
  input="$1"; shift
done
printf '<!doctype html><main id="content"></main>' > "$output"
`,
	);
	await chmod(renderer, 0o755);
	await rm("public", { recursive: true, force: true });
	await mkdir("public");
	await writeFile("public/stale.html", "stale");
	try {
		await make([`PANDOC=${renderer}`]);
		await assert.rejects(() =>
			import("node:fs/promises").then(({ stat }) => stat("public/stale.html")),
		);
		await make([`PANDOC=${renderer}`], { FAKE_PANDOC_FAIL: "1" }).then(
			() => assert.fail("renderer failure should fail Make"),
			() => undefined,
		);
		await assert.doesNotReject(() =>
			import("node:fs/promises").then(({ stat }) => stat("public/index.html")),
		);
		await assert.doesNotReject(() =>
			import("node:fs/promises").then(({ stat }) => stat("public/styles.css")),
		);
		await assert.rejects(() =>
			import("node:fs/promises").then(({ stat }) => stat("public/page.html")),
		);
		await assert.rejects(
			() => make([`PANDOC=${renderer}`, "SITE_PAGES=missing.md missing"]),
			/Missing site input/,
		);
		await assert.rejects(() => make([`PANDOC=${renderer}`, "TEMPLATES_DIR=missing-template"]));
	} finally {
		await rm("public", { recursive: true, force: true });
		await rm(".site-stage", { recursive: true, force: true });
		await rm(root, { recursive: true, force: true });
	}
});
