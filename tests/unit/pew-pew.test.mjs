import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { enabledPewPewExtension } from "../../.test-build/workbench/src/pew-pew.js";

const sourceInfo = (path, source = "git:example/pi-pew-pew") => ({
	path,
	source,
	scope: "user",
	origin: "package",
});

test("PEW-PEW is inherited only from an active tool with valid package provenance", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-pew-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const extension = join(root, "package/src/index.ts");
	await mkdir(join(root, "package/src"), { recursive: true });
	await writeFile(join(root, "package/package.json"), '{"name":"pi-pew-pew"}\n');
	await writeFile(extension, "export default () => {};\n");
	const tool = { name: "web", sourceInfo: sourceInfo(extension, "local:enabled-web") };
	assert.equal(await enabledPewPewExtension([tool], ["web"]), extension);
	assert.equal(await enabledPewPewExtension([tool], []), undefined);
	assert.equal(
		await enabledPewPewExtension(
			[{ name: "web", sourceInfo: sourceInfo(join(root, "other.ts"), "another-package") }],
			["web"],
		),
		undefined,
	);
});

test("broken or ambiguous active PEW-PEW provenance fails clearly", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-pew-broken-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const missing = join(root, "pi-pew-pew/src/index.ts");
	const tool = { name: "web", sourceInfo: sourceInfo(missing) };
	await assert.rejects(enabledPewPewExtension([tool], ["web"]), /no readable.*manifest/i);
	await assert.rejects(
		enabledPewPewExtension(
			[tool, { name: "web", sourceInfo: sourceInfo(join(root, "other/index.ts"), "other-web") }],
			["web"],
		),
		/provenance is unavailable or ambiguous/,
	);
	await mkdir(join(root, "wrong/src"), { recursive: true });
	const wrong = join(root, "wrong/src/index.ts");
	await writeFile(wrong, "extension\n");
	await writeFile(join(root, "wrong/package.json"), '{"name":"not-pew"}\n');
	await assert.rejects(
		enabledPewPewExtension(
			[{ name: "web", sourceInfo: sourceInfo(wrong, "git:pi-pew-pew") }],
			["web"],
		),
		/package name not-pew/,
	);
	const brokenLocal = join(root, "local/src/index.ts");
	await mkdir(join(root, "local/src"), { recursive: true });
	await writeFile(join(root, "local/package.json"), '{"name":"pi-pew-pew"}\n');
	await assert.rejects(
		enabledPewPewExtension(
			[{ name: "web", sourceInfo: sourceInfo(brokenLocal, "local:active-web") }],
			["web"],
		),
		/extension is unreadable/,
	);
});
