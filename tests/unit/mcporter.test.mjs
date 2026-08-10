import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
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
