#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

export const CASE_SCHEMA_VERSION = 1;

function fail(message) {
	throw new Error(`Benchmark: ${message}`);
}

export function projectPath(root, path) {
	if (typeof path !== "string" || !path || isAbsolute(path))
		fail(`invalid project-local path: ${path}`);
	const projectRoot = resolve(root),
		resolved = resolve(projectRoot, path);
	if (resolved !== projectRoot && !resolved.startsWith(`${projectRoot}${sep}`))
		fail(`path leaves project: ${path}`);
	return resolved;
}

export async function sha256(path) {
	return createHash("sha256")
		.update(await readFile(path))
		.digest("hex");
}

function strings(value, label) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item))
		fail(`${label} must be non-empty strings`);
}

export function validateCase(caseDefinition) {
	if (!caseDefinition || caseDefinition.schemaVersion !== CASE_SCHEMA_VERSION)
		fail(`case schemaVersion must be ${CASE_SCHEMA_VERSION}`);
	for (const field of ["id", "fixture", "task", "heldIn"]) {
		if (typeof caseDefinition[field] !== "string" || !caseDefinition[field])
			fail(`${field} is required`);
	}
	if (caseDefinition.heldIn !== "held-in") fail(`${caseDefinition.id} must be designated held-in`);
	strings(caseDefinition.skills, "skills");
	strings(caseDefinition.expectedArtifacts, "expectedArtifacts");
	for (const path of caseDefinition.expectedArtifacts) projectPath("/benchmark-project", path);
	if (!Array.isArray(caseDefinition.objectiveChecks)) fail("objectiveChecks must be an array");
	for (const check of caseDefinition.objectiveChecks) {
		if (!check || !["exists", "equals", "includes"].includes(check.type))
			fail("objective check has an invalid type");
		projectPath("/benchmark-project", check.path);
		if (check.type !== "exists" && typeof check.value !== "string")
			fail(`objective check ${check.type} requires a string value`);
	}
	for (const artifact of caseDefinition.expectedArtifacts)
		if (!caseDefinition.objectiveChecks.some((check) => check.path === artifact))
			fail(`expected artifact lacks an objective check: ${artifact}`);
	if (!caseDefinition.rubric || typeof caseDefinition.rubric !== "object")
		fail("rubric is required");
	if (!Array.isArray(caseDefinition.criticalFailures)) fail("criticalFailures must be an array");
	if (
		!caseDefinition.budgets ||
		!Number.isInteger(caseDefinition.budgets.timeoutMs) ||
		caseDefinition.budgets.timeoutMs < 1
	)
		fail("budgets.timeoutMs must be a positive integer");
	return caseDefinition;
}

export async function validateFixtureManifest(fixtureRoot) {
	const manifestPath = join(fixtureRoot, "manifest.json");
	let manifest;
	try {
		manifest = JSON.parse(await readFile(manifestPath, "utf8"));
	} catch {
		fail(`fixture manifest is unavailable or invalid at ${manifestPath}`);
	}
	if (
		manifest.schemaVersion !== 1 ||
		!manifest.files ||
		typeof manifest.files !== "object" ||
		!Object.keys(manifest.files).length
	)
		fail("fixture manifest must use schemaVersion 1 and non-empty files");
	for (const [path, hash] of Object.entries(manifest.files)) {
		const file = projectPath(fixtureRoot, path);
		if (!/^[a-f0-9]{64}$/.test(hash)) fail(`fixture hash is invalid for ${path}`);
		if ((await sha256(file)) !== hash) fail(`fixture hash mismatch for ${path}`);
	}
	return manifest;
}

async function rejectFixtureSymlinks(root) {
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		if (entry.isSymbolicLink()) fail(`fixture symlink is forbidden: ${path}`);
		if (entry.isDirectory()) await rejectFixtureSymlinks(path);
	}
}

