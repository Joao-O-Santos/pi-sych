#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const pagePaths = new Map([
	["README.md", "index.html"],
	["ARCHITECTURE.md", "architecture.html"],
	["CONTRIBUTING.md", "contributing.html"],
	["docs/configuration.md", "configuration.html"],
	["docs/development.md", "development.html"],
	["docs/review-workflow.md", "review-workflow.html"],
	["docs/attribution.md", "attribution.html"],
	["docs/public-contract.md", "public-contract.html"],
]);

function splitDestination(destination) {
	const match = destination.match(/^([^\s]+)(\s+.*)?$/);
	return match ? { path: match[1], suffix: match[2] ?? "" } : { path: destination, suffix: "" };
}

function isExternal(path) {
	return !path || path.startsWith("#") || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path);
}

export function rewriteMarkdownLinks(markdown, sourcePath) {
	const sourceDirectory = dirname(sourcePath);
	return markdown.replace(/(\]\()([^\s)]+(?:\s+[^)]*)?)(\))/g, (_all, start, raw, end) => {
		const { path, suffix } = splitDestination(raw);
		if (isExternal(path)) return `${start}${raw}${end}`;
		const [pathname, fragment] = path.split("#", 2);
		const resolved = normalize(join(sourceDirectory, pathname)).split(sep).join("/");
		let replacement = pagePaths.get(resolved);
		if (!replacement && resolved.startsWith("docs/img/"))
			replacement = `img/${resolved.slice("docs/img/".length)}`;
		if (!replacement) return `${start}${raw}${end}`;
		return `${start}${replacement}${fragment === undefined ? "" : `#${fragment}`}${suffix}${end}`;
	});
}

export function validateHtmlLinks(files, availablePaths = new Set(files.map((file) => file.path))) {
	const pages = new Map(files.map((file) => [file.path, file.html]));
	const failures = [];
	for (const { path, html } of files) {
		const ids = new Set(
			[...html.matchAll(/\bid=(?:"([^"]+)"|'([^']+)')/g)].map((match) => match[1] ?? match[2]),
		);
		for (const match of html.matchAll(/\b(?:href|src)=(?:"([^"]+)"|'([^']+)')/g)) {
			const target = match[1] ?? match[2];
			if (isExternal(target)) {
				if (target.startsWith("#") && !ids.has(decodeURIComponent(target.slice(1))))
					failures.push(`${path}: missing fragment ${target}`);
				continue;
			}
			const [rawPath, rawFragment] = target.split("#", 2);
			const targetPath = normalize(join(dirname(path), decodeURIComponent(rawPath)))
				.split(sep)
				.join("/");
			if (targetPath.startsWith("../") || !availablePaths.has(targetPath)) {
				failures.push(`${path}: missing target ${target}`);
				continue;
			}
			if (rawFragment !== undefined) {
				const targetHtml = pages.get(targetPath);
				if (targetHtml === undefined) {
					failures.push(`${path}: fragment target is not an HTML page ${target}`);
					continue;
				}
				const targetIds = new Set(
					[...targetHtml.matchAll(/\bid=(?:"([^"]+)"|'([^']+)')/g)].map(
						(item) => item[1] ?? item[2],
					),
				);
				if (!targetIds.has(decodeURIComponent(rawFragment)))
					failures.push(`${path}: missing fragment ${target}`);
			}
		}
	}
	if (failures.length) throw new Error(`Broken internal site links:\n${failures.join("\n")}`);
}

async function siteFiles(root, directory = root) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const target = join(directory, entry.name);
			return entry.isDirectory() ? siteFiles(root, target) : [target];
		}),
	);
	return nested.flat();
}

async function main() {
	const [command, first, second] = process.argv.slice(2);
	if (command === "rewrite" && first && second) {
		await writeFile(second, rewriteMarkdownLinks(await readFile(first, "utf8"), first));
		return;
	}
	if (command === "validate" && first) {
		const root = resolve(first);
		const paths = await siteFiles(root);
		const availablePaths = new Set(paths.map((path) => relative(root, path).split(sep).join("/")));
		const files = await Promise.all(
			paths
				.filter((path) => path.endsWith(".html"))
				.map(async (path) => ({
					path: relative(root, path).split(sep).join("/"),
					html: await readFile(path, "utf8"),
				})),
		);
		validateHtmlLinks(files, availablePaths);
		return;
	}
	throw new Error("Usage: site-links.mjs rewrite <input> <output> | validate <site-directory>");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
