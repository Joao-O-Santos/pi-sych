import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
	aggregate,
	candidatePrompt,
	candidateSkillPaths,
	copyFixture,
	launchPi,
	objectiveChecks,
	parseJudgeJson,
	projectPath,
	runCase,
	sha256,
	validateCase,
	validateFixtureManifest,
	writeAggregate,
} from "../../scripts/benchmark.mjs";

async function fixture(t) {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-benchmark-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "input.txt"), "source");
	await writeFile(
		join(root, "manifest.json"),
		JSON.stringify({
			schemaVersion: 1,
			files: { "input.txt": await sha256(join(root, "input.txt")) },
		}),
	);
	return root;
}

const validCase = {
	schemaVersion: 1,
	id: "TEST-01",
	heldIn: "held-in",
	skills: ["code"],
	fixture: "fixture",
	task: "make REPORT.md",
	expectedArtifacts: ["REPORT.md"],
	objectiveChecks: [{ type: "includes", path: "REPORT.md", value: "done" }],
	rubric: { version: 1 },
	criticalFailures: [],
	budgets: { timeoutMs: 10 },
};

test("the three synthetic held-in cases validate without private material", async () => {
	for (const id of ["CODE-ROUNDING-01", "REVIEW-COMPOUND-01", "PROJECT-RECOVERY-01"]) {
		const definition = JSON.parse(await readFile(`tests/benchmarks/cases/${id}.json`, "utf8"));
		validateCase(definition);
		await validateFixtureManifest(definition.fixture);
		assert.match(candidatePrompt(definition), /public/);
		assert.deepEqual(
			candidateSkillPaths(definition.skills),
			definition.skills.map((skill) => join(process.cwd(), "skills", skill)),
		);
	}
});

test("benchmark cases, paths, and fixture hashes reject malformed or unsafe input", async (t) => {
	assert.equal(validateCase(validCase), validCase);
	assert.throws(() => validateCase({ ...validCase, heldIn: "held-out" }), /held-in/);
	assert.throws(
		() => validateCase({ ...validCase, objectiveChecks: [] }),
		/lacks an objective check/,
	);
	assert.throws(() => projectPath("/project", "../escape"), /leaves project/);
	const root = await fixture(t);
	await validateFixtureManifest(root);
	await writeFile(join(root, "input.txt"), "changed");
	await assert.rejects(validateFixtureManifest(root), /hash mismatch/);
});

test("fixture copying is disposable and rejects unlisted files and symlinks", async (t) => {
	const root = await fixture(t);
	const targetRoot = await mkdtemp(join(tmpdir(), "pi-sych-benchmark-copy-"));
	t.after(() => rm(targetRoot, { recursive: true, force: true }));
	const target = join(targetRoot, "project");
	await copyFixture(root, target);
	assert.equal(await readFile(join(target, "input.txt"), "utf8"), "source");
	const unlisted = await fixture(t);
	await mkdir(join(unlisted, "nested"));
	await writeFile(join(unlisted, "nested/extra.txt"), "extra");
	await assert.rejects(copyFixture(unlisted, join(target, "unlisted")), /manifest files differ/);
	const unsafe = await fixture(t);
	await symlink("input.txt", join(unsafe, "link"));
	await assert.rejects(copyFixture(unsafe, join(target, "unsafe")), /symlink/);
});

function fakePiSpawn() {
	const child = new EventEmitter();
	child.stdout = new PassThrough();
	child.stderr = new PassThrough();
	child.kills = [];
	child.kill = (signal) => {
		child.kills.push(signal);
		return true;
	};
	return { child, spawn: () => child };
}

test("benchmark timeout remains terminal after a graceful zero exit", async (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const fake = fakePiSpawn();
	const launched = launchPi(
		{ cwd: process.cwd(), model: "provider/model", prompt: "test", timeoutMs: 100 },
		fake.spawn,
	);
	t.mock.timers.tick(100);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
	fake.child.emit("close", 0);
	await assert.rejects(launched, /timed out after 100ms/);
	t.mock.timers.tick(5_000);
	assert.deepEqual(fake.child.kills, ["SIGTERM"]);
});

for (const [label, afterTimeout, expected] of [
	["spawn error", false, /spawn failed/],
	["error after timeout", true, /timed out after 100ms/],
]) {
	test(`benchmark ${label} clears timers with the right precedence`, async (t) => {
		t.mock.timers.enable({ apis: ["setTimeout"] });
		const fake = fakePiSpawn();
		const launched = launchPi(
			{ cwd: process.cwd(), model: "provider/model", prompt: "test", timeoutMs: 100 },
			fake.spawn,
		);
		if (afterTimeout) t.mock.timers.tick(100);
		fake.child.emit("error", new Error("spawn failed"));
		await assert.rejects(launched, expected);
		t.mock.timers.tick(5_100);
		assert.deepEqual(fake.child.kills, afterTimeout ? ["SIGTERM"] : []);
	});
}

