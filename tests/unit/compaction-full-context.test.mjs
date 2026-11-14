import assert from "node:assert/strict";
import test from "node:test";
import {
	buildCompactionPrompt,
	parseCompactionModelOutput,
	serializeObservableMessages,
} from "../../.test-build/workbench/src/compaction.js";

const user = (content) => ({ role: "user", content });
const event = (messages, previousSummary) => ({
	preparation: {
		messagesToSummarize: messages,
		turnPrefixMessages: [],
		previousSummary,
		firstKeptEntryId: "keep",
	},
	branchEntries: [],
});
const prompt = (value) => buildCompactionPrompt(value, { files: [], paths: [] }, {}, "INBOX.md");

test("fitting visible input has no old transcript, message, prior-summary or part-count ceilings", () => {
	const previous = `PRIOR_BEGIN ${"p".repeat(90_000)} PRIOR_END`,
		long = `USER_BEGIN ${"界🧪".repeat(12_000)} USER_END`,
		messages = Array.from({ length: 1600 }, (_, i) => user(`TURN_${i}: ${"x".repeat(180)}`));
	messages.unshift(user(long));
	messages.push({
		role: "assistant",
		content: [
			{ type: "thinking", thinking: "PRIVATE_MUST_NOT_APPEAR" },
			...Array.from({ length: 24 }, (_, i) => ({ type: "text", text: `VISIBLE_PART_${i}` })),
			{
				type: "toolCall",
				id: "deep-call",
				name: "write",
				arguments: {
					path: "long.txt",
					content: `ARG_BEGIN ${"a".repeat(12_000)} ARG_END`,
					nested: { a: { b: { c: { d: { marker: "DEEP_ARG" } } } } },
				},
			},
		],
	});
	messages.push({
		role: "toolResult",
		toolName: "write",
		toolCallId: "deep-call",
		content: [{ type: "text", text: `RESULT_BEGIN ${"r".repeat(12_000)} RESULT_END` }],
		isError: false,
	});
	const input = prompt(event(messages, previous));
	for (const marker of [
		previous,
		long,
		"VISIBLE_PART_23",
		"ARG_BEGIN",
		"ARG_END",
		"DEEP_ARG",
		"RESULT_BEGIN",
		"RESULT_END",
	])
		assert.ok(input.includes(marker), `missing ${marker.slice(0, 60)}`);
	let position = -1;
	for (let i = 0; i < 1600; i++) {
		const next = input.indexOf(`TURN_${i}:`);
		assert.ok(next > position, `turn ${i} missing or reordered`);
		position = next;
	}
	assert.doesNotMatch(
		input,
		/PRIVATE_MUST_NOT_APPEAR|sampled chronologically|earlier messages omitted|truncated after/,
	);
	assert.doesNotMatch(serializeObservableMessages(messages), /PRIVATE_MUST_NOT_APPEAR/);
});

test("retained context honors native replacements, omissions and non-message contributions", () => {
	const value = event([user("PREFIX_TASK")]);
	const entries = [
		{ id: "old", type: "message", message: user("NOT_RETAINED_RAW") },
		{ id: "keep", type: "message", message: user("REPLACED_RAW") },
		{ id: "gone", type: "message", message: user("OMITTED_RAW") },
		{
			id: "custom",
			type: "custom_message",
			customType: "note",
			content: "RETAINED_CUSTOM",
			display: true,
		},
		{
			id: "replace",
			type: "context_edit",
			targetId: "keep",
			replacement: { content: "REPLACEMENT_VISIBLE" },
		},
		{ id: "omit", type: "context_edit", targetId: "gone", replacement: null },
	];
	value.branchEntries = entries.map((entry, i) => ({
		...entry,
		parentId: i ? entries[i - 1].id : null,
		timestamp: new Date(0).toISOString(),
	}));
	const input = prompt(value);
	for (const marker of ["PREFIX_TASK", "REPLACEMENT_VISIBLE", "RETAINED_CUSTOM"])
		assert.ok(input.includes(marker), marker);
	assert.doesNotMatch(input, /NOT_RETAINED_RAW|REPLACED_RAW|OMITTED_RAW/);
});

test("working-memory output capacity is not silently restricted to twelve short items", () => {
	const preferences = Array.from(
		{ length: 30 },
		(_, i) => `PREFERENCE_${i} ${"detail ".repeat(260)}END_${i}`,
	);
	const memory = parseCompactionModelOutput(
		JSON.stringify({
			workingMemory: {
				objective: `GOAL ${"x".repeat(3000)}`,
				nextAction: "Resume",
				userPreferences: preferences,
			},
			promotions: [],
		}),
	).workingMemory;
	assert.deepEqual(memory.userPreferences, preferences);
	assert.ok(memory.objective.length > 2000);
});
