import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import test from "node:test";

const publicSkills = ["analyze", "code", "project", "research", "review", "write"];
const modules = {
	project: ["bootstrap", "artifacts", "status", "reconcile", "plans", "pi-sych", "retrospective"],
	write: [
		"academic",
		"empirical",
		"theoretical",
		"theory",
		"sections",
		"style",
		"book",
		"grant",
		"slides",
		"web",
	],
	analyze: ["quantitative", "qualitative", "r-quarto", "reporting"],
	code: ["architecture", "testing", "git", "npm", "web"],
	review: [
		"structure",
		"evidence",
		"detail",
		"copyedit",
		"code",
		"analysis",
		"response",
		"verification",
	],
	research: ["search", "sources", "synthesis", "citations"],
};
const methods = ["argument-analysis", "claim-evidence", "hypothesis-generation", "prose"];
const skillsRoot = resolve("skills");
// Pre-revision maximum using whitespace-delimited words in the complete
// umbrella skill plus every guidance file in one recipe.
const historicalLargestRouteWords = 1_736;

async function directories(path) {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

async function findNamedFiles(root, name) {
	const found = [];
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) found.push(...(await findNamedFiles(path, name)));
		else if (entry.name === name) found.push(resolve(path));
	}
	return found.sort();
}

function parseFrontmatter(content, path) {
	const lines = content.split("\n");
	assert.equal(lines[0], "---", `${path} lacks frontmatter`);
	const end = lines.indexOf("---", 1);
	assert.ok(end > 1, `${path} has incomplete frontmatter`);
	const fields = new Map();
	for (const line of lines.slice(1, end)) {
		const split = line.indexOf(":");
		assert.ok(split > 0, `${path} has malformed frontmatter`);
		fields.set(line.slice(0, split).trim(), line.slice(split + 1).trim());
	}
	return { fields, body: lines.slice(end + 1).join("\n") };
}

function routeRows(content, path, required = false) {
	const heading = "## Task recipes";
	const start = content.indexOf(heading);
	if (start < 0) {
		assert.equal(required, false, `${path} has no Task recipes section`);
		return [];
	}
	const remainder = content.slice(start + heading.length);
	const nextHeading = remainder.search(/\n##\s/);
	const section = nextHeading < 0 ? remainder : remainder.slice(0, nextHeading);
	assert.ok(section.includes("| Task | Read in order |"), `${path} lacks the recipe table header`);
	const rows = [];
	for (const line of section.split("\n")) {
		const targets = [...line.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)/g)].map((match) =>
			resolve(dirname(path), match[1]),
		);
		if (targets.length === 0) continue;
		assert.equal(new Set(targets).size, targets.length, `${path} has a duplicate recipe step`);
		if (targets.length > 1) assert.ok(line.includes("→"), `${path} recipe has no order marker`);
		rows.push(targets);
	}
	assert.ok(rows.length > 0, `${path} has no task recipe rows`);
	return rows;
}

