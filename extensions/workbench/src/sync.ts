import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	discoverProjectFiles,
	type ProjectDiscovery,
	readAndValidateProject,
	resolveProjectPath,
} from "./project-files.js";

export const SYNC_STATUSES = [
	"current",
	"stale",
	"needs-review",
	"conflicted",
	"missing",
] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export interface SyncArtifact {
	path: string;
	role: string;
	status: SyncStatus;
	authoritativeFor: string[];
	fingerprint: string;
	updateFrom?: string[];
}

export interface SyncManifest {
	version: 1;
	confirmedAt: string;
	artifacts: SyncArtifact[];
}

export interface InspectedArtifact extends SyncArtifact {
	absolutePath: string;
	exists: boolean;
	currentFingerprint?: string;
	changed: boolean;
}

export interface ProjectSyncState {
	projectRoot: string;
	discovery: ProjectDiscovery;
	syncPath: string;
	manifest?: SyncManifest;
	syncError?: string;
	projectErrors: string[];
	artifacts: InspectedArtifact[];
}

function requireString(value: unknown, label: string): string {
	if (typeof value !== "string" || value.trim() === "")
		throw new Error(`${label} must be a non-empty string`);
	return value;
}

function requireStringArray(value: unknown, label: string): string[] {
	if (
		!Array.isArray(value) ||
		value.some((item) => typeof item !== "string" || item.trim() === "")
	) {
		throw new Error(`${label} must be an array of non-empty strings`);
	}
	return [...new Set(value)];
}

function parseArtifact(value: unknown, index: number): SyncArtifact {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`artifacts[${index}] must be an object`);
	const artifact = value as Record<string, unknown>;
	const status = requireString(artifact.status, `artifacts[${index}].status`);
	if (!SYNC_STATUSES.includes(status as SyncStatus))
		throw new Error(`artifacts[${index}].status is not allowed: ${status}`);
	const fingerprint = requireString(
		artifact.fingerprint,
		`artifacts[${index}].fingerprint`,
	);
	if (!/^sha256:[a-f0-9]{64}$/i.test(fingerprint))
		throw new Error(
			`artifacts[${index}].fingerprint must be a SHA-256 fingerprint`,
		);
	return {
		path: requireString(artifact.path, `artifacts[${index}].path`),
		role: requireString(artifact.role, `artifacts[${index}].role`),
		status: status as SyncStatus,
		authoritativeFor: requireStringArray(
			artifact.authoritativeFor,
			`artifacts[${index}].authoritativeFor`,
		),
		fingerprint,
		...(artifact.updateFrom === undefined
			? {}
			: {
					updateFrom: requireStringArray(
						artifact.updateFrom,
						`artifacts[${index}].updateFrom`,
					),
				}),
	};
}

