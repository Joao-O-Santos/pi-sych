import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
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
	return { child, spawn: () => child };
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
	test(`${label} followed by child error clears forced termination`, async (t) => {
		t.mock.timers.enable({ apis: ["setTimeout"] });
		const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-error-"));
		t.after(() => rm(root, { recursive: true, force: true }));
		const controller = new AbortController(),
			fake = fakeSpawn(),
			launched = launchPiWorker(
				launchSpec(root, { ...(signal ? { signal: controller.signal } : {}) }),
				fake.spawn,
			);
		if (signal) controller.abort();
		else t.mock.timers.tick(100);
		fake.child.emit("error", new Error("closed unexpectedly"));
		assert.deepEqual((await launched).classification, signal ? "cancelled" : "timeout");
		t.mock.timers.tick(2_000);
		assert.deepEqual(fake.child.kills, ["SIGTERM"]);
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
	t.mock.timers.tick(1_999);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	t.mock.timers.tick(1);
	assert.deepEqual(fake.child.kills, ["SIGTERM", "SIGKILL"]);
	fake.child.emit("close", null, "SIGKILL");
	assert.equal((await launched).classification, "timeout");
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
