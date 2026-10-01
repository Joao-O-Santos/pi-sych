import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { API } from "typescript/unstable/sync";
import {
	generateCodeReference,
	validateRequiredReferences,
} from "../../scripts/generate-code-reference.mjs";

test("code reference is deterministic and includes required runtime anchors", async () => {
	const directory = await mkdtemp(join(tmpdir(), "pi-sych-code-reference-"));
	const first = join(directory, "first.md");
	const second = join(directory, "second.md");
	try {
		await generateCodeReference(first);
		await generateCodeReference(second);
		const markdown = await readFile(first, "utf8");
		assert.equal(markdown, await readFile(second, "utf8"));
		for (const symbol of [
			"dispatchSchema",
			"dispatchWorker",
			"launchPiWorker",
			"compact",
			"project_status",
			"registerLiteratureSearch",
			"literature_search",
		])
			assert.match(markdown, new RegExp(`\\b${symbol}\\b`));
		assert.match(markdown, /Important TypeBox schemas/);
		assert.match(markdown, /gitlab\.com\/Joao-O-Santos\/pi-sych/);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("code reference disposes its snapshot before closing the TypeScript API", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-sych-code-reference-lifetime-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const events = [];
	let failProjectLookup = false;
	const updateSnapshot = API.prototype.updateSnapshot;
	const close = API.prototype.close;
	t.mock.method(API.prototype, "updateSnapshot", function (...args) {
		const snapshot = updateSnapshot.apply(this, args);
		const dispose = snapshot[Symbol.dispose].bind(snapshot);
		snapshot[Symbol.dispose] = () => {
			events.push("snapshot");
			return dispose();
		};
		if (failProjectLookup) snapshot.getProject = () => undefined;
		return snapshot;
	});
	t.mock.method(API.prototype, "close", function (...args) {
		events.push("api");
		return close.apply(this, args);
	});

	await generateCodeReference(join(directory, "success.md"));
	assert.deepEqual(events, ["snapshot", "api"]);
	assert.ok((await readFile(join(directory, "success.md"), "utf8")).length);

	events.length = 0;
	failProjectLookup = true;
	await assert.rejects(
		generateCodeReference(join(directory, "failure.md")),
		/TypeScript could not load tsconfig\.json/,
	);
	assert.deepEqual(events, ["snapshot", "api"]);
});

test("code reference fails loudly when a required runtime symbol is absent", () => {
	const files = new Map([["extensions/workbench/src/worker-engine.ts", { exports: [], text: "" }]]);
	assert.throws(
		() => validateRequiredReferences(files),
		/Required exported symbol is missing: dispatchSchema/,
	);
});
