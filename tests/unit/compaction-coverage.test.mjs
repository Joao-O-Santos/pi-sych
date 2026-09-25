import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	buildCompactionPrompt,
	compact,
	compactionSnapshot,
	filterWorkingMemoryFiles,
	parseCompactionModelOutput,
	pendingPromotions,
	previousRecordedDecisionAttributions,
	renderWorkingMemory,
	serializeObservableMessages,
	validateWorkingMemory,
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
const valid = (overrides = {}) =>
	JSON.stringify({ workingMemory: { ...memory, ...overrides }, promotions: [] });

test("compaction output requires a JSON object with bounded promotions", () => {
	assert.throws(() => parseCompactionModelOutput("no braces here"), /no JSON object/);
	assert.throws(
		() => parseCompactionModelOutput('{"workingMemory": null}'),
		/workingMemory must be an object/,
	);
	assert.throws(
		() => parseCompactionModelOutput(JSON.stringify({ workingMemory: memory, promotions: {} })),
		/promotions must be an array/,
	);
	const many = Array.from({ length: 6 }, () => ({ target: "todo", proposal: "x" }));
	assert.throws(
		() => parseCompactionModelOutput(JSON.stringify({ workingMemory: memory, promotions: many })),
		/at most five/,
	);
	assert.throws(
		() => parseCompactionModelOutput(valid({ decisions: "x" })),
		/decisions must be an array/,
	);
	assert.throws(
		() => parseCompactionModelOutput(valid({ projectStateGaps: {} })),
		/projectStateGaps must be an array/,
	);
	assert.throws(
		() =>
			parseCompactionModelOutput(valid({ decisions: [{ provenance: "rumor", decision: "x" }] })),
		/provenance is not allowed/,
	);
	assert.throws(
		() => parseCompactionModelOutput(valid({ projectStateGaps: [{ kind: "bogus", detail: "x" }] })),
		/kind is not allowed/,
	);
	const sparseGaps = parseCompactionModelOutput(
		valid({
			projectStateGaps: [
				{ kind: "missing-durable-state", detail: "" },
				{ kind: "conflict", detail: "real gap" },
				{ kind: "unreviewed-proposal", detail: null },
			],
		}),
	);
	assert.deepEqual(sparseGaps.workingMemory.projectStateGaps, [
		{ kind: "conflict", detail: "real gap" },
	]);
	assert.throws(
		() => parseCompactionModelOutput(valid({ authorization: 42 })),
		/authorization must be an array of strings/,
	);
	assert.throws(
		() =>
			parseCompactionModelOutput(
				JSON.stringify({
					workingMemory: memory,
					promotions: [{ target: "nope", proposal: "x" }],
				}),
			),
		/target is not allowed/,
	);
	assert.throws(
		() =>
			parseCompactionModelOutput(
				JSON.stringify({
					workingMemory: memory,
					promotions: [{ target: "todo", proposal: "a\nb" }],
				}),
			),
		/one line/,
	);
});

test("sparse working memory normalizes omitted arrays and single-file strings", () => {
	const parsed = parseCompactionModelOutput(
		JSON.stringify({ workingMemory: { objective: "o", nextAction: "n", files: "f" } }),
	);
	assert.deepEqual(parsed.promotions, []);
	assert.deepEqual(parsed.workingMemory.authorization, []);
	assert.deepEqual(parsed.workingMemory.files, ["f"]);
	const rendered = renderWorkingMemory(
		validateWorkingMemory({
			objective: "o",
			nextAction: "n",
			decisions: [{ provenance: "user-explicit", decision: "d", rationale: "because" }],
			projectStateGaps: [{ kind: "missing-durable-state", detail: "gap" }],
		}),
	);
	assert.match(rendered, /visible rationale: because/);
	assert.match(rendered, /\[missing-durable-state\] gap/);
	assert.throws(
		() =>
			validateWorkingMemory({
				objective: "o",
				nextAction: "n",
				decisions: [{ provenance: "user-explicit", decision: "d", rationale: "" }],
			}),
		/rationale must be a non-empty string/,
	);
});

