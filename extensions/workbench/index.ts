import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { compact, pendingPromotions } from "./src/compaction.js";
import {
	ensurePiSychConfig,
	loadPiSychConfig,
	piSychConfigDirectory,
	piSychConfigPath,
} from "./src/config-directory.js";
import { formatMcporterDiagnostic, inspectMcporter, mcporterConfigPath } from "./src/mcporter.js";
import { loadModelCatalog, loadOptionalModelCatalog } from "./src/model-catalog.js";
import { resolveProject, showPath } from "./src/project-files.js";
import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	formatProjectStatusCheck,
} from "./src/project-status.js";
import {
	DEFAULT_TIMEOUT_MS,
	type DispatchOutcome,
	type DispatchRequest,
	dispatchSchema,
	dispatchWorker,
	MAX_TIMEOUT_MS,
} from "./src/worker-engine.js";
export const PACKAGE_ROOT = resolve(
	process.env.PI_PACKAGE_DIR ?? resolve(import.meta.dirname, "../.."),
);
export const SUPERVISOR_GUIDANCE = [
	"Pi Sych is a small mechanical substrate; skills and humans own semantic judgment.",
	"Keep replies concise. Work directly unless independent context would materially improve the result.",
	"Use project_status for mechanical state; changed content is not conceptual drift.",
	`For Pi Sych questions, read ${PACKAGE_ROOT}/README.md and its linked documentation.`,
	"dispatch_worker defaults to 90 seconds; choose context, skills, model role, and timeout deliberately. Worker modes are not sandboxes.",
	"Treat the configured proposal inbox as human-review proposal state: report its pending count through project_status and read it only when the user requests inbox review.",
].join("\n");
const statusSchema = Type.Object({
	action: Type.Union([Type.Literal("check"), Type.Literal("acknowledge")]),
	files: Type.Optional(Type.Array(Type.String())),
	reason: Type.Optional(Type.String()),
});
const TASK_SUMMARY_LIMIT = 60;
const compactTaskSummary = (task: string) => {
	const summary = task.replace(/\s+/g, " ").trim();
	return summary.length > TASK_SUMMARY_LIMIT
		? `${summary.slice(0, TASK_SUMMARY_LIMIT - 3)}...`
		: summary;
};
const formatTimeout = (timeoutMs: number) => {
	if (timeoutMs % 60_000 === 0) return `${timeoutMs / 60_000}m`;
	if (timeoutMs % 1_000 === 0) return `${timeoutMs / 1_000}s`;
	return `${timeoutMs}ms`;
};
export function formatDispatchWorkerCallSummary(
	args: Pick<DispatchRequest, "task" | "modelRole" | "timeoutMs">,
) {
	return [
		`task-summary: ${compactTaskSummary(args.task)}`,
		`model: ${args.modelRole ?? "catalog default"}`,
		`timeout: ${formatTimeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS)}`,
	].join("\n");
}
export function formatDispatchWorkerOutcome(outcome: DispatchOutcome) {
	const result = outcome.result;
	const lines = [
		`Worker status: ${result?.status ?? "unavailable"}`,
		`Summary: ${result?.summary ?? outcome.error ?? "no result"}`,
		"",
		result?.files.length ? "Files:" : "Files: none",
		...(result?.files ?? []).map((file) => `- ${file}`),
		"",
		result?.limitations.length ? "Limitations:" : "Limitations: none",
		...(result?.limitations ?? []).map((item) => `- ${item}`),
	];
	return lines.join("\n");
}
const notifyError = (ctx: ExtensionCommandContext, error: unknown) =>
	ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
export const shouldCompactAt100k = (enabled: boolean, tokens?: number | null) =>
	enabled && (tokens ?? 0) >= 100_000;
