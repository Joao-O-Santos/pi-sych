import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	capabilitySummary,
	formatMcporterDiagnostic,
	inspectMcporter,
	remoteResearchExtensionPaths,
} from "../../.test-build/workbench/src/mcporter.js";

test("MCPorter resolves only when remote research is requested", () => {
	assert.deepEqual(
		remoteResearchExtensionPaths(false, () => {
			throw new Error("must not resolve");
		}),
		[],
	);
	assert.deepEqual(
		remoteResearchExtensionPaths(true, () => "/extensions/mcporter.js"),
		["/extensions/mcporter.js"],
	);
	assert.throws(
		() =>
			remoteResearchExtensionPaths(true, () => {
				throw new Error("missing");
			}),
		/pi-mcporter is not installed/,
	);
});

test("MCPorter treats a missing optional config as legitimate and reports malformed config", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-mcporter-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const missing = join(root, "missing.json");
	assert.deepEqual(inspectMcporter(missing).configExists, false);

	const invalid = join(root, "invalid.json");
	await writeFile(invalid, '{"servers": []}');
	const diagnostic = inspectMcporter(invalid);
	assert.equal(diagnostic.configExists, true);
	assert.match(diagnostic.configError ?? "", /servers or mcpServers must be an object/);
	assert.match(formatMcporterDiagnostic(diagnostic), /config error:/);

	const valid = join(root, "valid.json");
	await writeFile(valid, '{"mcpServers":{"research":{}}}');
	assert.deepEqual(inspectMcporter(valid).servers, ["research"]);
});

test("MCPorter rejects non-object configs and reports shaped diagnostics", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-mcporter-shapes-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const shaped = join(root, "shaped.json");
	await writeFile(shaped, "[]");
	assert.match(inspectMcporter(shaped).configError ?? "", /must be an object/);
	await writeFile(shaped, '{"servers":[]}');
	assert.match(inspectMcporter(shaped).configError ?? "", /must be an object/);
	await writeFile(shaped, '{"servers":"x"}');
	assert.match(inspectMcporter(shaped).configError ?? "", /must be an object/);
	await mkdir(shaped.replace("shaped.json", "shaped-dir"));
	const directory = inspectMcporter(join(root, "shaped-dir"));
	assert.equal(directory.configExists, true);
	assert.ok((directory.configError ?? "").length > 0);
	const empty = join(root, "empty.json");
	await writeFile(empty, "{}");
	assert.deepEqual(inspectMcporter(empty).servers, []);
	assert.match(
		formatMcporterDiagnostic({
			available: false,
			configPath: "p",
			configExists: false,
			servers: [],
		}),
		/unavailable[\s\S]*missing[\s\S]*none/,
	);
	assert.match(
		formatMcporterDiagnostic({
			available: true,
			configPath: "p",
			configExists: true,
			servers: ["a", "b"],
		}),
		/a, b/,
	);
});

test("capability summary distinguishes remote research states", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-remote-states-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi", "pi-sych", "mcp"), { recursive: true });
	const config = join(root, ".pi", "pi-sych", "mcp", "mcporter.json");
	const summary = () =>
		capabilitySummary(
			[{ name: "dispatch_worker", sourceInfo: { path: "/workbench/index.ts" } }],
			["dispatch_worker"],
			root,
			"/workbench/index.ts",
		);
	await writeFile(config, "not json");
	assert.match(summary(), /degraded — MCPorter configuration is invalid/);
	await writeFile(config, "{}");
	assert.match(summary(), /degraded — MCPorter has no configured servers/);
	await writeFile(config, '{"mcpServers":{"solo":{}}}');
	assert.match(summary(), /configured — 1 configured server;/);
	await writeFile(config, '{"servers":{"a":{},"b":{}}}');
	assert.match(summary(), /configured — 2 configured servers;/);
});
