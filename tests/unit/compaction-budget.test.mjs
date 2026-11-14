import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { estimateTokens } from "@earendil-works/pi-coding-agent";
import {
	buildCompactionPrompt,
	compact,
	parseCompactionModelOutput,
} from "../../.test-build/workbench/src/compaction.js";

const event = (messages, previousSummary) => ({
	reason: "threshold",
	preparation: {
		messagesToSummarize: messages,
		turnPrefixMessages: [],
		previousSummary,
		firstKeptEntryId: "keep",
		tokensBefore: 150000,
	},
	branchEntries: [],
});
const response = () => ({
	stopReason: "stop",
	content: [
		{
			type: "text",
			text: JSON.stringify({
				workingMemory: { objective: "Continue task", nextAction: "Resume" },
				promotions: [],
			}),
		},
	],
});
async function fixture(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-full-context-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n\n## Objective\nFull visible transcript test\n",
	);
	return root;
}

test("complete fitting transcript and prior summary exceed former byte caps without excerpts", () => {
	const history = Array.from({ length: 1500 }, (_, i) => ({
		role: "user",
		content: `TURN_${i} ${"x".repeat(100)}`,
	}));
	const prior = `PRIOR_START ${"p".repeat(70_000)} PRIOR_END`,
		prompt = buildCompactionPrompt(event(history, prior), { files: [], paths: [] }, {}, "INBOX.md");
	assert.ok(prompt.includes("TURN_0") && prompt.includes("TURN_1499"));
	assert.ok(prompt.includes("PRIOR_START") && prompt.includes("PRIOR_END"));
	assert.doesNotMatch(prompt, /sampled chronologically|earlier messages omitted|truncated after/);
});

test("only bulky tool output is trimmed to fit, with explicit middle omission; calls and turns survive", async (t) => {
	const root = await fixture(t),
		calls = Array.from({ length: 18 }, (_, i) => ({ role: "user", content: `KEEP_TURN_${i}` }));
	calls.splice(
		8,
		0,
		{
			role: "assistant",
			content: [
				{
					type: "toolCall",
					id: "call-1",
					name: "read",
					arguments: { path: "exact/path", nested: { token: "ARGUMENT_MUST_SURVIVE" } },
				},
			],
		},
		{
			role: "toolResult",
			toolCallId: "call-1",
			toolName: "read",
			isError: false,
			content: [{ type: "text", text: `RESULT_HEAD ${"z".repeat(90_000)} RESULT_TAIL` }],
		},
	);
	let captured, options;
	const result = await compact(
		event(calls),
		{ cwd: root, model: { contextWindow: 20_000, maxTokens: 4_000 }, ui: { notify() {} } },
		async (_model, request, opts) => {
			captured = request.messages[0].content[0].text;
			options = opts;
			return response();
		},
	);
	assert.ok(result?.compaction);
	assert.ok(
		captured.includes("RESULT_HEAD") &&
			captured.includes("RESULT_TAIL") &&
			captured.includes("tool output omitted from middle to fit compaction context"),
	);
	assert.ok(
		captured.includes("ARGUMENT_MUST_SURVIVE") &&
			captured.includes("call-1") &&
			captured.includes("exact/path"),
	);
	for (let i = 0; i < 18; i++) assert.ok(captured.includes(`KEEP_TURN_${i}`));
	assert.ok(options.maxTokens > 0 && options.maxTokens <= 4000);
});

test("full narrative too large to fit falls back instead of omitting conversation turns", async (t) => {
	const root = await fixture(t);
	let calls = 0;
	const history = [{ role: "user", content: `UNTRIMMABLE_NARRATIVE ${"x".repeat(180_000)}` }];
	const result = await compact(
		event(history),
		{ cwd: root, model: { contextWindow: 16_000, maxTokens: 4_000 }, ui: { notify() {} } },
		async () => {
			calls++;
			return response();
		},
	);
	assert.equal(result, undefined);
	assert.equal(calls, 0);
});

test("output capacity is model-derived and is not capped at 16384", async (t) => {
	const root = await fixture(t);
	let options;
	const result = await compact(
		event([{ role: "user", content: "TASK" }]),
		{ cwd: root, model: { contextWindow: 100_000, maxTokens: 50_000 }, ui: { notify() {} } },
		async (_model, _request, opts) => {
			options = opts;
			return response();
		},
	);
	assert.ok(result?.compaction);
	assert.equal(options.maxTokens, 50_000);
});