export async function configuredSupervisorInstructions(cwd: string, existing = "") {
	const project = await resolveProject(cwd),
		instructions = await readFile(project.canonical.agents, "utf8").catch(
			(error: NodeJS.ErrnoException) => {
				if (error.code === "ENOENT") return "";
				throw error;
			},
		);
	if (!instructions.trim() || existing.includes(instructions.trim())) return undefined;
	return `Configured project instructions (${showPath(project.projectRoot, project.canonical.agents)}):\n${instructions.trim()}`;
}
async function statusView(cwd: string) {
	const state = await checkProjectStatus(cwd);
	if (state.syncError) return { state, pending: 0, text: formatProjectStatusCheck(state) };
	const project = await resolveProject(cwd),
		pending = await pendingPromotions(project);
	return {
		state,
		pending,
		text: formatProjectStatusCheck(
			state,
			pending,
			showPath(project.projectRoot, project.canonical.inbox),
		),
	};
}
export default async function piSychWorkbench(pi: ExtensionAPI): Promise<void> {
	const project = await resolveProject(process.cwd());
	const startupOptions = { projectRoot: project.projectRoot };
	await ensurePiSychConfig(startupOptions);
	loadPiSychConfig(startupOptions);
	pi.on("before_agent_start", async (event, ctx) => {
		const project = await resolveProject(ctx.cwd);
		const config = loadPiSychConfig({ projectRoot: project.projectRoot });
		if (shouldCompactAt100k(config.compaction.compactAt100k, ctx.getContextUsage()?.tokens))
			ctx.compact();
		const sections = [event.systemPrompt, SUPERVISOR_GUIDANCE],
			instructions = await configuredSupervisorInstructions(ctx.cwd, event.systemPrompt);
		if (instructions) sections.push(instructions);
		const catalog = loadOptionalModelCatalog(project.projectRoot);
		if (catalog) {
			const models = Object.entries(catalog.models)
				.map(
					([role, entry]) =>
						`- ${role}: ${entry.cost ?? "cost unspecified"}; ${entry.notes ?? "no notes"}`,
				)
				.join("\n");
			sections.push(`Worker model catalog (choose a role by judgment):\n${models}`);
		}
		return { systemPrompt: sections.join("\n\n") };
	});
	pi.on("session_before_compact", async (event, ctx) => {
		const project = await resolveProject(ctx.cwd);
		return loadPiSychConfig({ projectRoot: project.projectRoot }).compaction.custom
			? compact(event, ctx)
			: undefined;
	});
	pi.registerTool({
		name: "dispatch_worker",
		label: "Dispatch worker",
		description: "Run one short-lived clean-context worker and return its validated result.",
		parameters: dispatchSchema,
		renderCall(args, theme, { expanded }) {
			const title = theme.fg("toolTitle", theme.bold("Dispatch worker"));
			const details = expanded
				? `\n${JSON.stringify(args, null, 2)}`
				: `\n${formatDispatchWorkerCallSummary(args)}`;
			return new Text(title + details, 0, 0);
		},
		async execute(_id, params, signal, onUpdate, ctx) {
			const project = await resolveProject(ctx.cwd),
				outcome = await dispatchWorker({
					project,
					workerAgentDir: piSychConfigPath("workerAgentDir", {
						projectRoot: project.projectRoot,
					}),
					piSychConfigDirectory: piSychConfigDirectory({ projectRoot: project.projectRoot }),
					request: params,
					catalog: loadModelCatalog(project.projectRoot),
					packageRoot: PACKAGE_ROOT,
					onActivity: (activity) =>
						onUpdate?.({
							content: [
								{
									type: "text",
									text: `Worker activity:\n${activity.map((item) => `- ${item}`).join("\n")}`,
								},
							],
							details: { activity },
						}),
					...(signal ? { signal } : {}),
				});
			return {
				content: [{ type: "text", text: formatDispatchWorkerOutcome(outcome) }],
				details: outcome,
			};
		},
	});
	pi.registerTool({
		name: "project_status",
		label: "Project status",
		description:
			"Check mechanical project state or acknowledge named reviewed files. It never determines conceptual drift or authority.",
		parameters: statusSchema,
		async execute(_id, params, _signal, _update, ctx) {
			if (params.action === "check") {
				const view = await statusView(ctx.cwd);
				return {
					content: [{ type: "text", text: view.text }],
					details: { ...view.state, pendingPromotions: view.pending },
				};
			}
			const result = await acknowledgeProjectStatus(
				ctx.cwd,
				params.files ?? [],
				params.reason ?? "",
			);
			return {
				content: [
					{
						type: "text",
						text: `Acknowledged:\n${result.acknowledged.map((item) => `- ${item.path}`).join("\n")}`,
					},
				],
				details: result,
			};
		},
	});
	pi.registerCommand("pi-sych-status", {
		description: "Show mechanical project status",
		handler: async (_args, ctx) => {
			try {
				ctx.ui.notify((await statusView(ctx.cwd)).text, "info");
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
	pi.registerCommand("pi-sych-mcp", {
		description: "Show MCPorter configuration diagnostics",
		handler: async (_args, ctx) => {
			const project = await resolveProject(ctx.cwd);
			ctx.ui.notify(
				formatMcporterDiagnostic(inspectMcporter(mcporterConfigPath(project.projectRoot))),
				"info",
			);
		},
	});
}
export { MAX_TIMEOUT_MS };
