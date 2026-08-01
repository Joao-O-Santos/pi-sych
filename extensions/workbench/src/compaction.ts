import { appendFile, readFile } from "node:fs/promises";
import { uuidv7 } from "@earendil-works/pi-ai";
import { complete } from "@earendil-works/pi-ai/compat";
import {
	convertToLlm,
	type ExtensionContext,
	type SessionBeforeCompactEvent,
	serializeConversation,
} from "@earendil-works/pi-coding-agent";
import { type ResolvedProject, resolveProject, showPath } from "./project-files.js";
import { checkProjectStatus } from "./project-status.js";

export interface Memory {
	task: string;
	constraints: string[];
	active: string[];
	blockers: string[];
	next: string;
	files: string[];
}
export type PromotionTarget =
	| "project"
	| "agents"
	| "personal-agents"
	| "style"
	| "evidence"
	| "decisions"
	| "todo";
export interface Promotion {
	target: PromotionTarget;
	proposal: string;
}
const targets = new Set<PromotionTarget>([
	"project",
	"agents",
	"personal-agents",
	"style",
	"evidence",
	"decisions",
	"todo",
]);
const string = (value: unknown, name: string) => {
	if (typeof value !== "string" || !value.trim())
		throw new Error(`${name} must be a non-empty string`);
	return value.trim();
};
const strings = (value: unknown, name: string) => {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
		throw new Error(`${name} must be an array of strings`);
	return value.map((item) => item.trim()).filter(Boolean);
};
export function validateWorkingMemory(value: unknown, allowed?: Set<string>): Memory {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("workingMemory must be an object");
	const item = value as Record<string, unknown>;
	return {
		task: string(item.task, "task"),
		constraints: strings(item.constraints, "constraints"),
		active: strings(item.active, "active"),
		blockers: strings(item.blockers, "blockers"),
		next: string(item.next, "next"),
		files: strings(item.files, "files").filter((path) => !allowed || allowed.has(path)),
	};
}
function promotion(value: unknown): Promotion {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("promotion must be an object");
	const item = value as Record<string, unknown>,
		target = string(item.target, "target") as PromotionTarget;
	if (!targets.has(target)) throw new Error("promotion.target is not allowed");
	return { target, proposal: string(item.proposal, "proposal") };
}
export function parseCompactionModelOutput(raw: string): {
	workingMemory: Memory;
	promotions: Promotion[];
} {
	const value = JSON.parse(raw) as Record<string, unknown>;
	if (!Array.isArray(value.promotions) || value.promotions.length > 5)
		throw new Error("promotions must be an array of at most five entries");
	return {
		workingMemory: validateWorkingMemory(value.workingMemory),
		promotions: value.promotions.map(promotion),
	};
}
export function renderWorkingMemory(memory: Memory): string {
	const section = (name: string, values: string[]) =>
		values.length ? `\n## ${name}\n\n${values.map((value) => `- ${value}`).join("\n")}\n` : "";
	return `# Working memory\n\n## Task\n\n${memory.task}${section("Constraints", memory.constraints)}${section("Active work", memory.active)}${section("Blockers", memory.blockers)}\n## Next\n\n${memory.next}${section("Files", memory.files)}`;
}
export async function pendingPromotions(
	project: Pick<ResolvedProject, "canonical">,
): Promise<number> {
	try {
		return (await readFile(project.canonical.inbox, "utf8")).split("\n").length - 1;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
		throw error;
	}
}
async function canonical(
	project: ResolvedProject,
	state: Awaited<ReturnType<typeof checkProjectStatus>>,
) {
	const paths = new Set<string>(),
		files: Array<{ path: string; content: string }> = [];
	for (const path of [
		...Object.values(project.canonical),
		...(state.manifest?.artifacts ?? [])
			.map((item) => (item as { path?: string }).path)
			.filter(Boolean)
			.map((path) => `${project.projectRoot}/${path}`),
	]) {
		const display = showPath(project.projectRoot, path);
		if (paths.has(display)) continue;
		paths.add(display);
		try {
			files.push({ path: display, content: await readFile(path, "utf8") });
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		}
	}
	return files;
}
function prompt(
	event: SessionBeforeCompactEvent,
	files: Array<{ path: string; content: string }>,
	status: unknown,
) {
	const conversation = serializeConversation(
		convertToLlm([
			...event.preparation.messagesToSummarize,
			...event.preparation.turnPrefixMessages,
		]),
	);
	return `Return JSON with workingMemory {task,constraints,active,blockers,next,files} and at most five promotions {target,proposal}. Preserve only information needed to continue. Promotions are usually empty and are unreviewed lines in INBOX.md.\nPrevious summary:\n${event.preparation.previousSummary ?? "none"}\nConversation:\n${conversation}\nCanonical files:\n${JSON.stringify(files)}\nProject status:\n${JSON.stringify(status)}`;
}
export async function compact(event: SessionBeforeCompactEvent, ctx: ExtensionContext) {
	try {
		if (!ctx.model) return undefined;
		const project = await resolveProject(ctx.cwd),
			status = await checkProjectStatus(ctx.cwd, project),
			files = await canonical(project, status),
			auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
		if (!auth.ok || !auth.apiKey) return undefined;
		const response = await complete(
			ctx.model,
			{
				messages: [
					{
						role: "user",
						content: [{ type: "text", text: prompt(event, files, status) }],
						timestamp: Date.now(),
					},
				],
			},
			{
				apiKey: auth.apiKey,
				headers: auth.headers,
				env: auth.env,
				maxTokens: Math.min(4096, ctx.model.maxTokens),
				signal: event.signal,
				cacheRetention: "none",
				sessionId: uuidv7(),
			},
		);
		const raw = response.content
				.filter((part) => part.type === "text")
				.map((part) => part.text)
				.join("\n"),
			output = parseCompactionModelOutput(raw),
			allowed = new Set(files.map((file) => file.path)),
			memory = validateWorkingMemory(output.workingMemory, allowed);
		if (output.promotions.length)
			await appendFile(
				project.canonical.inbox,
				`${output.promotions.map((item) => `- {${item.target}} ${item.proposal}`).join("\n")}\n`,
			);
		const pending = await pendingPromotions(project);
		ctx.ui.notify(
			`Working-memory compaction complete. ${showPath(project.projectRoot, project.canonical.inbox)} has ${pending} pending memory proposals.`,
			"info",
		);
		return {
			compaction: {
				summary: renderWorkingMemory(memory),
				firstKeptEntryId: event.preparation.firstKeptEntryId,
				tokensBefore: event.preparation.tokensBefore,
				usage: response.usage,
			},
		};
	} catch (error) {
		const message = `Working-memory compaction failed: ${String(error)}`;
		if (event.reason === "manual") ctx.ui.notify(message, "error");
		else console.error(message);
		return undefined;
	}
}
