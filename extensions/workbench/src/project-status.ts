import { hash } from "node:crypto";
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
export const PROJECT_STATUSES = "current stale needs-review conflicted missing".split(" ");
export type ProjectStatus = string;
export type Dependency = string | { path: string; reason: string };
export type ProjectArtifact = Record<string, unknown> & {
	path: string;
	fingerprint: string;
	status: ProjectStatus;
	updateFrom?: Dependency[];
	dependsOn?: Dependency[];
	acknowledgement?: { at: string; reason: string };
};
type ProjectStatusManifest = Omit<SyncManifest, "artifacts"> & { artifacts: ProjectArtifact[] };
export type Observation =
	| { state: "current" | "changed"; fingerprint: string }
	| { state: "missing" }
	| { state: "error"; message: string };
export type CheckedArtifact = ProjectArtifact & { observation: Observation };
export interface ProjectStatusCheck {
	projectRoot: string;
	syncPath: string;
	manifest?: ProjectStatusManifest;
	syncError?: string;
	artifacts: CheckedArtifact[];
	changed: string[];
	missing: string[];
	errors: Array<{ path: string; message: string }>;
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
function dependencies(value: unknown, label: string): Dependency[] {
	if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
	return value.map((entry, index) => {
		if (typeof entry === "string") return path(entry, `${label}[${index}]`);
		const item = entry as Record<string, unknown>;
		return {
			path: path(item?.path, `${label}[${index}].path`),
			reason: nonEmptyString(item?.reason, `${label}[${index}].reason`),
		};
	});
}
function parseArtifact(value: unknown, index: number): ProjectArtifact {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`artifacts[${index}] must be an object`);
	const item = value as Record<string, unknown>,
		prefix = `artifacts[${index}]`,
		status = nonEmptyString(item.status, `${prefix}.status`);
	if (!PROJECT_STATUSES.includes(status as ProjectStatus))
		throw new Error(`${prefix}.status is not allowed: ${status}`);
	const dependency = (key: "updateFrom" | "dependsOn") =>
		item[key] === undefined ? {} : { [key]: dependencies(item[key], `${prefix}.${key}`) };
	return {
		...item,
		path: path(item.path, `${prefix}.path`),
		fingerprint: fingerprint(item.fingerprint, `${prefix}.fingerprint`),
		status: status as ProjectStatus,
		...dependency("updateFrom"),
		...dependency("dependsOn"),
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
	return `sha256:${hash("sha256", await readFile(path), "hex")}`;
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
	for (let index = 0; index < queue.length; index++) {
		const current = queue[index];
		if (!current) continue;
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
		if (active.has(path)) return void result.push([...stack.slice(stack.indexOf(path)), path]);
		if (seen.has(path)) return;
		seen.add(path);
		active.add(path);
		for (const input of edges.get(path) ?? []) visit(input, [...stack, path]);
		active.delete(path);
	};
	for (const item of artifacts) visit(item.path, []);
	return result;
}
const observe = async (
	projectRoot: string,
	artifact: ProjectArtifact,
): Promise<CheckedArtifact> => {
	try {
		const current = await fingerprintFile(
			await resolveExistingProjectPath(projectRoot, artifact.path),
		);
		return {
			...artifact,
			observation: {
				state: current === artifact.fingerprint ? "current" : "changed",
				fingerprint: current,
			},
		};
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		return code === "ENOENT" || code === "ENOTDIR"
			? { ...artifact, observation: { state: "missing" } }
			: { ...artifact, observation: { state: "error", message: String(error) } };
	}
};
const emptyState = (projectRoot: string, syncPath: string) => ({
	projectRoot,
	syncPath,
	artifacts: [],
	changed: [],
	missing: [],
	errors: [],
	impacted: [],
	cycles: [],
	missingCore: [],
	projectErrors: [],
});
const unavailable = (
	startPath: string,
	error: unknown,
	project?: ResolvedProject,
): ProjectStatusCheck => ({
	...emptyState(
		project?.projectRoot ?? resolve(startPath),
		project?.syncPath ?? resolve(startPath, "SYNC.json"),
	),
	syncError: String(error),
});
export async function checkProjectStatus(
	startPath: string,
	project?: ResolvedProject,
): Promise<ProjectStatusCheck> {
	let resolved: ResolvedProject;
	try {
		resolved = project ?? (await resolveProject(startPath));
	} catch (error) {
		return unavailable(startPath, error);
	}
	if (resolved.syncError) return unavailable(startPath, resolved.syncError, resolved);
	const missingCore = resolved.manifest ? [] : ["SYNC.json"];
	let projectErrors: string[] = [];
	try {
		projectErrors = (await readAndValidateProject(resolved.canonical.project)).errors;
	} catch (error) {
		if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? ""))
			missingCore.unshift(showPath(resolved.projectRoot, resolved.canonical.project));
		else
			projectErrors.push(
				`Unable to observe ${showPath(resolved.projectRoot, resolved.canonical.project)}: ${String(error)}`,
			);
	}
	if (!resolved.manifest)
		return {
			...emptyState(resolved.projectRoot, resolved.syncPath),
			syncError: "SYNC.json is unavailable",
			missingCore,
			projectErrors,
		};
	try {
		const manifest = parseProjectStatusManifest(resolved.manifest),
			artifacts = await Promise.all(
				manifest.artifacts.map((artifact) => observe(resolved.projectRoot, artifact)),
			),
			changed = artifacts
				.filter((item) => item.observation.state === "changed")
				.map((item) => item.path),
			missing = artifacts
				.filter((item) => item.observation.state === "missing")
				.map((item) => item.path),
			errors = artifacts
				.filter((item) => item.observation.state === "error")
				.map((item) => ({
					path: item.path,
					message: (item.observation as { message: string }).message,
				}));
		return {
			projectRoot: resolved.projectRoot,
			syncPath: resolved.syncPath,
			manifest,
			artifacts,
			changed,
			missing,
			errors,
			impacted: impacts(manifest.artifacts, [...changed, ...missing]),
			cycles: cycles(manifest.artifacts),
			missingCore,
			projectErrors,
		};
	} catch (error) {
		return {
			...unavailable(resolved.projectRoot, error),
			syncPath: resolved.syncPath,
			missingCore,
			projectErrors,
		};
	}
}
export function formatProjectStatusCheck(
	state: ProjectStatusCheck,
	pending = 0,
	inboxPath = "INBOX.md",
): string {
	const lines = ["Project status", "", `Root: ${state.projectRoot}`],
		add = (title: string, values: string[]) => {
			if (values.length) lines.push("", title, ...values.map((value) => `- ${value}`));
		};
	if (state.syncError) lines.push("", `State unavailable: ${state.syncError}`);
	else {
		add("Missing project files:", state.missingCore);
		add("Project-file problems:", state.projectErrors);
		add("Changed:", state.changed);
		add("Missing:", state.missing);
		add(
			"Unable to observe:",
			state.errors.map((error) => `${error.path} (${error.message})`),
		);
		for (const status of PROJECT_STATUSES.filter((value) => value !== "current"))
			add(
				`Persisted as ${status === "needs-review" ? "needing review" : status}:`,
				state.artifacts
					.filter((artifact) => artifact.status === status)
					.map((artifact) => artifact.path),
			);
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
			!state.errors.length &&
			!state.missingCore.length &&
			!state.projectErrors.length
		)
			lines.push("", "All tracked files match their recorded hashes.");
	}
	if (pending) lines.push("", `Pending memory proposals: ${pending}`, `Review: ${inboxPath}`);
	lines.push("", "A changed hash establishes changed content, not conceptual drift or authority.");
	return lines.join("\n");
}
const checkedArtifact = (state: ProjectStatusCheck, file: string) => {
	const artifact = state.artifacts.find((item) => item.path === file);
	if (!artifact) throw new Error(`Acknowledgement file is not tracked: ${file}`);
	if (artifact.observation.state === "missing")
		throw new Error(`Acknowledgement file is missing: ${file}`);
	if (artifact.observation.state === "error")
		throw new Error(`Acknowledgement file cannot be observed: ${file}`);
	return artifact;
};
export async function verifyAcknowledgementObservation(
	state: ProjectStatusCheck,
	selected: Set<string>,
) {
	for (const file of selected) {
		const observed = checkedArtifact(state, file).observation;
		const current = await fingerprintFile(
			await resolveExistingProjectPath(state.projectRoot, file),
		);
		if (
			observed.state === "missing" ||
			observed.state === "error" ||
			current !== observed.fingerprint
		)
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
	for (const file of selected) checkedArtifact(state, file);
	await verifyAcknowledgementObservation(state, selected);
	const at = now.toISOString(),
		byPath = new Map(state.artifacts.map((artifact) => [artifact.path, artifact])),
		actuallyChanged = new Set(
			[...selected].filter((file) => byPath.get(file)?.observation.state === "changed"),
		),
		needsReview = impacts(state.manifest.artifacts, actuallyChanged)
			.map((item) => item.path)
			.filter((file) => !selected.has(file)),
		observedFingerprint = (file: string) => {
			const observation = byPath.get(file)?.observation;
			return observation?.state === "current" || observation?.state === "changed"
				? observation.fingerprint
				: undefined;
		},
		artifacts = state.manifest.artifacts.map((artifact) =>
			selected.has(artifact.path)
				? {
						...artifact,
						fingerprint: observedFingerprint(artifact.path) ?? artifact.fingerprint,
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
