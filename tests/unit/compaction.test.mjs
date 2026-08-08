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
	parseCompactionModelOutput,
	pendingPromotions,
	renderWorkingMemory,
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
	assert.throws(() => validateWorkingMemory(null), /must be an object/);
	assert.throws(() => validateWorkingMemory({ ...memory, next: "" }), /next/);
	const coerced = validateWorkingMemory({
		task: "t",
		constraints: "one",
		active: [],
		blockers: [],
		next: "n",
		files: ["f"],
	});
	assert.deepEqual(coerced.constraints, ["one"]);
	assert.throws(
		() =>
			validateWorkingMemory({
				task: "t",
				constraints: 42,
				next: "n",
			}),
		/constraints must be an array of strings/,
	);
});

test("compaction output validates promotion combinations and renders optional sections", () => {
	const workingMemory = {
		task: "Continue",
		constraints: ["Keep scope"],
		active: ["Review"],
		blockers: [],
		next: "Test",
		files: ["PROJECT.md", "outside.md"],
	};
	const parsed = parseCompactionModelOutput(
		JSON.stringify({
			workingMemory,
			promotions: [{ target: "todo", proposal: "Retain the regression case" }],
		}),
	);
	assert.equal(parsed.promotions[0].target, "todo");
	assert.match(renderWorkingMemory(parsed.workingMemory), /## Constraints/);
	assert.doesNotMatch(renderWorkingMemory(parsed.workingMemory), /## Blockers/);
	assert.deepEqual(validateWorkingMemory(workingMemory).files, ["PROJECT.md", "outside.md"]);
	for (const value of [
		{ workingMemory, promotions: {} },
		{ workingMemory, promotions: Array(6).fill({ target: "todo", proposal: "x" }) },
		{ workingMemory, promotions: [{ target: "unknown", proposal: "x" }] },
		{ workingMemory, promotions: ["invalid"] },
	])
		assert.throws(() => parseCompactionModelOutput(JSON.stringify(value)));
	assert.throws(() => parseCompactionModelOutput("not json"), /no JSON object/);
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
		"INBOX.md",
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
	assert.match(
		prompt,
		/when no next action is known, set next to exactly "Await user direction\."/,
	);
});

test("compaction excludes inbox contents and bounds canonical snapshots", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-"));
	await writeFile(join(root, "PROJECT.md"), "project\n".repeat(20_000));
	await writeFile(join(root, "TODO.md"), "todo\n");
	await writeFile(join(root, "DECISIONS.md"), "decisions\n");
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
	const empty = await compactionSnapshot(
		await resolveProject(await mkdtemp(join(tmpdir(), "pi-sych-empty-"))),
		{ manifest: { artifacts: [] } },
	);
	assert.deepEqual(empty.files, []);
	assert.deepEqual(empty.paths, ["PROJECT.md", "TODO.md", "DECISIONS.md"]);
	assert.ok(snapshot.files.some((file) => file.path === "PROJECT.md"));
	assert.ok(snapshot.files.some((file) => file.path === "DECISIONS.md"));
	assert.equal(snapshot.files[0].path, "PROJECT.md");
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
	assert.equal(await pendingPromotions({ canonical: { inbox: join(root, "missing.md") } }), 0);
});

test("compaction retains existing untracked files, discards nonexistent and outside-project", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-filter-"));
	await writeFile(join(root, "PROJECT.md"), "project");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);

	// Create an existing untracked file
	await writeFile(join(root, "existing.md"), "existing content");

	const project = await resolveProject(root);
	const status = await checkProjectStatus(root, project);

	// Import the internal filter function
	const { compactionSnapshot, filterWorkingMemoryFiles } = await import(
		"../../.test-build/workbench/src/compaction.js"
	);
	const snapshot = await compactionSnapshot(project, status);

	const files = await filterWorkingMemoryFiles(project, new Set(snapshot.paths), [
		"existing.md",
		"nonexistent.md",
		"../outside.md",
	]);

	// existing.md should be retained (existing untracked project file)
	assert.ok(files.includes("existing.md"), "existing untracked file should be retained");
	// nonexistent.md should be discarded (doesn't exist)
	assert.ok(!files.includes("nonexistent.md"), "nonexistent file should be discarded");
	// ../outside.md should be discarded (outside project)
	assert.ok(!files.includes("../outside.md"), "outside-project file should be discarded");
});
