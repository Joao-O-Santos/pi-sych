import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

export interface McporterDependencyInfo {
	piMcporterEntry: string;
	piMcporterVersion: string;
	mcporterCliEntry: string;
	mcporterVersion: string;
	duplicateMcporterVersions: string[];
}

function packageVersion(path: string): string {
	return (JSON.parse(readFileSync(path, "utf8")) as { version: string }).version;
}

export function resolveMcporterDependencies(): McporterDependencyInfo {
	let piMcporterEntry: string;
	try {
		piMcporterEntry = require.resolve("pi-mcporter/dist/index.js");
	} catch {
		throw new Error("pi-mcporter is not installed; run npm install pi-mcporter@latest");
	}
	const piMcporterRoot = dirname(dirname(piMcporterEntry));
	const piMcporterVersion = packageVersion(resolve(piMcporterRoot, "package.json"));
	let current = piMcporterRoot;
	let mcporterRoot: string | undefined;
	while (true) {
		const candidate = resolve(current, "node_modules", "mcporter");
		if (existsSync(resolve(candidate, "package.json"))) {
			mcporterRoot = candidate;
			break;
		}
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	if (!mcporterRoot)
		throw new Error("pi-mcporter does not have a resolvable compatible MCPorter runtime");
	const mcporterCliEntry = resolve(mcporterRoot, "dist", "cli.js");
	if (!existsSync(mcporterCliEntry))
		throw new Error("pi-mcporter's compatible MCPorter runtime has no CLI entry");
	const mcporterVersion = packageVersion(resolve(mcporterRoot, "package.json"));
	return {
		piMcporterEntry,
		piMcporterVersion,
		mcporterCliEntry,
		mcporterVersion,
		duplicateMcporterVersions: [],
	};
}

export function remoteResearchExtensionPaths(enabled: boolean): string[] {
	return enabled ? [resolveMcporterDependencies().piMcporterEntry] : [];
}

export interface McporterDiagnostic {
	dependency: McporterDependencyInfo;
	configPath: string;
	configExists: boolean;
	configError?: string;
	servers: string[];
	imports: unknown;
}

export function inspectMcporter(
	configPath = process.env.PI_SYCH_MCPORTER_CONFIG ??
		resolve(homedir(), ".config/pi-sych/mcp/mcporter.json"),
): McporterDiagnostic {
	const dependency = resolveMcporterDependencies();
	if (!existsSync(configPath))
		return {
			dependency,
			configPath,
			configExists: false,
			servers: [],
			imports: undefined,
		};
	try {
		const config = JSON.parse(readFileSync(configPath, "utf8")) as {
			mcpServers?: Record<string, unknown>;
			imports?: unknown;
		};
		return {
			dependency,
			configPath,
			configExists: true,
			servers: Object.keys(config.mcpServers ?? {}),
			imports: config.imports,
		};
	} catch (error) {
		return {
			dependency,
			configPath,
			configExists: true,
			configError: error instanceof Error ? error.message : String(error),
			servers: [],
			imports: undefined,
		};
	}
}

export function formatMcporterDiagnostic(diagnostic: McporterDiagnostic): string {
	const { dependency } = diagnostic;
	return [
		"Pi Sych MCPorter diagnostics",
		`pi-mcporter: ${dependency.piMcporterVersion} (${dependency.piMcporterEntry})`,
		`mcporter: ${dependency.mcporterVersion} (${dependency.mcporterCliEntry})`,
		`config: ${diagnostic.configPath} (${diagnostic.configExists ? (diagnostic.configError ? `invalid: ${diagnostic.configError}` : "present") : "missing"})`,
		`servers: ${diagnostic.servers.join(", ") || "none"}`,
		`imports: ${JSON.stringify(diagnostic.imports ?? [])}`,
		"This diagnostic is not a security boundary; MCP tools and their content remain external.",
	].join("\n");
}
