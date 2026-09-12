import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
	registerLiteratureSearch,
	searchLiterature,
} from "../../.test-build/workbench/src/literature-search.js";
import { createLiteratureSchema, rebuildLiteratureIndex } from "../helpers/literature-database.mjs";

async function project(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-literature-tool-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	return root;
}

async function literatureDatabase(path, rows, { constrained = true } = {}) {
	const database = await createLiteratureSchema(path, { constrained });
	const insert = database.prepare(
		"INSERT INTO papers (filepath, year, title, abstract, doi, item_type, creators_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
	);
	for (const row of rows)
		insert.run(
			row.filepath,
			row.year,
			row.title,
			row.abstract,
			row.doi,
			row.itemType ?? null,
			Object.hasOwn(row, "creatorsJson")
				? row.creatorsJson
				: row.creators == null
					? null
					: JSON.stringify(row.creators),
		);
	rebuildLiteratureIndex(database);
	database.close();
}

function registeredTool() {
	let tool;
	registerLiteratureSearch({ registerTool: (definition) => (tool = definition) });
	return tool;
}

function assertWrappedFailure(path, callback, cause) {
	assert.throws(callback, (error) => {
		assert.match(error.message, /^Literature search failed for /);
		assert.ok(error.message.includes(path));
		assert.match(error.message, cause);
		return true;
	});
}

test("registered literature tool exposes the v7 result and exact text/details equality", async (t) => {
	const root = await project(t);
	const rows = Array.from({ length: 12 }, (_, index) => ({
		filepath: `papers/paper-${index}.pdf`,
		year: 2000 + index,
		itemType: index === 0 ? "article-journal" : null,
		creators: index === 0 ? { author: [{ family: "Author", given: "Zero" }] } : null,
		title: `Boundary paper ${index}`,
		abstract: index === 0 ? "sharedterm sharedterm evidence" : "sharedterm evidence",
		doi: `10.example/${index}`,
	}));
	await literatureDatabase(join(root, "LITERATURE.sqlite"), rows);
	const tool = registeredTool();
	assert.equal(tool.name, "literature_search");
	assert.equal(tool.label, "Search local literature");
	assert.equal(
		tool.description,
		"Search the configured local read-only FTS5 literature index. Results are discovery metadata and snippets, not verification of the underlying source or completeness of the collection.",
	);
	assert.equal(tool.parameters.type, "object");
	assert.deepEqual(tool.parameters.required, ["query"]);
	assert.deepEqual(tool.parameters.properties.query, {
		type: "string",
		minLength: 1,
		description: "FTS5 query for the local literature index",
	});
	assert.deepEqual(tool.parameters.properties.limit, {
		minimum: 1,
		maximum: 50,
		type: "integer",
		description: "Maximum results; defaults to 10",
	});

	const explicit = await tool.execute(
		"call-1",
		{ query: "sharedterm", limit: 2 },
		undefined,
		undefined,
		{ cwd: root },
	);
	assert.equal(explicit.details.results.length, 2);
	assert.deepEqual(explicit.details.results[0].metadata, {
		title: "Boundary paper 0",
		itemType: "article-journal",
		creators: { author: [{ family: "Author", given: "Zero" }] },
		year: 2000,
		doi: "10.example/0",
	});
	assert.equal("authors" in explicit.details.results[0].metadata, false);
	assert.equal(explicit.details.results[0].sourcePath, resolve(root, "papers/paper-0.pdf"));
	assert.ok(explicit.details.results[0].score < explicit.details.results[1].score);
	for (const result of explicit.details.results) {
		assert.equal(typeof result.snippet, "string");
		assert.equal(typeof result.score, "number");
	}
	assert.deepEqual(JSON.parse(explicit.content[0].text), explicit.details.results);

	const nullResult = await tool.execute(
		"call-null",
		{ query: '"Boundary paper 1"' },
		undefined,
		undefined,
		{
			cwd: root,
		},
	);
	assert.deepEqual(nullResult.details.results[0].metadata.creators, null);
	assert.deepEqual(JSON.parse(nullResult.content[0].text), nullResult.details.results);

	const defaults = await tool.execute("call-2", { query: "sharedterm" }, undefined, undefined, {
		cwd: root,
	});
	assert.equal(defaults.details.results.length, 10);
});

