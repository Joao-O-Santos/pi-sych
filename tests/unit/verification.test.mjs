import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  runVerification,
  runVerificationContract,
  validateVerificationCommand,
} from "../../.test-build/workbench/src/verification.js";

test("verification executes exact argument arrays and records actual failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-verify-"));
  const passed = await runVerification({ executable: process.execPath, args: ["-e", "console.log('checked')"], expectedExitCode: 0 }, root);
  assert.equal(passed.passed, true);
  assert.equal(passed.exitCode, 0);
  assert.match(passed.stdoutTail, /checked/);
  assert.ok(Date.parse(passed.startedAt));
  assert.ok(Date.parse(passed.endedAt));

  const failed = await runVerification({ executable: process.execPath, args: ["-e", "console.error('actual failure'); process.exit(3)"], expectedExitCode: 0 }, root);
  assert.equal(failed.passed, false);
  assert.equal(failed.exitCode, 3);
  assert.match(failed.stderrTail, /actual failure/);
  assert.equal(validateVerificationCommand({ executable: "echo", args: [] }).expectedExitCode, 0);
  await assert.rejects(async () => runVerification({ executable: "echo", args: "bad" }, root), /args must be an array/);
});

test("verification contracts keep commands separate and retain all observed reports", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-contract-"));
  const reports = await runVerificationContract([
    { executable: process.execPath, args: ["-e", "process.exit(0)"] },
    { executable: process.execPath, args: ["-e", "process.exit(2)"], expectedExitCode: 2 },
  ], root);
  assert.deepEqual(reports.map((report) => report.passed), [true, true]);
  assert.deepEqual(reports.map((report) => report.exitCode), [0, 2]);
});
