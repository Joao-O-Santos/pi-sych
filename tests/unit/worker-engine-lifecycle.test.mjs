import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import {
	dispatchWorker,
	launchPiWorker,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const project = (root) => ({
	cwd: root,
	workspaceRoot: root,
	projectRoot: root,
	syncPath: join(root, "SYNC.json"),
	canonical: {
		project: join(root, "PROJECT.md"),
		agents: join(root, "AGENTS.md"),
		style: join(root, "STYLE.md"),
		evidence: join(root, "EVIDENCE.md"),
		decisions: join(root, "DECISIONS.md"),
		todo: join(root, "TODO.md"),
		inbox: join(root, "INBOX.md"),
	},
});
const request = { task: "inspect", mode: "read-only", expectedOutput: "summary", contextFiles: [] };
const catalog = { default: "worker", models: { worker: { model: "provider/model" } } };

async function readyProject(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-lifecycle-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const agentDir = join(root, "worker-agent");
	await writeFile(join(root, "A.md"), "a");
	await mkdir(agentDir, { recursive: true });
	await writeFile(join(agentDir, "settings.json"), "{}\n");
	return { root, agentDir, resolved: project(root) };
}

test("dispatch rejects empty assignment fields at the worker boundary", async (t) => {
	const { agentDir, resolved } = await readyProject(t);
	for (const field of ["task", "expectedOutput"]) {
		await assert.rejects(
			dispatchWorker({
				project: resolved,
				workerAgentDir: agentDir,
				request: { ...request, [field]: " \t\n" },
				catalog,
			}),
			new RegExp(`${field} must be a non-empty string`),
		);
	}
});

test("dispatch accepts a valid result and rejects reported path escapes", async (t) => {
	const { agentDir, resolved } = await readyProject(t);
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async (spec) => {
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: ["A.md"],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "done");
	const invalid = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async (spec) => {
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "bad",
				files: ["../outside"],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.match(invalid.error ?? "", /leaves the project root/);
});

test("dispatch compares reported files with observed changes and retains failed-worker changes", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	const successful = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async (spec) => {
			await writeFile(join(root, "A.md"), "changed\n");
			await writeFile(join(root, "notes.tmp"), "unreported\n");
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: ["A.md"],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.deepEqual(successful.reportedFiles, ["A.md"]);
	assert.deepEqual(successful.observedChangedFiles, ["A.md", "notes.tmp"]);
	assert.deepEqual(successful.unexpectedChanges, ["notes.tmp"]);

	const failed = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async () => {
			await writeFile(join(root, "residual.md"), "left behind\n");
			return { exitCode: null, stderr: "", classification: "timeout" };
		},
	});
	assert.match(failed.error, /timeout/i);
	assert.deepEqual(failed.reportedFiles, []);
	assert.deepEqual(failed.observedChangedFiles, ["residual.md"]);
	assert.deepEqual(failed.unexpectedChanges, ["residual.md"]);
});

test("dispatch reports an observation error when the project disappears after launch", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async (spec) => {
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: [],
				limitations: [],
			});
			await rm(root, { recursive: true, force: true });
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.deepEqual(outcome.observedChangedFiles, []);
	assert.match(outcome.observationError ?? "", /ENOENT/);
	assert.equal(outcome.result?.summary, "done");
});

test("dispatch snapshots symlink state in a non-Git project", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	await symlink("A.md", join(root, "alias.md"));
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async () => {
			await rm(join(root, "alias.md"));
			await symlink("missing.md", join(root, "alias.md"));
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.deepEqual(outcome.observedChangedFiles, ["alias.md"]);
});

test("dispatch observes tracked and untracked changes in Git projects", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	for (const args of [
		["init", "-q"],
		["config", "user.name", "Pi Sych test"],
		["config", "user.email", "test@example.invalid"],
		["add", "A.md"],
		["commit", "-qm", "baseline"],
	])
		execFileSync("git", args, { cwd: root, stdio: "ignore" });
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async () => {
			await writeFile(join(root, "A.md"), "changed\n");
			await writeFile(join(root, "notes.tmp"), "new\n");
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.deepEqual(outcome.observedChangedFiles, ["A.md", "notes.tmp"]);
});

