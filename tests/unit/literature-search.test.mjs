import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { DEFAULT_CONFIG } from "../../.test-build/workbench/src/config-directory.js";
import {
	literatureDatabasePath,
	searchLiterature,
} from "../../.test-build/workbench/src/literature-search.js";
import { createLiteratureSchema, rebuildLiteratureIndex } from "../helpers/literature-database.mjs";

async function database(path, rows = [], { constrained = true } = {}) {
	const db = await createLiteratureSchema(path, { constrained });
	const insert = db.prepare(
		"INSERT INTO papers (filepath, title, creators_json, year, doi, abstract, item_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
	);
	for (const [filepath, title, creators, year, doi, text, itemType = "article-journal"] of rows)
		insert.run(
			filepath,
			title,
			creators === null ? null : JSON.stringify(creators),
			year,
			doi,
			text,
			itemType,
		);
	rebuildLiteratureIndex(db);
	db.close();
}
async function project(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-literature-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, ".pi/pi-sych"), { recursive: true });
	return root;
}
async function configure(root, literatureDatabase) {
	await writeFile(
		join(root, ".pi/pi-sych/config.json"),
		JSON.stringify({ ...DEFAULT_CONFIG, ...(literatureDatabase ? { literatureDatabase } : {}) }),
	);
}

test("worker-style explicit config resolves an external literature database", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-literature-worker-")),
		configRoot = await mkdtemp(join(tmpdir(), "pi-sych-literature-config-")),
		databasePath = join(configRoot, "external.sqlite");
	t.after(async () =>
		Promise.all([
			rm(root, { recursive: true, force: true }),
			rm(configRoot, { recursive: true, force: true }),
		]),
	);
	await database(databasePath, [["paper.pdf", "External", null, 2024, null, "worker config"]]);
	await writeFile(
		join(configRoot, "config.json"),
		JSON.stringify({ ...DEFAULT_CONFIG, literatureDatabase: databasePath }),
	);
	assert.equal(
		searchLiterature(root, "worker config", 10, configRoot)[0].metadata.title,
		"External",
	);
});

test("literature database resolution honors project, explicit, and config defaults", async (t) => {
	const root = await project(t),
		configDefault = join(root, ".pi/pi-sych/literature.sqlite");
	await database(configDefault);
	assert.equal(literatureDatabasePath(root), configDefault);
	const explicit = join(root, ".pi/pi-sych/indexes/papers.sqlite");
	await database(explicit);
	await configure(root, "indexes/papers.sqlite");
	assert.equal(literatureDatabasePath(root), explicit);
	await configure(root, explicit);
	assert.equal(literatureDatabasePath(root), explicit);
	const projectDatabase = join(root, "LITERATURE.sqlite");
	await database(projectDatabase);
	assert.equal(literatureDatabasePath(root), projectDatabase);
});

test("literature search returns ranked metadata, snippets, and resolved artifact paths", async (t) => {
	const root = await project(t),
		path = join(root, ".pi/pi-sych/indexes/papers.sqlite"),
		absoluteArtifact = join(root, "absolute.pdf"),
		creators = {
			author: [
				{ family: "Smith", given: "Alex", "non-dropping-particle": "de", suffix: "Jr." },
				{ literal: "Open Science Collaboration" },
			],
			editor: [{ family: "Jones", given: "Morgan" }],
		};
	await database(path, [
		["../papers/relative.pdf", "Relative", creators, 2024, "10.1/a", "alpha exact phrase omega"],
		[absoluteArtifact, "Absolute", null, 2023, "10.1/b", "alpha exact phrase"],
		["other.pdf", "Other", {}, 2022, null, "exactly phrase"],
	]);
	await configure(root, "indexes/papers.sqlite");
	const results = searchLiterature(root, '"exact phrase"', 2),
		relative = results.find((result) => result.metadata.title === "Relative"),
		absolute = results.find((result) => result.metadata.title === "Absolute");
	assert.equal(results.length, 2);
	assert.deepEqual(relative.metadata, {
		title: "Relative",
		itemType: "article-journal",
		creators,
		year: 2024,
		doi: "10.1/a",
	});
	assert.match(relative.snippet, /\[exact phrase\]/);
	assert.ok(results.every((result) => typeof result.score === "number"));
	assert.equal(relative.sourcePath, resolve(dirname(path), "../papers/relative.pdf"));
	assert.equal(absolute.sourcePath, absoluteArtifact);
	assert.equal(searchLiterature(root, "alpha", 1).length, 1);
	assert.equal(searchLiterature(root, "papers").length, 1);
});

