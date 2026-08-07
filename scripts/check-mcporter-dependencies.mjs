#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const readVersion = async (path) => JSON.parse(await readFile(path, "utf8")).version;
let entry;
try {
	entry = require.resolve("pi-mcporter/dist/index.js");
} catch (error) {
	if (error?.code !== "MODULE_NOT_FOUND") throw error;
	process.stdout.write("pi-mcporter is not installed; optional dependency check skipped.\n");
}
try {
	if (!entry) process.exit(0);
	const root = dirname(dirname(entry));
	let current = root;
	let mcporterRoot;
	while (true) {
		const candidate = resolve(current, "node_modules", "mcporter");
		if (existsSync(resolve(candidate, "package.json"))) {
			mcporterRoot = candidate;
			break;
		}
		const parent = dirname(current);
		if (parent === current)
			throw new Error("pi-mcporter has no resolvable compatible MCPorter runtime");
		current = parent;
	}
	const cli = resolve(mcporterRoot, "dist", "cli.js");
	if (!existsSync(cli)) throw new Error("MCPorter runtime has no CLI entry");
	const piMcporterVersion = await readVersion(resolve(root, "package.json"));
	const mcporterVersion = await readVersion(resolve(mcporterRoot, "package.json"));
	const tree = execFileSync("npm", ["ls", "pi-mcporter", "mcporter", "--all", "--json"], {
		encoding: "utf8",
	});
	process.stdout.write(
		`pi-mcporter ${piMcporterVersion}: ${entry}\nmcporter ${mcporterVersion}: ${cli}\n${tree}`,
	);
} catch (error) {
	process.stderr.write(
		`Pi Sych MCPorter dependency check failed: ${error instanceof Error ? error.message : String(error)}\n`,
	);
	process.exitCode = 1;
}
