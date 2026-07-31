import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
	DEFAULT_CANONICAL_PATHS,
	parseEvidenceEntries,
	parseSyncManifest,
	resolveExistingProjectPath,
	resolveProject,
	validateProjectMarkdown,
	writeApprovedFile,
} from "../../.test-build/workbench/src/project-files.js";

const execFile = promisify(execFileCallback);

async function writeSync(directory, overrides = {}) {
	await writeFile(
		join(directory, "SYNC.json"),
		`${JSON.stringify(
			{
				version: 2,
				confirmedAt: "2026-01-01T00:00:00.000Z",
				artifacts: [],
				...overrides,
			},
			null,
			2,
		)}\n`,
	);
}

test("resolver selects the nearest v2 manifest and resolves canonical paths", async () => {
	const workspace = await mkdtemp(join(tmpdir(), "pi-sych-resolve-"));
	await execFile("git", ["init", "-q", workspace]);
	const cwd = join(workspace, "packages", "b", "app", "src");
	await mkdir(cwd, { recursive: true });
	await writeSync(workspace);
	await writeSync(join(workspace, "packages", "b"), {
		projectRoot: "app",
		canonical: {
			style: "config/STYLE.md",
			evidence: join(tmpdir(), "external-evidence.md"),
		},
	});
	const resolved = await resolveProject(cwd);
	assert.equal(resolved.workspaceRoot, workspace);
	assert.equal(
		resolved.syncPath,
		join(workspace, "packages", "b", "SYNC.json"),
	);
	assert.equal(resolved.projectRoot, join(workspace, "packages", "b", "app"));
	assert.equal(
		resolved.canonical.style,
		join(resolved.projectRoot, "config/STYLE.md"),
	);
	assert.equal(
		resolved.canonical.evidence,
		join(tmpdir(), "external-evidence.md"),
	);
	assert.equal(
		resolved.canonical.project,
		join(resolved.projectRoot, DEFAULT_CANONICAL_PATHS.project),
	);
});

test("v2 manifest rejects malformed canonical paths", () => {
	assert.throws(
		() =>
			parseSyncManifest(
				'{"version":2,"confirmedAt":"2026-01-01T00:00:00.000Z","artifacts":[],"canonical":{"style":42}}',
			),
		/canonical\.style must be a non-empty string/,
	);
});

test("resolver falls back to a non-Git working directory", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-sych-resolve-non-git-"));
	await writeSync(cwd, { projectRoot: "project" });
	const resolved = await resolveProject(cwd);
	assert.equal(resolved.workspaceRoot, cwd);
	assert.equal(resolved.projectRoot, join(cwd, "project"));
	assert.equal(resolved.manifest?.version, 2);
});

test("existing project paths reject symlink escapes", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-path-"));
	const outside = join(tmpdir(), `pi-sych-outside-${Date.now()}.md`);
	await writeFile(outside, "outside\n");
	await symlink(outside, join(root, "escape.md"));
	await assert.rejects(
		resolveExistingProjectPath(root, "escape.md"),
		/Project artifact path leaves the project root/,
	);
});

test("PROJECT.md validation is shallow but requires operative headings", () => {
	const valid = validateProjectMarkdown(
		"# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n## Previous action\nNone yet.\n## Immediate next step\nNone at present.\n",
	);
	assert.equal(valid.valid, true);
	const invalid = validateProjectMarkdown("# Notes\n\n## Objective\nX\n");
	assert.equal(invalid.valid, false);
	assert.match(invalid.errors.join("\n"), /Current direction/);
	assert.match(invalid.errors.join("\n"), /Previous action/);
	assert.match(invalid.errors.join("\n"), /Immediate next step/);
});

test("evidence helpers extract bounded entry metadata", () => {
	const entries = parseEvidenceEntries(
		`# Evidence\n\n## E-014 — A finding\n\n**Status:** supported\n**Kind:** empirical result\n**Source:** outputs/model.html\n\n## E-015 - A limitation\n\n**Status:** unresolved\n`,
	);
	assert.deepEqual(entries, [
		{
			id: "E-014",
			title: "A finding",
			status: "supported",
			kind: "empirical result",
			source: "outputs/model.html",
		},
		{
			id: "E-015",
			title: "A limitation",
			status: "unresolved",
			kind: undefined,
			source: undefined,
		},
	]);
});

