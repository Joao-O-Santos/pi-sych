import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	classifyModelError,
	dispatchWorker,
	launchPiWorker,
	MutationLock,
	PI_SYCH_PACKAGE_ROOT,
	readWorkerResult,
	resolveModelProfile,
	resolveSelectedSkillPaths,
	saveSyntheticWorkerResult,
	taskPrompt,
	toolsForMode,
	toolsForRequest,
	unexpectedChanges,
	validateDispatchRequest,
	validateWorkerResult,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const request = {
	objective: "Review the proposed change.",
	role: "reviewer",
	mode: "read-only",
	expectedOutput: "A bounded review artifact.",
	inputs: [{ path: "PROJECT.md", purpose: "project direction" }],
};

function resultFor(spec, status = "complete") {
	return {
		schemaVersion: 1,
		taskId: spec.taskId,
		runId: spec.runId,
		role: spec.request.role,
		status,
		summary: "Completed bounded work.",
		artifacts: [{ path: "runtime/result.json", kind: "review" }],
		intendedChanges: [],
		observedChanges: [],
		verification: [],
		limitations: [],
	};
}

function git(root, ...args) {
	return execFileSync("git", ["-c", "commit.gpgSign=false", ...args], {
		cwd: root,
		encoding: "utf8",
	});
}

async function initializeGitProject(root) {
	git(root, "init", "-q");
	git(root, "config", "user.email", "test@example.com");
	git(root, "config", "user.name", "Pi Sych Test");
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	git(root, "add", "PROJECT.md");
	git(root, "commit", "-qm", "initial");
}

test("worker capability modes expose exactly the intended built-in tools", () => {
	assert.deepEqual(toolsForMode("read-only"), [
		"read",
		"grep",
		"find",
		"ls",
		"submit_artifact",
	]);
	assert.deepEqual(toolsForMode("edit"), [
		"read",
		"grep",
		"find",
		"ls",
		"edit",
		"write",
		"submit_artifact",
	]);
	assert.deepEqual(toolsForMode("full-host"), [
		"read",
		"grep",
		"find",
		"ls",
		"edit",
		"write",
		"bash",
		"submit_artifact",
	]);
	assert.equal(toolsForMode("read-only").includes("bash"), false);
	assert.equal(toolsForMode("edit").includes("bash"), false);
	assert.equal(toolsForMode("full-host").includes("bash"), true);
	assert.deepEqual(
		toolsForRequest({ mode: "read-only", remoteResearch: true }),
		["read", "grep", "find", "ls", "submit_artifact", "mcporter"],
	);
	assert.deepEqual(
		toolsForRequest({ mode: "edit", remoteResearch: false }),
		toolsForMode("edit"),
	);
});

test("selected skill names resolve to package skills from an external project", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-skill-project-"));
	const projectSkill = join(root, ".pi/skills/local-review");
	await mkdir(projectSkill, { recursive: true });
	await writeFile(
		join(projectSkill, "SKILL.md"),
		"---\nname: local-review\ndescription: Local review guidance for this project.\n---\n",
	);
	assert.deepEqual(
		resolveSelectedSkillPaths(
			["software-project", "local-review"],
			root,
			PI_SYCH_PACKAGE_ROOT,
		),
		[
			join(PI_SYCH_PACKAGE_ROOT, "skills/software-project/SKILL.md"),
			join(projectSkill, "SKILL.md"),
		],
	);
	assert.throws(
		() =>
			resolveSelectedSkillPaths(["missing-skill"], root, PI_SYCH_PACKAGE_ROOT),
		/unavailable/,
	);
});

