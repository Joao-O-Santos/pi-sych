import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	COMPACTION_FILE_BYTE_LIMIT,
	compact,
	compactionSnapshot,
	parseCompactionModelOutput,
} from "../../.test-build/workbench/src/compaction.js";

async function compactFixture(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-boundary-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n## Objective\nTest\n## Current direction\nTest\n## Definition of done\nTest\n## Previous action\nTest\n## Immediate next step\nTest\n",
	);
	const notifications = [];
	const ctx = {
		cwd: root,
		model: { maxTokens: 2_048 },
		modelRegistry: {
			getApiKeyAndHeaders: async () => ({ ok: true, apiKey: "test-key" }),
		},
		ui: { notify: (...args) => notifications.push(args) },
	};
	const controller = new AbortController();
	const event = {
		reason: "manual",
		signal: controller.signal,
		preparation: {
			messagesToSummarize: [],
			turnPrefixMessages: [],
			previousSummary: undefined,
			firstKeptEntryId: "kept",
			tokensBefore: 99,
		},
	};
	return { ctx, event, controller, notifications };
}

const validResponse = {
	content: [
		{
			type: "text",
			text: JSON.stringify({
				workingMemory: {
					task: "Continue",
					constraints: [],
					active: [],
					blockers: [],
					next: "Run tests",
					files: ["PROJECT.md"],
				},
				promotions: [],
			}),
		},
	],
	usage: { input: 10, output: 5, totalTokens: 15 },
};

test("promotion proposals cannot create additional inbox lines", () => {
	const value = {
		workingMemory: {
			task: "Continue",
			constraints: [],
			active: [],
			blockers: [],
			next: "Test",
			files: [],
		},
		promotions: [{ target: "todo", proposal: "First line\n- {project} injected line" }],
	};
	assert.throws(
		() => parseCompactionModelOutput(JSON.stringify(value)),
		/proposal must be one line/,
	);
});

test("compact preserves a model limit below 4096 and propagates the event signal", async (t) => {
	const { ctx, event, controller, notifications } = await compactFixture(t);
	let options;
	const result = await compact(event, ctx, async (_model, _prompt, receivedOptions) => {
		options = receivedOptions;
		return validResponse;
	});
	assert.equal(options.maxTokens, 2_048);
	assert.equal(options.signal, controller.signal);
	assert.equal(result.compaction.firstKeptEntryId, "kept");
	assert.equal(notifications.length, 1);
});

test("snapshot clips multibyte text on a valid UTF-8 boundary within the byte limit", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-unicode-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const projectPath = join(root, "PROJECT.md");
	await writeFile(projectPath, "🧪".repeat(COMPACTION_FILE_BYTE_LIMIT));
	const snapshot = await compactionSnapshot(
		{
			projectRoot: root,
			canonical: {
				project: projectPath,
				todo: join(root, "TODO.md"),
				decisions: join(root, "DECISIONS.md"),
			},
		},
		{},
	);
	const content = snapshot.files[0].content;
	assert.ok(Buffer.byteLength(content, "utf8") <= COMPACTION_FILE_BYTE_LIMIT);
	assert.doesNotMatch(content, /�/);
	assert.match(content, /\[truncated after 16384 bytes\]$/);
});

test("snapshot de-duplicates canonical aliases while retaining useful missing paths", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compaction-alias-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const shared = join(root, "state/SHARED.md");
	const missing = join(root, "state/MISSING.md");
	await mkdir(join(root, "state"));
	await writeFile(shared, "shared project state\n");
	const project = {
		projectRoot: root,
		canonical: {
			project: shared,
			todo: shared,
			decisions: missing,
		},
	};
	const snapshot = await compactionSnapshot(project, {
		manifest: {
			artifacts: [
				{ path: "state/SHARED.md" },
				{ path: "reports/result.md" },
				{ path: "reports/result.md" },
			],
		},
	});
	assert.deepEqual(snapshot.files, [
		{ path: "state/SHARED.md", content: "shared project state\n" },
	]);
	assert.deepEqual(snapshot.paths, ["state/SHARED.md", "state/MISSING.md", "reports/result.md"]);
});
