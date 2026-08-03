import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
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
});

test("optional model catalog distinguishes absence from invalid content", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-model-catalog-")),
		path = join(root, "models.json"),
		env = { PI_SYCH_MODEL_CATALOG: path };
	assert.equal(loadOptionalModelCatalog(env), undefined);
	assert.throws(
		() => loadOptionalModelCatalog({ PI_SYCH_MODEL_CATALOG: root }),
		new RegExp(`Worker model catalog is unavailable at ${root}`),
	);
	await writeFile(
		path,
		JSON.stringify({ default: "review", models: { review: { model: "x/y" } } }),
	);
	assert.equal(loadOptionalModelCatalog(env)?.models.review.model, "x/y");
	await writeFile(path, "{ invalid json");
	assert.throws(
		() => loadOptionalModelCatalog(env),
		new RegExp(`Worker model catalog is unavailable or invalid at ${path}`),
	);
});
