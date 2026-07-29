import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import piSychWorkbench, {
	ApprovalLedger,
	formatPackageStatus,
	getPackageStatus,
	SUPERVISOR_GUIDANCE,
} from "../../.test-build/workbench/index.js";
import packageJson from "../../package.json" with { type: "json" };

test("package status reports manifest identity and package root", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-package-"));
	await writeFile(
		join(root, "package.json"),
		JSON.stringify({ name: "example", version: "2.3.4" }),
	);
	assert.deepEqual(getPackageStatus(root), {
		name: "example",
		version: "2.3.4",
		packageRoot: root,
	});
	assert.equal(
		formatPackageStatus(getPackageStatus(root)),
		`example 2.3.4\npackage: ${root}`,
	);
});

test("supervisor guidance makes dispatch, complete worker context, synchronization, and direct Plannotator review defaults", () => {
	assert.match(SUPERVISOR_GUIDANCE, /pi_sych_dispatch proactively/);
	assert.match(SUPERVISOR_GUIDANCE, /smallest complete packet/);
	assert.match(SUPERVISOR_GUIDANCE, /which dependents need review/);
	assert.match(SUPERVISOR_GUIDANCE, /submit_plan/);
	const approvals = new ApprovalLedger();
	approvals.record("/project-a/PLAN.md", true, "approved content");
	assert.equal(
		approvals.consume("/project-a/PLAN.md", "changed content"),
		false,
	);
	assert.equal(
		approvals.consume("/project-b/PLAN.md", "approved content"),
		false,
	);
	approvals.record("/project-a/PLAN.md", false, "approved content");
	assert.equal(
		approvals.consume("/project-a/PLAN.md", "approved content"),
		false,
	);
	approvals.record("/project-a/PLAN.md", true, "approved content");
	assert.equal(
		approvals.consume("/project-a/PLAN.md", "approved content"),
		true,
	);
	assert.equal(
		approvals.consume("/project-a/PLAN.md", "approved content"),
		false,
	);
});

test("supervisor exposes only its direct plan-review tool and annotation command", () => {
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
		events: { emit() {} },
	});
	assert.equal(
		tools.some((tool) => tool.name === "submit_plan"),
		true,
	);
	assert.equal(
		tools.some((tool) => tool.name === "pi_sych_enter_planning"),
		false,
	);
	assert.equal(
		tools.some((tool) => tool.name === "pi_sych_request_plan_review"),
		false,
	);
	assert.deepEqual(
		commands.filter((name) => name.startsWith("plannotator-")).sort(),
		["plannotator-annotate", "plannotator-last"],
	);
});

test("public package manifest loads only the supervisor extension", () => {
	assert.equal(packageJson.name, "pi-sych");
	assert.equal(packageJson.version, "0.1.2");
	assert.equal(packageJson.private, undefined);
	assert.deepEqual(packageJson.files, [
		"config",
		"docs/CONFIGURATION.md",
		"extensions",
		"skills",
		"scripts/bootstrap-worker-agent-dir.mjs",
		"README.md",
		"LICENSE",
		"CONTRIBUTING.md",
		"CHANGELOG.md",
	]);
	assert.equal(
		packageJson.repository.url,
		"git+https://gitlab.com/Joao-O-Santos/pi-sych.git",
	);
	assert.deepEqual(packageJson.pi.extensions, [
		"./extensions/workbench/index.ts",
	]);
});

test("Biome tooling pins the tab-indented style baseline", () => {
	const biome = JSON.parse(
		readFileSync(new URL("../../biome.json", import.meta.url), "utf8"),
	);
	assert.equal(packageJson.devDependencies.typescript, "7.0.2");
	assert.equal(packageJson.devDependencies["@biomejs/biome"], "2.5.6");
	assert.equal(biome.formatter.indentStyle, "tab");
	assert.match(packageJson.scripts.style, /biome ci/);
	assert.match(packageJson.scripts["format:check"], /linter-enabled=false/);
});

test("public changelog records releases and the unpublished historical tag", () => {
	const changelog = readFileSync(
		new URL("../../CHANGELOG.md", import.meta.url),
		"utf8",
	);
	assert.match(changelog, /## \[0\.1\.2\]/);
	assert.match(changelog, /## \[0\.1\.1\]/);
	assert.match(changelog, /## \[0\.1\.0\]/);
	assert.match(changelog, /## \[0\.0\.2\]/);
	assert.match(changelog, /npm has no `pi-sych@0\.0\.1` version/);
});

test("release job uses shell-safe tag version checks", () => {
	const releaseConfig = readFileSync(
		new URL("../../.gitlab-ci.yml", import.meta.url),
		"utf8",
	);
	assert.match(
		releaseConfig,
		/package_version="\$\(node -p 'require\("\.\/package\.json"\)\.version'\)"/,
	);
	assert.match(
		releaseConfig,
		/test "\$CI_COMMIT_TAG" = "v\$\{package_version\}"/,
	);
	assert.match(releaseConfig, /npm run style/);
	assert.match(releaseConfig, /npm install --global npm@11\.16\.0/);
	assert.match(
		releaseConfig,
		/npm 11\.5\.1 or later is required for trusted publishing/,
	);
	assert.doesNotMatch(
		releaseConfig,
		/\\"require\('\.\/package\.json'\)\.version\\"/,
	);
});

test("package status rejects incomplete metadata", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-package-"));
	await writeFile(
		join(root, "package.json"),
		JSON.stringify({ name: "example" }),
	);
	assert.throws(() => getPackageStatus(root), /string name and version/);
});
