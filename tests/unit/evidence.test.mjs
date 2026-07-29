import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildEvidenceProposal,
	challengeEvidenceEntries,
	evidenceDependencyState,
	fingerprintEvidenceSource,
	formatEvidenceProposal,
	readEvidence,
} from "../../.test-build/workbench/src/evidence.js";
import {
	fingerprintFile,
	inspectProjectSync,
} from "../../.test-build/workbench/src/sync.js";

test("evidence proposals preserve exact source, source claim, interpretation, and limits separately", () => {
	const proposal = buildEvidenceProposal({
		id: "E-100",
		title: "Observed result",
		kind: "empirical result",
		source: "outputs/model.html#row-advisor",
		evidence: "The output reports a difference in update magnitude.",
		sourceClaim: "The source reports the estimated contrast.",
		projectInterpretation: "This is consistent with the proposed mechanism.",
		limits: "Conditional on the specified model and exclusions.",
		supports: ["Results §3.2"],
	});
	const formatted = formatEvidenceProposal(proposal);
	assert.match(formatted, /\*\*Source claim:\*\* The source reports/);
	assert.match(formatted, /\*\*Project interpretation:\*\* This is consistent/);
	assert.match(formatted, /\*\*Limits:\*\* Conditional/);
	assert.match(formatted, /proposal; it is not verified/);
});

test("evidence challenge detects missing sources and missing required fields", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-evidence-"));
	await writeFile(
		join(root, "EVIDENCE.md"),
		"# Evidence\n\n## E-001 — Missing source\n\n**Status:** supported\n**Kind:** empirical result\n**Source:** `outputs/missing.html`\n\n## E-002 — Incomplete\n\n**Status:** supported\n",
	);
	const entries = await readEvidence(root);
	const challenges = await challengeEvidenceEntries(root, entries);
	assert.equal(
		challenges.some(
			(challenge) =>
				challenge.entryId === "E-001" && challenge.issue === "missing-source",
		),
		true,
	);
	assert.equal(
		challenges.some(
			(challenge) =>
				challenge.entryId === "E-002" && challenge.issue === "missing-field",
		),
		true,
	);
});

test("evidence dependency state marks downstream prose for review when output changes", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-evidence-dependency-"));
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n",
	);
	await writeFile(join(root, "EVIDENCE.md"), "# Evidence\n");
	await writeFile(join(root, "output.html"), "old\n");
	await writeFile(join(root, "manuscript.qmd"), "old prose\n");
	const fingerprints = await Promise.all(
		["EVIDENCE.md", "output.html", "manuscript.qmd"].map((path) =>
			fingerprintFile(join(root, path)),
		),
	);
	await writeFile(
		join(root, "SYNC.md"),
		`# Project synchronization\n\n\`\`\`json\n${JSON.stringify(
			{
				version: 1,
				confirmedAt: "2026-07-28T12:00:00Z",
				artifacts: [
					{
						path: "EVIDENCE.md",
						role: "evidence",
						status: "current",
						authoritativeFor: ["claims"],
						fingerprint: fingerprints[0],
					},
					{
						path: "output.html",
						role: "analysis-output",
						status: "current",
						authoritativeFor: ["computed-results"],
						fingerprint: fingerprints[1],
					},
					{
						path: "manuscript.qmd",
						role: "main-artifact",
						status: "current",
						authoritativeFor: ["prose"],
						updateFrom: ["EVIDENCE.md", "output.html"],
						fingerprint: fingerprints[2],
					},
				],
			},
			null,
			2,
		)}\n\`\`\`\n`,
	);
	await writeFile(join(root, "output.html"), "new\n");
	const state = await inspectProjectSync(root);
	const dependency = await evidenceDependencyState(state);
	assert.equal(dependency.status, "needs-review");
	assert.deepEqual(dependency.changedSources, ["output.html"]);
	assert.deepEqual(dependency.dependentArtifacts, ["manuscript.qmd"]);
	assert.equal(
		await fingerprintEvidenceSource(root, "output.html"),
		state.artifacts.find((artifact) => artifact.path === "output.html")
			.currentFingerprint,
	);
});
