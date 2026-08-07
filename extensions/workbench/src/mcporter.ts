import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { piSychConfigPath } from "./config-directory.js";

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
export const formatMcporterDiagnostic = (value: McporterDiagnostic) =>
	[
		"Pi Sych MCPorter diagnostics",
		`extension: ${value.available ? "available" : "unavailable"}`,
		`config: ${value.configPath} (${value.configExists ? "present" : "missing"})`,
		`servers: ${value.servers.join(", ") || "none"}`,
		...(value.configError ? [`config error: ${value.configError}`] : []),
	].join("\n");
