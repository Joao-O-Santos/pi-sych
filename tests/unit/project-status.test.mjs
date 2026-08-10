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
	parseProjectStatusManifest,
	verifyAcknowledgementObservation,
} from "../../.test-build/workbench/src/project-status.js";

const hash = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const project =
	"# Project\n## Objective\n## Current direction\n## Definition of done\n## Previous action\n## Immediate next step\n";
test("dependency arrays retain clear validation and object entries", () => {
	const manifest = {
		version: 2,
		confirmedAt: "now",
		artifacts: [
			{
				path: "B.md",
				fingerprint: hash("b"),
				status: "current",
				dependsOn: [{ path: "A.md", reason: "input" }],
			},
		],
	};
	assert.deepEqual(parseProjectStatusManifest(manifest).artifacts[0].dependsOn, [
		{ path: "A.md", reason: "input" },
	]);
	assert.throws(
		() =>
			parseProjectStatusManifest({
				...manifest,
				artifacts: [{ ...manifest.artifacts[0], dependsOn: {} }],
			}),
		/artifacts\[0\]\.dependsOn must be an array/,
	);
	assert.throws(
		() =>
			parseProjectStatusManifest({
				...manifest,
				artifacts: [{ ...manifest.artifacts[0], updateFrom: {} }],
			}),
		/artifacts\[0\]\.updateFrom must be an array/,
	);
});
test("status exposes missing core files and project validation problems", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-errors-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), "# Project\n\n## Objective\nIncomplete\n");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	const state = await checkProjectStatus(root);
	assert.deepEqual(state.missingCore, []);
	assert.ok(state.projectErrors.length > 0);
	assert.match(formatProjectStatusCheck(state), /Project-file problems:/);
});
test("status distinguishes missing observations from changed files", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-missing-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [{ path: "missing.md", fingerprint: hash("missing"), status: "current" }],
		}),
	);
	const state = await checkProjectStatus(root);
	assert.equal(state.artifacts[0].observation.state, "missing");
	assert.deepEqual(state.missing, ["missing.md"]);
	assert.doesNotMatch(formatProjectStatusCheck(state), /Changed:/);
});
test("status surfaces observation errors and prevents false all-clear", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-error-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(join(root, "A.md"), "a");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [{ path: "A.md", fingerprint: hash("a"), status: "current" }],
		}),
	);
	// Create a directory at the tracked path: readFile() will fail with EISDIR
	await rm(join(root, "A.md"));
	await mkdir(join(root, "A.md"));
	const state = await checkProjectStatus(root);
	assert.equal(state.artifacts[0].observation.state, "error");
	assert.equal(state.errors.length, 1);
	assert.equal(state.errors[0].path, "A.md");
	assert.match(state.errors[0].message, /EISDIR/);
	assert.match(formatProjectStatusCheck(state), /Unable to observe:/);
	assert.doesNotMatch(formatProjectStatusCheck(state), /All tracked files match/);
});
test("missing artifacts propagate dependency impact", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-impact-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(join(root, "B.md"), "b"); // B.md exists on disk
	// A.md is tracked but missing; B.md depends on A.md
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [
				{ path: "A.md", fingerprint: hash("a"), status: "current" },
				{ path: "B.md", fingerprint: hash("b"), status: "current", dependsOn: ["A.md"] },
			],
		}),
	);
	const state = await checkProjectStatus(root);
	assert.deepEqual(state.missing, ["A.md"]);
	assert.equal(state.impacted.length, 1);
	assert.equal(state.impacted[0].path, "B.md");
	assert.deepEqual(state.impacted[0].from, ["A.md"]);
});
test("acknowledgement recheck rejects content changed after the status read", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-race-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(join(root, "A.md"), "before");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [{ path: "A.md", fingerprint: hash("before"), status: "current" }],
		}),
	);
	const state = await checkProjectStatus(root);
	await writeFile(join(root, "A.md"), "after");
	await assert.rejects(
		verifyAcknowledgementObservation(state, new Set(["A.md"])),
		/changed during review/,
	);
});
test("status fingerprints files and traverses declared dependencies", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(join(root, "A.md"), "a");
	await writeFile(join(root, "B.md"), "b");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [
				{ path: "A.md", fingerprint: hash("old"), status: "current" },
				{ path: "B.md", fingerprint: hash("b"), status: "current", dependsOn: ["A.md"] },
			],
		}),
	);
	const state = await checkProjectStatus(root);
	assert.deepEqual(state.changed, ["A.md"]);
	assert.deepEqual(
		state.impacted.map((item) => item.path),
		["B.md"],
	);
	await acknowledgeProjectStatus(root, ["A.md"], "reviewed");
	const saved = JSON.parse(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.equal(saved.artifacts[0].fingerprint, hash("a"));
	assert.equal(saved.artifacts[1].status, "needs-review");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [
				{ path: "A.md", fingerprint: hash("a"), status: "current" },
				{ path: "B.md", fingerprint: hash("b"), status: "current", dependsOn: ["A.md"] },
			],
		}),
	);
	await acknowledgeProjectStatus(root, ["A.md"], "unchanged review");
	const unchanged = JSON.parse(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.equal(unchanged.artifacts[1].status, "current");
});
