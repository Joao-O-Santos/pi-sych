import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	CORE_PROJECT_FILES,
	discoverProjectFiles,
	readAndValidateProject,
	resolveProjectPath,
	writeApprovedFile,
} from "./project-files.js";
import { nonEmptyString, stringArray } from "./validation.js";

// Keep the legacy version-1 labels readable; acknowledgement only writes current
// and needs-review, and never assigns semantic meaning to any label.
export const PROJECT_STATUSES = [
	"current",
	"stale",
	"needs-review",
	"conflicted",
	"missing",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Dependency = string | { path: string; reason: string };

export interface Acknowledgement {
	at: string;
	reason: string;
}

export interface ProjectArtifact {
	path: string;
	fingerprint: string;
	status: ProjectStatus;
	role?: string;
	authoritativeFor?: string[];
	updateFrom?: Dependency[];
	dependsOn?: Dependency[];
	acknowledgement?: Acknowledgement;
}

export interface ProjectStatusManifest {
	version: 1;
	confirmedAt: string;
	artifacts: ProjectArtifact[];
}

export interface CheckedArtifact extends ProjectArtifact {
	exists: boolean;
	currentFingerprint?: string;
	changed: boolean;
}

export interface ImpactedArtifact {
	path: string;
	from: string[];
	direct: boolean;
}

export interface ProjectStatusCheck {
	projectRoot: string;
	syncPath: string;
	manifest?: ProjectStatusManifest;
	syncError?: string;
	artifacts: CheckedArtifact[];
	changed: string[];
	missing: string[];
	impacted: ImpactedArtifact[];
	cycles: string[][];
	missingCore: (typeof CORE_PROJECT_FILES)[number][];
	projectErrors: string[];
}

function relativePath(value: unknown, label: string): string {
	const path = nonEmptyString(value, label);
	// Resolve against a harmless root so the same strict path rule applies before IO.
	resolveProjectPath("/project", path);
	return path;
}

function fingerprint(value: unknown, label: string): string {
	const result = nonEmptyString(value, label);
	if (!/^sha256:[a-f0-9]{64}$/i.test(result))
		throw new Error(`${label} must be a SHA-256 fingerprint`);
	return result;
}

function dependency(value: unknown, label: string): Dependency {
	if (typeof value === "string") return relativePath(value, label);
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`${label} must be a path or { path, reason }`);
	const item = value as Record<string, unknown>;
	return {
		path: relativePath(item.path, `${label}.path`),
		reason: nonEmptyString(item.reason, `${label}.reason`),
	};
}

function dependencies(value: unknown, label: string): Dependency[] | undefined {
	if (value === undefined) return undefined;
	if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
	return value.map((item, index) => dependency(item, `${label}[${index}]`));
}

function dependencyPaths(artifact: ProjectArtifact): string[] {
	return [...(artifact.updateFrom ?? []), ...(artifact.dependsOn ?? [])].map(
		(entry) => (typeof entry === "string" ? entry : entry.path),
	);
}

function parseArtifact(value: unknown, index: number): ProjectArtifact {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`artifacts[${index}] must be an object`);
	const item = value as Record<string, unknown>;
	const status = nonEmptyString(item.status, `artifacts[${index}].status`);
	if (!PROJECT_STATUSES.includes(status as ProjectStatus))
		throw new Error(`artifacts[${index}].status is not allowed: ${status}`);
	const acknowledgement = item.acknowledgement;
	if (
		acknowledgement !== undefined &&
		(!acknowledgement ||
			typeof acknowledgement !== "object" ||
			Array.isArray(acknowledgement))
	)
		throw new Error(`artifacts[${index}].acknowledgement must be an object`);
	const parsedAcknowledgement = acknowledgement as
		| Record<string, unknown>
		| undefined;
	return {
		path: relativePath(item.path, `artifacts[${index}].path`),
		fingerprint: fingerprint(
			item.fingerprint,
			`artifacts[${index}].fingerprint`,
		),
		status: status as ProjectStatus,
		...(item.role === undefined
			? {}
			: { role: nonEmptyString(item.role, `artifacts[${index}].role`) }),
		...(item.authoritativeFor === undefined
			? {}
			: {
					authoritativeFor: stringArray(
						item.authoritativeFor,
						`artifacts[${index}].authoritativeFor`,
					),
				}),
		...(item.updateFrom === undefined
			? {}
			: {
					updateFrom: dependencies(
						item.updateFrom,
						`artifacts[${index}].updateFrom`,
					),
				}),
		...(item.dependsOn === undefined
			? {}
			: {
					dependsOn: dependencies(
						item.dependsOn,
						`artifacts[${index}].dependsOn`,
					),
				}),
		...(parsedAcknowledgement === undefined
			? {}
			: {
					acknowledgement: {
						at: nonEmptyString(
							parsedAcknowledgement.at,
							`artifacts[${index}].acknowledgement.at`,
						),
						reason: nonEmptyString(
							parsedAcknowledgement.reason,
							`artifacts[${index}].acknowledgement.reason`,
						),
					},
				}),
	};
}

