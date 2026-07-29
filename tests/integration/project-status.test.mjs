import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { fingerprintFile } from "../../.test-build/workbench/src/sync.js";

function invokeCommand(cwd, agentDir, command, args = "") {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("pi", [
      "--mode", "rpc", "--no-session", "--no-extensions", "--extension", resolve("extensions/workbench/index.ts"),
      "--no-skills", "--no-prompt-templates", "--no-themes", "--no-context-files",
    ], { cwd, env: { ...process.env, PI_OFFLINE: "1", PI_CODING_AGENT_DIR: agentDir }, stdio: ["pipe", "pipe", "pipe"] });
    let buffer = "";
    let stderr = "";
    const timeout = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`status timed out: ${stderr}`)); }, 15000);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      while (buffer.includes("\n")) {
        const newline = buffer.indexOf("\n");
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const event = JSON.parse(line);
        if (event.type === "extension_ui_request" && event.method === "notify") {
          clearTimeout(timeout);
          child.kill("SIGTERM");
          resolvePromise({ event, stderr });
          return;
        }
      }
    });
    child.once("error", reject);
    child.stdin.write(`${JSON.stringify({ type: "prompt", message: `/${command}${args ? ` ${args}` : ""}` })}\n`);
  });
}

test("status command explains canonical synchronization state", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-status-"));
  const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-agent-"));
  const project = "# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n";
  await writeFile(join(root, "PROJECT.md"), project);
  const fingerprint = await fingerprintFile(join(root, "PROJECT.md"));
  await writeFile(join(root, "SYNC.md"), `# Project synchronization\n\n\`\`\`json\n${JSON.stringify({ version: 1, confirmedAt: "2026-07-28T12:00:00Z", artifacts: [{ path: "PROJECT.md", role: "project", status: "current", authoritativeFor: ["objective"], fingerprint }] }, null, 2)}\n\`\`\`\n`);

  const { event, stderr } = await invokeCommand(root, agentDir, "pi-sych-status");
  assert.equal(stderr, "");
  assert.match(event.message, /pi-sych 0\.1\.1/);
  assert.match(event.message, /Current:\n- PROJECT\.md — objective/);
  assert.match(event.message, /no synchronization review is required/);
});

test("init and sync commands present candidates without durable propagation", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-sych-candidate-command-"));
  const agentDir = await mkdtemp(join(tmpdir(), "pi-sych-agent-"));
  await writeFile(join(root, "PROJECT.md"), "# Project\n\n## Objective\nX\n## Current direction\nY\n## Definition of done\nZ\n");

  const init = await invokeCommand(root, agentDir, "pi-sych-init");
  assert.equal(init.stderr, "");
  assert.match(init.event.message, /What is the immediate objective/);
  assert.match(init.event.message, /Proposed files \(not written\)/);

  const sync = await invokeCommand(root, agentDir, "pi-sych-sync");
  assert.equal(sync.stderr, "");
  assert.match(sync.event.message, /Synchronization manifest candidate/);
  await assert.rejects(readFile(join(root, "SYNC.md")), /ENOENT/);

  const drift = await invokeCommand(root, agentDir, "pi-sych-drift");
  assert.equal(drift.stderr, "");
  assert.match(drift.event.message, /sync-manifest/);
  assert.match(drift.event.message, /No file was changed/);
  await assert.rejects(readFile(join(root, "SYNC.md")), /ENOENT/);

  await writeFile(join(root, "draft.md"), "# Existing draft\n\n## Results\n\nObserved text.\n");
  const artifact = await invokeCommand(root, agentDir, "pi-sych-init", "draft.md");
  assert.equal(artifact.stderr, "");
  assert.match(artifact.event.message, /Canonical-state candidate from draft\.md/);
  assert.match(artifact.event.message, /Inferred:/);

  const retro = await invokeCommand(root, agentDir, "pi-sych-retro", JSON.stringify({ objective: "Check the manuscript candidate", outcome: "partial", observations: ["Candidate was presented."], verified: ["RPC command returned."], limitations: ["No durable write was approved."], proposedChanges: ["Review the candidate."] }));
  assert.equal(retro.stderr, "");
  assert.match(retro.event.message, /Proposed retrospective/);
  assert.match(retro.event.message, /No durable write was approved/);
});
