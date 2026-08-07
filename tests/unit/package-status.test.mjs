import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import piSychPlannotator from "../../.test-build/plannotator/index.js";
import { registerPlannotator } from "../../.test-build/plannotator/runtime.js";
import piSychWorkbench, {
	configuredSupervisorInstructions,
	formatDispatchWorkerOutcome,
	SUPERVISOR_GUIDANCE,
	shouldCompactAt100k,
} from "../../.test-build/workbench/index.js";
import { DEFAULT_CONFIG } from "../../.test-build/workbench/src/config-directory.js";

async function capturedExtension(extension) {
	const tools = [];
	const commands = [];
	const commandHandlers = new Map();
	const events = new Map();
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-ext-"));
	const prev = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = agentDir;
	try {
		await extension({
			on(name, handler) {
				events.set(name, handler);
			},
			registerTool(tool) {
				tools.push(tool);
			},
			registerCommand(name, command) {
				commands.push(name);
				commandHandlers.set(name, command);
			},
		});
	} finally {
		if (prev === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = prev;
	}
	return { tools, commands, commandHandlers, events };
}

test("core and Plannotator extensions register separate public surfaces", async () => {
	const core = await capturedExtension(piSychWorkbench);
	assert.deepEqual(
		core.tools.map((tool) => tool.name),
		["dispatch_worker", "project_status"],
	);
	assert.deepEqual(core.commands, ["pi-sych-status", "pi-sych-mcp"]);

	const commands = [];
	await piSychPlannotator({
		registerCommand(name) {
			commands.push(name);
		},
	});
	assert.deepEqual(commands, ["plannotator-last", "plannotator-annotate", "plannotator-review"]);
	const failedCommands = [];
	await assert.rejects(
		registerPlannotator(
			{
				registerCommand(name) {
					failedCommands.push(name);
				},
			},
			{
				async preload() {
					throw new Error("incompatible adapter");
				},
				last: async () => undefined,
				file: async () => ({ url: "" }),
				review: async () => ({ url: "" }),
			},
		),
		/incompatible adapter/,
	);
	assert.deepEqual(failedCommands, []);
	assert.doesNotMatch(SUPERVISOR_GUIDANCE, /submit_plan/);
});

test("Plannotator handlers report results and recover from invalid input", async () => {
	const commands = new Map(),
		messages = [],
		notices = [];
	const pi = {
		registerCommand(name, command) {
			commands.set(name, command);
		},
		async sendUserMessage(message) {
			messages.push(message);
		},
	};
	const cwd = await mkdtemp(join(tmpdir(), "pi-sych-annotation-"));
	await writeFile(join(cwd, "note.md"), "note");
	const ctx = { cwd, ui: { notify: (message, type) => notices.push({ message, type }) } };
	const session = {
		url: "https://review",
		waitForDecision: async () => ({ feedback: "feedback" }),
	};
	const runtime = {
		preload: async () => undefined,
		last: async () => session,
		file: async () => session,
		review: async () => session,
	};
	await registerPlannotator(pi, runtime);
	await commands.get("plannotator-last").handler("", ctx);
	await new Promise((done) => setImmediate(done));
	assert.deepEqual(messages, ["feedback"]);
	await commands.get("plannotator-annotate").handler("note.md", ctx);
	await new Promise((done) => setImmediate(done));
	assert.equal(await readFile(join(cwd, "note.md.feedback.md"), "utf8"), "feedback\n");
	await commands.get("plannotator-review").handler("--no-local", ctx);
	await new Promise((done) => setImmediate(done));
	assert.equal(await readFile(join(cwd, "PLANNOTATOR_REVIEW.md"), "utf8"), "feedback\n");
	await commands.get("plannotator-annotate").handler("/outside.md", ctx);
	assert.equal(notices.at(-1).type, "error");
	runtime.last = async () => undefined;
	await commands.get("plannotator-last").handler("", ctx);
	assert.match(notices.at(-1).message, /No assistant message/);
	runtime.review = async () => ({
		url: "https://review",
		waitForDecision: async () => {
			throw new Error("review failed");
		},
	});
	await commands.get("plannotator-review").handler("", ctx);
	await new Promise((done) => setImmediate(done));
	assert.match(notices.at(-1).message, /review failed/);
});

test("code-review arguments omit absent optional keys and preserve the small condition matrix", async () => {
	const { parseCodeReviewArgs } = await import("../../.test-build/workbench/src/plannotator.js");
	assert.deepEqual(parseCodeReviewArgs(), { useLocal: true });
	assert.deepEqual(parseCodeReviewArgs("--git https://example.test/pr"), {
		prUrl: "https://example.test/pr",
		vcsType: "git",
		useLocal: true,
	});
	for (const [args, expected] of [
		["", { useLocal: true }],
		["--git", { vcsType: "git", useLocal: true }],
		["--gitbutler", { vcsType: "gitbutler", useLocal: true }],
		["--git --gitbutler", { vcsType: "gitbutler", useLocal: true }],
		["--no-local", { useLocal: false }],
		["--git --no-local", { vcsType: "git", useLocal: false }],
		["--gitbutler --no-local", { vcsType: "gitbutler", useLocal: false }],
		["--git --gitbutler --no-local", { vcsType: "gitbutler", useLocal: false }],
	])
		assert.deepEqual(parseCodeReviewArgs(args), expected);
	assert.deepEqual(parseCodeReviewArgs("--git --gitbutler --no-local https://example.test/pr"), {
		prUrl: "https://example.test/pr",
		vcsType: "gitbutler",
		useLocal: false,
	});
});

test("configured project instructions are available to the supervisor without a model catalog", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-supervisor-"));
	await writeFile(join(root, "AGENTS.md"), "Prefer direct evidence.\n");
	const instructions = await configuredSupervisorInstructions(root);
	assert.match(instructions ?? "", /Prefer direct evidence/);
	assert.equal(await configuredSupervisorInstructions(root, "Prefer direct evidence."), undefined);
});
test("100k compaction threshold covers disabled, below, boundary, and above cases", () => {
	assert.equal(shouldCompactAt100k(false, 100_000), false);
	assert.equal(shouldCompactAt100k(true, 99_999), false);
	assert.equal(shouldCompactAt100k(true, 100_000), true);
	assert.equal(shouldCompactAt100k(true, 100_001), true);
});