async function assertLocalLinks(path, content) {
	for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
		if (/^(?:[a-z]+:|#)/i.test(match[1])) continue;
		const target = resolve(dirname(path), match[1].split("#")[0]);
		assert.ok((await stat(target)).isFile(), `${relative(skillsRoot, target)} is unavailable`);
	}
}

function assertHasRoute(rows, targets, label) {
	assert.ok(
		rows.some((row) => {
			try {
				assert.deepEqual(row, targets);
				return true;
			} catch {
				return false;
			}
		}),
		`${label} route is unavailable or out of order`,
	);
}

function assertAcyclic(graph) {
	const active = new Set();
	const complete = new Set();
	const visit = (node) => {
		if (complete.has(node)) return;
		assert.equal(active.has(node), false, `route cycle reaches ${relative(skillsRoot, node)}`);
		active.add(node);
		for (const target of graph.get(node) ?? []) visit(target);
		active.delete(node);
		complete.add(node);
	};
	for (const node of graph.keys()) visit(node);
}

test("Pi exposes exactly six public umbrella skill files", async () => {
	assert.deepEqual(
		await findNamedFiles("skills", "SKILL.md"),
		publicSkills.map((name) => resolve("skills", name, "SKILL.md")),
	);
	for (const name of publicSkills) {
		const path = join("skills", name, "SKILL.md");
		const { fields } = parseFrontmatter(await readFile(path, "utf8"), path);
		assert.equal(fields.get("name"), name);
		assert.ok(fields.get("description"), `${path} lacks a description`);
	}
});

test("shared methods contain guidance and examples without becoming skills", async () => {
	assert.deepEqual(await directories("skills/_methods"), methods);
	assert.deepEqual(await findNamedFiles("skills/_methods", "sources.md"), []);
	for (const method of methods) {
		const root = join("skills/_methods", method);
		for (const file of ["guidance.md", "examples.md"]) {
			const path = join(root, file);
			assert.ok((await stat(path)).isFile(), `${path} is unavailable`);
			const content = await readFile(path, "utf8");
			assert.ok(content.trim(), `${path} is empty`);
			await assertLocalLinks(path, content);
		}
	}
});

test("task recipes are bounded, ordered, resolvable, and acyclic", async () => {
	const graph = new Map();
	const routedMethods = new Set();
	for (const [skill, expectedModules] of Object.entries(modules)) {
		const path = resolve("skills", skill, "SKILL.md");
		const content = await readFile(path, "utf8");
		const { body } = parseFrontmatter(content, path);
		assert.ok(body.split(/\s+/).length <= 275, `${skill} exceeds the umbrella prompt budget`);
		const rows = routeRows(content, path, true);
		for (const row of rows) {
			const targetWords = await Promise.all(
				row.map(async (target) => (await readFile(target, "utf8")).trim().split(/\s+/).length),
			);
			const routeWords =
				content.trim().split(/\s+/).length + targetWords.reduce((total, words) => total + words, 0);
			assert.ok(
				routeWords <= historicalLargestRouteWords,
				`${skill} route uses ${routeWords}/${historicalLargestRouteWords} words`,
			);
		}
		const targets = rows.flat();
		graph.set(path, targets);
		for (const target of targets) {
			assert.ok((await stat(target)).isFile(), `${relative(skillsRoot, target)} is not a file`);
			assert.ok(target.startsWith(`${skillsRoot}${sep}`), `${target} leaves skills`);
			const method = relative(resolve("skills/_methods"), target).split(sep)[0];
			if (methods.includes(method)) routedMethods.add(method);
		}
		for (const module of expectedModules)
			assert.ok(
				targets.includes(resolve("skills", skill, "modules", module, "guidance.md")),
				`${skill} does not route ${module}`,
			);
	}
	assert.deepEqual([...routedMethods].sort(), methods);

	for (const method of methods) {
		const path = resolve("skills/_methods", method, "guidance.md");
		const targets = routeRows(await readFile(path, "utf8"), path).flat();
		graph.set(path, targets);
		for (const target of targets)
			assert.equal(
				publicSkills.some((skill) => target.startsWith(resolve("skills", skill))),
				false,
				`${method} routes back into a public skill`,
			);
	}
	assertAcyclic(graph);
});

test("task recipes load only the intended specialist composition", async () => {
	const claim = resolve("skills/_methods/claim-evidence/guidance.md");
	const argument = resolve("skills/_methods/argument-analysis/guidance.md");
	const hypothesis = resolve("skills/_methods/hypothesis-generation/guidance.md");
	const prose = resolve("skills/_methods/prose/guidance.md");
	const qualitative = resolve("skills/analyze/modules/qualitative/guidance.md");
	const rQuarto = resolve("skills/analyze/modules/r-quarto/guidance.md");
	const reporting = resolve("skills/analyze/modules/reporting/guidance.md");
	const search = resolve("skills/research/modules/search/guidance.md");
	const sources = resolve("skills/research/modules/sources/guidance.md");
	const synthesis = resolve("skills/research/modules/synthesis/guidance.md");
	const citations = resolve("skills/research/modules/citations/guidance.md");
	const evidence = resolve("skills/review/modules/evidence/guidance.md");
	const reviewCode = resolve("skills/review/modules/code/guidance.md");
	const testing = resolve("skills/code/modules/testing/guidance.md");
	const npm = resolve("skills/code/modules/npm/guidance.md");
	const verification = resolve("skills/review/modules/verification/guidance.md");
	const academic = resolve("skills/write/modules/academic/guidance.md");
	const empirical = resolve("skills/write/modules/empirical/guidance.md");
	const theoretical = resolve("skills/write/modules/theoretical/guidance.md");

	const analyzePath = resolve("skills/analyze/SKILL.md");
	const analyzeRows = routeRows(await readFile(analyzePath, "utf8"), analyzePath, true);
	for (const [targets, label] of [
		[[claim, qualitative], "qualitative inquiry"],
		[[hypothesis, argument, claim, qualitative], "qualitative explanation"],
		[[rQuarto], "routine R or Quarto"],
		[[claim, rQuarto], "claim-changing R or Quarto"],
		[[claim, reporting], "tables or figures"],
		[[claim, prose, reporting], "results prose"],
	])
		assertHasRoute(analyzeRows, targets, label);

	const researchPath = resolve("skills/research/SKILL.md");
	const researchRows = routeRows(await readFile(researchPath, "utf8"), researchPath, true);
	for (const [targets, label] of [
		[[claim, sources, synthesis], "supplied-source synthesis"],
		[[search, sources, claim, synthesis], "retrieval and synthesis"],
		[[hypothesis, search, sources, claim, synthesis], "hypothesis search"],
		[[hypothesis, argument, sources, claim, synthesis], "supplied competing accounts"],
		[[hypothesis, argument, search, sources, claim, synthesis], "retrieved competing accounts"],
	])
		assertHasRoute(researchRows, targets, label);

	const reviewPath = resolve("skills/review/SKILL.md");
	const reviewRows = routeRows(await readFile(reviewPath, "utf8"), reviewPath, true);
	for (const [targets, label] of [
		[[claim, citations, evidence], "citation audit"],
		[[reviewCode, testing, verification], "implementation verification"],
		[[rQuarto, verification], "R or Quarto verification"],
		[[npm, verification], "release verification"],
		[[prose, claim, verification], "prose verification"],
		[[claim, verification], "generic artifact verification"],
	])
		assertHasRoute(reviewRows, targets, label);

	const writePath = resolve("skills/write/SKILL.md");
	const writeRows = routeRows(await readFile(writePath, "utf8"), writePath, true);
	for (const [targets, label] of [
		[[claim, prose, academic, empirical], "empirical manuscript"],
		[[claim, argument, empirical], "empirical argument"],
		[[argument, prose, academic, theoretical], "theoretical manuscript"],
	])
		assertHasRoute(writeRows, targets, label);
});

test("local modules retain required guidance and examples", async () => {
	for (const [skill, expected] of Object.entries(modules)) {
		assert.deepEqual(await directories(join("skills", skill, "modules")), [...expected].sort());
		for (const module of expected) {
			const root = join("skills", skill, "modules", module);
			for (const file of ["guidance.md", "examples.md"]) {
				const path = join(root, file);
				assert.ok((await stat(path)).isFile(), `${path} is unavailable`);
				assert.ok((await readFile(path, "utf8")).trim(), `${path} is empty`);
			}
		}
	}
});
