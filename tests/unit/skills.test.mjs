import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const catalog = {
	project:
		"Use and maintain Pi Sych projects, state, artifacts, dependencies, and decisions.",
	write:
		"Draft and revise scholarly, professional, instructional, presentation, and web content.",
	analyze:
		"Conduct reproducible quantitative, qualitative, statistical, and data-centred analysis.",
	code: "Design, implement, test, maintain, and release software.",
	review:
		"Independently evaluate artifacts for correctness, structure, evidence, clarity, and risk.",
	research:
		"Retrieve, assess, and synthesize sources with explicit limitations.",
};

const modules = {
	project: [
		"bootstrap",
		"artifacts",
		"status",
		"reconcile",
		"plans",
		"pi-sych",
		"retrospective",
	],
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

async function directories(path) {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

test("the visible skill catalog is exactly the accepted six names and descriptions", async () => {
	assert.deepEqual(await directories("skills"), Object.keys(catalog).sort());
	for (const [name, description] of Object.entries(catalog)) {
		const content = await readFile(join("skills", name, "SKILL.md"), "utf8");
		assert.match(content, new RegExp(`^name: ${name}$`, "m"));
		assert.match(content, new RegExp(`^description: ${description}$`, "m"));
	}
});

test("umbrella skills retain direct invariant guidance and route only accepted modules", async () => {
	for (const [skill, expected] of Object.entries(modules)) {
		const root = join("skills", skill);
		const content = await readFile(join(root, "SKILL.md"), "utf8");
		const guidance = content.replace(/^---\n[\s\S]*?\n---\n?/, "");
		assert.match(content, /^#\s+\S/m, `${skill}/SKILL.md`);
		assert.ok(
			guidance.split(/\s+/).length >= 75,
			`${skill} needs invariant guidance`,
		);
		assert.deepEqual(
			await directories(join(root, "modules")),
			[...expected].sort(),
		);
		for (const module of expected)
			assert.match(content, new RegExp(`modules/${module}/guidance\\.md`));
	}
});

test("modules are one-level non-skills with editable examples", async () => {
	for (const [skill, expected] of Object.entries(modules))
		for (const module of expected) {
			const root = join("skills", skill, "modules", module);
			const entries = await readdir(root, { withFileTypes: true });
			assert.deepEqual(entries.map((entry) => entry.name).sort(), [
				"examples.md",
				"guidance.md",
			]);
			assert.equal(
				entries.some((entry) => entry.isDirectory()),
				false,
			);
			for (const file of ["guidance.md", "examples.md"]) {
				const content = await readFile(join(root, file), "utf8");
				assert.doesNotMatch(content, /^---\s*$/m);
				assert.doesNotMatch(
					content,
					/modules\/[a-z0-9-]+\/(?:guidance|examples)\.md/i,
				);
			}
		}
});

test("key migrated guidance remains distinct", async () => {
	const empirical = await readFile(
		"skills/write/modules/empirical/guidance.md",
		"utf8",
	);
	const theoretical = await readFile(
		"skills/write/modules/theoretical/guidance.md",
		"utf8",
	);
	const style = await readFile(
		"skills/write/modules/style/guidance.md",
		"utf8",
	);
	assert.match(empirical, /design|uncertainty|results/i);
	assert.match(theoretical, /mechanisms|assumptions|alternatives/i);
	assert.match(style, /European Portuguese|pt-BR/i);
	assert.match(
		await readFile("skills/write/SKILL.md", "utf8"),
		/specific paper section.*empirical.*theoretical/i,
	);
});
