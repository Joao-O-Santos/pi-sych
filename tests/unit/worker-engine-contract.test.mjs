import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { appendFileSync } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { mcporterConfigPath } from "../../.test-build/workbench/src/mcporter.js";
import {
	dispatchWorker,
	launchPiWorker,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const catalog = { default: "worker", models: { worker: { model: "provider/model" } } };
const baseRequest = {
	task: "inspect boundaries",
	mode: "read-only",
	expectedOutput: "a result",
	contextFiles: [],
};

function resolvedProject(root, canonical = {}) {
	return {
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
			...canonical,
		},
	};
}

async function dispatchFixture(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-contract-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const workerAgentDir = join(root, "worker-agent");
	await mkdir(workerAgentDir);
	await writeFile(join(workerAgentDir, "settings.json"), "{}\n");
	return { root, workerAgentDir, project: resolvedProject(root) };
}

const usage = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	totalTokens: 0,
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};
const assistant = (content) => ({
	role: "assistant",
	content,
	api: "openai-responses",
	provider: "fixture",
	model: "fixture",
	usage,
	stopReason: "toolUse",
	timestamp: Date.now(),
});
const user = (text) => ({ role: "user", content: text, timestamp: Date.now() });
const toolResult = (id, text) => ({
	role: "toolResult",
	toolCallId: id,
	toolName: "dispatch_worker",
	content: [{ type: "text", text }],
	isError: false,
	timestamp: Date.now(),
});

function capturingSpawn() {
	const child = new EventEmitter();
	child.stdout = new PassThrough();
	child.stderr = new PassThrough();
	child.kills = [];
	child.kill = (signal) => {
		child.kills.push(signal);
		return true;
	};
	let call;
	return {
		child,
		spawn(command, argv, options) {
			call = { command, argv, options };
			return child;
		},
		call: () => call,
	};
}

test("launcher passes the complete isolated Pi process contract", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launch-contract-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const packageRoot = join(root, "package");
	const localSkill = join(root, ".pi/skills/local/SKILL.md");
	const researchSkill = join(packageRoot, "skills/research/SKILL.md");
	await mkdir(dirname(localSkill), { recursive: true });
	await mkdir(dirname(researchSkill), { recursive: true });
	await writeFile(localSkill, "# Local\n");
	await writeFile(researchSkill, "# Research\n");
	const extraExtensions = [join(root, "extensions/one.ts"), join(root, "extensions/two.ts")];
	const fake = capturingSpawn();
	const spec = {
		id: "task-123",
		request: {
			...baseRequest,
			mode: "full-host",
			skills: ["local", "research"],
			remoteResearch: true,
			thinkingLevel: "high",
			timeoutMs: 500,
		},
		workerAgentDir: join(root, "agent"),
		piSychConfigDirectory: join(root, "supervisor-config/pi-sych"),
		resultPath: join(root, "runtime/result.json"),
		projectRoot: root,
		model: "provider/model",
		prompt: "deterministic prompt",
		packageRoot,
		extraExtensionPaths: extraExtensions,
		webExtensionPath: extraExtensions[1],
	};
	const launched = launchPiWorker(spec, fake.spawn);
	fake.child.emit("close", 0, null);
	assert.deepEqual(await launched, { exitCode: 0, stderr: "" });

	const call = fake.call();
	assert.equal(call.command, "pi");
	assert.deepEqual(call.argv, [
		"--mode",
		"json",
		"--print",
		"deterministic prompt",
		"--no-session",
		"--no-extensions",
		"--extension",
		join(packageRoot, "extensions/worker/index.ts"),
		"--extension",
		extraExtensions[0],
		"--extension",
		extraExtensions[1],
		"--no-skills",
		"--no-prompt-templates",
		"--no-themes",
		"--no-context-files",
		"--no-approve",
		"--tools",
		"read,edit,write,bash,submit_artifact,literature_search,mcporter,web",
		"--model",
		"provider/model",
		"--thinking",
		"high",
		"--skill",
		localSkill,
		"--skill",
		researchSkill,
	]);
	assert.equal(call.options.cwd, root);
	assert.deepEqual(call.options.stdio, ["ignore", "pipe", "pipe"]);
	assert.equal(call.options.env.PI_CODING_AGENT_DIR, spec.workerAgentDir);
	assert.equal(call.options.env.PI_SYCH_CONFIG_DIRECTORY, spec.piSychConfigDirectory);
	assert.equal(call.options.env.PI_SYCH_TASK_ID, spec.id);
	assert.equal(call.options.env.PI_SYCH_RESULT_PATH, spec.resultPath);
	assert.equal(call.options.env.MCPORTER_CONFIG, mcporterConfigPath(root));
	assert.equal(call.options.env.PATH, process.env.PATH);
});