test("observable serialization covers every message shape", () => {
	const text = serializeObservableMessages([
		{ role: "user", content: "hello" },
		{
			role: "assistant",
			content: [
				{ type: "text", text: "visible" },
				{ type: "image" },
				{ type: "toolCall", name: "read", arguments: { path: "x" } },
				{ type: "other" },
				null,
				"stray",
			],
		},
		{ role: "toolResult", toolName: "read", isError: true, content: "boom" },
		{ role: "toolResult", toolName: "write", isError: false, content: "done" },
		{ role: "bashExecution", command: "ls", output: "x" },
		{ role: "custom", customType: "note", content: "c" },
		{ role: "branchSummary", summary: "branch" },
		{ role: "compactionSummary", summary: "prior" },
		{ role: "user", content: 42 },
	]);
	for (const label of [
		"[User message]",
		"[Assistant visible response]",
		"[Tool result: read; error]",
		"[Tool result: write; success]",
		"[User shell execution]",
		"[Extension message: note]",
		"[Branch summary; provenance not reclassified]",
		"[Previous compaction summary; provenance not reclassified]",
		"[image omitted]",
		"[tool call read:",
	]) {
		assert.ok(text.includes(label), `missing ${label}`);
	}
	assert.equal(serializeObservableMessages([{ role: "wat", content: "x" }]), "");
	assert.equal(serializeObservableMessages([]), "");
	assert.equal(serializeObservableMessages([{ role: "user", content: "hi" }], 0), "");
	assert.equal(
		serializeObservableMessages([{ role: "user", content: "   " }]),
		"[User message]\n   ",
	);
	const circular = [];
	circular.push(circular);
	const structured = serializeObservableMessages([
		{
			role: "assistant",
			content: [
				{ type: "toolCall", name: "array", arguments: circular },
				{
					type: "toolCall",
					name: "deep",
					arguments: { a: { b: { c: { d: { e: "leaf" } } } } },
				},
			],
		},
	]);
	assert.match(structured, /circular value omitted/);
	assert.match(structured, /nested value omitted/);
});

test("bounded tool-call serialization handles scalar, array, inherited, and truncated values", () => {
	const inherited = Object.create({ inherited: "skip" });
	Object.assign(inherited, { first: true, second: 3, third: null, fourth: ["x", "y"] });
	const values = serializeObservableMessages([
		{
			role: "assistant",
			content: [
				{ type: "toolCall", name: "scalars", arguments: inherited },
				{ type: "toolCall", name: "empty", arguments: {} },
				{
					type: "toolCall",
					name: "full",
					arguments: Object.fromEntries(
						Array.from({ length: 12 }, (_, index) => [`key-${index}`, "z".repeat(4_000)]),
					),
				},
			],
		},
	]);
	assert.match(values, /first/);
	assert.match(values, /second/);
	assert.match(values, /third/);
	assert.match(values, /fourth/);
	assert.doesNotMatch(values, /inherited/);
	assert.ok(Buffer.byteLength(values) <= 4_000);
});

test("observable serialization bounds aggregates deterministically", () => {
	const many = Array.from({ length: 20 }, (_, index) => ({
		role: "user",
		content: `message-${index} ${"x".repeat(2000)}`,
	}));
	const omitted = serializeObservableMessages(many);
	assert.ok(omitted.startsWith("[earlier messages omitted"));
	const tiny = serializeObservableMessages([{ role: "user", content: "y".repeat(40000) }], 100);
	assert.ok(Buffer.byteLength(tiny) <= 100);
	assert.match(tiny, /truncated after/);
	const marker = serializeObservableMessages([{ role: "user", content: "y".repeat(40000) }], 10);
	assert.ok(Buffer.byteLength(marker) <= 10);
	const emoji = serializeObservableMessages([{ role: "user", content: "🧪".repeat(5000) }], 100);
	assert.ok(Buffer.byteLength(emoji) <= 100);
	assert.doesNotMatch(emoji, /�/);
	const fitting = serializeObservableMessages([{ role: "user", content: "short" }]);
	assert.doesNotMatch(fitting, /earlier messages omitted/);
});

