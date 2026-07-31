import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { uuidv7 } from "@earendil-works/pi-ai";
import { complete } from "@earendil-works/pi-ai/compat";
import {
	buildSessionContext,
	convertToLlm,
	type ExtensionContext,
	type SessionBeforeCompactEvent,
	serializeConversation,
} from "@earendil-works/pi-coding-agent";
import {
	type ResolvedProject,
	resolveProject,
	resolveProjectPath,
	writeAtomicFile,
} from "./project-files.js";
import {
	checkProjectStatus,
	fingerprintFile,
	type ProjectStatusCheck,
} from "./project-status.js";
import { nonEmptyString, record, stringArray } from "./validation.js";

const MEMORY_CANONICAL_FILES = [
	"project",
	"agents",
	"style",
	"evidence",
	"decisions",
	"todo",
] as const;
const MAX_ITEMS = 12;
const MAX_TEXT = 1_000;
const EMPTY_INBOX: PromotionInbox = { version: 1, candidates: [] };

export interface WorkingMemory {
	currentTask: string;
	purpose?: string;
	completed: string[];
	successfulApproaches: string[];
	failedApproaches: string[];
	inProgress: string[];
	blockers: string[];
	criticalContext: string[];
	nextAction: string;
	relevantFiles: string[];
}

export type PromotionProposal =
	| {
			operation: "add";
			targetFile: string;
			proposedText: string;
			rationale: string;
	  }
	| {
			operation: "update";
			targetFile: string;
			existingText: string;
			proposedText: string;
			rationale: string;
	  };

export type PromotionCandidate = PromotionProposal & {
	id: string;
	createdAt: string;
};

export interface PromotionInbox {
	version: 1;
	candidates: PromotionCandidate[];
}

export interface CanonicalSnapshot {
	projectRoot: string;
	files: Array<{ path: string; content: string; fingerprint: string }>;
	allowedTargets: string[];
	absentStandardTargets: string[];
}

function text(value: unknown, label: string): string {
	const result = nonEmptyString(value, label);
	if (result.length > MAX_TEXT) throw new Error(`${label} is too long`);
	return result;
}

function list(value: unknown, label: string): string[] {
	const result = stringArray(value, label).map((item) => text(item, label));
	if (result.some((item) => /[\r\n]/.test(item)))
		throw new Error(`${label} items must be single-line`);
	if (result.length > MAX_ITEMS) throw new Error(`${label} has too many items`);
	return result;
}

function parseJson(value: string): unknown {
	const match = value.trim().match(/^```\s*json\s*\n([\s\S]*?)\n```$/i);
	return JSON.parse(match?.[1] ?? value);
}

export function validateWorkingMemory(
	value: unknown,
	existingFiles?: Set<string>,
): WorkingMemory {
	const item = record(value, "workingMemory");
	const currentTask = text(item.currentTask, "currentTask");
	const nextAction = text(item.nextAction, "nextAction");
	const relevantFiles = list(item.relevantFiles, "relevantFiles").filter(
		(path) => !existingFiles || existingFiles.has(path),
	);
	return {
		currentTask,
		...(item.purpose === undefined
			? {}
			: { purpose: text(item.purpose, "purpose") }),
		completed: list(item.completed, "completed"),
		successfulApproaches: list(
			item.successfulApproaches,
			"successfulApproaches",
		),
		failedApproaches: list(item.failedApproaches, "failedApproaches"),
		inProgress: list(item.inProgress, "inProgress"),
		blockers: list(item.blockers, "blockers"),
		criticalContext: list(item.criticalContext, "criticalContext"),
		nextAction,
		relevantFiles,
	};
}

function proposal(value: unknown): PromotionProposal {
	const item = record(value, "promotion");
	const base = {
		targetFile: text(item.targetFile, "targetFile"),
		proposedText: text(item.proposedText, "proposedText"),
		rationale: text(item.rationale, "rationale"),
	};
	if (item.operation === "add") return { operation: "add", ...base };
	if (item.operation === "update")
		return {
			operation: "update",
			...base,
			existingText: text(item.existingText, "existingText"),
		};
	throw new Error("promotion.operation must be add or update");
}

