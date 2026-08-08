import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	buildCompactionPrompt,
	COMPACTION_FILE_BYTE_LIMIT,
	COMPACTION_TOTAL_BYTE_LIMIT,
	compact,
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
	assert.match(prompt, /Promotion proposals must each be one line with no CR or LF\./);
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

async function orchestrationFixture() {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compact-orchestration-"));
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			canonical: { inbox: "state/nested/INBOX.md" },
			artifacts: [
				{
					path: "tracked-missing.md",
					status: "current",
					fingerprint: `sha256:${"0".repeat(64)}`,
				},
			],
		}),
	);
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n## Objective\nTest\n## Current direction\nTest\n## Definition of done\nTest\n## Previous action\nTest\n## Immediate next step\nTest\n",
	);
	await writeFile(join(root, "existing-untracked.md"), "present\n");
	const notifications = [];
	const ctx = {
		cwd: root,
		model: { maxTokens: 10_000 },
		modelRegistry: {
			getApiKeyAndHeaders: async () => ({
				ok: true,
				apiKey: "key",
				headers: { custom: "header" },
				env: { CUSTOM_ENV: "yes" },
			}),
		},
		ui: { notify: (...args) => notifications.push(args) },
	};
	const event = {
		reason: "manual",
		preparation: {
			messagesToSummarize: [],
			turnPrefixMessages: [],
			previousSummary: "previous",
			firstKeptEntryId: "entry-7",
			tokensBefore: 321,
		},
	};
	return { root, ctx, event, notifications };
}

const memoryOutput = (overrides = {}) => ({
	workingMemory: {
		task: "Continue",
		constraints: ["Keep scope"],
		active: ["Testing"],
		blockers: [],
		next: "Run checks",
		files: ["PROJECT.md"],
		...overrides,
	},
	promotions: [],
});

const responseWith = (parts, usage = { input: 11, output: 12, totalTokens: 23 }) => ({
	content: parts.map((text) => ({ type: "text", text })),
	usage,
});

test("compact runs production orchestration and propagates metadata", async () => {
	const { root, ctx, event, notifications } = await orchestrationFixture();
	const usage = { input: 41, output: 9, totalTokens: 50 };
	let call;
	const output = memoryOutput({
		constraints: "one scalar",
		active: [],
		blockers: [],
		files: ["PROJECT.md", "tracked-missing.md", "existing-untracked.md", "missing.md"],
	});
	output.promotions = [
		{ target: "todo", proposal: "First" },
		{ target: "agents", proposal: "Second" },
	];
	const result = await compact(event, ctx, async (...args) => {
		call = args;
		return responseWith(["introductory prose ", JSON.stringify(output), " trailing prose"], usage);
	});
	assert.equal(call[0], ctx.model);
	assert.equal(call[2].apiKey, "key");
	assert.equal(call[2].maxTokens, 4096);
	assert.deepEqual(call[2].headers, { custom: "header" });
	assert.deepEqual(call[2].env, { CUSTOM_ENV: "yes" });
	assert.match(call[1].messages[0].content[0].text, /Previous summary:\nprevious/);
	assert.equal(result.compaction.firstKeptEntryId, "entry-7");
	assert.equal(result.compaction.tokensBefore, 321);
	assert.equal(result.compaction.usage, usage);
	assert.match(result.compaction.summary, /- one scalar/);
	assert.match(result.compaction.summary, /- PROJECT\.md/);
	assert.match(result.compaction.summary, /- tracked-missing\.md/);
	assert.match(result.compaction.summary, /- existing-untracked\.md/);
	assert.doesNotMatch(result.compaction.summary, /\n- missing\.md/);
	assert.equal(
		await readFile(join(root, "state/nested/INBOX.md"), "utf8"),
		"\n- {todo} First\n- {agents} Second\n",
	);
	assert.deepEqual(notifications, [
		[
			"Working-memory compaction complete. state/nested/INBOX.md has 2 pending memory proposals.",
			"info",
		],
	]);
});

test("compact accepts prose, multiple text parts, scalar arrays, and empty arrays", async () => {
	const cases = [
		["valid JSON", [JSON.stringify(memoryOutput())]],
		["surrounding prose", [`before ${JSON.stringify(memoryOutput())} after`]],
		["multiple text parts", ["before", JSON.stringify(memoryOutput()), "after"]],
		[
			"scalar arrays",
			[
				JSON.stringify(
					memoryOutput({
						constraints: "constraint",
						active: "active",
						blockers: "blocker",
						files: "PROJECT.md",
					}),
				),
			],
		],
		[
			"empty arrays",
			[JSON.stringify(memoryOutput({ constraints: [], active: [], blockers: [], files: [] }))],
		],
	];
	for (const [name, parts] of cases) {
		const { ctx, event } = await orchestrationFixture();
		const result = await compact(event, ctx, async () => responseWith(parts));
		assert.ok(result?.compaction, name);
	}
});

test("compact rejects invalid model output through the manual failure path", async () => {
	const base = memoryOutput();
	const invalid = [
		["missing output", []],
		["malformed output", ["{not json}"]],
		[
			"invalid output",
			[JSON.stringify({ ...base, workingMemory: { ...base.workingMemory, next: "" } })],
		],
		[
			"invalid promotion",
			[JSON.stringify({ ...base, promotions: [{ target: "unknown", proposal: "x" }] })],
		],
		[
			">5 promotions",
			[JSON.stringify({ ...base, promotions: Array(6).fill({ target: "todo", proposal: "x" }) })],
		],
	];
	for (const [name, parts] of invalid) {
		const { ctx, event, notifications } = await orchestrationFixture();
		assert.equal(await compact(event, ctx, async () => responseWith(parts)), undefined, name);
		assert.equal(notifications.length, 1, name);
		assert.match(notifications[0][0], /^Working-memory compaction failed:/, name);
		assert.equal(notifications[0][1], "error", name);
	}
});

test("compact handles absent model, auth rejection, and completion failure", async () => {
	const noModel = await orchestrationFixture();
	noModel.ctx.model = undefined;
	let completed = false;
	assert.equal(
		await compact(noModel.event, noModel.ctx, async () => {
			completed = true;
		}),
		undefined,
	);
	assert.equal(completed, false);
	assert.deepEqual(noModel.notifications, []);

	const noAuth = await orchestrationFixture();
	noAuth.ctx.modelRegistry.getApiKeyAndHeaders = async () => ({ ok: false });
	assert.equal(
		await compact(noAuth.event, noAuth.ctx, async () => {
			completed = true;
		}),
		undefined,
	);
	assert.equal(completed, false);
	assert.deepEqual(noAuth.notifications, []);

	const failed = await orchestrationFixture();
	assert.equal(
		await compact(failed.event, failed.ctx, async () => {
			throw new Error("provider unavailable");
		}),
		undefined,
	);
	assert.match(failed.notifications[0][0], /provider unavailable/);
});

test("automatic compact failures write stderr instead of notifying", async () => {
	const { ctx, event, notifications } = await orchestrationFixture();
	event.reason = "auto";
	const messages = [];
	const original = console.error;
	console.error = (...args) => messages.push(args);
	try {
		assert.equal(await compact(event, ctx, async () => responseWith([])), undefined);
	} finally {
		console.error = original;
	}
	assert.deepEqual(notifications, []);
	assert.equal(messages.length, 1);
	assert.match(messages[0][0], /^Working-memory compaction failed:/);
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
