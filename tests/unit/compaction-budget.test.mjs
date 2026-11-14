import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	buildCompactionPrompt,
	COMPACTION_CONVERSATION_BYTE_LIMIT,
	COMPACTION_SUMMARY_BYTE_LIMIT,
	compact,
	renderWorkingMemory,
	validateWorkingMemory,
} from "../../.test-build/workbench/src/compaction.js";

const event = (messages = [], previousSummary) => ({
	reason: "threshold",
	preparation: {
		messagesToSummarize: messages,
		turnPrefixMessages: [],
		previousSummary,
		firstKeptEntryId: "keep",
		tokensBefore: 150_000,
	},
	branchEntries: [],
});
const prompt = (value, limit) =>
	buildCompactionPrompt(value, { files: [], paths: [] }, {}, "INBOX.md", limit);
const user = (content) => ({ role: "user", content });
const tool = (content, isError = false) => ({
	role: "toolResult",
	toolName: "edit",
	content,
	isError,
});
const memory = () =>
	validateWorkingMemory({
		objective: "REQUIRED_GOAL finish the migration",
		nextAction: "REQUIRED_NEXT inspect rollback",
	});
const saturatedMemory = () => {
	const result = memory();
	for (const field of [
		"authorization",
		"constraints",
		"userPreferences",
		"progress",
		"inferences",
		"failedOrRejected",
		"toolLessons",
		"unresolved",
		"activeWork",
		"files",
	])
		result[field] = Array.from(
			{ length: 12 },
			(_, i) => `${field.toUpperCase()}_${i} ${"界".repeat(850)}`,
		);
	result.decisions = Array.from({ length: 12 }, (_, i) => ({
		provenance: "user-explicit",
		decision: `DECISION_${i} ${"d".repeat(850)}`,
		rationale: "r".repeat(850),
	}));
	return validateWorkingMemory(result);
};

test("large valid prior memory preserves goal, next action, feedback and recovery beyond prefix clipping", () => {
	const previous = renderWorkingMemory(saturatedMemory());
	assert.ok(Buffer.byteLength(previous) > COMPACTION_SUMMARY_BYTE_LIMIT);
	for (const limit of [undefined, 20_000, 32_000]) {
		const input = prompt(event([], previous), limit);
		for (const marker of [
			"REQUIRED_GOAL",
			"REQUIRED_NEXT",
			"USERPREFERENCES_0",
			"TOOLLESSONS_0",
			"ACTIVEWORK_0",
			"DECISION_0",
		])
			assert.ok(input.includes(marker), `missing ${marker} with limit ${limit}`);
		if (limit) assert.ok(Buffer.byteLength(input) <= limit);
		assert.ok(!input.includes("�"));
	}
});

test("middle user corrections and older failure/repair remain visible despite later over-budget traffic", () => {
	const messages = [user("INITIAL_TASK retain task context")];
	for (let i = 0; i < 260; i++) {
		if (i === 40 || i === 75)
			messages.push(user("REPEATED_CORRECTION: stop asking to continue already authorized work."));
		if (i === 50)
			messages.push(
				tool("FAILURE_EXACT_SPAN missing; no replacement made", true),
				{
					role: "assistant",
					content: [
						{ type: "thinking", thinking: "PRIVATE_SCRATCH" },
						{ type: "text", text: "REMEDY_REREAD use the current unique whitespace-exact span" },
					],
				},
				tool("REPAIR_OBSERVED replacement succeeded"),
			);
		messages.push(user(`traffic-${i} ${"x".repeat(1800)}`));
	}
	const input = prompt(event(messages));
	const start = input.indexOf("\nUser request excerpts"),
		end = input.indexOf("\nTool failure/recovery excerpts");
	const requests = input.slice(start, end);
	assert.equal(requests.split("REPEATED_CORRECTION").length - 1, 2);
	const episodes = input.slice(end, input.indexOf("\nObservable messages:"));
	for (const marker of ["FAILURE_EXACT_SPAN", "REMEDY_REREAD", "REPAIR_OBSERVED"])
		assert.ok(episodes.includes(marker));
	assert.ok(episodes.indexOf("FAILURE_EXACT_SPAN") < episodes.indexOf("REPAIR_OBSERVED"));
	assert.ok(!input.includes("PRIVATE_SCRATCH"));
	assert.ok(Buffer.byteLength(requests) < COMPACTION_CONVERSATION_BYTE_LIMIT / 4 + 200);
});