test("objective checks and judge parsing retain structured evidence", async (t) => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-benchmark-objective-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, "REPORT.md"), "done\n");
	const checks = await objectiveChecks(root, [
		{ type: "exists", path: "REPORT.md" },
		{ type: "equals", path: "REPORT.md", value: "done\n" },
		{ type: "includes", path: "REPORT.md", value: "done" },
		{ type: "exists", path: "missing.md" },
	]);
	assert.deepEqual(
		checks.map((check) => check.pass),
		[true, true, true, false],
	);
	assert.deepEqual(
		parseJudgeJson(
			'{"scores":[{"criterion":"repair","score":4,"evidenceLocator":"REPORT.md:1"}],"criticalFailures":[]}',
		),
		{
			scores: [{ criterion: "repair", score: 4, evidenceLocator: "REPORT.md:1" }],
			criticalFailures: [],
		},
	);
	assert.throws(() => parseJudgeJson("not json"), /not JSON/);
	assert.throws(
		() =>
			parseJudgeJson(
				'{"scores":[{"criterion":"x","score":5,"evidenceLocator":"x"}],"criticalFailures":[]}',
			),
		/0--4/,
	);
});

test("faked launchers enforce model separation, budgets, prompts, immutable bundles, and aggregation", async (t) => {
	const fixtureRoot = await fixture(t);
	const outputRoot = await mkdtemp(join(tmpdir(), "pi-sych-benchmark-output-"));
	t.after(() => rm(outputRoot, { recursive: true, force: true }));
	let candidateSpec;
	const outcome = await runCase({
		caseDefinition: validCase,
		fixtureRoot,
		outputRoot,
		metadata: { candidateModel: "candidate/model", judgeModel: "judge/model" },
		candidate: async (spec) => {
			candidateSpec = spec;
			await writeFile(join(spec.projectRoot, "REPORT.md"), "done");
			return { exitCode: 0 };
		},
		judge: async (spec) => {
			assert.equal(spec.timeoutMs, 10);
			return '{"scores":[{"criterion":"repair","score":3,"evidenceLocator":"REPORT.md:1"}],"criticalFailures":[]}';
		},
	});
	assert.match(candidateSpec.prompt, /public `code` umbrella skill/);
	assert.equal(candidateSpec.timeoutMs, 10);
	const bundleResult = JSON.parse(await readFile(join(outcome.bundle, "result.json"), "utf8"));
	assert.equal(bundleResult.case.id, "TEST-01");
	assert.ok(bundleResult.timings.totalMs >= 0);
	assert.deepEqual(
		bundleResult.artifactDiff.map(({ path }) => path),
		["REPORT.md"],
	);
	assert.deepEqual(bundleResult.postJudgeDiff, []);
	assert.deepEqual(JSON.parse(await readFile(join(outcome.bundle, "manifest.json"), "utf8")), {
		schemaVersion: 1,
		files: ["result.json"],
		createdAt: bundleResult.startedAt,
	});
	assert.deepEqual(aggregate([outcome.result]).report, {
		caseCount: 1,
		completeCount: 1,
		objectivePassed: 1,
		objectiveTotal: 1,
		meanJudgeScore: 3,
		criticalFailures: [],
	});
	const report = await writeAggregate(outputRoot, [outcome.result]);
	assert.match(await readFile(report.markdownPath, "utf8"), /Pi Sych benchmark report/);
	assert.equal(JSON.parse(await readFile(report.jsonPath, "utf8")).caseCount, 1);
	await assert.rejects(
		runCase({
			caseDefinition: validCase,
			fixtureRoot,
			outputRoot,
			metadata: { candidateModel: "same", judgeModel: "same" },
			candidate: async () => ({}),
			judge: async () => "{}",
		}),
		/must differ/,
	);
	const failed = await runCase({
		caseDefinition: validCase,
		fixtureRoot,
		outputRoot,
		metadata: { candidateModel: "same", judgeModel: "same", allowSameModel: true },
		candidate: async () => {
			throw new Error("budget exhausted");
		},
		judge: async () => "{}",
	});
	assert.equal(failed.result.status, "failed");
	assert.match(await readFile(join(failed.bundle, "result.json"), "utf8"), /budget exhausted/);
	assert.match(candidatePrompt(validCase), /Expected artifacts/);
});
