import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";

async function markdownFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const path = resolve(directory, entry.name);
			if (entry.isDirectory()) return entry.name === "LICENSES" ? [] : markdownFiles(path);
			return path.endsWith(".md") ? [path] : [];
		}),
	);
	return nested.flat();
}

test("repository documentation links resolve after layout grouping", async () => {
	const files = [resolve("README.md"), resolve("COPYING.md"), ...(await markdownFiles("docs"))];
	const missing = [];
	for (const file of files) {
		const markdown = await readFile(file, "utf8");
		for (const match of markdown.matchAll(/\]\(([^\s)#]+)(?:#[^\s)]*)?\)/g)) {
			const target = match[1];
			if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target) || target.endsWith(".html")) continue;
			const path = resolve(dirname(file), decodeURIComponent(target));
			try {
				await stat(path);
			} catch {
				missing.push(`${file}: ${target}`);
			}
		}
	}
	assert.deepEqual(missing, []);
});
