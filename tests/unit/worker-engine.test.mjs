import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseModelCatalog } from "../../.test-build/workbench/src/model-catalog.js";
import {
	DEFAULT_TIMEOUT_MS,
	modelFor,
	toolsForRequest,
	validateWorkerResult,
	writeImmutableResult,
} from "../../.test-build/workbench/src/worker-engine.js";

const catalog = { default: "junior", models: { junior: { model: "x/y" } } };
test("worker request and result retain the bounded protocol", () => {
	assert.equal(DEFAULT_TIMEOUT_MS, 90_000);
	assert.deepEqual(
		validateWorkerResult({ status: "complete", summary: "done", files: ["A.md"], limitations: [] })
			.files,
		["A.md"],
	);
	assert.throws(() => validateWorkerResult({ status: "complete", summary: "x" }), /files/);
	assert.throws(
		() => validateWorkerResult({ status: "complete", summary: "x", files: {}, limitations: [] }),
		/files must be an array of strings/,
	);
	assert.equal(modelFor(parseModelCatalog(catalog), "junior"), "x/y");
	assert.deepEqual(toolsForRequest({ mode: "read-only", remoteResearch: false }), [
		"read",
		"grep",
		"find",
		"ls",
		"submit_artifact",
	]);
	assert.ok(toolsForRequest({ mode: "edit", remoteResearch: true }).includes("mcporter"));
	assert.deepEqual(toolsForRequest({ mode: "full-host", remoteResearch: false }), [
		"read",
		"edit",
		"write",
		"bash",
		"submit_artifact",
	]);
});
test("worker result is immutable", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pi-sych-worker-")),
		path = join(dir, "result.json"),
		result = { status: "complete", summary: "done", files: [], limitations: [] };
	await writeImmutableResult(path, result);
	assert.deepEqual(JSON.parse(await readFile(path, "utf8")), result);
	await assert.rejects(writeImmutableResult(path, result), /immutable/);
});