export async function copyFixture(fixtureRoot, projectRoot) {
	await validateFixtureManifest(fixtureRoot);
	await rejectFixtureSymlinks(fixtureRoot);
	await mkdir(projectRoot, { recursive: true, mode: 0o700 });
	for (const entry of await readdir(fixtureRoot, { withFileTypes: true })) {
		if (entry.name === "manifest.json") continue;
		const source = join(fixtureRoot, entry.name);
		const target = projectPath(projectRoot, entry.name);
		if (entry.isSymbolicLink()) fail(`fixture symlink is forbidden: ${entry.name}`);
		await cp(source, target, { recursive: true, dereference: false, errorOnExist: true });
	}
}

async function snapshotProject(root) {
	const files = {};
	async function visit(directory, prefix = "") {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const relativePath = prefix ? join(prefix, entry.name) : entry.name;
			if (entry.isDirectory()) await visit(join(directory, entry.name), relativePath);
			else if (entry.isFile()) files[relativePath] = await sha256(join(directory, entry.name));
		}
	}
	await visit(root);
	return files;
}

function artifactDiff(before, after) {
	return Object.keys({ ...before, ...after })
		.sort()
		.filter((path) => before[path] !== after[path])
		.map((path) => ({ path, before: before[path] ?? null, after: after[path] ?? null }));
}

export async function objectiveChecks(projectRoot, checks) {
	const results = [];
	for (const check of checks) {
		const path = projectPath(projectRoot, check.path);
		let content;
		try {
			if (!(await stat(path)).isFile()) throw new Error("not a file");
			content = await readFile(path, "utf8");
		} catch {
			results.push({ ...check, pass: false, reason: "expected file is unavailable" });
			continue;
		}
		const pass =
			check.type === "exists" ||
			(check.type === "equals" ? content === check.value : content.includes(check.value));
		results.push({ ...check, pass, ...(pass ? {} : { reason: "content does not match" }) });
	}
	return results;
}

