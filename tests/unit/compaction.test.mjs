import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	buildCompactionPrompt,
	COMPACTION_FILE_BYTE_LIMIT,
	COMPACTION_TOTAL_BYTE_LIMIT,
	compactionSnapshot,
	pendingPromotions,
	validateWorkingMemory,
} from "../../.test-build/workbench/src/compaction.js";
import { resolveProject } from "../../.test-build/workbench/src/project-files.js";
import { checkProjectStatus } from "../../.test-build/workbench/src/project-status.js";

test("working-memory validation trims values and standardizes array errors", () => {
	const memory = validateWorkingMemory({
		task: " task ",
		constraints: [" one ", ""],
		active: [],
		blockers: [],
		next: " next ",
		files: ["PROJECT.md"],
	});
	assert.deepEqual(memory, {
		task: "task",
		constraints: ["one"],
		active: [],
		blockers: [],
		next: "next",
		files: ["PROJECT.md"],
	});
	assert.deepEqual(Object.keys(memory).sort(), [
		"active",
		"blockers",
		"constraints",
		"files",
		"next",
		"task",
	]);
	assert.throws(
		() => validateWorkingMemory({ ...memory, constraints: {} }),
		/constraints must be an array of strings/,
	);
});

test("compaction prompt retains scientific continuity without expanding memory", () => {
	const prompt = buildCompactionPrompt(
		{
			preparation: {
				messagesToSummarize: [],
				turnPrefixMessages: [],
				previousSummary: undefined,
			},
		},
		{ files: [], paths: [] },
		{
			projectRoot: "/tmp/project",
			syncError: undefined,
			changed: [],
			missing: [],
			impacted: [],
			cycles: [],
			missingCore: [],
			projectErrors: [],
		},
	);
	assert.ok(
		prompt.includes(
			"Retain continuity-critical information even when it is not current active work: unresolved alternatives; consequential negative results; failed approaches that constrain the next action; and decisions or commitments not yet represented in canonical project files.",
		),
	);
	assert.ok(
		prompt.includes(
			"Put these in the existing workingMemory fields—constraints, active, blockers, or next—as appropriate; do not add workingMemory fields.",
		),
	);
});

test("compaction excludes inbox contents and bounds canonical snapshots", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-"));
	await writeFile(join(root, "PROJECT.md"), "project\n".repeat(20_000));
	await writeFile(join(root, "TODO.md"), "todo\n");
	await writeFile(join(root, "INBOX.md"), "SECRET proposal content\n");
	await writeFile(join(root, "artifact.md"), "artifact\n");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			artifacts: [
				{
					path: "artifact.md",
					fingerprint: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
					status: "current",
				},
			],
		}),
	);
	const project = await resolveProject(root);
	const snapshot = await compactionSnapshot(project, await checkProjectStatus(root, project));
	assert.ok(snapshot.files.some((file) => file.path === "PROJECT.md"));
	assert.equal(
		snapshot.files.some((file) => file.path === "INBOX.md"),
		false,
	);
	assert.doesNotMatch(JSON.stringify(snapshot), /SECRET proposal content/);
	assert.ok(snapshot.paths.includes("artifact.md"));
	assert.ok(
		snapshot.files.every((file) => Buffer.byteLength(file.content) <= COMPACTION_FILE_BYTE_LIMIT),
	);
	assert.ok(
		snapshot.files.reduce((total, file) => total + Buffer.byteLength(file.content), 0) <=
			COMPACTION_TOTAL_BYTE_LIMIT,
	);
});

test("pending promotions count proposal entries, including nested inboxes", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-inbox-"));
	const inbox = join(root, "state", "INBOX.md");
	await mkdir(join(root, "state"));
	await writeFile(inbox, "heading\n- {todo} One\ncommentary\n- {agents} Two\n");
	assert.equal(await pendingPromotions({ canonical: { inbox } }), 2);
});
