import assert from "node:assert/strict";
import { hash } from "node:crypto";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";
import piSychWorkbench, { SUPERVISOR_GUIDANCE } from "../../.test-build/workbench/index.js";
import { DEFAULT_CONFIG } from "../../.test-build/workbench/src/config-directory.js";

const projectMarkdown = `# Test project

## Objective
Test the workbench.

## Current direction
Tests.

## Definition of done
Handlers pass.

## Previous action
Created fixture.

## Immediate next step
Run tests.
`;

async function workbenchFixture() {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-real-workbench-"));
	const configDir = join(root, ".pi", "pi-sych");
	await mkdir(join(configDir, "worker-agent"), { recursive: true });
	await mkdir(join(configDir, "mcp"), { recursive: true });
	await writeFile(join(root, "PROJECT.md"), projectMarkdown);
	await writeFile(join(root, "AGENTS.md"), "Prefer fixture-local evidence.\n");
	await writeFile(join(root, "A.md"), "tracked\n");
	await writeFile(
		join(root, "SYNC.json"),
		`${JSON.stringify(
			{
				version: 2,
				confirmedAt: "2025-01-01T00:00:00.000Z",
				artifacts: [
					{
						path: "A.md",
						fingerprint: `sha256:${hash("sha256", "tracked\n", "hex")}`,
						status: "current",
					},
				],
			},
			null,
			2,
		)}\n`,
	);
	await writeFile(
		join(configDir, "config.json"),
		`${JSON.stringify(
			{
				...DEFAULT_CONFIG,
				compaction: { custom: false, compactAt100k: true },
			},
			null,
			2,
		)}\n`,
	);
	await writeFile(join(configDir, "worker-agent", "settings.json"), "{}\n");
	await writeFile(
		join(configDir, "models.json"),
		`${JSON.stringify({
			default: "fixture",
			models: {
				fixture: { model: "provider/model", cost: "low", notes: "deterministic" },
			},
		})}\n`,
	);
	await writeFile(
		join(configDir, "mcp", "mcporter.json"),
		`${JSON.stringify({ servers: { fixture: { command: "unused" } } })}\n`,
	);
	const bin = join(root, "bin");
	await mkdir(bin);
	const fakePi = join(bin, "pi");
	await writeFile(
		fakePi,
		`#!/usr/bin/env node
const { writeFileSync } = require("node:fs");
writeFileSync(process.env.PI_SYCH_RESULT_PATH, JSON.stringify({
  status: "partial",
  summary: "fixture worker",
  files: ["A.md"],
  limitations: ["fake launcher"]
}) + "\\n");
`,
	);
	await chmod(fakePi, 0o755);
	return { root, configDir, bin };
}

