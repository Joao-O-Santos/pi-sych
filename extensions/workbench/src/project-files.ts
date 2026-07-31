import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import { access, mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, parse, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

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
	$schema?: string;
	version: 2;
	projectRoot?: string;
	canonical?: Partial<Record<CanonicalFile, string>>;
	confirmedAt: string;
	artifacts: unknown[];
	lastModified?: string;
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

async function exists(path: string): Promise<boolean> {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export function parseSyncManifest(value: string): SyncManifest {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch (error) {
		throw new Error(
			`SYNC.json JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
		throw new Error("SYNC.json JSON must be an object");
	const manifest = parsed as Record<string, unknown>;
	for (const key of Object.keys(manifest))
		if (
			![
				"$schema",
				"version",
				"projectRoot",
				"canonical",
				"confirmedAt",
				"artifacts",
				"lastModified",
			].includes(key)
		)
			throw new Error(`SYNC.json has unknown field: ${key}`);

	if (manifest.$schema !== undefined && typeof manifest.$schema !== "string")
		throw new Error("SYNC.json $schema must be a string");
	if (manifest.version !== 2) throw new Error("SYNC.json version must be 2");
	if (typeof manifest.confirmedAt !== "string")
		throw new Error("SYNC.json confirmedAt must be a string");
	if (manifest.lastModified !== undefined && typeof manifest.lastModified !== "string")
		throw new Error("SYNC.json lastModified must be a string");
	if (!Array.isArray(manifest.artifacts)) throw new Error("SYNC.json artifacts must be an array");
	for (const [index, value] of manifest.artifacts.entries()) {
		if (!value || typeof value !== "object" || Array.isArray(value))
			throw new Error(`SYNC.json artifacts[${index}] must be an object`);
		const artifact = value as Record<string, unknown>;
		for (const key of Object.keys(artifact))
			if (
				![
					"path",
					"fingerprint",
					"status",
					"role",
					"authoritativeFor",
					"updateFrom",
					"dependsOn",
					"acknowledgement",
					"lastModified",
				].includes(key)
			)
				throw new Error(`SYNC.json artifacts[${index}] has unknown field: ${key}`);
		if (artifact.lastModified !== undefined && typeof artifact.lastModified !== "string")
			throw new Error(`SYNC.json artifacts[${index}].lastModified must be a string`);
	}
	if (manifest.projectRoot !== undefined && typeof manifest.projectRoot !== "string")
		throw new Error("SYNC.json projectRoot must be a string");
	if (
		manifest.canonical !== undefined &&
		(!manifest.canonical ||
			typeof manifest.canonical !== "object" ||
			Array.isArray(manifest.canonical))
	)
		throw new Error("SYNC.json canonical must be an object");
	if (manifest.canonical) {
		for (const [name, path] of Object.entries(manifest.canonical)) {
			if (!CANONICAL_FILES.includes(name as CanonicalFile))
				throw new Error(`SYNC.json canonical path is not allowed: ${name}`);
			if (typeof path !== "string" || !path)
				throw new Error(`SYNC.json canonical.${name} must be a non-empty string`);
		}
	}
	return {
		...(manifest.$schema === undefined ? {} : { $schema: manifest.$schema }),
		version: 2,
		...(manifest.projectRoot === undefined ? {} : { projectRoot: manifest.projectRoot }),
		...(manifest.canonical === undefined
			? {}
			: {
					canonical: manifest.canonical as Partial<Record<CanonicalFile, string>>,
				}),
		confirmedAt: manifest.confirmedAt,
		...(typeof manifest.lastModified === "string" ? { lastModified: manifest.lastModified } : {}),
		artifacts: manifest.artifacts,
	};
}

export function formatSyncManifest(manifest: SyncManifest): string {
	return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function directoryPath(path: string): Promise<string> {
	try {
		return (await stat(path)).isDirectory() ? resolve(path) : dirname(resolve(path));
	} catch {
		return dirname(resolve(path));
	}
}

async function workspaceRoot(cwd: string): Promise<string> {
	try {
		const { stdout } = await execFile("git", ["rev-parse", "--show-toplevel"], {
			cwd,
		});
		return resolve(stdout.trim());
	} catch {
		return cwd;
	}
}

export async function resolveProject(startPath: string): Promise<ResolvedProject> {
	const cwd = await directoryPath(startPath);
	const root = await workspaceRoot(cwd);
	let current = cwd;
	while (true) {
		const syncPath = resolve(current, "SYNC.json");
		if (await exists(syncPath)) {
			const manifest = parseSyncManifest(await readFile(syncPath, "utf8"));
			const projectRoot = resolve(current, manifest.projectRoot ?? ".");
			const canonical = Object.fromEntries(
				CANONICAL_FILES.map((name) => {
					const path = manifest.canonical?.[name] ?? DEFAULT_CANONICAL_PATHS[name];
					return [name, isAbsolute(path) ? path : resolve(projectRoot, path)];
				}),
			) as Record<CanonicalFile, string>;
			return {
				cwd,
				workspaceRoot: root,
				projectRoot,
				syncPath,
				manifest,
				canonical,
			};
		}
		if (current === root) break;
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
		if (relative(root, current).startsWith("..")) break;
	}
	return {
		cwd,
		workspaceRoot: root,
		projectRoot: root,
		syncPath: resolve(root, "SYNC.json"),
		canonical: Object.fromEntries(
			CANONICAL_FILES.map((name) => [name, resolve(root, DEFAULT_CANONICAL_PATHS[name])]),
		) as Record<CanonicalFile, string>,
	};
}

export function validateProjectMarkdown(markdown: string): ProjectValidation {
	const headings = [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
	const errors: string[] = [];
	if (!/^#\s+\S/m.test(markdown)) errors.push("PROJECT.md must contain a level-one title");
	for (const required of [
		"Objective",
		"Current direction",
		"Definition of done",
		"Previous action",
		"Immediate next step",
	]) {
		if (!headings.some((heading) => heading.toLowerCase() === required.toLowerCase())) {
			errors.push(`PROJECT.md is missing the '${required}' heading`);
		}
	}
	return { valid: errors.length === 0, errors, headings };
}

export async function readAndValidateProject(projectPath: string): Promise<ProjectValidation> {
	return validateProjectMarkdown(await readFile(projectPath, "utf8"));
}

function assertInside(root: string, path: string, projectPath: string): void {
	const rel = relative(root, path);
	if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel))
		throw new Error(`Project artifact path leaves the project root: ${projectPath}`);
}

export function resolveProjectPath(projectRoot: string, projectPath: string): string {
	if (!projectPath || isAbsolute(projectPath))
		throw new Error(`Project artifact path must be relative: ${projectPath}`);
	const absolute = resolve(projectRoot, projectPath);
	assertInside(projectRoot, absolute, projectPath);
	return absolute;
}

/** Resolve an existing path after lexical project-path validation. */
export async function resolveExistingProjectPath(
	projectRoot: string,
	projectPath: string,
): Promise<string> {
	const path = isAbsolute(projectPath)
		? resolve(projectPath)
		: resolveProjectPath(projectRoot, projectPath);
	await access(path, constants.R_OK);
	return path;
}

export async function writeAtomicFile(path: string, content: string): Promise<void> {
	const parent = dirname(path);
	await mkdir(parent, { recursive: true });
	const temporary = resolve(parent, `.${parse(path).base}.${randomUUID()}.tmp`);
	let handle: FileHandle | undefined;
	try {
		handle = await open(temporary, "wx", 0o600);
		await handle.writeFile(content, "utf8");
		await handle.sync();
		await handle.close();
		handle = undefined;
		await rename(temporary, path);
	} catch (error) {
		await handle?.close().catch(() => undefined);
		await rm(temporary, { force: true }).catch(() => undefined);
		throw error;
	}
}

export async function writeApprovedFile(
	path: string,
	content: string,
	approved: boolean,
): Promise<void> {
	if (!approved) throw new Error("Durable file write requires explicit approval");
	await writeAtomicFile(path, content);
}