test("dispatch scopes Git changes to a nested canonical project root", async (t) => {
	const { root, agentDir } = await readyProject(t);
	const projectRoot = join(root, "subproject");
	await mkdir(projectRoot);
	await writeFile(join(projectRoot, "A.md"), "base\n");
	for (const args of [
		["init", "-q"],
		["config", "user.name", "Pi Sych test"],
		["config", "user.email", "test@example.invalid"],
		["add", "subproject/A.md"],
		["commit", "-qm", "baseline"],
	])
		execFileSync("git", args, { cwd: root, stdio: "ignore" });
	const outcome = await dispatchWorker({
		project: project(projectRoot),
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async () => {
			await writeFile(join(projectRoot, "A.md"), "changed\n");
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.deepEqual(outcome.observedChangedFiles, ["A.md"]);
});

test("dispatch omits optional writing context when project and package defaults are absent", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	const packageRoot = join(root, "empty-package");
	await mkdir(packageRoot);
	let captured;
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		packageRoot,
		request: { ...request, skills: ["write"] },
		catalog,
		launcher: async (spec) => {
			captured = spec;
			return { exitCode: 1, stderr: "stop" };
		},
	});
	assert.match(outcome.error, /stop/);
	assert.deepEqual(captured.request.contextFiles, []);
});

test("trajectory dispatch fails before launching when no persisted trajectory is supplied", async (t) => {
	const { agentDir, resolved } = await readyProject(t);
	await assert.rejects(
		dispatchWorker({
			project: resolved,
			workerAgentDir: agentDir,
			request: { ...request, contextMode: "trajectory" },
			catalog,
		}),
		/Trajectory context is unavailable/,
	);
});

async function trajectory(_t, root) {
	const manager = SessionManager.create(root, join(root, "sessions"));
	manager.appendMessage({ role: "user", content: "Continue." });
	manager.appendMessage({
		role: "assistant",
		content: [{ type: "toolCall", id: "trajectory-call", name: "dispatch_worker", arguments: {} }],
	});
	const selected = manager
		.getEntries()
		.find((entry) => entry.type === "message" && entry.message.role === "assistant");
	assert.ok(selected, "trajectory fixture needs a dispatching assistant entry");
	return { manager, selected };
}

test("trajectory dispatch creates an isolated session and detects a changed supervisor", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	const { manager } = await trajectory(t, root);
	let sessionPath;
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request: { ...request, contextMode: "trajectory" },
		catalog,
		trajectory: { manager, toolCallId: "trajectory-call" },
		launcher: async (spec) => {
			sessionPath = spec.sessionPath;
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: [],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "done");
	assert.ok(sessionPath);
	assert.notEqual(sessionPath, manager.getSessionFile());

	let leafReads = 0;
	const changedSupervisor = {
		getSessionFile: () => manager.getSessionFile(),
		getEntries: () => manager.getEntries(),
		getLeafId: () => (leafReads++ ? "changed-leaf" : manager.getLeafId()),
	};
	let launched = false;
	await assert.rejects(
		dispatchWorker({
			project: resolved,
			workerAgentDir: agentDir,
			request: { ...request, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: changedSupervisor, toolCallId: "trajectory-call" },
			launcher: async () => {
				launched = true;
				return { exitCode: 0, stderr: "" };
			},
		}),
		/Supervisor session changed while preparing trajectory context/,
	);
	assert.equal(launched, false);
});

test("trajectory dispatch materializes a missing branched-session file", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	const { manager } = await trajectory(t, root);
	const branchPath = join(root, "worker-branch.jsonl");
	const createBranch = SessionManager.prototype.createBranchedSession;
	t.after(() => {
		SessionManager.prototype.createBranchedSession = createBranch;
	});
	SessionManager.prototype.createBranchedSession = () => branchPath;
	let captured;
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request: { ...request, contextMode: "trajectory" },
		catalog,
		trajectory: { manager, toolCallId: "trajectory-call" },
		launcher: async (spec) => {
			captured = spec.sessionPath;
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: [],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "done");
	assert.equal(captured, branchPath);
	assert.match(await readFile(branchPath, "utf8"), /trajectory-call/);
});

