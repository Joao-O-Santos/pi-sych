import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { dispatchWorker } from "../../.test-build/workbench/src/worker-engine.js";

const request = {
	task: "exercise result protocol",
	mode: "read-only",
	expectedOutput: "result",
	contextFiles: [],
};
const catalog = { default: "worker", models: { worker: { model: "provider/model" } } };

const resolvedProject = (root) => ({
	cwd: root,
	workspaceRoot: root,
	projectRoot: root,
	syncPath: join(root, "SYNC.json"),
	canonical: Object.fromEntries(
		["project", "agents", "style", "evidence", "decisions", "todo", "inbox"].map((role) => [
			role,
			join(root, `${role.toUpperCase()}.md`),
		]),
	),
});

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-dispatch-protocol-"));
	const workerAgentDir = join(root, "worker-agent");
	await mkdir(workerAgentDir);
	await writeFile(join(workerAgentDir, "settings.json"), "{}\n");
	await writeFile(join(root, "A.md"), "tracked\n");
	return { root, workerAgentDir, project: resolvedProject(root) };
}

const rawLauncher =
	(contents, launch = { exitCode: 0, stderr: "" }) =>
	async (spec) => {
		if (contents !== undefined) await writeFile(spec.resultPath, contents);
		return launch;
	};
const jsonLauncher = (value, launch) => rawLauncher(`${JSON.stringify(value)}\n`, launch);

async function dispatch(setup, launcher) {
	return dispatchWorker({
		project: setup.project,
		workerAgentDir: setup.workerAgentDir,
		request,
		catalog,
		launcher,
	});
}

for (const status of ["complete", "partial", "failed"]) {
	test(`dispatch accepts a valid ${status} result`, async () => {
		const setup = await fixture();
		const result = { status, summary: `${status} summary`, files: ["A.md"], limitations: [] };
		const outcome = await dispatch(setup, jsonLauncher(result));
		assert.deepEqual(outcome.result, result);
		assert.equal(outcome.error, undefined);
	});
}

const invalidResults = [
	["no result", undefined, /Worker result protocol failed: .*ENOENT/],
	["malformed JSON", "{not-json\n", /Worker result protocol failed: .*JSON/],
	["JSON scalar", '"scalar"\n', /Worker result protocol failed: Worker result must be an object/],
	[
		"invalid status",
		JSON.stringify({ status: "unknown", summary: "x", files: [], limitations: [] }),
		/Worker result protocol failed: Invalid worker result status: unknown/,
	],
	[
		"omitted status",
		JSON.stringify({ summary: "x", files: [], limitations: [] }),
		/Worker result protocol failed: status must be a non-empty string/,
	],
	[
		"omitted summary",
		JSON.stringify({ status: "complete", files: [], limitations: [] }),
		/Worker result protocol failed: summary must be a non-empty string/,
	],
	[
		"omitted files",
		JSON.stringify({ status: "complete", summary: "x", limitations: [] }),
		/Worker result protocol failed: files must be an array of strings/,
	],
	[
		"omitted limitations",
		JSON.stringify({ status: "complete", summary: "x", files: [] }),
		/Worker result protocol failed: limitations must be an array of strings/,
	],
	[
		"mixed-type files",
		JSON.stringify({ status: "complete", summary: "x", files: ["A.md", 1], limitations: [] }),
		/Worker result protocol failed: files must be an array of strings/,
	],
	[
		"mixed-type limitations",
		JSON.stringify({ status: "complete", summary: "x", files: [], limitations: ["x", false] }),
		/Worker result protocol failed: limitations must be an array of strings/,
	],
	[
		"path escape",
		JSON.stringify({ status: "complete", summary: "x", files: ["../escape"], limitations: [] }),
		/Worker result protocol failed: Project artifact path leaves the project root: \.\.\/escape/,
	],
	[
		"nonexistent path",
		JSON.stringify({ status: "complete", summary: "x", files: ["missing.md"], limitations: [] }),
		/Worker result protocol failed: .*ENOENT/,
	],
];

for (const [name, contents, expectedError] of invalidResults) {
	test(`dispatch rejects ${name}`, async () => {
		const outcome = await dispatch(await fixture(), rawLauncher(contents));
		assert.equal(outcome.result, undefined);
		assert.match(outcome.error ?? "", expectedError);
	});
}

const processFailures = [
	["nonzero exit", { exitCode: 7, stderr: "worker stderr" }, "Worker exited 7: worker stderr"],
	["timeout", { exitCode: null, stderr: "", classification: "timeout" }, "Worker timeout"],
	["cancellation", { exitCode: null, stderr: "", classification: "cancelled" }, "Worker cancelled"],
	["signal", { exitCode: 0, stderr: "", terminationSignal: "SIGTERM" }, "Worker exited 0"],
];

for (const [name, launch, expectedError] of processFailures) {
	test(`dispatch gives ${name} precedence over an existing valid result`, async () => {
		const setup = await fixture();
		const outcome = await dispatch(
			setup,
			jsonLauncher(
				{ status: "complete", summary: "must be ignored", files: ["A.md"], limitations: [] },
				launch,
			),
		);
		assert.equal(outcome.result, undefined);
		assert.equal(outcome.error, expectedError);
		assert.deepEqual(outcome.launch, launch);
	});
}
