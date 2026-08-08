import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	type ConfigDirectoryOptions,
	loadPiSychConfig,
	piSychConfigDirectory,
} from "./config-directory.js";

const query =
	"SELECT p.filepath AS source_path, p.title, p.first_author AS authors, p.year, p.doi, snippet(papers_fts, 2, '[', ']', ' … ', 32) AS snippet, bm25(papers_fts) AS score FROM papers_fts JOIN papers AS p ON p.id = papers_fts.rowid WHERE papers_fts MATCH ? ORDER BY score LIMIT ?";
export interface LiteratureResult {
	metadata: { title: unknown; authors: unknown; year: unknown; doi: unknown };
	snippet: unknown;
	score: unknown;
	sourcePath: string;
}
export function literatureDatabasePath(
	projectRoot: string,
	options: Omit<ConfigDirectoryOptions, "projectRoot"> = {},
): string {
	const projectDatabase = resolve(projectRoot, "LITERATURE.sqlite");
	if (existsSync(projectDatabase)) return projectDatabase;
	const configOptions = { ...options, projectRoot },
		directory = piSychConfigDirectory(configOptions),
		configured = loadPiSychConfig(configOptions).literatureDatabase;
	if (!configured) return resolve(directory, "literature.sqlite");
	const path = isAbsolute(configured) ? configured : resolve(directory, configured);
	if (!existsSync(path))
		throw new Error(`Configured literature database is unavailable at ${path}`);
	return path;
}
export function searchLiterature(
	projectRoot: string,
	queryText: string,
	limit = 10,
): LiteratureResult[] {
	if (typeof queryText !== "string" || !queryText.trim())
		throw new Error("Literature search query must be a non-empty string");
	if (!Number.isInteger(limit) || limit < 1 || limit > 50)
		throw new Error("Literature search limit must be an integer from 1 to 50");
	const path = literatureDatabasePath(projectRoot);
	if (!existsSync(path)) throw new Error(`Literature database is unavailable at ${path}`);
	let database: DatabaseSync | undefined;
	try {
		database = new DatabaseSync(path, { readOnly: true });
		const rows = database.prepare(query).all(queryText, limit) as unknown as Record<
			string,
			unknown
		>[];
		return rows.map((row) => {
			if (typeof row.source_path !== "string")
				throw new Error("literature source path must be text");
			return {
				metadata: { title: row.title, authors: row.authors, year: row.year, doi: row.doi },
				snippet: row.snippet,
				score: row.score,
				sourcePath: resolve(dirname(path), row.source_path),
			};
		});
	} catch (error) {
		throw new Error(`Literature search failed for ${path}: ${String(error)}`);
	} finally {
		database?.close();
	}
}
export function registerLiteratureSearch(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "literature_search",
		label: "Search local literature",
		description: "Search the configured local FTS5 literature database.",
		parameters: Type.Object({
			query: Type.String(),
			limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
		}),
		async execute(_id, params, _signal, _update, ctx) {
			const results = searchLiterature(ctx.cwd, params.query, params.limit);
			return {
				content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
				details: { results },
			};
		},
	});
}