export function parseProjectStatusMarkdown(
	markdown: string,
): ProjectStatusManifest {
	const blocks = [
		...markdown.matchAll(/^```[ \t]*json[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm),
	];
	if (blocks.length !== 1)
		throw new Error(
			`SYNC.md must contain exactly one fenced JSON object; found ${blocks.length}`,
		);
	let value: unknown;
	try {
		value = JSON.parse(blocks[0][1]);
	} catch (error) {
		throw new Error(
			`SYNC.md JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("SYNC.md JSON must be an object");
	const manifest = value as Record<string, unknown>;
	if (manifest.version !== 1) throw new Error("SYNC.md version must be 1");
	const confirmedAt = nonEmptyString(manifest.confirmedAt, "confirmedAt");
	if (Number.isNaN(Date.parse(confirmedAt)))
		throw new Error("confirmedAt must be a valid date-time string");
	if (!Array.isArray(manifest.artifacts))
		throw new Error("artifacts must be an array");
	const artifacts = manifest.artifacts.map(parseArtifact);
	const paths = new Set<string>();
	for (const artifact of artifacts) {
		if (paths.has(artifact.path))
			throw new Error(
				`SYNC.md contains duplicate artifact path: ${artifact.path}`,
			);
		paths.add(artifact.path);
	}
	return { version: 1, confirmedAt, artifacts };
}

export async function fingerprintFile(path: string): Promise<string> {
	const hash = createHash("sha256");
	hash.update(await readFile(path));
	return `sha256:${hash.digest("hex")}`;
}

function reverseDependencies(
	artifacts: ProjectArtifact[],
): Map<string, string[]> {
	const reverse = new Map<string, string[]>();
	for (const artifact of artifacts) {
		for (const input of dependencyPaths(artifact)) {
			const dependents = reverse.get(input) ?? [];
			dependents.push(artifact.path);
			reverse.set(input, dependents);
		}
	}
	return reverse;
}

function impacts(
	artifacts: ProjectArtifact[],
	inputs: Iterable<string>,
): ImpactedArtifact[] {
	const reverse = reverseDependencies(artifacts);
	const result = new Map<string, ImpactedArtifact>();
	const queue = [...inputs].map((path) => ({ path, origin: path, depth: 0 }));
	const visited = new Set(
		queue.map(({ path, origin }) => `${path}\0${origin}`),
	);
	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) break;
		for (const dependent of reverse.get(current.path) ?? []) {
			if (dependent !== current.origin) {
				const entry = result.get(dependent) ?? {
					path: dependent,
					from: [],
					direct: current.depth === 0,
				};
				if (!entry.from.includes(current.origin))
					entry.from.push(current.origin);
				entry.direct ||= current.depth === 0;
				result.set(dependent, entry);
			}
			const key = `${dependent}\0${current.origin}`;
			if (!visited.has(key)) {
				visited.add(key);
				queue.push({
					path: dependent,
					origin: current.origin,
					depth: current.depth + 1,
				});
			}
		}
	}
	return [...result.values()].sort((left, right) =>
		left.path.localeCompare(right.path),
	);
}

