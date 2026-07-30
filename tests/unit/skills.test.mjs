import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = "skills";

async function skillFiles() {
	const entries = await readdir(root, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(root, entry.name, "SKILL.md"));
}

test("every public skill has valid progressive-disclosure identity metadata", async () => {
	const files = await skillFiles();
	assert.ok(files.length >= 20);
	for (const path of files) {
		const content = await readFile(path, "utf8");
		const frontMatter = content.match(/^---\n([\s\S]*?)\n---/);
		assert.ok(frontMatter, path);
		assert.match(frontMatter[1], /^name:\s+[a-z0-9-]+$/m, path);
		const description = frontMatter[1].match(/^description:\s+(.+)$/m)?.[1];
		assert.ok(
			description && description.length > 20 && description.length <= 1024,
			path,
		);
		assert.match(content, /^#\s+\S/m, path);
	}
});

test("migrated workflow skills preserve the human and mechanical boundary", async () => {
	const expected = [
		"bootstrap-project",
		"project-status-review",
		"drift-review",
		"reconcile-project",
		"verify-change",
		"workflow-retrospective",
	];
	for (const name of expected) {
		const content = await readFile(`skills/${name}/SKILL.md`, "utf8");
		assert.match(content, new RegExp(`^name: ${name}$`, "m"), name);
		assert.doesNotMatch(content, /pi_sych_/i, name);
	}
	assert.match(
		await readFile("skills/project-status-review/SKILL.md", "utf8"),
		/mechanical facts only/i,
	);
	assert.match(
		await readFile("skills/drift-review/SKILL.md", "utf8"),
		/Do not choose an authority automatically/i,
	);
	assert.match(
		await readFile("skills/verify-change/SKILL.md", "utf8"),
		/built-in Bash/i,
	);
	const retrospective = await readFile(
		"skills/workflow-retrospective/SKILL.md",
		"utf8",
	);
	assert.match(retrospective, /^disable-model-invocation: true$/m);
	assert.match(retrospective, /never edit package code/i);
});

test("every public skill names its private user-example overlay outside package-managed directories", async () => {
	const files = await skillFiles();
	for (const path of files) {
		const name = path.split("/")[1];
		const content = await readFile(path, "utf8");
		assert.match(
			content,
			new RegExp(`~/.config/pi/skills/${name}/examples\\.md`),
			path,
		);
		assert.match(
			content,
			/illustrative preference, not as evidence or project requirements/i,
			path,
		);
	}
	assert.match(
		await readFile("docs/CONFIGURATION.md", "utf8"),
		/~\/.config\/pi\/skills\/<skill-name>\/examples\.md/,
	);
});

test("git workflow skill defaults to main while respecting repository conventions", async () => {
	const content = await readFile("skills/git-workflow/SKILL.md", "utf8");
	assert.match(content, /Work directly on `main` unless/);
	assert.match(content, /imperative subject of at most 50 characters unless/);
	assert.match(content, /repository’s established convention/);
	assert.match(content, /Prefer a true merge over a squash merge/);
	assert.match(
		content,
		/private, unpushed branch behind `main` may be rebased/,
	);
	assert.match(content, /git history fixup/);
	assert.doesNotMatch(content, /Do not use conventional-commit prefixes/);
});

test("TODO.md guidance preserves its bounded task-ledger role", async () => {
	const artifactSkill = await readFile(
		"skills/artifact-to-project/SKILL.md",
		"utf8",
	);
	const readme = await readFile("README.md", "utf8");
	assert.match(artifactSkill, /`TODO\.md`/);
	assert.match(artifactSkill, /not evidence, project direction/);
	assert.match(readme, /## Project files/);
	assert.match(readme, /If GitLab issues are the operative task tracker/);
});

test("public skills do not retain superseded runtime, controller, provider, or personal-overlay language", async () => {
	const files = await skillFiles();
	const forbidden =
		/Magic Context|magic-context|\bAFT\b|cortexkit|pi-vcc|OpenCode|opencode|openai-codex|gpt-\d|claude-|mistral-|named-agent hierarchy/i;
	for (const path of files)
		assert.equal(forbidden.test(await readFile(path, "utf8")), false, path);
});

test("empirical and theoretical guidance remain substantively distinct", async () => {
	const empirical = await readFile("skills/empirical-paper/SKILL.md", "utf8");
	const theoretical = await readFile(
		"skills/theoretical-paper/SKILL.md",
		"utf8",
	);
	assert.match(empirical, /participants|randomization|analysis|uncertainty/i);
	assert.match(
		empirical,
		/Separate observed results from their interpretation/,
	);
	assert.match(theoretical, /mechanism|assumptions|alternatives|predictions/i);
	assert.match(
		theoretical,
		/do not present illustrative claims as empirical findings/i,
	);
	assert.doesNotMatch(theoretical, /randomization|sample size|participants/i);
});

test("evidence discipline appears in relevant scientific and artifact skills", async () => {
	for (const path of [
		"skills/research/SKILL.md",
		"skills/r-quarto/SKILL.md",
		"skills/empirical-paper/SKILL.md",
		"skills/scholarly-manuscript/SKILL.md",
		"skills/verification/SKILL.md",
	]) {
		const content = await readFile(path, "utf8");
		assert.match(content, /evidence|source|claim|output/i, path);
	}
});
