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

test("explicit Pi Sych configuration directory wins", () => {
	assert.equal(
		piSychConfigDirectory({ configDirectory: "/supervisor/pi-sych", env: {}, exists: exists() }),
		"/supervisor/pi-sych",
	);
});

test("Pi Sych configuration follows project, Pi, XDG, and home precedence", () => {
	const home = "/home/test";
	assert.equal(
		piSychConfigDirectory({
			projectRoot: "/project",
			env: { PI_CODING_AGENT_DIR: "/agent" },
			home,
			exists: exists("/project/.pi"),
		}),
		"/project/.pi/pi-sych",
	);
	assert.equal(
		piSychConfigDirectory({ env: { PI_CODING_AGENT_DIR: "/agent" }, home, exists: exists() }),
		"/agent/pi-sych",
	);
	assert.equal(
		piSychConfigDirectory({ env: { XDG_CONFIG_HOME: "/xdg" }, home, exists: exists() }),
		"/xdg/pi/pi-sych",
	);
	assert.equal(
		piSychConfigDirectory({ env: {}, home, exists: exists("/home/test/.config/pi") }),
		"/home/test/.config/pi/pi-sych",
	);
	assert.equal(
		piSychConfigDirectory({ env: {}, home, exists: exists("/home/test/.pi") }),
		"/home/test/.pi/pi-sych",
	);
	assert.throws(() => piSychConfigDirectory({ env: {}, home, exists: exists() }), /unavailable/);
});

test("Pi Sych writes visible defaults once without overwriting configuration", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-config-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi"));
	const directory = await ensurePiSychConfig({ projectRoot: root });
	const path = join(directory, "config.json");
	assert.deepEqual(JSON.parse(await readFile(path, "utf8")), DEFAULT_CONFIG);
	const custom = {
		...DEFAULT_CONFIG,
		workerAgentDir: "workers/runtime",
		compaction: { custom: false, compactAt100k: true },
		review: { mode: "manual" },
	};
	await writeFile(path, JSON.stringify(custom));
	await ensurePiSychConfig({ projectRoot: root });
	assert.deepEqual(loadPiSychConfig({ projectRoot: root }), custom);
	assert.equal(
		piSychConfigPath("workerAgentDir", { projectRoot: root }),
		join(directory, "workers/runtime"),
	);
	assert.deepEqual(JSON.parse(await readFile("templates/config.json", "utf8")), DEFAULT_CONFIG);
});

test("Pi Sych config accepts a dedicated relative or absolute literature database path", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-literature-config-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi/pi-sych"), { recursive: true });
	const path = join(root, ".pi/pi-sych/config.json");
	for (const literatureDatabase of ["indexes/papers.sqlite", join(root, "papers.sqlite")]) {
		await writeFile(path, JSON.stringify({ ...DEFAULT_CONFIG, literatureDatabase }));
		assert.equal(loadPiSychConfig({ projectRoot: root }).literatureDatabase, literatureDatabase);
	}
});

test("Pi Sych config rejects malformed, unknown, and mistyped values", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-config-invalid-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi/pi-sych"), { recursive: true });
	const path = join(root, ".pi/pi-sych/config.json"),
		load = () => loadPiSychConfig({ projectRoot: root });
	for (const [value, pattern] of [
		["{", /unavailable or invalid/],
		[[], /must be an object/],
		[{ ...DEFAULT_CONFIG, typo: true }, /Unknown/],
		[{ ...DEFAULT_CONFIG, workerAgentDir: "" }, /workerAgentDir/],
		[{ ...DEFAULT_CONFIG, workerAgentDir: "   " }, /workerAgentDir/],
		[{ ...DEFAULT_CONFIG, workerAgentDir: "/tmp/worker" }, /relative path/],
		[{ ...DEFAULT_CONFIG, workerAgentDir: "C:\\worker" }, /relative path/],
		[{ ...DEFAULT_CONFIG, workerAgentDir: "\\\\server\\share" }, /relative path/],
		[{ ...DEFAULT_CONFIG, modelCatalog: "foo\\..\\models.json" }, /relative path/],
		[{ ...DEFAULT_CONFIG, modelCatalog: "../models.json" }, /relative path/],
		[{ ...DEFAULT_CONFIG, modelCatalog: "\t" }, /modelCatalog/],
		[{ ...DEFAULT_CONFIG, mcporterConfig: "\n" }, /mcporterConfig/],
		[{ ...DEFAULT_CONFIG, literatureDatabase: "" }, /literatureDatabase/],
		[{ ...DEFAULT_CONFIG, literatureDatabase: "   " }, /literatureDatabase/],
		[{ ...DEFAULT_CONFIG, literatureDatabase: 7 }, /literatureDatabase/],
		[{ ...DEFAULT_CONFIG, literatureDatabase: "../papers.sqlite" }, /parent traversal/],
		[{ ...DEFAULT_CONFIG, workerAgentDir: "\\worker" }, /relative path/],
		[{ ...DEFAULT_CONFIG, modelCatalog: "\\models.json" }, /relative path/],
		[{ ...DEFAULT_CONFIG, compaction: null }, /compaction must be an object/],
		[
			{ ...DEFAULT_CONFIG, compaction: { custom: false, compactAt100k: false, typo: true } },
			/Unknown/,
		],
		[{ ...DEFAULT_CONFIG, compaction: { custom: "yes", compactAt100k: false } }, /invalid/],
		[{ ...DEFAULT_CONFIG, review: { mode: "automatic" } }, /invalid/],
		[{ ...DEFAULT_CONFIG, review: { mode: "manual", typo: true } }, /Unknown/],
	]) {
		await writeFile(path, typeof value === "string" ? value : JSON.stringify(value));
		assert.throws(load, pattern);
	}
	const { review: _review, ...legacy } = DEFAULT_CONFIG;
	await writeFile(path, JSON.stringify(legacy));
	assert.equal(load().review.mode, "plannotator");
});
