import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import piSychWorkbench, {
	formatDispatchWorkerOutcome,
	formatSubmitPlanResult,
	PACKAGE_ROOT,
	SUPERVISOR_GUIDANCE,
} from "../../.test-build/workbench/index.js";
import {
	openPlanReview,
	parseCodeReviewArgs,
	plannotatorUnavailable,
} from "../../.test-build/workbench/src/plannotator.js";
import packageJson from "../../package.json" with { type: "json" };

test("parseCodeReviewArgs accepts provider flags and PR URLs only", () => {
	assert.deepEqual(parseCodeReviewArgs(""), {
		prUrl: undefined,
		vcsType: undefined,
		useLocal: true,
	});
	assert.deepEqual(
		parseCodeReviewArgs('--gitbutler --no-local "https://example.test/pr/1"'),
		{
			prUrl: "https://example.test/pr/1",
			vcsType: "gitbutler",
			useLocal: false,
		},
	);
	assert.equal(parseCodeReviewArgs("not-a-url --git").prUrl, undefined);
	assert.equal(parseCodeReviewArgs("not-a-url --git").vcsType, "git");
});

test("minimal supervisor surface exposes only mechanical tools and retained human commands", () => {
	const tools = [];
	const commands = [];
	piSychWorkbench({
		on() {},
		registerTool(tool) {
			tools.push(tool);
		},
		registerCommand(name) {
			commands.push(name);
		},
	});
	assert.deepEqual(tools.map((tool) => tool.name).sort(), [
		"dispatch_worker",
		"project_status",
		"submit_plan",
	]);
	assert.deepEqual(commands.sort(), [
		"pi-sych-mcp",
		"pi-sych-status",
		"plannotator-annotate",
		"plannotator-last",
		"plannotator-review",
	]);
	assert.equal(commands.includes("plannotator"), false);
	assert.match(SUPERVISOR_GUIDANCE, /90 seconds/);
	assert.match(SUPERVISOR_GUIDANCE, /not conceptual drift/);
});

test("tool content formatters include bounded worker and plan result details", () => {
	const workerContent = formatDispatchWorkerOutcome({
		identity: { taskId: "task", runId: "run" },
		model: "test/model",
		attempts: 1,
		timeoutMs: 100,
		launch: {
			exitCode: 1,
			stdout: "",
			stderr: "",
			terminationSignal: "SIGTERM",
		},
		result: {
			schemaVersion: 1,
			taskId: "task",
			runId: "run",
			status: "partial",
			summary: "Useful partial work.",
			artifacts: [{ path: "result.md", kind: "report" }],
			changedFiles: ["result.md"],
			resultPackage: "inline",
			limitations: ["No network."],
		},
	});
	assert.match(workerContent, /Worker status: partial/);
	assert.match(workerContent, /Artifacts:\n- result\.md \(report\)/);
	assert.match(workerContent, /Changed files:\n- result\.md/);
	assert.match(workerContent, /Result package: inline/);
	assert.match(workerContent, /Limitations:\n- No network/);
	assert.match(
		workerContent,
		/Process warning: abnormal exit; exit code 1; signal SIGTERM/,
	);
	const planContent = formatSubmitPlanResult(
		{
			mode: "browser",
			approved: false,
			savedPath: "plans/revised.md",
			feedback: "Add checks.",
		},
		"plans/revised.md",
	);
	assert.match(planContent, /Plan requires revision/);
	assert.match(planContent, /Saved path: plans\/revised\.md/);
	assert.match(planContent, /Feedback: Add checks/);
});

test("public manifest retains the package boundary and developer tooling", () => {
	assert.equal(packageJson.name, "pi-sych");
	assert.equal(packageJson.version, "2.1.0");
	assert.equal(PACKAGE_ROOT, process.cwd());
	assert.equal(packageJson.devDependencies.typescript, "latest");
	assert.equal(packageJson.devDependencies["@biomejs/biome"], "latest");
	assert.equal(
		packageJson.devDependencies["@earendil-works/pi-coding-agent"],
		"latest",
	);
	assert.equal(packageJson.dependencies["@plannotator/pi-extension"], "latest");
	assert.equal(packageJson.dependencies["pi-mcporter"], "latest");
	assert.deepEqual(packageJson.pi.extensions, [
		"./extensions/workbench/index.ts",
	]);
	assert.equal(packageJson.files.includes("CHANGELOG.md"), true);
	assert.equal(packageJson.files.includes("docs"), true);
	assert.equal(packageJson.files.includes("AGENTS.md"), true);
	assert.equal(packageJson.files.includes("ARCHITECTURE.md"), true);
	assert.equal(packageJson.files.includes("scripts/format-markdown.mjs"), true);
	assert.equal(
		packageJson.pi.image,
		"https://unpkg.com/pi-sych@2.1.0/docs/img/architecture.png",
	);
});

test("release pipeline checks style before publishing", () => {
	const releaseConfig = readFileSync(
		new URL("../../.gitlab-ci.yml", import.meta.url),
		"utf8",
	);
	assert.match(releaseConfig, /npm run style/);
	assert.match(releaseConfig, /npm run source:budget/);
	assert.match(releaseConfig, /npm publish --provenance/);
});

