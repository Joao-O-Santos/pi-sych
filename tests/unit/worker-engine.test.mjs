import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	DEFAULT_TIMEOUT_MS,
	dispatchWorker,
	launchPiWorker,
	mcporterConfigPath,
	resolveSelectedSkillPaths,
	taskPrompt,
	toolsForMode,
	toolsForRequest,
	validateDispatchRequest,
	validateWorkerResult,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const request = {
	task: "Review the change.",
	mode: "read-only",
	expectedOutput: "A concise review.",
	contextFiles: [{ path: "PROJECT.md", purpose: "project direction" }],
};

function result(spec) {
	return {
		schemaVersion: 1,
		taskId: spec.taskId,
		runId: spec.runId,
		status: "complete",
		summary: "Completed bounded work.",
		artifacts: [{ path: "review.md", kind: "review" }],
		changedFiles: [],
		limitations: [],
		resultPackage: "inline",
	};
}

async function fakePi(source) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-fake-pi-"));
	const path = join(root, "pi.mjs");
	await writeFile(path, `#!/usr/bin/env node\n${source}\n`);
	await chmod(path, 0o755);
	return { path, root };
}

function launchSpec(overrides = {}) {
	return {
		taskId: "task",
		runId: "run",
		request,
		workerAgentDir: process.cwd(),
		resultPath: join(tmpdir(), "unused-result.json"),
		projectRoot: process.cwd(),
		model: "test/model",
		prompt: "bounded test",
		packageRoot: process.cwd(),
		extraExtensionPaths: [],
		...overrides,
	};
}

function launchWithPi(path, spec) {
	const previous = process.env.PI_SYCH_PI_BIN;
	process.env.PI_SYCH_PI_BIN = path;
	const pending = launchPiWorker(spec);
	if (previous === undefined) delete process.env.PI_SYCH_PI_BIN;
	else process.env.PI_SYCH_PI_BIN = previous;
	return pending;
}

test("dispatch validates a compact request and uses the 90-second default", () => {
	assert.deepEqual(validateDispatchRequest(request), request);
	assert.equal(DEFAULT_TIMEOUT_MS, 90_000);
	assert.throws(
		() => validateDispatchRequest({ ...request, timeoutMs: 0 }),
		/timeoutMs/,
	);
	assert.throws(
		() => validateDispatchRequest({ ...request, contextFiles: [{}] }),
		/contextFiles\[0\]\.path/,
	);
});

test("worker modes expose only the selected tools and explicit remote research adds MCPorter", () => {
	assert.deepEqual(toolsForMode("read-only"), [
		"read",
		"grep",
		"find",
		"ls",
		"submit_artifact",
	]);
	assert.equal(
		toolsForRequest({ mode: "read-only", remoteResearch: false }).includes(
			"mcporter",
		),
		false,
	);
	assert.equal(
		toolsForRequest({ mode: "read-only", remoteResearch: true }).includes(
			"mcporter",
		),
		true,
	);
});

test("immutable results are identity-bound and reject a second submission", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-"));
	const path = join(root, "result.json");
	const identity = { taskId: "task", runId: "run" };
	const value = { ...result(identity), taskId: "task", runId: "run" };
	assert.equal(
		validateWorkerResult(value, identity).summary,
		"Completed bounded work.",
	);
	await writeImmutableResult(path, value);
	await assert.rejects(writeImmutableResult(path, value), /immutable/);
	await assert.rejects(
		async () => validateWorkerResult({ ...value, runId: "other" }, identity),
		/identity/,
	);
});

test("dispatch injects optional project conventions and returns one validated result", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	await writeFile(join(root, "AGENTS.md"), "# Conventions\n");
	await writeFile(join(root, "STYLE.md"), "# Style\n");
	let prompt = "";
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request: { ...request, mode: "edit" },
		profiles: { default: ["test/model"] },
		launcher: async (spec) => {
			prompt = spec.prompt;
			await writeImmutableResult(spec.resultPath, result(spec));
			return { exitCode: 0, stdout: "", stderr: "" };
		},
	});
	assert.match(prompt, /AGENTS\.md \(project conventions\)/);
	assert.match(prompt, /STYLE\.md \(artifact conventions\)/);
	assert.equal(outcome.timeoutMs, DEFAULT_TIMEOUT_MS);
	assert.equal(outcome.result?.status, "complete");
	assert.deepEqual(outcome.launch, { exitCode: 0, stdout: "", stderr: "" });
});

test("dispatch retains a valid result after an abnormal process outcome", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-outcome-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request,
		profiles: { default: ["test/model"] },
		launcher: async (spec) => {
			await writeImmutableResult(spec.resultPath, result(spec));
			return {
				exitCode: null,
				stdout: "",
				stderr: "",
				classification: "timeout",
				terminationSignal: "SIGKILL",
			};
		},
	});
	assert.equal(outcome.result?.status, "complete");
	assert.equal(outcome.failure, undefined);
	assert.equal(outcome.launch?.classification, "timeout");
	assert.equal(outcome.launch?.terminationSignal, "SIGKILL");
});

