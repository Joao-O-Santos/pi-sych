import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	describeSupervisorModel,
	loadModelCatalog,
	loadOptionalModelCatalog,
	parseModelCatalog,
} from "../../.test-build/workbench/src/model-catalog.js";

test("model catalog uses exact user-defined roles", () => {
	const catalog = parseModelCatalog({
		default: "mid coder",
		models: { "mid coder": { model: "provider/mid", cost: "low", notes: "routine" } },
	});
	assert.equal(catalog.models[catalog.default].model, "provider/mid");
	assert.throws(() => parseModelCatalog({ default: "missing", models: {} }), /Unknown default/);
	assert.throws(
		() => parseModelCatalog({ default: "x", models: { x: { ref: "old" } } }),
		/must define a model/,
	);
	assert.throws(() => parseModelCatalog(null), /must be an object/);
	assert.throws(() => parseModelCatalog({ default: "x" }), /must define models/);
	assert.throws(
		() => parseModelCatalog({ default: "x", models: { x: "bad" } }),
		/must be an object/,
	);
});

test("optional model catalog distinguishes absence from invalid content", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-model-catalog-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const configDirectory = join(root, "pi-sych"),
		path = join(configDirectory, "worker-models.json"),
		env = { PI_CODING_AGENT_DIR: root };
	await mkdir(configDirectory);
	assert.equal(loadOptionalModelCatalog(undefined, env), undefined);
	await writeFile(
		path,
		JSON.stringify({ default: "review", models: { review: { model: "x/y" } } }),
	);
	assert.equal(loadOptionalModelCatalog(undefined, env)?.models.review.model, "x/y");
	assert.equal(loadModelCatalog(undefined, env).models.review.model, "x/y");
	await writeFile(path, "{ invalid json");
	assert.throws(
		() => loadOptionalModelCatalog(undefined, env),
		new RegExp(`Worker model catalog is unavailable or invalid at ${path}`),
	);
	assert.throws(() => loadModelCatalog(undefined, env), /unavailable or invalid/);
});

test("supervisor model lookup reports role, cost, and notes only on exact match", () => {
	const catalog = parseModelCatalog({
		default: "cheap",
		models: { cheap: { model: "provider/fast", cost: "low", notes: "Routine work" } },
	});
	assert.equal(
		describeSupervisorModel({ provider: "provider", id: "fast" }, catalog),
		"Supervisor model: role=cheap; cost=low; notes=Routine work",
	);
	assert.equal(
		describeSupervisorModel({ provider: "provider", id: "other" }, catalog),
		"Supervisor model: role=none; not in catalog",
	);
	assert.equal(
		describeSupervisorModel({ provider: "other", id: "fast" }, catalog),
		"Supervisor model: role=none; not in catalog",
	);
	assert.equal(
		describeSupervisorModel({ provider: "provider", id: "fast" }),
		"Supervisor model: role=none; not in catalog",
	);
	assert.equal(
		describeSupervisorModel(undefined, catalog),
		"Supervisor model: role=none; model unavailable",
	);
	assert.equal(
		describeSupervisorModel(
			{ provider: "provider", id: "fast" },
			parseModelCatalog({ default: "only", models: { only: { model: "provider/fast" } } }),
		),
		"Supervisor model: role=only",
	);
});