test("dispatch schema validates bounded requests and model fallback is limited", async () => {
	assert.equal(validateDispatchRequest(request).mode, "read-only");
	assert.throws(
		() => validateDispatchRequest({ ...request, mode: "sandboxed" }),
		/Unknown worker mode/,
	);
	assert.throws(
		() => validateDispatchRequest({ ...request, timeoutMs: 0 }),
		/positive integer/,
	);
	assert.throws(
		() => validateDispatchRequest({ ...request, remoteResearch: "yes" }),
		/boolean/,
	);
	const command = {
		executable: "node",
		args: ["-e", "", "-e"],
		expectedExitCode: 0,
	};
	assert.deepEqual(
		validateDispatchRequest({
			...request,
			verification: { commands: [command] },
		}).verification.commands[0].args,
		command.args,
	);
	assert.deepEqual(resolveModelProfile({ default: ["one", "two", "three"] }), [
		"one",
		"two",
		"three",
	]);
	assert.deepEqual(
		resolveModelProfile(
			{ default: ["one"], profiles: { review: ["review-one", "review-two"] } },
			"review",
		),
		["review-one", "review-two"],
	);
	assert.throws(() => resolveModelProfile({ default: [] }), /unavailable/);
	const root = await mkdtemp(join(tmpdir(), "pi-sych-missing-input-"));
	await assert.rejects(
		dispatchWorker({
			projectRoot: root,
			workerAgentDir: join(root, "agent"),
			request: {
				...request,
				inputs: [{ path: "missing.md", purpose: "required" }],
			},
			profiles: { default: ["model"] },
			launcher: async () => ({
				exitCode: 0,
				stdout: "",
				stderr: "",
				timedOut: false,
			}),
		}),
		/Selected input is unavailable/,
	);
});

test("task prompt carries only the bounded packet and exact selected resources", () => {
	const verification = {
		commands: [
			{
				executable: "npm",
				args: ["test", "--", "unit"],
				cwd: "repo",
				expectedExitCode: 0,
			},
		],
	};
	const prompt = taskPrompt({
		taskId: "task",
		runId: "run",
		request: validateDispatchRequest({ ...request, verification }),
		workerAgentDir: "/tmp/agent",
		resultPath: "/tmp/result",
		projectRoot: "/tmp/project",
		model: "model",
		prompt: "",
	});
	assert.match(prompt, /Objective: Review the proposed change/);
	assert.match(prompt, /Selected inputs: PROJECT\.md \(project direction\)/);
	assert.match(
		prompt,
		/Supervisor verification contract \(runs after artifact submission\):/,
	);
	assert.match(prompt, /"executable":"npm"/);
	assert.match(prompt, /"args":\["test","--","unit"\]/);
	assert.match(prompt, /"cwd":"repo"/);
	assert.match(prompt, /"expectedExitCode":0/);
	assert.match(prompt, /submit_artifact exactly once/);
	assert.doesNotMatch(prompt, /supervisor conversation/i);
	const researchPrompt = taskPrompt({
		taskId: "task",
		runId: "run",
		request: validateDispatchRequest({
			...request,
			remoteResearch: true,
			reviewLens: "provenance",
		}),
		workerAgentDir: "/tmp/agent",
		resultPath: "/tmp/result",
		projectRoot: "/tmp/project",
		model: "model",
		prompt: "",
	});
	assert.match(researchPrompt, /Use the mcporter proxy/);
	assert.match(researchPrompt, /Review lens: provenance/);
});

test("immutable worker submission and the project mutation lock preserve ownership", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-lock-"));
	const resultPath = join(root, "result.json");
	const identity = { taskId: "task", runId: "run" };
	await writeImmutableResult(resultPath, resultFor({ ...identity, request }));
	await assert.rejects(
		writeImmutableResult(resultPath, resultFor({ ...identity, request })),
		/immutable/,
	);
	assert.match(await readFile(resultPath, "utf8"), /Completed bounded work/);

	const first = new MutationLock(root);
	const second = new MutationLock(root);
	await first.acquire(identity);
	await assert.rejects(
		second.acquire({ taskId: "other", runId: "run" }),
		/already active/,
	);
	await assert.rejects(
		second.release({ taskId: "other", runId: "run" }),
		/ownership/,
	);
	await first.release(identity);
});

