import assert from "node:assert/strict";
import test from "node:test";
import {
	buildCompactionPrompt,
	COMPACTION_CONVERSATION_BYTE_LIMIT,
	parseCompactionModelOutput,
	renderWorkingMemory,
	serializeObservableMessages,
} from "../../.test-build/workbench/src/compaction.js";

const excerptHeading =
	"User request excerpts (earliest available and recent; chronological, may be superseded):";
const user = (content) => ({ role: "user", content });
const entry = (id, message) => ({ id, type: "message", message });
const event = (messagesToSummarize = [], turnPrefixMessages = [], branchEntries = []) => ({
	preparation: { messagesToSummarize, turnPrefixMessages, firstKeptEntryId: "keep" },
	branchEntries,
});
const promptFor = (value) => buildCompactionPrompt(value, { files: [], paths: [] }, {}, "INBOX.md");
const sections = (prompt) => {
	const headings = [
		excerptHeading,
		"Observable messages:",
		"Retained recent messages:",
		"Canonical snapshots (inbox excluded; clipping proves nothing):",
	];
	const positions = headings.map((heading) => prompt.indexOf(`\n${heading}\n`));
	for (let i = 0; i < positions.length; i++) {
		assert.ok(positions[i] >= 0, `missing ${headings[i]}`);
		if (i)
			assert.ok(positions[i] > positions[i - 1], "sections must be chronological in the prompt");
	}
	return positions
		.slice(0, 3)
		.map((position, i) => prompt.slice(position + headings[i].length + 2, positions[i + 1]));
};
const ordered = (text, values) => {
	let previous = -1;
	for (const value of values) {
		const index = text.indexOf(value, previous + 1);
		assert.ok(index > previous, `missing or out of order: ${value}`);
		previous = index;
	}
};

test("tool-heavy first compaction preserves the initial task and recent correction", () => {
	const history = [
		user("EARLY TASK: implement the migration safely"),
		...Array.from({ length: 60 }, (_, i) => ({
			role: "toolResult",
			toolName: "read",
			isError: false,
			content: `tool-${i} ${"x".repeat(1800)}`,
		})),
		user("LATEST CORRECTION: first cover rollback"),
	];
	assert.ok(!serializeObservableMessages(history).includes("EARLY TASK"));
	const [excerpts, observable] = sections(promptFor(event(history)));
	ordered(excerpts, [
		"EARLY TASK: implement the migration safely",
		"LATEST CORRECTION: first cover rollback",
	]);
	assert.ok(observable.includes("tool-59"));
});

test("large user traffic retains earliest request and chronological replacement and subtask", () => {
	const history = [
		user("INITIAL REQUEST: build alpha"),
		...Array.from({ length: 100 }, (_, i) => user(`traffic-${i} ${"z".repeat(600)}`)),
		user("REPLACEMENT: build beta instead"),
		user("SUBTASK: test beta first"),
	];
	const [excerpts] = sections(promptFor(event(history)));
	ordered(excerpts, [
		"INITIAL REQUEST: build alpha",
		"REPLACEMENT: build beta instead",
		"SUBTASK: test beta first",
	]);
	assert.ok(Buffer.byteLength(excerpts) <= COMPACTION_CONVERSATION_BYTE_LIMIT / 4);
});

test("excerpts include split-turn and retained requests without reviving dropped branch entries", () => {
	const input = event(
		[user("HISTORY REQUEST")],
		[user("SPLIT TURN REQUEST")],
		[entry("dropped", user("DROPPED BRANCH REQUEST")), entry("keep", user("RETAINED REQUEST"))],
	);
	const prompt = promptFor(input);
	const [excerpts, , retained] = sections(prompt);
	ordered(excerpts, ["HISTORY REQUEST", "SPLIT TURN REQUEST", "RETAINED REQUEST"]);
	assert.ok(retained.includes("RETAINED REQUEST"));
	assert.ok(!prompt.includes("DROPPED BRANCH REQUEST"));
	const missing = promptFor({
		...input,
		preparation: { ...input.preparation, firstKeptEntryId: "absent" },
	});
	assert.ok(!missing.includes("DROPPED BRANCH REQUEST"));
	assert.ok(!missing.includes("RETAINED REQUEST"));
});

test("no user and one user normalize without fabricating or duplicating excerpts", () => {
	const [empty] = sections(
		promptFor(event([{ role: "assistant", content: [{ type: "text", text: "ASSISTANT ONLY" }] }])),
	);
	assert.ok(!empty.includes("ASSISTANT ONLY"));
	assert.ok(!/undefined|null/.test(empty));
	const [single] = sections(promptFor(event([user("ONLY REQUEST")])));
	assert.equal(single.split("ONLY REQUEST").length - 1, 1);
});

test("UTF-8 excerpt and combined conversation budgets exclude hidden thinking", () => {
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
	const prompt = promptFor(
		event(history, [], [entry("keep", user(`RETAINED 🧭 ${"界".repeat(3000)}`))]),
	);
	const parts = sections(prompt);
	ordered(parts[0], ["EARLIEST 🧭", "LATEST UTF8 REQUEST", "RETAINED 🧭"]);
	assert.ok(Buffer.byteLength(parts[0]) <= COMPACTION_CONVERSATION_BYTE_LIMIT / 4);
	assert.ok(
		parts.reduce((sum, part) => sum + Buffer.byteLength(part), 0) <=
			COMPACTION_CONVERSATION_BYTE_LIMIT,
	);
	assert.ok(!prompt.includes("HIDDEN_THINKING_TOKEN"));
	assert.ok(!parts.join("").includes("�"));
	assert.ok(!parts[0].includes("EARLY SUFFIX"), "long messages are prefix-clipped");
});

test("existing memory fields survive a two-pass continuation without a new schema", () => {
	// This fixture represents model output; it tests serialization and prompt plumbing, not model judgment.
	const modelOutput = {
		workingMemory: {
			objective: "Repair the active migration task",
			inferences: ["Use staged rollout because the visible tests expose rollback risk"],
			activeWork: ["Implement rollback coverage"],
			nextAction: "Add a rollback regression test",
		},
		promotions: [],
	};
	const first = parseCompactionModelOutput(JSON.stringify(modelOutput));
	const summary = renderWorkingMemory(first.workingMemory);
	const nextEvent = event();
	nextEvent.preparation.previousSummary = summary;
	const nextPrompt = promptFor(nextEvent);
	for (const value of [
		modelOutput.workingMemory.objective,
		...modelOutput.workingMemory.inferences,
		...modelOutput.workingMemory.activeWork,
		modelOutput.workingMemory.nextAction,
	]) {
		assert.ok(summary.includes(value));
		assert.ok(nextPrompt.includes(value));
	}
	const second = parseCompactionModelOutput(
		JSON.stringify({ workingMemory: first.workingMemory, promotions: [] }),
	);
	assert.deepEqual(second.workingMemory, first.workingMemory);
	assert.equal(renderWorkingMemory(second.workingMemory), summary);
});
