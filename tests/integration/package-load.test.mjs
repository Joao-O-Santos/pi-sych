import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { DEFAULT_CONFIG } from "../../.test-build/workbench/src/config-directory.js";
import piSychWorker from "../../.test-build/worker/index.js";
import { bootstrapWorkerAgentDir } from "../../scripts/bootstrap-worker-agent-dir.mjs";

const run = promisify(execFile);

function getCommands(args, env) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn("pi", args, {
			cwd: process.cwd(),
			env: { ...process.env, PI_OFFLINE: "1", ...env },
			stdio: ["pipe", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		let commands;
		const timeout = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error(`Pi RPC timed out\n${stderr}`));
		}, 15000);

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
			for (const line of stdout.split("\n")) {
				if (!line.trim()) continue;
				try {
					const event = JSON.parse(line);
					if (event.type === "response" && event.command === "get_commands") {
						commands = event.data.commands;
						clearTimeout(timeout);
						child.kill("SIGTERM");
						return;
					}
				} catch {
					// Wait for a complete JSONL record.
				}
			}
		});
		child.once("error", reject);
		child.once("close", () => {
			clearTimeout(timeout);
			if (commands) resolvePromise({ commands, stderr });
			else reject(new Error(`Pi RPC closed without get_commands\n${stderr}`));
		});
		child.stdin.end(`${JSON.stringify({ type: "get_commands" })}\n`);
	});
}

test("core workbench extension loads without optional integrations", async () => {
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
		"pi-sych-mcp",
		"pi-sych-status",
	]);
	assert.equal(
		names.some((name) => name.startsWith("plannotator-")),
		false,
	);
});

test("Plannotator extension registers only its three commands", async () => {
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-plannotator-"));
	const { commands, stderr } = await getCommands(
		[
			"--mode",
			"rpc",
			"--no-session",
			"--no-extensions",
			"--extension",
			resolve("extensions/plannotator/index.ts"),
			"--no-skills",
			"--no-prompt-templates",
			"--no-themes",
			"--no-context-files",
		],
		{ PI_CODING_AGENT_DIR: agentDir },
	);
	assert.equal(stderr, "");
	assert.deepEqual(
		commands
			.map((command) => command.name)
			.filter((name) => name.startsWith("plannotator-"))
			.sort(),
		["plannotator-annotate", "plannotator-last", "plannotator-review"],
	);
});

test("manual review mode omits Plannotator commands", async () => {
	const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-manual-review-"));
	await mkdir(join(agentDir, "pi-sych"));
	await writeFile(
		join(agentDir, "pi-sych", "config.json"),
		JSON.stringify({ ...DEFAULT_CONFIG, review: { mode: "manual" } }),
	);
	const { commands, stderr } = await getCommands(
		[
			"--mode",
			"rpc",
			"--no-session",
			"--no-extensions",
			"--extension",
			resolve("extensions/plannotator/index.ts"),
			"--no-skills",
			"--no-prompt-templates",
			"--no-themes",
			"--no-context-files",
		],
		{ PI_CODING_AGENT_DIR: agentDir },
	);
	assert.equal(stderr, "");
	assert.equal(
		commands.some((command) => command.name.startsWith("plannotator-")),
		false,
	);
});

test("Pi discovers exactly the six public skills without exposing modules", async () => {
	const { commands, stderr } = await getCommands([
		"--mode",
		"rpc",
		"--no-session",
		"--no-extensions",
		"--no-skills",
		"--skill",
		resolve("skills"),
		"--no-prompt-templates",
		"--no-themes",
		"--no-context-files",
	]);
	assert.equal(stderr, "");
	assert.deepEqual(
		commands
			.filter((command) => command.sourceInfo.path.startsWith(resolve("skills")))
			.map((command) => command.name)
			.sort(),
		[
			"skill:analyze",
			"skill:code",
			"skill:project",
			"skill:research",
			"skill:review",
			"skill:write",
		],
	);
});

test("package metadata keeps attribution and release version consistent", async () => {
	const manifest = JSON.parse(await readFile("package.json", "utf8"));
	const lockfile = JSON.parse(await readFile("package-lock.json", "utf8"));
	assert.equal(manifest.files.includes("docs"), true);
	assert.equal((await stat("docs/attribution.md")).isFile(), true);
	assert.equal(manifest.version, "5.0.0");
	assert.equal(lockfile.version, manifest.version);
	assert.equal(lockfile.packages[""].version, manifest.version);
	assert.deepEqual(manifest.pi.extensions, [
		"./extensions/workbench/index.ts",
		"./extensions/plannotator/index.ts",
	]);
	assert.deepEqual(Object.keys(manifest.optionalDependencies).sort(), [
		"@plannotator/pi-extension",
		"jiti",
		"pi-mcporter",
	]);
	assert.equal(manifest.dependencies, undefined);
	assert.deepEqual(lockfile.packages[""].optionalDependencies, manifest.optionalDependencies);
});

test("packed install omitting optional dependencies retains the core package", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-packed-"));
	const tarballs = join(root, "tarballs"),
		install = join(root, "install");
	await mkdir(tarballs);
	await run("npm", ["pack", "--pack-destination", tarballs], { cwd: process.cwd() });
	const packageFile = join(tarballs, (await readdir(tarballs))[0]);
	await mkdir(install);
	await run("npm", ["init", "-y"], { cwd: install });
	await run("npm", ["install", "--ignore-scripts", "--omit=optional", packageFile], {
		cwd: install,
	});
	const installed = JSON.parse(
		await readFile(join(install, "node_modules/pi-sych/package.json"), "utf8"),
	);
	assert.equal(installed.version, "5.0.0");
	await assert.rejects(stat(join(install, "node_modules/@plannotator/pi-extension")));
	await assert.rejects(stat(join(install, "node_modules/pi-mcporter")));
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
		{
			PI_CODING_AGENT_DIR: agentDir,
		},
	);

	assert.equal(stderr, "");
	assert.deepEqual(
		commands.map((command) => command.name).filter((name) => name.startsWith("pi-sych-")),
		[],
	);

	const tools = [];
	piSychWorker({
		registerTool(tool) {
			tools.push(tool);
		},
	});
	assert.deepEqual(
		tools.map((tool) => tool.name),
		["submit_artifact"],
	);
	assert.deepEqual(tools[0].parameters.properties.status.enum, ["complete", "partial", "failed"]);
});
