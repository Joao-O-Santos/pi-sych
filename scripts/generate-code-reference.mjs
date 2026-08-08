#!/usr/bin/env node

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript/unstable/ast";
import { API } from "typescript/unstable/sync";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "extensions");
const gitlabBase = "https://gitlab.com/Joao-O-Santos/pi-sych/-/blob/main";

const explanations = new Map([
	[
		"dispatch_worker",
		"The supervisor submits a bounded request and receives one validated terminal worker result. The request selects the worker mode, context packet, optional skills, model role, and timeout.",
	],
	[
		"launchPiWorker",
		"The launcher starts a clean Pi process, limits its visible tools, and turns cancellation or timeout into a controlled process stop before dispatch accepts a result.",
	],
	[
		"project_status",
		"This registered tool reports hash and dependency observations or atomically records acknowledgement. It reports mechanical state only; it does not judge semantic drift.",
	],
	[
		"compact",
		"Custom compaction creates bounded project snapshots, asks the configured model for validated working memory, and writes at most five unreviewed proposals to the inbox.",
	],
	[
		"literature_search",
		"The worker-only literature tool queries the configured local SQLite FTS database and returns matching metadata, snippets, scores, and resolved source paths.",
	],
]);

const componentAnchors = new Map([
	["dispatch_worker", { path: "extensions/workbench/index.ts", anchor: 'name: "dispatch_worker"' }],
	[
		"launchPiWorker",
		{
			path: "extensions/workbench/src/worker-engine.ts",
			anchor: "export async function launchPiWorker",
		},
	],
	["project_status", { path: "extensions/workbench/index.ts", anchor: 'name: "project_status"' }],
	[
		"compact",
		{ path: "extensions/workbench/src/compaction.ts", anchor: "export async function compact" },
	],
	[
		"literature_search",
		{ path: "extensions/workbench/src/literature-search.ts", anchor: 'name: "literature_search"' },
	],
]);

const requiredReferences = [
	{ name: "dispatchSchema", path: "extensions/workbench/src/worker-engine.ts", exported: true },
	{ name: "dispatchWorker", path: "extensions/workbench/src/worker-engine.ts", exported: true },
	{ name: "launchPiWorker", path: "extensions/workbench/src/worker-engine.ts", exported: true },
	{ name: "compact", path: "extensions/workbench/src/compaction.ts", exported: true },
	{
		name: "project_status",
		path: "extensions/workbench/index.ts",
		anchor: 'name: "project_status"',
	},
	{
		name: "registerLiteratureSearch",
		path: "extensions/workbench/src/literature-search.ts",
		exported: true,
	},
	{
		name: "literature_search",
		path: "extensions/workbench/src/literature-search.ts",
		anchor: 'name: "literature_search"',
	},
];

async function runtimeFiles(directory = sourceRoot) {
	const entries = await readdir(directory, { withFileTypes: true });
	const children = await Promise.all(
		entries.map(async (entry) => {
			const path = resolve(directory, entry.name);
			if (entry.isDirectory()) return runtimeFiles(path);
			return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
		}),
	);
	return children.flat().sort();
}

function isExported(node) {
	return (
		(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false) ||
		(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false)
	);
}

function sourceSignature(node, sourceFile) {
	const text = node.getText(sourceFile);
	if (ts.isFunctionDeclaration(node) && node.body)
		return `${sourceFile.text.slice(node.getStart(sourceFile), node.body.getStart(sourceFile)).trimEnd()};`;
	return text;
}

function lineLink(path, sourceFile, position) {
	const line = sourceFile.getLineAndCharacterOfPosition(position).line + 1;
	return `${gitlabBase}/${path}#L${line}`;
}