test("recorded decision attributions stop at the next section and cap entries", () => {
	assert.equal(previousRecordedDecisionAttributions("plain text"), "");
	const section = Array.from(
		{ length: 14 },
		(_, index) => `- [user-explicit] decision-${index}`,
	).join("\n");
	const summary = `# Continuation\n\n## Decisions\n\n${section}\n## Next action\n\nx\n`;
	assert.equal(previousRecordedDecisionAttributions(summary).split("\n").length, 12);
});

test("compaction prompt includes bounded missing-core and cycle diagnostics", () => {
	const prompt = buildCompactionPrompt(
		{
			preparation: { messagesToSummarize: [], turnPrefixMessages: [], firstKeptEntryId: "none" },
		},
		{ files: [], paths: Array.from({ length: 20 }, (_, index) => `artifact-${index}.md`) },
		{
			changed: Array(100).fill("c".repeat(10_000)),
			missing: Array(100).fill("m".repeat(10_000)),
			impacted: Array(100).fill({
				path: "p".repeat(10_000),
				from: Array(100).fill("f".repeat(10_000)),
				direct: true,
			}),
			errors: Array(100).fill({ path: "e".repeat(10_000), message: "x".repeat(10_000) }),
			missingCore: ["PROJECT.md", ...Array.from({ length: 12 }, (_, index) => `missing-${index}`)],
			cycles: [Array.from({ length: 14 }, (_, index) => `cycle-${index}`)],
			projectErrors: Array(100).fill("e".repeat(10_000)),
		},
		"INBOX.md",
	);
	const statusMarker = "\nStatus:\n",
		statusJson = prompt.slice(prompt.lastIndexOf(statusMarker) + statusMarker.length);
	assert.ok(Buffer.byteLength(statusJson) <= 8 * 1024);
	const status = JSON.parse(statusJson);
	assert.match(JSON.stringify(status), /PROJECT\.md/);
	assert.match(JSON.stringify(status), /cycle-0/);
	assert.match(JSON.stringify(status), /additional entries omitted/);
	assert.match(prompt, /additional paths omitted/);

	const escaped = "\u0001".repeat(128),
		missingCorePath = `PROJECT.md${escaped}`,
		cyclePath = `A.md${escaped}`,
		overflowPrompt = buildCompactionPrompt(
			{
				preparation: {
					messagesToSummarize: [],
					turnPrefixMessages: [],
					firstKeptEntryId: "none",
				},
			},
			{ files: [], paths: [] },
			{
				changed: [escaped, escaped, escaped],
				missing: [escaped, escaped, escaped],
				impacted: Array(3).fill({
					path: escaped,
					from: [escaped, escaped, escaped],
					direct: true,
				}),
				errors: Array(3).fill({ path: escaped, message: escaped }),
				missingCore: [missingCorePath, escaped, escaped, escaped],
				cycles: [[cyclePath, escaped, escaped, escaped]],
				projectErrors: [escaped, escaped, escaped],
			},
			"INBOX.md",
		),
		overflowJson = overflowPrompt.slice(
			overflowPrompt.lastIndexOf(statusMarker) + statusMarker.length,
		);
	assert.ok(Buffer.byteLength(overflowJson) <= 8 * 1024);
	const overflowStatus = JSON.parse(overflowJson);
	assert.equal(overflowStatus.truncated, true);
	assert.equal(overflowStatus.missingCore[0].startsWith("PROJECT.md"), true);
	assert.equal(overflowStatus.cycles[0][0].startsWith("A.md"), true);
});

test("compaction prompt fills defaults for missing summary and retained tail", () => {
	const prompt = buildCompactionPrompt(
		{
			preparation: {
				messagesToSummarize: [],
				turnPrefixMessages: [],
				firstKeptEntryId: "missing",
			},
		},
		{ files: [], paths: [] },
		{},
		"INBOX.md",
	);
	assert.match(prompt, /Focus: none/);
	assert.match(prompt, /Retained recent messages:\nnone/);
	const retained = buildCompactionPrompt(
		{
			preparation: {
				messagesToSummarize: [],
				turnPrefixMessages: [],
				firstKeptEntryId: "keep",
			},
			branchEntries: [
				{ id: "old", type: "message", message: { role: "user", content: "dropped" } },
				{ id: "keep", type: "message", message: { role: "user", content: "tail" } },
				{ id: "skip", type: "note" },
			],
		},
		{ files: [], paths: [] },
		{ changed: [], missing: [], impacted: [], errors: [], projectErrors: [] },
		"INBOX.md",
	);
	assert.match(retained, /tail/);
	assert.doesNotMatch(retained, /dropped/);
});