export function parseCompactionModelOutput(value: string): {
	workingMemory: WorkingMemory;
	promotions: PromotionProposal[];
} {
	const item = record(parseJson(value), "model output");
	if (!Array.isArray(item.promotions))
		throw new Error("promotions must be an array");
	if (item.promotions.length > 5)
		throw new Error("promotions has too many items");
	return {
		workingMemory: validateWorkingMemory(item.workingMemory),
		promotions: item.promotions.map(proposal),
	};
}

export function candidateId(value: PromotionProposal): string {
	const normalized = `${value.operation}\n${value.targetFile.replace(/^\.\//, "").trim()}\n${value.proposedText.replace(/\s+/g, " ").trim()}`;
	return `P-${createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`;
}

export function mergePromotionCandidates(
	existing: PromotionCandidate[],
	candidates: PromotionCandidate[],
): PromotionCandidate[] {
	const ids = new Set(existing.map((candidate) => candidate.id));
	return [
		...existing,
		...candidates.filter(
			(candidate) => !ids.has(candidate.id) && !!ids.add(candidate.id),
		),
	];
}

export function parsePromotionInbox(markdown: string): PromotionInbox {
	const fences = [...markdown.matchAll(/```\s*json\s*\n([\s\S]*?)\n```/gi)];
	if (fences.length !== 1)
		throw new Error("INBOX.md must contain one JSON fence");
	const item = record(JSON.parse(fences[0][1]), "INBOX.md");
	if (item.version !== 1 || !Array.isArray(item.candidates))
		throw new Error("INBOX.md must contain version-1 candidates");
	const candidates = item.candidates.map((value) => {
		const candidate = {
			...proposal(value),
			id: text(record(value, "candidate").id, "id"),
			createdAt: text(record(value, "candidate").createdAt, "createdAt"),
		};
		if (candidate.id !== candidateId(candidate))
			throw new Error("candidate ID does not match content");
		return candidate;
	});
	if (
		new Set(candidates.map((candidate) => candidate.id)).size !==
		candidates.length
	)
		throw new Error("INBOX.md contains duplicate candidate IDs");
	return { version: 1, candidates };
}

export function formatPromotionInbox(inbox: PromotionInbox): string {
	return `# Memory promotion inbox\n\n> Unreviewed proposals for possible updates to persistent project files.\n> Review with \`/plannotator-annotate INBOX.md\`.\n\n\`\`\`json\n${JSON.stringify(inbox, null, 2)}\n\`\`\`\n`;
}

