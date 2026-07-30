import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	formatMcporterDiagnostic,
	inspectMcporter,
	remoteResearchExtensionPaths,
} from "./src/mcporter.js";
import { loadModelProfiles } from "./src/model-catalog.js";
import {
	startFileAnnotation,
	startLastMessageAnnotation,
	startPlanReview,
} from "./src/plannotator.js";
import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	formatProjectStatusCheck,
} from "./src/project-status.js";
import { dispatchWorker } from "./src/worker-engine.js";

export const PACKAGE_ROOT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../..",
);

export const SUPERVISOR_GUIDANCE = [
	"Pi Sych is a small mechanical substrate: use skills and human judgment for semantic work.",
	"Work directly by default; use dispatch_worker only for a bounded independent task.",
	"Use project_status for hashes, declared dependencies, and acknowledgement. A changed hash is not conceptual drift.",
	"Read applicable project conventions before creating or revising artifacts.",
	"dispatch_worker defaults to 90 seconds. Set a deliberate bounded timeout for longer work.",
	"Use submit_plan for consequential plans; approval never starts implementation automatically.",
	"Worker tool modes are not sandboxes. Do not claim checks, retrieval, or approval that did not occur.",
].join("\n");

const dispatchParameters = Type.Object({
	task: Type.String(),
	mode: Type.Union([
		Type.Literal("read-only"),
		Type.Literal("edit"),
		Type.Literal("full-host"),
	]),
	expectedOutput: Type.String(),
	contextFiles: Type.Array(
		Type.Object({ path: Type.String(), purpose: Type.String() }),
	),
	skills: Type.Optional(Type.Array(Type.String())),
	modelProfile: Type.Optional(Type.String()),
	remoteResearch: Type.Optional(Type.Boolean()),
	timeoutMs: Type.Optional(Type.Integer({ minimum: 1, maximum: 1_800_000 })),
});

const statusParameters = Type.Object({
	action: Type.Union([Type.Literal("check"), Type.Literal("acknowledge")]),
	files: Type.Optional(Type.Array(Type.String())),
	reason: Type.Optional(Type.String()),
});

function projectFile(cwd: string, path: string): string | undefined {
	if (!path.trim()) return undefined;
	const absolute = resolve(cwd, path);
	const rel = relative(cwd, absolute);
	return rel === ".." ||
		rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
		isAbsolute(rel)
		? undefined
		: absolute;
}

function notifyError(ctx: ExtensionCommandContext, error: unknown): void {
	ctx.ui.notify(
		error instanceof Error ? error.message : String(error),
		"error",
	);
}

function annotationFeedback(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	session: {
		waitForDecision(): Promise<{ exit?: boolean; feedback?: string }>;
	},
): void {
	void session
		.waitForDecision()
		.then((result) => {
			if (result.feedback)
				void pi.sendUserMessage(result.feedback, { deliverAs: "followUp" });
			else if (result.exit) ctx.ui.notify("Annotation closed.", "info");
		})
		.catch((error: unknown) => notifyError(ctx, error));
}

export default function piSychWorkbench(pi: ExtensionAPI): void {
	pi.on("before_agent_start", (event) => ({
		systemPrompt: `${event.systemPrompt}\n\n${SUPERVISOR_GUIDANCE}`,
	}));

	pi.registerTool({
		name: "dispatch_worker",
		label: "Dispatch worker",
		description:
			"Run one short-lived clean-context worker and return its validated result.",
		parameters: dispatchParameters,
		async execute(_id, params, signal, _update, ctx) {
			const outcome = await dispatchWorker({
				projectRoot: ctx.cwd,
				workerAgentDir:
					process.env.PI_SYCH_WORKER_AGENT_DIR ??
					resolve(homedir(), ".cache/pi/pi-sych/worker-agent"),
				request: params,
				profiles: loadModelProfiles(),
				packageRoot: PACKAGE_ROOT,
				extraExtensionPaths: remoteResearchExtensionPaths(
					params.remoteResearch === true,
				),
				signal,
			});
			const text = outcome.result
				? `Worker ${outcome.result.status}: ${outcome.result.summary}`
				: `Worker failed: ${outcome.failure?.message ?? "no result"}`;
			return { content: [{ type: "text", text }], details: outcome };
		},
	});

	pi.registerTool({
		name: "project_status",
		label: "Project status",
		description:
			"Check mechanical project state or acknowledge named reviewed files. It never determines conceptual drift or authority.",
		parameters: statusParameters,
		async execute(_id, params, _signal, _update, ctx) {
			if (params.action === "check") {
				const state = await checkProjectStatus(ctx.cwd);
				return {
					content: [{ type: "text", text: formatProjectStatusCheck(state) }],
					details: state,
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
						text: [
							"Acknowledged:",
							...result.acknowledged.map((artifact) => `- ${artifact.path}`),
							...(result.needsReview.length
								? [
										"",
										"Marked as needing review:",
										...result.needsReview.map((path) => `- ${path}`),
									]
								: []),
						].join("\n"),
					},
				],
				details: result,
			};
		},
	});

	pi.registerTool({
		name: "submit_plan",
		label: "Submit plan",
		description:
			"Submit an existing project-local Markdown plan for explicit human review.",
		parameters: Type.Object({ filePath: Type.String() }),
		async execute(_id, params, signal, update, ctx) {
			const path = projectFile(ctx.cwd, params.filePath);
			if (!path || ![".md", ".mdx"].includes(extname(path).toLowerCase()))
				throw new Error("Plan must be a project-local Markdown file");
			if (signal?.aborted) throw new Error("Plan review was cancelled");
			const content = readFileSync(path, "utf8");
			if (!content.trim()) throw new Error("Plan file is empty");
			const session = await startPlanReview(ctx, content);
			update?.({
				content: [{ type: "text", text: `Plan review opened: ${session.url}` }],
				details: { pending: true, url: session.url },
			});
			const result = await session.waitForDecision();
			return {
				content: [
					{
						type: "text",
						text: result.approved
							? "Plan approved."
							: "Plan requires revision.",
					},
				],
				details: { ...result, filePath: relative(ctx.cwd, path) },
			};
		},
	});

	pi.registerCommand("pi-sych-status", {
		description: "Show mechanical project status",
		handler: async (_args, ctx) => {
			try {
				ctx.ui.notify(
					formatProjectStatusCheck(await checkProjectStatus(ctx.cwd)),
					"info",
				);
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});

	pi.registerCommand("pi-sych-mcp", {
		description: "Show MCPorter configuration diagnostics",
		handler: async (_args, ctx) => {
			try {
				ctx.ui.notify(formatMcporterDiagnostic(inspectMcporter()), "info");
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});

	pi.registerCommand("plannotator-last", {
		description: "Open the last assistant message in Plannotator",
		handler: async (_args, ctx) => {
			try {
				const session = await startLastMessageAnnotation(ctx);
				if (!session)
					throw new Error("No assistant message is available to annotate");
				ctx.ui.notify(`Plannotator annotation opened: ${session.url}`, "info");
				annotationFeedback(pi, ctx, session);
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});

	pi.registerCommand("plannotator-annotate", {
		description: "Open a project-local file in Plannotator",
		handler: async (args, ctx) => {
			try {
				const path = projectFile(ctx.cwd, args);
				if (!path)
					throw new Error("Usage: /plannotator-annotate <project-local-file>");
				const session = await startFileAnnotation(
					ctx,
					path,
					readFileSync(path, "utf8"),
				);
				ctx.ui.notify(`Plannotator annotation opened: ${session.url}`, "info");
				annotationFeedback(pi, ctx, session);
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
}