test("supervisor guidance stays concise and states the accepted routing policies", () => {
	assert.ok(SUPERVISOR_GUIDANCE.split(/\s+/).length <= 140);
	assert.ok(SUPERVISOR_GUIDANCE.includes(`${PACKAGE_ROOT}/README.md`));
	assert.match(SUPERVISOR_GUIDANCE, /independent read-only worker/i);
	assert.match(SUPERVISOR_GUIDANCE, /long|lengthy|consequential/i);
	assert.match(SUPERVISOR_GUIDANCE, /submit_plan/i);
	assert.match(SUPERVISOR_GUIDANCE, /do not edit concurrently/i);
});

test("Plannotator commands use a concise unavailable error", () => {
	assert.equal(
		plannotatorUnavailable().message,
		"Plannotator unavailable; ensure its integration is installed",
	);
});

test("file plan review remains pending and tells the user how to resume", async () => {
	const fallback = await openPlanReview({}, "# Plan", "PLAN.md", async () => {
		throw new Error("Plannotator unavailable");
	});
	assert.deepEqual(fallback, {
		mode: "file",
		pending: true,
		savedPath: "PLAN.md",
	});
	const content = formatSubmitPlanResult(
		{ mode: "file", pending: true, savedPath: "PLAN.md" },
		"PLAN.md",
	);
	assert.match(
		content,
		/Plan ready at PLAN\.md\. Review or edit it, then reply with your comments and @PLAN\.md\./,
	);
	assert.doesNotMatch(content, /requires revision|approved/i);
});

test("pending promotion status includes the human review command only when nonzero", async () => {
	const { formatProjectStatusCheck } = await import(
		"../../.test-build/workbench/src/project-status.js"
	);
	const state = {
		projectRoot: "/project",
		syncPath: "/project/SYNC.md",
		artifacts: [],
		changed: [],
		missing: [],
		impacted: [],
		cycles: [],
		missingCore: [],
		projectErrors: [],
	};
	assert.doesNotMatch(
		formatProjectStatusCheck(state, 0),
		/Pending memory proposals/,
	);
	assert.match(
		formatProjectStatusCheck(state, 2),
		/Pending memory proposals: 2/,
	);
	assert.match(
		formatProjectStatusCheck(state, 2),
		/\/plannotator-annotate INBOX\.md/,
	);
});

// The compaction boundary is injected so these extension-level cases never
// contact a provider or depend on browser/authentication configuration.
function compactEvent() {
	return {
		preparation: {
			messagesToSummarize: [],
			turnPrefixMessages: [],
			previousSummary: "Earlier state.",
			firstKeptEntryId: "keep-1",
			tokensBefore: 99,
		},
		branchEntries: [],
		customInstructions: "Keep it concise.",
		reason: "manual",
		willRetry: false,
		signal: new AbortController().signal,
	};
}

function compactContext(
	root,
	auth = async () => ({ ok: true, apiKey: "fake", headers: {}, env: {} }),
) {
	return {
		cwd: root,
		model: { maxTokens: 4096 },
		modelRegistry: { getApiKeyAndHeaders: auth },
		ui: { notify() {} },
	};
}

test("custom compaction falls back to Pi's standard compactor when unavailable, authentication fails, or output is malformed", async () => {
	const { createWorkingMemoryCompaction } = await import(
		"../../.test-build/workbench/src/compaction.js"
	);
	const root = process.cwd();
	const unavailable = await createWorkingMemoryCompaction(
		compactEvent(),
		{ ...compactContext(root), model: undefined },
		[],
		{},
	);
	assert.equal(unavailable, undefined);
	const denied = await createWorkingMemoryCompaction(
		compactEvent(),
		compactContext(root, async () => {
			throw new Error("no credentials");
		}),
		[],
		{},
	);
	assert.equal(denied, undefined);
	const malformed = await createWorkingMemoryCompaction(
		compactEvent(),
		compactContext(root),
		[],
		{
			complete: async () => ({
				content: [{ type: "text", text: "not JSON" }],
				usage: { inputTokens: 1 },
			}),
		},
	);
	assert.equal(malformed, undefined);
});

test("custom compaction retains Pi metadata and reports pending proposals without a browser", async () => {
	const { createWorkingMemoryCompaction } = await import(
		"../../.test-build/workbench/src/compaction.js"
	);
	const result = await createWorkingMemoryCompaction(
		compactEvent(),
		compactContext(process.cwd()),
		[],
		{
			complete: async () => ({
				content: [
					{
						type: "text",
						text: JSON.stringify({
							workingMemory: {
								currentTask: "Continue testing.",
								completed: [],
								successfulApproaches: [],
								failedApproaches: [],
								inProgress: [],
								blockers: [],
								criticalContext: [],
								nextAction: "Run tests.",
								relevantFiles: [],
							},
							promotions: [],
						}),
					},
				],
				usage: { inputTokens: 7, outputTokens: 3 },
			}),
		},
	);
	assert.equal(result.compaction.firstKeptEntryId, "keep-1");
	assert.equal(result.compaction.tokensBefore, 99);
	assert.deepEqual(result.compaction.usage, {
		inputTokens: 7,
		outputTokens: 3,
	});
	assert.equal(result.compaction.details.pendingPromotions, 0);

	const { checkProjectStatus, formatProjectStatusCheck } = await import(
		"../../.test-build/workbench/src/project-status.js"
	);
	const status = await checkProjectStatus(process.cwd());
	assert.match(
		formatProjectStatusCheck(status, 2),
		/Pending memory proposals: 2/,
	);
	assert.match(
		formatProjectStatusCheck(status, 2),
		/\/plannotator-annotate INBOX\.md/,
	);
});