test("worker result validation rejects generated malformed verification reports", () => {
	const identity = { taskId: "task", runId: "run" };
	const validReport = {
		executable: "node",
		args: ["--version"],
		cwd: "/tmp",
		exitCode: 0,
		stdoutTail: "",
		stderrTail: "",
		startedAt: "2026-07-29T00:00:00.000Z",
		endedAt: "2026-07-29T00:00:01.000Z",
		filesChanged: [],
	};
	const base = {
		...resultFor({ ...identity, request }),
		taskId: identity.taskId,
		runId: identity.runId,
	};
	assert.deepEqual(
		validateWorkerResult({ ...base, verification: [validReport] }, identity)
			.verification,
		[validReport],
	);

	const malformed = [
		null,
		true,
		7,
		"report",
		[],
		{},
		...[
			["executable", 7],
			["args", "--version"],
			["cwd", null],
			["exitCode", 1.5],
			["stdoutTail", null],
			["stderrTail", {}],
			["startedAt", "not-a-date"],
			["endedAt", ""],
			["filesChanged", [42]],
		].map(([field, value]) => ({ ...validReport, [field]: value })),
	];
	for (const report of malformed) {
		assert.throws(() =>
			validateWorkerResult({ ...base, verification: [report] }, identity),
		);
	}
});

test("real worker launcher resolves the package extension outside the Pi Sych repository", async () => {
	const projectRoot = await mkdtemp(
		join(tmpdir(), "pi-sych-external-project-"),
	);
	const workerAgentDir = join(projectRoot, "worker-agent");
	const resultPath = join(projectRoot, "result.json");
	const fakePi = join(projectRoot, "fake-pi");
	await writeFile(
		fakePi,
		`#!/usr/bin/env node\nimport { existsSync, readFileSync, writeFileSync } from "node:fs";\nconst args = process.argv.slice(2);\nconst extension = args[args.indexOf("--extension") + 1];\nif (!existsSync(extension) || extension.includes(${JSON.stringify(projectRoot)})) process.exit(2);\nconst result = { schemaVersion: 1, taskId: process.env.PI_SYCH_TASK_ID, runId: process.env.PI_SYCH_RUN_ID, role: "external-reviewer", status: "complete", summary: "External project worker launched.", artifacts: [], intendedChanges: [], observedChanges: [], verification: [], limitations: [] };\nwriteFileSync(process.env.PI_SYCH_RESULT_PATH, JSON.stringify(result) + "\\n", { flag: "wx" });\n`,
	);
	await chmod(fakePi, 0o755);
	const identity = { taskId: "external-task", runId: "external-run" };
	const previous = process.env.PI_SYCH_PI_BIN;
	process.env.PI_SYCH_PI_BIN = fakePi;
	try {
		const outcome = await launchPiWorker({
			...identity,
			request: validateDispatchRequest(request),
			workerAgentDir,
			resultPath,
			projectRoot,
			model: "test-model",
			prompt: "external task",
		});
		assert.equal(outcome.exitCode, 0);
		assert.equal(outcome.stderr, "");
		const result = await readWorkerResult(resultPath, identity);
		assert.equal(result.summary, "External project worker launched.");
		assert.equal(PI_SYCH_PACKAGE_ROOT, process.cwd());
	} finally {
		if (previous === undefined) delete process.env.PI_SYCH_PI_BIN;
		else process.env.PI_SYCH_PI_BIN = previous;
	}
});