test("memory parser preserves more than twelve long single-line feedback entries", () => {
	const entries = Array.from(
		{ length: 30 },
		(_, i) => `PREFERENCE_${i} ${"detail ".repeat(200)}END_${i}`,
	);
	const parsed = parseCompactionModelOutput(
		JSON.stringify({
			workingMemory: { objective: "GOAL", nextAction: "Resume", userPreferences: entries },
			promotions: [],
		}),
	);
	assert.deepEqual(parsed.workingMemory.userPreferences, entries);
});

test("summary reservation yields to a fitting complete backbone and remaining output is token-budgeted", async (t) => {
	const root = await fixture(t),
		narrative = `FULL_NARRATIVE ${"x".repeat(48_000)}`;
	let captured, options;
	const result = await compact(
		event([{ role: "user", content: narrative }]),
		{ cwd: root, model: { contextWindow: 16_000, maxTokens: 16_000 }, ui: { notify() {} } },
		async (_model, request, opts) => {
			captured = request.messages[0];
			options = opts;
			return response();
		},
	);
	assert.ok(result?.compaction);
	assert.ok(captured.content[0].text.includes(narrative));
	assert.ok(options.maxTokens > 0 && options.maxTokens < 4000);
	assert.ok(estimateTokens(captured) + options.maxTokens + 1024 <= 16_000);
	assert.equal(options.cacheRetention, "none");
});

test("largest retained output yields first while small results, error metadata and Unicode remain intact", async (t) => {
	const root = await fixture(t),
		small = `SMALL_FULL ${"ok".repeat(1000)} SMALL_END`;
	const value = event([
		{ role: "user", content: "KEEP_TASK" },
		{
			role: "toolResult",
			toolName: "read",
			toolCallId: "small-call",
			content: small,
			isError: false,
		},
	]);
	value.branchEntries = [
		{
			id: "keep",
			parentId: null,
			type: "message",
			message: {
				role: "assistant",
				content: [
					{ type: "toolCall", name: "read", id: "big-call", arguments: { path: "exact.txt" } },
				],
			},
		},
		{
			id: "result",
			parentId: "keep",
			type: "message",
			message: {
				role: "toolResult",
				toolName: "read",
				toolCallId: "big-call",
				content: `LARGE_BEGIN ${"🧪界".repeat(40_000)} LARGE_END`,
				isError: true,
			},
		},
	];
	let captured, options;
	const result = await compact(
		value,
		{ cwd: root, model: { contextWindow: 16_000, maxTokens: 4000 }, ui: { notify() {} } },
		async (_model, request, opts) => {
			captured = request.messages[0];
			options = opts;
			return response();
		},
	);
	assert.ok(result?.compaction);
	const input = captured.content[0].text;
	assert.ok(input.includes(small));
	for (const marker of [
		"KEEP_TASK",
		"big-call",
		"exact.txt",
		"LARGE_BEGIN",
		"LARGE_END",
		"; error]",
	])
		assert.ok(input.includes(marker), marker);
	assert.equal(input.split("[tool output omitted from middle").length - 1, 1);
	assert.ok(input.isWellFormed());
	assert.ok(estimateTokens(captured) + options.maxTokens + 1024 <= 16_000);
});

test("unusable limits and genuinely oversized arguments fall back before provider or proposal writes", async (t) => {
	const root = await fixture(t);
	for (const model of [
		{ contextWindow: 2048, maxTokens: 1024 },
		{ maxTokens: 2048 },
		{ contextWindow: Number.NaN, maxTokens: 2048 },
		{ contextWindow: 32_768, maxTokens: 0 },
		{ contextWindow: 16_000, maxTokens: 4000 },
	]) {
		let calls = 0;
		const value = event([
			{
				role: "assistant",
				content: [
					{
						type: "toolCall",
						name: "write",
						id: "huge",
						arguments: { path: "long.txt", content: "a".repeat(100_000) },
					},
				],
			},
		]);
		value.reason = "manual";
		const result = await compact(value, { cwd: root, model, ui: { notify() {} } }, async () => {
			calls++;
			return response();
		});
		assert.equal(result, undefined);
		assert.equal(calls, 0);
	}
});