test("pending proposals count only well-formed lines and surface read errors", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-pending-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	assert.equal(await pendingPromotions({ canonical: { inbox: join(root, "MISSING.md") } }), 0);
	const inbox = join(root, "INBOX.md");
	await writeFile(inbox, "- {todo} do it\nnoise\n- {agents} be it\n- {todo}no-space\n");
	assert.equal(await pendingPromotions({ canonical: { inbox } }), 2);
	await assert.rejects(pendingPromotions({ canonical: { inbox: root } }), /EISDIR/);
});

test("working-memory file filtering drops missing/invalid paths but surfaces unexpected I/O errors", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-filter-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "REAL.md"), "x\n");
	await symlink("LOOP.md", join(root, "LOOP.md"));
	assert.deepEqual(
		await filterWorkingMemoryFiles({ projectRoot: root }, new Set(["SNAP.md"]), [
			"REAL.md",
			"NOPE.md",
			"../outside.md",
			"SNAP.md",
		]),
		["REAL.md", "SNAP.md"],
	);
	await assert.rejects(
		filterWorkingMemoryFiles({ projectRoot: root }, new Set(), ["LOOP.md"]),
		(error) => error.code === "ELOOP",
	);
});

test("snapshots skip duplicate and inbox-aliased roles but surface other errors", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-snapshot-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const shared = join(root, "SHARED.md");
	await writeFile(shared, "shared\n");
	const inbox = join(root, "INBOX.md");
	await writeFile(inbox, "inbox\n");
	const snapshot = await compactionSnapshot(
		{
			projectRoot: root,
			canonical: { project: shared, todo: shared, decisions: join(root, "MISSING.md"), inbox },
			syncPath: join(root, "SYNC.json"),
		},
		{ manifest: { artifacts: [{ path: "EXTRA.md" }] } },
	);
	assert.equal(snapshot.files.length, 1);
	assert.ok(snapshot.paths.includes("EXTRA.md"));
	const aliased = await compactionSnapshot(
		{
			projectRoot: root,
			canonical: {
				project: inbox,
				todo: join(root, "MISSING.md"),
				decisions: join(root, "MISSING.md"),
				inbox,
			},
			syncPath: join(root, "SYNC.json"),
		},
		{},
	);
	assert.equal(aliased.files.length, 0);
	await mkdir(join(root, "state"));
	await assert.rejects(
		compactionSnapshot(
			{
				projectRoot: root,
				canonical: {
					project: shared,
					todo: join(root, "state"),
					decisions: join(root, "MISSING.md"),
					inbox,
				},
				syncPath: join(root, "SYNC.json"),
			},
			{},
		),
		/EISDIR/,
	);
});

test("compact refuses an inbox that aliases SYNC.json", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-alias-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n## Objective\nTest\n## Current direction\nTest\n## Definition of done\nTest\n## Previous action\nTest\n## Immediate next step\nTest\n",
	);
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({
			version: 2,
			confirmedAt: "now",
			canonical: { inbox: "SYNC.json" },
			artifacts: [],
		}),
	);
	const notices = [];
	const result = await compact(
		{
			reason: "manual",
			signal: new AbortController().signal,
			preparation: { messagesToSummarize: [], turnPrefixMessages: [], firstKeptEntryId: "x" },
		},
		{
			cwd: root,
			model: { maxTokens: 2048 },
			modelRegistry: { getApiKeyAndHeaders: async () => ({ ok: true, apiKey: "key" }) },
			ui: {
				notify(message) {
					notices.push(message);
				},
			},
		},
		async () => ({
			content: [
				{
					type: "text",
					text: JSON.stringify({
						workingMemory: memory,
						promotions: [{ target: "todo", proposal: "aliased" }],
					}),
				},
			],
			usage: { input: 1, output: 1, totalTokens: 2 },
			stopReason: "stop",
		}),
	);
	assert.equal(result, undefined);
	assert.match(notices.join("\n"), /aliases SYNC\.json/);
});
