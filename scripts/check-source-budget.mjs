#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const limit = 2_200;

export const countNonblankLines = (source) =>
	source.split("\n").filter((line) => line.trim().length > 0).length;

async function checkSourceBudget(root = process.cwd()) {
	const sources = [
		...(await readdir(join(root, "extensions"), { recursive: true, withFileTypes: true }))
			.filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
			.map((entry) => join(entry.parentPath, entry.name)),
		join(root, "scripts/bootstrap-worker-agent-dir.mjs"),
	];
	const counts = await Promise.all(
		sources.map(async (path) => ({
			path: relative(root, path),
			lines: countNonblankLines(await readFile(path, "utf8")),
		})),
	);
	const total = counts.reduce((sum, file) => sum + file.lines, 0);
	const estimate = Math.ceil(total / 50) * 50;
	if (estimate > limit)
		throw new Error(
			`nonblank runtime source is about ${estimate} lines; limit is ${limit}.\n${counts.map((file) => `${Math.ceil(file.lines / 50) * 50}\t${file.path}`).join("\n")}`,
		);
	console.log(`nonblank runtime source: about ${estimate}/${limit} lines`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) await checkSourceBudget();
