import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import {
	dispatchWorker,
	launchPiWorker,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const project = (root) => ({
	cwd: root,
	workspaceRoot: root,
	projectRoot: root,
	syncPath: join(root, "SYNC.json"),
	canonical: {
		project: join(root, "PROJECT.md"),
		agents: join(root, "AGENTS.md"),
		style: join(root, "STYLE.md"),
		evidence: join(root, "EVIDENCE.md"),
		decisions: join(root, "DECISIONS.md"),
		todo: join(root, "TODO.md"),
		inbox: join(root, "INBOX.md"),
	},
});
const request = { task: "inspect", mode: "read-only", expectedOutput: "summary", contextFiles: [] };
const catalog = { default: "worker", models: { worker: { model: "provider/model" } } };

test("dispatch resolves explicit and configured context files", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-context-files-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const agentDir = join(root, "worker-agent");
	await writeFile(join(root, "A.md"), "a");
	await writeFile(join(root, "AGENTS.md"), "conventions");
	await writeFile(join(root, "STYLE.md"), "author voice");
	await mkdir(agentDir, { recursive: true });
	await writeFile(join(agentDir, "settings.json"), "{}\n");
	let captured;
	const outcome = await dispatchWorker({
		project: project(root),
		workerAgentDir: agentDir,
		request: { ...request, contextFiles: [{ path: "A.md", purpose: "evidence" }] },
		catalog,
		launcher: async (spec) => {
			captured = spec;
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: ["A.md"],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "done");
	assert.ok(captured.request.contextFiles.some((file) => file.path === "A.md"));
	assert.ok(
		captured.request.contextFiles.some((file) => file.purpose === "configured agents conventions"),
	);
	assert.ok(!captured.request.contextFiles.some((file) => file.path === "STYLE.md"));
	await assert.rejects(
		dispatchWorker({
			project: project(root),
			workerAgentDir: agentDir,
			request: { ...request, contextFiles: [{ path: "MISSING.md", purpose: "evidence" }] },
			catalog,
			launcher: async () => ({ exitCode: 0, stderr: "" }),
		}),
		/ENOENT/,
	);
});

test("writing workers receive package defaults and project style overrides", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-writing-style-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const agentDir = join(root, "worker-agent");
	await writeFile(join(root, "A.md"), "a");
	await mkdir(agentDir, { recursive: true });
	await writeFile(join(agentDir, "settings.json"), "{}\n");
	const resolved = project(root);
	const packageRoot = join(root, "package");
	await mkdir(join(packageRoot, "skills", "write"), { recursive: true });
	await writeFile(join(packageRoot, "skills", "write", "DEFAULT_STYLE.md"), "package defaults\n");
	await writeFile(join(root, "STYLE.md"), "project overrides\n");
	let captured;
	const outcome = await dispatchWorker({
		project: resolved,
		workerAgentDir: agentDir,
		packageRoot,
		request: { ...request, skills: ["write"] },
		catalog,
		launcher: async (spec) => {
			captured = spec;
			await writeImmutableResult(spec.resultPath, {
				status: "complete",
				summary: "done",
				files: ["A.md"],
				limitations: [],
			});
			return { exitCode: 0, stderr: "" };
		},
	});
	assert.equal(outcome.result?.summary, "done");
	assert.ok(
		captured.request.contextFiles.some((file) => file.purpose === "package writing defaults"),
	);
	assert.ok(
		captured.request.contextFiles.some(
			(file) => file.path === "STYLE.md" && file.purpose === "project writing style overrides",
		),
	);
	assert.match(captured.prompt, /Writing defaults are a baseline/);
});

test("launcher forwards an explicit thinking level to Pi", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-thinking-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const child = new EventEmitter();
	child.stdout = new PassThrough();
	child.stderr = new PassThrough();
	child.kill = () => true;
	const seen = [];
	const launched = launchPiWorker(
		{
			id: "thinking",
			request: { ...request, timeoutMs: 100, thinkingLevel: "high", contextFiles: [] },
			workerAgentDir: root,
			resultPath: join(root, "result.json"),
			projectRoot: root,
			model: "provider/model",
			prompt: "test",
			packageRoot: process.cwd(),
			extraExtensionPaths: [],
		},
		(...args) => {
			seen.push(args);
			return child;
		},
	);
	child.emit("spawn");
	child.emit("close", 0, null);
	const outcome = await launched;
	assert.equal(outcome.exitCode, 0);
	const argv = seen[0][1];
	assert.ok(argv.includes("--thinking") && argv.includes("high"));
});

test("immutable result surfaces non-conflict filesystem errors", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-immutable-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await assert.rejects(
		writeImmutableResult(join(root, `${"x".repeat(300)}.json`), {
			status: "complete",
			summary: "x",
			files: [],
			limitations: [],
		}),
		/ENAMETOOLONG/,
	);
});

test("non-manual compaction failures log instead of notifying", async (t) => {
	const { compact } = await import("../../.test-build/workbench/src/compaction.js");
	const root = await mkdtemp(join(tmpdir(), "pi-sych-auto-fail-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n## Objective\nTest\n## Current direction\nTest\n## Definition of done\nTest\n## Previous action\nTest\n## Immediate next step\nTest\n",
	);
	await writeFile(
		join(root, "SYNC.json"),
		JSON.stringify({ version: 2, confirmedAt: "now", artifacts: [] }),
	);
	const errors = [];
	const original = console.error;
	console.error = (message) => errors.push(String(message));
	try {
		const result = await compact(
			{
				reason: "auto",
				signal: new AbortController().signal,
				preparation: { messagesToSummarize: [], turnPrefixMessages: [], firstKeptEntryId: "x" },
			},
			{
				cwd: root,
				model: { maxTokens: 512 },
				modelRegistry: { getApiKeyAndHeaders: async () => ({ ok: true, apiKey: "key" }) },
				ui: {
					notify() {
						throw new Error("must not notify");
					},
				},
			},
			async () => {
				throw new Error("model unavailable");
			},
		);
		assert.equal(result, undefined);
	} finally {
		console.error = original;
	}
	assert.match(errors.join("\n"), /model unavailable/);
});
