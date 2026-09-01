import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants, existsSync, statSync } from "node:fs";
import { access, mkdir, mkdtempDisposable, open, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, resolve } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";
import { piSkillDirectory } from "./config-directory.js";
import { mcporterConfigPath, remoteResearchExtensionPaths } from "./mcporter.js";
import type { ModelCatalog } from "./model-catalog.js";
import {
	type ResolvedProject,
	resolveConfiguredPath,
	resolveExistingProjectPath,
	resolveProjectPath,
	showPath,
} from "./project-files.js";
import { nonEmptyString, stringArray } from "./validation.js";
export const WORKER_MODES = ["read-only", "edit", "full-host"] as const;
export type WorkerMode = (typeof WORKER_MODES)[number];
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
	task: Type.String(),
	mode: Type.Union(WORKER_MODES.map((mode) => Type.Literal(mode))),
	expectedOutput: Type.String(),
	contextFiles: Type.Array(Type.Object({ path: Type.String(), purpose: Type.String() })),
	skills: Type.Optional(Type.Array(Type.String())),
	modelRole: Type.Optional(Type.String()),
	remoteResearch: Type.Optional(Type.Boolean()),
	timeoutMs: Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_TIMEOUT_MS })),
});
export const toolsForRequest = (
	request: Pick<DispatchRequest, "mode" | "remoteResearch" | "skills">,
) => [
	...MODE_TOOLS[request.mode],
	...(request.skills?.includes("research") ? ["literature_search"] : []),
	...(request.remoteResearch ? ["mcporter"] : []),
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
		const path = await resolveExistingProjectPath(project.projectRoot, file.path);
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
	return [
		"You are one short-lived Pi Sych worker. Read every context file and selected skill, then read the routed modules.",
		`Task ID: ${spec.id} | Task: ${spec.request.task}`,
		`Expected output: ${spec.request.expectedOutput} | Mode: ${spec.request.mode}`,
		`Context files: ${files.map((f) => `${f.path} (${f.purpose})`).join("; ") || "none"}`,
		`Selected skills: ${(spec.request.skills ?? []).join(", ") || "none"}`,
		"Treat this packet as complete; state missing context as a limitation. Call submit_artifact as the final tool call, then stop.",
		...(spec.request.remoteResearch
			? ["MCPorter is available only for this assigned remote research."]
			: []),
	].join("\n");
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
	const child = spawnWorker(
		"pi",
		[
			"--mode",
			"json",
			"--print",
			spec.prompt,
			"--no-session",
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
			toolsForRequest(spec.request).join(","),
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
	forwardWorkerActivity(child.stdout, spec.onActivity);
	child.stderr.setEncoding("utf8");
	child.stderr.on("data", (chunk) => (stderr = (stderr + chunk).slice(-LOG_LIMIT)));
	child.once("error", (err) => (spawnError = err));
	let forcedKillTimer: ReturnType<typeof setTimeout> | undefined;
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let stop = (_kind: "cancelled" | "timeout") => {};
	const onAbort = () => stop("cancelled");
	const [exitCode, terminationSignal] = await new Promise<[number | null, NodeJS.Signals | null]>(
		(resolve) => {
			let settled = false;
			const finish = (code: number | null, signal: NodeJS.Signals | null) => {
				if (settled) return;
				settled = true;
				if (timeout) clearTimeout(timeout);
				if (forcedKillTimer) clearTimeout(forcedKillTimer);
				spec.signal?.removeEventListener("abort", onAbort);
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
			child.once("error", () => finish(null, null));
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
	const spec: WorkerLaunchSpec = {
		id,
		request: { ...request, contextFiles, timeoutMs },
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