test("dispatch rejects a result package that is not durable", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-package-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request,
		profiles: { default: ["test/model"] },
		launcher: async (spec) => {
			await writeImmutableResult(spec.resultPath, {
				...result(spec),
				resultPackage: "missing.json",
			});
			return { exitCode: 0, stdout: "", stderr: "" };
		},
	});
	assert.equal(outcome.failure?.classification, "invalid-result");
	assert.match(
		outcome.failure?.message ?? "",
		/resultPackage path is unavailable/,
	);
});

test("result packages may be readable project directories", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-directory-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request,
		profiles: { default: ["test/model"] },
		launcher: async (spec) => {
			await writeImmutableResult(spec.resultPath, {
				...result(spec),
				resultPackage: ".",
			});
			return { exitCode: 0, stdout: "", stderr: "" };
		},
	});
	assert.equal(outcome.result?.resultPackage, ".");
});

test("MCPorter defaults to homedir when HOME is absent", () => {
	assert.equal(
		mcporterConfigPath({}, "/test-home"),
		join("/test-home", ".config/pi-sych/mcp/mcporter.json"),
	);
});

test("timeout sends SIGTERM and force-kills a non-responsive worker", async () => {
	const marker = join(
		await mkdtemp(join(tmpdir(), "pi-sych-timeout-")),
		"signals.txt",
	);
	const executable = await fakePi(
		`import { appendFileSync } from "node:fs"; process.on("SIGTERM", () => appendFileSync(${JSON.stringify(marker)}, "SIGTERM\\n")); setInterval(() => {}, 1000);`,
	);
	const started = Date.now();
	const outcome = await launchWithPi(
		executable.path,
		launchSpec({ request: { ...request, timeoutMs: 100 } }),
	);
	assert.equal(outcome.classification, "timeout");
	assert.equal(outcome.exitCode, null);
	assert.equal(outcome.terminationSignal, "SIGKILL");
	assert.match(await readFile(marker, "utf8"), /SIGTERM/);
	assert.ok(
		Date.now() - started >= 1_900,
		"worker was not given the kill grace period",
	);
});

test("cancellation sends SIGTERM and preserves the cancelled classification", async () => {
	const marker = join(
		await mkdtemp(join(tmpdir(), "pi-sych-cancel-")),
		"signals.txt",
	);
	const executable = await fakePi(
		`import { appendFileSync } from "node:fs"; process.on("SIGTERM", () => { appendFileSync(${JSON.stringify(marker)}, "SIGTERM\\n"); process.exit(0); }); setInterval(() => {}, 1000);`,
	);
	const controller = new AbortController();
	const pending = launchWithPi(
		executable.path,
		launchSpec({ signal: controller.signal }),
	);
	setTimeout(() => controller.abort(), 100);
	const outcome = await pending;
	assert.equal(outcome.classification, "cancelled");
	assert.equal(outcome.exitCode, 0);
	assert.equal(outcome.terminationSignal, null);
	assert.match(await readFile(marker, "utf8"), /SIGTERM/);
});

test("skill resolution and worker prompts use only selected resources", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const paths = resolveSelectedSkillPaths(["project"], root, process.cwd());
	assert.equal(paths.length, 1);
	const prompt = taskPrompt(
		{
			taskId: "task",
			runId: "run",
			request,
			workerAgentDir: root,
			resultPath: join(root, "result.json"),
			projectRoot: root,
			model: "test/model",
			prompt: "",
			packageRoot: process.cwd(),
			extraExtensionPaths: [],
		},
		request.contextFiles,
	);
	assert.match(prompt, /PROJECT\.md/);
	assert.doesNotMatch(prompt, /supervisor conversation/i);
	assert.match(await readFile(paths[0], "utf8"), /# Project/);
	const userSkills = join(root, "user-skills");
	await mkdir(join(userSkills, "project"), { recursive: true });
	await writeFile(join(userSkills, "project", "SKILL.md"), "# User project\n");
	assert.match(
		await readFile(
			resolveSelectedSkillPaths(
				["project"],
				root,
				process.cwd(),
				userSkills,
			)[0],
			"utf8",
		),
		/# User project/,
	);
	await mkdir(join(root, ".pi", "skills", "project"), { recursive: true });
	await writeFile(
		join(root, ".pi", "skills", "project", "SKILL.md"),
		"# Project override\n",
	);
	assert.match(
		await readFile(
			resolveSelectedSkillPaths(
				["project"],
				root,
				process.cwd(),
				userSkills,
			)[0],
			"utf8",
		),
		/# Project override/,
	);
	await assert.rejects(
		dispatchWorker({
			projectRoot: root,
			workerAgentDir: root,
			packageRoot: process.cwd(),
			profiles: { default: ["test/model"] },
			request: {
				...request,
				contextFiles: [{ path: "../outside.md", purpose: "invalid" }],
			},
			launcher: async () => {
				throw new Error("launcher must not run");
			},
		}),
		/Project artifact path leaves the project root/,
	);
});