test("remote worker receives exactly the MCPorter extension and explicit config", async () => {
	const projectRoot = await mkdtemp(join(tmpdir(), "pi-sych-remote-project-"));
	const fakePi = join(projectRoot, "fake-pi-remote");
	const argsPath = join(projectRoot, "args.json");
	await writeFile(
		fakePi,
		`#!/usr/bin/env node\nimport { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(argsPath)}, JSON.stringify({ args: process.argv.slice(2), config: process.env.MCPORTER_CONFIG }));\n`,
	);
	await chmod(fakePi, 0o755);
	const previous = process.env.PI_SYCH_PI_BIN;
	process.env.PI_SYCH_PI_BIN = fakePi;
	try {
		await launchPiWorker({
			taskId: "remote-task",
			runId: "remote-run",
			request: validateDispatchRequest({ ...request, remoteResearch: true }),
			workerAgentDir: join(projectRoot, "agent"),
			resultPath: join(projectRoot, "result.json"),
			projectRoot,
			model: "test-model",
			prompt: "remote",
			packageRoot: PI_SYCH_PACKAGE_ROOT,
			extraExtensionPaths: [
				join(PI_SYCH_PACKAGE_ROOT, "node_modules/pi-mcporter/dist/index.js"),
			],
		});
		const launch = JSON.parse(await readFile(argsPath, "utf8"));
		assert.deepEqual(
			launch.args.flatMap((item, index, args) =>
				item === "--extension" ? [args[index + 1]] : [],
			),
			[
				join(PI_SYCH_PACKAGE_ROOT, "extensions/worker/index.ts"),
				join(PI_SYCH_PACKAGE_ROOT, "node_modules/pi-mcporter/dist/index.js"),
			],
		);
		assert.equal(
			launch.config,
			join(process.env.HOME, ".config/pi-sych/mcp/mcporter.json"),
		);
		assert.match(launch.args.join(" "), /--no-approve/);
	} finally {
		if (previous === undefined) delete process.env.PI_SYCH_PI_BIN;
		else process.env.PI_SYCH_PI_BIN = previous;
	}
});

test("real worker launcher terminates a cancelled external worker", async () => {
	const projectRoot = await mkdtemp(
		join(tmpdir(), "pi-sych-cancelled-project-"),
	);
	const fakePi = join(projectRoot, "fake-pi-cancel");
	await writeFile(
		fakePi,
		"#!/usr/bin/env node\\nprocess.on('SIGTERM', () => process.exit(143));\\nsetInterval(() => {}, 1000);\\n",
	);
	await chmod(fakePi, 0o755);
	const controller = new AbortController();
	const promise = launchPiWorker({
		taskId: "cancel-task",
		runId: "cancel-run",
		request: validateDispatchRequest({ ...request, timeoutMs: 5000 }),
		workerAgentDir: join(projectRoot, "agent"),
		resultPath: join(projectRoot, "result.json"),
		projectRoot,
		model: "test-model",
		prompt: "cancel",
		signal: controller.signal,
	});
	setTimeout(() => controller.abort(), 25);
	const outcome = await promise;
	assert.equal(outcome.classification, "cancelled");
	assert.equal(outcome.timedOut, false);
});

test("dispatch returns an immutable result even when the worker process exits nonzero", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-dispatch-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request,
		profiles: { default: ["model-one"] },
		launcher: async (spec) => {
			await saveSyntheticWorkerResult(spec.resultPath, resultFor(spec));
			return {
				exitCode: 1,
				stdout: "partial output",
				stderr: "tool ended",
				timedOut: false,
			};
		},
	});
	assert.equal(outcome.result.status, "complete");
	assert.equal(outcome.failure, undefined);
	assert.equal(outcome.attempts, 1);
});

test("dispatch runs only explicitly requested supervisor verification", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-verification-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const launcher = async (spec) => {
		await saveSyntheticWorkerResult(spec.resultPath, resultFor(spec));
		return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
	};
	const optional = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request,
		profiles: { default: ["model"] },
		launcher,
	});
	assert.deepEqual(optional.result.verification, []);

	const verified = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request: {
			...request,
			verification: {
				commands: [
					{ executable: process.execPath, args: ["-e", "process.exit(0)"] },
				],
			},
		},
		profiles: { default: ["model"] },
		launcher,
	});
	assert.equal(verified.failure, undefined);
	assert.equal(verified.result.verification.length, 1);
	assert.equal(verified.result.verification[0].exitCode, 0);
});

test("dispatch preserves the worker result and classifies failed explicit verification", async () => {
	const root = await mkdtemp(
		join(tmpdir(), "pi-sych-worker-verification-failure-"),
	);
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request: {
			...request,
			verification: {
				commands: [
					{
						executable: process.execPath,
						args: ["-e", "process.exit(4)"],
						expectedExitCode: 0,
					},
				],
			},
		},
		profiles: { default: ["model"] },
		launcher: async (spec) => {
			await saveSyntheticWorkerResult(spec.resultPath, resultFor(spec));
			return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
		},
	});
	assert.equal(outcome.result.status, "complete");
	assert.equal(outcome.result.verification[0].exitCode, 4);
	assert.equal(outcome.failure.classification, "verification-failure");
	assert.match(outcome.failure.lastEvent, /1 of 1/);
});

