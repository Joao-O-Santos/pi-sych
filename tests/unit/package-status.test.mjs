import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	configuredSupervisorInstructions,
	formatDispatchWorkerOutcome,
	SUPERVISOR_GUIDANCE,
} from "../../.test-build/workbench/index.js";

test("public surface omits plan review and retains human commands", async () => {
	const source = await readFile("extensions/workbench/index.ts", "utf8");
	assert.match(source, /name: "dispatch_worker"/);
	assert.match(source, /name: "project_status"/);
	assert.doesNotMatch(source, /submit_plan/);
	for (const command of ["plannotator-last", "plannotator-annotate", "plannotator-review"])
		assert.ok(source.includes(`registerCommand("${command}"`));
	assert.doesNotMatch(SUPERVISOR_GUIDANCE, /submit_plan/);
});
test("configured project instructions are available to the supervisor without a model catalog", async () => {
	const root = await mkdtemp(join(tmpdir(), "pi-sych-supervisor-"));
	await writeFile(join(root, "AGENTS.md"), "Prefer direct evidence.\n");
	const instructions = await configuredSupervisorInstructions(root);
	assert.match(instructions ?? "", /Prefer direct evidence/);
	assert.equal(await configuredSupervisorInstructions(root, "Prefer direct evidence."), undefined);
});
test("worker output is reduced to result essentials", () => {
	const text = formatDispatchWorkerOutcome({
		id: "x",
		model: "m",
		timeoutMs: 1,
		launch: { exitCode: 0, stderr: "" },
		result: { status: "complete", summary: "done", files: ["A.md"], limitations: [] },
	});
	assert.match(text, /Files:\n- A.md/);
	assert.doesNotMatch(text, /Result package|Artifacts/);
});
