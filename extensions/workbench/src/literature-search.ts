import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadPiSychConfig, piSychConfigDirectory } from "./config-directory.js";

const query =
	"SELECT p.filepath AS source_path, p.title, p.item_type, p.creators_json, p.year, p.doi, snippet(papers_fts, 2, '[', ']', ' … ', 32) AS snippet, bm25(papers_fts) AS score FROM papers_fts JOIN papers AS p ON p.id = papers_fts.rowid WHERE papers_fts MATCH ? ORDER BY score LIMIT ?";
export interface LiteratureResult {
	metadata: {
		title: unknown;
		itemType: string | null;
		creators: unknown;
		year: unknown;
		doi: unknown;
	};
	snippet: unknown;
	score: unknown;
	sourcePath: string;
}
export function literatureDatabasePath(projectRoot: string, configDirectory?: string): string {
	const projectDatabase = resolve(projectRoot, "LITERATURE.sqlite");
	if (existsSync(projectDatabase)) return projectDatabase;
	const configOptions = { projectRoot, ...(configDirectory ? { configDirectory } : {}) },
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
	configDirectory?: string,
): LiteratureResult[] {
	if (typeof queryText !== "string" || !queryText.trim())
		throw new Error("Literature search query must be a non-empty string");
	if (!Number.isInteger(limit) || limit < 1 || limit > 50)
		throw new Error("Literature search limit must be an integer from 1 to 50");
	const path = literatureDatabasePath(projectRoot, configDirectory);
	if (!existsSync(path)) throw new Error(`Literature database is unavailable at ${path}`);
	try {
		using database = new DatabaseSync(path, { readOnly: true });
		const rows = database.prepare(query).all(queryText, limit);
		return rows.map((row) => {
			if (typeof row.source_path !== "string")
				throw new Error("literature source path must be text");
			if (row.item_type !== null && typeof row.item_type !== "string")
				throw new Error("literature item type must be text or null");
			let creators: unknown = null;
			if (row.creators_json !== null) {
				if (typeof row.creators_json !== "string")
					throw new Error("literature creators must be JSON text or null");
				creators = JSON.parse(row.creators_json);
				if (
					creators === null ||
					typeof creators !== "object" ||
					Array.isArray(creators) ||
					!Object.values(creators).every(
						(names) =>
							Array.isArray(names) &&
							names.every(
								(name) => name !== null && typeof name === "object" && !Array.isArray(name),
							),
					)
				)
					throw new Error("literature creators must be an object of arrays of name objects");
			}
			return {
				metadata: {
					title: row.title,
					itemType: row.item_type,
					creators,
					year: row.year,
					doi: row.doi,
				},
				snippet: row.snippet,
				score: row.score,
				sourcePath: resolve(dirname(path), row.source_path),
			};
		});
	} catch (error) {
		throw new Error(`Literature search failed for ${path}: ${String(error)}`);
	}
}
export function registerLiteratureSearch(
	pi: ExtensionAPI,
	configDirectory?: string,
	resolveProjectRoot: (cwd: string) => string | Promise<string> = (cwd) => cwd,
): void {
	pi.registerTool({
		name: "literature_search",
		label: "Search local literature",
		description:
			"Search the configured local read-only FTS5 literature index. Results are discovery metadata and snippets, not verification of the underlying source or completeness of the collection.",
		promptSnippet: "Search the local literature index for relevant sources; inspect underlying sources before relying on precise claims",
		promptGuidelines: [
			"Use results for discovery and provenance. A match or snippet does not establish that the source supports a claim.",
			"Inspect the underlying source when wording, method, result, quotation, correction status, or precise metadata matters.",
			"Do not claim the index is complete; state material retrieval or coverage limits when relevant.",
		],
		parameters: Type.Object({
			query: Type.String({ minLength: 1, description: "FTS5 query for the local literature index" }),
			limit: Type.Optional(
				Type.Integer({ minimum: 1, maximum: 50, description: "Maximum results; defaults to 10" }),
			),
		}),
		async execute(_id, params, _signal, _update, ctx) {
			const projectRoot = await resolveProjectRoot(ctx.cwd);
			const results = searchLiterature(projectRoot, params.query, params.limit, configDirectory);
			return {
				content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
				details: { results },
			};
		},
	});
}
