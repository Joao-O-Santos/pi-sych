import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const timeout = 60_000;

async function askModel(prompt, skill) {
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
				...(skill ? ["--skill", skill] : []),
				prompt,
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

test("live model behavioral smoke test for prompt-quality fixtures", {
	skip:
		process.env.PI_SYCH_USAGE_TEST === "1"
			? false
			: "set PI_SYCH_USAGE_TEST=1 to run live-model prompt-quality acceptance",
}, async () => {
	const fixtures = JSON.parse(
		await readFile("tests/fixtures/prompt-quality-fixtures.json", "utf8"),
	);
	const responses = [];
	for (const fixture of fixtures) responses.push(await askModel(fixture.input, fixture.target));
	for (const [index, fixture] of fixtures.entries()) {
		const judgment = await askModel(
			`Judge this response against the scenario and decision rule as a second model pass. A required property must be materially present and a prohibited property materially absent. Do not infer compliance from the guidance. Reply exactly PASS if it complies; otherwise reply FAIL: followed by one short reason.\n\n${JSON.stringify({ ...fixture, response: responses[index] })}`,
		);
		assert.match(judgment.trim(), /^PASS\b/, `${fixture.temptation}: ${judgment}`);
	}
});