function exportedDeclarations(sourceFile, path) {
	const declarations = [];
	for (const statement of sourceFile.statements) {
		if (ts.isVariableStatement(statement) && isExported(statement)) {
			for (const declaration of statement.declarationList.declarations) {
				if (ts.isIdentifier(declaration.name))
					declarations.push({
						name: declaration.name.text,
						kind: "constant",
						signature: sourceSignature(statement, sourceFile),
						link: lineLink(path, sourceFile, declaration.getStart(sourceFile)),
					});
			}
			continue;
		}
		if (
			isExported(statement) &&
			(ts.isFunctionDeclaration(statement) ||
				ts.isInterfaceDeclaration(statement) ||
				ts.isTypeAliasDeclaration(statement) ||
				ts.isClassDeclaration(statement) ||
				ts.isEnumDeclaration(statement))
		) {
			declarations.push({
				name: statement.name?.text ?? "default",
				kind: ts.SyntaxKind[statement.kind].replace("Declaration", "").toLowerCase(),
				signature: sourceSignature(statement, sourceFile),
				link: lineLink(path, sourceFile, statement.getStart(sourceFile)),
			});
			continue;
		}
		if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement))
			declarations.push({
				name: "re-export",
				kind: "export",
				signature: sourceSignature(statement, sourceFile),
				link: lineLink(path, sourceFile, statement.getStart(sourceFile)),
			});
	}
	return declarations;
}

function typeBoxSchemas(sourceFile, path) {
	const schemas = [];
	const visit = (node) => {
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			node.initializer?.getText(sourceFile).match(/\bType\./)
		)
			schemas.push({
				name: node.name.text,
				path,
				link: lineLink(path, sourceFile, node.name.getStart(sourceFile)),
			});
		node.forEachChild(visit);
	};
	visit(sourceFile);
	return schemas;
}

function anchorLink(component, files) {
	const anchor = componentAnchors.get(component);
	if (!anchor) return undefined;
	const file = files.get(anchor.path);
	const position = file?.text.indexOf(anchor.anchor) ?? -1;
	if (position < 0) return undefined;
	return `${gitlabBase}/${anchor.path}#L${file.text.slice(0, position).split("\n").length}`;
}

export function validateRequiredReferences(files) {
	for (const required of requiredReferences) {
		const file = files.get(required.path);
		if (!file) throw new Error(`Required code-reference source is missing: ${required.path}`);
		if (required.exported && !file.exports.some((entry) => entry.name === required.name))
			throw new Error(`Required exported symbol is missing: ${required.name} (${required.path})`);
		if (required.anchor && !file.text.includes(required.anchor))
			throw new Error(`Required source anchor is missing: ${required.name} (${required.path})`);
	}
}

export async function generateCodeReference(outputPath) {
	const files = await runtimeFiles();
	const api = new API();
	using snapshot = api.updateSnapshot({ openProjects: [resolve(root, "tsconfig.json")] });
	const project = snapshot.getProject(resolve(root, "tsconfig.json"));
	if (!project) throw new Error("TypeScript could not load tsconfig.json");
	const referenceFiles = new Map();
	const schemas = [];
	for (const absolutePath of files) {
		const sourceFile = project.program.getSourceFile(absolutePath);
		if (!sourceFile) throw new Error(`TypeScript could not read runtime source: ${absolutePath}`);
		const path = relative(root, absolutePath).replaceAll("\\", "/");
		const exports = exportedDeclarations(sourceFile, path);
		referenceFiles.set(path, { exports, text: sourceFile.text });
		schemas.push(...typeBoxSchemas(sourceFile, path));
	}
	validateRequiredReferences(referenceFiles);

	const lines = [
		"# Live code reference",
		"",
		"This page is generated from the package runtime TypeScript during the site build. Signatures are source text, not a hand-maintained API copy.",
		"",
		"## Key components",
		"",
		...Array.from(explanations, ([name, explanation]) => {
			const link = anchorLink(name, referenceFiles);
			return `- ${link ? `[**${name}**](${link})` : `**${name}**`} — ${explanation}`;
		}),
		"",
		"## Important TypeBox schemas",
		"",
		...schemas.map((schema) => `- [\`${schema.name}\`](${schema.link}) — \`${schema.path}\``),
		"",
		"## Runtime exports",
	];
	for (const [path, file] of referenceFiles) {
		lines.push("", `### [\`${path}\`](${gitlabBase}/${path})`, "");
		if (!file.exports.length) {
			lines.push("This runtime file has no exports.");
			continue;
		}
		for (const entry of file.exports) {
			lines.push(
				`#### ${entry.kind}: [\`${entry.name}\`](${entry.link})`,
				"",
				"```ts",
				entry.signature,
				"```",
			);
		}
	}
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${lines.join("\n")}\n`);
	api.close();
}

async function main() {
	const [outputPath] = process.argv.slice(2);
	if (!outputPath || process.argv.length !== 3)
		throw new Error("Usage: generate-code-reference.mjs <output-markdown-path>");
	await generateCodeReference(resolve(outputPath));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
