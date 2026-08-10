#!/usr/bin/env node
import { lstat, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function expandHome(path) {
	return path === "~"
		? homedir()
		: path.startsWith("~/")
			? resolve(homedir(), path.slice(2))
			: resolve(path);
}
export async function linkIfPresent(source, target) {
	try {
		await lstat(source);
	} catch (error) {
		if (error && error.code === "ENOENT") return false;
		throw error;
	}
	await rm(target, { force: true, recursive: true });
	await symlink(source, target);
	return true;
}
export async function bootstrapWorkerAgentDir({
	agentDir,
	packageRoot = scriptRoot,
	supervisorAgentDir = process.env.PI_CODING_AGENT_DIR ?? resolve(homedir(), ".pi/agent"),
} = {}) {
	if (!agentDir)
		throw new Error(
			"--agent-dir is required; use the workerAgentDir resolved from Pi Sych config.json",
		);
	const resolvedAgentDir = expandHome(agentDir);
	const resolvedPackageRoot = resolve(packageRoot);
	const resolvedSupervisorDir = expandHome(supervisorAgentDir);
	await mkdir(resolvedAgentDir, { recursive: true, mode: 0o700 });
	const settings = {
		packages: [],
		extensions: [resolve(resolvedPackageRoot, "extensions/worker/index.ts")],
		skills: [],
		prompts: [],
		themes: [],
		quietStartup: true,
	};
	await writeFile(
		resolve(resolvedAgentDir, "settings.json"),
		`${JSON.stringify(settings, null, 2)}\n`,
		{
			mode: 0o600,
		},
	);
	const linked = {};
	for (const file of ["auth.json", "models.json", "models-store.json"]) {
		linked[file] = await linkIfPresent(
			resolve(resolvedSupervisorDir, file),
			resolve(resolvedAgentDir, file),
		);
	}
	const readme = [
		"# Pi Sych worker agent directory",
		"",
		"Generated runtime configuration. It loads only the Pi Sych worker extension from the selected package.",
		"Credential and model files are symlinked when present; they are never copied.",
		"For remote research, configure MCPorter at ../mcp/mcporter.json relative to this worker-agent directory.",
		"",
	].join("\n");
	await writeFile(resolve(resolvedAgentDir, "README.md"), readme, {
		mode: 0o600,
	});
	return {
		agentDir: resolvedAgentDir,
		packageRoot: resolvedPackageRoot,
		linked,
		settings,
	};
}
function parseArguments(argv) {
	const options = {};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const value = argv[index + 1];
		if (arg === "--agent-dir" && value) options.agentDir = value;
		else if (arg === "--package-root" && value) options.packageRoot = value;
		else if (arg === "--supervisor-agent-dir" && value) options.supervisorAgentDir = value;
		else throw new Error(`Unknown or incomplete argument: ${arg}`);
		index += 1;
	}
	return options;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const result = await bootstrapWorkerAgentDir(parseArguments(process.argv.slice(2)));
	process.stdout.write(`${JSON.stringify(result)}\n`);
}