test("launcher omits thinking level when unspecified", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launch-thinking-omitted-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = capturingSpawn();
	const spec = {
		id: "task-123",
		request: { ...baseRequest, mode: "read-only", timeoutMs: 500 },
		workerAgentDir: join(root, "agent"),
		resultPath: join(root, "result.json"),
		projectRoot: root,
		model: "provider/model",
		prompt: "prompt",
		packageRoot: root,
		extraExtensionPaths: [],
	};
	const launched = launchPiWorker(spec, fake.spawn);
	fake.child.emit("close", 0, null);
	await launched;
	const argv = fake.call().argv;
	const thinkingIndex = argv.indexOf("--thinking");
	assert.equal(thinkingIndex, -1, "omitted thinking must not add --thinking to argv");
});

test("launcher selects a private session only for trajectory context", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launch-session-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const fake = capturingSpawn();
	const sessionPath = join(root, "trajectory.jsonl");
	const launched = launchPiWorker(
		{
			id: "trajectory",
			request: { ...baseRequest, contextMode: "trajectory", timeoutMs: 500 },
			workerAgentDir: join(root, "agent"),
			resultPath: join(root, "result.json"),
			projectRoot: root,
			model: "provider/model",
			prompt: "prompt",
			packageRoot: root,
			extraExtensionPaths: [],
			sessionPath,
		},
		fake.spawn,
	);
	fake.child.emit("close", 0, null);
	await launched;
	const argv = fake.call().argv;
	assert.equal(argv.includes("--no-session"), false);
	assert.deepEqual(argv.slice(argv.indexOf("--session"), argv.indexOf("--session") + 2), [
		"--session",
		sessionPath,
	]);
	assert.equal(argv.includes("--thinking"), false);
});

test("an already-aborted launch is classified and terminated immediately", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launch-aborted-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const controller = new AbortController();
	controller.abort();
	const fake = capturingSpawn();
	const launched = launchPiWorker(
		{
			id: "aborted",
			request: { ...baseRequest, timeoutMs: 1_000 },
			workerAgentDir: root,
			resultPath: join(root, "result.json"),
			projectRoot: root,
			model: "provider/model",
			prompt: "prompt",
			packageRoot: root,
			extraExtensionPaths: [],
			signal: controller.signal,
		},
		fake.spawn,
	);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	fake.child.emit("close", null, "SIGTERM");
	assert.deepEqual(await launched, {
		exitCode: null,
		stderr: "",
		classification: "cancelled",
	});
});

