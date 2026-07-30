#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MARKDOWN_FILES = [
	"AGENTS.md",
	"ARCHITECTURE.md",
	"CHANGELOG.md",
	"CONTRIBUTING.md",
	"EVIDENCE.md",
	"PROJECT.md",
	"README.md",
	"SYNC.md",
	"TODO.md",
	"docs/CONFIGURATION.md",
	"docs/DEVELOPMENT.md",
	"docs/img/README.md",
	"templates/AGENTS.md",
	"templates/DECISIONS.md",
	"templates/EVIDENCE.md",
	"templates/PROJECT.md",
	"templates/STYLE.md",
	"templates/SYNC.md",
];

const PANDOC_ARGS = [
	"-f",
	"markdown",
	"-t",
	"markdown+pipe_tables-simple_tables-multiline_tables-grid_tables",
	"--wrap=auto",
	"--columns=72",
];

export function formatMarkdown(path) {
	const result = spawnSync("pandoc", [...PANDOC_ARGS, path], {
		encoding: "utf8",
		maxBuffer: 10 * 1024 * 1024,
	});
	if (result.error?.code === "ENOENT")
		throw new Error(
			"Pandoc is required for Markdown checks; install pandoc or run this check on a configured contributor host.",
		);
	if (result.error)
		throw new Error(
			`Unable to run Pandoc for ${path}: ${result.error.message}`,
		);
	if (result.status !== 0)
		throw new Error(
			`Pandoc failed for ${path}: ${result.stderr?.trim() || `exit ${result.status}`}`,
		);
	return result.stdout;
}

async function main() {
	const fix = process.argv.includes("--write");
	const changed = [];
	for (const path of MARKDOWN_FILES) {
		const before = await readFile(path, "utf8");
		const after = formatMarkdown(path);
		if (before === after) continue;
		changed.push(path);
		if (fix) {
			const temporary = join(dirname(path), `.${basename(path)}.tmp`);
			await writeFile(temporary, after);
			await rename(temporary, path);
		}
	}
	if (changed.length) {
		if (fix) console.log(`Formatted Markdown:\n${changed.join("\n")}`);
		else {
			console.error(
				`Markdown differs from Pandoc 72-column formatting:\n${changed.join("\n")}\nRun npm run markdown:fix.`,
			);
			process.exitCode = 1;
		}
	} else console.log("Markdown matches Pandoc 72-column formatting.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