export function parseSyncMarkdown(markdown: string): SyncManifest {
	const blocks = [...markdown.matchAll(/^```json\s*\n([\s\S]*?)\n```\s*$/gm)];
	if (blocks.length !== 1)
		throw new Error(
			`SYNC.md must contain exactly one fenced JSON object; found ${blocks.length}`,
		);
	let parsed: unknown;
	try {
		parsed = JSON.parse(blocks[0][1]);
	} catch (error) {
		throw new Error(
			`SYNC.md JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
		throw new Error("SYNC.md JSON must be an object");
	const manifest = parsed as Record<string, unknown>;
	if (manifest.version !== 1) throw new Error("SYNC.md version must be 1");
	const confirmedAt = requireString(manifest.confirmedAt, "confirmedAt");
	if (Number.isNaN(Date.parse(confirmedAt)))
		throw new Error("confirmedAt must be a valid date-time string");
	if (!Array.isArray(manifest.artifacts))
		throw new Error("artifacts must be an array");
	const artifacts = manifest.artifacts.map(parseArtifact);
	const duplicate = artifacts.find(
		(artifact, index) =>
			artifacts.findIndex((candidate) => candidate.path === artifact.path) !==
			index,
	);
	if (duplicate)
		throw new Error(
			`SYNC.md contains duplicate artifact path: ${duplicate.path}`,
		);
	return { version: 1, confirmedAt, artifacts };
}

export async function fingerprintFile(path: string): Promise<string> {
	const hash = createHash("sha256");
	hash.update(await readFile(path));
	return `sha256:${hash.digest("hex")}`;
}

export async function inspectProjectSync(
	startPath: string,
): Promise<ProjectSyncState> {
	const discovery = await discoverProjectFiles(startPath);
	const syncPath = resolve(discovery.root, "SYNC.md");
	const projectFile = discovery.files.find(
		(file) => file.name === "PROJECT.md",
	);
	const syncFile = discovery.files.find((file) => file.name === "SYNC.md");
	const projectErrors = projectFile?.exists
		? (await readAndValidateProject(projectFile.path)).errors
		: ["PROJECT.md is missing"];
	if (!syncFile?.exists) {
		return {
			projectRoot: discovery.root,
			discovery,
			syncPath,
			syncError: "SYNC.md is missing; initialization requires review",
			projectErrors,
			artifacts: [],
		};
	}

	let manifest: SyncManifest;
	try {
		manifest = parseSyncMarkdown(await readFile(syncPath, "utf8"));
	} catch (error) {
		return {
			projectRoot: discovery.root,
			discovery,
			syncPath,
			syncError: error instanceof Error ? error.message : String(error),
			projectErrors,
			artifacts: [],
		};
	}

	const artifacts = await Promise.all(
		manifest.artifacts.map(async (artifact): Promise<InspectedArtifact> => {
			const absolutePath = resolveProjectPath(discovery.root, artifact.path);
			try {
				const currentFingerprint = await fingerprintFile(absolutePath);
				return {
					...artifact,
					absolutePath,
					exists: true,
					currentFingerprint,
					changed: currentFingerprint !== artifact.fingerprint,
				};
			} catch (error) {
				const code = (error as NodeJS.ErrnoException).code;
				if (code === "ENOENT")
					return { ...artifact, absolutePath, exists: false, changed: true };
				throw error;
			}
		}),
	);

	return {
		projectRoot: discovery.root,
		discovery,
		syncPath,
		manifest,
		projectErrors,
		artifacts,
	};
}

function artifactLine(artifact: InspectedArtifact): string {
	const domains =
		artifact.authoritativeFor.length > 0
			? ` — ${artifact.authoritativeFor.join(", ")}`
			: "";
	return `- ${artifact.path}${domains}`;
}

export function formatSyncSummary(state: ProjectSyncState): string {
	const lines = ["Project sync status", "", `Root: ${state.projectRoot}`];
	const missingCanonical = state.discovery.files
		.filter((file) => file.required && !file.exists && file.name !== "SYNC.md")
		.map((file) => file.name);
	if (missingCanonical.length > 0)
		lines.push(
			"",
			"Canonical files missing:",
			...missingCanonical.map((name) => `- ${name}`),
		);
	if (state.projectErrors.length > 0) {
		lines.push(
			"",
			"Project file issues:",
			...state.projectErrors.map((error) => `- ${error}`),
		);
	}
	if (state.syncError) {
		lines.push("", `Synchronization unavailable: ${state.syncError}`);
		return lines.join("\n");
	}

	const current = state.artifacts.filter(
		(artifact) =>
			artifact.exists && !artifact.changed && artifact.status === "current",
	);
	const needsUpdate = state.artifacts.filter(
		(artifact) =>
			artifact.exists && !artifact.changed && artifact.status !== "current",
	);
	const changed = state.artifacts.filter(
		(artifact) => artifact.exists && artifact.changed,
	);
	const missing = state.artifacts.filter((artifact) => !artifact.exists);

	if (current.length > 0)
		lines.push("", "Current:", ...current.map(artifactLine));
	if (needsUpdate.length > 0)
		lines.push(
			"",
			"Needs review or update:",
			...needsUpdate.map(
				(artifact) => `${artifactLine(artifact)} [${artifact.status}]`,
			),
		);
	if (changed.length > 0)
		lines.push(
			"",
			"Changed since last confirmation:",
			...changed.map(artifactLine),
		);
	if (missing.length > 0)
		lines.push("", "Missing:", ...missing.map(artifactLine));
	const changedPaths = new Set(
		[...changed, ...missing].map((artifact) => artifact.path),
	);
	const dependents = state.artifacts.filter((artifact) =>
		artifact.updateFrom?.some((path) => changedPaths.has(path)),
	);
	if (dependents.length > 0) {
		lines.push(
			"",
			"Review because an input changed:",
			...dependents.map(
				(artifact) =>
					`- ${artifact.path} ← ${artifact.updateFrom?.filter((path) => changedPaths.has(path)).join(", ")}`,
			),
		);
	}
	if (needsUpdate.length > 0 || changed.length > 0 || missing.length > 0) {
		lines.push(
			"",
			"Next: review the listed files with /pi-sych-drift, choose the correct resolution, then refresh confirmation with /pi-sych-sync after approval.",
		);
	} else {
		lines.push(
			"",
			"All listed artifacts match the confirmed fingerprints; no synchronization review is required.",
		);
	}
	return lines.join("\n");
}
