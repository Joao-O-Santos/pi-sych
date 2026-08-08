import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	formatProjectStatusCheck,
} from "../../.test-build/workbench/src/project-status.js";

const fingerprint = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const project =
	"# Project\n## Objective\n## Current direction\n## Definition of done\n## Previous action\n## Immediate next step\n";
const artifact = (path, value, extra = {}) => ({
	path,
	fingerprint: fingerprint(value),
	status: "current",
	...extra,
});
async function setup(t, artifacts, contents = {}) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-additional-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), project);
	for (const [path, content] of Object.entries(contents)) {
		await mkdir(join(root, path, ".."), { recursive: true });
		await writeFile(join(root, path), content);
	}
	const sync = JSON.stringify({ version: 2, confirmedAt: "before", artifacts }, null, 2);
	await writeFile(join(root, "SYNC.json"), sync);
	return { root, sync };
}

test("status degrades explicitly for malformed or absent project state", async (t) => {
	await t.test("malformed SYNC", async () => {
		const root = await mkdtemp(join(tmpdir(), "pi-sych-status-malformed-"));
		t.after(() => rm(root, { recursive: true, force: true }));
		await writeFile(join(root, "SYNC.json"), "{");
		const state = await checkProjectStatus(root);
		assert.match(state.syncError, /SYNC\.json JSON is invalid/);
		assert.deepEqual(state.artifacts, []);
		assert.match(formatProjectStatusCheck(state), /State unavailable:/);
	});
	await t.test("absent SYNC and PROJECT", async () => {
		const root = await mkdtemp(join(tmpdir(), "pi-sych-status-absent-"));
		t.after(() => rm(root, { recursive: true, force: true }));
		const state = await checkProjectStatus(root);
		assert.equal(state.syncError, "SYNC.json is unavailable");
		assert.deepEqual(state.missingCore, ["PROJECT.md", "SYNC.json"]);
	});
	await t.test("invalid artifact manifest", async () => {
		const root = await mkdtemp(join(tmpdir(), "pi-sych-status-invalid-artifact-"));
		t.after(() => rm(root, { recursive: true, force: true }));
		await writeFile(join(root, "PROJECT.md"), project);
		await writeFile(
			join(root, "SYNC.json"),
			JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [null] }),
		);
		const state = await checkProjectStatus(root);
		assert.match(state.syncError, /artifacts\[0\] must be an object/);
		assert.deepEqual(state.artifacts, []);
	});
});

test("status traces transitive dependencies, converging origins, direct flags, and cycles", async (t) => {
	const { root } = await setup(
		t,
		[
			artifact("A.md", "old-a"),
			artifact("B.md", "old-b"),
			artifact("C.md", "c", { dependsOn: ["A.md", "B.md"] }),
			artifact("D.md", "d", { updateFrom: ["C.md"] }),
			artifact("Self.md", "self", { dependsOn: ["Self.md"] }),
			artifact("X.md", "x", { dependsOn: ["Y.md"] }),
			artifact("Y.md", "y", { dependsOn: ["X.md"] }),
		],
		{
			"A.md": "new-a",
			"B.md": "new-b",
			"C.md": "c",
			"D.md": "d",
			"Self.md": "self",
			"X.md": "x",
			"Y.md": "y",
		},
	);
	const state = await checkProjectStatus(root);
	assert.deepEqual(state.changed, ["A.md", "B.md"]);
	assert.deepEqual(state.impacted, [
		{ path: "C.md", from: ["A.md", "B.md"], direct: true },
		{ path: "D.md", from: ["A.md", "B.md"], direct: false },
	]);
	assert.deepEqual(state.cycles, [
		["Self.md", "Self.md"],
		["X.md", "Y.md", "X.md"],
	]);
});

