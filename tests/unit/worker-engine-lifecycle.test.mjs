import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

async function readyProject() {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-lifecycle-"));
	const agentDir = join(root, "worker-agent");
	await writeFile(join(root, "A.md"), "a");
	await mkdir(agentDir, { recursive: true });
	await writeFile(join(agentDir, "settings.json"), "{}\n");
	return { root, agentDir, resolved: project(root) };
}

test("dispatch accepts a valid result and rejects reported path escapes", async () => {
	const { agentDir, resolved } = await readyProject();
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

test("dispatch explains how to initialize a missing worker directory", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-missing-"));
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

test("worker launcher reports timeout, cancellation, and spawn failure", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-launcher-"));
	const fake = join(root, "pi");
	await writeFile(fake, "#!/bin/sh\ntrap 'exit 0' TERM\nwhile :; do /bin/sleep 1; done\n");
	await chmod(fake, 0o755);
	const previous = process.env.PATH;
	const spec = {
		id: "test",
		request: { ...request, timeoutMs: 20 },
		workerAgentDir: root,
		resultPath: join(root, "result.json"),
		projectRoot: root,
		model: "provider/model",
		prompt: "test",
		packageRoot: process.cwd(),
		extraExtensionPaths: [],
	};
	try {
		process.env.PATH = root;
		assert.equal((await launchPiWorker(spec)).classification, "timeout");
		const controller = new AbortController();
		controller.abort();
		assert.equal(
			(await launchPiWorker({ ...spec, signal: controller.signal })).classification,
			"cancelled",
		);
		await rm(fake);
		assert.equal((await launchPiWorker(spec)).classification, "spawn-failure");
	} finally {
		if (previous === undefined) delete process.env.PATH;
		else process.env.PATH = previous;
	}
});
