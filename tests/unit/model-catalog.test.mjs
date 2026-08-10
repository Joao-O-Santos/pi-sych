import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
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
		path = join(configDirectory, "models.json"),
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
