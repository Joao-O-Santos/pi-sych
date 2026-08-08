import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
	registerLiteratureSearch,
	searchLiterature,
} from "../../.test-build/workbench/src/literature-search.js";

async function project(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-literature-tool-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	return root;
}

async function literatureDatabase(path, rows) {
	await mkdir(dirname(path), { recursive: true });
	const database = new DatabaseSync(path);
	database.exec(
		"CREATE TABLE papers (id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT, filename TEXT, year INTEGER, first_author TEXT, title TEXT, abstract TEXT, topic_tags TEXT, doi TEXT)",
	);
	database.exec(
		"CREATE VIRTUAL TABLE papers_fts USING fts5(filepath, title, abstract, topic_tags, doi, content='papers', content_rowid='id')",
	);
	const insert = database.prepare("INSERT INTO papers VALUES (?, ?, '', '', ?, ?, ?, ?, '', ?)");
	for (const row of rows)
		insert.run(null, row.filepath, row.year, row.author, row.title, row.abstract, row.doi);
	database.exec("INSERT INTO papers_fts(papers_fts) VALUES ('rebuild')");
	database.close();
}

function registeredTool() {
	let tool;
	registerLiteratureSearch({ registerTool: (definition) => (tool = definition) });
	return tool;
}

test("registered literature tool exposes the bounded schema and exact real execution result", async (t) => {
	const root = await project(t);
	const rows = Array.from({ length: 12 }, (_, index) => ({
		filepath: `papers/paper-${index}.pdf`,
		year: 2000 + index,
		author: `Author ${index}`,
		title: `Boundary paper ${index}`,
		abstract: `sharedterm evidence ${index}`,
		doi: `10.example/${index}`,
	}));
	await literatureDatabase(join(root, "LITERATURE.sqlite"), rows);
	const tool = registeredTool();
	assert.equal(tool.name, "literature_search");
	assert.equal(tool.label, "Search local literature");
	assert.equal(tool.description, "Search the configured local FTS5 literature database.");
	assert.equal(tool.parameters.type, "object");
	assert.deepEqual(tool.parameters.required, ["query"]);
	assert.deepEqual(tool.parameters.properties.query, { type: "string" });
	assert.deepEqual(tool.parameters.properties.limit, {
		minimum: 1,
		maximum: 50,
		type: "integer",
	});

	const explicit = await tool.execute(
		"call-1",
		{ query: "sharedterm", limit: 2 },
		undefined,
		undefined,
		{
			cwd: root,
		},
	);
	assert.equal(explicit.details.results.length, 2);
	assert.deepEqual(explicit.details.results[0].metadata, {
		title: "Boundary paper 0",
		authors: "Author 0",
		year: 2000,
		doi: "10.example/0",
	});
	assert.equal(explicit.details.results[0].sourcePath, resolve(root, "papers/paper-0.pdf"));
	for (const result of explicit.details.results) {
		assert.equal(typeof result.snippet, "string");
		assert.equal(typeof result.score, "number");
	}
	assert.deepEqual(JSON.parse(explicit.content[0].text), explicit.details.results);

	const defaults = await tool.execute("call-2", { query: "sharedterm" }, undefined, undefined, {
		cwd: root,
	});
	assert.equal(defaults.details.results.length, 10);
});

test("malformed FTS syntax is wrapped with the selected database path", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	await literatureDatabase(path, [
		{
			filepath: "paper.pdf",
			year: 2024,
			author: "Ada",
			title: "Paper",
			abstract: "searchable",
			doi: null,
		},
	]);
	assert.throws(
		() => searchLiterature(root, '"'),
		(error) => {
			assert.match(error.message, /^Literature search failed for /);
			assert.ok(error.message.includes(path));
			assert.match(error.message, /fts5|unterminated|syntax/i);
			return true;
		},
	);
});

test("an incompatible papers schema reports the wrapped SQLite boundary", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	const database = new DatabaseSync(path);
	database.exec(
		"CREATE TABLE papers (id INTEGER PRIMARY KEY, filepath TEXT, title TEXT, abstract TEXT)",
	);
	database.exec(
		"CREATE VIRTUAL TABLE papers_fts USING fts5(filepath, title, abstract, content='papers', content_rowid='id')",
	);
	database.close();
	assert.throws(
		() => searchLiterature(root, "paper"),
		(error) => {
			assert.ok(error.message.includes(path));
			assert.match(error.message, /Literature search failed.*first_author|no such column/i);
			return true;
		},
	);
});

test("a non-text filepath fails during result mapping instead of fabricating a path", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	const database = new DatabaseSync(path);
	database.exec(
		"CREATE TABLE papers (id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT, filename TEXT, year INTEGER, first_author TEXT, title TEXT, abstract TEXT, topic_tags TEXT, doi TEXT)",
	);
	database.exec(
		"CREATE VIRTUAL TABLE papers_fts USING fts5(filepath, title, abstract, topic_tags, doi, content='papers', content_rowid='id')",
	);
	database
		.prepare(
			"INSERT INTO papers VALUES (1, ?, '', '', 2024, 'Ada', 'Blob path', 'needle', '', NULL)",
		)
		.run(Buffer.from([0x61, 0x62]));
	database.exec("INSERT INTO papers_fts(papers_fts) VALUES ('rebuild')");
	database.close();
	assert.throws(
		() => searchLiterature(root, "needle"),
		/Literature search failed.*literature source path must be text/,
	);
});
