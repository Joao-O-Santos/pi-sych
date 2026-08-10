import assert from "node:assert/strict";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	parseSyncManifest,
	resolveConfiguredPath,
	resolveExistingProjectPath,
	resolveProject,
	resolveProjectPath,
	validateProjectMarkdown,
} from "../../.test-build/workbench/src/project-files.js";

const manifest = (overrides = {}) =>
	JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [], ...overrides });
test("manifest validates required project mechanics but permits metadata", () => {
	assert.equal(parseSyncManifest(manifest({ extra: true })).version, 2);
	assert.throws(() => parseSyncManifest(manifest({ version: 1 })), /version/);
	assert.throws(() => parseSyncManifest(manifest({ artifacts: {} })), /artifacts/);
	assert.throws(() => resolveProjectPath("/project", "../outside"), /leaves/);
});
test("resolver uses nearest manifest and configured root", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-files-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "SYNC.json"),
		manifest({ projectRoot: "work", canonical: { project: "state/PROJECT.md" } }),
	);
	const project = await resolveProject(root);
	assert.match(project.projectRoot, /work$/);
	assert.match(project.canonical.project, /work\/state\/PROJECT\.md$/);
});
test("project-local symlinks and configured external paths remain usable", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-symlink-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const outside = join(tmpdir(), `pi-sych-outside-${Date.now()}.md`);
	t.after(() => rm(outside, { force: true }));
	const link = join(root, "escape.md");
	await writeFile(outside, "outside");
	await symlink(outside, link);
	assert.equal(await resolveExistingProjectPath(root, "escape.md"), link);
	assert.equal(await resolveConfiguredPath(link), link);
});

test("PROJECT markdown remains shallowly validated", () => {
	assert.equal(validateProjectMarkdown("# Project\n\n## Objective").valid, false);
});