test("dispatch normalizes project context, retains external context, and de-duplicates canonical files", async (t) => {
	const setup = await dispatchFixture(t);
	const configuredAgents = join(setup.root, "config/AGENTS-CUSTOM.md");
	const configuredStyle = join(setup.root, "config/STYLE-CUSTOM.md");
	await mkdir(dirname(configuredAgents), { recursive: true });
	const externalRoot = await mkdtemp(join(tmpdir(), "pi-sych-external-context-"));
	t.after(() => rm(externalRoot, { recursive: true, force: true }));
	const externalNotes = join(externalRoot, "notes.md");
	await writeFile(join(setup.root, "notes.md"), "notes\n");
	await writeFile(externalNotes, "external notes\n");
	await writeFile(configuredAgents, "agents\n");
	await writeFile(configuredStyle, "style\n");
	setup.project.canonical.agents = configuredAgents;
	setup.project.canonical.style = configuredStyle;
	let captured;
	const outcome = await dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request: {
			...baseRequest,
			contextFiles: [
				{ path: "./notes.md", purpose: "relative duplicate" },
				{ path: `${setup.root}/config/../notes.md`, purpose: "task notes" },
				{ path: externalNotes, purpose: "external task notes" },
				{ path: configuredAgents, purpose: "explicit duplicate" },
			],
		},
		catalog,
		launcher: async (spec) => {
			captured = spec;
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
	assert.equal(captured.request.contextMode, "clean");
	assert.equal(captured.sessionPath, undefined);
	assert.deepEqual(captured.request.contextFiles, [
		{ path: "notes.md", purpose: "task notes" },
		{ path: externalNotes, purpose: "external task notes" },
		{ path: "config/AGENTS-CUSTOM.md", purpose: "configured agents conventions" },
		{ path: "config/STYLE-CUSTOM.md", purpose: "configured style conventions" },
	]);
	assert.match(
		captured.prompt,
		/Context files: notes\.md \(task notes\); .* \(external task notes\); config\/AGENTS-CUSTOM\.md \(configured agents conventions\); config\/STYLE-CUSTOM\.md \(configured style conventions\)/,
	);
	assert.ok(captured.prompt.includes(externalNotes));
});

test("trajectory dispatch branches exactly before its assistant entry without mutating the supervisor", async (t) => {
	const setup = await dispatchFixture(t);
	const supervisorDir = join(setup.root, "supervisor-sessions");
	const manager = SessionManager.create(setup.root, supervisorDir);
	manager.appendMessage(user("trajectory sentinel"));
	manager.appendMessage(
		assistant([{ type: "toolCall", id: "prior-worker", name: "dispatch_worker", arguments: {} }]),
	);
	manager.appendMessage(toolResult("prior-worker", "prior worker result"));
	manager.appendMessage(user("current assignment"));
	manager.appendMessage(
		assistant([
			{ type: "toolCall", id: "same-turn-sibling", name: "read", arguments: { path: "A.md" } },
			{ type: "toolCall", id: "trajectory-call", name: "dispatch_worker", arguments: {} },
		]),
	);
	const sourcePath = manager.getSessionFile();
	const sourceBefore = await readFile(sourcePath);
	const leafBefore = manager.getLeafId();
	let privatePath;
	const outcome = await dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request: { ...baseRequest, contextMode: "trajectory" },
		catalog,
		trajectory: { manager, toolCallId: "trajectory-call" },
		launcher: async (spec) => {
			privatePath = spec.sessionPath;
			assert.ok(privatePath);
			assert.notEqual(privatePath, sourcePath);
			const inherited = SessionManager.open(privatePath).buildSessionContext().messages;
			const serialized = JSON.stringify(inherited);
			assert.match(serialized, /trajectory sentinel/);
			assert.match(serialized, /prior worker result/);
			assert.match(serialized, /current assignment/);
			assert.doesNotMatch(serialized, /same-turn-sibling|trajectory-call/);
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "inherited",
				files: [],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "inherited");
	assert.deepEqual(await readFile(sourcePath), sourceBefore);
	assert.equal(manager.getLeafId(), leafBefore);
	await assert.rejects(access(privatePath), { code: "ENOENT" });
});

test("trajectory preserves Pi's compacted active context rather than replaying discarded history", async (t) => {
	const setup = await dispatchFixture(t);
	const manager = SessionManager.create(setup.root, join(setup.root, "compacted-sessions"));
	manager.appendMessage(user("discarded detail"));
	manager.appendMessage(assistant([{ type: "text", text: "discarded response" }]));
	const kept = manager.appendMessage(user("kept tail"));
	manager.appendCompaction("bounded summary", kept, 50_000);
	manager.appendMessage(user("post-compaction assignment"));
	const expected = manager.buildSessionContext();
	manager.appendMessage(
		assistant([{ type: "toolCall", id: "compacted-call", name: "dispatch_worker", arguments: {} }]),
	);
	const outcome = await dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request: { ...baseRequest, contextMode: "trajectory" },
		catalog,
		trajectory: { manager, toolCallId: "compacted-call" },
		launcher: async (spec) => {
			assert.deepEqual(SessionManager.open(spec.sessionPath).buildSessionContext(), expected);
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "compaction preserved",
				files: [],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "compaction preserved");
});

test("trajectory follows the selected branch in a supervisor session tree", async (t) => {
	const setup = await dispatchFixture(t);
	const manager = SessionManager.create(setup.root, join(setup.root, "branched-sessions"));
	manager.appendMessage(user("root"));
	const forkPoint = manager.appendMessage(assistant([{ type: "text", text: "fork point" }]));
	manager.appendMessage(user("discarded branch"));
	manager.branch(forkPoint);
	manager.appendMessage(user("selected branch"));
	const expected = manager.buildSessionContext();
	manager.appendMessage(
		assistant([{ type: "toolCall", id: "branched-call", name: "dispatch_worker", arguments: {} }]),
	);
	await dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request: { ...baseRequest, contextMode: "trajectory" },
		catalog,
		trajectory: { manager, toolCallId: "branched-call" },
		launcher: async (spec) => {
			const inherited = SessionManager.open(spec.sessionPath).buildSessionContext();
			assert.deepEqual(inherited, expected);
			assert.doesNotMatch(JSON.stringify(inherited), /discarded branch/);
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "branch preserved",
				files: [],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
});

test("trajectory dispatch fails loudly when its exact persisted call boundary is unavailable", async (t) => {
	const setup = await dispatchFixture(t);
	const manager = SessionManager.create(setup.root, join(setup.root, "sessions"));
	manager.appendMessage(user("prompt"));
	manager.appendMessage(
		assistant([{ type: "toolCall", id: "other-call", name: "dispatch_worker", arguments: {} }]),
	);
	let launched = false;
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager, toolCallId: "missing-call" },
			launcher: async () => {
				launched = true;
				return { exitCode: 0, stderr: "" };
			},
		}),
		/match exactly one persisted assistant entry; found 0/,
	);
	assert.equal(launched, false);
	const ephemeral = SessionManager.inMemory(setup.root);
	ephemeral.appendMessage(user("ephemeral"));
	ephemeral.appendMessage(
		assistant([{ type: "toolCall", id: "ephemeral-call", name: "dispatch_worker", arguments: {} }]),
	);
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: ephemeral, toolCallId: "ephemeral-call" },
		}),
		/requires a persisted supervisor session/,
	);
	const parentless = SessionManager.create(setup.root, join(setup.root, "parentless"));
	parentless.appendMessage(
		assistant([
			{ type: "toolCall", id: "parentless-call", name: "dispatch_worker", arguments: {} },
		]),
	);
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: parentless, toolCallId: "parentless-call" },
		}),
		/parentless assistant entry/,
	);
	const ambiguous = SessionManager.create(setup.root, join(setup.root, "ambiguous"));
	ambiguous.appendMessage(user("first"));
	ambiguous.appendMessage(
		assistant([{ type: "toolCall", id: "duplicate-call", name: "dispatch_worker", arguments: {} }]),
	);
	ambiguous.appendMessage(user("second"));
	ambiguous.appendMessage(
		assistant([{ type: "toolCall", id: "duplicate-call", name: "dispatch_worker", arguments: {} }]),
	);
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: ambiguous, toolCallId: "duplicate-call" },
		}),
		/found 2/,
	);
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
		}),
		/Trajectory context is unavailable/,
	);
});

