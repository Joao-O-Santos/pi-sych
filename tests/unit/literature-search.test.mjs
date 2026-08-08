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

async function database(path, rows = []) {
	await mkdir(dirname(path), { recursive: true });
	const db = new DatabaseSync(path);
	db.exec(
		"CREATE TABLE papers (id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT, filename TEXT, year INTEGER, first_author TEXT, title TEXT, abstract TEXT, topic_tags TEXT, doi TEXT)",
	);
	db.exec(
		"CREATE VIRTUAL TABLE papers_fts USING fts5(filepath, title, abstract, topic_tags, doi, content='papers', content_rowid='id')",
	);
	const insert = db.prepare("INSERT INTO papers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
	for (const [filepath, title, authors, year, doi, text] of rows)
		insert.run(null, filepath, "", "", year, authors, title, text, "", doi);
	db.exec("INSERT INTO papers_fts(papers_fts) VALUES ('rebuild')");
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
		absoluteArtifact = join(root, "absolute.pdf");
	await database(path, [
		["../papers/relative.pdf", "Relative", "Ada", 2024, "10.1/a", "alpha exact phrase omega"],
		[absoluteArtifact, "Absolute", "Bob", 2023, "10.1/b", "alpha exact phrase"],
		["other.pdf", "Other", "Cid", 2022, null, "exactly phrase"],
	]);
	await configure(root, "indexes/papers.sqlite");
	const results = searchLiterature(root, '"exact phrase"', 2),
		relative = results.find((result) => result.metadata.title === "Relative"),
		absolute = results.find((result) => result.metadata.title === "Absolute");
	assert.equal(results.length, 2);
	assert.deepEqual(relative.metadata, {
		title: "Relative",
		authors: "Ada",
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
	await database(path, [["paper.pdf", "Title", "A", 2020, null, "readable"]]);
	await chmod(path, 0o444);
	assert.equal(searchLiterature(root, "readable").length, 1);
});
