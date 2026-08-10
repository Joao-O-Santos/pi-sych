#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PANDOC_MINIMUM_VERSION = "3.10.1";

export function parsePandocVersion(value) {
	if (typeof value !== "string" || !/^\d+\.\d+\.\d+$/.test(value)) return undefined;
	return value.split(".").map(Number);
}

export function comparePandocVersions(left, right) {
	const leftParts = parsePandocVersion(left);
	const rightParts = parsePandocVersion(right);
	if (!leftParts || !rightParts)
		throw new TypeError("Pandoc versions must be numeric major.minor.patch values.");
	for (let index = 0; index < 3; index += 1) {
		if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
	}
	return 0;
}

export const MARKDOWN_FILES = [
	"AGENTS.md",
	"PROJECT.md",
	"README.md",
	"docs/ARCHITECTURE.md",
	"docs/CHANGELOG.md",
	"docs/CONTRIBUTING.md",
	"docs/attribution.md",
	"docs/code-tour.md",
	"docs/configuration.md",
	"docs/development.md",
	"docs/img/readme.md",
	"docs/public-contract.md",
	"docs/review-workflow.md",
	"tests/usage/README.md",
	"templates/AGENTS.md",
	"templates/DECISIONS.md",
	"templates/EVIDENCE.md",
	"templates/PROJECT.md",
	"templates/STYLE.md",
];

const PANDOC_ARGS = [
	"-f",
	"markdown",
	"-t",
	"markdown+pipe_tables-simple_tables-multiline_tables-grid_tables",
	"--wrap=auto",
	"--columns=72",
];

let pandocVerified = false;

function verifyPandoc() {
	if (pandocVerified) return;
	const result = spawnSync("pandoc", ["--version"], { encoding: "utf8" });
	if (result.error?.code === "ENOENT")
		throw new Error(
			`Pandoc ${PANDOC_MINIMUM_VERSION} or newer is required for Markdown checks; ` +
				"the executable was not found.",
		);
	if (result.error) throw new Error(`Unable to inspect Pandoc: ${result.error.message}`);
	if (result.status !== 0) throw new Error(`Pandoc --version failed with exit ${result.status}.`);
	const actual = result.stdout.match(/^pandoc\s+(\S+)/)?.[1];
	if (!parsePandocVersion(actual))
		throw new Error(
			`Pandoc version is malformed; expected numeric major.minor.patch, found ${actual ?? "unknown"}.`,
		);
	if (comparePandocVersions(actual, PANDOC_MINIMUM_VERSION) < 0)
		throw new Error(
			`Pandoc ${PANDOC_MINIMUM_VERSION} or newer is required for Markdown checks; found ${actual}.`,
		);
	pandocVerified = true;
}

export function formatMarkdown(path) {
	verifyPandoc();
	const result = spawnSync("pandoc", [...PANDOC_ARGS, path], {
		encoding: "utf8",
		maxBuffer: 10 * 1024 * 1024,
	});
	if (result.error) throw new Error(`Unable to run Pandoc for ${path}: ${result.error.message}`);
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
