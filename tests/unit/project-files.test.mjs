import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	discoverProjectFiles,
	parseEvidenceEntries,
	validateProjectMarkdown,
	writeApprovedFile,
} from "../../.test-build/workbench/src/project-files.js";

test("canonical discovery selects the nearest project and reports optional files", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-discovery-"));
	const nested = join(root, "src", "nested");
	await mkdir(nested, { recursive: true });
	await writeFile(
		join(root, "PROJECT.md"),
		"# Project\n\n## Objective\n\nX\n\n## Current direction\n\nY\n\n## Definition of done\n\nZ\n",
	);
	await writeFile(join(root, "SYNC.md"), "candidate");
	await writeFile(join(root, "STYLE.md"), "# Style\n");
	await writeFile(join(root, "TODO.md"), "# Tasks\n");

	const discovery = await discoverProjectFiles(nested);
	assert.equal(discovery.root, root);
	assert.equal(
		discovery.files.find((file) => file.name === "STYLE.md").exists,
		true,
	);
	assert.equal(
		discovery.files.find((file) => file.name === "DECISIONS.md").exists,
		false,
	);
	assert.equal(
		discovery.files.find((file) => file.name === "TODO.md").exists,
		true,
	);
	assert.equal(
		discovery.files.find((file) => file.name === "TODO.md").required,
		false,
	);
	assert.equal(
		discovery.files.find((file) => file.name === "EVIDENCE.md").required,
		true,
	);
	assert.equal(
		discovery.files.some((file) => file.name === "AGENTS.md"),
		false,
	);
});

test("PROJECT.md validation is shallow but requires operative headings", () => {
	const valid = validateProjectMarkdown(
		"# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n",
	);
	assert.equal(valid.valid, true);
	const invalid = validateProjectMarkdown("# Notes\n\n## Objective\nX\n");
	assert.equal(invalid.valid, false);
	assert.match(invalid.errors.join("\n"), /Current direction/);
});

test("evidence helpers extract bounded entry metadata", () => {
	const entries = parseEvidenceEntries(
		`# Evidence\n\n## E-014 — A finding\n\n**Status:** supported\n**Kind:** empirical result\n**Source:** outputs/model.html\n\n## E-015 - A limitation\n\n**Status:** unresolved\n`,
	);
	assert.deepEqual(entries, [
		{
			id: "E-014",
			title: "A finding",
			status: "supported",
			kind: "empirical result",
			source: "outputs/model.html",
		},
		{
			id: "E-015",
			title: "A limitation",
			status: "unresolved",
			kind: undefined,
			source: undefined,
		},
	]);
});

test("approved writes are atomic and unapproved writes do not mutate", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-write-"));
	const target = join(root, "PROJECT.md");
	await writeFile(target, "before\n");
	await assert.rejects(
		writeApprovedFile(target, "blocked\n", false),
		/explicit approval/,
	);
	assert.equal(await readFile(target, "utf8"), "before\n");
	await writeApprovedFile(target, "after\n", true);
	assert.equal(await readFile(target, "utf8"), "after\n");
});
