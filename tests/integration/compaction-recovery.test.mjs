import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { compact } from "../../.test-build/workbench/src/compaction.js";

const memory = {
	objective: "Continue authorized work",
	nextAction: "Run the next check",
	authorization: ["Implement the requested change", 42, "Keep scope bounded"],
	constraints: ["Do not mutate canonical state"],
	progress: [null, "Compaction recovery tested"],
	decisions: [
		{ provenance: "user-explicit", decision: "Preserve provenance" },
		{ provenance: "invented", decision: "Discard this" },
	],
	inferences: ["A useful inference", { unsupported: true }],
	failedOrRejected: [],
	unresolved: [],
	activeWork: [],
	files: [],
	projectStateGaps: [
		{ kind: "conflict", detail: "Keep the actual gap" },
		{ kind: "conf", detail: "Discard partial gap kinds" },
		{ kind: "unknown", detail: "Discard unknown kinds" },
	],
};
const response = (workingMemory = memory, promotions = []) => ({
	content: [{ type: "text", text: JSON.stringify({ workingMemory, promotions }) }],
	usage: { input: 1, output: 1, totalTokens: 2 },
	stopReason: "stop",
});
async function fixture(t, configure = async () => {}) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-recovery-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const project =
		"# Project\n## Objective\nTest\n## Current direction\nTest\n## Definition of done\nTest\n## Previous action\nTest\n## Immediate next step\nTest\n";
	await writeFile(join(root, "PROJECT.md"), project);
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await configure(root);
	const notifications = [],
		controller = new AbortController(),
		ctx = {
			cwd: root,
			model: { maxTokens: 512 },
			modelRegistry: { complete: async () => response() },
			ui: { notify: (message) => notifications.push(message) },
		},
		event = {
			reason: "manual",
			signal: controller.signal,
			preparation: { messagesToSummarize: [], turnPrefixMessages: [], firstKeptEntryId: "kept" },
		};
	return { root, project, ctx, event, controller, notifications };
}

test("compact retains valid members from mixed malformed arrays and valid promotions", async (t) => {
	const { root, project, ctx, event } = await fixture(t),
		result = await compact(event, ctx, async () =>
			response(memory, [
				{ target: "todo", proposal: "Review the next check" },
				{ target: "age", proposal: "Reject partial target" },
				{ target: "unknown", proposal: "Reject unknown target" },
				{ target: "agents", proposal: "Reject\nmultiline" },
			]),
		);
	assert.match(result.compaction.summary, /Continue authorized work/);
	assert.match(result.compaction.summary, /Implement the requested change/);
	assert.match(result.compaction.summary, /Keep scope bounded/);
	assert.match(result.compaction.summary, /Compaction recovery tested/);
	assert.match(result.compaction.summary, /\[user-explicit\] Preserve provenance/);
	assert.match(result.compaction.summary, /A useful inference/);
	assert.match(result.compaction.summary, /\[conflict\] Keep the actual gap/);
	assert.doesNotMatch(
		result.compaction.summary,
		/invented|unknown|unsupported|Discard|partial gap|\[conf\]/,
	);
	assert.equal(
		await readFile(join(root, "INBOX.md"), "utf8"),
		"\n- {todo} Review the next check\n",
	);
	assert.doesNotMatch(await readFile(join(root, "INBOX.md"), "utf8"), /\{age\}/);
	assert.equal(await readFile(join(root, "PROJECT.md"), "utf8"), project);
});

test("compact requires usable objective and next action and falls back otherwise", async (t) => {
	for (const workingMemory of [
		{ ...memory, objective: "  " },
		{ ...memory, nextAction: null },
	]) {
		const { root, ctx, event } = await fixture(t);
		assert.equal(await compact(event, ctx, async () => response(workingMemory)), undefined);
		await assert.rejects(readFile(join(root, "INBOX.md")), { code: "ENOENT" });
	}
});

test("inbox failure preserves summary and reports unavailable count honestly", async (t) => {
	const { ctx, event, notifications } = await fixture(t, async (root) => {
		await mkdir(join(root, "state"));
		await mkdir(join(root, "state", "INBOX.md"));
		await writeFile(
			join(root, "SYNC.json"),
			JSON.stringify({
				version: 2,
				confirmedAt: "now",
				canonical: { inbox: "state/INBOX.md" },
				artifacts: [],
			}),
		);
	});
	const result = await compact(event, ctx, async () =>
		response(memory, [{ target: "todo", proposal: "Do not lose the summary" }]),
	);
	assert.match(result.compaction.summary, /Continue authorized work/);
	assert.match(notifications.join(" "), /count unavailable/i);
	assert.doesNotMatch(notifications.join(" "), /has 0 pending/);
});

test("abort during inbox safety checks never writes a proposal", async (t) => {
	for (const abortAt of [5, 6]) {
		const { ctx, event } = await fixture(t);
		let checks = 0;
		event.signal = {
			get aborted() {
				return ++checks >= abortAt;
			},
		};
		const result = await compact(event, ctx, async () =>
			response(memory, [{ target: "todo", proposal: "Must not be written" }]),
		);
		assert.equal(result, undefined);
		await assert.rejects(readFile(join(ctx.cwd, "INBOX.md")), { code: "ENOENT" });
	}
});
