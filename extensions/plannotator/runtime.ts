import { appendFile, readFile } from "node:fs/promises";
import { extname, isAbsolute, resolve } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import {
	loadPlannotator,
	parseCodeReviewArgs,
	startCodeReview,
	startFileAnnotation,
	startLastMessageAnnotation,
} from "../workbench/src/plannotator.js";
import { resolveExistingProjectPath, resolveProject } from "../workbench/src/project-files.js";

const notifyError = (ctx: ExtensionCommandContext, error: unknown) =>
	ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
async function projectFile(cwd: string, input: string) {
	if (!input.trim() || isAbsolute(input)) throw new Error("Path must be a project-local file");
	const project = await resolveProject(cwd);
	return resolveExistingProjectPath(project.projectRoot, input);
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
export interface PlannotatorRuntime {
	preload(): Promise<unknown>;
	last(ctx: ExtensionCommandContext): ReturnType<typeof startLastMessageAnnotation>;
	file(
		ctx: ExtensionCommandContext,
		path: string,
		content: string,
	): ReturnType<typeof startFileAnnotation>;
	review(
		ctx: ExtensionCommandContext,
		args: ReturnType<typeof parseCodeReviewArgs>,
	): ReturnType<typeof startCodeReview>;
}
const defaultRuntime: PlannotatorRuntime = {
	preload: loadPlannotator,
	last: startLastMessageAnnotation,
	file: startFileAnnotation,
	review: startCodeReview,
};
export async function registerPlannotator(
	pi: ExtensionAPI,
	runtime: PlannotatorRuntime = defaultRuntime,
): Promise<void> {
	await runtime.preload();
	pi.registerCommand("plannotator-last", {
		description: "Open the last assistant message in Plannotator",
		handler: async (_args, ctx) => {
			try {
				const session = await runtime.last(ctx);
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
				if (![".md", ".mdx"].includes(extname(file)))
					throw new Error("Usage: /plannotator-annotate <project-local-file>");
				const session = await runtime.file(ctx, file, await readFile(file, "utf8"));
				ctx.ui.notify(`Plannotator annotation opened: ${session.url}`, "info");
				annotationResult(pi, ctx, session, `${file}.feedback.md`);
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
	pi.registerCommand("plannotator-review", {
		description: "Open Plannotator code review for current changes or a PR URL",
		handler: async (args, ctx) => {
			try {
				const session = await runtime.review(ctx, parseCodeReviewArgs(args));
				ctx.ui.notify(`Plannotator code review opened: ${session.url}`, "info");
				const project = await resolveProject(ctx.cwd);
				annotationResult(pi, ctx, session, resolve(project.projectRoot, "PLANNOTATOR_REVIEW.md"));
			} catch (error) {
				notifyError(ctx, error);
			}
		},
	});
}
