import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export async function createLiteratureSchema(path, { constrained = true } = {}) {
	await mkdir(dirname(path), { recursive: true });
	const database = new DatabaseSync(path);
	database.exec(
		`CREATE TABLE papers (id INTEGER PRIMARY KEY, filepath TEXT, directory TEXT, filename TEXT, year INTEGER, item_type TEXT, creators_json TEXT${constrained ? " CHECK (creators_json IS NULL OR (typeof(creators_json) = 'text' AND json_valid(creators_json) AND json_type(creators_json) = 'object'))" : ""}, title TEXT, abstract TEXT, topic_tags TEXT, doi TEXT)`,
	);
	database.exec(
		"CREATE VIRTUAL TABLE papers_fts USING fts5(filepath, title, abstract, topic_tags, doi, content='papers', content_rowid='id')",
	);
	return database;
}

export function rebuildLiteratureIndex(database) {
	database.exec("INSERT INTO papers_fts(papers_fts) VALUES ('rebuild')");
}
