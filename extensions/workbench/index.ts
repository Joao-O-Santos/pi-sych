import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { StringEnum } from "@earendil-works/pi-ai";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	countPromotionCandidates,
	createWorkingMemoryCompaction,
} from "./src/compaction.js";
import {
	formatMcporterDiagnostic,
	inspectMcporter,
	remoteResearchExtensionPaths,
} from "./src/mcporter.js";
import { loadModelProfiles } from "./src/model-catalog.js";
import type { PlanReviewDecision } from "./src/plannotator.js";
import {
	openPlanReview,
	parseCodeReviewArgs,
	startCodeReview,
	startFileAnnotation,
	startLastMessageAnnotation,
} from "./src/plannotator.js";
import { resolveExistingProjectPath } from "./src/project-files.js";
import {
	acknowledgeProjectStatus,
	checkProjectStatus,
	formatProjectStatusCheck,
} from "./src/project-status.js";
import {
	type DispatchOutcome,
	dispatchWorker,
	MAX_TIMEOUT_MS,
	WORKER_MODES,
} from "./src/worker-engine.js";

export const PACKAGE_ROOT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../..",
);

export const SUPERVISOR_GUIDANCE = [
	"Pi Sych is a small mechanical substrate; skills and humans own semantic judgment.",
	"Keep replies concise. Put consequential or lengthy plans in a project-local Markdown file and call submit_plan.",
	"Work directly unless an independent context would materially improve the result. Substantive review defaults to an independent read-only worker; do not prime its verdict.",
	"Parallel workers need independent tasks; workers sharing a checkout do not edit concurrently.",
	"Use project_status for mechanical state; changed content is not conceptual drift. Read applicable project conventions before editing.",
	`For Pi Sych questions, read ${PACKAGE_ROOT}/README.md and its linked documentation.`,
	"dispatch_worker defaults to 90 seconds; choose context, skills, model, and timeout deliberately. Worker modes are not sandboxes. Report only work actually performed.",
	"Treat INBOX.md as human-review proposal state: report its pending count through project_status and read it only when the user requests inbox review.",
].join("\n");

const dispatchParameters = Type.Object({
	task: Type.String(),
	mode: StringEnum(WORKER_MODES),
	expectedOutput: Type.String(),
	contextFiles: Type.Array(
		Type.Object({ path: Type.String(), purpose: Type.String() }),
	),
	skills: Type.Optional(Type.Array(Type.String())),
	modelProfile: Type.Optional(Type.String()),
	remoteResearch: Type.Optional(Type.Boolean()),
	timeoutMs: Type.Optional(
		Type.Integer({ minimum: 1, maximum: MAX_TIMEOUT_MS }),
	),
});

const statusParameters = Type.Object({
	action: StringEnum(["check", "acknowledge"] as const),
	files: Type.Optional(Type.Array(Type.String())),
	reason: Type.Optional(Type.String()),
});

const TOOL_CONTENT_LIMIT = 8_192;

function boundedToolContent(value: string): string {
	return value.length > TOOL_CONTENT_LIMIT
		? `${value.slice(0, TOOL_CONTENT_LIMIT - 15)}\n[truncated]`
		: value;
}

async function projectStatusView(cwd: string) {
	const state = await checkProjectStatus(cwd);
	const pendingPromotions = await countPromotionCandidates(state.projectRoot);
	return {
		state,
		pendingPromotions,
		text: formatProjectStatusCheck(state, pendingPromotions),
	};
}

function listContent(label: string, values: string[]): string[] {
	return values.length
		? [label, ...values.map((value) => `- ${value}`)]
		: [`${label} none`];
}

export function formatDispatchWorkerOutcome(outcome: DispatchOutcome): string {
	const result = outcome.result;
	const lines = [
		`Worker status: ${result?.status ?? "unavailable"}`,
		`Summary: ${result?.summary ?? outcome.failure?.message ?? "no result"}`,
		"",
		...listContent(
			"Artifacts:",
			result?.artifacts.map(
				(artifact) => `${artifact.path} (${artifact.kind})`,
			) ?? [],
		),
		"",
		...listContent("Changed files:", result?.changedFiles ?? []),
		"",
		`Result package: ${result?.resultPackage ?? "unavailable"}`,
		"",
		...listContent("Limitations:", result?.limitations ?? []),
	];
	const launch = outcome.launch;
	if (
		launch &&
		(launch.classification || launch.terminationSignal || launch.exitCode !== 0)
	) {
		lines.push(
			"",
			`Process warning: ${launch.classification ?? "abnormal exit"}; exit code ${launch.exitCode ?? "none"}; signal ${launch.terminationSignal ?? "none"}.`,
		);
	}
	return boundedToolContent(lines.join("\n"));
}

