import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
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

function capturingSpawn() {
	const child = new EventEmitter();
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
		"read,edit,write,bash,submit_artifact,literature_search,mcporter",
		"--model",
		"provider/model",
		"--skill",
		localSkill,
		"--skill",
		researchSkill,
	]);
	assert.equal(call.options.cwd, root);
	assert.deepEqual(call.options.stdio, ["ignore", "ignore", "pipe"]);
	assert.equal(call.options.env.PI_CODING_AGENT_DIR, spec.workerAgentDir);
	assert.equal(call.options.env.PI_SYCH_CONFIG_DIRECTORY, spec.piSychConfigDirectory);
	assert.equal(call.options.env.PI_SYCH_TASK_ID, spec.id);
	assert.equal(call.options.env.PI_SYCH_RESULT_PATH, spec.resultPath);
	assert.equal(call.options.env.MCPORTER_CONFIG, mcporterConfigPath(root));
	assert.equal(call.options.env.PATH, process.env.PATH);
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

test("dispatch normalizes explicit and configured context and de-duplicates canonical files", async (t) => {
	const setup = await dispatchFixture(t);
	const configuredAgents = join(setup.root, "config/AGENTS-CUSTOM.md");
	const configuredStyle = join(setup.root, "config/STYLE-CUSTOM.md");
	await mkdir(dirname(configuredAgents), { recursive: true });
	await writeFile(join(setup.root, "notes.md"), "notes\n");
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
				{ path: "./notes.md", purpose: "task notes" },
				{ path: "config/AGENTS-CUSTOM.md", purpose: "explicit duplicate" },
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
	assert.deepEqual(captured.request.contextFiles, [
		{ path: "notes.md", purpose: "task notes" },
		{ path: "config/AGENTS-CUSTOM.md", purpose: "configured agents conventions" },
		{ path: "config/STYLE-CUSTOM.md", purpose: "configured style conventions" },
	]);
	assert.match(
		captured.prompt,
		/Context files: notes\.md \(task notes\); config\/AGENTS-CUSTOM\.md \(configured agents conventions\); config\/STYLE-CUSTOM\.md \(configured style conventions\)/,
	);
});

test("dispatch rejects missing and escaping context before launching", async (t) => {
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
