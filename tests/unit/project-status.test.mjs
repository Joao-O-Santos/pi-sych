import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	fingerprintFile,
	formatProjectStatusCheck,
	formatProjectStatusManifest,
	parseProjectStatusManifest,
} from "../../.test-build/workbench/src/project-status.js";

async function writeManifest(root, artifacts, overrides = {}) {
	await writeFile(
		join(root, "SYNC.json"),
		formatProjectStatusManifest({
			version: 2,
			confirmedAt: "2026-01-01T00:00:00.000Z",
			artifacts,
			...overrides,
		}),
	);
}

async function fixture(artifacts, overrides) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	await writeManifest(root, artifacts, overrides);
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

test("check parses direct v2 SYNC.json deterministically", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-sync-json-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const fingerprint = await fingerprintFile(join(root, "PROJECT.md"));
	await writeManifest(root, [{ path: "PROJECT.md", fingerprint, status: "current" }]);
	const result = await checkProjectStatus(root);
	assert.equal(result.syncError, undefined);
	assert.deepEqual(result.changed, []);
	assert.equal(
		await readFile(join(root, "SYNC.json"), "utf8"),
		formatProjectStatusManifest(result.manifest),
	);
});

test("acknowledgement preserves root and artifact lastModified fields", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "project\n");
	await writeFile(join(root, "guide.md"), "guide\n");
	await writeManifest(
		root,
		[
			{ ...(await artifact(root, "PROJECT.md")), lastModified: "2026-01-01T00:00:00.000Z" },
			{ ...(await artifact(root, "guide.md")), lastModified: "2026-01-02T00:00:00.000Z" },
		],
		{ lastModified: "2026-01-03T00:00:00.000Z" },
	);
	await writeFile(join(root, "PROJECT.md"), "changed project\n");
	await acknowledgeProjectStatus(
		root,
		["PROJECT.md"],
		"reviewed",
		new Date("2026-02-01T00:00:00.000Z"),
	);
	const manifest = parseProjectStatusManifest(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.equal(manifest.lastModified, "2026-01-03T00:00:00.000Z");
	assert.deepEqual(
		manifest.artifacts.map((item) => item.lastModified),
		["2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z"],
	);
});

test("check reports missing core files and shallow PROJECT.md validation errors", async () => {
	const missingRoot = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	const missing = await checkProjectStatus(missingRoot);
	assert.deepEqual(missing.missingCore, ["PROJECT.md", "SYNC.json"]);
	assert.match(
		formatProjectStatusCheck(missing),
		/Missing core files:\n- PROJECT\.md\n- SYNC\.json/,
	);

	const invalidRoot = await fixture([]);
	const invalid = await checkProjectStatus(invalidRoot);
	assert.match(invalid.projectErrors.join("\n"), /Objective/);
	assert.match(formatProjectStatusCheck(invalid), /PROJECT\.md validation errors:/);
});

test("check reports malformed SYNC.json without inventing missing core paths", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "SYNC.json"), "{ not JSON\n");
	const malformed = await checkProjectStatus(root);
	assert.match(malformed.syncError, /SYNC\.json JSON is invalid/);
	assert.deepEqual(malformed.missingCore, []);
	assert.equal(malformed.projectRoot, root);
	assert.equal(malformed.syncPath, join(root, "SYNC.json"));

	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "2026-01-01T00:00:00.000Z",
			canonical: { project: "planning-project.md" },
			artifacts: [{ path: "PROJECT.md" }],
		}),
	);
	const invalidStatus = await checkProjectStatus(root);
	assert.match(invalidStatus.syncError, /artifacts\[0\]\.status/);
	assert.deepEqual(invalidStatus.missingCore, ["planning-project.md"]);
	assert.equal(invalidStatus.projectRoot, root);
	assert.equal(invalidStatus.syncPath, join(root, "SYNC.json"));
});

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
	await writeManifest(root, artifacts);
	const before = await readFile(join(root, "SYNC.json"), "utf8");
	await writeFile(join(root, "PROJECT.md"), "after\n");
	const first = await checkProjectStatus(root);
	const second = await checkProjectStatus(root);
	assert.deepEqual(first.changed, ["PROJECT.md"]);
	assert.deepEqual(first.impacted, [
		{ path: "artifact.md", from: ["PROJECT.md"], direct: false },
		{ path: "guide.md", from: ["PROJECT.md"], direct: true },
	]);
	assert.deepEqual(second.changed, first.changed);
	assert.equal(await readFile(join(root, "SYNC.json"), "utf8"), before);
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
	await writeManifest(root, artifacts);
	await writeFile(join(root, "PROJECT.md"), "changed project\n");
	await acknowledgeProjectStatus(
		root,
		["PROJECT.md"],
		"reviewed project",
		new Date("2026-02-01T00:00:00.000Z"),
	);
	let manifest = parseProjectStatusManifest(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.equal(manifest.artifacts[0].fingerprint, await fingerprintFile(join(root, "PROJECT.md")));
	assert.deepEqual(manifest.artifacts[0].acknowledgement, {
		at: "2026-02-01T00:00:00.000Z",
		reason: "reviewed project",
	});
	assert.equal(manifest.artifacts[1].status, "needs-review");
	assert.equal(manifest.artifacts[2].status, "needs-review");
	assert.equal(manifest.artifacts[1].fingerprint, artifacts[1].fingerprint);
	const formatted = formatProjectStatusCheck(await checkProjectStatus(root));
	assert.match(formatted, /Persisted as needing review:\n- guide\.md\n- artifact\.md/);
	assert.match(formatted, /All tracked files match their recorded hashes/);
	await acknowledgeProjectStatus(
		root,
		["guide.md"],
		"reviewed unchanged dependent",
		new Date("2026-02-02T00:00:00.000Z"),
	);
	manifest = parseProjectStatusManifest(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.equal(manifest.artifacts[1].status, "current");
	assert.equal(manifest.artifacts[2].status, "needs-review");
});

