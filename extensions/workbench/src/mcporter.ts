import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { ToolInfo } from "@earendil-works/pi-coding-agent";
import { piSychConfigPath } from "./config-directory.js";
import { literatureCapabilityState } from "./literature-search.js";

const require = createRequire(import.meta.url);
export const remoteResearchExtensionPaths = (
	enabled: boolean,
	resolveExtension = () => require.resolve("pi-mcporter/dist/index.js"),
) => {
	if (!enabled) return [];
	try {
		return [resolveExtension()];
	} catch {
		throw new Error("pi-mcporter is not installed; run npm install pi-mcporter@latest");
	}
};
export interface McporterDiagnostic {
	available: boolean;
	configPath: string;
	configExists: boolean;
	servers: string[];
	configError?: string;
}
export const mcporterConfigPath = (projectRoot?: string) =>
	piSychConfigPath("mcporterConfig", projectRoot ? { projectRoot } : {});

export function inspectMcporter(configPath = mcporterConfigPath()): McporterDiagnostic {
	let available = true;
	try {
		require.resolve("pi-mcporter/dist/index.js");
	} catch {
		available = false;
	}
	try {
		const config: unknown = JSON.parse(readFileSync(configPath, "utf8"));
		if (!config || typeof config !== "object" || Array.isArray(config))
			throw new Error("configuration must be an object");
		const item = config as Record<string, unknown>,
			servers = item.servers ?? item.mcpServers;
		if (
			servers !== undefined &&
			(!servers || typeof servers !== "object" || Array.isArray(servers))
		)
			throw new Error("servers or mcpServers must be an object");
		return {
			available,
			configPath,
			configExists: true,
			servers: Object.keys(servers ?? {}),
		};
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT")
			return { available, configPath, configExists: false, servers: [] };
		return {
			available,
			configPath,
			configExists: true,
			servers: [],
			configError: error instanceof Error ? error.message : String(error),
		};
	}
}
const isOwnedActiveTool = (
	allTools: readonly Pick<ToolInfo, "name" | "sourceInfo">[],
	active: readonly string[],
	name: string,
	workbenchSourcePath: string,
) => {
	const matches = allTools.filter((tool) => tool.name === name && active.includes(tool.name));
	return matches.length === 1 && matches[0]?.sourceInfo.path === workbenchSourcePath;
};
export const capabilitySummary = (
	allTools: readonly Pick<ToolInfo, "name" | "sourceInfo">[],
	active: readonly string[],
	projectRoot: string,
	workbenchSourcePath: string,
) => {
	const names = [...new Set(active)]
			.filter((name) => allTools.some((tool) => tool.name === name))
			.sort(),
		lines = [
			"Active capabilities (derived from this session; availability is not authorization):",
			`- active tools: ${names.join(", ") || "none"}`,
		];
	if (isOwnedActiveTool(allTools, active, "literature_search", workbenchSourcePath))
		lines.push(`- local literature: ${literatureCapabilityState(projectRoot)}`);
	if (isOwnedActiveTool(allTools, active, "dispatch_worker", workbenchSourcePath)) {
		const remote = inspectMcporter(mcporterConfigPath(projectRoot));
		const remoteState = !remote.available
			? "unavailable — MCPorter extension is not installed"
			: remote.configError
				? "degraded — MCPorter configuration is invalid"
				: !remote.configExists || !remote.servers.length
					? "degraded — MCPorter has no configured servers"
					: `configured — ${remote.servers.length} configured server${remote.servers.length === 1 ? "" : "s"}; credentials and reachability unverified`;
		lines.push(
			"- workers: exposed — clean or trajectory context; read-only, edit, or full-host tool mode; worker setup and model access unverified",
		);
		lines.push(`- remote research workers: ${remoteState}`);
	}
	return lines.join("\n");
};
export const formatMcporterDiagnostic = (value: McporterDiagnostic) =>
	[
		"Pi Sych MCPorter diagnostics",
		`extension: ${value.available ? "available" : "unavailable"}`,
		`config: ${value.configPath} (${value.configExists ? "present" : "missing"})`,
		`servers: ${value.servers.join(", ") || "none"}`,
		...(value.configError ? [`config error: ${value.configError}`] : []),
	].join("\n");