test("valid v7 schemas support no-match searches and ignore legacy authors", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	const values = [{ author: [{ literal: "Structured" }] }, null];
	await literatureDatabase(
		path,
		values.map((creators, index) => ({
			filepath: `paper${index}.pdf`,
			year: 2024,
			title: `Paper ${index}`,
			abstract: `case${index}`,
			doi: null,
			creators,
		})),
	);
	const database = new DatabaseSync(path);
	database.exec(
		"ALTER TABLE papers ADD COLUMN first_author TEXT; UPDATE papers SET first_author = 'Stale citation stem'",
	);
	database.close();
	for (const [index, creators] of values.entries()) {
		const result = searchLiterature(root, `case${index}`)[0];
		assert.deepEqual(result.metadata.creators, creators);
		assert.equal("authors" in result.metadata, false);
	}
	assert.deepEqual(searchLiterature(root, "absent"), []);
});

test("old and incomplete schemas fail before returning no matches", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	for (const missing of [["item_type", "creators_json"], ["creators_json"], ["item_type"]]) {
		await rm(path, { force: true });
		await literatureDatabase(path, [
			{ filepath: "paper.pdf", year: 2024, title: "Paper", abstract: "needle", doi: null },
		]);
		const database = new DatabaseSync(path);
		database.exec(
			"ALTER TABLE papers ADD COLUMN first_author TEXT; UPDATE papers SET first_author = 'Legacy author'",
		);
		for (const column of missing) database.exec(`ALTER TABLE papers DROP COLUMN ${column}`);
		database.close();
		for (const query of ["needle", "absent"])
			assertWrappedFailure(
				path,
				() => searchLiterature(root, query),
				/no such column.*(?:item_type|creators_json)/i,
			);
	}
});

test("malformed FTS syntax is wrapped with the selected database path and does not write", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	await literatureDatabase(path, [
		{
			filepath: "paper.pdf",
			year: 2024,
			itemType: "article-journal",
			creators: null,
			title: "Paper",
			abstract: "searchable",
			doi: null,
		},
	]);
	const before = await readFile(path);
	assertWrappedFailure(path, () => searchLiterature(root, '"'), /fts5|unterminated|syntax/i);
	assert.deepEqual(await readFile(path), before);
});

test("a bad matched row fails while an unmatched corrupt row is ignored", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	await literatureDatabase(
		path,
		[
			{
				filepath: "good.pdf",
				year: 2024,
				title: "Good",
				abstract: "good common common",
				doi: null,
				creators: null,
			},
			{
				filepath: "bad.pdf",
				year: 2024,
				title: "Bad",
				abstract: "bad common",
				doi: null,
				creatorsJson: '{"author":null}',
			},
		],
		{ constrained: false },
	);
	assert.equal(searchLiterature(root, "good").length, 1);
	const before = await readFile(path);
	for (const query of ["bad", "common"])
		assertWrappedFailure(path, () => searchLiterature(root, query), /creators must be an object/);
	assert.deepEqual(await readFile(path), before);
});

test("a v7 database remains read-only and preserves structured metadata", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	await literatureDatabase(path, [
		{
			filepath: "paper.pdf",
			year: 2024,
			itemType: "article-journal",
			creators: { author: [{ family: "Ada", given: "Lovelace" }] },
			title: "Paper",
			abstract: "readable",
			doi: null,
		},
	]);
	const before = await readFile(path);
	assert.deepEqual(searchLiterature(root, "readable")[0].metadata.creators, {
		author: [{ family: "Ada", given: "Lovelace" }],
	});
	assert.deepEqual(await readFile(path), before);
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
			assert.match(error.message, /no such column: p\.(item_type|creators_json)/i);
			assert.doesNotMatch(error.message, /first_author/i);
			return true;
		},
	);
});

test("a non-text filepath fails during result mapping instead of fabricating a path", async (t) => {
	const root = await project(t);
	const path = join(root, "LITERATURE.sqlite");
	await literatureDatabase(path, [
		{
			filepath: Buffer.from([0x61, 0x62]),
			year: 2024,
			itemType: "article-journal",
			creators: null,
			title: "Blob path",
			abstract: "needle",
			doi: null,
		},
	]);
	assert.throws(
		() => searchLiterature(root, "needle"),
		/Literature search failed.*literature source path must be text/,
	);
});
