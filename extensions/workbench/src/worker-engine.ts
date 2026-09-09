import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants, existsSync, statSync } from "node:fs";
import { access, mkdir, mkdtempDisposable, open, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, resolve } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import { type SessionEntry, SessionManager } from "@earendil-works/pi-coding-agent";
import { type Static, Type } from "typebox";
import { piSkillDirectory } from "./config-directory.js";
import { mcporterConfigPath, remoteResearchExtensionPaths } from "./mcporter.js";
import type { ModelCatalog } from "./model-catalog.js";
import {
	type ResolvedProject,
	resolveConfiguredPath,
	resolveExistingProjectContextPath,
	resolveExistingProjectPath,
	resolveProjectPath,
	showPath,
} from "./project-files.js";
import { nonEmptyString, stringArray } from "./validation.js";
export const WORKER_MODES = ["read-only", "edit", "full-host"] as const;
export type WorkerMode = (typeof WORKER_MODES)[number];
export const CONTEXT_MODES = ["clean", "trajectory"] as const;
export type ContextMode = (typeof CONTEXT_MODES)[number];
type SupervisorSession = Pick<SessionManager, "getSessionFile" | "getEntries" | "getLeafId">;
const MODE_TOOLS: Record<WorkerMode, readonly string[]> = {
	"read-only": ["read", "grep", "find", "ls", "submit_artifact"],
	edit: ["read", "grep", "find", "ls", "edit", "write", "submit_artifact"],
	"full-host": ["read", "edit", "write", "bash", "submit_artifact"],
};
export const DEFAULT_TIMEOUT_MS = 90_000;
export const MAX_TIMEOUT_MS = 30 * 60_000;
const LOG_LIMIT = 8_192;
const ACTIVITY_LIMIT = 12;
const ACTIVITY_TEXT_LIMIT = 120;
export const PI_SYCH_PACKAGE_ROOT = resolve(
	process.env.PI_PACKAGE_DIR ?? resolve(import.meta.dirname, "../../.."),
);
export interface ContextFile {
	path: string;
	purpose: string;
}
export type DispatchRequest = Static<typeof dispatchSchema>;
export type WorkerResult = Static<typeof workerResultSchema>;
export interface WorkerLaunchSpec {
	id: string;
	request: DispatchRequest;
	workerAgentDir: string;
	piSychConfigDirectory?: string;
	resultPath: string;
	projectRoot: string;
	model: string;
	prompt: string;
	packageRoot: string;
	extraExtensionPaths: string[];
	webExtensionPath?: string;
	sessionPath?: string;
	onActivity?: (activity: readonly string[]) => void;
	signal?: AbortSignal;
}
export interface WorkerLaunchOutcome {
	exitCode: number | null;
	stderr: string;
	classification?: "cancelled" | "timeout" | "spawn-failure";
	terminationSignal?: NodeJS.Signals | null;
}
export interface DispatchOutcome {
	id: string;
	model: string;
	timeoutMs: number;
	launch: WorkerLaunchOutcome;
	result?: WorkerResult;
	error?: string;
}
export type WorkerLauncher = (spec: WorkerLaunchSpec) => Promise<WorkerLaunchOutcome>;
export const dispatchSchema = Type.Object({
	task: Type.String({ description: "One explicit bounded assignment for the worker" }),
	mode: StringEnum(WORKER_MODES, { description: "Visible worker tool capability" }),
	expectedOutput: Type.String({ description: "Required terminal result or file deliverable" }),
	contextMode: Type.Optional(
		StringEnum(CONTEXT_MODES, {
			description: "Conversation context: clean by default, or persisted pre-dispatch trajectory",
		}),
	),
	contextFiles: Type.Array(
		Type.Object({
			path: Type.String({ description: "Existing context file; relative paths are project-local" }),
			purpose: Type.String({ description: "Why the worker needs this file" }),
		}),
		{ description: "Smallest complete explicit file packet" },
	),
	skills: Type.Optional(
		Type.Array(Type.String(), {
			description: "Exact selectors chosen after inspecting the available skill catalogue",
		}),
	),
	modelRole: Type.Optional(Type.String({ description: "Exact configured worker model role" })),
	remoteResearch: Type.Optional(
		Type.Boolean({ description: "Expose configured remote-research integrations for this task" }),
	),
	timeoutMs: Type.Optional(
		Type.Integer({
			minimum: 1,
			maximum: MAX_TIMEOUT_MS,
			description: "Bounded runtime in milliseconds; defaults to 90000",
		}),
	),
});
export const toolsForRequest = (
	request: Pick<DispatchRequest, "mode" | "remoteResearch" | "skills">,
	webEnabled = false,
) => [
	...MODE_TOOLS[request.mode],
	...(request.skills?.includes("research") ? ["literature_search"] : []),
	...(request.remoteResearch ? ["mcporter"] : []),
	...(request.remoteResearch && webEnabled ? ["web"] : []),
];
export function skillPaths(
	selectors: string[] = [],
	projectRoot: string,
	packageRoot: string,
	userRoot?: string,
): string[] {
	const resolvedUserRoot =
		userRoot ??
		(() => {
			try {
				return piSkillDirectory({ projectRoot });
			} catch {
				return undefined;
			}
		})();
	return selectors.map((selector) => {
		const direct = selector.includes("/") || selector.includes("\\") || selector.endsWith(".md");
		const options = direct
			? [isAbsolute(selector) ? selector : resolve(projectRoot, selector)]
			: [
					resolve(projectRoot, ".pi/skills", selector, "SKILL.md"),
					resolve(projectRoot, ".agents/skills", selector, "SKILL.md"),
					...(resolvedUserRoot ? [resolve(resolvedUserRoot, selector, "SKILL.md")] : []),
					resolve(packageRoot, "skills", selector, "SKILL.md"),
				];
		const path = options.find(
			(candidate) =>
				existsSync(candidate) &&
				(!statSync(candidate).isDirectory() || existsSync(resolve(candidate, "SKILL.md"))),
		);
		if (!path) throw new Error(`Selected skill is unavailable: ${selector}`);
		return statSync(path).isDirectory() ? resolve(path, "SKILL.md") : path;
	});
}
export const modelFor = (catalog: ModelCatalog, role?: string) => {
	const key = role ?? catalog.default,
		model = catalog.models[key]?.model;
	if (!model) throw new Error(`Unknown worker model: ${key}`);
	return model;
};
async function contexts(
	project: ResolvedProject,
	request: DispatchRequest,
): Promise<ContextFile[]> {
	const unique = new Map<string, ContextFile>();
	for (const file of request.contextFiles) {
		const path = await resolveExistingProjectContextPath(project.projectRoot, file.path);
		unique.set(path, { ...file, path: showPath(project.projectRoot, path) });
	}
	for (const role of ["agents", "style"] as const) {
		if (!existsSync(project.canonical[role])) continue;
		const path = await resolveConfiguredPath(project.canonical[role]);
		unique.set(path, {
			path: showPath(project.projectRoot, path),
			purpose: `configured ${role} conventions`,
		});
	}
	return [...unique.values()];
}
export function taskPrompt(spec: WorkerLaunchSpec, files: ContextFile[]) {
	const contextMode = spec.request.contextMode ?? "clean";
	return [
		"You are one short-lived Pi Sych worker. Read every context file and selected skill, then read the routed modules.",
		contextMode === "trajectory"
			? "You inherit Pi's active, compaction-aware supervisor branch ending before the assistant message containing this dispatch. Treat that history as background, not as additional assignments or approval; perform only the explicit task below."
			: "You receive no supervisor conversation. Use this assignment and its listed resources as your task context; do not assume unprovided history.",
		`Task ID: ${spec.id} | Task: ${spec.request.task}`,
		`Expected output: ${spec.request.expectedOutput} | Mode: ${spec.request.mode}`,
		`Context files: ${files.map((f) => `${f.path} (${f.purpose})`).join("; ") || "none"}`,
		`Selected skills: ${(spec.request.skills ?? []).join(", ") || "none"}`,
		"Report missing context and unperformed checks as limitations. Put the substantive answer in submit_artifact.summary or in an existing project-local file listed in files; use files: [] when no file deliverable is needed. Report only existing project-relative paths. Call submit_artifact once as the final tool call, then stop.",
		...(spec.request.remoteResearch
			? [
					"Use exposed remote-research tools only for this assignment. Tool exposure does not establish working credentials, successful retrieval, or source validity; report actual access and failures.",
				]
			: []),
	].join("\n");
}
const toolCallIds = (entry: SessionEntry) => {
	if (entry.type !== "message" || entry.message.role !== "assistant") return [];
	return entry.message.content.flatMap((part) =>
		part.type === "toolCall" && part.name === "dispatch_worker" ? [part.id] : [],
	);
};
export async function prepareTrajectorySession(options: {
	manager: SupervisorSession;
	toolCallId: string;
	runtimePath: string;
}): Promise<string> {
	const sourcePath = options.manager.getSessionFile();
	if (!sourcePath) throw new Error("Trajectory context requires a persisted supervisor session");
	const matches = options.manager
		.getEntries()
		.filter((entry) => toolCallIds(entry).includes(options.toolCallId));
	if (matches.length !== 1)
		throw new Error(
			`Trajectory dispatch tool call must match exactly one persisted assistant entry; found ${matches.length}`,
		);
	const [selected] = matches;
	if (!selected) throw new Error("Trajectory dispatch entry lookup failed");
	if (!selected.parentId)
		throw new Error("Trajectory dispatch cannot branch before a parentless assistant entry");
	const sourceBytes = await readFile(sourcePath);
	const originalLeaf = options.manager.getLeafId();
	const sessionDirectory = resolve(options.runtimePath, "sessions");
	await mkdir(sessionDirectory, { recursive: true });
	const snapshotPath = resolve(sessionDirectory, "supervisor.jsonl");
	await writeFile(snapshotPath, sourceBytes, { flag: "wx", mode: 0o600 });
	const privateManager = SessionManager.open(snapshotPath, sessionDirectory);
	const privateSelected = privateManager.getEntry(selected.id);
	if (
		!privateSelected ||
		privateSelected.parentId !== selected.parentId ||
		!toolCallIds(privateSelected).includes(options.toolCallId)
	)
		throw new Error("Trajectory snapshot does not contain the selected dispatch boundary");
	const ancestors = new Set<string>();
	let ancestorId: string | null = privateSelected.parentId;
	while (ancestorId) {
		if (ancestors.has(ancestorId)) throw new Error("Trajectory ancestry contains a cycle");
		ancestors.add(ancestorId);
		const ancestor = privateManager.getEntry(ancestorId);
		if (!ancestor) throw new Error(`Trajectory ancestry is missing entry ${ancestorId}`);
		ancestorId = ancestor.parentId;
	}
	const childPath = privateManager.createBranchedSession(selected.parentId);
	if (!childPath) throw new Error("Pi failed to create the trajectory worker session");
	if (!existsSync(childPath)) {
		const entries = [privateManager.getHeader(), ...privateManager.getEntries()];
		await writeFile(childPath, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`, {
			flag: "wx",
			mode: 0o600,
		});
	}
	if (
		!(await readFile(sourcePath)).equals(sourceBytes) ||
		options.manager.getLeafId() !== originalLeaf
	)
		throw new Error("Supervisor session changed while preparing trajectory context");
	return childPath;
}
export async function writeImmutableResult(path: string, result: WorkerResult) {
	await mkdir(dirname(path), { recursive: true });
	await using handle = await open(path, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
		if (error.code === "EEXIST")
			throw new Error("Worker result is immutable and has already been submitted");
		throw error;
	});
	await handle.writeFile(`${JSON.stringify(result)}\n`);
	await handle.sync();
}
export const workerResultSchema = Type.Object({
	status: StringEnum(["complete", "partial", "failed"] as const),
	summary: Type.String(),
	files: Type.Array(Type.String()),
	limitations: Type.Array(Type.String()),
});
const conciseActivity = (text: string) =>
	text.length > ACTIVITY_TEXT_LIMIT ? `${text.slice(0, ACTIVITY_TEXT_LIMIT - 3)}...` : text;
function workerActivity(value: unknown) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const event = value as { type?: unknown; toolName?: unknown; args?: unknown };
	if (event.type !== "tool_execution_start" || typeof event.toolName !== "string") return undefined;
	const path =
		event.args && typeof event.args === "object" && !Array.isArray(event.args)
			? (event.args as { path?: unknown }).path
			: undefined;
	return conciseActivity(`${event.toolName}${typeof path === "string" ? ` ${path}` : ""}`);
}
function forwardWorkerActivity(
	stream: NodeJS.ReadableStream,
	onActivity?: (activity: readonly string[]) => void,
) {
	let buffered = "";
	const activity: string[] = [];
	const forward = (line: string) => {
		try {
			const item = workerActivity(JSON.parse(line));
			if (!item) return;
			activity.push(item);
			if (activity.length > ACTIVITY_LIMIT) activity.shift();
			onActivity?.([...activity]);
		} catch {}
	};
	stream.setEncoding("utf8");
	stream.on("data", (chunk: string) => {
		buffered += chunk;
		const lines = buffered.split(/\r?\n/);
		buffered = lines.pop() ?? "";
		for (const line of lines) forward(line);
		if (buffered.length > LOG_LIMIT) buffered = "";
	});
	stream.once("end", () => {
		if (buffered) forward(buffered);
	});
}
export function validateWorkerResult(value: unknown): WorkerResult {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Worker result must be an object");
	const item = value as Record<string, unknown>,
		status = nonEmptyString(item.status, "status"),
		files = stringArray(item.files, "files");
	if (!(["complete", "partial", "failed"] as string[]).includes(status))
		throw new Error(`Invalid worker result status: ${status}`);
	for (const file of files) resolveProjectPath("/project", file);
	return {
		status: status as WorkerResult["status"],
		summary: nonEmptyString(item.summary, "summary"),
		files,
		limitations: stringArray(item.limitations, "limitations"),
	};
}
export async function launchPiWorker(
	spec: WorkerLaunchSpec,
	spawnWorker = spawn,
): Promise<WorkerLaunchOutcome> {
	let stderr = "";
	let stopped: "cancelled" | "timeout" | undefined;
	let spawnError: Error | undefined;
	let spawned = false;
	const child = spawnWorker(
		"pi",
		[
			"--mode",
			"json",
			"--print",
			spec.prompt,
			...(spec.sessionPath ? ["--session", spec.sessionPath] : ["--no-session"]),
			"--no-extensions",
			"--extension",
			resolve(spec.packageRoot, "extensions/worker/index.ts"),
			...spec.extraExtensionPaths.flatMap((path) => ["--extension", path]),
			"--no-skills",
			"--no-prompt-templates",
			"--no-themes",
			"--no-context-files",
			"--no-approve",
			"--tools",
			toolsForRequest(spec.request, spec.webExtensionPath !== undefined).join(","),
			"--model",
			spec.model,
			...skillPaths(spec.request.skills, spec.projectRoot, spec.packageRoot).flatMap((path) => [
				"--skill",
				path,
			]),
		],
		{
			cwd: spec.projectRoot,
			env: {
				...process.env,
				PI_CODING_AGENT_DIR: spec.workerAgentDir,
				...(spec.piSychConfigDirectory
					? { PI_SYCH_CONFIG_DIRECTORY: spec.piSychConfigDirectory }
					: {}),
				PI_SYCH_TASK_ID: spec.id,
				PI_SYCH_RESULT_PATH: spec.resultPath,
				...(spec.request.remoteResearch
					? { MCPORTER_CONFIG: mcporterConfigPath(spec.projectRoot) }
					: {}),
			},
			stdio: ["ignore", "pipe", "pipe"],
		},
	);
	child.once("spawn", () => (spawned = true));
	forwardWorkerActivity(child.stdout, spec.onActivity);
	child.stderr.setEncoding("utf8");
	child.stderr.on("data", (chunk) => (stderr = (stderr + chunk).slice(-LOG_LIMIT)));
	const captureChildError = (error: Error) => (spawnError = error);
	child.on("error", captureChildError);
	let forcedKillTimer: ReturnType<typeof setTimeout> | undefined;
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let stop = (_kind: "cancelled" | "timeout") => {};
	const onAbort = () => stop("cancelled");
	const [exitCode, terminationSignal] = await new Promise<[number | null, NodeJS.Signals | null]>(
		(resolve) => {
			let settled = false;
			const handleChildError = () => {
				if (!spawned) finish(null, null);
			};
			const finish = (code: number | null, signal: NodeJS.Signals | null) => {
				if (settled) return;
				settled = true;
				if (timeout) clearTimeout(timeout);
				if (forcedKillTimer) clearTimeout(forcedKillTimer);
				spec.signal?.removeEventListener("abort", onAbort);
				child.removeListener("error", captureChildError);
				child.removeListener("error", handleChildError);
				resolve([code, signal]);
			};
			stop = (kind: "cancelled" | "timeout") => {
				if (stopped) return;
				stopped = kind;
				child.kill("SIGTERM");
				forcedKillTimer = setTimeout(() => child.kill("SIGKILL"), 2_000);
			};
			if (spec.signal?.aborted) stop("cancelled");
			else spec.signal?.addEventListener("abort", onAbort, { once: true });
			timeout = setTimeout(() => stop("timeout"), spec.request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
			child.on("error", handleChildError);
			child.once("close", (code, signal) => finish(code, signal));
		},
	);
	if (stopped) return { exitCode: exitCode ?? null, stderr, classification: stopped };
	if (exitCode === null) {
		const msg = spawnError ? spawnError.message : "spawn error";
		return {
			exitCode: null,
			stderr: `${stderr}${msg}`.slice(-LOG_LIMIT),
			classification: "spawn-failure",
		};
	}
	return { exitCode, stderr, ...(terminationSignal ? { terminationSignal } : {}) };
}
export async function dispatchWorker(options: {
	project: ResolvedProject;
	workerAgentDir: string;
	piSychConfigDirectory?: string;
	request: DispatchRequest;
	catalog: ModelCatalog;
	packageRoot?: string;
	extraExtensionPaths?: string[];
	webExtensionPath?: string;
	trajectory?: { manager: SupervisorSession; toolCallId: string };
	launcher?: WorkerLauncher;
	onActivity?: (activity: readonly string[]) => void;
	signal?: AbortSignal;
}): Promise<DispatchOutcome> {
	const request = options.request,
		id = randomUUID(),
		timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
		model = modelFor(options.catalog, request.modelRole),
		contextFiles = await contexts(options.project, request),
		workerSettings = resolve(options.workerAgentDir, "settings.json");
	try {
		await access(workerSettings, constants.R_OK);
	} catch {
		throw new Error(
			`Worker agent directory is not initialized at ${options.workerAgentDir}. Run: node ${resolve(options.packageRoot ?? PI_SYCH_PACKAGE_ROOT, "scripts/bootstrap-worker-agent-dir.mjs")} --agent-dir ${options.workerAgentDir}`,
		);
	}
	const runtime = await mkdtempDisposable(resolve(tmpdir(), "pi-sych-"));
	await using _runtimeHandle = runtime;
	const resultPath = resolve(runtime.path, "result.json");
	const contextMode = request.contextMode ?? "clean";
	if (contextMode === "trajectory" && !options.trajectory)
		throw new Error("Trajectory context is unavailable for this dispatch");
	const sessionPath =
		contextMode === "trajectory" && options.trajectory
			? await prepareTrajectorySession({ ...options.trajectory, runtimePath: runtime.path })
			: undefined;
	const spec: WorkerLaunchSpec = {
		id,
		request: { ...request, contextMode, contextFiles, timeoutMs },
		workerAgentDir: options.workerAgentDir,
		...(options.piSychConfigDirectory
			? { piSychConfigDirectory: options.piSychConfigDirectory }
			: {}),
		resultPath,
		projectRoot: options.project.projectRoot,
		model,
		prompt: "",
		packageRoot: options.packageRoot ?? PI_SYCH_PACKAGE_ROOT,
		extraExtensionPaths:
			options.extraExtensionPaths ?? remoteResearchExtensionPaths(request.remoteResearch === true),
		...(options.webExtensionPath ? { webExtensionPath: options.webExtensionPath } : {}),
		...(sessionPath ? { sessionPath } : {}),
		...(options.onActivity ? { onActivity: options.onActivity } : {}),
		...(options.signal ? { signal: options.signal } : {}),
	};
	spec.prompt = taskPrompt(spec, contextFiles);
	const launch = await (options.launcher ?? launchPiWorker)(spec);
	if (launch.classification || launch.terminationSignal || launch.exitCode !== 0)
		return {
			id,
			model,
			timeoutMs,
			launch,
			error: launch.classification
				? `Worker ${launch.classification}`
				: `Worker exited ${launch.exitCode ?? "without an exit code"}${launch.stderr ? `: ${launch.stderr}` : ""}`,
		};
	try {
		const result = validateWorkerResult(JSON.parse(await readFile(resultPath, "utf8")));
		for (const file of result.files)
			await resolveExistingProjectPath(options.project.projectRoot, file);
		return { id, model, timeoutMs, launch, result };
	} catch (reason) {
		return {
			id,
			model,
			timeoutMs,
			launch,
			error: `Worker result protocol failed: ${reason instanceof Error ? reason.message : String(reason)}`,
		};
	}
}
