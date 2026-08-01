import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	acknowledgeProjectStatus,
	checkProjectStatus,
} from "../../.test-build/workbench/src/project-status.js";

const hash = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const project =
	"# Project\n## Objective\n## Current direction\n## Definition of done\n## Previous action\n## Immediate next step\n";
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