test("dispatch classifies malformed worker results as schema failures", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-schema-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request,
		profiles: { default: ["model-one", "model-two"] },
		launcher: async (spec) => {
			await saveSyntheticWorkerResult(spec.resultPath, {
				...resultFor(spec),
				status: "invalid",
			});
			return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
		},
	});
	assert.equal(outcome.result, undefined);
	assert.equal(outcome.failure.classification, "schema-failure");
	assert.equal(outcome.failure.artifactWritten, true);
	assert.match(outcome.failure.lastEvent, /Invalid worker result status/);
	assert.equal(outcome.attempts, 1);
});

test("model failures are classified from structured or terminal Pi errors", () => {
	assert.equal(
		classifyModelError("Error: model does not exist"),
		"model-unavailable",
	);
	assert.equal(
		classifyModelError("HTTP 429: rate limit exceeded"),
		"model-limit",
	);
	assert.equal(
		classifyModelError("worker wrote an invalid artifact"),
		undefined,
	);
});

test("dispatch reports committed mutations and keeps runtime state Git-local", async () => {
	const root = await mkdtemp(
		join(tmpdir(), "pi-sych-worker-committed-change-"),
	);
	await initializeGitProject(root);
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request: { ...request, mode: "full-host", intendedWritePaths: [] },
		profiles: { default: ["model"] },
		launcher: async (spec) => {
			await writeFile(
				join(root, "committed -> odd name.md"),
				"worker mutation\n",
			);
			git(root, "add", "committed -> odd name.md");
			git(root, "commit", "-qm", "worker mutation");
			await saveSyntheticWorkerResult(spec.resultPath, resultFor(spec));
			return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
		},
	});
	assert.deepEqual(outcome.result.observedChanges, [
		"committed -> odd name.md",
	]);
	assert.deepEqual(outcome.unexpectedChanges, ["committed -> odd name.md"]);
	assert.match(
		await readFile(join(root, ".git", "info", "exclude"), "utf8"),
		/^\.pi-sych\/$/m,
	);
	assert.equal(git(root, "status", "--porcelain=v1").trim(), "");
});

test("dispatch does not retry a transient failure after project mutation", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-mutated-failure-"));
	await initializeGitProject(root);
	let calls = 0;
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request: { ...request, mode: "full-host", intendedWritePaths: [] },
		profiles: { default: ["first", "second"] },
		launcher: async () => {
			calls += 1;
			await writeFile(join(root, "partial.md"), "first attempt\n");
			return {
				exitCode: 1,
				stdout: "",
				stderr: "limited",
				timedOut: false,
				classification: "model-limit",
			};
		},
	});
	assert.equal(calls, 1);
	assert.equal(outcome.failure.classification, "model-limit");
	assert.equal(outcome.failure.projectChanged, true);
	assert.match(outcome.failure.lastEvent, /fallback model was not attempted/);
	assert.deepEqual(outcome.unexpectedChanges, ["partial.md"]);
});

test("dispatch retries only once for a retryable launch failure and reports scope differences", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-retry-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	let calls = 0;
	const outcome = await dispatchWorker({
		projectRoot: root,
		workerAgentDir: join(root, "agent"),
		request: {
			...request,
			mode: "full-host",
			intendedWritePaths: ["expected.md"],
		},
		profiles: { default: ["first", "second", "third"] },
		launcher: async (spec) => {
			calls += 1;
			if (calls === 1)
				return {
					exitCode: 1,
					stdout: "",
					stderr: "unavailable",
					timedOut: false,
					classification: "model-unavailable",
				};
			await saveSyntheticWorkerResult(spec.resultPath, resultFor(spec));
			return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
		},
	});
	assert.equal(calls, 2);
	assert.equal(outcome.attempts, 2);
	assert.equal(outcome.result.status, "complete");
	assert.deepEqual(
		unexpectedChanges(["expected.md", "unexpected.md"], ["expected.md"]),
		["unexpected.md"],
	);
});
