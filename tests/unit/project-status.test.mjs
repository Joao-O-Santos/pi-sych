import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	fingerprintFile,
	parseProjectStatusMarkdown,
} from "../../.test-build/workbench/src/project-status.js";

async function fixture(artifacts) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	await writeFile(
		join(root, "SYNC.md"),
		`# Project synchronization\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-01-01T00:00:00.000Z", artifacts }, null, 2)}\n\`\`\`\n`,
	);
	return root;
}

async function artifact(root, path, extra = {}) {
	return {
		path,
		fingerprint: await fingerprintFile(join(root, path)),
		status: "current",
		...extra,
	};
}

test("check is read-only and reports declared direct and transitive impact without semantic labels", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "before\n");
	await writeFile(join(root, "guide.md"), "guide\n");
	await writeFile(join(root, "artifact.md"), "artifact\n");
	const artifacts = [
		await artifact(root, "PROJECT.md"),
		await artifact(root, "guide.md", {
			updateFrom: [{ path: "PROJECT.md", reason: "project direction" }],
		}),
		await artifact(root, "artifact.md", { dependsOn: ["guide.md"] }),
	];
	await writeFile(
		join(root, "SYNC.md"),
		`# Sync\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-01-01T00:00:00.000Z", artifacts }, null, 2)}\n\`\`\`\n`,
	);
	const before = await readFile(join(root, "SYNC.md"), "utf8");
	await writeFile(join(root, "PROJECT.md"), "after\n");
	const first = await checkProjectStatus(root);
	const second = await checkProjectStatus(root);
	assert.deepEqual(first.changed, ["PROJECT.md"]);
	assert.deepEqual(first.impacted, [
		{ path: "artifact.md", from: ["PROJECT.md"], direct: false },
		{ path: "guide.md", from: ["PROJECT.md"], direct: true },
	]);
	assert.deepEqual(second.changed, first.changed);
	assert.equal(await readFile(join(root, "SYNC.md"), "utf8"), before);
	assert.equal(JSON.stringify(first).includes("drift"), false);
});

test("acknowledgement updates selected hashes and marks only unselected dependents for review", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "project\n");
	await writeFile(join(root, "guide.md"), "guide\n");
	await writeFile(join(root, "artifact.md"), "artifact\n");
	const artifacts = [
		await artifact(root, "PROJECT.md"),
		await artifact(root, "guide.md", { updateFrom: ["PROJECT.md"] }),
		await artifact(root, "artifact.md", { updateFrom: ["guide.md"] }),
	];
	await writeFile(
		join(root, "SYNC.md"),
		`# Sync\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-01-01T00:00:00.000Z", artifacts }, null, 2)}\n\`\`\`\n`,
	);
	await writeFile(join(root, "PROJECT.md"), "changed project\n");
	await acknowledgeProjectStatus(
		root,
		["PROJECT.md"],
		"reviewed project",
		new Date("2026-02-01T00:00:00.000Z"),
	);
	let manifest = parseProjectStatusMarkdown(
		await readFile(join(root, "SYNC.md"), "utf8"),
	);
	assert.equal(
		manifest.artifacts[0].fingerprint,
		await fingerprintFile(join(root, "PROJECT.md")),
	);
	assert.deepEqual(manifest.artifacts[0].acknowledgement, {
		at: "2026-02-01T00:00:00.000Z",
		reason: "reviewed project",
	});
	assert.equal(manifest.artifacts[1].status, "needs-review");
	assert.equal(manifest.artifacts[2].status, "needs-review");
	assert.equal(manifest.artifacts[1].fingerprint, artifacts[1].fingerprint);
	await acknowledgeProjectStatus(
		root,
		["guide.md"],
		"reviewed unchanged dependent",
		new Date("2026-02-02T00:00:00.000Z"),
	);
	manifest = parseProjectStatusMarkdown(
		await readFile(join(root, "SYNC.md"), "utf8"),
	);
	assert.equal(manifest.artifacts[1].status, "current");
	assert.equal(manifest.artifacts[2].status, "needs-review");
});

test("acknowledgement requires existing tracked files and a reason", async () => {
	const hash = `sha256:${"a".repeat(64)}`;
	const root = await fixture([
		{ path: "PROJECT.md", fingerprint: hash, status: "current" },
		{ path: "lost.md", fingerprint: hash, status: "current" },
	]);
	await assert.rejects(
		acknowledgeProjectStatus(root, ["PROJECT.md"], ""),
		/non-empty reason/,
	);
	await assert.rejects(
		acknowledgeProjectStatus(root, ["missing.md"], "reviewed"),
		/not tracked/,
	);
	await assert.rejects(
		acknowledgeProjectStatus(root, ["lost.md"], "reviewed"),
		/is missing/,
	);
	await assert.rejects(
		acknowledgeProjectStatus(root, ["PROJECT.md", "../outside.md"], "reviewed"),
		/leaves the project root/,
	);
});

test("v1 manifests accept reasoned dependencies and report cycles without rejecting them", async () => {
	const hash = `sha256:${"a".repeat(64)}`;
	const root = await fixture([
		{
			path: "PROJECT.md",
			fingerprint: hash,
			status: "current",
			updateFrom: [{ path: "guide.md", reason: "input" }],
		},
		{
			path: "guide.md",
			fingerprint: hash,
			status: "current",
			dependsOn: ["PROJECT.md"],
		},
	]);
	await writeFile(join(root, "guide.md"), "guide\n");
	const result = await checkProjectStatus(root);
	assert.deepEqual(result.cycles, [["PROJECT.md", "guide.md", "PROJECT.md"]]);
	assert.match(JSON.stringify(result), /changed/);
});