test("workbench lifecycle and status commands cover configured branches", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-sych-workbench-"));
	await mkdir(join(cwd, ".pi/pi-sych"), { recursive: true });
	await writeFile(
		join(cwd, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await writeFile(join(cwd, "PROJECT.md"), "# Project\n\n## Objective\n\nTest\n");
	await writeFile(
		join(cwd, ".pi/pi-sych/config.json"),
		JSON.stringify({ ...DEFAULT_CONFIG, compaction: { custom: true, compactAt100k: true } }),
	);
	const notifications = [],
		compacted = [];
	const extension = await capturedExtension(piSychWorkbench);
	const ctx = {
		cwd,
		model: undefined,
		getContextUsage: () => ({ tokens: 100_000 }),
		compact: () => compacted.push(true),
		ui: { notify: (message, type) => notifications.push({ message, type }) },
	};
	const before = await extension.events.get("before_agent_start")({ systemPrompt: "system" }, ctx);
	assert.match(before.systemPrompt, /Pi Sych/);
	await writeFile(join(cwd, "AGENTS.md"), "Local rule\n");
	await writeFile(
		join(cwd, ".pi/pi-sych/models.json"),
		JSON.stringify({ default: "x", models: { x: { model: "x/y" } } }),
	);
	const withCatalog = await extension.events.get("before_agent_start")(
		{ systemPrompt: "system" },
		{ ...ctx, getContextUsage: () => ({ tokens: null }) },
	);
	assert.match(withCatalog.systemPrompt, /x: cost unspecified; no notes/);
	const withExisting = await configuredSupervisorInstructions(cwd, "Local rule");
	assert.equal(withExisting, undefined);
	assert.equal(compacted.length, 1);
	await extension.events.get("session_before_compact")(
		{ preparation: { messagesToSummarize: [], turnPrefixMessages: [] } },
		ctx,
	);
	const status = extension.tools.find((tool) => tool.name === "project_status");
	await status.execute("id", { action: "check" }, undefined, undefined, ctx);
	await assert.rejects(
		status.execute("id", { action: "acknowledge" }, undefined, undefined, ctx),
		/requires named files/,
	);
	await extension.commandHandlers.get("pi-sych-status").handler("", ctx);
	await extension.commandHandlers.get("pi-sych-mcp").handler("", ctx);
	assert.ok(notifications.length >= 2);
	await writeFile(
		join(cwd, ".pi/pi-sych/config.json"),
		JSON.stringify({ ...DEFAULT_CONFIG, compaction: { custom: false, compactAt100k: false } }),
	);
	const disabledCtx = { ...ctx, getContextUsage: () => ({ tokens: 1 }) };
	assert.equal(
		await extension.events.get("session_before_compact")({ preparation: {} }, disabledCtx),
		undefined,
	);
});

test("worker output is reduced to result essentials", () => {
	assert.match(
		formatDispatchWorkerOutcome({
			launch: { exitCode: 1, stderr: "", classification: "timeout", terminationSignal: "SIGTERM" },
			error: "worker timed out",
		}),
		/Process warning: timeout/,
	);
	assert.match(
		formatDispatchWorkerOutcome({
			launch: { exitCode: 0, stderr: "" },
			error: "no result",
		}),
		/Summary: no result/,
	);
	const text = formatDispatchWorkerOutcome({
		id: "x",
		model: "m",
		timeoutMs: 1,
		launch: { exitCode: 0, stderr: "" },
		result: { status: "complete", summary: "done", files: ["A.md"], limitations: [] },
	});
	assert.match(text, /Files:\n- A.md/);
	assert.doesNotMatch(text, /Result package|Artifacts/);
});
