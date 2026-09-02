import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { posix, resolve, win32 } from "node:path";
export interface PiSychConfig {
	version: 1;
	workerAgentDir: string;
	modelCatalog: string;
	mcporterConfig: string;
	literatureDatabase?: string;
	compaction: { custom: boolean; compactAt100k: boolean };
	review: { mode: "plannotator" | "manual" };
}
export const DEFAULT_CONFIG = {
	version: 1,
	workerAgentDir: "worker-agent",
	modelCatalog: "models.json",
	mcporterConfig: "mcp/mcporter.json",
	compaction: { custom: true, compactAt100k: false },
	review: { mode: "plannotator" },
} satisfies PiSychConfig;
export interface ConfigDirectoryOptions {
	projectRoot?: string;
	env?: NodeJS.ProcessEnv;
	home?: string;
	exists?: (path: string) => boolean;
	configDirectory?: string;
}
export function piConfigRoot({
	projectRoot,
	env = process.env,
	home = homedir(),
	exists = existsSync,
}: ConfigDirectoryOptions = {}): string {
	if (projectRoot && exists(resolve(projectRoot, ".pi"))) return resolve(projectRoot, ".pi");
	if (env.PI_CODING_AGENT_DIR) return resolve(env.PI_CODING_AGENT_DIR);
	if (env.XDG_CONFIG_HOME) return resolve(env.XDG_CONFIG_HOME, "pi");
	const configPi = resolve(home, ".config/pi"),
		dotPi = resolve(home, ".pi");
	if (exists(configPi)) return configPi;
	if (exists(dotPi)) return dotPi;
	throw new Error(
		`Pi Sych configuration directory is unavailable. Create one of: ${projectRoot ? `${resolve(projectRoot, ".pi")}; ` : ""}$XDG_CONFIG_HOME/pi; ${configPi}; ${dotPi}.`,
	);
}
export const piSychConfigDirectory = (options: ConfigDirectoryOptions = {}) =>
	options.configDirectory ?? resolve(piConfigRoot(options), "pi-sych");
export const piSkillDirectory = (options: ConfigDirectoryOptions = {}) =>
	resolve(piConfigRoot(options), "skills");
const rejectUnknown = (item: Record<string, unknown>, keys: string[], path: string) => {
	const unknown = Object.keys(item).filter((key) => !keys.includes(key));
	if (unknown.length)
		throw new Error(`Unknown Pi Sych config key at ${path}: ${unknown.join(", ")}`);
};
const configString = (item: Record<string, unknown>, key: string, path: string) => {
	const value = item[key];
	if (
		typeof value !== "string" ||
		!value.trim() ||
		posix.isAbsolute(value) ||
		win32.isAbsolute(value) ||
		value.split(/[\\/]/).includes("..")
	)
		throw new Error(`Pi Sych config ${key} must be a non-empty relative path at ${path}`);
	return value;
};
const configKeys =
	"version workerAgentDir modelCatalog mcporterConfig literatureDatabase compaction review".split(
		" ",
	);
export function loadPiSychConfig(options: ConfigDirectoryOptions = {}): PiSychConfig {
	const path = resolve(piSychConfigDirectory(options), "config.json");
	if (!existsSync(path)) return structuredClone(DEFAULT_CONFIG);
	let value: unknown;
	try {
		value = JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		throw new Error(`Pi Sych config is unavailable or invalid at ${path}: ${String(error)}`);
	}
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`Pi Sych config must be an object at ${path}`);
	const item = value as Record<string, unknown>;
	rejectUnknown(item, configKeys, path);
	if (!item.compaction || typeof item.compaction !== "object" || Array.isArray(item.compaction))
		throw new Error(`Pi Sych config compaction must be an object at ${path}`);
	const compaction = item.compaction as Record<string, unknown>,
		review = (item.review ?? DEFAULT_CONFIG.review) as Record<string, unknown>;
	rejectUnknown(compaction, ["custom", "compactAt100k"], `${path}.compaction`);
	rejectUnknown(review, ["mode"], `${path}.review`);
	if (
		item.version !== 1 ||
		typeof compaction.custom !== "boolean" ||
		typeof compaction.compactAt100k !== "boolean" ||
		!(["plannotator", "manual"] as string[]).includes(review.mode as string)
	)
		throw new Error(`Pi Sych config is invalid at ${path}`);
	const literatureDatabase = item.literatureDatabase;
	if (
		literatureDatabase !== undefined &&
		(typeof literatureDatabase !== "string" ||
			!literatureDatabase.trim() ||
			literatureDatabase.split(/[\\/]/).includes(".."))
	)
		throw new Error(
			`Pi Sych config literatureDatabase must be a non-empty path without parent traversal at ${path}`,
		);
	return {
		version: 1,
		workerAgentDir: configString(item, "workerAgentDir", path),
		modelCatalog: configString(item, "modelCatalog", path),
		mcporterConfig: configString(item, "mcporterConfig", path),
		...(literatureDatabase ? { literatureDatabase } : {}),
		compaction: { custom: compaction.custom, compactAt100k: compaction.compactAt100k },
		review: { mode: review.mode as PiSychConfig["review"]["mode"] },
	};
}
export function piSychConfigPath(
	key: "workerAgentDir" | "modelCatalog" | "mcporterConfig",
	options: ConfigDirectoryOptions = {},
): string {
	return resolve(piSychConfigDirectory(options), loadPiSychConfig(options)[key]);
}
export async function ensurePiSychConfig(options: ConfigDirectoryOptions = {}): Promise<string> {
	const directory = piSychConfigDirectory(options),
		path = resolve(directory, "config.json");
	await mkdir(directory, { recursive: true, mode: 0o700 });
	try {
		await writeFile(path, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, {
			flag: "wx",
			mode: 0o600,
		});
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
	}
	return directory;
}
