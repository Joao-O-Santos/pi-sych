import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants, existsSync, statSync } from "node:fs";
import { access, mkdir, mkdtemp, open, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Type } from "typebox";
import type { ModelCatalog } from "./model-catalog.js";
import { type ResolvedProject, resolveExistingProjectPath, showPath } from "./project-files.js";

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
export const PI_SYCH_PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export interface ContextFile {
	path: string;
	purpose: string;
}
export interface DispatchRequest {
	task: string;
	mode: WorkerMode;
	expectedOutput: string;
	contextFiles: ContextFile[];
	skills?: string[];
	modelRole?: string;
	remoteResearch?: boolean;
	timeoutMs?: number;
}
export interface WorkerResult {
	status: "complete" | "partial" | "failed";
	summary: string;
	files: string[];
	limitations: string[];
}
export interface WorkerLaunchSpec {
	id: string;
	request: DispatchRequest;
	workerAgentDir: string;
	resultPath: string;
	projectRoot: string;
	model: string;
	prompt: string;
	packageRoot: string;
	extraExtensionPaths: string[];
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

const text = (value: unknown, label: string) => {
	if (typeof value !== "string" || !value.trim())
		throw new Error(`${label} must be a non-empty string`);
	return value.trim();
};
const strings = (value: unknown, label: string) => {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
		throw new Error(`${label} must be strings`);
	return value.map((item) => item.trim()).filter(Boolean);
};
export const toolsForRequest = (request: Pick<DispatchRequest, "mode" | "remoteResearch">) => [
	...MODE_TOOLS[request.mode],
	...(request.remoteResearch ? ["mcporter"] : []),
];
export const mcporterConfigPath = (env: NodeJS.ProcessEnv = process.env, home = homedir()) =>
	resolve(env.HOME ?? home, ".config/pi-sych/mcp/mcporter.json");
export function skillPaths(
	selectors: string[] = [],
	projectRoot: string,
	packageRoot: string,
	userRoot = resolve(homedir(), ".pi/agent/skills"),
): string[] {
	return selectors.map((selector) => {
		const direct = selector.includes("/") || selector.endsWith(".md");
		const options = direct
			? [isAbsolute(selector) ? selector : resolve(projectRoot, selector)]
			: [
					resolve(projectRoot, ".pi/skills", selector, "SKILL.md"),
					resolve(projectRoot, ".agents/skills", selector, "SKILL.md"),
					resolve(userRoot, selector, "SKILL.md"),
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
	const files = [
		...request.contextFiles,
		...(["agents", "style"] as const)
			.filter((role) => existsSync(project.canonical[role]))
			.map((role) => ({
				path: showPath(project.projectRoot, project.canonical[role]),
				purpose: `configured ${role} conventions`,
			})),
	];
	const unique = new Map<string, ContextFile>();
	for (const file of files) {
		const path = await resolveExistingProjectPath(project.projectRoot, file.path);
		await access(path, constants.R_OK);
		unique.set(path, { ...file, path: showPath(project.projectRoot, path) });
	}
	return [...unique.values()];
}
export function taskPrompt(spec: WorkerLaunchSpec, files: ContextFile[]) {
	return [
		"You are one short-lived Pi Sych worker. You cannot dispatch another worker.",
		`Task ID: ${spec.id}`,
		`Task: ${spec.request.task}`,
		`Expected output: ${spec.request.expectedOutput}`,
		`Capability mode: ${spec.request.mode}`,
		`Context files: ${files.map((f) => `${f.path} (${f.purpose})`).join("; ") || "none"}`,
		`Selected skills: ${(spec.request.skills ?? []).join(", ") || "none"}`,
		"Read every context file and selected skill before working.",
		"Treat this packet as complete; state missing context as a limitation instead of guessing.",
		...(spec.request.remoteResearch
			? ["MCPorter is available only for this assigned remote research."]
			: []),
		"Call submit_artifact by itself as the final tool call, then stop.",
	].join("\n");
}
export async function writeImmutableResult(path: string, result: WorkerResult) {
	await mkdir(dirname(path), { recursive: true });
	const handle = await open(path, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
		if (error.code === "EEXIST")
			throw new Error("Worker result is immutable and has already been submitted");
		throw error;
	});
	try {
		await handle.writeFile(`${JSON.stringify(result)}\n`);
		await handle.sync();
	} finally {
		await handle.close();
	}
}
export function validateWorkerResult(value: unknown): WorkerResult {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("Worker result must be an object");
	const item = value as Record<string, unknown>,
		status = text(item.status, "status");
	if (!(["complete", "partial", "failed"] as string[]).includes(status))
		throw new Error(`Invalid worker result status: ${status}`);
	return {
		status: status as WorkerResult["status"],
		summary: text(item.summary, "summary"),
		files: strings(item.files, "files"),
		limitations: strings(item.limitations, "limitations"),
	};
}
export const launchPiWorker: WorkerLauncher = (spec) =>
	new Promise((done) => {
		let stderr = "",
			settled = false,
			forced: ReturnType<typeof setTimeout> | undefined,
			stopped: "cancelled" | "timeout" | undefined;
		const child = spawn(
			process.env.PI_SYCH_PI_BIN ?? "pi",
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
					PI_SYCH_TASK_ID: spec.id,
					PI_SYCH_RESULT_PATH: spec.resultPath,
					...(spec.request.remoteResearch
						? { MCPORTER_CONFIG: process.env.PI_SYCH_MCPORTER_CONFIG ?? mcporterConfigPath() }
						: {}),
				},
				stdio: ["ignore", "ignore", "pipe"],
			},
		);
		child.stderr.setEncoding("utf8");
		child.stderr.on("data", (chunk) => {
			stderr = (stderr + chunk).slice(-LOG_LIMIT);
		});
		const finish = (result: WorkerLaunchOutcome) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			if (forced) clearTimeout(forced);
			spec.signal?.removeEventListener("abort", abort);
			done(result);
		};
		const stop = (kind: "cancelled" | "timeout") => {
			if (stopped || settled) return;
			stopped = kind;
			child.kill("SIGTERM");
			forced = setTimeout(() => child.kill("SIGKILL"), 2_000);
		};
		const abort = () => stop("cancelled");
		if (spec.signal?.aborted) abort();
		else spec.signal?.addEventListener("abort", abort, { once: true });
		const timeout = setTimeout(() => stop("timeout"), spec.request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
		child.once("error", (error) =>
			finish({
				exitCode: null,
				stderr: (stderr + error.message).slice(-LOG_LIMIT),
				classification: "spawn-failure",
			}),
		);
		child.once("close", (exitCode, terminationSignal) =>
			finish({ exitCode, stderr, classification: stopped, terminationSignal }),
		);
	});
export async function dispatchWorker(options: {
	project: ResolvedProject;
	workerAgentDir: string;
	request: DispatchRequest;
	catalog: ModelCatalog;
	packageRoot?: string;
	extraExtensionPaths?: string[];
	launcher?: WorkerLauncher;
	signal?: AbortSignal;
}): Promise<DispatchOutcome> {
	const request = options.request,
		id = randomUUID(),
		timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
		model = modelFor(options.catalog, request.modelRole),
		contextFiles = await contexts(options.project, request),
		runtime = await mkdtemp(resolve(tmpdir(), "pi-sych-")),
		resultPath = resolve(runtime, "result.json");
	try {
		const spec: WorkerLaunchSpec = {
			id,
			request: { ...request, contextFiles, timeoutMs },
			workerAgentDir: options.workerAgentDir,
			resultPath,
			projectRoot: options.project.projectRoot,
			model,
			prompt: "",
			packageRoot: options.packageRoot ?? PI_SYCH_PACKAGE_ROOT,
			extraExtensionPaths: options.extraExtensionPaths ?? [],
			signal: options.signal,
		};
		spec.prompt = taskPrompt(spec, contextFiles);
		const launch = await (options.launcher ?? launchPiWorker)(spec);
		let result: WorkerResult | undefined, error: string | undefined;
		try {
			result = validateWorkerResult(JSON.parse(await readFile(resultPath, "utf8")));
		} catch (reason) {
			error = reason instanceof Error ? reason.message : String(reason);
		}
		return result && !launch.classification && !launch.terminationSignal && launch.exitCode === 0
			? { id, model, timeoutMs, launch, result }
			: {
					id,
					model,
					timeoutMs,
					launch,
					error: error ?? `Worker ${launch.classification ?? `exited ${launch.exitCode}`}`,
				};
	} finally {
		await rm(runtime, { recursive: true, force: true });
	}
}