test("real workbench registers and runs only its supervisor surface", async (t) => {
	const fixture = await workbenchFixture();
	const previousCwd = process.cwd();
	const previousPath = process.env.PATH;
	process.chdir(fixture.root);
	process.env.PATH = `${fixture.bin}${delimiter}${previousPath ?? ""}`;
	t.after(async () => {
		process.chdir(previousCwd);
		if (previousPath === undefined) delete process.env.PATH;
		else process.env.PATH = previousPath;
		await rm(fixture.root, { recursive: true, force: true });
	});

	const tools = [];
	const commands = new Map();
	const events = new Map();
	await piSychWorkbench({
		on(name, handler) {
			events.set(name, handler);
		},
		registerTool(tool) {
			tools.push(tool);
		},
		registerCommand(name, command) {
			commands.set(name, command);
		},
	});
	assert.deepEqual(
		tools.map((tool) => tool.name),
		["dispatch_worker", "project_status"],
	);
	assert.deepEqual([...commands.keys()], ["pi-sych-status", "pi-sych-mcp"]);
	assert.deepEqual([...events.keys()], ["before_agent_start", "session_before_compact"]);

	const compactCalls = [];
	const lifecycleContext = (tokens) => ({
		cwd: fixture.root,
		getContextUsage: () => ({ tokens }),
		compact: () => compactCalls.push(tokens),
	});
	const before = events.get("before_agent_start");
	const below = await before({ systemPrompt: "base system" }, lifecycleContext(99_999));
	assert.equal(compactCalls.length, 0);
	assert.equal(
		below.systemPrompt,
		`base system\n\n${SUPERVISOR_GUIDANCE}\n\nConfigured project instructions (AGENTS.md):\nPrefer fixture-local evidence.\n\nWorker model catalog (choose a role by judgment):\n- fixture: low; deterministic`,
	);
	await before({ systemPrompt: "base system" }, lifecycleContext(100_000));
	assert.deepEqual(compactCalls, [100_000]);
	const deduplicated = await before(
		{ systemPrompt: "base system\nPrefer fixture-local evidence." },
		lifecycleContext(null),
	);
	assert.equal(deduplicated.systemPrompt.match(/Prefer fixture-local evidence\./g)?.length, 1);
	assert.doesNotMatch(deduplicated.systemPrompt, /Configured project instructions/);

	const modelCatalogPath = join(fixture.configDir, "models.json");
	await rm(modelCatalogPath);
	const withoutCatalog = await before({ systemPrompt: "base system" }, lifecycleContext(0));
	assert.doesNotMatch(withoutCatalog.systemPrompt, /Worker model catalog/);
	assert.equal(
		await events.get("session_before_compact")({ preparation: {} }, lifecycleContext(0)),
		undefined,
	);
	await writeFile(
		modelCatalogPath,
		`${JSON.stringify({ default: "fixture", models: { fixture: { model: "provider/model" } } })}\n`,
	);

	const notifications = [];
	const handlerContext = {
		cwd: fixture.root,
		ui: { notify: (message, type) => notifications.push({ message, type }) },
	};
	const statusTool = tools.find((tool) => tool.name === "project_status");
	const checked = await statusTool.execute(
		"status-check",
		{ action: "check" },
		undefined,
		undefined,
		handlerContext,
	);
	const expectedStatus = `Project status

Root: ${fixture.root}

All tracked files match their recorded hashes.

A changed hash establishes changed content, not conceptual drift or authority.`;
	assert.equal(checked.content[0].text, expectedStatus);
	assert.deepEqual(checked.details.changed, []);
	assert.equal(checked.details.pendingPromotions, 0);

	const acknowledged = await statusTool.execute(
		"status-acknowledge",
		{ action: "acknowledge", files: ["A.md"], reason: "reviewed fixture" },
		undefined,
		undefined,
		handlerContext,
	);
	assert.equal(acknowledged.content[0].text, "Acknowledged:\n- A.md");
	assert.equal(acknowledged.details.acknowledged[0].acknowledgement.reason, "reviewed fixture");
	assert.deepEqual(acknowledged.details.needsReview, []);

	await commands.get("pi-sych-status").handler("", handlerContext);
	assert.deepEqual(notifications.at(-1), { message: expectedStatus, type: "info" });
	await commands.get("pi-sych-mcp").handler("", handlerContext);
	assert.equal(notifications.at(-1).type, "info");
	assert.match(
		notifications.at(-1).message,
		new RegExp(
			`^Pi Sych MCPorter diagnostics\\nextension: (?:available|unavailable)\\nconfig: ${join(fixture.configDir, "mcp", "mcporter.json").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(present\\)\\nservers: fixture$`,
		),
	);

	await mkdir(join(fixture.root, "INBOX.md"));
	await commands.get("pi-sych-status").handler("", handlerContext);
	assert.equal(notifications.at(-1).type, "error");
	assert.match(notifications.at(-1).message, /EISDIR|directory/);

	const dispatchTool = tools.find((tool) => tool.name === "dispatch_worker");
	const dispatched = await dispatchTool.execute(
		"dispatch",
		{
			task: "run fixture worker",
			mode: "read-only",
			expectedOutput: "fixture result",
			contextFiles: [],
		},
		undefined,
		undefined,
		handlerContext,
	);
	assert.equal(
		dispatched.content[0].text,
		"Worker status: partial\nSummary: fixture worker\n\nFiles:\n- A.md\n\nLimitations:\n- fake launcher",
	);
	assert.equal(dispatched.details.result.status, "partial");
	assert.equal(dispatched.details.launch.exitCode, 0);
});