test("trajectory rejects missing or cyclic persisted ancestry before native traversal", async (t) => {
	const setup = await dispatchFixture(t);
	const malformed = async (name, entries) => {
		const path = join(setup.root, `${name}.jsonl`);
		await writeFile(
			path,
			`${[
				{
					type: "session",
					version: 3,
					id: name,
					timestamp: new Date().toISOString(),
					cwd: setup.root,
				},
				...entries,
			]
				.map((entry) => JSON.stringify(entry))
				.join("\n")}\n`,
		);
		return SessionManager.open(path, join(setup.root, `${name}-private`));
	};
	const timestamp = new Date().toISOString();
	const entry = (id, parentId, message) => ({ type: "message", id, parentId, timestamp, message });
	const missing = await malformed("missing-ancestry", [
		entry("user", "absent", user("assignment")),
		entry(
			"assistant",
			"user",
			assistant([
				{ type: "toolCall", id: "missing-ancestry-call", name: "dispatch_worker", arguments: {} },
			]),
		),
	]);
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: missing, toolCallId: "missing-ancestry-call" },
		}),
		/ancestry is missing entry absent/,
	);
	const cycle = await malformed("cyclic-ancestry", [
		entry("one", "two", user("one")),
		entry("two", "one", user("two")),
		entry(
			"assistant",
			"one",
			assistant([{ type: "toolCall", id: "cycle-call", name: "dispatch_worker", arguments: {} }]),
		),
	]);
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: cycle, toolCallId: "cycle-call" },
		}),
		/ancestry contains a cycle/,
	);
});

