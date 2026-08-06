import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const timeout = 60_000;

async function askModel(prompt, guidance) {
	const input = guidance
		? `Apply the following packaged guidance to the scenario. Treat it as guidance, not evidence or project requirements.\n\n<guidance>\n${guidance}\n</guidance>\n\n<scenario>\n${prompt}\n</scenario>`
		: prompt;
	return new Promise((resolve, reject) => {
		const child = spawn(
			"pi",
			[
				"--model",
				"openai-codex/gpt-5.6-luna",
				"--mode",
				"text",
				"--print",
				"--no-session",
				"--no-tools",
				"--no-extensions",
				"--no-skills",
				"--no-prompt-templates",
				"--no-themes",
				"--no-context-files",
				"--thinking",
				"off",
				input,
			],
			{ stdio: ["ignore", "pipe", "pipe"] },
		);
		let stdout = "";
		let stderr = "";
		const timer = setTimeout(() => child.kill("SIGTERM"), timeout);
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => (stdout += chunk));
		child.stderr.on("data", (chunk) => (stderr += chunk));
		child.once("error", reject);
		child.once("close", (code) => {
			clearTimeout(timer);
			code === 0 ? resolve(stdout) : reject(new Error(stderr || `Pi exited ${code}`));
		});
	});
}

async function loadFixtures() {
	const fixtures = JSON.parse(
		await readFile("tests/fixtures/prompt-quality-fixtures.json", "utf8"),
	);
	const ids = new Set();
	for (const fixture of fixtures) {
		assert.ok(typeof fixture.id === "string" && fixture.id.length > 0, "fixture lacks id");
		assert.equal(ids.has(fixture.id), false, `duplicate fixture ${fixture.id}`);
		ids.add(fixture.id);
		for (const field of ["input", "target", "decisionRule"])
			assert.ok(
				typeof fixture[field] === "string" && fixture[field].trim(),
				`${fixture.id} ${field}`,
			);
		for (const field of ["requiredOutputProperties", "prohibitedOutputProperties"])
			assert.ok(
				Array.isArray(fixture[field]) && fixture[field].length > 0,
				`${fixture.id} ${field}`,
			);
		assert.ok((await stat(fixture.target)).isFile(), `${fixture.id} target is unavailable`);
	}
	return fixtures;
}

test("opt-in nondeterministic live-model evaluation for prompt-quality fixtures", {
	skip:
		process.env.PI_SYCH_USAGE_TEST === "1"
			? false
			: "set PI_SYCH_USAGE_TEST=1 to run the live-model behavioral evaluation",
}, async () => {
	const fixtures = await loadFixtures();
	const responses = [];
	for (const fixture of fixtures)
		responses.push(await askModel(fixture.input, await readFile(fixture.target, "utf8")));
	for (const [index, fixture] of fixtures.entries()) {
		const judgment = await askModel(
			`Judge this response against the scenario and decision rule as a second model pass. A required property must be materially present and a prohibited property materially absent. Do not infer compliance from the guidance. Reply exactly PASS if it complies; otherwise reply FAIL: followed by one short reason.\n\n${JSON.stringify({ ...fixture, response: responses[index] })}`,
		);
		assert.match(
			judgment.trim(),
			/^PASS\b/,
			`${fixture.id} (${fixture.target})\nresponse: ${responses[index]}\njudgment: ${judgment}`,
		);
	}
});
