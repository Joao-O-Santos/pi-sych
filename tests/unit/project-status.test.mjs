import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
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
test("status exposes missing core files and project validation problems", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-errors-"));
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
test("acknowledgement recheck rejects content changed after the status read", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-race-"));
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
test("status fingerprints files and traverses declared dependencies", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-"));
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
});
