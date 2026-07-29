import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { bootstrapWorkerAgentDir } from "../../scripts/bootstrap-worker-agent-dir.mjs";

function getCommands(args, env) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn("pi", args, {
			cwd: process.cwd(),
			env: { ...process.env, PI_OFFLINE: "1", ...env },
			stdio: ["pipe", "pipe", "pipe"],
		});
		let stdout = "";
		const stderr = "";
		const timeout = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error(`Pi RPC timed out\n${stderr}`));
		}, 15000);

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
			for (const line of stdout.split("\n")) {
				if (!line.trim()) continue;
				try {
					const event = JSON.parse(line);
					if (event.type === "response" && event.command === "get_commands") {
						clearTimeout(timeout);
						child.kill("SIGTERM");
						resolvePromise({ commands: event.data.commands, stderr });
						return;
					}
				} catch {
					// Wait for a complete JSONL record.
				}
			}
		});
		child.once("error", reject);
		child.stdin.end(`${JSON.stringify({ type: "get_commands" })}\n`);
	});
}

test("public workbench extension loads without private configuration", async () => {
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-public-"));
	const extension = resolve("extensions/workbench/index.ts");
	const { commands, stderr } = await getCommands(
		[
			"--mode",
			"rpc",
			"--no-session",
			"--no-extensions",
			"--extension",
			extension,
			"--no-skills",
			"--no-prompt-templates",
			"--no-themes",
			"--no-context-files",
		],
		{ PI_CODING_AGENT_DIR: agentDir },
	);

	assert.equal(stderr, "");
	const names = commands.map((command) => command.name);
	assert.deepEqual(names.filter((name) => name.startsWith("pi-sych-")).sort(), [
		"pi-sych-drift",
		"pi-sych-init",
		"pi-sych-mcp",
		"pi-sych-retro",
		"pi-sych-status",
		"pi-sych-sync",
	]);
	assert.equal(names.includes("plannotator-annotate"), true);
	assert.equal(names.includes("plannotator-last"), true);
	assert.equal(names.includes("plannotator"), false);
	assert.equal(names.includes("plannotator-review"), false);
});

test("bootstrapped worker starts with only the worker extension", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-load-"));
	const agentDir = join(root, "agent");
	const supervisorAgentDir = join(root, "supervisor");
	await bootstrapWorkerAgentDir({
		agentDir,
		packageRoot: process.cwd(),
		supervisorAgentDir,
	});

	const { commands, stderr } = await getCommands(
		["--mode", "rpc", "--no-session", "--no-context-files"],
		{ PI_CODING_AGENT_DIR: agentDir },
	);

	assert.equal(stderr, "");
	assert.deepEqual(
		commands
			.map((command) => command.name)
			.filter((name) => name.startsWith("pi-sych-")),
		["pi-sych-worker-status"],
	);
});
