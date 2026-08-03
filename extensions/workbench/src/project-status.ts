import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	formatSyncManifest,
	parseSyncManifest,
	type ResolvedProject,
	readAndValidateProject,
	resolveExistingProjectPath,
	resolveProject,
	resolveProjectPath,
	type SyncManifest,
	showPath,
	writeAtomicFile,
} from "./project-files.js";
import { nonEmptyString } from "./validation.js";
export const PROJECT_STATUSES = [
	"current",
	"stale",
	"needs-review",
	"conflicted",
	"missing",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type Dependency = string | { path: string; reason: string };
export interface ProjectArtifact {
	path: string;
	fingerprint: string;
	status: ProjectStatus;
	role?: string;
	authoritativeFor?: string[];
	updateFrom?: Dependency[];
	dependsOn?: Dependency[];
	acknowledgement?: { at: string; reason: string };
	[key: string]: unknown;
}
export interface ProjectStatusManifest extends Omit<SyncManifest, "artifacts"> {
	artifacts: ProjectArtifact[];
}
export interface CheckedArtifact extends ProjectArtifact {
	exists: boolean;
	currentFingerprint?: string;
	changed: boolean;
}
export interface ProjectStatusCheck {
	projectRoot: string;
	syncPath: string;
	manifest?: ProjectStatusManifest;
	syncError?: string;
	artifacts: CheckedArtifact[];
	changed: string[];
	missing: string[];
	impacted: Array<{ path: string; from: string[]; direct: boolean }>;
	cycles: string[][];
	missingCore: string[];
	projectErrors: string[];
}
const path = (value: unknown, label: string) => {
	const result = nonEmptyString(value, label);
	resolveProjectPath("/project", result);
	return result;
};
const fingerprint = (value: unknown, label: string) => {
	const result = nonEmptyString(value, label);
	if (!/^sha256:[a-f0-9]{64}$/i.test(result))
		throw new Error(`${label} must be a SHA-256 fingerprint`);
	return result;
};
function dependencies(value: unknown, label: string): Dependency[] | undefined {
	if (value === undefined) return undefined;
	if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
	return value.map((entry, i) =>
		typeof entry === "string"
			? path(entry, `${label}[${i}]`)
			: {
					path: path((entry as Record<string, unknown>)?.path, `${label}[${i}].path`),
					reason: nonEmptyString(
						(entry as Record<string, unknown>)?.reason,
						`${label}[${i}].reason`,
					),
				},
	);
}
function parseArtifact(value: unknown, index: number): ProjectArtifact {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`artifacts[${index}] must be an object`);
	const item = value as Record<string, unknown>,
		status = nonEmptyString(item.status, `artifacts[${index}].status`);
	if (!PROJECT_STATUSES.includes(status as ProjectStatus))
		throw new Error(`artifacts[${index}].status is not allowed: ${status}`);
	return {
		...item,
		path: path(item.path, `artifacts[${index}].path`),
		fingerprint: fingerprint(item.fingerprint, `artifacts[${index}].fingerprint`),
		status: status as ProjectStatus,
		...(item.updateFrom === undefined
			? {}
			: { updateFrom: dependencies(item.updateFrom, `artifacts[${index}].updateFrom`) }),
		...(item.dependsOn === undefined
			? {}
			: { dependsOn: dependencies(item.dependsOn, `artifacts[${index}].dependsOn`) }),
	};
}
export function parseProjectStatusManifest(value: string | SyncManifest): ProjectStatusManifest {
	const manifest = typeof value === "string" ? parseSyncManifest(value) : value,
		artifacts = manifest.artifacts.map(parseArtifact);
	if (new Set(artifacts.map((item) => item.path)).size !== artifacts.length)
		throw new Error("SYNC.json contains duplicate artifact path");
	return { ...manifest, artifacts };
}
export async function fingerprintFile(path: string) {
	return `sha256:${createHash("sha256")
		.update(await readFile(path))
		.digest("hex")}`;
}
const inputs = (artifact: ProjectArtifact) =>
	[...(artifact.updateFrom ?? []), ...(artifact.dependsOn ?? [])].map((item) =>
		typeof item === "string" ? item : item.path,
	);
