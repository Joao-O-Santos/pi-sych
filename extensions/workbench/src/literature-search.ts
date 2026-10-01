import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { JsonValue } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadPiSychConfig, piSychConfigDirectory } from "./config-directory.js";

const nullableString = Type.Union([Type.String(), Type.Null()]);
const creatorNameSchema = Type.Record(Type.String(), nullableString);
const literatureResultSchema = Type.Object({
	metadata: Type.Object({
		title: nullableString,
		itemType: nullableString,
		creators: Type.Union([Type.Record(Type.String(), Type.Array(creatorNameSchema)), Type.Null()]),
		year: Type.Union([Type.Integer(), Type.Null()]),
		doi: nullableString,
	}),
	snippet: Type.String(),
	score: Type.Number(),
	sourcePath: Type.String(),
});
const literatureOutputSchema = Type.Object({ results: Type.Array(literatureResultSchema) });
const query =
	"SELECT p.filepath AS source_path, p.title, p.item_type, p.creators_json, p.year, p.doi, snippet(papers_fts, 2, '[', ']', ' … ', 32) AS snippet, bm25(papers_fts, 1, 5, 1, 2, 1) AS score FROM papers_fts JOIN papers AS p ON p.id = papers_fts.rowid WHERE papers_fts MATCH ? ORDER BY score LIMIT ?";
const requiredV7PapersColumns = ["item_type", "creators_json"];

function missingV7PapersColumns(database: DatabaseSync): string[] {
	const rows = database.prepare("PRAGMA table_info(papers)").all() as Array<{ name?: unknown }>;
	const names = new Set(rows.map((row) => row.name));
	return requiredV7PapersColumns.filter((column) => !names.has(column));
}

function incompatibleV7SchemaMessage(path: string, missingColumns: string[]): string {
	return `Literature database at ${path} is incompatible with v7: missing required papers columns: ${missingColumns.join(", ")}. Rebuild or migrate the database before search.`;
}
export interface LiteratureResult extends Record<string, JsonValue> {
	metadata: Record<string, JsonValue> & {
		title: string | null;
		itemType: string | null;
		creators: Record<string, Array<Record<string, string | null>>> | null;
		year: number | null;
		doi: string | null;
	};
	snippet: string;
	score: number;
	sourcePath: string;
}
export function literatureDatabasePath(projectRoot: string, configDirectory?: string): string {
	const configOptions = { projectRoot, ...(configDirectory ? { configDirectory } : {}) },
		directory = piSychConfigDirectory(configOptions),
		configured = loadPiSychConfig(configOptions).literatureDatabase;
	if (configured) {
		const path = resolve(configured);
		if (!existsSync(path))
			throw new Error(`Configured literature database is unavailable at ${path}`);
		return path;
	}
	const projectDatabase = resolve(projectRoot, "LITERATURE.sqlite");
	if (existsSync(projectDatabase)) return projectDatabase;
	return resolve(directory, "literature.sqlite");
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
		const missingColumns = missingV7PapersColumns(database);
		if (missingColumns.length) throw new Error(incompatibleV7SchemaMessage(path, missingColumns));
		const rows = database.prepare(query).all(queryText, limit);
		return rows.map((row) => {
			if (typeof row.source_path !== "string")
				throw new Error("literature source path must be text");
			if (row.title !== null && typeof row.title !== "string")
				throw new Error("literature title must be text or null");
			if (row.item_type !== null && typeof row.item_type !== "string")
				throw new Error("literature item type must be text or null");
			if (row.year !== null && !Number.isSafeInteger(row.year))
				throw new Error("literature year must be an integer or null");
			if (row.doi !== null && typeof row.doi !== "string")
				throw new Error("literature DOI must be text or null");
			if (typeof row.snippet !== "string") throw new Error("literature snippet must be text");
			if (typeof row.score !== "number" || !Number.isFinite(row.score))
				throw new Error("literature score must be finite numeric data");
			let creators: LiteratureResult["metadata"]["creators"] = null;
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
								(name) =>
									name !== null &&
									typeof name === "object" &&
									!Array.isArray(name) &&
									Object.values(name).every((value) => value === null || typeof value === "string"),
							),
					)
				)
					throw new Error("literature creators must be an object of arrays of name objects");
			}
			const snippetPoints = Array.from(row.snippet);
			return {
				metadata: {
					title: row.title as string | null,
					itemType: row.item_type,
					creators,
					year: row.year as number | null,
					doi: row.doi as string | null,
				},
				snippet:
					snippetPoints.length > 500 ? `${snippetPoints.slice(0, 500).join("")}…` : row.snippet,
				score: row.score,
				sourcePath: resolve(dirname(path), row.source_path),
			};
		});
	} catch (error) {
		throw new Error(`Literature search failed for ${path}: ${String(error)}`);
	}
}
function formatLiteratureResults(results: LiteratureResult[]): string {
	if (!results.length) return "No matching literature found.";
	return results
		.map((result, index) => {
			const { title, creators, year, itemType, doi } = result.metadata;
			const names = creators
				? Object.values(creators)
						.flat()
						.map((name) =>
							typeof name.literal === "string"
								? name.literal
								: [name.given, name.family].filter((part) => typeof part === "string").join(" "),
						)
						.filter(Boolean)
						.join(", ")
				: "";
			const metadata = [names, year, itemType, doi]
				.filter((part) => part !== null && part !== "")
				.join(" · ");
			return `${index + 1}. ${title ?? "Untitled"}${metadata ? ` — ${metadata}` : ""}\n   Source: ${result.sourcePath}\n   ${result.snippet}`;
		})
		.join("\n");
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
		promptSnippet:
			"Search the local literature index for relevant sources; inspect underlying sources before relying on precise claims",
		promptGuidelines: [
			"Use results for discovery and provenance. A match or snippet does not establish that the source supports a claim.",
			"Inspect the underlying source when wording, method, result, quotation, correction status, or precise metadata matters.",
			"Do not claim the index is complete; state material retrieval or coverage limits when relevant.",
		],
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		},
		outputSchema: literatureOutputSchema,
		parameters: Type.Object({
			query: Type.String({
				minLength: 1,
				description: "FTS5 query for the local literature index",
			}),
			limit: Type.Optional(
				Type.Integer({
					minimum: 1,
					maximum: 50,
					description: "Maximum results; defaults to 10",
				}),
			),
		}),
		async execute(_id, params, _signal, _update, ctx) {
			const projectRoot = await resolveProjectRoot(ctx.cwd);
			const results = searchLiterature(projectRoot, params.query, params.limit, configDirectory);
			return {
				content: [{ type: "text", text: formatLiteratureResults(results) }],
				structuredContent: { results },
				details: { results },
			};
		},
	});
}
