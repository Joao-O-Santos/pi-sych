import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import workbench, {
	formatDispatchWorkerCallSummary,
	formatDispatchWorkerOutcome,
} from "../../.test-build/workbench/index.js";
import { DEFAULT_CONFIG } from "../../.test-build/workbench/src/config-directory.js";

test("workbench wires status, worker, compaction, and one-shot completion reassessment", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-registration-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi/pi-sych"), { recursive: true });
	await writeFile(join(root, "PROJECT.md"), "# Project\n\n## Objective\n\nTest\n");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await writeFile(
		join(root, ".pi/pi-sych/config.json"),
		JSON.stringify({
			...DEFAULT_CONFIG,
			completionReassessment: true,
			compaction: { custom: true, thresholdTokens: 150_000 },
		}),
	);
	const previous = process.cwd();
	const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = join(root, "agent");
	process.chdir(root);
	t.after(() => {
		process.chdir(previous);
		if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
	});
	const tools = [],
		commands = new Map(),
		events = new Map();
	await workbench({
		registerTool(tool) {
			tools.push(tool);
		},
		registerCommand(name, command) {
			commands.set(name, command);
		},
		on(name, handler) {
			events.set(name, handler);
		},
	});
	assert.deepEqual(
		tools.map(({ name }) => name),
		["dispatch_worker", "project_status", "literature_search"],
	);
	assert.deepEqual([...commands.keys()], ["pi-sych-status"]);
	assert.deepEqual(
		[...events.keys()],
		[
			"before_agent_start",
			"session_start",
			"message_start",
			"agent_before_settle",
			"agent_settled",
			"session_before_compact",
		],
	);
	assert.equal(tools.find(({ name }) => name === "dispatch_worker").exposure, "model-only");
	assert.equal(
		tools.find(({ name }) => name === "project_status").parameters.properties.action.type,
		undefined,
	);
	const requests = [];
	const ctx = {
		cwd: root,
		getContextUsage: () => ({ tokens: 150_000 }),
		model: { contextWindow: 200_000 },
		isIdle: () => true,
		hasPendingMessages: () => false,
		compact: (request) => requests.push(request),
	};
	await events.get("agent_settled")({}, ctx);
	await events.get("agent_settled")({}, ctx);
	assert.equal(requests.length, 1);
	requests[0].onComplete();
	await events.get("agent_settled")({}, ctx);
	assert.equal(requests.length, 2);
	requests[1].onError(new Error("native compaction failed"));
	await events.get("agent_settled")({}, ctx);
	assert.equal(requests.length, 3);
	const statusTool = tools.find(({ name }) => name === "project_status");
	const status = await statusTool.execute("id", { action: "check" }, undefined, undefined, ctx);
	assert.match(status.content[0].text, /Project status/);
	assert.deepEqual(status.details.changed, []);
	const dispatchTool = tools.find(({ name }) => name === "dispatch_worker");
	await assert.rejects(
		dispatchTool.execute(
			"id",
			{ task: "run", expectedOutput: "report", mode: "read-only", contextFiles: [] },
			undefined,
			undefined,
			ctx,
		),
		/Worker model catalog is unavailable or invalid/,
	);
	await writeFile(
		join(root, ".pi/pi-sych/config.json"),
		JSON.stringify({
			...DEFAULT_CONFIG,
			completionReassessment: true,
			compaction: { custom: false, thresholdTokens: 150_000 },
		}),
	);
	const before = await events.get("session_before_compact")({ preparation: {} }, ctx);
	assert.equal(before, undefined);

	const prompt = await events.get("before_agent_start")({ systemPrompt: "system" }, ctx);
	assert.match(prompt.systemPrompt, /Pi Sych is a small mechanical substrate/);
	await events.get("session_start")({}, ctx);
	const beforeSettle = events.get("agent_before_settle");
	await events.get("message_start")({ message: { role: "user" } });
	const settledBoundary = {
		outcome: "completed",
		context: { pendingMessages: [], canContinue: true },
	};
	const reassessment = await beforeSettle(settledBoundary, ctx);
	assert.equal(reassessment.continue, true);
	assert.equal(reassessment.entries[0].display, false);
	assert.match(
		reassessment.entries[0].content,
		/If actionable work remains within the existing request and authorization, continue; otherwise stop/,
	);
	assert.match(
		reassessment.entries[0].content,
		/Do not broaden scope, invent tasks, or infer new authorization/,
	);
	assert.match(
		reassessment.entries[0].content,
		/If genuinely blocked, stop and report the blocker/,
	);
	// A completed reassessment settles without requesting a second continuation.
	assert.equal(await beforeSettle(settledBoundary, ctx), undefined);

	await events.get("message_start")({ message: { role: "user" } });
	assert.equal(
		await beforeSettle(
			{ ...settledBoundary, context: { pendingMessages: [{ role: "user" }], canContinue: true } },
			ctx,
		),
		undefined,
	);
	assert.equal((await beforeSettle(settledBoundary, ctx)).continue, true);

	const dispatch = tools.find(({ name }) => name === "dispatch_worker");
	assert.match(
		formatDispatchWorkerCallSummary({
			task: "  do\n this  ",
			mode: "read-only",
			timeoutMs: 90_000,
		}),
		/task-summary: do this[\s\S]*context: clean[\s\S]*research: none[\s\S]*timeout: 90s/,
	);
	const rendered = dispatch.renderCall(
		{ task: "short", mode: "read-only", timeoutMs: 1 },
		{ fg: (_name, text) => text, bold: (text) => text },
		{ expanded: false },
	);
	assert.ok(rendered);
	const expanded = dispatch.renderCall(
		{ task: "short", mode: "read-only", timeoutMs: 1 },
		{ fg: (_name, text) => text, bold: (text) => text },
		{ expanded: true },
	);
	assert.ok(expanded);
});

