import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

test("migration ledger exactly maps the tagged source skills to existing guidance modules", async () => {
	const ledger = await readFile("SKILL_MIGRATION_LEDGER.md", "utf8");
	const { stdout } = await execFileAsync("git", [
		"ls-tree",
		"-r",
		"--name-only",
		"v1.2.0",
		"skills",
	]);
	const sourceNames = stdout
		.split("\n")
		.filter((path) => path.endsWith("/SKILL.md"))
		.map((path) => path.split("/")[1])
		.sort();
	const mappings = ledger
		.split("\n")
		.map((line) => line.match(/^\| ([a-z0-9-]+) \| `([^`]+)` \|$/))
		.filter(Boolean)
		.map((match) => ({ source: match[1], destination: match[2] }));
	const mappedNames = mappings.map(({ source }) => source).sort();
	assert.deepEqual(
		mappedNames,
		sourceNames,
		"ledger rejects missing or extra sources",
	);
	assert.equal(
		new Set(mappedNames).size,
		mappedNames.length,
		"ledger rejects duplicate source mappings",
	);
	for (const { source, destination } of mappings) {
		assert.match(destination, /^[a-z]+\/modules\/[a-z-]+$/);
		for (const file of ["guidance.md", "examples.md"])
			await access(join("skills", destination, file), undefined).catch(() =>
				assert.fail(`${source} destination lacks ${destination}/${file}`),
			);
	}
});

test("umbrella prompts state precedence and critical anti-default safeguards", async () => {
	for (const skill of Object.keys(catalog)) {
		const content = await readFile(join("skills", skill, "SKILL.md"), "utf8");
		assert.match(content, /override/i, `${skill} states precedence`);
		assert.match(
			content,
			/uncert|inference|limitation/i,
			`${skill} qualifies uncertainty`,
		);
	}
	const write = await readFile("skills/write/SKILL.md", "utf8");
	const code = await readFile("skills/code/SKILL.md", "utf8");
	const review = await readFile("skills/review/SKILL.md", "utf8");
	assert.match(write, /never mechanically replace passive voice/i);
	assert.match(code, /smallest complete solution/i);
	assert.match(review, /do not optimize for agreement/i);
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
	assert.match(empirical, /randomization.*counterbalancing/i);
	assert.match(empirical, /exclusions.*stopping rule/i);
	assert.match(empirical, /preregistered.*exploratory/i);
	assert.match(empirical, /sample-size rationale/i);
	assert.match(empirical, /interaction.*simple effects/i);
	assert.match(empirical, /effect sizes/i);
	assert.match(empirical, /uncertainty/i);
	assert.match(empirical, /non-significant.*not proof/i);
	assert.match(empirical, /reverse causality.*common causes/i);
	assert.match(empirical, /prose, tables, and figures/i);
	assert.match(theoretical, /mechanism|assumptions|alternatives/i);
	assert.match(style, /European Portuguese|pt-BR/i);
	assert.match(
		await readFile("skills/write/modules/grant/guidance.md", "utf8"),
		/compliance matrix/i,
	);
	assert.match(
		await readFile("skills/analyze/modules/r-quarto/guidance.md", "utf8"),
		/rendered output/i,
	);
	assert.match(
		await readFile("skills/review/modules/verification/guidance.md", "utf8"),
		/Never claim a check ran/i,
	);
	assert.match(
		await readFile("skills/write/SKILL.md", "utf8"),
		/specific paper section.*empirical.*theoretical/i,
	);
});

test("restored procedural anchors remain in their ledger destinations", async () => {
	const anchors = [
		["skills/project/modules/bootstrap/guidance.md", /SYNC\.json/],
		["skills/project/modules/artifacts/guidance.md", /pi-sych-status/],
		["skills/project/modules/status/guidance.md", /action: "check"/],
		[
			"skills/project/modules/reconcile/guidance.md",
			/decision memo.*options.*evidence.*trade-offs/is,
		],
		[
			"skills/project/modules/plans/guidance.md",
			/implementation order.*global constraints/i,
		],
		[
			"skills/write/modules/academic/guidance.md",
			/synthesize patterns.*multiple serious lenses/i,
		],
		[
			"skills/write/modules/style/guidance.md",
			/gold, silver, and negative examples/i,
		],
		[
			"skills/write/modules/sections/guidance.md",
			/reader.*section's job.*central claim/i,
		],
		[
			"skills/review/modules/verification/guidance.md",
			/implementation completeness.*unapproved changes.*maintainability/i,
		],
		[
			"skills/code/modules/testing/guidance.md",
			/scripts, formatter, linter, type checker, build, smoke/i,
		],
	];
	for (const [path, anchor] of anchors)
		assert.match(await readFile(path, "utf8"), anchor, path);
});