test("explicit missing literature database fails without default fallback", async (t) => {
	const root = await project(t);
	await database(join(root, ".pi/pi-sych/literature.sqlite"));
	await configure(root, "missing.sqlite");
	assert.throws(() => literatureDatabasePath(root), /Configured.*missing\.sqlite/);
});

test("literature search reports missing databases, invalid limits, FTS queries, and schema", async (t) => {
	const root = await project(t);
	await configure(root);
	assert.throws(() => searchLiterature(root, "alpha"), /database is unavailable/);
	assert.throws(() => searchLiterature(root, "alpha", 0), /integer from 1 to 50/);
	assert.throws(() => searchLiterature(root, "alpha", 51), /integer from 1 to 50/);
	assert.throws(() => searchLiterature(root, "alpha", 1.5), /integer from 1 to 50/);
	assert.throws(() => searchLiterature(root, "", 1), /non-empty/);
	const path = join(root, "LITERATURE.sqlite"),
		db = new DatabaseSync(path);
	db.exec("CREATE TABLE literature(path TEXT, text TEXT)");
	db.close();
	assert.throws(() => searchLiterature(root, "alpha"), /Literature search failed.*LITERATURE/);
});

test("literature search opens a real read-only SQLite database", async (t) => {
	const root = await project(t),
		path = join(root, "LITERATURE.sqlite");
	await database(path, [["paper.pdf", "Title", null, 2020, null, "readable"]]);
	await chmod(path, 0o444);
	assert.equal(searchLiterature(root, "readable").length, 1);
});

test("literature metadata preserves SQL null, empty roles, and omitted roles", async (t) => {
	const root = await project(t),
		path = join(root, "LITERATURE.sqlite");
	const values = [null, {}, { author: [] }, { editor: [{ literal: "Editorial Board" }] }];
	await database(
		path,
		values.map((creators, index) => [
			`paper-${index}.pdf`,
			`Paper ${index}`,
			creators,
			2024,
			null,
			`case${index}`,
			null,
		]),
	);
	for (const [index, creators] of values.entries()) {
		assert.deepEqual(searchLiterature(root, `case${index}`)[0].metadata, {
			title: `Paper ${index}`,
			itemType: null,
			creators,
			year: 2024,
			doi: null,
		});
	}
});

test("literature search rejects invalid creator structures at the wrapped row boundary", async (t) => {
	const root = await project(t),
		path = join(root, "LITERATURE.sqlite");
	await database(path, [["paper.pdf", "Paper", null, 2024, null, "needle"]], {
		constrained: false,
	});
	// This external-style fixture deliberately has no CHECK constraint.
	for (const value of [
		"{",
		"null",
		"[]",
		'"name"',
		"1",
		"true",
		'{"author":null}',
		'{"author":{}}',
		'{"author":"name"}',
		'{"author":[null]}',
		'{"author":[[]]}',
		'{"author":["name"]}',
		'{"author":[1]}',
		Buffer.from("{}"),
	]) {
		const db = new DatabaseSync(path);
		db.prepare("UPDATE papers SET creators_json = ?").run(value);
		db.close();
		assert.throws(
			() => searchLiterature(root, "needle"),
			(error) => {
				assert.match(error.message, /^Literature search failed for /);
				assert.ok(error.message.includes(path));
				const expected =
					value === "{"
						? /JSON|Unexpected|unexpected|unterminated/i
						: value instanceof Buffer
							? /creators must be JSON text or null/
							: /creators must be an object of arrays of name objects/;
				assert.match(error.message, expected);
				return true;
			},
			`Expected failure for ${String(value)}`,
		);
	}
});

test("literature search rejects a non-text item type", async (t) => {
	const root = await project(t),
		path = join(root, "LITERATURE.sqlite");
	await database(path, [["paper.pdf", "Paper", null, 2024, null, "needle", Buffer.from("book")]]);
	assert.throws(() => searchLiterature(root, "needle"), /Literature search failed.*item type/);
});
