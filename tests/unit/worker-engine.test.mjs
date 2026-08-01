import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseModelCatalog } from "../../.test-build/workbench/src/model-catalog.js";
import {
	DEFAULT_TIMEOUT_MS,
	modelFor,
	validateWorkerResult,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

test("worker request and result retain the bounded protocol", () => {
	assert.equal(DEFAULT_TIMEOUT_MS, 90_000);
	assert.deepEqual(
		validateWorkerResult({ status: "complete", summary: "done", files: ["A.md"], limitations: [] })
			.files,
		["A.md"],
	);
	assert.throws(() => validateWorkerResult({ status: "complete", summary: "x" }), /files/);
	assert.equal(
		modelFor(
			parseModelCatalog({ default: "junior", models: { junior: { model: "x/y" } } }),
			"junior",
		),
		"x/y",
	);
});
test("worker result is immutable", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pi-sych-worker-")),
		path = join(dir, "result.json"),
		result = { status: "complete", summary: "done", files: [], limitations: [] };
	await writeImmutableResult(path, result);
	assert.deepEqual(JSON.parse(await readFile(path, "utf8")), result);
	await assert.rejects(writeImmutableResult(path, result), /immutable/);
});