export function formatSubmitPlanResult(
	result: PlanReviewDecision,
	savedPath: string | undefined,
): string {
	if (result.mode === "file")
		return `Plan ready at ${result.savedPath}. Review or edit it, then reply with your comments and @${result.savedPath}.`;
	return boundedToolContent(
		[
			result.approved ? "Plan approved." : "Plan requires revision.",
			`Saved path: ${savedPath ?? "none"}`,
			`Feedback: ${result.feedback?.trim() || "none"}`,
		].join("\n"),
	);
}

async function projectFile(
	cwd: string,
	path: string,
): Promise<string | undefined> {
	if (!path.trim()) return undefined;
	try {
		return await resolveExistingProjectPath(cwd, path);
	} catch {
		return undefined;
	}
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
	let loadedContextFiles: Array<{ path: string; content: string }> = [];
	pi.on("before_agent_start", (event) => {
		loadedContextFiles = event.systemPromptOptions.contextFiles ?? [];
		return { systemPrompt: `${event.systemPrompt}\n\n${SUPERVISOR_GUIDANCE}` };
	});
	pi.on("session_before_compact", (event, ctx) =>
		createWorkingMemoryCompaction(event, ctx, loadedContextFiles),
	);

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
		parameters: statusParameters,
		async execute(_id, params, _signal, _update, ctx) {
			if (params.action === "check") {
				const view = await projectStatusView(ctx.cwd);
				return {
					content: [{ type: "text", text: view.text }],
					details: { ...view.state, pendingPromotions: view.pendingPromotions },
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
			const path = await projectFile(ctx.cwd, params.filePath);
			if (!path || ![".md", ".mdx"].includes(extname(path).toLowerCase()))
				throw new Error("Plan must be a project-local Markdown file");
			if (signal?.aborted) throw new Error("Plan review was cancelled");
			const content = readFileSync(path, "utf8");
			if (!content.trim()) throw new Error("Plan file is empty");
			const savedPath = relative(ctx.cwd, path);
			const review = await openPlanReview(ctx, content, savedPath);
			if (review.mode === "file") {
				if (signal?.aborted) throw new Error("Plan review was cancelled");
				return {
					content: [
						{
							type: "text",
							text: formatSubmitPlanResult(review, review.savedPath),
						},
					],
					details: review,
				};
			}
			update?.({
				content: [
					{ type: "text", text: `Plan review opened: ${review.session.url}` },
				],
				details: { pending: true, url: review.session.url },
			});
			const decision = await review.session.waitForDecision();
			const result: PlanReviewDecision = { ...decision, mode: "browser" };
			return {
				content: [
					{ type: "text", text: formatSubmitPlanResult(result, savedPath) },
				],
				details: { ...result, savedPath },
			};
		},
	});

	pi.registerCommand("pi-sych-status", {
		description: "Show mechanical project status",
		handler: async (_args, ctx) => {
			try {
				ctx.ui.notify((await projectStatusView(ctx.cwd)).text, "info");
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
				const path = await projectFile(ctx.cwd, args);
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

	// Human-only command: opens Plannotator code review without plan-mode tooling.
	pi.registerCommand("plannotator-review", {
		description:
			"Open Plannotator code review for current changes or a PR URL; pass --git or --gitbutler to force that provider",
		handler: async (args, ctx) => {
			try {
				const session = await startCodeReview(ctx, parseCodeReviewArgs(args));
				ctx.ui.notify(`Plannotator code review opened: ${session.url}`, "info");
				void session
					.waitForDecision()
					.then((result) => {
						if (result.exit) {
							ctx.ui.notify("Code review session closed.", "info");
							return;
						}
						if (result.approved) {
							ctx.ui.notify("Code review approved.", "info");
							return;
						}
						if (result.feedback?.trim())
							return pi.sendUserMessage(result.feedback, {
								deliverAs: "followUp",
							});
						ctx.ui.notify("Code review closed (no feedback).", "info");
					})
					.catch((error: unknown) => notifyError(ctx, error));
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
}