export function candidatePrompt(caseDefinition) {
	return `Use the public ${caseDefinition.skills.map((skill) => `\`${skill}\``).join(" and ")} umbrella skill${caseDefinition.skills.length === 1 ? "" : "s"}. Work only in this disposable synthetic project. ${caseDefinition.task}\nExpected artifacts: ${caseDefinition.expectedArtifacts.join(", ")}. Report only checks you actually ran.`;
}

export function parseJudgeJson(text) {
	let judgment;
	try {
		judgment = JSON.parse(text);
	} catch {
		fail("judge response is not JSON");
	}
	if (!judgment || !Array.isArray(judgment.scores) || !Array.isArray(judgment.criticalFailures))
		fail("judge response requires scores and criticalFailures arrays");
	for (const score of judgment.scores) {
		if (
			!score ||
			typeof score.criterion !== "string" ||
			!Number.isInteger(score.score) ||
			score.score < 0 ||
			score.score > 4 ||
			typeof score.evidenceLocator !== "string"
		)
			fail("judge score must contain criterion, 0--4 score, and evidenceLocator");
	}
	if (judgment.criticalFailures.some((item) => typeof item !== "string"))
		fail("judge criticalFailures must be strings");
	return judgment;
}

export function aggregate(results) {
	const complete = results.filter((result) => result.status === "complete");
	const checks = results.flatMap((result) => result.objectiveChecks ?? []);
	const scores = results.flatMap((result) => result.judgment?.scores ?? []);
	const report = {
		caseCount: results.length,
		completeCount: complete.length,
		objectivePassed: checks.filter((check) => check.pass).length,
		objectiveTotal: checks.length,
		meanJudgeScore: scores.length
			? scores.reduce((sum, score) => sum + score.score, 0) / scores.length
			: null,
		criticalFailures: results.flatMap((result) => result.judgment?.criticalFailures ?? []),
	};
	const markdown = [
		"# Pi Sych benchmark report",
		"",
		`Cases: ${report.completeCount}/${report.caseCount} complete`,
		`Objective checks: ${report.objectivePassed}/${report.objectiveTotal} passed`,
		`Mean judge score: ${report.meanJudgeScore ?? "not judged"}`,
		`Critical failures: ${report.criticalFailures.length ? report.criticalFailures.join("; ") : "none recorded"}`,
	].join("\n");
	return { report, markdown };
}

export async function writeBundle(outputRoot, result) {
	const directory = join(outputRoot, `${result.case.id}-${Date.now()}-${randomUUID()}`);
	await mkdir(directory, { recursive: true, mode: 0o700 });
	await writeFile(join(directory, "result.json"), `${JSON.stringify(result, null, 2)}\n`, {
		flag: "wx",
		mode: 0o600,
	});
	await writeFile(
		join(directory, "manifest.json"),
		`${JSON.stringify({ schemaVersion: 1, files: ["result.json"], createdAt: result.startedAt }, null, 2)}\n`,
		{ flag: "wx", mode: 0o600 },
	);
	return directory;
}

export async function writeAggregate(outputRoot, results) {
	const { report, markdown } = aggregate(results);
	const stem = `report-${Date.now()}-${randomUUID()}`;
	await mkdir(outputRoot, { recursive: true, mode: 0o700 });
	await Promise.all([
		writeFile(join(outputRoot, `${stem}.json`), `${JSON.stringify(report, null, 2)}\n`, {
			flag: "wx",
			mode: 0o600,
		}),
		writeFile(join(outputRoot, `${stem}.md`), markdown, { flag: "wx", mode: 0o600 }),
	]);
	return {
		report,
		jsonPath: join(outputRoot, `${stem}.json`),
		markdownPath: join(outputRoot, `${stem}.md`),
	};
}

export function candidateSkillPaths(skills) {
	strings(skills, "skills");
	return skills.map((skill) => resolve("skills", skill));
}

function launchPi({ cwd, model, prompt, timeoutMs, skills = [] }) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(
			"pi",
			[
				"--model",
				model,
				"--mode",
				"text",
				"--print",
				"--no-session",
				"--no-skills",
				...candidateSkillPaths(skills).flatMap((skill) => ["--skill", skill]),
				prompt,
			],
			{ cwd, stdio: ["ignore", "pipe", "pipe"] },
		);
		let stdout = "";
		let stderr = "";
		const timer = setTimeout(() => {
			child.kill("SIGTERM");
			setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
		}, timeoutMs);
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => (stdout += chunk));
		child.stderr.on("data", (chunk) => (stderr += chunk));
		child.once("error", reject);
		child.once("close", (exitCode) => {
			clearTimeout(timer);
			if (exitCode !== 0) reject(new Error(stderr || `Pi exited ${exitCode}`));
			else resolvePromise({ exitCode, stdout, stderr });
		});
	});
}

export async function runCase({
	caseDefinition,
	fixtureRoot,
	outputRoot,
	candidate,
	judge,
	metadata,
}) {
	validateCase(caseDefinition);
	if (!metadata?.candidateModel || !metadata?.judgeModel)
		fail("candidate and judge model metadata are required");
	if (metadata.candidateModel === metadata.judgeModel && !metadata.allowSameModel)
		fail("candidate and judge models must differ");
	const projectRoot = join(outputRoot, ".projects", `${caseDefinition.id}-${randomUUID()}`);
	await copyFixture(fixtureRoot, projectRoot);
	const startedAt = new Date().toISOString(),
		started = Date.now();
	try {
		const before = await snapshotProject(projectRoot);
		const candidateStarted = Date.now();
		const candidateResult = await candidate({
			projectRoot,
			prompt: candidatePrompt(caseDefinition),
			timeoutMs: caseDefinition.budgets.timeoutMs,
			model: metadata.candidateModel,
		});
		const candidateFinished = Date.now();
		const afterCandidate = await snapshotProject(projectRoot);
		const checks = await objectiveChecks(projectRoot, caseDefinition.objectiveChecks);
		const judgeStarted = Date.now();
		const judgeText = await judge({
			projectRoot,
			caseDefinition,
			candidateResult,
			checks,
			timeoutMs: caseDefinition.budgets.judgeTimeoutMs ?? caseDefinition.budgets.timeoutMs,
			model: metadata.judgeModel,
		});
		const judgeFinished = Date.now(),
			afterJudge = await snapshotProject(projectRoot);
		const result = {
			schemaVersion: 1,
			status: "complete",
			case: { id: caseDefinition.id, heldIn: caseDefinition.heldIn },
			metadata,
			startedAt,
			timings: {
				candidateMs: candidateFinished - candidateStarted,
				judgeMs: judgeFinished - judgeStarted,
				totalMs: judgeFinished - started,
			},
			candidate: candidateResult,
			objectiveChecks: checks,
			artifactDiff: artifactDiff(before, afterCandidate),
			postJudgeDiff: artifactDiff(afterCandidate, afterJudge),
			limitations: [
				"Judge and candidate ran in the disposable project; inspect postJudgeDiff for judge-side changes.",
			],
			judgment: parseJudgeJson(judgeText),
		};
		return { result, bundle: await writeBundle(outputRoot, result) };
	} catch (error) {
		const result = {
			schemaVersion: 1,
			status: "failed",
			case: { id: caseDefinition.id, heldIn: caseDefinition.heldIn },
			metadata,
			startedAt,
			timings: { totalMs: Date.now() - started },
			limitations: ["Case failed before a complete candidate and judge record was produced."],
			error: error instanceof Error ? error.message : String(error),
		};
		return { result, bundle: await writeBundle(outputRoot, result) };
	}
}

async function main() {
	const configPath = process.argv[2];
	if (!configPath) fail("usage: node scripts/benchmark.mjs <private-selector-config.json>");
	if (!isAbsolute(configPath) || !relative(process.cwd(), configPath).startsWith(".."))
		fail("selector configuration must be outside the repository");
	let config;
	try {
		config = JSON.parse(await readFile(configPath, "utf8"));
	} catch {
		fail("private selector configuration is unavailable or invalid");
	}
	if (!config.candidate?.model || !config.judge?.model)
		fail("private configuration requires candidate.model and judge.model");
	if (!config.outputRoot || !isAbsolute(config.outputRoot))
		fail("private configuration requires an absolute outputRoot");
	const outputRoot = resolve(config.outputRoot);
	if (!relative(process.cwd(), outputRoot).startsWith(".."))
		fail("outputRoot must be outside the repository");
	const caseIds = config.cases ?? ["CODE-ROUNDING-01", "REVIEW-COMPOUND-01", "PROJECT-RECOVERY-01"];
	if (!Array.isArray(caseIds) || caseIds.some((id) => typeof id !== "string"))
		fail("config.cases must be case IDs");
	const prepared = await Promise.all(
		caseIds.map(async (id) => {
			const definition = validateCase(
				JSON.parse(await readFile(join("benchmarks", "cases", `${id}.json`), "utf8")),
			);
			const fixtureRoot = resolve(definition.fixture);
			await validateFixtureManifest(fixtureRoot);
			await rejectFixtureSymlinks(fixtureRoot);
			return { definition, fixtureRoot };
		}),
	);
	const outcomes = [];
	for (const { definition: caseDefinition, fixtureRoot } of prepared) {
		const outcome = await runCase({
			caseDefinition,
			fixtureRoot,
			outputRoot,
			metadata: {
				candidateModel: config.candidate.model,
				judgeModel: config.judge.model,
				allowSameModel: config.allowSameModel === true,
			},
			candidate: ({ projectRoot, prompt, timeoutMs, model }) =>
				launchPi({ cwd: projectRoot, prompt, timeoutMs, model, skills: caseDefinition.skills }),
			judge: async ({
				projectRoot,
				caseDefinition: definition,
				candidateResult,
				checks,
				timeoutMs,
				model,
			}) => {
				const prompt = `Return only JSON with scores [{criterion, score (0--4), evidenceLocator}] and criticalFailures (strings). Judge this case rubric and artifacts; semantic scores are advisory. ${JSON.stringify({ rubric: definition.rubric, criticalFailures: definition.criticalFailures, candidateResult, checks })}`;
				return (await launchPi({ cwd: projectRoot, prompt, timeoutMs, model })).stdout;
			},
		});
		outcomes.push(outcome.result);
	}
	const report = await writeAggregate(outputRoot, outcomes);
	process.stdout.write(`${JSON.stringify(report)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) main();