test("approved writes are atomic and unapproved writes do not mutate", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-write-"));
	const target = join(root, "PROJECT.md");
	await writeFile(target, "before\n");
	await assert.rejects(
		writeApprovedFile(target, "blocked\n", false),
		/explicit approval/,
	);
	assert.equal(await readFile(target, "utf8"), "before\n");
	await writeApprovedFile(target, "after\n", true);
	assert.equal(await readFile(target, "utf8"), "after\n");
});

// Characterization cases for the approved v2.1.0 compaction helpers. These
// remain deliberately at the file/model boundary; no credentials are needed.
async function compaction() {
	return import("../../.test-build/workbench/src/compaction.js");
}

const workingMemory = {
	currentTask: "Add working-memory compaction.",
	purpose: "Preserve current task state.",
	completed: ["Read the approved plan."],
	successfulApproaches: ["Use bounded structured state."],
	failedApproaches: [],
	inProgress: ["Write characterization tests."],
	blockers: [],
	criticalContext: ["INBOX.md remains human-review proposal state."],
	nextAction: "Implement compact helpers.",
	relevantFiles: ["PROJECT.md", "missing.md"],
};

const add = {
	operation: "add",
	target: "todo",
	proposedText: "Keep accepted tasks in TODO.md.",
	rationale: "This is durable task state.",
};

