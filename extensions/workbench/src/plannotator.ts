import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createJiti } from "jiti";
export interface AnnotationDecision {
	feedback?: string;
	exit?: boolean;
}
export interface CodeReviewDecision extends AnnotationDecision {
	approved?: boolean;
}
export interface AnnotationSession {
	url: string;
	waitForDecision(): Promise<AnnotationDecision>;
}
export interface CodeReviewSession {
	url: string;
	waitForDecision(): Promise<CodeReviewDecision>;
}
export interface CodeReviewRequest {
	prUrl?: string;
	vcsType?: "git" | "gitbutler";
	useLocal?: boolean;
}
type Plannotator = {
	startMarkdownAnnotationSession(
		ctx: ExtensionContext,
		path: string,
		content: string,
		mode: "annotate",
	): Promise<AnnotationSession>;
	getLastAssistantMessageText(ctx: ExtensionContext): string | undefined;
	startLastMessageAnnotationSession(
		ctx: ExtensionContext,
		text: string,
	): Promise<AnnotationSession>;
	startCodeReviewBrowserSession(
		ctx: ExtensionContext,
		options?: CodeReviewRequest,
	): Promise<CodeReviewSession>;
};
const jiti = createJiti(import.meta.url, { interopDefault: true });
export const plannotatorUnavailable = (reason?: string) =>
	new Error(
		`Plannotator unavailable; ensure its integration is installed${reason ? ` and compatible: ${reason}` : ""}`,
	);
function validatePlannotator(value: unknown): Plannotator {
	if (!value || typeof value !== "object")
		throw plannotatorUnavailable("adapter did not export an API");
	const api = value as Record<string, unknown>;
	for (const name of [
		"startMarkdownAnnotationSession",
		"getLastAssistantMessageText",
		"startLastMessageAnnotationSession",
		"startCodeReviewBrowserSession",
	])
		if (typeof api[name] !== "function") throw plannotatorUnavailable(`adapter is missing ${name}`);
	return api as unknown as Plannotator;
}
export async function loadPlannotator(): Promise<Plannotator> {
	try {
		return validatePlannotator(
			await jiti.import("@plannotator/pi-extension/plannotator-events.ts"),
		);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Plannotator unavailable")) throw error;
		throw plannotatorUnavailable(error instanceof Error ? error.message : String(error));
	}
}
export const startFileAnnotation = async (ctx: ExtensionContext, path: string, content: string) =>
	(await loadPlannotator()).startMarkdownAnnotationSession(ctx, path, content, "annotate");
export const startLastMessageAnnotation = async (ctx: ExtensionContext) => {
	const api = await loadPlannotator(),
		text = api.getLastAssistantMessageText(ctx);
	return text ? api.startLastMessageAnnotationSession(ctx, text) : undefined;
};
export function parseCodeReviewArgs(input = ""): CodeReviewRequest {
	let prUrl: string | undefined,
		vcsType: CodeReviewRequest["vcsType"],
		useLocal = true;
	for (const raw of input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []) {
		const token = raw.replace(/^['"]|['"]$/g, "");
		if (token === "--git") vcsType = "git";
		else if (token === "--gitbutler") vcsType = "gitbutler";
		else if (token === "--no-local") useLocal = false;
		else if (/^https?:\/\//.test(token) && !prUrl) prUrl = token;
	}
	return { ...(prUrl ? { prUrl } : {}), ...(vcsType ? { vcsType } : {}), useLocal };
}
export const startCodeReview = async (ctx: ExtensionContext, options: CodeReviewRequest = {}) =>
	(await loadPlannotator()).startCodeReviewBrowserSession(ctx, options);