function findCycles(artifacts: ProjectArtifact[]): string[][] {
	const paths = new Set(artifacts.map((artifact) => artifact.path));
	const edges = new Map(
		artifacts.map((artifact) => [
			artifact.path,
			dependencyPaths(artifact).filter((path) => paths.has(path)),
		]),
	);
	const active = new Set<string>();
	const visited = new Set<string>();
	const cycles: string[][] = [];
	const visit = (path: string, stack: string[]): void => {
		if (active.has(path)) {
			const start = stack.indexOf(path);
			cycles.push([...stack.slice(start), path]);
			return;
		}
		if (visited.has(path)) return;
		visited.add(path);
		active.add(path);
		for (const input of edges.get(path) ?? []) visit(input, [...stack, path]);
		active.delete(path);
	};
	for (const artifact of artifacts) visit(artifact.path, []);
	return cycles;
}

export async function checkProjectStatus(
	startPath: string,
): Promise<ProjectStatusCheck> {
	const discovery = await discoverProjectFiles(startPath);
	const syncPath = resolve(discovery.root, "SYNC.md");
	const missingCore = CORE_PROJECT_FILES.filter(
		(name) => !discovery.files.find((file) => file.name === name)?.exists,
	);
	const projectFile = discovery.files.find(
		(file) => file.name === "PROJECT.md",
	);
	let projectErrors: string[] = [];
	if (projectFile?.exists) {
		try {
			projectErrors = (await readAndValidateProject(projectFile.path)).errors;
		} catch (error) {
			projectErrors = [
				`PROJECT.md could not be validated: ${error instanceof Error ? error.message : String(error)}`,
			];
		}
	}
	try {
		const manifest = parseProjectStatusMarkdown(
			await readFile(syncPath, "utf8"),
		);
		const artifacts = await Promise.all(
			manifest.artifacts.map(async (artifact): Promise<CheckedArtifact> => {
				const absolutePath = resolveProjectPath(discovery.root, artifact.path);
				try {
					const currentFingerprint = await fingerprintFile(absolutePath);
					return {
						...artifact,
						exists: true,
						currentFingerprint,
						changed: currentFingerprint !== artifact.fingerprint,
					};
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code === "ENOENT")
						return { ...artifact, exists: false, changed: true };
					throw error;
				}
			}),
		);
		const changed = artifacts
			.filter((artifact) => artifact.changed && artifact.exists)
			.map((artifact) => artifact.path);
		const missing = artifacts
			.filter((artifact) => !artifact.exists)
			.map((artifact) => artifact.path);
		return {
			projectRoot: discovery.root,
			syncPath,
			manifest,
			artifacts,
			changed,
			missing,
			impacted: impacts(manifest.artifacts, [...changed, ...missing]),
			cycles: findCycles(manifest.artifacts),
			missingCore,
			projectErrors,
		};
	} catch (error) {
		return {
			projectRoot: discovery.root,
			syncPath,
			syncError: error instanceof Error ? error.message : String(error),
			artifacts: [],
			changed: [],
			missing: [],
			impacted: [],
			cycles: [],
			missingCore,
			projectErrors,
		};
	}
}