test("promotion inbox parses and formats one fenced JSON object, and a missing inbox is empty", async () => {
	const {
		candidateId,
		countPromotionCandidates,
		formatPromotionInbox,
		parsePromotionInbox,
		readPromotionInbox,
	} = await compaction();
	const inbox = {
		version: 1,
		candidates: [
			{ ...add, id: candidateId(add), createdAt: "2026-01-01T00:00:00.000Z" },
		],
	};
	const markdown = formatPromotionInbox(inbox);
	assert.match(markdown, /^# Memory promotion inbox/m);
	assert.deepEqual(parsePromotionInbox(markdown), inbox);
	const root = await mkdtemp(join(tmpdir(), "pi-sych-inbox-"));
	await writeSync(root, { canonical: { inbox: ".pi-sych/INBOX.md" } });
	const project = await resolveProject(root);
	assert.deepEqual(await readPromotionInbox(project), {
		version: 1,
		candidates: [],
	});
	assert.equal(await countPromotionCandidates(project), 0);
	await mkdir(join(root, ".pi-sych"));
	await writeFile(project.canonical.inbox, markdown);
	assert.equal(await countPromotionCandidates(project), 1);
});

test("candidate IDs use canonical roles and deduplicate without reordering existing proposals", async () => {
	const { candidateId, mergePromotionCandidates } = await compaction();
	const update = {
		operation: "update",
		target: "decisions",
		existingText: "Candidates are reviewed.",
		proposedText: "Candidates are reviewed by a human.",
		rationale: "Record the boundary.",
	};
	assert.notEqual(candidateId(add), candidateId({ ...add, target: "project" }));
	assert.match(candidateId(add), /^P-[a-f0-9]{12}$/);
	const first = {
		...add,
		id: candidateId(add),
		createdAt: "2026-01-01T00:00:00.000Z",
	};
	const second = {
		...update,
		id: candidateId(update),
		createdAt: "2026-01-02T00:00:00.000Z",
	};
	assert.deepEqual(mergePromotionCandidates([first], [first, second]), [
		first,
		second,
	]);
});

test("model output accepts direct or json-fenced JSON and rejects invalid working memory", async () => {
	const { parseCompactionModelOutput } = await compaction();
	const output = { workingMemory, promotions: [add] };
	assert.deepEqual(parseCompactionModelOutput(JSON.stringify(output)), output);
	assert.deepEqual(
		parseCompactionModelOutput(`\`\`\`json\n${JSON.stringify(output)}\n\`\`\``),
		output,
	);
	assert.throws(
		() => parseCompactionModelOutput("```\n{}\n```"),
		/json fence|JSON/i,
	);
	assert.throws(
		() =>
			parseCompactionModelOutput(
				JSON.stringify({ workingMemory: {}, promotions: [] }),
			),
		/currentTask|nextAction/i,
	);
	const { target: _target, ...legacyPromotion } = add;
	assert.throws(
		() =>
			parseCompactionModelOutput(
				JSON.stringify({
					workingMemory,
					promotions: [{ ...legacyPromotion, targetFile: "TODO.md" }],
				}),
			),
		/target/i,
	);
	assert.throws(
		() =>
			parseCompactionModelOutput(
				JSON.stringify({
					workingMemory,
					promotions: [{ ...add, target: "agents" }],
				}),
			),
		/recommendedScope/i,
	);
});

test("working memory validates fields, filters absent relevant files, and renders only nonempty sections", async () => {
	const { renderWorkingMemory, validateWorkingMemory } = await compaction();
	const validated = validateWorkingMemory(
		workingMemory,
		new Set(["PROJECT.md"]),
	);
	assert.deepEqual(validated.relevantFiles, ["PROJECT.md"]);
	const rendered = renderWorkingMemory(validated);
	assert.match(rendered, /^# Working memory/m);
	assert.match(rendered, /### Completed\n\n- Read the approved plan\./);
	assert.match(rendered, /## Relevant existing files\n\n- PROJECT\.md/);
	assert.doesNotMatch(rendered, /### Failed approaches|### Blockers/);
	assert.throws(
		() =>
			validateWorkingMemory({ ...workingMemory, nextAction: "" }, new Set()),
		/nextAction/i,
	);
});

test("promotion validation requires an allowed target and an exact update excerpt", async () => {
	const { validatePromotion } = await compaction();
	const canonical = {
		targetPaths: { todo: "TODO.md", decisions: "DECISIONS.md" },
		files: [{ path: "DECISIONS.md", content: "Candidates are reviewed.\n" }],
	};
	const update = {
		operation: "update",
		target: "decisions",
		existingText: "Candidates are reviewed.",
		proposedText: "Candidates are reviewed by a human.",
		rationale: "Record the boundary.",
	};
	assert.deepEqual(validatePromotion(add, canonical), add);
	assert.deepEqual(validatePromotion(update, canonical), update);
	assert.throws(
		() => validatePromotion({ ...update, existingText: "missing" }, canonical),
		/exact|existingText/i,
	);
	assert.throws(
		() => validatePromotion({ ...add, target: "notes" }, canonical),
		/target/i,
	);
});

test("canonical snapshots use configured paths and admit only declared authoritative Markdown", async () => {
	const { collectCanonicalSnapshot, validatePromotion } = await compaction();
	const root = await mkdtemp(join(tmpdir(), "pi-sych-canonical-"));
	await writeSync(root, {
		canonical: {
			decisions: "memory/DECISIONS.md",
			todo: "planning/TODO.md",
		},
	});
	await mkdir(join(root, "memory"));
	await writeFile(join(root, "memory", "DECISIONS.md"), "# Decisions\n");
	await writeFile(join(root, "PLAN.md"), "# Plan\n");
	const project = await resolveProject(root);
	const snapshot = await collectCanonicalSnapshot(
		{
			projectRoot: root,
			manifest: {
				artifacts: [
					{ path: "PLAN.md", role: "plan" },
					{ path: "notes.txt", role: "notes" },
				],
			},
		},
		project,
	);
	assert.deepEqual(snapshot.targetPaths, {
		project: "PROJECT.md",
		agents: "AGENTS.md",
		style: "STYLE.md",
		evidence: "EVIDENCE.md",
		decisions: "memory/DECISIONS.md",
		todo: "planning/TODO.md",
	});
	assert.ok(snapshot.absentStandardTargets.includes("PROJECT.md"));
	assert.ok(snapshot.files.some((file) => file.path === "PLAN.md"));
	assert.equal(
		snapshot.files.some((file) => file.path === "notes.txt"),
		false,
	);
	assert.deepEqual(
		validatePromotion(
			{ ...add, target: "decisions", proposedText: "Record a decision." },
			snapshot,
		),
		{ ...add, target: "decisions", proposedText: "Record a decision." },
	);
});

test("project status projection is bounded and preserves actionable findings", async () => {
	const { projectStatusProjection } = await compaction();
	const projection = projectStatusProjection({
		changed: Array.from({ length: 14 }, (_, index) => `changed-${index}`),
		missing: ["missing.md"],
		impacted: [{ path: "dependent.md", from: ["changed.md"], direct: true }],
		cycles: [["a.md", "b.md", "a.md"]],
		projectErrors: ["missing required heading"],
		syncError: "manifest needs review",
	});
	assert.equal(projection.changed.length, 12);
	assert.deepEqual(projection.missing, ["missing.md"]);
	assert.deepEqual(projection.impacted, [
		{ path: "dependent.md", from: ["changed.md"], direct: true },
	]);
	assert.equal(projection.syncError, "manifest needs review");
});

test("malformed inbox inspection reports the error without losing project compaction state", async () => {
	const { inspectPromotionInbox } = await compaction();
	const root = await mkdtemp(join(tmpdir(), "pi-sych-bad-inbox-"));
	await writeSync(root);
	const project = await resolveProject(root);
	await writeFile(project.canonical.inbox, "not an inbox");
	const inspection = await inspectPromotionInbox(project);
	assert.equal(inspection.count, undefined);
	assert.match(inspection.error, /JSON fence/);
});

test("compaction failures have actionable classifications", async () => {
	const { classifyCompactionFailure } = await compaction();
	assert.equal(
		classifyCompactionFailure(new Error("promotions must be an array"))
			.classification,
		"model-output",
	);
	assert.equal(
		classifyCompactionFailure(new Error("no credentials available"))
			.classification,
		"authentication",
	);
	assert.equal(
		classifyCompactionFailure(new Error("SYNC.json is invalid")).classification,
		"project",
	);
});

test("compaction includes project status and continues when the inbox is malformed", async () => {
	const { createWorkingMemoryCompaction } = await compaction();
	const root = await mkdtemp(join(tmpdir(), "pi-sych-compact-inbox-"));
	await writeSync(root, {
		artifacts: [
			{
				path: "src/app.ts",
				fingerprint: `sha256:${"0".repeat(64)}`,
				status: "current",
			},
		],
	});
	await writeFile(join(root, "INBOX.md"), "malformed inbox");
	let modelPrompt = "";
	const result = await createWorkingMemoryCompaction(
		{
			preparation: {
				messagesToSummarize: [],
				turnPrefixMessages: [],
				firstKeptEntryId: "keep",
				tokensBefore: 1,
			},
			branchEntries: [],
			reason: "manual",
			willRetry: false,
			signal: new AbortController().signal,
		},
		{
			cwd: root,
			model: { maxTokens: 4096 },
			modelRegistry: {
				getApiKeyAndHeaders: async () => ({
					ok: true,
					apiKey: "test",
					headers: {},
					env: {},
				}),
			},
			ui: { notify() {} },
		},
		[],
		{
			complete: async (_model, request) => {
				modelPrompt = request.messages[0].content[0].text;
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								workingMemory: {
									...workingMemory,
									relevantFiles: ["src/app.ts"],
								},
								promotions: [],
							}),
						},
					],
					usage: {},
				};
			},
		},
	);
	assert.match(modelPrompt, /Project status:/);
	assert.match(modelPrompt, /"missingCore"|"projectErrors"/);
	assert.match(result.compaction.summary, /src\/app\.ts/);
	assert.match(result.compaction.details.inbox.error, /JSON fence/);
	assert.equal(result.compaction.details.inbox.persistence, "skipped");
});
