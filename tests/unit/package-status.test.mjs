import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import piSychWorkbench, { ApprovalLedger, SUPERVISOR_GUIDANCE, formatPackageStatus, getPackageStatus } from "../../.test-build/workbench/index.js";
import packageJson from "../../package.json" with { type: "json" };

test("package status reports manifest identity and package root", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-package-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "example", version: "2.3.4" }));
  assert.deepEqual(getPackageStatus(root), { name: "example", version: "2.3.4", packageRoot: root });
  assert.equal(formatPackageStatus(getPackageStatus(root)), `example 2.3.4\npackage: ${root}`);
});

test("supervisor guidance makes dispatch, complete worker context, synchronization, and direct Plannotator review defaults", () => {
  assert.match(SUPERVISOR_GUIDANCE, /pi_sych_dispatch proactively/);
  assert.match(SUPERVISOR_GUIDANCE, /smallest complete packet/);
  assert.match(SUPERVISOR_GUIDANCE, /which dependents need review/);
  assert.match(SUPERVISOR_GUIDANCE, /submit_plan/);
  const approvals = new ApprovalLedger();
  approvals.record("/project-a/PLAN.md", true, "approved content");
  assert.equal(approvals.consume("/project-a/PLAN.md", "changed content"), false);
  assert.equal(approvals.consume("/project-b/PLAN.md", "approved content"), false);
  approvals.record("/project-a/PLAN.md", false, "approved content");
  assert.equal(approvals.consume("/project-a/PLAN.md", "approved content"), false);
  approvals.record("/project-a/PLAN.md", true, "approved content");
  assert.equal(approvals.consume("/project-a/PLAN.md", "approved content"), true);
  assert.equal(approvals.consume("/project-a/PLAN.md", "approved content"), false);
});

test("supervisor exposes only its direct plan-review tool and annotation command", () => {
  const tools = [];
  const commands = [];
  piSychWorkbench({ on() {}, registerTool(tool) { tools.push(tool); }, registerCommand(name) { commands.push(name); }, events: { emit() {} } });
  assert.equal(tools.some((tool) => tool.name === "submit_plan"), true);
  assert.equal(tools.some((tool) => tool.name === "pi_sych_enter_planning"), false);
  assert.equal(tools.some((tool) => tool.name === "pi_sych_request_plan_review"), false);
  assert.deepEqual(commands.filter((name) => name.startsWith("plannotator-")).sort(), ["plannotator-annotate", "plannotator-last"]);
});

test("public package manifest loads only the supervisor extension", () => {
  assert.equal(packageJson.name, "pi-sych");
  assert.equal(packageJson.private, undefined);
  assert.equal(packageJson.repository.url, "git+https://gitlab.com/Joao-O-Santos/pi-sych.git");
  assert.deepEqual(packageJson.pi.extensions, ["./extensions/workbench/index.ts"]);
});

test("package status rejects incomplete metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-package-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "example" }));
  assert.throws(() => getPackageStatus(root), /string name and version/);
});