test("trajectory dispatch rejects cyclic persisted ancestry before launching", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	const { manager, selected } = await trajectory(t, root);
	const sourcePath = manager.getSessionFile();
	const records = (await readFile(sourcePath, "utf8"))
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line));
	const record = records.find((entry) => entry.id === selected.id);
	assert.ok(record, "trajectory fixture needs the selected persisted entry");
	record.parentId = selected.id;
	await writeFile(sourcePath, `${records.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
	const cyclicSelected = { ...selected, parentId: selected.id };
	const cyclicManager = {
		getSessionFile: () => sourcePath,
		getEntries: () =>
			manager.getEntries().map((entry) => (entry.id === selected.id ? cyclicSelected : entry)),
		getLeafId: () => manager.getLeafId(),
	};
	let launched = false;
	await assert.rejects(
		dispatchWorker({
			project: resolved,
			workerAgentDir: agentDir,
			request: { ...request, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: cyclicManager, toolCallId: "trajectory-call" },
			launcher: async () => {
				launched = true;
				return { exitCode: 0, stderr: "" };
			},
		}),
		/Trajectory ancestry contains a cycle/,
	);
	assert.equal(launched, false);
});

test("dispatch uses the requested role and timeout and exposes discovered paths", async (t) => {
	const { root, agentDir, resolved } = await readyProject(t);
	await writeFile(join(root, "context.md"), "context\n");
	const captured = [];
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request: {
			...request,
			modelRole: "reviewer",
			timeoutMs: 250,
			contextFiles: [{ path: "context.md", purpose: "review" }],
		},
		catalog: { default: "worker", models: { reviewer: { model: "provider/reviewer" } } },
		launcher: async (spec) => {
			captured.push(spec);
			return { exitCode: 1, stderr: "expected test failure" };
		},
	});
	assert.equal(outcome.model, "provider/reviewer");
	assert.equal(outcome.timeoutMs, 250);
	assert.match(outcome.error, /expected test failure/);
	assert.equal(captured[0].request.contextFiles[0].path, "context.md");
});

test("dispatch explains how to initialize a missing worker directory", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-missing-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await assert.rejects(
		dispatchWorker({
			project: project(root),
			workerAgentDir: join(root, "missing"),
			request,
			catalog,
		}),
		/Run: node .*bootstrap-worker-agent-dir\.mjs --agent-dir/,
	);
});

const launchSpec = (root, overrides = {}) => ({
	id: "test",
	request: { ...request, timeoutMs: 100, ...overrides.request },
	workerAgentDir: root,
	resultPath: join(root, "result.json"),
	projectRoot: root,
	model: "provider/model",
	prompt: "test",
	packageRoot: process.cwd(),
	extraExtensionPaths: [],
	...overrides,
});

function fakeSpawn() {
	const child = new EventEmitter();
	child.stdout = new PassThrough();
	child.stderr = new PassThrough();
	child.kills = [];
	child.kill = (signal) => {
		child.kills.push(signal);
		return true;
	};
	let launch;
	return {
		child,
		spawn: (...args) => {
			launch = args;
			return child;
		},
		get launch() {
			return launch;
		},
	};
}

test("abort then timeout then close stays cancelled and sends one SIGTERM", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const controller = new AbortController();
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root, { signal: controller.signal }), fake.spawn);
	controller.abort();
	t.mock.timers.tick(100);
	fake.child.emit("close", null, "SIGTERM");
	assert.deepEqual(await launched, { exitCode: null, stderr: "", classification: "cancelled" });
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
});

test("timeout then abort then close stays timeout and sends one SIGTERM", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const controller = new AbortController();
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root, { signal: controller.signal }), fake.spawn);
	t.mock.timers.tick(100);
	controller.abort();
	fake.child.emit("close", null, "SIGTERM");
	assert.deepEqual(await launched, { exitCode: null, stderr: "", classification: "timeout" });
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
});

for (const [label, signal] of [
	["timeout", undefined],
	["abort", "abort"],
]) {
	test(`${label} keeps termination ownership after a running child error`, async (t) => {
		t.mock.timers.enable({ apis: ["setTimeout"] });
		const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-error-"));
		t.after(() => rm(root, { recursive: true, force: true }));
		const controller = new AbortController(),
			fake = fakeSpawn(),
			launched = launchPiWorker(
				launchSpec(root, { ...(signal ? { signal: controller.signal } : {}) }),
				fake.spawn,
			);
		fake.child.emit("spawn");
		if (signal) controller.abort();
		else t.mock.timers.tick(100);
		fake.child.emit("error", new Error("SIGTERM failed while process is running"));
		t.mock.timers.tick(10_000);
		assert.deepEqual(fake.child.kills, ["SIGTERM", "SIGKILL"]);
		fake.child.emit("error", new Error("SIGKILL also reported an error"));
		let settled = false;
		void launched.then(() => (settled = true));
		await Promise.resolve();
		assert.equal(settled, false);
		fake.child.emit("close", null, "SIGKILL");
		assert.deepEqual((await launched).classification, signal ? "cancelled" : "timeout");
	});
}

test("ignored SIGTERM reaches SIGKILL after the grace period", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root), fake.spawn);
	t.mock.timers.tick(100);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	t.mock.timers.tick(9_999);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	t.mock.timers.tick(1);
	assert.deepEqual(fake.child.kills, ["SIGTERM", "SIGKILL"]);
	fake.child.emit("close", null, "SIGKILL");
	assert.equal((await launched).classification, "timeout");
});

test("shutdown allows a slow graceful exit before escalating", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(tmpdir()), fake.spawn);
	t.mock.timers.tick(100);
	t.mock.timers.tick(9_000);
	fake.child.emit("close", 0, null);
	assert.equal((await launched).classification, "timeout");
	t.mock.timers.tick(10_000);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
});

test("normal exit clears the deadline and grants inherited pipes a drain grace", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(tmpdir()), fake.spawn);
	fake.child.emit("exit", 0, null);
	t.mock.timers.tick(9_999);
	assert.deepEqual(fake.child.kills, []);
	fake.child.emit("close", 0, null);
	assert.equal((await launched).exitCode, 0);
	assert.equal((await launched).classification, undefined);
});

test("real inherited pipes cannot hold a completed worker open indefinitely", {
	skip: process.platform === "win32",
	timeout: 20_000,
}, async (t) => {
	let child;
	t.after(() => {
		try {
			process.kill(-child.pid, "SIGKILL");
		} catch {}
	});
	const started = Date.now();
	const outcome = await launchPiWorker(
		launchSpec(tmpdir(), { request: { ...request, timeoutMs: 2_000 } }),
		(_command, _args, options) => {
			child = spawn(
				process.execPath,
				[
					"--input-type=module",
					"-e",
					`
			import { spawn } from 'node:child_process';
			const descendant = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: ['ignore', process.stdout, process.stderr] });
			descendant.unref();
		`,
				],
				options,
			);
			return child;
		},
	);
	assert.equal(outcome.exitCode, 0);
	assert.equal(outcome.classification, undefined);
	assert.ok(Date.now() - started < 15_000);
});

test("real timeout cleans up descendants that ignore graceful termination", {
	skip: process.platform === "win32",
	timeout: 20_000,
}, async (t) => {
	let child;
	t.after(() => {
		try {
			process.kill(-child.pid, "SIGKILL");
		} catch {}
	});
	const started = Date.now();
	const outcome = await launchPiWorker(
		launchSpec(tmpdir(), { request: { ...request, timeoutMs: 2_000 } }),
		(_command, _args, options) => {
			child = spawn(
				process.execPath,
				[
					"--input-type=module",
					"-e",
					`
			import { spawn } from 'node:child_process';
			spawn(process.execPath, ['-e', "process.on('SIGTERM',()=>{}); setInterval(()=>{},1000)"], { stdio: ['ignore', process.stdout, process.stderr] });
			setInterval(()=>{},1000);
		`,
				],
				options,
			);
			return child;
		},
	);
	assert.equal(outcome.classification, "timeout");
	assert.ok(child.stdout.destroyed && child.stderr.destroyed);
	assert.ok(Date.now() - started < 17_000);
});

test("group signalling falls back to the direct worker on failure", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const fake = fakeSpawn();
	fake.child.pid = 12345;
	const kill = t.mock.method(process, "kill", () => {
		throw new Error("group unavailable");
	});
	const launched = launchPiWorker(launchSpec(tmpdir()), fake.spawn);
	t.mock.timers.tick(100);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	if (process.platform !== "win32")
		assert.deepEqual(kill.mock.calls[0].arguments, [-12345, "SIGTERM"]);
	fake.child.emit("close", null, "SIGTERM");
	assert.equal((await launched).classification, "timeout");
	fake.child.emit("error", new Error("late process error"));
});

test("worker activity parses chunked JSONL, ignores malformed events, and stays bounded", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const updates = [];
	const launched = launchPiWorker(
		launchSpec(root, { onActivity: (activity) => updates.push([...activity]) }),
		fake.spawn,
	);
	fake.child.stdout.write('{"type":"tool_execution_start","toolName":"read","args":{"path":"A');
	fake.child.stdout.write('.md"}}\r\n{"type":"message_start"}\nnot JSON\n');
	for (let index = 0; index < 13; index++)
		fake.child.stdout.write(
			`${JSON.stringify({
				type: "tool_execution_start",
				toolName: "read",
				args: { path: `file-${index}.md` },
			})}\n`,
		);
	fake.child.stdout.write(
		`${JSON.stringify({
			type: "tool_execution_start",
			toolName: "write",
			args: { path: "x".repeat(200) },
		})}\n`,
	);
	fake.child.stdout.write("x".repeat(8_193));
	fake.child.stdout.write('{"type":"tool_execution_start","toolName":"grep","args":{}}');
	const ended = new Promise((resolve) => fake.child.stdout.once("end", resolve));
	fake.child.stdout.end();
	await ended;
	fake.child.emit("close", 0, null);
	assert.deepEqual(await launched, { exitCode: 0, stderr: "" });
	assert.deepEqual(updates[0], ["read A.md"]);
	assert.equal(updates.at(-1).length, 12);
	assert.equal(updates.at(-1)[0], "read file-3.md");
	assert.equal(updates.at(-1).at(-1), "grep");
	assert.ok(updates.every((activity) => activity.length <= 12));
	assert.ok(updates.every((activity) => activity.every((item) => item.length <= 120)));
	assert.ok(updates.some((activity) => activity.includes(`write ${"x".repeat(111)}...`)));
});

test("worker activity callback failures do not alter process success", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const launched = launchPiWorker(
		launchSpec(root, {
			onActivity: () => {
				throw new Error("unavailable");
			},
		}),
		fake.spawn,
	);
	fake.child.stdout.write('{"type":"tool_execution_start","toolName":"read","args":{}}\n');
	fake.child.emit("close", 0, null);
	assert.deepEqual(await launched, { exitCode: 0, stderr: "" });
});

test("worker loads native MCP and codemode only for remote research", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-native-mcp-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	for (const remoteResearch of [false, true]) {
		const fake = fakeSpawn();
		const spec = launchSpec(root, {
			request: { mode: "read-only", remoteResearch },
			extraExtensionPaths: [],
		});
		const launched = launchPiWorker(spec, fake.spawn);
		const args = fake.launch?.[1] ?? [];
		assert.equal(args.includes("builtin:mcp"), remoteResearch);
		assert.equal(args.includes("builtin:codemode"), remoteResearch);
		assert.equal(args.includes("--extension") && args.includes("/mcporter"), false);
		assert.equal(fake.launch?.[2]?.env?.MCPORTER_CONFIG, undefined);
		assert.ok(!args.includes("--tools"));
		assert.deepEqual(JSON.parse(fake.launch?.[2]?.env?.PI_SYCH_ACTIVE_TOOLS ?? "[]"), [
			"read",
			"grep",
			"find",
			"ls",
			"submit_artifact",
			...(remoteResearch ? ["codemode"] : []),
		]);
		fake.child.emit("close", 0, null);
		await launched;
	}
});

test("launcher uses an existing session and honors an already-aborted signal", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-session-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const controller = new AbortController();
	controller.abort();
	const fake = fakeSpawn();
	const launched = launchPiWorker(
		launchSpec(root, { sessionPath: join(root, "trajectory.jsonl"), signal: controller.signal }),
		fake.spawn,
	);
	const args = fake.launch[1];
	assert.ok(args.includes("--session"));
	assert.ok(args.includes(join(root, "trajectory.jsonl")));
	assert.ok(!args.includes("--no-session"));
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	fake.child.emit("close", null, "SIGTERM");
	assert.equal((await launched).classification, "cancelled");
});

test("normal close before timeout preserves stderr and exit code", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root), fake.spawn);
	fake.child.stderr.write("warning");
	fake.child.emit("close", 0, null);
	assert.deepEqual(await launched, { exitCode: 0, stderr: "warning" });
	t.mock.timers.tick(5_000);
	assert.deepEqual(fake.child.kills, []);
});

test("spawn errors preserve prior stderr and the error message", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root), fake.spawn);
	fake.child.stderr.write("diagnostic: ");
	fake.child.emit("error", new Error("ENOENT pi"));
	assert.deepEqual(await launched, {
		exitCode: null,
		stderr: "diagnostic: ENOENT pi",
		classification: "spawn-failure",
	});
});

test("worker stderr is truncated to the most recent 8192 characters", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root), fake.spawn);
	fake.child.stderr.write(`${"x".repeat(9_000)}tail`);
	fake.child.emit("close", 1, null);
	const outcome = await launched;
	assert.equal(outcome.stderr.length, 8_192);
	assert.ok(outcome.stderr.endsWith("tail"));
});

test("normal signal termination is reported", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = fakeSpawn();
	const launched = launchPiWorker(launchSpec(root), fake.spawn);
	fake.child.emit("close", 0, "SIGUSR1");
	assert.deepEqual(await launched, {
		exitCode: 0,
		stderr: "",
		terminationSignal: "SIGUSR1",
	});
});

test("failed dispatch removes its temporary runtime directory", async (t) => {
	const { agentDir, resolved } = await readyProject(t);
	let runtimePath;
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		request,
		catalog,
		launcher: async (spec) => {
			runtimePath = join(spec.resultPath, "..");
			await access(runtimePath);
			return { exitCode: 1, stderr: "test failure" };
		},
	});
	assert.ok(outcome.error, "should have error");
	await assert.rejects(access(runtimePath), { code: "ENOENT" });
});
