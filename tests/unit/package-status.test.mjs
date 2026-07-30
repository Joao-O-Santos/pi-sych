import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import piSychWorkbench, {
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

test("public manifest retains the package boundary and developer tooling", () => {
	assert.equal(packageJson.name, "pi-sych");
	assert.equal(packageJson.version, "1.0.0");
	assert.equal(PACKAGE_ROOT, process.cwd());
	assert.equal(packageJson.devDependencies.typescript, "7.0.2");
	assert.equal(packageJson.devDependencies["@biomejs/biome"], "2.5.6");
	assert.deepEqual(packageJson.pi.extensions, [
		"./extensions/workbench/index.ts",
	]);
	assert.equal(packageJson.files.includes("CHANGELOG.md"), true);
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
