import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	DEFAULT_TIMEOUT_MS,
	dispatchWorker,
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
		resultPackage: "result.json",
	};
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
});

test("skill resolution and worker prompts use only selected resources", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-"));
	await writeFile(join(root, "PROJECT.md"), "# Project\n");
	const paths = resolveSelectedSkillPaths(
		["artifact-workflow"],
		root,
		process.cwd(),
	);
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
	assert.match(await readFile(paths[0], "utf8"), /Artifact workflow/);
});
