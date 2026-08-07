import { execFile as exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, parse, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(exec);
export const CANONICAL_FILES = [
	"project",
	"agents",
	"style",
	"evidence",
	"decisions",
	"todo",
	"inbox",
] as const;
export type CanonicalFile = (typeof CANONICAL_FILES)[number];
export const DEFAULT_CANONICAL_PATHS = {
	project: "PROJECT.md",
	agents: "AGENTS.md",
	style: "STYLE.md",
	evidence: "EVIDENCE.md",
	decisions: "DECISIONS.md",
	todo: "TODO.md",
	inbox: "INBOX.md",
} satisfies Record<CanonicalFile, string>;
export interface SyncManifest {
	version: 2;
	projectRoot?: string;
	canonical?: Partial<Record<CanonicalFile, string>>;
	confirmedAt: string;
	artifacts: unknown[];
	[key: string]: unknown;
}
export interface ResolvedProject {
	cwd: string;
	workspaceRoot: string;
	projectRoot: string;
	syncPath: string;
	manifest?: SyncManifest;
	canonical: Record<CanonicalFile, string>;
}
export interface ProjectValidation {
	valid: boolean;
	errors: string[];
	headings: string[];
}
export const showPath = (root: string, path: string) => {
	const display = relative(root, path);
	return display && !display.startsWith("..") ? display : path;
};
export function parseSyncManifest(value: string): SyncManifest {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch (error) {
		throw new Error(`SYNC.json JSON is invalid: ${String(error)}`);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
		throw new Error("SYNC.json JSON must be an object");
	const item = parsed as Record<string, unknown>;
	if (item.version !== 2) throw new Error("SYNC.json version must be 2");
	if (typeof item.confirmedAt !== "string")
		throw new Error("SYNC.json confirmedAt must be a string");
	if (!Array.isArray(item.artifacts)) throw new Error("SYNC.json artifacts must be an array");
	if (item.projectRoot !== undefined && typeof item.projectRoot !== "string")
		throw new Error("SYNC.json projectRoot must be a string");
	if (
		item.canonical !== undefined &&
		(!item.canonical || typeof item.canonical !== "object" || Array.isArray(item.canonical))
	)
		throw new Error("SYNC.json canonical must be an object");
	for (const [role, path] of Object.entries((item.canonical ?? {}) as Record<string, unknown>)) {
		if (!CANONICAL_FILES.includes(role as CanonicalFile))
			throw new Error(`SYNC.json canonical path is not allowed: ${role}`);
		if (typeof path !== "string" || !path)
			throw new Error(`SYNC.json canonical.${role} must be a non-empty string`);
	}
	return item as SyncManifest;
}
export const formatSyncManifest = (manifest: SyncManifest) =>
	`${JSON.stringify(manifest, null, 2)}\n`;
async function directory(path: string) {
	try {
		return (await stat(path)).isDirectory() ? resolve(path) : dirname(resolve(path));
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (code === "ENOENT" || code === "ENOTDIR") return dirname(resolve(path));
		throw error;
	}
}
async function workspace(cwd: string) {
	try {
		return resolve(
			(await execFile("git", ["rev-parse", "--show-toplevel"], { cwd })).stdout.trim(),
		);
	} catch {
		return cwd;
	}
}
const canonicalPaths = (root: string, manifest?: SyncManifest) =>
	Object.fromEntries(
		CANONICAL_FILES.map((role) => {
			const path = manifest?.canonical?.[role] ?? DEFAULT_CANONICAL_PATHS[role];
			return [role, isAbsolute(path) ? path : resolve(root, path)];
		}),
	) as Record<CanonicalFile, string>;
export async function resolveProject(startPath: string): Promise<ResolvedProject> {
	const cwd = await directory(startPath),
		workspaceRoot = await workspace(cwd);
	let current = cwd;
	while (true) {
		const syncPath = resolve(current, "SYNC.json");
		try {
			const manifest = parseSyncManifest(await readFile(syncPath, "utf8"));
			const projectRoot = resolve(current, manifest.projectRoot ?? ".");
			return {
				cwd,
				workspaceRoot,
				projectRoot,
				syncPath,
				manifest,
				canonical: canonicalPaths(projectRoot, manifest),
			};
		} catch (error) {
			const code = (error as NodeJS.ErrnoException).code;
			if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
		}
		if (current === workspaceRoot) break;
		const parent = dirname(current);
		if (parent === current || relative(workspaceRoot, parent).startsWith("..")) break;
		current = parent;
	}
	return {
		cwd,
		workspaceRoot,
		projectRoot: workspaceRoot,
		syncPath: resolve(workspaceRoot, "SYNC.json"),
		canonical: canonicalPaths(workspaceRoot),
	};
}
export function validateProjectMarkdown(markdown: string): ProjectValidation {
	const headings = [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => m[1]?.trim() ?? ""),
		errors: string[] = [];
	if (!/^#\s+\S/m.test(markdown)) errors.push("PROJECT.md must contain a level-one title");
	for (const name of [
		"Objective",
		"Current direction",
		"Definition of done",
		"Previous action",
		"Immediate next step",
	])
		if (!headings.some((h) => h.toLowerCase() === name.toLowerCase()))
			errors.push(`PROJECT.md is missing the '${name}' heading`);
	return { valid: !errors.length, errors, headings };
}
export const readAndValidateProject = async (path: string) =>
	validateProjectMarkdown(await readFile(path, "utf8"));
function inside(root: string, path: string, input: string) {
	const rel = relative(root, path);
	if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel))
		throw new Error(`Project artifact path leaves the project root: ${input}`);
}
export function resolveProjectPath(root: string, path: string) {
	if (!path || isAbsolute(path)) throw new Error(`Project artifact path must be relative: ${path}`);
	const absolute = resolve(root, path);
	inside(root, absolute, path);
	return absolute;
}
export async function resolveConfiguredPath(path: string) {
	const absolute = resolve(path);
	await access(absolute, constants.R_OK);
	return absolute;
}
export async function resolveExistingProjectPath(root: string, path: string) {
	const absolute = resolveProjectPath(root, path);
	await access(absolute, constants.R_OK);
	return absolute;
}
export async function writeAtomicFile(path: string, content: string) {
	const parent = dirname(path),
		temporary = resolve(parent, `.${parse(path).base}.${randomUUID()}.tmp`);
	await mkdir(parent, { recursive: true });
	try {
		{
			await using handle = await open(temporary, "wx", 0o600);
			await handle.writeFile(content);
			await handle.sync();
		}
		await rename(temporary, path);
	} catch (error) {
		await rm(temporary, { force: true }).catch(() => undefined);
		throw error;
	}
}