test("trajectory detects changed supervisor bytes while preparing its private branch", async (t) => {
	const setup = await dispatchFixture(t);
	const manager = SessionManager.create(setup.root, join(setup.root, "race-sessions"));
	manager.appendMessage(user("context"));
	manager.appendMessage(assistant([{ type: "text", text: "response" }]));
	manager.appendMessage(user("assignment"));
	manager.appendMessage(
		assistant([{ type: "toolCall", id: "race-call", name: "dispatch_worker", arguments: {} }]),
	);
	let leafReads = 0;
	const changingManager = {
		getSessionFile: () => manager.getSessionFile(),
		getEntries: () => manager.getEntries(),
		getLeafId: () => {
			if (++leafReads === 1) appendFileSync(manager.getSessionFile(), " \n");
			return manager.getLeafId();
		},
	};
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager: changingManager, toolCallId: "race-call" },
		}),
		/Supervisor session changed/,
	);
});

test("trajectory temporary sessions are removed when the launcher throws", async (t) => {
	const setup = await dispatchFixture(t);
	const manager = SessionManager.create(setup.root, join(setup.root, "throw-sessions"));
	manager.appendMessage(user("context"));
	manager.appendMessage(assistant([{ type: "text", text: "earlier" }]));
	manager.appendMessage(user("assignment"));
	manager.appendMessage(
		assistant([{ type: "toolCall", id: "throw-call", name: "dispatch_worker", arguments: {} }]),
	);
	let privatePath;
	await assert.rejects(
		dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager, toolCallId: "throw-call" },
			launcher: async (spec) => {
				privatePath = spec.sessionPath;
				throw new Error("launcher fixture failure");
			},
		}),
		/launcher fixture failure/,
	);
	await assert.rejects(access(privatePath), { code: "ENOENT" });
});

