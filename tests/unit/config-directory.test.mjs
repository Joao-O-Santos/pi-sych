import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	DEFAULT_CONFIG,
	ensurePiSychConfig,
	loadPiSychConfig,
	piSychConfigDirectory,
	piSychConfigPath,
} from "../../.test-build/workbench/src/config-directory.js";

const exists =
	(...paths) =>
	(path) =>
		paths.includes(path);
const config = (compaction, literatureDatabase, completionReassessment) => ({
	version: 2,
	...(compaction ? { compaction } : {}),
	...(completionReassessment !== undefined ? { completionReassessment } : {}),
	...(literatureDatabase !== undefined ? { literatureDatabase } : {}),
});

test("global config root remains independent from project .pi", () => {
	assert.equal(
		piSychConfigDirectory({
			projectRoot: "/project",
			env: { PI_CODING_AGENT_DIR: "/agent" },
			exists: exists("/project/.pi"),
		}),
		"/agent/pi-sych",
	);
	assert.equal(
		piSychConfigDirectory({
			env: { XDG_CONFIG_HOME: "/xdg" },
			home: "/home/test",
			exists: exists(),
		}),
		"/xdg/pi/pi-sych",
	);
});
test("writes v2 defaults once without overwriting", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-config-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const directory = await ensurePiSychConfig({ configDirectory: join(root, "pi-sych") }),
		path = join(directory, "config.json");
	assert.deepEqual(JSON.parse(await readFile(path, "utf8")), DEFAULT_CONFIG);
	await writeFile(path, JSON.stringify(config({ custom: false })));
	await ensurePiSychConfig({ configDirectory: directory });
	assert.deepEqual(loadPiSychConfig({ configDirectory: directory }), {
		version: 2,
		compaction: { custom: false, thresholdTokens: 150_000 },
		completionReassessment: false,
	});
	assert.equal(
		piSychConfigPath("modelCatalog", { configDirectory: directory }),
		join(directory, "worker-models.json"),
	);
});
test("project config partially overrides global and relative literature paths use their source root", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-layered-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const global = join(root, "global/pi-sych"),
		project = join(root, "project");
	await mkdir(global, { recursive: true });
	await mkdir(join(project, ".pi/pi-sych"), { recursive: true });
	await writeFile(
		join(global, "config.json"),
		JSON.stringify(
			config({ custom: false, thresholdTokens: 180_000 }, "library/global.sqlite", true),
		),
	);
	await writeFile(
		join(project, ".pi/pi-sych/config.json"),
		JSON.stringify(config(undefined, "library/project.sqlite", false)),
	);
	assert.deepEqual(loadPiSychConfig({ configDirectory: global, projectRoot: project }), {
		version: 2,
		compaction: { custom: false, thresholdTokens: 180_000 },
		completionReassessment: false,
		literatureDatabase: join(project, "library/project.sqlite"),
	});
	await writeFile(
		join(project, ".pi/pi-sych/config.json"),
		JSON.stringify(config({ thresholdTokens: 200_000 })),
	);
	assert.deepEqual(loadPiSychConfig({ configDirectory: global, projectRoot: project }), {
		version: 2,
		compaction: { custom: false, thresholdTokens: 200_000 },
		completionReassessment: true,
		literatureDatabase: join(global, "library/global.sqlite"),
	});
});
test("strict v2 parser rejects unknown keys, invalid versions and malformed nested values", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-invalid-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const path = join(root, "config.json"),
		load = () => loadPiSychConfig({ configDirectory: root });
	for (const value of [
		{ version: 1 },
		{ version: 2, typo: true },
		config({ custom: 1 }),
		config({ thresholdTokens: 0 }),
		config({ custom: true, typo: 1 }),
		config(undefined, " "),
		config(undefined, undefined, "true"),
	]) {
		await writeFile(path, JSON.stringify(value));
		assert.throws(load);
	}
	await writeFile(path, "{");
	assert.throws(load, /unavailable or invalid/);
});
test("config root uses home fallbacks and reports unavailable roots", () => {
	const home = "/home/test";
	assert.equal(
		piSychConfigDirectory({ env: {}, home, exists: exists(join(home, ".config/pi")) }),
		join(home, ".config/pi/pi-sych"),
	);
	assert.equal(
		piSychConfigDirectory({ env: {}, home, exists: exists(join(home, ".pi")) }),
		join(home, ".pi/pi-sych"),
	);
	assert.throws(
		() => piSychConfigDirectory({ env: {}, home, exists: exists() }),
		/configuration directory is unavailable/,
	);
});
test("config parser rejects non-object roots and accepts omitted optional fields", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-config-shape-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const path = join(root, "config.json"),
		load = () => loadPiSychConfig({ configDirectory: root });
	for (const value of [null, [], "config"]) {
		await writeFile(path, JSON.stringify(value));
		assert.throws(load, /must be an object/);
	}
	await rm(path);
	assert.deepEqual(load(), {
		version: 2,
		compaction: { custom: true, thresholdTokens: 150_000 },
		completionReassessment: false,
	});
	await writeFile(path, JSON.stringify({ version: 2, compaction: {} }));
	assert.deepEqual(load().compaction, { custom: true, thresholdTokens: 150_000 });
});
test("default compaction threshold is 150k", () => {
	assert.equal(DEFAULT_CONFIG.compaction.thresholdTokens, 150_000);
	assert.equal(DEFAULT_CONFIG.compaction.custom, true);
});