function impacts(artifacts: ProjectArtifact[], changed: Iterable<string>) {
	const reverse = new Map<string, string[]>();
	for (const artifact of artifacts)
		for (const input of inputs(artifact))
			reverse.set(input, [...(reverse.get(input) ?? []), artifact.path]);
	const results = new Map<string, { path: string; from: string[]; direct: boolean }>(),
		queue = [...changed].map((path) => ({ path, origin: path, depth: 0 })),
		seen = new Set(queue.map(({ path, origin }) => `${path}\0${origin}`));
	while (queue.length) {
		const current = queue.shift();
		if (!current) break;
		for (const dependent of reverse.get(current.path) ?? []) {
			if (dependent !== current.origin) {
				const result = results.get(dependent) ?? { path: dependent, from: [], direct: false };
				if (!result.from.includes(current.origin)) result.from.push(current.origin);
				result.direct ||= current.depth === 0;
				results.set(dependent, result);
			}
			const key = `${dependent}\0${current.origin}`;
			if (!seen.has(key)) {
				seen.add(key);
				queue.push({ path: dependent, origin: current.origin, depth: current.depth + 1 });
			}
		}
	}
	return [...results.values()].sort((a, b) => a.path.localeCompare(b.path));
}
function cycles(artifacts: ProjectArtifact[]) {
	const known = new Set(artifacts.map((item) => item.path)),
		edges = new Map(
			artifacts.map((item) => [item.path, inputs(item).filter((path) => known.has(path))]),
		),
		active = new Set<string>(),
		seen = new Set<string>(),
		result: string[][] = [];
	const visit = (path: string, stack: string[]) => {
		if (active.has(path)) {
			result.push([...stack.slice(stack.indexOf(path)), path]);
			return;
		}
		if (seen.has(path)) return;
		seen.add(path);
		active.add(path);
		for (const input of edges.get(path) ?? []) visit(input, [...stack, path]);
		active.delete(path);
	};
	for (const item of artifacts) visit(item.path, []);
	return result;
}
export async function checkProjectStatus(
	startPath: string,
	project?: ResolvedProject,
): Promise<ProjectStatusCheck> {
	let resolved: ResolvedProject;
	try {
		resolved = project ?? (await resolveProject(startPath));
	} catch (error) {
		return {
			projectRoot: resolve(startPath),
			syncPath: resolve(startPath, "SYNC.json"),
			syncError: String(error),
			artifacts: [],
			changed: [],
			missing: [],
			impacted: [],
			cycles: [],
			missingCore: [],
			projectErrors: [],
		};
	}
	const missingCore = resolved.manifest ? [] : ["SYNC.json"];
	let projectErrors: string[] = [];
	try {
		projectErrors = (await readAndValidateProject(resolved.canonical.project)).errors;
	} catch {
		missingCore.unshift(showPath(resolved.projectRoot, resolved.canonical.project));
	}
	if (!resolved.manifest)
		return {
			projectRoot: resolved.projectRoot,
			syncPath: resolved.syncPath,
			syncError: "SYNC.json is unavailable",
			artifacts: [],
			changed: [],
			missing: [],
			impacted: [],
			cycles: [],
			missingCore,
			projectErrors,
		};
	try {
		const manifest = parseProjectStatusManifest(resolved.manifest),
			artifacts = await Promise.all(
				manifest.artifacts.map(async (artifact): Promise<CheckedArtifact> => {
					try {
						const currentFingerprint = await fingerprintFile(
							await resolveExistingProjectPath(resolved.projectRoot, artifact.path),
						);
						return {
							...artifact,
							exists: true,
							currentFingerprint,
							changed: currentFingerprint !== artifact.fingerprint,
						};
					} catch {
						return { ...artifact, exists: false, changed: true };
					}
				}),
			),
			changed = artifacts.filter((item) => item.changed && item.exists).map((item) => item.path),
			missing = artifacts.filter((item) => !item.exists).map((item) => item.path);
		return {
			projectRoot: resolved.projectRoot,
			syncPath: resolved.syncPath,
			manifest,
			artifacts,
			changed,
			missing,
			impacted: impacts(manifest.artifacts, [...changed, ...missing]),
			cycles: cycles(manifest.artifacts),
			missingCore,
			projectErrors,
		};
	} catch (error) {
		return {
			projectRoot: resolved.projectRoot,
			syncPath: resolved.syncPath,
			syncError: String(error),
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
	pending = 0,
	inboxPath = "INBOX.md",
) {
	const lines = ["Project status", "", `Root: ${state.projectRoot}`];
	if (state.syncError) lines.push("", `State unavailable: ${state.syncError}`);
	else {
		if (state.missingCore.length)
			lines.push("", "Missing project files:", ...state.missingCore.map((path) => `- ${path}`));
		if (state.projectErrors.length)
			lines.push("", "Project-file problems:", ...state.projectErrors.map((error) => `- ${error}`));
		if (state.changed.length)
			lines.push("", "Changed:", ...state.changed.map((path) => `- ${path}`));
		if (state.missing.length)
			lines.push("", "Missing:", ...state.missing.map((path) => `- ${path}`));
		for (const status of PROJECT_STATUSES.filter((status) => status !== "current")) {
			const files = state.artifacts
				.filter((artifact) => artifact.status === status)
				.map((artifact) => artifact.path);
			if (files.length)
				lines.push(
					"",
					`Persisted as ${status === "needs-review" ? "needing review" : status}:`,
					...files.map((path) => `- ${path}`),
				);
		}
		if (state.impacted.length)
			lines.push(
				"",
				"Declared dependents requiring review:",
				...state.impacted.map(
					(item) => `- ${item.path} ← ${item.from.join(", ")}${item.direct ? "" : " (transitive)"}`,
				),
			);
		if (
			!state.changed.length &&
			!state.missing.length &&
			!state.missingCore.length &&
			!state.projectErrors.length
		)
			lines.push("", "All tracked files match their recorded hashes.");
	}
	if (pending)
		lines.push(
			"",
			`Pending memory proposals: ${pending}`,
			`Review: /plannotator-annotate ${inboxPath}`,
		);
	lines.push("", "A changed hash establishes changed content, not conceptual drift or authority.");
	return lines.join("\n");
}
export async function verifyAcknowledgementObservation(
	state: ProjectStatusCheck,
	selected: Set<string>,
) {
	for (const file of selected) {
		const observed = state.artifacts.find((item) => item.path === file)?.currentFingerprint;
		const current = await fingerprintFile(
			await resolveExistingProjectPath(state.projectRoot, file),
		);
		if (current !== observed)
			throw new Error(`Acknowledgement aborted because ${file} changed during review`);
	}
}
export async function acknowledgeProjectStatus(
	startPath: string,
	files: string[],
	reason: string,
	now = new Date(),
) {
	if (!files.length || !reason.trim())
		throw new Error("Acknowledgement requires named files and a non-empty reason");
	const selected = new Set(files.map((file) => path(file, "files[]")));
	const state = await checkProjectStatus(startPath);
	if (!state.manifest) throw new Error(state.syncError ?? "SYNC.json is unavailable");
	for (const file of selected) {
		const artifact = state.artifacts.find((item) => item.path === file);
		if (!artifact) throw new Error(`Acknowledgement file is not tracked: ${file}`);
		if (!artifact.exists) throw new Error(`Acknowledgement file is missing: ${file}`);
	}
	await verifyAcknowledgementObservation(state, selected);
	const at = now.toISOString(),
		needsReview = impacts(state.manifest.artifacts, selected)
			.map((item) => item.path)
			.filter((file) => !selected.has(file)),
		artifacts = state.manifest.artifacts.map((artifact) =>
			selected.has(artifact.path)
				? {
						...artifact,
						fingerprint:
							state.artifacts.find((item) => item.path === artifact.path)?.currentFingerprint ??
							artifact.fingerprint,
						status: "current" as const,
						acknowledgement: { at, reason: reason.trim() },
					}
				: needsReview.includes(artifact.path)
					? { ...artifact, status: "needs-review" as const }
					: artifact,
		);
	await writeAtomicFile(
		state.syncPath,
		formatSyncManifest({ ...state.manifest, version: 2, confirmedAt: at, artifacts }),
	);
	return { acknowledged: artifacts.filter((item) => selected.has(item.path)), needsReview, at };
}
