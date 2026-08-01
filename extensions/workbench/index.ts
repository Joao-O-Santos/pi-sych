import { appendFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { extname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { compact, pendingPromotions } from "./src/compaction.js";
import {
	formatMcporterDiagnostic,
	inspectMcporter,
	remoteResearchExtensionPaths,
} from "./src/mcporter.js";
import { loadModelCatalog } from "./src/model-catalog.js";
import {
	parseCodeReviewArgs,
	startCodeReview,
	startFileAnnotation,
	startLastMessageAnnotation,
} from "./src/plannotator.js";
import { resolveExistingProjectPath, resolveProject, showPath } from "./src/project-files.js";
import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	formatProjectStatusCheck,
} from "./src/project-status.js";
import {
	type DispatchOutcome,
	dispatchSchema,
	dispatchWorker,
	MAX_TIMEOUT_MS,
} from "./src/worker-engine.js";
export const PACKAGE_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const SUPERVISOR_GUIDANCE = [
	"Pi Sych is a small mechanical substrate; skills and humans own semantic judgment.",
	"Keep replies concise. Work directly unless independent context would materially improve the result.",
	"Use project_status for mechanical state; changed content is not conceptual drift.",
	`For Pi Sych questions, read ${PACKAGE_ROOT}/README.md and its linked documentation.`,
	"dispatch_worker defaults to 90 seconds; choose context, skills, model role, and timeout deliberately. Worker modes are not sandboxes.",
	"Treat INBOX.md as human-review proposal state: report its pending count through project_status and read it only when the user requests inbox review.",
].join("\n");
const statusSchema = Type.Object({
	action: Type.Union([Type.Literal("check"), Type.Literal("acknowledge")]),
	files: Type.Optional(Type.Array(Type.String())),
	reason: Type.Optional(Type.String()),
});
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
	if (
		outcome.launch.classification ||
		outcome.launch.terminationSignal ||
		outcome.launch.exitCode !== 0
	)
		lines.push(
			"",
			`Process warning: ${outcome.launch.classification ?? "abnormal exit"}; exit code ${outcome.launch.exitCode ?? "none"}; signal ${outcome.launch.terminationSignal ?? "none"}.`,
		);
	return lines.join("\n");
}
const notifyError = (ctx: ExtensionCommandContext, error: unknown) =>
	ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
async function projectFile(cwd: string, input: string) {
	if (!input.trim() || isAbsolute(input)) throw new Error("Path must be a project-local file");
	const project = await resolveProject(cwd),
		path = await resolveExistingProjectPath(project.projectRoot, input);
	return { project, path };
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
function annotationResult(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	session: { waitForDecision(): Promise<{ feedback?: string; exit?: boolean }> },
	path?: string,
) {
	void session
		.waitForDecision()
		.then(async (result) => {
			if (result.feedback) {
				if (path) await appendFile(path, `${result.feedback.trim()}\n`);
				else await pi.sendUserMessage(result.feedback, { deliverAs: "followUp" });
			} else if (result.exit) ctx.ui.notify("Annotation closed.", "info");
		})
		.catch((error) => notifyError(ctx, error));
}
export default function piSychWorkbench(pi: ExtensionAPI): void {
	pi.on("before_agent_start", async (event) => {
		const catalog = loadModelCatalog();
		const models = Object.entries(catalog.models)
			.map(
				([role, entry]) =>
					`- ${role}: ${entry.cost ?? "cost unspecified"}; ${entry.notes ?? "no notes"}`,
			)
			.join("\n");
		return {
			systemPrompt: `${event.systemPrompt}\n\n${SUPERVISOR_GUIDANCE}\n\nWorker model catalog (choose a role by judgment):\n${models}`,
		};
	});
	pi.on("session_before_compact", compact);
	pi.registerTool({
		name: "dispatch_worker",
		label: "Dispatch worker",
		description: "Run one short-lived clean-context worker and return its validated result.",
		parameters: dispatchSchema,
		async execute(_id, params, signal, _update, ctx) {
			const project = await resolveProject(ctx.cwd),
				outcome = await dispatchWorker({
					project,
					workerAgentDir:
						process.env.PI_SYCH_WORKER_AGENT_DIR ??
						resolve(homedir(), ".cache/pi/pi-sych/worker-agent"),
					request: params,
					catalog: loadModelCatalog(),
					packageRoot: PACKAGE_ROOT,
					extraExtensionPaths: remoteResearchExtensionPaths(params.remoteResearch === true),
					signal,
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
		handler: async (_args, ctx) =>
			ctx.ui.notify(formatMcporterDiagnostic(inspectMcporter()), "info"),
	});
	pi.registerCommand("plannotator-last", {
		description: "Open the last assistant message in Plannotator",
		handler: async (_args, ctx) => {
			try {
				const session = await startLastMessageAnnotation(ctx);
				if (!session) throw new Error("No assistant message is available to annotate");
				ctx.ui.notify(`Plannotator annotation opened: ${session.url}`, "info");
				annotationResult(pi, ctx, session);
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
	pi.registerCommand("plannotator-annotate", {
		description: "Open a project-local file in Plannotator",
		handler: async (args, ctx) => {
			try {
				const file = await projectFile(ctx.cwd, args);
				if (![".md", ".mdx"].includes(extname(file.path)))
					throw new Error("Usage: /plannotator-annotate <project-local-file>");
				const session = await startFileAnnotation(
					ctx,
					file.path,
					await readFile(file.path, "utf8"),
				);
				ctx.ui.notify(`Plannotator annotation opened: ${session.url}`, "info");
				annotationResult(pi, ctx, session, `${file.path}.feedback.md`);
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
	pi.registerCommand("plannotator-review", {
		description: "Open Plannotator code review for current changes or a PR URL",
		handler: async (args, ctx) => {
			try {
				const session = await startCodeReview(ctx, parseCodeReviewArgs(args));
				ctx.ui.notify(`Plannotator code review opened: ${session.url}`, "info");
				annotationResult(pi, ctx, session, resolve(ctx.cwd, "PLANNOTATOR_REVIEW.md"));
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
}
export { MAX_TIMEOUT_MS };
