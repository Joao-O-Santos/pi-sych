import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import piSychWorkbench, {
	formatDispatchWorkerOutcome,
	formatSubmitPlanResult,
	PACKAGE_ROOT,
	SUPERVISOR_GUIDANCE,
} from "../../.test-build/workbench/index.js";
import packageJson from "../../package.json" with { type: "json" };

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
	]);
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
		{ approved: false, savedPath: "plans/revised.md", feedback: "Add checks." },
		"plans/revised.md",
	);
	assert.match(planContent, /Plan requires revision/);
	assert.match(planContent, /Saved path: plans\/revised\.md/);
	assert.match(planContent, /Feedback: Add checks/);
});

test("public manifest retains the package boundary and developer tooling", () => {
	assert.equal(packageJson.name, "pi-sych");
	assert.equal(packageJson.version, "1.1.0");
	assert.equal(PACKAGE_ROOT, process.cwd());
	assert.equal(packageJson.devDependencies.typescript, "7.0.2");
	assert.equal(packageJson.devDependencies["@biomejs/biome"], "2.5.6");
	assert.deepEqual(packageJson.pi.extensions, [
		"./extensions/workbench/index.ts",
	]);
	assert.equal(packageJson.files.includes("CHANGELOG.md"), true);
	assert.equal(packageJson.files.includes("docs"), true);
	assert.equal(packageJson.files.includes("AGENTS.md"), true);
	assert.equal(packageJson.files.includes("ARCHITECTURE.md"), true);
	assert.equal(
		packageJson.pi.image,
		"https://unpkg.com/pi-sych@1.1.0/docs/img/architecture.png",
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
