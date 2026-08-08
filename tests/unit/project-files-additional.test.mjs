import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	parseSyncManifest,
	resolveProject,
	writeAtomicFile,
} from "../../.test-build/workbench/src/project-files.js";

const manifest = (overrides = {}) =>
	JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [], ...overrides });

test("SYNC parser rejects malformed roots, required fields, and canonical entries", () => {
	for (const [name, input, message] of [
		["invalid JSON", "{", /JSON is invalid/],
		["null root", "null", /must be an object/],
		["array root", "[]", /must be an object/],
		["wrong version", manifest({ version: 1 }), /version must be 2/],
		["missing confirmation", JSON.stringify({ version: 2, artifacts: [] }), /confirmedAt/],
		["non-string confirmation", manifest({ confirmedAt: 1 }), /confirmedAt/],
		["missing artifacts", JSON.stringify({ version: 2, confirmedAt: "now" }), /artifacts/],
		["non-array artifacts", manifest({ artifacts: {} }), /artifacts/],
		["non-string root", manifest({ projectRoot: 1 }), /projectRoot/],
		["canonical array", manifest({ canonical: [] }), /canonical must be an object/],
		["unknown canonical role", manifest({ canonical: { other: "X.md" } }), /not allowed: other/],
		["empty canonical path", manifest({ canonical: { project: "" } }), /non-empty string/],
		["non-string canonical path", manifest({ canonical: { project: 1 } }), /non-empty string/],
	])
		assert.throws(() => parseSyncManifest(input), message, name);

	assert.deepEqual(
		parseSyncManifest(manifest({ canonical: { project: "state/PROJECT.md" } })).canonical,
		{
			project: "state/PROJECT.md",
		},
	);
});

test("project resolution starts from a file, refuses a nearer malformed manifest, and falls back without one", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-files-additional-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const nested = join(root, "nested");
	await mkdir(nested);
	await writeFile(join(root, "SYNC.json"), manifest());
	await writeFile(join(root, "from-file.md"), "file");
	assert.equal((await resolveProject(join(root, "from-file.md"))).projectRoot, root);

	await writeFile(join(nested, "SYNC.json"), "{");
	await assert.rejects(resolveProject(nested), /SYNC.json JSON is invalid/);

	const noManifest = await mkdtemp(join(tmpdir(), "pi-sych-no-manifest-"));
	t.after(() => rm(noManifest, { recursive: true, force: true }));
	const fallback = await resolveProject(noManifest);
	assert.equal(fallback.workspaceRoot, noManifest);
	assert.equal(fallback.projectRoot, noManifest);
	assert.equal(fallback.manifest, undefined);
});

test("atomic writes create nested parents, replace files, and remove temporary files after rename failure", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-atomic-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const target = join(root, "nested", "state.txt");
	await writeAtomicFile(target, "first");
	assert.equal(await readFile(target, "utf8"), "first");
	await writeAtomicFile(target, "replacement");
	assert.equal(await readFile(target, "utf8"), "replacement");

	const blocked = join(root, "nested", "blocked");
	await mkdir(blocked);
	await assert.rejects(writeAtomicFile(blocked, "never"));
	assert.equal((await stat(blocked)).isDirectory(), true);
	assert.deepEqual(
		(await readdir(join(root, "nested"))).filter(
			(name) => name.startsWith(".blocked.") && name.endsWith(".tmp"),
		),
		[],
	);
});