test("workbench dispatches through Pi and reports command status failures", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-workbench-boundaries-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi/pi-sych"), { recursive: true });
	await writeFile(join(root, "PROJECT.md"), "# Project\n\n## Objective\n\nTest\n");
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	await writeFile(
		join(root, ".pi/pi-sych/config.json"),
		JSON.stringify({ ...DEFAULT_CONFIG, compaction: { custom: false, thresholdTokens: 150_000 } }),
	);
	const agentDir = join(root, "agent");
	await mkdir(join(agentDir, "pi-sych/worker-agent"), { recursive: true });
	await writeFile(join(agentDir, "pi-sych/worker-agent/settings.json"), "{}\n");
	await writeFile(
		join(agentDir, "pi-sych/worker-models.json"),
		JSON.stringify({
			default: "worker",
			models: { worker: { model: "test/fake", cost: "free", notes: "test model" } },
		}),
	);
	const bin = join(root, "bin");
	await mkdir(bin);
	const fakePi = join(bin, "pi");
	await writeFile(
		fakePi,
		'#!/usr/bin/env node\nconst args = process.argv.slice(2);\nconst nativeResearch = args.includes("builtin:mcp") && args.includes("builtin:codemode");\nif (!nativeResearch || !args.includes("--thinking")) process.exit(1);\nrequire("node:fs").writeFileSync(process.env.PI_SYCH_RESULT_PATH, JSON.stringify({ status: "complete", summary: "fake worker completed", files: [], limitations: ["fake limitation"] }));\nconsole.log(JSON.stringify({ type: "tool_execution_start", toolName: "read", args: { path: "PROJECT.md" } }));\n',
	);
	await chmod(fakePi, 0o755);
	const previous = {
		cwd: process.cwd(),
		agentDir: process.env.PI_CODING_AGENT_DIR,
		path: process.env.PATH,
	};
	process.env.PI_CODING_AGENT_DIR = agentDir;
	process.env.PATH = `${bin}:${previous.path}`;
	process.chdir(root);
	t.after(() => {
		process.chdir(previous.cwd);
		if (previous.agentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous.agentDir;
		if (previous.path === undefined) delete process.env.PATH;
		else process.env.PATH = previous.path;
	});
	const tools = [],
		commands = new Map(),
		events = new Map(),
		updates = [],
		notices = [];
	await workbench({
		registerTool(tool) {
			tools.push(tool);
		},
		registerCommand(name, command) {
			commands.set(name, command);
		},
		on(name, handler) {
			events.set(name, handler);
		},
	});
	assert.equal(
		await events.get("agent_before_settle")(
			{ outcome: "completed", context: { pendingMessages: [], canContinue: true } },
			{ cwd: root },
		),
		undefined,
	);
	const sessionManager = SessionManager.create(root, join(root, "sessions"));
	sessionManager.appendMessage({ role: "user", content: "Continue the task." });
	sessionManager.appendMessage({
		role: "assistant",
		content: [{ type: "toolCall", id: "dispatch-id", name: "dispatch_worker", arguments: {} }],
	});
	const ctx = {
		cwd: root,
		sessionManager,
		ui: { notify: (message, type) => notices.push({ message, type }) },
	};
	const dispatch = tools.find(({ name }) => name === "dispatch_worker");
	const outcome = await dispatch.execute(
		"dispatch-id",
		{
			task: "inspect",
			expectedOutput: "report",
			mode: "full-host",
			contextFiles: [],
			skills: ["code"],
			remoteResearch: true,
			thinkingLevel: "low",
		},
		new AbortController().signal,
		(update) => updates.push(update),
		ctx,
	);
	assert.match(outcome.content[0].text, /Worker status: complete/);
	assert.equal(outcome.details.result.summary, "fake worker completed");
	assert.match(outcome.content[0].text, /- fake limitation/);
	assert.deepEqual(updates.at(-1).details.activity, ["read PROJECT.md"]);
	const trajectory = await dispatch.execute(
		"dispatch-id",
		{
			task: "continue",
			expectedOutput: "report",
			mode: "full-host",
			contextMode: "trajectory",
			contextFiles: [],
			skills: ["code"],
			remoteResearch: true,
			thinkingLevel: "low",
		},
		undefined,
		undefined,
		ctx,
	);
	assert.equal(trajectory.details.result.summary, "fake worker completed");
	assert.match(
		formatDispatchWorkerCallSummary({
			task: "research",
			mode: "full-host",
			skills: ["research"],
			remoteResearch: true,
		}),
		/literature_search; native MCP\/codemode/,
	);
	assert.match(
		formatDispatchWorkerOutcome({
			launch: { exitCode: 0, stderr: "" },
			reportedFiles: [],
			observedChangedFiles: ["scratch.md"],
			unexpectedChanges: ["scratch.md"],
		}),
		/Unexpected changes:\n- scratch.md/,
	);
	const literature = tools.find(({ name }) => name === "literature_search");
	await assert.rejects(
		literature.execute("literature-id", { query: "test" }, undefined, undefined, ctx),
		/Literature database is unavailable/,
	);
	const prompt = await events.get("before_agent_start")({ systemPrompt: "system" }, ctx);
	assert.match(prompt.systemPrompt, /test model/);
	await mkdir(join(root, "AGENTS.md"));
	await assert.rejects(
		events.get("before_agent_start")({ systemPrompt: "system" }, ctx),
		/illegal operation|EISDIR/i,
	);

	await mkdir(join(root, "INBOX.md"));
	await commands.get("pi-sych-status").handler("", ctx);
	assert.equal(notices.at(-1).type, "error");
});
