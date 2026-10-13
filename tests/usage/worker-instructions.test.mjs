import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { bootstrapWorkerAgentDir } from "../../scripts/bootstrap-worker-agent-dir.mjs";

async function fileSnapshot(root) {
	const result = new Map();
	const visit = async (directory, prefix = "") => {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) await visit(join(directory, entry.name), relative);
			else result.set(relative, await readFile(join(directory, entry.name)));
		}
	};
	await visit(root);
	return result;
}

test("supervisor passes inline workerInstructions through dispatch to a live Pi worker", {
	skip:
		process.env.PI_SYCH_USAGE_TEST === "1"
			? false
			: "set PI_SYCH_USAGE_TEST=1 to run real-model usage acceptance",
	timeout: 180_000,
}, async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-worker-instructions-"));
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-worker-instructions-agent-"));
	const projectRoot = join(root, "project");
	const launchRoot = join(projectRoot, "src");
	await new Promise((resolvePromise, reject) => {
		const git = spawn("git", ["init", "-q", root], { stdio: "ignore" });
		git.once("error", reject);
		git.once("close", (code) =>
			code === 0 ? resolvePromise() : reject(new Error(`git init exited ${code}`)),
		);
	});
	const session = join(root, "supervisor-session.jsonl");
	const workerAgentDir = join(agentDir, "pi-sych", "worker-agent");
	t.after(() =>
		Promise.all([root, agentDir].map((path) => rm(path, { recursive: true, force: true }))),
	);

	const supervisorAgentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".config/pi");
	try {
		const auth = JSON.parse(await readFile(join(supervisorAgentDir, "auth.json"), "utf8"));
		if (auth["openai-codex"])
			await writeFile(
				join(agentDir, "auth.json"),
				JSON.stringify({ "openai-codex": auth["openai-codex"] }),
				{ mode: 0o600 },
			);
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	await mkdir(join(agentDir, "pi-sych"), { recursive: true });
	await writeFile(
		join(agentDir, "pi-sych", "worker-models.json"),
		JSON.stringify({
			default: "fast-draft",
			models: { "fast-draft": { model: "openai-codex/gpt-5.6-luna" } },
		}),
	);
	await bootstrapWorkerAgentDir({
		agentDir: workerAgentDir,
		packageRoot: process.cwd(),
		supervisorAgentDir,
	});
	const sharedWorkerFiles = await fileSnapshot(workerAgentDir);

	await mkdir(launchRoot, { recursive: true });
	const projectAgents =
		"Project AGENTS guidance: include the exact text PROJECT_RULE=cedar-lantern in the reported summary.\n";
	await writeFile(join(projectRoot, "AGENTS.md"), projectAgents);
	await writeFile(
		join(projectRoot, "PROJECT.md"),
		"# Brief\n\n## Objective\nReport the objective: inspect a sample.\n",
	);
	await writeFile(
		join(root, "SYNC.json"),
		`${JSON.stringify(
			{
				version: 2,
				projectRoot: "project",
				canonical: {
					project: "PROJECT.md",
					agents: "AGENTS.md",
					style: "STYLE.md",
					inbox: "INBOX.md",
				},
				confirmedAt: "2026-01-01T00:00:00Z",
				artifacts: [],
			},
			null,
			2,
		)}\n`,
	);

	const inlineGuidance =
		"Launch-scoped AGENTS.override.md guidance: include the exact text LAUNCH_OVERRIDE=violet-otter in the reported summary.";
	const prompt = [
		"Use project_status with action check, then call dispatch_worker exactly once and wait for it. Do not do the worker's assignment yourself.",
		"The dispatch_worker call must include this exact inline workerInstructions string: " +
			JSON.stringify(inlineGuidance),
		"Give the worker a read-only task to read PROJECT.md, report its objective, and include the exact project and launch-override guidance markers in its summary. Use expectedOutput 'A summary containing the objective and both required guidance markers.', contextFiles [{path:'PROJECT.md', purpose:'project objective'}], modelRole 'fast-draft', and timeoutMs 90000. Then stop.",
	].join("\n");
	let stdout = "";
	let stderr = "";
	const outcome = await new Promise((resolvePromise, reject) => {
		let timedOut = false;
		let killTimer;
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
				"read,project_status,dispatch_worker",
				prompt,
			],
			{
				cwd: launchRoot,
				env: { ...process.env, PI_CODING_AGENT_DIR: agentDir },
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		const timeout = setTimeout(() => {
			timedOut = true;
			child.kill("SIGTERM");
			killTimer = setTimeout(() => child.kill("SIGKILL"), 2_000);
		}, 150_000);
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => (stdout += chunk));
		child.stderr.on("data", (chunk) => (stderr += chunk));
		child.once("error", (error) => {
			clearTimeout(timeout);
			clearTimeout(killTimer);
			reject(new Error(`Could not launch Pi usage test: ${error.message}`));
		});
		child.once("close", (code) => {
			clearTimeout(timeout);
			clearTimeout(killTimer);
			resolvePromise({ code, timedOut, stdout, stderr });
		});
	});
	assert.equal(
		outcome.timedOut,
		false,
		`Supervisor usage test exceeded 150 seconds. Check provider credentials/model availability.\nstdout:\n${outcome.stdout}\nstderr:\n${outcome.stderr}`,
	);
	assert.equal(
		outcome.code,
		0,
		`Supervisor Pi exited ${outcome.code}. Check configured OpenAI Codex credentials and model access.\nstdout:\n${outcome.stdout}\nstderr:\n${outcome.stderr}`,
	);

	const transcript = await readFile(session, "utf8");
	const entries = transcript
		.trim()
		.split("\n")
		.map((line) => JSON.parse(line));
	const dispatchCalls = entries.flatMap((entry) =>
		entry.type === "message" && entry.message.role === "assistant"
			? entry.message.content.filter(
					(part) => part.type === "toolCall" && part.name === "dispatch_worker",
				)
			: [],
	);
	assert.equal(dispatchCalls.length, 1, "supervisor must dispatch exactly once");
	assert.equal(dispatchCalls[0].arguments.workerInstructions, inlineGuidance);
	const dispatchResults = entries.filter(
		(entry) =>
			entry.type === "message" &&
			entry.message.role === "toolResult" &&
			entry.message.toolName === "dispatch_worker",
	);
	assert.equal(dispatchResults.length, 1, "the single dispatch must return a result");
	const workerResult = dispatchResults[0].message.content
		.map((part) => (part.type === "text" ? part.text : ""))
		.join("\n");
	assert.match(transcript, /project_status/);
	assert.match(workerResult, /Worker status: complete/, workerResult);
	assert.match(workerResult, /PROJECT_RULE=cedar-lantern/, workerResult);
	assert.match(workerResult, /LAUNCH_OVERRIDE=violet-otter/, workerResult);
	assert.equal(await readFile(join(projectRoot, "AGENTS.md"), "utf8"), projectAgents);
	assert.deepEqual(await fileSnapshot(workerAgentDir), sharedWorkerFiles);
});
