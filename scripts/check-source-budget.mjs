#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
// v2.1 adds the approved working-memory boundary; retain a small,
// reviewable cap rather than exempting it from the production budget.
const limit = 2_500;
const excluded = new Set([
	"extensions/workbench/src/mcporter.ts",
	"extensions/workbench/src/plannotator.ts",
]);

async function files(path) {
	const entries = await readdir(path, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const target = join(path, entry.name);
			return entry.isDirectory() ? files(target) : [target];
		}),
	);
	return nested.flat();
}

const sources = (await files(join(root, "extensions"))).filter(
	(path) => path.endsWith(".ts") && !excluded.has(relative(root, path)),
);
const counts = await Promise.all(
	sources.map(async (path) => ({
		path: relative(root, path),
		lines: (await readFile(path, "utf8")).split("\n").length - 1,
	})),
);
const total = counts.reduce((sum, file) => sum + file.lines, 0);
const estimate = Math.ceil(total / 50) * 50;
if (estimate > limit)
	throw new Error(
		`Estimated production TypeScript is about ${estimate} lines; limit is ${limit}.\n${counts.map((file) => `${Math.ceil(file.lines / 50) * 50}\t${file.path}`).join("\n")}`,
	);
console.log(
	`Estimated production TypeScript: about ${estimate}/${limit} lines`,
);
