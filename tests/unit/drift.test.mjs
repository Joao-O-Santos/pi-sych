import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	applyApprovedReconciliation,
	buildReconciliationCandidate,
	formatDriftFindings,
	reviewProjectDrift,
	validateDriftFinding,
} from "../../.test-build/workbench/src/drift.js";
import {
	fingerprintFile,
	inspectProjectSync,
	parseSyncMarkdown,
} from "../../.test-build/workbench/src/sync.js";

async function createDriftProject() {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-drift-"));
	const fixtureRoot = "fixtures/stage4-drift";
	const fixtureFiles = [
		"PROJECT.md",
		"EVIDENCE.md",
		"manuscript.md",
		"outputs.html",
		"DECISIONS.md",
		"STYLE.md",
	];
	await Promise.all(
		fixtureFiles.map(async (file) =>
			writeFile(
				join(root, file),
				await readFile(join(fixtureRoot, file), "utf8"),
			),
		),
	);
	const fingerprints = await Promise.all(
		[
			"PROJECT.md",
			"EVIDENCE.md",
			"manuscript.md",
			"outputs.html",
			"DECISIONS.md",
			"STYLE.md",
		].map((path) => fingerprintFile(join(root, path))),
	);
	const artifacts = [
		{
			path: "PROJECT.md",
			role: "project",
			status: "current",
			authoritativeFor: ["direction"],
			fingerprint: fingerprints[0],
		},
		{
			path: "EVIDENCE.md",
			role: "evidence",
			status: "current",
			authoritativeFor: ["claims"],
			fingerprint: fingerprints[1],
		},
		{
			path: "manuscript.md",
			role: "main-artifact",
			status: "stale",
			authoritativeFor: ["approved-prose"],
			updateFrom: ["PROJECT.md", "EVIDENCE.md", "outputs.html"],
			fingerprint: fingerprints[2],
		},
		{
			path: "outputs.html",
			role: "analysis-output",
			status: "current",
			authoritativeFor: ["computed-results"],
			fingerprint: fingerprints[3],
		},
		{
			path: "DECISIONS.md",
			role: "decisions",
			status: "current",
			authoritativeFor: ["consequential-decisions"],
			fingerprint: fingerprints[4],
		},
		{
			path: "STYLE.md",
			role: "style",
			status: "current",
			authoritativeFor: ["style"],
			fingerprint: fingerprints[5],
		},
	];
	await writeFile(
		join(root, "SYNC.md"),
		`# Project synchronization\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-07-28T12:00:00Z", artifacts }, null, 2)}\n\`\`\`\n`,
	);
	await writeFile(
		join(root, "outputs.html"),
		"result: changed after confirmation\n",
	);
	return root;
}

test("drift findings use the fixed schema and exclude severity taxonomies", () => {
	const valid = validateDriftFinding({
		id: "D-001",
		type: "project-artifact",
		files: ["PROJECT.md", "draft.md"],
		domain: "contribution",
		conflict: "Different directions",
		whyItMatters: "Criteria differ",
		possibleResolutions: ["Revise draft", "Revise project"],
		recommendedAction: "human-reconciliation",
		syncImpact: ["draft.md"],
	});
	assert.equal(valid.recommendedAction, "human-reconciliation");
	assert.throws(
		() => validateDriftFinding({ ...valid, severity: "high" }),
		/Unknown drift finding field/,
	);
	assert.throws(
		() => validateDriftFinding({ ...valid, possibleResolutions: ["Only one"] }),
		/at least 2/,
	);
	assert.throws(
		() =>
			validateDriftFinding({
				...valid,
				recommendedAction: "automatic-overwrite",
			}),
		/human-reconciliation/,
	);
});

test("deterministic reviews identify exact files, domains, reasons, and alternatives", async () => {
	const state = await inspectProjectSync(await createDriftProject());
	const findings = await reviewProjectDrift(state);
	const types = new Set(findings.map((finding) => finding.type));
	for (const type of [
		"sync-manifest",
		"project-artifact",
		"analysis-evidence",
		"evidence-artifact",
		"analysis-artifact",
		"decision",
		"style",
	])
		assert.equal(types.has(type), true, type);
	for (const finding of findings) {
		assert.ok(finding.files.length >= 2);
		assert.ok(finding.domain);
		assert.ok(finding.whyItMatters);
		assert.ok(finding.possibleResolutions.length >= 2);
		assert.equal(finding.recommendedAction, "human-reconciliation");
	}
	assert.match(
		formatDriftFindings(findings),
		/this does not determine which representation is correct/i,
	);
});

test("reconciliation creates a reviewable SYNC candidate and changes no file before approval", async () => {
	const root = await createDriftProject();
	const state = await inspectProjectSync(root);
	const finding = (await reviewProjectDrift(state)).find(
		(item) => item.type === "analysis-artifact",
	);
	const before = await readFile(join(root, "SYNC.md"), "utf8");
	const candidate = await buildReconciliationCandidate(state, finding, 0);
	candidate.changes = [
		{
			path: "manuscript.md",
			content: "# Revised manuscript\n",
			purpose: "approved artifact revision",
		},
	];
	assert.equal(candidate.requiresApproval, true);
	assert.equal(
		candidate.manifest.artifacts.find(
			(artifact) => artifact.path === "outputs.html",
		).status,
		"needs-review",
	);
	await assert.rejects(
		applyApprovedReconciliation(state, candidate, false),
		/explicit user approval/,
	);
	assert.equal(await readFile(join(root, "SYNC.md"), "utf8"), before);
	await applyApprovedReconciliation(state, candidate, true);
	const after = parseSyncMarkdown(
		await readFile(join(root, "SYNC.md"), "utf8"),
	);
	assert.equal(
		after.artifacts.find((artifact) => artifact.path === "outputs.html").status,
		"needs-review",
	);
	assert.match(
		after.artifacts.find((artifact) => artifact.path === "outputs.html")
			.fingerprint,
		/^sha256:/,
	);
	assert.equal(
		await readFile(join(root, "manuscript.md"), "utf8"),
		"# Revised manuscript\n",
	);
});
