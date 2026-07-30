import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("real Pi can inspect a disposable project and write an artifact", {
	skip:
		process.env.PI_SYCH_USAGE_TEST === "1"
			? false
			: "set PI_SYCH_USAGE_TEST=1 to run real-model usage acceptance",
}, async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-usage-"));
	const session = join(root, "session.jsonl");
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-usage-agent-"));
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n\n## Objective\nWrite a dummy report.\n\n## Current direction\nKeep it concise.\n\n## Definition of done\nREPORT.md exists.\n",
	);
	await writeFile(
		join(root, "SYNC.md"),
		'# Project synchronization\n\n```json\n{"version":1,"confirmedAt":"2026-01-01T00:00:00Z","artifacts":[]}\n```\n',
	);
	const result = await new Promise((resolvePromise, reject) => {
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
				"read,write,project_status",
				"Call project_status with action check. Read PROJECT.md. Write REPORT.md containing exactly: Dummy project checked. Then stop.",
			],
			{
				cwd: root,
				env: { ...process.env, PI_CODING_AGENT_DIR: agentDir },
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		let stdout = "";
		let stderr = "";
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.once("error", reject);
		child.once("close", (code) => resolvePromise({ code, stdout, stderr }));
	});
	assert.equal(result.code, 0, result.stderr);
	assert.equal(
		await readFile(join(root, "REPORT.md"), "utf8"),
		"Dummy project checked.",
	);
	const sessionJson = await readFile(session, "utf8");
	assert.match(sessionJson, /project_status/);
	assert.match(sessionJson, /REPORT\.md/);
});
