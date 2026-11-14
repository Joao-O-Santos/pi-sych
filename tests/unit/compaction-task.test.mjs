import assert from "node:assert/strict";
import test from "node:test";
import {
	buildCompactionPrompt,
	parseCompactionModelOutput,
	renderWorkingMemory,
	serializeObservableMessages,
} from "../../.test-build/workbench/src/compaction.js";

const user = (content) => ({ role: "user", content });
const event = (history = [], prefix = [], branchEntries = []) => ({
	preparation: {
		messagesToSummarize: history,
		turnPrefixMessages: prefix,
		firstKeptEntryId: "keep",
	},
	branchEntries,
});
const promptFor = (value) => buildCompactionPrompt(value, { files: [], paths: [] }, {}, "INBOX.md");
const ordered = (text, values) => {
	let previous = -1;
	for (const value of values) {
		const index = text.indexOf(value, previous + 1);
		assert.ok(index > previous, `missing or out of order: ${value}`);
		previous = index;
	}
};

test("tool-heavy history retains initial task, every output, and correction in order", () => {
	const history = [
		user("EARLY TASK"),
		...Array.from({ length: 160 }, (_, i) => ({
			role: "toolResult",
			toolName: "read",
			toolCallId: `id-${i}`,
			isError: false,
			content: `tool-${i} ${"x".repeat(1800)}`,
		})),
		user("LATEST CORRECTION"),
	];
	const serialized = serializeObservableMessages(history);
	const prompt = promptFor(event(history));
	assert.ok(prompt.includes(serialized));
	ordered(serialized, [
		"EARLY TASK",
		...history.slice(1, -1).map((_, i) => `tool-${i} `),
		"LATEST CORRECTION",
	]);
});

test("large user traffic preserves replacement and subtask without sampling", () => {
	const history = [
		user("INITIAL REQUEST"),
		...Array.from({ length: 100 }, (_, i) => user(`traffic-${i} ${"z".repeat(600)}`)),
		user("REPLACEMENT"),
		user("SUBTASK"),
	];
	const prompt = promptFor(event(history));
	assert.ok(prompt.includes(serializeObservableMessages(history)));
	ordered(prompt, ["INITIAL REQUEST", "traffic-0 ", "traffic-99 ", "REPLACEMENT", "SUBTASK"]);
});

test("split turn and native retained projection follow history and exclude dropped entries", () => {
	const input = event(
		[user("HISTORY REQUEST")],
		[user("SPLIT TURN REQUEST")],
		[
			{ id: "dropped", parentId: null, type: "message", message: user("DROPPED BRANCH REQUEST") },
			{ id: "keep", parentId: "dropped", type: "message", message: user("RETAINED REQUEST") },
			{
				id: "custom",
				parentId: "keep",
				type: "custom_message",
				customType: "note",
				content: "CUSTOM CONTEXT",
				display: true,
			},
			{
				id: "branch",
				parentId: "custom",
				type: "branch_summary",
				summary: "BRANCH CONTEXT",
				fromId: "dropped",
			},
		],
	);
	const prompt = promptFor(input);
	ordered(prompt, [
		"HISTORY REQUEST",
		"SPLIT TURN REQUEST",
		"Retained recent messages",
		"RETAINED REQUEST",
		"CUSTOM CONTEXT",
		"BRANCH CONTEXT",
	]);
	assert.ok(!prompt.includes("DROPPED BRANCH REQUEST"));
	assert.throws(
		() =>
			promptFor({ ...input, preparation: { ...input.preparation, firstKeptEntryId: "absent" } }),
		/boundary missing/,
	);
});

test("empty and single-message history normalize without fabrication or duplication", () => {
	const empty = promptFor(
		event([{ role: "assistant", content: [{ type: "text", text: "ASSISTANT ONLY" }] }]),
	);
	assert.equal(empty.split("ASSISTANT ONLY").length - 1, 1);
	const single = promptFor(event([user("ONLY REQUEST")]));
	assert.equal(single.split("ONLY REQUEST").length - 1, 1);
});

test("UTF-8 conversation is complete while thinking remains hidden", () => {
	const history = [
		user(`EARLIEST 🧭 ${"界".repeat(4000)} EARLY SUFFIX`),
		{
			role: "assistant",
			content: [
				{ type: "thinking", thinking: "HIDDEN_THINKING_TOKEN" },
				{ type: "text", text: "VISIBLE_RESPONSE" },
			],
		},
		...Array.from({ length: 35 }, (_, i) => user(`request-${i} ${"🧪".repeat(1000)}`)),
		user("LATEST UTF8 REQUEST"),
	];
	const prompt = promptFor(event(history));
	assert.ok(prompt.includes(serializeObservableMessages(history)));
	ordered(prompt, [
		"EARLIEST 🧭",
		"EARLY SUFFIX",
		"VISIBLE_RESPONSE",
		"request-0 ",
		"request-34 ",
		"LATEST UTF8 REQUEST",
	]);
	assert.ok(!prompt.includes("HIDDEN_THINKING_TOKEN"));
	assert.ok(!prompt.includes("�"));
});

test("existing memory fields survive a two-pass continuation", () => {
	const modelOutput = {
		workingMemory: {
			objective: "Repair the active migration task",
			inferences: ["Rollback risk is visible"],
			activeWork: ["Implement rollback coverage"],
			nextAction: "Add a rollback regression test",
		},
		promotions: [],
	};
	const first = parseCompactionModelOutput(JSON.stringify(modelOutput));
	const summary = renderWorkingMemory(first.workingMemory);
	const nextEvent = event();
	nextEvent.preparation.previousSummary = summary;
	assert.ok(promptFor(nextEvent).includes(summary));
	const second = parseCompactionModelOutput(
		JSON.stringify({ workingMemory: first.workingMemory, promotions: [] }),
	);
	assert.deepEqual(second.workingMemory, first.workingMemory);
	assert.equal(renderWorkingMemory(second.workingMemory), summary);
});