export function formatProjectStatusCheck(
	state: ProjectStatusCheck,
	pendingPromotions = 0,
): string {
	const lines = ["Project status", "", `Root: ${state.projectRoot}`];
	if (state.missingCore.length)
		lines.push(
			"",
			"Missing core files:",
			...state.missingCore.map((path) => `- ${path}`),
		);
	if (state.projectErrors.length)
		lines.push(
			"",
			"PROJECT.md validation errors:",
			...state.projectErrors.map((error) => `- ${error}`),
		);
	if (state.syncError) {
		if (pendingPromotions)
			lines.push(
				"",
				`Pending memory proposals: ${pendingPromotions}`,
				"Review: /plannotator-annotate INBOX.md",
			);
		return [...lines, "", `State unavailable: ${state.syncError}`].join("\n");
	}
	if (state.changed.length)
		lines.push("", "Changed:", ...state.changed.map((path) => `- ${path}`));
	if (state.missing.length)
		lines.push("", "Missing:", ...state.missing.map((path) => `- ${path}`));
	for (const status of PROJECT_STATUSES.filter(
		(status) => status !== "current",
	)) {
		const persisted = state.artifacts
			.filter((artifact) => artifact.status === status)
			.map((artifact) => artifact.path);
		if (persisted.length)
			lines.push(
				"",
				`Persisted as ${status === "needs-review" ? "needing review" : status}:`,
				...persisted.map((path) => `- ${path}`),
			);
	}
	if (state.impacted.length)
		lines.push(
			"",
			"Declared dependents requiring review:",
			...state.impacted.map(
				(impact) =>
					`- ${impact.path} ← ${impact.from.join(", ")}${impact.direct ? "" : " (transitive)"}`,
			),
		);
	if (state.cycles.length)
		lines.push(
			"",
			"Dependency cycles:",
			...state.cycles.map((cycle) => `- ${cycle.join(" → ")}`),
		);
	if (!state.changed.length && !state.missing.length)
		lines.push("", "All tracked files match their recorded hashes.");
	if (pendingPromotions)
		lines.push(
			"",
			`Pending memory proposals: ${pendingPromotions}`,
			"Review: /plannotator-annotate INBOX.md",
		);
	lines.push(
		"",
		"A changed hash establishes changed content, not conceptual drift or authority.",
	);
	return lines.join("\n");
}

export function formatProjectStatusMarkdown(
	manifest: ProjectStatusManifest,
): string {
	return `# Project synchronization\n\n\`\`\`json\n${JSON.stringify(manifest, null, 2)}\n\`\`\`\n`;
}

export async function acknowledgeProjectStatus(
	startPath: string,
	files: string[],
	reason: string,
	now = new Date(),
): Promise<{
	acknowledged: CheckedArtifact[];
	needsReview: string[];
	at: string;
}> {
	if (!Array.isArray(files) || files.length === 0)
		throw new Error("Acknowledgement requires at least one named tracked file");
	if (!reason.trim())
		throw new Error("Acknowledgement requires a non-empty reason");
	const state = await checkProjectStatus(startPath);
	if (!state.manifest)
		throw new Error(state.syncError ?? "SYNC.md is unavailable");
	const selected = new Set(files.map((file) => relativePath(file, "files[]")));
	if (selected.size !== files.length)
		throw new Error("Acknowledgement files must not contain duplicates");
	const byPath = new Map(
		state.artifacts.map((artifact) => [artifact.path, artifact]),
	);
	for (const path of selected) {
		const artifact = byPath.get(path);
		if (!artifact)
			throw new Error(`Acknowledgement file is not tracked: ${path}`);
		if (!artifact.exists)
			throw new Error(`Acknowledgement file is missing: ${path}`);
	}
	const at = now.toISOString();
	const selectedImpacts = impacts(state.manifest.artifacts, selected);
	const needsReview = selectedImpacts
		.map((impact) => impact.path)
		.filter((path) => !selected.has(path));
	const artifacts = state.manifest.artifacts.map((artifact) => {
		const checked = byPath.get(artifact.path);
		if (selected.has(artifact.path))
			return {
				...artifact,
				fingerprint: checked?.currentFingerprint ?? artifact.fingerprint,
				status: "current" as const,
				acknowledgement: { at, reason: reason.trim() },
			};
		if (needsReview.includes(artifact.path))
			return { ...artifact, status: "needs-review" as const };
		return artifact;
	});
	const manifest = { ...state.manifest, confirmedAt: at, artifacts };
	await writeApprovedFile(
		state.syncPath,
		formatProjectStatusMarkdown(manifest),
		true,
	);
	return {
		acknowledged: artifacts
			.filter((artifact) => selected.has(artifact.path))
			.map((artifact) => ({
				...artifact,
				exists: true,
				currentFingerprint: artifact.fingerprint,
				changed: false,
			})),
		needsReview,
		at,
	};
}