export async function readPromotionInbox(
	project: Pick<ResolvedProject, "canonical">,
): Promise<PromotionInbox> {
	try {
		return parsePromotionInbox(await readFile(project.canonical.inbox, "utf8"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT")
			return { ...EMPTY_INBOX, candidates: [] };
		throw error;
	}
}

export async function countPromotionCandidates(
	project: Pick<ResolvedProject, "canonical">,
): Promise<number> {
	return (await readPromotionInbox(project)).candidates.length;
}

export function validatePromotion(
	value: PromotionProposal,
	canonical: Pick<CanonicalSnapshot, "allowedTargets" | "files">,
): PromotionProposal {
	if (!canonical.allowedTargets.includes(value.targetFile))
		throw new Error("promotion target is not allowed");
	const file = canonical.files.find((entry) => entry.path === value.targetFile);
	if (
		value.operation === "update" &&
		!file?.content.includes(value.existingText)
	)
		throw new Error(
			"update existingText must be an exact excerpt from its target",
		);
	if (
		value.operation === "add" &&
		file?.content
			.replace(/\s+/g, " ")
			.includes(value.proposedText.replace(/\s+/g, " "))
	)
		throw new Error("promotion text is already present");
	return value;
}

export function renderWorkingMemory(memory: WorkingMemory): string {
	const section = (title: string, values: string[]) =>
		values.length
			? `\n### ${title}\n\n${values.map((value) => `- ${value}`).join("\n")}\n`
			: "";
	return `# Working memory\n\n## Current task\n\n${memory.currentTask}${memory.purpose ? `\n\n${memory.purpose}` : ""}\n\n## Current state\n${section("Completed", memory.completed)}${section("Successful approaches", memory.successfulApproaches)}${section("Failed approaches", memory.failedApproaches)}${section("In progress", memory.inProgress)}${section("Blockers", memory.blockers)}\n## Critical context\n${memory.criticalContext.length ? `\n${memory.criticalContext.map((value) => `- ${value}`).join("\n")}\n` : "\nNone recorded.\n"}\n## Continue from here\n\n${memory.nextAction}${memory.relevantFiles.length ? `\n\n## Relevant existing files\n\n${memory.relevantFiles.map((path) => `- ${path}`).join("\n")}` : ""}\n`;
}

type SnapshotFile = CanonicalSnapshot["files"][number] & {
	absolutePath: string;
};

function displayPath(projectRoot: string, path: string): string {
	const display = relative(projectRoot, path);
	return display && !display.startsWith("..") ? display : path;
}

export async function collectCanonicalSnapshot(
	state: Pick<ProjectStatusCheck, "projectRoot" | "manifest">,
	project: Pick<ResolvedProject, "canonical">,
): Promise<CanonicalSnapshot & { files: SnapshotFile[] }> {
	const standard = MEMORY_CANONICAL_FILES.map((name) => ({
		path: displayPath(state.projectRoot, project.canonical[name]),
		absolutePath: project.canonical[name],
	}));
	const declared = (state.manifest?.artifacts ?? [])
		.filter(
			(artifact) =>
				/\.mdx?$/i.test(artifact.path) &&
				(artifact.role || artifact.authoritativeFor?.length),
		)
		.map((artifact) => ({
			path: artifact.path,
			absolutePath: resolveProjectPath(state.projectRoot, artifact.path),
		}));
	const candidates = new Map<string, { absolutePath: string }>();
	for (const entry of [...standard, ...declared])
		candidates.set(entry.path, { absolutePath: entry.absolutePath });
	const files: SnapshotFile[] = [];
	for (const [path, { absolutePath }] of candidates)
		try {
			const content = await readFile(absolutePath, "utf8");
			if (Buffer.byteLength(content) > 32 * 1024) continue;
			files.push({
				path,
				content,
				fingerprint: await fingerprintFile(absolutePath),
				absolutePath,
			});
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		}
	const allowedTargets = [
		...standard.map((entry) => entry.path),
		...declared
			.filter((entry) => files.some((file) => file.path === entry.path))
			.map((entry) => entry.path),
	];
	return {
		projectRoot: state.projectRoot,
		files,
		allowedTargets,
		absentStandardTargets: standard
			.filter((entry) => !files.some((file) => file.path === entry.path))
			.map((entry) => entry.path),
	};
}

function prompt(
	event: SessionBeforeCompactEvent,
	canonical: CanonicalSnapshot,
	inbox: PromotionInbox,
	loadedContextFiles: Array<{ path: string; content: string }>,
): string {
	const conversation = serializeConversation(
		convertToLlm([
			...event.preparation.messagesToSummarize,
			...event.preparation.turnPrefixMessages,
		]),
	);
	const recent = serializeConversation(
		convertToLlm(buildSessionContext(event.branchEntries).messages.slice(-12)),
	);
	const clip = (value: string, limit = 48_000) =>
		value.length > limit ? `${value.slice(0, limit)}\n[truncated]` : value;
	const conventions = loadedContextFiles.map((file) => ({
		path: file.path,
		content: clip(file.content, 8_000),
	}));
	return `Return JSON with workingMemory and at most five promotions. Working memory must name currentTask, completed, successfulApproaches, failedApproaches, inProgress, blockers, criticalContext, nextAction, and relevantFiles. Promotions are add/update proposals only; compare canonical contents and existing candidates, use exact existingText for updates, and do not promote already represented content.\n\nCompaction: reason=${event.reason}; retry=${event.willRetry}.\n\nPrevious summary:\n${clip(event.preparation.previousSummary ?? "none")}\n\nConversation:\n${clip(conversation)}\n\nRecent context:\n${clip(recent)}\n\nLoaded conventions:\n${JSON.stringify(conventions)}\n\nCanonical files:\n${JSON.stringify(
		canonical.files.map(({ path, content, fingerprint }) => ({
			path,
			content,
			fingerprint,
		})),
	)}\n\nAllowed targets: ${canonical.allowedTargets.join(", ")}\nAbsent standard targets: ${canonical.absentStandardTargets.join(", ") || "none"}\nExisting inbox: ${JSON.stringify(inbox.candidates)}\nInstructions: ${event.customInstructions ?? "none"}`;
}

type Complete = typeof complete;

export async function createWorkingMemoryCompaction(
	event: SessionBeforeCompactEvent,
	ctx: ExtensionContext,
	loadedContextFiles: Array<{ path: string; content: string }> = [],
	dependencies: { complete?: Complete } = {},
) {
	try {
		if (!ctx.model) return undefined;
		const project = await resolveProject(ctx.cwd);
		const state = await checkProjectStatus(ctx.cwd);
		const canonical = await collectCanonicalSnapshot(state, project);
		const inbox = await readPromotionInbox(project);
		const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
		if (!auth.ok || !auth.apiKey) return undefined;
		const response = await (dependencies.complete ?? complete)(
			ctx.model,
			{
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: prompt(event, canonical, inbox, loadedContextFiles),
							},
						],
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
			.filter((entry) => entry.type === "text")
			.map((entry) => entry.text)
			.join("\n");
		const output = parseCompactionModelOutput(raw);
		const memory = validateWorkingMemory(
			output.workingMemory,
			new Set(canonical.files.map((file) => file.path)),
		);
		const additions = output.promotions
			.map((entry) => validatePromotion(entry, canonical))
			.map((entry) => ({
				...entry,
				id: candidateId(entry),
				createdAt: new Date().toISOString(),
			}));
		const unchanged = await Promise.all(
			canonical.files.map(
				async (file) => (await fingerprintFile(file.path)) === file.fingerprint,
			),
		);
		const merged = mergePromotionCandidates(inbox.candidates, additions);
		if (additions.length && unchanged.every(Boolean))
			await writeAtomicFile(
				project.canonical.inbox,
				formatPromotionInbox({ version: 1, candidates: merged }),
			);
		const pendingPromotions =
			additions.length && unchanged.every(Boolean)
				? merged.length
				: inbox.candidates.length;
		ctx.ui.notify(
			`Working-memory compaction complete. ${displayPath(state.projectRoot, project.canonical.inbox)} has ${pendingPromotions} pending memory proposals.`,
			"info",
		);
		return {
			compaction: {
				summary: renderWorkingMemory(memory),
				firstKeptEntryId: event.preparation.firstKeptEntryId,
				tokensBefore: event.preparation.tokensBefore,
				usage: response.usage,
				details: {
					kind: "pi-sych-working-memory",
					version: 1,
					reason: event.reason,
					willRetry: event.willRetry,
					inboxPath: displayPath(state.projectRoot, project.canonical.inbox),
					pendingPromotions,
					addedPromotionIds: additions.map((entry) => entry.id),
					canonicalFingerprints: Object.fromEntries(
						canonical.files.map((file) => [file.path, file.fingerprint]),
					),
				},
			},
		};
	} catch {
		return undefined;
	}
}