test("formatter reports persisted statuses and pending proposals", async (t) => {
	const { root } = await setup(
		t,
		[
			artifact("stale.md", "stale", { status: "stale" }),
			artifact("review.md", "review", { status: "needs-review" }),
			artifact("conflict.md", "conflict", { status: "conflicted" }),
			artifact("gone.md", "gone", { status: "missing" }),
		],
		{ "stale.md": "stale", "review.md": "review", "conflict.md": "conflict", "gone.md": "gone" },
	);
	const output = formatProjectStatusCheck(await checkProjectStatus(root), 3, "memory/INBOX.md");
	assert.match(output, /Persisted as stale:\n- stale.md/);
	assert.match(output, /Persisted as needing review:\n- review.md/);
	assert.match(output, /Persisted as conflicted:\n- conflict.md/);
	assert.match(output, /Persisted as missing:\n- gone.md/);
	assert.match(output, /Pending memory proposals: 3\nReview: memory\/INBOX.md/);
});

test("acknowledgement rejection matrix leaves SYNC bytes unchanged", async (t) => {
	const cases = [
		{ name: "empty selection", files: [], reason: "review", error: /requires named files/ },
		{ name: "blank reason", files: ["A.md"], reason: "  ", error: /non-empty reason/ },
		{
			name: "escape path",
			files: ["../outside.md"],
			reason: "review",
			error: /leaves the project root/,
		},
		{ name: "untracked path", files: ["other.md"], reason: "review", error: /not tracked/ },
		{ name: "missing file", files: ["missing.md"], reason: "review", error: /file is missing/ },
		{
			name: "observation error",
			files: ["directory.md"],
			reason: "review",
			error: /cannot be observed/,
		},
	];
	for (const item of cases) {
		const { root, sync } = await setup(
			t,
			[
				artifact("A.md", "a"),
				artifact("missing.md", "missing"),
				artifact("directory.md", "directory"),
			],
			{ "A.md": "a" },
		);
		await mkdir(join(root, "directory.md"));
		await assert.rejects(
			acknowledgeProjectStatus(root, item.files, item.reason),
			item.error,
			item.name,
		);
		assert.equal(await readFile(join(root, "SYNC.json"), "utf8"), sync, item.name);
	}
});

test("acknowledgement records fixed, trimmed metadata for multiple files and marks downstream review", async (t) => {
	const { root } = await setup(
		t,
		[
			artifact("A.md", "old-a", { role: "source", retained: { value: true } }),
			artifact("B.md", "old-b", { custom: "keep" }),
			artifact("C.md", "c", { dependsOn: ["A.md", "B.md"], status: "stale", owner: "editor" }),
			artifact("D.md", "d", { dependsOn: ["C.md"], acknowledgement: { at: "old", reason: "old" } }),
		],
		{ "A.md": "new-a", "B.md": "new-b", "C.md": "c", "D.md": "d" },
	);
	const now = new Date("2025-01-02T03:04:05.000Z");
	const result = await acknowledgeProjectStatus(
		root,
		["A.md", "B.md"],
		"  reviewed together  ",
		now,
	);
	assert.deepEqual(result.needsReview, ["C.md", "D.md"]);
	assert.equal(result.at, now.toISOString());
	const saved = JSON.parse(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.equal(saved.confirmedAt, now.toISOString());
	assert.deepEqual(saved.artifacts[0], {
		...artifact("A.md", "new-a", { role: "source", retained: { value: true } }),
		acknowledgement: { at: now.toISOString(), reason: "reviewed together" },
	});
	assert.deepEqual(saved.artifacts[1], {
		...artifact("B.md", "new-b", { custom: "keep" }),
		acknowledgement: { at: now.toISOString(), reason: "reviewed together" },
	});
	assert.equal(saved.artifacts[2].status, "needs-review");
	assert.equal(saved.artifacts[2].owner, "editor");
	assert.equal(saved.artifacts[3].status, "needs-review");
	assert.deepEqual(saved.artifacts[3].acknowledgement, { at: "old", reason: "old" });
});