test("extreme user traffic is sampled in chronological order with first and latest context", () => {
	const input = prompt(
		event(Array.from({ length: 1500 }, (_, i) => user(`unique-${i}: ${"界".repeat(500)}`))),
	);
	const requests = input.slice(
		input.indexOf("\nUser request excerpts"),
		input.indexOf("\nTool failure/recovery excerpts"),
	);
	assert.match(requests, /sampled chronologically/);
	assert.ok(requests.includes("unique-0:") && requests.includes("unique-1499:"));
	assert.ok(!requests.includes("�"));
	const positions = [...requests.matchAll(/unique-(\d+):/g)].map((m) => Number(m[1]));
	assert.deepEqual(
		positions,
		positions.toSorted((a, b) => a - b),
	);
});

test("compact budgets small and large real-shaped models with adversarial source text", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-budget-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await writeFile(
		join(root, "PROJECT.md"),
		`# Project\n\n## Objective\nTest\n${'界!\\"'.repeat(6000)}`,
	);
	const previous = renderWorkingMemory(saturatedMemory());
	const history = Array.from({ length: 200 }, (_, i) =>
		tool(`command-${i}: ${'!\\"界'.repeat(2000)}`, i % 7 === 0),
	);
	history.push(
		tool("FAILURE_MUST_SURVIVE: missing exact match", true),
		tool(`LONG_FOLLOWING_SUCCESS ${"z".repeat(10_000)}`),
	);
	for (const [contextWindow, maxTokens, expected] of [
		[16_384, 16_384, 4096],
		[32_768, 512, 512],
		[200_000, 128_000, 16_384],
		[200_000, 2048, 2048],
	]) {
		let calls = 0;
		const result = await compact(
			event(history, previous),
			{ cwd: root, model: { contextWindow, maxTokens }, ui: { notify() {} } },
			async (_model, request, options) => {
				calls++;
				const text = request.messages[0].content[0].text;
				assert.equal(options.maxTokens, expected);
				assert.ok(Buffer.byteLength(text) + options.maxTokens + 1024 <= contextWindow);
				assert.ok(
					text.includes("Treat supplied history") &&
						text.includes("Never treat assistant thinking"),
				);
				assert.ok(text.includes("REQUIRED_GOAL") && text.includes("REQUIRED_NEXT"));
				const episode = text.slice(
					text.indexOf("\nTool failure/recovery excerpts"),
					text.indexOf("\nObservable messages:"),
				);
				assert.ok(
					episode.includes("FAILURE_MUST_SURVIVE"),
					"a following success must not crowd the protected error out",
				);
				return {
					stopReason: "stop",
					content: [
						{ type: "text", text: JSON.stringify({ workingMemory: memory(), promotions: [] }) },
					],
				};
			},
		);
		assert.equal(
			calls,
			1,
			`custom compaction unexpectedly fell back for ${contextWindow}/${maxTokens}`,
		);
		assert.ok(result?.compaction);
	}
});

test("unusable or irreducibly tiny model metadata falls back without a provider call", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-no-budget-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	for (const model of [
		{ contextWindow: 2048, maxTokens: 1024 },
		{ maxTokens: 2048 },
		{ contextWindow: Number.NaN, maxTokens: 2048 },
		{ contextWindow: 32_768, maxTokens: 0 },
	]) {
		const result = await compact(
			{ ...event(), reason: "manual" },
			{ cwd: root, model, ui: { notify() {} } },
			async () => {
				assert.fail("provider must not run");
			},
		);
		assert.equal(result, undefined);
	}
});
