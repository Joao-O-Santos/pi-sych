import assert from "node:assert/strict";
import test from "node:test";
import {
	buildCompactionPrompt,
	parseCompactionModelOutput,
	renderWorkingMemory,
	validateWorkingMemory,
} from "../../.test-build/workbench/src/compaction.js";

const output = (memory) =>
	parseCompactionModelOutput(
		JSON.stringify({
			workingMemory: {
				objective: "Finish the authorized migration audit",
				nextAction: "Inspect rollback coverage",
				...memory,
			},
			promotions: [],
		}),
	);
const prompt = (previousSummary) =>
	buildCompactionPrompt(
		{
			preparation: {
				messagesToSummarize: [],
				turnPrefixMessages: [],
				firstKeptEntryId: "keep",
				previousSummary,
			},
			branchEntries: [],
		},
		{ files: [], paths: [] },
		{},
		"INBOX.md",
	);

test("feedback and recovery guidance are explicit", () => {
	const instructions = prompt();
	for (const cue of [
		"repeated explicit corrections/frustrations",
		"positive feedback",
		"Repeated copies",
		"Later corrections",
		"failure symptom",
		"observed remedy and outcome",
		"unverified fix",
		"unresolved scope",
	])
		assert.ok(instructions.includes(cue), `missing feedback/tool recovery guidance: ${cue}`);
});

test("legacy summaries normalize absent preference and tool-lesson collections", () => {
	const memory = output({}).workingMemory;
	assert.deepEqual(memory.userPreferences, []);
	assert.deepEqual(memory.toolLessons, []);
	assert.deepEqual(
		validateWorkingMemory({ objective: "Audit", nextAction: "Read" }).userPreferences,
		[],
	);
	assert.doesNotMatch(renderWorkingMemory(memory), /undefined|null/);
});

test("malformed optional feedback and recovery entries do not discard valid siblings", () => {
	const memory = output({
		userPreferences: [
			null,
			"[explicit; project] Keep nesting and lighting surveys separate; user reiterated twice.",
			"bad\nentry",
			9,
		],
		toolLessons: [
			{ unexpected: true },
			"[observed] glab ci view required a TTY; glab api returned the successful tag pipeline for this repository.",
			"bad\nentry",
		],
	}).workingMemory;
	assert.equal(memory.userPreferences.length, 1);
	assert.equal(memory.toolLessons.length, 1);
	const summary = renderWorkingMemory(memory);
	assert.match(summary, /## User preferences/);
	assert.match(summary, /## Tool lessons/);
	assert.match(summary, /user reiterated twice/);
	assert.match(summary, /glab api returned/);
});

test("feedback and recovery survive a richer two-pass summary beyond the old 16 KiB bound", () => {
	// Supplied model output checks storage/input plumbing, not model interpretation of feedback.
	const first = output({
		userPreferences: [
			"[inferred; scope unknown] Repeated complaints concerned unnecessary approval prompts, not all clarification questions; confirm durable scope at review.",
		],
		progress: Array.from({ length: 20 }, (_, i) => `check-${i} ${"p".repeat(1500)}`),
		inferences: Array.from({ length: 12 }, (_, i) => `assumption-${i} ${"i".repeat(900)}`),
		failedOrRejected: Array.from({ length: 12 }, (_, i) => `failure-${i} ${"f".repeat(900)}`),
		toolLessons: [
			"RECOVERY_TO_KEEP: exact edit failed on whitespace; reread current text and use the unique exact span; replacement then succeeded. This is not evidence that all edit failures have this cause.",
		],
	});
	const summary = renderWorkingMemory(first.workingMemory);
	assert.ok(Buffer.byteLength(summary) > 16 * 1024);
	const next = prompt(summary);
	assert.ok(next.includes(first.workingMemory.userPreferences[0]));
	assert.ok(
		next.includes(first.workingMemory.toolLessons[0]),
		"late tool lessons must survive recompaction input",
	);
	assert.deepEqual(output(first.workingMemory).workingMemory, first.workingMemory);
});
