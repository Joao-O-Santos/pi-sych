import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
export interface PiSychConfig {
	version: 2;
	literatureDatabase?: string;
	completionReassessment: boolean;
	compaction: { custom: boolean; thresholdTokens: number };
}
export const DEFAULT_CONFIG = {
	version: 2,
	completionReassessment: false,
	compaction: { custom: true, thresholdTokens: 150_000 },
} satisfies PiSychConfig;
export interface ConfigDirectoryOptions {
	projectRoot?: string;
	env?: NodeJS.ProcessEnv;
	home?: string;
	exists?: (path: string) => boolean;
	configDirectory?: string;
}
function globalConfigRoot({
	env = process.env,
	home = homedir(),
	exists = existsSync,
}: ConfigDirectoryOptions) {
	if (env.PI_CODING_AGENT_DIR) return resolve(env.PI_CODING_AGENT_DIR);
	if (env.XDG_CONFIG_HOME) return resolve(env.XDG_CONFIG_HOME, "pi");
	const configPi = resolve(home, ".config/pi"),
		dotPi = resolve(home, ".pi");
	if (exists(configPi)) return configPi;
	if (exists(dotPi)) return dotPi;
	throw new Error(
		`Pi Sych configuration directory is unavailable. Create one of: $XDG_CONFIG_HOME/pi; ${configPi}; ${dotPi}.`,
	);
}
export function piConfigRoot(options: ConfigDirectoryOptions = {}): string {
	return globalConfigRoot(options);
}
export const piSychConfigDirectory = (options: ConfigDirectoryOptions = {}) =>
	options.configDirectory ?? resolve(globalConfigRoot(options), "pi-sych");
export const piSkillDirectory = (options: ConfigDirectoryOptions = {}) =>
	resolve(globalConfigRoot(options), "skills");
const rejectUnknown = (item: Record<string, unknown>, keys: string[], path: string) => {
	const unknown = Object.keys(item).filter((key) => !keys.includes(key));
	if (unknown.length)
		throw new Error(`Unknown Pi Sych config key at ${path}: ${unknown.join(", ")}`);
};
function readConfig(path: string): Record<string, unknown> | undefined {
	let value: unknown;
	try {
		value = JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		throw new Error(`Pi Sych config is unavailable or invalid at ${path}: ${String(error)}`);
	}
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`Pi Sych config must be an object at ${path}`);
	const item = value as Record<string, unknown>;
	rejectUnknown(
		item,
		["version", "compaction", "completionReassessment", "literatureDatabase"],
		path,
	);
	if (item.completionReassessment !== undefined && typeof item.completionReassessment !== "boolean")
		throw new Error(`Pi Sych config completionReassessment must be boolean at ${path}`);
	if (item.version !== 2) throw new Error(`Pi Sych config version must be 2 at ${path}`);
	if (item.compaction !== undefined) {
		if (!item.compaction || typeof item.compaction !== "object" || Array.isArray(item.compaction))
			throw new Error(`Pi Sych config compaction must be an object at ${path}`);
		const compaction = item.compaction as Record<string, unknown>;
		rejectUnknown(compaction, ["custom", "thresholdTokens"], `${path}.compaction`);
		if (compaction.custom !== undefined && typeof compaction.custom !== "boolean")
			throw new Error(`Pi Sych config is invalid at ${path}.compaction.custom`);
		if (
			compaction.thresholdTokens !== undefined &&
			(!Number.isSafeInteger(compaction.thresholdTokens) ||
				(compaction.thresholdTokens as number) < 1)
		)
			throw new Error(`Pi Sych config is invalid at ${path}.compaction.thresholdTokens`);
	}
	if (
		item.literatureDatabase !== undefined &&
		(typeof item.literatureDatabase !== "string" || !item.literatureDatabase.trim())
	)
		throw new Error(`Pi Sych config literatureDatabase must be a non-empty path at ${path}`);
	return item;
}
export function loadPiSychConfig(options: ConfigDirectoryOptions = {}): PiSychConfig {
	const globalDirectory = options.configDirectory ?? resolve(globalConfigRoot(options), "pi-sych");
	const globalPath = resolve(globalDirectory, "config.json");
	const projectPath = options.projectRoot
		? resolve(options.projectRoot, ".pi/pi-sych/config.json")
		: undefined;
	const global = readConfig(globalPath),
		project = projectPath ? readConfig(projectPath) : undefined;
	const compaction = {
		...DEFAULT_CONFIG.compaction,
		...(global?.compaction as object | undefined),
		...(project?.compaction as object | undefined),
	} as PiSychConfig["compaction"];
	const completionReassessment = (project?.completionReassessment ??
		global?.completionReassessment) as boolean | undefined;
	const configured = project?.literatureDatabase ?? global?.literatureDatabase;
	const literatureBase =
		project?.literatureDatabase !== undefined && options.projectRoot
			? options.projectRoot
			: globalDirectory;
	return {
		version: 2,
		compaction,
		completionReassessment: completionReassessment ?? DEFAULT_CONFIG.completionReassessment,
		...(configured !== undefined
			? {
					literatureDatabase: isAbsolute(configured as string)
						? (configured as string)
						: resolve(literatureBase, configured as string),
				}
			: {}),
	};
}
export function piSychConfigPath(
	key: "modelCatalog",
	options: ConfigDirectoryOptions = {},
): string {
	return resolve(
		piSychConfigDirectory(options),
		key === "modelCatalog" ? "worker-models.json" : key,
	);
}
export async function ensurePiSychConfig(options: ConfigDirectoryOptions = {}): Promise<string> {
	const directory = piSychConfigDirectory(options),
		path = resolve(directory, "config.json");
	const { mkdir, writeFile } = await import("node:fs/promises");
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