test("check validates the configured canonical project path", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(
		join(root, "planning-project.md"),
		"# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n## Previous action\nNone yet.\n## Immediate next step\nNone at present.\n",
	);
	await writeManifest(root, [], {
		canonical: { project: "planning-project.md", inbox: "state/INBOX.md" },
	});
	const state = await checkProjectStatus(root);
	assert.deepEqual(state.missingCore, []);
	assert.deepEqual(state.projectErrors, []);
});

test("concurrent acknowledgements preserve both updates", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "project\n");
	await writeFile(join(root, "guide.md"), "guide\n");
	await writeManifest(root, [await artifact(root, "PROJECT.md"), await artifact(root, "guide.md")]);
	await Promise.all([
		acknowledgeProjectStatus(
			root,
			["PROJECT.md"],
			"reviewed project",
			new Date("2026-02-01T00:00:00.000Z"),
		),
		acknowledgeProjectStatus(
			root,
			["guide.md"],
			"reviewed guide",
			new Date("2026-02-02T00:00:00.000Z"),
		),
	]);
	const manifest = parseProjectStatusManifest(await readFile(join(root, "SYNC.json"), "utf8"));
	assert.deepEqual(
		manifest.artifacts.map((item) => item.acknowledgement?.reason),
		["reviewed project", "reviewed guide"],
	);
});

test("acknowledgement requires existing tracked files and a reason", async () => {
	const hash = `sha256:${"a".repeat(64)}`;
	const root = await fixture([
		{ path: "PROJECT.md", fingerprint: hash, status: "current" },
		{ path: "lost.md", fingerprint: hash, status: "current" },
	]);
	await assert.rejects(acknowledgeProjectStatus(root, ["PROJECT.md"], ""), /non-empty reason/);
	await assert.rejects(acknowledgeProjectStatus(root, ["missing.md"], "reviewed"), /not tracked/);
	await assert.rejects(acknowledgeProjectStatus(root, ["lost.md"], "reviewed"), /is missing/);
	await assert.rejects(
		acknowledgeProjectStatus(root, ["PROJECT.md", "../outside.md"], "reviewed"),
		/leaves the project root/,
	);
});

test("check displays every persisted non-current status", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-project-status-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	await writeFile(join(root, "stale.md"), "stale\n");
	await writeFile(join(root, "conflicted.md"), "conflicted\n");
	await writeFile(join(root, "missing.md"), "missing\n");
	const artifacts = [
		await artifact(root, "PROJECT.md"),
		await artifact(root, "stale.md", { status: "stale" }),
		await artifact(root, "conflicted.md", { status: "conflicted" }),
		await artifact(root, "missing.md", { status: "missing" }),
	];
	await writeManifest(root, artifacts);
	const formatted = formatProjectStatusCheck(await checkProjectStatus(root));
	assert.match(formatted, /Persisted as stale:\n- stale\.md/);
	assert.match(formatted, /Persisted as conflicted:\n- conflicted\.md/);
	assert.match(formatted, /Persisted as missing:\n- missing\.md/);
});

test("v2 manifests accept reasoned dependencies and report cycles without rejecting them", async () => {
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
	assert.equal(
		result.impacted.some(
			(impact) => impact.path === "PROJECT.md" && impact.from.includes("PROJECT.md"),
		),
		false,
	);
	assert.match(JSON.stringify(result), /changed/);
});
