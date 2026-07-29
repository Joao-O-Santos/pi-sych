import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	fingerprintFile,
	formatSyncSummary,
	inspectProjectSync,
	parseSyncMarkdown,
} from "../../.test-build/workbench/src/sync.js";

const project =
	"# Project\n\n## Objective\n\nTest.\n\n## Current direction\n\nDirect.\n\n## Definition of done\n\nChecked.\n";

function syncMarkdown(artifacts) {
	return `# Project synchronization\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-07-28T12:00:00Z", artifacts }, null, 2)}\n\`\`\`\n`;
}

test("SYNC.md parser preserves domain-specific authority and fixed statuses", () => {
	const fingerprint = `sha256:${"a".repeat(64)}`;
	const parsed = parseSyncMarkdown(
		syncMarkdown([
			{
				path: "PROJECT.md",
				role: "project",
				status: "current",
				authoritativeFor: ["objective", "scope"],
				fingerprint,
			},
		]),
	);
	assert.deepEqual(parsed.artifacts[0].authoritativeFor, [
		"objective",
		"scope",
	]);
	assert.throws(
		() =>
			parseSyncMarkdown(
				syncMarkdown([
					{
						path: "PROJECT.md",
						role: "project",
						status: "newer",
						authoritativeFor: [],
						fingerprint,
					},
				]),
			),
		/not allowed/,
	);
	assert.throws(() => parseSyncMarkdown("# Sync\n"), /exactly one/);
	assert.throws(
		() => parseSyncMarkdown(`${syncMarkdown([])}\n\`\`\`json\n{}\n\`\`\`\n`),
		/exactly one/,
	);
});

test("fingerprint changes invalidate confirmation without changing declared authority", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-sync-"));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(join(root, "EVIDENCE.md"), "# Evidence\n");
	const projectFingerprint = await fingerprintFile(join(root, "PROJECT.md"));
	const evidenceFingerprint = await fingerprintFile(join(root, "EVIDENCE.md"));
	await writeFile(
		join(root, "SYNC.md"),
		syncMarkdown([
			{
				path: "PROJECT.md",
				role: "project",
				status: "current",
				authoritativeFor: ["objective"],
				fingerprint: projectFingerprint,
			},
			{
				path: "EVIDENCE.md",
				role: "evidence",
				status: "stale",
				authoritativeFor: ["claims"],
				updateFrom: ["PROJECT.md"],
				fingerprint: evidenceFingerprint,
			},
			{
				path: "manuscript.qmd",
				role: "main-artifact",
				status: "current",
				authoritativeFor: ["approved-prose"],
				fingerprint: `sha256:${"b".repeat(64)}`,
			},
		]),
	);

	await writeFile(join(root, "PROJECT.md"), `${project}\nChanged.\n`);
	const state = await inspectProjectSync(root);
	const changed = state.artifacts.find(
		(artifact) => artifact.path === "PROJECT.md",
	);
	assert.equal(changed.changed, true);
	assert.deepEqual(changed.authoritativeFor, ["objective"]);
	assert.equal(
		state.artifacts.find((artifact) => artifact.path === "EVIDENCE.md").status,
		"stale",
	);
	assert.equal(
		state.artifacts.find((artifact) => artifact.path === "manuscript.qmd")
			.exists,
		false,
	);
	const summary = formatSyncSummary(state);
	assert.match(
		summary,
		/Changed since last confirmation:\n- PROJECT\.md — objective/,
	);
	assert.match(
		summary,
		/Needs review or update:\n- EVIDENCE\.md — claims \[stale\]/,
	);
	assert.match(summary, /Missing:\n- manuscript\.qmd — approved-prose/);
	assert.match(
		summary,
		/Review because an input changed:\n- EVIDENCE\.md ← PROJECT\.md/,
	);
	assert.match(summary, /Next: review the listed files with \/pi-sych-drift/);
});

test("unchanged project reports compactly and missing SYNC is explicit", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-unchanged-"));
	await writeFile(join(root, "PROJECT.md"), project);
	const fingerprint = await fingerprintFile(join(root, "PROJECT.md"));
	await writeFile(
		join(root, "SYNC.md"),
		syncMarkdown([
			{
				path: "PROJECT.md",
				role: "project",
				status: "current",
				authoritativeFor: ["objective"],
				fingerprint,
			},
		]),
	);
	assert.match(
		formatSyncSummary(await inspectProjectSync(root)),
		/no synchronization review is required/,
	);

	const missingRoot = await mkdtemp(join(tmpdir(), "pi-sych-missing-"));
	await writeFile(join(missingRoot, "PROJECT.md"), project);
	const missingSummary = formatSyncSummary(
		await inspectProjectSync(missingRoot),
	);
	assert.match(missingSummary, /Canonical files missing:\n- EVIDENCE\.md/);
	assert.match(
		missingSummary,
		/SYNC\.md is missing; initialization requires review/,
	);
});

test("artifact paths cannot escape the project root", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-path-"));
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(
		join(root, "SYNC.md"),
		syncMarkdown([
			{
				path: "../outside.md",
				role: "artifact",
				status: "current",
				authoritativeFor: [],
				fingerprint: `sha256:${"c".repeat(64)}`,
			},
		]),
	);
	await assert.rejects(inspectProjectSync(root), /leaves the project root/);
});