test("trajectory runtime removes snapshot and child for every terminal failure class", async (t) => {
	const setup = await dispatchFixture(t);
	const manager = SessionManager.create(setup.root, join(setup.root, "classified-sessions"));
	manager.appendMessage(user("context"));
	manager.appendMessage(assistant([{ type: "text", text: "earlier" }]));
	manager.appendMessage(user("assignment"));
	manager.appendMessage(
		assistant([
			{ type: "toolCall", id: "classified-call", name: "dispatch_worker", arguments: {} },
		]),
	);
	const sourcePath = manager.getSessionFile();
	const sourceBefore = await readFile(sourcePath);
	const cases = [
		["nonzero", { exitCode: 1, stderr: "failed" }],
		["cancelled", { exitCode: null, stderr: "", classification: "cancelled" }],
		["timeout", { exitCode: null, stderr: "", classification: "timeout" }],
		["spawn", { exitCode: null, stderr: "missing", classification: "spawn-failure" }],
		["signal", { exitCode: null, stderr: "", terminationSignal: "SIGTERM" }],
		["protocol", { exitCode: 0, stderr: "" }],
	];
	for (const [label, launch] of cases) {
		let sessionPath;
		const outcome = await dispatchWorker({
			project: setup.project,
			workerAgentDir: setup.workerAgentDir,
			request: { ...baseRequest, contextMode: "trajectory" },
			catalog,
			trajectory: { manager, toolCallId: "classified-call" },
			launcher: async (spec) => {
				sessionPath = spec.sessionPath;
				if (label === "protocol") await writeFile(spec.resultPath, "{bad\n");
				return launch;
			},
		});
		assert.ok(outcome.error, `${label} should fail`);
		await assert.rejects(access(sessionPath), { code: "ENOENT" });
	}
	assert.deepEqual(await readFile(sourcePath), sourceBefore);
});

test("dispatch rejects missing and escaping context before launching", async (t) => {
	for (const [name, input] of [
		["absolute missing project file", (root) => join(root, "missing.md")],
		["absolute missing external file", (root) => join(root, "..", "outside.md")],
	]) {
		await t.test(name, async () => {
			const setup = await dispatchFixture(t);
			let launched = false;
			await assert.rejects(
				dispatchWorker({
					project: setup.project,
					workerAgentDir: setup.workerAgentDir,
					request: {
						...baseRequest,
						contextFiles: [{ path: input(setup.root), purpose: "required" }],
					},
					catalog,
					launcher: async () => {
						launched = true;
						return { exitCode: 0, stderr: "" };
					},
				}),
				{ code: "ENOENT" },
			);
			assert.equal(launched, false);
		});
	}
	await t.test("missing file", async () => {
		const setup = await dispatchFixture(t);
		let launched = false;
		await assert.rejects(
			dispatchWorker({
				project: setup.project,
				workerAgentDir: setup.workerAgentDir,
				request: {
					...baseRequest,
					contextFiles: [{ path: "missing.md", purpose: "required" }],
				},
				catalog,
				launcher: async () => {
					launched = true;
					return { exitCode: 0, stderr: "" };
				},
			}),
			{ code: "ENOENT" },
		);
		assert.equal(launched, false);
	});
	await t.test("path escape", async () => {
		const setup = await dispatchFixture(t);
		let launched = false;
		await assert.rejects(
			dispatchWorker({
				project: setup.project,
				workerAgentDir: setup.workerAgentDir,
				request: {
					...baseRequest,
					contextFiles: [{ path: "../outside.md", purpose: "not allowed" }],
				},
				catalog,
				launcher: async () => {
					launched = true;
					return { exitCode: 0, stderr: "" };
				},
			}),
			/leaves the project root/,
		);
		assert.equal(launched, false);
	});
});

test("dispatch removes its runtime after a successful result", async (t) => {
	const setup = await dispatchFixture(t);
	let runtimePath;
	const outcome = await dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request: baseRequest,
		catalog,
		launcher: async (spec) => {
			runtimePath = dirname(spec.resultPath);
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: [],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.status, "complete");
	await assert.rejects(access(runtimePath), { code: "ENOENT" });
});

test("dispatch removes its runtime after a result protocol failure", async (t) => {
	const setup = await dispatchFixture(t);
	let runtimePath;
	const outcome = await dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request: baseRequest,
		catalog,
		launcher: async (spec) => {
			runtimePath = dirname(spec.resultPath);
			await writeFile(spec.resultPath, "{malformed\n");
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.match(outcome.error ?? "", /Worker result protocol failed/);
	await assert.rejects(access(runtimePath), { code: "ENOENT" });
});
