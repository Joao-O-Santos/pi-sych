import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
export const remoteResearchExtensionPaths = (enabled: boolean) => {
	if (!enabled) return [];
	try {
		return [require.resolve("pi-mcporter/dist/index.js")];
	} catch {
		throw new Error("pi-mcporter is not installed; run npm install pi-mcporter@latest");
	}
};
export interface McporterDiagnostic {
	available: boolean;
	configPath: string;
	configExists: boolean;
	servers: string[];
}
export function inspectMcporter(
	configPath = process.env.PI_SYCH_MCPORTER_CONFIG ??
		resolve(homedir(), ".config/pi-sych/mcp/mcporter.json"),
): McporterDiagnostic {
	let available = true;
	try {
		require.resolve("pi-mcporter/dist/index.js");
	} catch {
		available = false;
	}
	if (!existsSync(configPath)) return { available, configPath, configExists: false, servers: [] };
	try {
		const config = JSON.parse(readFileSync(configPath, "utf8")) as {
			mcpServers?: Record<string, unknown>;
			servers?: Record<string, unknown>;
		};
		return {
			available,
			configPath,
			configExists: true,
			servers: Object.keys(config.servers ?? config.mcpServers ?? {}),
		};
	} catch {
		return { available, configPath, configExists: true, servers: [] };
	}
}
export const formatMcporterDiagnostic = (value: McporterDiagnostic) =>
	[
		"Pi Sych MCPorter diagnostics",
		`extension: ${value.available ? "available" : "unavailable"}`,
		`config: ${value.configPath} (${value.configExists ? "present" : "missing"})`,
		`servers: ${value.servers.join(", ") || "none"}`,
	].join("\n");
