import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { parseModelCatalog } from "../../.test-build/workbench/src/model-catalog.js";
import {
	DEFAULT_TIMEOUT_MS,
	modelFor,
	skillPaths,
	taskPrompt,
	toolsForRequest,
	validateWorkerResult,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const catalog = { default: "junior", models: { junior: { model: "x/y" } } };
test("worker request and result retain the bounded protocol", () => {
	assert.equal(DEFAULT_TIMEOUT_MS, 90_000);
	assert.deepEqual(
		validateWorkerResult({ status: "complete", summary: "done", files: ["A.md"], limitations: [] })
			.files,
		["A.md"],
	);
	assert.throws(() => validateWorkerResult({ status: "complete", summary: "x" }), /files/);
	assert.throws(
		() => validateWorkerResult({ status: "complete", summary: "x", files: {}, limitations: [] }),
		/files must be an array of strings/,
	);
	assert.equal(modelFor(parseModelCatalog(catalog), "junior"), "x/y");
	assert.deepEqual(toolsForRequest({ mode: "read-only", remoteResearch: false }), [
		"read",
		"grep",
		"find",
		"ls",
		"submit_artifact",
	]);
	assert.ok(toolsForRequest({ mode: "edit", remoteResearch: true }).includes("mcporter"));
	assert.deepEqual(toolsForRequest({ mode: "full-host", remoteResearch: false }), [
		"read",
		"edit",
		"write",
		"bash",
		"submit_artifact",
	]);
});
test("named skills retain project, user, and package precedence", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-skill-paths-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const projectRoot = join(root, "project");
	const packageRoot = join(root, "package");
	const userRoot = join(root, "user");
	const paths = [
		join(packageRoot, "skills", "write", "SKILL.md"),
		join(userRoot, "write", "SKILL.md"),
		join(projectRoot, ".agents", "skills", "write", "SKILL.md"),
		join(projectRoot, ".pi", "skills", "write", "SKILL.md"),
	];
	for (const [index, path] of paths.entries()) {
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, `source ${index}\n`);
	}
	assert.equal(skillPaths(["write"], projectRoot, packageRoot, userRoot)[0], paths[3]);
	await rm(dirname(paths[3]), { recursive: true });
	assert.equal(skillPaths(["write"], projectRoot, packageRoot, userRoot)[0], paths[2]);
	await rm(dirname(paths[2]), { recursive: true });
	assert.equal(skillPaths(["write"], projectRoot, packageRoot, userRoot)[0], paths[1]);
	await rm(dirname(paths[1]), { recursive: true });
	assert.equal(skillPaths(["write"], projectRoot, packageRoot, userRoot)[0], paths[0]);
});

test("worker prompt requires routed method and module reads", () => {
	const prompt = taskPrompt(
		{
			id: "task-1",
			request: {
				task: "review prose",
				mode: "read-only",
				expectedOutput: "findings",
				contextFiles: [],
				skills: ["review"],
			},
			workerAgentDir: "/worker",
			resultPath: "/result.json",
			projectRoot: "/project",
			model: "provider/model",
			prompt: "",
			packageRoot: "/package",
			extraExtensionPaths: [],
		},
		[{ path: "DRAFT.md", purpose: "artifact under review" }],
	);
	assert.match(prompt, /Read every context file and selected skill/i);
	assert.match(prompt, /local modules and shared methods.*routes to for this task/i);
	assert.match(prompt, /state missing context as a limitation instead of guessing/i);
	assert.match(prompt, /submit_artifact by itself as the final tool call/i);
});

test("worker result is immutable", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pi-sych-worker-")),
		path = join(dir, "result.json"),
		result = { status: "complete", summary: "done", files: [], limitations: [] };
	await writeImmutableResult(path, result);
	assert.deepEqual(JSON.parse(await readFile(path, "utf8")), result);
	await assert.rejects(writeImmutableResult(path, result), /immutable/);
});
