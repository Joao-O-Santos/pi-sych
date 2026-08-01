import assert from "node:assert/strict";
import test from "node:test";
import { parseModelCatalog } from "../../.test-build/workbench/src/model-catalog.js";

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
