import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { bootstrapWorkerAgentDir } from "../../scripts/bootstrap-worker-agent-dir.mjs";

test("real Pi can inspect a disposable project and write an artifact", {
	skip:
		process.env.PI_SYCH_USAGE_TEST === "1"
			? false
			: "set PI_SYCH_USAGE_TEST=1 to run real-model usage acceptance",
}, async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-usage-"));
	const session = join(root, "session.jsonl");
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-usage-agent-"));
	const workerAgentDir = await mkdtemp(
		join(tmpdir(), "pi-sych-usage-worker-agent-"),
	);
	t.after(() =>
		Promise.all(
			[root, agentDir, workerAgentDir].map((path) =>
				rm(path, { recursive: true, force: true }),
			),
		),
	);
	const supervisorAgentDir =
		process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".config/pi");
	const modelCatalog =
		process.env.PI_SYCH_MODEL_CATALOG ??
		join(supervisorAgentDir, "pi-sych/models.json");
	await bootstrapWorkerAgentDir({
		agentDir: workerAgentDir,
		packageRoot: process.cwd(),
		supervisorAgentDir,
	});
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n\n## Objective\nWrite a dummy report.\n\n## Current direction\nKeep it concise.\n\n## Definition of done\nREPORT.md exists.\n\n## Previous action\nNone yet.\n\n## Immediate next step\nNone at present.\n",
	);
	await writeFile(
		join(root, "SYNC.json"),
		'{"version":2,"confirmedAt":"2026-01-01T00:00:00Z","artifacts":[]}\n',
	);
	const result = await new Promise((resolvePromise, reject) => {
		let settled = false;
		let timedOut = false;
		let outerTimeout;
		let killTimeout;
		const timeoutError = () =>
			new Error(
				`Pi usage test timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`,
			);
		const settle = (callback, value) => {
			if (settled) return;
			settled = true;
			clearTimeout(outerTimeout);
			clearTimeout(killTimeout);
			callback(value);
		};
		const child = spawn(
			"pi",
			[
				"--mode",
				"json",
				"--print",
				"--session",
				session,
				"--no-extensions",
				"--extension",
				resolve("extensions/workbench/index.ts"),
				"--no-skills",
				"--no-prompt-templates",
				"--no-themes",
				"--no-context-files",
				"--tools",
				"read,write,project_status,dispatch_worker",
				"Do these steps in order. First call project_status with action check. Second call dispatch_worker once with task 'Read PROJECT.md and report its objective.', mode 'read-only', expectedOutput 'One sentence stating the project objective.', contextFiles containing PROJECT.md with purpose 'dummy project direction', and modelProfile 'fast'. Wait for its result. Third read PROJECT.md and write REPORT.md containing exactly: Dummy project checked. Then stop.",
			],
			{
				cwd: root,
				env: {
					...process.env,
					PI_CODING_AGENT_DIR: agentDir,
					PI_SYCH_MODEL_CATALOG: modelCatalog,
					PI_SYCH_WORKER_AGENT_DIR: workerAgentDir,
				},
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		let stdout = "";
		let stderr = "";
		outerTimeout = setTimeout(() => {
			timedOut = true;
			child.kill("SIGTERM");
			killTimeout = setTimeout(() => {
				child.kill("SIGKILL");
				settle(reject, timeoutError());
			}, 2_000);
		}, 120_000);
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.once("error", (error) => settle(reject, error));
		child.once("close", (code) =>
			timedOut
				? settle(reject, timeoutError())
				: settle(resolvePromise, { code, stdout, stderr }),
		);
	});
	assert.equal(result.code, 0, result.stderr);
	assert.equal(
		await readFile(join(root, "REPORT.md"), "utf8"),
		"Dummy project checked.",
	);
	const sessionJson = await readFile(session, "utf8");
	assert.match(sessionJson, /project_status/);
	assert.match(sessionJson, /dispatch_worker/);
	assert.match(sessionJson, /Worker status: complete/);
	assert.match(sessionJson, /Result package: inline/);
	assert.match(sessionJson, /REPORT\.md/);
});
