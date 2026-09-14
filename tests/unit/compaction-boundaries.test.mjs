import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	COMPACTION_FILE_BYTE_LIMIT,
	compact,
	compactionSnapshot,
	parseCompactionModelOutput,
} from "../../.test-build/workbench/src/compaction.js";

const memory = {
	objective: "Continue",
	authorization: [],
	constraints: [],
	progress: [],
	decisions: [],
	inferences: [],
	failedOrRejected: [],
	unresolved: [],
	activeWork: [],
	nextAction: "Test",
	files: [],
	projectStateGaps: [],
};
const response = {
	content: [{ type: "text", text: JSON.stringify({ workingMemory: memory, promotions: [] }) }],
	usage: { input: 1, output: 1, totalTokens: 2 },
	stopReason: "stop",
};

test("promotion proposals remain one line", () =>
	assert.throws(
		() =>
			parseCompactionModelOutput(
				JSON.stringify({
					workingMemory: memory,
					promotions: [{ target: "todo", proposal: "one\ntwo" }],
				}),
			),
		/one line/,
	));

test("compact preserves model limit and signal", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-boundary-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n## Objective\nTest\n## Current direction\nTest\n## Definition of done\nTest\n## Previous action\nTest\n## Immediate next step\nTest\n",
	);
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	const controller = new AbortController(),
		options = [];
	const result = await compact(
		{
			reason: "manual",
			signal: controller.signal,
			preparation: {
				messagesToSummarize: [],
				turnPrefixMessages: [],
				firstKeptEntryId: "kept",
				tokensBefore: 99,
			},
		},
		{
			cwd: root,
			model: { maxTokens: 2048 },
			modelRegistry: { getApiKeyAndHeaders: async () => ({ ok: true, apiKey: "key" }) },
			ui: { notify() {} },
		},
		async (_model, _prompt, received) => {
			options.push(received);
			return response;
		},
	);
	assert.equal(options[0].maxTokens, 2048);
	assert.equal(options[0].signal, controller.signal);
	assert.equal(result.compaction.firstKeptEntryId, "kept");
});

test("snapshot clips unicode and rejects inbox aliases", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-unicode-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const projectPath = join(root, "PROJECT.md");
	await writeFile(projectPath, "🧪".repeat(COMPACTION_FILE_BYTE_LIMIT));
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			canonical: { inbox: "PROJECT.md" },
			artifacts: [],
		}),
	);
	const snapshot = await compactionSnapshot(
		{
			projectRoot: root,
			canonical: {
				project: projectPath,
				todo: join(root, "TODO.md"),
				decisions: join(root, "DECISIONS.md"),
				inbox: join(root, "INBOX.md"),
			},
			syncPath: join(root, "SYNC.json"),
		},
		{},
	);
	assert.ok(Buffer.byteLength(snapshot.files[0].content) <= COMPACTION_FILE_BYTE_LIMIT);
	assert.doesNotMatch(snapshot.files[0].content, /�/);
	await mkdir(join(root, "state"));
	await writeFile(join(root, "state", "INBOX.md"), "");
	const event = {
		reason: "manual",
		signal: new AbortController().signal,
		preparation: {
			messagesToSummarize: [],
			turnPrefixMessages: [],
			firstKeptEntryId: "x",
			tokensBefore: 1,
		},
	};
	const ctx = {
		cwd: root,
		model: { maxTokens: 2048 },
		modelRegistry: { getApiKeyAndHeaders: async () => ({ ok: true, apiKey: "key" }) },
		ui: { notify() {} },
	};
	assert.equal(
		await compact(event, ctx, async () => ({
			...response,
			content: [
				{
					type: "text",
					text: JSON.stringify({
						workingMemory: memory,
						promotions: [{ target: "todo", proposal: "bad" }],
					}),
				},
			],
		})),
		undefined,
	);
	assert.equal(await readFile(projectPath, "utf8"), "🧪".repeat(COMPACTION_FILE_BYTE_LIMIT));
});
