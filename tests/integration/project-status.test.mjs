import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { fingerprintFile } from "../../.test-build/workbench/src/project-status.js";

function invokeStatus(cwd, agentDir) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(
			"pi",
			[
				"--mode",
				"rpc",
				"--no-session",
				"--no-extensions",
				"--extension",
				resolve("extensions/workbench/index.ts"),
				"--no-skills",
				"--no-prompt-templates",
				"--no-themes",
				"--no-context-files",
			],
			{
				cwd,
				env: { ...process.env, PI_OFFLINE: "1", PI_CODING_AGENT_DIR: agentDir },
				stdio: ["pipe", "pipe", "pipe"],
			},
		);
		let buffer = "";
		let stderr = "";
		const timeout = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error(`status timed out: ${stderr}`));
		}, 15_000);
		child.stderr.setEncoding("utf8");
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			buffer += chunk;
			while (buffer.includes("\n")) {
				const newline = buffer.indexOf("\n");
				const line = buffer.slice(0, newline);
				buffer = buffer.slice(newline + 1);
				if (!line) continue;
				const event = JSON.parse(line);
				if (
					event.type === "extension_ui_request" &&
					event.method === "notify"
				) {
					clearTimeout(timeout);
					child.kill("SIGTERM");
					resolvePromise({ event, stderr });
					return;
				}
			}
		});
		child.once("error", reject);
		child.stdin.write(
			`${JSON.stringify({ type: "prompt", message: "/pi-sych-status" })}\n`,
		);
	});
}

test("status command reports mechanical state without semantic drift claims", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-status-"));
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-agent-"));
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n",
	);
	const fingerprint = await fingerprintFile(join(root, "PROJECT.md"));
	await writeFile(
		join(root, "SYNC.md"),
		`# Project synchronization\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-07-28T12:00:00Z", artifacts: [{ path: "PROJECT.md", status: "needs-review", fingerprint }] }, null, 2)}\n\`\`\`\n`,
	);
	const { event, stderr } = await invokeStatus(root, agentDir);
	assert.equal(stderr, "");
	assert.match(event.message, /Project status/);
	assert.match(event.message, /Persisted as needing review:\n- PROJECT\.md/);
	assert.match(event.message, /match their recorded hashes/);
	assert.match(event.message, /not conceptual drift/);
});
