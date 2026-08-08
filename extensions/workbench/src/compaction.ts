import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { uuidv7 } from "@earendil-works/pi-ai";
import { complete } from "@earendil-works/pi-ai/compat";
import {
	convertToLlm,
	type ExtensionContext,
	type SessionBeforeCompactEvent,
	serializeConversation,
} from "@earendil-works/pi-coding-agent";
import {
	type ResolvedProject,
	resolveExistingProjectPath,
	resolveProject,
	resolveProjectPath,
	showPath,
} from "./project-files.js";
import { checkProjectStatus } from "./project-status.js";
import { nonEmptyString, stringArray } from "./validation.js";

const coerceScalar = (value: unknown): unknown =>
	typeof value === "string" ? value.trim() : value;

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
export function validateWorkingMemory(value: unknown): Memory {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("workingMemory must be an object");
	const item = value as Record<string, unknown>;
	return {
		task: nonEmptyString(item.task, "task"),
		constraints: stringArray(coerceScalar(item.constraints), "constraints"),
		active: stringArray(coerceScalar(item.active), "active"),
		blockers: stringArray(coerceScalar(item.blockers), "blockers"),
		next: nonEmptyString(item.next, "next"),
		files: stringArray(coerceScalar(item.files), "files"),
	};
}
function promotion(value: unknown): Promotion {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error("promotion must be an object");
	const item = value as Record<string, unknown>,
		target = nonEmptyString(item.target, "target") as PromotionTarget;
	if (!targets.has(target)) throw new Error("promotion.target is not allowed");
	return { target, proposal: nonEmptyString(item.proposal, "proposal") };
}
export function parseCompactionModelOutput(raw: string): {
	workingMemory: Memory;
	promotions: Promotion[];
} {
	const jsonMatch = raw.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw new Error("compaction output contains no JSON object");
	const value = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
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
export const COMPACTION_FILE_BYTE_LIMIT = 16 * 1024;
export const COMPACTION_TOTAL_BYTE_LIMIT = 48 * 1024;
const SNAPSHOT_ROLES = ["project", "todo", "decisions"] as const;
const proposalLine = /^- \{(?:project|agents|personal-agents|style|evidence|decisions|todo)\}\s+/;

export async function pendingPromotions(
	project: Pick<ResolvedProject, "canonical">,
): Promise<number> {
	try {
		return (await readFile(project.canonical.inbox, "utf8"))
			.split("\n")
			.filter((line) => proposalLine.test(line)).length;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
		throw error;
	}
}
export async function filterWorkingMemoryFiles(
	project: ResolvedProject,
	snapshotPaths: Set<string>,
	files: string[],
): Promise<string[]> {
	const result: string[] = [];
	for (const file of files) {
		if (snapshotPaths.has(file)) {
			result.push(file);
			continue;
		}
		try {
			await resolveExistingProjectPath(project.projectRoot, file);
			result.push(file);
		} catch {}
	}
	return result;
}
function clipped(value: string, limit: number) {
	const bytes = Buffer.byteLength(value, "utf8");
	if (bytes <= limit) return value;
	const marker = `\n[truncated after ${limit} bytes]`,
		available = Math.max(0, limit - Buffer.byteLength(marker, "utf8"));
	return `${Buffer.from(value).subarray(0, available).toString("utf8")}${marker}`;
}
export async function compactionSnapshot(
	project: ResolvedProject,
	state: Awaited<ReturnType<typeof checkProjectStatus>>,
) {
	const files: Array<{ path: string; content: string }> = [],
		paths = new Set<string>(),
		candidates = SNAPSHOT_ROLES.map((role) => project.canonical[role]),
		artifactPaths = (state.manifest?.artifacts ?? []).map((artifact) =>
			showPath(project.projectRoot, resolveProjectPath(project.projectRoot, artifact.path)),
		);
	let total = 0;
	for (const path of candidates) {
		const display = showPath(project.projectRoot, path);
		if (paths.has(display)) continue;
		paths.add(display);
		try {
			const content = await readFile(path, "utf8"),
				remaining = Math.max(0, COMPACTION_TOTAL_BYTE_LIMIT - total),
				limit = Math.min(COMPACTION_FILE_BYTE_LIMIT, remaining);
			if (!limit) break;
			const snapshot = clipped(content, limit);
			files.push({ path: display, content: snapshot });
			total += Buffer.byteLength(snapshot, "utf8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		}
	}
	return { files, paths: [...new Set([...paths, ...artifactPaths])] };
}

export function buildCompactionPrompt(
	event: SessionBeforeCompactEvent,
	snapshot: Awaited<ReturnType<typeof compactionSnapshot>>,
	status: Awaited<ReturnType<typeof checkProjectStatus>>,
	inboxPath: string,
) {
	const conversation = serializeConversation(
		convertToLlm([
			...event.preparation.messagesToSummarize,
			...event.preparation.turnPrefixMessages,
		]),
	);
	return `Return only valid JSON with no prose, no markdown fences, and no commentary. Return an object with workingMemory {task,constraints,active,blockers,next,files} and at most five promotions {target,proposal}. task and next must be non-empty strings; when no next action is known, set next to exactly "Await user direction." Preserve only information needed to continue. Retain continuity-critical information even when it is not current active work: unresolved alternatives; consequential negative results; failed approaches that constrain the next action; and decisions or commitments not yet represented in canonical project files. Put these in the existing workingMemory fields—constraints, active, blockers, or next—as appropriate; do not add workingMemory fields. Promotions are usually empty and are unreviewed lines in ${inboxPath}.\nPrevious summary:\n${event.preparation.previousSummary ?? "none"}\nConversation:\n${conversation}\nRelevant project files (bounded text snapshot; proposal inbox is intentionally excluded):\n${JSON.stringify(snapshot.files)}\nRelevant artifact paths (contents are not included):\n${JSON.stringify(snapshot.paths)}\nProject status:\n${JSON.stringify({ changed: status.changed, missing: status.missing, impacted: status.impacted, syncError: status.syncError })}`;
}
export async function compact(event: SessionBeforeCompactEvent, ctx: ExtensionContext) {
	try {
		if (!ctx.model) return undefined;
		const project = await resolveProject(ctx.cwd),
			status = await checkProjectStatus(ctx.cwd, project),
			snapshot = await compactionSnapshot(project, status),
			auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
		if (!auth.ok || !auth.apiKey) return undefined;
		const response = await complete(
			ctx.model,
			{
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: buildCompactionPrompt(
									event,
									snapshot,
									status,
									showPath(project.projectRoot, project.canonical.inbox),
								),
							},
						],
						timestamp: Date.now(),
					},
				],
			},
			{
				apiKey: auth.apiKey,
				...(auth.headers ? { headers: auth.headers } : {}),
				...(auth.env ? { env: auth.env } : {}),
				maxTokens: Math.min(4096, ctx.model.maxTokens),
				...(event.signal ? { signal: event.signal } : {}),
				cacheRetention: "none",
				sessionId: uuidv7(),
			},
		);
		const raw = response.content
				.filter((part) => part.type === "text")
				.map((part) => part.text)
				.join("\n"),
			output = parseCompactionModelOutput(raw),
			files = await filterWorkingMemoryFiles(
				project,
				new Set(snapshot.paths),
				output.workingMemory.files,
			);
		const memory = { ...output.workingMemory, files };
		if (output.promotions.length) {
			await mkdir(dirname(project.canonical.inbox), { recursive: true });
			await appendFile(
				project.canonical.inbox,
				`\n${output.promotions.map((item) => `- {${item.target}} ${item.proposal}`).join("\n")}\n`,
			);
		}
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
